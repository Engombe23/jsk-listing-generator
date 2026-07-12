// Enforcement-critical plan data is sourced from shared/planConfig.js so that
// frontend and backend always agree on limits and feature tiers.
import {
  planListingLimits as PLAN_LISTING_LIMITS,
  planRank as PLAN_RANK,
  featureMinTier as FEATURE_MIN_TIER,
} from "../../shared/planConfig.js";

// Backend-only — separate from ADMIN_EMAILS (admin analytics dashboard
// access). These accounts bypass all plan restrictions, listing limits, and
// feature gates entirely, regardless of their stored `plan`.
export const WHITELISTED_EMAILS = [
  "aaron@partlister.app",
  "engombe@partlister.app",
];

export { PLAN_LISTING_LIMITS, PLAN_RANK, FEATURE_MIN_TIER };

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
