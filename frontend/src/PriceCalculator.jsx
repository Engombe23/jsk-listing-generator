import React, { memo, useState, useEffect } from "react";
import { useSessionState } from "./useSessionState.js";
import { TextInput, BUTTON_BASE, SMALL_BUTTON_STYLE, INPUT_STYLE } from "./shared.jsx";
import SavedProducts from "./SavedProducts.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt    = (n) => (n === null || isNaN(n)) ? "—" : (n < 0 ? `-£${Math.abs(n).toFixed(2)}` : `£${n.toFixed(2)}`);
const fmtPct = (n) => (n === null || isNaN(n)) ? "—" : `${n.toFixed(1)}%`;
const fmtGBP = (v) => (v != null && !isNaN(v)) ? `£${Number(v).toFixed(2)}` : "—";

// ─── Keyframes ────────────────────────────────────────────────────────────────
(function injectStyles() {
  if (typeof document === "undefined" || document.getElementById("__pc-kf")) return;
  const s = document.createElement("style");
  s.id = "__pc-kf";
  s.textContent = `
    @keyframes smPulseDot { 0%,100%{opacity:1;box-shadow:0 0 6px #4ade80} 50%{opacity:0.3;box-shadow:0 0 14px #4ade80} }
    @keyframes pcFadeUp   { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
  `;
  document.head.appendChild(s);
})();

// ─── Shared style tokens ──────────────────────────────────────────────────────
const PANEL = {
  background: "#0B1929",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
};

// Two-row label | input
const ROW      = { display:"grid", gridTemplateColumns:"128px 1fr", alignItems:"center", gap:8, padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" };
const ROW_LAST = { ...ROW, borderBottom:"none" };
const LBL      = { fontSize:13, color:"#9ca3af", fontWeight:500 };
const CI       = { ...INPUT_STYLE, padding:"7px 10px", fontSize:13, borderRadius:8 }; // compact input

// Section heading
function Sh({ children }) {
  return <div style={{ fontSize:11, fontWeight:700, color:"#4b5563", textTransform:"uppercase", letterSpacing:0.7, padding:"12px 0 5px" }}>{children}</div>;
}

// Divider
const Divider = () => <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"10px 0" }} />;

// ─── Result pill ──────────────────────────────────────────────────────────────
const ResultPill = memo(function ResultPill({ label, value, positive, sub }) {
  const col = positive === true ? "#4ade80" : positive === false ? "#f87171" : "#e2e8f0";
  const bdr = positive === true ? "rgba(74,222,128,0.18)" : positive === false ? "rgba(248,113,113,0.18)" : "rgba(255,255,255,0.08)";
  return (
    <div style={{ background:"#060d1c", borderRadius:10, padding:"11px 10px", border:`1px solid ${bdr}`, flex:1, minWidth:0, textAlign:"center" }}>
      <div style={{ fontSize:11, color:"#6b7280", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:900, color:col, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:"#374151", marginTop:3 }}>{sub}</div>}
    </div>
  );
});

// ─── Market position ──────────────────────────────────────────────────────────
function getMarketRange(price, data) {
  if (!price || price <= 0 || !data) return null;
  const range = data.high - data.low;
  if (range <= 0) return null;
  const pct = ((price - data.low) / range) * 100;
  if (price < data.low)   return { label:"Below Market",  color:"#93c5fd" };
  if (pct < 25)           return { label:"Lower Range",   color:"#4ade80" };
  if (pct < 45)           return { label:"Lower-Mid",     color:"#86efac" };
  if (pct < 65)           return { label:"Core Market",   color:"#fbbf24" };
  if (pct < 82)           return { label:"Upper-Mid",     color:"#fb923c" };
  if (price <= data.high) return { label:"Premium Range", color:"#f87171" };
  return                         { label:"Above Market",  color:"#e11d48" };
}

