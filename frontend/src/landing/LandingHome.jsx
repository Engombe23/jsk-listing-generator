import { useEffect } from "react";
import "./landing-v2.css";
import Nav from "./Navbar";
import Hero from "./Hero";
import PartsBand from "./PartsBand";
import HowItWorks from "./HowItWorks";
import Features from "./Features";
import { Pricing } from "./Pricing";
import FAQ from "./FAQ";
import FinalCTA from "./FinalCTA";
import Footer from "./Footer";
import { trackEvent } from "../lib/analytics";
import { useScrollDepthTracking } from "../lib/useScrollDepthTracking";

export default function LandingHome() {
  useEffect(() => { trackEvent("landing_page_viewed"); }, []);
  useScrollDepthTracking();

  return (
    <div className="landing-root" style={{ minHeight: "100vh" }}>
      <Nav />
      <Hero />
      <PartsBand />
      <HowItWorks />
      <Features />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
