const express = require("express");
const Claim = require("../models/Claim");
const LostItem = require("../models/LostItem");
const FoundItem = require("../models/FoundItem");
const ClaimAttempt = require("../models/ClaimAttempt");
const AuditLog = require("../models/AuditLog");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { auth } = require("../middleware/auth");

const CATEGORY_FIELDS = {
  "Electronics": ["brand", "model", "color", "serial"],
  "Wallets & Money": ["color", "material", "cards", "cash"],
  "Stationery": ["color", "brand", "contents", "specialMarks"],
  "Bags": ["color", "brand", "contents", "size"],
  "Keys": ["keychain", "count", "specialMarks"],
  "ID & Documents": ["documentName", "documentNumber", "issuingInstitution"],
  "Clothing": ["color", "brand", "size", "specialMarks"],
  "Jewelry & Accessories": ["type", "color", "specialMarks"],
  "Books": ["title", "author", "specialMarks"],
  "Water Bottles & Containers": ["color", "brand", "specialMarks"],
  "Sports Equipment": ["sportType", "brand", "color"],
  "Vehicles": ["color", "brand", "specialMarks"],
  "Medical Items": ["type", "color", "brand"],
  "Toys & Games": ["gameName", "color", "specialMarks"],
  "Miscellaneous": ["color", "brand", "specialMarks"]
};

function buildText(data, category, subcategory) {
  let text = `Category: ${category}\nSubcategory: ${subcategory}`;
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      if (["hideVerification", "enableAIVerification", "locationGuess"].includes(key)) continue;
      const displayVal = Array.isArray(value) ? value.join(", ") : String(value || "");
      text += `\n${key}: ${displayVal}`;
    }
  }
  return text;
}

function getMatchedTerms(finderData, claimantData) {
  const stopWords = new Set(["a", "an", "the", "and", "or", "but", "is", "are", "was", "were", "in", "on", "at", "to", "for", "with", "of", "about", "by", "from", "that", "this", "these", "those"]);
  
  const getWords = (obj) => {
    if (!obj) return [];
    let text = "";
    for (const [key, val] of Object.entries(obj)) {
      if (["hideVerification", "enableAIVerification", "locationGuess"].includes(key)) continue;
      text += " " + (Array.isArray(val) ? val.join(" ") : String(val || ""));
    }
    return text.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
  };

  const finderWords = new Set(getWords(finderData));
  const claimantWords = getWords(claimantData);
  
  const matched = claimantWords.filter(w => finderWords.has(w));
  return Array.from(new Set(matched));
}

const getFieldScore = (finderVal, claimantVal, maxScore) => {
  const f = String(finderVal || "").toLowerCase().trim();
  const c = String(claimantVal || "").toLowerCase().trim();
  
  if (!f || !c) return 0;
  if (f === c) return maxScore;
  
  // Check partial sharing
  const fWords = f.split(/\s+/).filter(w => w.length > 2);
  const cWords = c.split(/\s+/).filter(w => w.length > 2);
  const sharesWord = fWords.some(fw => c.includes(fw)) || cWords.some(cw => f.includes(cw));
  
  if (sharesWord || f.includes(c) || c.includes(f)) {
    return maxScore * 0.5;
  }
  
  return 0;
};

const router = express.Router();

