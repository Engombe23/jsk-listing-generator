import React, { memo, useState, useEffect } from "react";
import { useSessionState } from "./useSessionState.js";
import {
  TextInput,
  BUTTON_BASE,
  SMALL_BUTTON_STYLE,
  INPUT_STYLE
} from "./shared.jsx";
import SavedProducts from "./SavedProducts.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt    = (n) => (n === null || isNaN(n)) ? "—" : (n < 0 ? `-£${Math.abs(n).toFixed(2)}` : `£${n.toFixed(2)}`);
const fmtPct = (n) => (n === null || isNaN(n)) ? "—" : `${n.toFixed(1)}%`;
const fmtGBP = (v) => (v != null && !isNaN(v)) ? `£${Number(v).toFixed(2)}` : "—";

// ─── CSS keyframes (once) ────────────────────────────────────────────────────

(function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("__pc-kf")) return;
  const s = document.createElement("style");
  s.id = "__pc-kf";
  s.textContent = `
    @keyframes smPulseDot { 0%,100%{opacity:1;box-shadow:0 0 6px #4ade80} 50%{opacity:0.3;box-shadow:0 0 14px #4ade80} }
    @keyframes pcFadeUp   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  `;
  document.head.appendChild(s);
})();

// ─── Compact input row styles ─────────────────────────────────────────────────

const ROW = {
  display: "grid",
  gridTemplateColumns: "140px 1fr",
  alignItems: "center",
  gap: 10,
  padding: "6px 0",
  borderBottom: "1px solid rgba(255,255,255,0.04)"
};
const ROW_LAST = { ...ROW, borderBottom: "none" };
const ROW_LBL  = { fontSize: 12, color: "#9ca3af", fontWeight: 500, lineHeight: 1.3 };
const CI       = { // compact input
  ...INPUT_STYLE,
  padding: "7px 10px",
  fontSize: 13,
  borderRadius: 10
};

// ─── Small helpers ────────────────────────────────────────────────────────────

function SectionHead({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 800, color: "#374151",
      textTransform: "uppercase", letterSpacing: 0.8,
      paddingTop: 14, paddingBottom: 5
    }}>{children}</div>
  );
}

const ResultPill = memo(function ResultPill({ label, value, positive }) {
  const col = positive === true ? "#4ade80" : positive === false ? "#f87171" : "#ffffff";
  const bdr = positive === true ? "rgba(74,222,128,0.2)" : positive === false ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.08)";
  return (
    <div style={{ background: "#060e1c", borderRadius: 10, padding: "9px 10px", border: `1px solid ${bdr}`, flex: 1, minWidth: 0, textAlign: "center" }}>
      <div style={{ fontSize: 9, color: "#4b5563", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: col, lineHeight: 1 }}>{value}</div>
    </div>
  );
});

// ─── Market position ──────────────────────────────────────────────────────────

function getMarketRange(price, data) {
  if (!price || price <= 0 || !data) return null;
  const range = data.high - data.low;
  if (range <= 0) return null;
  const pct = ((price - data.low) / range) * 100;
  if (price < data.low)   return { label: "Below Market",  color: "#93c5fd" };
  if (pct < 25)           return { label: "Lower Range",   color: "#4ade80" };
  if (pct < 45)           return { label: "Lower-Mid",     color: "#86efac" };
  if (pct < 65)           return { label: "Core Market",   color: "#fbbf24" };
  if (pct < 82)           return { label: "Upper-Mid",     color: "#fb923c" };
  if (price <= data.high) return { label: "Premium Range", color: "#f87171" };
  return                         { label: "Above Market",  color: "#e11d48" };
}

// ─── Pricing verdict text ─────────────────────────────────────────────────────

