import React, { memo, useState, useEffect } from "react";
import { useSessionState } from "./useSessionState.js";
import {
  Card,
  FieldLabel,
  TextInput,
  BUTTON_BASE,
  SMALL_BUTTON_STYLE,
  INPUT_STYLE
} from "./shared.jsx";
import SavedProducts from "./SavedProducts.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const fmt = (n) => {
  if (n === null || isNaN(n)) return "—";
  const abs = Math.abs(n).toFixed(2);
  return n < 0 ? `-£${abs}` : `£${abs}`;
};

const fmtPct = (n) => {
  if (n === null || isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
};

const StatCard = memo(function StatCard({ label, value, sub, positive }) {
  const color =
    positive === true ? "#4ade80" : positive === false ? "#f87171" : "#ffffff";
  const borderColor =
    positive === true
      ? "rgba(74,222,128,0.20)"
      : positive === false
      ? "rgba(248,113,113,0.20)"
      : "rgba(255,255,255,0.10)";

  return (
    <div
      style={{
        background: "#081322",
        border: `1px solid ${borderColor}`,
        borderRadius: 20,
        padding: "16px 12px",
        textAlign: "center",
        flex: 1
      }}
    >
      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 5 }}>{sub}</div>}
    </div>
  );
});

const BreakdownRow = memo(function BreakdownRow({
  label,
  value,
  isCost = false,
  isTotal = false
}) {
  const color = isTotal
    ? value.startsWith("-")
      ? "#f87171"
      : "#4ade80"
    : isCost
    ? "#f87171"
    : "#ffffff";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: isTotal ? "12px 0 4px" : "9px 0",
        borderTop: isTotal ? "1px solid rgba(255,255,255,0.12)" : "none",
        borderBottom: isTotal ? "none" : "1px solid rgba(255,255,255,0.05)"
      }}
    >
      <span style={{ fontSize: isTotal ? 15 : 14, color: "#9ca3af", fontWeight: isTotal ? 700 : 400 }}>
        {label}
      </span>
      <span style={{ fontSize: isTotal ? 18 : 15, fontWeight: isTotal ? 800 : 600, color }}>
        {isCost && value !== "—" ? `-${value}` : value}
      </span>
    </div>
  );
});

const INLINE_INPUT = {
  ...INPUT_STYLE,
  padding: "10px 12px",
  fontSize: 14,
  borderRadius: 12
};

