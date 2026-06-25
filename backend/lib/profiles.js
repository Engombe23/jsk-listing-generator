import { supabaseAdmin } from "./supabaseAdmin.js";
import { isWhitelisted, isUnlimited, hasPlanFeature, listingLimitForPlan } from "./planLimits.js";

// Fetch a user's profile row, resetting listings_used if a full month has
// elapsed since usage_period_start. The reset logic lives in a single
// Postgres function (see supabase/usage_period_reset.sql) so the backend and
// the frontend's direct Supabase read (billing.js) can't drift out of sync.
export async function getOrCreateProfile(userId) {
  const { data, error } = await supabaseAdmin
    .rpc("get_or_create_profile_with_reset", { p_user_id: userId })
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
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
