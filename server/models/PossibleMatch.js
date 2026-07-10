const mongoose = require("mongoose");

/**
 * PossibleMatch — Phase 5 AI Smart Matching Engine
 *
 * One document per (lostItemId, foundItemId) pair.
 * Unique compound index ensures upsert never creates duplicates.
 *
 * Score Decomposition:
 *   overallScore = 45% semanticScore + 35% fieldScore + 20% locationScore
 *   imageScore   = null  (Phase 6 placeholder — no schema migration needed later)
 *
 * Notifications:
 *   Only the top-3 matches trigger notifications AND only if notified=false.
 *   Subsequent score updates (re-compute on edit) do NOT re-notify.
 */
const PossibleMatchSchema = new mongoose.Schema(
  {
    lostItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LostItem",
      required: true,
    },
    foundItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoundItem",
      required: true,
    },

    // ── Score Components ────────────────────────────────────────────────────
    semanticSimilarity: {
      type: Number, // Raw cosine similarity [0, 1] — useful for analytics / model comparison
      default: 0,
    },
    semanticScore: {
      type: Number, // semanticSimilarity × 100 → [0, 100]
      default: 0,
    },
    fieldScore: {
      type: Number, // Weighted structured-field comparison → [0, 100]
      default: 0,
    },
    locationScore: {
      type: Number, // Location string similarity → [0, 100]
      default: 0,
    },
    imageScore: {
      type: Number, // Phase 6 placeholder — currently always null
      default: null,
    },
    overallScore: {
      type: Number, // 45% semantic + 35% field + 20% location → [0, 100]
      default: 0,
    },

    // ── Confidence ──────────────────────────────────────────────────────────
    confidence: {
      type: String,
      enum: ["EXCELLENT", "VERY_HIGH", "HIGH", "MEDIUM"],
      required: true,
    },

    // ── Lifecycle ───────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: [
        "POSSIBLE",      // Default — match stored, user not yet notified/viewed
        "VIEWED",        // User opened the Review Match page
        "CLAIM_STARTED", // User clicked "Submit Claim"
        "UNDER_REVIEW",  // Finder is reviewing the claim
        "RETURNED",      // Item reunited with owner
        "DISMISSED",     // User explicitly dismissed this recommendation
        "EXPIRED",       // Item deleted / status=returned → all matches expired
      ],
      default: "POSSIBLE",
    },

    // ── AI Metadata ─────────────────────────────────────────────────────────
    aiModel: {
      type: String,
      default: "all-MiniLM-L6-v2",
    },
    aiVersion: {
      type: String,
      default: "2.0",
    },
    embeddingDimension: {
      type: Number,
      default: 384, // Safe to query if we migrate to a larger model later
    },

    // ── Match Explanation ───────────────────────────────────────────────────
    matchReason: {
      matchedFields: {
        type: [String],
        default: [], // e.g. ["color", "brand"]
      },
      partialFields: {
        type: [String],
        default: [], // e.g. ["description"]
      },
      matchedKeywords: {
        type: [String],
        default: [], // e.g. ["wildcraft", "blue"]
      },
      // Pre-built human-readable summary stored at match time.
      // Frontend renders this directly — no reconstruction needed.
      reasonSummary: {
        type: String,
        default: "", // e.g. "✓ Same Brand  ✓ Same Color  ~ Similar Description"
      },
    },

    // ── Notification Deduplication ──────────────────────────────────────────
    notified: {
      type: Boolean,
      default: false, // Once true, score updates do NOT re-trigger notifications
    },
  },
  {
    timestamps: true, // createdAt + updatedAt managed automatically
  }
);

// Unique compound index — prevents duplicate (lost, found) pairs.
// Enables findOneAndUpdate({ lostItemId, foundItemId }, ..., { upsert: true })
PossibleMatchSchema.index({ lostItemId: 1, foundItemId: 1 }, { unique: true });

// Useful query indexes
PossibleMatchSchema.index({ lostItemId: 1, overallScore: -1 });
PossibleMatchSchema.index({ foundItemId: 1, overallScore: -1 });
PossibleMatchSchema.index({ status: 1 });

module.exports = mongoose.model("PossibleMatch", PossibleMatchSchema);
