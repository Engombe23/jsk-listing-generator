import React, { useState } from "react";
import DOMPurify from "dompurify";
import { CopyButton, ReadOnlyTextarea } from "./shared.jsx";

// ─── Feature flag ─────────────────────────────────────────────────────────────
// Set to `true` to use the new tabbed workspace.
// Set to `false` to instantly fall back to the original ListingOutput.
export const USE_TABBED_PREVIEW = false;

// ─── HTML splitter helpers ────────────────────────────────────────────────────

/**
 * Returns the generated HTML with the "Compatible Vehicles" section removed.
 * Works by finding the heading div for that section and slicing everything
 * after it out, then closing the outer wrapper.
 */
export function stripCompatSection(html) {
  if (!html) return "";
  const idx = html.indexOf("Compatible Vehicles");
  if (idx === -1) return html;
  const divStart = html.lastIndexOf("<div", idx);
  if (divStart === -1) return html;
  return html.slice(0, divStart) + "</div>";
}

/**
 * Returns only the compatibility section of the generated HTML
 * (heading + all manufacturer tables, without the outer wrapper).
 */
export function extractCompatSection(html) {
  if (!html) return "";
  const idx = html.indexOf("Compatible Vehicles");
  if (idx === -1) return "";
  const divStart = html.lastIndexOf("<div", idx);
  if (divStart === -1) return "";
  const section = html.slice(divStart);
  // Remove the final </div> which closes the outer wrapper (not part of compat)
  const lastClose = section.lastIndexOf("</div>");
  if (lastClose === -1) return section;
  return section.slice(0, lastClose);
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { key: "preview",       label: "Description Preview" },
  { key: "compatibility", label: "Compatibility"        },
  { key: "specifics",     label: "Item Specifics"       },
  { key: "html",          label: "HTML"                 },
];

// ─── TabbedListingPreview ─────────────────────────────────────────────────────
// Drop-in replacement for ListingOutput when USE_TABBED_PREVIEW = true.
//
// Props:
//   result          — the full listing result object
//   html            — resolved HTML (customTemplate merged or raw generated_html)
//   copyText        — async (text) => void clipboard helper
//   renderSpecifics — () => <ItemSpecificsTab ... />  (render-prop to avoid circular import)

export default function TabbedListingPreview({ result, html, copyText, renderSpecifics }) {
  const [activeTab, setActiveTab] = useState("preview");

  const compatCount = result.compatibility_count || 0;
  const topModels   = result.top_models   || [];
  const compatRows  = result.compatibility_rows || [];

  const descHtml   = stripCompatSection(html);
  const compatHtml = extractCompatSection(html);

  return (
    <div style={{ display: "grid", gap: 14 }}>

      {/* ── Tab bar ── */}
      <div style={{
        display: "flex", gap: 4,
        background: "var(--bg-nav)", borderRadius: 14, padding: 4,
        border: "1px solid var(--border-light)"
      }}>
        {TABS.map(({ key, label }) => {
          const isActive = activeTab === key;
          const badge = key === "compatibility" && compatCount > 0
            ? ` (${compatCount})` : "";
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1, padding: "9px 8px", borderRadius: 10,
                border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12,
                background: isActive ? "var(--blue)" : "transparent",
                color:      isActive ? "var(--text-on-dark)"    : "var(--text-muted)",
                boxShadow:  isActive ? "0 0 14px rgba(19,93,255,0.28)" : "none",
                transition: "all 0.18s ease", whiteSpace: "nowrap"
              }}
            >
              {label}{badge}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}

      {activeTab === "preview" && (
        <PreviewTab
          descHtml={descHtml}
          compatCount={compatCount}
          topModels={topModels}
          yearRange={result.year_range}
          onViewCompat={() => setActiveTab("compatibility")}
        />
      )}

      {activeTab === "compatibility" && (
        <CompatTab
          compatRows={compatRows}
          compatHtml={compatHtml}
          count={compatCount}
        />
      )}

      {activeTab === "specifics" && (
        <div style={{ display: "grid", gap: 14 }}>
          {renderSpecifics?.() ?? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              Item specifics unavailable.
            </div>
          )}
        </div>
      )}

      {activeTab === "html" && <HtmlTab html={html} />}

    </div>
  );
}

// ─── Description Preview tab ─────────────────────────────────────────────────

