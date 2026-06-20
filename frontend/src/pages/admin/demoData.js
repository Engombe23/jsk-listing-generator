// Demo dataset for the analytics dashboard — used only when explicitly enabled
// via the "Enable demo data" toggle on an empty real dataset. Lets the layout
// be designed/reviewed before real traffic exists. Never used silently.

function fakeDailySeries(days, baseGenerated, baseSaved) {
  const out = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const wobble = Math.sin(i / 2.3) * 0.25 + Math.random() * 0.2;
    out.push({
      date: d.toISOString().slice(0, 10),
      generated: Math.max(0, Math.round(baseGenerated * (1 + wobble))),
      saved: Math.max(0, Math.round(baseSaved * (1 + wobble * 0.9))),
    });
  }
  return out;
}

function fakeSparkline(days, base) {
  const out = [];
  for (let i = 0; i < days; i++) {
    out.push({ date: i, count: Math.max(0, Math.round(base * (0.7 + Math.sin(i / 2) * 0.2 + Math.random() * 0.25))) });
  }
  return out;
}

export const DEMO_OVERVIEW = {
  kpis: {
    visitors: 48732, signup_clicks: 6842, new_users: 2156, trial_starts: 1842,
    activated_users: 784, listings_generated: 1204, listings_saved: 936,
    ebay_searches_performed: 3926, prices_entered: 438, prices_saved: 0,
    compatibility_checks_performed: 2316, failed_events: 68, error_rate: 0.021,
  },
  deltas: {
    visitors: 0.187, signup_clicks: 0.223, trial_starts: 0.154, activated_users: 0.198,
    listings_generated: 0.162, listings_saved: 0.189, ebay_searches_performed: 0.214,
    compatibility_checks_performed: 0.146,
  },
  rates: {
    signup_click_rate: 0.140, signup_completion_rate: 0.315, activation_rate: 0.854,
    listing_save_rate: 0.777, listing_export_rate: 0.654, smart_pricing_usage_rate: 0.328,
    compatibility_checker_usage_rate: 0.286, error_rate: 0.021,
  },
  rateDeltas: {
    signup_click_rate: 0.223, signup_completion_rate: -0.056, activation_rate: 0.039,
    listing_save_rate: 0.062, listing_export_rate: 0.021, smart_pricing_usage_rate: 0.047,
    compatibility_checker_usage_rate: -0.013, error_rate: 0.006,
  },
  funnel: [
    { key: "landing_page_viewed", label: "Landing page viewed",     count: 48732, rate: 1 },
    { key: "signup_clicked",      label: "Signup clicked",          count: 6842,  rate: 0.140 },
    { key: "user_signed_up",      label: "Account created",         count: 2156,  rate: 0.315 },
    { key: "trial_started",       label: "Trial started",           count: 1842,  rate: 0.854 },
    { key: "listing_generated",   label: "First listing generated", count: 1204,  rate: 0.654 },
    { key: "listing_saved",       label: "Listing saved",           count: 936,   rate: 0.777 },
    { key: "listing_exported_csv",label: "Listing exported",        count: 612,   rate: 0.654 },
    { key: "subscription_started",label: "Paid plan started",      count: 184,   rate: 0.301 },
  ],
  overallConversion: 0.0038,
  featureUsage: [
    { key: "listing_generator",     label: "Listing Generator",     count: 1204, pctOfCore: 1 },
    { key: "smart_pricing",         label: "Smart Pricing",         count: 789,  pctOfCore: 0.655 },
    { key: "compatibility_checker", label: "Compatibility Checker", count: 662,  pctOfCore: 0.550 },
    { key: "price_calculator",      label: "Price Calculator",      count: 438,  pctOfCore: 0.364 },
    { key: "csv_export",            label: "CSV Export",            count: 612,  pctOfCore: 0.508 },
  ],
  series: {
    visitors:  fakeSparkline(30, 1600),
    signups:   fakeSparkline(30, 230),
    trials:    fakeSparkline(30, 60),
    activated: fakeSparkline(30, 26),
    generatedVsSaved: fakeDailySeries(30, 40, 31),
  },
};

