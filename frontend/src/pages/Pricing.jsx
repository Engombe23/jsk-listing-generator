import React, { useEffect } from "react";
import { trackEvent } from "../lib/analytics";
import Navbar from "../landing/Navbar";
import PricingSection from "../landing/Pricing";
import FAQ from "../landing/FAQ";
import Footer from "../landing/Footer";
import "../landing/landing.css";

export default function Pricing() {
  useEffect(() => { trackEvent("pricing_page_viewed"); }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />
      <PricingSection />
      <FAQ />
      <Footer />
    </div>
  );
}