// ─── Pricing verdict ──────────────────────────────────────────────────────────
function getPricingVerdict(price, data) {
  if (!price || price <= 0 || !data) return null;
  const { low, high, median, average } = data;
  const range = high - low;
  if (range <= 0) return null;
  const p    = (price - low)   / range;
  const pMed = (median - low)  / range;
  const pAvg = (average - low) / range;
  if (price < low * 0.9)         return "Well below market low — room to increase margin.";
  if (price < low)               return "Undercuts the market low — near-certain conversion.";
  if (p <= pMed * 0.55)          return "Highly competitive — well below most active sellers.";
  if (p <= pMed)                 return "Competitive — below the median. Strong position.";
  if (p <= (pMed + pAvg) / 2)   return "Near the median — slight reduction could help edge.";
  if (p <= pAvg)                 return "Aligned with the average — in line with most sellers.";
  if (p <= pAvg + (1 - pAvg) * 0.35) return "Above average — conversion may be impacted.";
  if (price <= high)             return "Among the highest listings — only strong branding will convert.";
  return "Exceeds all active listings — significant reduction recommended.";
}

// ─── Horizontal Pricing Band ──────────────────────────────────────────────────
function HorizontalPricingBand({ data, price }) {
  if (!data) return null;
  const range = data.high - data.low;
  if (range <= 0) return null;

  const toPct       = (v) => Math.min(100, Math.max(0, ((v - data.low) / range) * 100));
  const medPct      = toPct(data.median);
  const avgPct      = toPct(data.average);
  const pos         = price > 0 ? getMarketRange(price, data) : null;
  const userPct     = price > 0 ? Math.min(100, Math.max(0, toPct(price))) : null;
  const medAvgClose = Math.abs(medPct - avgPct) < 9;

  return (
    <div style={{ ...PANEL, padding:"16px 20px", animation:"pcFadeUp 0.35s ease" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#4b5563", textTransform:"uppercase", letterSpacing:0.6 }}>
          Market Pricing Band &nbsp;·&nbsp; eBay UK Active Listings
        </div>
        {pos ? (
          <div style={{ fontSize:12, fontWeight:700, color:pos.color, background:`${pos.color}18`, border:`1px solid ${pos.color}35`, borderRadius:20, padding:"3px 14px" }}>
            {pos.label}
          </div>
        ) : (
          <div style={{ fontSize:12, color:"#4b5563" }}>Enter a selling price to see your position</div>
        )}
      </div>

      {/* Pointer + bar zone */}
      <div style={{ position:"relative", paddingTop: userPct !== null ? 32 : 0 }}>

        {/* User price pointer above bar */}
        {userPct !== null && (
          <div style={{ position:"absolute", left:`${userPct}%`, top:0, transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", pointerEvents:"none" }}>
            <div style={{ fontSize:13, fontWeight:800, color:pos.color, whiteSpace:"nowrap", marginBottom:3 }}>
              ▲ {fmtGBP(price)}
            </div>
          </div>
        )}

        {/* Bar */}
        <div style={{ height:16, borderRadius:8, background:"linear-gradient(90deg,#0ea5e9 0%,#135DFF 40%,#4338ca 100%)", position:"relative" }}>
          {/* Gloss */}
          <div style={{ position:"absolute", inset:0, borderRadius:8, background:"linear-gradient(180deg,rgba(255,255,255,0.18) 0%,transparent 55%)" }} />

          {/* Median tick */}
          <div style={{ position:"absolute", left:`${medPct}%`, top:0, bottom:0, width:2, background:"rgba(255,255,255,0.6)", transform:"translateX(-50%)", borderRadius:1 }} />

          {/* Average tick */}
          {!medAvgClose && (
            <div style={{ position:"absolute", left:`${avgPct}%`, top:0, bottom:0, width:2, background:"rgba(255,255,255,0.4)", transform:"translateX(-50%)", borderRadius:1 }} />
          )}

          {/* User price marker on bar */}
          {userPct !== null && (
            <div style={{ position:"absolute", left:`${userPct}%`, top:-3, bottom:-3, width:4, background:pos.color, transform:"translateX(-50%)", borderRadius:2, boxShadow:`0 0 10px ${pos.color}` }} />
          )}
        </div>

        {/* Labels below bar */}
        <div style={{ position:"relative", height:38, marginTop:6 }}>
          <div style={{ position:"absolute", left:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#9ca3af" }}>{fmtGBP(data.low)}</div>
            <div style={{ fontSize:10, color:"#4b5563" }}>Low</div>
          </div>

          <div style={{ position:"absolute", left:`${medPct}%`, transform:"translateX(-50%)", textAlign:"center", whiteSpace:"nowrap" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#c4cdd8" }}>{fmtGBP(data.median)}</div>
            <div style={{ fontSize:10, color:"#4b5563" }}>Median</div>
          </div>

          {!medAvgClose && (
            <div style={{ position:"absolute", left:`${avgPct}%`, transform:"translateX(-50%)", textAlign:"center", whiteSpace:"nowrap" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#c4cdd8" }}>{fmtGBP(data.average)}</div>
              <div style={{ fontSize:10, color:"#4b5563" }}>Average</div>
            </div>
          )}

          <div style={{ position:"absolute", right:0, textAlign:"right" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#9ca3af" }}>{fmtGBP(data.high)}</div>
            <div style={{ fontSize:10, color:"#4b5563" }}>High</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Market Snapshot ──────────────────────────────────────────────────────────
function MktRow({ label, value, color }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize:13, color:"#6b7280" }}>{label}</span>
      <span style={{ fontSize:20, fontWeight:800, color: color || "#ffffff" }}>{value}</span>
    </div>
  );
}

function MarketSnapshot({ data, price, loading, error }) {
  const pos     = data && price > 0 ? getMarketRange(price, data)    : null;
  const verdict = data && price > 0 ? getPricingVerdict(price, data) : null;

  if (loading) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:220, gap:10, color:"#4b5563", fontSize:13 }}>
        <div style={{ fontSize:24 }}>⏳</div>
        Fetching live market data…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background:"#0D1428", color:"#fca5a5", border:"1px solid rgba(220,38,38,0.25)", borderRadius:10, padding:"12px 14px", fontSize:13 }}>
        ⚠ {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:220, textAlign:"center", gap:8 }}>
        <div style={{ fontSize:28, opacity:0.3 }}>📊</div>
        <div style={{ fontSize:14, fontWeight:700, color:"#4b5563" }}>No market data yet</div>
        <div style={{ fontSize:12, color:"#374151", lineHeight:1.6 }}>
          Search a part number or product name<br />above to load live eBay UK pricing.
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation:"pcFadeUp 0.35s ease" }}>
      <MktRow label="Lowest Price"  value={fmtGBP(data.low)}     color="#4ade80" />
      <MktRow label="Median Price"  value={fmtGBP(data.median)}  color="#ffffff" />
      <MktRow label="Average Price" value={fmtGBP(data.average)} color="#e2e8f0" />
      <MktRow label="Highest Price" value={fmtGBP(data.high)}    color="#f87171" />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0" }}>
        <span style={{ fontSize:13, color:"#6b7280" }}>Listings Analysed</span>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:20, fontWeight:800, color:"#93c5fd" }}>{data.priceCount}</span>
          <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:9, fontWeight:700, color:"#4ade80", background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.2)", borderRadius:20, padding:"2px 8px" }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", display:"inline-block", animation:"smPulseDot 2s ease-in-out infinite" }} />
            LIVE
          </span>
        </div>
      </div>

      {/* Market position */}
      {pos && (
        <div style={{ marginTop:12, background:`${pos.color}0d`, border:`1px solid ${pos.color}28`, borderRadius:10, padding:"11px 14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#4b5563", textTransform:"uppercase", letterSpacing:0.5 }}>Position</div>
            <div style={{ fontSize:12, fontWeight:700, color:pos.color, background:`${pos.color}18`, border:`1px solid ${pos.color}35`, borderRadius:20, padding:"2px 10px" }}>
              {pos.label}
            </div>
          </div>
          {verdict && <div style={{ fontSize:12, color:"#9ca3af", lineHeight:1.55 }}>{verdict}</div>}
        </div>
      )}

      {!pos && (
        <div style={{ marginTop:12, fontSize:12, color:"#374151", textAlign:"center" }}>
          Enter a selling price to see your market position.
        </div>
      )}

      <div style={{ marginTop:10, fontSize:10, color:"#374151", textAlign:"center" }}>
        Based on first-page active eBay UK listings only.
      </div>
    </div>
  );
}

