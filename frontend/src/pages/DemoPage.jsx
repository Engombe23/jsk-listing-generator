import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { trackEvent } from "../lib/analytics";
import posthog from "../lib/posthogClient";

const API_URL      = import.meta.env.VITE_API_URL || "http://localhost:3001";
const ACCENT       = "#135DFF";
const TEXT         = "#132A46";
const MUTED        = "#4d6a8a";
const DIM          = "#7a96b0";
const BORDER       = "#dde7f5";
const ACCENT_LIGHT = "#EEF5FF";
const GREEN        = "#16a34a";
const GREEN_LIGHT  = "#f0fdf4";
const BG_ALT       = "#f7f9fc";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function signupUrl({ oem, utmCampaign, utmSource, utmMedium }) {
  const p = new URLSearchParams();
  if (oem)         p.set("oem", oem);
  p.set("source", "demo");
  if (utmCampaign) p.set("utm_campaign", utmCampaign);
  if (utmSource)   p.set("utm_source",   utmSource);
  if (utmMedium)   p.set("utm_medium",   utmMedium);
  return `/auth/sign-up?${p.toString()}`;
}

function phPayload(p) {
  return {
    seller: p.seller, oem: p.oem, part: p.part,
    campaign: p.campaign, source: p.source,
    utm_source: p.utmSource, utm_medium: p.utmMedium, utm_campaign: p.utmCampaign,
  };
}

// ─── Live listing mockup ───────────────────────────────────────────────────────