export const DEMO_ACTION_TABLES = {
  usersNoListing: [
    { user: "jason77@gmail.com",        signed_up: "2026-05-18", last_seen: "2026-05-20", plan: "Free" },
    { user: "sarah.mills@outlook.com",  signed_up: "2026-05-17", last_seen: "2026-05-19", plan: "Free" },
    { user: "david.kim@gmail.com",      signed_up: "2026-05-16", last_seen: "2026-05-18", plan: "Free" },
    { user: "matthewj@icloud.com",      signed_up: "2026-05-15", last_seen: "2026-05-17", plan: "Free" },
    { user: "olivia.brown@hotmail.com", signed_up: "2026-05-14", last_seen: "2026-05-16", plan: "Free" },
  ],
  usersNoListingTotal: 856,
  usersNoSave: [
    { user: "steven.lee@gmail.com",   generated: "2026-05-20", last_seen: "2026-05-20", plan: "Free" },
    { user: "amy.johnson@yahoo.com",  generated: "2026-05-19", last_seen: "2026-05-19", plan: "Free" },
    { user: "peter.smith@live.com",   generated: "2026-05-18", last_seen: "2026-05-18", plan: "Pro Trial" },
    { user: "nicole.w@icloud.com",    generated: "2026-05-18", last_seen: "2026-05-18", plan: "Free" },
    { user: "tom.harrison@gmail.com", generated: "2026-05-17", last_seen: "2026-05-17", plan: "Pro Trial" },
  ],
  usersNoSaveTotal: 523,
  recentFailedEvents: [
    { event: "eBay API error (search)",      count: 32, last_occurred: "2026-05-20T14:21:00Z", impact: "High" },
    { event: "CSV export failed",            count: 18, last_occurred: "2026-05-20T13:47:00Z", impact: "Medium" },
    { event: "Image upload failed",          count: 12, last_occurred: "2026-05-20T13:12:00Z", impact: "Medium" },
    { event: "Compatibility check error",    count: 9,  last_occurred: "2026-05-20T12:58:00Z", impact: "Low" },
    { event: "Pricing service timeout",      count: 7,  last_occurred: "2026-05-20T12:31:00Z", impact: "Low" },
  ],
};

// ─── Synthetic raw event log — backs the per-section breakdowns in demo mode ──
function makeId() { return Math.random().toString(36).slice(2, 10); }
function randPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randTimeInLastDays(days) {
  return new Date(Date.now() - Math.random() * days * 86400000).toISOString();
}

const CTA_LOCATIONS = ["hero", "navbar", "pricing_section", "footer", "how_it_works", "final_cta"];
const SECTIONS_VIEWED = ["hero", "problem", "how_it_works", "features", "smart_pricing", "who_its_for", "pricing", "faq", "final_cta"];
const PART_NUMBERS = ["AOP858", "LR002465", "04D3601ACA", "JDE36769", "LR073640", "GR-1234", "BGA CH4205A"];
const SEARCH_QUERIES = ["timing belt kit", "head gasket set", "brake disc front", "suspension arm", "radiator", "oil filter"];
const CONDITIONS = ["new", "used", "remanufactured"];

