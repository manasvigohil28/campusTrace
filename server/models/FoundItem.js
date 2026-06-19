const mongoose = require("mongoose");

const FoundItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  subcategory: {
    type: String,
    required: true,
    trim: true,
  },
  visibleDescription: {
    type: String,
    required: true,
  },
  images: {
    type: [String],
    default: [],
  },
  finderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "claimed", "resolved"],
    default: "active",
  },
  verificationData: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("FoundItem", FoundItemSchema);
