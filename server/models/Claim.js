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
  moderation: {
    notes: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
  },
  itemSnapshot: {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    subcategory: {
      type: String,
      required: true,
    },
    location: {
      public: {
        type: String,
        required: true,
      },
      private: {
        type: String,
        required: true,
      }
    },
    verificationData: {
      color: String,
      brand: String,
      contents: {
        type: [String],
        default: [],
      },
      specialMarks: String,
      freeTextDescription: String,
    },
    createdAt: {
      type: Date,
      required: true,
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Claim", ClaimSchema);
