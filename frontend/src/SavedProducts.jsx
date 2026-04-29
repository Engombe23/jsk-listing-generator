import React, { memo, useState } from "react";
import { SMALL_BUTTON_STYLE, BUTTON_BASE } from "./shared.jsx";

const fmt = (n) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const abs = Math.abs(n).toFixed(2);
  return n < 0 ? `-£${abs}` : `£${abs}`;
};

const fmtPct = (n) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return `${Number(n).toFixed(1)}%`;
};

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return "—";
  }
};

const COL_STYLE = {
  padding: "12px 14px",
  fontSize: 14,
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  whiteSpace: "nowrap"
};

const HEADER_STYLE = {
  ...COL_STYLE,
  fontSize: 12,
  fontWeight: 700,
  color: "#9ca3af",
  background: "#0f1115",
  textTransform: "uppercase",
  letterSpacing: "0.05em"
};

function ProfitCell({ value }) {
  const n = Number(value);
  const color = n > 0 ? "#4ade80" : n < 0 ? "#f87171" : "#ffffff";
  return (
    <td style={{ ...COL_STYLE, color, fontWeight: 700 }}>{fmt(n)}</td>
  );
}

function PctCell({ value }) {
  const n = Number(value);
  const color = n > 0 ? "#4ade80" : n < 0 ? "#f87171" : "#ffffff";
  return (
    <td style={{ ...COL_STYLE, color, fontWeight: 600 }}>{fmtPct(n)}</td>
  );
}

