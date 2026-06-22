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
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      required: true,
    }
  },
  verificationResult: {
    score: {
      type: Number,
      default: 0,
    },
    earnedPoints: {
      type: Number,
      default: 0,
    },
    possiblePoints: {
      type: Number,
      default: 0,
    },
    colorScore: {
      type: Number,
      default: 0,
    },
    brandScore: {
      type: Number,
      default: 0,
    },
    contentsScore: {
      type: Number,
      default: 0,
    },
    locationScore: {
      type: Number,
      default: 0,
    },
    semanticScore: {
      type: Number,
      default: null,
    },
    semanticSimilarity: {
      type: Number,
      default: null,
    },
    confidence: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "LOW",
    },
    aiAvailable: {
      type: Boolean,
      default: true,
    },
    aiModel: {
      type: String,
      default: "all-MiniLM-L6-v2",
    },
    aiVersion: {
      type: String,
      default: "1.0",
    },
    aiMetadata: {
      similarity: Number,
      model: String,
      timestamp: Date,
    },
    matchedTerms: {
      type: [String],
      default: [],
    },
    reviewedByHuman: {
      type: Boolean,
      default: false,
    },
    imageSimilarityScore: {
      type: Number,
    }
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Claim", ClaimSchema);
