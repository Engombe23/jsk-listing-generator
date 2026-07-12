import { Link, useParams, Navigate } from "react-router-dom";
import "../landing/landing-v2.css";
import Navbar from "../landing/Navbar";
import Footer from "../landing/Footer";

const TEXT   = "#132A46";
const MUTED  = "#4d6a8a";
const DIM    = "#7a96b0";
const BORDER = "#dde7f5";
const ACCENT = "#135DFF";
const ACCENT_LIGHT = "#EEF5FF";
const GREEN  = "#16a34a";
const GREEN_LIGHT = "#f0fdf4";

// ─── Inline visual components ─────────────────────────────────────────────────

function StepFlow({ steps }) {
  return (
    <div style={{
      display: "flex", alignItems: "stretch", gap: 0,
      background: "#f7f9fc", border: `1px solid ${BORDER}`,
      borderRadius: 14, overflow: "hidden", marginBottom: 24,
    }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "stretch", flex: 1 }}>
          <div style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            textAlign: "center", padding: "20px 14px", gap: 8,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: ACCENT, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 900, flexShrink: 0,
            }}>{i + 1}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: TEXT, lineHeight: 1.3 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{s.sub}</div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ display: "flex", alignItems: "center", color: DIM, fontSize: 18, paddingRight: 4, flexShrink: 0 }}>›</div>
          )}
        </div>
      ))}
    </div>
  );
}

const COMPAT_ROWS = [
  { vehicle: "BMW 3 Series (E90) 318d",  years: "2007-09→2012-12", kw: 105, hp: 143, cc: 1995, code: "N47D20C" },
  { vehicle: "BMW 3 Series (E90) 320d",  years: "2005-09→2012-12", kw: 120, hp: 163, cc: 1995, code: "N47D20A" },
  { vehicle: "BMW 3 Series (E91) 318d",  years: "2007-09→2012-12", kw: 105, hp: 143, cc: 1995, code: "N47D20C" },
  { vehicle: "BMW 3 Series (E92) 320d",  years: "2006-09→2010-09", kw: 120, hp: 163, cc: 1995, code: "N47D20A" },
  { vehicle: "BMW 5 Series (E60) 520d",  years: "2007-03→2010-03", kw: 120, hp: 163, cc: 1995, code: "N47D20A" },
];

function CompatTableDemo() {
  return (
    <div style={{ marginBottom: 24, borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}` }}>
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .compat-row { animation: fadeSlide 0.4s ease forwards; opacity: 0; }
        .compat-row:nth-child(1) { animation-delay: 0.1s; }
        .compat-row:nth-child(2) { animation-delay: 0.3s; }
        .compat-row:nth-child(3) { animation-delay: 0.5s; }
        .compat-row:nth-child(4) { animation-delay: 0.7s; }
        .compat-row:nth-child(5) { animation-delay: 0.9s; }
      `}</style>

      {/* dark make header */}
      <div style={{ background: "#1f2937", color: "#fff", padding: "7px 12px", fontSize: 12, fontWeight: 800, textAlign: "center" }}>
        BMW Models — 58 applications
      </div>

      {/* column headers */}
      <div style={{
        display: "grid", gridTemplateColumns: "2fr 1.6fr 0.6fr 0.6fr 0.7fr 1.4fr",
        background: "#f1f5f9", padding: "6px 12px",
        borderBottom: `1px solid ${BORDER}`,
      }}>
        {[
          { label: "Vehicle", note: "Make, model & variant" },
          { label: "Years",   note: "Application date range" },
          { label: "kW",      note: "Power" },
          { label: "HP",      note: "Horsepower" },
          { label: "CC",      note: "Displacement" },
          { label: "Engine Code", note: "Manufacturer ID" },
        ].map(({ label, note }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: TEXT, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
            <span style={{ fontSize: 9.5, color: ACCENT, fontWeight: 600 }}>{note}</span>
          </div>
        ))}
      </div>

      {/* data rows */}
      {COMPAT_ROWS.map((r, i) => (
        <div
          key={r.vehicle}
          className="compat-row"
          style={{
            display: "grid", gridTemplateColumns: "2fr 1.6fr 0.6fr 0.6fr 0.7fr 1.4fr",
            padding: "7px 12px", alignItems: "center",
            background: i % 2 === 0 ? "#fff" : "#fafafa",
            borderBottom: i < COMPAT_ROWS.length - 1 ? `1px solid ${BORDER}` : "none",
          }}
        >
          <span style={{ fontSize: 11.5, fontWeight: 600, color: TEXT }}>{r.vehicle}</span>
          <span style={{ fontSize: 11, color: MUTED }}>{r.years}</span>
          <span style={{ fontSize: 11, color: MUTED, textAlign: "center" }}>{r.kw}</span>
          <span style={{ fontSize: 11, color: MUTED, textAlign: "center" }}>{r.hp}</span>
          <span style={{ fontSize: 11, color: MUTED, textAlign: "center" }}>{r.cc}</span>
          <span style={{ fontSize: 10.5, color: "#2563eb", fontFamily: "monospace", fontWeight: 600 }}>{r.code}</span>
        </div>
      ))}
    </div>
  );
}

