import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../landing/landing-v2.css";
import Navbar from "../landing/Navbar";
import Footer from "../landing/Footer";
import { useSession } from "../context/SessionContext";
import { useDocumentTitle } from "../i18n/useDocumentTitle";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const ACCENT = "#135DFF";
const TEXT   = "#132A46";
const MUTED  = "#4d6a8a";
const DIM    = "#7a96b0";
const BORDER = "#dde7f5";
const RED    = "#dc2626";

/** English values sent to the API; labels come from i18n. */
const SUBJECT_KEYS = [
  ["General Question", "general"],
  ["Technical Support", "technical"],
  ["Bug Report", "bug"],
  ["Feature Request", "feature"],
  ["Billing & Subscription", "billing"],
  ["Partnership Enquiry", "partnership"],
  ["Other", "other"],
];

const MAX_CHARS = 5000;

const baseInput = {
  width: "100%", padding: "11px 14px",
  fontSize: 14, color: TEXT,
  background: "#fff", border: `1px solid ${BORDER}`,
  borderRadius: 10, outline: "none",
  boxSizing: "border-box", fontFamily: "inherit",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const focusedInput = {
  ...baseInput,
  borderColor: ACCENT,
  boxShadow: "0 0 0 3px rgba(19,93,255,0.1)",
};

function Label({ children, required }) {
  return (
    <label style={{ fontSize: 13, fontWeight: 600, color: TEXT, display: "block", marginBottom: 6 }}>
      {children}
      {required && <span style={{ color: RED, marginLeft: 3 }}>*</span>}
    </label>
  );
}

export default function ContactPage() {
  const { t } = useTranslation();
  useDocumentTitle(`${t("contact.title")} | PartLister`);
  const { session } = useSession();

  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [subject,    setSubject]    = useState("");
  const [message,    setMessage]    = useState("");
  const [attachment, setAttachment] = useState(null);
  const [focused,    setFocused]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [reference,  setReference]  = useState("");
  const [error,      setError]      = useState("");

  const textareaRef = useRef(null);
  const fileRef     = useRef(null);

  const inputStyle = (field) => focused === field ? focusedInput : baseInput;

  const handleMessageChange = (e) => {
    setMessage(e.target.value.slice(0, MAX_CHARS));
    e.target.style.height = "auto";
    e.target.style.height = `${Math.max(140, e.target.scrollHeight)}px`;
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setError(t("contact.errors.attachmentTooLarge"));
      return;
    }
    setAttachment(f);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (!name.trim())           return setError(t("contact.errors.nameRequired"));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
                                return setError(t("contact.errors.emailInvalid"));
    if (!subject)               return setError(t("contact.errors.subjectRequired"));
    if (message.trim().length < 10)
                                return setError(t("contact.errors.messageShort"));

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name",    name.trim());
      fd.append("email",   email.trim());
      fd.append("subject", subject);
      fd.append("message", message.trim());
      if (attachment) fd.append("attachment", attachment);

      const headers = {};
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res  = await fetch(`${API_URL}/api/contact`, { method: "POST", headers, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("contact.errors.submitFailed"));
      setReference(data.reference);
      setSuccess(true);
    } catch (err) {
      setError(err.message || t("contact.errors.submitFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName(""); setEmail(""); setSubject(""); setMessage("");
    setAttachment(null); setError(""); setSuccess(false); setReference("");
    if (textareaRef.current) textareaRef.current.style.height = "140px";
  };

  return (
    <>
      <style>{`@keyframes pl-spin { to { transform: rotate(360deg); } } @keyframes pl-fadein { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <Navbar />
      <main style={{ background: "#f8faff", minHeight: "calc(100vh - 62px)" }}>

        <div style={{ textAlign: "center", padding: "104px 24px 48px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "rgba(19,93,255,0.07)", border: "1px solid rgba(19,93,255,0.18)",
            borderRadius: 100, padding: "5px 16px", marginBottom: 22,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              {t("contact.badge")}
            </span>
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: TEXT, margin: "0 0 16px", letterSpacing: -0.8, lineHeight: 1.1 }}>
            {t("contact.title")}
          </h1>
          <p style={{ fontSize: 16, color: MUTED, margin: 0, maxWidth: 460, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
            {t("contact.subtitle")}
          </p>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 96px" }}>
          <div style={{
            background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 20,
            padding: "40px 44px",
            boxShadow: "0 4px 32px rgba(19,51,102,0.07), 0 1px 4px rgba(0,0,0,0.04)",
          }}>

            {success ? (
              <div style={{ textAlign: "center", padding: "12px 0 8px", animation: "pl-fadein 0.4s ease" }}>
                <div style={{
                  width: 68, height: 68, borderRadius: "50%",
                  background: "rgba(22,163,74,0.1)", border: "2px solid rgba(22,163,74,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 22px",
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: TEXT, margin: "0 0 10px" }}>
                  {t("contact.successTitle")}
                </h2>
                <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, margin: "0 0 28px", maxWidth: 380, marginLeft: "auto", marginRight: "auto" }}>
                  {t("contact.successBody")}
                </p>
                <div style={{
                  background: "#f0f5ff", border: "1px solid #c7d9ff",
                  borderRadius: 14, padding: "18px 24px", marginBottom: 32,
                  display: "inline-block", minWidth: 220,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                    {t("contact.referenceId")}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: TEXT, fontFamily: "monospace", letterSpacing: 1 }}>
                    #{reference}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={handleReset}
                    style={{
                      padding: "11px 22px", borderRadius: 11, border: "none",
                      background: "linear-gradient(135deg, #135DFF 0%, #0a3fd9 100%)",
                      color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    {t("contact.sendAnother")}
                  </button>
                  <Link
                    to="/help"
                    style={{
                      padding: "11px 22px", borderRadius: 11,
                      border: `1px solid ${BORDER}`, background: "#fff",
                      color: MUTED, fontSize: 13, fontWeight: 600,
                      textDecoration: "none", display: "inline-flex", alignItems: "center",
                    }}
                  >
                    {t("contact.visitHelp")}
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: 19, fontWeight: 800, color: TEXT, margin: "0 0 5px" }}>
                    {t("contact.formTitle")}
                  </h2>
                  <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.6 }}>
                    {t("contact.formSubtitle")}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <Label required>{t("contact.name")}</Label>
                      <input
                        type="text" value={name} onChange={e => setName(e.target.value)}
                        placeholder={t("contact.namePlaceholder")}
                        style={inputStyle("name")}
                        onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                      />
                    </div>
                    <div>
                      <Label required>{t("contact.email")}</Label>
                      <input
                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder={t("contact.emailPlaceholder")}
                        style={inputStyle("email")}
                        onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label required>{t("contact.subject")}</Label>
                    <div style={{ position: "relative" }}>
                      <select
                        value={subject} onChange={e => setSubject(e.target.value)}
                        style={{
                          ...inputStyle("subject"),
                          appearance: "none", WebkitAppearance: "none",
                          paddingRight: 38,
                          color: subject ? TEXT : DIM,
                          cursor: "pointer",
                        }}
                        onFocus={() => setFocused("subject")} onBlur={() => setFocused(null)}
                      >
                        <option value="" disabled>{t("contact.selectSubject")}</option>
                        {SUBJECT_KEYS.map(([value, key]) => (
                          <option key={value} value={value}>{t(`contact.subjects.${key}`)}</option>
                        ))}
                      </select>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  <div>
                    <Label required>{t("contact.message")}</Label>
                    <textarea
                      ref={textareaRef}
                      value={message} onChange={handleMessageChange}
                      placeholder={t("contact.messagePlaceholder")}
                      style={{
                        ...inputStyle("message"),
                        resize: "vertical", minHeight: 140,
                        lineHeight: 1.65,
                        ...(focused === "message" ? { borderColor: ACCENT, boxShadow: "0 0 0 3px rgba(19,93,255,0.1)" } : {}),
                      }}
                      onFocus={() => setFocused("message")} onBlur={() => setFocused(null)}
                    />
                  </div>

                  <div>
                    {attachment ? (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px", border: `1px solid ${BORDER}`,
                        borderRadius: 10, background: "#f8fafc",
                      }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                        </svg>
                        <span style={{ flex: 1, fontSize: 13, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {attachment.name}
                        </span>
                        <span style={{ fontSize: 11, color: DIM, flexShrink: 0 }}>
                          {(attachment.size / 1024).toFixed(0)} KB
                        </span>
                        <button type="button" onClick={() => setAttachment(null)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: DIM, padding: 2, display: "flex", lineHeight: 1 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <button type="button" onClick={() => fileRef.current?.click()}
                          style={{
                            background: "none", border: "none", cursor: "pointer", padding: 0,
                            display: "flex", alignItems: "center", gap: 7,
                            color: DIM, fontSize: 13, fontFamily: "inherit",
                            transition: "color 0.15s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = ACCENT}
                          onMouseLeave={e => e.currentTarget.style.color = DIM}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                          </svg>
                          {t("contact.attachFile")}
                        </button>
                        <span style={{ fontSize: 12, color: DIM }}>{t("contact.maxFileSize")}</span>
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*,.pdf,.zip"
                      onChange={handleFileChange} style={{ display: "none" }} />
                  </div>

                  {error && (
                    <div style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      background: "#fff5f5", border: "1px solid rgba(220,38,38,0.2)",
                      borderRadius: 10, padding: "12px 14px",
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                        background: RED, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, color: "#fff", fontWeight: 800,
                      }}>!</div>
                      <p style={{ fontSize: 13, color: RED, margin: 0, lineHeight: 1.55 }}>{error}</p>
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    style={{
                      width: "100%", padding: "14px 24px", borderRadius: 12, border: "none",
                      background: loading
                        ? "#94a3b8"
                        : "linear-gradient(135deg, #135DFF 0%, #0a3fd9 100%)",
                      color: "#fff", fontSize: 14, fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "opacity 0.15s", fontFamily: "inherit",
                    }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                  >
                    {loading ? (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          style={{ animation: "pl-spin 0.8s linear infinite" }}>
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                        {t("contact.sending")}
                      </>
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13"/>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                        {t("contact.sendMessage")}
                      </>
                    )}
                  </button>

                  <p style={{ fontSize: 12, color: DIM, textAlign: "center", margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    {t("contact.secureNote")}
                  </p>
                </div>
              </form>
            )}
          </div>

          {!success && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "rgba(19,93,255,0.08)", border: "1px solid rgba(19,93,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{t("contact.lookingForHelp")}</span>
              </div>
              <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
                <Link to="/help" style={{ color: ACCENT, textDecoration: "none", fontWeight: 600 }}>
                  {t("contact.helpCentreLink")}
                </Link>
                {" — "}
                {t("contact.visitHelp")}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