const ProductRow = memo(function ProductRow({ product, onDelete, onLoad }) {
  return (
    <tr style={{ transition: "background 0.15s" }}>
      <td style={{ ...COL_STYLE, color: "#ffffff", fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
        {product.name || "Unnamed"}
      </td>
      <td style={{ ...COL_STYLE, color: "#d1d5db" }}>{fmt(product.itemCost)}</td>
      <td style={{ ...COL_STYLE, color: "#d1d5db" }}>{fmt(product.shippingCost)}</td>
      <td style={{ ...COL_STYLE, color: "#d1d5db" }}>{fmt(product.sellingPrice)}</td>
      <td style={{ ...COL_STYLE, color: "#f87171" }}>{fmt(product.ebayFVF + (product.ebayPromo || 0))}</td>
      {product.vatRegistered
        ? <td style={{ ...COL_STYLE, color: "#f87171" }}>{fmt(product.vatAmount)}</td>
        : <td style={{ ...COL_STYLE, color: "#4b5563" }}>N/A</td>
      }
      <ProfitCell value={product.profit} />
      <PctCell value={product.margin} />
      <PctCell value={product.markup} />
      <td style={{ ...COL_STYLE, color: "#6b7280", fontSize: 13 }}>{fmtDate(product.savedAt)}</td>
      <td style={{ ...COL_STYLE }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onLoad(product)}
            style={{
              ...BUTTON_BASE,
              background: "#1a1d22",
              color: "#d1d5db",
              padding: "6px 12px",
              fontSize: 12,
              border: "1px solid rgba(255,255,255,0.12)"
            }}
          >
            Load
          </button>
          <button
            onClick={() => onDelete(product.id)}
            style={{
              ...BUTTON_BASE,
              background: "transparent",
              color: "#f87171",
              padding: "6px 12px",
              fontSize: 12,
              border: "1px solid rgba(248,113,113,0.25)"
            }}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
});

export default function SavedProducts({ products, onDelete, onLoad }) {
  const [confirmId, setConfirmId] = useState(null);

  const handleDelete = (id) => {
    if (confirmId === id) {
      onDelete(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
    }
  };

  if (products.length === 0) {
    return (
      <div
        style={{
          minHeight: 360,
          display: "grid",
          placeItems: "center",
          background: "#111317",
          border: "1px dashed rgba(255,255,255,0.10)",
          borderRadius: 24,
          color: "#9ca3af",
          fontSize: 15,
          textAlign: "center",
          padding: 40
        }}
      >
        <div>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 700, color: "#d1d5db", marginBottom: 8 }}>No saved products yet</div>
          <div style={{ fontSize: 14, color: "#6b7280" }}>
            Open the Price Calculator, fill in your costs and selling price, then click Save Product.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#111317",
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 16px 36px rgba(0,0,0,0.28)",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          padding: "20px 22px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff" }}>
          Saved Products
        </div>
        <div style={{ fontSize: 14, color: "#9ca3af", marginTop: 4 }}>
          {products.length} product{products.length !== 1 ? "s" : ""} saved
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...HEADER_STYLE, textAlign: "left" }}>Product</th>
              <th style={{ ...HEADER_STYLE, textAlign: "left" }}>Item Cost</th>
              <th style={{ ...HEADER_STYLE, textAlign: "left" }}>Shipping</th>
              <th style={{ ...HEADER_STYLE, textAlign: "left" }}>Sell Price</th>
              <th style={{ ...HEADER_STYLE, textAlign: "left" }}>eBay Fees</th>
              <th style={{ ...HEADER_STYLE, textAlign: "left" }}>VAT</th>
              <th style={{ ...HEADER_STYLE, textAlign: "left" }}>Profit</th>
              <th style={{ ...HEADER_STYLE, textAlign: "left" }}>Margin</th>
              <th style={{ ...HEADER_STYLE, textAlign: "left" }}>Markup</th>
              <th style={{ ...HEADER_STYLE, textAlign: "left" }}>Saved</th>
              <th style={{ ...HEADER_STYLE, textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                style={{
                  background: confirmId === product.id
                    ? "rgba(248,113,113,0.06)"
                    : "transparent"
                }}
              >
                <td style={{ ...COL_STYLE, color: "#ffffff", fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {product.name || "Unnamed"}
                </td>
                <td style={{ ...COL_STYLE, color: "#d1d5db" }}>{fmt(product.itemCost)}</td>
                <td style={{ ...COL_STYLE, color: "#d1d5db" }}>{fmt(product.shippingCost)}</td>
                <td style={{ ...COL_STYLE, color: "#d1d5db" }}>{fmt(product.sellingPrice)}</td>
                <td style={{ ...COL_STYLE, color: "#f87171" }}>
                  {fmt((product.ebayFVF || 0) + (product.ebayPromo || 0))}
                </td>
                <td style={{ ...COL_STYLE, color: product.vatRegistered ? "#f87171" : "#4b5563" }}>
                  {product.vatRegistered ? fmt(product.vatAmount) : "N/A"}
                </td>
                <td style={{
                  ...COL_STYLE,
                  color: product.profit > 0 ? "#4ade80" : product.profit < 0 ? "#f87171" : "#ffffff",
                  fontWeight: 700
                }}>
                  {fmt(product.profit)}
                </td>
                <td style={{
                  ...COL_STYLE,
                  color: product.margin > 0 ? "#4ade80" : product.margin < 0 ? "#f87171" : "#ffffff",
                  fontWeight: 600
                }}>
                  {fmtPct(product.margin)}
                </td>
                <td style={{
                  ...COL_STYLE,
                  color: product.markup > 0 ? "#4ade80" : product.markup < 0 ? "#f87171" : "#ffffff",
                  fontWeight: 600
                }}>
                  {fmtPct(product.markup)}
                </td>
                <td style={{ ...COL_STYLE, color: "#6b7280", fontSize: 13 }}>
                  {fmtDate(product.savedAt)}
                </td>
                <td style={{ ...COL_STYLE }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => { onLoad(product); setConfirmId(null); }}
                      style={{
                        ...BUTTON_BASE,
                        background: "#1a1d22",
                        color: "#d1d5db",
                        padding: "6px 12px",
                        fontSize: 12,
                        border: "1px solid rgba(255,255,255,0.12)"
                      }}
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      style={{
                        ...BUTTON_BASE,
                        background: confirmId === product.id ? "#7f1d1d" : "transparent",
                        color: "#f87171",
                        padding: "6px 12px",
                        fontSize: 12,
                        border: "1px solid rgba(248,113,113,0.25)"
                      }}
                    >
                      {confirmId === product.id ? "Confirm?" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