function buildDemoRawEvents() {
  const events = [];
  const userIds = Array.from({ length: 40 }, () => makeId());
  const sessionIds = Array.from({ length: 200 }, () => makeId());

  // Landing + CTA events
  sessionIds.forEach((sid) => {
    events.push({ event_name: "landing_page_viewed", session_id: sid, user_id: null, plan: null, created_at: randTimeInLastDays(30), metadata: {} });
    if (Math.random() < 0.4) {
      SECTIONS_VIEWED.forEach((s) => {
        if (Math.random() < 0.6) events.push({ event_name: "section_viewed", session_id: sid, user_id: null, plan: null, created_at: randTimeInLastDays(30), metadata: { section: s } });
      });
    }
    [25, 50, 75, 100].forEach((pct, i) => {
      if (Math.random() < 0.7 - i * 0.15) {
        events.push({ event_name: `scroll_${pct}`, session_id: sid, user_id: null, plan: null, created_at: randTimeInLastDays(30), metadata: { percent: pct } });
      }
    });
    if (Math.random() < 0.14) {
      events.push({ event_name: "signup_clicked", session_id: sid, user_id: null, plan: null, created_at: randTimeInLastDays(30), metadata: { cta_location: randPick(CTA_LOCATIONS) } });
    }
  });

  // Signup / trial / product usage per user
  userIds.forEach((uid) => {
    const signupTime = randTimeInLastDays(30);
    events.push({ event_name: "user_signed_up", session_id: makeId(), user_id: uid, plan: "free", created_at: signupTime, metadata: {} });
    events.push({ event_name: "trial_started", session_id: makeId(), user_id: uid, plan: "free", created_at: signupTime, metadata: {} });

    const genCount = Math.random() < 0.55 ? Math.ceil(Math.random() * 4) : 0;
    for (let i = 0; i < genCount; i++) {
      const t = randTimeInLastDays(28);
      const part = randPick(PART_NUMBERS);
      events.push({ event_name: "listing_generation_started", session_id: makeId(), user_id: uid, plan: "free", created_at: t, metadata: { part_number: part, source: "listing_generator" } });
      if (Math.random() < 0.9) {
        events.push({ event_name: "listing_generated", session_id: makeId(), user_id: uid, plan: "free", created_at: t, metadata: { part_number: part, generation_time_ms: Math.round(1500 + Math.random() * 4000), source: "listing_generator" } });
        if (Math.random() < 0.78) events.push({ event_name: "listing_saved", session_id: makeId(), user_id: uid, plan: "free", created_at: t, metadata: { part_number: part } });
        if (Math.random() < 0.5)  events.push({ event_name: "listing_copied", session_id: makeId(), user_id: uid, plan: "free", created_at: t, metadata: { part_number: part, copy_type: "html" } });
        if (Math.random() < 0.5)  events.push({ event_name: "listing_exported_csv", session_id: makeId(), user_id: uid, plan: "free", created_at: t, metadata: { row_count: Math.ceil(Math.random() * 5) } });
      } else {
        events.push({ event_name: "listing_generation_failed", session_id: makeId(), user_id: uid, plan: "free", created_at: t, metadata: { part_number: part, error: "Lookup failed" } });
      }
    }

    if (Math.random() < 0.33) {
      const t = randTimeInLastDays(28);
      const query = randPick(SEARCH_QUERIES);
      const condition = randPick(CONDITIONS);
      events.push({ event_name: "ebay_search_performed", session_id: makeId(), user_id: uid, plan: "free", created_at: t, metadata: { query, condition } });
      if (Math.random() < 0.6) {
        events.push({ event_name: "price_entered", session_id: makeId(), user_id: uid, plan: "free", created_at: t, metadata: { selling_price: Math.round(20 + Math.random() * 80) } });
        events.push({ event_name: "price_calculated", session_id: makeId(), user_id: uid, plan: "free", created_at: t, metadata: { margin: Math.random() * 0.4 } });
        if (Math.random() < 0.5) events.push({ event_name: "price_saved", session_id: makeId(), user_id: uid, plan: "free", created_at: t, metadata: {} });
      }
    }

    if (Math.random() < 0.28) {
      const t = randTimeInLastDays(28);
      const oem = `OEM-${Math.floor(Math.random() * 90000)}`;
      events.push({ event_name: "compat_check_started", session_id: makeId(), user_id: uid, plan: "free", created_at: t, metadata: { oem_number: oem } });
      if (Math.random() < 0.85) {
        const compatible = Math.random() < 0.65;
        events.push({ event_name: "compat_check_performed", session_id: makeId(), user_id: uid, plan: "free", created_at: t, metadata: { oem_number: oem, status: compatible ? "compatible" : "not_compatible" } });
        events.push({ event_name: compatible ? "compat_result_compatible" : "compat_result_not_compatible", session_id: makeId(), user_id: uid, plan: "free", created_at: t, metadata: { oem_number: oem } });
      } else {
        events.push({ event_name: "compat_check_failed", session_id: makeId(), user_id: uid, plan: "free", created_at: t, metadata: { oem_number: oem, error: "Vehicle not found" } });
      }
    }
  });

  return events.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
}

export const DEMO_RAW_EVENTS = buildDemoRawEvents();
