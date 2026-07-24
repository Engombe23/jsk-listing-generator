import { supabaseAdmin } from "./supabaseAdmin.js";
import { isWhitelisted, isUnlimited, hasPlanFeature, listingLimitForPlan } from "./planLimits.js";

const PROFILE_COLS =
  "plan, listings_used, usage_period_start, stripe_customer_id, stripe_subscription_id, subscription_status, billing_interval";

function isRpcNotDeployed(error) {
  return error?.code === "PGRST202" || /not find the function/i.test(error?.message || "");
}

// Fallback if usage_period_reset.sql isn't deployed yet — no monthly reset.
async function getOrCreateProfileFallback(userId) {
  const { data } = await supabaseAdmin.from("profiles").select(PROFILE_COLS).eq("id", userId).maybeSingle();
  if (data) return data;

  const { data: created, error } = await supabaseAdmin
    .from("profiles")
    .insert({ id: userId, plan: "free" })
    .select(PROFILE_COLS)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return created;
}

// Fetch a user's profile row, resetting listings_used if a full month has
// elapsed since usage_period_start. The reset logic lives in a single
// Postgres function (see supabase/usage_period_reset.sql) so the backend and
// the frontend's direct Supabase read (billing.js) can't drift out of sync.
export async function getOrCreateProfile(userId) {
  const { data, error } = await supabaseAdmin
    .rpc("get_or_create_profile_with_reset", { p_user_id: userId })
    .maybeSingle();

  if (!error) return data;
  if (isRpcNotDeployed(error)) return getOrCreateProfileFallback(userId);
  throw new Error(error.message);
}

// Call BEFORE generating a listing. Does not mutate usage — only answers
// "is this user allowed to generate one more right now?".
export async function canGenerateListing(userId, email) {
  if (isWhitelisted(email)) return { allowed: true, whitelisted: true };
  const profile = await getOrCreateProfile(userId);
  const limit = listingLimitForPlan(profile.plan);
  if (isUnlimited(limit)) return { allowed: true, profile };
  return { allowed: profile.listings_used < limit, profile };
}

// Call ONLY after a listing has been successfully generated and returned to
// the user — never on failure, never speculatively before the result exists.
export async function incrementListingUsage(userId, email) {
  if (isWhitelisted(email)) return; // whitelisted accounts don't accrue usage
  const { error } = await supabaseAdmin.rpc("increment_listings_used", { user_id: userId });
  if (error) {
    // Fallback if the RPC isn't deployed yet (listing_usage.sql not run) —
    // read-then-write. Slightly racier under concurrency but keeps the
    // feature working without a hard dependency on the RPC.
    const { data } = await supabaseAdmin.from("profiles").select("listings_used").eq("id", userId).maybeSingle();
    const next = (data?.listings_used || 0) + 1;
    await supabaseAdmin.from("profiles").update({ listings_used: next, updated_at: new Date().toISOString() }).eq("id", userId);
  }
}

export async function checkFeatureAccess(userId, email, feature) {
  if (isWhitelisted(email)) return { allowed: true, whitelisted: true };
  const profile = await getOrCreateProfile(userId);
  return { allowed: hasPlanFeature(profile.plan, feature), profile };
}
