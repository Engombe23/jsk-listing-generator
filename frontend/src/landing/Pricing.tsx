import React from "react";
import { Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Reveal, Section } from "./Primitives";
import { useSession } from "../context/SessionContext";
import { redirectToStripeCheckout } from "../lib/billing";

const plans = [
  {
    name: "Lite",
    price: "19",
    tagline: "For occasional sellers and smaller inventories.",
    features: [
      "50 listings / month",
      "Listing Generator",
      "Price Calculator",
      "Seller Preferences",
      "Export Listings to CSV",
      "Saved Listings",
    ],
    cta: "Start with Lite",
    featured: false,
  },
  {
    name: "Growth",
    price: "49",
    tagline: "For growing automotive businesses.",
    features: [
      "200 listings / month",
      "Everything in Lite",
      "Compatibility Checker",
      "Smart Pricing",
      "Priority Support",
    ],
    cta: "Start with Growth",
    featured: true,
  },
  {
    name: "Scale",
    price: "99",
    tagline: "For larger operations and teams.",
    features: [
      "Unlimited listings",
      "Everything in Growth",
      "Bulk Listing Generation",
      "Bulk CSV Export",
      "Early Access Features",
    ],
    cta: "Start with Scale",
    featured: false,
  },
];

export function Pricing() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);

  const handlePlanClick = async (planKey: string) => {
    setCheckoutError(null);
    if (session) {
      setLoadingPlan(planKey);
      try {
        await redirectToStripeCheckout({ plan: planKey, interval: "monthly" });
      } catch (err: any) {
        setCheckoutError(err?.message || "Checkout failed. Please try again.");
        setLoadingPlan(null);
      }
    } else {
      navigate(`/auth/sign-up?plan=${planKey}&interval=monthly`);
    }
  };

  return (
    <Section id="pricing" className="relative overflow-hidden bg-[#081326] py-24 text-white sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 30%, #14294a 0%, #0c1c38 48%, #060f1f 100%)" }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 40% 50% at 8% 6%, rgba(37,120,255,0.45), transparent 60%), radial-gradient(ellipse 42% 52% at 92% 12%, rgba(90,160,255,0.35), transparent 60%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.45] [mask-image:radial-gradient(ellipse_at_50%_35%,black,transparent_78%)]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.11) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      </div>

      <Reveal className="mx-auto max-w-2xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em] text-blue-200 backdrop-blur">
          Pricing
        </div>
        <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-tightest text-white text-balance">
          Simple pricing that scales with you
        </h2>
        <p className="mt-4 text-balance text-center text-[1.05rem] leading-relaxed text-blue-100/70">
          Start free with 10 listings. Upgrade when you are ready. No contracts, cancel anytime.
        </p>
      </Reveal>

      <div className="mt-14 grid items-start gap-6 lg:grid-cols-3">
        {plans.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.08}>
            <div
              className={`relative flex h-full flex-col rounded-3xl p-8 backdrop-blur transition-all duration-300 ${
                p.featured
                  ? "border-2 border-primary bg-gradient-to-b from-[#12305e] to-[#0d1f3d] text-white shadow-[0_30px_80px_-24px_rgba(19,93,255,0.55)] lg:-mt-4 lg:mb-4"
                  : "border border-white/10 bg-white/[0.04] shadow-[0_20px_50px_-30px_rgba(0,0,0,0.8)] hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3.5 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-white shadow-chip">
                  Most Popular
                </span>
              )}

              <div className="mb-6">
                <h3 className="font-display text-[1.3rem] font-bold text-white">{p.name}</h3>
                <p className={`mt-1 text-[0.9rem] ${p.featured ? "text-white/70" : "text-blue-100/60"}`}>{p.tagline}</p>
              </div>

              <div className="mb-6 flex items-end gap-1">
                <span className="font-display text-[3.2rem] font-extrabold leading-none tracking-tightest text-white">£{p.price}</span>
                <span className={`mb-1.5 text-[0.95rem] ${p.featured ? "text-white/60" : "text-blue-100/50"}`}>/month</span>
              </div>

              <button
                onClick={() => handlePlanClick(p.name.toLowerCase())}
                disabled={loadingPlan === p.name.toLowerCase()}
                className={`group inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-semibold transition-all duration-200 hover:-translate-y-0.5 cursor-pointer disabled:opacity-70 disabled:cursor-wait ${
                  p.featured
                    ? "bg-primary text-white shadow-[0_10px_28px_-8px_rgba(19,93,255,0.7)] hover:bg-white hover:text-navy"
                    : "border border-white/15 bg-white/10 text-white hover:border-primary hover:bg-primary"
                }`}
              >
                {loadingPlan === p.name.toLowerCase() ? "Redirecting…" : p.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              <ul className="mt-7 flex flex-col gap-3.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${p.featured ? "bg-primary text-white" : "bg-primary/20 text-blue-300"}`}>
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span className={`text-[0.95rem] ${p.featured ? "text-white/90" : "text-blue-100/80"}`}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>

      {checkoutError && (
        <div className="mx-auto mt-6 max-w-md rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-center text-[0.9rem] text-red-300">
          {checkoutError}
        </div>
      )}
    </Section>
  );
}

export default Pricing;
