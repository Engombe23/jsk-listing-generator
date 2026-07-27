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

const SECTION_ORDER = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11"];

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

export default function TermsPage() {
  const { t } = useTranslation();
  useDocumentTitle(`${t("terms.title")} | PartLister`);
  const { session } = useSession();
  const sections = t("terms.sections", { returnObjects: true }) || {};

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter', sans-serif" }}>
      {session ? (
        <div style={{ padding: "16px 24px", background: "#0a0e17", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Link to="/" style={{ color: "#9aa3b8", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
            {t("terms.backToApp")}
          </Link>
        </div>
      ) : (
        <Navbar />
      )}

      <main style={{ maxWidth: 780, margin: "0 auto", padding: "64px 24px 80px" }}>
        <p style={{ fontSize: 13, color: "#9aa3b8", marginBottom: 8 }}>{t("terms.lastUpdated")}</p>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: TEXT, marginBottom: 12 }}>{t("terms.title")}</h1>
        <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.8, marginBottom: 48 }}>
          {t("terms.intro")}
        </p>

        {SECTION_ORDER.map((id) => {
          const s = sections[id];
          if (!s) return null;
          return (
            <Section key={id} title={s.title}>
              {s.body && <p style={{ marginBottom: s.items ? 12 : 0 }}>{s.body}</p>}
              {Array.isArray(s.items) && (
                <ul style={{ paddingInlineStart: 20, margin: 0 }}>
                  {s.items.map((item) => (
                    <li key={item} style={{ marginBottom: 6 }}>{item}</li>
                  ))}
                </ul>
              )}
              {s.after && <p style={{ marginTop: 12 }}>{s.after}</p>}
            </Section>
          );
        })}

        <div style={{ marginTop: 48, padding: "24px 28px", background: "#f4f6fb", borderRadius: 12, border: `1px solid ${BORDER}` }}>
          <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>
            {t("terms.questionsFooter")}{" "}
            <a href="mailto:support@partlister.app" style={{ color: ACCENT, textDecoration: "none" }}>
              support@partlister.app
            </a>
          </p>
        </div>
      </main>

      {!session && <Footer />}
    </div>
  );
}