function getPricingVerdict(price, data) {
  if (!price || price <= 0 || !data) return null;
  const { low, high, median, average } = data;
  const range = high - low;
  if (range <= 0) return null;
  const p    = (price - low)   / range;
  const pMed = (median - low)  / range;
  const pAvg = (average - low) / range;
  if (price < low * 0.9)
    return "Your price is well below the cheapest active listing. There may be room to increase your margin without impacting conversion.";
  if (price < low)
    return "Your price undercuts the current market low. You'll almost certainly convert — consider testing a slightly higher price.";
  if (p <= pMed * 0.55)
    return "Your price is highly competitive and well below most active sellers. Excellent conversion potential at this level.";
  if (p <= pMed)
    return "Your price is competitive and sits below the market median — a strong position balancing conversion rate with margin.";
  if (p <= (pMed + pAvg) / 2)
    return "Your price is close to the market median. A slight reduction could sharpen your competitive edge.";
  if (p <= pAvg)
    return "Your price is aligned with the market average and in line with most active sellers at this level.";
  if (p <= pAvg + (1 - pAvg) * 0.35)
    return "Your price is above the market average. Conversion may be impacted — a modest reduction is worth testing.";
  if (price <= high)
    return "Your price is among the highest active listings. Only strong listing quality or brand will support conversion here.";
  return "Your price exceeds all active listings. A significant reduction is recommended to remain competitive.";
}

// ─── Horizontal pricing band ──────────────────────────────────────────────────

function HorizontalPricingBand({ data, price }) {
  if (!data) return null;
  const range = data.high - data.low;
  if (range <= 0) return null;

  const toPct     = (v) => Math.min(100, Math.max(0, ((v - data.low) / range) * 100));
  const medPct    = toPct(data.median);
  const avgPct    = toPct(data.average);
  const pos       = price > 0 ? getMarketRange(price, data) : null;
  const userPct   = price > 0 ? Math.min(100, Math.max(0, toPct(price))) : null;
  const medAvgClose = Math.abs(medPct - avgPct) < 9;

  return (
    <div style={{
      background: "#060E1C",
      border: "1px solid rgba(19,93,255,0.15)",
      borderRadius: 14, padding: "14px 18px",
      animation: "pcFadeUp 0.4s ease"
    }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#4b5563", textTransform: "uppercase", letterSpacing: 0.6 }}>
          Market Pricing Band &nbsp;·&nbsp; eBay UK
        </div>
        {pos ? (
          <div style={{
            fontSize: 11, fontWeight: 700, color: pos.color,
            background: `${pos.color}18`, border: `1px solid ${pos.color}35`,
            borderRadius: 20, padding: "3px 12px"
          }}>
            {pos.label}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "#374151" }}>Enter selling price to see position</div>
        )}
      </div>

      {/* Pointer + bar area */}
      <div style={{ position: "relative", paddingTop: userPct !== null ? 30 : 0 }}>

        {/* User price pointer above bar */}
        {userPct !== null && (
          <div style={{
            position: "absolute",
            left: `${userPct}%`,
            top: 0,
            transform: "translateX(-50%)",
            display: "flex", flexDirection: "column", alignItems: "center",
            pointerEvents: "none"
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: pos.color, whiteSpace: "nowrap", marginBottom: 2 }}>
              {fmtGBP(price)}
            </div>
            <div style={{
              width: 0, height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: `6px solid ${pos.color}`
            }} />
          </div>
        )}

        {/* The bar */}
        <div style={{
          height: 12, borderRadius: 6,
          background: "linear-gradient(90deg, #0ea5e9 0%, #135DFF 42%, #4338ca 100%)",
          position: "relative"
        }}>
          {/* Gloss */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 6,
            background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 60%)"
          }} />

          {/* Median tick */}
          <div style={{
            position: "absolute", left: `${medPct}%`, top: 0, bottom: 0,
            width: 2, background: "rgba(255,255,255,0.5)",
            transform: "translateX(-50%)", borderRadius: 1
          }} />

          {/* Average tick */}
          {!medAvgClose && (
            <div style={{
              position: "absolute", left: `${avgPct}%`, top: 0, bottom: 0,
              width: 2, background: "rgba(255,255,255,0.35)",
              transform: "translateX(-50%)", borderRadius: 1
            }} />
          )}

          {/* User price thick tick */}
          {userPct !== null && (
            <div style={{
              position: "absolute", left: `${userPct}%`, top: -2, bottom: -2,
              width: 3, background: pos.color,
              transform: "translateX(-50%)", borderRadius: 2,
              boxShadow: `0 0 8px ${pos.color}90`
            }} />
          )}
        </div>

        {/* Labels below bar */}
        <div style={{ position: "relative", height: 34, marginTop: 5 }}>
          {/* LOW */}
          <div style={{ position: "absolute", left: 0, textAlign: "left" }}>
            <div style={{ fontSize: 10, color: "#4b5563", fontWeight: 600 }}>{fmtGBP(data.low)}</div>
            <div style={{ fontSize: 9, color: "#374151" }}>Low</div>
          </div>

          {/* MED */}
          <div style={{
            position: "absolute", left: `${medPct}%`,
            transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap"
          }}>
            <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>{fmtGBP(data.median)}</div>
            <div style={{ fontSize: 9, color: "#6b7280" }}>Median</div>
          </div>

          {/* AVG (skip if too close to MED) */}
          {!medAvgClose && (
            <div style={{
              position: "absolute", left: `${avgPct}%`,
              transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap"
            }}>
              <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>{fmtGBP(data.average)}</div>
              <div style={{ fontSize: 9, color: "#6b7280" }}>Average</div>
            </div>
          )}

          {/* HIGH */}
          <div style={{ position: "absolute", right: 0, textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#4b5563", fontWeight: 600 }}>{fmtGBP(data.high)}</div>
            <div style={{ fontSize: 9, color: "#374151" }}>High</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Market Snapshot panel ────────────────────────────────────────────────────

function MarketRow({ label, value, color }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)"
    }}>
      <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 800, color: color || "#ffffff" }}>{value}</span>
    </div>
  );
}

