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
  const [smQuery,     setSmQuery]     = useSessionState("jsk_calc_sm_query",     "");
  const [smCondition, setSmCondition] = useSessionState("jsk_calc_sm_condition", "any");
  const [smData,      setSmData]      = useSessionState("jsk_calc_sm_data",      null);
  const [smLoading,   setSmLoading]   = useState(false);
  const [smError,     setSmError]     = useState("");

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
      if (json.priceCount === 0) throw new Error("No listings found for this filter — try changing the condition or search term.");
      setSmData(json);
    } catch (err) { setSmError(err.message); setSmData(null); }
    finally       { setSmLoading(false); }
  };

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
                      <span style={{ fontSize: 11, color: C.muted }}>listings analysed</span>
                    </div>
                  )}
                </div>
                {/* Condition toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>Condition</span>
                  <div style={{ display: "flex", gap: 3, background: "#060d1a", borderRadius: 8, padding: 3, border: "1px solid rgba(255,255,255,0.07)" }}>
                    {[{ key: "any", label: "Any" }, { key: "new", label: "New" }, { key: "used", label: "Used" }].map(({ key, label }) => {
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
                        Market Snapshot · eBay UK
                        {smData && smData.condition !== "any" && (
                          <span style={{ marginLeft: 7, fontSize: 9, fontWeight: 800, color: "#93c5fd", background: "rgba(147,197,253,0.1)", border: "1px solid rgba(147,197,253,0.25)", borderRadius: 4, padding: "1px 6px", letterSpacing: 0.5 }}>
                            {smData.condition.toUpperCase()}
                          </span>
                        )}
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

                        {/* 2×2 price grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                          {[
                            { label: "Lowest",  value: fmtGBP(smData.low),     color: "#60a5fa" },
                            { label: "Median",  value: fmtGBP(smData.median),  color: "#93c5fd" },
                            { label: "Average", value: fmtGBP(smData.average), color: "#bae6fd" },
                            { label: "Highest", value: fmtGBP(smData.high),    color: "#dbeafe" },
                          ].map(({ label, value, color }) => (
                            <div key={label} style={{ background: C.bg1, borderRadius: 8, padding: "9px 12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{label}</div>
                              <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Listings count */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                          <span style={{ fontSize: 12, color: C.muted }}>Listings analysed</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "#93c5fd" }}>{smData.priceCount}</span>
                        </div>

                        {/* Pricing band */}
                        <PricingBand data={smData} price={price} />

                        <div style={{ fontSize: 10, color: C.dim, textAlign: "right", marginTop: 10 }}>
                          Based on first-page active eBay UK listings only.
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
