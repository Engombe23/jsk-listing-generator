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
