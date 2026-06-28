import { useState } from "react";

const TEXT = "#132A46";
const MUTED = "#4d6a8a";
const ACCENT = "#135DFF";
const ACCENT_LIGHT = "#EEF5FF";
const BORDER = "#dde7f5";

const FAQS = [
  {
    q: "Does this work for eBay listings?",
    a: "Yes. Part Lister is designed around eBay-style car parts listings, including titles, descriptions, item specifics and compatibility information.",
  },
  {
    q: "What number do I enter?",
    a: "You can enter an OE number, OEM reference or part number.",
  },
  {
    q: "Do I need TecDoc knowledge?",
    a: "No. Part Lister is designed to make technical parts data easier to use and format.",
  },
  {
    q: "Can I use my own listing templates?",
    a: "Yes. You can create and manage listing templates in your account.",
  },
  {
    q: "Can I export the listings?",
    a: "Yes. You can copy or export listings into your current selling workflow.",
  },
  {
    q: "Is it only for new parts?",
    a: "No. You can create listings for both new and used parts.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      id="faq"
      style={{
        padding: "96px 24px",
        background: "#f4f7fc",
        fontFamily: "Plus Jakarta Sans, sans-serif",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
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
          FAQ
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
          Frequently asked questions
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
        {FAQS.map((faq, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              border: `1px solid ${open === i ? ACCENT : BORDER}`,
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: open === i ? "0 4px 20px rgba(19,93,255,0.08)" : "0 1px 4px rgba(19,45,70,0.04)",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 22px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left" as const,
                gap: 16,
                fontFamily: "inherit",
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>
                {faq.q}
              </span>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: open === i ? ACCENT : ACCENT_LIGHT,
                  border: `1px solid ${BORDER}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  color: open === i ? "#fff" : ACCENT,
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: "all 0.2s",
                }}
              >
                {open === i ? "−" : "+"}
              </span>
            </button>
            {open === i && (
              <div
                style={{
                  padding: "0 22px 18px",
                  fontSize: 14,
                  color: MUTED,
                  lineHeight: 1.75,
                  borderTop: `1px solid ${BORDER}`,
                  paddingTop: 16,
                }}
              >
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
      </div>

      {/* Still have questions */}
      <div style={{ textAlign: "center", marginTop: 48 }}>
        <p style={{ fontSize: 15, color: MUTED, margin: "0 0 8px" }}>
          Still have questions?
        </p>
        <a
          href="mailto:enquiries@partlister.app"
          style={{ fontSize: 15, fontWeight: 600, color: ACCENT, textDecoration: "none" }}
        >
          enquiries@partlister.app
        </a>
      </div>
    </section>
  );
}
