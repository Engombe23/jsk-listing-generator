import React from "react";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div style={{ minHeight: "100vh", background: "#08090b", color: "#fff", fontFamily: "Arial, sans-serif", display: "grid", placeItems: "center", textAlign: "center", padding: 40 }}>
      <div>
        <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>Coming soon</div>
        <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Login</div>
        <Link to="/" style={{ color: "#b70017", textDecoration: "none", fontWeight: 600 }}>← Back to home</Link>
      </div>
    </div>
  );
}
