import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Search, Check, Loader2, FileDown, ShieldCheck, Sparkles, Car } from "lucide-react";

const ease = [0.22, 1, 0.36, 1];
const OEM = "11247807345";

const STATUS = [
  "Searching TecDoc database",
  "Part identified — Connecting Rod",
  "Matching vehicle applications",
  "Fetching OEM references",
  "Building compatibility table",
  "Generating SEO title",
  "Finding interchangeable numbers",
  "Preparing export",
];

const SECTIONS = ["tabs", "title", "specifics", "compat", "rows", "oe", "export"];

const SPECIFICS = [
  ["Brand", "BMW"],
  ["OE Number", "11247807345"],
  ["Condition", "New"],
  ["Placement", "Engine"],
];

const COMPAT_ROWS = [
  { vehicle: "3 Series (E90) 320d", years: "2007 – 2011", kw: "130", hp: "177", cc: "1995", codes: "N47D20A" },
  { vehicle: "3 Series (E91) 325d", years: "2006 – 2010", kw: "150", hp: "204", cc: "2993", codes: "M57D30TU2" },
  { vehicle: "5 Series (E60) 520d", years: "2007 – 2010", kw: "130", hp: "177", cc: "1995", codes: "N47D20A" },
  { vehicle: "1 Series (E87) 120d", years: "2007 – 2011", kw: "130", hp: "177", cc: "1995", codes: "N47D20A" },
  { vehicle: "X1 (E84) sDrive18d",  years: "2009 – 2012", kw: "105", hp: "143", cc: "1995", codes: "N47D20C" },
];

const OE_REFS = ["11247807345", "11248514023", "11247797527", "11247823929"];
const INTERCHANGE = ["INA 530038110", "Febi 45821", "ELRING 388.120", "Mahle 001PS11000S"];

const BADGES = [
  { icon: Car,        label: "58 compatible vehicles",  pos: "-left-4 top-24 sm:-left-8" },
  { icon: ShieldCheck,label: "74 OE references",         pos: "-right-4 top-16 sm:-right-9" },
  { icon: Sparkles,   label: "SEO title generated",      pos: "-left-4 bottom-28 sm:-left-10" },
  { icon: FileDown,   label: "Ready for CSV export",     pos: "-right-4 bottom-24 sm:-right-9" },
];

const TABS = ["Description", "Compatibility", "Item Specifics", "HTML"];

