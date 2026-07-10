/**
 * categoryWeights.js — Phase 5 AI Smart Matching Engine
 *
 * Category-specific field weights for structured similarity scoring.
 * Total weight per category always sums to 100.
 *
 * Field names match the keys used in verificationData (set by VERIFICATION_FIELDS in categories.ts).
 *
 * Scoring rubric per field (applied by matchingService):
 *   exact match  → full weight
 *   partial match → half weight
 *   mismatch      → 0
 */

const CATEGORY_WEIGHTS = {
  "Electronics": {
    brand: 25,        // Strong identifier — Apple vs Samsung is decisive
    model: 20,        // Model number is very specific
    color: 15,
    accessories: 15,  // Specific cables / cases help a lot
    specialMarks: 15, // Screen scratches, stickers
    serial: 10,       // IMEI / serial — rare but conclusive when present
  },

  "Wallets & Money": {
    color: 30,        // Color is the first thing noticed
    material: 25,     // Leather vs fabric is distinct
    cards: 30,        // Specific cards inside is highly identifying
    cash: 15,         // Approximate amount
  },

  "Bags": {
    color: 25,
    brand: 25,        // Jansport vs Herschel is easily distinguishable
    contents: 25,     // What's inside is the best proof of ownership
    specialMarks: 15, // Broken zipper, keychains
    size: 10,
  },

  "Keys": {
    keychain: 40,     // Keychain is the most distinctive feature
    specialMarks: 35,
    count: 25,        // Number of keys on ring
  },

  "Stationery": {
    color: 25,
    brand: 20,
    contents: 35,     // List of pens, pencils inside
    specialMarks: 20,
  },

  "ID & Documents": {
    documentName: 40, // Name on the document — highly conclusive
    documentNumber: 40,
    issuingInstitution: 20,
  },

  "Clothing": {
    color: 30,
    brand: 25,
    size: 25,
    specialMarks: 20,
  },

  "Jewelry & Accessories": {
    type: 25,         // Material — gold/silver/beaded
    color: 25,
    engraving: 30,    // Custom engraving is near-conclusive
    specialMarks: 20,
  },

  "Books": {
    title: 40,        // Book title is the primary identifier
    author: 30,
    specialMarks: 30, // Name written inside, highlighted pages
  },

  "Water Bottles & Containers": {
    color: 30,
    brand: 35,
    specialMarks: 35, // Stickers are very identifying for bottles
  },

  "Sports Equipment": {
    sportType: 30,
    brand: 35,
    color: 35,
  },

  "Vehicles": {
    color: 30,
    brand: 35,
    specialMarks: 35,
  },

  "Medical Items": {
    type: 35,
    color: 35,
    brand: 30,
  },

  "Toys & Games": {
    gameName: 40,
    color: 30,
    specialMarks: 30,
  },

  "Miscellaneous": {
    color: 35,
    brand: 30,
    specialMarks: 35,
  },
};

/**
 * Default fallback weights for categories not explicitly defined.
 * Balanced distribution.
 */
const DEFAULT_WEIGHTS = {
  color: 35,
  brand: 35,
  specialMarks: 30,
};

/**
 * Retrieve the field weights for a given category.
 * @param {string} category
 * @returns {Object} field → weight mapping (sum = 100)
 */
function getWeightsForCategory(category) {
  return CATEGORY_WEIGHTS[category] || DEFAULT_WEIGHTS;
}

module.exports = { getWeightsForCategory };
