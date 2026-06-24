const mongoose = require("mongoose");

const SystemSettingsSchema = new mongoose.Schema({
  lowThreshold: {
    type: Number,
    default: 50,
    required: true,
  },
  highThreshold: {
    type: Number,
    default: 75,
    required: true,
  },
  veryHighThreshold: {
    type: Number,
    default: 90,
    required: true,
  },
  maxClaimsPerItem: {
    type: Number,
    default: 3,
    required: true,
  },
  cooldownHours: {
    type: Number,
    default: 24,
    required: true,
  },
  riskThreshold: {
    type: Number,
    default: 50,
    required: true,
  },
  enableAI: {
    type: Boolean,
    default: true,
    required: true,
  },
  aiModelVersion: {
    type: String,
    default: "all-MiniLM-L6-v2",
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SystemSettings", SystemSettingsSchema);
