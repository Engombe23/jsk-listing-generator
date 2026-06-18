const R = "#b70017";
const CARD = "#111317";
const BORDER = "rgba(255,255,255,0.07)";
const TEXT = "#ffffff";
const MUTED = "#9ca3af";
const DIM = "#6b7280";

const BENEFITS = [
  "List products 5–10x faster",
  "Reduce errors and returns",
  "Price with confidence",
  "Create consistent, professional listings",
  "Spend less time listing, more time selling",
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(183,0,23,0.12)",
        border: "1px solid rgba(183,0,23,0.25)",
        borderRadius: 999,
        padding: "6px 16px",
        fontSize: 12,
        fontWeight: 700,
        color: "#f87171",
        letterSpacing: "0.06em",
        textTransform: "uppercase" as const,
        marginBottom: 20,
      }}
    >
      {children}
    </div>
  );
}

export default function DemoSection() {
  return (
    <section
      style={{
        padding: "96px 24px",
        maxWidth: 1160,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 64,
          alignItems: "center",
        }}
      >
        {/* Left: benefits list */}
        <div>
          <SectionLabel>Benefits</SectionLabel>
          <h2
            style={{
              fontSize: "clamp(26px, 3.5vw, 44px)",
              fontWeight: 900,
              letterSpacing: "-0.5px",
              marginBottom: 36,
              lineHeight: 1.15,
              color: TEXT,
            }}
          >
            Built for Automotive Sellers Who Want to Scale
          </h2>
          <div style={{ display: "grid", gap: 16 }}>
            {BENEFITS.map((b) => (
              <div
                key={b}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  background: CARD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 600,
                  color: TEXT,
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(74,222,128,0.12)",
                    border: "1px solid rgba(74,222,128,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    color: "#4ade80",
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                {b}
              </div>
            ))}
          </div>
        </div>

        {/* Right: stats card */}
        <div
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 28,
            padding: 36,
            boxShadow: `0 0 0 1px rgba(183,0,23,0.12), 0 0 60px rgba(183,0,23,0.08), 0 32px 64px rgba(0,0,0,0.40)`,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: DIM,
              marginBottom: 6,
              textTransform: "uppercase" as const,
              letterSpacing: "0.06em",
            }}
          >
            Time Saved Per Listing
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#4ade80",
              letterSpacing: "-2px",
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            ~15 min
          </div>
          <div style={{ fontSize: 15, color: MUTED, marginBottom: 32 }}>
            Average time saved per listing vs. manual workflow
          </div>

          <div style={{ height: 1, background: BORDER, marginBottom: 32 }} />

          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: DIM,
              marginBottom: 6,
              textTransform: "uppercase" as const,
              letterSpacing: "0.06em",
            }}
          >
            Listing Errors Eliminated
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: R,
              letterSpacing: "-2px",
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            95%
          </div>
          <div style={{ fontSize: 15, color: MUTED }}>
            Reduction in compatibility and pricing mistakes
          </div>
        </div>
      </div>
    </section>
  );
}
