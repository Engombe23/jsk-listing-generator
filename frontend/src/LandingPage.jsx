import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const R = "#b70017";
const R_GLOW = "rgba(183,0,23,0.30)";
const BG = "#08090b";
const CARD = "#111317";
const CARD_DARK = "#0d0f12";
const BORDER = "rgba(255,255,255,0.07)";
const TEXT = "#ffffff";
const MUTED = "#9ca3af";
const DIM = "#6b7280";

const FEATURES = [
  {
    icon: "⚡",
    title: "Smart Listing Generator",
    desc: "Generate optimised titles, item specifics, OEM numbers, engine codes and structured descriptions in seconds."
  },
  {
    icon: "🔍",
    title: "Compatibility Checker",
    desc: "Enter a reg or OEM and instantly verify if the part fits — no more guesswork or returns."
  },
  {
    icon: "📊",
    title: "Price & Margin Calculator",
    desc: "Know exactly what to charge. Factor in eBay fees, ads, VAT and profit margins with precision."
  },
  {
    icon: "🖼️",
    title: "Image Tools",
    desc: "Remove backgrounds and prepare clean, professional product images ready for eBay."
  },
  {
    icon: "📈",
    title: "Price Research",
    desc: "See average prices across live eBay listings so you can stay competitive and maximise profit."
  }
];

const BENEFITS = [
  "List products 5–10x faster",
  "Reduce errors and returns",
  "Price with confidence",
  "Create consistent, professional listings",
  "Spend less time listing, more time selling"
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "0 32px",
        height: 68,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: scrolled
          ? "rgba(8,9,11,0.92)"
          : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? `1px solid ${BORDER}` : "1px solid transparent",
        transition: "all 0.3s ease"
      }}
    >
      <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
        <img src="/logo.svg" alt="PartLister" style={{ height: 48 }} />
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link to="/about" style={navLinkStyle}>About</Link>
        <Link to="/pricing" style={navLinkStyle}>Pricing</Link>
        <Link
          to="/auth/login"
          style={{
            padding: "9px 22px",
            borderRadius: 12,
            border: `1px solid ${BORDER}`,
            background: "rgba(255,255,255,0.05)",
            color: TEXT,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 14,
            transition: "all 0.2s"
          }}
        >
          Login
        </Link>
        <Link
          to="/app"
          style={{
            padding: "9px 22px",
            borderRadius: 12,
            background: R,
            color: TEXT,
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 14,
            boxShadow: `0 0 18px ${R_GLOW}`,
            transition: "all 0.2s"
          }}
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}

const navLinkStyle = {
  padding: "9px 16px",
  color: MUTED,
  textDecoration: "none",
  fontWeight: 600,
  fontSize: 14,
  borderRadius: 10,
  transition: "color 0.2s"
};