const BINS = [
  { label: "£20", h: 12 }, { label: "£40", h: 16 }, { label: "£60", h: 24 },
  { label: "£80", h: 82, active: true }, { label: "£100", h: 38 }, { label: "£120", h: 18 },
  { label: "£160", h: 12 }, { label: "£200", h: 8 }, { label: "£380", h: 4 },
];

function PriceHistogramDemo() {
  const maxH = 82;
  const barW = 34;
  const gapW = 8;
  const totalW = BINS.length * (barW + gapW) - gapW;
  const chartH = 110;

  return (
    <div style={{
      background: "#f7f9fc", border: `1px solid ${BORDER}`,
      borderRadius: 14, padding: "20px 20px 12px", marginBottom: 24,
    }}>
      <style>{`
        @keyframes growUp {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
        .hist-bar {
          transform-origin: bottom;
          animation: growUp 0.6s cubic-bezier(0.22,1,0.36,1) forwards;
          transform: scaleY(0);
        }
        ${BINS.map((_, i) => `.hist-bar:nth-child(${i + 1}) { animation-delay: ${i * 0.07}s; }`).join("\n")}
      `}</style>

      {/* labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        {["Low  £38", "Median  £81", "Avg  £89", "High  £249"].map((l) => (
          <div key={l} style={{ textAlign: "center" }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: MUTED }}>{l}</span>
          </div>
        ))}
      </div>

      {/* chart */}
      <svg width="100%" viewBox={`0 0 ${totalW + 40} ${chartH + 24}`} style={{ display: "block", overflow: "visible" }}>
        {BINS.map((b, i) => {
          const x = 20 + i * (barW + gapW);
          const barH = (b.h / maxH) * chartH;
          const y = chartH - barH;
          return (
            <g key={b.label}>
              <rect
                className="hist-bar"
                x={x} y={y} width={barW} height={barH}
                rx={4}
                fill={b.active ? ACCENT : "#c7d8f7"}
              />
              <text x={x + barW / 2} y={chartH + 14} textAnchor="middle"
                style={{ fontSize: 9, fill: b.active ? ACCENT : DIM, fontWeight: b.active ? 800 : 400, fontFamily: "inherit" }}>
                {b.label}
              </text>
            </g>
          );
        })}
        {/* baseline */}
        <line x1={16} y1={chartH} x2={totalW + 28} y2={chartH} stroke={BORDER} strokeWidth={1} />
        {/* price beam */}
        <line x1={20 + 3 * (barW + gapW) + barW / 2} y1={0} x2={20 + 3 * (barW + gapW) + barW / 2} y2={chartH}
          stroke={ACCENT} strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={20 + 3 * (barW + gapW) + barW / 2} y={-4} textAnchor="middle"
          style={{ fontSize: 9.5, fill: ACCENT, fontWeight: 800, fontFamily: "inherit" }}>
          Your price
        </text>
      </svg>

      <p style={{ margin: "8px 0 0", fontSize: 11.5, color: MUTED, textAlign: "center" }}>
        Price distribution across 60 active eBay listings · tallest bar = most competition
      </p>
    </div>
  );
}

function ExportOptionsDemo() {
  const opts = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
        </svg>
      ),
      label: "Copy HTML",
      desc: "Paste directly into an eBay listing form",
      bg: ACCENT, color: "#fff",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      ),
      label: "Export CSV",
      desc: "Bulk import via eBay Seller Hub upload tool",
      bg: GREEN_LIGHT, color: GREEN,
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
      ),
      label: "Save Listing",
      desc: "Store in Saved Listings to use or export later",
      bg: "#f7f9fc", color: MUTED,
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
      {opts.map((o) => (
        <div key={o.label} style={{
          border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 14px",
          display: "flex", flexDirection: "column", gap: 10, background: "#fff",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: o.bg, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {o.icon}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: TEXT, marginBottom: 4 }}>{o.label}</div>
            <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{o.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CalcBreakdownDemo() {
  const rows = [
    { label: "Selling price",               value: "£81.95", color: TEXT,    bold: true },
    { label: "− Product cost",              value: "−£35.00", color: "#dc2626" },
    { label: "− Postage & packaging",       value: "−£5.00",  color: "#dc2626" },
    { label: "− eBay fees (12.8% + £0.30)", value: "−£10.79", color: "#dc2626" },
    { label: "− VAT → HMRC",               value: "−£13.66", color: "#dc2626", note: "You keep none of this" },
    { label: "= Net profit",               value: "£17.50", color: GREEN,   bold: true, border: true },
  ];

  return (
    <div style={{
      background: "#f7f9fc", border: `1px solid ${BORDER}`,
      borderRadius: 14, overflow: "hidden", marginBottom: 24,
    }}>
      {/* headline stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderBottom: `1px solid ${BORDER}` }}>
        {[
          { label: "Selling Price", value: "£81.95", color: ACCENT },
          { label: "Net Profit",    value: "£17.50", color: GREEN },
          { label: "Margin",        value: "21.4%",  color: TEXT },
          { label: "Markup",        value: "50.0%",  color: TEXT },
        ].map((s, i) => (
          <div key={s.label} style={{
            padding: "14px 16px", textAlign: "center",
            borderRight: i < 3 ? `1px solid ${BORDER}` : "none",
            background: "#fff",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: "-0.5px" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* breakdown */}
      <div style={{ padding: "8px 0" }}>
        {rows.map((r) => (
          <div key={r.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 16px",
            borderTop: r.border ? `1px solid ${BORDER}` : "none",
            marginTop: r.border ? 4 : 0,
          }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: r.bold ? 700 : 400, color: r.bold ? TEXT : MUTED }}>{r.label}</span>
              {r.note && <span style={{ marginLeft: 8, fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>{r.note}</span>}
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: r.color }}>{r.value}</span>
          </div>
        ))}
      </div>

      {/* break-even */}
      <div style={{ padding: "10px 16px", borderTop: `1px solid ${BORDER}`, background: ACCENT_LIGHT }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12.5, color: TEXT, fontWeight: 600 }}>Break-even price</span>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: ACCENT }}>£57.14</span>
        </div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>Selling below this price means selling at a loss</div>
      </div>
    </div>
  );
}

