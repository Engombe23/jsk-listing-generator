import { motion } from "motion/react";
import { Link } from "react-router-dom";

export function Logo({ variant = "dark", className = "" }) {
  return (
    <Link to="/" className={`flex items-center ${className}`}>
      <img
        src="/brand/logo-full.png"
        alt="PartLister"
        className={`h-8 w-auto ${variant === "light" ? "brightness-0 invert" : ""}`}
      />
    </Link>
  );
}

export function Eyebrow({ children }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-hair bg-wash px-3.5 py-1.5 font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em] text-primary">
      {children}
    </div>
  );
}

export function Section({ id, children, className = "" }) {
  return (
    <section id={id} className={`relative px-6 ${className}`}>
      <div className="mx-auto w-full max-w-[1180px]">{children}</div>
    </section>
  );
}

export function Reveal({ children, delay = 0, y = 24, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PrimaryButton({ children, href, size = "md", className = "" }) {
  const pad = size === "lg" ? "px-7 py-4 text-[1.02rem]" : "px-5 py-3 text-[0.95rem]";
  return (
    <Link
      to={href}
      className={`group inline-flex items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white shadow-[0_10px_28px_-8px_rgba(19,93,255,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-deep hover:shadow-[0_16px_36px_-8px_rgba(19,93,255,0.7)] ${pad} ${className}`}
    >
      {children}
    </Link>
  );
}

export function GhostButton({ children, href, size = "md", className = "" }) {
  const pad = size === "lg" ? "px-7 py-4 text-[1.02rem]" : "px-5 py-3 text-[0.95rem]";
  return (
    <Link
      to={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-hair bg-white font-semibold text-navy transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/20 hover:shadow-soft ${pad} ${className}`}
    >
      {children}
    </Link>
  );
}
