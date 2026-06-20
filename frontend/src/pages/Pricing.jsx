import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { trackEvent } from "../lib/analytics";

export default function Pricing() {
  useEffect(() => { trackEvent("pricing_page_viewed"); }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "#fff", fontFamily: "Arial, sans-serif", display: "grid", placeItems: "center", textAlign: "center", padding: 40 }}>
      <div>
        <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>Coming soon</div>
        <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Pricing</div>
        <Link to="/" style={{ color: "#b70017", textDecoration: "none", fontWeight: 600 }}>← Back to home</Link>
      </div>
    </div>
  );
}
