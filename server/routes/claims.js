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
      verificationData: {
        color: item.verificationData ? item.verificationData.color : "",
        brand: item.verificationData ? item.verificationData.brand : "",
        contents: item.verificationData ? (item.verificationData.contents || []) : [],
        specialMarks: item.verificationData ? item.verificationData.specialMarks : "",
        freeTextDescription: item.verificationData ? item.verificationData.freeTextDescription : "",
      },
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

    // Create the Claim
    const newClaim = new Claim({
      itemId,
      itemType,
      claimantId: req.user.id,
      finderId: ownerOrFinderId,
      claimantVerificationData,
      status: "pending",
      itemSnapshot,
      verificationResult: {
        score: 75,
        colorScore: 25,
        contentsScore: 25,
        locationScore: 25,
        semanticScore: 0
      }
    });

    const claim = await newClaim.save();
    
    // Set item status to under_review
    item.status = "under_review";
    await item.save();

    // Create notification for the item owner/finder
    try {
      await Notification.create({
        userId: ownerOrFinderId,
        message: `Someone submitted a claim for your reported item: "${item.title}".`,
        type: "claim_received",
        relatedItemId: itemId,
        itemType,
        relatedClaimId: claim._id
      });
    } catch (notificationErr) {
      console.error("Failed to create claim notification:", notificationErr);
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
