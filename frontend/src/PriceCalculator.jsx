import React, { memo, useState, useEffect, useRef } from "react";
import { useSessionState } from "./useSessionState.js";
import { BUTTON_BASE, SMALL_BUTTON_STYLE, INPUT_STYLE } from "./shared.jsx";
import SavedProducts from "./SavedProducts.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt    = (n) => (n === null || isNaN(n)) ? "—" : (n < 0 ? `-£${Math.abs(n).toFixed(2)}` : `£${n.toFixed(2)}`);
const fmtPct = (n) => (n === null || isNaN(n)) ? "—" : `${n.toFixed(1)}%`;
const fmtGBP = (v) => (v != null && !isNaN(v)) ? `£${Number(v).toFixed(2)}` : "—";

// ─── Keyframes ────────────────────────────────────────────────────────────────
(function () {
  if (typeof document === "undefined" || document.getElementById("__pc2-kf")) return;
  const s = document.createElement("style"); s.id = "__pc2-kf";
  s.textContent = `
    @keyframes pcPulse     { 0%,100%{opacity:1;box-shadow:0 0 6px #4ade80} 50%{opacity:.3;box-shadow:0 0 14px #4ade80} }
    @keyframes pcGlow      { 0%,100%{box-shadow:0 0 8px #00e5ff,0 0 20px #00e5ff60} 50%{box-shadow:0 0 14px #00e5ff,0 0 30px #00e5ff80} }
    @keyframes pcIn        { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pdIn        { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pdBeamPulse { 0%,100%{box-shadow:0 0 28px #38bdf8cc,0 0 56px #38bdf844,0 3px 12px rgba(0,0,0,.5)} 50%{box-shadow:0 0 40px #38bdf8ff,0 0 80px #38bdf866,0 3px 12px rgba(0,0,0,.5)} }
    @keyframes pdDotPulse  { 0%,100%{r:5;opacity:1} 50%{r:7;opacity:.7} }
    @keyframes pdBeamLine  { 0%,100%{opacity:.55} 50%{opacity:.85} }
  `;
  document.head.appendChild(s);
})();

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg0: "#080f1c",
  bg1: "#0b1929",
  bg2: "#0d1f35",
  bg3: "#060d1a",
  border:     "1px solid rgba(255,255,255,0.07)",
  borderBlue: "1px solid rgba(19,93,255,0.22)",
  blue: "#135DFF",
  text: "#e2e8f0",
  muted: "#6b7280",
  dim:   "#374151",
};

const CI = {
  ...INPUT_STYLE,
  padding: "7px 10px",
  fontSize: 13,
  borderRadius: 8,
  background: "#0d1f35",
  border: "1px solid rgba(255,255,255,0.09)",
};

// ─── Market position (all blue palette) ──────────────────────────────────────
function getPos(price, data) {
  if (!price || price <= 0 || !data) return null;
  const range = data.high - data.low;
  if (range <= 0) return null;
  const pct = ((price - data.low) / range) * 100;
  if (price < data.low)   return { label: "Below Market",  color: "#60a5fa" };
  if (pct < 25)           return { label: "Lower Range",   color: "#60a5fa" };
  if (pct < 45)           return { label: "Lower-Mid",     color: "#7dd3fc" };
  if (pct < 65)           return { label: "Core Market",   color: "#93c5fd" };
  if (pct < 82)           return { label: "Upper-Mid",     color: "#bae6fd" };
  if (price <= data.high) return { label: "Premium Range", color: "#dbeafe" };
  return                         { label: "Above Market",  color: "#eff6ff" };
}

// ─── Verdict ─────────────────────────────────────────────────────────────────
function getVerdict(price, data) {
  if (!price || price <= 0 || !data) return null;
  const { low, high, median, average } = data;
  const range = high - low; if (range <= 0) return null;
  const p = (price - low) / range, pm = (median - low) / range, pa = (average - low) / range;
  if (price < low * 0.9)           return "Well below the market low — strong room to increase margin.";
  if (price < low)                 return "Undercuts the market low — near-certain conversion.";
  if (p <= pm * 0.55)              return "Highly competitive — well below most active sellers.";
  if (p <= pm)                     return "Below the median — strong conversion position.";
  if (p <= (pm + pa) / 2)         return "Near the median — a slight reduction could sharpen your edge.";
  if (p <= pa)                     return "Aligned with the average — in line with most sellers.";
  if (p <= pa + (1 - pa) * 0.35)  return "Above average — conversion may be impacted.";
  if (price <= high)               return "Among the highest listings — strong branding needed to convert.";
  return "Exceeds all active listings — significant reduction recommended.";
}

// ─── Distribution insight ─────────────────────────────────────────────────────
function getDistributionInsight(price, clusterStart, clusterEnd, low, high, prices) {
  const r = v => `£${Math.round(v)}`;
  const band = `${r(clusterStart)}–${r(clusterEnd)}`;
  const hasPrice = price > 0;

  // Is the highest listing a one-off? (only 1 listing above 130% of cluster end AND well above the cluster)
  const highOneOff =
    prices.filter(p => p > clusterEnd * 1.3).length === 1 && high > clusterEnd * 1.45;

  if (!hasPrice) {
    return highOneOff
      ? `Most listings cluster between ${band}. The highest listing appears to be a one-off and does not represent the main market.`
      : `Most listings cluster between ${band}.`;
  }

  const inCluster = price >= clusterStart && price <= clusterEnd;
  const below     = price < clusterStart;
  const above     = price > clusterEnd;

  if (inCluster) return `Your price sits inside the main cluster (${band}) — well-positioned for conversion.`;
  if (below)     return `Your price is below the main cluster (${band}) — very competitive.`;
  if (above && highOneOff && price < high)
                 return `Your price is above the main cluster (${band}). The highest listing appears to be a one-off and does not represent the main market.`;
  if (above)     return `Your price is above the main cluster (${band}) — conversion may be impacted.`;
  return `Most listings cluster between ${band}.`;
}

// ─── Row (sidebar input rows) ─────────────────────────────────────────────────
function Row({ label, children, last, note }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "100px 1fr", alignItems: "center", gap: 8,
      padding: "4px 0",
      borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.04)",
    }}>
      <div>
        <div style={{ fontSize: 12, color: "#7a9cc0", lineHeight: 1.3 }}>{label}</div>
        {note && <div style={{ fontSize: 10, color: C.dim, marginTop: 1, lineHeight: 1.2 }}>{note}</div>}
      </div>
      {children}
    </div>
  );
}

function SL({ children, mt }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: "#4a7096", textTransform: "uppercase", letterSpacing: 1.2, paddingTop: mt ?? 10, paddingBottom: 4 }}>
      {children}
    </div>
  );
}

const HD = () => <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "10px 0" }} />;

// ─── Breakdown row ────────────────────────────────────────────────────────────
function BR({ label, value, color, strong, note }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: strong ? "7px 0 4px" : "4px 0",
      borderTop: strong ? "1px solid rgba(255,255,255,0.08)" : "none",
    }}>
      <div>
        <div style={{ fontSize: strong ? 13 : 12, color: strong ? C.text : C.muted }}>{label}</div>
        {note && <div style={{ fontSize: 10, color: C.dim }}>{note}</div>}
      </div>
      <span style={{ fontSize: strong ? 15 : 13, fontWeight: strong ? 800 : 600, color: color || (strong ? C.text : "#9ca3af") }}>{value}</span>
    </div>
  );
}

