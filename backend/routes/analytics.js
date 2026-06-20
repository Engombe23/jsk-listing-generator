import express from "express";
import { supabaseAdmin, supabaseAdminReady } from "../lib/supabaseAdmin.js";

const router = express.Router();

// ─── Event categories — single source of truth, mirrors frontend EVENT_CATEGORIES ──
const EVENT_CATEGORY_BY_NAME = {
  // Landing
  landing_page_viewed:       "landing",
  pricing_page_viewed:       "landing",
  signup_clicked:            "landing",
  section_viewed:            "landing",
  scroll_25:                 "landing",
  scroll_50:                 "landing",
  scroll_75:                 "landing",
  scroll_100:                "landing",
  // Signup / trial
  user_signed_up:            "signup",
  trial_started:             "signup",
  trial_expired:             "signup",
  subscription_started:      "signup",
  subscription_cancelled:    "signup",
  // Listing Generator
  listing_generation_started:"listing_generator",
  listing_generated:         "listing_generator",
  listing_generation_failed: "listing_generator",
  listing_saved:             "listing_generator",
  listing_copied:            "listing_generator",
  listing_exported_csv:      "listing_generator",
  // Smart Pricing
  ebay_search_performed:     "smart_pricing",
  price_entered:             "smart_pricing",
  price_calculated:          "smart_pricing",
  price_saved:               "smart_pricing",
  // Compatibility Checker
  compat_check_started:      "compatibility_checker",
  compat_check_performed:    "compatibility_checker",
  compat_check_failed:       "compatibility_checker",
  compat_result_compatible:    "compatibility_checker",
  compat_result_not_compatible:"compatibility_checker",
};

// Events that represent a failure/error, for the error-rate calculation.
const FAILURE_EVENTS = new Set([
  "listing_generation_failed",
  "compat_check_failed",
]);
// Events that represent an attempt (failure or success) for the same flows —
// used as the denominator for error rate.
const ATTEMPT_EVENTS = new Set([
  "listing_generation_started",
  "listing_generated",
  "listing_generation_failed",
  "compat_check_started",
  "compat_check_performed",
  "compat_check_failed",
]);

// ─── POST /api/events — ingest a single event ──────────────────────────────────
router.post("/events", async (req, res) => {
  if (!supabaseAdminReady) {
    return res.status(503).json({ error: "Analytics storage is not configured (missing SUPABASE_SERVICE_ROLE_KEY)." });
  }
  const { event_name, user_id, session_id, plan, page_url, source, metadata } = req.body || {};
  if (!event_name || typeof event_name !== "string") {
    return res.status(400).json({ error: "event_name is required" });
  }

  const event_category = EVENT_CATEGORY_BY_NAME[event_name] || null;

  const { error } = await supabaseAdmin.from("usage_events").insert({
    user_id:       user_id || null,
    session_id:    session_id || null,
    event_name,
    event_category,
    plan:          plan || null,
    page_url:      page_url || null,
    source:        source || null,
    metadata:      metadata && typeof metadata === "object" ? metadata : {},
  });

  if (error) {
    console.error("usage_events insert failed:", error.message);
    return res.status(500).json({ error: "Failed to record event" });
  }
  res.status(204).end();
});

// ─── Shared: fetch all events in range (+ optional plan filter) ──────────────
async function fetchEventsInRange({ from, to, plan }) {
  let query = supabaseAdmin
    .from("usage_events")
    .select("event_name, user_id, session_id, plan, created_at")
    .gte("created_at", from)
    .lte("created_at", to);
  if (plan) query = query.eq("plan", plan);

  // Supabase/PostgREST caps default page size — page through if a range is huge.
  const PAGE = 1000;
  let offset = 0;
  let rows = [];
  for (;;) {
    const { data, error } = await query.range(offset, offset + PAGE - 1);
    if (error) throw new Error(error.message);
    rows = rows.concat(data || []);
    if (!data || data.length < PAGE) break;
    offset += PAGE;
  }
  return rows;
}

function countBy(rows, eventName) {
  return rows.filter((r) => r.event_name === eventName).length;
}

function distinctUsers(rows, eventNames) {
  const set = new Set();
  rows.forEach((r) => {
    if (r.user_id && eventNames.includes(r.event_name)) set.add(r.user_id);
  });
  return set;
}