function MarketSnapshot({ data, price, loading, error }) {
  const pos     = data && price > 0 ? getMarketRange(price, data)    : null;
  const verdict = data && price > 0 ? getPricingVerdict(price, data) : null;

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 10, color: "#374151", fontSize: 13 }}>
        <div style={{ fontSize: 26 }}>⏳</div>
        Fetching live market data…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: "#0D1428", color: "#fca5a5",
        border: "1px solid rgba(220,38,38,0.25)", borderRadius: 12,
        padding: "12px 16px", fontSize: 13
      }}>
        ⚠ {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, textAlign: "center", gap: 8, color: "#374151" }}>
        <div style={{ fontSize: 30, opacity: 0.4 }}>📊</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>No market data yet</div>
        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
          Search a part number or product name<br />above to load live eBay UK pricing.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12, animation: "pcFadeUp 0.4s ease" }}>
      {/* Price stats */}
      <div>
        <MarketRow label="Lowest Price"  value={fmtGBP(data.low)}     color="#4ade80" />
        <MarketRow label="Median Price"  value={fmtGBP(data.median)}  color="#ffffff" />
        <MarketRow label="Average Price" value={fmtGBP(data.average)} color="#e2e8f0" />
        <MarketRow label="Highest Price" value={fmtGBP(data.high)}    color="#f87171" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0" }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>Listings Analysed</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#93c5fd" }}>{data.priceCount}</span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 9, fontWeight: 700, color: "#4ade80",
              background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)",
              borderRadius: 20, padding: "2px 7px"
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%", background: "#4ade80", display: "inline-block",
                animation: "smPulseDot 2s ease-in-out infinite"
              }} />
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* Market position */}
      {pos && (
        <div style={{
          background: `${pos.color}0e`,
          border: `1px solid ${pos.color}25`,
          borderRadius: 12, padding: "12px 14px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#4b5563", textTransform: "uppercase", letterSpacing: 0.6 }}>
              Market Position
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: pos.color,
              background: `${pos.color}18`, border: `1px solid ${pos.color}35`,
              borderRadius: 20, padding: "2px 10px"
            }}>
              {pos.label}
            </div>
          </div>
          {verdict && (
            <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6 }}>{verdict}</div>
          )}
        </div>
      )}

      {!pos && (
        <div style={{ fontSize: 12, color: "#374151", textAlign: "center", paddingTop: 4 }}>
          Enter a selling price to see your market position.
        </div>
      )}

      <div style={{ fontSize: 10, color: "#374151", textAlign: "center" }}>
        Based on first-page active eBay UK listings only.
      </div>
    </div>
  );
}

// ─── Non-Pro locked state ─────────────────────────────────────────────────────