// @route   POST api/claims
// @desc    Submit a claim request
// @access  Private
router.post("/", auth, async (req, res) => {
  const { itemId, itemType, finderId, claimantVerificationData } = req.body;

  try {
    // Validate claimantVerificationData exists
    if (!claimantVerificationData) {
      return res.status(400).json({ message: "Verification answers are required to claim this item." });
    }

    // Validate item exists
    let item;
    if (itemType === "LostItem") {
      item = await LostItem.findById(itemId);
    } else if (itemType === "FoundItem") {
      item = await FoundItem.findById(itemId);
    } else {
      return res.status(400).json({ message: "Invalid item type." });
    }

    if (!item) {
      return res.status(404).json({ message: "Item not found." });
    }

    // Check if user is claiming their own reported item
    const ownerOrFinderId = itemType === "LostItem" ? item.ownerId : item.finderId;
    if (ownerOrFinderId.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot claim your own reported item." });
    }

    // Check claim attempt history (throttling and cooldowns)
    const attemptsCount = await ClaimAttempt.countDocuments({ userId: req.user.id, itemId: itemId });
    if (attemptsCount >= 3) {
      return res.status(400).json({ message: "You have reached the maximum claim attempts (3) for this item." });
    }

    const lastAttempt = await ClaimAttempt.findOne({ userId: req.user.id, itemId: itemId }).sort({ timestamp: -1 });
    if (lastAttempt) {
      const msSinceLast = Date.now() - new Date(lastAttempt.timestamp).getTime();
      const cooldownMs = 24 * 60 * 60 * 1000;
      if (msSinceLast < cooldownMs) {
        const remainingMs = cooldownMs - msSinceLast;
        const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
        return res.status(400).json({ message: `Claim submission cooldown active. You can try again in ${remainingHours} hours.` });
      }
    }

    // Check if user already has a pending active claim for this item
    const existingClaim = await Claim.findOne({ itemId, claimantId: req.user.id, status: "pending", isDeleted: { $ne: true } });
    if (existingClaim) {
      return res.status(400).json({ message: "You already have a pending claim for this item." });
    }

    // Capture structured item snapshot
    const itemSnapshot = {
      title: item.title,
      category: item.category,
      subcategory: item.subcategory,
      location: {
        public: item.location ? item.location.public : "",
        private: item.location ? item.location.private : ""
      },
      verificationData: item.verificationData ? (typeof item.verificationData.toObject === "function" ? item.verificationData.toObject() : item.verificationData) : {},
      createdAt: item.createdAt
    };

    // Save ClaimAttempt log
    const attempt = new ClaimAttempt({
      userId: req.user.id,
      itemId: itemId,
      itemType: itemType,
      result: "pending"
    });
    await attempt.save();

    const category = itemSnapshot.category;
    const fields = CATEGORY_FIELDS[category] || [];

    let earnedPoints = 0;
    let possiblePoints = 0;

    // 1. Color Match (Max 20)
    let colorScore = 0;
    const hasColor = fields.includes("color");
    if (hasColor) {
      const fColor = itemSnapshot.verificationData.color;
      const cColor = claimantVerificationData.color;
      colorScore = getFieldScore(fColor, cColor, 20);
      earnedPoints += colorScore;
      possiblePoints += 20;
    }

    // 2. Brand Match (Max 10)
    let brandScore = 0;
    const hasBrand = fields.includes("brand");
    if (hasBrand) {
      const fBrand = itemSnapshot.verificationData.brand;
      const cBrand = claimantVerificationData.brand;
      brandScore = getFieldScore(fBrand, cBrand, 10);
      earnedPoints += brandScore;
      possiblePoints += 10;
    }


    // 3. Contents Match (Max 20)
    let contentsScore = 0;
    const hasContents = fields.includes("contents") || fields.includes("cards");
    if (hasContents) {
      const finderKey = fields.includes("contents") ? "contents" : "cards";
      const rawFinderContents = itemSnapshot.verificationData[finderKey];
      const fContents = Array.isArray(rawFinderContents) 
        ? rawFinderContents.join(" ") 
        : rawFinderContents;
      
      const claimantKey = fields.includes("contents") ? "contents" : "cards";
      const cContents = claimantVerificationData[claimantKey];
      contentsScore = getFieldScore(fContents, cContents, 20);
      earnedPoints += contentsScore;
      possiblePoints += 20;
    }

    // 4. Location Match (Max 20)
    let locationScore = 0;
    const locationGuess = claimantVerificationData.locationGuess;
    const hasLocationGuess = typeof locationGuess === "string" && locationGuess.trim().length > 0;
    if (hasLocationGuess) {
      const fLocation = itemSnapshot.location.public;
      locationScore = getFieldScore(fLocation, locationGuess, 20);
      earnedPoints += locationScore;
      possiblePoints += 20;
    }

    // 5. Semantic Similarity (Max 30) - FastAPI integration
    let semanticSimilarity = null;
    let semanticScore = null;
    let aiAvailable = false;
    let aiMetadata = null;

    const finderText = buildText(itemSnapshot.verificationData, itemSnapshot.category, itemSnapshot.subcategory);
    const claimantText = buildText(claimantVerificationData, itemSnapshot.category, itemSnapshot.subcategory);
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const aiResponse = await fetch(`${aiServiceUrl}/similarity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finderText, claimantText }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const similarity = typeof aiData.similarity === "number" ? aiData.similarity : 0.0;
        
        semanticSimilarity = Math.round(similarity * 100) / 100;
        semanticScore = Math.round(similarity * 30 * 100) / 100;
        aiAvailable = true;
        aiMetadata = {
          similarity: similarity,
          model: "all-MiniLM-L6-v2",
          timestamp: new Date()
        };

        earnedPoints += semanticScore;
        possiblePoints += 30;
      } else {
        console.warn("AI Service returned non-ok status:", aiResponse.status);
      }
    } catch (aiErr) {
      clearTimeout(timeoutId);
      console.warn("AI Service offline or request timed out:", aiErr.message);
    }

    // Dynamic Normalization
    let score = possiblePoints > 0 ? (earnedPoints / possiblePoints) * 100 : 0;
    score = Math.round(score * 100) / 100;

    // Confidence tiering
    let confidence = "LOW";
    if (score >= 80) {
      confidence = "HIGH";
    } else if (score >= 60) {
      confidence = "MEDIUM";
    }

    // Auto-Reject safety threshold
    let status = "pending";
    if (aiAvailable && score < 60) {
      status = "rejected";
    }

    // Matched terms helper purely for dashboard visualization (no score impact)
    const matchedTerms = getMatchedTerms(itemSnapshot.verificationData, claimantVerificationData);

    const verificationResult = {
      score,
      earnedPoints: Math.round(earnedPoints * 100) / 100,
      possiblePoints: Math.round(possiblePoints * 100) / 100,
      colorScore,
      brandScore,
      contentsScore,
      locationScore,
      semanticScore,
      semanticSimilarity,
      confidence,
      aiAvailable,
      aiModel: "all-MiniLM-L6-v2",
      aiVersion: "1.0",
      aiMetadata,
      matchedTerms,
      reviewedByHuman: false
    };

    // Create the Claim
    const newClaim = new Claim({
      itemId,
      itemType,
      claimantId: req.user.id,
      finderId: ownerOrFinderId,
      claimantVerificationData,
      status,
      itemSnapshot,
      verificationResult
    });

    const claim = await newClaim.save();

    if (status === "rejected") {
      // Rejection flow
      // Set item back to active
      item.status = "active";
      await item.save();

      // Update claim attempt record
      await ClaimAttempt.findOneAndUpdate(
        { userId: req.user.id, itemId: itemId, result: "pending" },
        { result: "rejected" },
        { sort: { timestamp: -1 } }
      );

      // Increment failed claims count on user
      await User.findByIdAndUpdate(req.user.id, { $inc: { "fraudFlags.failedClaims": 1 } });

      // Create AuditLog entry
      const audit = new AuditLog({
        action: "CLAIM_REJECTED",
        performedBy: req.user.id,
        target: claim._id,
        targetType: "Claim"
      });
      await audit.save();

      // Send rejection notification
      try {
        await Notification.create({
          userId: req.user.id,
          message: `Your claim request for "${item.title}" was auto-rejected by the AI verification system.`,
          type: "claim_rejected",
          relatedItemId: itemId,
          itemType,
          relatedClaimId: claim._id
        });
      } catch (notificationErr) {
        console.error("Failed to create rejection notification:", notificationErr);
      }
    } else {
      // Pending review flow (standard)
      // Set item status to under_review
      item.status = "under_review";
      await item.save();

      // Create notification for the item owner/finder
      try {
        await Notification.create({
          userId: ownerOrFinderId,
          message: `Someone submitted a claim for your reported item: "${item.title}". Confidence score: ${confidence}.`,
          type: "claim_received",
          relatedItemId: itemId,
          itemType,
          relatedClaimId: claim._id
        });
      } catch (notificationErr) {
        console.error("Failed to create claim notification:", notificationErr);
      }
    }

    res.status(201).json(claim);
  } catch (err) {
    console.error("Create claim error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/claims
// @desc    Get submitted and received claims for logged in user (Secure - no emails)
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    // Submitted claims
    const rawSubmitted = await Claim.find({ claimantId: req.user.id, isDeleted: { $ne: true } })
      .populate("itemId")
      .populate("finderId", "name")
      .sort({ createdAt: -1 });

    const submitted = [];
    for (const claim of rawSubmitted) {
      const claimObj = claim.toObject();
      if (claim.status === "approved" && claim.itemId) {
        const conv = await Conversation.findOne({
          itemId: claim.itemId._id || claim.itemId,
          participants: { $all: [claim.claimantId, claim.finderId] }
        });
        if (conv) {
          claimObj.conversationId = conv._id;
        }
      }
      submitted.push(claimObj);
    }

    // Received claims
    const rawReceived = await Claim.find({ finderId: req.user.id, isDeleted: { $ne: true } })
      .populate("itemId")
      .populate("claimantId", "name")
      .sort({ createdAt: -1 });

    const received = [];
    for (const claim of rawReceived) {
      const claimObj = claim.toObject();
      if (claim.status === "approved" && claim.itemId) {
        const conv = await Conversation.findOne({
          itemId: claim.itemId._id || claim.itemId,
          participants: { $all: [claim.claimantId, claim.finderId] }
        });
        if (conv) {
          claimObj.conversationId = conv._id;
        }
      }
      received.push(claimObj);
    }

    res.json({ submitted, received });
  } catch (err) {
    console.error("Get claims error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/claims/:id
// @desc    Update claim status (Approve/Match or Reject)
// @access  Private
router.put("/:id", auth, async (req, res) => {
  const { status, notes } = req.body; // status: "approved" or "rejected"

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid claim status." });
  }

  try {
    const claim = await Claim.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!claim) {
      return res.status(404).json({ message: "Claim not found." });
    }

    // Verify authorized user (must be finder/owner of the item, or admin)
    if (claim.finderId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "User not authorized to update this claim." });
    }

    // Save moderation notes
    claim.status = status;
    claim.moderation = {
      notes: notes || "",
      reviewedBy: req.user.id,
      reviewedAt: new Date()
    };
    if (claim.verificationResult) {
      claim.verificationResult.reviewedByHuman = true;
    }
    await claim.save();

    const ItemModel = claim.itemType === "LostItem" ? LostItem : FoundItem;
    const item = await ItemModel.findById(claim.itemId);

    if (status === "approved") {
      // Set status to matched
      if (item) {
        item.status = "matched";
        await item.save();
      }

      // Update claim attempt record
      await ClaimAttempt.findOneAndUpdate(
        { userId: claim.claimantId, itemId: claim.itemId, result: "pending" },
        { result: "approved" },
        { sort: { timestamp: -1 } }
      );

      // Automatically generate a Conversation for secure chat
      const existingConv = await Conversation.findOne({
        itemId: claim.itemId,
        participants: { $all: [claim.claimantId, claim.finderId] }
      });
      if (!existingConv) {
        const conv = new Conversation({
          itemId: claim.itemId,
          itemType: claim.itemType,
          participants: [claim.claimantId, claim.finderId]
        });
        await conv.save();
      }
    } else {
      // Rejected - set status back to active so other claims can proceed
      if (item) {
        item.status = "active";
        await item.save();
      }

      // Update claim attempt record
      await ClaimAttempt.findOneAndUpdate(
        { userId: claim.claimantId, itemId: claim.itemId, result: "pending" },
        { result: "rejected" },
        { sort: { timestamp: -1 } }
      );

      // Update claimant fraudFlags (increment failedClaims)
      await User.findByIdAndUpdate(claim.claimantId, { $inc: { "fraudFlags.failedClaims": 1 } });
      
      // If notes indicate deceit/fraud, increment suspiciousClaims
      const isSuspicious = notes && /suspicious|fraud|fake|lie|cheat/i.test(notes);
      if (isSuspicious) {
        await User.findByIdAndUpdate(claim.claimantId, { $inc: { "fraudFlags.suspiciousClaims": 1 } });
      }
    }

    // Create AuditLog entry
    const audit = new AuditLog({
      action: status === "approved" ? "CLAIM_APPROVED" : "CLAIM_REJECTED",
      performedBy: req.user.id,
      target: claim._id,
      targetType: "Claim"
    });
    await audit.save();

    // Create notification for the claimant
    try {
      const itemTitle = item ? item.title : "an item you claimed";
      await Notification.create({
        userId: claim.claimantId,
        message: `Your claim request for "${itemTitle}" was ${status === "approved" ? "approved" : "rejected"}!`,
        type: status === "approved" ? "claim_approved" : "claim_rejected",
        relatedItemId: claim.itemId,
        itemType: claim.itemType,
        relatedClaimId: claim._id
      });
    } catch (notificationErr) {
      console.error("Failed to create claim status update notification:", notificationErr);
    }

    res.json(claim);
  } catch (err) {
    console.error("Update claim status error:", err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
