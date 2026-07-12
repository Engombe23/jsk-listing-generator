// Single source of truth for plan enforcement values.
// Imported by both backend/lib/planLimits.js and frontend/src/lib/plans.js
// so changes here propagate to both sides automatically.

export const planListingLimits = {
  free:   10,
  lite:   50,
  growth: 200,
  scale:  null, // null = unlimited
};

export const planRank = {
  free:   0,
  lite:   1,
  growth: 2,
  scale:  3,
};

export const featureMinTier = {
  compatibilityChecker:  "growth",
  smartPricing:          "growth",
  bulkListingGeneration: "scale",
  bulkCsvExport:         "scale",
};
