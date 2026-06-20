import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ─── Date range presets ────────────────────────────────────────────────────────
const PRESETS = [
  { key: "today",   label: "Today",       days: 0 },
  { key: "7d",       label: "Last 7 days", days: 7 },
  { key: "30d",      label: "Last 30 days", days: 30 },
  { key: "90d",      label: "Last 90 days", days: 90 },
  { key: "custom",   label: "Custom range" },
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

function fmtPct(v) {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

function fmtNum(v) {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return v.toLocaleString();
}

function KpiCard({ label, value, sub }) {
  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "16px 18px", boxShadow: "var(--shadow)",
      display: "flex", flexDirection: "column", gap: 6, minWidth: 0,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.6 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", letterSpacing: -0.5 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  );
}

export default function AdminAnalytics() {
  const [section, setSection] = useState("overview");
  const [preset, setPreset]   = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo]     = useState("");
  const [plan, setPlan]       = useState("All plans");
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const range = useMemo(() => presetToRange(preset, customFrom, customTo), [preset, customFrom, customTo]);

  useEffect(() => {
    if (section !== "overview") return;
    let cancelled = false;
    setLoading(true);
    setError("");

    const params = new URLSearchParams({ from: range.from, to: range.to });
    if (plan !== "All plans") params.set("plan", plan.toLowerCase());

    fetch(`${API_URL}/api/analytics/overview?${params.toString()}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load analytics");
        if (!cancelled) setData(json);
      })
      .catch((err) => { if (!cancelled) setError(String(err.message || err)); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [section, range.from, range.to, plan]);

  const kpis = data?.kpis;
  const rates = data?.rates;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "24px 28px" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>Analytics</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
            Internal command centre — traffic, signup behaviour, and product usage.
          </div>
        </div>

        {/* ── Section tabs ── */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {SECTIONS.map((s) => {
            const active = section === s.key;
            const disabled = s.key !== "overview";
            return (
              <button
                key={s.key}
                onClick={() => !disabled && setSection(s.key)}
                disabled={disabled}
                title={disabled ? "Coming soon" : undefined}
                style={{
                  padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                  border: active ? "1px solid var(--blue)" : "1px solid var(--border)",
                  background: active ? "var(--blue-bg)" : "var(--bg-surface)",
                  color: disabled ? "var(--text-dim)" : active ? "var(--blue)" : "var(--text-muted)",
                  cursor: disabled ? "default" : "pointer",
                  opacity: disabled ? 0.55 : 1,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* ── Filters ── */}
        <div style={{
          display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "12px 16px", marginBottom: 20,
        }}>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              style={{
                padding: "6px 14px", borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                border: preset === p.key ? "1px solid var(--blue)" : "1px solid var(--border)",
                background: preset === p.key ? "var(--blue-bg)" : "transparent",
                color: preset === p.key ? "var(--blue)" : "var(--text-muted)",
              }}
            >
              {p.label}
            </button>
          ))}

          {preset === "custom" && (
            <>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12.5, border: "1px solid var(--border-strong)", background: "var(--bg-input)", color: "var(--text)" }} />
              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>to</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12.5, border: "1px solid var(--border-strong)", background: "var(--bg-input)", color: "var(--text)" }} />
            </>
          )}

          <div style={{ flex: 1 }} />

          <select value={plan} onChange={(e) => setPlan(e.target.value)} style={{
            padding: "7px 12px", borderRadius: 9, fontSize: 12.5, fontWeight: 600,
            border: "1px solid var(--border-strong)", background: "var(--bg-surface2)", color: "var(--text)", cursor: "pointer",
          }}>
            {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* ── Overview content ── */}
        {section === "overview" && (
          <>
            {loading && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                Loading analytics…
              </div>
            )}

            {!loading && error && (
              <div style={{
                background: "var(--red-bg)", border: "1px solid rgba(220,38,38,0.25)",
                borderRadius: 12, padding: "14px 18px", color: "var(--red)", fontSize: 13,
              }}>
                {error}
                {error.toLowerCase().includes("not configured") && (
                  <div style={{ marginTop: 6, color: "var(--text-muted)" }}>
                    Add <code>SUPABASE_SERVICE_ROLE_KEY</code> to backend/.env (Supabase → Project Settings → API → service_role secret), then restart the backend.
                  </div>
                )}
              </div>
            )}

            {!loading && !error && kpis && (
              <>
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: 14, marginBottom: 24,
                }}>
                  <KpiCard label="Visitors"                     value={fmtNum(kpis.visitors)} />
                  <KpiCard label="Signup Clicks"                 value={fmtNum(kpis.signup_clicks)} />
                  <KpiCard label="New Users"                     value={fmtNum(kpis.new_users)} />
                  <KpiCard label="Trial Starts"                  value={fmtNum(kpis.trial_starts)} />
                  <KpiCard label="Activated Users"                value={fmtNum(kpis.activated_users)} />
                  <KpiCard label="Listings Generated"             value={fmtNum(kpis.listings_generated)} />
                  <KpiCard label="Listings Saved"                 value={fmtNum(kpis.listings_saved)} />
                  <KpiCard label="eBay Searches Performed"        value={fmtNum(kpis.ebay_searches_performed)} />
                  <KpiCard label="Prices Entered"                 value={fmtNum(kpis.prices_entered)} />
                  <KpiCard label="Prices Saved"                   value={fmtNum(kpis.prices_saved)} />
                  <KpiCard label="Compatibility Checks Performed" value={fmtNum(kpis.compatibility_checks_performed)} />
                  <KpiCard label="Failed Events"                  value={fmtNum(kpis.failed_events)} />
                  <KpiCard label="Error Rate"                     value={fmtPct(kpis.error_rate)} />
                </div>

                <div style={{
                  background: "var(--bg-surface)", border: "1px solid var(--border)",
                  borderRadius: 14, padding: "18px 20px", boxShadow: "var(--shadow)",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>
                    Core rates
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px 24px" }}>
                    {[
                      ["Signup click rate",            rates?.signup_click_rate],
                      ["Signup completion rate",       rates?.signup_completion_rate],
                      ["Activation rate",              rates?.activation_rate],
                      ["Listing save rate",             rates?.listing_save_rate],
                      ["Listing export rate",           rates?.listing_export_rate],
                      ["Smart Pricing usage rate",      rates?.smart_pricing_usage_rate],
                      ["Compatibility Checker usage rate", rates?.compatibility_checker_usage_rate],
                      ["Error rate",                    rates?.error_rate],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-light)" }}>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{fmtPct(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {section !== "overview" && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            {SECTIONS.find((s) => s.key === section)?.label} — coming soon.
          </div>
        )}
      </div>
    </div>
  );
}
