import { supabaseAdmin } from "./supabaseAdmin.js";
import { isWhitelisted, isUnlimited, hasPlanFeature, listingLimitForPlan } from "./planLimits.js";

// Fetch a user's profile row. The signup trigger (see supabase/profiles.sql)
// creates this automatically, but fall back to creating a default Free row
// defensively in case it's ever missing (e.g. accounts created before the
// trigger existed).
export async function getOrCreateProfile(userId) {
  const { data: existing, error: selectErr } = await supabaseAdmin
    .from("profiles")
    .select("plan, listings_used")
    .eq("id", userId)
    .maybeSingle();

  if (selectErr) throw new Error(selectErr.message);
  if (existing) return existing;

  const defaults = { id: userId, plan: "free", listings_used: 0 };
  const { data: created, error: insertErr } = await supabaseAdmin
    .from("profiles")
    .insert(defaults)
    .select("plan, listings_used")
    .single();

  if (insertErr) throw new Error(insertErr.message);
  return created;
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
