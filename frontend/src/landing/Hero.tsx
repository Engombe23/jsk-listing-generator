import { motion } from "motion/react";
import { ArrowRight, PlayCircle, Star } from "lucide-react";
import { PrimaryButton, GhostButton } from "./Primitives";
import HeroDemo from "./HeroDemo";

const ease = [0.22, 1, 0.36, 1];

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-24 sm:pt-40">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-360px] h-[900px] w-[900px] -translate-x-1/2 opacity-[0.28]">
          <div
            className="animate-aurora h-full w-full rounded-full blur-[90px]"
            style={{ background: "conic-gradient(from 0deg, rgba(19,93,255,0.55), rgba(111,168,255,0.05), rgba(11,63,176,0.5), rgba(19,93,255,0.05), rgba(19,93,255,0.55))" }}
          />
        </div>
        <div className="absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-5%,rgba(19,93,255,0.18),transparent_65%)]" />
        <div className="absolute -left-40 top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(19,93,255,0.14),transparent_70%)] blur-3xl" />
        <div className="absolute -right-52 top-24 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(11,63,176,0.12),transparent_70%)] blur-3xl" />
        <div className="absolute inset-0 bg-dotgrid [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_70%)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden xl:block">
        <img src="/parts3d/engine.png" alt="" aria-hidden className="animate-drift-a absolute -left-10 top-2 w-72 opacity-90 drop-shadow-2xl" style={{ "--rot": "-14deg", animationDelay: "0s" }} />
        <img src="/parts3d/rim.png" alt="" aria-hidden className="animate-drift-b absolute left-24 top-[15rem] w-48 opacity-90 drop-shadow-2xl" style={{ "--rot": "12deg", animationDelay: "1.1s" }} />
        <img src="/parts3d/piston-v2.png" alt="" aria-hidden className="animate-drift-c absolute -left-6 top-[27rem] w-52 opacity-90 drop-shadow-2xl" style={{ "--rot": "-6deg", animationDelay: "1.4s" }} />
        <img src="/parts3d/radiator.png" alt="" aria-hidden className="animate-drift-b absolute left-20 top-[40rem] w-56 opacity-90 drop-shadow-2xl" style={{ "--rot": "8deg", animationDelay: "2s" }} />
        <img src="/parts3d/accumulator.png" alt="" aria-hidden className="animate-drift-a absolute -left-8 top-[54rem] w-48 opacity-90 drop-shadow-2xl" style={{ "--rot": "-10deg", animationDelay: "0.4s" }} />
        <img src="/parts3d/shock.png" alt="" aria-hidden className="animate-drift-b absolute right-20 -top-2 w-48 opacity-90 drop-shadow-2xl" style={{ "--rot": "16deg", animationDelay: "0.8s" }} />
        <img src="/parts3d/spark-plug.png" alt="" aria-hidden className="animate-drift-c absolute -right-8 top-[11rem] w-44 opacity-90 drop-shadow-2xl" style={{ "--rot": "-12deg", animationDelay: "1.6s" }} />
        <img src="/parts3d/exhaust-v2.png" alt="" aria-hidden className="animate-drift-a absolute right-16 top-[25rem] w-56 opacity-90 drop-shadow-2xl" style={{ "--rot": "10deg", animationDelay: "1.9s" }} />
        <img src="/parts3d/tacho.png" alt="" aria-hidden className="animate-drift-c absolute -right-6 top-[38rem] w-60 opacity-90 drop-shadow-2xl" style={{ "--rot": "-6deg", animationDelay: "0.6s" }} />
        <img src="/parts3d/turbo.png" alt="" aria-hidden className="animate-drift-b absolute right-24 top-[52rem] w-48 opacity-90 drop-shadow-2xl" style={{ "--rot": "6deg", animationDelay: "1.2s" }} />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1180px]">
        <div className="mx-auto max-w-3xl text-center">
          <motion.a
            href="/#how-it-works"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="group mb-6 inline-flex items-center gap-2 rounded-full border border-hair bg-white/80 px-3.5 py-1.5 text-[0.8rem] font-medium text-slate shadow-soft backdrop-blur transition-colors hover:border-primary/30"
          >
            <span className="flex h-5 items-center rounded-full bg-primary px-2 font-mono text-[0.62rem] font-semibold uppercase tracking-wider text-white">TecDoc</span>
            Powered by real OEM fitment data
            <ArrowRight className="h-3.5 w-3.5 text-faint transition-transform group-hover:translate-x-0.5" />
          </motion.a>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease }}
            className="text-balance font-display text-[clamp(2.75rem,6.4vw,5rem)] font-extrabold leading-[1.02] tracking-tightest text-navy"
          >
            OEM to Listing in <span className="grad-shine">One Click</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.14, ease }}
            className="mx-auto mt-6 max-w-xl text-balance text-center text-[1.12rem] leading-relaxed text-slate"
          >
            Paste an OE, OEM or article number and generate a complete eBay listing in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <PrimaryButton href="/auth/sign-up" size="lg" className="w-full sm:w-auto">
              Generate 10 Listings Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </PrimaryButton>
            <GhostButton href="/#how-it-works" size="lg" className="w-full sm:w-auto">
              <PlayCircle className="h-5 w-5 text-primary" />
              See How It Works
            </GhostButton>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.32 }}
            className="mt-4 font-mono text-[0.78rem] text-faint"
          >
            No card required · 10 free listings · Cancel anytime
          </motion.p>
        </div>

        <HeroDemo />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="mx-auto mt-14 flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-[#f5a623] text-[#f5a623]" />
            ))}
            <span className="ml-2 text-[0.85rem] text-muted2">Trusted by high-volume eBay motor sellers</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
