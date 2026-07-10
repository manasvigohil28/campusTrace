const express = require("express");
const mongoose = require("mongoose");
const PossibleMatch = require("../models/PossibleMatch");
const LostItem = require("../models/LostItem");
const FoundItem = require("../models/FoundItem");
const { auth } = require("../middleware/auth");

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Authorization helper
// A user can interact with a match only if they own the lost item
// OR they are the finder of the found item.
// ─────────────────────────────────────────────────────────────────────────────
async function canAccessMatch(match, userId) {
  try {
    const lost  = await LostItem.findById(match.lostItemId).select("ownerId");
    const found = await FoundItem.findById(match.foundItemId).select("finderId");
    if (!lost || !found) return false;
    return (
      (lost.ownerId  && lost.ownerId.toString()  === userId) ||
      (found.finderId && found.finderId.toString() === userId)
    );
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/matches
// @desc    Get all AI matches for the current user (as owner or finder)
//          Excludes EXPIRED and DISMISSED by default.
//          Sorted by overallScore DESC.
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all lost items owned by user AND found items found by user
    const [userLostItems, userFoundItems] = await Promise.all([
      LostItem.find({ ownerId: userId, isDeleted: { $ne: true } }).select("_id"),
      FoundItem.find({ finderId: userId, isDeleted: { $ne: true } }).select("_id"),
    ]);

    const lostIds  = userLostItems.map(i => i._id);
    const foundIds = userFoundItems.map(i => i._id);

    const { includeExpired, includeDismissed } = req.query;
    const excludeStatuses = [];
    if (!includeExpired)  excludeStatuses.push("EXPIRED");
    if (!includeDismissed) excludeStatuses.push("DISMISSED");

    const matches = await PossibleMatch.find({
      $or: [
        { lostItemId:  { $in: lostIds  } },
        { foundItemId: { $in: foundIds } },
      ],
      ...(excludeStatuses.length > 0 ? { status: { $nin: excludeStatuses } } : {}),
    })
      .sort({ overallScore: -1 })
      .populate("lostItemId",  "title category subcategory location dateLost  publicImages status ownerId")
      .populate("foundItemId", "title category subcategory location dateFound publicImages status finderId");

    res.json(matches);
  } catch (err) {
    console.error("Get matches error:", err.message);
    res.status(500).send("Server error");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/matches/:id
// @desc    Get detailed comparison view for a single match
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid match ID." });
    }

    const match = await PossibleMatch.findById(req.params.id)
      .populate({
        path: "lostItemId",
        select: "title category subcategory visibleDescription location dateLost publicImages verificationData ownerId matchingStatus",
        populate: { path: "ownerId", select: "name" },
      })
      .populate({
        path: "foundItemId",
        select: "title category subcategory visibleDescription location dateFound publicImages verificationData finderId matchingStatus",
        populate: { path: "finderId", select: "name" },
      });

    if (!match) {
      return res.status(404).json({ message: "Match not found." });
    }

    const allowed = await canAccessMatch(match, req.user.id);
    if (!allowed) {
      return res.status(403).json({ message: "Not authorized to view this match." });
    }

    res.json(match);
  } catch (err) {
    console.error("Get match detail error:", err.message);
    res.status(500).send("Server error");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/matches/:id/viewed
// @desc    Mark a match as VIEWED (called when user opens Review Match page)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.put("/:id/viewed", auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid match ID." });
    }

    const match = await PossibleMatch.findById(req.params.id);
    if (!match) return res.status(404).json({ message: "Match not found." });

    const allowed = await canAccessMatch(match, req.user.id);
    if (!allowed) return res.status(403).json({ message: "Not authorized." });

    // Only advance from POSSIBLE → VIEWED (don't overwrite later states)
    if (match.status === "POSSIBLE") {
      match.status = "VIEWED";
      await match.save();
    }

    res.json(match);
  } catch (err) {
    console.error("Mark match viewed error:", err.message);
    res.status(500).send("Server error");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/matches/:id/dismiss
// @desc    Dismiss a match recommendation
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.put("/:id/dismiss", auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid match ID." });
    }

    const match = await PossibleMatch.findById(req.params.id);
    if (!match) return res.status(404).json({ message: "Match not found." });

    const allowed = await canAccessMatch(match, req.user.id);
    if (!allowed) return res.status(403).json({ message: "Not authorized." });

    if (["RETURNED", "EXPIRED"].includes(match.status)) {
      return res.status(400).json({ message: "Cannot dismiss a resolved match." });
    }

    match.status = "DISMISSED";
    await match.save();

    res.json({ message: "Match dismissed.", match });
  } catch (err) {
    console.error("Dismiss match error:", err.message);
    res.status(500).send("Server error");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   DELETE /api/matches/:id
// @desc    Expire a match (hard-expire by owner/finder action)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid match ID." });
    }

    const match = await PossibleMatch.findById(req.params.id);
    if (!match) return res.status(404).json({ message: "Match not found." });

    const allowed = await canAccessMatch(match, req.user.id);
    if (!allowed) return res.status(403).json({ message: "Not authorized." });

    match.status = "EXPIRED";
    await match.save();

    res.json({ message: "Match expired." });
  } catch (err) {
    console.error("Expire match error:", err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
