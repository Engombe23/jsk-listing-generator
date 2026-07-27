import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

const PART_KEYS = [
  { src: "/parts3d/engine.png", key: "engines" },
  { src: "/parts3d/turbo.png", key: "turbos" },
  { src: "/parts3d/radiator.png", key: "radiators" },
  { src: "/parts3d/exhaust-v2.png", key: "exhausts" },
  { src: "/parts3d/shock.png", key: "suspension" },
  { src: "/parts3d/spark-plug.png", key: "ignition" },
  { src: "/parts3d/rim.png", key: "wheels" },
  { src: "/parts3d/piston.png", key: "internals" },
  { src: "/parts3d/tacho.png", key: "instruments" },
];

function Tile({ src, label }) {
  return (
    <div className="group flex w-[188px] shrink-0 flex-col items-center gap-4 rounded-2xl border border-hair bg-white px-6 py-7 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-float">
      <div className="flex h-24 w-24 items-center justify-center">
        <img
          src={src}
          alt={label}
          className="h-full w-full object-contain drop-shadow-[0_14px_22px_rgba(19,42,70,0.16)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105"
        />
      </div>
      <span className="font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted2">
        {label}
      </span>
    </div>
  );
}

export default function PartsBand() {
  const { t } = useTranslation();
  const parts = PART_KEYS.map((p) => ({
    src: p.src,
    label: t(`landing.partsBand.parts.${p.key}`),
  }));
  const loop = [...parts, ...parts];

  return (
    <section className="relative overflow-hidden border-y border-hair bg-wash py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(19,93,255,0.10),transparent_70%)] blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-[440px] w-[440px] rounded-full bg-[radial-gradient(circle,rgba(19,93,255,0.08),transparent_70%)] blur-3xl" />
      </div>

      <div className="mx-auto mb-11 w-full max-w-[1180px] px-6 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-hair bg-white px-3.5 py-1.5 font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em] text-primary shadow-soft">
          {t("landing.partsBand.eyebrow")}
        </div>
        <h2 className="font-display text-[clamp(1.75rem,3.4vw,2.6rem)] font-extrabold tracking-tightest text-navy text-balance">
          {t("landing.partsBand.title")}
        </h2>
        <p className="mt-3 text-[1rem] leading-relaxed text-muted2 text-center">
          {t("landing.partsBand.subtitle")}
        </p>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-wash to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-wash to-transparent" />
        <motion.div
          className="flex gap-5"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          {loop.map((p, i) => (
            <Tile key={i} src={p.src} label={p.label} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
