const TEXT = "#132A46";
const MUTED = "#4d6a8a";
const DIM = "#7a96b0";
const ACCENT = "#135DFF";
const ACCENT_LIGHT = "#EEF5FF";
const BORDER = "#dde7f5";

const steps = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    ),
    label: "OE Number",
    detail: "e.g. 1K0615123A",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
    label: "Engine Code",
    detail: "AXW, BLY, BVY…",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M9 21V9M15 21V9"/>
      </svg>
    ),
    label: "Compatibility",
    detail: "VW, Audi, Skoda, Seat",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    label: "Item Specifics",
    detail: "Brand, Placement, Ref",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    label: "Smart Pricing",
    detail: "£185–£415 range",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    label: "CSV Export",
    detail: "eBay bulk upload ready",
  },
];

export default function AutomotiveProof() {
  return (
    <section style={{ background: "#fff", padding: "56px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Label */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: DIM, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
            The full workflow, automated
          </p>
        </div>

        {/* Horizontal flow strip */}
        <div style={{
          display: "flex",
          alignItems: "stretch",
          gap: 0,
          background: "#f8faff",
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          overflow: "hidden",
        }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", flex: 1, alignItems: "center", position: "relative" }}>
              {/* Step cell */}
              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "22px 12px",
                borderRight: i < steps.length - 1 ? `1px solid ${BORDER}` : "none",
              }}>
                <div style={{
                  width: 38,
                  height: 38,
                  background: ACCENT_LIGHT,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                  flexShrink: 0,
                }}>
                  {step.icon}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 3 }}>{step.label}</div>
                <div style={{ fontSize: 11, color: DIM, lineHeight: 1.4 }}>{step.detail}</div>
              </div>

              {/* Arrow connector (between cells) */}
              {i < steps.length - 1 && (
                <div style={{
                  position: "absolute",
                  right: -9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 18,
                  height: 18,
                  background: "#fff",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2,
                }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 0, marginTop: 40, borderTop: `1px solid ${BORDER}`, paddingTop: 40 }}>
          {[
            { stat: "< 30s", desc: "From OE number to complete listing" },
            { stat: "100%", desc: "eBay item specifics populated" },
            { stat: "Live", desc: "eBay market data for pricing" },
            { stat: "Bulk", desc: "CSV export for mass upload" },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: "center", padding: "0 20px", borderRight: i < 3 ? `1px solid ${BORDER}` : "none" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: ACCENT, marginBottom: 4 }}>{item.stat}</div>
              <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
