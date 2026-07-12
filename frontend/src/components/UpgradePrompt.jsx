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
      <div style={{ fontSize: 18, flexShrink: 0 }}>⚡</div>
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
