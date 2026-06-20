import { trackEvent } from "../lib/analytics";

const ACCENT = "#135DFF";
const TEXT = "#132A46";
const MUTED = "#4d6a8a";

export default function FinalCTA() {
  return (
    <section
      style={{
        background: `linear-gradient(135deg, #0d1f35 0%, #135DFF 100%)`,
        padding: "100px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "clamp(2rem, 4vw, 2.75rem)",
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            marginBottom: 20,
          }}
        >
          Ready to build better listings faster?
        </h2>
        <p
          style={{
            fontSize: "1.1rem",
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.7,
            marginBottom: 40,
            maxWidth: 500,
            margin: "0 auto 40px",
          }}
        >
          Generate your first car parts listing in minutes — no credit card required.
          Join 2,400+ eBay sellers already saving hours every week.
        </p>

        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            href="/auth/sign-up"
            onClick={() => trackEvent("signup_clicked", { cta_location: "final_cta" })}
            style={{
              padding: "14px 32px",
              fontSize: "1rem",
              fontWeight: 700,
              color: ACCENT,
              background: "#ffffff",
              borderRadius: 12,
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 24px rgba(19,93,255,0.45)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 20px rgba(19,93,255,0.35)";
            }}
          >
            Generate 10 Listings Free
          </a>
          <a
            href="#features"
            style={{
              padding: "14px 32px",
              fontSize: "1rem",
              fontWeight: 600,
              color: "rgba(255,255,255,0.9)",
              background: "rgba(255,255,255,0.12)",
              borderRadius: 12,
              textDecoration: "none",
              border: `2px solid rgba(255,255,255,0.35)`,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.22)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.12)";
            }}
          >
            See How It Works
          </a>
        </div>
      </div>
    </section>
  );
}
