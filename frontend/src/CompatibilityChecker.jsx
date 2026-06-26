import React, { useState, useEffect, useRef } from "react";
import { useSessionState } from "./useSessionState.js";
import { trackEvent } from "./lib/analytics";
import { useSession } from "./context/SessionContext.jsx";
import {
  BUTTON_BASE,
  SMALL_BUTTON_STYLE,
  primaryButtonStyle,
  Card,
  FieldLabel,
  TextInput,
  INPUT_STYLE
} from "./shared.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ─── Colour tokens ────────────────────────────────────────────────────────────
const GREEN = "var(--green)";
const GREEN_GLOW = "rgba(74,222,128,0.20)";
const GREEN_BORDER = "rgba(74,222,128,0.25)";
const RED = "var(--red)";
const RED_GLOW = "rgba(248,113,113,0.20)";
const RED_BORDER = "rgba(248,113,113,0.25)";
const AMBER = "var(--yellow)";
const AMBER_GLOW = "rgba(251,191,36,0.20)";
const AMBER_BORDER = "rgba(251,191,36,0.25)";
const YELLOW = "#facc15";
const YELLOW_GLOW = "rgba(250,204,21,0.20)";
const YELLOW_BORDER = "rgba(250,204,21,0.25)";
const GREY_GLOW = "rgba(156,163,175,0.15)";
const GREY_BORDER = "rgba(156,163,175,0.20)";

function statusColors(status) {
  switch (status) {
    case "compatible":
      return { glow: GREEN_GLOW, border: GREEN_BORDER, accent: GREEN };
    case "not_compatible":
      return { glow: RED_GLOW, border: RED_BORDER, accent: RED };
    case "alternative_found":
      return { glow: AMBER_GLOW, border: AMBER_BORDER, accent: AMBER };
    case "manual_check_required":
      return { glow: YELLOW_GLOW, border: YELLOW_BORDER, accent: YELLOW };
    default:
      return { glow: GREY_GLOW, border: GREY_BORDER, accent: "var(--text-muted)" };
  }
}

// ─── Progress Steps ───────────────────────────────────────────────────────────
const STEPS = [
  "Looking up vehicle from registration...",
  "Searching OEM number...",
  "Fetching article details...",
  "Checking compatibility...",
  "Searching for compatible alternative..."
];

function ProgressList({ currentStep }) {
  return (
    <div
      style={{
        background: "var(--bg-nav)",
        borderRadius: 20,
        border: "1px solid var(--border)",
        padding: "20px 24px",
        marginTop: 20
      }}
    >
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14, fontWeight: 700 }}>
        Processing...
      </div>
      {STEPS.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 0",
              opacity: i > currentStep ? 0.3 : 1,
              transition: "opacity 0.3s"
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: done ? GREEN : active ? "var(--blue)" : "var(--bg-surface2)",
                border: active
                  ? "2px solid #135DFF"
                  : done
                  ? "2px solid " + GREEN
                  : "2px solid var(--border-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 12,
                color: done || active ? "var(--text-on-dark)" : "var(--text-muted)",
                boxShadow: active ? "0 0 8px rgba(183,0,23,0.5)" : done ? "0 0 8px rgba(74,222,128,0.4)" : "none",
                transition: "all 0.3s"
              }}
            >
              {done ? "✓" : active ? <SpinDot /> : i + 1}
            </div>
            <div
              style={{
                fontSize: 14,
                color: done ? GREEN : active ? "var(--text)" : "var(--text-muted)",
                fontWeight: active ? 700 : 400,
                transition: "color 0.3s"
              }}
            >
              {step}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SpinDot() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "var(--text-on-dark)",
        animation: "pulse 1s infinite"
      }}
    />
  );
}

