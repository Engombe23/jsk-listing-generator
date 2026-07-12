import { forwardRef, useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { Check, Loader2 } from "lucide-react";

const ease = [0.22, 1, 0.36, 1];

// Shared outer card — forwardRef so useInView refs attach to the DOM element
const Shell = forwardRef(function Shell({ children, className = "" }, ref) {
  return (
    <div
      ref={ref}
      className={`overflow-hidden rounded-2xl border border-hair bg-white shadow-float ${className}`}
    >
      {children}
    </div>
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// 1 · Listing Generator
// ──────────────────────────────────────────────────────────────────────────────

const COMPAT_ROWS = [
  { vehicle: "JAGUAR F-TYPE Conv. (X152) 3.0 SCV6",       years: "2012-10→", kw: 250, hp: 340, cc: 2995, code: "306PS(AJ126)" },
  { vehicle: "JAGUAR F-TYPE Conv. (X152) 3.0 SCV6 S",     years: "2012-10→", kw: 280, hp: 380, cc: 2995, code: "306PS(AJ126)" },
  { vehicle: "JAGUAR F-TYPE Conv. (X152) 3.0 SCV6 S AWD", years: "2012-10→", kw: 280, hp: 380, cc: 2995, code: "306PS(AJ126)" },
  { vehicle: "JAGUAR F-TYPE Conv. (X152) 5.0 SCV8 P450",  years: "2019-12→", kw: 331, hp: 450, cc: 5000, code: "508PS(AJ133)" },
  { vehicle: "JAGUAR F-TYPE Conv. (X152) 5.0 SCV8 R",     years: "2013-10→", kw: 405, hp: 551, cc: 5000, code: "508PS(AJ133)" },
];

export function ListingDemo() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t = [];
    const at = (ms, n) => t.push(setTimeout(() => setStep(n), ms));
    at(150,  1);  // left panel
    at(700,  2);  // right panel + preview header
    at(1000, 3);  // OEM table
    at(1250, 4);  // compat vehicles header
    at(1450, 5);  // Jaguar sub-header + col headers
    at(1600, 6);  // row 1
    at(1750, 7);  // row 2
    at(1900, 8);  // row 3
    at(2050, 9);  // row 4
    at(2200, 10); // row 5
    return () => t.forEach(clearTimeout);
  }, [inView]);

  return (
    <Shell ref={ref}>
      {/* 3-column layout matching the actual tool */}
      <div className="flex divide-x divide-hair" style={{ height: 360 }}>

        {/* LEFT: inputs panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={step >= 1 ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, ease }}
          className="flex shrink-0 flex-col gap-2.5 p-3 text-[0.6rem]"
          style={{ width: 162, background: "#f7f9fc" }}
        >
          <div>
            <div className="mb-0.5 font-bold text-[#111827]" style={{ fontSize: "0.68rem" }}>Listing Generator</div>
            <div className="text-[#9ca3af]" style={{ fontSize: "0.55rem" }}>Enter a TecDoc article number or OEM / reference number.</div>
          </div>

          <div>
            <div className="mb-1 font-semibold uppercase tracking-wide text-[#9ca3af]" style={{ fontSize: "0.52rem" }}>Article No. or OEM Number</div>
            <div className="flex items-center rounded-md border border-hair bg-white px-2 py-1.5">
              <span className="font-mono font-semibold text-[#111827]" style={{ fontSize: "0.72rem" }}>AOP858</span>
            </div>
          </div>

          <div>
            <div className="mb-1 font-semibold uppercase tracking-wide text-[#9ca3af]" style={{ fontSize: "0.52rem" }}>Templates</div>
            <div className="flex flex-wrap gap-1">
              {["Clean Default", "Dark Header"].map(t => (
                <span key={t} className="rounded border border-hair bg-white px-1.5 py-0.5 text-[#6b7280]" style={{ fontSize: "0.52rem" }}>{t}</span>
              ))}
              <span className="rounded border px-1.5 py-0.5 font-bold" style={{ fontSize: "0.52rem", borderColor: "#135DFF", color: "#135DFF", background: "rgba(19,93,255,0.06)" }}>Table Focused</span>
              {["Minimal", "Professional Blue"].map(t => (
                <span key={t} className="rounded border border-hair bg-white px-1.5 py-0.5 text-[#6b7280]" style={{ fontSize: "0.52rem" }}>{t}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 font-semibold uppercase tracking-wide text-[#9ca3af]" style={{ fontSize: "0.52rem" }}>Content Options</div>
            {["Compatibility Table", "Interchangeable Numbers", "Engine Codes"].map(label => (
              <div key={label} className="mb-1 flex items-center justify-between">
                <span className="text-[#374151]" style={{ fontSize: "0.55rem" }}>{label}</span>
                <span className="rounded-full px-1.5 py-0.5 text-white" style={{ fontSize: "0.45rem", background: "#135DFF" }}>ON</span>
              </div>
            ))}
          </div>

          <button className="mt-auto w-full rounded-lg py-2 font-bold text-white" style={{ background: "#135DFF", fontSize: "0.65rem" }}>
            Search & Generate
          </button>
          <div className="text-center text-[#9ca3af]" style={{ fontSize: "0.5rem" }}>Unlimited Listings</div>
        </motion.div>

        {/* CENTER: listing preview */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Tab bar */}
          <div className="flex shrink-0 border-b border-hair bg-[#f7f9fc]">
            {["Preview", "Item Specifics"].map((t, i) => (
              <div key={t} className="px-3 py-2" style={{ fontSize: "0.65rem", fontWeight: 600, color: i === 0 ? "#135DFF" : "#9ca3af", borderBottom: i === 0 ? "2px solid #135DFF" : "2px solid transparent" }}>{t}</div>
            ))}
            {step >= 2 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ml-auto mr-2 self-center rounded px-2 py-1 font-semibold text-white"
                style={{ fontSize: "0.55rem", background: "#135DFF" }}
              >
                ✏ Edit Description
              </motion.button>
            )}
          </div>

          {/* Listing body — clipped with fade so table doesn't extend too far */}
          <div className="relative flex-1 overflow-hidden bg-white">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16" style={{ background: "linear-gradient(to bottom, transparent, white)" }} />
            {step >= 2 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
                <div className="py-2 text-center font-bold text-[#111827]" style={{ fontSize: "0.85rem" }}>Oil Pump</div>
                <div className="mx-3 mb-2 rounded px-2 py-1 text-center" style={{ fontSize: "0.58rem", background: "#fefce8", border: "1px solid #fde68a", color: "#92400e" }}>
                  ⚠ Please verify compatibility before ordering
                </div>
              </motion.div>
            )}

            {/* OEM table */}
            {step >= 3 && (
              <motion.table
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease }}
                className="w-full"
                style={{ borderCollapse: "collapse", fontSize: "0.6rem" }}
              >
                <tbody>
                  {[
                    ["OEM Numbers", "C2Z28368, DW936600BA, LR052436"],
                    ["Autopumps UK", "AOP858"],
                    ["OSSCA", "67164"],
                  ].map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td className="px-3 py-1 font-semibold text-[#374151]" style={{ width: "38%" }}>{k}</td>
                      <td className="px-3 py-1 font-mono text-[#6b7280]">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </motion.table>
            )}

            {/* Compatible Vehicles header */}
            {step >= 4 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="mt-1 px-3 py-1.5 font-bold text-white"
                style={{ background: "#1f2937", fontSize: "0.65rem" }}
              >
                Compatible Vehicles (58 applications)
              </motion.div>
            )}

            {/* Jaguar sub-header + column headers + rows */}
            {step >= 5 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                <div className="px-3 py-1 font-bold text-white" style={{ background: "#374151", fontSize: "0.62rem" }}>Jaguar</div>
                <table className="w-full" style={{ borderCollapse: "collapse", fontSize: "0.56rem" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9" }}>
                      {["Vehicle", "Years", "kW", "HP", "CC", "Engine Codes"].map(h => (
                        <th key={h} className="px-1.5 py-1 text-left font-bold text-[#374151]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPAT_ROWS.map((r, i) =>
                      step >= i + 6 ? (
                        <motion.tr
                          key={r.vehicle}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.22, ease }}
                          style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}
                        >
                          <td className="px-1.5 py-1 text-[#111827]" style={{ maxWidth: 120 }}>{r.vehicle}</td>
                          <td className="px-1.5 py-1 font-mono text-[#6b7280]">{r.years}</td>
                          <td className="px-1.5 py-1 text-[#374151]">{r.kw}</td>
                          <td className="px-1.5 py-1 text-[#374151]">{r.hp}</td>
                          <td className="px-1.5 py-1 text-[#374151]">{r.cc}</td>
                          <td className="px-1.5 py-1 font-mono text-[#6b7280]">{r.code}</td>
                        </motion.tr>
                      ) : null
                    )}
                  </tbody>
                </table>
              </motion.div>
            )}
          </div>
        </div>

        {/* RIGHT: article info panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={step >= 2 ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, ease }}
          className="flex shrink-0 flex-col gap-3 p-3"
          style={{ width: 140, background: "#f7f9fc" }}
        >
          <div>
            <div className="mb-1 font-bold uppercase tracking-wide text-[#9ca3af]" style={{ fontSize: "0.5rem" }}>Article</div>
            <div className="font-bold text-[#111827]" style={{ fontSize: "0.72rem" }}>Oil Pump</div>
            <div className="text-[#6b7280]" style={{ fontSize: "0.58rem" }}>AOP858</div>
            <div className="mt-1 font-semibold" style={{ fontSize: "0.58rem", color: "#135DFF" }}>✓ 58 compatible vehicles</div>
          </div>

          <div className="flex flex-col gap-1.5">
            <button className="w-full rounded-lg py-1.5 text-center font-bold text-white" style={{ background: "#135DFF", fontSize: "0.6rem" }}>Check Market Prices →</button>
            <button className="w-full rounded-lg py-1.5 text-center font-bold text-white" style={{ background: "#135DFF", fontSize: "0.6rem" }}>💾 Save Listing</button>
            <button className="w-full rounded-lg border border-hair bg-white py-1.5 text-center font-semibold text-[#374151]" style={{ fontSize: "0.6rem" }}>📋 Copy HTML</button>
          </div>

          <div>
            <div className="mb-0.5 font-bold uppercase tracking-wide text-[#9ca3af]" style={{ fontSize: "0.5rem" }}>Title <span className="font-normal normal-case">8 / 80</span></div>
            <div className="text-[#111827]" style={{ fontSize: "0.62rem" }}>Oil Pump</div>
          </div>

          <div>
            <div className="mb-0.5 font-bold uppercase tracking-wide text-[#9ca3af]" style={{ fontSize: "0.5rem" }}>OEM Numbers</div>
            <div className="font-mono text-[#6b7280]" style={{ fontSize: "0.52rem" }}>C2Z28368, DW936600BA, LR052436</div>
          </div>
        </motion.div>
      </div>
    </Shell>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 2 · eBay Price Analysis — Smart eBay Pricing panel + live listings
// ──────────────────────────────────────────────────────────────────────────────

const CHART_BINS = [
  { label: "£20",  count: 3  },
  { label: "£40",  count: 4  },
  { label: "£60",  count: 6  },
  { label: "£80",  count: 28 },
  { label: "£100", count: 8  },
  { label: "£120", count: 4  },
  { label: "£160", count: 3  },
  { label: "£200", count: 2  },
  { label: "£380", count: 1  },
];
const YOUR_PRICE_BIN = 3;

const EBAY_LISTINGS = [
  { title: "OIL PUMP LR002465 Range Rover Sport TDV6 SDV6 NEW 276DT 306DT 2.7 3.0", price: "£38.99",  seller: "1,204 · 97.3%" },
  { title: "Oil Pump For JAGUAR XF XJ 2.7 3.0 SDV6 306DT 276DT Engine NEW",          price: "£64.50",  seller: "15,829 · 99.8%" },
  { title: "OIL PUMP Range Rover Mk4 Diesel TDV6 SDV6 NEW 276DT 306DT LR002465",     price: "£81.05",  seller: "79,185 · 99.9%" },
  { title: "OIL PUMP LR002465 Land Rover DISCOVERY TDV6 SDV6 NEW 3.0 306DT",         price: "£85.99",  seller: "79,185 · 99.9%" },
  { title: "Oil Pump LAND ROVER DISCOVERY III IV V Range Rover Sport 2.7 3.0 306DT",  price: "£94.00",  seller: "15,829 · 99.8%" },
  { title: "OIL PUMP & SEALS Range Rover Sport L320 2005-2013 LR002465 NEW 2.7 3.0",  price: "£114.99", seller: "115,275 · 99.9%" },
  { title: "Genuine Land Rover Oil Pump Assembly LR002465 Discovery 3 4 Range Rover",  price: "£249.00", seller: "3,871 · 99.6%" },
];

export function PriceChartDemo() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t = [];
    const at = (ms, n) => t.push(setTimeout(() => setStep(n), ms));
    at(150,  1);  // header
    at(500,  2);  // stats
    at(900,  3);  // bars
    at(1500, 4);  // beam
    at(1800, 5);  // listings panel header
    at(2000, 6);  // listing 1
    at(2150, 7);  // listing 2
    at(2300, 8);  // listing 3
    at(2450, 9);  // listing 4
    at(2600, 10); // listing 5
    at(2750, 11); // listing 6
    at(2900, 12); // listing 7
    return () => t.forEach(clearTimeout);
  }, [inView]);

  const maxCount = Math.max(...CHART_BINS.map(b => b.count));
  const n     = CHART_BINS.length;
  const W     = 240;
  const H     = 80;
  const LH    = 12;
  const barW  = W / n - 2;
  const beamX = ((YOUR_PRICE_BIN + 0.5) / n) * W;

  return (
    <Shell ref={ref}>
      <div className="flex divide-x divide-hair overflow-hidden" style={{ height: 400 }}>

        {/* LEFT: chart panel */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={step >= 1 ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, ease }}
            className="flex shrink-0 items-center gap-2 border-b border-hair px-3 py-2.5"
            style={{ background: "#f7f9fc" }}
          >
            <span className="text-[0.75rem] font-bold text-[#111827]">Smart eBay Pricing</span>
            <span className="rounded px-1.5 py-0.5 text-[0.5rem] font-bold text-white" style={{ background: "#135DFF" }}>PRO</span>
            <span className="ml-auto text-[0.55rem] font-medium" style={{ color: "#135DFF" }}>LR002465 · 60 listings</span>
          </motion.div>

          <div className="flex-1 overflow-hidden p-3">
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={step >= 2 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.35, ease }}
              className="mb-3 grid grid-cols-4 gap-1.5"
            >
              {[
                ["Selling Price", "£85.59", "#111827"],
                ["Net Profit",    "£17.50", "#16a34a"],
                ["Margin",        "20.4%",  "#135DFF"],
                ["Markup",        "50.0%",  "#ea580c"],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-lg border border-hair bg-white p-1.5 text-center">
                  <div className="text-[0.45rem] uppercase tracking-wide text-[#9ca3af]">{label}</div>
                  <div className="mt-0.5 font-extrabold leading-none" style={{ fontSize: "0.72rem", color }}>{value}</div>
                </div>
              ))}
            </motion.div>

            {/* Price Distribution */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={step >= 2 ? { opacity: 1 } : {}}
              transition={{ duration: 0.3 }}
              className="overflow-hidden rounded-xl border border-hair bg-white p-2.5"
            >
              <div className="mb-1.5 text-[0.65rem] font-bold text-[#111827]">Price Distribution</div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={step >= 3 ? { opacity: 1 } : {}}
                className="mb-1 flex justify-between"
                style={{ fontSize: "0.48rem", fontWeight: 600 }}
              >
                <span style={{ color: "#7c3aed" }}>LOW £38.32</span>
                <span style={{ color: "#2563eb" }}>MED £84.90</span>
                <span style={{ color: "#0891b2" }}>YOUR £85.59</span>
                <span style={{ color: "#ea580c" }}>AVG £108.89</span>
                <span style={{ color: "#dc2626" }}>HIGH £379.99</span>
              </motion.div>

              <svg width="100%" viewBox={`0 0 ${W} ${H + LH}`} preserveAspectRatio="none" style={{ display: "block", height: 90 }}>
                {[0.25, 0.5, 0.75, 1].map(f => (
                  <line key={f} x1={0} y1={H * (1 - f)} x2={W} y2={H * (1 - f)} stroke="#f3f4f6" strokeWidth={1} />
                ))}
                {CHART_BINS.map((bin, i) => {
                  const bh = (bin.count / maxCount) * H;
                  const bx = i * (W / n) + 1;
                  const by = H - bh;
                  const isYP = i === YOUR_PRICE_BIN;
                  return (
                    <motion.rect
                      key={bin.label} x={bx} width={barW} rx={2}
                      initial={{ y: H, height: 0 }}
                      animate={step >= 3 ? { y: by, height: bh } : { y: H, height: 0 }}
                      transition={{ duration: 0.5, delay: step >= 3 ? i * 0.05 : 0, ease }}
                      fill={isYP ? "#0891b2" : "#bfdbfe"}
                      style={isYP ? { filter: "drop-shadow(0 0 3px rgba(8,145,178,0.5))" } : undefined}
                    />
                  );
                })}
                <motion.line
                  x1={beamX} y1={0} x2={beamX} y2={H}
                  stroke="#0891b2" strokeWidth={1.5} strokeDasharray="3 2"
                  initial={{ opacity: 0 }}
                  animate={step >= 4 ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.4 }}
                />
                {CHART_BINS.filter((_, i) => i % 2 === 0).map((bin, idx) => (
                  <text key={bin.label} x={((idx * 2 + 0.5) / n) * W} y={H + LH - 1} textAnchor="middle" fill="#9ca3af" fontSize={5.5} fontFamily="monospace">
                    {bin.label}
                  </text>
                ))}
              </svg>

              <div className="mt-1 text-[#9ca3af]" style={{ fontSize: "0.52rem" }}>
                £38–£380 · £20 price bands · 60 listings
              </div>
            </motion.div>
          </div>
        </div>

        {/* RIGHT: eBay listings panel */}
        <motion.div
          initial={{ x: 200, opacity: 0 }}
          animate={step >= 5 ? { x: 0, opacity: 1 } : {}}
          transition={{ duration: 0.45, ease }}
          className="flex shrink-0 flex-col overflow-hidden"
          style={{ width: 196, background: "#fff" }}
        >
          {/* Panel header */}
          <div className="flex shrink-0 items-center gap-2 border-b border-hair px-3 py-2" style={{ background: "#f7f9fc" }}>
            <div>
              <div className="font-bold text-[#111827]" style={{ fontSize: "0.68rem" }}>All Results</div>
              <div className="text-[#6b7280]" style={{ fontSize: "0.52rem" }}>60 listings found</div>
            </div>
            <span className="ml-auto text-[0.5rem] text-[#9ca3af]">Price: Low to High</span>
          </div>

          {/* Listing rows */}
          <div className="flex-1 overflow-hidden">
            {EBAY_LISTINGS.map((l, i) =>
              step >= i + 6 ? (
                <motion.div
                  key={l.title}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease }}
                  className="flex gap-2 border-b border-hair p-2"
                >
                  <div className="shrink-0 overflow-hidden rounded" style={{ width: 36, height: 36, border: "1px solid #e5e7eb", background: "#f9fafb" }}>
                    <img src="/oil-pump.png" alt="" className="h-full w-full object-contain" style={{ padding: 2 }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="leading-tight text-[#111827]" style={{ fontSize: "0.55rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {l.title}
                    </div>
                    <div className="mt-0.5 font-bold text-[#111827]" style={{ fontSize: "0.68rem" }}>{l.price}</div>
                    <div className="text-[#9ca3af]" style={{ fontSize: "0.48rem" }}>New · {l.seller} · Free delivery</div>
                  </div>
                </motion.div>
              ) : null
            )}
          </div>
        </motion.div>

      </div>
    </Shell>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 3 · Price Calculator — cost inputs & breakdown
// ──────────────────────────────────────────────────────────────────────────────

const BREAKDOWN_ROWS = [
  { label: "Product cost",              value: "−£35.00", color: "#dc2626" },
  { label: "Postage & packaging",       value: "−£5.00",  color: "#dc2626" },
  { label: "eBay fees (12.8% + £0.30)", value: "−£10.79", color: "#dc2626" },
  { label: "VAT collected → HMRC",      value: "−£13.66", color: "#dc2626", note: "You keep none of this" },
];

export function PriceCalcDemo() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t = [];
    const at = (ms, n) => t.push(setTimeout(() => setStep(n), ms));
    at(200, 1); at(600, 2); at(900, 3); at(1200, 4); at(1550, 5); at(1900, 6);
    return () => t.forEach(clearTimeout);
  }, [inView]);

  return (
    <Shell ref={ref}>
      <div className="grid grid-cols-2 divide-x divide-hair">
        {/* Left: inputs */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={step >= 1 ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.4, ease }}
          className="p-4"
          style={{ background: "#f7f9fc" }}
        >
          <div className="mb-3 text-[0.55rem] font-bold uppercase tracking-widest text-[#9ca3af]">
            Cost & Pricing Inputs
          </div>

          <div className="mb-3 space-y-1.5">
            <div className="text-[0.55rem] font-bold uppercase tracking-wide text-[#9ca3af]">Product</div>
            <div className="flex items-center justify-between rounded-lg border border-hair bg-white px-2.5 py-1.5">
              <span className="text-[0.6rem] text-[#6b7280]">Product / SKU</span>
              <span className="text-[0.65rem] font-semibold text-[#111827]">306DT OIL PUMP</span>
            </div>
          </div>

          <div className="mb-3 space-y-1">
            <div className="text-[0.55rem] font-bold uppercase tracking-wide text-[#9ca3af]">Your Costs</div>
            {[["Item cost", "£35.00"], ["Postage", "£4.50"], ["Packaging", "£0.50"]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded border border-hair bg-white px-2 py-1">
                <span className="text-[0.6rem] text-[#6b7280]">{k}</span>
                <span className="font-mono text-[0.65rem] font-semibold text-[#111827]">{v}</span>
              </div>
            ))}
          </div>

          <div className="mb-3 space-y-1">
            <div className="text-[0.55rem] font-bold uppercase tracking-wide text-[#9ca3af]">eBay Fees</div>
            {[["Final value (%)", "12.8"], ["Fixed fee", "£0.30"], ["Ad rate (%)", "0"]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded border border-hair bg-white px-2 py-1">
                <span className="text-[0.6rem] text-[#6b7280]">{k}</span>
                <span className="font-mono text-[0.65rem] font-semibold text-[#111827]">{v}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-hair bg-white px-2.5 py-1.5">
            <span className="text-[0.6rem] text-[#6b7280]">VAT registered (20%)</span>
            <span className="rounded-full px-2 py-0.5 text-[0.55rem] font-bold text-white" style={{ background: "#135DFF" }}>ON</span>
          </div>

          <div className="mt-2 space-y-1">
            <div className="text-[0.55rem] font-bold uppercase tracking-wide text-[#9ca3af]">Selling Price <span className="normal-case font-normal text-[#9ca3af]">(inc. VAT)</span></div>
            <div className="flex items-center rounded-lg border-2 bg-white px-2.5 py-1.5" style={{ borderColor: "#135DFF" }}>
              <span className="font-mono text-[0.9rem] font-bold text-[#111827]">81.95</span>
            </div>
          </div>
        </motion.div>

        {/* Right: stats + breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={step >= 1 ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.4, ease }}
          className="flex flex-col p-4"
        >
          {/* 4 headline stats matching the actual app */}
          <div className="mb-3 grid grid-cols-2 gap-1.5">
            {[
              ["SELLING PRICE", "£81.95", "#111827"],
              ["NET PROFIT",    "£17.50", "#16a34a"],
              ["MARGIN",        "21.4%",  "#135DFF"],
              ["MARKUP",        "50.0%",  "#ea580c"],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-lg border border-hair bg-[#f7f9fc] p-2 text-center">
                <div className="text-[0.48rem] font-bold uppercase tracking-wide text-[#9ca3af]">{label}</div>
                <div className="mt-0.5 font-mono text-[0.85rem] font-extrabold leading-none" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>

          <div className="mb-2 text-[0.55rem] font-bold uppercase tracking-widest text-[#9ca3af]">
            Cost Breakdown
          </div>

          <div className="mb-1 flex items-baseline justify-between border-b border-hair pb-1.5">
            <span className="text-[0.62rem] font-semibold text-[#111827]">Selling price</span>
            <span className="font-mono text-[0.7rem] font-bold text-[#111827]">£81.95</span>
          </div>

          <div className="space-y-1.5">
            {BREAKDOWN_ROWS.map(({ label, value, color, note }, i) =>
              step >= i + 2 ? (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease }}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[0.58rem] leading-tight text-[#6b7280]">{label}</span>
                    <span className="font-mono text-[0.62rem] font-bold shrink-0" style={{ color }}>{value}</span>
                  </div>
                  {note && <div className="text-[0.5rem] text-[#9ca3af]">{note}</div>}
                </motion.div>
              ) : null
            )}
          </div>

          {step >= 6 && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease }}
              className="mt-auto rounded-xl border-t border-hair pt-3"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[0.72rem] font-bold text-[#111827]">Net Profit</span>
                <span className="font-mono text-[1rem] font-extrabold" style={{ color: "#16a34a" }}>£17.50</span>
              </div>
              <div className="mt-1 rounded-lg px-3 py-1.5 text-center" style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)" }}>
                <span className="text-[0.65rem] font-bold" style={{ color: "#16a34a" }}>Break-even selling price: </span>
                <span className="font-mono text-[0.65rem] font-bold" style={{ color: "#d97706" }}>£57.14</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </Shell>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 4 · Compatibility Checker
// ──────────────────────────────────────────────────────────────────────────────

const CC_STEPS_TEXT = [
  "Looking up vehicle from registration...",
  "Searching OEM number in TecDoc...",
  "Checking part compatibility...",
];

export function CompatDemo() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t = [];
    const at = (ms, n) => t.push(setTimeout(() => setStep(n), ms));
    at(300, 1); at(750, 2); at(1200, 3); at(1650, 4);
    return () => t.forEach(clearTimeout);
  }, [inView]);

  return (
    <Shell ref={ref}>
      {/* Inputs */}
      <div className="border-b border-hair bg-white px-4 py-3">
        <div className="mb-2.5 text-center text-[0.72rem] font-bold text-[#111827]">Compatibility Checker</div>
        <div className="grid grid-cols-2 gap-3">
          {[["VIN Number", "SALLSAAG5DA803495"], ["OEM / Part Number", "LR002465"]].map(([label, val]) => (
            <div key={label}>
              <div className="mb-1 text-[0.58rem] font-semibold text-[#6b7280]">{label}</div>
              <div className="rounded-lg border border-hair bg-white px-3 py-2 font-mono text-[0.75rem] font-semibold text-[#111827]">{val}</div>
            </div>
          ))}
        </div>
        <button
          className="mt-3 w-full rounded-xl py-2.5 text-[0.78rem] font-bold text-white"
          style={{ background: "#135DFF" }}
        >
          Check Compatibility
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Progress */}
        {step >= 1 && step < 4 && (
          <div className="rounded-xl border border-hair p-3 space-y-2">
            {CC_STEPS_TEXT.map((s, i) => {
              const done   = step > i + 1;
              const active = step === i + 1;
              return (
                <motion.div
                  key={s}
                  initial={false}
                  animate={{ opacity: (done || active) ? 1 : 0.3 }}
                  className="flex items-center gap-2.5"
                >
                  <span
                    className="h-5 w-5 shrink-0 rounded-full flex items-center justify-center text-[0.55rem]"
                    style={{
                      background: done ? "#dcfce7" : active ? "#eff6ff" : "#f3f4f6",
                      border: `1px solid ${done ? "#86efac" : active ? "#bfdbfe" : "#e5e7eb"}`,
                      color: done ? "#16a34a" : active ? "#2563eb" : "#9ca3af",
                    }}
                  >
                    {done   ? <Check className="h-3 w-3" strokeWidth={3} /> :
                     active ? <Loader2 className="h-3 w-3 animate-spin" /> :
                     i + 1}
                  </span>
                  <span className="text-[0.68rem]" style={{ color: done ? "#16a34a" : active ? "#111827" : "#9ca3af", fontWeight: active ? 600 : 400 }}>
                    {s}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Result */}
        {step >= 4 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            {/* Compatible banner */}
            <div className="mb-3 flex items-center gap-2">
              <Check className="h-5 w-5 shrink-0" style={{ color: "#16a34a" }} strokeWidth={3} />
              <span className="text-[0.9rem] font-extrabold" style={{ color: "#16a34a" }}>Compatible</span>
            </div>
            <p className="mb-3 text-[0.68rem] text-[#6b7280]">This part appears to be compatible with the entered vehicle.</p>

            {/* Confidence bar */}
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[0.6rem] font-medium text-[#6b7280]">Confidence</span>
                <span className="flex items-center gap-2">
                  <span className="font-bold text-[0.7rem] text-[#111827]">92</span>
                  <span className="text-[0.58rem] text-[#16a34a]">High Confidence — Compatible</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#f3f4f6]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "92%" }}
                  transition={{ duration: 0.8, ease, delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{ background: "#16a34a" }}
                />
              </div>
            </div>

            {/* Vehicle + Part cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-hair bg-[#f7f9fc] p-2.5">
                <div className="mb-2 text-[0.5rem] font-bold uppercase tracking-wide text-[#9ca3af]">Vehicle</div>
                <div className="mb-1.5 rounded bg-white px-2 py-0.5 font-mono text-[0.55rem] font-bold text-[#6b7280] inline-block">SALLSAAG5DA803495</div>
                {[["Make","LAND ROVER"],["Variant","3.0 D 4×4"],["Year","2010–2013"],["Fuel","diesel"],["Engine Size","2993cc"],["Engine Code","306DT(TDV6)"],["Power","155 kW / 211 HP"]].map(([k,v]) => (
                  <div key={k} className="flex justify-between py-0.5 text-[0.58rem]" style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ color: "#135DFF" }}>{k}</span>
                    <span className="font-medium text-[#111827]">{v}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-hair bg-[#f7f9fc] p-2.5">
                <div className="mb-2 text-[0.5rem] font-bold uppercase tracking-wide text-[#9ca3af]">Part</div>
                <div className="mb-2 overflow-hidden rounded-lg bg-white p-1" style={{ border: "1px solid #e5e7eb", minHeight: 68 }}>
                  <img
                    src="/oil-pump.png"
                    alt="Oil Pump PU0127"
                    className="h-full w-full object-contain"
                    style={{ maxHeight: 68 }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement.style.background = "#f9fafb";
                    }}
                  />
                </div>
                {[["Article No","PU0127"],["Product Type","Oil Pump"]].map(([k,v]) => (
                  <div key={k} className="flex justify-between py-0.5 text-[0.58rem]" style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <span className="text-[#6b7280]">{k}</span>
                    <span className="font-medium text-[#111827]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </Shell>
  );
}
