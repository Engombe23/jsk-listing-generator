import { Link } from "react-router-dom";

// Dismissible "you've hit your listing limit" banner — used in the Listing
// Generator. Compatibility Checker / Smart Pricing already have their own
// bespoke locked-feature panels (App.jsx tab hiding, PriceCalculator's
// SmartPricingLocked), so this is just for the usage-limit case.
export function UpgradeBanner({ message, onDismiss }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      background: "var(--yellow-bg)", border: "1px solid rgba(217,119,6,0.3)",
      borderRadius: 12, padding: "14px 16px", marginBottom: 16,
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: "var(--yellow, #d97706)", marginTop: 2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, lineHeight: 1.5 }}>{message}</div>
        <Link to="/pricing" style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10,
          fontSize: 12.5, fontWeight: 700, color: "var(--blue)", textDecoration: "none",
        }}>
          Upgrade Plan →
        </Link>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} style={{
          background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16, flexShrink: 0,
        }}>×</button>
      )}
    </div>
  );
}