export default function PriceCalculator({ onSave, onLoadHandled, products, onDeleteProduct, onLoadProduct }) {
  const [innerPage, setInnerPage] = useState("calculator");
  const savedCount = products?.length ?? 0;
  const [productName, setProductName] = useSessionState("jsk_calc_product_name", "");
  const [itemCost, setItemCost] = useSessionState("jsk_calc_item_cost", "");
  const [shippingCost, setShippingCost] = useSessionState("jsk_calc_shipping", "");
  const [sellingPrice, setSellingPrice] = useSessionState("jsk_calc_selling", "");
  const [fvfPct, setFvfPct] = useSessionState("jsk_calc_fvf", "12.8");
  const [fixedFee, setFixedFee] = useSessionState("jsk_calc_fixed_fee", "0.30");
  const [promoPct, setPromoPct] = useSessionState("jsk_calc_promo", "0");
  const [vatRegistered, setVatRegistered] = useSessionState("jsk_calc_vat", true);
  const [targetMarkup, setTargetMarkup] = useSessionState("jsk_calc_markup", "");
  const [targetMargin, setTargetMargin] = useSessionState("jsk_calc_margin", "");
  const [editingMarkup, setEditingMarkup] = useState(false);
  const [editingMargin, setEditingMargin] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const cost = parseFloat(itemCost) || 0;
  const shipping = parseFloat(shippingCost) || 0;
  const price = parseFloat(sellingPrice) || 0;
  const fvf = parseFloat(fvfPct) || 0;
  const fixed = parseFloat(fixedFee) || 0;
  const promo = parseFloat(promoPct) || 0;
  const vatRate = vatRegistered ? 20 / 120 : 0;

  const ebayFVF = price > 0 ? price * (fvf / 100) + fixed : 0;
  const ebayPromo = price * (promo / 100);
  const vatAmount = price * vatRate;
  const totalFees = ebayFVF + ebayPromo;
  const totalCosts = cost + shipping;

  const netRevenue = price - totalFees - vatAmount;
  const profit = netRevenue - totalCosts;
  const margin = price > 0 ? (profit / price) * 100 : NaN;
  const markup = cost > 0 ? (profit / cost) * 100 : NaN;

  const hasResult = price > 0 && cost > 0;

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

  if (onLoadHandled) {
    onLoadHandled(loadProduct);
  }

  const handleSave = () => {
    if (!hasResult || !onSave) return;
    onSave({
      name: productName.trim() || "Unnamed Product",
      itemCost: cost,
      shippingCost: shipping,
      sellingPrice: price,
      fvfPct: fvf,
      fixedFee: fixed,
      promoPct: promo,
      vatRegistered,
      profit,
      margin,
      markup,
      ebayFVF,
      ebayPromo,
      vatAmount
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  useEffect(() => {
    if (!editingMarkup && !isNaN(markup) && price > 0) {
      setTargetMarkup(markup.toFixed(1));
    }
  }, [markup, editingMarkup, price]);

  useEffect(() => {
    if (!editingMargin && !isNaN(margin) && price > 0) {
      setTargetMargin(margin.toFixed(1));
    }
  }, [margin, editingMargin, price]);

  function calcPriceFromMarkup() {
    const mk = parseFloat(targetMarkup);
    if (isNaN(mk) || cost <= 0) return;
    const R = 1 - fvf / 100 - promo / 100 - vatRate;
    if (R <= 0) return;
    const p = (cost * (1 + mk / 100) + shipping + fixed) / R;
    setSellingPrice(p.toFixed(2));
  }

  function calcPriceFromMargin() {
    const mg = parseFloat(targetMargin);
    if (isNaN(mg) || mg >= 100) return;
    const R = 1 - fvf / 100 - promo / 100 - vatRate;
    const denom = R - mg / 100;
    if (denom <= 0) return;
    const p = (fixed + cost + shipping) / denom;
    setSellingPrice(p.toFixed(2));
  }

  return (
    <>
      {/* ── Inner tab bar ── */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 20,
        background: "#0F1E35", borderRadius: 16, padding: 5,
        border: "1px solid rgba(255,255,255,0.08)"
      }}>
        {[
          { key: "calculator", label: "Calculator" },
          { key: "saved",      label: `Saved Products${savedCount ? ` (${savedCount})` : ""}` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setInnerPage(key)}
            style={{
              flex: 1, padding: "10px 16px", borderRadius: 12,
              border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
              background: innerPage === key ? "#135DFF" : "transparent",
              color:      innerPage === key ? "#ffffff" : "#9ca3af",
              boxShadow:  innerPage === key ? "0 0 14px rgba(19,93,255,0.28)" : "none",
              transition: "all 0.18s ease"
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Saved Products tab ── */}
      {innerPage === "saved" && (
        <SavedProducts
          products={products ?? []}
          onDelete={onDeleteProduct}
          onLoad={(product) => {
            setInnerPage("calculator");
            if (onLoadProduct) onLoadProduct(product);
          }}
        />
      )}

      {/* ── Calculator tab ── */}
      {innerPage === "calculator" && <div style={{ display: "grid", gap: 24 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "420px 1fr",
          gap: 24,
          alignItems: "start"
        }}
      >
      {/* Left column */}
      <div style={{ display: "grid", gap: 24 }}>
        <Card title="Your Costs" centeredTitle>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <FieldLabel>Product Name (optional)</FieldLabel>
              <TextInput
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Timing Belt Kit – Audi A4"
              />
            </div>
            <div>
              <FieldLabel>Item Cost (£)</FieldLabel>
              <TextInput
                type="number"
                value={itemCost}
                onChange={(e) => setItemCost(e.target.value)}
                placeholder="e.g. 12.50"
              />
            </div>
            <div>
              <FieldLabel>Shipping Cost you Pay (£)</FieldLabel>
              <TextInput
                type="number"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                placeholder="e.g. 3.99"
              />
            </div>
          </div>
        </Card>

        <Card
          title="eBay Fees"
          centeredTitle
          subtitle="Applied to the total selling price."
        >
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <FieldLabel>Final Value Fee %</FieldLabel>
              <TextInput
                type="number"
                value={fvfPct}
                onChange={(e) => setFvfPct(e.target.value)}
                placeholder="12.8"
              />
            </div>
            <div>
              <FieldLabel>Per-Order Fixed Fee (£)</FieldLabel>
              <TextInput
                type="number"
                value={fixedFee}
                onChange={(e) => setFixedFee(e.target.value)}
                placeholder="0.30"
              />
            </div>
            <div>
              <FieldLabel>Promoted Listings %</FieldLabel>
              <TextInput
                type="number"
                value={promoPct}
                onChange={(e) => setPromoPct(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </Card>

        <Card title="VAT" centeredTitle>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12
            }}
          >
            <span style={{ fontSize: 14, color: "#d1d5db" }}>
              VAT Registered (20%)
            </span>
            <button
              onClick={() => setVatRegistered((v) => !v)}
              style={{
                ...BUTTON_BASE,
                background: vatRegistered ? "#135DFF" : "#0D2040",
                color: "#fff",
                padding: "8px 22px",
                fontSize: 13,
                boxShadow: vatRegistered
                  ? "0 0 14px rgba(19,93,255,0.28)"
                  : "none"
              }}
            >
              {vatRegistered ? "ON" : "OFF"}
            </button>
          </div>
          {vatRegistered && (
            <div
              style={{
                marginTop: 12,
                fontSize: 13,
                color: "#6b7280",
                lineHeight: 1.6
              }}
            >
              Selling price is treated as inc. VAT. 20% VAT is deducted from
              your revenue before calculating profit.
            </div>
          )}
        </Card>
      </div>

      {/* Right column */}
      <div style={{ display: "grid", gap: 24 }}>
        <Card
          title="Selling Price"
          centeredTitle
          subtitle={
            vatRegistered
              ? "The price the buyer pays on eBay, including 20% VAT."
              : "The price the buyer pays on eBay."
          }
        >
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <FieldLabel>
                Selling Price (£) — {vatRegistered ? "inc. VAT" : "ex. VAT"}
              </FieldLabel>
              <TextInput
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="e.g. 29.99"
              />
            </div>

            <div
              style={{
                background: "#081322",
                borderRadius: 16,
                padding: 16,
                border: "1px solid rgba(255,255,255,0.08)"
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#9ca3af",
                  marginBottom: 12
                }}
              >
                Quick Set from Target
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12
                }}
              >
                <div>
                  <FieldLabel>Markup %</FieldLabel>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="number"
                      value={targetMarkup}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTargetMarkup(val);
                        const mk = parseFloat(val);
                        if (!isNaN(mk) && cost > 0) {
                          const R = 1 - fvf / 100 - promo / 100 - vatRate;
                          if (R > 0) setSellingPrice(((cost * (1 + mk / 100) + shipping + fixed) / R).toFixed(2));
                        }
                      }}
                      onFocus={() => setEditingMarkup(true)}
                      onBlur={() => setEditingMarkup(false)}
                      onKeyDown={(e) => e.key === "Enter" && calcPriceFromMarkup()}
                      placeholder="e.g. 50"
                      style={INLINE_INPUT}
                    />
                    <button
                      onClick={calcPriceFromMarkup}
                      style={{
                        ...SMALL_BUTTON_STYLE,
                        padding: "10px 14px",
                        whiteSpace: "nowrap"
                      }}
                    >
                      Set
                    </button>
                  </div>
                </div>
                <div>
                  <FieldLabel>Margin %</FieldLabel>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="number"
                      value={targetMargin}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTargetMargin(val);
                        const mg = parseFloat(val);
                        if (!isNaN(mg) && mg < 100) {
                          const R = 1 - fvf / 100 - promo / 100 - vatRate;
                          const denom = R - mg / 100;
                          if (denom > 0) setSellingPrice(((fixed + cost + shipping) / denom).toFixed(2));
                        }
                      }}
                      onFocus={() => setEditingMargin(true)}
                      onBlur={() => setEditingMargin(false)}
                      onKeyDown={(e) => e.key === "Enter" && calcPriceFromMargin()}
                      placeholder="e.g. 20"
                      style={INLINE_INPUT}
                    />
                    <button
                      onClick={calcPriceFromMargin}
                      style={{
                        ...SMALL_BUTTON_STYLE,
                        padding: "10px 14px",
                        whiteSpace: "nowrap"
                      }}
                    >
                      Set
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#4b5563", marginTop: 10 }}>
                Markup = profit ÷ item cost · Margin = profit ÷ selling price.
                Selling price updates live as you type.
              </div>
            </div>
          </div>
        </Card>

        <Card title="Results" centeredTitle glow={hasResult}>
          {!hasResult ? (
            <div
              style={{
                minHeight: 320,
                display: "grid",
                placeItems: "center",
                background: "#081322",
                border: "1px dashed rgba(255,255,255,0.12)",
                borderRadius: 20,
                color: "#9ca3af",
                fontSize: 15
              }}
            >
              Enter item cost and selling price to see results.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 18 }}>
              <button
                onClick={handleSave}
                style={{
                  ...BUTTON_BASE,
                  background: savedFlash ? "#166534" : "#135DFF",
                  color: "#fff",
                  width: "100%",
                  textAlign: "center",
                  boxShadow: savedFlash
                    ? "0 0 16px rgba(22,101,52,0.40)"
                    : "0 0 18px rgba(19,93,255,0.28)"
                }}
              >
                {savedFlash ? "✓ Saved!" : "Save Product"}
              </button>

              <div style={{ display: "flex", gap: 12 }}>
                <StatCard
                  label="Net Profit"
                  value={fmt(profit)}
                  positive={profit > 0 ? true : profit < 0 ? false : null}
                />
                <StatCard
                  label="Margin"
                  value={fmtPct(margin)}
                  sub="profit ÷ selling price"
                  positive={margin > 0 ? true : margin < 0 ? false : null}
                />
                <StatCard
                  label="Markup"
                  value={fmtPct(markup)}
                  sub="profit ÷ item cost"
                  positive={markup > 0 ? true : markup < 0 ? false : null}
                />
              </div>

              <div
                style={{
                  background: "#081322",
                  borderRadius: 20,
                  padding: "4px 16px 16px",
                  border: "1px solid rgba(255,255,255,0.08)"
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#9ca3af",
                    padding: "14px 0 6px"
                  }}
                >
                  Breakdown
                </div>

                <BreakdownRow
                  label={`Selling Price${vatRegistered ? " (inc. 20% VAT)" : ""}`}
                  value={fmt(price)}
                />
                {vatRegistered && (
                  <BreakdownRow
                    label="VAT (20%) → HMRC"
                    value={fmt(vatAmount)}
                    isCost
                  />
                )}
                <BreakdownRow
                  label={`eBay Final Value Fee (${fvf}% + £${fixed.toFixed(2)})`}
                  value={fmt(ebayFVF)}
                  isCost
                />
                {promo > 0 && (
                  <BreakdownRow
                    label={`eBay Promoted Listings (${promo}%)`}
                    value={fmt(ebayPromo)}
                    isCost
                  />
                )}
                <BreakdownRow label="Item Cost" value={fmt(cost)} isCost />
                {shipping > 0 && (
                  <BreakdownRow
                    label="Shipping Cost"
                    value={fmt(shipping)}
                    isCost
                  />
                )}
                <BreakdownRow
                  label="Net Profit"
                  value={fmt(profit)}
                  isTotal
                />
              </div>

              {vatRegistered && (
                <div
                  style={{
                    background: "#081322",
                    borderRadius: 16,
                    padding: "12px 16px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    fontSize: 13,
                    color: "#6b7280",
                    lineHeight: 1.6
                  }}
                >
                  Ex-VAT selling price:{" "}
                  <span style={{ color: "#9ca3af", fontWeight: 600 }}>
                    {fmt(price - vatAmount)}
                  </span>
                  {"  ·  "}
                  VAT collected:{" "}
                  <span style={{ color: "#9ca3af", fontWeight: 600 }}>
                    {fmt(vatAmount)}
                  </span>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>

      {/* ── Smart Pricing — full-width below grid ── */}
      <SmartPricing sellingPrice={sellingPrice} />

    </div>}
    </>
  );
}

// ─── Smart Pricing ────────────────────────────────────────────────────────────

const fmtGBP = (v) => v != null && !isNaN(v) ? `£${Number(v).toFixed(2)}` : "—";

function SmartPricing({ sellingPrice }) {
  const [smQuery,   setSmQuery]   = useSessionState("jsk_calc_sm_query", "");
  const [smData,    setSmData]    = useSessionState("jsk_calc_sm_data",  null);
  const [smLoading, setSmLoading] = useState(false);
  const [smError,   setSmError]   = useState("");

  const price = parseFloat(sellingPrice) || 0;

  const handleFetch = async () => {
    if (!smQuery.trim()) return;
    setSmLoading(true);
    setSmError("");
    try {
      const res  = await fetch(`${API_URL}/api/ebay/search-prices`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ query: smQuery.trim() })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch prices.");
      if (json.priceCount === 0) throw new Error("No active listings found — try a different search term.");
      setSmData(json);
    } catch (err) {
      setSmError(err.message);
      setSmData(null);
    } finally {
      setSmLoading(false);
    }
  };

  // Position of user's price on the LOW→HIGH track (0-100)
  const meterPct = smData && smData.low != null && smData.high > smData.low && price > 0
    ? Math.min(100, Math.max(0, ((price - smData.low) / (smData.high - smData.low)) * 100))
    : null;

  const posColor =
    meterPct === null ? "#9ca3af" :
    price <= smData.median  ? "#4ade80" :
    price <= smData.average ? "#fbbf24" :
    "#f87171";

  const posLabel =
    meterPct === null ? null :
    price < smData.low      ? "Below market low" :
    price > smData.high     ? "Above market high" :
    price <= smData.median  ? "Competitive — at or below median" :
    price <= smData.average ? "Above median — still reasonable" :
    "Above average — consider lowering";

  return (
    <Card title="Smart eBay Pricing" centeredTitle subtitle="Compare your price against active eBay UK listings.">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

        {/* ── Left: search + stats ── */}
        <div style={{ display: "grid", gap: 16 }}>

          {/* Search row */}
          <div>
            <FieldLabel>Search Term / OEM Number</FieldLabel>
            <div style={{ display: "flex", gap: 8 }}>
              <TextInput
                value={smQuery}
                onChange={(e) => setSmQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !smLoading && handleFetch()}
                placeholder="e.g. LR013487 oil pump"
              />
              <button
                onClick={handleFetch}
                disabled={smLoading || !smQuery.trim()}
                style={{
                  ...BUTTON_BASE,
                  padding: "10px 18px",
                  background: smLoading || !smQuery.trim() ? "#0D2040" : "#135DFF",
                  color: "#fff",
                  opacity: smLoading || !smQuery.trim() ? 0.55 : 1,
                  whiteSpace: "nowrap",
                  flexShrink: 0
                }}
              >
                {smLoading ? "Fetching…" : "Fetch Prices"}
              </button>
            </div>
          </div>

          {/* Error */}
          {smError && (
            <div style={{
              background: "#0D1428", color: "#fca5a5",
              border: "1px solid rgba(220,38,38,0.35)", borderRadius: 12,
              padding: "10px 14px", fontSize: 13
            }}>
              {smError}
            </div>
          )}

          {/* Stats grid */}
          {smData && smData.priceCount > 0 && (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Low",     value: smData.low,     color: "#4ade80" },
                  { label: "Median",  value: smData.median,  color: "#ffffff" },
                  { label: "Average", value: smData.average, color: "#ffffff" },
                  { label: "High",    value: smData.high,    color: "#f87171" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    background: "#081322",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14, padding: "12px 14px"
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: "#6b7280",
                      textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5
                    }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color }}>
                      {fmtGBP(value)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, color: "#4b5563" }}>
                Based on{" "}
                <span style={{ color: "#6b7280", fontWeight: 600 }}>{smData.priceCount}</span>
                {" "}priced listings from the first page of active eBay UK results.
                {smData.resultCount > smData.priceCount &&
                  ` (${smData.resultCount - smData.priceCount} listings had no price data.)`
                }
              </div>
            </div>
          )}

          {/* Empty state */}
          {!smData && !smError && !smLoading && (
            <div style={{
              background: "#081322",
              border: "1px dashed rgba(255,255,255,0.10)",
              borderRadius: 16, padding: "28px 20px",
              textAlign: "center", color: "#4b5563", fontSize: 13
            }}>
              Enter a search term to pull live eBay pricing data.
            </div>
          )}
        </div>

        {/* ── Right: price meter ── */}
        <div>
          {smData && smData.priceCount > 0 ? (
            <PriceMeter
              data={smData}
              price={price}
              meterPct={meterPct}
              posColor={posColor}
              posLabel={posLabel}
            />
          ) : (
            <div style={{
              background: "#081322",
              border: "1px dashed rgba(255,255,255,0.10)",
              borderRadius: 16, padding: "28px 20px",
              minHeight: 220,
              display: "grid", placeItems: "center",
              color: "#4b5563", fontSize: 13, textAlign: "center"
            }}>
              Price meter will appear<br />after fetching market data.
            </div>
          )}
        </div>

      </div>
    </Card>
  );
}

