import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./auth.css";

export default function AuthPageLayout({ title, subtitle, children }) {
  const { t } = useTranslation();
  return (
    <div
      className="auth-page"
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div className="auth-card">
        <img src="/logo.png" alt="PartLister" className="auth-logo" />
        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        {children}
        <div className="text-center" style={{ marginTop: 24 }}>
          <Link to="/" className="auth-back-link">
            {t("auth.backToSite")}
          </Link>
        </div>
      </div>
    </div>
  );
}
