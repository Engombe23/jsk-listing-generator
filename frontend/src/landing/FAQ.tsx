import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { Eyebrow, Reveal, Section } from "./Primitives";

const faqs = [
  {
    q: "Where does the part and fitment data come from?",
    a: "Everything comes straight from TecDoc — the industry-standard automotive parts catalogue. We don't scrape it, so the fitment, engine codes and interchangeable numbers you get are the real, verified data.",
  },
  {
    q: "What can I enter to generate a listing?",
    a: "Any OE number, OEM number or TecDoc article number. You can also add your own internal SKU. PartLister looks up the part, pulls its data and builds the listing around it.",
  },
  {
    q: "How does the free trial work?",
    a: "You get 10 free listings, no card required. Generate them, export them, use them on eBay. When you're ready for more, pick a plan that fits your volume.",
  },
  {
    q: "Can I export straight to eBay?",
    a: "Yes. PartLister exports clean HTML and CSV that drops straight into an eBay listing — title, description, compatibility table and all.",
  },
  {
    q: "How accurate is the pricing data?",
    a: "The Smart Pricing tool analyses active eBay UK listings and refreshes every 24 hours, giving you low, median, average and high prices plus a full distribution so you can price competitively.",
  },
  {
    q: "Do you handle eBay fees and VAT?",
    a: "The price calculator factors in final value fees, fixed fees, ad rate, postage and VAT, then works backwards from your target margin — so the price you set is the price that protects your profit.",
  },
];

function Item({ q, a, i }) {
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
              <p className="px-6 pb-6 text-[0.98rem] leading-relaxed text-slate">{a}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  );
}

export default function FAQ() {
  return (
    <Section id="faq" className="py-24 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-tightest text-navy text-balance">
          Questions, answered
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