function ArticleImage({ src, alt, caption }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        borderRadius: 12, overflow: "hidden",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 4px 20px rgba(19,45,70,0.08)",
      }}>
        <img src={src} alt={alt} style={{ width: "100%", display: "block", maxHeight: 520, objectFit: "cover", objectPosition: "center" }} />
      </div>
      {caption && (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: DIM, textAlign: "center", fontStyle: "italic" }}>{caption}</p>
      )}
    </div>
  );
}

function ProductExample({ src, alt, partNumber, description }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      background: "#fff", border: `1px solid ${BORDER}`,
      borderRadius: 12, padding: "14px 16px", marginBottom: 24,
    }}>
      <img src={src} alt={alt} style={{ width: 72, height: 72, objectFit: "contain", borderRadius: 8, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
          Example part
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: TEXT, marginBottom: 2 }}>{description}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <code style={{ fontSize: 11.5, background: ACCENT_LIGHT, border: `1px solid ${BORDER}`, borderRadius: 5, padding: "2px 7px", color: ACCENT, fontWeight: 700 }}>
            LR002465
          </code>
          <code style={{ fontSize: 11.5, background: "#f7f9fc", border: `1px solid ${BORDER}`, borderRadius: 5, padding: "2px 7px", color: MUTED }}>
            {partNumber}
          </code>
        </div>
      </div>
    </div>
  );
}

// ─── Article data ─────────────────────────────────────────────────────────────

