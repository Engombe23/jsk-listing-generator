import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { trackEvent } from "../lib/analytics";

const T  = "#0d1f35";
const M  = "#3d5a7a";
const D  = "#7a96b0";
const A  = "#135DFF";
const AL = "#EEF5FF";
const B  = "#dde7f5";
const G  = "#22c55e";

/* ── GLOBAL STYLES ─────────────────────── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
  @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse-dot{ 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)} 50%{box-shadow:0 0 0 5px rgba(34,197,94,0)} }
  @keyframes shimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  * { box-sizing: border-box; }
  .carousel-track::-webkit-scrollbar { display: none; }
  .carousel-track { -ms-overflow-style: none; scrollbar-width: none; }
  .hero-listing-gradient {
    background: linear-gradient(90deg, #135DFF 0%, #6366f1 40%, #135DFF 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }
  .badge-live-dot {
    animation: pulse-dot 2s ease-in-out infinite;
  }
  .hero-panel-float {
    animation: float 6s ease-in-out infinite;
  }
`;

/* ── GASKET IMAGE ──────────────────────── */
function GasketImg({ size = 88 }: { size?: number }) {
  const w = size, h = Math.round(size * 0.64);
  return (
    <img
      src="/gasket-photo.png"
      alt="Head gasket"
      style={{
        width: w, height: h, borderRadius: 10, flexShrink: 0,
        objectFit: "cover",
        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
      }}
    />
  );
}

/* ── TAG ───────────────────────────────── */
function Tag({ label, scheme }: { label: string; scheme: "oe"|"ix"|"k" }) {
  const s = {
    oe: { c:"#3730a3", bg:"#eef2ff", b:"#c7d2fe" },
    ix: { c:"#9a3412", bg:"#fff7ed", b:"#fed7aa" },
    k:  { c:"#166534", bg:"#f0fdf4", b:"#bbf7d0" },
  }[scheme];
  return (
    <span style={{
      fontFamily:"'Courier New',monospace", fontSize:9.5, fontWeight:700,
      padding:"2.5px 8px", borderRadius:5,
      background:s.bg, color:s.c, border:`1px solid ${s.b}`,
      display:"inline-block", whiteSpace:"nowrap",
    }}>{label}</span>
  );
}

/* ── TYPEWRITER ────────────────────────── */
function TypeWriter({ text, delay = 600 }: { text: string; delay?: number }) {
  const [shown, setShown] = useState(text);
  const [done, setDone]   = useState(true);
  const pos = useRef(text.length);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t = setTimeout(() => {
      pos.current = 0; setShown(""); setDone(false);
    }, delay);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (done || pos.current >= text.length) return;
    const t = setTimeout(() => {
      pos.current++;
      setShown(text.slice(0, pos.current));
      if (pos.current >= text.length) setDone(true);
    }, 100);
    return () => clearTimeout(t);
  }, [shown, done]);
  return (
    <span style={{ fontFamily:"'Courier New',monospace", fontWeight:900, fontSize:15, color:T, letterSpacing:"0.05em" }}>
      {shown}
      {!done && <span style={{ display:"inline-block",width:2,height:14,background:A,borderRadius:1,marginLeft:2,verticalAlign:"middle",animation:"blink 0.9s step-end infinite" }}/>}
    </span>
  );
}

/* ═══════════════════════════════════════
   CARD A — AI Title Generation (left, behind)
═══════════════════════════════════════ */
function CardAITitle() {
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      {/* dashed arrow from left (listing card) */}
      <svg width="32" height="60" viewBox="0 0 32 60" fill="none"
        style={{ position:"absolute", left:-30, top:"30%", pointerEvents:"none" }}>
        <path d="M28 4 C28 4 4 4 4 30 C4 56 28 56 28 56"
          stroke={A} strokeWidth="1.5" strokeDasharray="4 3" fill="none"
          strokeLinecap="round"/>
        <path d="M24 52 L28 56 L24 60" stroke={A} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>

      <div style={{
        width: 220,
        background:"#fff",
        border:`1px solid ${B}`,
        borderRadius:16,
        boxShadow:"0 8px 32px rgba(19,45,70,0.10)",
        padding:"16px",
        fontFamily:"Plus Jakarta Sans,sans-serif",
        overflow:"hidden",
      }}>
        {/* header */}
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:14 }}>
          <div style={{
            width:30, height:30, borderRadius:9, flexShrink:0,
            background:"linear-gradient(135deg,#7c3aed,#4f46e5)",
            boxShadow:"0 3px 12px rgba(124,58,237,0.38)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1 L8.3 5.3 L13 7 L8.3 8.7 L7 13 L5.7 8.7 L1 7 L5.7 5.3 Z" fill="rgba(255,255,255,0.92)"/>
              <circle cx="11.5" cy="2.5" r="1.3" fill="rgba(255,255,255,0.7)"/>
              <circle cx="2.5" cy="11.5" r="0.9" fill="rgba(255,255,255,0.5)"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:800, color:"#5b21b6", lineHeight:1.2 }}>AI Title</div>
            <div style={{ fontSize:8.5, fontWeight:600, color:"#8b5cf6" }}>eBay optimised</div>
          </div>
        </div>

        {/* title text */}
        <div style={{
          background:"linear-gradient(135deg,#faf8ff,#f5f3ff)", border:`1px solid #e0d9ff`, borderRadius:10, padding:"10px 11px",
        }}>
          <div style={{ fontSize:11.5, fontWeight:800, color:T, lineHeight:1.6, marginBottom:10 }}>
            Head Gasket for 204DTD 204DTA Land Rover Defender Discovery Sport Evoque 2014-
          </div>
          {/* character count bar */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontSize:8.5, fontWeight:700, color:D }}>Characters</span>
            <span style={{ fontSize:9, fontWeight:900, color:"#5b21b6" }}>78 / 80</span>
          </div>
          <div style={{ height:5, background:"#ede9fe", borderRadius:99, overflow:"hidden" }}>
            <div style={{ width:"97.5%", height:"100%", background:"linear-gradient(to right,#6366f1,#8b5cf6)", borderRadius:99 }}/>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   CARD B — Main Listing (center, hero)
