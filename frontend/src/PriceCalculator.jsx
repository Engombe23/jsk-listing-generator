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
    @keyframes pcIn    { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  `;
  document.head.appendChild(s);
})();

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg0: "#080f1c",   // page
  bg1: "#0b1929",   // outer card
  bg2: "#0d1f35",   // left column
  bg3: "#060d1a",   // inner cards
  border: "1px solid rgba(255,255,255,0.07)",
  borderBlue: "1px solid rgba(19,93,255,0.22)",
  blue: "#135DFF",
  text: "#e2e8f0",
  muted: "#6b7280",
  dim: "#374151",
};

// Compact input
const CI = {
  ...INPUT_STYLE,
  padding: "7px 10px",
  fontSize: 13,
  borderRadius: 8,
  background: "#0d1f35",
  border: "1px solid rgba(255,255,255,0.09)",
};

// ─── Market position (all blue palette — no green/yellow/red) ────────────────
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

// ─── Pricing verdict (short) ──────────────────────────────────────────────────
function getVerdict(price, data) {
  if (!price || price <= 0 || !data) return null;
  const { low, high, median, average } = data;
  const range = high - low; if (range <= 0) return null;
  const p = (price - low) / range, pm = (median - low) / range, pa = (average - low) / range;
  if (price < low * 0.9)       return "Well below the market low — room to increase margin.";
  if (price < low)             return "Undercuts the market low — near-certain conversion.";
  if (p <= pm * 0.55)          return "Highly competitive — well below most active sellers.";
  if (p <= pm)                 return "Below the median — strong conversion position.";
  if (p <= (pm + pa) / 2)     return "Near the median — a slight reduction could sharpen your edge.";
  if (p <= pa)                 return "Aligned with the average — in line with most sellers.";
  if (p <= pa + (1 - pa) * 0.35) return "Above average — conversion may be impacted.";
  if (price <= high)           return "Among the highest listings — only strong branding will convert.";
  return "Exceeds all active listings — significant reduction recommended.";
}

// ─── Inline label + input row ─────────────────────────────────────────────────
function Row({ label, children, last }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "115px 1fr", alignItems: "center", gap: 8,
      padding: "4px 0",
      borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.04)"
    }}>
      <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.3 }}>{label}</span>
      {children}
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SL({ children, mt }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 0.7, paddingTop: mt ?? 10, paddingBottom: 4 }}>
      {children}
    </div>
  );
}

// ─── Horizontal divider ───────────────────────────────────────────────────────
const HD = () => <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "10px 0" }} />;

// ─── Result stat box ──────────────────────────────────────────────────────────
const Stat = memo(function Stat({ label, value, color, sub, size = 22 }) {
  return (
    <div style={{ background: C.bg3, borderRadius: 8, padding: "9px 10px", textAlign: "center", flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: size, fontWeight: 900, color: color || C.text, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{sub}</div>}
    </div>
  );
});

// ─── Breakdown row ────────────────────────────────────────────────────────────
function BR({ label, value, color, strong }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: strong ? "7px 0 4px" : "4px 0",
      borderTop: strong ? "1px solid rgba(255,255,255,0.08)" : "none",
    }}>
      <span style={{ fontSize: strong ? 13 : 12, color: strong ? C.text : C.muted }}>{label}</span>
      <span style={{ fontSize: strong ? 15 : 13, fontWeight: strong ? 800 : 600, color: color || (strong ? C.text : "#9ca3af") }}>{value}</span>
    </div>
  );
}

// ─── Pricing band (integrated, compact) ──────────────────────────────────────
function PricingBand({ data, price }) {
  if (!data) return null;
  const range = data.high - data.low; if (range <= 0) return null;
  const toPct = (v) => Math.min(100, Math.max(0, ((v - data.low) / range) * 100));
  const medPct = toPct(data.median), avgPct = toPct(data.average);
  const pos = price > 0 ? getPos(price, data) : null;
  const userPct = price > 0 ? Math.min(100, Math.max(0, toPct(price))) : null;
  const close = Math.abs(medPct - avgPct) < 8;

  return (
    <div>
      {/* Bar + pointer */}
      <div style={{ position: "relative", paddingTop: userPct !== null ? 26 : 4 }}>
        {userPct !== null && (
          <div style={{ position: "absolute", left: `${userPct}%`, top: 0, transform: "translateX(-50%)", textAlign: "center", pointerEvents: "none" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: pos?.color || "#93c5fd", whiteSpace: "nowrap" }}>▲ {fmtGBP(price)}</div>
          </div>
        )}
        {/* Bar */}
        <div style={{ height: 14, borderRadius: 7, background: "linear-gradient(90deg,#0ea5e9 0%,#135DFF 40%,#4338ca 100%)", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 7, background: "linear-gradient(180deg,rgba(255,255,255,0.15) 0%,transparent 55%)" }} />
          {/* Ticks */}
          <div style={{ position: "absolute", left: `${medPct}%`, top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,0.55)", transform: "translateX(-50%)" }} />
          {!close && <div style={{ position: "absolute", left: `${avgPct}%`, top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,0.35)", transform: "translateX(-50%)" }} />}
          {userPct !== null && (
            <div style={{ position: "absolute", left: `${userPct}%`, top: -2, bottom: -2, width: 3, background: pos?.color || "#93c5fd", transform: "translateX(-50%)", borderRadius: 2, boxShadow: `0 0 8px ${pos?.color || "#93c5fd"}` }} />
          )}
        </div>
        {/* Labels */}
        <div style={{ position: "relative", height: 32, marginTop: 4 }}>
          <div style={{ position: "absolute", left: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>{fmtGBP(data.low)}</div>
            <div style={{ fontSize: 9, color: C.dim }}>Low</div>
          </div>
          <div style={{ position: "absolute", left: `${medPct}%`, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#c4cdd8" }}>{fmtGBP(data.median)}</div>
            <div style={{ fontSize: 9, color: C.dim }}>Med</div>
          </div>
          {!close && (
            <div style={{ position: "absolute", left: `${avgPct}%`, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#c4cdd8" }}>{fmtGBP(data.average)}</div>
              <div style={{ fontSize: 9, color: C.dim }}>Avg</div>
            </div>
          )}
          <div style={{ position: "absolute", right: 0, textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>{fmtGBP(data.high)}</div>
            <div style={{ fontSize: 9, color: C.dim }}>High</div>
          </div>
        </div>
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

  // Calculator state
  const [productName,   setProductName]   = useSessionState("jsk_calc_product_name", "");
  const [itemCost,      setItemCost]       = useSessionState("jsk_calc_item_cost",    "");
  const [shippingCost,  setShippingCost]   = useSessionState("jsk_calc_shipping",     "");
  const [packagingCost, setPackagingCost]  = useSessionState("jsk_calc_packaging",    "");
  const [sellingPrice,  setSellingPrice]   = useSessionState("jsk_calc_selling",      "");
  const [fvfPct,        setFvfPct]         = useSessionState("jsk_calc_fvf",          "12.8");
  const [fixedFee,      setFixedFee]       = useSessionState("jsk_calc_fixed_fee",    "0.30");
  const [promoPct,      setPromoPct]       = useSessionState("jsk_calc_promo",        "0");
  const [vatRegistered, setVatRegistered]  = useSessionState("jsk_calc_vat",          true);
  const [targetMarkup,  setTargetMarkup]   = useSessionState("jsk_calc_markup",       "");
  const [targetMargin,  setTargetMargin]   = useSessionState("jsk_calc_margin",       "");
  const [editingMarkup, setEditingMarkup]  = useState(false);
  const [editingMargin, setEditingMargin]  = useState(false);
  const [savedFlash,    setSavedFlash]     = useState(false);

  // Smart Pricing state
  const [smQuery,   setSmQuery]   = useSessionState("jsk_calc_sm_query", "");
  const [smData,    setSmData]    = useSessionState("jsk_calc_sm_data",  null);
  const [smLoading, setSmLoading] = useState(false);
  const [smError,   setSmError]   = useState("");

  // Calculations
  const cost      = parseFloat(itemCost)      || 0;
  const shipping  = parseFloat(shippingCost)  || 0;
  const packaging = parseFloat(packagingCost) || 0;
  const price     = parseFloat(sellingPrice)  || 0;
  const fvf       = parseFloat(fvfPct)        || 0;
  const fixed     = parseFloat(fixedFee)      || 0;
  const promo     = parseFloat(promoPct)      || 0;
  const vatRate   = vatRegistered ? 20 / 120  : 0;
  const R         = 1 - fvf / 100 - promo / 100 - vatRate;

  const ebayFVF    = price > 0 ? price * (fvf / 100) + fixed : 0;
  const ebayPromo  = price * (promo / 100);
  const vatAmount  = price * vatRate;
  const totalCosts = cost + shipping + packaging;
  const netRevenue = price - ebayFVF - ebayPromo - vatAmount;
  const profit     = netRevenue - totalCosts;
  const margin     = price > 0 ? (profit / price) * 100 : NaN;
  const markup     = cost  > 0 ? (profit / cost)  * 100 : NaN;
  const breakEven  = R > 0    ? (totalCosts + fixed) / R  : NaN;
  const hasResult  = price > 0 && cost > 0;

  const pos     = getPos(price, smData);
  const verdict = getVerdict(price, smData);

  const profitColor = !hasResult ? C.text : profit > 0 ? "#4ade80" : profit < 0 ? "#f87171" : C.text;

  // Handlers
  const loadProduct = (p) => {
    setProductName(p.name || ""); setItemCost(String(p.itemCost ?? "")); setShippingCost(String(p.shippingCost ?? ""));
    setSellingPrice(String(p.sellingPrice ?? "")); setFvfPct(String(p.fvfPct ?? "12.8"));
    setFixedFee(String(p.fixedFee ?? "0.30")); setPromoPct(String(p.promoPct ?? "0")); setVatRegistered(p.vatRegistered ?? true);
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
      const res  = await fetch(`${API_URL}/api/ebay/search-prices`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: smQuery.trim() }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch prices.");
      if (json.priceCount === 0) throw new Error("No active listings found — try a different search term.");
      setSmData(json);
    } catch (err) { setSmError(err.message); setSmData(null); }
    finally       { setSmLoading(false); }
  };

  useEffect(() => { if (!editingMarkup && !isNaN(markup) && price > 0) setTargetMarkup(markup.toFixed(1)); }, [markup, editingMarkup, price]);
  useEffect(() => { if (!editingMargin && !isNaN(margin) && price > 0) setTargetMargin(margin.toFixed(1)); }, [margin, editingMargin, price]);

  function calcFromMarkup() { const mk = parseFloat(targetMarkup); if (!isNaN(mk) && cost > 0 && R > 0) setSellingPrice(((cost * (1 + mk / 100) + shipping + packaging + fixed) / R).toFixed(2)); }
  function calcFromMargin() { const mg = parseFloat(targetMargin); if (!isNaN(mg) && mg < 100) { const d = R - mg / 100; if (d > 0) setSellingPrice(((fixed + cost + shipping + packaging) / d).toFixed(2)); } }

  // ── Render ────────────────────────────────────────────────────────────────
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
            /* ═══ ONE OUTER CARD ═══ */
            <div style={{ background: C.bg1, border: C.borderBlue, borderRadius: 16, overflow: "hidden" }}>

              {/* ── Card header ── */}
              <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  {/* Title */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>Smart eBay Pricing</span>
                      <span style={{ fontSize: 9, fontWeight: 800, color: C.blue, background: "rgba(19,93,255,0.15)", border: "1px solid rgba(19,93,255,0.4)", borderRadius: 4, padding: "2px 7px", letterSpacing: 0.8 }}>PRO</span>
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Compare market pricing, fees and profit in one place</div>
                  </div>
                  {/* Listings badge */}
                  {smData && (
                    <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(19,93,255,0.1)", border: "1px solid rgba(19,93,255,0.22)", borderRadius: 8, padding: "7px 13px", flexShrink: 0 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "pcPulse 2s ease-in-out infinite" }} />
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#93c5fd" }}>{smData.priceCount}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>listings analysed</span>
                    </div>
                  )}
                </div>
                {/* Search row */}
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={smQuery}
                    onChange={(e) => setSmQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !smLoading && handleFetch()}
                    placeholder="OEM / part number or product name…"
                    style={{ ...CI, flex: 1, fontSize: 14 }}
                  />
                  <button onClick={handleFetch} disabled={smLoading || !smQuery.trim()} style={{ ...BUTTON_BASE, padding: "8px 22px", fontSize: 13, flexShrink: 0, background: smLoading || !smQuery.trim() ? "#0d2040" : C.blue, color: "#fff", opacity: smLoading || !smQuery.trim() ? 0.5 : 1, whiteSpace: "nowrap", boxShadow: smLoading || !smQuery.trim() ? "none" : "0 0 16px rgba(19,93,255,0.4)" }}>
                    {smLoading ? "Fetching…" : "Fetch Prices"}
                  </button>
                </div>
                {smError && <div style={{ marginTop: 8, padding: "7px 12px", background: "#0d1428", color: "#fca5a5", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 8, fontSize: 12 }}>⚠ {smError}</div>}
              </div>

              {/* ── Two-column body ── */}
              <div style={{ display: "flex", alignItems: "stretch" }}>

                {/* ═══ LEFT: Inputs (narrow sidebar) ═══ */}
                <div style={{ width: 300, flexShrink: 0, background: C.bg2, borderRight: "1px solid rgba(255,255,255,0.07)", padding: "14px 16px", display: "flex", flexDirection: "column" }}>

                  <SL mt={0}>Product</SL>
                  <Row label="Product / SKU">
                    <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Timing Belt Kit" style={CI} />
                  </Row>

                  <SL>Costs</SL>
                  <Row label="Item cost (£)">
                    <input type="number" value={itemCost} onChange={(e) => setItemCost(e.target.value)} placeholder="0.00" style={CI} />
                  </Row>
                  <Row label="Postage (£)">
                    <input type="number" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} placeholder="0.00" style={CI} />
                  </Row>
                  <Row label="Packaging (£)" last>
                    <input type="number" value={packagingCost} onChange={(e) => setPackagingCost(e.target.value)} placeholder="0.00" style={CI} />
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

                  {/* VAT */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: C.muted }}>VAT registered (20%)</span>
                    <button onClick={() => setVatRegistered(v => !v)} style={{ ...BUTTON_BASE, padding: "4px 14px", fontSize: 11, background: vatRegistered ? C.blue : "#0d2040", color: "#fff", boxShadow: vatRegistered ? "0 0 10px rgba(19,93,255,0.3)" : "none" }}>
                      {vatRegistered ? "ON" : "OFF"}
                    </button>
                  </div>

                  <HD />

                  {/* Selling price */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 5 }}>
                      Selling Price {vatRegistered ? "(inc. VAT)" : ""}
                    </div>
                    <input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      placeholder="e.g. 29.99"
                      style={{ ...CI, fontSize: 18, fontWeight: 700, width: "100%", background: "rgba(19,93,255,0.08)", border: "1px solid rgba(19,93,255,0.3)" }}
                    />
                  </div>

                  {/* Markup / Margin */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                    <div>
                      <div style={{ fontSize: 10, color: C.dim, marginBottom: 3 }}>Target markup %</div>
                      <div style={{ display: "flex", gap: 3 }}>
                        <input type="number" value={targetMarkup}
                          onChange={(e) => { const v = e.target.value; setTargetMarkup(v); const mk = parseFloat(v); if (!isNaN(mk) && cost > 0 && R > 0) setSellingPrice(((cost * (1 + mk / 100) + shipping + packaging + fixed) / R).toFixed(2)); }}
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
                          onChange={(e) => { const v = e.target.value; setTargetMargin(v); const mg = parseFloat(v); if (!isNaN(mg) && mg < 100 && R > 0) { const d = R - mg / 100; if (d > 0) setSellingPrice(((fixed + cost + shipping + packaging) / d).toFixed(2)); } }}
                          onFocus={() => setEditingMargin(true)} onBlur={() => setEditingMargin(false)}
                          onKeyDown={(e) => e.key === "Enter" && calcFromMargin()}
                          placeholder="20" style={{ ...CI, flex: 1, padding: "6px 8px" }}
                        />
                        <button onClick={calcFromMargin} style={{ ...SMALL_BUTTON_STYLE, padding: "6px 8px", fontSize: 11 }}>Set</button>
                      </div>
                    </div>
                  </div>

                  {/* Spacer push Save to bottom */}
                  <div style={{ flex: 1, minHeight: 12 }} />

                  {/* Save */}
                  {hasResult && (
                    <button onClick={handleSave} style={{ ...BUTTON_BASE, background: savedFlash ? "#166534" : C.blue, color: "#fff", width: "100%", textAlign: "center", fontSize: 13, padding: "9px", marginTop: 8, boxShadow: savedFlash ? "0 0 14px rgba(22,101,52,0.4)" : "0 0 14px rgba(19,93,255,0.3)" }}>
                      {savedFlash ? "✓ Saved!" : "Save Product"}
                    </button>
                  )}
                </div>

                {/* ═══ RIGHT: Results + Market Data ═══ */}
                <div style={{ flex: 1, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>

                  {/* ── Price Result Card ── */}
                  <div style={{ background: C.bg3, borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>

                    {/* Selling price large display */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 4 }}>Selling Price</div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                        {price > 0 ? fmtGBP(price) : <span style={{ color: C.dim, fontSize: 22 }}>Enter a price</span>}
                      </div>
                    </div>

                    {/* Profit / Margin / Markup */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <Stat label="Net Profit" value={hasResult ? fmt(profit)    : "—"} color={hasResult ? profitColor : C.dim} size={24} />
                      <Stat label="Margin"     value={hasResult ? fmtPct(margin) : "—"} color={hasResult ? profitColor : C.dim} size={24} sub={hasResult ? "÷ sell price" : null} />
                      <Stat label="Markup"     value={hasResult ? fmtPct(markup) : "—"} color={hasResult ? profitColor : C.dim} size={24} sub={hasResult ? "÷ item cost"  : null} />
                    </div>

                    {/* Break-even */}
                    {hasResult && !isNaN(breakEven) && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "7px 10px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 8 }}>
                        <span style={{ fontSize: 12, color: C.muted }}>Break-even price</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#fbbf24" }}>{fmt(breakEven)}</span>
                      </div>
                    )}

                    {/* Cost breakdown */}
                    {hasResult ? (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5 }}>Breakdown</div>
                        {cost > 0      && <BR label="Product cost"       value={`-${fmt(cost)}`}       color="#f87171" />}
                        {(shipping + packaging) > 0 && <BR label="Postage & packaging" value={`-${fmt(shipping + packaging)}`} color="#f87171" />}
                        <BR label={`eBay fees (${fvf}% + £${fixed.toFixed(2)})`} value={`-${fmt(ebayFVF)}`} color="#f87171" />
                        {promo > 0     && <BR label={`Ad fees (${promo}%)`}   value={`-${fmt(ebayPromo)}`}  color="#f87171" />}
                        {vatRegistered && <BR label="VAT (20%) → HMRC"        value={`-${fmt(vatAmount)}`}  color="#f87171" />}
                        <BR label="Net Profit" value={fmt(profit)} color={profitColor} strong />
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: C.dim, textAlign: "center", padding: "8px 0" }}>
                        Enter item cost &amp; selling price to see results
                      </div>
                    )}
                  </div>

                  {/* ── Market Snapshot + Pricing Band ── */}
                  <div style={{ background: C.bg3, borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)", flex: 1 }}>

                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 0.7 }}>Market Snapshot · eBay UK</div>
                      {pos && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: pos.color, background: `${pos.color}18`, border: `1px solid ${pos.color}30`, borderRadius: 20, padding: "3px 12px" }}>
                          {pos.label}
                        </div>
                      )}
                    </div>

                    {smLoading && (
                      <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 13 }}>⏳ Fetching live market data…</div>
                    )}

                    {!smLoading && !smData && (
                      <div style={{ textAlign: "center", padding: "22px 0" }}>
                        <div style={{ fontSize: 24, opacity: 0.3, marginBottom: 6 }}>📊</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#4b5563" }}>No market data</div>
                        <div style={{ fontSize: 12, color: C.dim, marginTop: 3 }}>Search a part number above to load live eBay UK pricing.</div>
                      </div>
                    )}

                    {!smLoading && smData && (
                      <div style={{ animation: "pcIn 0.3s ease" }}>
                        {/* 2×2 price grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                          {[
                            { label: "Lowest",   value: fmtGBP(smData.low),     color: "#60a5fa" },
                            { label: "Median",   value: fmtGBP(smData.median),  color: "#93c5fd" },
                            { label: "Average",  value: fmtGBP(smData.average), color: "#bae6fd" },
                            { label: "Highest",  value: fmtGBP(smData.high),    color: "#dbeafe" },
                          ].map(({ label, value, color }) => (
                            <div key={label} style={{ background: C.bg1, borderRadius: 8, padding: "9px 12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{label}</div>
                              <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Listings count */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 12, color: C.muted }}>Listings analysed</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "#93c5fd" }}>{smData.priceCount}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 20, padding: "2px 8px" }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "pcPulse 2s ease-in-out infinite" }} />
                            LIVE
                          </span>
                        </div>

                        {/* Verdict */}
                        {verdict && (
                          <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.55, padding: "8px 10px", background: "rgba(19,93,255,0.05)", borderRadius: 8, marginBottom: 12, border: "1px solid rgba(19,93,255,0.12)" }}>
                            {verdict}
                          </div>
                        )}

                        {/* Pricing band */}
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>
                          Pricing Band
                        </div>
                        <PricingBand data={smData} price={price} />

                        <div style={{ fontSize: 10, color: C.dim, textAlign: "right", marginTop: 8 }}>
                          Based on first-page active eBay UK listings only.
                        </div>
                      </div>
                    )}
                  </div>
                </div>{/* end right */}
              </div>{/* end two-column */}
            </div> /* end outer card */
          )}
        </>
      )}
    </div>
  );
}
