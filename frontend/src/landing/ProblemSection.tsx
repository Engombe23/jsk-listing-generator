import { useEffect, useRef, useState } from "react";

const TEXT = "#132A46";
const MUTED = "#4d6a8a";
const DIM = "#7a96b0";
const ACCENT = "#135DFF";
const BORDER = "#dde7f5";
const BG = "#ffffff";

const ROWS = [
  {
    label: "OE Number",
    ebayLabel: "OE Number",
    value: "LR073640, JDE36769",
    color: "#135DFF", bg: "#eef3ff",
    iconPath: <><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></>,
  },
  {
    label: "Cross References",
    ebayLabel: "Cross References",
    value: "AJUSA 10237.00, ELRING 207.140",
    color: "#0891b2", bg: "#ecfeff",
    iconPath: <><polyline points="16 3 21 3 21 8"/><polyline points="8 21 3 21 3 16"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></>,
  },
  {
    label: "Compatibility table",
    ebayLabel: "Compatibility table",
    value: "Jaguar XE 2015–2021\nJaguar XF 2015–2021",
    color: "#16a34a", bg: "#f0fdf4",
    iconPath: <><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
  },
  {
    label: "Item specifics",
    ebayLabel: "Item specifics",
    value: "Bore: 84mm, Holes: 3",
    color: "#7c3aed", bg: "#f5f3ff",
    iconPath: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
  },
  {
    label: "K-Type Numbers",
    ebayLabel: "K-Type Numbers",
    value: "107640, 115141, 117411, 124200, 126259, 141940, 142747",
    color: "#c2410c", bg: "#fff7ed",
    iconPath: <><path d="M4 4h16v2H4z"/><path d="M4 10h10"/><path d="M4 16h7"/><path d="M14 12l4 4-4 4"/></>,
  },
];

