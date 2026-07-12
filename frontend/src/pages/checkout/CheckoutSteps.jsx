import { checkoutSearchParams } from "../../lib/plans";

const STEPS = ["Plan", "Account", "Payment"];

export default function CheckoutSteps({ activeStep }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
      {STEPS.map((label, i) => {
        const step = i + 1;
        const isActive = step === activeStep;
        const isDone = step < activeStep;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {i > 0 && (
              <div style={{ width: 24, height: 1, background: isDone ? "#135DFF" : "#dde7f5" }} />
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center",
                fontSize: 11, fontWeight: 700,
                background: isActive || isDone ? "#135DFF" : "#eef2f8",
                color: isActive || isDone ? "#fff" : "#7a96b0",
              }}>
                {isDone ? "✓" : step}
              </span>
              <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? "#132A46" : "#7a96b0" }}>
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function checkoutAuthHref(path, plan, interval) {
  return `${path}?${checkoutSearchParams(plan, interval)}`;
}
