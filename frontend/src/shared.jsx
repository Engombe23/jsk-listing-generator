import React, { memo, useState, useCallback } from "react";

export const BUTTON_BASE = {
  padding: "13px 16px",
  borderRadius: 16,
  border: "1px solid var(--border-strong)",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
  transition: "all 0.2s ease"
};

export const SMALL_BUTTON_STYLE = {
  ...BUTTON_BASE,
  background: "var(--blue)",
  color: "#fff",
  padding: "10px 14px",
  boxShadow: "0 0 16px var(--blue-glow)"
};

export const INPUT_STYLE = {
  width: "100%",
  padding: "14px 14px",
  borderRadius: 16,
  border: "1px solid var(--border)",
  background: "var(--bg-input)",
  color: "var(--text)",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
};

export const TEXTAREA_STYLE = {
  width: "100%",
  padding: 14,
  borderRadius: 16,
  border: "1px solid var(--border)",
  background: "var(--bg-input)",
  color: "var(--text)",
  fontSize: 14,
  fontFamily: "monospace",
  outline: "none",
  resize: "vertical",
  boxSizing: "border-box",
};

export function primaryButtonStyle(disabled) {
  return {
    ...BUTTON_BASE,
    background: disabled ? "var(--text-dim)" : "var(--blue)",
    color: "#fff",
    boxShadow: disabled ? "none" : "0 0 18px var(--blue-glow), 0 8px 20px rgba(0,0,0,0.18)"
  };
}

export const StatPill = memo(function StatPill({ value }) {
  return (
    <div style={{
      padding: "11px 16px",
      borderRadius: 999,
      background: "var(--bg-surface2)",
      border: "1px solid var(--border)",
      color: "var(--text)",
      fontSize: 13,
      fontWeight: 600,
    }}>
      {value}
    </div>
  );
});

export const Card = memo(function Card({ title, subtitle, icon, children, centeredTitle = false, glow = false }) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      borderRadius: 16,
      padding: "20px 22px",
      border: "1px solid var(--border)",
      boxShadow: glow ? "0 0 0 1px var(--border-blue), 0 0 20px var(--blue-glow), var(--shadow)" : "var(--shadow)"
    }}>
      {(title || subtitle) && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: subtitle ? 4 : 0 }}>
            {icon && (
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--blue-bg)", border: "1px solid var(--border-blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
              </div>
            )}
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", textAlign: centeredTitle && !icon ? "center" : "left", flex: centeredTitle && !icon ? 1 : undefined }}>
              {title}
            </div>
          </div>
          {subtitle && (
            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55, marginLeft: icon ? 44 : 0, textAlign: centeredTitle && !icon ? "center" : "left" }}>
              {subtitle}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
});

export const FieldLabel = memo(function FieldLabel({ children }) {
  return (
    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>
      {children}
    </label>
  );
});

export const TextInput = memo(function TextInput({ value, onChange, onKeyDown, placeholder, type = "text" }) {
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

export const EditableTextarea = memo(function EditableTextarea({ value, onChange, placeholder, minHeight = 220 }) {
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

export const ReadOnlyTextarea = memo(function ReadOnlyTextarea({ value, minHeight = 220 }) {
  return (
    <textarea
      value={value}
      readOnly
      spellCheck={false}
      style={{ ...TEXTAREA_STYLE, minHeight, background: "var(--bg-surface3)" }}
    />
  );
});

// ─── CopyButton ───────────────────────────────────────────────────────────────
export function CopyButton({ value, onCopy, children, copiedLabel = "✓ Copied!", style: extraStyle, ...rest }) {
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

  const baseBg     = extraStyle?.background ?? SMALL_BUTTON_STYLE.background;
  const baseShadow = extraStyle?.boxShadow  ?? SMALL_BUTTON_STYLE.boxShadow;

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setPhase((p) => p === "idle"                   ? "hover"   : p)}
      onMouseLeave={() => setPhase((p) => p === "hover" || p === "pressed" ? "idle"  : p)}
      onMouseDown={() =>  setPhase((p) => p !== "copied"                 ? "pressed" : p)}
      onMouseUp={() =>    setPhase((p) => p === "pressed"                ? "hover"   : p)}
      style={{
        ...SMALL_BUTTON_STYLE,
        ...extraStyle,
        background: isCopied ? "#16a34a" : baseBg,
        boxShadow:  isCopied
          ? "0 0 22px rgba(22,163,74,0.50)"
          : isHovered
            ? "0 0 28px var(--blue-glow), 0 4px 16px rgba(0,0,0,0.18)"
            : baseShadow,
        transform: isPressed ? "scale(0.93)" : isHovered ? "scale(1.04)" : "scale(1)",
        transition: "transform 0.08s cubic-bezier(0.34,1.56,0.64,1), background 0.16s ease, box-shadow 0.16s ease",
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
    <div style={{
      background: "var(--bg-surface3)",
      border: "1px solid var(--border)",
      borderRadius: 20,
      padding: 16,
      alignSelf: "start"
    }}>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
});