function LiveMockup({ oem, part }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [htmlOpen, setHtmlOpen] = useState(false);

  useEffect(() => {
    if (!oem) return;
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/api/demo/preview`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ oem }),
    })
      .then(r => r.json())
      .then(d => { setData(d.error ? null : d); setError(d.error || null); setLoading(false); })
      .catch(() => { setError("fetch_failed"); setLoading(false); });
  }, [oem]);

  // ── Loading ──
  if (loading) {
    return (
      <div style={{
        background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16,
        padding: "48px 24px", textAlign: "center",
        boxShadow: "0 8px 40px rgba(19,45,70,0.08)",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: `3px solid ${BORDER}`, borderTopColor: ACCENT,
          animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
        }} />
        <div style={{ fontSize: 14, color: MUTED }}>Generating listing for <strong>{oem}</strong>…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error / no OEM ──
  if (!oem || error || !data) {
    return <StaticMockup oem={oem} part={part} />;
  }

  // ── Real data ──
  const title      = data.generated_title || part || oem;
  const specs      = data.item_specifics  || [];
  const oems       = data.oem_numbers     || [];
  const kNumbers   = data.k_number_list   || [];
  const compatCount = data.compatibility_count || 0;
  const topModels  = data.top_models      || [];
  const yearRange  = data.year_range;
  const engineCodes = data.engine_codes   || [];
  const imgUrl     = data.article_image;

  return (
    <div style={{
      background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16,
      overflow: "hidden", boxShadow: "0 8px 40px rgba(19,45,70,0.10)",
      fontFamily: "Plus Jakarta Sans, Arial, sans-serif",
    }}>
      {/* Header bar */}
      <div style={{
        background: ACCENT, padding: "10px 18px",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.35)" }} />
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.35)" }} />
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.35)" }} />
        <span style={{ marginLeft: 6, fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
          PartLister — Generated Output
        </span>
        <span style={{
          marginLeft: "auto", fontSize: 10, fontWeight: 700,
          background: "rgba(255,255,255,0.2)", color: "#fff",
          borderRadius: 6, padding: "2px 8px",
        }}>LIVE</span>
      </div>

      <div style={{ display: "flex", gap: 0 }}>
        {/* Optional image column */}
        {imgUrl && (
          <div style={{
            width: 100, flexShrink: 0,
            borderRight: `1px solid ${BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 12, background: BG_ALT,
          }}>
            <img src={imgUrl} alt={title} style={{ maxWidth: 76, maxHeight: 76, objectFit: "contain" }} />
          </div>
        )}

        <div style={{ flex: 1, padding: "20px 22px" }}>
          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: DIM, letterSpacing: "0.08em", marginBottom: 6 }}>
              GENERATED TITLE
            </div>
            <div style={{
              fontSize: 13, fontWeight: 700, color: TEXT, lineHeight: 1.5,
              background: GREEN_LIGHT, border: `1px solid #bbf7d0`,
              borderRadius: 8, padding: "9px 12px",
            }}>
              {title}
            </div>
          </div>

          {/* Item specifics */}
          {specs.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: DIM, letterSpacing: "0.08em", marginBottom: 6 }}>
                ITEM SPECIFICS
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {specs.slice(0, 7).map(s => (
                    <tr key={s.label} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: "5px 10px 5px 0", fontSize: 11.5, color: MUTED, fontWeight: 600, width: "42%", whiteSpace: "nowrap" }}>
                        {s.label}
                      </td>
                      <td style={{ padding: "5px 0", fontSize: 11.5, color: TEXT }}>
                        {s.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* OEM numbers + compat */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {oems.length > 0 && (
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: DIM, letterSpacing: "0.08em", marginBottom: 5 }}>
                  OE REFERENCES
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {oems.slice(0, 4).map(n => (
                    <span key={n} style={{
                      fontSize: 10.5, fontWeight: 700, padding: "2px 7px",
                      background: ACCENT_LIGHT, color: ACCENT,
                      border: `1px solid ${BORDER}`, borderRadius: 5,
                    }}>{n}</span>
                  ))}
                  {oems.length > 4 && (
                    <span style={{ fontSize: 10.5, color: DIM, padding: "2px 0" }}>+{oems.length - 4} more</span>
                  )}
                </div>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: DIM, letterSpacing: "0.08em", marginBottom: 5 }}>
                COMPATIBILITY
              </div>
              {compatCount > 0 ? (
                <>
                  <div style={{ fontSize: 12, color: GREEN, fontWeight: 700 }}>
                    ✓ {compatCount} vehicles confirmed
                  </div>
                  {topModels.length > 0 && (
                    <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2 }}>
                      {topModels.slice(0, 2).join(", ")}{topModels.length > 2 ? " +" + (topModels.length - 2) + " more" : ""}
                    </div>
                  )}
                  {kNumbers.length > 0 && (
                    <div style={{ fontSize: 10.5, color: DIM, marginTop: 2 }}>
                      K-numbers: {kNumbers.slice(0, 2).join(", ")}{kNumbers.length > 2 ? "…" : ""}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 11.5, color: DIM }}>Compatibility data fetched</div>
              )}
            </div>
          </div>

          {/* HTML preview toggle */}
          {data.generated_html && (
            <div style={{ marginTop: 14, borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
              <button
                onClick={() => setHtmlOpen(o => !o)}
                style={{
                  background: "none", border: `1px solid ${BORDER}`,
                  borderRadius: 7, padding: "5px 12px",
                  fontSize: 11.5, fontWeight: 600, color: MUTED,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                </svg>
                {htmlOpen ? "Hide" : "Preview"} HTML description
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: htmlOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {htmlOpen && (
                <div style={{ marginTop: 10, borderRadius: 8, overflow: "hidden", border: `1px solid ${BORDER}` }}>
                  <iframe
                    srcDoc={data.generated_html}
                    sandbox="allow-same-origin"
                    style={{ width: "100%", height: 320, border: "none", display: "block" }}
                    title="Generated listing HTML"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Static fallback mockup (no OEM or API error) ─────────────────────────────

function StaticMockup({ oem, part }) {
  const partName  = part || "Automotive Part";
  const oemNumber = oem  || "—";
  return (
    <div style={{
      background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16,
      overflow: "hidden", boxShadow: "0 8px 40px rgba(19,45,70,0.08)",
    }}>
      <div style={{ background: ACCENT, padding: "10px 18px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.35)" }} />
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.35)" }} />
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.35)" }} />
        <span style={{ marginLeft: 6, fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
          PartLister — Generated Output
        </span>
      </div>
      <div style={{ padding: "20px 22px" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: DIM, letterSpacing: "0.08em", marginBottom: 6 }}>GENERATED TITLE</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, background: GREEN_LIGHT, border: "1px solid #bbf7d0", borderRadius: 8, padding: "9px 12px" }}>
            {partName} {oemNumber} — OEM Quality | Fits Multiple Applications | UK Stock | Fast Dispatch
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: DIM, letterSpacing: "0.08em", marginBottom: 6 }}>ITEM SPECIFICS</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {[["Part Number", oemNumber], ["Part Type", partName], ["Brand", "OEM / Quality Aftermarket"], ["Condition", "New"]].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: "5px 10px 5px 0", fontSize: 11.5, color: MUTED, fontWeight: 600, width: "42%" }}>{k}</td>
                  <td style={{ padding: "5px 0", fontSize: 11.5, color: TEXT }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 12, color: GREEN, fontWeight: 700 }}>✓ Compatibility data included</div>
      </div>
    </div>
  );
}

function FeatureRow({ icon, title, desc }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: ACCENT_LIGHT, border: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();
  const [tryOem, setTryOem]         = useState("");
  const [oemFocused, setOemFocused] = useState(false);

  const seller      = searchParams.get("seller")       || "";
  const oem         = searchParams.get("oem")          || "";
  const part        = searchParams.get("part")         || "";
  const campaign    = searchParams.get("campaign")     || "";
  const source      = searchParams.get("source")       || "";
  const utmSource   = searchParams.get("utm_source")   || "";
  const utmMedium   = searchParams.get("utm_medium")   || "";
  const utmCampaign = searchParams.get("utm_campaign") || "";

  const params  = { seller, oem, part, campaign, source, utmSource, utmMedium, utmCampaign };
  const payload = phPayload(params);
  const ctaUrl  = signupUrl({ oem, utmSource, utmMedium, utmCampaign });

  useEffect(() => {
    trackEvent("demo_page_viewed", payload);
    posthog.capture("demo_page_viewed", payload);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTryOem(e) {
    e.preventDefault();
    const trimmed = tryOem.trim();
    if (!trimmed) return;
    trackEvent("demo_try_oem_clicked", { ...payload, entered_oem: trimmed });
    posthog.capture("demo_try_oem_clicked", { ...payload, entered_oem: trimmed });
    navigate(signupUrl({ oem: trimmed, utmSource, utmMedium, utmCampaign }));
  }

  function handleSignupClick() {
    trackEvent("demo_signup_clicked", payload);
    posthog.capture("demo_signup_clicked", payload);
  }

  const headline = oem && part
    ? `Your ${oem} listing, rebuilt with PartLister`
    : oem
    ? `See what PartLister does with ${oem}`
    : "See PartLister in action";

  return (
    <div style={{ fontFamily: "Plus Jakarta Sans, Arial, sans-serif", background: "#fff", minHeight: "100vh" }}>

      {/* ── Minimal header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${BORDER}`, padding: "0 24px",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: 60,
        }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <img src="/PARTS-LISTER-LOGO.png" alt="PartLister" style={{ height: 32 }} />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link to="/auth/sign-in" style={{ fontSize: 13.5, fontWeight: 600, color: MUTED, textDecoration: "none" }}>
              Sign in
            </Link>
            <Link to={ctaUrl} onClick={handleSignupClick} style={{
              display: "inline-block", padding: "8px 18px",
              background: ACCENT, color: "#fff",
              fontSize: 13, fontWeight: 700, borderRadius: 9,
              textDecoration: "none", whiteSpace: "nowrap",
            }}>
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{
        padding: "72px 24px 64px",
        background: "linear-gradient(180deg, #f0f5ff 0%, #ffffff 100%)",
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {seller && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "#fff", border: `1px solid ${BORDER}`,
              borderRadius: 999, padding: "5px 14px",
              fontSize: 12, fontWeight: 700, color: MUTED,
              marginBottom: 20, boxShadow: "0 1px 6px rgba(19,45,70,0.07)",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN, display: "inline-block" }} />
              Personalised demo for {seller}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}
            className="demo-hero-grid">

            {/* Left: copy */}
            <div style={{ paddingTop: 8 }}>
              <h1 style={{
                margin: "0 0 18px 0",
                fontSize: "clamp(24px, 3.5vw, 42px)",
                fontWeight: 900, color: TEXT,
                letterSpacing: "-0.5px", lineHeight: 1.15,
              }}>
                {headline}
              </h1>
              <p style={{ margin: "0 0 32px 0", fontSize: 16, color: MUTED, lineHeight: 1.7, maxWidth: 420 }}>
                Stop building listings by hand.
                PartLister generates the title, description, item specifics, OE references, compatibility and pricing data — from a single part number.
              </p>
              <Link to={ctaUrl} onClick={handleSignupClick} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 28px",
                background: ACCENT, color: "#fff",
                fontSize: 15, fontWeight: 700, borderRadius: 12,
                textDecoration: "none", whiteSpace: "nowrap",
                boxShadow: "0 4px 20px rgba(19,93,255,0.28)",
              }}>
                Start free — 10 listings, no card required →
              </Link>
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                {["No credit card", "Under 2 min per listing", "Cancel any time"].map(t => (
                  <span key={t} style={{ fontSize: 12, color: MUTED, display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ color: GREEN, fontWeight: 800 }}>✓</span> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: live listing */}
            <LiveMockup oem={oem} part={part} />
          </div>
        </div>
      </section>

      {/* ── What you get ── */}
      <section style={{ padding: "72px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{
              display: "inline-flex", alignItems: "center",
              background: ACCENT_LIGHT, border: `1px solid ${BORDER}`,
              borderRadius: 999, padding: "5px 14px",
              fontSize: 11, fontWeight: 800, color: ACCENT, letterSpacing: "0.07em", marginBottom: 16,
            }}>
              WHAT YOU GET
            </div>
            <h2 style={{ margin: 0, fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 900, color: TEXT, letterSpacing: "-0.3px" }}>
              Everything in one output
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="demo-features-grid">
            {[
              { title: "Title & description", desc: "SEO-optimised eBay title and structured HTML description, ready to copy.", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
              { title: "Item specifics", desc: "Brand, part number, dimensions, weight, fitment — all structured for eBay.", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> },
              { title: "OE cross-references", desc: "OEM numbers, interchangeable references and alternative part numbers.", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
              { title: "Vehicle compatibility", desc: "Which makes, models, years and engines the part fits — with K-numbers for eBay.", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
              { title: "Market pricing data", desc: "Live eBay sold listings and active pricing so you can price it right.", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg> },
              { title: "CSV & HTML export", desc: "Export to CSV for eBay bulk upload, or copy the HTML template directly.", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg> },
            ].map(f => (
              <div key={f.title} style={{
                background: "#fff", border: `1px solid ${BORDER}`,
                borderRadius: 16, padding: "22px 20px",
              }}>
                <FeatureRow icon={f.icon} title={f.title} desc={f.desc} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Before / after ── */}
      <section style={{ padding: "72px 24px", background: BG_ALT }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ margin: "0 0 48px 0", fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 900, color: TEXT, letterSpacing: "-0.3px" }}>
            8 manual steps → 3 with PartLister
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="demo-compare-grid">
            <div style={{ background: "#fff", border: "1px solid #f0d0d0", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ background: "#fff5f5", borderBottom: "1px solid #f0d0d0", padding: "14px 20px" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#c0392b", letterSpacing: "0.1em" }}>MANUAL</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#7a1a1a", marginTop: 2 }}>8 steps, 10–15 min</div>
              </div>
              <div style={{ padding: "6px 0" }}>
                {["Find the part number", "Search for product data", "Collect OE references", "Find cross-references", "Look up compatibility", "Write the title", "Build the description", "Copy into eBay"].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "8px 20px", borderBottom: i < 7 ? "1px solid #fce8e8" : "none", fontSize: 12.5, color: MUTED }}>
                    <span style={{ minWidth: 18, height: 18, borderRadius: "50%", background: "#fee2e2", color: "#c0392b", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(19,93,255,0.10)" }}>
              <div style={{ background: ACCENT, padding: "14px 20px" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em" }}>WITH PARTLISTER</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginTop: 2 }}>3 steps. Done.</div>
              </div>
              <div style={{ padding: "20px 20px 12px" }}>
                {[{ t: "Enter part number", d: "OEM, article number or reference." }, { t: "Generate listing", d: "PartLister pulls all data automatically." }, { t: "Copy or export", d: "HTML, CSV or direct paste into eBay." }].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < 2 ? 18 : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: ACCENT, color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                      {i < 2 && <div style={{ width: 2, flex: 1, background: BORDER, marginTop: 4, minHeight: 14 }} />}
                    </div>
                    <div style={{ paddingTop: 2 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{s.t}</div>
                      <div style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>{s.d}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: ACCENT_LIGHT, borderTop: `1px solid ${BORDER}`, padding: "11px 20px", display: "flex", alignItems: "center", gap: 7 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                <span style={{ fontSize: 11.5, color: ACCENT, fontWeight: 700 }}>Under 2 minutes per listing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Try your own OEM ── */}
      <section style={{ padding: "72px 24px", background: "#fff", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ margin: "0 0 10px 0", fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900, color: TEXT, letterSpacing: "-0.3px" }}>
            Try your own OEM number
          </h2>
          <p style={{ margin: "0 0 26px 0", fontSize: 15, color: MUTED, lineHeight: 1.6 }}>
            Enter any OEM or article number and see what PartLister generates.
          </p>
          <form onSubmit={handleTryOem} style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              value={tryOem}
              onChange={e => setTryOem(e.target.value)}
              onFocus={() => setOemFocused(true)}
              onBlur={() => setOemFocused(false)}
              placeholder={oem || "e.g. 1K0615123A or 21350-2A700"}
              style={{
                flex: 1, padding: "13px 16px", fontSize: 14, color: TEXT,
                background: "#fff", fontFamily: "inherit",
                border: `1.5px solid ${oemFocused ? ACCENT : BORDER}`,
                borderRadius: 10, outline: "none",
                boxShadow: oemFocused ? "0 0 0 3px rgba(19,93,255,0.1)" : "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
            />
            <button type="submit" style={{
              padding: "13px 22px", background: ACCENT, color: "#fff",
              fontSize: 14, fontWeight: 700, border: "none", borderRadius: 10, cursor: "pointer",
            }}>
              Generate →
            </button>
          </form>
          <p style={{ margin: "12px 0 0 0", fontSize: 12, color: DIM }}>Creates a free account — no card required.</p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: "72px 24px", background: TEXT }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ margin: "0 0 14px 0", fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.15 }}>
            {seller ? `Ready, ${seller}?` : "Ready to save hours every week?"}
          </h2>
          <p style={{ margin: "0 0 30px 0", fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
            Start with 10 free listings. No credit card. No commitment.
          </p>
          <Link to={ctaUrl} onClick={handleSignupClick} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "16px 32px", background: "#fff", color: TEXT,
            fontSize: 15, fontWeight: 800, borderRadius: 12,
            textDecoration: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          }}>
            Start free — 10 listings, no card required →
          </Link>
        </div>
      </section>

      {/* ── Footer strip ── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <Link to="/"><img src="/PARTS-LISTER-LOGO.png" alt="PartLister" style={{ height: 24, opacity: 0.6 }} /></Link>
        <div style={{ display: "flex", gap: 20 }}>
          {[["Privacy Policy", "/privacy"], ["Terms", "/terms"], ["Contact", "/contact"]].map(([l, h]) => (
            <Link key={l} to={h} style={{ fontSize: 12, color: DIM, textDecoration: "none" }}>{l}</Link>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .demo-hero-grid     { grid-template-columns: 1fr !important; }
          .demo-features-grid { grid-template-columns: 1fr !important; }
          .demo-compare-grid  { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
