import React, { useState } from "react";

// ─── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      "#0A1628",
  card:    "#0F1E35",
  card2:   "#080f1e",
  border:  "rgba(255,255,255,0.08)",
  border2: "rgba(255,255,255,0.05)",
  blue:    "#135DFF",
  blueDim: "rgba(19,93,255,0.14)",
  text:    "#e2e8f0",
  sub:     "#94a3b8",
  muted:   "#4b5563",
  dim:     "#1e2d42",
  green:   "#10b981",
  amber:   "#f59e0b",
  red:     "#ef4444",
  teal:    "#0ea5e9",
};

// ─── Primitives ───────────────────────────────────────────────────────────────
const Divider = ({ mt = 16, mb = 16 }) => (
  <div style={{ height: 1, background: C.border2, margin: `${mt}px 0 ${mb}px` }} />
);

function SL({ children }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.6, marginBottom: 12 }}>
      {children}
    </div>
  );
}

function Badge({ children, color = C.blue, size = "md" }) {
  const pad = size === "sm" ? "2px 7px" : "3px 10px";
  const fs  = size === "sm" ? 8 : 9;
  return (
    <span style={{
      fontSize: fs, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: 0.9,
      background: `${color}1a`, border: `1px solid ${color}35`,
      borderRadius: 6, padding: pad, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function Btn({ children, onClick, variant = "ghost", size = "md", full }) {
  const [hov, setHov] = useState(false);
  const pad = size === "sm" ? "6px 14px" : size === "lg" ? "10px 22px" : "8px 16px";
  const fs  = size === "sm" ? 11 : size === "lg" ? 13 : 12;
  const variants = {
    primary: { bg: hov ? "#1a6bff" : C.blue,   color: "#fff",   border: C.blue },
    ghost:   { bg: hov ? "rgba(255,255,255,0.06)" : "transparent", color: C.text, border: C.border },
    subtle:  { bg: hov ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)", color: C.sub,  border: C.border2 },
    danger:  { bg: hov ? "rgba(239,68,68,0.12)" : "transparent", color: C.red,  border: "rgba(239,68,68,0.22)" },
  };
  const v = variants[variant];
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: pad, fontSize: fs, fontWeight: 700, borderRadius: 9,
        background: v.bg, color: v.color, border: `1px solid ${v.border}`,
        cursor: "pointer", transition: "all 0.14s ease", outline: "none",
        width: full ? "100%" : undefined, whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function UsageBar({ used, total, showLabel = true }) {
  const pct = Math.min(100, (used / total) * 100);
  const color = pct > 85 ? C.red : pct > 65 ? C.amber : C.blue;
  return (
    <div>
      {showLabel && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: C.sub }}>{used.toLocaleString()} <span style={{ color: C.muted }}>/ {total.toLocaleString()} listings</span></span>
          <span style={{ fontSize: 11, fontWeight: 700, color }}>{total - used} remaining</span>
        </div>
      )}
      <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius: 99, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

// ─── Hero card ────────────────────────────────────────────────────────────────
function HeroCard({ onNavigate }) {
  const user  = { name: "Aaron Butler", email: "aaron@jskcommerce.co.uk", plan: "Pro", since: "January 2025", avatar: "AB" };
  const usage = { used: 312, total: 500 };

  return (
    <div style={{
      background: `linear-gradient(135deg, #0d1e38 0%, #0a1628 60%, #091520 100%)`,
      border: `1px solid rgba(19,93,255,0.22)`,
      borderRadius: 16,
      padding: "24px 28px",
      boxShadow: "0 0 0 1px rgba(19,93,255,0.08), 0 12px 40px rgba(0,0,0,0.4)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Subtle glow blob */}
      <div style={{
        position: "absolute", top: -40, right: -40, width: 200, height: 200,
        background: "radial-gradient(circle, rgba(19,93,255,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 18, position: "relative" }}>
        {/* Avatar */}
        <div style={{
          width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #135DFF 0%, #0ea5e9 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 900, color: "#fff",
          boxShadow: "0 0 0 3px rgba(19,93,255,0.25), 0 4px 16px rgba(0,0,0,0.4)",
        }}>
          {user.avatar}
        </div>

        {/* Name + plan */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.text, lineHeight: 1 }}>{user.name}</div>
            <Badge color={C.blue}>Pro Plan</Badge>
          </div>
          <div style={{ fontSize: 12, color: C.sub, marginBottom: 16 }}>
            {user.email} · Member since {user.since}
          </div>

          {/* Usage bar */}
          <UsageBar used={usage.used} total={usage.total} />
        </div>

        {/* Manage Plan */}
        <div style={{ flexShrink: 0, paddingTop: 2 }}>
          <Btn variant="primary" size="sm" onClick={() => onNavigate("billing")}>Manage Plan →</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Workspace stat cards ─────────────────────────────────────────────────────
function WorkspaceStats({ listings }) {
  const stats = [
    { label: "Saved Listings",        value: listings.length || 0,   accent: C.teal },
    { label: "Generated This Month",  value: 312,                    accent: C.blue },
    { label: "Most Used Tool",        value: "Pricing",              accent: "#8b5cf6", isText: true },
    { label: "Last Active",           value: "Today",                accent: C.green,  isText: true },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: "14px 16px",
          boxShadow: `0 0 20px ${s.accent}0d`,
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 8 }}>{s.label}</div>
          <div style={{ fontSize: s.isText ? 16 : 24, fontWeight: 900, color: s.accent, lineHeight: 1 }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Quick actions ────────────────────────────────────────────────────────────
function QuickActions({ onPageChange }) {
  const actions = [
    { label: "Generate Listing",       icon: "✦", page: null,          nav: "listing" },
    { label: "Smart Pricing",          icon: "◈", page: null,          nav: "calculator" },
    { label: "Compatibility Checker",  icon: "⌁", page: null,          nav: "compatibility" },
    { label: "Saved Listings",         icon: "≡", page: "savedlistings", nav: null },
  ];
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "14px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.4, flexShrink: 0 }}>
          Quick Actions
        </span>
        <div style={{ flex: 1, display: "flex", gap: 8 }}>
          {actions.map((a, i) => (
            <QuickBtn key={i} icon={a.icon} label={a.label}
              onClick={() => a.page ? onPageChange(a.page) : onPageChange(a.nav, true)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickBtn({ icon, label, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, padding: "8px 10px", borderRadius: 9, fontSize: 11, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        background: hov ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.12)" : C.border2}`,
        color: hov ? C.text : C.sub, cursor: "pointer",
        transition: "all 0.13s ease", outline: "none",
      }}
    >
      <span style={{ fontSize: 11, opacity: 0.8 }}>{icon}</span>
      {label}
    </button>
  );
}

// ─── Profile + Security ───────────────────────────────────────────────────────
function ProfileCard() {
  const rows = [
    { label: "Full name",    value: "Aaron Butler" },
    { label: "Email",        value: "aaron@jskcommerce.co.uk" },
    { label: "Plan",         value: <Badge color={C.blue}>Pro</Badge> },
    { label: "Member since", value: "January 2025" },
  ];
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "18px 20px" }}>
      <SL>Profile</SL>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: C.muted, width: 110, flexShrink: 0 }}>{r.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{r.value}</span>
          </div>
        ))}
      </div>
      <Divider mt={14} mb={14} />
      <SL>Security</SL>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Password</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>Last changed 3 months ago</div>
          </div>
          <Btn size="sm">Change Password</Btn>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Google Account</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>aaron@jskcommerce.co.uk</div>
          </div>
          <Badge color={C.green}>Connected</Badge>
        </div>
      </div>
    </div>
  );
}

// ─── Recent activity ──────────────────────────────────────────────────────────
const ACTIVITY = [
  { icon: "✦", action: "Generated listing",      detail: "N47 Connecting Rod Bearing Set",  time: "2 hours ago",   color: C.blue },
  { icon: "◈", action: "Smart Pricing search",   detail: "D4FD Oil Pump – 60 listings",     time: "5 hours ago",   color: C.teal },
  { icon: "✓", action: "Saved listing",           detail: "M274 Cylinder Head – 271 976",    time: "Yesterday",     color: C.green },
  { icon: "⌁", action: "Compatibility check",    detail: "Golf MK7 – TDI engine codes",     time: "2 days ago",    color: "#8b5cf6" },
  { icon: "↗", action: "CSV export",             detail: "Batch of 12 listings",            time: "3 days ago",    color: C.amber },
];

function RecentActivity() {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "18px 20px" }}>
      <SL>Recent Activity</SL>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {ACTIVITY.map((a, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "9px 0",
            borderBottom: i < ACTIVITY.length - 1 ? `1px solid ${C.border2}` : "none",
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7, flexShrink: 0,
              background: `${a.color}18`, border: `1px solid ${a.color}28`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, color: a.color,
            }}>{a.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{a.action}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.detail}</div>
            </div>
            <span style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PAGE: Account (full) ─────────────────────────────────────────────────────
function AccountPage({ listings, onNavigate, onAppNavigate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <HeroCard onNavigate={onNavigate} />
      <WorkspaceStats listings={listings} />
      <QuickActions onPageChange={(key, isApp) => isApp ? onAppNavigate(key) : onNavigate(key)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <ProfileCard />
        <RecentActivity />
      </div>
    </div>
  );
}

// ─── PAGE: Billing ────────────────────────────────────────────────────────────
function BillingPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "18px 20px" }}>
        <SL>Current Plan</SL>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>Pro Plan</div>
          <Badge color={C.green}>Active</Badge>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 16 }}>
          {[
            ["Renewal date",    "15 June 2026"],
            ["Billing cycle",   "Monthly"],
            ["Payment method",  "Visa ···· 4242"],
          ].map(([l, v], i) => (
            <div key={i} style={{ display: "flex", gap: 10 }}>
              <span style={{ fontSize: 11, color: C.muted, width: 120, flexShrink: 0 }}>{l}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="primary" size="sm">Manage Billing →</Btn>
          <Btn variant="ghost"   size="sm">View Invoices</Btn>
        </div>
      </div>

      <div style={{
        background: "linear-gradient(135deg, rgba(19,93,255,0.10), rgba(14,165,233,0.06))",
        border: "1px solid rgba(19,93,255,0.22)", borderRadius: 13, padding: "16px 20px",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 4 }}>Need more capacity?</div>
          <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.6 }}>Upgrade to Business for unlimited listings, priority support, and team access.</div>
        </div>
        <Btn variant="primary" size="sm">View Plans →</Btn>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "18px 20px" }}>
        <SL>Billing History</SL>
        {[
          { date: "15 May 2026", desc: "Pro Plan — Monthly", amount: "£19.99" },
          { date: "15 Apr 2026", desc: "Pro Plan — Monthly", amount: "£19.99" },
          { date: "15 Mar 2026", desc: "Pro Plan — Monthly", amount: "£19.99" },
        ].map((inv, i, arr) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", padding: "9px 0",
            borderBottom: i < arr.length - 1 ? `1px solid ${C.border2}` : "none",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{inv.desc}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{inv.date}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.text, marginRight: 12 }}>{inv.amount}</div>
            <Badge color={C.green} size="sm">Paid</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PAGE: Usage ──────────────────────────────────────────────────────────────
function UsagePage() {
  const stats = [
    { label: "Listings Generated",     used: 312, total: 500,  accent: C.blue },
    { label: "Smart Pricing Searches", used: 48,  total: 100,  accent: C.teal },
    { label: "Compatibility Checks",   used: 27,  total: 200,  accent: "#8b5cf6" },
    { label: "CSV Exports",            used: 9,   total: 50,   accent: C.green },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {stats.map((s, i) => {
          const pct = Math.min(100, (s.used / s.total) * 100);
          return (
            <div key={i} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: "14px 16px", boxShadow: `0 0 18px ${s.accent}0c`,
            }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.accent, lineHeight: 1, marginBottom: 10 }}>{s.used}</div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: s.accent, borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 5 }}>{s.total - s.used} of {s.total} remaining</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: C.muted, textAlign: "center", padding: "4px 0" }}>
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
      if (sortBy === "sku")   return (a.sku   || "").localeCompare(b.sku   || "");
      return 0;
    });

  const fmtDate = d => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return "—"; }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by SKU or title…"
          style={{ flex: 1, padding: "8px 12px", borderRadius: 9, fontSize: 12, background: C.card, border: `1px solid ${C.border}`, color: C.text, outline: "none" }} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 9, fontSize: 12, background: C.card, border: `1px solid ${C.border}`, color: C.text, outline: "none", cursor: "pointer" }}>
          <option value="date">Newest first</option>
          <option value="title">Title A–Z</option>
          <option value="sku">SKU A–Z</option>
        </select>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "90px 1fr 100px 80px 96px",
          padding: "8px 16px", borderBottom: `1px solid ${C.border}`,
          fontSize: 9, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2,
        }}>
          <span>SKU</span><span>Title</span><span>Saved</span><span>Status</span><span></span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: "36px 20px", textAlign: "center", fontSize: 12, color: C.muted }}>
            {listings.length === 0 ? "No saved listings yet." : "No results match your search."}
          </div>
        ) : filtered.map((l, i) => <ListingRow key={l.id || i} listing={l} fmtDate={fmtDate} isLast={i === filtered.length - 1} />)}
      </div>
      <div style={{ fontSize: 10, color: C.muted }}>{filtered.length} listing{filtered.length !== 1 ? "s" : ""}{search && ` matching "${search}"`}</div>
    </div>
  );
}

