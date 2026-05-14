import React, { useState } from "react";
import { BUTTON_BASE, primaryButtonStyle } from "./shared.jsx";
import ListingTemplates from "./ListingTemplates.jsx";

// ─── Colour tokens (mirror App / PriceCalculator) ────────────────────────────
const C = {
  bg:      "#0A1628",
  card:    "#0F1E35",
  card2:   "#0a1829",
  border:  "rgba(255,255,255,0.08)",
  border2: "rgba(255,255,255,0.05)",
  blue:    "#135DFF",
  text:    "#e2e8f0",
  muted:   "#6b7280",
  dim:     "#374151",
  green:   "#10b981",
  amber:   "#f59e0b",
  red:     "#ef4444",
};

// ─── Shared primitives ────────────────────────────────────────────────────────
const Divider = () => (
  <div style={{ height: 1, background: C.border2, margin: "20px 0" }} />
);

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 14 }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: C.card2,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: "18px 20px",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: accent || C.text, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function ActionButton({ onClick, children, variant = "ghost", disabled }) {
  const [hov, setHov] = useState(false);
  const styles = {
    primary: { background: hov ? "#1a6bff" : C.blue, color: "#fff", border: `1px solid ${C.blue}` },
    ghost:   { background: hov ? "rgba(255,255,255,0.06)" : "transparent", color: C.text, border: `1px solid ${C.border}` },
    danger:  { background: hov ? "rgba(239,68,68,0.12)" : "transparent", color: C.red, border: "1px solid rgba(239,68,68,0.25)" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...styles[variant],
        padding: "8px 16px", borderRadius: 9, fontSize: 12, fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
        transition: "all 0.15s ease", outline: "none",
      }}
    >
      {children}
    </button>
  );
}

function Badge({ children, color = "#135DFF" }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: 0.9,
      background: `${color}18`, border: `1px solid ${color}35`,
      borderRadius: 5, padding: "2px 8px",
    }}>
      {children}
    </span>
  );
}

// ─── Usage bar ────────────────────────────────────────────────────────────────
function UsageBar({ used, total, color = C.blue }) {
  const pct = Math.min(100, (used / total) * 100);
  const barColor = pct > 85 ? C.red : pct > 65 ? C.amber : color;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: C.muted }}>{used.toLocaleString()} / {total.toLocaleString()}</span>
        <span style={{ fontSize: 11, color: barColor, fontWeight: 700 }}>{pct.toFixed(0)}%</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 99, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

// ─── PAGE: Account ────────────────────────────────────────────────────────────
function AccountPage() {
  const user = { name: "Aaron Butler", email: "aaron@jskcommerce.co.uk", plan: "Pro", avatar: "AB" };
  const usage = { listings: 312, listingsMax: 500, pricing: 48, pricingMax: 100 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Usage banner */}
      <div style={{
        background: C.card2, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: "14px 20px", display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Monthly Usage</div>
          <UsageBar used={usage.listings} total={usage.listingsMax} />
        </div>
        <div style={{ fontSize: 12, color: C.muted, flexShrink: 0, textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>{usage.listings}</div>
          <div>/ {usage.listingsMax} listings</div>
        </div>
      </div>

      {/* Profile card */}
      <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 24px" }}>
        <SectionLabel>Profile</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #135DFF, #0ea5e9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 900, color: "#fff",
          }}>
            {user.avatar}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{user.name}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{user.email}</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <Badge color={C.blue}>{user.plan} Plan</Badge>
          </div>
        </div>

        <Divider />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Row label="Full name" value={user.name} />
          <Row label="Email address" value={user.email} />
          <Row label="Plan" value={<Badge color={C.blue}>{user.plan}</Badge>} />
          <Row label="Member since" value="January 2025" />
        </div>
      </div>

      {/* Actions */}
      <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 24px" }}>
        <SectionLabel>Security</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ActionRow
            label="Password"
            note="Change your account password"
            action={<ActionButton>Change Password</ActionButton>}
          />
          <ActionRow
            label="Google Account"
            note="aaron@jskcommerce.co.uk"
            action={<Badge color={C.green}>Connected</Badge>}
          />
        </div>
      </div>

    </div>
  );
}

// ─── PAGE: Billing ────────────────────────────────────────────────────────────
function BillingPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Current plan */}
      <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 24px" }}>
        <SectionLabel>Current Plan</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.text }}>Pro Plan</div>
          <Badge color={C.green}>Active</Badge>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <Row label="Renewal date" value="15 June 2026" />
          <Row label="Billing cycle" value="Monthly" />
          <Row label="Payment method" value="Visa ending in 4242" />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <ActionButton variant="primary">Manage Billing →</ActionButton>
          <ActionButton variant="ghost">View Invoices</ActionButton>
        </div>
      </div>

      {/* Upgrade */}
      <div style={{
        background: "linear-gradient(135deg, rgba(19,93,255,0.12), rgba(14,165,233,0.08))",
        border: "1px solid rgba(19,93,255,0.25)",
        borderRadius: 14, padding: "22px 24px",
      }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 6 }}>Need more capacity?</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
          Upgrade to Business for unlimited listings, priority support, and team access.
        </div>
        <ActionButton variant="primary">View Plans →</ActionButton>
      </div>

      {/* Billing history */}
      <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 24px" }}>
        <SectionLabel>Billing History</SectionLabel>
        {[
          { date: "15 May 2026",  desc: "Pro Plan — Monthly", amount: "£19.99", status: "Paid" },
          { date: "15 Apr 2026",  desc: "Pro Plan — Monthly", amount: "£19.99", status: "Paid" },
          { date: "15 Mar 2026",  desc: "Pro Plan — Monthly", amount: "£19.99", status: "Paid" },
        ].map((inv, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "11px 0",
            borderBottom: i < 2 ? `1px solid ${C.border2}` : "none",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{inv.desc}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{inv.date}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{inv.amount}</div>
            <Badge color={C.green}>{inv.status}</Badge>
          </div>
        ))}
      </div>

    </div>
  );
}