function PreviewTab({ descHtml, compatCount, topModels, yearRange, onViewCompat }) {
  const hasCompat = compatCount > 0;

  return (
    <div style={{ display: "grid", gap: 14 }}>

      {/* Rendered HTML — description only, compat tables removed */}
      <div style={{
        background: "var(--text-on-dark)",
        border: "1px solid var(--border)",
        borderRadius: 18, padding: 18, overflowX: "auto",
        boxShadow: "0 0 16px rgba(19,93,255,0.08)"
      }}>
        {descHtml
          ? <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(descHtml) }} />
          : <div style={{ color: "#999", fontSize: 13, textAlign: "center", padding: 24 }}>No preview available.</div>
        }
      </div>

      {/* Compact compatibility summary */}
      {hasCompat && (
        <div style={{
          background: "var(--bg-surface3)",
          border: "1px solid rgba(74,222,128,0.18)",
          borderRadius: 14, padding: "14px 18px"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Count headline */}
              <div style={{
                fontSize: 13, fontWeight: 700, color: "var(--green)",
                display: "flex", alignItems: "center", gap: 6, marginBottom: 10
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: "rgba(74,222,128,0.15)",
                  border: "1px solid rgba(74,222,128,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, flexShrink: 0
                }}>✓</span>
                {compatCount} Compatible Vehicles
                {yearRange ? (
                  <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)", marginLeft: 4 }}>
                    ({yearRange})
                  </span>
                ) : null}
              </div>

              {/* Top models list */}
              <div style={{ display: "grid", gap: 4 }}>
                {topModels.slice(0, 5).map((m, i) => (
                  <div key={i} style={{
                    fontSize: 12, color: "#cbd5e1",
                    display: "flex", alignItems: "center", gap: 7
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: "var(--green)", flexShrink: 0, display: "inline-block"
                    }} />
                    {m}
                  </div>
                ))}
                {topModels.length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Fitment data available — click to view
                  </div>
                )}
                {topModels.length > 5 && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    +{compatCount - 5} more vehicles in Compatibility tab
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={onViewCompat}
              style={{
                padding: "9px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                cursor: "pointer", border: "1px solid rgba(74,222,128,0.25)",
                background: "rgba(74,222,128,0.08)", color: "var(--green)",
                transition: "all 0.15s ease", flexShrink: 0, whiteSpace: "nowrap",
                lineHeight: 1.3
              }}
            >
              View Full<br />Compatibility →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Compatibility tab ────────────────────────────────────────────────────────

function CompatTab({ compatRows, compatHtml, count }) {

  // ── Prefer structured row data (new listings) ─────────────────────────────
  if (compatRows.length > 0) {
    const grouped = {};
    for (const row of compatRows) {
      const key = row.make || "Other";
      (grouped[key] = grouped[key] || []).push(row);
    }
    const makes = Object.keys(grouped).sort();

    return (
      <div style={{ display: "grid", gap: 14 }}>

        {/* Summary bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px", background: "var(--bg-nav)",
          border: "1px solid var(--border)", borderRadius: 12
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
            {count} Compatible Vehicles
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {makes.length} {makes.length === 1 ? "manufacturer" : "manufacturers"}
          </span>
        </div>

        {/* Per-manufacturer tables */}
        {makes.map((make) => (
          <MakeTable key={make} make={make} rows={grouped[make]} />
        ))}
      </div>
    );
  }

  // ── Fallback: extracted HTML (older cached listings without row data) ──────
  if (compatHtml) {
    return (
      <div style={{
        background: "var(--text-on-dark)",
        border: "1px solid var(--border)",
        borderRadius: 18, padding: 18, overflowX: "auto"
      }}>
        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(compatHtml) }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
      No compatibility data available for this listing.
    </div>
  );
}

// ─── Manufacturer table ───────────────────────────────────────────────────────

const TH = ({ children, left = false }) => (
  <th style={{
    border: "1px solid #000000", padding: "7px 8px",
    textAlign: left ? "left" : "center",
    fontSize: 12, fontWeight: "bold", color: "var(--text)"
  }}>
    {children}
  </th>
);

const TD = ({ children, left = false }) => (
  <td style={{
    border: "1px solid #000000", padding: "7px 8px",
    fontSize: 12, textAlign: left ? "left" : "center",
    lineHeight: 1.4
  }}>
    {children || "—"}
  </td>
);

function MakeTable({ make, rows }) {
  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: 12, overflow: "hidden"
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Arial, sans-serif" }}>
        <thead>
          <tr>
            <th colSpan={6} style={{
              border: "1px solid #000000",
              background: "var(--text)", color: "#cc0000",
              fontWeight: "bold", textAlign: "center",
              padding: "9px 10px", fontSize: 15
            }}>
              {make} Models:
            </th>
          </tr>
          <tr style={{ background: "#c2c2c2" }}>
            <TH left>Vehicle</TH>
            <TH>Years</TH>
            <TH>kW</TH>
            <TH>HP</TH>
            <TH>CC</TH>
            <TH>Engine Codes</TH>
          </tr>
        </thead>
        <tbody>
          {rows.map((v, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "var(--text-on-dark)" : "#f5f5f5" }}>
              <TD left>{v.vehicle}</TD>
              <TD>{v.production_years}</TD>
              <TD>{v.kw}</TD>
              <TD>{v.hp}</TD>
              <TD>{v.cc}</TD>
              <TD>{(v.engine_codes || []).join(", ")}</TD>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── HTML tab ─────────────────────────────────────────────────────────────────

function HtmlTab({ html }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 10
      }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Full generated HTML — includes all sections and compatibility tables.
        </div>
        <CopyButton value={html} style={{ fontSize: 12, flexShrink: 0 }}>
          Copy HTML
        </CopyButton>
      </div>
      <ReadOnlyTextarea value={html} minHeight={400} />
    </div>
  );
}
