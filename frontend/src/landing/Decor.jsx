import { motion } from "motion/react";

export function FloatingPart({
  src,
  className = "",
  size = 120,
  rotate = 0,
  delay = 0,
  opacity = 1,
}) {
  return (
    <motion.img
      src={src}
      alt=""
      aria-hidden
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`pointer-events-none absolute select-none ${className}`}
      style={{ width: size, height: size, rotate: `${rotate}deg` }}
    />
  );
}

export function Floaty({
  src,
  className = "",
  size = 120,
  rotate = 0,
  duration = 7,
  drift = 18,
  delay = 0,
  blur = 0,
  opacity = 1,
  z = 0,
}) {
  const shadow =
    blur > 6
      ? "drop-shadow(0 40px 70px rgba(19,42,70,0.16))"
      : blur > 0
        ? "drop-shadow(0 30px 55px rgba(19,42,70,0.20))"
        : "drop-shadow(0 22px 40px rgba(19,42,70,0.26))";
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute select-none ${className}`}
      style={{ zIndex: z }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity,
        scale: 1,
        y: [0, -drift, 0],
        rotate: [rotate, rotate + 4, rotate],
      }}
      transition={{
        opacity: { duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] },
        scale: { duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] },
        y: { duration, repeat: Infinity, ease: "easeInOut", delay },
        rotate: { duration, repeat: Infinity, ease: "easeInOut", delay },
      }}
    >
      <img
        src={src}
        alt=""
        style={{
          width: size,
          height: size,
          filter: `${blur ? `blur(${blur}px) ` : ""}${shadow}`,
        }}
        className="h-full w-full object-contain"
      />
    </motion.div>
  );
}

export function AmbientBg({ variant = "light" }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {variant === "wash" && (
        <div className="absolute inset-0 bg-gradient-to-b from-wash via-wash/70 to-white" />
      )}
      {variant === "light" && (
        <div className="absolute inset-0 bg-gradient-to-b from-white via-wash/50 to-white" />
      )}
      <div className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(19,93,255,0.14),transparent_70%)] blur-2xl" />
      <div className="absolute -right-40 top-1/3 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(11,63,176,0.11),transparent_70%)] blur-2xl" />
      <div className="absolute inset-0 bg-dotgrid opacity-[0.6] [mask-image:radial-gradient(ellipse_at_50%_40%,black,transparent_75%)]" />
    </div>
  );
}
