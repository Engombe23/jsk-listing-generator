import { BarChart3, Check, Crosshair, Lightbulb, Zap } from "lucide-react";
import { Reveal } from "./Primitives";
import { AnimatedStep } from "./HowItWorksAnim";

const steps = [
  {
    n: "01",
    label: "Step 1",
    title: "Enter OE / OEM / Article Number",
    body: "Paste any reference number or your internal SKU. No spreadsheets, no manual data entry, no guesswork.",
    bullets: null,
  },
  {
    n: "02",
    label: "Step 2",
    title: "PartLister fetches data from TecDoc",
    body: "We pull the exact part, vehicle fitment, engine codes and interchangeable numbers straight from TecDoc — verified, not scraped.",
    bullets: null,
  },
  {
    n: "03",
    label: "Step 3",
    title: "Get your complete listing. Export. Done.",
    body: "Get an optimised title, description, item specifics, compatibility table and images. Copy, export to CSV and list anywhere.",
    bullets: ["Optimised for eBay", "Ready to copy or export", "CSV export in one click"],
  },
];

const chips = [
  { icon: Zap, title: "Save hours", sub: "every day" },
  { icon: Crosshair, title: "Improve accuracy", sub: "& consistency" },
  { icon: BarChart3, title: "List more", sub: "sell more" },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-white">
      <div className="relative overflow-hidden bg-[#081326] px-6 pb-28 pt-24 text-white sm:pb-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 90% 80% at 50% 32%, #16305a 0%, #0d1f3d 48%, #060f1f 100%)" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 40% 60% at 10% 6%, rgba(37,120,255,0.5), transparent 60%), radial-gradient(ellipse 42% 60% at 92% 14%, rgba(90,160,255,0.4), transparent 60%)" }}
          />
          <div className="absolute left-1/2 top-1/3 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-60">
            <div
              className="animate-aurora h-full w-full rounded-full blur-[90px]"
              style={{ background: "conic-gradient(from 0deg, rgba(37,120,255,0.8), rgba(6,15,31,0), rgba(120,175,255,0.65), rgba(6,15,31,0), rgba(37,120,255,0.8))" }}
            />
          </div>
          <div
            className="absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(ellipse_at_50%_35%,black,transparent_80%)]"
            style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />
        </div>

        <Reveal className="relative mx-auto max-w-2xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em] text-blue-200 backdrop-blur">
            <Lightbulb className="h-3.5 w-3.5" />
            How it works
          </div>
          <h2 className="font-display text-[clamp(2.2rem,4.5vw,3.4rem)] font-extrabold leading-[1.03] tracking-tightest text-balance">
            Three steps.
            <br />
            <span className="text-primary">Under a minute.</span>
          </h2>
          <p className="mt-5 text-balance text-center text-[1.05rem] leading-relaxed text-blue-100/70">
            What used to take 15 minutes of copy-paste per listing now happens in a single click.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="relative mx-auto mt-9 flex max-w-xl flex-wrap items-center justify-center gap-x-3 gap-y-4">
          {chips.map((c, i) => (
            <div key={c.title} className="flex items-center">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-blue-200 backdrop-blur">
                  <c.icon className="h-4 w-4" />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-[0.9rem] font-semibold text-white">{c.title}</span>
                  <span className="text-[0.78rem] text-blue-100/60">{c.sub}</span>
                </span>
              </div>
              {i < chips.length - 1 && <span className="mx-4 hidden h-8 w-px bg-white/10 sm:block" />}
            </div>
          ))}
        </Reveal>
      </div>

      <div className="relative z-10 mx-auto max-w-[1080px] px-6 pb-24 pt-16">
        <div className="relative">
          <div className="absolute left-[23px] top-10 bottom-16 hidden w-px bg-gradient-to-b from-primary/40 via-slate-200 to-slate-200 sm:block" />
          <div className="space-y-12 sm:space-y-14">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.05}>
                <div className="grid grid-cols-1 items-start gap-x-8 gap-y-5 sm:grid-cols-[3rem_minmax(0,19rem)_minmax(0,1fr)]">
                  <div className="relative flex sm:justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-mono text-[0.95rem] font-bold text-white shadow-[0_10px_28px_-6px_rgba(19,93,255,0.75)] ring-4 ring-white">
                      {s.n}
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-primary">{s.label}</span>
                    <h3 className="mt-2 font-display text-[1.55rem] font-bold leading-[1.12] tracking-tight text-navy">{s.title}</h3>
                    <p className="mt-3 text-[0.98rem] leading-relaxed text-slate-500">{s.body}</p>
                    {s.bullets && (
                      <ul className="mt-4 space-y-2">
                        {s.bullets.map((b) => (
                          <li key={b} className="flex items-center gap-2.5 text-[0.95rem] font-medium text-navy">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#17924a]/12 text-[#17924a]">
                              <Check className="h-3 w-3" strokeWidth={3.5} />
                            </span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="group/card overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_28px_64px_-28px_rgba(16,42,86,0.30)] ring-1 ring-slate-100 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.03] hover:border-primary/40 hover:shadow-[0_44px_100px_-30px_rgba(19,93,255,0.42)]">
                    <AnimatedStep index={i} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
