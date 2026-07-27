import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Eyebrow, Reveal, Section } from "./Primitives";

function Item({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={i * 0.04}>
      <div className={`overflow-hidden rounded-2xl border bg-white transition-colors ${open ? "border-primary/30 shadow-soft" : "border-hair"}`}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        >
          <span className="text-[1.02rem] font-semibold text-navy">{q}</span>
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${open ? "rotate-45 bg-primary text-white" : "bg-wash text-primary"}`}>
            <Plus className="h-4 w-4" />
          </span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="px-6 pb-6">
                <p className="text-[0.98rem] leading-relaxed text-slate">{a}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  );
}

export default function FAQ() {
  const { t } = useTranslation();

  const faqs = [
    { q: t("landing.faq.q1"), a: t("landing.faq.a1") },
    { q: t("landing.faq.q2"), a: t("landing.faq.a2") },
    { q: t("landing.faq.q3"), a: t("landing.faq.a3") },
    { q: t("landing.faq.q4"), a: t("landing.faq.a4") },
    { q: t("landing.faq.q5"), a: t("landing.faq.a5") },
    { q: t("landing.faq.q6"), a: t("landing.faq.a6") },
    { q: t("landing.faq.q7"), a: t("landing.faq.a7") },
    { q: t("landing.faq.q8"), a: t("landing.faq.a8") },
    { q: t("landing.faq.q9"), a: t("landing.faq.a9") },
    { q: t("landing.faq.q10"), a: t("landing.faq.a10") },
  ];

  return (
    <Section id="faq" className="py-24 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Eyebrow>{t("landing.faq.eyebrow")}</Eyebrow>
        <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-tightest text-navy text-balance">
          {t("landing.faq.title")}
        </h2>
      </Reveal>

      <div className="mx-auto mt-12 flex max-w-2xl flex-col gap-3">
        {faqs.map((f, i) => (
          <Item key={f.q} q={f.q} a={f.a} i={i} />
        ))}
      </div>
    </Section>
  );
}
