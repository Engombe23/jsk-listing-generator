import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Eyebrow, Reveal, Section } from "./Primitives";
import { AmbientBg } from "./Decor";

function PricingMockup() {
  const bars = [
    { h: 30, label: "< £35", n: 8 },
    { h: 62, label: "£35–50", n: 18 },
    { h: 100, label: "£50–65", n: 31 },
    { h: 76, label: "£65–80", n: 23 },
    { h: 42, label: "£80+", n: 12 },
  ];
  return (
    <div className="p-5 space-y-4 text-left">
      <div className="flex justify-between px-1 text-[0.72rem] font-semibold text-slate">
        <span>Low <span className="text-navy">£35</span></span>
        <span>Median <span className="text-navy">£58</span></span>
        <span>High <span className="text-navy">£89</span></span>
      </div>
      <div className="flex items-end gap-2" style={{ height: 80 }}>
        {bars.map((b, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-[0.6rem] text-slate">{b.n}</span>
            <div className="w-full rounded-t-md" style={{ height: `${b.h}%`, background: i === 2 ? "#135dff" : "rgba(19,93,255,0.15)" }} />
            <span className="text-[0.58rem] text-faint truncate w-full text-center">{b.label}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="rounded-xl border border-hair bg-wash p-3">
          <div className="text-[0.62rem] uppercase tracking-wide font-mono text-faint">Recommended</div>
          <div className="mt-0.5 text-[1.2rem] font-extrabold text-navy">£54.99</div>
        </div>
        <div className="rounded-xl border border-successg/20 p-3" style={{ background: "rgba(74,222,128,0.06)" }}>
          <div className="text-[0.62rem] uppercase tracking-wide font-mono text-faint">Net Margin</div>
          <div className="mt-0.5 text-[1.2rem] font-extrabold text-successg">24.3%</div>
        </div>
      </div>
      <div className="rounded-xl border border-hair bg-wash px-3 py-2 text-[0.78rem] text-slate">
        After eBay fees (12.8%), VAT (20%) and £4.95 postage
      </div>
    </div>
  );
}

function CompatMockup() {
  return (
    <div className="p-5 space-y-3 text-left">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-hair bg-wash p-3">
          <div className="text-[0.62rem] font-mono uppercase tracking-wide text-faint mb-1">Article Number</div>
          <div className="font-mono text-[0.9rem] font-semibold text-navy">11247807345</div>
        </div>
        <div className="rounded-xl border border-hair bg-wash p-3">
          <div className="text-[0.62rem] font-mono uppercase tracking-wide text-faint mb-1">Registration</div>
          <div className="font-mono text-[0.9rem] font-semibold text-navy">WBA3A5100</div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-successg/30 px-3.5 py-3" style={{ background: "rgba(74,222,128,0.07)" }}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-successg text-base font-bold" style={{ background: "rgba(74,222,128,0.15)" }}>✓</span>
        <div>
          <div className="font-bold text-navy text-[0.95rem]">Compatible</div>
          <div className="text-[0.78rem] text-slate mt-0.5">Confidence: 98% · TecDoc direct match</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["Engine", "N47D20A"], ["Years", "2007–11"], ["Power", "130 kW"]].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-hair bg-wash p-2.5 text-center">
            <div className="text-[0.58rem] uppercase tracking-wide font-mono text-faint">{k}</div>
            <div className="mt-0.5 text-[0.82rem] font-bold text-navy">{v}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-hair bg-wash p-3">
        <div className="text-[0.62rem] font-mono uppercase tracking-wide text-faint mb-1.5">Compatible Vehicles</div>
        <div className="flex flex-wrap gap-1.5">
          {["3 Series E90", "5 Series E60", "1 Series E87", "X1 E84", "+54 more"].map((v) => (
            <span key={v} className="rounded-full border border-hair bg-white px-2 py-0.5 text-[0.65rem] font-medium text-navy">{v}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    tag: "Listing Generator",
    title: "Turn a part number into a finished listing",
    body: "Enter an OEM or article number and PartLister writes an eBay-ready title, description and compatibility table for you. Pick a template, toggle the sections you want, and generate.",
    points: [
      "AI-written titles built for eBay search",
      "Five ready-made listing templates",
      "Compatibility table, interchangeable numbers & engine codes",
    ],
    src: "/listing-mockup.png",
    alt: "PartLister listing generator",
    pos: "top left",
    part: "/parts3d/engine.png",
  },
  {
    tag: "Smart eBay Pricing",
    title: "Price to sell — and to profit",
    body: "See live low, median, average and high prices from real active eBay UK listings, then work backwards from your target margin. Fees, VAT and postage are handled for you.",
    points: [
      "Live market pricing from active eBay listings",
      "Fees, VAT & margin calculated automatically",
      "Price distribution so you never guess",
    ],
    src: null,
    alt: "PartLister price distribution chart",
    pos: "top",
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
    src: null,
    alt: "PartLister compatibility checker",
    pos: "top left",
    part: "/parts3d/shock.png",
  },
];

const MOCKUPS: Record<string, React.ReactNode> = {
  "Smart eBay Pricing": <PricingMockup />,
  "Compatibility Checker": <CompatMockup />,
};

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
        <p className="mx-auto mt-4 max-w-lg text-center text-[1.05rem] leading-relaxed text-slate">
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
                <div className="overflow-hidden rounded-2xl border border-hair bg-white shadow-float">
                  <div className="flex items-center gap-1.5 border-b border-hair bg-[#f7f9fc] px-4 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  {f.src ? (
                    <img
                      src={f.src}
                      alt={f.alt}
                      className="block max-h-[420px] w-full object-cover"
                      style={{ objectPosition: f.pos }}
                    />
                  ) : (
                    MOCKUPS[f.tag]
                  )}
                </div>
              </Reveal>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
