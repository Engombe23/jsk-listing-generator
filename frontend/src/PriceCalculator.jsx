import React, { memo, useState, useEffect } from "react";
import {
  Card,
  FieldLabel,
  TextInput,
  BUTTON_BASE,
  SMALL_BUTTON_STYLE,
  INPUT_STYLE
} from "./shared.jsx";

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
        background: "#0f1115",
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

export default function PriceCalculator({ onSave, onLoadHandled }) {
  const [productName, setProductName] = useState("");
  const [itemCost, setItemCost] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [fvfPct, setFvfPct] = useState("12.8");
  const [fixedFee, setFixedFee] = useState("0.30");
  const [promoPct, setPromoPct] = useState("0");
  const [vatRegistered, setVatRegistered] = useState(true);
  const [targetMarkup, setTargetMarkup] = useState("");
  const [targetMargin, setTargetMargin] = useState("");
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
                background: vatRegistered ? "#b70017" : "#1a1d22",
                color: "#fff",
                padding: "8px 22px",
                fontSize: 13,
                boxShadow: vatRegistered
                  ? "0 0 14px rgba(183,0,23,0.28)"
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
                background: "#0f1115",
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
                      onChange={(e) => setTargetMarkup(e.target.value)}
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
                      onChange={(e) => setTargetMargin(e.target.value)}
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
                Markup = profit ÷ item cost. Margin = profit ÷ selling price.
                Press Set or Enter to calculate the required selling price.
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
                background: "#0f1115",
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
                  background: savedFlash ? "#166534" : "#b70017",
                  color: "#fff",
                  width: "100%",
                  textAlign: "center",
                  boxShadow: savedFlash
                    ? "0 0 16px rgba(22,101,52,0.40)"
                    : "0 0 18px rgba(183,0,23,0.28)"
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
                  background: "#0f1115",
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
                    background: "#0f1115",
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
  );
}
