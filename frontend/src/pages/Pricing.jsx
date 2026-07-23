import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { trackEvent } from "../lib/analytics";
import "../landing/landing-v2.css";
import Navbar from "../landing/Navbar";
import Footer from "../landing/Footer";
import LandingPricing from "../landing/Pricing";

export default function Pricing() {
  const { session } = useSession();

  useEffect(() => {
    trackEvent("pricing_page_viewed");
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {session ? (
        <div style={{ padding: "16px 24px", background: "#0a0e17", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Link
            to="/"
            style={{ color: "#9aa3b8", textDecoration: "none", fontSize: 13, fontWeight: 600 }}
          >
            ← Back to app
          </Link>
        </div>
      ) : (
        <Navbar />
      )}
      <LandingPricing />
      {!session && <Footer />}
    </div>
  );
}
