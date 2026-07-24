import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useSession } from "../../context/SessionContext";
import { redirectToStripeCheckout } from "../../lib/billing";
import {
  getBillingLabel,
  getDisplayPrice,
  getPlan,
  isValidPaidPlan,
} from "../../lib/plans";
import CheckoutSteps, { checkoutAuthHref } from "./CheckoutSteps";
import "../auth/auth.css";

export default function CheckoutSummaryPage() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || "";
  const interval = searchParams.get("interval") || "monthly";
  const { session } = useSession();
  const user = session?.user;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isValidPaidPlan(plan, interval)) {
    return <Navigate to="/pricing" replace />;
  }

  const planInfo = getPlan(plan);
  const displayPrice = getDisplayPrice(plan, interval);
  const annualTotal = interval === "annual" ? planInfo.monthlyPrice * 12 * 0.8 : null;

  async function handleContinueToPayment() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await redirectToStripeCheckout({
        plan,
        interval,
        userId: user.id,
        email: user.email,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment");
      setLoading(false);
    }
  }

  return (
    <div
      className="auth-page"
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div className="auth-card" style={{ maxWidth: 480, width: "100%" }}>
        <img src="/logo.png" alt="PartLister" className="auth-logo" />
        <h1 className="auth-title">Review your order</h1>
        <p className="auth-subtitle">Confirm your plan before creating an account and paying.</p>

        <CheckoutSteps activeStep={1} />

        <div style={{
          background: "#f8fafc",
          border: "1px solid #dde7f5",
          borderRadius: 12,
          padding: "18px 20px",
          marginBottom: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#135DFF", letterSpacing: "0.04em", marginBottom: 4 }}>
                {planInfo.name.toUpperCase()}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#132A46" }}>{planInfo.tagline}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#132A46" }}>{displayPrice}</div>
              <div style={{ fontSize: 12, color: "#7a96b0" }}>
                /{interval === "annual" ? "mo" : "month"}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: "#4d6a8a", marginBottom: 12 }}>
            {getBillingLabel(interval)}
            {annualTotal != null && (
              <span> · £{annualTotal.toFixed(0)} due today</span>
            )}
          </div>

          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#4d6a8a", lineHeight: 1.7 }}>
            {planInfo.features.slice(0, 4).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>

        <p style={{ fontSize: 12, color: "#7a96b0", textAlign: "center", marginBottom: 16 }}>
          VAT included. Cancel anytime.
        </p>

        {error && <p className="text-sm text-red-500" style={{ marginBottom: 12 }}>{error}</p>}

        {user ? (
          <button type="button" onClick={handleContinueToPayment} disabled={loading} style={{ width: "100%" }}>
            {loading ? "Redirecting to payment…" : "Continue to payment"}
          </button>
        ) : (
          <>
            <Link
              to={checkoutAuthHref("/auth/sign-up", plan, interval)}
              style={{ display: "block", width: "100%", textAlign: "center", textDecoration: "none", marginBottom: 12 }}
            >
              <button type="button" style={{ width: "100%" }}>
                Create account & continue
              </button>
            </Link>
            <p className="text-center text-sm">
              <span className="auth-footer-text">Already have an account? </span>
              <Link to={checkoutAuthHref("/auth/login", plan, interval)}>Sign in</Link>
            </p>
          </>
        )}

        <div className="text-center" style={{ marginTop: 24 }}>
          <Link to="/pricing" className="auth-back-link">← Change plan</Link>
        </div>
      </div>
    </div>
  );
}
