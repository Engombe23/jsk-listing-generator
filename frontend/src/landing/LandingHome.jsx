import { useEffect } from "react";
import "./landing.css";
import Navbar from "./Navbar";
import Hero from "./Hero";
import ProblemSection from "./ProblemSection";
import HowItWorks from "./HowItWorks";
import Features from "./Features";
import SmartPricing from "./SmartPricing";
import WhoItsFor from "./WhoItsFor";
import Pricing from "./Pricing";
import FAQ from "./FAQ";
import FinalCTA from "./FinalCTA";
import Footer from "./Footer";
import { trackEvent } from "../lib/analytics";
import { useScrollDepthTracking } from "../lib/useScrollDepthTracking";

// Public marketing landing page — shown at "/" when the visitor is not
// logged in. Logged-in users see the App dashboard instead (see HomeRoute.jsx).
export default function LandingHome() {
  useEffect(() => { trackEvent("landing_page_viewed"); }, []);
  useScrollDepthTracking();

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <Features />
      <SmartPricing />
      <WhoItsFor />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
