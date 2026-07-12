const CARD_DARK = "#0d0f12";
const BORDER = "rgba(255,255,255,0.07)";
const TEXT = "#ffffff";
const MUTED = "#9ca3af";

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

export default function TrustSection() {
  return (
    <div
      style={{
        background: CARD_DARK,
        borderTop: `1px solid ${BORDER}`,
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <section
        style={{
          padding: "96px 24px",
          maxWidth: 1160,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <SectionLabel>Why PartLister</SectionLabel>
        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 48px)",
            fontWeight: 900,
            letterSpacing: "-0.5px",
            marginBottom: 24,
            lineHeight: 1.15,
            color: TEXT,
          }}
        >
          Designed for Real Parts Sellers
        </h2>
        <p
          style={{
            fontSize: 18,
            color: MUTED,
            maxWidth: 600,
            margin: "0 auto 16px",
            lineHeight: 1.75,
          }}
        >
          Built around real workflows used by automotive eCommerce businesses.
        </p>
        <p
          style={{
            fontSize: 18,
            color: MUTED,
            maxWidth: 560,
            margin: "0 auto",
            lineHeight: 1.75,
          }}
        >
          No fluff. No unnecessary features. Just tools that save time and make
          money.
        </p>
      </section>
    </div>
  );
}
