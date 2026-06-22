const express = require("express");
const User = require("../models/User");
const LostItem = require("../models/LostItem");
const FoundItem = require("../models/FoundItem");
const Claim = require("../models/Claim");
const { auth, admin } = require("../middleware/auth");

const router = express.Router();

// Apply auth and admin middleware to all routes in this file
router.use(auth);
router.use(admin);

// @route   GET api/admin/stats
// @desc    Get dashboard metrics for admin panel
// @access  Private/Admin
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalLost = await LostItem.countDocuments();
    const totalFound = await FoundItem.countDocuments();
    const totalClaims = await Claim.countDocuments();

    // Health check the Python AI service
    let aiStatus = { status: "offline", model: null, latency: null };
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    const startMs = Date.now();

    try {
      const response = await fetch(`${aiServiceUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        const latency = Date.now() - startMs;
        aiStatus = {
          status: "online",
          model: data.model || "all-MiniLM-L6-v2",
          latency
        };
      }
    } catch (err) {
      clearTimeout(timeoutId);
    }

    // Get recently created items
    const recentLost = await LostItem.find()
      .limit(5)
      .sort({ createdAt: -1 })
      .populate("ownerId", "name email");

    const recentFound = await FoundItem.find()
      .limit(5)
      .sort({ createdAt: -1 })
      .populate("finderId", "name email");

    const recentClaims = await Claim.find()
      .limit(5)
      .sort({ createdAt: -1 })
      .populate("itemId")
      .populate("claimantId", "name email")
      .populate("finderId", "name email");

    res.json({
      stats: {
        totalUsers,
        totalLost,
        totalFound,
        totalClaims,
        aiStatus
      },
      recentLost,
      recentFound,
      recentClaims,
    });
  } catch (err) {
    console.error("Get admin stats error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/admin/users
// @desc    Get list of all users
// @access  Private/Admin
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("Get admin users error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   DELETE api/admin/users/:id
// @desc    Delete a user account
// @access  Private/Admin
router.delete("/users/:id", async (req, res) => {
  try {
    // Prevent admin from deleting their own account
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: "Admin cannot delete their own account." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Soft delete related items and claims
    const now = new Date();
    await LostItem.updateMany({ ownerId: req.params.id }, { $set: { isDeleted: true, deletedAt: now } });
    await FoundItem.updateMany({ finderId: req.params.id }, { $set: { isDeleted: true, deletedAt: now } });
    await Claim.updateMany(
      { $or: [{ claimantId: req.params.id }, { finderId: req.params.id }] },
      { $set: { isDeleted: true, deletedAt: now } }
    );

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User account and all associated items/claims deleted successfully." });
  } catch (err) {
    console.error("Delete user error:", err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
