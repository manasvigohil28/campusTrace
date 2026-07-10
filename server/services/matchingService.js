/**
 * matchingService.js — Phase 5 AI Smart Matching Engine
 *
 * Orchestrates the full matching pipeline:
 *   1. Generate structured search text
 *   2. Call Python /embed → store L2-normalized vector on item
 *   3. Filter candidates (category + subcategory + active + 30-day window)
 *   4. Compute cosine similarity via dot product (normalized vectors)
 *   5. Compute structured field similarity (category-specific weights)
 *   6. Compute location similarity
 *   7. Overall score = 45% semantic + 35% field + 20% location
 *   8. Upsert PossibleMatch (unique index prevents duplicates)
 *   9. Notify top-3 matches only (dedup via notified flag)
 *
 * ALL matching runs fire-and-forget via setImmediate — HTTP response
 * is always returned before this service does any work.
 */

const axios = require("axios");
const LostItem = require("../models/LostItem");
const FoundItem = require("../models/FoundItem");
const PossibleMatch = require("../models/PossibleMatch");
const Notification = require("../models/Notification");
const { getWeightsForCategory } = require("./categoryWeights");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
const SCORE_THRESHOLD = 70;        // Minimum to store a match
const NOTIFY_THRESHOLD = 85;       // Minimum to send notification
const MAX_NOTIFICATIONS = 3;       // Max top matches that trigger push notification
const DATE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

// ─────────────────────────────────────────────────────────────────────────────
// 1. STRUCTURED SEARCH TEXT GENERATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds structured text for Sentence Transformers.
 * Sentence Transformers perform much better on structured, labelled text
 * than on raw descriptions alone.
 *
 * Example output:
 *   Category: Bags
 *   Subcategory: Backpack
 *   Brand: Wildcraft
 *   Color: Blue
 *   Contents: Notebook, Bottle
 *   Special Marks: Spider sticker
 *   Location: Main Library
 *   Description: Large blue backpack with laptop compartment.
 */
function generateSearchText(item) {
  const lines = [];
  lines.push(`Category: ${item.category}`);
  lines.push(`Subcategory: ${item.subcategory}`);

  const vd = item.verificationData || {};
  if (vd.brand)         lines.push(`Brand: ${vd.brand}`);
  if (vd.model)         lines.push(`Model: ${vd.model}`);
  if (vd.color)         lines.push(`Color: ${vd.color}`);
  if (vd.material)      lines.push(`Material: ${vd.material}`);
  if (vd.size)          lines.push(`Size: ${vd.size}`);
  if (vd.contents)      lines.push(`Contents: ${vd.contents}`);
  if (vd.specialMarks)  lines.push(`Special Marks: ${vd.specialMarks}`);
  if (vd.accessories)   lines.push(`Accessories: ${vd.accessories}`);
  if (vd.serial)        lines.push(`Serial: ${vd.serial}`);
  if (vd.keychain)      lines.push(`Keychain: ${vd.keychain}`);
  if (vd.cards)         lines.push(`Cards: ${vd.cards}`);
  if (vd.documentName)  lines.push(`Name on Document: ${vd.documentName}`);
  if (vd.title)         lines.push(`Title: ${vd.title}`);
  if (vd.engraving)     lines.push(`Engraving: ${vd.engraving}`);

  const loc = item.location && item.location.public ? item.location.public : "";
  if (loc) lines.push(`Location: ${loc}`);

  if (item.title)            lines.push(`Item: ${item.title}`);
  if (item.visibleDescription) lines.push(`Description: ${item.visibleDescription}`);

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. VECTOR MATH — Pure Node.js, microsecond performance
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dot product of two arrays.
 * Because both vectors are L2-normalized by Python at embed time,
 * dot(a, b) == cosine_similarity(a, b) — no magnitude division needed.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} cosine similarity [0, 1]
 */
