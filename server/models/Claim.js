const mongoose = require("mongoose");

const ClaimSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "itemType",
  },
  itemType: {
    type: String,
    required: true,
    enum: ["LostItem", "FoundItem"],
  },
  claimantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  finderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  claimantVerificationData: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Claim", ClaimSchema);
