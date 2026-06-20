import { useState } from "react";
import { trackEvent } from "../lib/analytics";

const TEXT = "#132A46";
const MUTED = "#4d6a8a";
const DIM = "#7a96b0";
const ACCENT = "#135DFF";
const ACCENT_LIGHT = "#EEF5FF";
const BORDER = "#dde7f5";
const BG_ALT = "#f4f7fc";

function CheckIcon({ color = ACCENT }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

type FeatureItem = string | { name: string; included: boolean };

const plans: {
  name: string;
  price: string;
  period: string;
  tagline: string;
  cta: string;
  badge?: string;
  recommended?: boolean;
  features: FeatureItem[];
}[] = [
  {
    name: "Free",
    price: "£0",
    period: "forever",
    tagline: "Try the core tools, no card needed.",
    cta: "Get started free",
    features: [
      "Listing Generator",
      "Basic Price Calculator",
      { name: "CSV Export", included: false },
      { name: "Seller Preferences", included: false },
      { name: "Compatibility Checker", included: false },
      { name: "Smart Pricing", included: false },
      { name: "Engine Code Output", included: false },
      { name: "Saved History", included: false },
    ],
  },
  {
    name: "Starter",
    price: "£24",
    period: "per month",
    tagline: "For solo sellers getting organised.",
    cta: "Start Starter",
    features: [
      "Listing Generator",
      "Basic Price Calculator",
      "CSV Export",
      "Seller Preferences",
      "Saved History (100/mo)",
      { name: "Compatibility Checker", included: false },
      { name: "Smart Pricing", included: false },
      { name: "Engine Code Output", included: false },
    ],
  },
  {
    name: "Pro",
    price: "£59",
    period: "per month",
    tagline: "The full toolkit for serious sellers.",
    cta: "Start Pro",
    badge: "Most popular",
    recommended: true,
    features: [
      "Everything in Starter",
      "Compatibility Checker",
      "Smart Pricing (live eBay data)",
      "Engine Code Output",
      "Advanced CSV Export",
      "Saved History (500/mo)",
      "Priority support",
    ],
  },
  {
    name: "Power",
    price: "£129",
    period: "per month",
    tagline: "High-volume operations at scale.",
    cta: "Start Power",
    features: [
      "Everything in Pro",
      "Bulk CSV Generation",
      "Bulk Listing Import",
      "Saved History (2,000/mo)",
      "API access (coming soon)",
      "Dedicated account manager",
    ],
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" style={{ background: "#0d1f35", padding: "90px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "6px 16px", marginBottom: 20 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: ACCENT, letterSpacing: "0.04em" }}>PRICING</span>
          </div>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 700, color: "#ffffff", margin: "0 0 16px", lineHeight: 1.2 }}>
            Simple, transparent pricing
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", maxWidth: 460, margin: "0 auto 28px", lineHeight: 1.6 }}>
            Start free. Upgrade when you need more power. No hidden fees.
          </p>

          {/* Toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 30, padding: "5px 6px" }}>
            <button
              onClick={() => setAnnual(false)}
              style={{
                background: !annual ? ACCENT : "transparent",
                color: !annual ? "#fff" : MUTED,
                border: "none", borderRadius: 24, padding: "7px 20px",
                fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{
                background: annual ? ACCENT : "transparent",
                color: annual ? "#fff" : MUTED,
                border: "none", borderRadius: 24, padding: "7px 20px",
                fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              Annual
              <span style={{ background: "#dcfce7", color: "#166534", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>-20%</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, alignItems: "start" }}>
          {plans.map((plan) => {
            const isRec = plan.recommended;
            // Apply annual discount to paid plans
            const priceDisplay = (() => {
              if (plan.price === "£0") return "£0";
              if (!annual) return plan.price;
              const num = parseInt(plan.price.replace("£", ""));
              return `£${Math.round(num * 0.8)}`;
            })();

            return (
              <div
                key={plan.name}
                style={{
                  background: "#fff",
                  border: isRec ? `2px solid ${ACCENT}` : `1px solid ${BORDER}`,
                  borderRadius: 16,
                  padding: 24,
                  position: "relative",
                  boxShadow: isRec ? `0 0 0 4px ${ACCENT_LIGHT}` : "none",
                }}
              >
                {/* Badge */}
                {plan.badge && (
                  <div style={{
                    position: "absolute",
                    top: -13,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: ACCENT,
                    color: "#fff",
                    borderRadius: 20,
                    padding: "4px 14px",
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    letterSpacing: "0.04em",
                  }}>
                    {plan.badge}
                  </div>
                )}

                {/* Plan name & price */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isRec ? ACCENT : DIM, marginBottom: 8, letterSpacing: "0.03em" }}>{plan.name.toUpperCase()}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: TEXT }}>{priceDisplay}</span>
                    {plan.price !== "£0" && (
                      <span style={{ fontSize: 13, color: DIM }}>/{annual ? "mo billed annually" : "month"}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: MUTED }}>{plan.tagline}</div>
                </div>

                {/* CTA */}
                <a
                  href="/auth/sign-up"
                  onClick={() => trackEvent("signup_clicked", { cta_location: "pricing_section", plan_name: plan.name })}
                  style={{
                    display: "block",
                    textAlign: "center",
                    background: isRec ? ACCENT : "#fff",
                    color: isRec ? "#fff" : ACCENT,
                    border: `1.5px solid ${isRec ? ACCENT : BORDER}`,
                    borderRadius: 8,
                    padding: "11px 0",
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: "none",
                    marginBottom: 24,
                    transition: "opacity 0.15s",
                  }}
                >
                  {plan.cta}
                </a>

                {/* Features */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {plan.features.map((f, i) => {
                    const isStr = typeof f === "string";
                    const included = isStr ? true : f.included;
                    const name = isStr ? f : f.name;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: included ? 1 : 0.45 }}>
                        <div style={{ flexShrink: 0, width: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {included ? <CheckIcon color={isRec ? ACCENT : "#16a34a"} /> : <CrossIcon />}
                        </div>
                        <span style={{ fontSize: 13, color: included ? TEXT : DIM, lineHeight: 1.4 }}>{name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p style={{ textAlign: "center", fontSize: 13, color: DIM, marginTop: 36 }}>
          All plans include VAT. Cancel anytime. Questions?{" "}
          <a href="mailto:hello@partlister.co.uk" style={{ color: ACCENT, textDecoration: "none" }}>hello@partlister.co.uk</a>
        </p>
      </div>
    </section>
  );
}