// ─── Pill ─────────────────────────────────────────────────────────────────────
function Pill({ label, color }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: color + "22",
        color,
        border: "1px solid " + color + "44",
        marginRight: 6,
        marginBottom: 6
      }}
    >
      {label}
    </span>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function StatusBadge({ icon, label, color }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 20px",
        borderRadius: 999,
        background: color + "22",
        border: "1px solid " + color + "55",
        color,
        fontSize: 18,
        fontWeight: 800,
        marginBottom: 16
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

// ─── Vehicle Card ─────────────────────────────────────────────────────────────
function VehicleCard({ vehicle }) {
  if (!vehicle) return null;
  return (
    <div
      style={{
        background: "var(--bg-surface3)",
        border: "1px solid var(--border-strong)",
        borderRadius: 18,
        padding: 18,
        flex: 1
      }}
    >
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10, fontWeight: 700 }}>
        VEHICLE
      </div>
      {vehicle.vin ? (
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1,
            marginBottom: 12,
            background: "var(--bg-surface2)",
            color: "var(--text-muted)",
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: 6,
            fontFamily: "monospace"
          }}
        >
          {vehicle.vin}
        </div>
      ) : null}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
        <tbody>
          {[
            ["Make", vehicle.make],
            ["Model", vehicle.model],
            ["Variant", vehicle.variant],
            ["Year", vehicle.year ? `${vehicle.year}${vehicle.yearTo ? ` – ${vehicle.yearTo}` : ""}` : null],
            ["Fuel", vehicle.fuelType],
            ["Engine Size", vehicle.engineSizeCc ? `${vehicle.engineSizeCc}cc` : vehicle.engineSizeLitres ? `${vehicle.engineSizeLitres}L` : null],
            ["Engine Code", vehicle.engineCodes?.length ? vehicle.engineCodes.join(", ") : null],
            ["Power", vehicle.powerKw || vehicle.powerPs
              ? [vehicle.powerKw ? `${vehicle.powerKw} kW` : null, vehicle.powerPs ? `${vehicle.powerPs} HP` : null].filter(Boolean).join(" / ")
              : null],
            ["Cylinders", vehicle.cylinders ? String(vehicle.cylinders) : null],
            ["TecDoc ID", vehicle.vehicleId]
          ]
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <tr key={label}>
                <td
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    paddingBottom: 6,
                    paddingRight: 12,
                    whiteSpace: "nowrap"
                  }}
                >
                  {label}
                </td>
                <td style={{ fontSize: 13, color: "var(--text)", paddingBottom: 6 }}>{value}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Part Card ────────────────────────────────────────────────────────────────