function dotProduct(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return Math.max(0, Math.min(1, sum)); // Clip to [0,1] — rounding errors can push slightly out
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EMBEDDING MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the stored embedding for an item, or generates+stores a new one
 * by calling the Python /embed service.
 * @param {Object} item - Mongoose document
 * @param {Model} ItemModel - LostItem or FoundItem
 * @returns {number[]|null} L2-normalized embedding or null on failure
 */
async function getOrGenerateEmbedding(item, ItemModel) {
  if (item.embedding && item.embedding.length === 384) {
    return item.embedding; // Already stored — no API call needed
  }

  try {
    const searchText = generateSearchText(item);
    const response = await axios.post(`${AI_SERVICE_URL}/embed`, { text: searchText }, { timeout: 15000 });
    const embedding = response.data.embedding;

    // Persist to DB so future searches never re-encode
    await ItemModel.findByIdAndUpdate(item._id, { embedding });
    item.embedding = embedding; // Update in-memory reference
    return embedding;
  } catch (err) {
    console.error(`[matchingService] Embedding generation failed for item ${item._id}:`, err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DATE PROXIMITY SCORING — Gradual linear decay
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Date proximity score with gradual decay (not a step function).
 *
 *   0 days  → 20 pts
 *   3 days  → 18 pts
 *   7 days  → 15 pts
 *  14 days  → 10 pts
 *  30 days  →  0 pts
 *
 * @param {Date|string} dateA - Lost date
 * @param {Date|string} dateB - Found date
 * @returns {number} 0–20
 */
function dateSimilarityScore(dateA, dateB) {
  if (!dateA || !dateB) return 0;
  const diffMs = Math.abs(new Date(dateA).getTime() - new Date(dateB).getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays > 30) return 0;
  // Linear interpolation: 20 at day 0, 0 at day 30
  return Math.round(20 * (1 - diffDays / 30));
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. FIELD SIMILARITY — Category-specific weighted scoring
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compare two field values.
 * @returns {{ score: number, status: "match"|"partial"|"mismatch" }}
 */
function compareField(valA, valB) {
  const a = String(valA || "").toLowerCase().trim();
  const b = String(valB || "").toLowerCase().trim();

  if (!a || !b) return { score: 0, status: "mismatch" };
  if (a === b)  return { score: 1.0, status: "match" };

  // Partial: one contains the other, or they share keywords (length > 2)
  const aWords = a.split(/\s+/).filter(w => w.length > 2);
  const bWords = b.split(/\s+/).filter(w => w.length > 2);
  const sharesWord = aWords.some(w => b.includes(w)) || bWords.some(w => a.includes(w));

  if (sharesWord || a.includes(b) || b.includes(a)) {
    return { score: 0.5, status: "partial" };
  }

  return { score: 0, status: "mismatch" };
}

/**
 * Compute structured field similarity between a lost and found item.
 * Uses category-specific weights from categoryWeights.js.
 *
 * Also returns matched/partial/keyword arrays for matchReason.
 *
 * @param {Object} lost - LostItem document
 * @param {Object} found - FoundItem document
 * @returns {{ fieldScore: number, locationScore: number, matchedFields: string[], partialFields: string[], matchedKeywords: string[] }}
 */
function computeFieldSimilarity(lost, found) {
  const weights = getWeightsForCategory(lost.category);
  const lostVd  = lost.verificationData  || {};
  const foundVd = found.verificationData || {};

  let earned = 0;
  let total  = 0;
  const matchedFields  = [];
  const partialFields  = [];
  const matchedKeywords = [];

  for (const [field, weight] of Object.entries(weights)) {
    // Skip meta-flags that aren't real verification data
    if (["hideVerification", "enableAIVerification", "hideAnswers", "enableAI"].includes(field)) continue;

    const lVal = lostVd[field];
    const fVal = foundVd[field];
    if (!lVal && !fVal) continue; // Both absent — skip

    const { score, status } = compareField(lVal, fVal);
    earned += score * weight;
    total  += weight;

    if (status === "match") {
      matchedFields.push(field);
      // Collect keywords for the matchedKeywords list
      String(lVal).toLowerCase().split(/\s+/).filter(w => w.length > 2).forEach(kw => {
        if (!matchedKeywords.includes(kw)) matchedKeywords.push(kw);
      });
    } else if (status === "partial") {
      partialFields.push(field);
    }
  }

  const fieldScore = total > 0 ? Math.round((earned / total) * 100) : 0;

  // ── Location similarity (separate 20% component) ──────────────────────────
  const lLoc = (lost.location  && lost.location.public)  ? lost.location.public.toLowerCase().trim()  : "";
  const fLoc = (found.location && found.location.public) ? found.location.public.toLowerCase().trim() : "";

  let locationScore = 0;
  if (lLoc && fLoc) {
    if (lLoc === fLoc) {
      locationScore = 100;
      if (!matchedFields.includes("location")) matchedFields.push("location");
    } else {
      const lWords = lLoc.split(/\s+/).filter(w => w.length > 2);
      const fWords = fLoc.split(/\s+/).filter(w => w.length > 2);
      const shares = lWords.some(w => fLoc.includes(w)) || fWords.some(w => lLoc.includes(w));
      locationScore = shares ? 50 : 0;
      if (shares && !partialFields.includes("location")) partialFields.push("location");
    }
  }

  return { fieldScore, locationScore, matchedFields, partialFields, matchedKeywords };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. OVERALL SCORE & CONFIDENCE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Weighted composite score.
 * Weights: 45% semantic + 35% field + 20% location
 */
function computeOverallScore(semanticScore, fieldScore, locationScore) {
  return Math.round(semanticScore * 0.45 + fieldScore * 0.35 + locationScore * 0.20);
}

/**
 * Map overall score → confidence level string.
 */
function getConfidenceLevel(score) {
  if (score >= 95) return "EXCELLENT";
  if (score >= 90) return "VERY_HIGH";
  if (score >= 80) return "HIGH";
  return "MEDIUM"; // 70–79 only stored, never below 70
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. REASON SUMMARY BUILDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a human-readable explanation stored once at match time.
 * Frontend renders this string directly — no reconstruction needed.
 *
 * Example: "✓ Same Brand  ✓ Same Color  ✓ Same Location  ~ Similar Description"
 */
function buildReasonSummary(matchedFields, partialFields, matchedKeywords) {
  const parts = [];

  const fieldLabels = {
    color: "Same Color", brand: "Same Brand", model: "Same Model",
    specialMarks: "Same Special Marks", accessories: "Same Accessories",
    serial: "Serial Match", contents: "Similar Contents", keychain: "Same Keychain",
    cards: "Same Cards", documentName: "Same Name", size: "Same Size",
    material: "Same Material", engraving: "Same Engraving", title: "Same Title",
    location: "Same Location", sportType: "Same Sport", gameName: "Same Game",
    type: "Same Type",
  };

  matchedFields.forEach(f => {
    const label = fieldLabels[f] || `Same ${f.charAt(0).toUpperCase() + f.slice(1)}`;
    parts.push(`✓ ${label}`);
  });

  partialFields.forEach(f => {
    const label = fieldLabels[f] || `Similar ${f.charAt(0).toUpperCase() + f.slice(1)}`;
    parts.push(`~ ${label}`);
  });

  if (matchedKeywords.length > 0) {
    parts.push(`Keywords: ${matchedKeywords.slice(0, 4).join(", ")}`);
  }

  return parts.join("  ") || "AI-based semantic match";
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. MAIN PIPELINE — runMatchingForItem
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full matching pipeline for a newly reported item.
 *
 * Called via setImmediate — HTTP response is already sent before this runs.
 *
 * @param {Object} item    - Saved Mongoose document (LostItem or FoundItem)
 * @param {"lost"|"found"} type
 */
async function runMatchingForItem(item, type) {
  const isLost       = type === "lost";
  const SourceModel  = isLost ? LostItem  : FoundItem;
  const TargetModel  = isLost ? FoundItem : LostItem;
  const refDate      = isLost ? item.dateLost : item.dateFound;

  console.log(`[matchingService] Starting matching for ${type} item ${item._id}`);

  try {
    // Mark item as PROCESSING
    await SourceModel.findByIdAndUpdate(item._id, { matchingStatus: "PROCESSING" });

    // ── Step 1: Generate/retrieve embedding ───────────────────────────────
    const sourceEmbedding = await getOrGenerateEmbedding(item, SourceModel);
    if (!sourceEmbedding) {
      await SourceModel.findByIdAndUpdate(item._id, { matchingStatus: "FAILED" });
      console.warn(`[matchingService] Could not generate embedding for ${item._id}. Aborting.`);
      return;
    }

    // ── Step 2: Candidate filtering ───────────────────────────────────────
    // Only compare against same category + subcategory + active + 30-day window
    const dateField = isLost ? "dateFound" : "dateLost";
    const windowStart = new Date(new Date(refDate).getTime() - DATE_WINDOW_MS);
    const windowEnd   = new Date(new Date(refDate).getTime() + DATE_WINDOW_MS);

    const candidates = await TargetModel.find({
      category:    item.category,
      subcategory: item.subcategory,
      status:      "active",
      isDeleted:   { $ne: true },
      [dateField]: { $gte: windowStart, $lte: windowEnd },
    });

    console.log(`[matchingService] ${candidates.length} candidates after filtering for ${item._id}`);

    if (candidates.length === 0) {
      await SourceModel.findByIdAndUpdate(item._id, { matchingStatus: "COMPLETED" });
      return;
    }

    // ── Step 3: Score each candidate ─────────────────────────────────────
    const scoredMatches = [];

    for (const candidate of candidates) {
      try {
        // Get/generate candidate embedding
        const candidateEmbedding = await getOrGenerateEmbedding(candidate, TargetModel);
        if (!candidateEmbedding) continue;

        // Cosine similarity via dot product (both vectors are L2-normalized)
        const semanticSimilarity = dotProduct(sourceEmbedding, candidateEmbedding);
        const semanticScore      = Math.round(semanticSimilarity * 100);

        // Structured field + location similarity
        const lost  = isLost ? item      : candidate;
        const found = isLost ? candidate : item;
        const { fieldScore, locationScore, matchedFields, partialFields, matchedKeywords } =
          computeFieldSimilarity(lost, found);

        // Date proximity (factored into fieldScore as a bonus component)
        const lostDate  = isLost ? item.dateLost   : candidate.dateLost;
        const foundDate = isLost ? candidate.dateFound : item.dateFound;
        const dateScore = dateSimilarityScore(lostDate, foundDate);

        // Blend dateScore into fieldScore (date is ~20% of field weight)
        const blendedFieldScore = Math.min(100, Math.round(fieldScore * 0.80 + dateScore));

        const overallScore = computeOverallScore(semanticScore, blendedFieldScore, locationScore);

        if (overallScore < SCORE_THRESHOLD) continue; // Below threshold — don't store

        const confidence    = getConfidenceLevel(overallScore);
        const reasonSummary = buildReasonSummary(matchedFields, partialFields, matchedKeywords);

        scoredMatches.push({
          lostItemId:  isLost ? item._id      : candidate._id,
          foundItemId: isLost ? candidate._id : item._id,
          semanticSimilarity: parseFloat(semanticSimilarity.toFixed(4)),
          semanticScore,
          fieldScore:     blendedFieldScore,
          locationScore,
          overallScore,
          confidence,
          matchReason: {
            matchedFields,
            partialFields,
            matchedKeywords,
            reasonSummary,
          },
        });
      } catch (candErr) {
        console.error(`[matchingService] Error scoring candidate ${candidate._id}:`, candErr.message);
      }
    }

    // Sort descending by overallScore
    scoredMatches.sort((a, b) => b.overallScore - a.overallScore);

    // ── Step 4: Upsert PossibleMatch documents ────────────────────────────
    let notifyCount = 0;

    for (const match of scoredMatches) {
      try {
        const existing = await PossibleMatch.findOne({
          lostItemId:  match.lostItemId,
          foundItemId: match.foundItemId,
        });

        const shouldNotify =
          match.overallScore >= NOTIFY_THRESHOLD &&
          notifyCount < MAX_NOTIFICATIONS &&
          !existing?.notified; // Only notify if not already notified for this pair

        const updated = await PossibleMatch.findOneAndUpdate(
          { lostItemId: match.lostItemId, foundItemId: match.foundItemId },
          {
            $set: {
              semanticSimilarity: match.semanticSimilarity,
              semanticScore:      match.semanticScore,
              fieldScore:         match.fieldScore,
              locationScore:      match.locationScore,
              overallScore:       match.overallScore,
              confidence:         match.confidence,
              matchReason:        match.matchReason,
              // Only flip notified to true if we're sending a notification now
              ...(shouldNotify ? { notified: true } : {}),
            },
          },
          { upsert: true, new: true }
        );

        // ── Step 5: Notify (top-3 only, dedup via notified flag) ─────────
        if (shouldNotify) {
          notifyCount++;
          await sendMatchNotifications(match, updated._id);
        }
      } catch (upsertErr) {
        console.error(`[matchingService] Upsert failed for match:`, upsertErr.message);
      }
    }

    await SourceModel.findByIdAndUpdate(item._id, { matchingStatus: "COMPLETED" });
    console.log(`[matchingService] Completed matching for ${type} item ${item._id}. ${scoredMatches.length} match(es) stored.`);
  } catch (err) {
    console.error(`[matchingService] runMatchingForItem failed for ${item._id}:`, err.message);
    try {
      const Model = isLost ? LostItem : FoundItem;
      await Model.findByIdAndUpdate(item._id, { matchingStatus: "FAILED" });
    } catch (_) {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. NOTIFICATION SENDER
// ─────────────────────────────────────────────────────────────────────────────

async function sendMatchNotifications(match, possibleMatchId) {
  try {
    const lostItem  = await LostItem.findById(match.lostItemId).select("ownerId title");
    const foundItem = await FoundItem.findById(match.foundItemId).select("finderId title");

    if (!lostItem || !foundItem) return;

    const scoreLabel = `${match.overallScore}% (${match.confidence.replace("_", " ")})`;

    // Notify the owner of the lost item
    await Notification.create({
      userId:        lostItem.ownerId,
      message:       `🤖 AI found a ${scoreLabel} match for your lost "${lostItem.title}". A finder reported "${foundItem.title}" — ${match.matchReason.reasonSummary}`,
      type:          "match_found",
      relatedItemId: match.foundItemId,
      itemType:      "FoundItem",
      relatedMatchId: possibleMatchId,
    });

    // Notify the finder of the found item
    await Notification.create({
      userId:        foundItem.finderId,
      message:       `🤖 AI detected a ${scoreLabel} match for your found "${foundItem.title}". The owner reported "${lostItem.title}" as lost — ${match.matchReason.reasonSummary}`,
      type:          "match_found",
      relatedItemId: match.lostItemId,
      itemType:      "LostItem",
      relatedMatchId: possibleMatchId,
    });

    console.log(`[matchingService] Notifications sent for match (score: ${match.overallScore})`);
  } catch (err) {
    console.error("[matchingService] Notification error:", err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. RECOMPUTE MATCHES — Called on item edit
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Re-run the full matching pipeline for an edited item.
 * Forces re-embedding (clears stored vector so getOrGenerateEmbedding re-calls Python).
 * Uses upsert — so existing PossibleMatch docs are updated, not duplicated.
 * Does NOT re-notify if notified=true (deduplication).
 *
 * @param {string} itemId
 * @param {"lost"|"found"} type
 */
async function recomputeMatchesForItem(itemId, type) {
  const Model = type === "lost" ? LostItem : FoundItem;
  try {
    // Clear embedding to force re-generation (description may have changed)
    await Model.findByIdAndUpdate(itemId, { embedding: [], matchingStatus: "PENDING" });
    const item = await Model.findById(itemId);
    if (!item || item.isDeleted) return;

    console.log(`[matchingService] Recomputing matches for edited ${type} item ${itemId}`);
    await runMatchingForItem(item, type);
  } catch (err) {
    console.error(`[matchingService] recomputeMatchesForItem failed for ${itemId}:`, err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. EXPIRE MATCHES — Called on item delete / status=returned
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expire all PossibleMatch records related to an item.
 * Called when an item is soft-deleted, returned, or permanently resolved.
 *
 * @param {string} itemId
 */
async function expireMatchesForItem(itemId) {
  try {
    const result = await PossibleMatch.updateMany(
      {
        $or: [{ lostItemId: itemId }, { foundItemId: itemId }],
        status: { $nin: ["EXPIRED", "RETURNED", "DISMISSED"] }, // Don't overwrite terminal states
      },
      { $set: { status: "EXPIRED" } }
    );
    console.log(`[matchingService] Expired ${result.modifiedCount} match(es) for item ${itemId}`);
  } catch (err) {
    console.error(`[matchingService] expireMatchesForItem failed for ${itemId}:`, err.message);
  }
}

module.exports = {
  runMatchingForItem,
  recomputeMatchesForItem,
  expireMatchesForItem,
};
