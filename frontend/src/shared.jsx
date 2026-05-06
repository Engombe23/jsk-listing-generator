import React, { memo, useState, useCallback } from "react";

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
  background: "#135DFF",
  color: "#fff",
  padding: "10px 14px",
  boxShadow: "0 0 16px rgba(19,93,255,0.24)"
};

export const INPUT_STYLE = {
  width: "100%",
  padding: "14px 14px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#0D2040",
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
  background: "#0D2040",
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
    background: disabled ? "#4b5563" : "#135DFF",
    color: "#fff",
    boxShadow: disabled
      ? "none"
      : "0 0 18px rgba(19,93,255,0.28), 0 8px 20px rgba(0,0,0,0.22)"
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
        background: "#0F1E35",
        borderRadius: 24,
        padding: 22,
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: glow
          ? "0 0 0 1px rgba(19,93,255,0.20), 0 0 26px rgba(19,93,255,0.14), 0 16px 36px rgba(0,0,0,0.30)"
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
  onKeyDown,
  placeholder,
  type = "text"
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
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
      style={{ ...TEXTAREA_STYLE, minHeight, background: "#0D1B30" }}
    />
  );
});

// ─── CopyButton ───────────────────────────────────────────────────────────────
// Animated copy button: hover lift → press sink → green "✓ Copied!" flash.
// Pass either `value` (string to copy) or `onCopy` (async fn).
// Accepts `style` overrides and any other <button> props.

export function CopyButton({
  value,
  onCopy,
  children,
  copiedLabel = "✓ Copied!",
  style: extraStyle,
  ...rest
}) {
  // "idle" | "hover" | "pressed" | "copied"
  const [phase, setPhase] = useState("idle");

  const handleClick = useCallback(async () => {
    try {
      if (onCopy)                  await onCopy();
      else if (value !== undefined) await navigator.clipboard.writeText(String(value ?? ""));
    } catch {}
    setPhase("copied");
    setTimeout(() => setPhase((p) => p === "copied" ? "idle" : p), 1600);
  }, [value, onCopy]);

  const isCopied  = phase === "copied";
  const isHovered = phase === "hover";
  const isPressed = phase === "pressed";

  // Base values — prefer extraStyle overrides over SMALL_BUTTON_STYLE defaults
  const baseBg     = extraStyle?.background ?? SMALL_BUTTON_STYLE.background;
  const baseShadow = extraStyle?.boxShadow  ?? SMALL_BUTTON_STYLE.boxShadow;

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setPhase((p) => p === "idle"               ? "hover"   : p)}
      onMouseLeave={() => setPhase((p) => p === "hover" || p === "pressed" ? "idle" : p)}
      onMouseDown={() =>  setPhase((p) => p !== "copied"             ? "pressed" : p)}
      onMouseUp={() =>    setPhase((p) => p === "pressed"            ? "hover"   : p)}
      style={{
        ...SMALL_BUTTON_STYLE,
        ...extraStyle,
        background: isCopied ? "#16a34a" : baseBg,
        boxShadow:  isCopied
          ? "0 0 22px rgba(22,163,74,0.50)"
          : isHovered
            ? "0 0 28px rgba(19,93,255,0.60), 0 4px 16px rgba(0,0,0,0.28)"
            : baseShadow,
        transform: isPressed ? "scale(0.93)" : isHovered ? "scale(1.04)" : "scale(1)",
        transition:
          "transform 0.08s cubic-bezier(0.34,1.56,0.64,1), " +
          "background 0.16s ease, " +
          "box-shadow 0.16s ease",
        // keep any colour from extraStyle unless we're in copied state
        color: isCopied ? "#ffffff" : (extraStyle?.color ?? "#ffffff"),
      }}
      {...rest}
    >
      {isCopied ? copiedLabel : children}
    </button>
  );
}

export const InfoBox = memo(function InfoBox({ title, children }) {
  return (
    <div
      style={{
        background: "#081322",
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
