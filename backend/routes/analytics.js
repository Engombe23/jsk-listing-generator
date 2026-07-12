import express from "express";
import { supabaseAdmin, supabaseAdminReady } from "../lib/supabaseAdmin.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

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

// Events that represent a failure/error, for the error-rate calculation and
// the "Recent failed events" table. Only events we actually instrument —
// no fabricated failure categories (no fake "eBay API error" etc).
const FAILURE_EVENTS = new Set([
  "listing_generation_failed",
  "compat_check_failed",
]);
const FAILURE_EVENT_LABELS = {
  listing_generation_failed: "Listing generation failed",
  compat_check_failed:       "Compatibility check failed",
};
const FAILURE_EVENT_IMPACT = {
  listing_generation_failed: "High",
  compat_check_failed:       "Medium",
};

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
// user_id and plan are ALWAYS server-derived — never trusted from the client.
// If a valid Bearer token is present, the verified user ID is used.
// Anonymous events (landing page, no token) are recorded with user_id = null.
router.post("/events", async (req, res) => {
  if (!supabaseAdminReady) {
    return res.status(503).json({ error: "Analytics storage is not configured (missing SUPABASE_SERVICE_ROLE_KEY)." });
  }

  const { event_name, session_id, plan: clientPlan, page_url, source, metadata } = req.body || {};
  if (!event_name || typeof event_name !== "string") {
    return res.status(400).json({ error: "event_name is required" });
  }

  // Validate event_name against the known allowlist — reject unknown events.
  if (!EVENT_CATEGORY_BY_NAME[event_name]) {
    return res.status(400).json({ error: "Unknown event_name." });
  }

  // Derive user identity from the JWT, not from the request body.
  let serverUserId = null;
  let serverPlan   = null;
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token) {
    const { data } = await supabaseAdmin.auth.getUser(token);
    if (data?.user) {
      serverUserId = data.user.id;
      // Trust the plan the authenticated client reports for their own session —
      // it's cosmetic analytics data, not an access-control decision.
      serverPlan = typeof clientPlan === "string" ? clientPlan : null;
    }
  }

  const event_category = EVENT_CATEGORY_BY_NAME[event_name];

  const { error } = await supabaseAdmin.from("usage_events").insert({
    user_id:        serverUserId,
    session_id:     session_id || null,
    event_name,
    event_category,
    plan:           serverPlan,
    page_url:       page_url || null,
    source:         source   || null,
    metadata:       metadata && typeof metadata === "object" ? metadata : {},
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

const safeDiv = (n, d) => (d > 0 ? n / d : null);
// % change between two raw numbers, null if there's no baseline to compare against.
const pctChange = (curr, prev) => (prev > 0 ? (curr - prev) / prev : (curr > 0 ? null : 0));

// ─── Core metric computation — shared by current + previous period ───────────
function computeMetrics(rows) {
  const counts = {
    visitors:                distinctSessions(rows, ["landing_page_viewed"]).size,
    landing_page_viewed:     countBy(rows, "landing_page_viewed"),
    signup_clicked:          countBy(rows, "signup_clicked"),
    new_users:               countBy(rows, "user_signed_up"),
    trial_starts:            countBy(rows, "trial_started"),
    listings_generated:      countBy(rows, "listing_generated"),
    listings_saved:          countBy(rows, "listing_saved"),
    listings_exported_csv:   countBy(rows, "listing_exported_csv"),
    ebay_searches_performed: countBy(rows, "ebay_search_performed"),
    prices_entered:          countBy(rows, "price_entered"),
    prices_saved:            countBy(rows, "price_saved"),
    compat_checks_performed: countBy(rows, "compat_check_performed"),
  };

  // Activation: distinct users with trial_started who also generated a listing
  // at/after their trial start time.
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

  const failedEvents     = rows.filter((r) => FAILURE_EVENTS.has(r.event_name)).length;
  const attemptedEvents  = rows.filter((r) => ATTEMPT_EVENTS.has(r.event_name)).length;

  const rates = {
    signup_click_rate:                safeDiv(counts.signup_clicked, counts.landing_page_viewed),
    signup_completion_rate:           safeDiv(counts.new_users, counts.signup_clicked),
    activation_rate:                  safeDiv(activatedUsers, trialStartByUser.size),
    listing_save_rate:                safeDiv(counts.listings_saved, counts.listings_generated),
    listing_export_rate:              safeDiv(counts.listings_exported_csv, counts.listings_generated),
    smart_pricing_usage_rate:         safeDiv(counts.ebay_searches_performed, counts.new_users),
    compatibility_checker_usage_rate: safeDiv(counts.compat_checks_performed, counts.new_users),
    error_rate:                       safeDiv(failedEvents, attemptedEvents),
  };

  // Funnel — step-over-step conversion (each step's rate is relative to the
  // step immediately before it, matching how funnels are normally read).
  const funnelDefs = [
    { key: "landing_page_viewed", label: "Landing page viewed",   count: counts.visitors },
    { key: "signup_clicked",      label: "Signup clicked",        count: distinctSessions(rows, ["signup_clicked"]).size },
    { key: "user_signed_up",      label: "Account created",       count: distinctUsers(rows, ["user_signed_up"]).size },
    { key: "trial_started",       label: "Trial started",         count: distinctUsers(rows, ["trial_started"]).size },
    { key: "listing_generated",   label: "First listing generated", count: distinctUsers(rows, ["listing_generated"]).size },
    { key: "listing_saved",       label: "Listing saved",         count: distinctUsers(rows, ["listing_saved"]).size },
    { key: "listing_exported_csv",label: "Listing exported",      count: distinctUsers(rows, ["listing_exported_csv"]).size },
    { key: "subscription_started",label: "Paid plan started",     count: distinctUsers(rows, ["subscription_started"]).size },
  ];
  const funnel = funnelDefs.map((step, i) => ({
    ...step,
    rate: i === 0 ? 1 : safeDiv(step.count, funnelDefs[i - 1].count),
  }));
  const overallConversion = safeDiv(funnel[funnel.length - 1].count, funnel[0].count);

  // Feature usage split — relative to Listing Generator (the core feature).
  const featureUsage = [
    { key: "listing_generator",      label: "Listing Generator",      count: counts.listings_generated },
    { key: "smart_pricing",          label: "Smart Pricing",          count: counts.ebay_searches_performed },
    { key: "compatibility_checker",  label: "Compatibility Checker",  count: counts.compat_checks_performed },
    { key: "price_calculator",       label: "Price Calculator",       count: counts.prices_entered },
    { key: "csv_export",             label: "CSV Export",             count: counts.listings_exported_csv },
  ].map((f) => ({ ...f, pctOfCore: safeDiv(f.count, counts.listings_generated) }));

  return { counts, rates, activatedUsers, trialUsers: trialStartByUser.size, failedEvents, funnel, overallConversion, featureUsage };
}

// Daily bucketed counts for sparklines / line chart.
function dailySeries(rows, eventNames) {
  const byDay = new Map();
  rows.forEach((r) => {
    if (!eventNames.includes(r.event_name)) return;
    const day = r.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + 1);
  });
  return [...byDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, count]) => ({ date, count }));
}

