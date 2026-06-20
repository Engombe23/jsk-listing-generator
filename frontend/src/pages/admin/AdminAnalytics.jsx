import { useEffect, useMemo, useState } from "react";
import { DEMO_OVERVIEW, DEMO_ACTION_TABLES, DEMO_RAW_EVENTS } from "./demoData";
import {
  T, API_URL, fmtPct,
  Panel, NorthStarCard, MidKpiCard, FunnelPanel, DailyToggleLineChart,
  HorizontalBarChart, DataTable, ImpactDot, Trend, fmtDate, fmtDateTime,
} from "./shared";
import LandingPageSection from "./sections/LandingPageSection";
import SignupFunnelSection from "./sections/SignupFunnelSection";
import ProductUsageSection from "./sections/ProductUsageSection";
import ListingGeneratorSection from "./sections/ListingGeneratorSection";
import SmartPricingSection from "./sections/SmartPricingSection";
import CompatibilityCheckerSection from "./sections/CompatibilityCheckerSection";
import UsersTrialsSection from "./sections/UsersTrialsSection";
import ApiUsageErrorsSection from "./sections/ApiUsageErrorsSection";

const SECTIONS = [
  { key: "overview",       label: "Overview" },
  { key: "landing",        label: "Landing Page" },
  { key: "signup_funnel",  label: "Signup Funnel" },
  { key: "product_usage",  label: "Product Usage" },
  { key: "listing_generator", label: "Listing Generator" },
  { key: "smart_pricing",  label: "Smart Pricing" },
  { key: "compatibility",  label: "Compatibility Checker" },
  { key: "users_trials",   label: "Users & Trials" },
  { key: "api_usage",      label: "API Usage & Errors" },
];

const PRESETS = [
  { key: "today", label: "Today",        days: 0 },
  { key: "7d",     label: "Last 7 days", days: 7 },
  { key: "30d",    label: "Last 30 days", days: 30 },
  { key: "90d",    label: "Last 90 days", days: 90 },
  { key: "custom", label: "Custom range" },
];
const PLANS = ["All plans", "Free", "Starter", "Pro", "Power"];

function presetToRange(presetKey, customFrom, customTo) {
  const now = new Date();
  if (presetKey === "custom") {
    return {
      from: customFrom ? new Date(customFrom).toISOString() : new Date(now.getTime() - 30 * 86400000).toISOString(),
      to:   customTo   ? new Date(customTo).toISOString()   : now.toISOString(),
    };
  }
  const preset = PRESETS.find((p) => p.key === presetKey) || PRESETS[2];
  const from = preset.days === 0
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    : new Date(now.getTime() - preset.days * 86400000).toISOString();
  return { from, to: now.toISOString() };
}

// ─── Activation Funnel / Conversion Health / Insight (Overview-only) ───────────
const STATUS_THRESHOLDS = {
  signup_click_rate:                { good: 0.10, warn: 0.05 },
  signup_completion_rate:           { good: 0.35, warn: 0.20 },
  activation_rate:                  { good: 0.50, warn: 0.30 },
  listing_save_rate:                { good: 0.60, warn: 0.35 },
  listing_export_rate:              { good: 0.40, warn: 0.20 },
  smart_pricing_usage_rate:         { good: 0.25, warn: 0.10 },
  compatibility_checker_usage_rate: { good: 0.25, warn: 0.10 },
};
function statusFor(key, value) {
  if (key === "error_rate") {
    if (value === null) return null;
    if (value <= 0.02) return "Good";
    if (value <= 0.05) return "Needs attention";
    return "Problem";
  }
  const t = STATUS_THRESHOLDS[key];
  if (!t || value === null) return null;
  if (value >= t.good) return "Good";
  if (value >= t.warn) return "Needs attention";
  return "Problem";
}
const STATUS_COLOR = { "Good": T.green, "Needs attention": T.amber, "Problem": T.red };

