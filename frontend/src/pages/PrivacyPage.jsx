import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../landing/landing-v2.css";
import Navbar from "../landing/Navbar";
import Footer from "../landing/Footer";
import { useSession } from "../context/SessionContext";
import { useDocumentTitle } from "../i18n/useDocumentTitle";

const ACCENT = "#135DFF";
const TEXT = "#132A46";
const MUTED = "#4d6a8a";
const BORDER = "#dde7f5";

const SECTION_ORDER = [
  "collect",
  "notStore",
  "howWeUse",
  "analytics",
  "cookies",
  "thirdParty",
  "dataSources",
  "security",
  "retention",
  "rights",
  "marketing",
  "changes",
  "contact",
];

const THIRD_PARTY_URLS = {
  Stripe: "https://stripe.com/gb/privacy",
  Supabase: "https://supabase.com/privacy",
  Vercel: "https://vercel.com/legal/privacy-policy",
  "Google Analytics": "https://policies.google.com/privacy",
  PostHog: "https://posthog.com/privacy",
  "eBay APIs": "https://www.ebay.co.uk/help/policies/member-behaviour-policies/user-privacy-notice-privacy-policy?id=4260",
  OpenAI: "https://openai.com/policies/privacy-policy",
};

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, color: MUTED, lineHeight: 1.8 }}>
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  const { t } = useTranslation();
  useDocumentTitle(`${t("privacy.title")} | PartLister`);
  const { session } = useSession();
  const sections = t("privacy.sections", { returnObjects: true }) || {};

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter', sans-serif" }}>
      {session ? (
        <div style={{ padding: "16px 24px", background: "#0a0e17", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Link to="/" style={{ color: "#9aa3b8", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
            {t("privacy.backToApp")}
          </Link>
        </div>
      ) : (
        <Navbar />
      )}

      <main style={{ maxWidth: 780, margin: "0 auto", padding: "64px 24px 80px" }}>
        <p style={{ fontSize: 13, color: "#9aa3b8", marginBottom: 8 }}>{t("privacy.lastUpdated")}</p>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: TEXT, marginBottom: 12 }}>{t("privacy.title")}</h1>
        <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.8, marginBottom: 48 }}>
          {t("privacy.intro")}
        </p>

        {SECTION_ORDER.map((id) => {
          const s = sections[id];
          if (!s) return null;
          return (
            <Section key={id} title={s.title}>
              {s.body && <p style={{ marginBottom: s.items ? 12 : 0 }}>{s.body}</p>}
              {Array.isArray(s.items) && (
                <ul style={{ paddingInlineStart: 20, margin: 0 }}>
                  {s.items.map((item) => {
                    if (id === "thirdParty") {
                      const url = THIRD_PARTY_URLS[item];
                      return (
                        <li key={item} style={{ marginBottom: 6 }}>
                          <strong style={{ color: TEXT }}>{item}</strong>
                          {url && (
                            <>
                              {" — "}
                              <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, textDecoration: "none" }}>
                                {t("privacy.thirdPartyPrivacyLink")}
                              </a>
                            </>
                          )}
                        </li>
                      );
                    }
                    return <li key={item} style={{ marginBottom: 6 }}>{item}</li>;
                  })}
                </ul>
              )}
              {s.after && <p style={{ marginTop: 12 }}>{s.after}</p>}
            </Section>
          );
        })}

        <div style={{ marginTop: 48, padding: "24px 28px", background: "#f4f6fb", borderRadius: 12, border: `1px solid ${BORDER}` }}>
          <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>
            {t("privacy.footerNote")}{" "}
            <Link to="/terms" style={{ color: ACCENT, textDecoration: "none" }}>{t("privacy.termsLink")}</Link>
          </p>
        </div>
      </main>

      {!session && <Footer />}
    </div>
  );
}
