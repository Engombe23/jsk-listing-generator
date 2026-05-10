import React, { memo, useState, useEffect } from "react";
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
    @keyframes pcPulse { 0%,100%{opacity:1;box-shadow:0 0 6px #4ade80} 50%{opacity:.3;box-shadow:0 0 14px #4ade80} }
    @keyframes pcGlow  { 0%,100%{box-shadow:0 0 8px #00e5ff,0 0 20px #00e5ff60} 50%{box-shadow:0 0 14px #00e5ff,0 0 30px #00e5ff80} }
    @keyframes pcIn    { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
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
      display: "grid", gridTemplateColumns: "115px 1fr", alignItems: "center", gap: 8,
      padding: "4px 0",
      borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.04)",
    }}>
      <div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.3 }}>{label}</div>
        {note && <div style={{ fontSize: 10, color: C.dim, marginTop: 1, lineHeight: 1.2 }}>{note}</div>}
      </div>
      {children}
    </div>
  );
}

function SL({ children, mt }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 0.7, paddingTop: mt ?? 10, paddingBottom: 4 }}>
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
  const [hovered, setHovered] = useState(null);

  const prices = (listings || [])
    .map(l => l.price)
    .filter(p => p != null && p > 0)
    .sort((a, b) => a - b);

  if (prices.length < 2 || !data) return <PricingBand data={data} price={price} />;
  const { low, high, median, average } = data;
  const range = high - low;
  if (range <= 0) return <PricingBand data={data} price={price} />;
  const n = prices.length;

  // ── KDE ─────────────────────────────────────────────────────────────────────
  const mean = prices.reduce((s, p) => s + p, 0) / n;
  const std  = Math.sqrt(prices.reduce((s, p) => s + (p - mean) ** 2, 0) / n) || range * 0.15;
  const bw   = Math.max(range * 0.08, 1.06 * std * Math.pow(n, -0.2));
  const kde  = x => prices.reduce((s, p) => { const z = (x - p) / bw; return s + Math.exp(-0.5 * z * z); }, 0);

  const STEPS = 200;
  const kdePts = Array.from({ length: STEPS + 1 }, (_, i) => {
    const x = low + (i / STEPS) * range;
    return { x, d: kde(x) };
  });
  const maxD = Math.max(...kdePts.map(pt => pt.d), 0.001);

  // ── Histogram buckets ──────────────────────────────────────────────────────
  const numBuckets = Math.max(12, Math.min(28, n * 2));
  const bucketW    = range / numBuckets;
  const buckets    = Array.from({ length: numBuckets }, (_, i) => {
    const bStart = low + i * bucketW;
    const bEnd   = bStart + bucketW;
    const count  = prices.filter(p => p >= bStart && (i === numBuckets - 1 ? p <= bEnd : p < bEnd)).length;
    return { bStart, bEnd, count };
  });
  const maxBucket = Math.max(...buckets.map(b => b.count), 1);

  // ── Cluster ───────────────────────────────────────────────────────────────
  const clPts        = kdePts.filter(pt => pt.d >= maxD * 0.4);
  const clusterStart = clPts.length ? clPts[0].x                : low;
  const clusterEnd   = clPts.length ? clPts[clPts.length - 1].x : high;
  const clusterCount = prices.filter(p => p >= clusterStart && p <= clusterEnd).length;

  // ── SVG ──────────────────────────────────────────────────────────────────
  const W = 500, H = 160, PAD_T = 12, PAD_B = 6;
  const toX = v => ((v - low) / range) * W;
  const toY = d => H - PAD_B - (d / maxD) * (H - PAD_T - PAD_B);

  const kPts    = kdePts.map(pt => `${toX(pt.x).toFixed(1)},${toY(pt.d).toFixed(1)}`).join(" ");
  const linePath = `M ${kPts}`;
  const areaPath = `${linePath} L ${W},${H} L 0,${H} Z`;

  // ── Pct helpers ───────────────────────────────────────────────────────────
  const pct      = v => Math.min(100, Math.max(0, ((v - low) / range) * 100));
  const medPct   = pct(median);
  const avgPct   = pct(average);
  const coreL    = pct(clusterStart);
  const coreR    = pct(clusterEnd);
  const hasPrice = price > 0;
  const userPct  = hasPrice ? pct(price) : null;

  // KDE y-coords at key prices (for glowing dots)
  const userD    = hasPrice ? kde(price) : 0;
  const userDotY = hasPrice ? toY(userD) : H;
  const medDotY  = toY(kde(median));
  const avgDotY  = toY(kde(average));

  // ── Competition ───────────────────────────────────────────────────────────
  const compWindow = range * 0.1;
  const compCount  = hasPrice ? prices.filter(p => Math.abs(p - price) <= compWindow).length : 0;
  const compLevel  = compCount >= 6 ? "High" : compCount >= 3 ? "Medium" : "Low";
  const compColor  = compCount >= 6 ? "#f87171" : compCount >= 3 ? "#fbbf24" : "#4ade80";

  // ── Price rank ────────────────────────────────────────────────────────────
  const priceRank = hasPrice ? prices.filter(p => p < price).length + 1 : null;

  // ── Insight ───────────────────────────────────────────────────────────────
  const insight = (() => {
    if (!hasPrice) return {
      headline: `${clusterCount} of ${n} listings cluster between £${Math.round(clusterStart)}–£${Math.round(clusterEnd)}.`,
      sub: "Enter a selling price to see your market position.",
    };
    const inCluster = price >= clusterStart && price <= clusterEnd;
    const below     = price < clusterStart;
    if (inCluster && compCount >= 3)
      return { headline: "Your price sits in the highest-volume market range.", sub: `${compCount} competing listings within 10% of your price — strong competition.` };
    if (inCluster)
      return { headline: "Your price sits within the main market cluster.", sub: "Well-positioned against the majority of active listings." };
    if (below)
      return { headline: "Your price is below the main market cluster.", sub: "Fewer competing listings at this level — strong value positioning." };
    return { headline: "Your price sits above the central market range.", sub: "Lower seller density here — may affect conversion rate." };
  })();

  const fmtR    = v => `£${Math.round(v)}`;
  const MARKER  = "#00e5ff";
  const MED_COL = "#a78bfa";
  const AVG_COL = "#60a5fa";

  // Label clamping
  const userLabelLeft = userPct !== null ? Math.min(86, Math.max(12, userPct)) : 50;
  const hovLeft       = hovered  !== null ? Math.min(88, Math.max(12, pct(hovered))) : 0;

  // X-axis labels
  const tooClose = Math.abs(medPct - avgPct) < 8;
  const xLabels = (() => {
    const labels = [
      { v: low,  label: fmtR(low),  col: "#475569" },
      { v: high, label: fmtR(high), col: "#475569" },
    ];
    if (medPct > 8 && medPct < 92) labels.push({ v: median,  label: fmtR(median),  col: MED_COL });
    if (!tooClose && avgPct > 8 && avgPct < 92 && Math.abs(avgPct - medPct) > 7)
      labels.push({ v: average, label: fmtR(average), col: AVG_COL });
    return labels;
  })();

  const LABEL_H = 56;

  return (
    <div style={{
      background: "#020c1b",
      border: "1px solid rgba(30,58,138,0.55)",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
      marginTop: 2,
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: "12px 18px 10px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: "#3b82f6", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>
            Market Intelligence
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#e2e8f0", lineHeight: 1.2 }}>
            Price Distribution
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            Real-time eBay UK market data
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#1e40af", letterSpacing: -1, lineHeight: 1 }}>{n}</div>
          <div style={{ fontSize: 9, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>listings</div>
        </div>
      </div>

      {/* ── Chart area ── */}
      <div style={{ position: "relative", background: "#030d1e" }}>

        {/* Zone labels strip */}
        <div style={{ position: "relative", height: 22, background: "#020c1b", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
          {coreL > 14 && (
            <div style={{ position: "absolute", left: `${coreL / 2}%`, top: "50%", transform: "translate(-50%,-50%)", fontSize: 8, fontWeight: 800, color: "#0ea5e9", textTransform: "uppercase", letterSpacing: 1.5, whiteSpace: "nowrap" }}>
              Lower
            </div>
          )}
          <div style={{ position: "absolute", left: `${(coreL + coreR) / 2}%`, top: "50%", transform: "translate(-50%,-50%)", fontSize: 8, fontWeight: 800, color: "#22c55e", textTransform: "uppercase", letterSpacing: 1.5, whiteSpace: "nowrap" }}>
            Core Market
          </div>
          {coreR < 86 && (
            <div style={{ position: "absolute", left: `${(coreR + 100) / 2}%`, top: "50%", transform: "translate(-50%,-50%)", fontSize: 8, fontWeight: 800, color: "#f97316", textTransform: "uppercase", letterSpacing: 1.5, whiteSpace: "nowrap" }}>
              Upper
            </div>
          )}
        </div>

        {/* YOUR PRICE label area */}
        <div style={{ position: "relative", height: LABEL_H }}>
          {hasPrice && userPct !== null && (
            <div style={{
              position: "absolute",
              left: `${userLabelLeft}%`, top: 0, height: "100%",
              transform: "translateX(-50%)",
              display: "flex", flexDirection: "column", alignItems: "center",
              pointerEvents: "none", zIndex: 10,
            }}>
              <div style={{ height: 8 }} />
              <div style={{ fontSize: 8, fontWeight: 800, color: MARKER, letterSpacing: 2, textTransform: "uppercase", marginBottom: 3, whiteSpace: "nowrap" }}>
                Your Price
              </div>
              <div style={{
                background: MARKER, color: "#001520",
                fontSize: 14, fontWeight: 900,
                padding: "4px 13px", borderRadius: 3,
                whiteSpace: "nowrap",
                boxShadow: `0 0 22px ${MARKER}aa, 0 0 44px ${MARKER}44`,
                letterSpacing: -0.3, lineHeight: 1.6,
              }}>
                {fmtGBP(price)}
              </div>
              <div style={{ flex: 1, width: 1.5, background: `linear-gradient(to bottom, ${MARKER}cc, ${MARKER}00)`, marginTop: 5 }} />
            </div>
          )}
          {hovered !== null && (
            <div style={{
              position: "absolute", top: 10, left: `${hovLeft}%`,
              transform: "translateX(-50%)",
              background: "rgba(2,12,27,0.97)",
              border: "1px solid rgba(56,189,248,0.3)",
              borderRadius: 4, padding: "3px 9px",
              fontSize: 11, fontWeight: 700, color: "#7dd3fc",
              whiteSpace: "nowrap", pointerEvents: "none", zIndex: 20,
              boxShadow: "0 2px 12px rgba(0,0,0,0.6)",
            }}>
              {fmtGBP(hovered)}
            </div>
          )}
        </div>

        {/* ── SVG chart ── */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          width="100%"
          height={H}
          style={{ display: "block" }}
        >
          <defs>
            <linearGradient id="pd_kdeG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#38bdf8" stopOpacity="0.22" />
              <stop offset="60%"  stopColor="#1e40af" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#020c1b" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="pd_coreG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#22c55e" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Zone backgrounds */}
          {coreL > 1 && <rect x={0} y={0} width={toX(clusterStart)} height={H} fill="rgba(6,14,30,0.5)" />}
          <rect x={toX(clusterStart)} y={0} width={Math.max(0, toX(clusterEnd) - toX(clusterStart))} height={H} fill="url(#pd_coreG)" />
          {coreR < 99 && <rect x={toX(clusterEnd)} y={0} width={W - toX(clusterEnd)} height={H} fill="rgba(6,14,30,0.5)" />}

          {/* Histogram bars */}
          {buckets.map(({ bStart, bEnd, count }, i) => {
            const barH    = (count / maxBucket) * (H - PAD_T - PAD_B);
            const inCore  = bStart >= clusterStart && bEnd <= clusterEnd;
            const barCol  = inCore ? "#22c55e" : "#1d4ed8";
            const opacity = 0.13 + (count / maxBucket) * 0.52;
            return (
              <rect key={i}
                x={toX(bStart) + 0.5}
                y={H - PAD_B - barH}
                width={Math.max(1, toX(bEnd) - toX(bStart) - 1)}
                height={barH}
                fill={barCol}
                opacity={opacity}
              />
            );
          })}

          {/* KDE area fill */}
          <path d={areaPath} fill="url(#pd_kdeG)" />

          {/* KDE glow layer */}
          <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth={8} opacity={0.08} />
          {/* KDE main line */}
          <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth={1.8} opacity={0.9} vectorEffect="non-scaling-stroke" />

          {/* Hoverable individual listing lines */}
          {prices.map((p, i) => {
            const isHov = hovered === p;
            return (
              <g key={i}
                onMouseEnter={() => setHovered(p)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "crosshair" }}
              >
                <line x1={toX(p)} y1={0} x2={toX(p)} y2={H}
                  stroke={isHov ? "rgba(148,163,184,0.8)" : "rgba(148,163,184,0.12)"}
                  strokeWidth={isHov ? 1.5 : 1}
                  vectorEffect="non-scaling-stroke"
                />
                <rect x={toX(p) - 7} y={0} width={14} height={H} fill="transparent" />
              </g>
            );
          })}

          {/* Boundary lines */}
          <line x1={toX(low)}  y1={0} x2={toX(low)}  y2={H} stroke="rgba(71,85,105,0.5)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <line x1={toX(high)} y1={0} x2={toX(high)} y2={H} stroke="rgba(71,85,105,0.5)" strokeWidth={1} vectorEffect="non-scaling-stroke" />

          {/* Average: dashed + dot */}
          <line x1={toX(average)} y1={0} x2={toX(average)} y2={H}
            stroke={AVG_COL} strokeWidth={1} strokeDasharray="4,4" opacity={0.7}
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={toX(average)} cy={avgDotY} r={10} fill={AVG_COL} opacity={0.12} />
          <circle cx={toX(average)} cy={avgDotY} r={5}  fill={AVG_COL} opacity={0.25} />
          <circle cx={toX(average)} cy={avgDotY} r={3}  fill={AVG_COL} opacity={1}    />

          {/* Median: prominent + dot */}
          <line x1={toX(median)} y1={0} x2={toX(median)} y2={H}
            stroke={MED_COL} strokeWidth={8} opacity={0.10}
          />
          <line x1={toX(median)} y1={0} x2={toX(median)} y2={H}
            stroke={MED_COL} strokeWidth={1.5} strokeDasharray="5,3" opacity={0.9}
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={toX(median)} cy={medDotY} r={14} fill={MED_COL} opacity={0.08} />
          <circle cx={toX(median)} cy={medDotY} r={7}  fill={MED_COL} opacity={0.2}  />
          <circle cx={toX(median)} cy={medDotY} r={3.5} fill={MED_COL} opacity={1}   />

          {/* User price marker */}
          {hasPrice && userPct !== null && (
            <>
              <line x1={userPct / 100 * W} y1={0} x2={userPct / 100 * W} y2={H} stroke={MARKER} strokeWidth={20} opacity={0.08} />
              <line x1={userPct / 100 * W} y1={0} x2={userPct / 100 * W} y2={H} stroke={MARKER} strokeWidth={2} opacity={1} vectorEffect="non-scaling-stroke" />
              <circle cx={userPct / 100 * W} cy={userDotY} r={16} fill={MARKER} opacity={0.07} />
              <circle cx={userPct / 100 * W} cy={userDotY} r={8}  fill={MARKER} opacity={0.18} />
              <circle cx={userPct / 100 * W} cy={userDotY} r={4}  fill={MARKER} opacity={1}    />
            </>
          )}
        </svg>

        {/* X-axis price labels */}
        <div style={{ position: "relative", height: 28, background: "#020c1b", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", paddingLeft: 8, fontSize: 9, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: 0.8 }}>Lowest</div>
          <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", paddingRight: 8, fontSize: 9, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: 0.8 }}>Highest</div>
          {xLabels.map(({ v, label, col }) => {
            const lPct = pct(v);
            const clampL = Math.min(92, Math.max(6, lPct));
            return (
              <div key={v} style={{
                position: "absolute",
                left: `${clampL}%`, top: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: 10, fontWeight: 700, color: col,
                whiteSpace: "nowrap",
              }}>
                {label}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{ padding: "8px 16px", display: "flex", gap: 16, background: "#020c1b", borderTop: "1px solid rgba(255,255,255,0.03)", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 20, height: 2, background: "#38bdf8", borderRadius: 1 }} />
          <span style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.8 }}>Distribution</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 14, height: 9, background: "#22c55e", opacity: 0.45, borderRadius: 1 }} />
          <span style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.8 }}>Volume</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 14, height: 2, background: MED_COL, borderRadius: 1 }} />
          <span style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.8 }}>Median</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 14, height: 2, background: AVG_COL, borderRadius: 1, opacity: 0.7 }} />
          <span style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.8 }}>Average</span>
        </div>
        {hasPrice && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 14, height: 2, background: MARKER, borderRadius: 1 }} />
            <span style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.8 }}>Your Price</span>
          </div>
        )}
      </div>

      {/* ── 3-column insight panel ── */}
      <div style={{
        padding: "14px 18px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "grid",
        gridTemplateColumns: hasPrice ? "1fr auto auto" : "1fr",
        gap: 20, alignItems: "start",
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1", lineHeight: 1.5, marginBottom: 3 }}>
            {insight.headline}
          </div>
          <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>
            {insight.sub}
          </div>
        </div>
        {hasPrice && (
          <div style={{ textAlign: "center", flexShrink: 0, minWidth: 70 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5, whiteSpace: "nowrap" }}>
              Competition
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, color: compColor }}>{compLevel}</div>
            <div style={{ fontSize: 9, color: "#374151", marginTop: 2 }}>{compCount} nearby</div>
          </div>
        )}
        {hasPrice && priceRank !== null && (
          <div style={{ textAlign: "center", flexShrink: 0, minWidth: 70 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5, whiteSpace: "nowrap" }}>
              Price Rank
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#e2e8f0" }}>
              #{priceRank}<span style={{ fontSize: 10, fontWeight: 600, color: "#374151" }}>/{n}</span>
            </div>
            <div style={{ fontSize: 9, color: "#374151", marginTop: 2 }}>cheapest</div>
          </div>
        )}
      </div>

      {/* ── Most Common Range ── */}
      <div style={{
        padding: "10px 18px 14px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>
            Most Common Range
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#38bdf8", letterSpacing: -0.5, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {fmtR(clusterStart)} — {fmtR(clusterEnd)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#1e3a8a", lineHeight: 1, letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>
            {clusterCount}<span style={{ fontSize: 12, fontWeight: 500, color: "#0f2044" }}>/{n}</span>
          </div>
          <div style={{ fontSize: 9, color: "#0f2044", textTransform: "uppercase", letterSpacing: 1, marginTop: 3 }}>listings</div>
        </div>
      </div>

      {/* ── 5-stat bottom row ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        background: "#010810",
      }}>
        {[
          { label: "Lowest",   value: fmtGBP(low),     color: "#60a5fa" },
          { label: "Median",   value: fmtGBP(median),  color: MED_COL   },
          { label: "Average",  value: fmtGBP(average), color: AVG_COL   },
          { label: "Highest",  value: fmtGBP(high),    color: "#94a3b8" },
          { label: "Analysed", value: String(n),        color: "#e2e8f0" },
        ].map(({ label, value, color }, i) => (
          <div key={label} style={{
            padding: "12px 8px", textAlign: "center",
            borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: label === "Analysed" ? 18 : 14, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>
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
  const [showListings,   setShowListings]   = useState(false);
  const [listingsTab,    setListingsTab]    = useState("used"); // "used" | "excluded"

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
    setSmLoading(true); setSmError(""); setShowListings(false); setListingsTab("used");
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
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>

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
            <div style={{ background: C.bg1, border: C.borderBlue, borderRadius: 16, overflow: "hidden" }}>

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
              <div style={{ display: "flex", alignItems: "stretch" }}>

                {/* ═══ LEFT: Inputs ═══ */}
                <div style={{ width: 300, flexShrink: 0, background: C.bg2, borderRight: "1px solid rgba(255,255,255,0.07)", padding: "14px 16px", display: "flex", flexDirection: "column" }}>

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
                <div style={{ flex: 1, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>

                  {/* ── 4-stat result row ── */}
                  <div style={{ background: C.bg3, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>

                    {/* 4 equal stat blocks separated by 1px borders */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
                      {[
                        {
                          label: "Selling Price",
                          value: price > 0 ? fmtGBP(price) : "—",
                          color: price > 0 ? "#e2e8f0" : C.dim,
                          sub: buyerShip > 0 ? `+ ${fmtGBP(buyerShip)} shipping` : null,
                        },
                        {
                          label: "Net Profit",
                          value: hasResult ? fmt(profit)    : "—",
                          color: hasResult ? profitColor : C.dim,
                          sub: null,
                        },
                        {
                          label: "Margin",
                          value: hasResult ? fmtPct(margin) : "—",
                          color: hasResult ? profitColor : C.dim,
                          sub: hasResult ? "of revenue" : null,
                        },
                        {
                          label: "Markup",
                          value: hasResult ? fmtPct(markup) : "—",
                          color: hasResult ? profitColor : C.dim,
                          sub: hasResult ? "on item cost" : null,
                        },
                      ].map(({ label, value, color, sub }, i) => (
                        <div key={label} style={{
                          padding: "16px 12px", textAlign: "center",
                          borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>{label}</div>
                          <div style={{ fontSize: 24, fontWeight: 900, color, lineHeight: 1, letterSpacing: -0.5 }}>{value}</div>
                          {sub && <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>{sub}</div>}
                          {!sub && <div style={{ height: 14 }} />}
                        </div>
                      ))}
                    </div>

                    {/* Break-even + cost breakdown — shown only when we have enough data */}
                    {hasResult && (
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 16px" }}>

                        {/* Break-even row */}
                        {!isNaN(breakEven) && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "6px 10px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 8 }}>
                            <div>
                              <span style={{ fontSize: 12, color: C.muted }}>Break-even price</span>
                              {buyerShip > 0 && <div style={{ fontSize: 10, color: C.dim }}>Item price only — buyer pays {fmtGBP(buyerShip)} shipping</div>}
                            </div>
                            <span style={{ fontSize: 16, fontWeight: 800, color: "#fbbf24" }}>{fmt(breakEven)}</span>
                          </div>
                        )}

                        {/* Cost breakdown */}
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5 }}>Breakdown</div>
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
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px", textAlign: "center", fontSize: 13, color: C.dim }}>
                        Enter item cost &amp; selling price to calculate profit
                      </div>
                    )}
                  </div>

                  {/* ── Market Snapshot + Pricing Band ── */}
                  <div style={{ background: C.bg3, borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)", flex: 1 }}>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 0.7 }}>
                        {smData
                          ? `Market Snapshot — ${smData.conditionLabel}${smData.detectedType ? ` ${smData.detectedType}` : ""} listings`
                          : "Market Snapshot · eBay UK"
                        }
                      </div>
                      {smData && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9, fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 20, padding: "3px 9px" }}>
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

                        {/* ── Type badge + confidence badge ── */}
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, flexWrap: "wrap" }}>
                          {smData.detectedType ? (
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              background: "rgba(19,93,255,0.1)", border: "1px solid rgba(19,93,255,0.3)",
                              borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#93c5fd",
                            }}>
                              🔍 {smData.detectedType}
                            </span>
                          ) : (
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
                              borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#fbbf24",
                            }}>
                              ⚠ Type undetected
                            </span>
                          )}
                          {smData.confidenceLabel && (
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              background: `${smData.confidenceColor}14`,
                              border: `1px solid ${smData.confidenceColor}40`,
                              borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700,
                              color: smData.confidenceColor,
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: smData.confidenceColor, display: "inline-block" }} />
                              {smData.confidenceLabel}
                            </span>
                          )}
                        </div>

                        {/* ── Transparency row ── */}
                        <div style={{
                          marginBottom: 12, padding: "8px 12px",
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 8, fontSize: 11, color: C.muted, lineHeight: 1.8,
                        }}>
                          <span style={{ color: "#93c5fd", fontWeight: 700 }}>{smData.totalFetched}</span> {smData.conditionLabel} listings fetched
                          {" · "}
                          <span style={{ color: "#4ade80", fontWeight: 700 }}>{smData.priceCount}</span> used
                          {smData.excludedByFilter   > 0 && <span> · <span style={{ color: "#f87171", fontWeight: 700 }}>{smData.excludedByFilter}</span> unrelated</span>}
                          {smData.excludedAsSetKit   > 0 && <span> · <span style={{ color: "#f87171", fontWeight: 700 }}>{smData.excludedAsSetKit}</span> sets/kits</span>}
                          {smData.excludedHighOutlier > 0 && <span> · <span style={{ color: "#f87171", fontWeight: 700 }}>{smData.excludedHighOutlier}</span> high outliers</span>}
                          {smData.excludedLowOutlier  > 0 && <span> · <span style={{ color: "#f87171", fontWeight: 700 }}>{smData.excludedLowOutlier}</span> low outliers</span>}
                        </div>

                        {/* ── Source listings (internal view) ── */}
                        <SourceListings
                          listings={smData.listings}
                          excludedListings={smData.excludedListings}
                          show={showListings}
                          onToggle={() => setShowListings(v => !v)}
                          tab={listingsTab}
                          onTab={setListingsTab}
                        />

                        {/* ── Price distribution histogram ── */}
                        <PriceDistribution data={smData} listings={smData.listings} price={price} />

                        <div style={{ fontSize: 10, color: C.dim, textAlign: "right", marginTop: 10 }}>
                          Based on active eBay UK listings only.
                        </div>
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
