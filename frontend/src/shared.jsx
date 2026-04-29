import React, { memo } from "react";

export const BUTTON_BASE = {
  padding: "13px 16px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
  transition: "all 0.2s ease"
};

export const SMALL_BUTTON_STYLE = {
  ...BUTTON_BASE,
  background: "#b70017",
  color: "#fff",
  padding: "10px 14px",
  boxShadow: "0 0 16px rgba(183,0,23,0.24)"
};

export const INPUT_STYLE = {
  width: "100%",
  padding: "14px 14px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#1a1d22",
  color: "#ffffff",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)"
};

export const TEXTAREA_STYLE = {
  width: "100%",
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#1a1d22",
  color: "#ffffff",
  fontSize: 14,
  fontFamily: "monospace",
  outline: "none",
  resize: "vertical",
  boxSizing: "border-box",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)"
};

export function primaryButtonStyle(disabled) {
  return {
    ...BUTTON_BASE,
    background: disabled ? "#4b5563" : "#b70017",
    color: "#fff",
    boxShadow: disabled
      ? "none"
      : "0 0 18px rgba(183,0,23,0.28), 0 8px 20px rgba(0,0,0,0.22)"
  };
}

export const StatPill = memo(function StatPill({ value }) {
  return (
    <div
      style={{
        padding: "11px 16px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.18)",
        color: "#ffffff",
        fontSize: 13,
        fontWeight: 600,
        backdropFilter: "blur(6px)",
        boxShadow: "0 0 14px rgba(255,255,255,0.05)"
      }}
    >
      {value}
    </div>
  );
});

export const Card = memo(function Card({
  title,
  subtitle,
  children,
  centeredTitle = false,
  glow = false
}) {
  return (
    <div
      style={{
        background: "#111317",
        borderRadius: 24,
        padding: 22,
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: glow
          ? "0 0 0 1px rgba(183,0,23,0.20), 0 0 26px rgba(183,0,23,0.14), 0 16px 36px rgba(0,0,0,0.30)"
          : "0 16px 36px rgba(0,0,0,0.28)"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: centeredTitle ? "center" : "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 18,
          textAlign: centeredTitle ? "center" : "left"
        }}
      >
        <div style={{ width: centeredTitle ? "100%" : "auto" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff" }}>{title}</div>
          {subtitle ? (
            <div style={{ marginTop: 6, fontSize: 14, color: "#9ca3af", lineHeight: 1.55 }}>
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
});

export const FieldLabel = memo(function FieldLabel({ children }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 13,
        fontWeight: 700,
        color: "#d1d5db",
        marginBottom: 8
      }}
    >
      {children}
    </label>
  );
});

export const TextInput = memo(function TextInput({
  value,
  onChange,
  placeholder,
  type = "text"
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete="off"
      spellCheck={false}
      style={INPUT_STYLE}
    />
  );
});

export const EditableTextarea = memo(function EditableTextarea({
  value,
  onChange,
  placeholder,
  minHeight = 220
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      spellCheck={false}
      style={{ ...TEXTAREA_STYLE, minHeight }}
    />
  );
});

export const ReadOnlyTextarea = memo(function ReadOnlyTextarea({
  value,
  minHeight = 220
}) {
  return (
    <textarea
      value={value}
      readOnly
      spellCheck={false}
      style={{ ...TEXTAREA_STYLE, minHeight, background: "#16191f" }}
    />
  );
});

export const InfoBox = memo(function InfoBox({ title, children }) {
  return (
    <div
      style={{
        background: "#0f1115",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 20,
        padding: 16,
        boxShadow: "0 0 12px rgba(255,255,255,0.03)",
        alignSelf: "start"
      }}
    >
      <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
});