function mergeSeries(seriesA, keyA, seriesB, keyB) {
  const days = new Set([...seriesA.map((d) => d.date), ...seriesB.map((d) => d.date)]);
  const aMap = new Map(seriesA.map((d) => [d.date, d.count]));
  const bMap = new Map(seriesB.map((d) => [d.date, d.count]));
  return [...days].sort().map((date) => ({ date, [keyA]: aMap.get(date) || 0, [keyB]: bMap.get(date) || 0 }));
}

// ─── GET /api/analytics/overview ───────────────────────────────────────────────
router.get("/analytics/overview", requireAdmin, async (req, res) => {
  if (!supabaseAdminReady) {
    return res.status(503).json({ error: "Analytics storage is not configured (missing SUPABASE_SERVICE_ROLE_KEY)." });
  }
  try {
    const now  = new Date();
    const from = req.query.from || new Date(now.getTime() - 30 * 86400000).toISOString();
    const to   = req.query.to   || now.toISOString();
    const plan = req.query.plan || null;

    // Previous period of equal length, immediately before `from` — for % change badges.
    const spanMs = new Date(to).getTime() - new Date(from).getTime();
    const prevFrom = new Date(new Date(from).getTime() - spanMs).toISOString();
    const prevTo   = from;

    const [rows, prevRows] = await Promise.all([
      fetchEventsInRange({ from, to, plan }),
      fetchEventsInRange({ from: prevFrom, to: prevTo, plan }),
    ]);

    const m     = computeMetrics(rows);
    const prevM = computeMetrics(prevRows);

    const visitorSeries = dailySeries(rows, ["landing_page_viewed"]);
    const signupSeries  = dailySeries(rows, ["signup_clicked"]);
    const trialSeries   = dailySeries(rows, ["trial_started"]);
    const activatedSeries = dailySeries(rows, ["listing_generated"]); // proxy for activation trend
    const generatedVsSaved = mergeSeries(
      dailySeries(rows, ["listing_generated"]), "generated",
      dailySeries(rows, ["listing_saved"]),     "saved"
    );

    res.json({
      range: { from, to, plan },
      kpis: {
        visitors:                       m.counts.visitors,
        signup_clicks:                  m.counts.signup_clicked,
        new_users:                      m.counts.new_users,
        trial_starts:                   m.counts.trial_starts,
        activated_users:                m.activatedUsers,
        listings_generated:             m.counts.listings_generated,
        listings_saved:                 m.counts.listings_saved,
        ebay_searches_performed:        m.counts.ebay_searches_performed,
        prices_entered:                 m.counts.prices_entered,
        prices_saved:                   m.counts.prices_saved,
        compatibility_checks_performed: m.counts.compat_checks_performed,
        failed_events:                  m.failedEvents,
        error_rate:                     m.rates.error_rate,
      },
      deltas: {
        visitors:                pctChange(m.counts.visitors, prevM.counts.visitors),
        signup_clicks:           pctChange(m.counts.signup_clicked, prevM.counts.signup_clicked),
        trial_starts:            pctChange(m.counts.trial_starts, prevM.counts.trial_starts),
        activated_users:         pctChange(m.activatedUsers, prevM.activatedUsers),
        listings_generated:      pctChange(m.counts.listings_generated, prevM.counts.listings_generated),
        listings_saved:          pctChange(m.counts.listings_saved, prevM.counts.listings_saved),
        ebay_searches_performed: pctChange(m.counts.ebay_searches_performed, prevM.counts.ebay_searches_performed),
        compatibility_checks_performed: pctChange(m.counts.compat_checks_performed, prevM.counts.compat_checks_performed),
      },
      rates: m.rates,
      rateDeltas: {
        signup_click_rate:                pctChange(m.rates.signup_click_rate, prevM.rates.signup_click_rate),
        signup_completion_rate:           pctChange(m.rates.signup_completion_rate, prevM.rates.signup_completion_rate),
        activation_rate:                  pctChange(m.rates.activation_rate, prevM.rates.activation_rate),
        listing_save_rate:                pctChange(m.rates.listing_save_rate, prevM.rates.listing_save_rate),
        listing_export_rate:              pctChange(m.rates.listing_export_rate, prevM.rates.listing_export_rate),
        smart_pricing_usage_rate:         pctChange(m.rates.smart_pricing_usage_rate, prevM.rates.smart_pricing_usage_rate),
        compatibility_checker_usage_rate: pctChange(m.rates.compatibility_checker_usage_rate, prevM.rates.compatibility_checker_usage_rate),
        error_rate:                       pctChange(m.rates.error_rate, prevM.rates.error_rate),
      },
      funnel: m.funnel,
      overallConversion: m.overallConversion,
      featureUsage: m.featureUsage,
      series: {
        visitors:   visitorSeries,
        signups:    signupSeries,
        trials:     trialSeries,
        activated:  activatedSeries,
        generatedVsSaved,
      },
    });
  } catch (err) {
    console.error("analytics/overview failed:", err.message);
    res.status(500).json({ error: "Failed to compute analytics overview" });
  }
});