// Visitors = distinct sessions, not raw pageview count — most landing visits
// are anonymous (no user_id yet), so session_id is the only available identity.
function distinctSessions(rows, eventNames) {
  const set = new Set();
  rows.forEach((r) => {
    if (r.session_id && eventNames.includes(r.event_name)) set.add(r.session_id);
  });
  return set;
}

// ─── GET /api/analytics/overview ───────────────────────────────────────────────
router.get("/analytics/overview", async (req, res) => {
  if (!supabaseAdminReady) {
    return res.status(503).json({ error: "Analytics storage is not configured (missing SUPABASE_SERVICE_ROLE_KEY)." });
  }
  try {
    const now = new Date();
    const from = req.query.from || new Date(now.getTime() - 30 * 86400000).toISOString();
    const to   = req.query.to   || now.toISOString();
    const plan = req.query.plan || null;

    const rows = await fetchEventsInRange({ from, to, plan });

    const counts = {
      visitors:                    distinctSessions(rows, ["landing_page_viewed"]).size,
      landing_page_viewed:         countBy(rows, "landing_page_viewed"),
      signup_clicked:              countBy(rows, "signup_clicked"),
      new_users:                   countBy(rows, "user_signed_up"),
      trial_starts:                countBy(rows, "trial_started"),
      listings_generated:          countBy(rows, "listing_generated"),
      listings_saved:              countBy(rows, "listing_saved"),
      listings_exported_csv:       countBy(rows, "listing_exported_csv"),
      ebay_searches_performed:     countBy(rows, "ebay_search_performed"),
      prices_entered:              countBy(rows, "price_entered"),
      prices_saved:                countBy(rows, "price_saved"),
      compat_checks_performed:     countBy(rows, "compat_check_performed"),
    };

    // Activation: distinct users with trial_started who also have a listing_generated
    // (any time in range — a proper "after trial start" join needs per-user timestamps,
    // which we compute below for users present in both sets).
    const trialUserRows   = rows.filter((r) => r.event_name === "trial_started" && r.user_id);
    const listingUserRows = rows.filter((r) => r.event_name === "listing_generated" && r.user_id);
    const trialStartByUser = new Map();
    trialUserRows.forEach((r) => {
      const t = new Date(r.created_at).getTime();
      if (!trialStartByUser.has(r.user_id) || t < trialStartByUser.get(r.user_id)) {
        trialStartByUser.set(r.user_id, t);
      }
    });
    let activatedUsers = 0;
    trialStartByUser.forEach((trialTime, userId) => {
      const generatedAfter = listingUserRows.some(
        (r) => r.user_id === userId && new Date(r.created_at).getTime() >= trialTime
      );
      if (generatedAfter) activatedUsers += 1;
    });

    const failedEvents = rows.filter((r) => FAILURE_EVENTS.has(r.event_name)).length;
    const attemptedEvents = rows.filter((r) => ATTEMPT_EVENTS.has(r.event_name)).length;

    const safeDiv = (n, d) => (d > 0 ? n / d : null);

    const rates = {
      signup_click_rate:       safeDiv(counts.signup_clicked, counts.landing_page_viewed),
      signup_completion_rate:  safeDiv(counts.new_users, counts.signup_clicked),
      activation_rate:         safeDiv(activatedUsers, trialStartByUser.size),
      listing_save_rate:       safeDiv(counts.listings_saved, counts.listings_generated),
      listing_export_rate:     safeDiv(counts.listings_exported_csv, counts.listings_generated),
      smart_pricing_usage_rate:      safeDiv(counts.ebay_searches_performed, counts.new_users),
      compatibility_checker_usage_rate: safeDiv(counts.compat_checks_performed, counts.new_users),
      error_rate:              safeDiv(failedEvents, attemptedEvents),
    };

    res.json({
      range: { from, to, plan },
      kpis: {
        visitors:                  counts.visitors,
        signup_clicks:             counts.signup_clicked,
        new_users:                 counts.new_users,
        trial_starts:              counts.trial_starts,
        activated_users:           activatedUsers,
        listings_generated:        counts.listings_generated,
        listings_saved:            counts.listings_saved,
        ebay_searches_performed:   counts.ebay_searches_performed,
        prices_entered:            counts.prices_entered,
        prices_saved:              counts.prices_saved,
        compatibility_checks_performed: counts.compat_checks_performed,
        failed_events:             failedEvents,
        error_rate:                rates.error_rate,
      },
      rates,
    });
  } catch (err) {
    console.error("analytics/overview failed:", err.message);
    res.status(500).json({ error: "Failed to compute analytics overview" });
  }
});

export default router;