// ─── Price Meter ──────────────────────────────────────────────────────────────

function PriceMeter({ data, price, meterPct, posColor, posLabel }) {
  const hasPrice = price > 0;

  // Clamp indicator so the triangle stays inside the track edges
  const clampedPct = meterPct != null ? Math.min(95, Math.max(5, meterPct)) : null;

  // Positions of the median and average lines on the track
  const range = data.high - data.low;
  const medianPct  = range > 0 ? ((data.median  - data.low) / range) * 100 : 50;
  const averagePct = range > 0 ? ((data.average - data.low) / range) * 100 : 50;

  return (
    <div style={{
      background: "#081322",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, padding: "20px 20px 18px"
    }}>

      {/* Header */}
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 18 }}>
        Price Meter
      </div>

      {/* Low / High labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#4ade80" }}>{fmtGBP(data.low)}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#f87171" }}>{fmtGBP(data.high)}</span>
      </div>

      {/* Track + indicator */}
      <div style={{ position: "relative", height: 12, marginBottom: hasPrice ? 40 : 16 }}>

        {/* Gradient track */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 6,
          background: "linear-gradient(to right, #4ade80 0%, #fbbf24 55%, #f87171 100%)"
        }} />

        {/* Median reference line */}
        <div
          title={`Median: ${fmtGBP(data.median)}`}
          style={{
            position: "absolute",
            left: `${Math.min(97, Math.max(3, medianPct))}%`,
            top: -5, bottom: -5, width: 2,
            background: "rgba(255,255,255,0.55)", borderRadius: 1
          }}
        />

        {/* Average reference line */}
        <div
          title={`Average: ${fmtGBP(data.average)}`}
          style={{
            position: "absolute",
            left: `${Math.min(97, Math.max(3, averagePct))}%`,
            top: -5, bottom: -5, width: 2,
            background: "rgba(255,255,255,0.25)", borderRadius: 1,
            borderLeft: "2px dashed rgba(255,255,255,0.3)"
          }}
        />

        {/* Your price indicator */}
        {hasPrice && clampedPct !== null && (
          <div style={{
            position: "absolute",
            left: `${clampedPct}%`,
            transform: "translateX(-50%)",
            top: -2, pointerEvents: "none"
          }}>
            {/* Downward triangle */}
            <div style={{
              width: 0, height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: `12px solid ${posColor}`,
              filter: `drop-shadow(0 0 5px ${posColor}88)`
            }} />
            {/* Price label */}
            <div style={{
              position: "absolute", top: 16,
              left: "50%", transform: "translateX(-50%)",
              fontSize: 12, fontWeight: 800, color: posColor,
              whiteSpace: "nowrap",
              textShadow: "0 1px 6px rgba(0,0,0,0.9)"
            }}>
              {fmtGBP(price)}
            </div>
          </div>
        )}
      </div>

      {/* Position verdict */}
      {hasPrice && posLabel && (
        <div style={{
          textAlign: "center", fontSize: 13, fontWeight: 700,
          color: posColor, marginBottom: 14
        }}>
          {posLabel}
        </div>
      )}
      {!hasPrice && (
        <div style={{ textAlign: "center", fontSize: 12, color: "#4b5563", marginBottom: 14 }}>
          Enter a selling price in the calculator to see your position.
        </div>
      )}

      {/* Legend */}
      <div style={{
        display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap",
        borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12
      }}>
        {[
          { color: "rgba(255,255,255,0.55)", label: `Median ${fmtGBP(data.median)}`,  solid: true  },
          { color: "rgba(255,255,255,0.25)", label: `Average ${fmtGBP(data.average)}`, solid: false },
        ].map(({ color, label, solid }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 2, height: 14, background: solid ? color : "transparent",
              borderLeft: solid ? "none" : `2px dashed ${color}`,
              borderRadius: 1
            }} />
            <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
