import { useTranslation } from "react-i18next";

const TEXT = "#132A46";
const MUTED = "#4d6a8a";
const DIM = "#7a96b0";
const BORDER = "#dde7f5";
const ACCENT = "#135DFF";
const ACCENT_LIGHT = "#EEF5FF";
const GREEN = "#16a34a";
const GREEN_LIGHT = "#f0fdf4";

export function StepFlow({ steps }) {
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
            <div style={{ display: "flex", alignItems: "center", color: DIM, fontSize: 18, paddingInlineEnd: 4, flexShrink: 0 }}>›</div>
          )}
        </div>
      ))}
    </div>
  );
}

const COMPAT_ROWS = [
  { vehicle: "BMW 3 Series (E90) 318d", years: "2007-09→2012-12", kw: 105, hp: 143, cc: 1995, code: "N47D20C" },
  { vehicle: "BMW 3 Series (E90) 320d", years: "2005-09→2012-12", kw: 120, hp: 163, cc: 1995, code: "N47D20A" },
  { vehicle: "BMW 3 Series (E91) 318d", years: "2007-09→2012-12", kw: 105, hp: 143, cc: 1995, code: "N47D20C" },
  { vehicle: "BMW 3 Series (E92) 320d", years: "2006-09→2010-09", kw: 120, hp: 163, cc: 1995, code: "N47D20A" },
  { vehicle: "BMW 5 Series (E60) 520d", years: "2007-03→2010-03", kw: 120, hp: 163, cc: 1995, code: "N47D20A" },
];

export function CompatTableDemo() {
  const { t } = useTranslation();
  const columns = [
    { label: t("help.visuals.compatTable.colVehicle"), note: t("help.visuals.compatTable.noteVehicle") },
    { label: t("help.visuals.compatTable.colYears"), note: t("help.visuals.compatTable.noteYears") },
    { label: t("help.visuals.compatTable.colKw"), note: t("help.visuals.compatTable.noteKw") },
    { label: t("help.visuals.compatTable.colHp"), note: t("help.visuals.compatTable.noteHp") },
    { label: t("help.visuals.compatTable.colCc"), note: t("help.visuals.compatTable.noteCc") },
    { label: t("help.visuals.compatTable.colEngine"), note: t("help.visuals.compatTable.noteEngine") },
  ];

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
      <div style={{ background: "#1f2937", color: "#fff", padding: "7px 12px", fontSize: 12, fontWeight: 800, textAlign: "center" }}>
        {t("help.visuals.compatTable.title")}
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "2fr 1.6fr 0.6fr 0.6fr 0.7fr 1.4fr",
        background: "#f1f5f9", padding: "6px 12px",
        borderBottom: `1px solid ${BORDER}`,
      }}>
        {columns.map(({ label, note }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: TEXT, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
            <span style={{ fontSize: 9.5, color: ACCENT, fontWeight: 600 }}>{note}</span>
          </div>
        ))}
      </div>
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

