const mongoose = require("mongoose");

const GeneratedQuestionSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  itemType: {
    type: String,
    enum: ["LostItem", "FoundItem"],
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  expectedAnswer: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("GeneratedQuestion", GeneratedQuestionSchema);
