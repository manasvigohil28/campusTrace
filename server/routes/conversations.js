const express = require("express");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const LostItem = require("../models/LostItem");
const FoundItem = require("../models/FoundItem");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

// @route   GET api/conversations
// @desc    Get all conversations the logged-in user is participating in
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
    .populate("participants", "name")
    .sort({ createdAt: -1 });

    // Fetch related items to display titles
    const formatted = [];
    for (const conv of conversations) {
      const ItemModel = conv.itemType === "LostItem" ? LostItem : FoundItem;
      const item = await ItemModel.findById(conv.itemId).select("title");
      
      formatted.push({
        _id: conv._id,
        itemTitle: item ? item.title : "Deleted Item",
        participants: conv.participants.map(p => ({
          id: p._id,
          name: p.name,
          isSelf: p._id.toString() === req.user.id
        })),
        createdAt: conv.createdAt
      });
    }

    res.json(formatted);
  } catch (err) {
    console.error("Get conversations error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/conversations/:id/messages
// @desc    Get message history for a conversation
// @access  Private
router.get("/:id/messages", auth, async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    // Verify participant
    if (!conv.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({ message: "Not authorized to view this chat." });
    }

    // Mark incoming messages as read
    await Message.updateMany(
      { conversationId: req.params.id, senderId: { $ne: req.user.id }, read: false },
      { $set: { read: true } }
    );

    // If requester is shadow_banned, show all messages.
    // If requester is active, hide messages sent by shadow-banned participants (unless they are the requester themselves).
    const reqUser = await User.findById(req.user.id);
    let messages = [];

    if (reqUser && reqUser.status === "shadow_banned") {
      messages = await Message.find({ conversationId: req.params.id })
        .populate("senderId", "name")
        .sort({ timestamp: 1 });
    } else {
      const shadowBannedUsers = await User.find({ status: "shadow_banned" }).select("_id");
      const shadowBannedIds = shadowBannedUsers.map(u => u._id.toString());
      
      const allMessages = await Message.find({ conversationId: req.params.id })
        .populate("senderId", "name")
        .sort({ timestamp: 1 });
      
      messages = allMessages.filter(m => {
        const senderIdStr = (m.senderId._id || m.senderId).toString();
        return senderIdStr === req.user.id || !shadowBannedIds.includes(senderIdStr);
      });
    }

    res.json(messages);
  } catch (err) {
    console.error("Get messages error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/conversations/:id/messages
// @desc    Post a message inside a conversation
// @access  Private
router.post("/:id/messages", auth, async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ message: "Message text cannot be empty." });
  }

  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    // Verify participant
    if (!conv.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({ message: "Not authorized to send messages here." });
    }

    const newMessage = new Message({
      conversationId: req.params.id,
      senderId: req.user.id,
      text: text.trim()
    });

    await newMessage.save();
    
    // Return populated message
    const populated = await Message.findById(newMessage._id).populate("senderId", "name");
    res.status(201).json(populated);
  } catch (err) {
    console.error("Send message error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/conversations/:id/report
// @desc    Report a conversation (flags it and creates a complaint ticket)
// @access  Private
router.post("/:id/report", auth, async (req, res) => {
  const { reason, description } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: "Reason for reporting is required." });
  }

  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    if (!conv.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({ message: "Not authorized to access this conversation." });
    }

    conv.isReported = true;
    conv.reportedAt = new Date();
    await conv.save();

    const Report = require("../models/Report");
    const report = new Report({
      reporterId: req.user.id,
      targetId: conv._id,
      targetType: "Message", // Targets chatroom message log
      reason: reason.trim(),
      description: description || "Abusive/spam chat conversation flagged for safety review."
    });
    await report.save();

    res.json({ message: "Conversation reported successfully.", conversation: conv });
  } catch (err) {
    console.error("Report conversation error:", err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