// ─── PAGE: Usage ──────────────────────────────────────────────────────────────
function UsagePage() {
  const cards = [
    { label: "Listings Generated",     value: "312", sub: "of 500 this month",   accent: C.blue },
    { label: "Smart Pricing Searches", value: "48",  sub: "of 100 this month",   accent: "#0ea5e9" },
    { label: "Compatibility Checks",   value: "27",  sub: "of 200 this month",   accent: "#8b5cf6" },
    { label: "CSV Exports",            value: "9",   sub: "of 50 this month",    accent: C.green },
  ];

  const details = [
    { label: "Listings Generated",     used: 312, total: 500 },
    { label: "Smart Pricing Searches", used: 48,  total: 100 },
    { label: "Compatibility Checks",   used: 27,  total: 200 },
    { label: "CSV Exports",            used: 9,   total: 50  },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Stat cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {cards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      {/* Usage breakdown */}
      <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 24px" }}>
        <SectionLabel>Usage Breakdown</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {details.map((d, i) => (
            <div key={i}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>{d.label}</div>
              <UsageBar used={d.used} total={d.total} />
            </div>
          ))}
        </div>
      </div>

      {/* Reset note */}
      <div style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>
        Usage resets on the 1st of each month · Next reset: 1 June 2026
      </div>

    </div>
  );
}

// ─── PAGE: Saved Listings ─────────────────────────────────────────────────────
function SavedListingsPage({ listings = [] }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");

  const filtered = listings
    .filter(l => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (l.title || "").toLowerCase().includes(q) || (l.sku || "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "date")  return new Date(b.savedAt || 0) - new Date(a.savedAt || 0);
      if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "sku")   return (a.sku || "").localeCompare(b.sku || "");
      return 0;
    });

  const fmtDate = (d) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return "—"; }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by SKU or title…"
          style={{
            flex: 1, padding: "9px 14px", borderRadius: 9, fontSize: 12,
            background: C.card2, border: `1px solid ${C.border}`,
            color: C.text, outline: "none",
          }}
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            padding: "9px 12px", borderRadius: 9, fontSize: 12,
            background: C.card2, border: `1px solid ${C.border}`,
            color: C.text, outline: "none", cursor: "pointer",
          }}
        >
          <option value="date">Newest first</option>
          <option value="title">Title A–Z</option>
          <option value="sku">SKU A–Z</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>

        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "100px 1fr 110px 90px 100px",
          padding: "10px 16px", borderBottom: `1px solid ${C.border}`,
          fontSize: 9, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2,
        }}>
          <span>SKU</span>
          <span>Title</span>
          <span>Saved</span>
          <span>Status</span>
          <span></span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: C.muted }}>
            {listings.length === 0 ? "No saved listings yet." : "No results match your search."}
          </div>
        ) : (
          filtered.map((l, i) => (
            <ListingRow key={l.id || i} listing={l} fmtDate={fmtDate} isLast={i === filtered.length - 1} />
          ))
        )}
      </div>

      <div style={{ fontSize: 11, color: C.muted }}>
        {filtered.length} listing{filtered.length !== 1 ? "s" : ""}
        {search && ` matching "${search}"`}
      </div>
    </div>
  );
}

function ListingRow({ listing: l, fmtDate, isLast }) {
  const [hov, setHov] = useState(false);
  const statusColor = l.status === "exported" ? C.green : l.status === "draft" ? C.amber : C.muted;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "grid", gridTemplateColumns: "100px 1fr 110px 90px 100px",
        alignItems: "center", padding: "11px 16px",
        borderBottom: isLast ? "none" : `1px solid ${C.border2}`,
        background: hov ? "rgba(255,255,255,0.02)" : "transparent",
        transition: "background 0.12s ease",
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: "#7dd3fc", fontFamily: "monospace" }}>
        {l.sku || "—"}
      </span>
      <span style={{
        fontSize: 11, color: C.text,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 12,
      }}>
        {l.title || "Untitled"}
      </span>
      <span style={{ fontSize: 10, color: C.muted }}>{fmtDate(l.savedAt)}</span>
      <span>
        <Badge color={statusColor}>{l.status || "saved"}</Badge>
      </span>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <RowBtn label="Open" />
        <RowBtn label="⋯" />
      </div>
    </div>
  );
}

