import { Link } from "react-router-dom";

const TEXT    = "#132A46";
const MUTED   = "#4d6a8a";
const DIM     = "#7a96b0";
const ACCENT  = "#135DFF";
const BORDER  = "#dde7f5";
const BG_ALT  = "#f4f7fc";

/* ── tiny reusable mini-visual: data flow diagram ── */
function MiniDataFlow() {
  const rows = ["OE", "Interchange", "N Number", "Fitment", "Item specifics"];
  const colors = [ACCENT, ACCENT, ACCENT, "#f59e0b", ACCENT];
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {/* left column: field labels */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {rows.map((r, i) => (
          <div key={r} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: colors[i], flexShrink: 0 }} />
            <span style={{ fontSize: 9.5, color: MUTED, fontFamily: "Plus Jakarta Sans, sans-serif", whiteSpace: "nowrap" }}>{r}</span>
          </div>
        ))}
      </div>
      {/* arrow */}
      <svg width="20" height="40" viewBox="0 0 20 40" fill="none">
        <path d="M4 20 L16 20 M12 16 L16 20 L12 24" stroke="#d1d9e6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {/* right: placeholder listing block */}
      <div style={{ flex: 1, background: "#f8faff", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px" }}>
        {[70, 90, 55, 80, 65].map((w, i) => (
          <div key={i} style={{ height: 5, width: `${w}%`, background: i === 2 ? "#fde68a" : "#dde7f5", borderRadius: 3, marginBottom: i < 4 ? 4 : 0 }} />
        ))}
      </div>
    </div>
  );
}

/* ── mini raw→structured visual ── */
function MiniRawToStructured() {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      {/* raw data column */}
      <div style={{ flex: 1, background: "#f8faff", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "7px 8px" }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: DIM, marginBottom: 5, fontFamily: "monospace" }}>Raw data</div>
        {["OE: 123 1241 A55", "Interchange:", "12345, 123451…", "Fitment:", "Audi A4 2001–", "Item specifics:", "Brand:", "Warranty:"].map((l, i) => (
          <div key={i} style={{ fontSize: 7.5, color: i % 2 === 0 ? MUTED : DIM, fontFamily: "monospace", lineHeight: 1.6 }}>{l}</div>
        ))}
      </div>
      {/* arrow */}
      <div style={{ display: "flex", alignItems: "center", paddingTop: 20 }}>
        <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
          <path d="M2 8 L16 8 M11 4 L16 8 L11 12" stroke="#d1d9e6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {/* structured listing */}
      <div style={{ flex: 1, background: "#f8faff", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "7px 8px" }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: DIM, marginBottom: 5, fontFamily: "Plus Jakarta Sans, sans-serif" }}>Structured listing</div>
        {[
          { label: "Description",   w: "85%" },
          { label: "Compatibility", w: "70%" },
          { label: "Item Specifics",w: "90%" },
        ].map((r, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 7.5, color: DIM, fontFamily: "Plus Jakarta Sans, sans-serif", marginBottom: 2 }}>{r.label}</div>
            <div style={{ height: 5, width: r.w, background: BORDER, borderRadius: 3 }} />
            {i < 2 && <div style={{ height: 4, width: "60%", background: "#eef3fb", borderRadius: 3, marginTop: 2 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    title: "Enter OE / OEM / Article Number",
    desc: "Start with the part number you already have.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z"/>
      </svg>
    ),
    title: "Generate structured listing",
    desc: "Part Lister organises the title, OE references, interchangeable numbers, item specifics and compatibility into a clean listing output.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    ),
    title: "Ready-to-list output",
    desc: "Review the generated listing, then copy the HTML or export the data.",
  },
];

export default function BeforeAfter() {
  return (
    <section style={{ padding: "100px 24px", background: "#fff", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>

        {/* ── Two columns ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 20, alignItems: "stretch" }}>

          {/* ── LEFT: Manual Workflow ── */}
          <div style={{
            background: "#fafbfc",
            border: "1px solid #e5e9f0",
            borderRadius: 20,
            padding: "32px 32px 28px",
          }}>
            {/* badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff0f0", border: "1px solid #fecaca", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 800, color: "#dc2626", marginBottom: 32 }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="#dc2626" strokeWidth="1.6" strokeLinecap="round"/></svg>
              Manual Workflow
            </div>

            {/* Problem 1 */}
            <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff0f0", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Copy &amp; paste everything</div>
                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: "0 0 14px" }}>
                  OE numbers, interchangeable references, fitment data and item specifics often need copying into the same listing structure manually.
                </p>
                <MiniDataFlow />
              </div>
            </div>

            <div style={{ height: 1, background: "#e5e9f0", marginBottom: 28 }} />

            {/* Problem 2 */}
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff0f0", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Format the listing manually</div>
                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: "0 0 14px" }}>
                  Descriptions need headings, sections, warnings, item specifics and compatibility laid out clearly for every SKU.
                </p>
                <MiniRawToStructured />
              </div>
            </div>
          </div>

          {/* ── RIGHT: With PartLister ── */}
          <div style={{
            background: "#EEF5FF",
            border: `1.5px solid ${ACCENT}`,
            borderRadius: 20,
            padding: "32px 32px 28px",
            boxShadow: "0 8px 40px rgba(19,93,255,0.10)",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ACCENT, borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 32, alignSelf: "flex-start" }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              With PartLister
            </div>

            {/* Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1 }}>
              {STEPS.map((s, i) => (
                <div key={i}>
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "18px 20px", background: "#fff", borderRadius: 14, border: `1px solid ${BORDER}`, boxShadow: "0 2px 12px rgba(19,45,70,0.05)" }}>
                    {/* number + icon */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${ACCENT}, #0040cc)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(19,93,255,0.30)" }}>
                        {s.icon}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: ACCENT }}>{i + 1}</div>
                    </div>
                    <div style={{ flex: 1, paddingTop: 2 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: TEXT, marginBottom: 4 }}>{s.title}</div>
                      <p style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                    </div>
                  </div>
                  {/* connector line between steps */}
                  {i < STEPS.length - 1 && (
                    <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
                      <div style={{ width: 1.5, height: 18, background: `linear-gradient(to bottom, ${BORDER}, ${BORDER})` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Result strip */}
            <div style={{ marginTop: 20, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#dcfce7", border: "1.5px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>Structured listing output</div>
                  <div style={{ fontSize: 10.5, color: DIM, marginTop: 2 }}>
                    OE / OEM / Article Number&nbsp;
                    <span style={{ color: ACCENT }}>→</span>&nbsp;
                    Structured Listing&nbsp;
                    <span style={{ color: ACCENT }}>→</span>&nbsp;
                    Compatibility &amp; Item Specifics
                  </div>
                </div>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#EEF5FF", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "5px 11px", flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6.5 1L4 6.5h4L5 11" stroke={ACCENT} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontSize: 11, fontWeight: 800, color: ACCENT, whiteSpace: "nowrap" }}>Up to 20× Faster</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <Link to="/auth/sign-up" style={{ display: "inline-block", padding: "14px 32px", background: ACCENT, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 15, borderRadius: 12, boxShadow: "0 4px 18px rgba(19,93,255,0.28)", letterSpacing: "-0.2px" }}>
            Generate 10 Listings Free →
          </Link>
        </div>

      </div>
    </section>
  );
}