═══════════════════════════════════════ */
function CardMainListing() {
  return (
    <div style={{
      width: 490, flexShrink:0,
      background:"#fff",
      border:`2px solid rgba(19,93,255,0.28)`,
      borderRadius:24,
      boxShadow:"0 0 0 1px rgba(19,93,255,0.18), 0 0 0 6px rgba(19,93,255,0.08), 0 0 30px rgba(19,93,255,0.28), 0 0 80px rgba(19,93,255,0.18), 0 0 140px rgba(19,93,255,0.12), 0 0 220px rgba(19,93,255,0.08), 0 32px 80px rgba(19,45,70,0.18)",
      overflow:"hidden",
      fontFamily:"Plus Jakarta Sans,sans-serif",
      position:"relative",
      zIndex:2,
    }}>
      {/* top accent bar — thicker, more vivid */}
      <div style={{ height:4, background:`linear-gradient(to right,transparent,${A} 20%,#6366f1 80%,transparent)` }}/>

      {/* ── HEADER: gasket + title ── */}
      <div style={{ padding:"18px 20px 16px", borderBottom:`1px solid ${B}`, display:"flex", alignItems:"flex-start", gap:14 }}>
        {/* image with depth: glow behind it */}
        <div style={{ position:"relative", flexShrink:0 }}>
          <div style={{
            position:"absolute", inset:-8,
            borderRadius:16,
            background:"radial-gradient(ellipse at center, rgba(19,93,255,0.13) 0%, transparent 70%)",
          }}/>
          <GasketImg size={138}/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:900, color:T, lineHeight:1.35, marginBottom:8 }}>
            Gasket Cylinder Head — Jaguar XE XF<br/>
            2.0 204DTD 2015–2021
          </div>
        </div>
      </div>

      {/* ── DATA BODY ── */}
      <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:13 }}>

        {/* OE numbers */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
            <div style={{ width:3, height:11, borderRadius:99, background:"#4338ca", flexShrink:0 }}/>
            <span style={{ fontSize:8.5, fontWeight:800, color:D, textTransform:"uppercase", letterSpacing:".13em" }}>OE Numbers</span>
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            <Tag label="G4D3601ACA" scheme="oe"/>
            <Tag label="JDE36769" scheme="oe"/>
            <Tag label="LR073640" scheme="oe"/>
          </div>
        </div>

        {/* Interchangeable */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
            <div style={{ width:3, height:11, borderRadius:99, background:"#c2410c", flexShrink:0 }}/>
            <span style={{ fontSize:8.5, fontWeight:800, color:D, textTransform:"uppercase", letterSpacing:".13em" }}>Interchangeable Numbers</span>
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            <Tag label="AJUSA 1023720" scheme="ix"/>
            <Tag label="BGA CH4205A" scheme="ix"/>
            <Tag label="ELRING 207.148" scheme="ix"/>
            <Tag label="FAI HG2335" scheme="ix"/>
          </div>
        </div>

        {/* K numbers */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
            <div style={{ width:3, height:11, borderRadius:99, background:"#166534", flexShrink:0 }}/>
            <span style={{ fontSize:8.5, fontWeight:800, color:D, textTransform:"uppercase", letterSpacing:".13em" }}>K Numbers</span>
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            <Tag label="107640" scheme="k"/>
            <Tag label="115141" scheme="k"/>
            <Tag label="117411" scheme="k"/>
            <Tag label="124200" scheme="k"/>
            <Tag label="126259" scheme="k"/>
            <Tag label="141940" scheme="k"/>
            <Tag label="142747" scheme="k"/>
            <span style={{ fontSize:9, fontWeight:600, color:D, alignSelf:"center" }}>& more</span>
          </div>
        </div>

        {/* compatible vehicles */}
        <div style={{
          background:"linear-gradient(135deg,#eef4ff,#dceaff)",
          border:"1.5px solid rgba(19,93,255,0.18)",
          borderRadius:12, padding:"11px 13px",
          display:"flex", alignItems:"center", gap:10,
          boxShadow:"0 3px 12px rgba(19,93,255,0.09)",
        }}>
          <div style={{ width:40,height:40,borderRadius:11,flexShrink:0,background:`linear-gradient(135deg,${A},#0040cc)`,border:"none",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px rgba(19,93,255,0.40)" }}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
              {/* car icon */}
              <path d="M4 15L6 9h12l2 6" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="2" y="15" width="20" height="5" rx="2" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5"/>
              <circle cx="7" cy="20" r="2" fill="rgba(255,255,255,0.9)"/>
              <circle cx="17" cy="20" r="2" fill="rgba(255,255,255,0.9)"/>
              <path d="M8 9L9.5 6h5L16 9" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:900, color:T, lineHeight:1, marginBottom:4 }}>75 compatible vehicles</div>
            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
              {[
                "LAND ROVER DEFENDER (L663) · 2019–",
                "LAND ROVER DISCOVERY SPORT (L550) · 2014–",
                "LAND ROVER RANGE ROVER EVOQUE (L551) · 2018–",
                "JAGUAR E-PACE (X540) · 2017–",
                "JAGUAR F-PACE (X761) · 2015–",
              ].map((v,i) => (
                <div key={i} style={{ fontSize:8.5, fontWeight:600, color:M }}>{v}</div>
              ))}
              <div style={{ fontSize:8.5, fontWeight:700, color:D }}>& 11 more models…</div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3l5 5-5 5" stroke={A} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* action buttons */}
        <div style={{ display:"flex", gap:7 }}>
          {[
            { label:"Copy Desc HTML",     bg:"#4338ca", shadow:"rgba(67,56,202,0.28)" },
            { label:"Export Listing CSV", bg:"#059669", shadow:"rgba(5,150,105,0.26)" },
            { label:"Saved Listings",     bg:M,         shadow:"rgba(61,90,122,0.22)" },
          ].map((btn,i)=>(
            <div key={i} style={{
              flex:1, textAlign:"center", padding:"11px 5px",
              background:btn.bg, borderRadius:10, cursor:"pointer",
              fontSize:9.5, fontWeight:800, color:"#fff",
              boxShadow:`0 4px 14px ${btn.shadow}`,
              display:"flex", alignItems:"center", justifyContent:"center", gap:5,
            }}>
              {i===0 && <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><rect x="1" y="4" width="9" height="9" rx="2" stroke="#fff" strokeWidth="1.3"/><path d="M4 4V2.5A1.5 1.5 0 0 1 5.5 1h5A1.5 1.5 0 0 1 12 2.5V8a1.5 1.5 0 0 1-1.5 1.5H9" stroke="#fff" strokeWidth="1.3"/></svg>}
              {i===1 && <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M7 2v8M4 7l3 3 3-3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 11h10" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/></svg>}
              {i===2 && <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="9" rx="2" stroke="#fff" strokeWidth="1.3"/><path d="M1 6h12" stroke="#fff" strokeWidth="1.3"/></svg>}
              {btn.label}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   CARD C — Compatibility / Fitment (right, partial)
═══════════════════════════════════════ */
function CardFitment() {
  const matches = [
    { source:"K Number", ref:"K107640",    label:"Article Number" },
  ];
  return (
    <div style={{
      width: 220, flexShrink:0,
      background:"#fff",
      border:`1px solid ${B}`,
      borderRadius:16,
      boxShadow:"0 8px 32px rgba(19,45,70,0.09)",
      padding:"16px",
      fontFamily:"Plus Jakarta Sans,sans-serif",
      overflow:"hidden",
    }}>
      {/* header */}
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:14 }}>
        <div style={{ width:30,height:30,borderRadius:9,flexShrink:0,background:`linear-gradient(135deg,${A},#0040cc)`,boxShadow:"0 3px 12px rgba(19,93,255,0.38)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="rgba(255,255,255,0.9)" strokeWidth="1.7"/>
            <path d="M13 13l4 4" stroke="rgba(255,255,255,0.9)" strokeWidth="1.7" strokeLinecap="round"/>
            <circle cx="8.5" cy="8.5" r="2.5" fill="rgba(255,255,255,0.4)"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:800, color:T, lineHeight:1.2 }}>OEM Part Search</div>
          <div style={{ fontSize:8.5, fontWeight:600, color:D }}>TecDoc cross-reference</div>
        </div>
      </div>

      {/* search box */}
      <div style={{
        display:"flex", alignItems:"center", gap:6,
        background:"#f8faff", border:`1.5px solid ${A}`, borderRadius:10,
        padding:"7px 10px", marginBottom:12,
        boxShadow:`0 0 0 3px rgba(19,93,255,0.08)`,
      }}>
        <svg width="11" height="11" viewBox="0 0 20 20" fill="none" style={{ flexShrink:0 }}>
          <circle cx="8.5" cy="8.5" r="5.5" stroke={A} strokeWidth="1.8"/>
          <path d="M13 13l4 4" stroke={A} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize:11, fontWeight:700, color:T, letterSpacing:0.3 }}>LR033345</span>
        <div style={{ marginLeft:"auto", width:7,height:14,borderLeft:`2px solid ${A}`,animation:"blink 1s step-end infinite" }}/>
      </div>



      {/* match rows */}
      <div style={{ display:"flex", flexDirection:"column", gap:1, marginBottom:14 }}>
        {matches.map(({ ref, label }, i) => (
          <div key={i} style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"6px 8px", borderRadius:8, background:"#f8faff",
          }}>
            <span style={{ fontSize:8.5, fontWeight:700, color:D }}>{label}</span>
            <span style={{
              fontSize:9.5, fontWeight:800, color:"#166534",
              background:"#f0fdf4", padding:"2px 7px", borderRadius:99,
              border:"1px solid #bbf7d0",
            }}>{ref}</span>
          </div>
        ))}
      </div>

      {/* fitment summary */}
      <div style={{
        background:"linear-gradient(135deg,#eef4ff,#dceaff)", borderRadius:10,
        border:`1px solid rgba(19,93,255,0.14)`, padding:"10px 12px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div>
          <div style={{ fontSize:8.5, fontWeight:700, color:M, marginBottom:2 }}>Fitment matched</div>
          <div style={{ fontSize:9, fontWeight:700, color:T }}>Jaguar XE / XF · 2015–2021</div>
        </div>
        <div style={{ fontSize:28, fontWeight:900, color:A, lineHeight:1 }}>75</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   CARD D — Compatibility Preview
═══════════════════════════════════════ */
function CardCompat() {
  const rows = [
    { vehicle:"Jaguar XE",              years:"2015–2021", kw:120, hp:163, cc:1999, eng:"204DTD"  },
    { vehicle:"Jaguar XF",              years:"2015–2021", kw:132, hp:180, cc:1999, eng:"204DTD"  },
    { vehicle:"Land Rover Disc. Sport", years:"2014–",     kw:132, hp:180, cc:1999, eng:"204DTD"  },
  ];
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      {/* dashed arrow from left (compat vehicles row) */}
      <svg width="32" height="60" viewBox="0 0 32 60" fill="none"
        style={{ position:"absolute", left:-30, top:"30%", pointerEvents:"none" }}>
        <path d="M28 4 C28 4 4 4 4 30 C4 56 28 56 28 56"
          stroke={A} strokeWidth="1.5" strokeDasharray="4 3" fill="none" strokeLinecap="round"/>
        <path d="M24 52 L28 56 L24 60" stroke={A} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>

      <div style={{
        width:260, flexShrink:0,
        background:"#fff",
        border:`1px solid ${B}`,
        borderRadius:16,
        boxShadow:"0 8px 32px rgba(19,45,70,0.09)",
        padding:"16px",
        fontFamily:"Plus Jakarta Sans,sans-serif",
        overflow:"hidden",
      }}>
        {/* header */}
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:14 }}>
          <div style={{ width:28,height:28,borderRadius:8,flexShrink:0,background:AL,border:`1px solid ${B}`,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="8" width="18" height="10" rx="3" stroke={A} strokeWidth="1.4"/>
              <path d="M5 8V6a6 6 0 0 1 12 0v2" stroke={A} strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="8" cy="13" r="1.5" fill={A}/><circle cx="14" cy="13" r="1.5" fill={A}/>
            </svg>
          </div>
          <span style={{ fontSize:11, fontWeight:800, color:T }}>Compatibility Preview</span>
        </div>

        {/* table header */}
        <div style={{
          display:"grid", gridTemplateColumns:"1fr 58px 28px 28px 36px 52px",
          gap:4, padding:"5px 6px", marginBottom:3,
          borderBottom:`1px solid ${B}`,
        }}>
          {["Vehicle","Years","kW","HP","CC","Engine"].map((h,i)=>(
            <span key={i} style={{ fontSize:7.5, fontWeight:800, color:D, textTransform:"uppercase", letterSpacing:".08em" }}>{h}</span>
          ))}
        </div>

        {/* table rows */}
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {rows.map((r,i)=>(
            <div key={i} style={{
              display:"grid", gridTemplateColumns:"1fr 58px 28px 28px 36px 52px",
              gap:4, padding:"7px 6px",
              borderBottom: i < rows.length-1 ? `1px solid ${B}` : "none",
              background: i===0 ? "#f8faff" : "transparent",
              borderRadius: i===0 ? 6 : 0,
            }}>
              <span style={{ fontSize:8.5, fontWeight:700, color:T }}>{r.vehicle}</span>
              <span style={{ fontSize:8.5, fontWeight:600, color:M }}>{r.years}</span>
              <span style={{ fontSize:8.5, fontWeight:600, color:M }}>{r.kw}</span>
              <span style={{ fontSize:8.5, fontWeight:600, color:M }}>{r.hp}</span>
              <span style={{ fontSize:8.5, fontWeight:600, color:M }}>{r.cc}</span>
              <span style={{ fontSize:8.5, fontWeight:700, color:T }}>{r.eng}</span>
            </div>
          ))}
        </div>

        {/* more + view all */}
        <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${B}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:8.5, fontWeight:600, color:D }}>& 72 more vehicles</span>
          <span style={{ fontSize:8.5, fontWeight:800, color:A, cursor:"pointer", display:"flex", alignItems:"center", gap:3 }}>
            View all 75 vehicles
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3 2l4 3-4 3" stroke={A} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   CARD E — Export History (far right, partial)
═══════════════════════════════════════ */
function CardExportHistory() {
  const exports = [
    { time:"Today, 10:24 AM", make:"Jaguar XF 2.0 204DTD", year:"2020",    csv:true },
    { time:"Yesterday, 6:10 PM", make:"BMW 3 Series E90 320d", year:"",    csv:true },
    { time:"May 24, 11:07 AM", make:"Audi A4 B8 2.0 TDI",   year:"",      csv:true },
  ];
  return (
    <div style={{
      width: 200, flexShrink:0,
      background:"#fff",
      border:`1px solid ${B}`,
      borderRadius:16,
      boxShadow:"0 8px 32px rgba(19,45,70,0.09)",
      padding:"16px",
      fontFamily:"Plus Jakarta Sans,sans-serif",
    }}>
      {/* header */}
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:14 }}>
        <div style={{ width:30,height:30,borderRadius:9,flexShrink:0,background:"linear-gradient(135deg,#16a34a,#059669)",boxShadow:"0 3px 12px rgba(22,163,74,0.32)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v9" stroke="rgba(255,255,255,0.92)" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M5 8l3 3 3-3" stroke="rgba(255,255,255,0.92)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 13h12" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize:10.5, fontWeight:800, color:T, lineHeight:1.2 }}>Export History</div>
          <div style={{ fontSize:8.5, fontWeight:600, color:D }}>CSV & HTML exports</div>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
        {exports.map((ex, i) => (
          <div key={i} style={{
            background: i===0 ? "#f0fdf4" : "#f8fafc",
            border:`1.5px solid ${i===0?"#86efac":B}`,
            borderRadius:10, padding:"8px 10px",
            display:"flex", alignItems:"center", justifyContent:"space-between",
          }}>
            <div>
              <div style={{ fontSize:7.5, color:D, fontWeight:600, marginBottom:2 }}>{ex.time}</div>
              <div style={{ fontSize:9.5, fontWeight:800, color:T, lineHeight:1.35 }}>
                {ex.make}
                {ex.year && <><br/><span style={{ fontSize:9, fontWeight:600, color:M }}>{ex.year}</span></>}
              </div>
            </div>
            <span style={{
              fontSize:8, fontWeight:900, padding:"2px 7px", borderRadius:5,
              background:i===0?"#dcfce7":AL, color:i===0?"#166534":A,
              border:`1px solid ${i===0?"#86efac":B}`,
            }}>CSV</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop:10, textAlign:"center", fontSize:9, fontWeight:700, color:A, cursor:"pointer" }}>
        View All Exports →
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   CAROUSEL — hover-driven horizontal scroll
═══════════════════════════════════════ */
// Inline dashed arrow connector (horizontal, always centered in its flex row)
function ArrowH() {
  return (
    <div style={{ width:32, flexShrink:0, alignSelf:"center", display:"flex", alignItems:"center" }}>
      <svg width="32" height="14" viewBox="0 0 32 14" fill="none">
        <defs>
          <linearGradient id="arrowGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#135DFF" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.9"/>
          </linearGradient>
        </defs>
        <line x1="0" y1="7" x2="23" y2="7" stroke="url(#arrowGrad)" strokeWidth="1.6" strokeDasharray="4 3" strokeLinecap="round"/>
        <path d="M20 3 l6 4 -6 4" stroke="#6366f1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    </div>
  );
}

function HeroCarousel() {
  return (
    <div style={{
      position:"relative",
      display:"flex",
      alignItems:"flex-start",
      fontFamily:"Plus Jakarta Sans,sans-serif",
    }}>

      {/* ── OEM Search box ── */}
      <div style={{
        width:160, flexShrink:0,
        background:"#fff",
        border:"1px solid #dde7f5",
        borderRadius:16,
        boxShadow:"0 8px 28px rgba(19,45,70,0.09)",
        padding:"16px 14px",
        alignSelf:"center",
        position:"relative",
      }}>
        <div style={{ fontSize:9, fontWeight:800, color:"#7a96b0", textTransform:"uppercase", letterSpacing:".1em", marginBottom:4 }}>Enter OE / OEM</div>
        <div style={{ fontSize:11.5, fontWeight:900, color:"#0d1f35", marginBottom:12 }}>Part Number</div>

        {/* input */}
        <div style={{
          display:"flex", alignItems:"center", gap:6,
          background:"#f8faff", border:"1.5px solid #135DFF", borderRadius:9,
          padding:"7px 10px", marginBottom:10,
          boxShadow:"0 0 0 3px rgba(19,93,255,0.08)",
        }}>
          <span style={{ fontSize:12, fontWeight:700, color:"#0d1f35", flex:1, letterSpacing:0.3 }}>LR073640</span>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="#135DFF" strokeWidth="1.8"/>
            <path d="M13 13l4 4" stroke="#135DFF" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>

        {/* generate button */}
        <div style={{
          width:"100%", padding:"9px 0", borderRadius:9,
          background:"linear-gradient(135deg,#135DFF,#0040cc)",
          textAlign:"center", fontSize:10, fontWeight:800, color:"#fff",
          cursor:"pointer", marginBottom:12,
          boxShadow:"0 4px 14px rgba(19,93,255,0.35)",
        }}>Generate Listing</div>

        {/* status rows */}
        {[
          { label:"TecDoc API",   status:"Connected" },
          { label:"OE Cross-Ref", status:"Matched"   },
          { label:"Compatibility",status:"Fetched"   },
        ].map(({ label, status }, i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"4px 0",
            borderBottom: i < 2 ? "1px solid #dde7f5" : "none",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5.5" fill="#f0fdf4" stroke="#86efac" strokeWidth="1"/>
                <path d="M3.5 6l1.8 1.8 3.2-3.6" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize:8.5, fontWeight:700, color:"#0d1f35" }}>{label}</span>
            </div>
            <span style={{ fontSize:8, fontWeight:700, color:"#166534", background:"#f0fdf4", padding:"1px 6px", borderRadius:99, border:"1px solid #86efac" }}>{status}</span>
          </div>
        ))}


      </div>

      {/* ── Arrow: OEM → Listing ── */}
      <ArrowH/>

      {/* ── Main Listing card ── */}
      <div style={{ position:"relative", flexShrink:0 }}>
        <CardMainListing/>
      </div>

      {/* ── Right column: AI Title + Compat Preview, each with its own inline arrow ── */}
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

        {/* AI Title row: arrow + card */}
        <div style={{ display:"flex", alignItems:"center" }}>
          <ArrowH/>
          <div style={{ width:340,
          background:"#fff",
          border:"1px solid #dde7f5",
          borderRadius:16,
          boxShadow:"0 8px 28px rgba(19,45,70,0.09)",
          padding:"14px",
          overflow:"hidden",
        }}>
          {/* header badge */}
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
            <div style={{
              width:26, height:26, borderRadius:7, flexShrink:0,
              background:"linear-gradient(135deg,#7c3aed,#4f46e5)",
              boxShadow:"0 3px 10px rgba(124,58,237,0.35)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M7 1 L8.2 5.5 L13 7 L8.2 8.5 L7 13 L5.8 8.5 L1 7 L5.8 5.5 Z" fill="rgba(255,255,255,0.9)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
                <circle cx="11.5" cy="2.5" r="1.2" fill="rgba(255,255,255,0.7)"/>
                <circle cx="2.5" cy="11.5" r="0.9" fill="rgba(255,255,255,0.5)"/>
              </svg>
            </div>
            <span style={{ fontSize:10.5, fontWeight:800, color:"#5b21b6" }}>AI Title Generation</span>
          </div>

          {/* title text */}
          <div style={{ fontSize:12, fontWeight:800, color:"#0d1f35", lineHeight:1.55, marginBottom:12 }}>
            Gasket Cylinder Head for<br/>
            Jaguar XE 2.0D 204DTD<br/>
            2015–2021
          </div>

          {/* bar */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontSize:8, fontWeight:700, color:"#7a96b0" }}>Characters</span>
            <span style={{ fontSize:9, fontWeight:900, color:"#5b21b6" }}>78/80</span>
          </div>
          <div style={{ height:5, background:"#ede9fe", borderRadius:99, overflow:"hidden" }}>
            <div style={{ width:"97.5%", height:"100%", background:"linear-gradient(to right,#6366f1,#8b5cf6)", borderRadius:99 }}/>
          </div>
        </div>{/* end AI Title card */}
        </div>{/* end AI Title row */}

        {/* Compat row: arrow + card */}
        <div style={{ display:"flex", alignItems:"center" }}>
          <ArrowH/>
          <div style={{
            width:340,
            background:"#fff",
            border:"1px solid #dde7f5",
            borderRadius:16,
            boxShadow:"0 8px 28px rgba(19,45,70,0.09)",
            padding:"14px 14px 12px",
            overflow:"hidden",
          }}>
            {/* header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:26,height:26,borderRadius:7,flexShrink:0,background:"linear-gradient(135deg,#135DFF,#0040cc)",boxShadow:"0 3px 10px rgba(19,93,255,0.35)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="9" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5"/>
                    <circle cx="11" cy="11" r="5" stroke="rgba(255,255,255,0.65)" strokeWidth="1.2"/>
                    <circle cx="11" cy="11" r="2" fill="rgba(255,255,255,0.9)"/>
                    <line x1="11" y1="2" x2="11" y2="6" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3" strokeLinecap="round"/>
                    <line x1="11" y1="16" x2="11" y2="20" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3" strokeLinecap="round"/>
                    <line x1="2" y1="11" x2="6" y2="11" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3" strokeLinecap="round"/>
                    <line x1="16" y1="11" x2="20" y2="11" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>
                <span style={{ fontSize:11, fontWeight:800, color:"#0d1f35" }}>Compatibility Preview</span>
              </div>
              <div style={{ background:"#EEF5FF", border:"1px solid #dde7f5", borderRadius:99, padding:"2px 8px", fontSize:9, fontWeight:800, color:"#135DFF" }}>
                75 vehicles
              </div>
            </div>

            {/* table header */}
            <div style={{
              display:"grid", gridTemplateColumns:"1.6fr 62px 28px 28px 36px 58px",
              gap:0, padding:"5px 6px 6px",
              background:"#f5f8ff", borderRadius:8, marginBottom:4,
            }}>
              {["Vehicle","Years","kW","HP","CC","Engine"].map((h,i)=>(
                <span key={i} style={{ fontSize:7.5, fontWeight:800, color:"#7a96b0", textTransform:"uppercase", letterSpacing:".06em" }}>{h}</span>
              ))}
            </div>

            {/* rows */}
            {[
              { make:"Jaguar",      v:"XE 2.0D",           y:"2015–2021", kw:120, hp:163, cc:1999, e:"204DTD" },
              { make:"Jaguar",      v:"XF 2.0D",           y:"2015–2021", kw:132, hp:180, cc:1999, e:"204DTD" },
              { make:"Jaguar",      v:"F-Pace 2.0D",       y:"2016–2021", kw:132, hp:180, cc:1999, e:"204DTD" },
              { make:"Land Rover",  v:"Discovery Sport",   y:"2015–2020", kw:110, hp:150, cc:1999, e:"204DTD" },
              { make:"Land Rover",  v:"Range Rover Evoque",y:"2015–2019", kw:132, hp:180, cc:1999, e:"204DTD" },
              { make:"Land Rover",  v:"Freelander 2",      y:"2014–2015", kw:110, hp:150, cc:1999, e:"204DTD" },
            ].map((r,i)=>(
              <div key={i} style={{
                display:"grid", gridTemplateColumns:"1.6fr 62px 28px 28px 36px 58px",
                gap:0, padding:"6px 6px",
                borderBottom: i < 5 ? "1px solid #f0f4fb" : "none",
                background: i % 2 === 1 ? "#fafcff" : "transparent",
                borderRadius: i % 2 === 1 ? 6 : 0,
              }}>
                <div>
                  <div style={{ fontSize:8.5, fontWeight:700, color:"#0d1f35" }}>{r.make} {r.v}</div>
                </div>
                <span style={{ fontSize:8.5, color:"#3d5a7a", display:"flex", alignItems:"center" }}>{r.y}</span>
                <span style={{ fontSize:8.5, color:"#3d5a7a", display:"flex", alignItems:"center" }}>{r.kw}</span>
                <span style={{ fontSize:8.5, color:"#3d5a7a", display:"flex", alignItems:"center" }}>{r.hp}</span>
                <span style={{ fontSize:8.5, color:"#3d5a7a", display:"flex", alignItems:"center" }}>{r.cc}</span>
                <span style={{ fontSize:8, fontWeight:700, color:"#135DFF", fontFamily:"monospace", display:"flex", alignItems:"center" }}>{r.e}</span>
              </div>
            ))}

            {/* footer */}
            <div style={{ marginTop:8, paddingTop:8, borderTop:"1px solid #dde7f5", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e" }}/>
                <span style={{ fontSize:8.5, color:"#7a96b0", fontWeight:600 }}>+69 more vehicles matched</span>
              </div>
              <span style={{ fontSize:8.5, fontWeight:800, color:"#135DFF", cursor:"pointer" }}>
                View all →
              </span>
            </div>
          </div>{/* end Compat card */}
        </div>{/* end Compat row */}

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MOBILE HERO PREVIEW
   Shown instead of HeroCarousel on small screens
═══════════════════════════════════════ */
function MobileHeroPreview() {
  return (
    <div style={{
      background: "#fff",
      border: "2px solid rgba(19,93,255,0.25)",
      borderRadius: 20,
      overflow: "hidden",
      boxShadow: "0 8px 32px rgba(19,93,255,0.18), 0 2px 8px rgba(0,0,0,0.06)",
      fontFamily: "Plus Jakarta Sans, sans-serif",
    }}>
      <div style={{ height: 3, background: "linear-gradient(to right, #135DFF, #6366f1)" }} />

      {/* Input row */}
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #dde7f5" }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: "#7a96b0", textTransform: "uppercase" as const, letterSpacing: ".1em", marginBottom: 6 }}>OE / Article Number</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ flex: 1, background: "#f8faff", border: "1.5px solid #135DFF", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 700, color: "#0d1f35", boxShadow: "0 0 0 3px rgba(19,93,255,0.06)" }}>LR073640</div>
          <div style={{ background: "linear-gradient(135deg,#135DFF,#0040cc)", color: "#fff", borderRadius: 8, padding: "9px 14px", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" as const, flexShrink: 0 }}>Generate →</div>
        </div>
      </div>

      {/* Listing output */}
      <div style={{ padding: "14px 16px" }}>
        {/* Status pills */}
        <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" as const }}>
          {[{ label: "TecDoc: Connected", dot: "#22c55e" }, { label: "OE: Matched", dot: "#22c55e" }].map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: "#4d6a8a" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Listing title */}
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0d1f35", lineHeight: 1.4, marginBottom: 10 }}>
          Gasket Cylinder Head — Jaguar XE XF<br/>
          2.0D 204DTD 2015–2021
        </div>

        {/* OE number tags */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" as const, marginBottom: 10 }}>
          {["G4D3601ACA", "JDE36769", "LR073640"].map(t => (
            <span key={t} style={{ fontFamily: "'Courier New',monospace", fontSize: 9, fontWeight: 700, background: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe", borderRadius: 4, padding: "2px 7px", display: "inline-block" }}>{t}</span>
          ))}
          <span style={{ fontFamily: "'Courier New',monospace", fontSize: 9, fontWeight: 700, background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa", borderRadius: 4, padding: "2px 7px", display: "inline-block" }}>AJUSA 1023720</span>
          <span style={{ fontFamily: "'Courier New',monospace", fontSize: 9, fontWeight: 700, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 4, padding: "2px 7px", display: "inline-block" }}>107640</span>
        </div>

        {/* Compatibility box */}
        <div style={{ background: "linear-gradient(135deg,#eef4ff,#dceaff)", border: "1.5px solid rgba(19,93,255,0.18)", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#135DFF", lineHeight: 1, flexShrink: 0 }}>75</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0d1f35" }}>compatible vehicles</div>
            <div style={{ fontSize: 10, color: "#3d5a7a" }}>Land Rover · Jaguar · 2014–</div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { label: "Copy HTML", bg: "#4338ca" },
            { label: "Export CSV", bg: "#059669" },
            { label: "Saved", bg: "#3d5a7a" },
          ].map(btn => (
            <div key={btn.label} style={{ flex: 1, background: btn.bg, color: "#fff", borderRadius: 8, padding: "10px 0", fontSize: 9.5, fontWeight: 800, textAlign: "center" as const }}>{btn.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   HERO
═══════════════════════════════════════ */
export default function Hero() {
  return (
    <>
      <style>{globalStyles}</style>

      <section style={{
        minHeight:"100vh",
        paddingTop: 68,
        /* ── LAYER 1: base gradient — bright centre, darker outer edges ── */
        background:"radial-gradient(ellipse 140% 100% at 55% 48%, #ffffff 0%, #f2f7ff 32%, #e8f0fb 62%, #dce8f7 100%)",
        display:"flex", alignItems:"center",
        fontFamily:"Plus Jakarta Sans,sans-serif",
        position:"relative", overflow:"hidden",
      }}>

        {/* ══════════════════════════════════════
            BACKGROUND LAYERS — painted bottom up
        ══════════════════════════════════════ */}

        {/* ── LAYER 2: subtle dot grid texture ── */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          backgroundImage:"radial-gradient(circle, rgba(19,93,255,0.07) 1px, transparent 1px)",
          backgroundSize:"32px 32px",
          opacity:0.6,
        }}/>

        {/* ── LAYER 3: vignette — darkens outer edges, brightens centre ── */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:"radial-gradient(ellipse 90% 85% at 50% 48%, transparent 30%, rgba(200,218,245,0.18) 60%, rgba(180,205,238,0.32) 100%)",
        }}/>

        {/* ── LAYER 4: main focal blue glow — directly behind the listing card ── */}
        <div style={{
          position:"absolute", pointerEvents:"none",
          top:"50%", left:"50%", transform:"translate(-16%, -50%)",
          width:820, height:700,
          background:"radial-gradient(ellipse at center, rgba(19,93,255,0.11) 0%, rgba(19,93,255,0.06) 35%, rgba(99,102,241,0.03) 60%, transparent 80%)",
          filter:"blur(40px)",
        }}/>

        {/* ── LAYER 5: blueprint corner accents — very faint technical line art ── */}
        {/* top-left corner: engine cross-section rings */}
        <svg style={{ position:"absolute", top:0, left:0, pointerEvents:"none", opacity:0.045 }}
          width="320" height="280" viewBox="0 0 320 280" fill="none">
          <circle cx="0" cy="0" r="180" stroke="#132A46" strokeWidth="0.8"/>
          <circle cx="0" cy="0" r="140" stroke="#132A46" strokeWidth="0.6"/>
          <circle cx="0" cy="0" r="100" stroke="#132A46" strokeWidth="0.5"/>
          <circle cx="0" cy="0" r="62" stroke="#132A46" strokeWidth="0.5"/>
          {/* bolt holes */}
          {[30,70,110,150].map(a => (
            <circle key={a} cx={Math.cos((a*Math.PI)/180)*156} cy={Math.sin((a*Math.PI)/180)*156} r="6" stroke="#132A46" strokeWidth="0.6"/>
          ))}
          {/* cross-hairs */}
          <line x1="0" y1="-200" x2="0" y2="200" stroke="#132A46" strokeWidth="0.4" strokeDasharray="4 6"/>
          <line x1="-200" y1="0" x2="200" y2="0" stroke="#132A46" strokeWidth="0.4" strokeDasharray="4 6"/>
        </svg>
        {/* bottom-right corner: gear / sprocket blueprint */}
        <svg style={{ position:"absolute", bottom:0, right:0, pointerEvents:"none", opacity:0.055 }}
          width="280" height="260" viewBox="0 0 280 260" fill="none">
          <circle cx="280" cy="260" r="160" stroke="#132A46" strokeWidth="0.8"/>
          <circle cx="280" cy="260" r="120" stroke="#132A46" strokeWidth="0.6"/>
          <circle cx="280" cy="260" r="82"  stroke="#132A46" strokeWidth="0.5"/>
          <circle cx="280" cy="260" r="44"  stroke="#132A46" strokeWidth="0.5"/>
          {[15,55,95,135].map(a => (
            <circle key={a} cx={280+Math.cos((a*Math.PI)/180)*138} cy={260+Math.sin((a*Math.PI)/180)*138} r="5" stroke="#132A46" strokeWidth="0.5"/>
          ))}
          <line x1="80" y1="260" x2="280" y2="260" stroke="#132A46" strokeWidth="0.4" strokeDasharray="4 6"/>
          <line x1="280" y1="60"  x2="280" y2="260" stroke="#132A46" strokeWidth="0.4" strokeDasharray="4 6"/>
        </svg>

        {/* ── LAYER 6: angled parts pattern ── */}
        {/* pattern tile, rotated */}
        <div style={{
          position:"absolute", inset:"-60%", pointerEvents:"none",
          backgroundImage:"url(/parts-pattern-outline.png?v=2)",
          backgroundSize:"820px 820px",
          backgroundRepeat:"repeat",
          transform:"rotate(-15deg)",
          opacity:0.22,
          mixBlendMode:"multiply",
        } as any}/>
        {/* fade mask over the pattern — covers left ~55% in screen space so text is clear */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:"linear-gradient(to right, #f0f4fa 0%, #f0f4fa 28%, rgba(240,244,250,0.85) 38%, rgba(240,244,250,0) 58%)",
        }}/>



        <div className="hero-section-grid" style={{
          maxWidth:1440, margin:"0 auto", width:"100%",
          display:"grid",
          gridTemplateColumns:"390px 1fr",
          alignItems:"center",
          gap:0,
          padding:"60px 40px 60px 68px",
          position:"relative",
        }}>

          {/* ── LEFT COPY ── */}
          <div>
            {/* badge */}
            <div style={{
              display:"inline-flex", alignItems:"center", gap:8,
              background:"#fff", border:`1.5px solid ${B}`, borderRadius:999,
              padding:"6px 14px 6px 8px", marginBottom:28,
              fontSize:11, fontWeight:700, color:A,
              boxShadow:"0 2px 16px rgba(19,93,255,0.12)",
            }}>
              <div style={{
                width:22, height:22, borderRadius:"50%",
                background:"linear-gradient(135deg,#EEF5FF,#dde8ff)",
                border:`1px solid ${B}`,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
              }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M6.5 1L4 6.5h4L5 11" stroke="#135DFF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div className="badge-live-dot" style={{ width:6, height:6, borderRadius:"50%", background:G, flexShrink:0 }}/>
                Automotive Listing Tool for eBay Sellers
              </div>
            </div>

            <h1 style={{
              margin:"0 0 20px", fontSize:"clamp(40px,3.8vw,56px)",
              fontWeight:900, lineHeight:1.04, letterSpacing:"-2.5px", color:T,
            }}>
              Part number in.<br/>
              <span className="hero-listing-gradient">eBay listing</span>
              <span style={{ color:T }}> out.</span>
            </h1>

            <p style={{ fontSize:14.5, color:M, lineHeight:1.8, marginBottom:28, maxWidth:360 }}>
              Enter an OE, OEM or article number. We fetch fitment data,
              generate your title, pull interchangeable, OE and K numbers,
              and export your eBay listing — instantly.
            </p>

            <div style={{ display:"flex", gap:10, marginBottom:28, flexWrap:"wrap", alignItems:"center" }}>
              <Link to="/auth/sign-up" onClick={() => trackEvent("signup_clicked", { cta_location: "hero" })} style={{
                padding:"13px 26px",
                background:`linear-gradient(135deg,${A} 0%,#0040cc 100%)`,
                color:"#fff", textDecoration:"none",
                fontWeight:800, fontSize:14.5, borderRadius:12,
                boxShadow:"0 6px 28px rgba(19,93,255,0.42), inset 0 1px 0 rgba(255,255,255,0.18)",
                whiteSpace:"nowrap", display:"inline-flex", alignItems:"center", gap:8,
                letterSpacing:"-0.2px",
              }}>
                Generate 10 Listings Free
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <a href="#how-it-works" style={{
                padding:"13px 20px", background:"rgba(255,255,255,0.8)", color:T,
                textDecoration:"none", fontWeight:700, fontSize:13.5,
                borderRadius:12, border:`1.5px solid ${B}`,
                boxShadow:"0 2px 8px rgba(19,45,70,0.06)",
                whiteSpace:"nowrap", display:"inline-flex", alignItems:"center", gap:6,
                backdropFilter:"blur(4px)",
              }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke={A} strokeWidth="1.3"/>
                  <path d="M6 8l2.2 2.2 3.8-4" stroke={A} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                See how it works
              </a>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:28 }}>
              {[
                { n:"1", label:"Enter OE / article number",    sub:"Any part — we handle the lookup." },
                { n:"2", label:"Pull listing data automatically", sub:"Item specifics, OE references, supplier part numbers, compatibility and K numbers are fetched from catalogue data." },
                { n:"3", label:"Export to eBay in one click",    sub:"Copy HTML or export CSV." },
              ].map((s,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{
                    width:26, height:26, borderRadius:8, flexShrink:0,
                    background: i===0 ? `linear-gradient(135deg,${A},#0040cc)` : AL,
                    border: i===0 ? "none" : `1.5px solid ${B}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:10, fontWeight:900,
                    color: i===0 ? "#fff" : A,
                    boxShadow: i===0 ? "0 3px 10px rgba(19,93,255,0.35)" : "none",
                  }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize:12.5, fontWeight:700, color:T, lineHeight:1.3 }}>{s.label}</div>
                    {s.sub && <div style={{ fontSize:10.5, color:D, fontWeight:500 }}>{s.sub}</div>}
                  </div>
                </div>
              ))}
            </div>


          </div>

          {/* ── RIGHT: CAROUSEL (desktop) / mobile preview ── */}
          <div className="hero-carousel-desktop hero-panel-float" style={{ minWidth:0, paddingLeft:8 }}>
            <HeroCarousel/>
          </div>
          <div className="hero-mobile-preview">
            <MobileHeroPreview/>
          </div>

        </div>
      </section>
    </>
  );
}
