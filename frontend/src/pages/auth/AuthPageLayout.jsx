import { Link } from "react-router-dom";
import "./auth.css";

export default function AuthPageLayout({ title, subtitle, children }) {
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
            ← Back to partlister.app
          </Link>
        </div>
      </div>
    </div>
  );
}