// ─── GET /api/analytics/action-tables ──────────────────────────────────────────
router.get("/analytics/action-tables", requireAdmin, async (req, res) => {
  if (!supabaseAdminReady) {
    return res.status(503).json({ error: "Analytics storage is not configured (missing SUPABASE_SERVICE_ROLE_KEY)." });
  }
  try {
    const now  = new Date();
    const from = req.query.from || new Date(now.getTime() - 30 * 86400000).toISOString();
    const to   = req.query.to   || now.toISOString();
    const plan = req.query.plan || null;

    const rows = await fetchEventsInRange({ from, to, plan });

    // Per-user last-seen / plan, from any event in range.
    const lastSeenByUser = new Map();
    const planByUser = new Map();
    rows.forEach((r) => {
      if (!r.user_id) return;
      const t = new Date(r.created_at).getTime();
      if (!lastSeenByUser.has(r.user_id) || t > lastSeenByUser.get(r.user_id)) {
        lastSeenByUser.set(r.user_id, t);
        planByUser.set(r.user_id, r.plan || "free");
      }
    });

    const signedUpUsers   = distinctUsers(rows, ["user_signed_up"]);
    const generatedUsers  = distinctUsers(rows, ["listing_generated"]);
    const savedOrExported = distinctUsers(rows, ["listing_saved", "listing_exported_csv"]);

    const signedUpAt = new Map();
    rows.filter((r) => r.event_name === "user_signed_up" && r.user_id).forEach((r) => {
      signedUpAt.set(r.user_id, r.created_at);
    });
    const generatedAt = new Map();
    rows.filter((r) => r.event_name === "listing_generated" && r.user_id).forEach((r) => {
      const t = new Date(r.created_at).getTime();
      if (!generatedAt.has(r.user_id) || t < new Date(generatedAt.get(r.user_id)).getTime()) {
        generatedAt.set(r.user_id, r.created_at);
      }
    });

    const noListingIds = [...signedUpUsers].filter((id) => !generatedUsers.has(id)).slice(0, 10);
    const noSaveIds     = [...generatedUsers].filter((id) => !savedOrExported.has(id)).slice(0, 10);

    const lookupEmail = async (userId) => {
      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
        return data?.user?.email || userId;
      } catch {
        return userId;
      }
    };

    const usersNoListing = await Promise.all(noListingIds.map(async (id) => ({
      user:      await lookupEmail(id),
      signed_up: signedUpAt.get(id) || null,
      last_seen: lastSeenByUser.get(id) ? new Date(lastSeenByUser.get(id)).toISOString() : null,
      plan:      planByUser.get(id) || "free",
    })));

    const usersNoSave = await Promise.all(noSaveIds.map(async (id) => ({
      user:      await lookupEmail(id),
      generated: generatedAt.get(id) || null,
      last_seen: lastSeenByUser.get(id) ? new Date(lastSeenByUser.get(id)).toISOString() : null,
      plan:      planByUser.get(id) || "free",
    })));

    const failedByName = new Map();
    rows.filter((r) => FAILURE_EVENTS.has(r.event_name)).forEach((r) => {
      const entry = failedByName.get(r.event_name) || { count: 0, last: r.created_at };
      entry.count += 1;
      if (r.created_at > entry.last) entry.last = r.created_at;
      failedByName.set(r.event_name, entry);
    });
    const recentFailedEvents = [...failedByName.entries()]
      .map(([name, v]) => ({
        event:          FAILURE_EVENT_LABELS[name] || name,
        count:          v.count,
        last_occurred:  v.last,
        impact:         FAILURE_EVENT_IMPACT[name] || "Low",
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      usersNoListing,
      usersNoListingTotal: signedUpUsers.size - generatedUsers.size > 0 ? [...signedUpUsers].filter((id) => !generatedUsers.has(id)).length : 0,
      usersNoSave,
      usersNoSaveTotal: [...generatedUsers].filter((id) => !savedOrExported.has(id)).length,
      recentFailedEvents,
    });
  } catch (err) {
    console.error("analytics/action-tables failed:", err.message);
    res.status(500).json({ error: "Failed to compute action tables" });
  }
});

