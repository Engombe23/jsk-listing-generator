import { Link } from "react-router-dom";
import Logo from "./Logo";
import { trackEvent } from "../lib/analytics";

const TEXT = "#132A46";
const MUTED = "#4d6a8a";
const DIM = "#7a96b0";
const BORDER = "#dde7f5";
const ACCENT = "#135DFF";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#fff",
        borderTop: `1px solid ${BORDER}`,
        padding: "56px 24px 32px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Top row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 40,
            marginBottom: 48,
          }}
        >
          {/* Brand */}
          <div style={{ maxWidth: 280 }}>
            <Link to="/" style={{ textDecoration: "none", display: "inline-block", marginBottom: 12 }}>
              <Logo height={110} />
            </Link>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, margin: 0 }}>
              AI-powered eBay listing generator built for car parts sellers.
              Save hours, sell more.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: "flex", gap: 64, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: DIM, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
                Product
              </p>
              {[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "FAQ", href: "#faq" },
              ].map(l => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={l.href === "/auth/sign-up" ? () => trackEvent("signup_clicked", { cta_location: "footer" }) : undefined}
                  style={{
                    display: "block",
                    fontSize: 14,
                    color: MUTED,
                    textDecoration: "none",
                    marginBottom: 10,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
                  onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
                >
                  {l.label}
                </a>
              ))}
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: DIM, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
                Contact
              </p>
              <a
                href="mailto:enquiries@partlister.app"
                style={{ display: "block", fontSize: 14, color: MUTED, textDecoration: "none", marginBottom: 10, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
                onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
              >
                enquiries@partlister.app
              </a>
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: DIM, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
                Account
              </p>
              {[
                { label: "Login", href: "/auth/login" },
                { label: "Get Started Free", href: "/auth/sign-up" },
              ].map(l => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={l.href === "/auth/sign-up" ? () => trackEvent("signup_clicked", { cta_location: "footer" }) : undefined}
                  style={{
                    display: "block",
                    fontSize: 14,
                    color: MUTED,
                    textDecoration: "none",
                    marginBottom: 10,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
                  onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div
          style={{
            borderTop: `1px solid ${BORDER}`,
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <p style={{ fontSize: 13, color: DIM, margin: 0 }}>
            © {new Date().getFullYear()} Parts Lister. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
            ].map(l => (
              <a
                key={l.label}
                href={l.href}
                style={{ fontSize: 13, color: DIM, textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
                onMouseLeave={e => (e.currentTarget.style.color = DIM)}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
