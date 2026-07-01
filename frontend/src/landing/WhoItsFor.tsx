const TEXT = "#132A46";
const MUTED = "#4d6a8a";
const ACCENT = "#135DFF";
const ACCENT_LIGHT = "#EEF5FF";
const BORDER = "#dde7f5";
const BG_ALT = "#f4f7fc";

const AUDIENCE = [
  {
    icon: "🛒",
    title: "eBay Parts Sellers",
    desc: "Speed up listing creation and keep your catalogue consistent across hundreds of parts.",
  },
  {
    icon: "🏭",
    title: "Aftermarket Parts Suppliers",
    desc: "Generate structured listings across a broad catalogue without manual data entry.",
  },
  {
    icon: "🔩",
    title: "Breakers & Dismantlers",
    desc: "List salvage parts quickly with accurate compatibility and condition data.",
  },
  {
    icon: "📦",
    title: "Small Parts Businesses",
    desc: "Compete with larger sellers using professional listings, without a dedicated team.",
  },
];

export default function WhoItsFor() {
  return (
    <div
      style={{
        background: "#ffffff",
        borderTop: `1px solid ${BORDER}`,
        borderBottom: `1px solid ${BORDER}`,
        fontFamily: "Plus Jakarta Sans, sans-serif",
      }}
    >
      <section
        className="lp-section"
        style={{
          padding: "96px 24px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: ACCENT_LIGHT,
              border: `1px solid ${BORDER}`,
              borderRadius: 999,
              padding: "6px 16px",
              fontSize: 12,
              fontWeight: 700,
              color: ACCENT,
              letterSpacing: "0.05em",
              marginBottom: 20,
            }}
          >
            Who It's For
          </div>
          <h2
            style={{
              fontSize: "clamp(26px, 3.5vw, 44px)",
              fontWeight: 900,
              color: TEXT,
              letterSpacing: "-0.5px",
              lineHeight: 1.15,
            }}
          >
            Built for car parts sellers
          </h2>
        </div>

        <div
          className="audience-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {AUDIENCE.map((a) => (
            <div
              key={a.title}
              style={{
                background: "#fff",
                border: `1px solid ${BORDER}`,
                borderRadius: 20,
                padding: 28,
                boxShadow: "0 2px 12px rgba(19,45,70,0.05)",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: ACCENT_LIGHT,
                  border: `1px solid ${BORDER}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  marginBottom: 16,
                }}
              >
                {a.icon}
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: TEXT, marginBottom: 8 }}>
                {a.title}
              </div>
              <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.65 }}>
                {a.desc}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
