import React from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
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

export default function Features() {
  const { t } = useTranslation();

  const features: Feature[] = [
    {
      tag: t("landing.features.listingTag"),
      title: t("landing.features.listingTitle"),
      body: t("landing.features.listingBody"),
      points: [
        t("landing.features.listingP1"),
        t("landing.features.listingP2"),
        t("landing.features.listingP3"),
      ],
      Demo: ListingDemo,
      part: "/parts3d/engine.png",
    },
    {
      tag: t("landing.features.priceTag"),
      title: t("landing.features.priceTitle"),
      body: t("landing.features.priceBody"),
      points: [
        t("landing.features.priceP1"),
        t("landing.features.priceP2"),
        t("landing.features.priceP3"),
      ],
      Demo: PriceChartDemo,
      part: "/parts3d/tacho.png",
    },
    {
      tag: t("landing.features.calcTag"),
      title: t("landing.features.calcTitle"),
      body: t("landing.features.calcBody"),
      points: [
        t("landing.features.calcP1"),
        t("landing.features.calcP2"),
        t("landing.features.calcP3"),
      ],
      Demo: PriceCalcDemo,
      part: "/parts3d/tacho.png",
    },
    {
      tag: t("landing.features.compatTag"),
      title: t("landing.features.compatTitle"),
      body: t("landing.features.compatBody"),
      points: [
        t("landing.features.compatP1"),
        t("landing.features.compatP2"),
        t("landing.features.compatP3"),
      ],
      Demo: CompatDemo,
      part: "/parts3d/shock.png",
    },
  ];

  return (
    <Section id="features" className="relative border-t border-hair bg-gradient-to-b from-wash/70 via-white to-white py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0">
        <div className="mx-auto h-px max-w-[1180px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </div>
      <AmbientBg variant="wash" />
      <Reveal className="mx-auto max-w-2xl text-center">
        <Eyebrow>{t("landing.features.eyebrow")}</Eyebrow>
        <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-tightest text-navy text-balance">
          {t("landing.features.title")}
        </h2>
        <p className="mt-4 text-balance text-center text-[1.05rem] leading-relaxed text-slate">
          {t("landing.features.subtitle")}
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
