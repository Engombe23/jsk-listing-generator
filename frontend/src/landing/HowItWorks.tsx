import { Link } from "react-router-dom";
import { trackEvent } from "../lib/analytics";

const TEXT = "#132A46";
const MUTED = "#4d6a8a";
const DIM = "#7a96b0";
const ACCENT = "#135DFF";
const ACCENT_LIGHT = "#EEF5FF";
const BORDER = "#dde7f5";

const MANUAL_STEPS = [
  { num: 1, title: "Start with a part number", desc: "Use an OE number, article number, supplier reference or SKU." },
  { num: 2, title: "Search for product data", desc: "Find the product type, image, item specifics and technical details." },
  { num: 3, title: "Find OE references", desc: "Collect OE numbers and matching references." },
  { num: 4, title: "Find interchangeable numbers", desc: "Check cross-reference numbers from other brands or suppliers." },
  { num: 5, title: "Check compatibility data", desc: "Look up vehicle fitment, engine codes, kW, HP, CC and years." },
  { num: 6, title: "Build the listing content", desc: "Create the title, description, item specifics and compatibility section." },
  { num: 7, title: "Copy into eBay or CSV", desc: "Paste the structured data into the listing, HTML template or CSV import sheet." },
  { num: 8, title: "Review and adjust", desc: "Check the listing before publishing." },
];

const PARTLISTER_STEPS = [
  {
    num: 1,
    title: "Enter OE / OEM / Article Number",
    desc: "Start with the number you already have.",
  },
  {
    num: 2,
    title: "Generate structured listing",
    desc: "Part Lister pulls the product data, OE references, interchangeable numbers, item specifics, image and compatibility details into one output.",
  },
  {
    num: 3,
    title: "Review, edit and export",
    desc: "Check the result, make edits, then copy the HTML or export the data.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        padding: "96px 24px",
        background: "#f7f9fc",
        fontFamily: "Plus Jakarta Sans, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        {/* Header */}
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
            How It Works
          </div>
          <h2
            style={{
              fontSize: "clamp(26px, 3.5vw, 44px)",
              fontWeight: 900,
              color: TEXT,
              letterSpacing: "-0.5px",
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            Manual vs Part Lister
          </h2>
        </div>

        {/* Two columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* LEFT — Manual */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #f0d0d0",
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            {/* Header bar */}
            <div
              style={{
                background: "#fff5f5",
                borderBottom: "1px solid #f0d0d0",
                padding: "18px 24px",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: "#c0392b", letterSpacing: "0.1em", marginBottom: 4 }}>
                MANUAL WORKFLOW
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#7a1a1a" }}>
                8 steps to build one listing
              </div>
            </div>

            {/* Steps */}
            <div style={{ padding: "8px 0" }}>
              {MANUAL_STEPS.map((step) => (
                <div
                  key={step.num}
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: "14px 24px",
                    borderBottom: step.num < 8 ? "1px solid #fce8e8" : "none",
                  }}
                >
                  <div
                    style={{
                      minWidth: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "#fee2e2",
                      color: "#c0392b",
                      fontSize: 11,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 2,
                    }}
                  >
                    {step.num}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 2 }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              style={{
                background: "#fff5f5",
                borderTop: "1px solid #f0d0d0",
                padding: "14px 24px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>⏱</span>
              <span style={{ fontSize: 13, color: "#c0392b", fontWeight: 700 }}>
                10–15 minutes per listing
              </span>
            </div>
          </div>

          {/* RIGHT — Part Lister */}
          <div
            style={{
              background: "#fff",
              border: `1px solid ${BORDER}`,
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 4px 32px rgba(19,93,255,0.10)",
            }}
          >
            {/* Header bar */}
            <div
              style={{
                background: ACCENT,
                borderBottom: `1px solid ${BORDER}`,
                padding: "18px 24px",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", marginBottom: 4 }}>
                WITH PART LISTER
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
                3 steps. Done.
              </div>
            </div>

            {/* Steps */}
            <div style={{ padding: "24px 24px 16px" }}>
              {PARTLISTER_STEPS.map((step, i) => (
                <div key={step.num} style={{ display: "flex", gap: 16, marginBottom: i < 2 ? 28 : 0 }}>
                  {/* Number + connector */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: ACCENT,
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {step.num}
                    </div>
                    {i < 2 && (
                      <div
                        style={{
                          width: 2,
                          flex: 1,
                          background: BORDER,
                          marginTop: 6,
                          minHeight: 28,
                        }}
                      />
                    )}
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, marginBottom: 4 }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.65 }}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Output tags */}
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: DIM, letterSpacing: "0.06em", marginBottom: 10 }}>
                OUTPUT INCLUDES
              </div>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                {["OE references", "Cross-references", "Item specifics", "K numbers (eBay compatibility)", "HTML / CSV export"].map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      background: ACCENT_LIGHT,
                      color: ACCENT,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 8,
                      padding: "4px 10px",
                    }}
                  >
                    ✓ {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                background: ACCENT_LIGHT,
                borderTop: `1px solid ${BORDER}`,
                padding: "14px 24px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>⚡</span>
              <span style={{ fontSize: 13, color: ACCENT, fontWeight: 700 }}>
                Under 2 minutes per listing
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <Link
            to="/auth/sign-up"
            onClick={() => trackEvent("signup_clicked", { cta_location: "how_it_works" })}
            style={{
              display: "inline-block",
              padding: "14px 32px",
              background: ACCENT,
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 15,
              borderRadius: 12,
              boxShadow: "0 4px 18px rgba(19,93,255,0.28)",
            }}
          >
            Try It Free — No Card Required
          </Link>
        </div>
      </div>
    </section>
  );
}
