import { useEffect, useRef, useState } from "react";

const TEXT = "#132A46";
const MUTED = "#4d6a8a";
const DIM = "#7a96b0";
const ACCENT = "#135DFF";
const ACCENT_LIGHT = "#EEF5FF";
const BORDER = "#dde7f5";
const BG_ALT = "#f4f7fc";

// ─── Pill tag ────────────────────────────────────────────────────────────────
function Pill({ label, blue }: { label: string; blue?: boolean }) {
  return (
    <span style={{
      display: "inline-block",
      fontSize: 11,
      fontWeight: 700,
      background: blue ? ACCENT_LIGHT : "#f4f7fc",
      color: blue ? ACCENT : TEXT,
      border: `1px solid ${blue ? "#c7d9ff" : BORDER}`,
      borderRadius: 6,
      padding: "3px 10px",
      whiteSpace: "nowrap" as const,
    }}>{label}</span>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 800, color: ACCENT, textTransform: "uppercase" as const, letterSpacing: "0.09em", marginBottom: 7 }}>
      {children}
    </div>
  );
}

// ─── Listing Generator Visual (animated) ─────────────────────────────────────
function ListingGeneratorVisual() {
  const sections = ["title", "oe", "interchangeable", "description", "compatibility"] as const;
  type Section = typeof sections[number];
  const [active, setActive] = useState<Section>("title");
  const [generated, setGenerating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // auto-cycle through sections
    const cycle = () => {
      setActive(prev => {
        const idx = sections.indexOf(prev);
        return sections[(idx + 1) % sections.length];
      });
    };
    timerRef.current = setInterval(cycle, 2800);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setActive("title"); }, 600);
  };

  const oeNums = ["G4D3601ACA", "JDE36769", "LR073640"];
  const interNums = ["AJUSA 103272", "BGA CH4205A", "ELRING 207.140", "FAI HG2335"];
  const descLines = [
    "Product overview",
    "OE replacement numbers",
    "Interchangeable references",
    "Compatibility summary",
    "Buyer fitment warning",
  ];
  const compatRows = [
    { v: "Jaguar XE 2.0D", y: "2015–2021", kw: "120", hp: "163", cc: "1999", eng: "AJ200D" },
    { v: "Jaguar XF 2.0D", y: "2015–2021", kw: "132", hp: "180", cc: "1999", eng: "204DTD" },
    { v: "Discovery Sport 2.0D", y: "2014–2019", kw: "110", hp: "150", cc: "1999", eng: "204DTD" },
  ];

  return (
    <div style={{ background: BG_ALT, borderRadius: 14, padding: 18, border: `1px solid ${BORDER}`, marginTop: 20 }}>

      {/* Input */}
      <div style={{ marginBottom: 14 }}>
        <SectionLabel>OE / Article No.</SectionLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 700, color: TEXT, letterSpacing: "0.04em" }}>
            LR073640
          </div>
          <button
            onClick={handleGenerate}
            style={{ background: generated ? "#10b981" : ACCENT, color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "background 0.3s", whiteSpace: "nowrap" as const }}
          >
            {generated ? "✓ Done" : "Generate"}
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" as const }}>
        {([
          { key: "title", label: "Title" },
          { key: "oe", label: "OE Numbers" },
          { key: "interchangeable", label: "Cross-Refs" },
          { key: "description", label: "Description" },
          { key: "compatibility", label: "Compatibility" },
        ] as { key: Section; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => {
              setActive(t.key);
              if (timerRef.current) clearInterval(timerRef.current);
            }}
            style={{
              fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 6, border: `1px solid ${active === t.key ? ACCENT : BORDER}`,
              background: active === t.key ? ACCENT : "#fff", color: active === t.key ? "#fff" : MUTED, cursor: "pointer", transition: "all 0.2s",
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Panel */}
      <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px", minHeight: 100, marginBottom: 12, transition: "all 0.3s" }}>

        {active === "title" && (
          <>
            <SectionLabel>Generated Title</SectionLabel>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, lineHeight: 1.55 }}>
              Gasket Cylinder Head for Jaguar XE XF 2.0D 2015–2021
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" as const }}>
              <span style={{ fontSize: 10, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 5, padding: "2px 8px", fontWeight: 700 }}>✓ SEO optimised</span>
              <span style={{ fontSize: 10, color: ACCENT, background: ACCENT_LIGHT, border: `1px solid ${BORDER}`, borderRadius: 5, padding: "2px 8px", fontWeight: 700 }}>eBay ready</span>
            </div>
          </>
        )}

        {active === "oe" && (
          <>
            <SectionLabel>OE Numbers</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
              {oeNums.map(n => <Pill key={n} label={n} blue />)}
            </div>
          </>
        )}

        {active === "interchangeable" && (
          <>
            <SectionLabel>Interchangeable Numbers</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
              {interNums.map(n => <Pill key={n} label={n} />)}
            </div>
          </>
        )}

        {active === "description" && (
          <>
            <SectionLabel>Description Preview</SectionLabel>
            {descLines.map((line, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: MUTED, padding: "3px 0", borderBottom: i < descLines.length - 1 ? `1px dashed ${BORDER}` : "none" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: ACCENT, flexShrink: 0, opacity: 0.6 }} />
                {line}
              </div>
            ))}
          </>
        )}

        {active === "compatibility" && (
          <>
            <SectionLabel>Compatibility Preview</SectionLabel>
            <div style={{ overflowX: "auto" as const }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 10.5 }}>
                <thead>
                  <tr style={{ background: BG_ALT }}>
                    {["Vehicle", "Years", "kW", "HP", "CC", "Engine Code"].map(h => (
                      <th key={h} style={{ padding: "5px 7px", textAlign: "left" as const, fontWeight: 800, color: DIM, fontSize: 9, textTransform: "uppercase" as const, letterSpacing: "0.06em", whiteSpace: "nowrap" as const, borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compatRows.map((r, i) => (
                    <tr key={i} style={{ borderBottom: i < compatRows.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                      <td style={{ padding: "5px 7px", fontWeight: 700, color: TEXT, fontSize: 10.5, whiteSpace: "nowrap" as const }}>{r.v}</td>
                      <td style={{ padding: "5px 7px", color: MUTED, whiteSpace: "nowrap" as const }}>{r.y}</td>
                      <td style={{ padding: "5px 7px", color: MUTED }}>{r.kw}</td>
                      <td style={{ padding: "5px 7px", color: MUTED }}>{r.hp}</td>
                      <td style={{ padding: "5px 7px", color: MUTED }}>{r.cc}</td>
                      <td style={{ padding: "5px 7px" }}><span style={{ background: ACCENT_LIGHT, color: ACCENT, borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{r.eng}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, background: ACCENT, color: "#fff", borderRadius: 8, padding: "9px 0", fontSize: 12, fontWeight: 700, textAlign: "center" as const, cursor: "pointer" }}>Copy HTML</div>
        <div style={{ flex: 1, background: "#fff", border: `1px solid ${BORDER}`, color: TEXT, borderRadius: 8, padding: "9px 0", fontSize: 12, fontWeight: 700, textAlign: "center" as const, cursor: "pointer" }}>Export CSV</div>
      </div>
    </div>
  );
}

// ─── Smart Pricing Visual ────────────────────────────────────────────────────
function SmartPricingVisual() {
  const bars = [18, 28, 50, 72, 100, 88, 65, 42, 24, 12];
  return (
    <div style={{ background: BG_ALT, borderRadius: 12, padding: 16, border: `1px solid ${BORDER}`, marginTop: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: DIM, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Price Distribution — eBay Sold Listings</div>
      <div style={{ position: "relative", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 56 }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, background: i >= 3 && i <= 6 ? ACCENT : BORDER, borderRadius: "3px 3px 0 0", opacity: i >= 3 && i <= 6 ? (i === 4 ? 1 : 0.6) : 0.45 }} />
          ))}
        </div>
        <div style={{ position: "absolute", top: 0, left: "47%", transform: "translateX(-50%)", display: "flex", flexDirection: "column" as const, alignItems: "center" }}>
          <div style={{ background: ACCENT, color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 4, whiteSpace: "nowrap" as const }}>Your price</div>
          <div style={{ width: 1.5, height: 12, background: ACCENT }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: DIM, marginBottom: 12 }}>
        <span>£185</span><span>£295</span><span>£415</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {[{ label: "Low", val: "£185", c: "#dc2626", bg: "#fff5f5", b: "#fecaca" }, { label: "Median", val: "£295", c: ACCENT, bg: ACCENT_LIGHT, b: BORDER }, { label: "High", val: "£415", c: "#16a34a", bg: "#f0fdf4", b: "#bbf7d0" }].map(m => (
          <div key={m.label} style={{ flex: 1, background: m.bg, border: `1px solid ${m.b}`, borderRadius: 8, padding: "7px 6px", textAlign: "center" as const }}>
            <div style={{ fontSize: 9, color: m.c, fontWeight: 700, marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>{m.val}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 7, padding: "7px 10px" }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a" }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>Competitive range</span>
        <span style={{ fontSize: 11, color: DIM, marginLeft: "auto" }}>£240 – £340</span>
      </div>
    </div>
  );
}

// ─── Compatibility Checker Visual ────────────────────────────────────────────
function CompatibilityVisual() {
  return (
    <div style={{ background: BG_ALT, borderRadius: 10, padding: 14, border: `1px solid ${BORDER}`, marginTop: 16 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "7px 10px" }}>
          <div style={{ fontSize: 9, color: DIM, marginBottom: 2 }}>Vehicle</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>Jaguar XE 2.0D</div>
        </div>
        <div style={{ flex: 1, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "7px 10px" }}>
          <div style={{ fontSize: 9, color: DIM, marginBottom: 2 }}>Part No.</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>LR073640</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 7, padding: "7px 10px", marginBottom: 10 }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="#dc2626" strokeWidth="1.6" strokeLinecap="round"/></svg>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>Not compatible</span>
      </div>
      <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 12px" }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Compatible part number found</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, background: BG_ALT, border: `1px solid ${BORDER}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: DIM, marginBottom: 1 }}>OEM</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>JDE36769</div>
          </div>
          <div style={{ background: "#16a34a", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "5px 10px", whiteSpace: "nowrap" as const }}>Use this part</div>
        </div>
      </div>
    </div>
  );
}

// ─── Item Specifics Visual ────────────────────────────────────────────────────
function ItemSpecificsVisual() {
  const rows = [
    { k: "Brand", v: "Genuine OEM" },
    { k: "OE Part Number", v: "LR073640" },
    { k: "Placement", v: "Engine" },
    { k: "Condition", v: "New" },
    { k: "Warranty", v: "12 months" },
  ];
  return (
    <div style={{ background: BG_ALT, borderRadius: 10, padding: 12, border: `1px solid ${BORDER}`, marginTop: 14 }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, padding: "5px 0", borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : "none" }}>
          <span style={{ color: MUTED }}>{row.k}</span>
          <span style={{ color: TEXT, fontWeight: 700 }}>{row.v}</span>
        </div>
      ))}
    </div>
  );
}

// ─── CSV Export Visual ────────────────────────────────────────────────────────
function CSVVisual() {
  return (
    <div style={{ background: BG_ALT, borderRadius: 10, padding: 12, border: `1px solid ${BORDER}`, marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <div style={{ background: ACCENT, color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "6px 14px" }}>Save as CSV</div>
      </div>
      <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 7, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.2fr", background: BG_ALT, borderBottom: `1px solid ${BORDER}`, padding: "5px 10px" }}>
          {["SKU", "Title", "OE Number"].map(h => (
            <div key={h} style={{ fontSize: 9, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
          ))}
        </div>
        {[
          { sku: "JDG-001", title: "Gasket Cyl. Head...", oe: "LR073640" },
          { sku: "JDG-002", title: "Brake Caliper F...", oe: "1K0615123A" },
        ].map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.2fr", padding: "5px 10px", borderBottom: i === 0 ? `1px solid ${BORDER}` : "none" }}>
            <div style={{ fontSize: 10, color: MUTED }}>{row.sku}</div>
            <div style={{ fontSize: 10, color: TEXT, fontWeight: 600 }}>{row.title}</div>
            <div style={{ fontSize: 10, color: MUTED }}>{row.oe}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5 }}>
        {["Description HTML", "Compatibility"].map(t => (
          <span key={t} style={{ fontSize: 10, fontWeight: 700, color: ACCENT, background: ACCENT_LIGHT, border: `1px solid ${BORDER}`, borderRadius: 5, padding: "2px 8px" }}>✓ {t}</span>
        ))}
        <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 5, padding: "2px 8px" }}>Batch export ready</span>
      </div>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────
export default function Features() {
  return (
    <section id="features" style={{ background: "#ffffff", padding: "90px 24px", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "6px 16px", marginBottom: 20 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT, letterSpacing: "0.05em" }}>FEATURES</span>
          </div>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 800, color: TEXT, margin: "0 0 16px", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
            Everything you need to list<br /><span style={{ color: ACCENT }}>auto parts faster</span>
          </h2>
          <p style={{ fontSize: 15, color: MUTED, maxWidth: 620, margin: "0 auto", lineHeight: 1.7 }}>
            From OE number lookup to eBay-ready listing content, pricing checks, compatibility checks, item specifics and CSV export — Part Lister helps structure the full listing workflow.
          </p>
        </div>

        {/* Row 1 — Listing Generator full width */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ background: "#fff", border: `2px solid ${ACCENT}`, borderRadius: 22, padding: "36px 40px", boxShadow: "0 8px 40px rgba(19,93,255,0.11)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 40, alignItems: "start" }}>
              {/* Left — text */}
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ACCENT_LIGHT, border: `1px solid #c7d9ff`, borderRadius: 8, padding: "4px 12px", marginBottom: 18 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: ACCENT, letterSpacing: "0.06em", textTransform: "uppercase" }}>Core Feature</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, background: ACCENT_LIGHT, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: TEXT }}>Listing Generator</div>
                    <div style={{ fontSize: 12, color: DIM }}>OE number → structured eBay listing</div>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, margin: "0 0 24px" }}>
                  Enter an OE, OEM or article number and Part Lister generates the listing title, formatted OE references, interchangeable numbers, description structure and compatibility data — ready to copy or export.
                </p>
                {/* Output checklist */}
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                  {[
                    "eBay-ready title",
                    "OE & OEM numbers",
                    "Interchangeable cross-references",
                    "Structured description",
                    "Compatibility table (kW, HP, CC, engine codes)",
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: TEXT }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: ACCENT_LIGHT, border: `1px solid #c7d9ff`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — interactive visual */}
              <div>
                <ListingGeneratorVisual />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2 — Smart Pricing + 3 smaller */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>

          {/* Smart Pricing */}
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 20, padding: 30, boxShadow: "0 4px 24px rgba(19,93,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, background: ACCENT_LIGHT, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: TEXT }}>Smart Pricing</div>
                <div style={{ fontSize: 12, color: DIM }}>Live eBay market data</div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65, margin: 0 }}>
              Compare active and sold listings, see low, median and high prices, and choose a more confident selling price.
            </p>
            <SmartPricingVisual />
          </div>

          {/* Compatibility Checker */}
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 20, padding: 30, boxShadow: "0 4px 24px rgba(19,93,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, background: ACCENT_LIGHT, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: TEXT }}>Compatibility Checker</div>
                <div style={{ fontSize: 12, color: DIM }}>Check if a part fits the vehicle</div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65, margin: 0 }}>
              Enter a vehicle and part reference to confirm compatibility. If not compatible, Part Lister shows the correct part number when available.
            </p>
            <CompatibilityVisual />
          </div>
        </div>

        {/* Row 3 — Item Specifics + CSV */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

          {/* eBay Item Specifics */}
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 18, padding: 26 }}>
            <div style={{ width: 42, height: 42, background: ACCENT_LIGHT, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, marginBottom: 2 }}>eBay Item Specifics</div>
            <div style={{ fontSize: 11, color: DIM, marginBottom: 10 }}>Structured fields, ready to copy</div>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: 0 }}>
              Generate the key eBay item fields separately, ready to copy into your listing or export workflow.
            </p>
            <ItemSpecificsVisual />
          </div>

          {/* CSV / Bulk Export */}
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 18, padding: 26 }}>
            <div style={{ width: 42, height: 42, background: ACCENT_LIGHT, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, marginBottom: 2 }}>CSV / Bulk Export</div>
            <div style={{ fontSize: 11, color: DIM, marginBottom: 10 }}>Save listings for batch upload</div>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: 0 }}>
              Save generated listings as CSV files for bulk upload, batch export or record keeping.
            </p>
            <CSVVisual />
          </div>
        </div>

      </div>
    </section>
  );
}