export function PriceHistogramDemo() {
  const { t } = useTranslation();
  const maxH = 82;
  const barW = 34;
  const gapW = 8;
  const totalW = BINS.length * (barW + gapW) - gapW;
  const chartH = 110;
  const metrics = [
    t("help.visuals.priceHistogram.low"),
    t("help.visuals.priceHistogram.median"),
    t("help.visuals.priceHistogram.avg"),
    t("help.visuals.priceHistogram.high"),
  ];

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
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        {metrics.map((l) => (
          <div key={l} style={{ textAlign: "center" }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: MUTED }}>{l}</span>
          </div>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${totalW + 40} ${chartH + 24}`} style={{ display: "block", overflow: "visible" }}>
        {BINS.map((b, i) => {
          const x = 20 + i * (barW + gapW);
          const barH = (b.h / maxH) * chartH;
          const y = chartH - barH;
          return (
            <g key={b.label}>
              <rect className="hist-bar" x={x} y={y} width={barW} height={barH} rx={4} fill={b.active ? ACCENT : "#c7d8f7"} />
              <text x={x + barW / 2} y={chartH + 14} textAnchor="middle"
                style={{ fontSize: 9, fill: b.active ? ACCENT : DIM, fontWeight: b.active ? 800 : 400, fontFamily: "inherit" }}>
                {b.label}
              </text>
            </g>
          );
        })}
        <line x1={16} y1={chartH} x2={totalW + 28} y2={chartH} stroke={BORDER} strokeWidth={1} />
        <line x1={20 + 3 * (barW + gapW) + barW / 2} y1={0} x2={20 + 3 * (barW + gapW) + barW / 2} y2={chartH}
          stroke={ACCENT} strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={20 + 3 * (barW + gapW) + barW / 2} y={-4} textAnchor="middle"
          style={{ fontSize: 9.5, fill: ACCENT, fontWeight: 800, fontFamily: "inherit" }}>
          {t("help.visuals.priceHistogram.yourPrice")}
        </text>
      </svg>
      <p style={{ margin: "8px 0 0", fontSize: 11.5, color: MUTED, textAlign: "center" }}>
        {t("help.visuals.priceHistogram.caption")}
      </p>
    </div>
  );
}

export function ExportOptionsDemo({ options }) {
  const { t } = useTranslation();
  const defaults = [
    {
      label: t("help.visuals.exportOptions.copyHtmlLabel"),
      desc: t("help.visuals.exportOptions.copyHtmlDesc"),
      tone: "accent",
    },
    {
      label: t("help.visuals.exportOptions.exportCsvLabel"),
      desc: t("help.visuals.exportOptions.exportCsvDesc"),
      tone: "green",
    },
    {
      label: t("help.visuals.exportOptions.saveListingLabel"),
      desc: t("help.visuals.exportOptions.saveListingDesc"),
      tone: "muted",
    },
  ];
  const opts = (options?.length ? options : defaults).map((o, i) => ({
    ...defaults[i],
    ...o,
  }));
  const tones = {
    accent: { bg: ACCENT, color: "#fff", stroke: "#fff" },
    green: { bg: GREEN_LIGHT, color: GREEN, stroke: GREEN },
    muted: { bg: "#f7f9fc", color: MUTED, stroke: MUTED },
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
      {opts.map((o) => {
        const tone = tones[o.tone] || tones.muted;
        return (
          <div key={o.label} style={{
            border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 14px",
            display: "flex", flexDirection: "column", gap: 10, background: "#fff",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: tone.bg, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tone.stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: TEXT, marginBottom: 4 }}>{o.label}</div>
              <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{o.desc}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CalcBreakdownDemo() {
  const { t } = useTranslation();
  const rows = [
    { label: t("help.visuals.calcBreakdown.sellingPrice"), value: "£81.95", color: TEXT, bold: true },
    { label: t("help.visuals.calcBreakdown.productCost"), value: "−£35.00", color: "#dc2626" },
    { label: t("help.visuals.calcBreakdown.postage"), value: "−£5.00", color: "#dc2626" },
    { label: t("help.visuals.calcBreakdown.ebayFees"), value: "−£10.79", color: "#dc2626" },
    { label: t("help.visuals.calcBreakdown.vat"), value: "−£13.66", color: "#dc2626", note: t("help.visuals.calcBreakdown.vatNote") },
    { label: t("help.visuals.calcBreakdown.netProfit"), value: "£17.50", color: GREEN, bold: true, border: true },
  ];
  const summary = [
    { label: t("help.visuals.calcBreakdown.summarySelling"), value: "£81.95", color: ACCENT },
    { label: t("help.visuals.calcBreakdown.summaryProfit"), value: "£17.50", color: GREEN },
    { label: t("help.visuals.calcBreakdown.summaryMargin"), value: "21.4%", color: TEXT },
    { label: t("help.visuals.calcBreakdown.summaryMarkup"), value: "50.0%", color: TEXT },
  ];

  return (
    <div style={{
      background: "#f7f9fc", border: `1px solid ${BORDER}`,
      borderRadius: 14, overflow: "hidden", marginBottom: 24,
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderBottom: `1px solid ${BORDER}` }}>
        {summary.map((s, i) => (
          <div key={s.label} style={{
            padding: "14px 16px", textAlign: "center",
            borderInlineEnd: i < 3 ? `1px solid ${BORDER}` : "none",
            background: "#fff",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: "-0.5px" }}>{s.value}</div>
          </div>
        ))}
      </div>
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
              {r.note && <span style={{ marginInlineStart: 8, fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>{r.note}</span>}
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: r.color }}>{r.value}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "10px 16px", borderTop: `1px solid ${BORDER}`, background: ACCENT_LIGHT }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12.5, color: TEXT, fontWeight: 600 }}>{t("help.visuals.calcBreakdown.breakEven")}</span>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: ACCENT }}>£57.14</span>
        </div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{t("help.visuals.calcBreakdown.breakEvenHint")}</div>
      </div>
    </div>
  );
}

export function ArticleImage({ src, alt, caption }) {
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

export function ProductExample({ src, alt, partNumber, description, exampleLabel }) {
  const { t } = useTranslation();
  const label = exampleLabel || t("help.visuals.productExample.exampleLabel");
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      background: "#fff", border: `1px solid ${BORDER}`,
      borderRadius: 12, padding: "14px 16px", marginBottom: 24,
    }}>
      <img src={src} alt={alt} style={{ width: 72, height: 72, objectFit: "contain", borderRadius: 8, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
          {label}
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

export function EngineCodeExample({ label, beforeStrong, strongA, middle, strongB, after }) {
  const { t } = useTranslation();
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      background: "#fff", border: `1px solid ${BORDER}`,
      borderRadius: 12, padding: "14px 16px", marginBottom: 24,
    }}>
      <img src="/gasket-photo.png" alt={t("help.visuals.engineCodeExample.imageAlt")} style={{ width: 80, height: 56, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.55 }}>
          {beforeStrong} <strong>{strongA}</strong> {middle} <strong>{strongB}</strong> {after}
        </div>
      </div>
    </div>
  );
}

export function CompatResultCard({ partLabel, partName, status, fields }) {
  return (
    <div style={{
      background: "#f7f9fc", border: `1px solid ${BORDER}`,
      borderRadius: 14, overflow: "hidden", marginBottom: 24,
    }}>
      <div style={{ background: "#fff", padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: DIM, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{partLabel}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>{partName}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: GREEN_LIGHT, border: "1px solid #bbf7d0", borderRadius: 99, padding: "6px 14px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>{status}</span>
        </div>
      </div>
      <div style={{ padding: "14px 20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {(fields || []).map((f) => (
          <div key={f.label}>
            <div style={{ fontSize: 10, fontWeight: 700, color: DIM, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{f.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TemplateCards({ templates }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
      {(templates || []).map((t) => (
        <div key={t.name} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: "13px 14px", background: "#fff" }}>
          <div style={{ width: 28, height: 4, borderRadius: 2, background: t.accent || ACCENT, marginBottom: 8 }} />
          <div style={{ fontSize: 12.5, fontWeight: 800, color: TEXT, marginBottom: 4 }}>{t.name}</div>
          <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.55 }}>{t.desc}</div>
        </div>
      ))}
    </div>
  );
}

export function ReferenceTypes({ refs }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
      {(refs || []).map((r) => (
        <div key={r.label} style={{ display: "flex", gap: 14, padding: "14px 16px", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: r.bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: r.color }}>{String(r.label).split(" ")[0]}</span>
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
  );
}

export function renderVisual(block) {
  switch (block.id) {
    case "stepFlow":
      return <StepFlow steps={block.steps || []} />;
    case "productExample":
      return (
        <ProductExample
          src={block.src}
          alt={block.alt}
          partNumber={block.partNumber}
          description={block.description}
          exampleLabel={block.exampleLabel}
        />
      );
    case "exportOptions":
      return <ExportOptionsDemo options={block.options} />;
    case "compatTable":
      return <CompatTableDemo />;
    case "engineCodeExample":
      return <EngineCodeExample {...block} />;
    case "priceHistogram":
      return <PriceHistogramDemo />;
    case "compatResult":
      return <CompatResultCard {...block} />;
    case "templateCards":
      return <TemplateCards templates={block.templates} />;
    case "referenceTypes":
      return <ReferenceTypes refs={block.refs} />;
    case "calcBreakdown":
      return <CalcBreakdownDemo />;
    default:
      return null;
  }
}
