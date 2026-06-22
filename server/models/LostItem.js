const mongoose = require("mongoose");

const LostItemSchema = new mongoose.Schema({
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
  dateLost: {
    type: Date,
    required: true,
  },
  publicImages: {
    type: [String],
    default: [],
  },
  verificationImages: {
    type: [String],
    default: [],
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "under_review", "matched", "returned"],
    default: "active",
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

module.exports = mongoose.model("LostItem", LostItemSchema);