function CopyPasteAnim() {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"idle"|"copying"|"pasting"|"done">("idle");
  const [filled, setFilled] = useState<boolean[]>([false, false, false, false, false]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function tick(s: number, ph: "idle"|"copying"|"pasting"|"done") {
      timerRef.current = setTimeout(() => {
        if (ph === "idle") {
          setPhase("copying"); tick(s, "copying");
        } else if (ph === "copying") {
          setPhase("pasting"); tick(s, "pasting");
        } else if (ph === "pasting") {
          setFilled(prev => { const n = [...prev]; n[s] = true; return n; });
          setPhase("done");
          const next = s + 1;
          if (next < ROWS.length) {
            timerRef.current = setTimeout(() => { setStep(next); setPhase("idle"); tick(next, "idle"); }, 500);
          } else {
            timerRef.current = setTimeout(() => { setStep(0); setPhase("idle"); setFilled([false,false,false,false,false]); tick(0,"idle"); }, 1400);
          }
        }
      }, ph === "idle" ? 600 : ph === "copying" ? 750 : 650);
    }
    tick(0, "idle");
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // Shared cell content renderer
  function CellContent({ row, filled: isFilledCell }: { row: typeof ROWS[0], filled: boolean }) {
    const isCompat = row.label === "Compatibility table";
    const labelColor = isFilledCell ? row.color : TEXT;
    const valueColor = isFilledCell ? row.color : DIM;
    return (
      <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
        <div style={{
          width:30, height:30, borderRadius:8, flexShrink:0,
          background: isFilledCell ? row.bg : "#eef2f7",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke={isFilledCell ? row.color : "#b0bec5"} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            {row.iconPath}
          </svg>
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:800, color:labelColor, lineHeight:1.25 }}>{row.label}</div>
          {isCompat ? (
            <div style={{ marginTop:3 }}>
              <div style={{ display:"grid", gridTemplateColumns:"auto auto auto auto auto", gap:"1px 5px", fontSize:8, color:valueColor, fontWeight:500, opacity: isFilledCell ? 1 : 0.6 }}>
                <span style={{fontWeight:700}}>Model</span><span style={{fontWeight:700}}>Years</span><span style={{fontWeight:700}}>kW</span><span style={{fontWeight:700}}>HP</span><span style={{fontWeight:700}}>CC</span>
                <span>Jaguar XE</span><span>2015–21</span><span>132</span><span>180</span><span>1999</span>
                <span>Jaguar XF</span><span>2015–21</span><span>132</span><span>180</span><span>1999</span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize:9.5, fontWeight:500, color:valueColor, marginTop:2, opacity: isFilledCell ? 1 : 0.7 }}>{row.value}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <style>{`
        @keyframes pl-pop-in {
          0%   { transform: scale(0.75); opacity: 0; }
          75%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes pl-copy-bounce {
          0%,100% { transform: translate(-50%,-100%) translateY(-5px); }
          45%     { transform: translate(-50%,-100%) translateY(-11px); }
        }
        .pl-pop  { animation: pl-pop-in 0.4s cubic-bezier(.34,1.56,.64,1) forwards; }
        .pl-copy { animation: pl-copy-bounce 0.55s ease; }
      `}</style>

      {/* Column headers — use same grid as rows */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 52px 1fr", marginBottom:6 }}>
        <div style={{ textAlign:"center" }}>
          <span style={{ fontSize:9, fontWeight:800, color:DIM, letterSpacing:"0.08em", textTransform:"uppercase" }}>Source Data</span>
        </div>
        <div />
        <div style={{ textAlign:"center" }}>
          <span style={{ fontSize:9, fontWeight:800, color:DIM, letterSpacing:"0.08em", textTransform:"uppercase" }}>eBay Listing</span>
        </div>
      </div>

      {/* Rows — CSS grid so left/right columns are always identical width */}
      {ROWS.map((row, i) => {
        const isActive = step === i;
        const isFilled = filled[i];
        const isCopying = isActive && phase === "copying";
        const isPasting = isActive && phase === "pasting";
        const showValue = isFilled || isPasting;

        return (
          <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 52px 1fr", alignItems:"stretch", marginBottom:8 }}>

            {/* LEFT */}
            <div style={{
              background:"#f8fafc",
              border:`1.5px solid ${isActive ? row.color : BORDER}`,
              borderRadius:10, padding:"10px 10px",
              transition:"border-color 0.3s",
            }}>
              <CellContent row={row} filled={false} />
            </div>

            {/* MIDDLE connector */}
            <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {/* dashed line full width */}
              <div style={{
                position:"absolute", left:0, right:0, top:"50%", marginTop:-1, height:2,
                background:`repeating-linear-gradient(90deg,${isActive ? row.color : BORDER} 0,${isActive ? row.color : BORDER} 5px,transparent 5px,transparent 9px)`,
                transition:"background 0.3s",
              }}/>
              {/* copy icon above line */}
              <div className={isCopying ? "pl-copy" : ""} style={{
                position:"absolute", left:"50%", top:"50%",
                transform:"translate(-50%,-100%) translateY(-5px)",
                zIndex:2, background:"white", borderRadius:4, padding:"1px 2px",
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke={isActive ? row.color : DIM} strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
              </div>
            </div>

            {/* RIGHT — blank until filled */}
            <div style={{
              background: showValue ? row.bg : "#f8fafc",
              border:`1.5px solid ${showValue ? row.color : BORDER}`,
              borderRadius:10, padding:"10px 10px",
              transition:"border-color 0.3s, background 0.3s",
            }}>
              {showValue ? (
                <div className={isPasting && !isFilled ? "pl-pop" : ""}>
                  <CellContent row={row} filled={true} />
                </div>
              ) : (
                /* invisible clone to hold the height — box looks empty */
                <div style={{ opacity:0, pointerEvents:"none" }}>
                  <CellContent row={row} filled={false} />
                </div>
              )}
            </div>

          </div>
        );
      })}

      <div style={{ marginTop:8, textAlign:"center" }}>
        <span style={{ fontSize:10, color:"#dc2626", fontWeight:700, display:"inline-flex", alignItems:"center", gap:5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Copied field-by-field for every listing
        </span>
      </div>
    </div>
  );
}


const problems = [
  {
    num: 1,
    label: "Manual Workflow",
    desc: "Copying OE numbers, compatibility data, item specifics and listing fields by hand slows down every listing.",
    visual: <CopyPasteAnim />,
  },
  {
    num: 2,
    label: "Inconsistent Listings",
    desc: "Missing item specifics, engine codes, OE numbers and fitment details can hurt search visibility and buyer trust.",
    visual: (
      <div style={{ marginTop: 20, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px" }}>
        <div style={{ fontSize: 10.5, color: DIM, fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 600, marginBottom: 10 }}>Item specifics</div>
        {[
          { field: "Reference OE/OEM Number",      ok: false },
          { field: "Interchangeable Part Numbers", ok: false },
          { field: "Engine Codes",                 ok: false },
          { field: "Bore Diameter",                ok: false },
          { field: "Pin Diameter",                 ok: false },
          { field: "Length",                       ok: false },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", borderBottom: i < 5 ? `1px solid ${BORDER}` : "none" }}>
            <span style={{ fontSize: 10.5, color: MUTED, fontFamily: "Plus Jakarta Sans, sans-serif" }}>{r.field}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: r.ok ? "#dcfce7" : "#fee2e2", border: `1px solid ${r.ok ? "#86efac" : "#fca5a5"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {r.ok
                  ? <svg width="8" height="8" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                  : <svg width="8" height="8" viewBox="0 0 10 10"><path d="M3 3l4 4M7 3l-4 4" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/></svg>
                }
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: r.ok ? "#16a34a" : "#dc2626", fontFamily: "Plus Jakarta Sans, sans-serif" }}>{r.ok ? "Present" : "Missing"}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: 3,
    label: "Guessing Prices",
    desc: "Price too low and you lose margin. Price too high and the part can sit unsold for weeks.",
    visual: (
      <div style={{ marginTop: 20, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px" }}>
        <div style={{ fontSize: 10.5, color: DIM, fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 600, marginBottom: 10 }}>Market range for this part</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 44, marginBottom: 8 }}>
          {[50, 70, 90, 100, 85, 60, 75].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 4 ? "#fee2e2" : i === 2 ? ACCENT : BORDER, borderRadius: "3px 3px 0 0", opacity: i === 2 ? 0.7 : 1 }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: DIM, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
          <span>£180</span>
          <span style={{ color: "#dc2626", fontWeight: 700 }}>Your guess: £310?</span>
          <span>£340</span>
        </div>
      </div>
    ),
  },
];

export default function ProblemSection() {
  return (
    <section className="lp-section" style={{ background: BG, padding: "100px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "5px 14px", marginBottom: 22 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: ACCENT, letterSpacing: "0.06em", textTransform: "uppercase" }}>The Problem</span>
          </div>

          <h2 style={{ fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 800, color: TEXT, margin: "0 0 18px", lineHeight: 1.15, letterSpacing: "-1px" }}>
            Building car parts listings<br />
            is still <span style={{ color: ACCENT }}>too manual</span>
          </h2>

          <p style={{ fontSize: 16, color: MUTED, maxWidth: 500, margin: "0 auto", lineHeight: 1.65 }}>
            Most sellers spend too much time on data entry, formatting and guessing — for every single part.
          </p>
        </div>

        {/* Cards */}
        <div className="problem-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {problems.map((p) => (
            <div key={p.num} style={{
              background: "#fff",
              border: `1px solid ${BORDER}`,
              borderRadius: 18,
              padding: "28px 28px 24px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 4px 24px rgba(19,45,70,0.06)",
            }}>
              {/* Number badge */}
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${ACCENT}, #0040cc)`,
                color: "#fff", fontWeight: 800, fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 18,
                boxShadow: "0 4px 12px rgba(19,93,255,0.30)",
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}>
                {p.num}
              </div>

              {/* Title */}
              <div style={{ fontSize: 17, fontWeight: 800, color: TEXT, marginBottom: 10, lineHeight: 1.2, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                {p.label}
              </div>

              {/* Body */}
              <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.65, margin: 0, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                {p.desc}
              </p>

              {/* Visual */}
              {p.visual}
            </div>
          ))}
        </div>

        {/* Bridge */}
        <div style={{ textAlign: "center", marginTop: 56 }}>
          <div className="hiw-bridge" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 28px", boxShadow: "0 2px 12px rgba(19,45,70,0.06)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
            <span className="hiw-bridge-text" style={{ fontSize: 14, fontWeight: 600, color: TEXT, fontFamily: "Plus Jakarta Sans, sans-serif" }}>PartLister automates all of this — part number in, ready-to-list out.</span>
          </div>
        </div>

      </div>
    </section>
  );
}