function PartCard({ part, strikethrough = false, recommended = false, onCopyArticle, onSendToListing }) {
  if (!part) return null;
  return (
    <div
      style={{
        background: "var(--bg-surface3)",
        border: recommended
          ? "1px solid " + GREEN_BORDER
          : strikethrough
          ? "1px solid " + RED_BORDER
          : "1px solid var(--border-strong)",
        borderRadius: 18,
        padding: 18,
        flex: 1,
        boxShadow: recommended ? "0 0 14px " + GREEN_GLOW : strikethrough ? "0 0 10px " + RED_GLOW : "none",
        opacity: strikethrough ? 0.75 : 1,
        position: "relative"
      }}
    >
      {recommended && (
        <div
          style={{
            position: "absolute",
            top: -10,
            right: 14,
            background: GREEN,
            color: "#000",
            fontSize: 11,
            fontWeight: 800,
            borderRadius: 999,
            padding: "2px 10px"
          }}
        >
          RECOMMENDED
        </div>
      )}
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10, fontWeight: 700 }}>
        {strikethrough ? "CHECKED PART (NOT COMPATIBLE)" : recommended ? "COMPATIBLE PART" : "PART"}
      </div>
      {part.imageUrl ? (
        <div
          style={{
            background: "var(--text-on-dark)",
            borderRadius: 12,
            padding: 10,
            marginBottom: 12,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 120
          }}
        >
          <img
            src={part.imageUrl}
            alt={part.productType || "Part"}
            style={{ maxWidth: "100%", maxHeight: 140, objectFit: "contain" }}
          />
        </div>
      ) : null}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {[
            ["Brand", part.brand],
            ["Article No", part.articleNumber],
            ["Product Type", part.productType]
          ]
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <tr key={label}>
                <td
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    paddingBottom: 6,
                    paddingRight: 12,
                    whiteSpace: "nowrap",
                    textDecoration: strikethrough ? "line-through" : "none"
                  }}
                >
                  {label}
                </td>
                <td
                  style={{
                    fontSize: 13,
                    color: strikethrough ? "var(--text-muted)" : "var(--text)",
                    paddingBottom: 6,
                    textDecoration: strikethrough ? "line-through" : "none",
                    wordBreak: "break-word"
                  }}
                >
                  {value}
                </td>
              </tr>
            ))}
          {part.oemNumbers?.length > 0 && (
            <tr>
              <td
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  paddingBottom: 6,
                  paddingRight: 12,
                  whiteSpace: "nowrap",
                  verticalAlign: "top",
                  textDecoration: strikethrough ? "line-through" : "none"
                }}
              >
                OEM Refs
              </td>
              <td style={{ paddingBottom: 6 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {part.oemNumbers.map((oem) => (
                    <span
                      key={oem}
                      style={{
                        fontSize: 11,
                        fontFamily: "monospace",
                        background: strikethrough ? "var(--text-dim)" : "#1e3a5f",
                        color: strikethrough ? "var(--text-muted)" : "var(--text-accent)",
                        border: `1px solid ${strikethrough ? "var(--text-dim)" : "#2563eb44"}`,
                        borderRadius: 4,
                        padding: "2px 6px",
                        letterSpacing: "0.02em"
                      }}
                    >
                      {oem}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {(onCopyArticle || onSendToListing) && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {onCopyArticle && (
            <button
              onClick={() => onCopyArticle(part.articleNumber)}
              style={{ ...SMALL_BUTTON_STYLE, fontSize: 12, padding: "8px 12px" }}
            >
              Copy Article No
            </button>
          )}
          {onSendToListing && (
            <button
              onClick={() => onSendToListing({ articleNumber: part.articleNumber })}
              style={{
                ...BUTTON_BASE,
                background: GREEN + "22",
                color: GREEN,
                border: "1px solid " + GREEN + "44",
                fontSize: 12,
                padding: "8px 12px"
              }}
            >
              Use in Listing Generator
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Result Section ───────────────────────────────────────────────────────────
function ResultSection({ result, onSendToListing }) {
  const [rawOpen, setRawOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState(null);

  const displayStatus = overrideStatus || result.status;
  const { glow, border, accent } = statusColors(displayStatus);

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
    } catch {
      // silent
    }
  };

  const statusConfig = {
    compatible: {
      icon: "✓",
      label: "Compatible",
      message: "This part appears to be compatible with the entered vehicle."
    },
    not_compatible: {
      icon: "✗",
      label: "Not Compatible",
      message: `Compatibility could not be confirmed.${
        result.matchReasoning?.conflictingFields?.length
          ? ` Conflicting fields: ${result.matchReasoning.conflictingFields.join(", ")}.`
          : ""
      }`
    },
    alternative_found: {
      icon: "⚡",
      label: "Compatible Part Found",
      message: "The checked part does not appear compatible, but a compatible part was found."
    },
    manual_check_required: {
      icon: "⚠",
      label: "Manual Check Required",
      message: "Confidence is moderate. Please verify manually before listing."
    },
    error: {
      icon: "!",
      label: "Error",
      message: "One or more steps failed."
    }
  };

  const cfg = statusConfig[displayStatus] || statusConfig.error;

  return (
    <div
      style={{
        background: "var(--bg-nav)",
        borderRadius: 24,
        border: "1px solid " + border,
        padding: 24,
        boxShadow: "0 0 30px " + glow + ", 0 16px 36px rgba(0,0,0,0.28)",
        marginTop: 20
      }}
    >
      <StatusBadge icon={cfg.icon} label={cfg.label} color={accent} />
      <p style={{ color: "var(--text)", fontSize: 14, marginTop: 0, marginBottom: 16 }}>
        {cfg.message}
      </p>

      {result.confidenceScore > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>Confidence</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                height: 8,
                flex: 1,
                borderRadius: 999,
                background: "var(--bg-surface2)",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, result.confidenceScore)}%`,
                  background: accent,
                  borderRadius: 999,
                  transition: "width 0.6s ease"
                }}
              />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: accent, minWidth: 36 }}>
              {result.confidenceScore}
            </span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{result.confidenceLabel}</span>
          </div>
        </div>
      )}

      {/* Match reasoning pills */}
      {result.matchReasoning?.matchedFields?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>Matched Fields</div>
          <div>
            {result.matchReasoning.matchedFields.map((f) => (
              <Pill key={f} label={f} color={GREEN} />
            ))}
          </div>
        </div>
      )}
      {result.matchReasoning?.conflictingFields?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>Conflicting Fields</div>
          <div>
            {result.matchReasoning.conflictingFields.map((f) => (
              <Pill key={f} label={f} color={RED} />
            ))}
          </div>
        </div>
      )}
      {result.matchReasoning?.notes?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>Notes</div>
          {result.matchReasoning.notes.map((n, i) => (
            <div key={i} style={{ fontSize: 13, color: "var(--text)", marginBottom: 4 }}>
              • {n}
            </div>
          ))}
        </div>
      )}

      {/* Vehicle + Part cards */}
      {displayStatus === "compatible" && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
          <VehicleCard vehicle={result.vehicle} />
          <PartCard part={result.checkedPart} />
        </div>
      )}

      {displayStatus === "not_compatible" && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
          <VehicleCard vehicle={result.vehicle} />
        </div>
      )}

      {displayStatus === "alternative_found" && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
          <VehicleCard vehicle={result.vehicle} />
          <PartCard
            part={result.alternativePart}
            recommended
            onCopyArticle={copyText}
            onSendToListing={onSendToListing}
          />
        </div>
      )}

      {/* Error list */}
      {result.errors?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>Errors by Step</div>
          {result.errors.map((e, i) => (
            <div
              key={i}
              style={{
                background: "var(--bg-surface3)",
                border: "1px solid rgba(183,0,23,0.30)",
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 13,
                color: "#fecdd3",
                marginBottom: 8
              }}
            >
              <strong>{e.step}:</strong> {e.message}
            </div>
          ))}
        </div>
      )}

      {/* Manual overrides */}
      <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)", alignSelf: "center", marginRight: 4 }}>
          Override:
        </div>
        {[
          { key: "compatible", label: "Mark Compatible", color: GREEN },
          { key: "not_compatible", label: "Mark Not Compatible", color: RED },
          { key: "manual_check_required", label: "Needs Manual Check", color: YELLOW }
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setOverrideStatus(overrideStatus === key ? null : key)}
            style={{
              ...BUTTON_BASE,
              background: overrideStatus === key ? color + "22" : "transparent",
              color: overrideStatus === key ? color : "var(--text-muted)",
              border: "1px solid " + (overrideStatus === key ? color + "55" : "var(--border-strong)"),
              fontSize: 12,
              padding: "8px 12px"
            }}
          >
            {label}
          </button>
        ))}
        {overrideStatus && (
          <button
            onClick={() => setOverrideStatus(null)}
            style={{
              ...BUTTON_BASE,
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: 12,
              padding: "8px 12px"
            }}
          >
            Clear Override
          </button>
        )}
      </div>

      {/* Raw data toggle */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => setRawOpen((o) => !o)}
          style={{
            ...BUTTON_BASE,
            background: "transparent",
            color: "var(--text-muted)",
            border: "1px solid var(--border-strong)",
            fontSize: 12,
            padding: "8px 14px"
          }}
        >
          {rawOpen ? "Hide" : "View"} Raw Data
        </button>
        {rawOpen && (
          <div
            style={{
              marginTop: 12,
              background: "var(--bg-surface3)",
              borderRadius: 14,
              border: "1px solid var(--border)",
              padding: 16,
              overflow: "auto",
              maxHeight: 400
            }}
          >
            <pre
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Vehicle Selection Step ───────────────────────────────────────────────────
function VehicleSelectionStep({ options, onSelect, onBack }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{
        background: "var(--bg-nav)", borderRadius: 24,
        border: "1px solid rgba(251,191,36,0.25)",
        boxShadow: "0 0 28px rgba(251,191,36,0.10), 0 16px 36px rgba(0,0,0,0.28)",
        padding: "22px 24px"
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h13l4 4v4a2 2 0 0 1-2 2h-1"/>
              <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
            </svg>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>Select Your Vehicle</div>
          </div>
          <button
            onClick={onBack}
            style={{
              ...BUTTON_BASE, background: "transparent",
              color: "var(--text-muted)", border: "1px solid var(--border-strong)",
              fontSize: 12, padding: "7px 14px"
            }}
          >
            ← Start Over
          </button>
        </div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}>
          Multiple vehicles match this VIN. Select the correct one to continue the compatibility check.
        </div>

        {/* Vehicle option grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 12
        }}>
          {options.map((v, i) => {
            const id = v.vehicleId || String(i);
            const isHovered = hoveredId === id;
            const yearStr = v.year
              ? `${v.year}${v.yearTo ? ` – ${v.yearTo}` : " onwards"}`
              : null;
            const powerStr = v.powerKw || v.powerPs
              ? [v.powerKw ? `${v.powerKw} kW` : null, v.powerPs ? `${v.powerPs} HP` : null].filter(Boolean).join(" / ")
              : null;
            const rows = [
              ["Year",    yearStr],
              ["Fuel",    v.fuelType],
              ["Engine",  v.engineSizeCc ? `${v.engineSizeCc}cc` : v.engineSizeLitres ? `${v.engineSizeLitres}L` : null],
              ["Power",   powerStr],
              ["Engine Code", v.engineCodes?.length ? v.engineCodes.join(", ") : null],
              ["TecDoc ID",   v.vehicleId]
            ].filter(([, val]) => val);

            return (
              <button
                key={id}
                onClick={() => onSelect(v.vehicleId)}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  background: isHovered ? "var(--bg-surface2)" : "var(--bg-surface3)",
                  border: isHovered
                    ? "1px solid rgba(19,93,255,0.50)"
                    : "1px solid var(--border-strong)",
                  boxShadow: isHovered ? "0 0 18px var(--border-blue)" : "none",
                  borderRadius: 18, padding: 18,
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.15s ease",
                  transform: isHovered ? "translateY(-2px)" : "none"
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 10, lineHeight: 1.3 }}>
                  {[v.make, v.model, v.variant].filter(Boolean).join(" ")}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {rows.map(([label, value]) => (
                      <tr key={label}>
                        <td style={{ fontSize: 11, color: "var(--text-muted)", paddingBottom: 5, paddingRight: 10, whiteSpace: "nowrap", verticalAlign: "top" }}>
                          {label}
                        </td>
                        <td style={{ fontSize: 12, color: "var(--text)", paddingBottom: 5, wordBreak: "break-word" }}>
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {isHovered && (
                  <div style={{
                    marginTop: 10, fontSize: 12, fontWeight: 700,
                    color: "var(--blue)", display: "flex", alignItems: "center", gap: 5
                  }}>
                    Select this vehicle →
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CompatibilityChecker({ onSendToListing }) {
  const { session, hasFeature } = useSession();
  const [vin, setVin] = useSessionState("jsk_compat_vin", "");
  const [oemNumber, setOemNumber] = useSessionState("jsk_compat_oem", "");
  const [partType, setPartType] = useState("");
  const [engineCode, setEngineCode] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [engineSize, setEngineSize] = useState("");

  const [showOptional, setShowOptional] = useState(true); // expanded by default — reg plate lookup not available for UK plates
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useSessionState("jsk_compat_result", null);
  const [error, setError] = useState("");
  const [vehicleOptions, setVehicleOptions] = useState(null); // set when manual_vehicle_selection_required

  const stepTimerRef = useRef(null);

  const canCheck = oemNumber.trim().length > 0 && vin.trim().length > 0;

  const startProgressSimulation = () => {
    setCurrentStep(0);
    let step = 0;
    stepTimerRef.current = setInterval(() => {
      step += 1;
      if (step < STEPS.length) {
        setCurrentStep(step);
      }
    }, 2000);
  };

  const stopProgressSimulation = () => {
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  };

  // handleCheck: pass selectedVehicleId after user picks from vehicle selection
  const handleCheck = async (selectedVehicleId = null) => {
    if (!canCheck || loading || !hasFeature("compatibilityChecker")) return;

    setLoading(true);
    setError("");
    setResult(null);
    setVehicleOptions(null);
    startProgressSimulation();
    trackEvent("compat_check_started", { oem_number: oemNumber.trim(), source: "compatibility_checker" });

    try {
      const res = await fetch(`${API_URL}/compatibility/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          vin: vin.trim() || undefined,
          oemNumber: oemNumber.trim(),
          partType: partType.trim() || undefined,
          engineCode: engineCode.trim() || undefined,
          make: make.trim() || undefined,
          model: model.trim() || undefined,
          year: year.trim() || undefined,
          fuelType: fuelType.trim() || undefined,
          engineSize: engineSize.trim() || undefined,
          selectedVehicleId: selectedVehicleId || undefined
        })
      });

      const data = await res.json();

      if (data.status === "manual_vehicle_selection_required") {
        setVehicleOptions(data.vehicleOptions || []);
        return;
      }

      if (!res.ok) {
        if (res.status === 403 && data.error === "feature_restricted") {
          throw new Error(data.message);
        }
        throw new Error(data.message || data.error || "Compatibility check failed");
      }

      setResult(data);
      trackEvent("compat_check_performed", { oem_number: oemNumber.trim(), status: data.status, source: "compatibility_checker" });
      if (data.status === "compatible") {
        trackEvent("compat_result_compatible", { oem_number: oemNumber.trim(), source: "compatibility_checker" });
      } else if (data.status === "not_compatible") {
        trackEvent("compat_result_not_compatible", { oem_number: oemNumber.trim(), source: "compatibility_checker" });
      }
    } catch (err) {
      setError(String(err.message || err));
      trackEvent("compat_check_failed", { oem_number: oemNumber.trim(), error: String(err.message || err), source: "compatibility_checker" });
    } finally {
      stopProgressSimulation();
      setCurrentStep(STEPS.length);
      setLoading(false);
    }
  };

  const handleVehicleSelect = (vehicleId) => {
    handleCheck(vehicleId);
  };

  const handleReset = () => {
    setVehicleOptions(null);
    setResult(null);
    setError("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopProgressSimulation();
  }, []);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {error && (
        <div
          style={{
            background: "var(--bg-surface3)",
            color: "#fecdd3",
            border: "1px solid rgba(19,93,255,0.35)",
            borderRadius: 20,
            padding: 16,
            marginBottom: 20,
            boxShadow: "0 0 20px rgba(19,93,255,0.14)"
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      <Card title="Compatibility Checker" subtitle="Enter a VIN and OEM / part number to check compatibility." centeredTitle>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto",
            gap: 12,
            alignItems: "end"
          }}
        >
          <div>
            <FieldLabel>VIN Number</FieldLabel>
            <TextInput
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              placeholder="e.g. WDBFA68F42F202731"
            />
          </div>
          <div>
            <FieldLabel>OEM / Part Number</FieldLabel>
            <TextInput
              value={oemNumber}
              onChange={(e) => setOemNumber(e.target.value)}
              placeholder="e.g. 038198119A"
            />
          </div>
          <button
            onClick={() => handleCheck()}
            disabled={!canCheck || loading}
            style={{ ...primaryButtonStyle(!canCheck || loading), whiteSpace: "nowrap" }}
          >
            {loading ? "Checking..." : "Check Compatibility"}
          </button>
        </div>

        {false && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 12,
              padding: "14px 0 0"
            }}
          >
            {[
              ["Part Type", partType, setPartType, "e.g. Timing Belt Kit"],
              ["Engine Code", engineCode, setEngineCode, "e.g. BKD"],
              ["Make", make, setMake, "e.g. VW"],
              ["Model", model, setModel, "e.g. Golf"],
              ["Year", year, setYear, "e.g. 2008"],
              ["Fuel Type", fuelType, setFuelType, "e.g. diesel"],
              ["Engine Size", engineSize, setEngineSize, "e.g. 2.0"]
            ].map(([label, val, setter, placeholder]) => (
              <div key={label}>
                <FieldLabel>{label}</FieldLabel>
                <TextInput
                  value={val}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Progress */}
      {loading && <ProgressList currentStep={currentStep} />}

      {/* Vehicle selection — shown when VIN returns multiple matches */}
      {vehicleOptions && !loading && (
        <VehicleSelectionStep
          options={vehicleOptions}
          onSelect={handleVehicleSelect}
          onBack={handleReset}
        />
      )}

      {/* Result */}
      {result && !loading && (
        <ResultSection result={result} onSendToListing={onSendToListing} />
      )}
    </>
  );
}