function RowBtn({ label, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "4px 10px", fontSize: 10, fontWeight: 700, borderRadius: 6,
        background: hov ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${C.border}`, color: C.text,
        cursor: "pointer", transition: "background 0.12s ease",
      }}
    >
      {label}
    </button>
  );
}

// ─── Shared layout helpers ────────────────────────────────────────────────────
function Row({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 11, color: C.muted, width: 130, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
        {typeof value === "string" ? value : value}
      </span>
    </div>
  );
}

function ActionRow({ label, note, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{label}</div>
        {note && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{note}</div>}
      </div>
      {action}
    </div>
  );
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: "account",       label: "Account",            icon: "○" },
  { key: "billing",       label: "Billing",            icon: "◈" },
  { key: "usage",         label: "Usage",              icon: "◫" },
  { key: "savedlistings", label: "Saved Listings",     icon: "≡" },
  { key: "templates",     label: "Listing Templates",  icon: "⬚" },
  { key: "api",           label: "API / Integrations", icon: "⌥", disabled: true },
];

function Sidebar({ active, onChange }) {
  return (
    <div style={{
      width: 190, flexShrink: 0,
      background: C.card2, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: "16px 10px",
      display: "flex", flexDirection: "column", gap: 2,
      alignSelf: "flex-start", position: "sticky", top: 0,
    }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.4, padding: "4px 10px 10px" }}>
        Account
      </div>
      {NAV_ITEMS.map(({ key, label, icon, disabled }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => !disabled && onChange(key)}
            disabled={disabled}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 9,
              background: isActive ? "rgba(19,93,255,0.14)" : "transparent",
              border: isActive ? "1px solid rgba(19,93,255,0.28)" : "1px solid transparent",
              color: disabled ? C.dim : isActive ? "#93c5fd" : C.muted,
              fontSize: 12, fontWeight: isActive ? 700 : 500,
              cursor: disabled ? "not-allowed" : "pointer",
              textAlign: "left", width: "100%", transition: "all 0.12s ease",
            }}
          >
            <span style={{ fontSize: 12, opacity: 0.7 }}>{icon}</span>
            <span>{label}</span>
            {disabled && (
              <span style={{ marginLeft: "auto", fontSize: 8, fontWeight: 800, color: C.dim, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Soon
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Account component ───────────────────────────────────────────────────
export default function Account({ listings = [], initialPage = "account" }) {
  const [activePage, setActivePage] = useState(initialPage);

  const PAGE_TITLES = {
    account:       "Account",
    billing:       "Billing",
    usage:         "Usage",
    savedlistings: "Saved Listings",
    templates:     "Listing Templates",
  };

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

      {/* Sidebar */}
      <Sidebar active={activePage} onChange={setActivePage} />

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Page header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.text }}>{PAGE_TITLES[activePage]}</div>
        </div>

        {activePage === "account"       && <AccountPage />}
        {activePage === "billing"       && <BillingPage />}
        {activePage === "usage"         && <UsagePage />}
        {activePage === "savedlistings" && <SavedListingsPage listings={listings} />}
        {activePage === "templates"     && <ListingTemplates />}
      </div>

    </div>
  );
}

// ─── Profile dropdown (rendered in navbar by App.jsx) ────────────────────────
export function ProfileDropdown({ onNavigate, onClose }) {
  const items = [
    { label: "Account",        icon: "○", page: "account" },
    { label: "Billing",        icon: "◈", page: "billing" },
    { label: "Saved Listings", icon: "≡", page: "savedlistings" },
    { label: "Usage",          icon: "◫", page: "usage" },
    null, // divider
    { label: "Log out",        icon: "→", page: "logout", danger: true },
  ];

  return (
    <div
      style={{
        position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 200,
        background: "#0d1d32", border: `1px solid ${C.border}`,
        borderRadius: 12, padding: "6px", minWidth: 190,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* User summary */}
      <div style={{ padding: "10px 12px 10px", borderBottom: `1px solid ${C.border2}`, marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.text }}>Aaron Butler</div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Pro Plan · 312 / 500 used</div>
      </div>

      {items.map((item, i) => {
        if (!item) return <div key={i} style={{ height: 1, background: C.border2, margin: "4px 0" }} />;
        return (
          <DropdownItem key={item.page} {...item} onClick={() => { onNavigate(item.page); onClose(); }} />
        );
      })}
    </div>
  );
}

function DropdownItem({ icon, label, danger, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "8px 12px", borderRadius: 8, border: "none",
        background: hov ? (danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)") : "transparent",
        color: danger ? C.red : C.text,
        fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left",
        transition: "background 0.12s ease",
      }}
    >
      <span style={{ fontSize: 12, opacity: 0.65 }}>{icon}</span>
      {label}
    </button>
  );
}
