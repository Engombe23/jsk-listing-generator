import { Link } from "react-router-dom";
import "./auth.css";

export default function AuthPageLayout({ title, subtitle, children }) {
  return (
    <div
      className="auth-page"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0A1628 0%, #071020 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div className="auth-card">
        <Link to="/about" className="auth-back-link">
          ← Back
        </Link>
        <img src="/logo.png" alt="PartLister" className="auth-logo" />
        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