function ConversionHealth({ rates, rateDeltas }) {
  const ROWS = [
    ["signup_click_rate",                "Signup click rate"],
    ["signup_completion_rate",           "Signup completion rate"],
    ["activation_rate",                  "Activation rate"],
    ["listing_save_rate",                "Listing save rate"],
    ["listing_export_rate",              "Listing export rate"],
    ["smart_pricing_usage_rate",         "Smart Pricing usage rate"],
    ["compatibility_checker_usage_rate", "Compatibility Checker usage rate"],
    ["error_rate",                       "Error rate"],
  ];
  return (
    <Panel title="Conversion Health" style={{ height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {ROWS.map(([key, label]) => {
          const value  = rates?.[key];
          const delta  = rateDeltas?.[key];
          const status = statusFor(key, value);
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12.5, color: T.textMuted, flex: 1 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text, width: 56, textAlign: "right" }}>{fmtPct(value)}</span>
              <span style={{ width: 64, textAlign: "right" }}><Trend value={delta} /></span>
              {status && (
                <span style={{
                  marginLeft: 10, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99,
                  background: `${STATUS_COLOR[status]}1f`, color: STATUS_COLOR[status],
                  border: `1px solid ${STATUS_COLOR[status]}40`, whiteSpace: "nowrap",
                }}>
                  {status}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function InsightCallout({ funnel, onViewFunnel }) {
  const biggestDrop = useMemo(() => {
    if (!funnel || funnel.length < 2) return null;
    let worst = null;
    for (let i = 1; i < funnel.length; i++) {
      const rate = funnel[i].rate ?? 0;
      if (!worst || rate < worst.rate) worst = { from: funnel[i - 1], to: funnel[i], rate };
    }
    return worst;
  }, [funnel]);

  return (
    <Panel title="Insight" style={{ height: "100%", background: `linear-gradient(160deg, ${T.card} 0%, #14213a 100%)` }}>
      {biggestDrop ? (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            Biggest drop-off
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text, lineHeight: 1.4, marginBottom: 10 }}>
            {biggestDrop.from.label} → {biggestDrop.to.label}
          </div>
          <div style={{ fontSize: 12.5, color: T.textMuted, lineHeight: 1.55, marginBottom: 14 }}>
            Only {fmtPct(biggestDrop.rate)} of users who reach "{biggestDrop.from.label}" continue to "{biggestDrop.to.label}".
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>
            Suggested action
          </div>
          <div style={{ fontSize: 12.5, color: T.textMuted, lineHeight: 1.55, marginBottom: 16 }}>
            Focus on reducing friction at this exact step — it's where you're losing the most users right now.
          </div>
          <button onClick={onViewFunnel} style={{
            width: "100%", padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer",
            background: T.blue, color: "#fff", fontWeight: 700, fontSize: 13,
          }}>
            View Signup Funnel →
          </button>
        </>
      ) : (
        <div style={{ fontSize: 13, color: T.textMuted }}>Not enough data yet to surface an insight.</div>
      )}
    </Panel>
  );
}

function EmptyState({ onEnableDemo, onViewSetup, showSetup }) {
  return (
    <div style={{
      minHeight: 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 16, textAlign: "center", padding: 40,
    }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>No analytics data yet</div>
      <div style={{ fontSize: 13, color: T.textMuted, maxWidth: 420 }}>
        Start using the app or enable demo data to preview the dashboard.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onEnableDemo} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: T.blue, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          Enable demo data
        </button>
        <button onClick={onViewSetup} style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${T.borderStrong}`, background: "transparent", color: T.textMuted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          View tracking setup
        </button>
      </div>
      {showSetup && (
        <div style={{ marginTop: 8, textAlign: "left", fontSize: 12.5, color: T.textMuted, lineHeight: 1.7, background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 18px", maxWidth: 480 }}>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 6 }}>Why this might be empty:</div>
          1. The <code>usage_events</code> table needs to exist in Supabase (run <code>supabase/usage_events.sql</code>).<br/>
          2. The backend needs <code>SUPABASE_SERVICE_ROLE_KEY</code> set (locally and on Render).<br/>
          3. Real visitors need to actually use the live site — events only appear once people click around.
        </div>
      )}
    </div>
  );
}

function OverviewSection({ data, tableData }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        <NorthStarCard icon="👥" label="Visitors"        value={data.kpis.visitors}        delta={data.deltas?.visitors}        accent={T.blue}   series={data.series?.visitors} />
        <NorthStarCard icon="🖱️" label="Signup Clicks"   value={data.kpis.signup_clicks}    delta={data.deltas?.signup_clicks}    accent={T.purple} series={data.series?.signups} />
        <NorthStarCard icon="🚀" label="Trial Starts"    value={data.kpis.trial_starts}     delta={data.deltas?.trial_starts}     accent={T.green}  series={data.series?.trials} />
        <NorthStarCard icon="⭐" label="Activated Users" value={data.kpis.activated_users}  delta={data.deltas?.activated_users}  accent={T.orange} series={data.series?.activated} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.8fr", gap: 14, marginBottom: 18, alignItems: "stretch" }}>
        <FunnelPanel title="Activation Funnel" subtitle="Visitor → signup → trial → activated → paid" funnel={data.funnel} overallConversion={data.overallConversion} overallLabel="Overall conversion (viewed → paid)" />
        <ConversionHealth rates={data.rates} rateDeltas={data.rateDeltas} />
        <InsightCallout funnel={data.funnel} onViewFunnel={() => {}} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        <MidKpiCard icon="📄" label="Listings Generated"             value={data.kpis.listings_generated}             delta={data.deltas?.listings_generated}             accent={T.blue} />
        <MidKpiCard icon="💾" label="Listings Saved"                 value={data.kpis.listings_saved}                 delta={data.deltas?.listings_saved}                 accent={T.green} />
        <MidKpiCard icon="🔍" label="eBay Searches Performed"        value={data.kpis.ebay_searches_performed}        delta={data.deltas?.ebay_searches_performed}        accent={T.purple} />
        <MidKpiCard icon="🛡️" label="Compatibility Checks Performed" value={data.kpis.compatibility_checks_performed} delta={data.deltas?.compatibility_checks_performed} accent={T.orange} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14, marginBottom: 18 }}>
        <DailyToggleLineChart title="Listings Generated vs Listings Saved" data={data.series?.generatedVsSaved} lines={[
          { key: "generated", name: "Listings Generated", color: T.blue },
          { key: "saved",     name: "Listings Saved",     color: T.green },
        ]} />
        <HorizontalBarChart title="Feature Usage Split" data={data.featureUsage} pctKey="pctOfCore" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <DataTable
          title="Users signed up but generated no listing"
          columns={[
            { key: "user", label: "User", flex: 1.6, emphasize: true },
            { key: "signed_up", label: "Signed up", render: fmtDate },
            { key: "last_seen", label: "Last seen", render: fmtDate },
            { key: "plan", label: "Plan" },
          ]}
          rows={tableData?.usersNoListing}
          total={tableData?.usersNoListingTotal}
        />
        <DataTable
          title="Users generated a listing but did not save/export"
          columns={[
            { key: "user", label: "User", flex: 1.6, emphasize: true },
            { key: "generated", label: "Generated", render: fmtDate },
            { key: "last_seen", label: "Last seen", render: fmtDate },
            { key: "plan", label: "Plan" },
          ]}
          rows={tableData?.usersNoSave}
          total={tableData?.usersNoSaveTotal}
        />
        <DataTable
          title="Recent failed events"
          columns={[
            { key: "event", label: "Event", flex: 1.6, emphasize: true },
            { key: "count", label: "Count" },
            { key: "last_occurred", label: "Last occurred", render: fmtDateTime },
            { key: "impact", label: "Impact", render: (v) => <ImpactDot impact={v} /> },
          ]}
          rows={tableData?.recentFailedEvents}
          footerLabel="View all errors"
        />
      </div>
    </>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function AdminAnalytics() {
  const [section, setSection] = useState("overview");
  const [preset, setPreset]   = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo]     = useState("");
  const [plan, setPlan]       = useState("All plans");
  const [overview, setOverview] = useState(null);
  const [tables, setTables]     = useState(null);
  const [rawEvents, setRawEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const range = useMemo(() => presetToRange(preset, customFrom, customTo), [preset, customFrom, customTo]);

  useEffect(() => {
    if (demoMode) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    const params = new URLSearchParams({ from: range.from, to: range.to });
    if (plan !== "All plans") params.set("plan", plan.toLowerCase());

    Promise.all([
      fetch(`${API_URL}/api/analytics/overview?${params.toString()}`).then(async (r) => {
        const j = await r.json(); if (!r.ok) throw new Error(j.error || "Failed to load overview"); return j;
      }),
      fetch(`${API_URL}/api/analytics/action-tables?${params.toString()}`).then(async (r) => {
        const j = await r.json(); if (!r.ok) throw new Error(j.error || "Failed to load action tables"); return j;
      }),
      fetch(`${API_URL}/api/analytics/raw-events?${params.toString()}`).then(async (r) => {
        const j = await r.json(); if (!r.ok) throw new Error(j.error || "Failed to load raw events"); return j;
      }),
    ])
      .then(([ov, tb, rw]) => { if (!cancelled) { setOverview(ov); setTables(tb); setRawEvents(rw.events || []); } })
      .catch((err) => { if (!cancelled) setError(String(err.message || err)); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [range.from, range.to, plan, demoMode]);

  const data      = demoMode ? DEMO_OVERVIEW       : overview;
  const tableData  = demoMode ? DEMO_ACTION_TABLES  : tables;
  const events     = demoMode ? DEMO_RAW_EVENTS     : (rawEvents || []);
  const isEmpty = !loading && !error && !demoMode && data && data.kpis?.visitors === 0 && data.funnel?.every((f) => f.count === 0);
  const ready   = data && (demoMode || (!loading && !error && !isEmpty));

  const sectionProps = { events, range, plan, demoMode };

  return (
    <div style={{ height: "100vh", overflow: "hidden", background: T.bg, display: "flex", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 230, flexShrink: 0, background: T.sidebar, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", padding: "20px 14px", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 20px", borderBottom: `1px solid ${T.border}`, marginBottom: 14 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: T.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>P</div>
          <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>PartLister</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {SECTIONS.map((s) => {
            const active = section === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                style={{
                  display: "flex", alignItems: "center", textAlign: "left",
                  padding: "9px 12px", borderRadius: 9, border: "none", cursor: "pointer",
                  background: active ? "rgba(59,130,246,0.14)" : "transparent",
                  color: active ? T.blue : T.textMuted,
                  fontSize: 13, fontWeight: active ? 700 : 500,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 11, color: T.textDim }}>PartLister<br/>v1.4.0</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.cardAlt, border: `1px solid ${T.borderStrong}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: T.textMuted }}>A</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Admin</div>
              <div style={{ fontSize: 10.5, color: T.textDim }}>admin@partlister.app</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0, padding: "24px 28px 40px", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: T.text }}>Analytics</div>
            <div style={{ fontSize: 13, color: T.textMuted, marginTop: 3 }}>
              Internal command centre for traffic, signup behaviour, and product usage.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {PRESETS.map((p) => (
              <button key={p.key} onClick={() => setPreset(p.key)} style={{
                padding: "7px 14px", borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                border: preset === p.key ? `1px solid ${T.blue}` : `1px solid ${T.border}`,
                background: preset === p.key ? T.blue : T.card,
                color: preset === p.key ? "#fff" : T.textMuted,
              }}>
                {p.label}
              </button>
            ))}
            {preset === "custom" && (
              <>
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12.5, border: `1px solid ${T.borderStrong}`, background: T.cardAlt, color: T.text }} />
                <span style={{ color: T.textMuted, fontSize: 12 }}>to</span>
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12.5, border: `1px solid ${T.borderStrong}`, background: T.cardAlt, color: T.text }} />
              </>
            )}
            <select value={plan} onChange={(e) => setPlan(e.target.value)} style={{
              padding: "8px 12px", borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${T.borderStrong}`, background: T.card, color: T.text,
            }}>
              {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {demoMode && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            background: "rgba(245,158,11,0.10)", border: `1px solid ${T.amber}40`, borderRadius: 12,
            padding: "10px 16px", marginBottom: 18, fontSize: 12.5, color: T.amber, fontWeight: 600,
          }}>
            <span>⚠ Showing demo data — not real analytics. For layout preview only.</span>
            <button onClick={() => setDemoMode(false)} style={{ background: "none", border: "none", color: T.amber, fontWeight: 700, cursor: "pointer", fontSize: 12.5 }}>
              Turn off →
            </button>
          </div>
        )}

        {!demoMode && loading && <div style={{ padding: 60, textAlign: "center", color: T.textMuted, fontSize: 14 }}>Loading analytics…</div>}

        {!demoMode && !loading && error && (
          <>
            <div style={{ background: "rgba(239,68,68,0.08)", border: `1px solid ${T.red}40`, borderRadius: 12, padding: "14px 18px", color: T.red, fontSize: 13, marginBottom: 18 }}>
              {error}
              {error.toLowerCase().includes("not configured") && (
                <div style={{ marginTop: 6, color: T.textMuted }}>
                  Add <code>SUPABASE_SERVICE_ROLE_KEY</code> to backend/.env, then restart/redeploy the backend.
                </div>
              )}
            </div>
            <EmptyState onEnableDemo={() => setDemoMode(true)} onViewSetup={() => setShowSetup((v) => !v)} showSetup={showSetup} />
          </>
        )}

        {!demoMode && !loading && !error && isEmpty && (
          <EmptyState onEnableDemo={() => setDemoMode(true)} onViewSetup={() => setShowSetup((v) => !v)} showSetup={showSetup} />
        )}

        {ready && (
          <>
            {section === "overview"          && <OverviewSection data={data} tableData={tableData} />}
            {section === "landing"           && <LandingPageSection {...sectionProps} />}
            {section === "signup_funnel"     && <SignupFunnelSection {...sectionProps} data={data} />}
            {section === "product_usage"     && <ProductUsageSection {...sectionProps} data={data} />}
            {section === "listing_generator" && <ListingGeneratorSection {...sectionProps} />}
            {section === "smart_pricing"      && <SmartPricingSection {...sectionProps} />}
            {section === "compatibility"      && <CompatibilityCheckerSection {...sectionProps} />}
            {section === "users_trials"       && <UsersTrialsSection {...sectionProps} tableData={tableData} />}
            {section === "api_usage"          && <ApiUsageErrorsSection {...sectionProps} tableData={tableData} />}
          </>
        )}
      </div>
    </div>
  );
}
