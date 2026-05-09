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

export default function PriceCalculator({ onSave, onLoadHandled, products, onDeleteProduct, onLoadProduct, isPro = true }) {
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
      {innerPage === "calculator" && <div style={{ display: "grid", gap: 28 }}>

      {/* ── Smart Pricing — HERO at top ── */}
      <SmartPricing sellingPrice={sellingPrice} isPro={isPro} />

      {/* ── Section divider ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        <span style={{ fontSize: 11, color: "#374151", fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" }}>
          Profit Calculator
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* ── Calculator grid ── */}
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

    </div>}
    </>
  );
}

// ─── Smart Pricing ────────────────────────────────────────────────────────────

// Inject CSS keyframes once into <head>
(function injectSmartPricingStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("__sm-pricing-kf")) return;
  const s = document.createElement("style");
  s.id = "__sm-pricing-kf";
  s.textContent = `
    @keyframes smPulseDot {
      0%,100% { opacity:1; box-shadow:0 0 6px #4ade80; }
      50%      { opacity:0.3; box-shadow:0 0 14px #4ade80; }
    }
    @keyframes smFadeUp {
      from { opacity:0; transform:translateY(8px); }
      to   { opacity:1; transform:translateY(0); }
    }
  `;
  document.head.appendChild(s);
})();

const fmtGBP = (v) => v != null && !isNaN(v) ? `£${Number(v).toFixed(2)}` : "—";

// ── Locked (non-Pro) state ────────────────────────────────────────────────────

