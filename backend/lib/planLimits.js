// Server-side mirror of frontend/src/lib/plans.js — kept in sync manually.
// The frontend values are the source of truth for what users see; this file
// is what actually gets ENFORCED, since nothing client-side can be trusted.

// Backend-only — separate from ADMIN_EMAILS (admin analytics dashboard
// access). These accounts bypass all plan restrictions, listing limits, and
// feature gates entirely, regardless of their stored `plan`.
export const WHITELISTED_EMAILS = [
  "aaron@partlister.app",
  "engombe@partlister.app",
];

// null = unlimited (Scale plan). Mirrors PLAN_LISTING_LIMITS in plans.js.
export const PLAN_LISTING_LIMITS = {
  free:   10,
  lite:   50,
  growth: 200,
  scale:  null,
};

export const PLAN_RANK = { free: 0, lite: 1, growth: 2, scale: 3 };

// Mirrors FEATURE_MIN_TIER in plans.js.
export const FEATURE_MIN_TIER = {
  compatibilityChecker: "growth",
  smartPricing:         "growth",
  bulkListingGeneration:"scale",
  bulkCsvExport:        "scale",
};

export function isWhitelisted(email) {
  return !!email && WHITELISTED_EMAILS.includes(email.toLowerCase());
}

export function listingLimitForPlan(plan) {
  return PLAN_LISTING_LIMITS[(plan || "free").toLowerCase()] ?? 0;
}

export function isUnlimited(listingLimit) {
  return listingLimit === null || listingLimit === -1;
}

export function planRank(plan) {
  return PLAN_RANK[(plan || "free").toLowerCase()] ?? 0;
}

export function planMeetsTier(plan, requiredTier) {
  return planRank(plan) >= planRank(requiredTier);
}

export function hasPlanFeature(plan, feature) {
  const required = FEATURE_MIN_TIER[feature];
  if (!required) return false;
  return planMeetsTier(plan, required);
}