function Section({ children, style = {} }) {
  return (
    <section
      style={{
        padding: "96px 24px",
        maxWidth: 1160,
        margin: "0 auto",
        ...style
      }}
    >
      {children}
    </section>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(183,0,23,0.12)",
        border: "1px solid rgba(183,0,23,0.25)",
        borderRadius: 999,
        padding: "6px 16px",
        fontSize: 12,
        fontWeight: 700,
        color: "#f87171",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginBottom: 20
      }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div
      style={{
        background: BG,
        color: TEXT,
        fontFamily: "Arial, sans-serif",
        minHeight: "100vh"
      }}
    >
      <Navbar />

      {/* ── HERO ── */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "120px 24px 80px",
          background: `
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(183,0,23,0.22) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 50% 0%, rgba(183,0,23,0.10) 0%, transparent 50%)
          `
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(183,0,23,0.10)",
            border: "1px solid rgba(183,0,23,0.22)",
            borderRadius: 999,
            padding: "7px 18px",
            fontSize: 13,
            fontWeight: 700,
            color: "#fca5a5",
            marginBottom: 28,
            letterSpacing: "0.04em"
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: R, display: "inline-block", boxShadow: `0 0 8px ${R}` }} />
          Designed for Automotive Parts Sellers
        </div>

        <h1
          style={{
            fontSize: "clamp(38px, 6vw, 72px)",
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: "-1.5px",
            maxWidth: 860,
            margin: "0 auto 24px",
            color: TEXT
          }}
        >
          Create Perfect eBay Listings{" "}
          <span
            style={{
              background: `linear-gradient(135deg, #ff4444 0%, ${R} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
          >
            in Seconds
          </span>
          {" "}— Not Hours
        </h1>

        <p
          style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            color: MUTED,
            maxWidth: 620,
            margin: "0 auto 40px",
            lineHeight: 1.7
          }}
        >
          PartLister automates titles, compatibility, pricing and listing data so
          you can list faster, sell more, and scale your parts business.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            to="/app"
            style={{
              padding: "16px 36px",
              borderRadius: 16,
              background: R,
              color: TEXT,
              textDecoration: "none",
              fontWeight: 800,
              fontSize: 16,
              boxShadow: `0 0 32px ${R_GLOW}, 0 8px 24px rgba(0,0,0,0.30)`,
              border: "1px solid rgba(255,255,255,0.08)"
            }}
          >
            Start Listing Smarter →
          </Link>
          <Link
            to="/pricing"
            style={{
              padding: "16px 32px",
              borderRadius: 16,
              background: "rgba(255,255,255,0.05)",
              color: MUTED,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 16,
              border: `1px solid ${BORDER}`
            }}
          >
            View Pricing
          </Link>
        </div>

        <div
          style={{
            marginTop: 72,
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
            justifyContent: "center",
            color: DIM,
            fontSize: 13,
            fontWeight: 600
          }}
        >
          {["No credit card required", "Cancel anytime", "Built for eBay UK"].map((t) => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ color: "#4ade80", fontSize: 16 }}>✓</span>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <div style={{ background: CARD_DARK, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <Section>
          <div style={{ maxWidth: 720 }}>
            <SectionLabel>The Problem</SectionLabel>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 48px)",
                fontWeight: 900,
                letterSpacing: "-0.5px",
                marginBottom: 24,
                lineHeight: 1.15
              }}
            >
              Still Listing Parts Manually?
            </h2>
            <p style={{ fontSize: 18, color: MUTED, lineHeight: 1.8, marginBottom: 32 }}>
              Copying OEM numbers. Formatting descriptions. Checking compatibility. Guessing prices.
            </p>
            <p style={{ fontSize: 18, color: MUTED, lineHeight: 1.8, marginBottom: 32 }}>
              It's slow, repetitive, and easy to get wrong.
            </p>
            <p
              style={{
                fontSize: 18,
                color: "#fca5a5",
                fontWeight: 700,
                lineHeight: 1.8,
                padding: "16px 20px",
                background: "rgba(183,0,23,0.08)",
                border: "1px solid rgba(183,0,23,0.20)",
                borderRadius: 14
              }}
            >
              And every mistake costs you time — and sales.
            </p>
          </div>
        </Section>
      </div>

      {/* ── SOLUTION ── */}
      <Section>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
          <SectionLabel>The Solution</SectionLabel>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 900,
              letterSpacing: "-0.5px",
              marginBottom: 24,
              lineHeight: 1.15
            }}
          >
            Automate Your Entire Listing Workflow
          </h2>
          <p style={{ fontSize: 18, color: MUTED, lineHeight: 1.8, marginBottom: 16 }}>
            PartLister does the heavy lifting for you.
          </p>
          <p style={{ fontSize: 18, color: MUTED, lineHeight: 1.8 }}>
            From a single article or OEM number, generate everything you need
            for a high-converting listing instantly.
          </p>
        </div>
      </Section>

      {/* ── FEATURES ── */}
      <div style={{ background: CARD_DARK, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <Section>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionLabel>Features</SectionLabel>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 48px)",
                fontWeight: 900,
                letterSpacing: "-0.5px",
                lineHeight: 1.15
              }}
            >
              Everything You Need to List at Scale
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 20
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: CARD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 20,
                  padding: 28,
                  transition: "border-color 0.2s",
                  cursor: "default"
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "rgba(183,0,23,0.12)",
                    border: "1px solid rgba(183,0,23,0.20)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    marginBottom: 18
                  }}
                >
                  {f.icon}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    marginBottom: 10,
                    color: TEXT
                  }}
                >
                  {f.title}
                </div>
                <div style={{ fontSize: 15, color: MUTED, lineHeight: 1.65 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── BENEFITS ── */}
      <Section>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 64,
            alignItems: "center"
          }}
        >
          <div>
            <SectionLabel>Benefits</SectionLabel>
            <h2
              style={{
                fontSize: "clamp(26px, 3.5vw, 44px)",
                fontWeight: 900,
                letterSpacing: "-0.5px",
                marginBottom: 36,
                lineHeight: 1.15
              }}
            >
              Built for Automotive Sellers Who Want to Scale
            </h2>
            <div style={{ display: "grid", gap: 16 }}>
              {BENEFITS.map((b) => (
                <div
                  key={b}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 18px",
                    background: CARD,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 14,
                    fontSize: 15,
                    fontWeight: 600,
                    color: TEXT
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "rgba(74,222,128,0.12)",
                      border: "1px solid rgba(74,222,128,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      color: "#4ade80",
                      flexShrink: 0
                    }}
                  >
                    ✓
                  </span>
                  {b}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 28,
              padding: 36,
              boxShadow: `0 0 0 1px rgba(183,0,23,0.12), 0 0 60px rgba(183,0,23,0.08), 0 32px 64px rgba(0,0,0,0.40)`
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: DIM,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.06em"
              }}
            >
              Time Saved Per Listing
            </div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: "#4ade80",
                letterSpacing: "-2px",
                lineHeight: 1,
                marginBottom: 8
              }}
            >
              ~15 min
            </div>
            <div style={{ fontSize: 15, color: MUTED, marginBottom: 32 }}>
              Average time saved per listing vs. manual workflow
            </div>

            <div style={{ height: 1, background: BORDER, marginBottom: 32 }} />

            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: DIM,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.06em"
              }}
            >
              Listing Errors Eliminated
            </div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: R,
                letterSpacing: "-2px",
                lineHeight: 1,
                marginBottom: 8
              }}
            >
              95%
            </div>
            <div style={{ fontSize: 15, color: MUTED }}>
              Reduction in compatibility and pricing mistakes
            </div>
          </div>
        </div>
      </Section>

      {/* ── SOCIAL PROOF ── */}
      <div style={{ background: CARD_DARK, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <Section style={{ textAlign: "center" }}>
          <SectionLabel>Why PartLister</SectionLabel>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 900,
              letterSpacing: "-0.5px",
              marginBottom: 24,
              lineHeight: 1.15
            }}
          >
            Designed for Real Parts Sellers
          </h2>
          <p
            style={{
              fontSize: 18,
              color: MUTED,
              maxWidth: 600,
              margin: "0 auto 16px",
              lineHeight: 1.75
            }}
          >
            Built around real workflows used by automotive eCommerce businesses.
          </p>
          <p
            style={{
              fontSize: 18,
              color: MUTED,
              maxWidth: 560,
              margin: "0 auto",
              lineHeight: 1.75
            }}
          >
            No fluff. No unnecessary features. Just tools that save time and
            make money.
          </p>
        </Section>
      </div>

      {/* ── FINAL CTA ── */}
      <div
        style={{
          background: `linear-gradient(135deg, #1a0205 0%, #0d0002 50%, #08090b 100%)`,
          borderTop: `1px solid rgba(183,0,23,0.20)`
        }}
      >
        <Section style={{ textAlign: "center" }}>
          <div
            style={{
              maxWidth: 680,
              margin: "0 auto",
              padding: "40px 48px",
              background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(183,0,23,0.18) 0%, transparent 70%)`,
              borderRadius: 32,
              border: `1px solid rgba(183,0,23,0.15)`
            }}
          >
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 50px)",
                fontWeight: 900,
                letterSpacing: "-0.5px",
                marginBottom: 20,
                lineHeight: 1.1
              }}
            >
              Start Listing Smarter Today
            </h2>
            <p style={{ fontSize: 18, color: MUTED, lineHeight: 1.75, marginBottom: 12 }}>
              Stop wasting hours on manual listings.
            </p>
            <p style={{ fontSize: 18, color: MUTED, lineHeight: 1.75, marginBottom: 40 }}>
              Let PartLister handle the work so you can focus on growing your
              business.
            </p>
            <Link
              to="/app"
              style={{
                display: "inline-block",
                padding: "18px 48px",
                borderRadius: 16,
                background: R,
                color: TEXT,
                textDecoration: "none",
                fontWeight: 800,
                fontSize: 18,
                boxShadow: `0 0 40px ${R_GLOW}, 0 12px 32px rgba(0,0,0,0.35)`,
                border: "1px solid rgba(255,255,255,0.08)"
              }}
            >
              Get Started →
            </Link>
          </div>
        </Section>
      </div>

      {/* ── FOOTER ── */}
      <div
        style={{
          borderTop: `1px solid ${BORDER}`,
          padding: "32px 24px",
          textAlign: "center"
        }}
      >
        <div
          style={{
            maxWidth: 1160,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16
          }}
        >
          <img src="/logo.svg" alt="PartLister" style={{ height: 40, opacity: 0.7 }} />
          <div style={{ fontSize: 13, color: DIM }}>
            © {new Date().getFullYear()} PartLister. All rights reserved.
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["About", "Pricing", "Login"].map((l) => (
              <Link
                key={l}
                to={`/${l.toLowerCase()}`}
                style={{ fontSize: 13, color: DIM, textDecoration: "none" }}
              >
                {l}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
