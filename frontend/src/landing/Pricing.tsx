import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "../lib/analytics";
import { checkoutSearchParams } from "../lib/plans";
// ─── Premium dark palette for this section only ────────────────────────────
const BG          = "#0a0e17";
const CARD_BG     = "#11151f";
const SCALE_BG    = "linear-gradient(160deg, #12161f 0%, #161a26 100%)";
const TEXT        = "#f5f7fa";
const MUTED       = "#9aa3b8";
const DIM         = "#5b6478";
const BORDER      = "rgba(255,255,255,0.08)";
const BORDER_SOFT = "rgba(255,255,255,0.06)";
const ACCENT      = "#135DFF";
const ACCENT_SOFT = "rgba(19,93,255,0.12)";
const GOLD        = "#e8b95e";

function CheckIcon({ color = ACCENT }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

type Plan = {
  name: string;
  price: number;
  tagline: string;
  cta: string;
  listings: string;
  inherits?: string;
  groups: { label: string; items: string[] }[];
  badge?: string;
  tier: "lite" | "growth" | "scale";
};

const plans: Plan[] = [
  {
    name: "Lite",
    price: 19,
    tagline: "For occasional sellers and smaller inventories.",
    cta: "Start with Lite",
    listings: "50 listings / month",
    tier: "lite",
    groups: [
      {
        label: "Core Tools",
        items: ["Listing Generator", "Price Calculator", "Seller Preferences", "Export Listings to CSV", "Saved Listings"],
      },
    ],
  },
  {
    name: "Growth",
    price: 49,
    tagline: "For growing automotive businesses.",
    cta: "Start with Growth",
    listings: "200 listings / month",
    inherits: "Everything in Lite",
    badge: "Most Popular",
    tier: "growth",
    groups: [
      {
        label: "Advanced Tools",
        items: ["Compatibility Checker", "Smart Pricing", "Priority Support"],
      },
    ],
  },
  {
    name: "Scale",
    price: 99,
    tagline: "For larger operations and teams.",
    cta: "Start with Scale",
    listings: "Unlimited listings",
    inherits: "Everything in Growth",
    tier: "scale",
    groups: [
      {
        label: "Scale Features",
        items: ["Bulk Listing Generation", "Bulk CSV Export", "Priority Support", "Early Access Features"],
      },
    ],
  },
];

function PlanCard({ plan, annual }: { plan: Plan; annual: boolean }) {
  const navigate = useNavigate();
  const isGrowth = plan.tier === "growth";
  const isScale  = plan.tier === "scale";
  const displayPrice = annual ? Math.round(plan.price * 0.8) : plan.price;
  const interval = annual ? "annual" : "monthly";
  const checkoutHref = `/checkout?${checkoutSearchParams(plan.tier, interval)}`;

  function handleCtaClick(e: React.MouseEvent) {
    e.preventDefault();
    trackEvent("signup_clicked", {
      cta_location: "pricing_section",
      plan_name: plan.name,
      billing_period: interval,
    });
    navigate(checkoutHref);
  }

  return (
    <div
      className={isGrowth ? "pricing-growth-card" : ""}
      style={{
        position: "relative",
        background: isScale ? SCALE_BG : CARD_BG,
        border: isGrowth ? `1.5px solid ${ACCENT}` : `1px solid ${isScale ? "rgba(255,255,255,0.12)" : BORDER_SOFT}`,
        borderRadius: 20,
        padding: isGrowth ? "44px 32px 32px" : "36px 28px",
        boxShadow: isGrowth
          ? "0 0 0 1px rgba(19,93,255,0.15), 0 24px 60px rgba(19,93,255,0.22), 0 8px 24px rgba(0,0,0,0.4)"
          : "0 8px 24px rgba(0,0,0,0.3)",
        transform: isGrowth ? "translateY(-14px)" : "none",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Most Popular badge */}
      {plan.badge && (
        <div style={{
          position: "absolute", top: -15, left: "50%", transform: "translateX(-50%)",
          background: `linear-gradient(90deg, ${ACCENT} 0%, #3b7dff 100%)`,
          color: "#fff", borderRadius: 20, padding: "5px 16px",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", whiteSpace: "nowrap",
          boxShadow: "0 4px 14px rgba(19,93,255,0.45)",
        }}>
          ⭐ {plan.badge}
        </div>
      )}

      {/* Plan name */}
      <div style={{
        fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
        color: isGrowth ? ACCENT : isScale ? GOLD : MUTED, marginBottom: 14,
      }}>
        {plan.name}
      </div>

      {/* Price */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: isGrowth ? 48 : 40, fontWeight: 800, color: TEXT, letterSpacing: "-0.02em" }}>£{displayPrice}</span>
        <span style={{ fontSize: 14, color: DIM, fontWeight: 600 }}>/mo</span>
      </div>
      {annual && (
        <div style={{ fontSize: 12, color: DIM, marginBottom: 8 }}>
          billed annually (£{displayPrice * 12}/yr) · was £{plan.price}/mo
        </div>
      )}

      {/* Listings badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14,
        fontSize: 12.5, fontWeight: 600,
        color: isScale ? GOLD : isGrowth ? ACCENT : MUTED,
      }}>
        {isScale && (
          <span style={{
            background: "rgba(232,185,94,0.12)", border: "1px solid rgba(232,185,94,0.3)",
            borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700,
          }}>
            ∞ UNLIMITED
          </span>
        )}
        {!isScale && plan.listings}
      </div>

      <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.55, marginBottom: 26, minHeight: 38 }}>
        {plan.tagline}
      </div>

      {/* CTA */}
      <a
        href={checkoutHref}
        onClick={handleCtaClick}
        style={{
          display: "block", textAlign: "center", borderRadius: 10,
          padding: "13px 0", fontSize: 14, fontWeight: 700, textDecoration: "none",
          marginBottom: 28, transition: "opacity 0.15s, transform 0.15s",
          background: isGrowth ? `linear-gradient(90deg, ${ACCENT} 0%, #3b7dff 100%)` : "transparent",
          color: isGrowth ? "#fff" : isScale ? GOLD : TEXT,
          border: isGrowth ? "none" : `1.5px solid ${isScale ? "rgba(232,185,94,0.4)" : "rgba(255,255,255,0.16)"}`,
          boxShadow: isGrowth ? "0 8px 24px rgba(19,93,255,0.35)" : "none",
        }}
      >
        {plan.cta}
      </a>

      {/* Inherited tier line */}
      {plan.inherits && (
        <div style={{
          display: "flex", alignItems: "center", gap: 9, marginBottom: 14,
          fontSize: 13, fontWeight: 700, color: TEXT,
        }}>
          <CheckIcon color={isGrowth ? ACCENT : isScale ? GOLD : ACCENT} />
          {plan.inherits}
        </div>
      )}

      {/* Feature groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {plan.groups.map((group) => (
          <div key={group.label}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
              color: DIM, marginBottom: 10,
            }}>
              {group.label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {group.items.map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ flexShrink: 0, width: 16, display: "flex" }}>
                    <CheckIcon color={isGrowth ? ACCENT : isScale ? GOLD : "#4ade80"} />
                  </div>
                  <span style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" style={{ background: BG, padding: "100px 24px 110px" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: ACCENT_SOFT, border: "1px solid rgba(19,93,255,0.25)",
            borderRadius: 20, padding: "6px 16px", marginBottom: 22,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: ACCENT, letterSpacing: "0.04em" }}>PRICING</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: TEXT, margin: "0 0 16px", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            Choose Your Plan
          </h2>
          <p style={{ fontSize: 16, color: MUTED, maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.6 }}>
            Generate professional listings in just a few clicks.
          </p>

          {/* Monthly / Annual toggle */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: CARD_BG, border: `1px solid ${BORDER_SOFT}`, borderRadius: 30, padding: 5,
          }}>
            <button
              onClick={() => setAnnual(false)}
              style={{
                background: !annual ? ACCENT : "transparent",
                color: !annual ? "#fff" : MUTED,
                border: "none", borderRadius: 24, padding: "8px 22px",
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
                border: "none", borderRadius: 24, padding: "8px 22px",
                fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              Annual
              <span style={{
                background: annual ? "rgba(255,255,255,0.2)" : "rgba(74,222,128,0.15)",
                color: annual ? "#fff" : "#4ade80",
                borderRadius: 10, padding: "2px 8px", fontSize: 11, fontWeight: 700,
              }}>
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="pricing-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 28,
          alignItems: "stretch",
          paddingTop: 14,
        }}>
          {plans.map((plan) => <PlanCard key={plan.name} plan={plan} annual={annual} />)}
        </div>

        {/* Footer note */}
        <p style={{ textAlign: "center", fontSize: 13, color: DIM, marginTop: 56 }}>
          All plans include VAT. Cancel anytime. Questions?{" "}
          <a href="mailto:enquiries@partlister.app" style={{ color: ACCENT, textDecoration: "none" }}>enquiries@partlister.app</a>
        </p>
      </div>
    </section>
  );
}