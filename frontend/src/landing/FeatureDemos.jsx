import { forwardRef, useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

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

const getCompatRows = (t) => [
  { vehicle: t("landing.featureDemos.listing.compatRows.0"), years: "2012-10→", kw: 250, hp: 340, cc: 2995, code: "306PS(AJ126)" },
  { vehicle: t("landing.featureDemos.listing.compatRows.1"), years: "2012-10→", kw: 280, hp: 380, cc: 2995, code: "306PS(AJ126)" },
  { vehicle: t("landing.featureDemos.listing.compatRows.2"), years: "2012-10→", kw: 280, hp: 380, cc: 2995, code: "306PS(AJ126)" },
  { vehicle: t("landing.featureDemos.listing.compatRows.3"), years: "2019-12→", kw: 331, hp: 450, cc: 5000, code: "508PS(AJ133)" },
  { vehicle: t("landing.featureDemos.listing.compatRows.4"), years: "2013-10→", kw: 405, hp: 551, cc: 5000, code: "508PS(AJ133)" },
];

export function ListingDemo() {
  const { t } = useTranslation();
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [step, setStep] = useState(0);
  const compatRows = getCompatRows(t);

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
            <div className="mb-0.5 font-bold text-[#111827]" style={{ fontSize: "0.68rem" }}>{t("landing.featureDemos.listing.title")}</div>
            <div className="text-[#9ca3af]" style={{ fontSize: "0.55rem" }}>{t("landing.featureDemos.listing.subtitle")}</div>
          </div>

          <div>
            <div className="mb-1 font-semibold uppercase tracking-wide text-[#9ca3af]" style={{ fontSize: "0.52rem" }}>{t("landing.featureDemos.listing.articleNumber")}</div>
            <div className="flex items-center rounded-md border border-hair bg-white px-2 py-1.5">
              <span className="font-mono font-semibold text-[#111827]" style={{ fontSize: "0.72rem" }}>AOP858</span>
            </div>
          </div>

          <div>
            <div className="mb-1 font-semibold uppercase tracking-wide text-[#9ca3af]" style={{ fontSize: "0.52rem" }}>{t("landing.featureDemos.listing.templates")}</div>
            <div className="flex flex-wrap gap-1">
              {["cleanDefault", "darkHeader"].map(key => (
                <span key={key} className="rounded border border-hair bg-white px-1.5 py-0.5 text-[#6b7280]" style={{ fontSize: "0.52rem" }}>{t(`landing.featureDemos.listing.templateNames.${key}`)}</span>
              ))}
              <span className="rounded border px-1.5 py-0.5 font-bold" style={{ fontSize: "0.52rem", borderColor: "#135DFF", color: "#135DFF", background: "rgba(19,93,255,0.06)" }}>{t("landing.featureDemos.listing.templateNames.tableFocused")}</span>
              {["minimal", "professionalBlue"].map(key => (
                <span key={key} className="rounded border border-hair bg-white px-1.5 py-0.5 text-[#6b7280]" style={{ fontSize: "0.52rem" }}>{t(`landing.featureDemos.listing.templateNames.${key}`)}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 font-semibold uppercase tracking-wide text-[#9ca3af]" style={{ fontSize: "0.52rem" }}>{t("landing.featureDemos.listing.contentOptions")}</div>
            {["compatibilityTable", "interchangeableNumbers", "engineCodes"].map(key => (
              <div key={key} className="mb-1 flex items-center justify-between">
                <span className="text-[#374151]" style={{ fontSize: "0.55rem" }}>{t(`landing.featureDemos.listing.contentOptionNames.${key}`)}</span>
                <span className="rounded-full px-1.5 py-0.5 text-white" style={{ fontSize: "0.45rem", background: "#135DFF" }}>{t("landing.featureDemos.common.on")}</span>
              </div>
            ))}
          </div>

          <button className="mt-auto w-full rounded-lg py-2 font-bold text-white" style={{ background: "#135DFF", fontSize: "0.65rem" }}>
            {t("landing.featureDemos.listing.searchGenerate")}
          </button>
          <div className="text-center text-[#9ca3af]" style={{ fontSize: "0.5rem" }}>{t("landing.featureDemos.listing.unlimitedListings")}</div>
        </motion.div>

        {/* CENTER: listing preview */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Tab bar */}
          <div className="flex shrink-0 border-b border-hair bg-[#f7f9fc]">
            {["preview", "itemSpecifics"].map((key, i) => (
              <div key={key} className="px-3 py-2" style={{ fontSize: "0.65rem", fontWeight: 600, color: i === 0 ? "#135DFF" : "#9ca3af", borderBottom: i === 0 ? "2px solid #135DFF" : "2px solid transparent" }}>{t(`landing.featureDemos.listing.tabs.${key}`)}</div>
            ))}
            {step >= 2 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ml-auto mr-2 self-center rounded px-2 py-1 font-semibold text-white"
                style={{ fontSize: "0.55rem", background: "#135DFF" }}
              >
                ✏ {t("landing.featureDemos.listing.editDescription")}
              </motion.button>
            )}
          </div>

          {/* Listing body — clipped with fade so table doesn't extend too far */}
          <div className="relative flex-1 overflow-hidden bg-white">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16" style={{ background: "linear-gradient(to bottom, transparent, white)" }} />
            {step >= 2 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
                <div className="py-2 text-center font-bold text-[#111827]" style={{ fontSize: "0.85rem" }}>{t("landing.featureDemos.common.oilPump")}</div>
                <div className="mx-3 mb-2 rounded px-2 py-1 text-center" style={{ fontSize: "0.58rem", background: "#fefce8", border: "1px solid #fde68a", color: "#92400e" }}>
                  ⚠ {t("landing.featureDemos.listing.verifyCompatibility")}
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
                    [t("landing.featureDemos.listing.oemNumbers"), "C2Z28368, DW936600BA, LR052436"],
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
                {t("landing.featureDemos.listing.compatibleVehicles", { count: 58 })}
              </motion.div>
            )}

            {/* Jaguar sub-header + column headers + rows */}
            {step >= 5 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                <div className="px-3 py-1 font-bold text-white" style={{ background: "#374151", fontSize: "0.62rem" }}>Jaguar</div>
                <table className="w-full" style={{ borderCollapse: "collapse", fontSize: "0.56rem" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9" }}>
                      {["vehicle", "years", "kw", "hp", "cc", "engineCodes"].map(key => (
                        <th key={key} className="px-1.5 py-1 text-left font-bold text-[#374151]">{t(`landing.featureDemos.listing.columns.${key}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compatRows.map((r, i) =>
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
            <div className="mb-1 font-bold uppercase tracking-wide text-[#9ca3af]" style={{ fontSize: "0.5rem" }}>{t("landing.featureDemos.listing.article")}</div>
            <div className="font-bold text-[#111827]" style={{ fontSize: "0.72rem" }}>{t("landing.featureDemos.common.oilPump")}</div>
            <div className="text-[#6b7280]" style={{ fontSize: "0.58rem" }}>AOP858</div>
            <div className="mt-1 font-semibold" style={{ fontSize: "0.58rem", color: "#135DFF" }}>✓ {t("landing.featureDemos.listing.compatibleVehiclesShort", { count: 58 })}</div>
          </div>

          <div className="flex flex-col gap-1.5">
            <button className="w-full rounded-lg py-1.5 text-center font-bold text-white" style={{ background: "#135DFF", fontSize: "0.6rem" }}>{t("landing.featureDemos.listing.checkMarketPrices")} →</button>
            <button className="w-full rounded-lg py-1.5 text-center font-bold text-white" style={{ background: "#135DFF", fontSize: "0.6rem" }}>💾 {t("landing.featureDemos.common.saveListing")}</button>
            <button className="w-full rounded-lg border border-hair bg-white py-1.5 text-center font-semibold text-[#374151]" style={{ fontSize: "0.6rem" }}>📋 {t("landing.featureDemos.common.copyHtml")}</button>
          </div>

          <div>
            <div className="mb-0.5 font-bold uppercase tracking-wide text-[#9ca3af]" style={{ fontSize: "0.5rem" }}>{t("landing.featureDemos.common.title")} <span className="font-normal normal-case">8 / 80</span></div>
            <div className="text-[#111827]" style={{ fontSize: "0.62rem" }}>{t("landing.featureDemos.common.oilPump")}</div>
          </div>

          <div>
            <div className="mb-0.5 font-bold uppercase tracking-wide text-[#9ca3af]" style={{ fontSize: "0.5rem" }}>{t("landing.featureDemos.listing.oemNumbers")}</div>
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

const getEbayListings = (t) => [
  { title: t("landing.featureDemos.price.listings.0"), price: "£38.99", seller: "1,204 · 97.3%" },
  { title: t("landing.featureDemos.price.listings.1"), price: "£64.50", seller: "15,829 · 99.8%" },
  { title: t("landing.featureDemos.price.listings.2"), price: "£81.05", seller: "79,185 · 99.9%" },
  { title: t("landing.featureDemos.price.listings.3"), price: "£85.99", seller: "79,185 · 99.9%" },
  { title: t("landing.featureDemos.price.listings.4"), price: "£94.00", seller: "15,829 · 99.8%" },
  { title: t("landing.featureDemos.price.listings.5"), price: "£114.99", seller: "115,275 · 99.9%" },
  { title: t("landing.featureDemos.price.listings.6"), price: "£249.00", seller: "3,871 · 99.6%" },
];

export function PriceChartDemo() {
  const { t } = useTranslation();
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [step, setStep] = useState(0);
  const ebayListings = getEbayListings(t);

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
            <span className="text-[0.75rem] font-bold text-[#111827]">{t("landing.featureDemos.price.title")}</span>
            <span className="rounded px-1.5 py-0.5 text-[0.5rem] font-bold text-white" style={{ background: "#135DFF" }}>PRO</span>
            <span className="ml-auto text-[0.55rem] font-medium" style={{ color: "#135DFF" }}>LR002465 · {t("landing.featureDemos.price.listingsCount", { count: 60 })}</span>
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
                [t("landing.featureDemos.common.sellingPrice"), "£85.59", "#111827"],
                [t("landing.featureDemos.common.netProfit"), "£17.50", "#16a34a"],
                [t("landing.featureDemos.common.margin"), "20.4%", "#135DFF"],
                [t("landing.featureDemos.common.markup"), "50.0%", "#ea580c"],
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
              <div className="mb-1.5 text-[0.65rem] font-bold text-[#111827]">{t("landing.featureDemos.price.distribution")}</div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={step >= 3 ? { opacity: 1 } : {}}
                className="mb-1 flex justify-between"
                style={{ fontSize: "0.48rem", fontWeight: 600 }}
              >
                <span style={{ color: "#7c3aed" }}>{t("landing.featureDemos.price.low")} £38.32</span>
                <span style={{ color: "#2563eb" }}>{t("landing.featureDemos.price.median")} £84.90</span>
                <span style={{ color: "#0891b2" }}>{t("landing.featureDemos.price.your")} £85.59</span>
                <span style={{ color: "#ea580c" }}>{t("landing.featureDemos.price.average")} £108.89</span>
                <span style={{ color: "#dc2626" }}>{t("landing.featureDemos.price.high")} £379.99</span>
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
                {t("landing.featureDemos.price.chartCaption", { count: 60 })}
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
              <div className="font-bold text-[#111827]" style={{ fontSize: "0.68rem" }}>{t("landing.featureDemos.price.allResults")}</div>
              <div className="text-[#6b7280]" style={{ fontSize: "0.52rem" }}>{t("landing.featureDemos.price.listingsFound", { count: 60 })}</div>
            </div>
            <span className="ml-auto text-[0.5rem] text-[#9ca3af]">{t("landing.featureDemos.price.lowToHigh")}</span>
          </div>

          {/* Listing rows */}
          <div className="flex-1 overflow-hidden">
            {ebayListings.map((l, i) =>
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
                    <div className="text-[#9ca3af]" style={{ fontSize: "0.48rem" }}>{t("landing.featureDemos.price.new")} · {l.seller} · {t("landing.featureDemos.price.freeDelivery")}</div>
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

const getBreakdownRows = (t) => [
  { label: t("landing.featureDemos.calculator.productCost"), value: "−£35.00", color: "#dc2626" },
  { label: t("landing.featureDemos.calculator.postagePackaging"), value: "−£5.00", color: "#dc2626" },
  { label: t("landing.featureDemos.calculator.ebayFees"), value: "−£10.79", color: "#dc2626" },
  { label: t("landing.featureDemos.calculator.vatCollected"), value: "−£13.66", color: "#dc2626", note: t("landing.featureDemos.calculator.vatNote") },
];

export function PriceCalcDemo() {
  const { t } = useTranslation();
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [step, setStep] = useState(0);
  const breakdownRows = getBreakdownRows(t);

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
            {t("landing.featureDemos.calculator.costPricingInputs")}
          </div>

          <div className="mb-3 space-y-1.5">
            <div className="text-[0.55rem] font-bold uppercase tracking-wide text-[#9ca3af]">{t("landing.featureDemos.calculator.product")}</div>
            <div className="flex items-center justify-between rounded-lg border border-hair bg-white px-2.5 py-1.5">
              <span className="text-[0.6rem] text-[#6b7280]">{t("landing.featureDemos.calculator.productSku")}</span>
              <span className="text-[0.65rem] font-semibold text-[#111827]">306DT {t("landing.featureDemos.common.oilPump")}</span>
            </div>
          </div>

          <div className="mb-3 space-y-1">
            <div className="text-[0.55rem] font-bold uppercase tracking-wide text-[#9ca3af]">{t("landing.featureDemos.calculator.yourCosts")}</div>
            {[["itemCost", "£35.00"], ["postage", "£4.50"], ["packaging", "£0.50"]].map(([key, v]) => (
              <div key={key} className="flex items-center justify-between rounded border border-hair bg-white px-2 py-1">
                <span className="text-[0.6rem] text-[#6b7280]">{t(`landing.featureDemos.calculator.${key}`)}</span>
                <span className="font-mono text-[0.65rem] font-semibold text-[#111827]">{v}</span>
              </div>
            ))}
          </div>

          <div className="mb-3 space-y-1">
            <div className="text-[0.55rem] font-bold uppercase tracking-wide text-[#9ca3af]">{t("landing.featureDemos.calculator.ebayFeesTitle")}</div>
            {[["finalValue", "12.8"], ["fixedFee", "£0.30"], ["adRate", "0"]].map(([key, v]) => (
              <div key={key} className="flex items-center justify-between rounded border border-hair bg-white px-2 py-1">
                <span className="text-[0.6rem] text-[#6b7280]">{t(`landing.featureDemos.calculator.${key}`)}</span>
                <span className="font-mono text-[0.65rem] font-semibold text-[#111827]">{v}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-hair bg-white px-2.5 py-1.5">
            <span className="text-[0.6rem] text-[#6b7280]">{t("landing.featureDemos.calculator.vatRegistered")}</span>
            <span className="rounded-full px-2 py-0.5 text-[0.55rem] font-bold text-white" style={{ background: "#135DFF" }}>{t("landing.featureDemos.common.on")}</span>
          </div>

          <div className="mt-2 space-y-1">
            <div className="text-[0.55rem] font-bold uppercase tracking-wide text-[#9ca3af]">{t("landing.featureDemos.common.sellingPrice")} <span className="normal-case font-normal text-[#9ca3af]">({t("landing.featureDemos.calculator.includingVat")})</span></div>
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
              [t("landing.featureDemos.common.sellingPrice"), "£81.95", "#111827"],
              [t("landing.featureDemos.common.netProfit"), "£17.50", "#16a34a"],
              [t("landing.featureDemos.common.margin"), "21.4%", "#135DFF"],
              [t("landing.featureDemos.common.markup"), "50.0%", "#ea580c"],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-lg border border-hair bg-[#f7f9fc] p-2 text-center">
                <div className="text-[0.48rem] font-bold uppercase tracking-wide text-[#9ca3af]">{label}</div>
                <div className="mt-0.5 font-mono text-[0.85rem] font-extrabold leading-none" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>

          <div className="mb-2 text-[0.55rem] font-bold uppercase tracking-widest text-[#9ca3af]">
            {t("landing.featureDemos.calculator.costBreakdown")}
          </div>

          <div className="mb-1 flex items-baseline justify-between border-b border-hair pb-1.5">
            <span className="text-[0.62rem] font-semibold text-[#111827]">{t("landing.featureDemos.common.sellingPrice")}</span>
            <span className="font-mono text-[0.7rem] font-bold text-[#111827]">£81.95</span>
          </div>

          <div className="space-y-1.5">
            {breakdownRows.map(({ label, value, color, note }, i) =>
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
                <span className="text-[0.72rem] font-bold text-[#111827]">{t("landing.featureDemos.common.netProfit")}</span>
                <span className="font-mono text-[1rem] font-extrabold" style={{ color: "#16a34a" }}>£17.50</span>
              </div>
              <div className="mt-1 rounded-lg px-3 py-1.5 text-center" style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)" }}>
                <span className="text-[0.65rem] font-bold" style={{ color: "#16a34a" }}>{t("landing.featureDemos.calculator.breakEven")}: </span>
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

const getCcStepsText = (t) => [
  t("landing.featureDemos.compat.progress.vehicleLookup"),
  t("landing.featureDemos.compat.progress.oemSearch"),
  t("landing.featureDemos.compat.progress.compatibilityCheck"),
];

export function CompatDemo() {
  const { t } = useTranslation();
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [step, setStep] = useState(0);
  const ccStepsText = getCcStepsText(t);

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
        <div className="mb-2.5 text-center text-[0.72rem] font-bold text-[#111827]">{t("landing.featureDemos.compat.title")}</div>
        <div className="grid grid-cols-2 gap-3">
          {[[t("landing.featureDemos.compat.vinNumber"), "SALLSAAG5DA803495"], [t("landing.featureDemos.compat.oemPartNumber"), "LR002465"]].map(([label, val]) => (
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
          {t("landing.featureDemos.compat.checkCompatibility")}
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Progress */}
        {step >= 1 && step < 4 && (
          <div className="rounded-xl border border-hair p-3 space-y-2">
            {ccStepsText.map((s, i) => {
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
              <span className="text-[0.9rem] font-extrabold" style={{ color: "#16a34a" }}>{t("landing.featureDemos.compat.compatible")}</span>
            </div>
            <p className="mb-3 text-[0.68rem] text-[#6b7280]">{t("landing.featureDemos.compat.compatibleDescription")}</p>

            {/* Confidence bar */}
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[0.6rem] font-medium text-[#6b7280]">{t("landing.featureDemos.compat.confidence")}</span>
                <span className="flex items-center gap-2">
                  <span className="font-bold text-[0.7rem] text-[#111827]">92</span>
                  <span className="text-[0.58rem] text-[#16a34a]">{t("landing.featureDemos.compat.highConfidence")}</span>
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
                <div className="mb-2 text-[0.5rem] font-bold uppercase tracking-wide text-[#9ca3af]">{t("landing.featureDemos.compat.vehicle")}</div>
                <div className="mb-1.5 rounded bg-white px-2 py-0.5 font-mono text-[0.55rem] font-bold text-[#6b7280] inline-block">SALLSAAG5DA803495</div>
                {[["make","LAND ROVER"],["variant","3.0 D 4×4"],["year","2010–2013"],["fuel",t("landing.featureDemos.compat.diesel")],["engineSize","2993cc"],["engineCode","306DT(TDV6)"],["power","155 kW / 211 HP"]].map(([key,v]) => (
                  <div key={key} className="flex justify-between py-0.5 text-[0.58rem]" style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ color: "#135DFF" }}>{t(`landing.featureDemos.compat.vehicleFields.${key}`)}</span>
                    <span className="font-medium text-[#111827]">{v}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-hair bg-[#f7f9fc] p-2.5">
                <div className="mb-2 text-[0.5rem] font-bold uppercase tracking-wide text-[#9ca3af]">{t("landing.featureDemos.compat.part")}</div>
                <div className="mb-2 overflow-hidden rounded-lg bg-white p-1" style={{ border: "1px solid #e5e7eb", minHeight: 68 }}>
                  <img
                    src="/oil-pump.png"
                    alt={`${t("landing.featureDemos.common.oilPump")} PU0127`}
                    className="h-full w-full object-contain"
                    style={{ maxHeight: 68 }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement.style.background = "#f9fafb";
                    }}
                  />
                </div>
                {[["articleNumber","PU0127"],["productType",t("landing.featureDemos.common.oilPump")]].map(([key,v]) => (
                  <div key={key} className="flex justify-between py-0.5 text-[0.58rem]" style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <span className="text-[#6b7280]">{t(`landing.featureDemos.compat.partFields.${key}`)}</span>
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
