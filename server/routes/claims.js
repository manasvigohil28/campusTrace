const express = require("express");
const Claim = require("../models/Claim");
const LostItem = require("../models/LostItem");
const FoundItem = require("../models/FoundItem");
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

    // Check if user has already claimed this item
    const existingClaim = await Claim.findOne({ itemId, claimantId: req.user.id });
    if (existingClaim) {
      return res.status(400).json({ message: "You have already submitted a claim for this item." });
    }

    const newClaim = new Claim({
      itemId,
      itemType,
      claimantId: req.user.id,
      finderId: ownerOrFinderId, // The recipient of the claim
      claimantVerificationData,
      status: "pending",
    });

    const claim = await newClaim.save();
    
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
// @desc    Get submitted and received claims for logged in user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    // Submitted claims
    const submitted = await Claim.find({ claimantId: req.user.id })
      .populate("itemId")
      .populate("finderId", "name email")
      .sort({ createdAt: -1 });

    // Received claims (claims made by other users on items reported by current user)
    const received = await Claim.find({ finderId: req.user.id })
      .populate("itemId")
      .populate("claimantId", "name email")
      .sort({ createdAt: -1 });

    res.json({ submitted, received });
  } catch (err) {
    console.error("Get claims error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/claims/:id
// @desc    Update claim status (Approve or Reject)
// @access  Private
router.put("/:id", auth, async (req, res) => {
  const { status } = req.body; // "approved" or "rejected"

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid claim status." });
  }

  try {
    const claim = await Claim.findById(req.params.id).populate("itemId");
    if (!claim) {
      return res.status(404).json({ message: "Claim not found." });
    }

    // Verify authorized user (must be finder/owner of the item, or admin)
    if (claim.finderId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "User not authorized to update this claim." });
    }

    claim.status = status;
    await claim.save();

    // If approved, update the item's status to "claimed"
    const itemTitle = claim.itemId ? claim.itemId.title : "an item you claimed";
    if (status === "approved") {
      if (claim.itemType === "LostItem") {
        await LostItem.findByIdAndUpdate(claim.itemId._id || claim.itemId, { status: "claimed" });
      } else {
        await FoundItem.findByIdAndUpdate(claim.itemId._id || claim.itemId, { status: "claimed" });
      }
    }

    // Create notification for the claimant
    try {
      await Notification.create({
        userId: claim.claimantId,
        message: `Your claim request for "${itemTitle}" was ${status}!`,
        type: status === "approved" ? "claim_approved" : "claim_rejected",
        relatedItemId: claim.itemId._id || claim.itemId,
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