// ─── GET /api/analytics/raw-events ─────────────────────────────────────────────
// Metadata-rich event rows for the selected range — powers the per-section
// breakdowns (CTA location, search queries, part numbers, etc.) that are too
// bespoke to pre-aggregate server-side. Capped to keep payloads reasonable;
// this is an internal admin tool, not a high-traffic public endpoint.
const RAW_EVENTS_CAP = 8000;

router.get("/analytics/raw-events", requireAdmin, async (req, res) => {
  if (!supabaseAdminReady) {
    return res.status(503).json({ error: "Analytics storage is not configured (missing SUPABASE_SERVICE_ROLE_KEY)." });
  }
  try {
    const now  = new Date();
    const from = req.query.from || new Date(now.getTime() - 30 * 86400000).toISOString();
    const to   = req.query.to   || now.toISOString();
    const plan = req.query.plan || null;

    let query = supabaseAdmin
      .from("usage_events")
      .select("event_name, event_category, user_id, session_id, plan, page_url, source, metadata, created_at")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: true })
      .limit(RAW_EVENTS_CAP);
    if (plan) query = query.eq("plan", plan);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    res.json({ events: data || [], truncated: (data || []).length >= RAW_EVENTS_CAP });
  } catch (err) {
    console.error("analytics/raw-events failed:", err.message);
    res.status(500).json({ error: "Failed to fetch raw events" });
  }
});

export default router;