function Block({ visible, children, className = "" }) {
  return (
    <motion.div
      initial={false}
      animate={visible ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 10, filter: "blur(6px)" }}
      transition={{ duration: 0.45, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function HeroDemo() {
  const reduced = useReducedMotion();
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [typed, setTyped] = useState("");
  const [statusStep, setStatusStep] = useState(0);
  const [buildStep, setBuildStep] = useState(0);
  const [rowStep, setRowStep] = useState(0);

  useEffect(() => {
    if (reduced) {
      setTyped(OEM); setPhase("done");
      setStatusStep(STATUS.length); setBuildStep(SECTIONS.length); setRowStep(COMPAT_ROWS.length);
      return;
    }

    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));

    setTyped(""); setPhase("idle"); setStatusStep(0); setBuildStep(0); setRowStep(0);

    at(1200, () => setPhase("typing"));
    for (let i = 0; i < OEM.length; i++) {
      at(1200 + i * 95, () => setTyped(OEM.slice(0, i + 1)));
    }
    const afterType = 1200 + OEM.length * 95 + 220;

    at(afterType, () => setPhase("searching"));
    const statusStart = afterType + 380;
    for (let i = 0; i < STATUS.length; i++) {
      at(statusStart + i * 260, () => setStatusStep(i + 1));
    }
    const statusEnd = statusStart + STATUS.length * 260 + 240;

    at(statusEnd, () => setPhase("building"));
    const buildStart = statusEnd + 120;
    for (let i = 0; i < SECTIONS.length; i++) {
      at(buildStart + i * 200, () => setBuildStep(i + 1));
    }
    const rowsAt = buildStart + SECTIONS.indexOf("rows") * 200 + 280;
    for (let i = 0; i < COMPAT_ROWS.length; i++) {
      at(rowsAt + i * 160, () => setRowStep(i + 1));
    }
    const buildEnd = rowsAt + COMPAT_ROWS.length * 160 + 200;
    const afterSections = buildStart + SECTIONS.length * 200 + 160;
    const doneAt = Math.max(buildEnd, afterSections);

    at(doneAt, () => setPhase("done"));
    const holdEnd = doneAt + 2800;
    at(holdEnd, () => setPhase("fade"));
    at(holdEnd + 720, () => setCycle((c) => c + 1));

    return () => timers.forEach(clearTimeout);
  }, [cycle, reduced]);

  const generating = phase === "searching" || phase === "building";
  const complete   = phase === "done" || phase === "fade";
  const bodyMode   = phase === "idle" || phase === "typing"
    ? "skeleton" : phase === "searching" ? "status" : "build";

  const isShown = (name) => SECTIONS.indexOf(name) < buildStep;

  return (
    <motion.div
      animate={{ opacity: phase === "fade" ? 0 : 1 }}
      transition={{ duration: 0.6, ease }}
      className="relative mx-auto mt-12 max-w-3xl"
    >
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] bg-[radial-gradient(ellipse_at_center,rgba(19,93,255,0.18),transparent_65%)] blur-2xl" />

      {/* floating badges */}
      {BADGES.map((b, i) => (
        <motion.div
          key={b.label}
          initial={false}
          animate={complete ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.5, delay: complete ? i * 0.09 : 0, ease }}
          className={`absolute z-30 hidden lg:flex ${b.pos}`}
        >
          <div className="flex items-center gap-2 rounded-full border border-hair bg-white/90 px-3 py-2 shadow-chip backdrop-blur-md">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-successg/10 text-successg">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <span className="flex items-center gap-1.5 pr-1 text-[0.8rem] font-semibold text-navy">
              <b.icon className="h-3.5 w-3.5 text-primary" />
              {b.label}
            </span>
          </div>
        </motion.div>
      ))}

      {/* search bar */}
      <div className="relative z-20 rounded-2xl border border-hair bg-white/90 p-5 shadow-float ring-1 ring-black/[0.02] backdrop-blur sm:p-6">
        <label className="mb-2.5 block text-left font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em] text-faint">
          Enter OE / OEM / Article Number
        </label>
        <div className={`flex items-center gap-3 rounded-xl border-2 bg-white px-4 py-3.5 transition-colors sm:py-4 ${generating || complete ? "border-primary/40" : "border-hair"}`}>
          <Search className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex min-h-[1.75rem] flex-1 items-center text-left font-mono text-[1.15rem] font-medium text-navy sm:text-[1.35rem]">
            {typed || <span className="text-faint/60" />}
            {(phase === "idle" || phase === "typing") && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.7, repeat: Infinity, repeatType: "reverse" }}
                className="ml-0.5 inline-block h-6 w-[2px] bg-primary"
              />
            )}
          </div>
        </div>
        <button
          type="button" disabled
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[0.95rem] font-semibold text-white transition-colors ${generating ? "bg-primary/70" : complete ? "bg-successg" : "bg-primary"}`}
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Generating…</>
          ) : complete ? (
            <><Check className="h-4 w-4" strokeWidth={3} />Listing ready</>
          ) : "Generate Listing"}
        </button>
      </div>

      {/* arrow */}
      <div className="relative z-10 flex justify-center py-3">
        <motion.svg
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-faint"
        >
          <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </div>

      {/* app window — light themed to match the real tool */}
      <div
        className="relative overflow-hidden rounded-2xl border shadow-float ring-1 ring-black/[0.02]"
        style={{ background: "#ffffff", borderColor: "#e5e7eb" }}
      >
        {/* title bar */}
        <div className="flex items-center gap-3 border-b border-hair px-4 py-3" style={{ background: "#f7f9fc" }}>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-md border border-hair bg-white px-3 py-1.5">
            <span className="font-mono text-[0.72rem] text-[#6b7280]">partlister.app/generator</span>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full bg-successg/10 px-2.5 py-1 sm:flex">
            <span className="animate-livepulse h-2 w-2 rounded-full bg-successg" />
            <span className="font-mono text-[0.62rem] font-semibold uppercase tracking-wider text-successg">Live</span>
          </div>
        </div>

        <div className="relative min-h-[480px] bg-white p-4 text-left sm:p-5">
          <AnimatePresence mode="wait">

            {/* skeleton */}
            {bodyMode === "skeleton" && (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="space-y-3 pt-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-3.5 rounded-md bg-[#f1f5f9]" style={{ width: `${[72,90,58,80][i]}%` }} />
                ))}
                <div className="mt-5 flex gap-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 w-20 rounded-xl bg-[#f1f5f9]" />
                  ))}
                </div>
              </motion.div>
            )}

            {/* status checklist */}
            {bodyMode === "status" && (
              <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="mx-auto flex max-w-md flex-col gap-3 py-6">
                {STATUS.map((line, i) => {
                  if (i >= statusStep) return null;
                  const done = i < statusStep - 1;
                  return (
                    <motion.div key={line} initial={{ opacity: 0, y: 8, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.4, ease }} className="flex items-center gap-3 text-[0.88rem]">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${done ? "bg-successg/15 text-successg" : "text-primary"}`}>
                        {done ? <Check className="h-3 w-3" strokeWidth={3} /> : <Loader2 className="h-3 w-3 animate-spin" />}
                      </span>
                      <span style={{ color: done ? "#9ca3af" : "#111827", fontWeight: done ? 400 : 600 }}>{line}</span>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* built listing — light app UI */}
            {bodyMode === "build" && (
              <motion.div key="build" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-3">

                {/* tab bar */}
                <Block visible={isShown("tabs")}>
                  <div className="flex gap-1 rounded-xl border border-hair bg-[#f7f9fc] p-1">
                    {TABS.map((t, i) => (
                      <div key={t} className="flex-1 truncate rounded-lg px-2 py-2 text-center text-[0.65rem] font-bold" style={{
                        background: i === 1 ? "#135dff" : "transparent",
                        color: i === 1 ? "#fff" : "#9ca3af",
                        boxShadow: i === 1 ? "0 0 14px rgba(19,93,255,0.25)" : "none"
                      }}>
                        {t}{i === 1 ? " (58)" : ""}
                      </div>
                    ))}
                  </div>
                </Block>

                {/* listing title */}
                <Block visible={isShown("title")}>
                  <div className="rounded-xl border border-hair bg-white p-3">
                    <div className="font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-primary">Listing Title</div>
                    <div className="mt-1 font-bold leading-snug text-[#111827]" style={{ fontSize: "0.82rem" }}>
                      Genuine BMW Connecting Rod 11247807345 — 3 Series E90 E91 320d 325d N47
                    </div>
                  </div>
                </Block>

                {/* item specifics */}
                <Block visible={isShown("specifics")}>
                  <div className="rounded-xl border border-hair bg-white p-3">
                    <div className="mb-2 font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-[#9ca3af]">Item Specifics</div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {SPECIFICS.map(([k, v]) => (
                        <div key={k} className="rounded-lg border border-hair bg-[#f7f9fc] p-2">
                          <div className="text-[0.55rem] uppercase tracking-wide text-[#9ca3af]">{k}</div>
                          <div className="mt-0.5 text-[0.72rem] font-bold text-[#111827]">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Block>

                {/* compatibility */}
                <Block visible={isShown("compat")}>
                  <div className="overflow-hidden rounded-xl border border-hair">
                    <div className="flex items-center justify-between border-b border-hair bg-[#f7f9fc] px-3 py-2">
                      <div className="font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-[#9ca3af]">Compatibility</div>
                      <div className="flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)" }}>
                        <span className="h-1.5 w-1.5 rounded-full bg-successg" />
                        <span className="font-mono text-[0.6rem] font-semibold text-successg">58 vehicles</span>
                      </div>
                    </div>
                    {/* manufacturer header — dark, matching real app */}
                    <div className="border-b border-hair px-3 py-1.5 text-center text-[0.72rem] font-bold text-white" style={{ background: "#1f2937" }}>
                      BMW Models
                    </div>
                    {/* column headers */}
                    <div className="grid border-b border-hair bg-[#f1f5f9] text-[0.6rem] font-bold uppercase tracking-wide text-[#6b7280]" style={{ gridTemplateColumns: "2fr 1.5fr 0.55fr 0.55fr 0.7fr 1.5fr", padding: "5px 10px" }}>
                      <span>Vehicle</span><span>Years</span><span className="text-center">kW</span><span className="text-center">HP</span><span className="text-center">CC</span><span>Engine Code</span>
                    </div>
                    {/* data rows */}
                    {COMPAT_ROWS.slice(0, rowStep).map((r, i) => (
                      <motion.div
                        key={r.vehicle}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, ease }}
                        className="grid items-center border-b border-hair text-[0.67rem] text-[#374151]"
                        style={{ gridTemplateColumns: "2fr 1.5fr 0.55fr 0.55fr 0.7fr 1.5fr", padding: "5px 10px", background: i % 2 === 0 ? "#fff" : "#fafafa" }}
                      >
                        <span className="font-semibold text-[#111827]">{r.vehicle}</span>
                        <span>{r.years}</span>
                        <span className="text-center">{r.kw}</span>
                        <span className="text-center">{r.hp}</span>
                        <span className="text-center">{r.cc}</span>
                        <span className="font-mono text-[0.6rem] text-[#6b7280]">{r.codes}</span>
                      </motion.div>
                    ))}
                  </div>
                </Block>

                {/* OE refs + interchangeable */}
                <Block visible={isShown("oe")}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-hair bg-white p-3">
                      <div className="mb-2 font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-[#9ca3af]">OE References</div>
                      <div className="flex flex-wrap gap-1">
                        {OE_REFS.map((n) => (
                          <span key={n} className="rounded border border-hair bg-[#f7f9fc] px-1.5 py-0.5 font-mono text-[0.58rem] text-[#374151]">{n}</span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-hair bg-white p-3">
                      <div className="mb-2 font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-[#9ca3af]">Interchangeable</div>
                      <div className="flex flex-wrap gap-1">
                        {INTERCHANGE.map((n) => (
                          <span key={n} className="rounded border border-hair bg-[#f7f9fc] px-1.5 py-0.5 font-mono text-[0.58rem] text-[#374151]">{n}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Block>

                {/* export bar */}
                <Block visible={isShown("export")}>
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-hair bg-[#f7f9fc] px-3 py-3">
                    <span className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[0.75rem] font-bold text-white" style={{ background: "#135DFF" }}>
                      <FileDown className="h-3.5 w-3.5" />Save Listing
                    </span>
                    <span className="flex items-center gap-1.5 rounded-lg border border-hair bg-white px-3 py-2 text-[0.75rem] font-bold text-[#374151]">
                      Copy HTML
                    </span>
                    {complete && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease }}
                        className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold"
                        style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", color: "#16a34a" }}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                        SEO title generated
                      </motion.span>
                    )}
                  </div>
                </Block>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
