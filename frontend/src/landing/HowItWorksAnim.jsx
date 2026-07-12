import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Check, Search, Sparkles } from "lucide-react";

const ease = [0.22, 1, 0.36, 1];

function useTyping(text, active, speed = 85, startDelay = 300) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active) return;
    let i = 0;
    setOut("");
    setDone(false);
    let interval;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [active, text, speed, startDelay]);
  return { out, done };
}

function PanelShell({ url, children, h = 240 }) {
  return (
    <div className="flex flex-col bg-white" style={{ height: h }}>
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <div className="mx-auto flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1">
          <span className="font-mono text-[0.6rem] text-slate-400">{url}</span>
        </div>
        <span className="w-8" />
      </div>
      <div className="relative flex-1 overflow-hidden p-4">{children}</div>
    </div>
  );
}

export function StepInputAnim({ active }) {
  const { out, done } = useTyping("11247807345", active, 80, 400);
  return (
    <PanelShell url="partlister.app/generator">
      <div className="flex h-full flex-col justify-center">
        <span className="mb-2 font-mono text-[0.62rem] uppercase tracking-wider text-slate-400">
          OE / OEM / Article number
        </span>
        <div className="flex items-center gap-2 rounded-xl border-2 border-primary/40 bg-white px-3.5 py-3 shadow-[0_0_0_4px_rgba(19,93,255,0.08)]">
          <Search className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-mono text-[1rem] font-semibold text-navy">
            {out}
            <span className="ml-0.5 inline-block h-4 w-[2px] -translate-y-[1px] animate-pulse bg-primary align-middle" />
          </span>
        </div>
        <motion.button
          type="button"
          initial={{ opacity: 0.5 }}
          animate={done ? { opacity: 1, scale: [1, 0.96, 1] } : { opacity: 0.5 }}
          transition={{ duration: 0.35, ease }}
          className={`mt-3 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[0.9rem] font-semibold text-white transition-colors ${
            done ? "bg-primary shadow-[0_10px_24px_-8px_rgba(19,93,255,0.7)]" : "bg-primary/50"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Generate listing
        </motion.button>
      </div>
    </PanelShell>
  );
}

const oemRows = [
  { label: "OEM Numbers", value: "C2Z28368, DW936600BA, LR052436" },
  { label: "Autopumps UK", value: "AOP858" },
  { label: "OSSCA", value: "67164" },
];
const vehicleRows = [
  { name: "JAGUAR F-TYPE Convertible (X152) 3.0 SCV6", yrs: "2012-10", kw: "250", hp: "340", cc: "2995", ec: "306PS(AJ126)" },
  { name: "JAGUAR F-TYPE Convertible (X152) 3.0 SCV6 S", yrs: "2012-10", kw: "280", hp: "380", cc: "2995", ec: "306PS(AJ126)" },
  { name: "JAGUAR F-TYPE Convertible (X152) 3.0 SCV6 S AWD", yrs: "2014-12", kw: "280", hp: "380", cc: "2995", ec: "306PS(AJ126)" },
  { name: "JAGUAR F-TYPE Convertible (X152) 5.0 SCV8 P450", yrs: "2019-12", kw: "331", hp: "450", cc: "5000", ec: "508PS(AJ133)" },
  { name: "JAGUAR F-TYPE Convertible (X152) 5.0 SCV8 P450 AWD", yrs: "2019-12", kw: "331", hp: "450", cc: "5000", ec: "508PS(AJ133)" },
  { name: "JAGUAR F-TYPE Convertible (X152) 5.0 SCV8 R", yrs: "2013-10", kw: "405", hp: "551", cc: "5000", ec: "508PS(AJ133)" },
  { name: "JAGUAR F-TYPE Convertible (X152) 5.0 SCV8 R AWD", yrs: "2015-12", kw: "405", hp: "551", cc: "5000", ec: "508PS(AJ133)" },
  { name: "JAGUAR F-TYPE Convertible (X152) 5.0 SCV8 S", yrs: "2012-10", kw: "364", hp: "495", cc: "5000", ec: "508PS(AJ133)" },
  { name: "JAGUAR F-TYPE Coupe (X152) 3.0 SCV6", yrs: "2013-10", kw: "250", hp: "340", cc: "2995", ec: "306PS(AJ126)" },
  { name: "JAGUAR F-TYPE Coupe (X152) 3.0 SCV6 S", yrs: "2013-10", kw: "280", hp: "380", cc: "2995", ec: "306PS(AJ126)" },
];
const kNumbers = ["57131", "57133", "109349", "139188", "109352", "109353", "129271", "100686", "109350", "118546", "24474", "55990", "58152", "31362", "10931"];

export function StepDataAnim({ active }) {
  return (
    <PanelShell url="partlister.app/generator" h={380}>
      <div className="grid h-full grid-cols-[1.55fr_1fr] gap-2 overflow-hidden text-navy">
        <div className="flex flex-col gap-1.5 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={active ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, ease }}
            className="text-center font-display text-[0.82rem] font-extrabold"
          >
            Oil Pump
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={active ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-center text-[0.56rem] font-semibold text-amber-700"
          >
            ⚠ Please verify compatibility before ordering
          </motion.div>
          <div className="flex flex-col overflow-hidden rounded border border-slate-200">
            {oemRows.map((r, i) => (
              <motion.div
                key={r.label}
                initial={{ opacity: 0, x: -10 }}
                animate={active ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.35, delay: 0.3 + i * 0.12, ease }}
                className="flex items-stretch border-b border-slate-100 last:border-0"
              >
                <span className="w-[38%] shrink-0 bg-slate-50 px-1.5 py-1 text-[0.55rem] font-semibold text-slate-500">{r.label}</span>
                <span className="truncate px-1.5 py-1 font-mono text-[0.55rem] text-navy">{r.value}</span>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={active ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="rounded bg-navy px-2 py-1 text-[0.58rem] font-bold text-white"
          >
            Compatible Vehicles (58 applications)
          </motion.div>
          <div className="flex flex-col overflow-hidden rounded border border-slate-300">
            <motion.div
              initial={{ opacity: 0 }}
              animate={active ? { opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.82 }}
              className="bg-[#3a3f45] px-1.5 py-0.5 text-[0.55rem] font-bold text-white"
            >
              Jaguar
            </motion.div>
            <div className="flex bg-[#7c828a] text-[0.5rem] font-bold text-white">
              <span className="flex-1 px-1.5 py-0.5">Vehicle</span>
              <span className="w-10 py-0.5 text-center">Years</span>
              <span className="w-5 py-0.5 text-center">kW</span>
              <span className="w-5 py-0.5 text-center">HP</span>
              <span className="w-7 py-0.5 text-center">CC</span>
              <span className="w-12 py-0.5 text-center">Engine</span>
            </div>
            {vehicleRows.map((v, i) => (
              <motion.div
                key={v.name}
                initial={{ opacity: 0, x: -12 }}
                animate={active ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.35, delay: 0.9 + i * 0.16, ease }}
                className="flex items-center border-b border-slate-100 text-[0.5rem] last:border-0 even:bg-slate-50/70"
              >
                <span className="flex-1 truncate px-1.5 py-0.5 text-navy">{v.name}</span>
                <span className="w-10 py-0.5 text-center font-mono text-[0.46rem] text-slate-500">{v.yrs}</span>
                <span className="w-5 py-0.5 text-center font-mono text-slate-500">{v.kw}</span>
                <span className="w-5 py-0.5 text-center font-mono text-slate-500">{v.hp}</span>
                <span className="w-7 py-0.5 text-center font-mono text-slate-500">{v.cc}</span>
                <span className="w-12 truncate py-0.5 text-center font-mono text-[0.46rem] text-slate-500">{v.ec}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={active ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.4, ease }}
            className="rounded border border-slate-200 px-2 py-1.5"
          >
            <p className="font-mono text-[0.5rem] text-slate-400">AOP858</p>
            <p className="flex items-center gap-1 text-[0.56rem] font-semibold text-[#17924a]">
              <Check className="h-2.5 w-2.5" /> 58 compatible vehicles
            </p>
          </motion.div>
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={active ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.55, ease }}
            className="rounded bg-primary py-1.5 text-[0.56rem] font-bold text-white"
          >
            Check Market Prices →
          </motion.button>
          <div className="flex flex-1 flex-col overflow-hidden rounded border border-slate-200 bg-slate-50/60 p-1.5">
            <p className="mb-1 text-[0.5rem] font-bold tracking-wide text-slate-400">K NUMBERS</p>
            <div className="flex flex-wrap gap-x-1 gap-y-0.5 overflow-hidden leading-tight">
              {kNumbers.map((k, i) => (
                <motion.span
                  key={k}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={active ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.25, delay: 0.8 + i * 0.06, ease }}
                  className="font-mono text-[0.5rem] text-navy"
                >
                  {k},
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PanelShell>
  );
}

const listingRows = [
  { type: "Oil Pump", k: "2698, 4144 +172", oem: "21350-2A700", date: "20 Jun 2026" },
  { type: "Oil Pump", k: "25005, 58769 +7", oem: "184459482, 967419938…", date: "20 Jun 2026" },
  { type: "Oil Pump", k: "32113, 32114 +15", oem: "11418518405", date: "20 Jun 2026" },
  { type: "Oil Pump", k: "—", oem: "C2Z28368, DW936600…", date: "20 Jun 2026" },
  { type: "Camshaft", k: "—", oem: "0801.GK, 12715-85E00…", date: "18 May 2026" },
];

export function StepExportAnim({ active }) {
  const [checked, setChecked] = useState([]);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    if (!active) return;
    setChecked([]);
    setExported(false);
    const timers = [];
    [0, 1, 2, 3].forEach((row, i) => {
      timers.push(setTimeout(() => setChecked((c) => [...c, row]), 500 + i * 420));
    });
    timers.push(setTimeout(() => setExported(true), 500 + 4 * 420 + 500));
    return () => timers.forEach(clearTimeout);
  }, [active]);

  const count = checked.length;

  return (
    <PanelShell url="partlister.app/listings" h={380}>
      <div className="flex h-full flex-col text-navy">
        <div className="flex flex-wrap items-center justify-end gap-1.5 border-b border-slate-100 pb-2">
          <span className="rounded-full border border-[#17924a]/40 bg-[#17924a]/5 px-2 py-1 text-[0.56rem] font-semibold text-[#17924a]">
            ✓ Mark Exported ({count})
          </span>
          <span className="rounded-full border border-red-300 bg-red-50 px-2 py-1 text-[0.56rem] font-semibold text-red-500">
            × Delete {count} selected
          </span>
          <motion.span
            animate={exported ? { scale: [1, 0.94, 1], boxShadow: "0 0 0 4px rgba(23,146,74,0.18)" } : { scale: 1 }}
            transition={{ duration: 0.4, ease }}
            className={`rounded-full px-2.5 py-1 text-[0.56rem] font-bold text-white transition-colors ${count > 0 ? "bg-[#17924a]" : "bg-[#17924a]/40"}`}
          >
            ↓ Export CSV ({count} selected)
          </motion.span>
        </div>

        <div className="mt-2 flex items-center bg-slate-50 text-[0.5rem] font-bold uppercase tracking-wide text-slate-400">
          <span className="w-6 py-1 text-center">✓</span>
          <span className="w-14 px-1 py-1">Type</span>
          <span className="flex-1 px-1 py-1">K Numbers</span>
          <span className="flex-1 px-1 py-1">OEM Numbers</span>
          <span className="w-16 px-1 py-1">Status</span>
        </div>

        <div className="flex flex-col overflow-hidden">
          {listingRows.map((r, i) => {
            const isChecked = checked.includes(i);
            return (
              <div
                key={i}
                className={`flex items-center border-b border-slate-100 text-[0.52rem] transition-colors ${isChecked ? "bg-primary/5" : "even:bg-slate-50/60"}`}
              >
                <span className="flex w-6 justify-center py-1.5">
                  <span className={`flex h-3 w-3 items-center justify-center rounded-[3px] border transition-all ${isChecked ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"}`}>
                    {isChecked && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2, ease }}>
                        <Check className="h-2 w-2" strokeWidth={4} />
                      </motion.span>
                    )}
                  </span>
                </span>
                <span className="w-14 px-1 py-1.5 font-medium">{r.type}</span>
                <span className="flex-1 truncate px-1 py-1.5 font-mono text-slate-500">{r.k}</span>
                <span className="flex-1 truncate px-1 py-1.5 font-mono text-slate-500">{r.oem}</span>
                <span className="w-16 px-1 py-1.5">
                  <span className="rounded bg-[#17924a]/10 px-1 py-0.5 text-[0.48rem] font-bold text-[#17924a]">Exported</span>
                </span>
              </div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={exported ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.4, ease }}
          className="mt-auto flex items-center justify-center gap-1 pt-2 text-[0.62rem] font-semibold text-[#17924a]"
        >
          <Check className="h-3 w-3" /> 4 listings exported to CSV
        </motion.div>
      </div>
    </PanelShell>
  );
}

export function AnimatedStep({ index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <div ref={ref} className="h-full">
      {index === 0 && <StepInputAnim active={inView} />}
      {index === 1 && <StepDataAnim active={inView} />}
      {index === 2 && <StepExportAnim active={inView} />}
    </div>
  );
}
