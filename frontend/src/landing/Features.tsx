import React from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Eyebrow, Reveal, Section } from "./Primitives";
import { AmbientBg } from "./Decor";
import { ListingDemo, PriceChartDemo, PriceCalcDemo, CompatDemo } from "./FeatureDemos";

type Feature = {
  tag: string;
  title: string;
  body: string;
  points: string[];
  Demo: React.ComponentType;
  part: string;
};

const features: Feature[] = [
  {
    tag: "Listing Generator",
    title: "Turn a part number into a finished listing",
    body: "Enter an OEM or article number and PartLister writes an eBay-ready title, description and compatibility table for you. Pick a template, toggle the sections you want, and generate.",
    points: [
      "AI-written titles built for eBay search",
      "Five ready-made listing templates",
      "Compatibility table, interchangeable numbers & engine codes",
    ],
    Demo: ListingDemo,
    part: "/parts3d/engine.png",
  },
  {
    tag: "eBay Price Analysis",
    title: "See exactly where your price sits in the market",
    body: "Pull live price data from active eBay listings and see a full distribution — low, median, average and high — so you know whether you're competitive before you list.",
    points: [
      "Live distribution chart from active eBay listings",
      "Low, median, average & high in one view",
      "Cluster insight tells you where most buyers transact",
    ],
    Demo: PriceChartDemo,
    part: "/parts3d/tacho.png",
  },
  {
    tag: "Price Calculator",
    title: "Work backwards from your target margin",
    body: "Enter a sale price and PartLister deducts eBay fees, VAT and postage automatically — so you always know exactly what you keep. Set a target margin and find the minimum price that hits it.",
    points: [
      "eBay fees, VAT & postage deducted automatically",
      "Enter your target margin — see the minimum sell price",
      "Works for any marketplace in any currency",
    ],
    Demo: PriceCalcDemo,
    part: "/parts3d/tacho.png",
  },
  {
    tag: "Compatibility Checker",
    title: "Never sell the wrong part again",
    body: "Check a part against a VIN or OEM number and get a confidence-scored fitment result straight from TecDoc. Fewer returns, fewer disputes, better feedback.",
    points: [
      "VIN and OEM compatibility in seconds",
      "Confidence score with exact TecDoc match",
      "Full vehicle spec: engine, power, year range",
    ],
    Demo: CompatDemo,
    part: "/parts3d/shock.png",
  },
];

export default function Features() {
  return (
    <Section id="features" className="relative border-t border-hair bg-gradient-to-b from-wash/70 via-white to-white py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0">
        <div className="mx-auto h-px max-w-[1180px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </div>
      <AmbientBg variant="wash" />
      <Reveal className="mx-auto max-w-2xl text-center">
        <Eyebrow>Features</Eyebrow>
        <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-tightest text-navy text-balance">
          Built for sellers who move volume
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[1.05rem] leading-relaxed text-slate">
          Generate, price and verify fitment without ever leaving PartLister — every step of the listing in one place.
        </p>
      </Reveal>

      <div className="mt-20 flex flex-col gap-24 sm:mt-24 sm:gap-28">
        {features.map((f, i) => {
          const reverse = i % 2 === 1;
          return (
            <div key={f.tag} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <Reveal y={20} className={reverse ? "lg:order-2" : ""}>
                <span className="font-mono text-[0.78rem] font-medium uppercase tracking-[0.14em] text-primary">{f.tag}</span>
                <h3 className="mt-3 font-display text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-[1.1] tracking-tight text-navy text-balance">{f.title}</h3>
                <p className="mt-4 text-[1.05rem] leading-relaxed text-slate">{f.body}</p>
                <ul className="mt-6 flex flex-col gap-3">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wash text-primary">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      <span className="text-[0.98rem] text-navy">{p}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal y={28} delay={0.08} className={`relative ${reverse ? "lg:order-1" : ""}`}>
                <div className="pointer-events-none absolute -inset-5 -z-10 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(19,93,255,0.1),transparent_65%)] blur-2xl" />
                <motion.img
                  src={f.part}
                  alt=""
                  aria-hidden
                  initial={{ opacity: 0, y: 24, scale: 0.85 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className={`pointer-events-none absolute -top-12 z-20 hidden h-28 w-28 object-contain drop-shadow-[0_22px_34px_rgba(19,42,70,0.28)] lg:block ${reverse ? "-right-8" : "-left-8"}`}
                />
                <f.Demo />
              </Reveal>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
