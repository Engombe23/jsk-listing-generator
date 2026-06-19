import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { supabase } from "../lib/supabaseClient";

const ACCENT = "#135DFF";
const BORDER = "#e2e8f0";
const MUTED  = "#475569";
const DIM    = "#94a3b8";
const TEXT   = "#0d1f35";

const NAV_ITEMS = [
  {
    label: "Features",
    href: "/#features",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    label: "How It Works",
    href: "/#how-it-works",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
      </svg>
    ),
  },
  {
    label: "Pricing",
    href: "/#pricing",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/>
        <line x1="16" y1="10" x2="16" y2="18"/><line x1="8" y1="14" x2="12" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/>
      </svg>
    ),
  },
  {
    label: "FAQ",
    href: "/#faq",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive]     = useState(null);
  const { session }             = useSession();
  const navigate                = useNavigate();
  const authed                  = !!session;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <nav
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 100,
        background: "#ffffff",
        borderBottom: `1px solid ${scrolled ? "rgba(19,45,70,0.12)" : BORDER}`,
        boxShadow: scrolled ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
        transition: "box-shadow 0.3s ease, border-color 0.3s ease",
        fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "stretch", height: 62 }}>

        {/* Logo → / */}
        <div style={{ display: "flex", alignItems: "center", paddingRight: 28, borderRight: `1px solid ${BORDER}`, marginRight: 8, flexShrink: 0 }}>
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <img src="/logo.png" alt="PartLister" style={{ height: 32, width: "auto", display: "block" }} />
          </Link>
        </div>

        {/* Nav tabs */}
        <div style={{ display: "flex", flex: 1, alignItems: "stretch" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.label;
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setActive(item.label)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "0 16px",
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  color: isActive ? ACCENT : MUTED,
                  textDecoration: "none",
                  borderBottom: isActive ? `2px solid ${ACCENT}` : "2px solid transparent",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = TEXT;
                    e.currentTarget.style.borderBottomColor = "#cbd5e1";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = MUTED;
                    e.currentTarget.style.borderBottomColor = "transparent";
                  }
                }}
              >
                <span style={{ color: isActive ? ACCENT : DIM, display: "flex" }}>
                  {item.icon}
                </span>
                {item.label}
              </a>
            );
          })}
        </div>

        {/* Right side — changes based on auth state */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 16, flexShrink: 0 }}>

          {authed ? (
            <>
              {/* Dashboard button */}
              <Link
                to="/"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 8,
                  border: `1px solid ${BORDER}`, background: "transparent",
                  textDecoration: "none",
                  fontSize: 13, fontWeight: 600, color: MUTED,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = TEXT;
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = MUTED;
                  e.currentTarget.style.borderColor = BORDER;
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                Dashboard
              </Link>

              {/* Log out */}
              <button
                onClick={handleLogout}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 8,
                  border: "1px solid #fca5a5", background: "#fff5f5",
                  cursor: "pointer",
                  fontSize: 13, fontWeight: 600, color: "#dc2626",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "#fee2e2";
                  e.currentTarget.style.borderColor = "#f87171";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "#fff5f5";
                  e.currentTarget.style.borderColor = "#fca5a5";
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Log out
              </button>
            </>
          ) : (
            <>
              {/* Login */}
              <Link
                to="/auth/login"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 8,
                  border: `1px solid ${BORDER}`, background: "transparent",
                  textDecoration: "none",
                  fontSize: 13, fontWeight: 600, color: MUTED,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = TEXT;
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = MUTED;
                  e.currentTarget.style.borderColor = BORDER;
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Login
              </Link>

              {/* CTA → sign up */}
              <Link
                to="/auth/sign-up"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 18px", borderRadius: 8,
                  background: ACCENT,
                  boxShadow: "0 2px 10px rgba(19,93,255,0.28)",
                  textDecoration: "none",
                  fontSize: 13, fontWeight: 700, color: "#ffffff",
                  whiteSpace: "nowrap",
                  transition: "box-shadow 0.15s, transform 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = "0 4px 18px rgba(19,93,255,0.42)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = "0 2px 10px rgba(19,93,255,0.28)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                Generate 10 Listings Free
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