function ListingRow({ listing: l, fmtDate, isLast }) {
  const [hov, setHov] = useState(false);
  const statusColor = l.status === "exported" ? C.green : l.status === "draft" ? C.amber : C.muted;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "grid", gridTemplateColumns: "90px 1fr 100px 80px 96px",
        alignItems: "center", padding: "9px 16px",
        borderBottom: isLast ? "none" : `1px solid ${C.border2}`,
        background: hov ? "rgba(255,255,255,0.02)" : "transparent", transition: "background 0.12s",
      }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#7dd3fc", fontFamily: "monospace" }}>{l.sku || "—"}</span>
      <span style={{ fontSize: 11, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 10 }}>{l.title || "Untitled"}</span>
      <span style={{ fontSize: 10, color: C.muted }}>{fmtDate(l.savedAt)}</span>
      <span><Badge color={statusColor} size="sm">{l.status || "saved"}</Badge></span>
      <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
        <MiniBtn>Open</MiniBtn><MiniBtn>⋯</MiniBtn>
      </div>
    </div>
  );
}

function MiniBtn({ children, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: "3px 9px", fontSize: 10, fontWeight: 700, borderRadius: 6,
        background: hov ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${C.border}`, color: C.text,
        cursor: "pointer", transition: "background 0.1s",
      }}>{children}</button>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { key: "account",       label: "Account",          icon: "○" },
  { key: "billing",       label: "Billing",          icon: "◈" },
  { key: "usage",         label: "Usage",            icon: "◫" },
  { key: "savedlistings", label: "Saved Listings",   icon: "≡" },
  { key: "api",           label: "API / Integrations", icon: "⌥", disabled: true },
];

function Sidebar({ active, onChange }) {
  return (
    <div style={{
      width: 186, flexShrink: 0, alignSelf: "flex-start", position: "sticky", top: 0,
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 8px",
      display: "flex", flexDirection: "column", gap: 2,
    }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.6, padding: "2px 10px 10px" }}>
        Account
      </div>
      {NAV.map(({ key, label, icon, disabled }) => {
        const on = active === key;
        return (
          <button key={key} disabled={disabled} onClick={() => !disabled && onChange(key)}
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
              padding: "9px 12px", borderRadius: 9,
              background: on ? "rgba(19,93,255,0.16)" : "transparent",
              border: on ? "1px solid rgba(19,93,255,0.32)" : "1px solid transparent",
              color: disabled ? C.muted : on ? "#93c5fd" : C.sub,
              fontSize: 13, fontWeight: on ? 700 : 500,
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "all 0.13s ease",
            }}
            onMouseEnter={e => { if (!disabled && !on) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={e => { if (!disabled && !on) e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ fontSize: 13, width: 16, textAlign: "center", opacity: on ? 1 : 0.6 }}>{icon}</span>
            <span style={{ flex: 1 }}>{label}</span>
            {disabled && (
              <span style={{ fontSize: 8, fontWeight: 800, color: C.muted, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border2}`, borderRadius: 4, padding: "2px 6px", textTransform: "uppercase", letterSpacing: 0.6 }}>
                Soon
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function Account({ listings = [], initialPage = "account", onAppNavigate }) {
  const [activePage, setActivePage] = useState(initialPage);

  const TITLES = { account: "Account", billing: "Billing", usage: "Usage", savedlistings: "Saved Listings" };

  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
      <Sidebar active={activePage} onChange={setActivePage} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 18, display: "flex", alignItems: "baseline", gap: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>{TITLES[activePage]}</div>
          {activePage === "account" && (
            <span style={{ fontSize: 11, color: C.muted }}>Your workspace overview</span>
          )}
        </div>
        {activePage === "account"       && <AccountPage listings={listings} onNavigate={setActivePage} onAppNavigate={onAppNavigate} />}
        {activePage === "billing"       && <BillingPage />}
        {activePage === "usage"         && <UsagePage />}
        {activePage === "savedlistings" && <SavedListingsPage listings={listings} />}
      </div>
    </div>
  );
}