const ARTICLES = {
  "how-to-generate-your-first-listing": {
    title: "How to generate your first listing",
    category: "Getting Started",
    time: "5 min read",
    heroImage: { src: "/listing-mockup.png", alt: "PartLister listing generator interface", caption: "The Listing Generator — enter a part number and get a complete eBay listing in seconds" },
    intro: "PartLister turns a single part number into a complete eBay-ready listing in seconds. This guide walks you through the full process.",
    sections: [
      {
        heading: "The full process at a glance",
        content: [
          { type: "visual", node: (
            <StepFlow steps={[
              { label: "Enter part number", sub: "OE, OEM or article no." },
              { label: "Search & Generate", sub: "PartLister finds the part" },
              { label: "Review listing", sub: "Edit title & description" },
              { label: "Save or export", sub: "Copy HTML or CSV" },
            ]} />
          )},
        ],
      },
      {
        heading: "Step 1 — Open the Listing Generator",
        content: [
          { type: "p", text: "Once logged in, the Listing Generator is the first tool you'll see on the dashboard. It's also accessible from the main navigation at any time." },
        ],
      },
      {
        heading: "Step 2 — Enter your part number",
        content: [
          { type: "p", text: "Paste or type a reference number into the search field. PartLister accepts any of the following:" },
          { type: "list", items: ["OE number (e.g. 11247807345)", "OEM number", "TecDoc article number (e.g. PU0127, LR002465)"] },
          { type: "visual", node: (
            <ProductExample
              src="/oil-pump.png"
              alt="Oil pump LR002465"
              partNumber="PU0127"
              description="Oil Pump — Land Rover / Range Rover 2.7 3.0 TDV6"
            />
          )},
          { type: "p", text: "You don't need to specify the brand or part type — PartLister identifies the part automatically from your reference number." },
        ],
      },
      {
        heading: "Step 3 — Click Search & Generate",
        content: [
          { type: "p", text: "PartLister searches TecDoc for matching parts. In most cases a single match is found and generation starts immediately. If multiple articles share the same reference, you'll see a selection list — choose the correct variant and generation begins." },
        ],
      },
      {
        heading: "Step 4 — Choose a template (optional)",
        content: [
          { type: "p", text: "PartLister offers several listing templates that control the layout and sections included. Select the one that suits your house style before generating. The default template works well for most automotive parts categories." },
        ],
      },
      {
        heading: "Step 5 — Review your listing",
        content: [
          { type: "p", text: "Once generated, you'll see your complete listing. You can edit the description directly by clicking Edit Description above the preview. Every listing can include:" },
          { type: "list", items: [
            "Listing title — SEO-optimised for eBay search",
            "Product description — formatted and ready to paste",
            "Item specifics — brand, condition, part number, fitment",
            "Vehicle compatibility table — every application from TecDoc",
            "OE references and interchangeable numbers",
          ]},
        ],
      },
      {
        heading: "Step 6 — Save or export",
        content: [
          { type: "p", text: "When you're happy with the listing, you have three options:" },
          { type: "visual", node: <ExportOptionsDemo /> },
          { type: "tip", text: "PartLister remembers your template and toggle preferences between sessions, so you don't need to reconfigure each time you generate a listing." },
        ],
      },
    ],
  },

  "understanding-compatibility-results": {
    title: "Understanding compatibility results",
    category: "Listing Generator",
    time: "4 min read",
    intro: "PartLister automatically generates vehicle compatibility tables from TecDoc data. This guide explains where the data comes from, how to read it, and what to do if something looks unexpected.",
    sections: [
      {
        heading: "Where the compatibility data comes from",
        content: [
          { type: "p", text: "PartLister uses TecDoc — the industry-standard automotive parts catalogue used by manufacturers, importers and aftermarket suppliers worldwide." },
          { type: "p", text: "When you generate a listing, PartLister fetches all vehicle applications for your part from TecDoc and formats them into a structured compatibility table. This is the same data used by professional parts catalogues — not scraped, estimated or generated by AI." },
        ],
      },
      {
        heading: "Reading the compatibility table",
        content: [
          { type: "p", text: "The table shows one row per vehicle application. Here's a live example with each column labelled:" },
          { type: "visual", node: <CompatTableDemo /> },
          { type: "list", items: [
            "Vehicle — Make, model, body type and variant",
            "Years — The date range the application covers",
            "kW / HP — Engine power in kilowatts and horsepower",
            "CC — Engine displacement in cubic centimetres",
            "Engine code — The manufacturer's engine type identifier",
          ]},
        ],
      },
      {
        heading: "Engine codes",
        content: [
          { type: "p", text: "Engine codes are particularly important for parts that are engine-specific — timing components, oil pumps, gaskets, injectors. The same model year and body style can use completely different engines, and therefore completely different parts." },
          { type: "visual", node: (
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              background: "#fff", border: `1px solid ${BORDER}`,
              borderRadius: 12, padding: "14px 16px", marginBottom: 24,
            }}>
              <img src="/gasket-photo.png" alt="Gasket example" style={{ width: 80, height: 56, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Example</div>
                <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.55 }}>
                  A head gasket for a <strong>BMW 320d N47</strong> will not fit a <strong>BMW 320d M47</strong> — same model, different engine, different part. Engine codes prevent this mistake.
                </div>
              </div>
            </div>
          )},
          { type: "p", text: "Always include engine codes in your listing. Professional fitters and knowledgeable buyers use them to verify compatibility before purchasing, which reduces returns and disputes." },
        ],
      },
      {
        heading: "What if the compatibility looks incorrect?",
        content: [
          { type: "p", text: "TecDoc data reflects the manufacturer's declared applications. In rare cases, applications may be incomplete, reflect regional variants, or show a transitional production vehicle." },
          { type: "p", text: "If you notice an obvious error, check TecDoc directly or consult your supplier's catalogue. PartLister does not modify TecDoc data — what you see is exactly what TecDoc reports." },
          { type: "tip", text: "The compatibility table is one of the most effective ways to reduce returns. Buyers can verify their vehicle is listed before purchasing, rather than discovering a fitment issue after delivery." },
        ],
      },
    ],
  },

  "smart-pricing-explained": {
    title: "Smart Pricing explained",
    category: "Pricing Tools",
    time: "6 min read",
    intro: "Smart Pricing pulls live eBay listing data and shows you a full price distribution — so you always know exactly where your price sits relative to the market before you list.",
    sections: [
      {
        heading: "What data does Smart Pricing use?",
        content: [
          { type: "p", text: "Smart Pricing searches active eBay listings for the same or equivalent part, using your OE number, OEM number and known interchangeable references to capture the full range of competing listings." },
          { type: "p", text: "The more interchangeable numbers a part has, the broader the pricing picture — because a buyer searching for any of those numbers may end up buying from any of those listings." },
        ],
      },
      {
        heading: "Reading the price distribution chart",
        content: [
          { type: "p", text: "The histogram shows the spread of prices across all active listings. Each bar represents a price range; its height shows how many listings are priced there. Your price is the vertical dashed line." },
          { type: "visual", node: <PriceHistogramDemo /> },
          { type: "list", items: [
            "The tallest cluster of bars is where most buyers are looking — pricing here maximises visibility",
            "Bars to the right are higher-priced outliers (often branded OEM parts)",
            "Your price beam shows instantly whether you're inside, above or below the cluster",
            "Click and drag on the chart to zoom into a specific price range",
          ]},
        ],
      },
      {
        heading: "Key metrics",
        content: [
          { type: "p", text: "Below the chart, four summary figures give you a quick read on the market:" },
          { type: "list", items: [
            "Low — The lowest price currently listed",
            "Average — The mean price across all listings",
            "Median — The midpoint price; not skewed by outliers",
            "High — The highest price listed",
          ]},
          { type: "p", text: "The median is usually the most reliable benchmark. Unlike the average, it is not pulled up by a single high-priced OEM listing among aftermarket competitors." },
        ],
      },
      {
        heading: "The seller listings panel",
        content: [
          { type: "p", text: "Alongside the chart, PartLister shows you the individual eBay listings that make up the data — title, price and seller rating. This lets you assess whether a listing at a given price point is a genuine competitor or an outlier you can safely ignore." },
        ],
      },
      {
        heading: "How to use Smart Pricing to price competitively",
        content: [
          { type: "list", items: [
            "If your price is above the cluster, ask whether your listing justifies it — brand, condition, fast dispatch, high feedback",
            "If your price is below the cluster, you may be giving margin away unnecessarily",
            "Pricing at or just below the median is a reliable starting point for most parts",
            "For fast-moving commodity parts, matching the cluster is sufficient; for rarer parts there is more flexibility",
          ]},
          { type: "tip", text: "Use Smart Pricing alongside the Price Calculator. Once you find a competitive price in the chart, paste it into the calculator to confirm your margin before you commit." },
        ],
      },
    ],
  },

  "export-listings-to-ebay": {
    title: "Export listings to eBay",
    category: "Listing Generator",
    time: "3 min read",
    intro: "Once you've generated a listing in PartLister, there are three ways to get it onto eBay — copy HTML for immediate use, CSV for bulk importing, or save for later.",
    sections: [
      {
        heading: "Your three export options",
        content: [
          { type: "visual", node: <ExportOptionsDemo /> },
        ],
      },
      {
        heading: "Option 1 — Copy HTML",
        content: [
          { type: "p", text: "This is the quickest way to get a single listing onto eBay." },
          { type: "list", items: [
            "Generate your listing in the Listing Generator",
            "Click Copy HTML in the action bar",
            "Open your eBay listing form",
            "Click into the Item Description field and paste",
          ]},
          { type: "p", text: "The HTML formatting is preserved — your description renders with the correct headings, table layout and styling, exactly as PartLister generated it." },
        ],
      },
      {
        heading: "Option 2 — Export to CSV",
        content: [
          { type: "p", text: "CSV export is designed for eBay's bulk listing tool and is the best option if you're creating multiple listings at once." },
          { type: "list", items: [
            "Single listing: click Export CSV from the Listing Generator after generating",
            "Multiple listings: go to Saved Listings, select the listings you want, and click Export CSV",
          ]},
          { type: "p", text: "The exported CSV includes: title, description, item specifics, OE references, compatibility notes and pricing fields in eBay's expected column structure." },
        ],
      },
      {
        heading: "Importing your CSV into eBay",
        content: [
          { type: "p", text: "To import your CSV file into eBay Seller Hub:" },
          { type: "list", items: [
            "Go to eBay Seller Hub → Listings → Add listings",
            "Select Upload a file",
            "Choose your exported CSV file",
            "Review the column mapping (most columns map automatically)",
            "Complete any remaining required fields (price, postage) if not already included",
            "Review and publish",
          ]},
          { type: "tip", text: "Bulk CSV export is available on Growth and Scale plans. On Lite, you can export individual listings or use Copy HTML for immediate listing." },
        ],
      },
      {
        heading: "Option 3 — Save for later",
        content: [
          { type: "p", text: "Click Save Listing to store a generated listing in your Saved Listings. Come back at any time to copy, export or edit it. Saved listings count against your monthly allowance at the point of saving." },
        ],
      },
    ],
  },

  "how-to-use-the-compatibility-checker": {
    title: "How to use the Compatibility Checker",
    category: "Compatibility Checker",
    time: "3 min read",
    intro: "The Compatibility Checker lets you verify whether a part fits a specific vehicle before you list or sell it — using either a part number or VIN. Here's how to use it.",
    sections: [
      {
        heading: "What the Compatibility Checker does",
        content: [
          { type: "p", text: "The Compatibility Checker searches TecDoc's vehicle application database to confirm whether a specific part fits a specific vehicle. It returns a confidence score and full vehicle specification so you can be certain before committing to a sale." },
          { type: "p", text: "This is useful when a buyer asks \"will this fit my car?\", when you're listing a used part with a specific fitment, or when you want to verify an application that looks unexpected in the compatibility table." },
        ],
      },
      {
        heading: "How to run a check",
        content: [
          { type: "p", text: "Open the Compatibility tab from the main navigation. You'll see two input fields:" },
          { type: "list", items: [
            "Part number — Enter an OE number, OEM number or TecDoc article number",
            "Vehicle — Enter a VIN (Vehicle Identification Number) or search by make/model",
          ]},
          { type: "p", text: "Click Check Compatibility. PartLister queries TecDoc and returns a result within a few seconds." },
        ],
      },
      {
        heading: "Reading the result",
        content: [
          { type: "visual", node: (
            <div style={{
              background: "#f7f9fc", border: `1px solid ${BORDER}`,
              borderRadius: 14, overflow: "hidden", marginBottom: 24,
            }}>
              <div style={{ background: "#fff", padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: DIM, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Part</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>Oil Pump — PU0127</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: GREEN_LIGHT, border: `1px solid #bbf7d0`, borderRadius: 99, padding: "6px 14px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>Compatible · 92% confidence</span>
                </div>
              </div>
              <div style={{ padding: "14px 20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[["Vehicle", "Land Rover Discovery IV"], ["Engine", "306DT (TDV6 3.0)"], ["Power", "155 kW / 211 HP"], ["Years", "2010–2016"]].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: DIM, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )},
          { type: "list", items: [
            "Compatible — TecDoc confirms the part fits this vehicle application",
            "Confidence score — How precisely the part matches the vehicle (100% = exact application listed in TecDoc)",
            "Vehicle spec — Make, model, engine code, power and year range for the matched application",
          ]},
        ],
      },
      {
        heading: "What if no match is found?",
        content: [
          { type: "p", text: "If TecDoc has no application data for the combination you entered, the result will show as not found or low confidence. This can mean:" },
          { type: "list", items: [
            "The part does not fit that vehicle",
            "The part fits but the application isn't catalogued in TecDoc (common for older or rarer vehicles)",
            "The part number was entered incorrectly — try an alternative reference",
          ]},
          { type: "tip", text: "Always recommend that buyers verify compatibility against their own vehicle before ordering, even when TecDoc confirms a match. Regional variants and production date changes can affect fitment." },
        ],
      },
    ],
  },

  "choosing-a-listing-template": {
    title: "Choosing a listing template",
    category: "Listing Generator",
    time: "3 min read",
    intro: "PartLister offers several listing templates that control how your description is laid out and what sections it includes. This guide explains each one and how to use the content toggles.",
    sections: [
      {
        heading: "The built-in templates",
        content: [
          { type: "p", text: "Templates appear in the left panel of the Listing Generator before you generate. Select one and it will be applied to every listing you generate in that session." },
          { type: "visual", node: (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
              {[
                { name: "Clean Default", desc: "Simple, readable layout. Works for all categories. Good starting point for most sellers.", accent: ACCENT },
                { name: "Dark Header", desc: "Dark section headers with white text. Stands out in crowded search results.", accent: "#1f2937" },
                { name: "Table Focused", desc: "Leads with the compatibility table. Best for parts with many vehicle applications.", accent: GREEN },
                { name: "Minimal", desc: "Title and specs only — no description body. Fastest to generate, cleanest appearance.", accent: "#6b7280" },
                { name: "Professional Blue", desc: "Blue branded headers. Consistent house style for established sellers.", accent: "#2563eb" },
              ].map((t) => (
                <div key={t.name} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: "13px 14px", background: "#fff" }}>
                  <div style={{ width: 28, height: 4, borderRadius: 2, background: t.accent, marginBottom: 8 }} />
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: TEXT, marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.55 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          )},
        ],
      },
      {
        heading: "Content Options toggles",
        content: [
          { type: "p", text: "Below the template selector, three toggles let you control which sections are included in every listing you generate:" },
          { type: "list", items: [
            "Compatibility Table — includes the full vehicle application table. Recommended for all part types.",
            "Interchangeable Numbers — includes cross-reference part numbers. Helps buyers searching by alternative references.",
            "Engine Codes — includes manufacturer engine codes alongside the compatibility table. Recommended for engine-specific parts.",
          ]},
          { type: "p", text: "These toggles are saved between sessions, so you only need to set them once per account." },
        ],
      },
      {
        heading: "Saved templates",
        content: [
          { type: "p", text: "If you've customised a template and want to reuse it, you can save it under a custom name using the Saved Templates section in the left panel. Saved templates appear alongside the built-in options and can be applied with one click." },
          { type: "tip", text: "If you sell parts across multiple categories (e.g. engine internals and body panels), consider saving a separate template for each — different buyers respond to different layouts." },
        ],
      },
    ],
  },

  "understanding-part-references": {
    title: "Understanding part references",
    category: "Getting Started",
    time: "3 min read",
    intro: "PartLister accepts several types of part reference numbers. Understanding the difference helps you get the best results when generating listings.",
    sections: [
      {
        heading: "The three types of reference",
        content: [
          { type: "visual", node: (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {[
                { label: "OE Number", sub: "Original Equipment", example: "11247807345", color: ACCENT, bg: ACCENT_LIGHT, desc: "The manufacturer's own part number — e.g. a BMW OE number. Directly identifies the part in the manufacturer's catalogue." },
                { label: "OEM Number", sub: "Original Equipment Manufacturer", example: "LR002465", color: GREEN, bg: GREEN_LIGHT, desc: "The number assigned by the aftermarket or OEM supplier. Often matches the OE number or is a direct cross-reference." },
                { label: "Article Number", sub: "TecDoc catalogue reference", example: "PU0127 · AOP858", color: "#7c3aed", bg: "#faf5ff", desc: "The unique reference assigned by TecDoc to a specific part in their catalogue. Used by suppliers and data providers." },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", gap: 14, padding: "14px 16px", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: r.bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: r.color }}>{r.label.split(" ")[0]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: TEXT }}>{r.label}</span>
                      <span style={{ fontSize: 11, color: DIM }}>{r.sub}</span>
                    </div>
                    <code style={{ fontSize: 11, background: r.bg, border: `1px solid ${BORDER}`, borderRadius: 5, padding: "2px 7px", color: r.color, fontWeight: 700, marginBottom: 6, display: "inline-block" }}>{r.example}</code>
                    <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.6, marginTop: 4 }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )},
        ],
      },
      {
        heading: "Which to use in PartLister",
        content: [
          { type: "p", text: "PartLister accepts all three types. In most cases, any of them will return the correct part — PartLister searches across all reference types simultaneously." },
          { type: "list", items: [
            "If you have the OE number from the manufacturer's catalogue, use that — it gives the most precise match",
            "If you have a supplier's reference (OEM number), paste that in directly",
            "If you're working from a TecDoc catalogue export, use the article number",
          ]},
          { type: "p", text: "If PartLister finds multiple articles matching your reference (e.g. the same number used by different brands), it will show you a selection list so you can choose the correct one." },
        ],
      },
      {
        heading: "Tips for getting the best results",
        content: [
          { type: "list", items: [
            "Copy and paste the reference rather than typing it — transcription errors are the most common cause of no results",
            "Remove any spaces or hyphens if the first search returns nothing (e.g. try LR002465 instead of LR 002-465)",
            "If one reference type returns no results, try another — the same part is often catalogued under multiple references",
            "For very new or very old parts, TecDoc coverage may be incomplete — try the manufacturer's OE number directly",
          ]},
          { type: "tip", text: "PartLister also shows OE references and interchangeable numbers in the generated listing — these can be used to generate further listings for the same part under different reference numbers." },
        ],
      },
    ],
  },

  "using-the-price-calculator": {
    title: "Using the Price Calculator",
    category: "Pricing Tools",
    time: "4 min read",
    intro: "The Price Calculator shows you exactly what you keep from every sale — after eBay fees, VAT and your costs. This guide explains every field and how to find your ideal selling price.",
    sections: [
      {
        heading: "What the calculator shows you",
        content: [
          { type: "p", text: "Enter your selling price and costs, and the calculator breaks down exactly where every pound goes:" },
          { type: "visual", node: <CalcBreakdownDemo /> },
        ],
      },
      {
        heading: "What to enter",
        content: [
          { type: "list", items: [
            "Selling price — The price you plan to list at",
            "Product cost — What the part costs you (buy price or wholesale price)",
            "Postage & packaging — Your total fulfilment cost per sale, including packaging materials",
            "Ad rate — Your eBay Promoted Listings rate as a percentage. Leave at 0 if not using Promoted Listings",
          ]},
        ],
      },
      {
        heading: "Understanding the deductions",
        content: [
          { type: "list", items: [
            "eBay fees — Final value fee (currently 12.8% + £0.30 per order) plus any Promoted Listings ad fee",
            "VAT collected → HMRC — The VAT element of your selling price. This goes to HMRC regardless of whether you are VAT registered — it is never yours to keep",
          ]},
          { type: "p", text: "These two deductions catch most sellers by surprise. eBay fees plus VAT together typically account for 25–30% of the selling price before your product cost is considered." },
        ],
      },
      {
        heading: "Break-even price",
        content: [
          { type: "p", text: "The break-even price is the minimum selling price at which you make zero profit — covering your product cost, postage, eBay fees and VAT exactly." },
          { type: "p", text: "If you price below break-even, you are selling at a loss even if the gross revenue looks reasonable. The break-even figure is the absolute floor for any listing." },
        ],
      },
      {
        heading: "Finding the right selling price",
        content: [
          { type: "list", items: [
            "Use Smart Pricing to find the competitive range for your part",
            "Enter your target price into the Price Calculator",
            "Check whether your margin is acceptable",
            "If margin is too low, either raise your price or reduce your costs",
            "If margin is strong, consider whether a lower price would win more volume",
          ]},
          { type: "tip", text: "A 20% margin (net profit ÷ selling price) is a common target in automotive parts, but this varies by category and brand. High-volume commodity parts often run on thinner margins than specialist or branded components." },
        ],
      },
    ],
  },
};

// ─── Renderer ─────────────────────────────────────────────────────────────────

function Paragraph({ text }) {
  return <p style={{ margin: "0 0 16px 0", fontSize: 15, color: MUTED, lineHeight: 1.75 }}>{text}</p>;
}

function BulletList({ items }) {
  return (
    <ul style={{ margin: "0 0 16px 0", padding: "0 0 0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 15, color: MUTED, lineHeight: 1.7 }}>{item}</li>
      ))}
    </ul>
  );
}

function Tip({ text }) {
  return (
    <div style={{
      display: "flex", gap: 12, padding: "14px 16px",
      background: ACCENT_LIGHT, border: `1px solid ${BORDER}`,
      borderLeft: `3px solid ${ACCENT}`, borderRadius: 10, marginBottom: 16,
    }}>
      <svg style={{ flexShrink: 0, marginTop: 2 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <p style={{ margin: 0, fontSize: 13.5, color: TEXT, lineHeight: 1.65 }}><strong>Tip:</strong> {text}</p>
    </div>
  );
}

function ArticleSection({ heading, content }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ margin: "0 0 14px 0", fontSize: 18, fontWeight: 800, color: TEXT, lineHeight: 1.3 }}>{heading}</h2>
      {content.map((block, i) => {
        if (block.type === "p")      return <Paragraph key={i} text={block.text} />;
        if (block.type === "list")   return <BulletList key={i} items={block.items} />;
        if (block.type === "tip")    return <Tip key={i} text={block.text} />;
        if (block.type === "visual") return <div key={i}>{block.node}</div>;
        if (block.type === "image")  return <ArticleImage key={i} {...block} />;
        return null;
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HelpArticlePage() {
  const { slug } = useParams();
  const article = ARTICLES[slug];

  if (!article) return <Navigate to="/help" replace />;

  return (
    <div style={{ fontFamily: "Plus Jakarta Sans, Arial, sans-serif", background: "#fff", paddingTop: 68 }}>
      <Navbar />

      {/* Breadcrumb */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, background: "#f7f9fc", padding: "12px 24px" }}>
        <div style={{ maxWidth: 740, margin: "0 auto", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: DIM }}>
          <Link to="/help" style={{ color: ACCENT, textDecoration: "none", fontWeight: 600 }}>Help Centre</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ color: DIM }}>{article.category}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ color: TEXT, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{article.title}</span>
        </div>
      </div>

      {/* Article */}
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "56px 24px 80px" }}>

        {/* Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: ACCENT_LIGHT, border: `1px solid ${BORDER}`,
            borderRadius: 999, padding: "3px 12px",
            fontSize: 11, fontWeight: 800, color: ACCENT, letterSpacing: "0.06em",
          }}>{article.category}</span>
          <span style={{ fontSize: 13, color: DIM }}>{article.time}</span>
        </div>

        {/* Title */}
        <h1 style={{
          margin: "0 0 20px 0",
          fontSize: "clamp(26px, 4vw, 36px)",
          fontWeight: 900, color: TEXT, letterSpacing: "-0.5px", lineHeight: 1.15,
        }}>
          {article.title}
        </h1>

        {/* Intro */}
        <p style={{
          margin: "0 0 36px 0",
          fontSize: 16, color: MUTED, lineHeight: 1.75,
          borderBottom: `1px solid ${BORDER}`, paddingBottom: 36,
        }}>
          {article.intro}
        </p>

        {/* Hero image */}
        {article.heroImage && <ArticleImage {...article.heroImage} />}

        {/* Sections */}
        {article.sections.map((s, i) => (
          <ArticleSection key={i} heading={s.heading} content={s.content} />
        ))}

        {/* Footer CTA */}
        <div style={{
          marginTop: 48, padding: "24px 28px",
          background: "#f7f9fc", border: `1px solid ${BORDER}`,
          borderRadius: 16, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 20, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: TEXT, marginBottom: 4 }}>Still need help?</div>
            <div style={{ fontSize: 13.5, color: MUTED }}>Our support team is ready to help you.</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link to="/help" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 18px", border: `1.5px solid ${BORDER}`,
              borderRadius: 9, fontSize: 13.5, fontWeight: 700, color: TEXT,
              textDecoration: "none", background: "#fff",
            }}>
              ← Back to Help Centre
            </Link>
            <Link to="/contact" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 18px", background: ACCENT,
              borderRadius: 9, fontSize: 13.5, fontWeight: 700, color: "#fff",
              textDecoration: "none", boxShadow: "0 4px 14px rgba(19,93,255,0.22)",
            }}>
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
