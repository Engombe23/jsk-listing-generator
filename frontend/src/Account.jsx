import React, { useState, useEffect } from "react";
import ListingTemplates from "./ListingTemplates.jsx";
import { loadPreferences, savePreferences, PREF_DEFAULTS } from "./useListingPreferences.js";

// ─── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      "#0A1628",
  card:    "#0F1E35",
  card2:   "#0a1829",
  border:  "rgba(255,255,255,0.08)",
  border2: "rgba(255,255,255,0.05)",
  blue:    "#135DFF",
  text:    "#e2e8f0",
  sub:     "#94a3b8",
  muted:   "#6b7280",
  dim:     "#1e2d42",
  green:   "#10b981",
  amber:   "#f59e0b",
  red:     "#ef4444",
};

// ─── Primitives ───────────────────────────────────────────────────────────────
function SL({ children }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 800, color: C.muted, textTransform: "uppercase",
      letterSpacing: 1.5, marginBottom: 12 }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: C.border2, margin: "16px 0" }} />;
}

function Card({ children, style }) {
  return (
    <div style={{
      background: C.card2, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "18px 20px", ...style,
    }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = "ghost", disabled }) {
  const [hov, setHov] = useState(false);
  const v = {
    primary: { bg: hov ? "#1a6bff" : C.blue,   color: "#fff",   border: C.blue },
    ghost:   { bg: hov ? "rgba(255,255,255,0.06)" : "transparent", color: C.text, border: C.border },
    danger:  { bg: hov ? "rgba(239,68,68,0.1)"  : "transparent", color: C.red,  border: "rgba(239,68,68,0.25)" },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: "7px 14px", fontSize: 11, fontWeight: 700, borderRadius: 8,
        background: v.bg, color: v.color, border: `1px solid ${v.border}`,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
        transition: "all 0.13s", outline: "none",
      }}>
      {children}
    </button>
  );
}

function Badge({ children, color = C.blue }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: 0.8,
      background: `${color}18`, border: `1px solid ${color}30`,
      borderRadius: 5, padding: "2px 8px",
    }}>{children}</span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0",
      borderBottom: `1px solid ${C.border2}` }}>
      <span style={{ fontSize: 11, color: C.muted, width: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
        {typeof value === "string" ? value : value}
      </span>
    </div>
  );
}

