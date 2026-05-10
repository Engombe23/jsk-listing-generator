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

  // ── IQR-based outlier compression ──────────────────────────────────────────
  // Gives sellers a focused view of where real competition is priced
  const q1 = prices[Math.max(0, Math.floor((n - 1) * 0.25))];
  const q3 = prices[Math.min(n - 1, Math.ceil((n - 1) * 0.75))];
  const iqr = Math.max(q3 - q1, range * 0.1);

  // Tukey outer fences (2.5× IQR = very lenient, only clips true outliers)
  const fenceLow  = q1 - 2.5 * iqr;
  const fenceHigh = q3 + 2.5 * iqr;
  const corePrices = prices.filter(p => p >= fenceLow && p <= fenceHigh);
  const outlierCount = n - corePrices.length;

  // View range = core extent + 8% padding each side
  const coreMin = corePrices.length ? corePrices[0] : low;
  const coreMax = corePrices.length ? corePrices[corePrices.length - 1] : high;
  const coreSpread = Math.max(coreMax - coreMin, 1);
  const viewPad = Math.max(coreSpread * 0.08, 10);
  const viewMin = coreMin - viewPad;
  const viewMax = coreMax + viewPad;
  const viewRange = viewMax - viewMin;

  // ── Adaptive binning ────────────────────────────────────────────────────────
  // Bin width scales with view range so bars are always readable
  const targetBins = Math.max(8, Math.min(14, Math.round(corePrices.length * 1.1)));
  const rawBinW = viewRange / targetBins;
  const binW = ([5, 10, 20, 25, 50, 75, 100, 150, 200, 250, 500, 1000]
    .find(s => s >= rawBinW)) ?? 1000;

  const bsStart = Math.floor(viewMin / binW) * binW;
  const viewPrices = prices.filter(p => p >= viewMin && p <= viewMax);
  const numBinsEst = Math.ceil((viewMax - bsStart) / binW) + 2;
  const bins = Array.from({ length: numBinsEst }, (_, i) => {
    const s = bsStart + i * binW;
    const e = s + binW;
    if (e <= viewMin || s >= viewMax + 0.001) return null;
    const isLast = e >= viewMax;
    const count = viewPrices.filter(p => p >= s && (isLast ? p <= viewMax : p < e)).length;
    return { s, e, count };
  }).filter(Boolean);

  const maxBucket = Math.max(...bins.map(b => b.count), 1);

  // ── KDE (computed on core prices only — sharper, no outlier distortion) ────
  const coreN    = corePrices.length || 1;
  const coreMean = corePrices.reduce((sum, p) => sum + p, 0) / coreN;
  const coreVar  = corePrices.reduce((sum, p) => sum + (p - coreMean) ** 2, 0) / coreN;
  const coreStd  = Math.sqrt(coreVar) || viewRange * 0.1;
  // Under-smooth by 0.7× Silverman → more dramatic peaks
  const bw = Math.max(coreStd * 0.22, 0.7 * 1.06 * coreStd * Math.pow(coreN, -0.2));
  const kde = x => corePrices.reduce((s, p) => {
    const z = (x - p) / bw;
    return s + Math.exp(-0.5 * z * z);
  }, 0);

  const STEPS = 260;
  const kdePts = Array.from({ length: STEPS + 1 }, (_, i) => {
    const x = viewMin + (i / STEPS) * viewRange;
    return { x, d: kde(x) };
  });
  const maxD = Math.max(...kdePts.map(pt => pt.d), 0.001);

  // ── Cluster = IQR range (middle 50% — where most competition lives) ─────────
  const clusterStart = q1;
  const clusterEnd   = q3;
  const clusterCount = prices.filter(p => p >= q1 && p <= q3).length;
  const inCluster    = hasPrice && price >= clusterStart && price <= clusterEnd;

  // ── Competition & ranking ───────────────────────────────────────────────────
  const compWindow  = Math.max(range * 0.08, 15);
  const compCount   = hasPrice ? prices.filter(p => Math.abs(p - price) <= compWindow).length : 0;
  const compLevel   = compCount >= 6 ? "High" : compCount >= 3 ? "Medium" : "Low";
  const compColor   = compCount >= 6 ? "#f87171" : compCount >= 3 ? "#fbbf24" : "#4ade80";
  const compBd      = compCount >= 6 ? "rgba(239,68,68,0.3)" : compCount >= 3 ? "rgba(245,158,11,0.3)" : "rgba(74,222,128,0.3)";
  const priceRank   = hasPrice ? prices.filter(p => p < price).length + 1 : null;
  const cheaperThan = hasPrice ? n - priceRank : 0;

  // ── SVG coordinate system ───────────────────────────────────────────────────
  const CHART_W = 500, CHART_H = 190, PAD_T = 6, PAD_B = 5, PAD_R = 6;
  const plotW = CHART_W - PAD_R;
  const plotH = CHART_H - PAD_T - PAD_B;

  const toX   = v   => ((v - viewMin) / viewRange) * plotW;
  const toY   = cnt => (PAD_T + plotH) - (cnt / maxBucket) * plotH;
  const toPct = v   => (toX(v) / CHART_W) * 100;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const inView = v => v >= viewMin && v <= viewMax;

  // KDE path (density normalised to count scale)
  const kdeScaled = kdePts.map(pt => ({
    sx: toX(pt.x),
    sy: toY((pt.d / maxD) * maxBucket),
  }));
  const linePath = "M " + kdeScaled.map(p => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${plotW.toFixed(1)},${(PAD_T + plotH).toFixed(1)} L 0,${(PAD_T + plotH).toFixed(1)} Z`;

  // ── Y-axis ticks ────────────────────────────────────────────────────────────
  const yStep  = maxBucket <= 5 ? 1 : maxBucket <= 10 ? 2 : maxBucket <= 20 ? 4 : 5;
  const yTicks = Array.from({ length: Math.floor(maxBucket / yStep) + 1 }, (_, i) => i * yStep);

  // ── X-axis ticks (nice round numbers within view range) ─────────────────────
  const rawXStep  = viewRange / 6;
  const xMag      = Math.pow(10, Math.floor(Math.log10(Math.max(rawXStep, 1))));
  const niceXStep = ([1, 2, 2.5, 5, 10].map(f => f * xMag).find(s => s >= rawXStep)) ?? (xMag * 10);
  const xTickStart = Math.ceil((viewMin + niceXStep * 0.1) / niceXStep) * niceXStep;
  const xTicks = [];
  for (let v = xTickStart; v <= viewMax - niceXStep * 0.1; v += niceXStep) xTicks.push(Math.round(v));

  // ── Price marker cards (5 equal-style cards with collision resolution) ───────
  const MARKERS_DEF = [
    { key: "low",  v: low,     label: "LOW PRICE",    col: "#3b82f6", bg: "rgba(8,20,65,0.97)",   bd: "rgba(59,130,246,0.6)"   },
    { key: "med",  v: median,  label: "MEDIAN PRICE", col: "#a855f7", bg: "rgba(32,10,58,0.97)",  bd: "rgba(168,85,247,0.6)"   },
    ...(hasPrice ? [{ key: "usr", v: price, label: "YOUR PRICE", col: "#00e5ff", bg: "rgba(0,35,55,0.98)", bd: "rgba(0,229,255,0.8)", hero: true }] : []),
    { key: "avg",  v: average, label: "AVG PRICE",    col: "#f59e0b", bg: "rgba(52,28,2,0.97)",   bd: "rgba(245,158,11,0.6)"   },
    { key: "high", v: high,    label: "HIGH PRICE",   col: "#ef4444", bg: "rgba(52,8,8,0.97)",    bd: "rgba(239,68,68,0.6)"    },
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

  const CARD_H = 70;
  const fmtX   = v => v >= 1000 ? `£${+(v / 1000).toFixed(1)}k` : `£${Math.round(v)}`;

  // Which bars are "highlight" tier (high density, >= 55% of peak)
  const hlThreshold = maxBucket * 0.55;

  return (
    <div style={{
      background: "linear-gradient(180deg, #020e1f 0%, #010c1a 55%, #010810 100%)",
      border: "1px solid rgba(30,58,138,0.28)",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 8px 48px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)",
      marginTop: 2,
      animation: "pdIn 0.4s ease",
    }}>

      {/* ── Header ── */}
      <div style={{ padding: "16px 20px 10px" }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 5 }}>
          Market Intelligence
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#e2e8f0", letterSpacing: -0.4, lineHeight: 1.2 }}>
          Price Distribution
        </div>
        <div style={{ fontSize: 11, color: "#4b5563", marginTop: 3 }}>
          Based on {n} active eBay UK listings
          {outlierCount > 0 && (
            <span style={{ color: "#1e3a5f", marginLeft: 6 }}>
              · {outlierCount} outlier{outlierCount > 1 ? "s" : ""} compressed
            </span>
          )}
        </div>
      </div>

      {/* ── Chart wrapper: Y-axis col + chart col ── */}
      <div style={{ display: "flex", paddingRight: 10, paddingBottom: 2 }}>

        {/* Y-axis column */}
        <div style={{ width: 44, flexShrink: 0 }}>
          <div style={{ height: CARD_H }} />
          <div style={{ position: "relative", height: CHART_H }}>
            {/* Rotated axis title */}
            <div style={{ position: "absolute", left: 1, top: 0, width: 14, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 7, fontWeight: 600, color: "#2d3f55", textTransform: "uppercase", letterSpacing: 1.8, writingMode: "vertical-rl", transform: "rotate(180deg)", whiteSpace: "nowrap", userSelect: "none" }}>
                Listing Volume
              </span>
            </div>
            {/* Tick numbers */}
            {yTicks.map(t => (
              <div key={t} style={{ position: "absolute", right: 4, top: toY(t), transform: "translateY(-50%)", fontSize: 8, color: "#3d5268", lineHeight: 1, fontVariantNumeric: "tabular-nums", userSelect: "none" }}>
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Chart content */}
        <div style={{ flex: 1, position: "relative", minWidth: 0 }}>

          {/* ── Marker cards ── */}
          <div style={{ position: "relative", height: CARD_H }}>
            {!hasPrice && (
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", fontSize: 10, color: "#1a3050", fontStyle: "italic", whiteSpace: "nowrap" }}>
                Enter a selling price to see live market position
              </div>
            )}
            {markers.map(m => (
              <div key={m.key} style={{ position: "absolute", left: `${m.pct}%`, top: 2, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none", zIndex: 10 }}>
                {/* Label */}
                <div style={{ fontSize: 7, fontWeight: 800, color: m.col, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 3, whiteSpace: "nowrap", opacity: 0.9 }}>
                  {m.label}
                </div>
                {/* Price card */}
                <div style={{
                  background: m.bg,
                  border: `1px solid ${m.bd}`,
                  borderRadius: 7,
                  padding: m.hero ? "5px 14px" : "4px 10px",
                  fontSize: m.hero ? 14 : 12,
                  fontWeight: 900,
                  color: m.col,
                  whiteSpace: "nowrap",
                  letterSpacing: -0.3,
                  lineHeight: 1.4,
                  boxShadow: m.hero
                    ? `0 0 22px ${m.col}55, 0 0 44px ${m.col}18, 0 3px 12px rgba(0,0,0,0.55)`
                    : `0 0 10px ${m.col}25, 0 2px 8px rgba(0,0,0,0.45)`,
                }}>
                  {fmtGBP(m.v)}
                  {m.outside && <span style={{ fontSize: 8, marginLeft: 4, opacity: 0.55 }}>{m.v < viewMin ? "◀" : "▶"}</span>}
                </div>
                {/* Connector line to chart */}
                {!m.outside && (
                  <div style={{ width: 1, height: 9, background: `linear-gradient(to bottom, ${m.col}88, transparent)`, marginTop: 2 }} />
                )}
              </div>
            ))}
          </div>

          {/* ── SVG ── */}
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            preserveAspectRatio="none"
            width="100%"
            height={CHART_H}
            style={{ display: "block" }}
          >
            <defs>
              <linearGradient id="pdKdeFill4" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#38bdf8" stopOpacity="0.20" />
                <stop offset="55%"  stopColor="#1e40af" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.00" />
              </linearGradient>
              <linearGradient id="pdBarHL4" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="pdClusterZone4" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#1d4ed8" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal grid lines */}
            {yTicks.filter(t => t > 0).map(t => (
              <line key={t}
                x1={0} y1={toY(t)} x2={CHART_W - PAD_R} y2={toY(t)}
                stroke="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="2,8"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {/* IQR cluster zone (subtle background highlight) */}
            {inView(clusterStart) && inView(clusterEnd) && (
              <rect
                x={Math.max(0, toX(clusterStart))}
                y={PAD_T}
                width={Math.min(plotW, toX(clusterEnd)) - Math.max(0, toX(clusterStart))}
                height={plotH}
                fill="url(#pdClusterZone4)"
              />
            )}

            {/* X-axis baseline */}
            <line x1={0} y1={PAD_T + plotH} x2={CHART_W - PAD_R} y2={PAD_T + plotH} stroke="rgba(255,255,255,0.1)" strokeWidth={1} vectorEffect="non-scaling-stroke" />

            {/* Histogram bars */}
            {bins.map(({ s, e, count }, i) => {
              if (count === 0) return null;
              const x1   = toX(s);
              const x2   = toX(e);
              const barH = (count / maxBucket) * plotH;
              const isHL = count >= hlThreshold;
              return (
                <rect key={i}
                  x={x1 + 0.5} y={toY(count)}
                  width={Math.max(1.5, x2 - x1 - 1.5)}
                  height={barH}
                  fill={isHL ? "url(#pdBarHL4)" : "#1e3a8a"}
                  opacity={isHL ? 0.78 : 0.25}
                  rx={1.5}
                />
              );
            })}

            {/* KDE area fill */}
            <path d={areaPath} fill="url(#pdKdeFill4)" />

            {/* KDE curve — soft bloom + crisp line */}
            <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth={12} opacity={0.04} />
            <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth={2.2} opacity={0.90} vectorEffect="non-scaling-stroke" />

            {/* Marker dashed vertical lines */}
            {markers.filter(m => !m.outside).map(m => (
              <line key={m.key}
                x1={toX(m.v)} y1={0} x2={toX(m.v)} y2={PAD_T + plotH}
                stroke={m.col}
                strokeWidth={m.hero ? 1.5 : 1}
                strokeDasharray="4,4"
                opacity={m.hero ? 0.88 : 0.58}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {/* Marker anchor dots at x-axis */}
            {markers.filter(m => !m.outside).map(m => (
              <g key={m.key}>
                <circle cx={toX(m.v)} cy={PAD_T + plotH} r={7}  fill={m.col} opacity={0.10} />
                <circle cx={toX(m.v)} cy={PAD_T + plotH} r={2.8} fill={m.col} opacity={0.92} />
              </g>
            ))}
          </svg>

          {/* ── X-axis labels ── */}
          <div style={{ position: "relative", height: 30, marginTop: 1 }}>
            {xTicks.map(v => (
              <div key={v} style={{ position: "absolute", left: `${clamp(toPct(v), 2, 96)}%`, top: 4, transform: "translateX(-50%)", fontSize: 9, color: "#3d5268", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", userSelect: "none" }}>
                {fmtX(v)}
              </div>
            ))}
            <div style={{ textAlign: "center", paddingTop: 18, fontSize: 7, color: "#243040", textTransform: "uppercase", letterSpacing: 1.6, userSelect: "none" }}>
              PRICE (£)
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom insight panel ── */}
      <div style={{ margin: "10px 14px 14px", display: "grid", gridTemplateColumns: hasPrice ? "1fr 1fr 1fr" : "1fr", gap: 8 }}>

        {/* Most Common Range */}
        <div style={{ background: "rgba(0,5,18,0.75)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(37,99,235,0.13)", border: "1px solid rgba(37,99,235,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 17 }}>
            📊
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 5, lineHeight: 1.4 }}>
              Most sellers are priced between
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#00e5ff", letterSpacing: -0.5, lineHeight: 1.1, marginBottom: 6, fontVariantNumeric: "tabular-nums" }}>
              £{Math.round(clusterStart)} – £{Math.round(clusterEnd)}
            </div>
            <div style={{ fontSize: 10, color: "#4b5563", lineHeight: 1.4 }}>
              {inCluster
                ? "You are within the most competitive range."
                : hasPrice
                  ? price < clusterStart
                    ? "Your price is below the main cluster."
                    : "Your price is above the main cluster."
                  : `${clusterCount} of ${n} listings in this range.`}
            </div>
          </div>
        </div>

        {/* Competition */}
        {hasPrice && (
          <div style={{ background: "rgba(0,5,18,0.75)", border: `1px solid ${compBd}`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${compColor}13`, border: `1px solid ${compColor}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 17 }}>
              🎯
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 5 }}>Competition</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: compColor, letterSpacing: -0.5, lineHeight: 1.1, marginBottom: 6 }}>
                {compLevel}
              </div>
              <div style={{ fontSize: 10, color: "#4b5563", lineHeight: 1.4 }}>
                {compCount} listings within ±10% of your price
              </div>
            </div>
          </div>
        )}

        {/* Price Ranking */}
        {hasPrice && priceRank !== null && (
          <div style={{ background: "rgba(0,5,18,0.75)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(245,158,11,0.13)", border: "1px solid rgba(245,158,11,0.32)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 17 }}>
              🏆
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 5 }}>Price Ranking</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#f59e0b", letterSpacing: -0.5, lineHeight: 1.1, marginBottom: 6, fontVariantNumeric: "tabular-nums" }}>
                #{priceRank} <span style={{ fontSize: 12, fontWeight: 600, color: "#78350f" }}>of {n}</span>
              </div>
              <div style={{ fontSize: 10, color: "#4b5563", lineHeight: 1.4 }}>
                Cheaper than {cheaperThan} listing{cheaperThan !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: "10px 20px 14px", borderTop: "1px solid rgba(255,255,255,0.03)", fontSize: 10, color: "#1a2e45", display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 13, opacity: 0.4 }}>ⓘ</span>
        Prices analysed from active listings only. Data updates every 24 hours.
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

                        {/* ── Source listings (subtle toggle) ── */}
                        <SourceListings
                          listings={smData.listings}
                          excludedListings={smData.excludedListings}
                          show={showListings}
                          onToggle={() => setShowListings(v => !v)}
                          tab={listingsTab}
                          onTab={setListingsTab}
                        />

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