// ─── Source Listings (internal transparency panel) ────────────────────────────
function SourceListings({ listings, excludedListings, show, onToggle, tab, onTab }) {
  // listings === undefined → stale cached data (no listings field yet)
  // listings === []        → fetched but nothing passed filters
  const hasData    = listings !== undefined;
  const usedList   = listings        || [];
  const excList    = excludedListings || [];
  const activeList = tab === "used"  ? usedList : excList;

  return (
    <div style={{ marginBottom: 12 }}>
      {/* Toggle header */}
      <button
        onClick={onToggle}
        style={{
          width: "100%", padding: "6px 10px",
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 7, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 0.8 }}>
          Source listings
        </span>
        <span style={{ fontSize: 10, color: C.dim }}>
          {hasData
            ? `${usedList.length} used · ${excList.length} excluded`
            : "run a new search to load"
          } {show ? "▲" : "▼"}
        </span>
      </button>

      {show && (
        <div style={{ marginTop: 4, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, overflow: "hidden" }}>
          {!hasData ? (
            /* Stale cached data — no listings field present */
            <div style={{ padding: "16px 14px", textAlign: "center", fontSize: 12, color: C.dim }}>
              Run a fresh search to see the source listings.
            </div>
          ) : (
            <>
              {/* Sub-tabs */}
              <div style={{ display: "flex", background: "#060d1a", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {[
                  { key: "used",     label: `✓ Used (${usedList.length})`,   color: "#4ade80" },
                  { key: "excluded", label: `✕ Excluded (${excList.length})`, color: "#f87171" },
                ].map(({ key, label, color }) => {
                  const active = tab === key;
                  return (
                    <button key={key} onClick={() => onTab(key)} style={{
                      flex: 1, padding: "6px 10px", border: "none", cursor: "pointer",
                      background: active ? "rgba(255,255,255,0.04)" : "transparent",
                      fontSize: 11, fontWeight: 700,
                      color: active ? color : C.dim,
                      borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
                      transition: "all 0.15s",
                    }}>
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Rows */}
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {activeList.length === 0 ? (
                  <div style={{ padding: "16px 14px", textAlign: "center", fontSize: 12, color: C.dim }}>
                    None in this group.
                  </div>
                ) : activeList.map((item, i) => {
                  const isExc = tab === "excluded";
                  const Row = item.url ? "a" : "div";
                  return (
                    <Row
                      key={i}
                      href={item.url || undefined}
                      target={item.url ? "_blank" : undefined}
                      rel={item.url ? "noopener noreferrer" : undefined}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "8px 12px",
                        borderBottom: i < activeList.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        textDecoration: "none",
                        cursor: item.url ? "pointer" : "default",
                      }}
                      onMouseEnter={e => { if (item.url) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{
                        flexShrink: 0, minWidth: 60, textAlign: "right",
                        fontSize: 12, fontWeight: 800,
                        color: isExc ? "#4b5563" : "#93c5fd",
                      }}>
                        {item.price != null ? `£${item.price.toFixed(2)}` : "—"}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 11, lineHeight: 1.4,
                          color: isExc ? "#374151" : "#94a3b8",
                          overflow: "hidden", display: "-webkit-box",
                          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        }}>
                          {item.title || "—"}
                        </div>
                        {isExc && item.exclusionReason && (
                          <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2, fontStyle: "italic" }}>
                            {item.exclusionReason}
                          </div>
                        )}
                      </div>
                      {item.url && <span style={{ flexShrink: 0, fontSize: 9, color: "#374151", paddingTop: 3 }}>↗</span>}
                    </Row>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Pricing Band ─────────────────────────────────────────────────────────────
function PricingBand({ data, price }) {
  if (!data) return null;
  const range = data.high - data.low;
  if (range <= 0) return null;

  const toPct = (v) => Math.min(100, Math.max(0, ((v - data.low) / range) * 100));
  const medPct = toPct(data.median);
  const avgPct = toPct(data.average);
  const close  = Math.abs(medPct - avgPct) < 12;

  // Suppress any mid label that falls within EDGE% of the Low or High anchor label.
  // This prevents text collision when market prices bunch near one end of the range.
  const EDGE         = 14; // percent — tune if needed
  const mergedMidPct = (medPct + avgPct) / 2;
  const showMedLabel    = !close && medPct > EDGE && medPct < (100 - EDGE);
  const showAvgLabel    = !close && avgPct > EDGE && avgPct < (100 - EDGE);
  const showMergedLabel = close  && mergedMidPct > EDGE && mergedMidPct < (100 - EDGE);

  const hasPrice     = price > 0;
  const userPctRaw   = hasPrice ? ((price - data.low) / range) * 100 : null;
  const userPctBar   = userPctRaw !== null ? Math.min(100, Math.max(0, userPctRaw)) : null;
  const userPctLabel = userPctRaw !== null ? Math.min(93, Math.max(7, userPctRaw))  : null;

  const pos     = hasPrice ? getPos(price, data)     : null;
  const verdict = hasPrice ? getVerdict(price, data) : null;

  const MARKER = "#00e5ff";

  return (
    <div style={{
      background: "#030b17",
      border: "1px solid rgba(19,93,255,0.45)",
      borderRadius: 14,
      padding: "18px 20px 16px",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 0.8 }}>
          Market Pricing Band
        </div>
        {pos ? (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: `${pos.color}15`, border: `1px solid ${pos.color}45`,
            borderRadius: 20, padding: "5px 14px",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: pos.color, display: "inline-block", boxShadow: `0 0 8px ${pos.color}` }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: pos.color }}>{pos.label}</span>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: C.dim, fontStyle: "italic" }}>Enter a price to see position</div>
        )}
      </div>

      <div style={{ position: "relative" }}>
        {/* Floating label space */}
        <div style={{ position: "relative", height: 48 }}>
          {userPctLabel !== null && (
            <div style={{
              position: "absolute", left: `${userPctLabel}%`, bottom: 0,
              transform: "translateX(-50%)",
              display: "flex", flexDirection: "column", alignItems: "center",
              pointerEvents: "none",
            }}>
              <div style={{
                background: MARKER, color: "#001520",
                fontSize: 14, fontWeight: 900,
                padding: "4px 12px", borderRadius: 20,
                whiteSpace: "nowrap",
                boxShadow: `0 0 16px ${MARKER}99, 0 2px 8px rgba(0,0,0,0.5)`,
                letterSpacing: -0.2,
              }}>
                {fmtGBP(price)}
              </div>
              <div style={{ width: 2, height: 14, background: `linear-gradient(to bottom, ${MARKER}cc, transparent)` }} />
            </div>
          )}
        </div>

        {/* Bar */}
        <div style={{
          height: 24, borderRadius: 12,
          background: "linear-gradient(90deg, #0c2d4a 0%, #0369a1 22%, #0ea5e9 42%, #2563eb 62%, #4338ca 82%, #312e81 100%)",
          position: "relative",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.4)",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", borderRadius: "12px 12px 0 0", background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)", pointerEvents: "none" }} />
          {/* Median tick */}
          <div style={{ position: "absolute", left: `${medPct}%`, top: -5, bottom: -5, width: 2, background: "rgba(255,255,255,0.75)", transform: "translateX(-50%)", borderRadius: 1 }} />
          {/* Average tick */}
          {!close && <div style={{ position: "absolute", left: `${avgPct}%`, top: -5, bottom: -5, width: 2, background: "rgba(255,255,255,0.45)", transform: "translateX(-50%)", borderRadius: 1 }} />}
          {/* User marker */}
          {userPctBar !== null && (
            <>
              <div style={{ position: "absolute", left: `${userPctBar}%`, top: -8, bottom: -8, width: 3, background: MARKER, transform: "translateX(-50%)", borderRadius: 2, boxShadow: `0 0 10px ${MARKER}, 0 0 22px ${MARKER}70`, animation: "pcGlow 2.2s ease-in-out infinite" }} />
              <div style={{ position: "absolute", left: `${userPctBar}%`, bottom: -16, transform: "translateX(-50%)", width: 10, height: 10, borderRadius: "50%", background: MARKER, boxShadow: `0 0 10px ${MARKER}, 0 0 20px ${MARKER}80` }} />
            </>
          )}
        </div>

        {/* Labels */}
        <div style={{ position: "relative", height: 44, marginTop: 14 }}>

          {/* LOW — always shown */}
          <div style={{ position: "absolute", left: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#7dd3fc", lineHeight: 1 }}>{fmtGBP(data.low)}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Low</div>
          </div>

          {/* MERGED Avg / Med */}
          {showMergedLabel && (
            <div style={{ position: "absolute", left: `${mergedMidPct}%`, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#c4d4e8", lineHeight: 1 }}>
                {fmtGBP(data.average)} / {fmtGBP(data.median)}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Avg / Med</div>
            </div>
          )}

          {/* MEDIAN (only when not merged and not too close to Low or High) */}
          {showMedLabel && (
            <div style={{ position: "absolute", left: `${medPct}%`, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#c4d4e8", lineHeight: 1 }}>{fmtGBP(data.median)}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Median</div>
            </div>
          )}

          {/* AVERAGE (only when not merged and not too close to Low or High) */}
          {showAvgLabel && (
            <div style={{ position: "absolute", left: `${avgPct}%`, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#c4d4e8", lineHeight: 1 }}>{fmtGBP(data.average)}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Average</div>
            </div>
          )}

          {/* HIGH — always shown */}
          <div style={{ position: "absolute", right: 0, textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#7dd3fc", lineHeight: 1 }}>{fmtGBP(data.high)}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>High</div>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      {verdict && (
        <div style={{ marginTop: 18, padding: "10px 14px", background: "rgba(14,165,233,0.07)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 10, fontSize: 13, color: "#93c5fd", lineHeight: 1.55 }}>
          💡 {verdict}
        </div>
      )}
      {!verdict && hasPrice && (
        <div style={{ marginTop: 18, fontSize: 12, color: C.dim, textAlign: "center" }}>
          Add market data above to see position analysis.
        </div>
      )}
    </div>
  );
}

// ─── Price Distribution — Market Intelligence Chart ───────────────────────────
function PriceDistribution({ data, listings, price }) {
  const svgRef       = useRef(null);
  const [hoveredBin,  setHoveredBin]  = useState(null);
  const [clickedBin,  setClickedBin]  = useState(null); // index of clicked bar → opens zoom + right panel
  const [zoomRange,   setZoomRange]   = useState(null); // {s,e} of clicked zoom bar, or null
  const [viewMode,    setViewMode]    = useState("volume"); // "volume" | "table"
  const [tableSort,   setTableSort]   = useState("price");
  const [panelSort,   setPanelSort]   = useState("asc");
  const [lightboxImg, setLightboxImg] = useState(null); // URL of expanded image, null = closed

  const prices = (listings || [])
    .map(l => l.price)
    .filter(p => p != null && p > 0)
    .sort((a, b) => a - b);

  if (prices.length < 2 || !data) return <PricingBand data={data} price={price} />;
  const { low, high, median, average } = data;
  const range = high - low;
  if (range <= 0) return <PricingBand data={data} price={price} />;
  const n = prices.length;
  const hasPrice = price > 0;

  // ── IQR for cluster markers only (no listings excluded from view) ────────────
  const q1 = prices[Math.max(0, Math.floor((n - 1) * 0.25))];
  const q3 = prices[Math.min(n - 1, Math.ceil((n - 1) * 0.75))];
  const outlierCount = data?.iqrOutlierCount ?? 0;

  // View range — starts just before the lowest listing, not from zero
  const viewMin   = Math.max(0, low - Math.max(range * 0.06, 8));
  const viewMax   = high + Math.max(range * 0.04, 5);
  const viewRange = viewMax - viewMin;

  // ── Dynamic nice-number binning ──────────────────────────────────────────────
  // Target ~20 buckets; snap to the nearest human-friendly step size
  const TARGET_BUCKETS = 20;
  const NICE_STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
  const rawBinW = range / TARGET_BUCKETS;
  const binW    = NICE_STEPS.find(s => s >= rawBinW) ?? 1000;

  // Buckets span from floor(low/binW)*binW to ceil(high/binW)*binW
  const bsStart = Math.floor(low  / binW) * binW;
  const bsEnd   = Math.ceil (high / binW) * binW;
  const numBins = Math.round((bsEnd - bsStart) / binW);
  const bins = Array.from({ length: numBins }, (_, i) => {
    const s = bsStart + i * binW;
    const e = s + binW;
    const isLast = i === numBins - 1;
    const count = prices.filter(p => p >= s && (isLast ? p <= e : p < e)).length;
    return { s, e, count };
  }).filter(b => b.s < viewMax && b.e > viewMin);

  const maxBucket  = Math.max(...bins.map(b => b.count), 1);
  // Dynamic Y-axis: scale to market density so sparse markets look full
  const dynYMax  = m => m <= 3 ? 3 : m <= 5 ? 5 : m <= 10 ? 10 : m <= 20 ? 20 : m <= 30 ? 30 : m <= 40 ? 40 : 60;
  const yAxisMax = dynYMax(maxBucket);

  // ── Bar-height density curve (Catmull-Rom spline through bin tops) ──────────
  // Curve tracks actual histogram bars — no bell-curve floating artefact

  // ── Cluster = IQR range (middle 50% — where most competition lives) ─────────
  const clusterStart = q1;
  const clusterEnd   = q3;
  const clusterCount = prices.filter(p => p >= q1 && p <= q3).length;
  const inCluster    = hasPrice && price >= clusterStart && price <= clusterEnd;

  // ── Competition & ranking ───────────────────────────────────────────────────
  const compWindow  = Math.max(range * 0.08, 15);
  const compCount   = hasPrice ? prices.filter(p => Math.abs(p - price) <= compWindow).length : 0;
  const compLevel   = compCount >= 6 ? "High" : compCount >= 3 ? "Medium" : "Low";
  const priceRank   = hasPrice ? prices.filter(p => p < price).length + 1 : null;
  const cheaperThan = hasPrice ? n - priceRank : 0;

  // ── SVG coordinate system ───────────────────────────────────────────────────
  const CHART_W = 500, CHART_H = 220, PAD_T = 18, PAD_B = 6, PAD_R = 8;
  const plotW = CHART_W - PAD_R;
  const plotH = CHART_H - PAD_T - PAD_B;

  // ── Linear x-axis ───────────────────────────────────────────────────────────
  const toX = v => ((v - viewMin) / viewRange) * plotW;

  const toY   = cnt => (PAD_T + plotH) - (cnt / yAxisMax) * plotH;
  const toPct = v   => (toX(v) / CHART_W) * 100;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const inView = v => v >= viewMin && v <= viewMax;

  const baseline = PAD_T + plotH;


  // ── Y-axis ticks — dynamic step matching tier ────────────────────────────────
  const yStep  = yAxisMax <= 5 ? 1 : yAxisMax <= 10 ? 2 : yAxisMax <= 30 ? 5 : 10;
  const yTicks = Array.from({ length: Math.floor(yAxisMax / yStep) + 1 }, (_, i) => i * yStep);
  // Minimum pixel height so 1-count bars are always visible and clickable
  const MIN_BAR_PX = 4;

  // ── X-axis ticks — one per non-empty bin, centred under each bar ────────────
  const xTicks = bins
    .filter(b => b.count > 0)
    .map(b => ({ v: b.s, e: b.e, mid: (b.s + b.e) / 2 }));

  // ── Price marker cards — Low, Median, Avg, Your Price, High ─────────────────
  const MARKERS_DEF = [
    { key: "low",  v: low,     label: "LOW",        col: "#3b82f6", bg: "rgba(8,20,65,0.97)",   bd: "rgba(59,130,246,0.55)"  },
    { key: "med",  v: median,  label: "MEDIAN",     col: "#a855f7", bg: "rgba(32,10,58,0.97)",  bd: "rgba(168,85,247,0.55)"  },
    { key: "avg",  v: average, label: "AVG",        col: "#f59e0b", bg: "rgba(52,28,2,0.97)",   bd: "rgba(245,158,11,0.55)"  },
    ...(hasPrice ? [{ key: "usr", v: price, label: "YOUR PRICE", col: "#00e5ff", bg: "rgba(0,35,55,0.98)", bd: "rgba(0,229,255,0.8)", hero: true }] : []),
    { key: "high", v: high,    label: "HIGH",       col: "#ef4444", bg: "rgba(52,8,8,0.97)",    bd: "rgba(239,68,68,0.55)"   },
  ].filter(m => m.v != null && !isNaN(m.v));

  // Assign initial positions (clamped to card edges)
  let markers = MARKERS_DEF
    .map(m => ({ ...m, rawPct: toPct(m.v), pct: clamp(toPct(m.v), 4, 94), outside: !inView(m.v) }))
    .sort((a, b) => a.pct - b.pct);

  // Iterative push-apart to resolve label overlaps (min gap = 13%)
  const MIN_GAP = 13;
  for (let iter = 0; iter < 30; iter++) {
    let moved = false;
    for (let i = 0; i < markers.length - 1; i++) {
      const gap = markers[i + 1].pct - markers[i].pct;
      if (gap < MIN_GAP) {
        const push = (MIN_GAP - gap) / 2;
        markers[i].pct     = clamp(markers[i].pct     - push, 3, 95);
        markers[i + 1].pct = clamp(markers[i + 1].pct + push, 3, 95);
        moved = true;
      }
    }
    if (!moved) break;
  }

  const CARD_H = 72;
  const fmtX   = v => v >= 1000 ? `£${+(v / 1000).toFixed(1)}k` : `£${Math.round(v)}`;

  // ── Rounded-top bar path helper ──────────────────────────────────────────────
  const roundedTopRect = (x, y, w, h, r) => {
    const cr = Math.min(r, w / 2, Math.max(h, 0.01) / 2);
    return `M ${x},${y + h} L ${x},${y + cr} Q ${x},${y} ${x + cr},${y} L ${x + w - cr},${y} Q ${x + w},${y} ${x + w},${y + cr} L ${x + w},${y + h} Z`;
  };

  // ── Highest-concentration band ───────────────────────────────────────────────
  const concThreshold = maxBucket * 0.55; // relative to actual data peak, not yAxisMax
  const concBins      = bins.filter(b => b.count >= concThreshold);
  const concStart     = concBins.length > 0 ? concBins[0].s                        : clusterStart;
  const concEnd       = concBins.length > 0 ? concBins[concBins.length - 1].e      : clusterEnd;

  // ── Per-bin listings for hover tooltip ───────────────────────────────────────
  const binListings = bins.map((b, i) => {
    const isLast = i === bins.length - 1;
    return (listings || []).filter(l =>
      l.price != null && l.price >= b.s && (isLast ? l.price <= b.e : l.price < b.e)
    );
  });

  // ── Concentration stats for bottom card ─────────────────────────────────────
  const concCount = concBins.reduce((s, b) => s + b.count, 0);
  const concPct   = n > 0 ? Math.round(concCount / n * 100) : 0;



  return (
    <div style={{
      background: "linear-gradient(180deg, #020e1f 0%, #010c1a 55%, #010810 100%)",
      border: "1px solid rgba(30,58,138,0.28)",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 8px 48px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)",
      marginTop: 2,
      animation: "pdIn 0.4s ease",
      display: "flex",         // flex row: chart | right panel
    }}>

      {/* ── Main chart column ── */}
      <div style={{ flex: 1, minWidth: 0 }}>

      {/* ── Header ── */}
      <div style={{ padding: "18px 22px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0", letterSpacing: -0.4, lineHeight: 1.2 }}>
            Price Distribution
          </div>
          <div style={{ fontSize: 11, color: "#5a7fa0", marginTop: 4 }}>
            <strong style={{ color: "#7dd3fc" }}>{n}</strong> listings analysed
          </div>
        </div>
        {/* Volume / Cumulative % / Table tabs */}
        <div style={{ display: "flex", gap: 2, background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: "3px", flexShrink: 0 }}>
          {[["volume", "Volume"], ["table", "Table"]].map(([mode, label]) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              padding: "5px 13px", fontSize: 10, fontWeight: 700,
              letterSpacing: 0.5,
              background: viewMode === mode ? "rgba(56,189,248,0.16)" : "transparent",
              border: viewMode === mode ? "1px solid rgba(56,189,248,0.35)" : "1px solid transparent",
              borderRadius: 6,
              color: viewMode === mode ? "#7dd3fc" : "#3d5a72",
              cursor: "pointer", transition: "all 0.15s",
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "volume" && <>

      {/* ── Market stats bar — LOW / MEDIAN / YOUR PRICE / HIGH ── */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${markers.length}, 1fr)`, borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {markers.map((m, i) => (
          <div key={m.key} style={{
            padding: "11px 14px", textAlign: "center",
            borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
            background: m.hero ? "rgba(0,229,255,0.03)" : "transparent",
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: m.col, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5, opacity: 0.8 }}>
              {m.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: m.col, letterSpacing: -0.5, lineHeight: 1, fontVariantNumeric: "tabular-nums",
              textShadow: m.hero ? `0 0 18px ${m.col}66` : "none",
            }}>
              {fmtGBP(m.v)}
              {m.outside && <span style={{ fontSize: 10, marginLeft: 5, opacity: 0.5 }}>{m.v < viewMin ? "◀" : "▶"}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Chart wrapper: Y-axis col + chart col ── */}
      <div style={{ display: "flex", paddingRight: 10, paddingBottom: 2 }}>

        {/* Y-axis column */}
        <div style={{ width: 44, flexShrink: 0 }}>
          <div style={{ position: "relative", height: CHART_H }}>
            {/* Rotated axis title */}
            <div style={{ position: "absolute", left: 1, top: 0, width: 14, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 7, fontWeight: 600, color: "#2d3f55", textTransform: "uppercase", letterSpacing: 1.8, writingMode: "vertical-rl", transform: "rotate(180deg)", whiteSpace: "nowrap", userSelect: "none" }}>
                Listings
              </span>
            </div>
            {/* Tick numbers */}
            {yTicks.map(t => (
              <div key={t} style={{ position: "absolute", right: 5, top: toY(t), transform: "translateY(-50%)", fontSize: 9, color: t === 0 ? "#2d4a65" : "#5a7fa0", lineHeight: 1, fontVariantNumeric: "tabular-nums", userSelect: "none", fontWeight: 600 }}>
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Chart content */}
        <div style={{ flex: 1, position: "relative", minWidth: 0 }}>

          {/* ── SVG ── */}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            preserveAspectRatio="none"
            width="100%"
            height={CHART_H}
            style={{ display: "block", cursor: "default" }}
            onMouseLeave={() => { setHoveredBin(null); }}
          >
            <defs>
              {/* Curve fill */}
              <linearGradient id="pdFill6" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#2563eb" stopOpacity="0.55" />
                <stop offset="45%"  stopColor="#3b82f6" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#1e40af" stopOpacity="0.00" />
              </linearGradient>
              {/* Neutral bar gradient — same for all bars, opacity modulated per-bar */}
              <linearGradient id="pdBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#38bdf8" stopOpacity="1.00" />
                <stop offset="55%"  stopColor="#0ea5e9" stopOpacity="0.90" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.60" />
              </linearGradient>
              {/* User dot glow */}
              <radialGradient id="pdUserGlow6" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#00e5ff" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.00" />
              </radialGradient>
              {/* IQR dot glow */}
              <radialGradient id="pdIqrGlow6" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#60a5fa" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.00" />
              </radialGradient>
              {/* User price beam glow filter */}
              <filter id="pdBeamGlow" x="-200%" y="-10%" width="500%" height="120%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* ── Gridlines ── */}
            {yTicks.filter(t => t > 0).map(t => (
              <line key={t} x1={0} y1={toY(t)} x2={plotW} y2={toY(t)}
                stroke="rgba(255,255,255,0.055)" strokeWidth={1}
                vectorEffect="non-scaling-stroke" />
            ))}


            {/* ── Core-market concentration band (subtle fill only) ── */}
            {concBins.length > 0 && (() => {
              const cx1 = Math.max(0, toX(concStart));
              const cx2 = Math.min(plotW, toX(concEnd));
              return (
                <rect x={cx1} y={PAD_T} width={Math.max(0, cx2 - cx1)} height={plotH}
                  fill="rgba(56,189,248,0.038)" />
              );
            })()}

            {/* ── PRIMARY: Histogram bars ── */}
            {bins.map((b, i) => {
              if (b.count === 0) return null;
              const colX  = Math.max(0, toX(b.s));
              const colW  = Math.max(2, Math.min(plotW, toX(b.e)) - colX);
              const barW  = Math.max(1, colW * 0.45);        // 45% width, centred in column
              const barH  = Math.max(MIN_BAR_PX, (b.count / yAxisMax) * plotH);
              const barY  = baseline - barH;
              const ir    = b.count / maxBucket;
              const isHov = hoveredBin === i;
              const isSel = clickedBin === i;
              const barX  = colX + (colW - barW) / 2;
              const path  = roundedTopRect(barX, barY, barW, barH, 3);
              return (
                <g key={i}
                  onMouseEnter={() => setHoveredBin(i)}
                  onClick={() => { setClickedBin(isSel ? null : i); setZoomRange(null); }}
                >
                  {/* Full-height transparent hit zone */}
                  <rect x={colX} y={PAD_T} width={colW} height={plotH}
                    fill="transparent" style={{ cursor: "pointer" }} />
                  {/* Main bar */}
                  <path d={path} fill="url(#pdBar)"
                    opacity={isHov || isSel ? 1.0 : 0.30 + 0.55 * ir}
                    style={{ pointerEvents: "none" }} />
                  {/* Selected indicator — white outline */}
                  {isSel && (
                    <path d={roundedTopRect(barX, barY, barW, barH, 3)}
                      fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={1.5}
                      vectorEffect="non-scaling-stroke" style={{ pointerEvents: "none" }} />
                  )}
                </g>
              );
            })}

            {/* Baseline */}
            <line x1={0} y1={baseline} x2={plotW} y2={baseline}
              stroke="rgba(255,255,255,0.10)" strokeWidth={1}
              vectorEffect="non-scaling-stroke" />


            {/* ── User price beam — focal point ── */}
            {hasPrice && inView(price) && (() => {
              // Only snap to a bin that actually has a bar (count > 0).
              // If the exact bin is empty, fall back to the nearest non-empty bin
              // by midpoint distance so the beam always lands inside a visible bar.
              const activeBins = bins.filter(b => b.count > 0);
              const exactBin   = activeBins.find(b => price >= b.s && price < b.e)
                              ?? activeBins.find(b => price === b.e);
              const priceBin   = exactBin ?? (activeBins.length
                ? activeBins.reduce((a, b) =>
                    Math.abs(price - (a.s + a.e) / 2) <= Math.abs(price - (b.s + b.e) / 2) ? a : b)
                : null);
              const ux = priceBin
                ? (() => {
                    const bColX = Math.max(0, toX(priceBin.s));
                    const bColW = Math.max(2, Math.min(plotW, toX(priceBin.e)) - bColX);
                    return bColX + bColW / 2;
                  })()
                : toX(price);
              return (
                <g>
                  {/* Wide ambient glow */}
                  <line x1={ux} y1={PAD_T} x2={ux} y2={baseline}
                    stroke="#00e5ff" strokeWidth={12} opacity={0.08}
                    vectorEffect="non-scaling-stroke" />
                  {/* Mid glow */}
                  <line x1={ux} y1={PAD_T} x2={ux} y2={baseline}
                    stroke="#00e5ff" strokeWidth={4} opacity={0.22}
                    strokeDasharray="5,3"
                    vectorEffect="non-scaling-stroke" />
                  {/* Core line */}
                  <line x1={ux} y1={PAD_T} x2={ux} y2={baseline}
                    stroke="#00e5ff" strokeWidth={2.0}
                    strokeDasharray="5,3"
                    opacity={0.97}
                    vectorEffect="non-scaling-stroke" />
                  {/* Baseline anchor ring */}
                  <circle cx={ux} cy={baseline} r={5} fill="#00e5ff" opacity={0.90} />
                  <circle cx={ux} cy={baseline} r={10} fill="none" stroke="#00e5ff" strokeWidth={1} opacity={0.30} />
                </g>
              );
            })()}


          </svg>


          {/* ── X-axis labels ── */}
          <div style={{ position: "relative", height: 30, marginTop: 2 }}>
            {xTicks.map(tick => (
              <div key={tick.v} style={{ position: "absolute", left: `${clamp(toPct(tick.mid), 2, 96)}%`, top: 4, transform: "translateX(-50%)", fontSize: 9, color: "#5a7fa0", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", userSelect: "none", fontWeight: 600 }}>
                {fmtX(tick.v)}–{Math.round(tick.e)}
              </div>
            ))}
            <div style={{ textAlign: "center", paddingTop: 18, fontSize: 7, color: "#2d4a65", textTransform: "uppercase", letterSpacing: 1.8, userSelect: "none", fontWeight: 700 }}>
              PRICE (£)
            </div>
          </div>
        </div>
      </div>


      </>}

      {/* ── Zoom chart — finer increments for clicked bin ── */}
      {clickedBin !== null && viewMode === "volume" && (() => {
        const zb = bins[clickedBin];
        if (!zb) return null;
        const zMin = zb.s, zMax = zb.e, zRange = zMax - zMin;
        if (zRange <= 0) return null;

        // Finer bin width: target ~10 buckets within the zoomed range
        const ZOOM_BUCKETS = 10;
        const rawZBinW = zRange / ZOOM_BUCKETS;
        const zBinW    = NICE_STEPS.find(s => s >= rawZBinW) ?? 1;
        const zbStart  = Math.floor(zMin / zBinW) * zBinW;
        const zbEnd    = Math.ceil(zMax  / zBinW) * zBinW;
        const zbCount  = Math.round((zbEnd - zbStart) / zBinW);

        const zBins = Array.from({ length: zbCount }, (_, i) => {
          const s = zbStart + i * zBinW;
          const e = s + zBinW;
          const isLast = i === zbCount - 1;
          const count = prices.filter(p => p >= zMin && p <= zMax && p >= s && (isLast ? p <= e : p < e)).length;
          return { s, e, count };
        }).filter(b => b.s < zMax && b.e > zMin);

        const zMaxBucket = Math.max(...zBins.map(b => b.count), 1);
        const zYMax      = dynYMax(zMaxBucket);
        const ZCW = 500, ZCH = 160, ZPADT = 12, ZPADB = 6, ZPADR = 8;
        const zPlotW    = ZCW - ZPADR;
        const zPlotH    = ZCH - ZPADT - ZPADB;
        const zBaseline = ZPADT + zPlotH;

        // ── Fixed column geometry ─────────────────────────────────────────────
        // Bars are positioned by index at a constant column width so the chart
        // never stretches or collapses regardless of how many bins have data.
        // Reference density = ZOOM_BUCKETS columns filling the full plot width.
        const nCols      = Math.max(zBins.length, 1);
        const colW       = Math.min(zPlotW / ZOOM_BUCKETS, zPlotW / nCols);
        const totalW     = nCols * colW;
        const groupX     = (zPlotW - totalW) / 2; // centre the bar group
        const zBinColX   = i => groupX + i * colW;
        const zBinMidX   = i => groupX + i * colW + colW / 2;
        const zBarFrac   = 0.55; // matches main chart bar width fraction

        const zTicks = zBins
          .map((b, i) => ({ v: b.s, e: b.e, midX: zBinMidX(i) }))
          .filter((_, i) => zBins[i].count > 0);
        const totalInRange = zBins.reduce((s, b) => s + b.count, 0);

        return (
          <div style={{ borderTop: "1px solid rgba(56,189,248,0.12)", background: "rgba(0,10,25,0.45)" }}>
            {/* Zoom header */}
            <div style={{ padding: "12px 22px 4px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: 1.4, background: "rgba(56,189,248,0.10)", border: "1px solid rgba(56,189,248,0.22)", borderRadius: 4, padding: "2px 8px" }}>
                    Zoomed
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>
                    {fmtX(zMin)} – {fmtX(zMax)}
                  </span>
                  <span style={{ fontSize: 10, color: "#4a7090" }}>
                    £{zBinW} steps
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#5a7fa0", marginTop: 4 }}>
                  <strong style={{ color: "#7dd3fc" }}>{totalInRange}</strong> listings in range
                </div>
              </div>
              <button onClick={() => { setClickedBin(null); setZoomRange(null); }} style={{
                background: "none", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 5, color: "#4a7090", cursor: "pointer",
                fontSize: 10, fontWeight: 600, padding: "3px 10px", letterSpacing: 0.3,
              }}>
                ← Back
              </button>
            </div>

            {/* Zoom chart body */}
            <div style={{ display: "flex", paddingRight: 10, paddingBottom: 0 }}>
              {/* Y-axis column */}
              <div style={{ width: 44, flexShrink: 0 }}>
                <div style={{ position: "relative", height: ZCH }}>
                  <div style={{ position: "absolute", left: 1, top: 0, width: 14, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 7, fontWeight: 600, color: "#2d3f55", textTransform: "uppercase", letterSpacing: 1.8, writingMode: "vertical-rl", transform: "rotate(180deg)", whiteSpace: "nowrap", userSelect: "none" }}>
                      Listings
                    </span>
                  </div>
                  {Array.from({ length: zYMax + 1 }, (_, t) => t).map(t => (
                    <div key={t} style={{
                      position: "absolute", right: 5,
                      top: ZPADT + zPlotH - (t / zYMax) * zPlotH,
                      transform: "translateY(-50%)",
                      fontSize: 9, color: t === 0 ? "#2d4a65" : "#5a7fa0",
                      lineHeight: 1, fontVariantNumeric: "tabular-nums",
                      userSelect: "none", fontWeight: 600,
                    }}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
              {/* Chart */}
              <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                <svg viewBox={`0 0 ${ZCW} ${ZCH}`} preserveAspectRatio="none"
                  width="100%" height={ZCH} style={{ display: "block" }}>
                  <defs>
                    <linearGradient id="zBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#1d6fa4" stopOpacity="0.60" />
                    </linearGradient>
                  </defs>

                  {/* Faint gridlines */}
                  {[0.25, 0.5, 0.75, 1].map(f => (
                    <line key={f}
                      x1={0} y1={ZPADT + zPlotH * (1 - f)} x2={zPlotW} y2={ZPADT + zPlotH * (1 - f)}
                      stroke="rgba(255,255,255,0.04)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                  ))}

                  {/* Ghost slots for empty bins — preserve spacing rhythm */}
                  {zBins.map((b, i) => b.count > 0 ? null : (
                    <line key={`gap-${i}`}
                      x1={zBinMidX(i)} y1={zBaseline} x2={zBinMidX(i)} y2={zBaseline - 4}
                      stroke="rgba(255,255,255,0.07)" strokeWidth={1}
                      vectorEffect="non-scaling-stroke" />
                  ))}

                  {/* Bars */}
                  {zBins.map((b, i) => {
                    if (b.count === 0) return null;
                    const cX    = zBinColX(i);
                    const bW    = Math.max(1, colW * zBarFrac);
                    const barH  = Math.max(MIN_BAR_PX, (b.count / zYMax) * zPlotH);
                    const barY  = zBaseline - barH;
                    const bX    = cX + (colW - bW) / 2;
                    const ir    = b.count / zMaxBucket;
                    const isUserBin = hasPrice && price >= b.s && price < b.e;
                    const isSel = zoomRange && zoomRange.s === b.s;
                    return (
                      <g key={i}
                        onClick={() => setZoomRange(isSel ? null : { s: b.s, e: b.e })}
                        style={{ cursor: "pointer" }}
                      >
                        <rect x={cX} y={ZPADT} width={colW} height={zPlotH} fill="transparent" />
                        <path d={roundedTopRect(bX, barY, bW, barH, 3)}
                          fill={isUserBin ? "url(#pdBar)" : "url(#zBarGrad)"}
                          opacity={isSel ? 1.0 : 0.28 + 0.68 * ir} style={{ pointerEvents: "none" }} />
                        {isSel && (
                          <path d={roundedTopRect(bX, barY, bW, barH, 3)}
                            fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={1.5}
                            vectorEffect="non-scaling-stroke" style={{ pointerEvents: "none" }} />
                        )}
                      </g>
                    );
                  })}

                  {/* User price beam */}
                  {hasPrice && price >= zMin && price <= zMax && (() => {
                    const zActiveBins = zBins.filter(b => b.count > 0);
                    const zExactBin   = zActiveBins.find(b => price >= b.s && price < b.e)
                                     ?? zActiveBins.find(b => price === b.e);
                    const zPriceBin   = zExactBin ?? (zActiveBins.length
                      ? zActiveBins.reduce((a, b) =>
                          Math.abs(price - (a.s + a.e) / 2) <= Math.abs(price - (b.s + b.e) / 2) ? a : b)
                      : null);
                    const zPriceBinIdx = zPriceBin ? zBins.findIndex(b => b.s === zPriceBin.s) : -1;
                    const ux = zPriceBinIdx >= 0 ? zBinMidX(zPriceBinIdx) : zPlotW / 2;
                    return (
                      <g>
                        <line x1={ux} y1={ZPADT} x2={ux} y2={zBaseline}
                          stroke="#00e5ff" strokeWidth={10} opacity={0.07} vectorEffect="non-scaling-stroke" />
                        <line x1={ux} y1={ZPADT} x2={ux} y2={zBaseline}
                          stroke="#00e5ff" strokeWidth={1.8} strokeDasharray="4,3"
                          opacity={0.90} vectorEffect="non-scaling-stroke" />
                        <circle cx={ux} cy={zBaseline} r={4} fill="#00e5ff" opacity={0.85} />
                      </g>
                    );
                  })()}

                  {/* Baseline */}
                  <line x1={0} y1={zBaseline} x2={zPlotW} y2={zBaseline}
                    stroke="rgba(255,255,255,0.10)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                </svg>

                {/* X-axis labels */}
                <div style={{ position: "relative", height: 28, marginTop: 2 }}>
                  {zTicks.map(tick => (
                    <div key={tick.v} style={{
                      position: "absolute",
                      left: `${Math.min(96, Math.max(2, (tick.midX / ZCW) * 100))}%`,
                      top: 4, transform: "translateX(-50%)",
                      fontSize: 9, color: "#5a7fa0", whiteSpace: "nowrap",
                      fontVariantNumeric: "tabular-nums", userSelect: "none", fontWeight: 600,
                    }}>
                      {fmtX(tick.v)}–{Math.round(tick.e)}
                    </div>
                  ))}
                  <div style={{ textAlign: "center", paddingTop: 16, fontSize: 7, color: "#2d4a65", textTransform: "uppercase", letterSpacing: 1.8, userSelect: "none", fontWeight: 700 }}>
                    PRICE (£)
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}


      {/* ── Table view ── */}
      {viewMode === "table" && (() => {
        const SORTS = [
          { key: "price",    label: "Price" },
          { key: "closest",  label: "Closest to yours" },
          { key: "newest",   label: "Newest" },
          { key: "feedback", label: "Seller rating" },
        ];

        const sorted = [...(listings || [])].sort((a, b) => {
          if (tableSort === "price")    return a.price - b.price;
          if (tableSort === "closest")  return Math.abs(a.price - (price || 0)) - Math.abs(b.price - (price || 0));
          if (tableSort === "newest")   return new Date(b.itemDate || 0) - new Date(a.itemDate || 0);
          if (tableSort === "feedback") return (b.sellerFeedback || 0) - (a.sellerFeedback || 0);
          return 0;
        });

        const fmtShipping = (cost, type) => {
          if (type === "FREE" || cost === 0) return "Free";
          if (cost != null) return `+£${cost.toFixed(2)}`;
          return "—";
        };

        const posFor = p => {
          if (!p) return null;
          const pct = ((p - low) / range) * 100;
          if (p < low)    return { label: "Below",   col: "#60a5fa" };
          if (pct < 25)   return { label: "Lower",   col: "#60a5fa" };
          if (pct < 45)   return { label: "Low-mid", col: "#7dd3fc" };
          if (pct < 65)   return { label: "Core",    col: "#34d399" };
          if (pct < 82)   return { label: "Up-mid",  col: "#fbbf24" };
          if (p <= high)  return { label: "Upper",   col: "#f87171" };
          return               { label: "Above",    col: "#ef4444" };
        };

        const TH = ({ children, w, flex1 }) => (
          <div style={{ ...(flex1 ? { flex: 1, minWidth: 0 } : { width: w, flexShrink: 0 }), fontSize: 8, fontWeight: 800, color: "#2d4a65", textTransform: "uppercase", letterSpacing: 1.2, paddingBottom: 8 }}>
            {children}
          </div>
        );

        return (
          <div style={{ padding: "0 22px 18px" }}>
            {/* Sort bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <span style={{ fontSize: 9, color: "#2d4a65", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Sort</span>
              {SORTS.map(s => (
                <button key={s.key} onClick={() => setTableSort(s.key)} style={{
                  padding: "3px 10px", fontSize: 10, fontWeight: 600,
                  background: tableSort === s.key ? "rgba(56,189,248,0.12)" : "transparent",
                  border: tableSort === s.key ? "1px solid rgba(56,189,248,0.30)" : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 5, color: tableSort === s.key ? "#7dd3fc" : "#3d5a72",
                  cursor: "pointer",
                }}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Header row — widths must exactly mirror data row cell widths */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 4, marginBottom: 2, paddingLeft: 8 }}>
              <div style={{ width: 52, flexShrink: 0 }} /> {/* thumbnail spacer: 44px img + 8px marginRight */}
              <TH flex1>Title</TH>
              <TH w={62}>Price</TH>
              <TH w={56}>Cond.</TH>
              <TH w={104}>Seller</TH>
              <TH w={68}>Delivery</TH>
              <TH w={62}>Position</TH>
            </div>

            {/* Rows */}
            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              {sorted.map((item, i) => {
                const pos      = posFor(item.price);
                const isUser   = hasPrice && Math.abs(item.price - price) < 0.01;
                const rowBg    = isUser ? "rgba(0,229,255,0.04)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)";
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center",
                    padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: rowBg,
                    borderLeft: isUser ? "2px solid #00e5ff" : "2px solid transparent",
                    paddingLeft: isUser ? 6 : 8,
                  }}>
                    {/* Thumbnail */}
                    <div style={{ width: 44, flexShrink: 0, marginRight: 8 }}>
                      {item.image ? (
                        <img src={item.image} alt="" onClick={e => { e.stopPropagation(); e.preventDefault(); setLightboxImg(item.image); }} style={{
                          width: 44, height: 44, objectFit: "contain",
                          borderRadius: 5, background: "#0b1929",
                          border: "1px solid rgba(255,255,255,0.07)",
                          display: "block", cursor: "zoom-in",
                        }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 5, background: "#0a1520", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 16, opacity: 0.2 }}>□</span>
                        </div>
                      )}
                    </div>
                    {/* Title */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                      <a href={item.url} target="_blank" rel="noreferrer" style={{
                        fontSize: 11, color: "#a8c8e8", textDecoration: "none", lineHeight: 1.4,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}
                        onMouseEnter={e => e.currentTarget.style.color = "#e2e8f0"}
                        onMouseLeave={e => e.currentTarget.style.color = "#a8c8e8"}
                      >
                        {item.title}
                      </a>
                    </div>
                    {/* Price */}
                    <div style={{ width: 62, flexShrink: 0, fontSize: 12, fontWeight: 800, color: isUser ? "#00e5ff" : "#e2e8f0", fontVariantNumeric: "tabular-nums" }}>
                      {fmtGBP(item.price)}
                    </div>
                    {/* Condition */}
                    <div style={{ width: 56, flexShrink: 0, fontSize: 10, color: "#7a9cc0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.condition || "—"}
                    </div>
                    {/* Seller */}
                    <div style={{ width: 104, flexShrink: 0, overflow: "hidden", paddingRight: 4 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#9ab8d0", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {item.sellerName || "—"}
                      </div>
                      {item.sellerFeedback != null && (
                        <div style={{ fontSize: 9, color: "#5a7fa0", marginTop: 2 }}>
                          {item.sellerFeedback.toLocaleString()}
                          {item.sellerFeedbackPct != null && <span style={{ color: "#4a9a6a", marginLeft: 3 }}>{item.sellerFeedbackPct.toFixed(1)}%</span>}
                        </div>
                      )}
                    </div>
                    {/* Delivery */}
                    <div style={{ width: 68, flexShrink: 0, fontSize: 10, color: item.shippingCost === 0 || item.shippingType === "FREE" ? "#34d399" : "#7a9cc0" }}>
                      {fmtShipping(item.shippingCost, item.shippingType)}
                    </div>
                    {/* Position badge */}
                    <div style={{ width: 62, flexShrink: 0 }}>
                      {pos && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, color: pos.col,
                          background: `${pos.col}18`, border: `1px solid ${pos.col}35`,
                          borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap",
                        }}>
                          {pos.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Footer ── */}
      <div style={{ padding: "10px 20px 14px", borderTop: "1px solid rgba(255,255,255,0.04)", fontSize: 10, color: "#2d4a65", display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 13, opacity: 0.5 }}>ⓘ</span>
        Prices analysed from active eBay UK listings only. Data updates every 24 hours.
      </div>

      </div>{/* end main chart column */}

      {/* ── Right listing panel — opens when a bar is clicked ── */}
      {clickedBin !== null && (() => {
        const b  = bins[clickedBin];
        if (!b) return null;
        // If a zoom bin is selected, filter down to that sub-range
        const allBl = binListings[clickedBin] || [];
        const bl = zoomRange
          ? allBl.filter(l => l.price >= zoomRange.s && l.price <= zoomRange.e)
          : allBl;
        const displayRange = zoomRange ? zoomRange : b;
        const fmtShip = (cost, type) => {
          if (type === "FREE" || cost === 0) return "Free delivery";
          if (cost != null) return `+£${cost.toFixed(2)} postage`;
          return "";
        };
        const sorted = [...bl].sort((a, z) => {
          if (panelSort === "desc")     return z.price - a.price;
          if (panelSort === "feedback") return (z.sellerFeedback || 0) - (a.sellerFeedback || 0);
          return a.price - z.price; // asc
        });
        return (
          <div style={{
            width: 310, flexShrink: 0,
            borderLeft: "1px solid rgba(56,189,248,0.14)",
            background: "rgba(1,7,18,0.98)",
            display: "flex", flexDirection: "column",
            maxHeight: "100vh",
            overflow: "hidden",
          }}>
            {/* Panel header */}
            <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div>
                {/* Breadcrumb when zoomed in */}
                {zoomRange && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                    <button onClick={() => setZoomRange(null)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 9, color: "#3d5a72", fontWeight: 600, letterSpacing: 0.3 }}>
                      {fmtX(b.s)}–{fmtX(b.e)}
                    </button>
                    <span style={{ fontSize: 9, color: "#2d4a65" }}>›</span>
                    <span style={{ fontSize: 9, color: "#38bdf8", fontWeight: 700 }}>
                      {fmtX(zoomRange.s)}–{fmtX(zoomRange.e)}
                    </span>
                  </div>
                )}
                <div style={{ fontSize: 15, fontWeight: 800, color: "#e2e8f0", letterSpacing: -0.3 }}>
                  {fmtX(displayRange.s)} – {fmtX(displayRange.e)} Range
                </div>
                <span style={{ display: "inline-block", marginTop: 5, fontSize: 10, fontWeight: 700, color: "#38bdf8", background: "rgba(56,189,248,0.10)", border: "1px solid rgba(56,189,248,0.22)", borderRadius: 5, padding: "2px 8px" }}>
                  {bl.length} listings
                </span>
              </div>
              <button onClick={() => { setClickedBin(null); setZoomRange(null); }} style={{ background: "none", border: "none", color: "#4a7090", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "0 2px", marginTop: -2, flexShrink: 0 }}>
                ×
              </button>
            </div>

            {/* Sort bar */}
            <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 10, color: "#3d5a72", whiteSpace: "nowrap" }}>Sort by:</span>
              <select value={panelSort} onChange={e => setPanelSort(e.target.value)} style={{
                background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 5, color: "#94a3b8", fontSize: 10, padding: "3px 8px",
                cursor: "pointer", flex: 1,
              }}>
                <option value="asc">Price: Low to High</option>
                <option value="desc">Price: High to Low</option>
                <option value="feedback">Most Feedback</option>
              </select>
            </div>

            {/* Listings */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {sorted.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  textDecoration: "none",
                  background: "transparent",
                  transition: "background 0.12s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(56,189,248,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {/* Thumbnail */}
                  <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 6, overflow: "hidden", background: "#0a1520", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {l.image
                      ? <img src={l.image} alt="" onClick={e => { e.stopPropagation(); e.preventDefault(); setLightboxImg(l.image); }} style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, opacity: 0.2 }}>□</div>
                    }
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10.5, color: "#a8c8e8", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 3 }}>
                      {l.title}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0", fontVariantNumeric: "tabular-nums" }}>
                        {fmtGBP(l.price)}
                        <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.5 }}>↗</span>
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 2, alignItems: "center", flexWrap: "wrap" }}>
                      {l.condition && (
                        <span style={{ fontSize: 9, color: "#4a7090", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, padding: "1px 5px" }}>
                          {l.condition}
                        </span>
                      )}
                      {l.sellerFeedback != null && (
                        <span style={{ fontSize: 9, color: "#3d5a72" }}>
                          {l.sellerFeedback.toLocaleString()}
                          {l.sellerFeedbackPct != null && <span style={{ color: "#4a9a6a", marginLeft: 2 }}>{l.sellerFeedbackPct.toFixed(1)}%</span>}
                        </span>
                      )}
                      {(l.shippingCost != null || l.shippingType) && (
                        <span style={{ fontSize: 9, color: l.shippingCost === 0 || l.shippingType === "FREE" ? "#34d399" : "#4a7090" }}>
                          {fmtShip(l.shippingCost, l.shippingType)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: 14, color: "#2d4a65", flexShrink: 0 }}>›</span>
                </a>
              ))}
            </div>

            {/* View all link */}
            <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={() => setViewMode("table")} style={{
                width: "100%", padding: "8px", fontSize: 11, fontWeight: 700,
                color: "#38bdf8", background: "rgba(56,189,248,0.07)",
                border: "1px solid rgba(56,189,248,0.20)", borderRadius: 7,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                View all {bl.length} listings in this range
                <span style={{ fontSize: 12 }}>↗</span>
              </button>
            </div>

            {/* Tip */}
            <div style={{ padding: "8px 14px 14px", display: "flex", alignItems: "flex-start", gap: 7 }}>
              <span style={{ fontSize: 13, flexShrink: 0 }}>💡</span>
              <span style={{ fontSize: 10, color: "#2d4a65", lineHeight: 1.4 }}>Tip: Click a bar to lock this range</span>
            </div>
          </div>
        );
      })()}

    {/* ── Lightbox overlay ── */}
    {lightboxImg && (
      <div
        onClick={() => setLightboxImg(null)}
        onKeyDown={e => e.key === "Escape" && setLightboxImg(null)}
        tabIndex={-1}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "zoom-out",
        }}
      >
        <img
          src={lightboxImg}
          alt=""
          style={{
            width: "min(80vw, 800px)", height: "min(80vh, 800px)",
            objectFit: "contain",
            borderRadius: 12,
            boxShadow: "0 0 60px rgba(0,0,0,0.8)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        />
        <div style={{
          position: "absolute", top: 18, right: 22,
          fontSize: 22, color: "rgba(255,255,255,0.5)",
          cursor: "pointer", lineHeight: 1,
        }}>✕</div>
      </div>
    )}

    </div>
  );
}

// ─── Locked state ─────────────────────────────────────────────────────────────
function Locked() {
  return (
    <div style={{ background: C.bg1, borderRadius: 14, border: C.borderBlue, position: "relative", overflow: "hidden", minHeight: 260 }}>
      <div style={{ padding: "28px", filter: "blur(4px)", userSelect: "none", pointerEvents: "none", opacity: 0.25 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 36, background: "#0D2040", borderRadius: 8 }} />
          <div style={{ width: 110, height: 36, background: C.blue, borderRadius: 8 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12 }}>
          <div style={{ background: C.bg2, borderRadius: 10, height: 260 }} />
          <div style={{ background: C.bg2, borderRadius: 10, height: 260 }} />
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,rgba(8,15,28,0.5),rgba(8,15,28,0.93))", backdropFilter: "blur(2px)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>Smart eBay Pricing</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: C.blue, background: "rgba(19,93,255,0.18)", border: "1px solid rgba(19,93,255,0.4)", borderRadius: 4, padding: "2px 7px", letterSpacing: 0.8 }}>PRO</span>
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>Live eBay UK market data to price listings competitively and maximise profit.</div>
          <button style={{ ...BUTTON_BASE, background: "linear-gradient(135deg,#135DFF,#0ea5e9)", color: "#fff", fontSize: 14, fontWeight: 800, padding: "11px 30px", boxShadow: "0 0 22px rgba(19,93,255,0.45)" }}>Upgrade to Pro →</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PriceCalculator({ onSave, onLoadHandled, products, onDeleteProduct, onLoadProduct, isPro = true }) {
  const [innerPage, setInnerPage] = useState("calculator");
  const savedCount = products?.length ?? 0;

  // ── Input state ──────────────────────────────────────────────────────────────
  const [productName,    setProductName]    = useSessionState("jsk_calc_product_name", "");
  const [itemCost,       setItemCost]       = useSessionState("jsk_calc_item_cost",    "");
  const [shippingCost,   setShippingCost]   = useSessionState("jsk_calc_shipping",     "");
  const [packagingCost,  setPackagingCost]  = useSessionState("jsk_calc_packaging",    "");
  const [otherCosts,     setOtherCosts]     = useSessionState("jsk_calc_other",        "");
  const [buyerShipping,  setBuyerShipping]  = useSessionState("jsk_calc_buyer_ship",   "");
  const [sellingPrice,   setSellingPrice]   = useSessionState("jsk_calc_selling",      "");
  const [fvfPct,         setFvfPct]         = useSessionState("jsk_calc_fvf",          "12.8");
  const [fixedFee,       setFixedFee]       = useSessionState("jsk_calc_fixed_fee",    "0.30");
  const [promoPct,       setPromoPct]       = useSessionState("jsk_calc_promo",        "0");
  const [vatRegistered,  setVatRegistered]  = useSessionState("jsk_calc_vat",          true);
  const [targetMarkup,   setTargetMarkup]   = useSessionState("jsk_calc_markup",       "");
  const [targetMargin,   setTargetMargin]   = useSessionState("jsk_calc_margin",       "");
  const [editingMarkup,  setEditingMarkup]  = useState(false);
  const [editingMargin,  setEditingMargin]  = useState(false);
  const [savedFlash,     setSavedFlash]     = useState(false);

  // ── Market pricing state ─────────────────────────────────────────────────────
  const [smQuery,        setSmQuery]        = useSessionState("jsk_calc_sm_query",     "");
  const [smCondition,    setSmCondition]    = useSessionState("jsk_calc_sm_condition", "new");
  const [smData,         setSmData]         = useSessionState("jsk_calc_sm_data",      null);
  const [smLoading,      setSmLoading]      = useState(false);
  const [smError,        setSmError]        = useState("");

  // ── Derived calculations ─────────────────────────────────────────────────────
  const cost        = parseFloat(itemCost)      || 0;
  const shipping    = parseFloat(shippingCost)  || 0;
  const packaging   = parseFloat(packagingCost) || 0;
  const other       = parseFloat(otherCosts)    || 0;
  const buyerShip   = parseFloat(buyerShipping) || 0;
  const price       = parseFloat(sellingPrice)  || 0;
  const fvf         = parseFloat(fvfPct)        || 0;
  const fixed       = parseFloat(fixedFee)      || 0;
  const promo       = parseFloat(promoPct)      || 0;
  const vatRate     = vatRegistered ? 20 / 120  : 0;

  // eBay fees are charged on the total buyer payment (item price + buyer shipping)
  const totalIncome = price + buyerShip;
  const R           = 1 - fvf / 100 - promo / 100 - vatRate;

  const ebayFVF    = totalIncome > 0 ? totalIncome * (fvf / 100) + fixed : 0;
  const ebayPromo  = totalIncome * (promo / 100);
  const vatAmount  = totalIncome * vatRate;
  const totalCosts = cost + shipping + packaging + other;
  const netRevenue = totalIncome - ebayFVF - ebayPromo - vatAmount;
  const profit     = netRevenue - totalCosts;

  // Margin on total revenue; markup on item cost only
  const margin     = totalIncome > 0 ? (profit / totalIncome) * 100 : NaN;
  const markup     = cost        > 0 ? (profit / cost)        * 100 : NaN;

  // Break-even item price accounting for buyer shipping income
  const breakEven  = R > 0 ? (totalCosts + fixed) / R - buyerShip : NaN;

  const hasResult  = price > 0 && cost > 0;
  const profitColor = !hasResult ? C.text : profit > 0 ? "#4ade80" : profit < 0 ? "#f87171" : C.text;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const loadProduct = (p) => {
    setProductName(p.name || "");
    setItemCost(String(p.itemCost ?? ""));
    setShippingCost(String(p.shippingCost ?? ""));
    setSellingPrice(String(p.sellingPrice ?? ""));
    setFvfPct(String(p.fvfPct ?? "12.8"));
    setFixedFee(String(p.fixedFee ?? "0.30"));
    setPromoPct(String(p.promoPct ?? "0"));
    setVatRegistered(p.vatRegistered ?? true);
  };
  if (onLoadHandled) onLoadHandled(loadProduct);

  const handleSave = () => {
    if (!hasResult || !onSave) return;
    onSave({ name: productName.trim() || "Unnamed Product", itemCost: cost, shippingCost: shipping, sellingPrice: price, fvfPct: fvf, fixedFee: fixed, promoPct: promo, vatRegistered, profit, margin, markup, ebayFVF, ebayPromo, vatAmount });
    setSavedFlash(true); setTimeout(() => setSavedFlash(false), 2000);
  };

  const handleFetch = async () => {
    if (!smQuery.trim()) return;
    setSmLoading(true); setSmError("");
    try {
      const res  = await fetch(`${API_URL}/api/ebay/search-prices`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: smQuery.trim(), condition: smCondition }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch prices.");
      if (json.priceCount === 0) throw new Error(json.zeroResultsMsg || "No listings found — try changing the condition or search term.");
      setSmData(json);
    } catch (err) { setSmError(err.message); setSmData(null); }
    finally       { setSmLoading(false); }
  };

  // Reset legacy "any" condition (removed in favour of explicit condition-first flow)
  useEffect(() => {
    if (!["new", "used", "remanufactured"].includes(smCondition)) setSmCondition("new");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync target fields when calculated values change
  useEffect(() => { if (!editingMarkup && !isNaN(markup) && price > 0) setTargetMarkup(markup.toFixed(1)); }, [markup, editingMarkup, price]);
  useEffect(() => { if (!editingMargin && !isNaN(margin) && price > 0) setTargetMargin(margin.toFixed(1)); }, [margin, editingMargin, price]);

  // ── Target price calculators ──────────────────────────────────────────────────
  // When working backward from a target markup/margin, the selling price is:
  //   price = (totalCosts + cost*(mk/100) + fixed) / R - buyerShip  [markup]
  //   price = (totalCosts + fixed) / (R - mg/100) - buyerShip        [margin]
  function calcFromMarkup() {
    const mk = parseFloat(targetMarkup);
    if (!isNaN(mk) && cost > 0 && R > 0) {
      setSellingPrice(((totalCosts + cost * (mk / 100) + fixed) / R - buyerShip).toFixed(2));
    }
  }
  function calcFromMargin() {
    const mg = parseFloat(targetMargin);
    if (!isNaN(mg) && mg < 100) {
      const d = R - mg / 100;
      if (d > 0) setSellingPrice(((totalCosts + fixed) / d - buyerShip).toFixed(2));
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1440, margin: "0 auto" }}>

      {/* ── Inner tab bar ── */}
      <div style={{ display: "flex", gap: 5, marginBottom: 14, background: "#0F1E35", borderRadius: 12, padding: 4, border: "1px solid rgba(255,255,255,0.08)" }}>
        {[{ key: "calculator", label: "Calculator" }, { key: "saved", label: `Saved Products${savedCount ? ` (${savedCount})` : ""}` }].map(({ key, label }) => (
          <button key={key} onClick={() => setInnerPage(key)} style={{ flex: 1, padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: innerPage === key ? C.blue : "transparent", color: innerPage === key ? "#fff" : C.muted, boxShadow: innerPage === key ? "0 0 12px rgba(19,93,255,0.28)" : "none", transition: "all 0.15s" }}>{label}</button>
        ))}
      </div>

      {/* ── Saved tab ── */}
      {innerPage === "saved" && <SavedProducts products={products ?? []} onDelete={onDeleteProduct} onLoad={(p) => { setInnerPage("calculator"); if (onLoadProduct) onLoadProduct(p); }} />}

      {/* ── Calculator tab ── */}
      {innerPage === "calculator" && (
        <>
          {!isPro && <Locked />}

          {isPro && (
            <div style={{ background: C.bg1, border: C.borderBlue, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>

              {/* ── Card header ── */}
              <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>Smart eBay Pricing</span>
                      <span style={{ fontSize: 9, fontWeight: 800, color: C.blue, background: "rgba(19,93,255,0.15)", border: "1px solid rgba(19,93,255,0.4)", borderRadius: 4, padding: "2px 7px", letterSpacing: 0.8 }}>PRO</span>
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Compare market pricing, fees and profit in one place</div>
                  </div>
                  {smData && (
                    <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(19,93,255,0.1)", border: "1px solid rgba(19,93,255,0.22)", borderRadius: 8, padding: "7px 13px", flexShrink: 0 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "pcPulse 2s ease-in-out infinite" }} />
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#93c5fd" }}>{smData.priceCount}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>{smData.conditionLabel?.toLowerCase() || ""} listings used</span>
                    </div>
                  )}
                </div>
                {/* Condition toggle */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>Condition</span>
                    <div style={{ display: "flex", gap: 3, background: "#060d1a", borderRadius: 8, padding: 3, border: "1px solid rgba(255,255,255,0.07)" }}>
                      {[{ key: "new", label: "New" }, { key: "used", label: "Used" }, { key: "remanufactured", label: "Remanufactured" }].map(({ key, label }) => {
                        const active = smCondition === key;
                        return (
                          <button key={key} onClick={() => { setSmCondition(key); if (smData) setSmData(null); }}
                            style={{ padding: "4px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: active ? C.blue : "transparent", color: active ? "#fff" : C.muted, boxShadow: active ? "0 0 10px rgba(19,93,255,0.35)" : "none", transition: "all 0.15s" }}>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: C.dim, paddingLeft: 2 }}>
                    Market data will only use listings matching the selected condition.
                  </div>
                </div>

                {/* Search row */}
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={smQuery} onChange={(e) => setSmQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !smLoading && handleFetch()} placeholder="OEM / part number or product name…" style={{ ...CI, flex: 1, fontSize: 14 }} />
                  <button onClick={handleFetch} disabled={smLoading || !smQuery.trim()} style={{ ...BUTTON_BASE, padding: "8px 22px", fontSize: 13, flexShrink: 0, background: smLoading || !smQuery.trim() ? "#0d2040" : C.blue, color: "#fff", opacity: smLoading || !smQuery.trim() ? 0.5 : 1, whiteSpace: "nowrap", boxShadow: smLoading || !smQuery.trim() ? "none" : "0 0 16px rgba(19,93,255,0.4)" }}>
                    {smLoading ? "Fetching…" : "Fetch Prices"}
                  </button>
                </div>
                {smError && <div style={{ marginTop: 8, padding: "7px 12px", background: "#0d1428", color: "#fca5a5", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 8, fontSize: 12 }}>⚠ {smError}</div>}
              </div>

              {/* ── Two-column body ── */}
              <div style={{ display: "flex", alignItems: "stretch", flex: 1 }}>

                {/* ═══ LEFT: Inputs ═══ */}
                <div style={{ width: 230, flexShrink: 0, background: C.bg2, borderRight: "1px solid rgba(255,255,255,0.05)", padding: "14px 16px", display: "flex", flexDirection: "column" }}>

                  <SL mt={0}>Product</SL>
                  <Row label="Product / SKU">
                    <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Timing Belt Kit" style={CI} />
                  </Row>

                  <SL>Your Costs</SL>
                  <Row label="Item cost (£)" note={vatRegistered ? "Enter ex-VAT if you reclaim" : ""}>
                    <input type="number" value={itemCost} onChange={(e) => setItemCost(e.target.value)} placeholder="0.00" style={CI} />
                  </Row>
                  <Row label="Postage (£)" note="Your outgoing courier cost">
                    <input type="number" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} placeholder="0.00" style={CI} />
                  </Row>
                  <Row label="Packaging (£)">
                    <input type="number" value={packagingCost} onChange={(e) => setPackagingCost(e.target.value)} placeholder="0.00" style={CI} />
                  </Row>
                  <Row label="Other costs (£)" note="Handling, overheads, etc." last>
                    <input type="number" value={otherCosts} onChange={(e) => setOtherCosts(e.target.value)} placeholder="0.00" style={CI} />
                  </Row>

                  <SL>eBay Fees</SL>
                  <Row label="Final value (%)">
                    <input type="number" value={fvfPct} onChange={(e) => setFvfPct(e.target.value)} placeholder="12.8" style={CI} />
                  </Row>
                  <Row label="Fixed fee (£)">
                    <input type="number" value={fixedFee} onChange={(e) => setFixedFee(e.target.value)} placeholder="0.30" style={CI} />
                  </Row>
                  <Row label="Ad rate (%)" last>
                    <input type="number" value={promoPct} onChange={(e) => setPromoPct(e.target.value)} placeholder="0" style={CI} />
                  </Row>

                  {/* VAT toggle */}
                  <div style={{ padding: "8px 0", marginTop: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: C.muted }}>VAT registered (20%)</span>
                      <button onClick={() => setVatRegistered(v => !v)} style={{ ...BUTTON_BASE, padding: "4px 14px", fontSize: 11, background: vatRegistered ? C.blue : "#0d2040", color: "#fff", boxShadow: vatRegistered ? "0 0 10px rgba(19,93,255,0.3)" : "none" }}>
                        {vatRegistered ? "ON" : "OFF"}
                      </button>
                    </div>
                    {vatRegistered && (
                      <div style={{ fontSize: 10, color: C.dim, marginTop: 4, lineHeight: 1.4 }}>
                        Selling price treated as VAT-inclusive. Collected VAT shown in breakdown.
                      </div>
                    )}
                  </div>

                  <HD />

                  {/* Selling price */}
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 5 }}>
                      Selling Price {vatRegistered ? "(inc. VAT)" : "(ex. VAT)"}
                    </div>
                    <input
                      type="number" value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      placeholder="e.g. 29.99"
                      style={{ ...CI, fontSize: 18, fontWeight: 700, width: "100%", background: "rgba(19,93,255,0.08)", border: "1px solid rgba(19,93,255,0.3)" }}
                    />
                  </div>

                  {/* Buyer shipping */}
                  <Row label="Buyer shipping (£)" note="Charged to buyer — inc. in fees" last>
                    <input type="number" value={buyerShipping} onChange={(e) => setBuyerShipping(e.target.value)} placeholder="0.00" style={CI} />
                  </Row>

                  <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                    <div>
                      <div style={{ fontSize: 10, color: C.dim, marginBottom: 3 }}>Target markup %</div>
                      <div style={{ display: "flex", gap: 3 }}>
                        <input type="number" value={targetMarkup}
                          onChange={(e) => { setTargetMarkup(e.target.value); }}
                          onFocus={() => setEditingMarkup(true)} onBlur={() => setEditingMarkup(false)}
                          onKeyDown={(e) => e.key === "Enter" && calcFromMarkup()}
                          placeholder="50" style={{ ...CI, flex: 1, padding: "6px 8px" }}
                        />
                        <button onClick={calcFromMarkup} style={{ ...SMALL_BUTTON_STYLE, padding: "6px 8px", fontSize: 11 }}>Set</button>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.dim, marginBottom: 3 }}>Target margin %</div>
                      <div style={{ display: "flex", gap: 3 }}>
                        <input type="number" value={targetMargin}
                          onChange={(e) => { setTargetMargin(e.target.value); }}
                          onFocus={() => setEditingMargin(true)} onBlur={() => setEditingMargin(false)}
                          onKeyDown={(e) => e.key === "Enter" && calcFromMargin()}
                          placeholder="20" style={{ ...CI, flex: 1, padding: "6px 8px" }}
                        />
                        <button onClick={calcFromMargin} style={{ ...SMALL_BUTTON_STYLE, padding: "6px 8px", fontSize: 11 }}>Set</button>
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1, minHeight: 12 }} />

                  {hasResult && (
                    <button onClick={handleSave} style={{ ...BUTTON_BASE, background: savedFlash ? "#166534" : C.blue, color: "#fff", width: "100%", textAlign: "center", fontSize: 13, padding: "9px", marginTop: 8, boxShadow: savedFlash ? "0 0 14px rgba(22,101,52,0.4)" : "0 0 14px rgba(19,93,255,0.3)" }}>
                      {savedFlash ? "✓ Saved!" : "Save Product"}
                    </button>
                  )}
                </div>

                {/* ═══ RIGHT: Results + Market ═══ */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

                  {/* ── Compact profit stats bar ── */}
                  <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
                      {[
                        {
                          label: "Selling Price",
                          value: price > 0 ? fmtGBP(price) : "—",
                          color: price > 0 ? "#e2e8f0" : "#2a3f55",
                          sub: buyerShip > 0 ? `+ ${fmtGBP(buyerShip)} p&p` : null,
                        },
                        {
                          label: "Net Profit",
                          value: hasResult ? fmt(profit) : "—",
                          color: hasResult ? profitColor : "#2a3f55",
                          sub: null,
                        },
                        {
                          label: "Margin",
                          value: hasResult ? fmtPct(margin) : "—",
                          color: hasResult ? profitColor : "#2a3f55",
                          sub: hasResult ? "of revenue" : null,
                        },
                        {
                          label: "Markup",
                          value: hasResult ? fmtPct(markup) : "—",
                          color: hasResult ? profitColor : "#2a3f55",
                          sub: hasResult ? "on cost" : null,
                        },
                      ].map(({ label, value, color, sub }, i) => (
                        <div key={label} style={{
                          padding: "12px 14px", textAlign: "center",
                          borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                        }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: "#4a6a8a", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>{label}</div>
                          <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1, letterSpacing: -0.5 }}>{value}</div>
                          {sub && <div style={{ fontSize: 10, color: "#3d5a7a", marginTop: 3 }}>{sub}</div>}
                        </div>
                      ))}
                    </div>

                    {/* Break-even + cost breakdown */}
                    {hasResult && (
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "8px 16px" }}>

                        {!isNaN(breakEven) && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "5px 10px", background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.12)", borderRadius: 7 }}>
                            <span style={{ fontSize: 12, color: "#6b7280" }}>Break-even</span>
                            <span style={{ fontSize: 15, fontWeight: 800, color: "#fbbf24" }}>{fmt(breakEven)}</span>
                          </div>
                        )}

                        <div style={{ fontSize: 10, fontWeight: 700, color: "#3d5268", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Breakdown</div>
                        {buyerShip > 0 && <BR label="Buyer shipping (income)" value={`+${fmt(buyerShip)}`} color="#93c5fd" />}
                        {cost > 0      && <BR label="Product cost"            value={`-${fmt(cost)}`}       color="#f87171" />}
                        {(shipping + packaging) > 0 && <BR label="Postage & packaging" value={`-${fmt(shipping + packaging)}`} color="#f87171" />}
                        {other > 0     && <BR label="Other costs"             value={`-${fmt(other)}`}      color="#f87171" />}
                        <BR label={`eBay fees (${fvf}% + £${fixed.toFixed(2)}${promo > 0 ? ` + ${promo}% ad` : ""})`} value={`-${fmt(ebayFVF + ebayPromo)}`} color="#f87171" />
                        {vatRegistered && <BR label="VAT collected → HMRC" value={`-${fmt(vatAmount)}`} color="#f87171" note="You keep none of this" />}
                        <BR label="Net Profit" value={fmt(profit)} color={profitColor} strong />
                      </div>
                    )}

                    {!hasResult && (
                      <div style={{ padding: "8px 0 2px", textAlign: "center", fontSize: 12, color: "#2a3f55" }}>
                        Enter item cost &amp; selling price to calculate profit
                      </div>
                    )}
                  </div>

                  {/* ── Market Intelligence — HERO section ── */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: "0 20px 16px" }}>

                    {/* Section header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0 8px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#5a8ab0", textTransform: "uppercase", letterSpacing: 1.2 }}>
                        {smData
                          ? `eBay UK Market · ${smData.conditionLabel} · ${smData.priceCount} listings`
                          : "Market Intelligence"
                        }
                      </div>
                      {smData && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9, fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.08)", borderRadius: 20, padding: "3px 9px" }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "pcPulse 2s ease-in-out infinite" }} />
                          LIVE
                        </span>
                      )}
                    </div>

                    {smLoading && <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 13 }}>⏳ Fetching live market data…</div>}

                    {!smLoading && !smData && (
                      <div style={{
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        minHeight: 280, textAlign: "center",
                      }}>
                        <div style={{ fontSize: 42, opacity: 0.35, marginBottom: 12 }}>📊</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#4b5563", marginBottom: 6 }}>No market data</div>
                        <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.6 }}>
                          Search a part number above to<br />load live eBay UK pricing.
                        </div>
                      </div>
                    )}

                    {!smLoading && smData && (
                      <div style={{ animation: "pcIn 0.3s ease" }}>

                        {/* ── Price Distribution — HERO ── */}
                        <PriceDistribution data={smData} listings={smData.listings} price={price} />

                      </div>
                    )}
                  </div>
                </div>{/* end right */}
              </div>{/* end two-column */}
            </div>
          )}
        </>
      )}
    </div>
  );
}