function ActionRow({ label, note, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
      borderBottom: `1px solid ${C.border2}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{label}</div>
        {note && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{note}</div>}
      </div>
      {action}
    </div>
  );
}

function UsageBar({ used, total }) {
  const pct = Math.min(100, (used / total) * 100);
  const color = pct > 85 ? C.red : pct > 65 ? C.amber : C.blue;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: C.sub }}>{used.toLocaleString()} / {total.toLocaleString()} listings</span>
        <span style={{ fontSize: 11, color, fontWeight: 700 }}>{pct.toFixed(0)}%</span>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

// ─── PAGE: Account ────────────────────────────────────────────────────────────
function AccountPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Profile */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #135DFF, #0ea5e9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: "#fff",
          }}>AB</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Aaron Butler</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>aaron@jskcommerce.co.uk</div>
          </div>
          <Badge color={C.blue}>Pro Plan</Badge>
        </div>

        <div style={{ marginBottom: 0 }}>
          <InfoRow label="Member since" value="January 2025" />
          <div style={{ borderBottom: "none" }}>
            <InfoRow label="Monthly usage" value={
              <div style={{ flex: 1, maxWidth: 260 }}>
                <UsageBar used={312} total={500} />
              </div>
            } />
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card>
        <SL>Security</SL>
        <div>
          <ActionRow
            label="Password"
            note="Update your account password"
            action={<Btn>Change Password</Btn>}
          />
          <div style={{ borderBottom: "none" }}>
            <ActionRow
              label="Manage Subscription"
              note="Billing, plan changes, and invoices"
              action={<Btn variant="primary">Open Billing →</Btn>}
            />
          </div>
        </div>
      </Card>

    </div>
  );
}

// ─── PAGE: Billing ────────────────────────────────────────────────────────────
function BillingPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Plan */}
      <Card>
        <SL>Current Plan</SL>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: C.text }}>Pro Plan</span>
          <Badge color={C.green}>Active</Badge>
        </div>
        <div>
          <InfoRow label="Renewal date"     value="15 June 2026" />
          <InfoRow label="Billing cycle"    value="Monthly" />
          <div style={{ borderBottom: "none" }}>
            <InfoRow label="Payment method" value="Visa ending in 4242" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Btn variant="primary">Manage Billing →</Btn>
          <Btn>View Invoices</Btn>
        </div>
      </Card>

      {/* Upgrade */}
      <div style={{
        background: "linear-gradient(135deg, rgba(19,93,255,0.10), rgba(14,165,233,0.06))",
        border: "1px solid rgba(19,93,255,0.22)", borderRadius: 12, padding: "16px 20px",
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 4 }}>Need more capacity?</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
          Upgrade to Business for unlimited listings, priority support, and team access.
        </div>
        <Btn variant="primary">View Plans →</Btn>
      </div>

      {/* Billing history */}
      <Card>
        <SL>Billing History</SL>
        {[
          { date: "15 May 2026", desc: "Pro Plan — Monthly", amount: "£19.99" },
          { date: "15 Apr 2026", desc: "Pro Plan — Monthly", amount: "£19.99" },
          { date: "15 Mar 2026", desc: "Pro Plan — Monthly", amount: "£19.99" },
        ].map((inv, i, arr) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "9px 0",
            borderBottom: i < arr.length - 1 ? `1px solid ${C.border2}` : "none",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{inv.desc}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{inv.date}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>{inv.amount}</span>
            <Badge color={C.green}>Paid</Badge>
          </div>
        ))}
      </Card>

    </div>
  );
}

// ─── PAGE: Listing Preferences ────────────────────────────────────────────────
const CONDITIONS = ["", "New", "New other (see details)", "Manufacturer refurbished", "Used", "Parts only"];
const LANGUAGES  = ["English (UK)", "English (US)", "German", "French", "Spanish", "Italian", "Dutch", "Polish"];
const CURRENCIES = ["GBP", "USD", "EUR", "AUD", "CAD", "CHF", "SEK", "NOK", "DKK"];
const COUNTRIES  = [
  "", "United Kingdom", "Germany", "France", "Italy", "Spain", "China", "Japan",
  "United States", "Taiwan", "South Korea", "Netherlands", "Poland", "Czech Republic", "Turkey",
];

function PrefRow({ label, hint, children }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 16,
      padding: "11px 0", borderBottom: `1px solid ${C.border2}`,
    }}>
      <div style={{ width: 180, flexShrink: 0, paddingTop: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{label}</div>
        {hint && <div style={{ fontSize: 10, color: C.muted, marginTop: 2, lineHeight: 1.5 }}>{hint}</div>}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

const inputBase = {
  width: "100%", padding: "7px 10px", borderRadius: 7, fontSize: 11,
  background: "#060e1a", border: `1px solid ${C.border}`,
  color: C.text, outline: "none", boxSizing: "border-box",
  caretColor: C.blue, fontFamily: "inherit",
};

function PrefInput({ value, onChange, placeholder }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder || "Leave blank to use generated value"}
      style={inputBase} />
  );
}

function PrefSelect({ value, onChange, options, narrow }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ ...inputBase, width: narrow ? "auto" : "100%", cursor: "pointer",
        color: value ? C.text : C.muted }}>
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o} style={{ background: "#0a1628" }}>
          {o.label ?? (o === "" ? "— Not set —" : o)}
        </option>
      ))}
    </select>
  );
}

function PrefTextarea({ value, onChange, placeholder }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder || "Leave blank to use generated value"}
      rows={3}
      style={{ ...inputBase, resize: "vertical", lineHeight: 1.6 }} />
  );
}

function PrefGroup({ title, children }) {
  const kids = React.Children.toArray(children);
  return (
    <Card style={{ marginBottom: 14 }}>
      <SL>{title}</SL>
      <div>
        {kids.map((child, i) =>
          i === kids.length - 1
            ? React.cloneElement(child, { key: i, style: { ...child.props?.style, borderBottom: "none" } })
            : React.cloneElement(child, { key: i })
        )}
      </div>
    </Card>
  );
}

function ListingPreferencesPage() {
  const [prefs,     setPrefs]     = useState(loadPreferences);
  const [saved,     setSaved]     = useState(false);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("jsk_listing_templates_v1");
      setTemplates(raw ? JSON.parse(raw) : []);
    } catch { setTemplates([]); }
  }, []);

  const set = (key, val) => { setPrefs(p => ({ ...p, [key]: val })); setSaved(false); };

  const handleSave = () => {
    savePreferences(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const templateOptions = [
    { value: "", label: "— No default —" },
    ...templates.map(t => ({ value: t.id, label: t.name })),
  ];

  return (
    <div>

      <PrefGroup title="General Defaults">
        <PrefRow label="Default Brand">
          <PrefInput value={prefs.brand} onChange={v => set("brand", v)} placeholder="e.g. Aftermarket" />
        </PrefRow>
        <PrefRow label="Default Warranty">
          <PrefInput value={prefs.warranty} onChange={v => set("warranty", v)} placeholder="e.g. 12 Months" />
        </PrefRow>
        <PrefRow label="Country of Manufacture">
          <PrefSelect value={prefs.countryOfMfr} onChange={v => set("countryOfMfr", v)} options={COUNTRIES} />
        </PrefRow>
        <PrefRow label="Default Condition">
          <PrefSelect value={prefs.condition} onChange={v => set("condition", v)} options={CONDITIONS} />
        </PrefRow>
      </PrefGroup>

      <PrefGroup title="Localisation">
        <PrefRow label="Language">
          <PrefSelect value={prefs.language} onChange={v => set("language", v)} options={LANGUAGES} narrow />
        </PrefRow>
        <PrefRow label="Currency">
          <PrefSelect value={prefs.currency} onChange={v => set("currency", v)} options={CURRENCIES} narrow />
        </PrefRow>
      </PrefGroup>

      <PrefGroup title="Template Defaults">
        <PrefRow label="Default Template" hint="Applied when generating listings">
          <PrefSelect value={prefs.defaultTemplateId} onChange={v => set("defaultTemplateId", v)} options={templateOptions} />
        </PrefRow>
        <PrefRow label="Default Shipping">
          <PrefTextarea value={prefs.shippingText} onChange={v => set("shippingText", v)}
            placeholder="e.g. Free UK delivery. Dispatched within 1 business day." />
        </PrefRow>
        <PrefRow label="Default Returns">
          <PrefTextarea value={prefs.returnsText} onChange={v => set("returnsText", v)}
            placeholder="e.g. 30-day returns accepted. Buyer pays return postage." />
        </PrefRow>
      </PrefGroup>

      {/* Save bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 18px", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10,
      }}>
        <span style={{ fontSize: 11, color: saved ? C.green : C.muted }}>
          {saved ? "✓ Saved" : "Unsaved changes"}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={() => { setPrefs({ ...PREF_DEFAULTS }); setSaved(false); }}>Reset</Btn>
          <Btn variant="primary" onClick={handleSave}>Save Preferences</Btn>
        </div>
      </div>

    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: "account",     label: "Account",             icon: "○" },
  { key: "billing",     label: "Billing",             icon: "◈" },
  { key: "templates",   label: "Listing Templates",   icon: "⬚" },
  { key: "preferences", label: "Listing Preferences", icon: "⚙" },
];

function Sidebar({ active, onChange }) {
  return (
    <div style={{
      width: 180, flexShrink: 0,
      background: C.card2, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "12px 8px",
      alignSelf: "flex-start", position: "sticky", top: 0,
    }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: C.muted, textTransform: "uppercase",
        letterSpacing: 1.4, padding: "2px 10px 10px" }}>
        Account
      </div>
      {NAV_ITEMS.map(({ key, label, icon }) => {
        const active_ = active === key;
        return (
          <button key={key} onClick={() => onChange(key)} style={{
            display: "flex", alignItems: "center", gap: 9, width: "100%",
            padding: "8px 10px", borderRadius: 8, border: "none",
            background: active_ ? "rgba(19,93,255,0.13)" : "transparent",
            color: active_ ? "#93c5fd" : C.muted,
            fontSize: 12, fontWeight: active_ ? 700 : 500,
            cursor: "pointer", textAlign: "left", transition: "all 0.12s",
          }}>
            <span style={{ fontSize: 11, opacity: 0.65 }}>{icon}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  account:     "Account",
  billing:     "Billing",
  templates:   "Listing Templates",
  preferences: "Listing Preferences",
};

const PAGE_SUBS = {
  preferences: "Default values applied to every generated listing. Override per listing as needed.",
  templates:   "Reusable listing templates with placeholder support.",
};

export default function Account({ initialPage = "account" }) {
  const [page, setPage] = useState(initialPage);

  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
      <Sidebar active={page} onChange={setPage} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>{PAGE_TITLES[page]}</div>
          {PAGE_SUBS[page] && (
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{PAGE_SUBS[page]}</div>
          )}
        </div>

        {page === "account"     && <AccountPage />}
        {page === "billing"     && <BillingPage />}
        {page === "templates"   && <ListingTemplates />}
        {page === "preferences" && <ListingPreferencesPage />}
      </div>
    </div>
  );
}

// ─── Profile dropdown (used in App.jsx navbar) ────────────────────────────────
export function ProfileDropdown({ onNavigate, onClose }) {
  const items = [
    { label: "Account",              icon: "○", page: "account" },
    { label: "Billing",              icon: "◈", page: "billing" },
    { label: "Listing Templates",    icon: "⬚", page: "templates" },
    { label: "Listing Preferences",  icon: "⚙", page: "preferences" },
    null,
    { label: "Log out", icon: "→", page: "logout", danger: true },
  ];

  return (
    <div style={{
      position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 200,
      background: "#0d1d32", border: `1px solid ${C.border}`,
      borderRadius: 11, padding: "5px", minWidth: 185,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}>
      <div style={{ padding: "9px 11px 9px", borderBottom: `1px solid ${C.border2}`, marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.text }}>Aaron Butler</div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Pro · 312 / 500 listings</div>
      </div>

      {items.map((item, i) => {
        if (!item) return <div key={i} style={{ height: 1, background: C.border2, margin: "3px 0" }} />;
        return <DropdownItem key={item.page} {...item} onClick={() => { onNavigate(item.page); onClose(); }} />;
      })}
    </div>
  );
}

function DropdownItem({ icon, label, danger, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 9, width: "100%",
        padding: "7px 11px", borderRadius: 7, border: "none",
        background: hov ? (danger ? "rgba(239,68,68,0.09)" : "rgba(255,255,255,0.05)") : "transparent",
        color: danger ? C.red : C.text,
        fontSize: 11, fontWeight: 600, cursor: "pointer", textAlign: "left",
        transition: "background 0.1s",
      }}>
      <span style={{ fontSize: 11, opacity: 0.6 }}>{icon}</span>
      {label}
    </button>
  );
}
