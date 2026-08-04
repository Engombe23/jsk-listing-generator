import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../landing/landing-v2.css";
import Navbar from "../landing/Navbar";
import Footer from "../landing/Footer";
import { useDocumentTitle } from "../i18n/useDocumentTitle";

const ACCENT      = "#135DFF";
const TEXT        = "#132A46";
const MUTED       = "#4d6a8a";
const DIM         = "#7a96b0";
const BORDER      = "#dde7f5";
const ACCENT_LIGHT = "#EEF5FF";

const TOPIC_STYLES = [
  { bg: ACCENT_LIGHT, border: BORDER, stroke: "#135DFF", icon: "doc" },
  { bg: "#f0fdf4", border: "#bbf7d0", stroke: "#16a34a", icon: "edit" },
  { bg: "#faf5ff", border: "#e9d5ff", stroke: "#7c3aed", icon: "link" },
  { bg: "#fffbeb", border: "#fde68a", stroke: "#d97706", icon: "chart" },
];

function TopicIcon({ kind, stroke }) {
  if (kind === "edit") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    );
  }
  if (kind === "link") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    );
  }
  if (kind === "chart") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function ArticleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function ChevronDown({ open }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}` }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, padding: "16px 0", background: "none", border: "none", cursor: "pointer",
          textAlign: "start",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: TEXT, lineHeight: 1.4 }}>{q}</span>
        <ChevronDown open={open} />
      </button>
      {open && (
        <p style={{ margin: "0 0 16px 0", fontSize: 13.5, color: MUTED, lineHeight: 1.7 }}>{a}</p>
      )}
    </div>
  );
}

export default function HelpPage() {
  const { t } = useTranslation();
  useDocumentTitle(`${t("help.title")} | PartLister`);
  const [openLeft, setOpenLeft]   = useState(null);
  const [openRight, setOpenRight] = useState(null);

  const topics = t("help.topics", { returnObjects: true }) || [];
  const articles = t("help.articles", { returnObjects: true }) || [];
  const faqsLeft = t("help.faqsLeft", { returnObjects: true }) || [];
  const faqsRight = t("help.faqsRight", { returnObjects: true }) || [];

  return (
    <div style={{ fontFamily: "Plus Jakarta Sans, Arial, sans-serif", background: "#fff" }}>
      <Navbar />

      <div style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(180deg, #f0f5ff 0%, #ffffff 100%)",
        padding: "96px 24px 72px",
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <img src="/parts-pattern-outline.png" alt="" aria-hidden="true" style={{
          position: "absolute", left: -40, top: "50%", transform: "translateY(-50%)",
          width: 320, opacity: 0.07, pointerEvents: "none", userSelect: "none",
        }} />
        <img src="/parts-pattern-outline.png" alt="" aria-hidden="true" style={{
          position: "absolute", right: -40, top: "50%", transform: "translateY(-50%) scaleX(-1)",
          width: 320, opacity: 0.07, pointerEvents: "none", userSelect: "none",
        }} />

        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: ACCENT_LIGHT, border: `1px solid ${BORDER}`,
            borderRadius: 999, padding: "5px 14px",
            fontSize: 11, fontWeight: 800, color: ACCENT, letterSpacing: "0.08em",
            marginBottom: 20,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {t("help.badge")}
          </div>

          <h1 style={{
            margin: "0 0 14px 0", fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 900, color: TEXT, letterSpacing: "-1px", lineHeight: 1.1,
          }}>
            {t("help.title")}
          </h1>
          <p style={{ margin: "0 0 32px 0", fontSize: 16, color: MUTED, lineHeight: 1.6 }}>
            {t("help.subtitle")}
          </p>

          <div style={{ position: "relative" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: "absolute", insetInlineStart: 18, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder={t("help.searchPlaceholder")}
              style={{
                width: "100%", padding: "15px 18px 15px 44px",
                fontSize: 14, color: TEXT,
                background: "#fff", border: `1.5px solid ${BORDER}`,
                borderRadius: 99, outline: "none",
                boxSizing: "border-box", fontFamily: "inherit",
                boxShadow: "0 2px 12px rgba(19,45,70,0.07)",
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ marginBottom: 60 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TEXT }}>{t("help.popularTopics")}</h2>
            <Link to="/help" style={{ fontSize: 13, fontWeight: 700, color: ACCENT, textDecoration: "none" }}>
              {t("help.viewAllTopics")}
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {Array.isArray(topics) && topics.map((topic, i) => {
              const style = TOPIC_STYLES[i] || TOPIC_STYLES[0];
              return (
                <div
                  key={topic.title}
                  style={{
                    background: "#fff", border: `1px solid ${BORDER}`,
                    borderRadius: 14, padding: "18px 16px",
                    cursor: "pointer", transition: "box-shadow 0.15s, border-color 0.15s",
                    display: "flex", flexDirection: "column", gap: 10,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(19,93,255,0.1)";
                    e.currentTarget.style.borderColor = ACCENT;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = BORDER;
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: style.bg, border: `1px solid ${style.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <TopicIcon kind={style.icon} stroke={style.stroke} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, marginBottom: 4 }}>{topic.title}</div>
                    <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{topic.desc}</div>
                  </div>
                  <div style={{ marginTop: "auto" }}>
                    <ChevronRight />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 60 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TEXT }}>{t("help.guidesTutorials")}</h2>
            <Link to="/help" style={{ fontSize: 13, fontWeight: 700, color: ACCENT, textDecoration: "none" }}>
              {t("help.viewAllArticles")}
            </Link>
          </div>

          <div style={{
            background: "#fff", border: `1px solid ${BORDER}`,
            borderRadius: 16, overflow: "hidden",
          }}>
            {Array.isArray(articles) && articles.map((a, i) => (
              <Link
                key={a.slug}
                to={`/help/articles/${a.slug}`}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 20px",
                  borderBottom: i < articles.length - 1 ? `1px solid ${BORDER}` : "none",
                  cursor: "pointer", transition: "background 0.12s",
                  textDecoration: "none", color: "inherit",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = ACCENT_LIGHT; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: ACCENT_LIGHT, border: `1px solid ${BORDER}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <ArticleIcon />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{a.title}</div>
                  <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>{a.desc}</div>
                </div>
                <span style={{ fontSize: 12, color: DIM, whiteSpace: "nowrap", marginInlineEnd: 10 }}>{a.time}</span>
                <ChevronRight />
              </Link>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Link to="/help" style={{
              display: "inline-block", padding: "10px 24px",
              fontSize: 13.5, fontWeight: 700, color: ACCENT,
              border: `1.5px solid ${ACCENT}`, borderRadius: 10,
              textDecoration: "none", transition: "background 0.15s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = ACCENT_LIGHT; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {t("help.browseAllArticles")}
            </Link>
          </div>
        </div>

        <div style={{ marginBottom: 60 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TEXT }}>{t("help.faqTitle")}</h2>
            <Link to="/help" style={{ fontSize: 13, fontWeight: 700, color: ACCENT, textDecoration: "none" }}>
              {t("help.viewAllFaqs")}
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px" }}>
            <div>
              {Array.isArray(faqsLeft) && faqsLeft.map((f, i) => (
                <FaqItem
                  key={f.q}
                  q={f.q}
                  a={f.a}
                  open={openLeft === i}
                  onToggle={() => setOpenLeft(openLeft === i ? null : i)}
                />
              ))}
            </div>
            <div>
              {Array.isArray(faqsRight) && faqsRight.map((f, i) => (
                <FaqItem
                  key={f.q}
                  q={f.q}
                  a={f.a}
                  open={openRight === i}
                  onToggle={() => setOpenRight(openRight === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
          background: "#fff", border: `1px solid ${BORDER}`,
          borderRadius: 16, padding: "28px 32px",
          marginBottom: 48,
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
              background: ACCENT_LIGHT, border: `1px solid ${BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: TEXT, marginBottom: 4 }}>{t("help.stillNeedHelp")}</div>
              <div style={{ fontSize: 13.5, color: MUTED }}>{t("help.stillNeedHelpBody")}</div>
            </div>
          </div>
          <Link
            to="/contact"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 24px", background: ACCENT, color: "#fff",
              fontSize: 14, fontWeight: 700, borderRadius: 10,
              textDecoration: "none", whiteSpace: "nowrap",
              boxShadow: "0 4px 14px rgba(19,93,255,0.25)",
            }}
          >
            {t("help.contactUs")} →
          </Link>
        </div>

        <div style={{ textAlign: "center", padding: "0 0 16px" }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: ACCENT_LIGHT, border: `1px solid ${BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
          </div>
          <h3 style={{ margin: "0 0 10px 0", fontSize: 18, fontWeight: 800, color: TEXT }}>{t("help.lookingElseTitle")}</h3>
          <p style={{ margin: "0 0 16px 0", fontSize: 14, color: MUTED, lineHeight: 1.6, maxWidth: 380, marginInline: "auto" }}>
            {t("help.lookingElseBody")}
          </p>
          <Link to="/contact" style={{ fontSize: 14, fontWeight: 700, color: ACCENT, textDecoration: "none" }}>
            {t("help.contactUs")}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
