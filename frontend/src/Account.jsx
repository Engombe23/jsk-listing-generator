import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import ListingTemplates from "./ListingTemplates.jsx";
import { loadPreferences, savePreferences, PREF_DEFAULTS } from "./useListingPreferences.js";
import { useSession } from "./context/SessionContext";
import { useTheme } from "./context/ThemeContext";
import { supabase } from "./lib/supabaseClient";
import { formatPlanLabel, openBillingPortal } from "./lib/billing";
import { getBillingLabel, getDisplayPrice, getNextPlan, getPlan } from "./lib/plans";

function useAuthUser() {
  const { session } = useSession();
  return useMemo(() => {
    const user = session?.user;
    const email = user?.email ?? "";
    const meta = user?.user_metadata ?? {};
    const displayName =
      meta.full_name ||
      meta.name ||
      (email ? email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "User");
    const initials = displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || (email[0]?.toUpperCase() ?? "?");
    const memberSince = user?.created_at
      ? new Date(user.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
      : "—";
    return { user, email, displayName, initials, memberSince };
  }, [session]);
}

// ─── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      "var(--bg)",
  card:    "var(--bg-nav)",
  card2:   "var(--bg-surface2)",
  border:  "var(--border)",
  border2: "var(--border-light)",
  blue:    "var(--blue)",
  text:    "var(--text)",
  sub:     "var(--text-muted)",
  muted:   "var(--text-muted)",
  dim:     "var(--text-dim)",
  green:   "var(--green)",
  amber:   "var(--yellow)",
  red:     "var(--red)",
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
    primary: { bg: hov ? "var(--blue)" : C.blue,   color: "var(--text-on-dark)",   border: C.blue },
    ghost:   { bg: hov ? "var(--border-light)" : "transparent", color: C.text, border: C.border },
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
      <div style={{ height: 4, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

// ─── PAGE: Account ────────────────────────────────────────────────────────────
function AccountPage({ onOpenBilling }) {
  const navigate = useNavigate();
  const { email, displayName, initials, memberSince, user } = useAuthUser();
  const { plan, listingLimit, listingsUsed, refreshPlan } = useSession();
  const planInfo = getPlan(plan);
  const usageTotal = listingLimit ?? null;
  const usageUsed = listingsUsed;

  useEffect(() => {
    if (user?.id) refreshPlan();
  }, [user?.id, refreshPlan]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth/login", { replace: true });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Profile */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #135DFF, #0ea5e9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: "var(--text-on-dark)",
          }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{displayName}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{email || "—"}</div>
          </div>
          <Badge color={user?.email_confirmed_at ? C.green : C.amber}>
            {user?.email_confirmed_at ? "Verified" : "Unverified"}
          </Badge>
        </div>

        <div style={{ marginBottom: 0 }}>
          <InfoRow label="Member since" value={memberSince} />
          <div style={{ borderBottom: "none" }}>
            <InfoRow label="Current plan" value={formatPlanLabel(plan)} />
            {usageTotal != null && (
              <InfoRow label="Monthly usage" value={
                <div style={{ flex: 1, maxWidth: 260 }}>
                  <UsageBar used={usageUsed} total={usageTotal} />
                </div>
              } />
            )}
            {usageTotal == null && planInfo?.listings && (
              <InfoRow label="Monthly allowance" value={planInfo.listings} />
            )}
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
            action={
              <Link to="/auth/update-password" style={{ textDecoration: "none" }}>
                <Btn>Change Password</Btn>
              </Link>
            }
          />
          <ActionRow
            label="Sign out"
            note="End your session on this device"
            action={<Btn variant="danger" onClick={handleLogout}>Log out</Btn>}
          />
          <div style={{ borderBottom: "none" }}>
            <ActionRow
              label="Manage Subscription"
              note="Billing, plan changes, and invoices"
              action={
                <Btn variant="primary" onClick={onOpenBilling}>
                  Open Billing →
                </Btn>
              }
            />
          </div>
        </div>
      </Card>

    </div>
  );
}

// ─── PAGE: Billing ────────────────────────────────────────────────────────────
function BillingPage() {
  const navigate = useNavigate();
  const { plan, profile, refreshPlan } = useSession();
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");

  const planInfo = getPlan(plan);
  const interval = profile?.billing_interval || "monthly";
  const displayPrice = plan !== "free" && planInfo ? getDisplayPrice(plan, interval) : null;
  const status = profile?.subscription_status;
  const isActive = ["active", "trialing"].includes(status);
  const nextPlan = getNextPlan(plan);

  useEffect(() => {
    refreshPlan();
  }, [refreshPlan]);

  const openPortal = async () => {
    if (!profile?.stripe_customer_id) {
      navigate("/pricing");
      return;
    }
    setPortalLoading(true);
    setError("");
    try {
      const { url } = await openBillingPortal(profile.stripe_customer_id);
      if (url) window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Plan */}
      <Card>
        <SL>Current Plan</SL>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: C.text }}>
            {plan === "free" ? "No active plan" : `${planInfo?.name || formatPlanLabel(plan)} Plan`}
          </span>
          {plan !== "free" && (
            <Badge color={isActive ? C.green : status === "past_due" ? C.amber : C.red}>
              {isActive ? "Active" : status ? status.replace(/_/g, " ") : "Pending"}
            </Badge>
          )}
        </div>
        <div>
          {plan !== "free" && displayPrice && (
            <InfoRow label="Price" value={`${displayPrice}/mo · ${getBillingLabel(interval)}`} />
          )}
          {planInfo?.listings && (
            <InfoRow label="Listings" value={planInfo.listings} />
          )}
          {interval && plan !== "free" && (
            <InfoRow label="Billing cycle" value={interval === "annual" ? "Annual" : "Monthly"} />
          )}
          <div style={{ borderBottom: "none" }}>
            <InfoRow
              label="Payment & invoices"
              value={profile?.stripe_customer_id ? "Managed via Stripe" : "Not set up yet"}
            />
          </div>
        </div>
        {error && (
          <div style={{ marginTop: 12, fontSize: 11, color: C.red }}>{error}</div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {profile?.stripe_customer_id ? (
            <>
              <Btn variant="primary" onClick={openPortal} disabled={portalLoading}>
                {portalLoading ? "Opening…" : "Manage Billing →"}
              </Btn>
              <Btn onClick={openPortal} disabled={portalLoading}>View Invoices</Btn>
            </>
          ) : (
            <Btn variant="primary" onClick={() => navigate("/pricing")}>Choose a Plan →</Btn>
          )}
        </div>
      </Card>

      {/* Upgrade */}
      {nextPlan && (
        <div style={{
          background: "linear-gradient(135deg, rgba(19,93,255,0.10), rgba(14,165,233,0.06))",
          border: "1px solid var(--border-blue)", borderRadius: 12, padding: "16px 20px",
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 4 }}>
            Need more capacity?
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
            Upgrade to {getPlan(nextPlan)?.name} for {getPlan(nextPlan)?.listings?.toLowerCase()}
            {nextPlan === "growth" ? ", compatibility checker, smart pricing, and priority support" : ", bulk tools, and early access features"}.
          </div>
          <Btn variant="primary" onClick={() => navigate("/pricing")}>View Plans →</Btn>
        </div>
      )}

      {/* Billing note */}
      <Card>
        <SL>Billing History</SL>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
          {profile?.stripe_customer_id
            ? "Invoices and payment history are available in the Stripe billing portal."
            : "Subscribe to a plan to start billing. Your plan details will appear here after checkout."}
        </div>
        {profile?.stripe_customer_id && (
          <div style={{ marginTop: 14 }}>
            <Btn onClick={openPortal} disabled={portalLoading}>Open Billing Portal →</Btn>
          </div>
        )}
      </Card>

    </div>
  );
}

// ─── PAGE: Appearance ─────────────────────────────────────────────────────────
function AppearancePage() {
  const { theme, setTheme } = useTheme();
  const options = [
    { key: "light",  label: "Light",  desc: "Clean white interface" },
    { key: "dark",   label: "Dark",   desc: "Dark navy interface" },
    { key: "system", label: "System", desc: "Follow OS setting" },
  ];
  return (
    <Card>
      <SL>Appearance</SL>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
        Choose how Part Lister looks to you. Your preference is saved locally and will persist across sessions.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {options.map(({ key, label, desc }) => {
          const active = theme === key;
          return (
            <button
              key={key}
              onClick={() => setTheme(key)}
              style={{
                flex: 1, padding: "14px 12px", borderRadius: 10, cursor: "pointer",
                border: active ? `2px solid ${C.blue}` : `2px solid ${C.border}`,
                background: active ? "var(--blue-bg)" : "var(--bg-surface)",
                color: active ? "var(--text-accent)" : C.muted,
                textAlign: "center", transition: "all 0.15s",
                boxShadow: active ? "0 0 0 3px var(--blue-glow)" : "none",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>
                {key === "light" ? "☀️" : key === "dark" ? "🌙" : "💻"}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{desc}</div>
            </button>
          );
        })}
      </div>
    </Card>
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
  background: "var(--bg-surface3)", border: `1px solid ${C.border}`,
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
        <option key={o.value ?? o} value={o.value ?? o} style={{ background: "var(--bg-surface3)" }}>
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
  { key: "account",    label: "Account",            icon: "○" },
  { key: "billing",    label: "Billing",            icon: "◈" },
  { key: "appearance", label: "Appearance",         icon: "◑" },
  { key: "templates",  label: "Listing Templates",  icon: "⬚" },
  { key: "preferences",label: "Listing Preferences",icon: "⚙" },
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
            color: active_ ? "var(--text-accent)" : C.muted,
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
  account:    "Account",
  billing:    "Billing",
  appearance: "Appearance",
  templates:  "Listing Templates",
  preferences:"Listing Preferences",
};

const PAGE_SUBS = {
  preferences: "Default values applied to every generated listing. Override per listing as needed.",
  templates:   "Reusable listing templates with placeholder support.",
};

export default function Account({ initialPage = "account" }) {
  const [page, setPage] = useState(initialPage);

  useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);

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

        {page === "account"     && <AccountPage onOpenBilling={() => setPage("billing")} />}
        {page === "billing"     && <BillingPage />}
        {page === "appearance"  && <AppearancePage />}
        {page === "templates"   && <ListingTemplates />}
        {page === "preferences" && <ListingPreferencesPage />}
      </div>
    </div>
  );
}

// ─── Profile dropdown (used in App.jsx navbar) ────────────────────────────────
export function ProfileDropdown({ onNavigate, onClose }) {
  const navigate = useNavigate();
  const { email, displayName } = useAuthUser();

  const handleItemClick = async (page) => {
    if (page === "logout") {
      await supabase.auth.signOut();
      onClose();
      navigate("/auth/login", { replace: true });
      return;
    }
    onNavigate(page);
    onClose();
  };
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
      background: "var(--bg-surface)", border: `1px solid ${C.border}`,
      borderRadius: 11, padding: "5px", minWidth: 185,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}>
      <div style={{ padding: "9px 11px 9px", borderBottom: `1px solid ${C.border2}`, marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.text }}>{displayName}</div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{email || "Signed in"}</div>
      </div>

      {items.map((item, i) => {
        if (!item) return <div key={i} style={{ height: 1, background: C.border2, margin: "3px 0" }} />;
        return <DropdownItem key={item.page} {...item} onClick={() => handleItemClick(item.page)} />;
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
        background: hov ? (danger ? "rgba(239,68,68,0.09)" : "var(--border-light)") : "transparent",
        color: danger ? C.red : C.text,
        fontSize: 11, fontWeight: 600, cursor: "pointer", textAlign: "left",
        transition: "background 0.1s",
      }}>
      <span style={{ fontSize: 11, opacity: 0.6 }}>{icon}</span>
      {label}
    </button>
  );
}
