const mongoose = require("mongoose");

const ClaimAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  itemType: {
    type: String,
    enum: ["LostItem", "FoundItem"],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  result: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    required: true,
  }
});

module.exports = mongoose.model("ClaimAttempt", ClaimAttemptSchema);
