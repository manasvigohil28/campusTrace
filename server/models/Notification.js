const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["claim_received", "claim_approved", "claim_rejected", "match_found", "admin_warning", "general"],
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  relatedItemId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "itemType",
  },
  itemType: {
    type: String,
    enum: ["LostItem", "FoundItem"],
  },
  relatedClaimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Claim",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", NotificationSchema);