// ─── Profile dropdown (navbar) ────────────────────────────────────────────────
export function ProfileDropdown({ onNavigate, onClose }) {
  const items = [
    { label: "Account",        icon: "○", page: "account" },
    { label: "Billing",        icon: "◈", page: "billing" },
    { label: "Saved Listings", icon: "≡", page: "savedlistings" },
    { label: "Usage",          icon: "◫", page: "usage" },
    null,
    { label: "Log out",        icon: "→", page: "logout", danger: true },
  ];
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 200,
      background: "#0b1828", border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 6, minWidth: 196,
      boxShadow: "0 8px 36px rgba(0,0,0,0.55)",
    }}>
      <div style={{ padding: "10px 12px 10px", borderBottom: `1px solid ${C.border2}`, marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.text }}>Aaron Butler</div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Pro Plan · 312 / 500 used</div>
      </div>
      {items.map((item, i) => {
        if (!item) return <div key={i} style={{ height: 1, background: C.border2, margin: "4px 0" }} />;
        return <DropItem key={item.page} {...item} onClick={() => { onNavigate(item.page); onClose(); }} />;
      })}
    </div>
  );
}

function DropItem({ icon, label, danger, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "8px 12px", borderRadius: 8, border: "none",
        background: hov ? (danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)") : "transparent",
        color: danger ? C.red : C.text,
        fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left", transition: "background 0.12s",
      }}>
      <span style={{ fontSize: 11, opacity: 0.6, width: 14, textAlign: "center" }}>{icon}</span>
      {label}
    </button>
  );
}