function SmartPricingLocked() {
  return (
    <div style={{
      background: "linear-gradient(135deg, #070D18 0%, #0A1628 50%, #070D18 100%)",
      border: "1px solid rgba(19,93,255,0.18)",
      borderRadius: 24, position: "relative", overflow: "hidden"
    }}>
      {/* Blurred preview */}
      <div style={{ padding: "28px 28px 24px", filter: "blur(5px)", pointerEvents: "none", userSelect: "none", opacity: 0.35 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 40, background: "#0D2040", borderRadius: 10 }} />
          <div style={{ width: 120, height: 40, background: "#135DFF", borderRadius: 10 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16 }}>
          <div style={{ background: "#0A1628", borderRadius: 14, height: 320 }} />
          <div style={{ background: "#0A1628", borderRadius: 14, height: 320 }} />
        </div>
        <div style={{ marginTop: 16, background: "#060e1c", borderRadius: 12, height: 80 }} />
      </div>
      {/* Lock overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(7,13,24,0.55) 0%, rgba(7,13,24,0.9) 100%)",
        backdropFilter: "blur(2px)", borderRadius: 24,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px"
      }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontSize: 36, marginBottom: 14, filter: "drop-shadow(0 0 14px rgba(19,93,255,0.5))" }}>🔒</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#ffffff" }}>Smart eBay Pricing</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#135DFF", background: "rgba(19,93,255,0.2)", border: "1px solid rgba(19,93,255,0.4)", borderRadius: 6, padding: "3px 9px", letterSpacing: 0.8 }}>PRO</span>
          </div>
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 24, lineHeight: 1.65 }}>
            Get live eBay UK market data to price your listings competitively and maximise profit.
          </div>
          <button style={{ ...BUTTON_BASE, background: "linear-gradient(135deg, #135DFF 0%, #0ea5e9 100%)", color: "#fff", fontSize: 15, fontWeight: 800, padding: "13px 36px", boxShadow: "0 0 28px rgba(19,93,255,0.45)", display: "inline-block" }}>
            Upgrade to Pro →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main PriceCalculator ─────────────────────────────────────────────────────

export default function PriceCalculator({ onSave, onLoadHandled, products, onDeleteProduct, onLoadProduct, isPro = true }) {
  const [innerPage, setInnerPage] = useState("calculator");
  const savedCount = products?.length ?? 0;

  // ── Calculator state ────────────────────────────────────────────────────────
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

  // ── Smart Pricing state ─────────────────────────────────────────────────────
  const [smQuery,   setSmQuery]   = useSessionState("jsk_calc_sm_query", "");
  const [smData,    setSmData]    = useSessionState("jsk_calc_sm_data",  null);
  const [smLoading, setSmLoading] = useState(false);
  const [smError,   setSmError]   = useState("");

  // ── Derived numbers ─────────────────────────────────────────────────────────
  const cost      = parseFloat(itemCost)      || 0;
  const shipping  = parseFloat(shippingCost)  || 0;
  const packaging = parseFloat(packagingCost) || 0;
  const price     = parseFloat(sellingPrice)  || 0;
  const fvf       = parseFloat(fvfPct)        || 0;
  const fixed     = parseFloat(fixedFee)      || 0;
  const promo     = parseFloat(promoPct)      || 0;
  const vatRate   = vatRegistered ? 20 / 120  : 0;
  const R         = 1 - fvf / 100 - promo / 100 - vatRate;  // net revenue factor

  const ebayFVF    = price > 0 ? price * (fvf / 100) + fixed : 0;
  const ebayPromo  = price * (promo / 100);
  const vatAmount  = price * vatRate;
  const totalCosts = cost + shipping + packaging;
  const netRevenue = price - ebayFVF - ebayPromo - vatAmount;
  const profit     = netRevenue - totalCosts;
  const margin     = price > 0 ? (profit / price) * 100 : NaN;
  const markup     = cost  > 0 ? (profit / cost)  * 100 : NaN;
  const breakEven  = R > 0   ? (totalCosts + fixed) / R   : NaN;
  const hasResult  = price > 0 && cost > 0;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const loadProduct = (p) => {
    setProductName(p.name || "");
    setItemCost(String(p.itemCost     ?? ""));
    setShippingCost(String(p.shippingCost ?? ""));
    setSellingPrice(String(p.sellingPrice ?? ""));
    setFvfPct(String(p.fvfPct        ?? "12.8"));
    setFixedFee(String(p.fixedFee      ?? "0.30"));
    setPromoPct(String(p.promoPct      ?? "0"));
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
      const res  = await fetch(`${API_URL}/api/ebay/search-prices`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: smQuery.trim() })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch prices.");
      if (json.priceCount === 0) throw new Error("No active listings found — try a different search term.");
      setSmData(json);
    } catch (err) {
      setSmError(err.message); setSmData(null);
    } finally {
      setSmLoading(false);
    }
  };

  useEffect(() => {
    if (!editingMarkup && !isNaN(markup) && price > 0) setTargetMarkup(markup.toFixed(1));
  }, [markup, editingMarkup, price]);

  useEffect(() => {
    if (!editingMargin && !isNaN(margin) && price > 0) setTargetMargin(margin.toFixed(1));
  }, [margin, editingMargin, price]);

  function calcPriceFromMarkup() {
    const mk = parseFloat(targetMarkup);
    if (isNaN(mk) || cost <= 0 || R <= 0) return;
    setSellingPrice(((cost * (1 + mk / 100) + shipping + packaging + fixed) / R).toFixed(2));
  }

  function calcPriceFromMargin() {
    const mg = parseFloat(targetMargin);
    if (isNaN(mg) || mg >= 100) return;
    const denom = R - mg / 100;
    if (denom <= 0) return;
    setSellingPrice(((fixed + cost + shipping + packaging) / denom).toFixed(2));
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Inner tab bar */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 20,
        background: "#0F1E35", borderRadius: 16, padding: 5,
        border: "1px solid rgba(255,255,255,0.08)"
      }}>
        {[
          { key: "calculator", label: "Calculator" },
          { key: "saved",      label: `Saved Products${savedCount ? ` (${savedCount})` : ""}` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setInnerPage(key)} style={{
            flex: 1, padding: "10px 16px", borderRadius: 12,
            border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
            background: innerPage === key ? "#135DFF" : "transparent",
            color:      innerPage === key ? "#ffffff" : "#9ca3af",
            boxShadow:  innerPage === key ? "0 0 14px rgba(19,93,255,0.28)" : "none",
            transition: "all 0.18s ease"
          }}>{label}</button>
        ))}
      </div>

      {/* Saved Products tab */}
      {innerPage === "saved" && (
        <SavedProducts
          products={products ?? []}
          onDelete={onDeleteProduct}
          onLoad={(product) => { setInnerPage("calculator"); if (onLoadProduct) onLoadProduct(product); }}
        />
      )}

      {/* Calculator tab */}
      {innerPage === "calculator" && (
        <div style={{ display: "grid", gap: 16 }}>

          {/* Non-Pro gate */}
          {!isPro && <SmartPricingLocked />}

          {isPro && <>
            {/* ── Top search bar ────────────────────────────────────────────── */}
            <div style={{
              background: "#0D1B36",
              border: "1px solid rgba(19,93,255,0.22)",
              borderRadius: 16, padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
              boxShadow: "0 0 0 1px rgba(19,93,255,0.06), 0 4px 20px rgba(0,0,0,0.3)"
            }}>
              {/* Title + PRO badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff", letterSpacing: -0.3 }}>
                  Smart eBay Pricing
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 800, color: "#135DFF",
                  background: "rgba(19,93,255,0.15)", border: "1px solid rgba(19,93,255,0.35)",
                  borderRadius: 4, padding: "2px 7px", letterSpacing: 0.8
                }}>PRO</span>
              </div>

              {/* Search input */}
              <TextInput
                value={smQuery}
                onChange={(e) => setSmQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !smLoading && handleFetch()}
                placeholder="OEM / part number or product name…"
                style={{ flex: 1, minWidth: 180 }}
              />

              {/* Fetch button */}
              <button
                onClick={handleFetch}
                disabled={smLoading || !smQuery.trim()}
                style={{
                  ...BUTTON_BASE,
                  padding: "10px 20px", fontSize: 13,
                  background: smLoading || !smQuery.trim() ? "#0D2040" : "#135DFF",
                  color: "#fff",
                  opacity: smLoading || !smQuery.trim() ? 0.5 : 1,
                  whiteSpace: "nowrap", flexShrink: 0,
                  boxShadow: smLoading || !smQuery.trim() ? "none" : "0 0 18px rgba(19,93,255,0.4)"
                }}
              >
                {smLoading ? "Fetching…" : "Fetch Prices"}
              </button>

              {/* Listings badge */}
              {smData && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                  background: "rgba(19,93,255,0.08)", border: "1px solid rgba(19,93,255,0.18)",
                  borderRadius: 10, padding: "6px 12px"
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%", background: "#4ade80",
                    display: "inline-block", animation: "smPulseDot 2s ease-in-out infinite"
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#93c5fd" }}>{smData.priceCount}</span>
                  <span style={{ fontSize: 11, color: "#4b5563" }}>listings analysed</span>
                </div>
              )}
            </div>

            {/* ── Two-column workspace ──────────────────────────────────────── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "minmax(300px, 400px) 1fr",
              gap: 16, alignItems: "start"
            }}>

              {/* ─── Left: Profit Calculator ──────────────────────────────── */}
              <div style={{
                background: "#0A1628",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16, padding: "14px 16px"
              }}>

                <SectionHead>Product</SectionHead>
                <div style={ROW}>
                  <span style={ROW_LBL}>Name (optional)</span>
                  <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Timing Belt Kit" style={CI} />
                </div>

                <SectionHead>Costs</SectionHead>
                <div style={ROW}>
                  <span style={ROW_LBL}>Item Cost (£)</span>
                  <input type="number" value={itemCost} onChange={(e) => setItemCost(e.target.value)} placeholder="0.00" style={CI} />
                </div>
                <div style={ROW}>
                  <span style={ROW_LBL}>Postage Cost (£)</span>
                  <input type="number" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} placeholder="0.00" style={CI} />
                </div>
                <div style={ROW_LAST}>
                  <span style={ROW_LBL}>Packaging (£)</span>
                  <input type="number" value={packagingCost} onChange={(e) => setPackagingCost(e.target.value)} placeholder="0.00" style={CI} />
                </div>

                <SectionHead>eBay Fees</SectionHead>
                <div style={ROW}>
                  <span style={ROW_LBL}>Final Value Fee (%)</span>
                  <input type="number" value={fvfPct} onChange={(e) => setFvfPct(e.target.value)} placeholder="12.8" style={CI} />
                </div>
                <div style={ROW}>
                  <span style={ROW_LBL}>Fixed Fee (£)</span>
                  <input type="number" value={fixedFee} onChange={(e) => setFixedFee(e.target.value)} placeholder="0.30" style={CI} />
                </div>
                <div style={ROW_LAST}>
                  <span style={ROW_LBL}>Ad Rate (%)</span>
                  <input type="number" value={promoPct} onChange={(e) => setPromoPct(e.target.value)} placeholder="0" style={CI} />
                </div>

                <SectionHead>VAT</SectionHead>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", marginBottom: 2 }}>
                  <span style={ROW_LBL}>VAT Registered (20%)</span>
                  <button onClick={() => setVatRegistered((v) => !v)} style={{
                    ...BUTTON_BASE, padding: "5px 16px", fontSize: 12,
                    background: vatRegistered ? "#135DFF" : "#0D2040", color: "#fff",
                    boxShadow: vatRegistered ? "0 0 12px rgba(19,93,255,0.3)" : "none"
                  }}>
                    {vatRegistered ? "ON" : "OFF"}
                  </button>
                </div>

                {/* ── Selling Price block ── */}
                <div style={{
                  background: "rgba(19,93,255,0.06)", border: "1px solid rgba(19,93,255,0.18)",
                  borderRadius: 12, padding: "12px", margin: "12px 0"
                }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>
                    Selling Price {vatRegistered ? "(inc. VAT)" : ""}
                  </div>

                  {/* Price + break-even side by side */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 4 }}>Your Price (£)</div>
                      <input
                        type="number"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        placeholder="e.g. 29.99"
                        style={{ ...CI, fontSize: 15, fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 4 }}>Break-even (£)</div>
                      <div style={{
                        ...CI, display: "flex", alignItems: "center",
                        background: "#060e1c", border: "1px solid rgba(255,255,255,0.06)",
                        color: hasResult && !isNaN(breakEven) ? "#fbbf24" : "#374151",
                        fontWeight: 700, cursor: "default"
                      }}>
                        {hasResult && !isNaN(breakEven) ? fmt(breakEven) : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Markup / Margin quick-set */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 4 }}>Target Markup %</div>
                      <div style={{ display: "flex", gap: 5 }}>
                        <input
                          type="number"
                          value={targetMarkup}
                          onChange={(e) => {
                            const val = e.target.value; setTargetMarkup(val);
                            const mk = parseFloat(val);
                            if (!isNaN(mk) && cost > 0 && R > 0)
                              setSellingPrice(((cost * (1 + mk / 100) + shipping + packaging + fixed) / R).toFixed(2));
                          }}
                          onFocus={() => setEditingMarkup(true)}
                          onBlur={() => setEditingMarkup(false)}
                          onKeyDown={(e) => e.key === "Enter" && calcPriceFromMarkup()}
                          placeholder="e.g. 50"
                          style={{ ...CI, flex: 1 }}
                        />
                        <button onClick={calcPriceFromMarkup} style={{ ...SMALL_BUTTON_STYLE, padding: "7px 10px", fontSize: 11 }}>Set</button>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 4 }}>Target Margin %</div>
                      <div style={{ display: "flex", gap: 5 }}>
                        <input
                          type="number"
                          value={targetMargin}
                          onChange={(e) => {
                            const val = e.target.value; setTargetMargin(val);
                            const mg = parseFloat(val);
                            if (!isNaN(mg) && mg < 100 && R > 0) {
                              const denom = R - mg / 100;
                              if (denom > 0) setSellingPrice(((fixed + cost + shipping + packaging) / denom).toFixed(2));
                            }
                          }}
                          onFocus={() => setEditingMargin(true)}
                          onBlur={() => setEditingMargin(false)}
                          onKeyDown={(e) => e.key === "Enter" && calcPriceFromMargin()}
                          placeholder="e.g. 20"
                          style={{ ...CI, flex: 1 }}
                        />
                        <button onClick={calcPriceFromMargin} style={{ ...SMALL_BUTTON_STYLE, padding: "7px 10px", fontSize: 11 }}>Set</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Results ── */}
                {hasResult ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <ResultPill label="Profit" value={fmt(profit)}    positive={profit > 0 ? true : profit < 0 ? false : null} />
                      <ResultPill label="Margin" value={fmtPct(margin)} positive={margin > 0 ? true : margin < 0 ? false : null} />
                      <ResultPill label="Markup" value={fmtPct(markup)} positive={markup > 0 ? true : markup < 0 ? false : null} />
                    </div>
                    <button onClick={handleSave} style={{
                      ...BUTTON_BASE,
                      background: savedFlash ? "#166534" : "#135DFF",
                      color: "#fff", width: "100%", textAlign: "center",
                      boxShadow: savedFlash ? "0 0 16px rgba(22,101,52,0.4)" : "0 0 18px rgba(19,93,255,0.28)"
                    }}>
                      {savedFlash ? "✓ Saved!" : "Save Product"}
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#374151", textAlign: "center", padding: "10px 0" }}>
                    Enter item cost &amp; selling price to see results
                  </div>
                )}
              </div>

              {/* ─── Right: Market Snapshot ───────────────────────────────── */}
              <div style={{
                background: "#0A1628",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16, padding: "14px 16px"
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 14 }}>
                  Market Snapshot
                </div>
                <MarketSnapshot data={smData} price={price} loading={smLoading} error={smError} />
              </div>
            </div>

            {/* ── Horizontal pricing band (when data loaded) ─────────────── */}
            {smData && !smLoading && (
              <HorizontalPricingBand data={smData} price={price} />
            )}
          </>}

        </div>
      )}
    </>
  );
}
