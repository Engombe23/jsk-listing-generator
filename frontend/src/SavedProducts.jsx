import React, { memo, useState, useMemo } from "react";
import { SMALL_BUTTON_STYLE, BUTTON_BASE } from "./shared.jsx";

// ─── Formatters ───────────────────────────────────────────────────────────────

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
      day: "2-digit", month: "short", year: "numeric"
    });
  } catch { return "—"; }
};

const fmtRaw = (n) => (n == null || isNaN(n) ? "" : Number(n).toFixed(2));
const fmtPctRaw = (n) => (n == null || isNaN(n) ? "" : Number(n).toFixed(1));

// ─── Table styles ─────────────────────────────────────────────────────────────

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
  background: "#081322",
  textTransform: "uppercase",
  letterSpacing: "0.05em"
};

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function escCsv(v) {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// ─── Date filter helpers ──────────────────────────────────────────────────────

function filterByPeriod(products, period) {
  if (period === "all") return products;
  const now = new Date();
  return products.filter((p) => {
    if (!p.savedAt) return false;
    const d = new Date(p.savedAt);
    if (period === "day")   return d.toDateString() === now.toDateString();
    if (period === "week")  { const t = new Date(now); t.setDate(t.getDate() - 7);  return d >= t; }
    if (period === "month") { const t = new Date(now); t.setDate(t.getDate() - 30); return d >= t; }
    return true;
  });
}

// dateStr = "YYYY-MM-DD" or ""
function filterByCustomRange(products, fromStr, toStr) {
  return products.filter((p) => {
    if (!p.savedAt) return false;
    // compare calendar dates only (ignore time)
    const d = p.savedAt.slice(0, 10);
    if (fromStr && d < fromStr) return false;
    if (toStr   && d > toStr)   return false;
    return true;
  });
}

// Today's date as YYYY-MM-DD for default/max values
function todayStr() { return new Date().toISOString().slice(0, 10); }

// ─── Main component ───────────────────────────────────────────────────────────

export default function SavedProducts({ products, onDelete, onLoad }) {
  const [confirmId,   setConfirmId]   = useState(null);
  const [period,      setPeriod]      = useState("all");
  const [customFrom,  setCustomFrom]  = useState("");
  const [customTo,    setCustomTo]    = useState(todayStr());
  const [exportFlash, setExportFlash] = useState(false);

  // Counts for the preset period badges
  const counts = useMemo(() => ({
    day:   filterByPeriod(products, "day").length,
    week:  filterByPeriod(products, "week").length,
    month: filterByPeriod(products, "month").length,
    all:   products.length,
  }), [products]);

  const filtered = useMemo(() => {
    if (period === "custom") return filterByCustomRange(products, customFrom, customTo);
    return filterByPeriod(products, period);
  }, [products, period, customFrom, customTo]);

  // ── CSV export ──────────────────────────────────────────────────────────────
  const exportCsv = () => {
    if (!filtered.length) return;

    const COLS = [
      "Product",
      "Item Cost (£)", "Shipping (£)", "Sell Price (£)",
      "eBay Fees (£)", "VAT (£)",
      "Profit (£)", "Margin (%)", "Markup (%)",
      "Saved Date"
    ];

    const rows = filtered.map((p) => [
      p.name || "Unnamed",
      fmtRaw(p.itemCost),
      fmtRaw(p.shippingCost),
      fmtRaw(p.sellingPrice),
      fmtRaw((p.ebayFVF || 0) + (p.ebayPromo || 0)),
      p.vatRegistered ? fmtRaw(p.vatAmount) : "N/A",
      fmtRaw(p.profit),
      fmtPctRaw(p.margin),
      fmtPctRaw(p.markup),
      p.savedAt
        ? new Date(p.savedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : "—",
    ]);

    const csv = [COLS, ...rows].map((r) => r.map(escCsv).join(",")).join("\n");
    const label = period === "custom"
      ? `${customFrom || "start"}-to-${customTo || "end"}`
      : period;
    downloadCsv(csv, `saved-products-${label}.csv`);

    setExportFlash(true);
    setTimeout(() => setExportFlash(false), 1600);
  };

  // ── Empty states ────────────────────────────────────────────────────────────
  if (products.length === 0) {
    return (
      <div style={{
        minHeight: 360, display: "grid", placeItems: "center",
        background: "#0F1E35", border: "1px dashed rgba(255,255,255,0.10)",
        borderRadius: 24, color: "#9ca3af", fontSize: 15,
        textAlign: "center", padding: 40
      }}>
        <div>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 700, color: "#d1d5db", marginBottom: 8 }}>No saved products yet</div>
          <div style={{ fontSize: 14, color: "#6b7280" }}>
            Open the Calculator tab, fill in your costs and selling price, then click Save Product.
          </div>
        </div>
      </div>
    );
  }

  const PERIODS = [
    { key: "day",    label: "Today"   },
    { key: "week",   label: "Week"    },
    { key: "month",  label: "Month"   },
    { key: "all",    label: "All"     },
    { key: "custom", label: "Custom"  },
  ];

  // Date input shared style
  const DATE_INPUT = {
    background: "#0D2040", color: "#d1d5db",
    border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8,
    padding: "5px 9px", fontSize: 12, fontFamily: "inherit",
    outline: "none", cursor: "pointer",
    colorScheme: "dark",
  };

  return (
    <div style={{
      background: "#0F1E35", borderRadius: 24,
      border: "1px solid rgba(255,255,255,0.10)",
      boxShadow: "0 16px 36px rgba(0,0,0,0.28)",
      overflow: "hidden"
    }}>
      {/* ── Header + toolbar ── */}
      <div style={{
        padding: "18px 22px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap"
      }}>
        {/* Title + count */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff" }}>Saved Products</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 3 }}>
            {filtered.length === products.length
              ? `${products.length} product${products.length !== 1 ? "s" : ""} saved`
              : `${filtered.length} of ${products.length} shown`}
          </div>
        </div>

        {/* Period filter pills */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap",
          background: "#081322", borderRadius: 12, padding: 4,
          border: "1px solid rgba(255,255,255,0.07)"
        }}>
          {PERIODS.map(({ key, label }) => {
            const active = period === key;
            const count  = key !== "custom" ? counts[key] : null;
            return (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                style={{
                  padding: "6px 13px", borderRadius: 9,
                  border: "none", cursor: "pointer",
                  fontWeight: 700, fontSize: 12,
                  background: active ? "#135DFF" : "transparent",
                  color:      active ? "#ffffff"  : "#6b7280",
                  boxShadow:  active ? "0 0 12px rgba(19,93,255,0.30)" : "none",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap"
                }}
              >
                {label}
                {count > 0 && (
                  <span style={{
                    marginLeft: 5, fontSize: 10, fontWeight: 800,
                    background: active ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.09)",
                    color: active ? "#fff" : "#9ca3af",
                    borderRadius: 6, padding: "1px 5px"
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Custom date pickers — shown inline when Custom is active */}
          {period === "custom" && (
            <>
              <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.10)", margin: "2px 2px" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 4px" }}>
                <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>From</span>
                <input
                  type="date"
                  value={customFrom}
                  max={customTo || todayStr()}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  style={DATE_INPUT}
                />
                <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>To</span>
                <input
                  type="date"
                  value={customTo}
                  min={customFrom || undefined}
                  max={todayStr()}
                  onChange={(e) => setCustomTo(e.target.value)}
                  style={DATE_INPUT}
                />
              </div>
            </>
          )}
        </div>

        {/* Export button */}
        <button
          onClick={exportCsv}
          disabled={!filtered.length}
          style={{
            ...SMALL_BUTTON_STYLE,
            fontSize: 12, padding: "8px 16px",
            background: exportFlash
              ? "#16a34a"
              : filtered.length ? "#135DFF" : "#1f2937",
            boxShadow: exportFlash
              ? "0 0 20px rgba(22,163,74,0.45)"
              : filtered.length ? "0 0 16px rgba(19,93,255,0.28)" : "none",
            color:   filtered.length ? "#ffffff" : "#4b5563",
            cursor:  filtered.length ? "pointer"  : "default",
            transition: "background 0.18s ease, box-shadow 0.18s ease",
            whiteSpace: "nowrap"
          }}
        >
          {exportFlash ? "✓ Downloaded!" : `↓ Export CSV (${filtered.length})`}
        </button>
      </div>

      {/* ── Empty filter state ── */}
      {filtered.length === 0 ? (
        <div style={{
          padding: "48px 24px", textAlign: "center",
          color: "#6b7280", fontSize: 14
        }}>
          No products saved in this period.
        </div>
      ) : (
        /* ── Table ── */
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Product","Item Cost","Shipping","Sell Price","eBay Fees","VAT",
                  "Profit","Margin","Markup","Saved","Actions"].map((h) => (
                  <th key={h} style={{ ...HEADER_STYLE, textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr
                  key={product.id}
                  style={{
                    background: confirmId === product.id
                      ? "rgba(248,113,113,0.06)"
                      : "transparent",
                    transition: "background 0.15s"
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
                    ...COL_STYLE, fontWeight: 700,
                    color: product.profit > 0 ? "#4ade80" : product.profit < 0 ? "#f87171" : "#ffffff"
                  }}>
                    {fmt(product.profit)}
                  </td>
                  <td style={{
                    ...COL_STYLE, fontWeight: 600,
                    color: product.margin > 0 ? "#4ade80" : product.margin < 0 ? "#f87171" : "#ffffff"
                  }}>
                    {fmtPct(product.margin)}
                  </td>
                  <td style={{
                    ...COL_STYLE, fontWeight: 600,
                    color: product.markup > 0 ? "#4ade80" : product.markup < 0 ? "#f87171" : "#ffffff"
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
                          background: "#0D2040", color: "#d1d5db",
                          padding: "6px 12px", fontSize: 12,
                          border: "1px solid rgba(255,255,255,0.12)"
                        }}
                      >
                        Load
                      </button>
                      <button
                        onClick={() => {
                          if (confirmId === product.id) { onDelete(product.id); setConfirmId(null); }
                          else setConfirmId(product.id);
                        }}
                        style={{
                          ...BUTTON_BASE,
                          background: confirmId === product.id ? "#7f1d1d" : "transparent",
                          color: "#f87171", padding: "6px 12px", fontSize: 12,
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
      )}
    </div>
  );
}
