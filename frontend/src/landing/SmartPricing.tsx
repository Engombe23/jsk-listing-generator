import { useTranslation } from "react-i18next";

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

export default function SmartPricing() {
  const { t } = useTranslation();
  const listings = t("landing.smartPricing.listings", { returnObjects: true }) as Array<{ title: string; price: string; sold: boolean }>;
  const benefits = t("landing.smartPricing.benefits", { returnObjects: true }) as string[];
  const markers = t("landing.smartPricing.markers", { returnObjects: true }) as Array<{ label: string; val: string; sub: string; highlight?: boolean }>;

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
              <span style={{ fontSize: 12, fontWeight: 600, color: ACCENT, letterSpacing: "0.04em" }}>{t("landing.smartPricing.badge")}</span>
            </div>

            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 700, color: TEXT, margin: "0 0 20px", lineHeight: 1.2 }}>
              {t("landing.smartPricing.titleBefore")}<br />
              <span style={{ color: ACCENT }}>{t("landing.smartPricing.titleAccent")}</span>
            </h2>

            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, margin: "0 0 28px" }}>
              {t("landing.smartPricing.body")}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
              ].map((icon, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 30, height: 30, background: ACCENT_LIGHT, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    {icon}
                  </div>
                  <span style={{ fontSize: 14, color: MUTED, lineHeight: 1.5, paddingTop: 6 }}>{benefits[i]}</span>
                </div>
              ))}
            </div>

            {/* Insight box */}
            <div style={{ marginTop: 32, background: ACCENT_LIGHT, border: `1px solid #c7d9ff`, borderRadius: 12, padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 4 }}>{t("landing.smartPricing.insightTitle")}</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
                  {t("landing.smartPricing.insightBody", { partNumber: "1K0615123A", low: "£295", high: "£420", median: "£319" })}
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
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{t("landing.smartPricing.distributionTitle")}</div>
                  <div style={{ fontSize: 11, color: DIM }}>{t("landing.smartPricing.listingsCount", { count: 39, partNumber: "1K0615123A" })}</div>
                </div>
                <div style={{ fontSize: 11, color: ACCENT, background: ACCENT_LIGHT, borderRadius: 6, padding: "3px 10px", fontWeight: 600, border: `1px solid #c7d9ff` }}>{t("landing.smartPricing.liveData")}</div>
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
                  {markers.map(m => (
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
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 12 }}>{t("landing.smartPricing.similarListings")}</div>
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
                      <div style={{ fontSize: 11, color: l.sold ? "#16a34a" : DIM, marginTop: 2 }}>{l.sold ? `✓ ${t("landing.smartPricing.sold")}` : t("landing.smartPricing.active")}</div>
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