// ─── Locked state ─────────────────────────────────────────────────────────────
function SmartPricingLocked() {
  return (
    <div style={{ ...PANEL, position:"relative", overflow:"hidden" }}>
      <div style={{ padding:"28px", filter:"blur(5px)", pointerEvents:"none", userSelect:"none", opacity:0.3 }}>
        <div style={{ display:"flex", gap:10, marginBottom:16 }}>
          <div style={{ flex:1, height:36, background:"#0D2040", borderRadius:8 }} />
          <div style={{ width:110, height:36, background:"#135DFF", borderRadius:8 }} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div style={{ background:"#060d1c", borderRadius:10, height:280 }} />
          <div style={{ background:"#060d1c", borderRadius:10, height:280 }} />
        </div>
        <div style={{ marginTop:12, background:"#060d1c", borderRadius:10, height:70 }} />
      </div>
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,rgba(7,13,24,0.5) 0%,rgba(7,13,24,0.92) 100%)", backdropFilter:"blur(2px)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 24px" }}>
        <div style={{ textAlign:"center", maxWidth:440 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🔒</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:8 }}>
            <span style={{ fontSize:20, fontWeight:800, color:"#fff" }}>Smart eBay Pricing</span>
            <span style={{ fontSize:9, fontWeight:800, color:"#135DFF", background:"rgba(19,93,255,0.2)", border:"1px solid rgba(19,93,255,0.4)", borderRadius:4, padding:"2px 7px", letterSpacing:0.8 }}>PRO</span>
          </div>
          <div style={{ fontSize:13, color:"#6b7280", marginBottom:22, lineHeight:1.6 }}>
            Live eBay UK market data to price your listings competitively and maximise profit.
          </div>
          <button style={{ ...BUTTON_BASE, background:"linear-gradient(135deg,#135DFF,#0ea5e9)", color:"#fff", fontSize:14, fontWeight:800, padding:"12px 32px", boxShadow:"0 0 24px rgba(19,93,255,0.45)", display:"inline-block" }}>
            Upgrade to Pro →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main PriceCalculator ─────────────────────────────────────────────────────
export default function PriceCalculator({ onSave, onLoadHandled, products, onDeleteProduct, onLoadProduct, isPro = true }) {
  const [innerPage,    setInnerPage]    = useState("calculator");
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

  // Derived numbers
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

  // Handlers
  const loadProduct = (p) => {
    setProductName(p.name || "");
    setItemCost(String(p.itemCost       ?? ""));
    setShippingCost(String(p.shippingCost ?? ""));
    setSellingPrice(String(p.sellingPrice ?? ""));
    setFvfPct(String(p.fvfPct          ?? "12.8"));
    setFixedFee(String(p.fixedFee        ?? "0.30"));
    setPromoPct(String(p.promoPct        ?? "0"));
    setVatRegistered(p.vatRegistered ?? true);
  };
  if (onLoadHandled) onLoadHandled(loadProduct);

  const handleSave = () => {
    if (!hasResult || !onSave) return;
    onSave({ name: productName.trim() || "Unnamed Product", itemCost: cost, shippingCost: shipping, sellingPrice: price, fvfPct: fvf, fixedFee: fixed, promoPct: promo, vatRegistered, profit, margin, markup, ebayFVF, ebayPromo, vatAmount });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const handleFetch = async () => {
    if (!smQuery.trim()) return;
    setSmLoading(true); setSmError("");
    try {
      const res  = await fetch(`${API_URL}/api/ebay/search-prices`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ query: smQuery.trim() }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch prices.");
      if (json.priceCount === 0) throw new Error("No active listings found — try a different search term.");
      setSmData(json);
    } catch (err) { setSmError(err.message); setSmData(null); }
    finally       { setSmLoading(false); }
  };

  useEffect(() => { if (!editingMarkup && !isNaN(markup) && price > 0) setTargetMarkup(markup.toFixed(1)); }, [markup, editingMarkup, price]);
  useEffect(() => { if (!editingMargin && !isNaN(margin) && price > 0) setTargetMargin(margin.toFixed(1)); }, [margin, editingMargin, price]);

  function calcPriceFromMarkup() {
    const mk = parseFloat(targetMarkup);
    if (isNaN(mk) || cost <= 0 || R <= 0) return;
    setSellingPrice(((cost * (1 + mk / 100) + shipping + packaging + fixed) / R).toFixed(2));
  }
  function calcPriceFromMargin() {
    const mg = parseFloat(targetMargin);
    if (isNaN(mg) || mg >= 100) return;
    const d = R - mg / 100;
    if (d <= 0) return;
    setSellingPrice(((fixed + cost + shipping + packaging) / d).toFixed(2));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth:1040, margin:"0 auto" }}>

      {/* Inner tab bar */}
      <div style={{ display:"flex", gap:6, marginBottom:16, background:"#0F1E35", borderRadius:14, padding:5, border:"1px solid rgba(255,255,255,0.08)" }}>
        {[
          { key:"calculator", label:"Calculator" },
          { key:"saved",      label:`Saved Products${savedCount ? ` (${savedCount})` : ""}` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setInnerPage(key)} style={{
            flex:1, padding:"9px 16px", borderRadius:10, border:"none", cursor:"pointer",
            fontWeight:700, fontSize:13,
            background: innerPage === key ? "#135DFF" : "transparent",
            color:      innerPage === key ? "#fff"    : "#9ca3af",
            boxShadow:  innerPage === key ? "0 0 14px rgba(19,93,255,0.28)" : "none",
            transition:"all 0.18s ease"
          }}>{label}</button>
        ))}
      </div>

      {/* Saved tab */}
      {innerPage === "saved" && (
        <SavedProducts
          products={products ?? []}
          onDelete={onDeleteProduct}
          onLoad={(p) => { setInnerPage("calculator"); if (onLoadProduct) onLoadProduct(p); }}
        />
      )}

      {/* Calculator tab */}
      {innerPage === "calculator" && (
        <div style={{ display:"grid", gap:12 }}>

          {!isPro && <SmartPricingLocked />}

          {isPro && <>

            {/* ── Search bar ── */}
            <div style={{ ...PANEL, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>

              {/* Title */}
              <div style={{ display:"flex", alignItems:"center", gap:7, flexShrink:0 }}>
                <span style={{ fontSize:15, fontWeight:800, color:"#fff", letterSpacing:-0.3 }}>Smart eBay Pricing</span>
                <span style={{ fontSize:9, fontWeight:800, color:"#135DFF", background:"rgba(19,93,255,0.15)", border:"1px solid rgba(19,93,255,0.35)", borderRadius:4, padding:"2px 7px", letterSpacing:0.8 }}>PRO</span>
              </div>

              {/* Input */}
              <input
                value={smQuery}
                onChange={(e) => setSmQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !smLoading && handleFetch()}
                placeholder="OEM / part number or product name…"
                style={{ ...CI, flex:1, minWidth:180, fontSize:14 }}
              />

              {/* Button */}
              <button onClick={handleFetch} disabled={smLoading || !smQuery.trim()} style={{
                ...BUTTON_BASE, padding:"9px 20px", fontSize:13, flexShrink:0, whiteSpace:"nowrap",
                background: smLoading || !smQuery.trim() ? "#0D2040" : "#135DFF",
                color:"#fff", opacity: smLoading || !smQuery.trim() ? 0.5 : 1,
                boxShadow: smLoading || !smQuery.trim() ? "none" : "0 0 16px rgba(19,93,255,0.4)"
              }}>
                {smLoading ? "Fetching…" : "Fetch Prices"}
              </button>

              {/* Listings badge */}
              {smData && (
                <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0, background:"rgba(19,93,255,0.08)", border:"1px solid rgba(19,93,255,0.18)", borderRadius:8, padding:"6px 12px" }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", display:"inline-block", animation:"smPulseDot 2s ease-in-out infinite" }} />
                  <span style={{ fontSize:14, fontWeight:800, color:"#93c5fd" }}>{smData.priceCount}</span>
                  <span style={{ fontSize:12, color:"#4b5563" }}>listings analysed</span>
                </div>
              )}
            </div>

            {/* ── Two-column workspace (single connected card) ── */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", background:"#0B1929", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, overflow:"hidden" }}>

              {/* ─── LEFT: Profit Calculator ─────────────────────────────────── */}
              <div style={{ padding:"18px 20px", borderRight:"1px solid rgba(255,255,255,0.07)" }}>

                {/* Product name */}
                <div style={ROW}>
                  <span style={LBL}>Product name</span>
                  <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Timing Belt Kit" style={CI} />
                </div>

                <Sh>Costs</Sh>
                <div style={ROW}>
                  <span style={LBL}>Item cost (£)</span>
                  <input type="number" value={itemCost} onChange={(e) => setItemCost(e.target.value)} placeholder="0.00" style={CI} />
                </div>
                <div style={ROW}>
                  <span style={LBL}>Postage (£)</span>
                  <input type="number" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} placeholder="0.00" style={CI} />
                </div>
                <div style={ROW_LAST}>
                  <span style={LBL}>Packaging (£)</span>
                  <input type="number" value={packagingCost} onChange={(e) => setPackagingCost(e.target.value)} placeholder="0.00" style={CI} />
                </div>

                <Sh>eBay Fees</Sh>
                <div style={ROW}>
                  <span style={LBL}>Final value fee (%)</span>
                  <input type="number" value={fvfPct} onChange={(e) => setFvfPct(e.target.value)} placeholder="12.8" style={CI} />
                </div>
                <div style={ROW}>
                  <span style={LBL}>Fixed fee (£)</span>
                  <input type="number" value={fixedFee} onChange={(e) => setFixedFee(e.target.value)} placeholder="0.30" style={CI} />
                </div>
                <div style={ROW_LAST}>
                  <span style={LBL}>Ad rate (%)</span>
                  <input type="number" value={promoPct} onChange={(e) => setPromoPct(e.target.value)} placeholder="0" style={CI} />
                </div>

                {/* VAT */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0" }}>
                  <span style={LBL}>VAT registered (20%)</span>
                  <button onClick={() => setVatRegistered(v => !v)} style={{ ...BUTTON_BASE, padding:"5px 16px", fontSize:12, background: vatRegistered ? "#135DFF" : "#0D2040", color:"#fff", boxShadow: vatRegistered ? "0 0 10px rgba(19,93,255,0.3)" : "none" }}>
                    {vatRegistered ? "ON" : "OFF"}
                  </button>
                </div>

                <Divider />

                {/* Selling price — prominent */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#4b5563", textTransform:"uppercase", letterSpacing:0.6, marginBottom:6 }}>
                    Selling Price {vatRegistered ? "(inc. VAT)" : ""}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <div>
                      <input
                        type="number"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        placeholder="e.g. 29.99"
                        style={{ ...CI, fontSize:17, fontWeight:700, background:"rgba(19,93,255,0.08)", border:"1px solid rgba(19,93,255,0.25)", width:"100%" }}
                      />
                    </div>
                    <div>
                      {/* Break-even */}
                      <div style={{
                        ...CI, display:"flex", alignItems:"center",
                        background:"#060d1c", border:"1px solid rgba(255,255,255,0.07)",
                        color: hasResult && !isNaN(breakEven) ? "#fbbf24" : "#374151",
                        fontWeight:700, fontSize:15, cursor:"default"
                      }}>
                        {hasResult && !isNaN(breakEven) ? fmt(breakEven) : "—"}
                        <span style={{ fontSize:10, color:"#4b5563", marginLeft:5, fontWeight:500 }}>break-even</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Markup / Margin quick-set */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:10, color:"#4b5563", marginBottom:4 }}>Target markup %</div>
                    <div style={{ display:"flex", gap:4 }}>
                      <input type="number" value={targetMarkup}
                        onChange={(e) => { const v=e.target.value; setTargetMarkup(v); const mk=parseFloat(v); if(!isNaN(mk)&&cost>0&&R>0) setSellingPrice(((cost*(1+mk/100)+shipping+packaging+fixed)/R).toFixed(2)); }}
                        onFocus={() => setEditingMarkup(true)} onBlur={() => setEditingMarkup(false)}
                        onKeyDown={(e) => e.key==="Enter" && calcPriceFromMarkup()}
                        placeholder="e.g. 50" style={{ ...CI, flex:1 }}
                      />
                      <button onClick={calcPriceFromMarkup} style={{ ...SMALL_BUTTON_STYLE, padding:"7px 10px", fontSize:11 }}>Set</button>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:"#4b5563", marginBottom:4 }}>Target margin %</div>
                    <div style={{ display:"flex", gap:4 }}>
                      <input type="number" value={targetMargin}
                        onChange={(e) => { const v=e.target.value; setTargetMargin(v); const mg=parseFloat(v); if(!isNaN(mg)&&mg<100&&R>0){const d=R-mg/100; if(d>0) setSellingPrice(((fixed+cost+shipping+packaging)/d).toFixed(2));} }}
                        onFocus={() => setEditingMargin(true)} onBlur={() => setEditingMargin(false)}
                        onKeyDown={(e) => e.key==="Enter" && calcPriceFromMargin()}
                        placeholder="e.g. 20" style={{ ...CI, flex:1 }}
                      />
                      <button onClick={calcPriceFromMargin} style={{ ...SMALL_BUTTON_STYLE, padding:"7px 10px", fontSize:11 }}>Set</button>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Result pills */}
                {hasResult ? (
                  <div style={{ display:"grid", gap:8 }}>
                    <div style={{ display:"flex", gap:8 }}>
                      <ResultPill label="Net Profit"  value={fmt(profit)}     positive={profit > 0 ? true : profit < 0 ? false : null} />
                      <ResultPill label="Margin"      value={fmtPct(margin)}  positive={margin > 0 ? true : margin < 0 ? false : null} sub="÷ sell price" />
                      <ResultPill label="Markup"      value={fmtPct(markup)}  positive={markup > 0 ? true : markup < 0 ? false : null} sub="÷ item cost" />
                    </div>
                    <button onClick={handleSave} style={{ ...BUTTON_BASE, background: savedFlash ? "#166534" : "#135DFF", color:"#fff", width:"100%", textAlign:"center", fontSize:13, padding:"10px", boxShadow: savedFlash ? "0 0 16px rgba(22,101,52,0.4)" : "0 0 16px rgba(19,93,255,0.28)" }}>
                      {savedFlash ? "✓ Saved!" : "Save Product"}
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize:13, color:"#374151", textAlign:"center", padding:"12px 0" }}>
                    Enter item cost &amp; selling price to see results
                  </div>
                )}
              </div>

              {/* ─── RIGHT: Market Snapshot ───────────────────────────────────── */}
              <div style={{ padding:"18px 20px" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#4b5563", textTransform:"uppercase", letterSpacing:0.7, marginBottom:12 }}>
                  Market Snapshot
                </div>
                <MarketSnapshot data={smData} price={price} loading={smLoading} error={smError} />
              </div>

            </div>{/* end two-column */}

            {/* ── Pricing band ── */}
            {smData && !smLoading && (
              <HorizontalPricingBand data={smData} price={price} />
            )}

          </>}
        </div>
      )}
    </div>
  );
}
