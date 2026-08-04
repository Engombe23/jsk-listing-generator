// Enforcement-critical values sourced from shared/planConfig.js so that
// frontend and backend always agree. The @shared alias is set in vite.config.js.
import {
  planListingLimits as PLAN_LISTING_LIMITS,
  planRank as PLAN_RANK,
  featureMinTier as _FEATURE_MIN_TIER,
} from "@shared/planConfig.js";

export { PLAN_RANK, PLAN_LISTING_LIMITS };


export const PAID_PLAN_KEYS = ["lite", "growth", "scale"];
export const BILLING_INTERVALS = ["monthly", "annual"];

export const PLANS = {
  lite: {
    key: "lite",
    name: "Lite",
    monthlyPrice: 19,
    tagline: "For occasional sellers and smaller inventories.",
    listings: "50 listings / month",
    features: [
      "Listing Generator",
      "Price Calculator",
      "Seller Preferences",
      "Export Listings to CSV",
      "Saved Listings",
    ],
  },
  growth: {
    key: "growth",
    name: "Growth",
    monthlyPrice: 49,
    tagline: "For growing automotive businesses.",
    listings: "200 listings / month",
    features: [
      "Everything in Lite",
      "Compatibility Checker",
      "Smart Pricing",
      "Priority Support",
    ],
  },
  scale: {
    key: "scale",
    name: "Scale",
    monthlyPrice: 99,
    tagline: "For larger operations and teams.",
    listings: "Unlimited listings",
    features: [
      "Everything in Growth",
      "Bulk Listing Generation",
      "Bulk CSV Export",
      "Priority Support",
      "Early Access Features",
    ],
  },
};

export function isValidPaidPlan(plan, interval) {
  return PAID_PLAN_KEYS.includes(plan) && BILLING_INTERVALS.includes(interval);
}

export function getPlan(planKey) {
  return PLANS[planKey] || null;
}

export function getDisplayPrice(planKey, interval) {
  const plan = getPlan(planKey);
  if (!plan) return null;
  const amount = interval === "annual"
    ? Math.round(plan.monthlyPrice * 0.8)
    : plan.monthlyPrice;
  return `£${amount}`;
}

export function getBillingLabel(interval) {
  return interval === "annual" ? "Billed annually" : "Billed monthly";
}

export function checkoutSearchParams(plan, interval) {
  return new URLSearchParams({ plan, interval }).toString();
}

export function hasActiveSubscription(profile) {
  const active = new Set(["active", "trialing", "past_due"]);
  return Boolean(
    profile?.stripe_subscription_id && active.has(profile.subscription_status)
  );
}

export const PENDING_CHECKOUT_KEY = "jsk_pending_checkout";

export function savePendingCheckout(plan, interval) {
  try {
    localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify({ plan, interval }));
  } catch { /* ignore */ }
}

export function loadPendingCheckout() {
  try {
    const raw = localStorage.getItem(PENDING_CHECKOUT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingCheckout() {
  try {
    localStorage.removeItem(PENDING_CHECKOUT_KEY);
  } catch { /* ignore */ }
}

/** Minimum paid tier required for each gated capability. */
export const FEATURE_MIN_TIER = {
  ..._FEATURE_MIN_TIER,
  prioritySupport: "growth", // display-only; not in shared enforcement config
};

export function planRank(plan) {
  return PLAN_RANK[plan] ?? 0;
}

export function planMeetsTier(userPlan, requiredTier) {
  return planRank(userPlan) >= planRank(requiredTier);
}

export function hasPlanFeature(plan, feature) {
  const required = FEATURE_MIN_TIER[feature];
  if (!required) return false;
  return planMeetsTier(plan, required);
}

export function getListingLimit(plan) {
  if (plan in PLAN_LISTING_LIMITS) return PLAN_LISTING_LIMITS[plan];
  return 0;
}

export function getUpgradeTierForFeature(feature) {
  return FEATURE_MIN_TIER[feature] || "growth";
}

export function getNextPlan(plan) {
  if (plan === "free" || plan === "lite") return "growth";
  if (plan === "growth") return "scale";
  return null;
}

export function resolvePendingCheckout({ planFromUrl, intervalFromUrl, userMetadata } = {}) {
  if (isValidPaidPlan(planFromUrl, intervalFromUrl)) {
    return { plan: planFromUrl, interval: intervalFromUrl };
  }

  const metaPlan = userMetadata?.pending_plan;
  const metaInterval = userMetadata?.pending_interval || "monthly";
  if (isValidPaidPlan(metaPlan, metaInterval)) {
    return { plan: metaPlan, interval: metaInterval };
  }

  const fromStorage = loadPendingCheckout();
  if (fromStorage && isValidPaidPlan(fromStorage.plan, fromStorage.interval)) {
    return fromStorage;
  }

  return null;
}
