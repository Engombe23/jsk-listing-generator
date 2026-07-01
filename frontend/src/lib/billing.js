import { supabase } from "./supabaseClient";
import { getPlan } from "./plans";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

let cachedPlan = "free";
let cachedProfile = null;

export function getCachedPlan() {
  return cachedPlan;
}

export function getCachedProfile() {
  return cachedProfile;
}

export async function refreshUserPlan(userId) {
  if (!userId) {
    cachedPlan = "free";
    cachedProfile = null;
    return cachedPlan;
  }

  // Goes through the same Postgres function the backend uses for limit
  // checks (get_or_create_profile_with_reset) instead of a raw select, so
  // the usage shown here can never drift from what's actually enforced —
  // in particular, this is what resets listings_used once a billing month
  // has elapsed (see supabase/usage_period_reset.sql).
  const { data, error } = await supabase
    .rpc("get_or_create_profile_with_reset", { p_user_id: userId })
    .maybeSingle();

  if (error) {
    const rpcMissing =
      error.code === "PGRST202" || /not find the function/i.test(error.message || "");
    if (rpcMissing) {
      // Fallback if usage_period_reset.sql isn't deployed yet — no monthly reset.
      const { data: fallback, error: selectErr } = await supabase
        .from("profiles")
        .select(
          "plan, listings_used, usage_period_start, stripe_customer_id, stripe_subscription_id, subscription_status, billing_interval"
        )
        .eq("id", userId)
        .maybeSingle();
      if (!selectErr && fallback) {
        cachedProfile = fallback;
        cachedPlan = fallback.plan || "free";
        return cachedPlan;
      }
    }
    console.warn("[billing] profile fetch failed:", error.message);
    return cachedPlan;
  }

  cachedProfile = data;
  cachedPlan = data?.plan || "free";
  return cachedPlan;
}

export async function createCheckoutSession({ plan, interval, userId, email }) {
  const res = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, interval, userId, email }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Checkout failed");
  return data;
}

export async function redirectToStripeCheckout({ plan, interval, userId, email }) {
  const { url } = await createCheckoutSession({ plan, interval, userId, email });
  if (url) window.location.href = url;
  else throw new Error("No checkout URL returned");
}

export async function upgradeSubscription({ plan, interval, userId }) {
  const res = await fetch(`${API_URL}/api/stripe/upgrade-subscription`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, interval, userId }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upgrade failed");
  return data;
}

export async function syncCheckoutSession({ sessionId, userId }) {
  const res = await fetch(`${API_URL}/api/stripe/sync-checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, userId }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not sync checkout session");
  return data;
}

export async function openBillingPortal(customerId) {
  const res = await fetch(`${API_URL}/api/stripe/create-portal-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerId }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Billing portal failed");
  return data;
}

export function formatPlanLabel(plan) {
  if (!plan || plan === "free") return "Free";
  return getPlan(plan)?.name || plan.charAt(0).toUpperCase() + plan.slice(1);
}
