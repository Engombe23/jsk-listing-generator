import { Link, useParams, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../landing/landing-v2.css";
import Navbar from "../landing/Navbar";
import Footer from "../landing/Footer";
import {
  ArticleImage,
  renderVisual,
} from "../help/HelpArticleVisuals";
import { useDocumentTitle } from "../i18n/useDocumentTitle";

const TEXT = "#132A46";
const MUTED = "#4d6a8a";
const DIM = "#7a96b0";
const BORDER = "#dde7f5";
const ACCENT = "#135DFF";
const ACCENT_LIGHT = "#EEF5FF";

function Paragraph({ text }) {
  return <p style={{ margin: "0 0 16px 0", fontSize: 15, color: MUTED, lineHeight: 1.75 }}>{text}</p>;
}

function BulletList({ items }) {
  return (
    <ul style={{ margin: "0 0 16px 0", paddingInlineStart: 20, display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 15, color: MUTED, lineHeight: 1.7 }}>{item}</li>
      ))}
    </ul>
  );
}

function Tip({ label, text }) {
  return (
    <div style={{
      display: "flex", gap: 12, padding: "14px 16px",
      background: ACCENT_LIGHT, border: `1px solid ${BORDER}`,
      borderInlineStart: `3px solid ${ACCENT}`, borderRadius: 10, marginBottom: 16,
    }}>
      <svg style={{ flexShrink: 0, marginTop: 2 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <p style={{ margin: 0, fontSize: 13.5, color: TEXT, lineHeight: 1.65 }}>
        <strong>{label}</strong> {text}
      </p>
    </div>
  );
}

function ArticleSection({ heading, content, tipLabel }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ margin: "0 0 14px 0", fontSize: 18, fontWeight: 800, color: TEXT, lineHeight: 1.3 }}>{heading}</h2>
      {(content || []).map((block, i) => {
        if (block.type === "p") return <Paragraph key={i} text={block.text} />;
        if (block.type === "list") return <BulletList key={i} items={block.items || []} />;
        if (block.type === "tip") return <Tip key={i} label={tipLabel} text={block.text} />;
        if (block.type === "visual") return <div key={i}>{renderVisual(block)}</div>;
        return null;
      })}
    </div>
  );
}

export default function HelpArticlePage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const bodies = t("help.articleBodies", { returnObjects: true }) || {};
  const article = bodies[slug];
  const tipLabel = t("help.articleChrome.tipLabel");
  useDocumentTitle(
    article?.title ? `${article.title} | PartLister` : undefined,
  );

  if (!article || typeof article !== "object" || !Array.isArray(article.sections)) {
    return <Navigate to="/help" replace />;
  }

  return (
    <div style={{ fontFamily: "Plus Jakarta Sans, Arial, sans-serif", background: "#fff", paddingTop: 68 }}>
      <Navbar />

      <div style={{ borderBottom: `1px solid ${BORDER}`, background: "#f7f9fc", padding: "12px 24px" }}>
        <div style={{ maxWidth: 740, margin: "0 auto", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: DIM }}>
          <Link to="/help" style={{ color: ACCENT, textDecoration: "none", fontWeight: 600 }}>
            {t("help.articleChrome.backToHelp")}
          </Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ color: DIM }}>{article.category}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ color: TEXT, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{article.title}</span>
        </div>
      </div>

      <div style={{ maxWidth: 740, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: ACCENT_LIGHT, border: `1px solid ${BORDER}`,
            borderRadius: 999, padding: "3px 12px",
            fontSize: 11, fontWeight: 800, color: ACCENT, letterSpacing: "0.06em",
          }}>{article.category}</span>
          <span style={{ fontSize: 13, color: DIM }}>{article.time}</span>
        </div>

        <h1 style={{
          margin: "0 0 20px 0",
          fontSize: "clamp(26px, 4vw, 36px)",
          fontWeight: 900, color: TEXT, letterSpacing: "-0.5px", lineHeight: 1.15,
        }}>
          {article.title}
        </h1>

        <p style={{
          margin: "0 0 36px 0",
          fontSize: 16, color: MUTED, lineHeight: 1.75,
          borderBottom: `1px solid ${BORDER}`, paddingBottom: 36,
        }}>
          {article.intro}
        </p>

        {article.heroImage && <ArticleImage {...article.heroImage} />}

        {article.sections.map((s, i) => (
          <ArticleSection key={i} heading={s.heading} content={s.content} tipLabel={tipLabel} />
        ))}

        <div style={{
          marginTop: 48, padding: "24px 28px",
          background: "#f7f9fc", border: `1px solid ${BORDER}`,
          borderRadius: 16, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 20, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: TEXT, marginBottom: 4 }}>{t("help.stillNeedHelp")}</div>
            <div style={{ fontSize: 13.5, color: MUTED }}>{t("help.stillNeedHelpBody")}</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link to="/help" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 18px", border: `1.5px solid ${BORDER}`,
              borderRadius: 9, fontSize: 13.5, fontWeight: 700, color: TEXT,
              textDecoration: "none", background: "#fff",
            }}>
              ← {t("help.articleChrome.backToHelp")}
            </Link>
            <Link to="/contact" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 18px", background: ACCENT,
              borderRadius: 9, fontSize: 13.5, fontWeight: 700, color: "#fff",
              textDecoration: "none", boxShadow: "0 4px 14px rgba(19,93,255,0.22)",
            }}>
              {t("help.contactUs")}
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
