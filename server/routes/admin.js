const express = require("express");
const User = require("../models/User");
const LostItem = require("../models/LostItem");
const FoundItem = require("../models/FoundItem");
const Claim = require("../models/Claim");
const ClaimAttempt = require("../models/ClaimAttempt");
const AuditLog = require("../models/AuditLog");
const Report = require("../models/Report");
const SystemSettings = require("../models/SystemSettings");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const { auth, admin } = require("../middleware/auth");

const router = express.Router();

// Apply auth and admin middleware to all routes in this file
router.use(auth);
router.use(admin);

// Helper to get or create settings
const getOrCreateSettings = async () => {
  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = new SystemSettings();
    await settings.save();
  }
  return settings;
};

// @route   GET api/admin/stats
// @desc    Get dashboard metrics for admin panel
// @access  Private/Admin
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalLost = await LostItem.countDocuments({ isDeleted: { $ne: true } });
    const totalFound = await FoundItem.countDocuments({ isDeleted: { $ne: true } });
    const totalClaims = await Claim.countDocuments({ isDeleted: { $ne: true } });

    // AI Health check
    let aiStatus = { status: "offline", model: null, latency: null };
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Number(process.env.AI_HEALTH_TIMEOUT_MS) || 1000);
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

    // Success return rate: (returned items / total found items) * 100
    const returnedItems = await FoundItem.countDocuments({ status: "returned", isDeleted: { $ne: true } });
    const returnSuccessRate = totalFound > 0 ? Math.round((returnedItems / totalFound) * 100) : 0;

    // Claims breakdown
    const approvedClaims = await Claim.countDocuments({ status: "approved", isDeleted: { $ne: true } });
    const rejectedClaims = await Claim.countDocuments({ status: "rejected", isDeleted: { $ne: true } });
    const pendingClaims = await Claim.countDocuments({ status: "pending", isDeleted: { $ne: true } });

    // Fraud alerts (high-risk users)
    const fraudAlerts = await User.countDocuments({
      $or: [
        { "fraudFlags.failedClaims": { $gte: 3 } },
        { "fraudFlags.suspiciousClaims": { $gte: 1 } },
        { riskScore: { $gte: 50 } }
      ]
    });

    // Recent items and claims
    const recentLost = await LostItem.find({ isDeleted: { $ne: true } })
      .limit(5)
      .sort({ createdAt: -1 })
      .populate("ownerId", "name email");

    const recentFound = await FoundItem.find({ isDeleted: { $ne: true } })
      .limit(5)
      .sort({ createdAt: -1 })
      .populate("finderId", "name email");

    const recentClaims = await Claim.find({ isDeleted: { $ne: true } })
      .limit(5)
      .sort({ createdAt: -1 })
      .populate("itemId")
      .populate("claimantId", "name email")
      .populate("finderId", "name email");

    // Dynamic Category distribution logic
    const foundGroup = await FoundItem.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
    const categorySpread = foundGroup.map(g => ({
      label: g._id,
      count: g.count
    })).sort((a, b) => b.count - a.count);

    // Daily lost and found trends (last 7 days)
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const lostCount = await LostItem.countDocuments({ createdAt: { $gte: d, $lt: nextD }, isDeleted: { $ne: true } });
      const foundCount = await FoundItem.countDocuments({ createdAt: { $gte: d, $lt: nextD }, isDeleted: { $ne: true } });

      dailyTrend.push({
        date: d.toLocaleDateString(undefined, { weekday: "short" }),
        lost: lostCount,
        found: foundCount
      });
    }

    res.json({
      stats: {
        totalUsers,
        totalLost,
        totalFound,
        totalClaims,
        returnSuccessRate,
        approvedClaims,
        rejectedClaims,
        pendingClaims,
        fraudAlerts,
        aiStatus
      },
      recentLost,
      recentFound,
      recentClaims,
      categorySpread,
      dailyTrend
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
    const { q, role, status } = req.query;
    let filter = {};

    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { email: new RegExp(q, "i") }
      ];
    }
    if (role) {
      filter.role = role;
    }
    if (status) {
      filter.status = status;
    }

    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("Get admin users error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/admin/users/:id/timeline
// @desc    Get chronological user activity history
// @access  Private/Admin
router.get("/users/:id/timeline", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const timeline = [];

    // 1. Joined event
    timeline.push({
      date: user.createdAt,
      type: "JOINED",
      title: "Joined Platform",
      description: `Account created under email ${user.email}.`
    });

    // 2. Lost items reported
    const lostItems = await LostItem.find({ ownerId: req.params.id });
    lostItems.forEach(item => {
      timeline.push({
        date: item.createdAt,
        type: "LOST_REPORTED",
        title: "Reported Lost Item",
        description: `Reported lost item: "${item.title}" in ${item.category}.`
      });
    });

    // 3. Found items reported
    const foundItems = await FoundItem.find({ finderId: req.params.id });
    foundItems.forEach(item => {
      timeline.push({
        date: item.createdAt,
        type: "FOUND_REPORTED",
        title: "Reported Found Item",
        description: `Reported found item: "${item.title}" in ${item.category}.`
      });
    });

    // 4. Claims submitted
    const claimsSubmitted = await Claim.find({ claimantId: req.params.id });
    claimsSubmitted.forEach(claim => {
      timeline.push({
        date: claim.createdAt,
        type: "CLAIM_SUBMITTED",
        title: "Claim Request Submitted",
        description: `Submitted claim request for: "${claim.itemSnapshot?.title || 'an item'}". Confidence: ${claim.verificationResult?.confidence || 'N/A'}.`
      });

      if (claim.status === "approved") {
        timeline.push({
          date: claim.moderation?.reviewedAt || claim.createdAt,
          type: "CLAIM_APPROVED",
          title: "Claim Request Approved",
          description: `Claim request approved for item "${claim.itemSnapshot?.title || 'an item'}".`
        });
      } else if (claim.status === "rejected") {
        timeline.push({
          date: claim.moderation?.reviewedAt || claim.createdAt,
          type: "CLAIM_REJECTED",
          title: "Claim Request Rejected",
          description: `Claim request rejected for item "${claim.itemSnapshot?.title || 'an item'}".`
        });
      }
    });

    // Sort timeline chronologically descending (newest first)
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        trustScore: user.trustScore,
        riskScore: user.riskScore,
        adminNotes: user.adminNotes,
        fraudFlags: user.fraudFlags
      },
      timeline
    });
  } catch (err) {
    console.error("Get user timeline error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/admin/users/:id/status
// @desc    Update user account status (active, suspended, banned, shadow_banned)
// @access  Private/Admin
router.put("/users/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!["active", "suspended", "banned", "shadow_banned"].includes(status)) {
    return res.status(400).json({ message: "Invalid status option." });
  }

  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: "User not found." });

    // Protect super-admins from demotion/status change by ordinary admins
    if (targetUser.role === "super-admin" && req.user.role !== "super-admin") {
      return res.status(403).json({ message: "Ordinary admins cannot suspend or ban Super Admins." });
    }

    targetUser.status = status;
    await targetUser.save();

    // Log action in AuditLog
    const audit = new AuditLog({
      action: `USER_STATUS_${status.toUpperCase()}`,
      performedBy: req.user.id,
      target: targetUser._id,
      targetType: "User"
    });
    await audit.save();

    res.json({ message: `User status successfully updated to ${status}.`, user: targetUser });
  } catch (err) {
    console.error("Update user status error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/admin/users/:id/role
// @desc    Update user account role (user, admin, super-admin)
// @access  Private/Admin
router.put("/users/:id/role", async (req, res) => {
  const { role } = req.body;
  if (!["user", "admin", "super-admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role option." });
  }

  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: "User not found." });

    // Check promotion/demotion restrictions:
    // Only Super Admins can promote/demote or create Super Admins.
    if (role === "super-admin" && req.user.role !== "super-admin") {
      return res.status(403).json({ message: "Only Super Admins can promote accounts to Super Admin." });
    }

    if (targetUser.role === "super-admin" && req.user.role !== "super-admin") {
      return res.status(403).json({ message: "Only Super Admins can demote or update other Super Admin roles." });
    }

    targetUser.role = role;
    await targetUser.save();

    // Log action in AuditLog
    const audit = new AuditLog({
      action: `USER_ROLE_${role.toUpperCase()}`,
      performedBy: req.user.id,
      target: targetUser._id,
      targetType: "User"
    });
    await audit.save();

    res.json({ message: `User role successfully updated to ${role}.`, user: targetUser });
  } catch (err) {
    console.error("Update user role error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/admin/users/:id/notes
// @desc    Update admin notes for user
// @access  Private/Admin
router.put("/users/:id/notes", async (req, res) => {
  const { notes } = req.body;
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { adminNotes: notes || "" } }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ message: "User notes updated successfully.", notes: user.adminNotes });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/admin/claims/:id/notes
// @desc    Update admin notes for claim
// @access  Private/Admin
router.put("/claims/:id/notes", async (req, res) => {
  const { notes } = req.body;
  try {
    const claim = await Claim.findByIdAndUpdate(req.params.id, { $set: { adminNotes: notes || "" } }, { new: true });
    if (!claim) return res.status(404).json({ message: "Claim not found." });
    res.json({ message: "Claim notes updated successfully.", notes: claim.adminNotes });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/admin/reports/:id/notes
// @desc    Update admin notes for report
// @access  Private/Admin
router.put("/reports/:id/notes", async (req, res) => {
  const { notes } = req.body;
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { $set: { adminNotes: notes || "" } }, { new: true });
    if (!report) return res.status(404).json({ message: "Report ticket not found." });
    res.json({ message: "Report notes updated successfully.", notes: report.adminNotes });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// @route   GET api/admin/claims
// @desc    Get all platform claims
// @access  Private/Admin
router.get("/claims", async (req, res) => {
  try {
    const claims = await Claim.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .populate("itemId")
      .populate("claimantId", "name email status trustScore riskScore")
      .populate("finderId", "name email");

    res.json(claims);
  } catch (err) {
    console.error("Get admin claims error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/admin/claims/:id/resolve
// @desc    Admin override resolving/approving/rejecting claims
// @access  Private/Admin
router.put("/claims/:id/resolve", async (req, res) => {
  const { status, remarks } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Status must be approved or rejected." });
  }

  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found." });

    let item;
    if (claim.itemType === "LostItem") {
      item = await LostItem.findById(claim.itemId);
    } else {
      item = await FoundItem.findById(claim.itemId);
    }

    if (!item) return res.status(404).json({ message: "Associated item not found." });

    claim.status = status;
    claim.moderation = {
      notes: remarks || `Admin Override Resolution: ${status}`,
      reviewedBy: req.user.id,
      reviewedAt: new Date()
    };
    await claim.save();

    // If approved, mark item status as resolved/returned and reject other claims
    if (status === "approved") {
      item.status = claim.itemType === "LostItem" ? "matched" : "returned";
      await item.save();

      // Reject all other pending claims on this item
      const otherClaims = await Claim.find({ itemId: claim.itemId, _id: { $ne: claim._id }, status: "pending" });
      for (const otherClaim of otherClaims) {
        otherClaim.status = "rejected";
        otherClaim.moderation = {
          notes: "Auto-rejected because another claim was verified by the administrator.",
          reviewedBy: req.user.id,
          reviewedAt: new Date()
        };
        await otherClaim.save();

        // Notify other claimants
        await Notification.create({
          userId: otherClaim.claimantId,
          message: `Your claim for "${item.title}" was rejected because another claim was approved.`,
          type: "claim_rejected",
          relatedItemId: item._id,
          itemType: claim.itemType,
          relatedClaimId: otherClaim._id
        });
      }
    } else {
      // If rejected, set item back to active
      item.status = "active";
      await item.save();

      // Increment claimant failed claims count and recalculate trust score
      const claimant = await User.findById(claim.claimantId);
      if (claimant) {
        claimant.fraudFlags.failedClaims += 1;
        // Deduct 10 points of trust per rejection
        claimant.trustScore = Math.max(0, claimant.trustScore - 15);
        // Recalculate risk score
        claimant.riskScore = Math.min(100, Math.round((claimant.fraudFlags.failedClaims * 20) + (claimant.fraudFlags.suspiciousClaims * 40)));
        await claimant.save();
      }
    }

    // Log action in AuditLog
    const audit = new AuditLog({
      action: status === "approved" ? "ADMIN_CLAIM_APPROVED" : "ADMIN_CLAIM_REJECTED",
      performedBy: req.user.id,
      target: claim._id,
      targetType: "Claim"
    });
    await audit.save();

    // Notify claimant
    await Notification.create({
      userId: claim.claimantId,
      message: `Administrator has resolved your claim request for "${item.title}" as: ${status.toUpperCase()}.`,
      type: status === "approved" ? "claim_approved" : "claim_rejected",
      relatedItemId: item._id,
      itemType: claim.itemType,
      relatedClaimId: claim._id
    });

    res.json({ message: `Claim successfully ${status} by administrator.`, claim });
  } catch (err) {
    console.error("Resolve claim error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   DELETE api/admin/items/:id
// @desc    Admin soft delete reported item
// @access  Private/Admin
router.delete("/items/:id", async (req, res) => {
  try {
    let item = await LostItem.findById(req.params.id);
    let type = "LostItem";

    if (!item) {
      item = await FoundItem.findById(req.params.id);
      type = "FoundItem";
    }

    if (!item) return res.status(404).json({ message: "Item not found." });

    item.isDeleted = true;
    item.deletedAt = new Date();
    await item.save();

    // Cancel all pending claims associated
    await Claim.updateMany(
      { itemId: item._id, status: "pending" },
      { $set: { status: "rejected", "moderation.notes": "Item deleted/removed by moderator." } }
    );

    // Create AuditLog entry
    const audit = new AuditLog({
      action: `ADMIN_DELETE_${type.toUpperCase()}`,
      performedBy: req.user.id,
      target: item._id,
      targetType: type
    });
    await audit.save();

    res.json({ message: "Item soft deleted successfully." });
  } catch (err) {
    console.error("Admin delete item error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/admin/items/:id/resolve
// @desc    Admin force resolve/close case
// @access  Private/Admin
router.put("/items/:id/resolve", async (req, res) => {
  try {
    let item = await LostItem.findById(req.params.id);
    let type = "LostItem";

    if (!item) {
      item = await FoundItem.findById(req.params.id);
      type = "FoundItem";
    }

    if (!item) return res.status(404).json({ message: "Item not found." });

    item.status = type === "LostItem" ? "matched" : "returned";
    await item.save();

    // Close pending claims
    await Claim.updateMany(
      { itemId: item._id, status: "pending" },
      { $set: { status: "rejected", "moderation.notes": "Resolved/Closed by Administrator." } }
    );

    // Create AuditLog
    const audit = new AuditLog({
      action: `ADMIN_RESOLVE_${type.toUpperCase()}`,
      performedBy: req.user.id,
      target: item._id,
      targetType: type
    });
    await audit.save();

    res.json({ message: "Item successfully resolved/closed." });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// @route   GET api/admin/reports
// @desc    Get list of all submitted complaints/reports
// @access  Private/Admin
router.get("/reports", async (req, res) => {
  try {
    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .populate("reporterId", "name email");

    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/admin/reports/:id/resolve
// @desc    Resolve a report ticket and take action (dismiss, warn, suspend)
// @access  Private/Admin
router.put("/reports/:id/resolve", async (req, res) => {
  const { action, remarks } = req.body;
  if (!["dismiss", "warn", "suspend", "ban"].includes(action)) {
    return res.status(400).json({ message: "Invalid resolve action." });
  }

  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report ticket not found." });

    report.status = action === "dismiss" ? "dismissed" : "resolved";
    report.resolutionNotes = remarks || `Resolved with action: ${action.toUpperCase()}`;
    report.resolvedBy = req.user.id;
    report.resolvedAt = new Date();
    await report.save();

    // Trigger action on the target user if target is User or related to user
    let targetUserId = null;
    if (report.targetType === "User") {
      targetUserId = report.targetId;
    } else if (report.targetType === "Item") {
      let item = await LostItem.findById(report.targetId);
      if (!item) item = await FoundItem.findById(report.targetId);
      if (item) targetUserId = item.ownerId || item.finderId;
    } else if (report.targetType === "Claim") {
      const claim = await Claim.findById(report.targetId);
      if (claim) targetUserId = claim.claimantId;
    } else if (report.targetType === "Message") {
      const msg = await Message.findById(report.targetId);
      if (msg) targetUserId = msg.senderId;
    }

    if (targetUserId) {
      const dbUser = await User.findById(targetUserId);
      if (dbUser && dbUser.role !== "super-admin") {
        if (action === "warn") {
          dbUser.trustScore = Math.max(0, dbUser.trustScore - 10);
          dbUser.riskScore = Math.min(100, dbUser.riskScore + 15);
          await dbUser.save();

          await Notification.create({
            userId: dbUser._id,
            message: `Official Admin Warning: We received complaints about your activity. Please verify ownership details carefully. (${remarks || 'Scam/Fake Reports'})`,
            type: "admin_warning"
          });
        } else if (action === "suspend") {
          dbUser.status = "suspended";
          await dbUser.save();
        } else if (action === "ban") {
          dbUser.status = "banned";
          await dbUser.save();
        }
      }
    }

    // Audit log
    const audit = new AuditLog({
      action: `REPORT_RESOLVED_${action.toUpperCase()}`,
      performedBy: req.user.id,
      target: report._id,
      targetType: "Report"
    });
    await audit.save();

    res.json({ message: "Report successfully resolved.", report });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// @route   GET api/admin/conversations/:id/messages
// @desc    Moderation chat inspection (ONLY allowed if reported)
// @access  Private/Admin
router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ message: "Conversation not found." });

    if (!convo.isReported) {
      return res.status(403).json({ message: "Access Denied: Admins can only inspect message logs for chats that have been officially flagged or reported." });
    }

    const messages = await Message.find({ conversationId: convo._id })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email");

    res.json({ conversation: convo, messages });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// @route   GET api/admin/audit-logs
// @desc    Query platform audit logs
// @access  Private/Admin
router.get("/audit-logs", async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .populate("performedBy", "name email role");
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// @route   GET api/admin/settings
// @desc    Get dynamic system settings
// @access  Private/Admin
router.get("/settings", async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/admin/settings
// @desc    Update dynamic system settings
// @access  Private/Admin
router.put("/settings", async (req, res) => {
  try {
    let settings = await getOrCreateSettings();
    const { lowThreshold, highThreshold, veryHighThreshold, maxClaimsPerItem, cooldownHours, riskThreshold, enableAI } = req.body;

    if (lowThreshold !== undefined) settings.lowThreshold = Number(lowThreshold);
    if (highThreshold !== undefined) settings.highThreshold = Number(highThreshold);
    if (veryHighThreshold !== undefined) settings.veryHighThreshold = Number(veryHighThreshold);
    if (maxClaimsPerItem !== undefined) settings.maxClaimsPerItem = Number(maxClaimsPerItem);
    if (cooldownHours !== undefined) settings.cooldownHours = Number(cooldownHours);
    if (riskThreshold !== undefined) settings.riskThreshold = Number(riskThreshold);
    if (enableAI !== undefined) settings.enableAI = Boolean(enableAI);

    settings.updatedBy = req.user.id;
    settings.updatedAt = new Date();
    await settings.save();

    // Audit log
    const audit = new AuditLog({
      action: "ADMIN_SETTINGS_UPDATED",
      performedBy: req.user.id,
      target: settings._id,
      targetType: "SystemSettings"
    });
    await audit.save();

    res.json({ message: "Settings updated successfully.", settings });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
