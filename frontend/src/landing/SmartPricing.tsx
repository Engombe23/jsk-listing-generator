const TEXT = "#132A46";
const MUTED = "#4d6a8a";
const DIM = "#7a96b0";
const ACCENT = "#135DFF";
const ACCENT_LIGHT = "#EEF5FF";
const BORDER = "#dde7f5";
const BG_ALT = "#f4f7fc";

const bars = [
  { height: 18, count: 1 },
  { height: 32, count: 2 },
  { height: 55, count: 4 },
  { height: 78, count: 6 },
  { height: 100, count: 8 },
  { height: 88, count: 7 },
  { height: 65, count: 5 },
  { height: 40, count: 3 },
  { height: 22, count: 2 },
  { height: 10, count: 1 },
];

const listings = [
  { title: "VW Golf MK5 Brake Caliper Front Left — OE Spec", price: "£299", sold: true },
  { title: "Brake Caliper 1K0615123A VW Audi Skoda Seat", price: "£315", sold: true },
  { title: "Front Brake Caliper Golf MK5 MK6 — New", price: "£329", sold: false },
  { title: "VW 1K0615123A Brake Caliper — Fast Dispatch", price: "£349", sold: false },
];

export default function SmartPricing() {
  return (
    <section className="lp-section" style={{ background: BG_ALT, padding: "90px 24px", borderTop: "1px solid #dde7f5" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="smart-pricing-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>

          {/* Left — Copy */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "6px 16px", marginBottom: 24 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 600, color: ACCENT, letterSpacing: "0.04em" }}>SMART PRICING</span>
            </div>

            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 700, color: TEXT, margin: "0 0 20px", lineHeight: 1.2 }}>
              Stop guessing.<br />
              <span style={{ color: ACCENT }}>Price from real market data.</span>
            </h2>

            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, margin: "0 0 28px" }}>
              PartLister scans live and recently sold eBay listings to build a real price distribution
              for your exact part. See what buyers are actually paying — not just what sellers are asking.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, text: "Live & sold eBay listings analysed per part number" },
                { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, text: "Low, median, average, and high price markers" },
                { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, text: "See how many active sellers are competing at each price" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 30, height: 30, background: ACCENT_LIGHT, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: 14, color: MUTED, lineHeight: 1.5, paddingTop: 6 }}>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Insight box */}
            <div style={{ marginTop: 32, background: ACCENT_LIGHT, border: `1px solid #c7d9ff`, borderRadius: 12, padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 4 }}>Market insight</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
                  For <strong style={{ color: TEXT }}>1K0615123A</strong> — 15 active listings between £295–£420. Median sold price: <strong style={{ color: ACCENT }}>£319</strong>. 3 listings below cost.
                </div>
              </div>
            </div>
          </div>

          {/* Right — Visual panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Price distribution chart */}
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Price distribution</div>
                  <div style={{ fontSize: 11, color: DIM }}>39 listings · 1K0615123A</div>
                </div>
                <div style={{ fontSize: 11, color: ACCENT, background: ACCENT_LIGHT, borderRadius: 6, padding: "3px 10px", fontWeight: 600, border: `1px solid #c7d9ff` }}>Live data</div>
              </div>

              {/* Histogram */}
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 72, marginBottom: 6 }}>
                  {bars.map((bar, i) => {
                    const inRange = i >= 3 && i <= 6;
                    return (
                      <div key={i} style={{
                        flex: 1,
                        height: `${bar.height}%`,
                        background: inRange ? ACCENT : BORDER,
                        borderRadius: "3px 3px 0 0",
                        opacity: inRange ? 1 : 0.5,
                        transition: "background 0.2s",
                      }} />
                    );
                  })}
                </div>
                {/* Price axis */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: DIM, marginBottom: 12 }}>
                  <span>£180</span><span>£240</span><span>£300</span><span>£360</span><span>£420+</span>
                </div>
                {/* Marker pills */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {[
                    { label: "Low", val: "£185", sub: "floor" },
                    { label: "Median", val: "£295", sub: "sweet spot", highlight: true },
                    { label: "Average", val: "£309", sub: "mean" },
                    { label: "High", val: "£415", sub: "ceiling" },
                  ].map(m => (
                    <div key={m.label} style={{
                      background: m.highlight ? ACCENT_LIGHT : BG_ALT,
                      border: `1px solid ${m.highlight ? "#c7d9ff" : BORDER}`,
                      borderRadius: 8,
                      padding: "8px 6px",
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: 10, color: m.highlight ? ACCENT : DIM, fontWeight: 600, marginBottom: 2 }}>{m.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: m.highlight ? ACCENT : TEXT }}>{m.val}</div>
                      <div style={{ fontSize: 10, color: DIM }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Similar listings */}
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 12 }}>Similar eBay listings</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {listings.map((l, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: i < listings.length - 1 ? `1px solid ${BORDER}` : "none",
                  }}>
                    <div style={{ flex: 1, paddingRight: 12 }}>
                      <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.4, fontWeight: 500 }}>{l.title}</div>
                      <div style={{ fontSize: 11, color: l.sold ? "#16a34a" : DIM, marginTop: 2 }}>{l.sold ? "✓ Sold" : "Active"}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, whiteSpace: "nowrap" }}>{l.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