function SmartPricingLocked() {
  return (
    <div style={{
      background: "linear-gradient(135deg, #070D18 0%, #0A1628 50%, #070D18 100%)",
      border: "1px solid rgba(19,93,255,0.18)",
      borderRadius: 24, position: "relative", overflow: "hidden"
    }}>

      {/* Blurred preview */}
      <div style={{
        padding: "28px 28px 24px",
        filter: "blur(5px)", pointerEvents: "none", userSelect: "none", opacity: 0.4
      }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          <div style={{ flex: 1, height: 46, background: "#0D2040", borderRadius: 12 }} />
          <div style={{ width: 140, height: 46, background: "#135DFF", borderRadius: 12 }} />
        </div>
        {/* Fake gauge — matches PriceGauge cx=200, cy=200, R=178 */}
        <svg viewBox="0 0 400 220" style={{ width: "100%", display: "block", marginBottom: 8 }}>
          <path d="M 22 200 A 178 178 0 0 1 200 22"   fill="none" stroke="#22c55e" strokeWidth={22} strokeLinecap="butt" opacity={0.7} />
          <path d="M 200 22  A 178 178 0 0 1 326 74"  fill="none" stroke="#fbbf24" strokeWidth={22} strokeLinecap="butt" opacity={0.7} />
          <path d="M 326 74  A 178 178 0 0 1 378 200" fill="none" stroke="#ef4444" strokeWidth={22} strokeLinecap="butt" opacity={0.7} />
          <line x1="200" y1="200" x2="245" y2="61" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
          <circle cx="200" cy="200" r="9"   fill="#0D1B36" stroke="#93c5fd" strokeWidth="2" />
          <circle cx="200" cy="200" r="3.5" fill="#93c5fd" />
        </svg>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {["£12.49", "£22.40", "£26.80", "£54.99", "47"].map((v, i) => (
            <div key={i} style={{ background: "#081322", borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
              <div style={{ height: 8, background: "#1a2a42", borderRadius: 4, margin: "0 auto 8px", width: "60%" }} />
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lock overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(7,13,24,0.55) 0%, rgba(7,13,24,0.88) 100%)",
        backdropFilter: "blur(2px)", borderRadius: 24,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 24px"
      }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>

          <div style={{ fontSize: 36, marginBottom: 14, filter: "drop-shadow(0 0 14px rgba(19,93,255,0.5))" }}>
            🔒
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#ffffff" }}>Smart eBay Pricing</span>
            <span style={{
              fontSize: 10, fontWeight: 800, color: "#135DFF",
              background: "rgba(19,93,255,0.2)", border: "1px solid rgba(19,93,255,0.4)",
              borderRadius: 6, padding: "3px 9px", letterSpacing: 0.8
            }}>PRO</span>
          </div>

          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 24, lineHeight: 1.65 }}>
            Get live eBay UK market data to price your listings<br />competitively and maximise profit.
          </div>

          <div style={{
            display: "inline-grid", gap: 8, textAlign: "left",
            marginBottom: 28, padding: "18px 24px",
            background: "rgba(19,93,255,0.06)", border: "1px solid rgba(19,93,255,0.12)",
            borderRadius: 16
          }}>
            {[
              "Active market analysis",
              "Competitive price positioning",
              "Market averages & median pricing",
              "Smart visual pricing meter",
              "eBay active listing intelligence"
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "#9ca3af" }}>
                <span style={{ color: "#4ade80", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>✔</span>
                {item}
              </div>
            ))}
          </div>

          <div>
            <button style={{
              ...BUTTON_BASE,
              background: "linear-gradient(135deg, #135DFF 0%, #0ea5e9 100%)",
              color: "#fff", fontSize: 15, fontWeight: 800,
              padding: "13px 36px",
              boxShadow: "0 0 28px rgba(19,93,255,0.45)",
              display: "inline-block"
            }}>
              Upgrade to Pro →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Active Smart Pricing ──────────────────────────────────────────────────────

function SmartPricing({ sellingPrice, isPro }) {
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

  if (!isPro) return <SmartPricingLocked />;

  return (
    <div style={{
      background: "linear-gradient(135deg, #080F1E 0%, #0D1B36 45%, #080F1E 100%)",
      border: "1px solid rgba(19,93,255,0.22)",
      borderRadius: 24, padding: "28px 28px 26px",
      position: "relative", overflow: "hidden",
      boxShadow: "0 0 0 1px rgba(19,93,255,0.08), 0 8px 40px rgba(0,0,0,0.45)"
    }}>

      {/* Ambient glow accents */}
      <div style={{
        position: "absolute", top: -80, right: -80, width: 320, height: 320,
        background: "radial-gradient(circle, rgba(19,93,255,0.07) 0%, transparent 65%)",
        pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute", bottom: -60, left: -60, width: 220, height: 220,
        background: "radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 65%)",
        pointerEvents: "none"
      }} />

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", gap: 16, marginBottom: 22
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", letterSpacing: -0.4 }}>
              Smart eBay Pricing
            </span>
            <span style={{
              fontSize: 10, fontWeight: 800, color: "#135DFF",
              background: "rgba(19,93,255,0.15)", border: "1px solid rgba(19,93,255,0.35)",
              borderRadius: 6, padding: "2px 8px", letterSpacing: 0.8
            }}>PRO</span>
            {smData && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 10, fontWeight: 700, color: "#4ade80",
                background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)",
                borderRadius: 20, padding: "2px 9px"
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#4ade80",
                  display: "inline-block",
                  animation: "smPulseDot 2s ease-in-out infinite"
                }} />
                LIVE
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.55 }}>
            Compare your price against active eBay UK listings in real time.
          </div>
        </div>

        {smData && (
          <div style={{
            flexShrink: 0, textAlign: "right",
            background: "rgba(19,93,255,0.06)", border: "1px solid rgba(19,93,255,0.12)",
            borderRadius: 12, padding: "8px 14px"
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#93c5fd", lineHeight: 1 }}>
              {smData.priceCount}
            </div>
            <div style={{ fontSize: 10, color: "#4b5563", marginTop: 3, fontWeight: 600 }}>
              listings · eBay UK
            </div>
          </div>
        )}
      </div>

      {/* ── Search row ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: smData || smError || smLoading ? 28 : 0 }}>
        <TextInput
          value={smQuery}
          onChange={(e) => setSmQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !smLoading && handleFetch()}
          placeholder="e.g. LR013487 oil pump, timing belt kit BMW E90"
          style={{ flex: 1 }}
        />
        <button
          onClick={handleFetch}
          disabled={smLoading || !smQuery.trim()}
          style={{
            ...BUTTON_BASE,
            padding: "10px 26px",
            background: smLoading || !smQuery.trim() ? "#0D2040" : "#135DFF",
            color: "#fff",
            opacity: smLoading || !smQuery.trim() ? 0.5 : 1,
            whiteSpace: "nowrap", flexShrink: 0,
            boxShadow: smLoading || !smQuery.trim() ? "none" : "0 0 20px rgba(19,93,255,0.4)"
          }}
        >
          {smLoading ? "Fetching…" : "🔍 Fetch Prices"}
        </button>
      </div>

      {/* ── Error ── */}
      {smError && (
        <div style={{
          background: "#0D1428", color: "#fca5a5",
          border: "1px solid rgba(220,38,38,0.3)", borderRadius: 12,
          padding: "10px 16px", fontSize: 13, marginBottom: 24
        }}>
          ⚠ {smError}
        </div>
      )}

      {/* ── Loading ── */}
      {smLoading && (
        <div style={{ textAlign: "center", padding: "44px 0", color: "#374151", fontSize: 13 }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
          Fetching live eBay UK market data…
        </div>
      )}

      {/* ── Results: gauge + stat cards ── */}
      {!smLoading && smData && smData.priceCount > 0 && (
        <div style={{ display: "grid", gap: 20, animation: "smFadeUp 0.4s ease" }}>
          <PriceGauge data={smData} price={price} />
          <MarketStatCards data={smData} />
          <div style={{ fontSize: 11, color: "#374151", textAlign: "center" }}>
            Based on first-page active eBay UK listings only.
            {smData.resultCount > smData.priceCount && (
              <span> ({smData.resultCount - smData.priceCount} listings had no price data.)</span>
            )}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!smLoading && !smData && !smError && (
        <div style={{
          background: "rgba(8,19,34,0.6)",
          border: "1px dashed rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "40px 24px", marginTop: 20,
          textAlign: "center"
        }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📊</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
            No market data yet
          </div>
          <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
            Enter a part number or product name above to pull<br />
            live pricing from active eBay UK listings.
          </div>
        </div>
      )}

    </div>
  );
}

// ─── AI pricing verdict ───────────────────────────────────────────────────────

function getPricingVerdict(price, data) {
  if (!price || price <= 0 || !data) return null;
  const { low, high, median, average } = data;
  const range = high - low;
  if (range <= 0) return null;

  const p    = (price - low)    / range;
  const pMed = (median  - low)  / range;
  const pAvg = (average - low)  / range;

  if (price < low * 0.9)
    return { text: "Your price is well below the cheapest active listing. There may be room to increase your margin without impacting conversion.", color: "#93c5fd", icon: "💡" };
  if (price < low)
    return { text: "Your price undercuts the current market low. You will almost certainly convert, but consider testing a slightly higher price point.", color: "#93c5fd", icon: "💡" };
  if (p <= pMed * 0.55)
    return { text: "Your price is highly competitive and well below most active sellers. Excellent conversion potential at this level.", color: "#4ade80", icon: "✦" };
  if (p <= pMed)
    return { text: "Your price is competitive and sits below the market median. A strong position that balances conversion rate with healthy margin.", color: "#4ade80", icon: "✦" };
  if (p <= (pMed + pAvg) / 2)
    return { text: "Your price is close to the market median — a balanced position. A slight reduction could sharpen your competitive edge.", color: "#a3e635", icon: "◈" };
  if (p <= pAvg)
    return { text: "Your price is aligned with the market average and in line with most active sellers at this price point.", color: "#fbbf24", icon: "◈" };
  if (p <= pAvg + (1 - pAvg) * 0.35)
    return { text: "Your price is above the market average. Conversion may be impacted. A modest reduction toward the median is worth testing.", color: "#fb923c", icon: "⚑" };
  if (price <= high)
    return { text: "Your price is among the highest active listings. Only strong brand presence or unique listing quality will support conversion here.", color: "#f87171", icon: "⚑" };
  return { text: "Your price exceeds all active listings in this market. A significant reduction is recommended to remain competitive.", color: "#f87171", icon: "⚑" };
}

// ─── Price Gauge (speedometer) ───────────────────────────────────────────────

function PriceGauge({ data, price }) {
  // ── Gauge geometry ────────────────────────────────────────────────────────
  // SVG is used ONLY for the arc visual (zones + zone labels + needle + pivot).
  // All outer text labels (LOW / MED / AVG / HIGH) live in HTML below the SVG
  // so they can never overflow the viewBox or collide inside the arc area.
  const VW = 400, VH = 220;
  const cx = 200, cy = 200;  // centre of semicircle — near bottom of viewBox
  const R  = 178;             // arc radius
  const SW = 22;              // arc stroke width
  const NL = 144;             // needle length (clears inner edge of arc)

  const range = data.high - data.low;
  const safeP = (v) => range > 0
    ? Math.min(0.97, Math.max(0.03, (v - data.low) / range))
    : 0.5;

  const pMed  = safeP(data.median);
  const pAvg  = safeP(data.average);
  const pUser = (price > 0 && range > 0)
    ? Math.min(1.0, Math.max(0.0, (price - data.low) / range))
    : null;

  // p (0→1) → SVG point on semicircle (clockwise, left→right via top)
  const pToXY = (p, r = R) => {
    const a = Math.PI * (1 + p);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  // SVG arc path from p0 to p1
  const arc = (p0, p1, r = R) => {
    const s = pToXY(p0, r), e = pToXY(p1, r);
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${(p1 - p0) > 0.5 ? 1 : 0} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  };

  // p → horizontal % within arc span (accounts for arc curvature)
  // At p=0: 0%, p=0.5: 50%, p=1: 100% — matches actual x-position on arc
  const arcHPct = (p) => ((1 - Math.cos(p * Math.PI)) / 2) * 100;

  // Margins for the HTML label row — align it to arc endpoints
  const arcLeftPct  = ((cx - R) / VW) * 100;          // ≈ 5.5%
  const arcRightPct = ((VW - (cx + R)) / VW) * 100;   // ≈ 5.5%

  const needleRotation = pUser !== null ? (pUser - 0.5) * 180 : 0;
  const posColor =
    pUser === null ? "#4b5563" :
    pUser <= pMed  ? "#22c55e" :
    pUser <= pAvg  ? "#fbbf24" :
    "#ef4444";

  // Label collision: if MED and AVG are within 15% of horizontal span, merge them
  const mMedPct       = arcHPct(pMed);
  const mAvgPct       = arcHPct(pAvg);
  const labelsCollide = Math.abs(mMedPct - mAvgPct) < 15;

  const midGreen  = pMed / 2;
  const midYellow = (pMed + pAvg) / 2;
  const midRed    = (pAvg + 1) / 2;

  const verdict = getPricingVerdict(price, data);

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>

      {/* ── SVG: arc zones + zone labels + needle + pivot ONLY ── */}
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ width: "100%", display: "block" }}
        aria-label="Pricing gauge"
      >
        <defs>
          <filter id="smNeedleGlow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Depth shadow */}
        <path d={arc(0, 1)} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={SW + 10} strokeLinecap="butt" />
        {/* Background track */}
        <path d={arc(0, 1)} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={SW + 2} strokeLinecap="butt" />

        {/* Coloured zone arcs */}
        <path d={arc(0,    pMed)} fill="none" stroke="#22c55e" strokeWidth={SW} strokeLinecap="butt" opacity={0.9} />
        <path d={arc(pMed, pAvg)} fill="none" stroke="#fbbf24" strokeWidth={SW} strokeLinecap="butt" opacity={0.9} />
        <path d={arc(pAvg, 1   )} fill="none" stroke="#ef4444" strokeWidth={SW} strokeLinecap="butt" opacity={0.9} />

        {/* Inner glow overlay */}
        <path d={arc(0,    pMed)} fill="none" stroke="#4ade80" strokeWidth={SW - 14} strokeLinecap="butt" opacity={0.2} />
        <path d={arc(pMed, pAvg)} fill="none" stroke="#fde68a" strokeWidth={SW - 14} strokeLinecap="butt" opacity={0.2} />
        <path d={arc(pAvg, 1   )} fill="none" stroke="#fca5a5" strokeWidth={SW - 14} strokeLinecap="butt" opacity={0.2} />

        {/* Zone dividers */}
        {[pMed, pAvg].map((p, i) => {
          const inner = pToXY(p, R - SW / 2 - 3);
          const outer = pToXY(p, R + SW / 2 + 3);
          return (
            <line key={i}
              x1={inner.x.toFixed(1)} y1={inner.y.toFixed(1)}
              x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
              stroke="#080F1E" strokeWidth={3}
            />
          );
        })}

        {/* Zone name labels — inside arc, short text to avoid overflow */}
        {[
          { p: midGreen,  text: "VALUE",   color: "#4ade80" },
          { p: midYellow, text: "FAIR",    color: "#fde68a" },
          { p: midRed,    text: "PRICEY",  color: "#fca5a5" },
        ].map(({ p, text, color }) => {
          const pos = pToXY(p, R);
          return (
            <text key={text}
              x={pos.x.toFixed(1)} y={(pos.y + 4).toFixed(1)}
              fill={color} fillOpacity={0.8}
              fontSize="9" fontWeight="900" textAnchor="middle"
              fontFamily="Arial, sans-serif" letterSpacing="0.8"
            >{text}</text>
          );
        })}

        {/* Needle — drawn pointing up, CSS-rotated to price position */}
        <g
          filter="url(#smNeedleGlow)"
          style={{
            transform: `rotate(${needleRotation}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: pUser !== null
              ? "transform 0.75s cubic-bezier(0.34, 1.56, 0.64, 1)"
              : "none"
          }}
        >
          <line x1={cx} y1={cy} x2={cx} y2={cy - NL}
            stroke="rgba(0,0,0,0.5)" strokeWidth={5} strokeLinecap="round"
            style={{ transform: "translate(1.5px, 2.5px)" }}
          />
          <line x1={cx} y1={cy} x2={cx} y2={cy - NL}
            stroke={posColor} strokeWidth={3} strokeLinecap="round"
          />
          <line x1={cx} y1={cy} x2={cx} y2={cy - NL * 0.62}
            stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} strokeLinecap="round"
          />
        </g>

        {/* Pivot */}
        <circle cx={cx} cy={cy} r={14} fill="#080F1E" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={9}  fill="#0D1B36"
          stroke={pUser !== null ? posColor : "#374151"} strokeWidth={2}
        />
        <circle cx={cx} cy={cy} r={3.5} fill={pUser !== null ? posColor : "#374151"} />
      </svg>

      {/* ── HTML label row — aligned to arc endpoints, no SVG text issues ── */}
      <div style={{
        position: "relative",
        height: 46,
        marginLeft:  `${arcLeftPct}%`,
        marginRight: `${arcRightPct}%`,
        marginTop: 4,
      }}>
        {/* LOW — pinned to left endpoint */}
        <div style={{ position: "absolute", left: 0, textAlign: "left" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#22c55e", letterSpacing: 0.6, opacity: 0.7, textTransform: "uppercase" }}>Low</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#22c55e" }}>{fmtGBP(data.low)}</div>
        </div>

        {/* MED + AVG — mid positions, with collision fallback */}
        {labelsCollide ? (
          <div style={{
            position: "absolute",
            left: `${(mMedPct + mAvgPct) / 2}%`,
            transform: "translateX(-50%)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.6, opacity: 0.7, textTransform: "uppercase", whiteSpace: "nowrap" }}>Avg / Med</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af", whiteSpace: "nowrap" }}>
              {fmtGBP(data.average)} / {fmtGBP(data.median)}
            </div>
          </div>
        ) : (
          <>
            <div style={{
              position: "absolute",
              left: `${mMedPct}%`,
              transform: "translateX(-50%)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.6, opacity: 0.7, textTransform: "uppercase" }}>Med</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#9ca3af" }}>{fmtGBP(data.median)}</div>
            </div>
            <div style={{
              position: "absolute",
              left: `${mAvgPct}%`,
              transform: "translateX(-50%)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.6, opacity: 0.7, textTransform: "uppercase" }}>Avg</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#9ca3af" }}>{fmtGBP(data.average)}</div>
            </div>
          </>
        )}

        {/* HIGH — pinned to right endpoint */}
        <div style={{ position: "absolute", right: 0, textAlign: "right" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", letterSpacing: 0.6, opacity: 0.7, textTransform: "uppercase" }}>High</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#ef4444" }}>{fmtGBP(data.high)}</div>
        </div>
      </div>

      {/* ── User price — large centred HTML element, below label row ── */}
      <div style={{ textAlign: "center", marginTop: 18, minHeight: 52 }}>
        {pUser !== null ? (
          <>
            <div style={{
              fontSize: 34, fontWeight: 900, color: posColor,
              letterSpacing: "-0.5px", lineHeight: 1
            }}>
              {fmtGBP(price)}
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "#4b5563",
              letterSpacing: 1.2, marginTop: 5, textTransform: "uppercase"
            }}>
              Your Price
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: "#374151", paddingTop: 14 }}>
            Enter a selling price to see where you stand
          </div>
        )}
      </div>

      {/* ── AI verdict ── */}
      {verdict && (
        <div style={{
          marginTop: 18,
          padding: "14px 18px",
          background: `${verdict.color}0d`,
          border: `1px solid ${verdict.color}22`,
          borderRadius: 14,
          display: "flex", alignItems: "flex-start", gap: 12
        }}>
          <span style={{ fontSize: 17, flexShrink: 0, marginTop: 1 }}>{verdict.icon}</span>
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700, color: verdict.color,
              letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase"
            }}>
              Pricing Intelligence
            </div>
            <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>
              {verdict.text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Market Stat Cards ────────────────────────────────────────────────────────

function MarketStatCards({ data }) {
  const cards = [
    { label: "Lowest Price",      value: fmtGBP(data.low),        color: "#22c55e", border: "rgba(34,197,94,0.2)"   },
    { label: "Median Price",      value: fmtGBP(data.median),     color: "#ffffff", border: "rgba(255,255,255,0.08)" },
    { label: "Average Price",     value: fmtGBP(data.average),    color: "#e2e8f0", border: "rgba(255,255,255,0.08)" },
    { label: "Highest Price",     value: fmtGBP(data.high),       color: "#f87171", border: "rgba(248,113,113,0.2)"  },
    { label: "Listings Analysed", value: String(data.priceCount), color: "#93c5fd", border: "rgba(147,197,253,0.15)" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
      {cards.map(({ label, value, color, border }) => (
        <div key={label} style={{
          background: "#081322", border: `1px solid ${border}`,
          borderRadius: 16, padding: "14px 10px",
          textAlign: "center", animation: "smFadeUp 0.35s ease"
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: "#4b5563",
            textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 7
          }}>
            {label}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
