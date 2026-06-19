const express = require("express");
const Notification = require("../models/Notification");
const { auth } = require("../middleware/auth");

const router = express.Router();

// @route   GET api/notifications
// @desc    Get all notifications for current user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    console.error("Get notifications error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.put("/:id/read", auth, async (req, res) => {
  try {
    let notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized." });
    }

    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    console.error("Mark notification read error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/notifications/read-all
// @desc    Mark all notifications as read for current user
// @access  Private
router.put("/read-all", auth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ message: "All notifications marked as read." });
  } catch (err) {
    console.error("Mark all notifications read error:", err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
