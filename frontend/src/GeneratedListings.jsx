import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SMALL_BUTTON_STYLE, INPUT_STYLE, CopyButton } from "./shared.jsx";
import { mapApiSpecsToSchema, SPEC_SCHEMA, SECTION_TITLES } from "./itemSpecificsSchema.js";
import { loadPreferences } from "./useListingPreferences.js";
import { useSession } from "./context/SessionContext";

// ─── API URL (mirrors ListingGenerator) ──────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL;

// ─── Theme list (mirrors App.jsx) ─────────────────────────────────────────────

const LS_THEME_KEY = "jsk_theme_v2";
const LS_OPTIONS_KEY = "jsk_listing_options_v1";
const THEME_IDS = ["clean-default", "table-focused", "minimal", "professional-blue"];
const DEFAULT_LISTING_OPTIONS = {
  showCompatibilityTable: true,
  showInterchangeableNumbers: true,
  showEngineCodes: true,
};

function getListingOptions() {
  try {
    return { ...DEFAULT_LISTING_OPTIONS, ...JSON.parse(localStorage.getItem(LS_OPTIONS_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_LISTING_OPTIONS };
  }
}

function buildLookupBody({ articleNumber, themeId }) {
  return {
    articleNumber,
    themeId,
    listingOptions: getListingOptions(),
    targetMarketplace: loadPreferences().targetMarketplace || "ebay-uk",
  };
}

// ─── AdLister export settings ─────────────────────────────────────────────────

const LS_ADLISTER_SETTINGS_KEY = "jsk_adlister_settings_v1";

const DEFAULT_ADLISTER_SETTINGS = {
  startingPrice:      "0.00",
  webPrice:           "",
  condition:          "New",
  qty:                "1",
  dispatch:           "1",
  storeCat:           "",
  storeCat2:          "",
  ebayCatId:          "",
  ebayCat2Id:         "",
  // Domestic shipping (3 slots)
  dom1Service:        "AU_POST_STANDARD",
  dom1Cost:           "0.00",
  dom1Add:            "0.00",
  dom2Service:        "",
  dom2Cost:           "",
  dom2Add:            "",
  dom3Service:        "",
  dom3Cost:           "",
  dom3Add:            "",
  // International shipping (3 slots)
  intl1Service:       "INT_STANDARD",
  intl1Cost:          "20.00",
  intl1Add:           "5.00",
  intl2Service:       "",
  intl2Cost:          "",
  intl2Add:           "",
  intl3Service:       "",
  intl3Cost:          "",
  intl3Add:           "",
  // Best Offer
  bestOfferEnabled:   "0",
  bestOfferAccept:    "",
  bestOfferDecline:   "",
  // Ref
  refType:            "",
  refId:              "",
};

function loadAdlisterSettings() {
  try {
    const s = localStorage.getItem(LS_ADLISTER_SETTINGS_KEY);
    return s ? { ...DEFAULT_ADLISTER_SETTINGS, ...JSON.parse(s) } : { ...DEFAULT_ADLISTER_SETTINGS };
  } catch { return { ...DEFAULT_ADLISTER_SETTINGS }; }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso, language) => {
  try {
    return new Date(iso).toLocaleDateString(language, {
      day: "2-digit", month: "short", year: "numeric"
    });
  } catch { return "—"; }
};

function todayStr()     { return new Date().toISOString().slice(0, 10); }
function yesterdayStr() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function escCsv(v) {
  const s = String(v ?? "");
  return (s.includes(",") || s.includes('"') || s.includes("\n"))
    ? `"${s.replace(/"/g, '""')}"` : s;
}

// Always wrap in double-quotes — used for HTML description cells so the
// entire block is treated as one CSV field regardless of its content.
function forceQuoteCsv(v) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a"); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// Flatten HTML to a single line — required for eBay / AdLister CSV upload
function sanitizeHtmlForExport(html) {
  if (!html) return "";
  return html.replace(/\r?\n|\r/g, " ").replace(/\s{2,}/g, " ").trim();
}

// Resolve item specifics for a listing.
// Uses custom_specifics (user-edited, stored on the listing) when present;
// otherwise falls back to the auto-mapped schema from API data.
function getSpecs(listing) {
  if (listing.custom_specifics?.length > 0) return listing.custom_specifics;
  const prefs = loadPreferences();
  return mapApiSpecsToSchema(listing, {
    brand:        prefs.brand,
    warranty:     prefs.warranty,
    countryOfMfr: prefs.countryOfMfr,
    sku:          listing.sku,
  });
}

function getSavedTheme() {
  try { return localStorage.getItem(LS_THEME_KEY) || "clean-default"; } catch { return "clean-default"; }
}

function makeSpecId() {
  return `sp${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function DescriptionBadge({ hasDescription }) {
  const { t } = useTranslation();
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: hasDescription ? "rgba(74,222,128,0.10)" : "var(--border-light)",
      color:      hasDescription ? "var(--green)"               : "var(--text-muted)",
      border:     hasDescription ? "1px solid rgba(74,222,128,0.22)" : "1px solid var(--border)",
      whiteSpace: "nowrap"
    }}>
      {hasDescription ? t("saved.generated") : t("saved.notGenerated")}
    </span>
  );
}

function StatusBadge({ status }) {
  const { t } = useTranslation();
  const isDraft    = status === "Draft";
  const isExported = status === "Exported";
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: isDraft    ? "rgba(251,191,36,0.12)"  :
                  isExported ? "rgba(74,222,128,0.12)"  : "rgba(99,102,241,0.12)",
      color:      isDraft    ? "var(--yellow)"                :
                  isExported ? "var(--green)"                : "#a5b4fc",
      border:     isDraft    ? "1px solid rgba(251,191,36,0.25)"  :
                  isExported ? "1px solid rgba(74,222,128,0.25)"  : "1px solid rgba(99,102,241,0.25)"
    }}>
      {isDraft ? t("saved.statusDraft") : isExported ? t("saved.statusExported") : status || t("saved.statusDraft")}
    </span>
  );
}

// ─── Date filter bar ──────────────────────────────────────────────────────────

function DateFilterBar({ filter, onFilter, customFrom, customTo, onCustomFrom, onCustomTo }) {
  const { t } = useTranslation();
  const FILTERS = [
    { key: "all",       label: t("saved.filterAll") },
    { key: "today",     label: t("saved.filterToday") },
    { key: "yesterday", label: t("saved.filterYesterday") },
    { key: "custom",    label: t("saved.filterCustom") },
  ];
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      {FILTERS.map(({ key, label }) => {
        const active = filter === key;
        return (
          <button key={key} onClick={() => onFilter(key)} style={{
            padding: "6px 14px", borderRadius: 10, fontSize: 12, cursor: "pointer",
            border:     active ? "1px solid #135DFF" : "1px solid var(--border-strong)",
            background: active ? "var(--border-blue)" : "transparent",
            color:      active ? "var(--text-accent)" : "var(--text-muted)",
            fontWeight: active ? 700 : 400, transition: "all 0.14s"
          }}>
            {label}
          </button>
        );
      })}
      {filter === "custom" && (
        <>
          <input type="date" value={customFrom} onChange={(e) => onCustomFrom(e.target.value)}
            style={{ ...INPUT_STYLE, padding: "5px 8px", fontSize: 12, width: 140 }} />
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{t("saved.filterTo")}</span>
          <input type="date" value={customTo} onChange={(e) => onCustomTo(e.target.value)}
            style={{ ...INPUT_STYLE, padding: "5px 8px", fontSize: 12, width: 140 }} />
        </>
      )}
    </div>
  );
}

// ─── AdLister settings panel ──────────────────────────────────────────────────
// Collapsible, persists to localStorage on every change.

function AdListerSettings() {
  const { t } = useTranslation();
  const [s, setS] = useState(loadAdlisterSettings);

  const set = (key, val) => {
    const next = { ...s, [key]: val };
    setS(next);
    try { localStorage.setItem(LS_ADLISTER_SETTINGS_KEY, JSON.stringify(next)); } catch {}
  };

  const inp = (label, key, placeholder = "") => (
    <div key={key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <label style={{
        fontSize: 10, fontWeight: 700, color: "var(--text-dim)",
        textTransform: "uppercase", letterSpacing: 0.4
      }}>{label}</label>
      <input
        value={s[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        style={{
          background: "var(--border-light)", border: "1px solid var(--border)",
          borderRadius: 6, color: "var(--text)", fontSize: 12, padding: "5px 8px",
          outline: "none", width: "100%", boxSizing: "border-box"
        }}
      />
    </div>
  );

  const sectionLabel = (text) => (
    <div style={{
      gridColumn: "1 / -1", fontSize: 10, fontWeight: 800, color: "var(--text-muted)",
      textTransform: "uppercase", letterSpacing: 0.6,
      paddingBottom: 4, borderBottom: "1px solid var(--border-light)", marginTop: 4
    }}>{text}</div>
  );

  return (
    <div style={{
      background: "var(--bg-surface3)", borderRadius: 12, padding: "16px 18px",
      border: "1px solid rgba(99,102,241,0.20)", display: "grid", gap: 14
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "#a5b4fc", letterSpacing: 0.6, textTransform: "uppercase" }}>
        {t("saved.adlisterDefaults")}
      </div>

      {/* General */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
        {sectionLabel(t("saved.sectionListing"))}
        {inp(t("saved.startingPrice"), "startingPrice", "0.00")}
        {inp(t("saved.webPrice"),      "webPrice",      ""    )}
        {inp(t("saved.qty"),           "qty",           "1"   )}
        {inp(t("saved.condition"),     "condition",     "New" )}
        {inp(t("saved.dispatchDays"),  "dispatch",      "1"   )}
        {inp(t("saved.ebayCategory"),  "ebayCatId",     ""    )}
        {inp(t("saved.ebayCategory2"), "ebayCat2Id",    ""    )}
        {inp(t("saved.storeCategory"), "storeCat",      ""    )}
        {inp(t("saved.storeCategory2"),"storeCat2",     ""    )}
      </div>

      {/* Domestic Shipping */}
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{
          fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase",
          letterSpacing: 0.6, paddingBottom: 4, borderBottom: "1px solid var(--border-light)"
        }}>{t("saved.domesticShipping")}</div>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
            {inp(t("saved.serviceN", { n }), `dom${n}Service`, n === 1 ? "AU_POST_STANDARD" : "")}
            {inp(t("saved.costN", { n }),    `dom${n}Cost`,    "0.00")}
            {inp(t("saved.addN", { n }),     `dom${n}Add`,     "0.00")}
          </div>
        ))}
      </div>

      {/* International Shipping */}
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{
          fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase",
          letterSpacing: 0.6, paddingBottom: 4, borderBottom: "1px solid var(--border-light)"
        }}>{t("saved.internationalShipping")}</div>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
            {inp(t("saved.serviceN", { n }), `intl${n}Service`, n === 1 ? "INT_STANDARD" : "")}
            {inp(t("saved.costN", { n }),    `intl${n}Cost`,    n === 1 ? "20.00" : "")}
            {inp(t("saved.addN", { n }),     `intl${n}Add`,     n === 1 ? "5.00"  : "")}
          </div>
        ))}
      </div>

      {/* Best Offer */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <div style={{
          gridColumn: "1 / -1", fontSize: 10, fontWeight: 800, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: 0.6,
          paddingBottom: 4, borderBottom: "1px solid var(--border-light)"
        }}>{t("saved.bestOffer")}</div>
        {inp(t("saved.enabled01"), "bestOfferEnabled", "0")}
        {inp(t("saved.acceptPrice"),  "bestOfferAccept",  ""  )}
        {inp(t("saved.declinePrice"), "bestOfferDecline", ""  )}
      </div>

      {/* Ref */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{
          gridColumn: "1 / -1", fontSize: 10, fontWeight: 800, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: 0.6,
          paddingBottom: 4, borderBottom: "1px solid var(--border-light)"
        }}>{t("saved.reference")}</div>
        {inp(t("saved.refType"), "refType", "")}
        {inp(t("saved.refId"),   "refId",   "")}
      </div>
    </div>
  );
}

// ─── Table style constants ────────────────────────────────────────────────────

const COL = { padding: "10px 12px", fontSize: 13, borderBottom: "1px solid var(--border-light)" };
const HDR = {
  ...COL, fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
  textTransform: "uppercase", letterSpacing: "0.05em",
  background: "var(--bg-surface3)", borderBottom: "1px solid var(--border)", padding: "9px 12px"
};

// ─── Listings table ───────────────────────────────────────────────────────────

function CopyHtmlButton({ html }) {
  const { t } = useTranslation();
  return (
    <CopyButton
      value={html}
      copiedLabel="✓"
      title={t("saved.copyHtmlTitle")}
      style={{
        padding: "3px 7px", borderRadius: 6, fontSize: 12,
        border: "1px solid var(--border-strong)",
        background: "var(--border-light)",
        color: "var(--text-muted)",
        fontWeight: 600, whiteSpace: "nowrap",
        boxShadow: "none",
      }}
    >
      {t("saved.copy")}
    </CopyButton>
  );
}

function ListingsTable({
  listings, selectedIds, onToggleOne, onToggleAll,
  onDeleteOne, onStatusChange, onGenerateOne, onOpenDetail, generatingIds
}) {
  const { t, i18n } = useTranslation();
  const allSelected = listings.length > 0 && listings.every((l) => selectedIds.includes(l.id));

  if (listings.length === 0) {
    return (
      <div style={{
        minHeight: 200, display: "grid", placeItems: "center",
        background: "var(--bg-surface3)", border: "1px dashed var(--border)",
        borderRadius: 16, color: "var(--text-muted)", fontSize: 14
      }}>
        {t("saved.emptyFilter")}
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1160 }}>
          <thead>
            <tr>
              <th style={{ ...HDR, width: 40 }}>
                <input type="checkbox" checked={allSelected} onChange={onToggleAll}
                  style={{ cursor: "pointer", accentColor: "var(--blue)" }} />
              </th>
              <th style={{ ...HDR, width: 108 }}>{t("saved.columns.article")}</th>
              <th style={HDR}>{t("saved.columns.title")}</th>
              <th style={{ ...HDR, width: 118 }}>{t("saved.columns.description")}</th>
              <th style={{ ...HDR, width: 120 }}>{t("saved.columns.type")}</th>
              <th style={{ ...HDR, width: 140 }}>{t("saved.columns.kNumbers")}</th>
              <th style={{ ...HDR, width: 170 }}>{t("saved.columns.oemNumbers")}</th>
              <th style={{ ...HDR, width: 96 }}>{t("saved.columns.date")}</th>
              <th style={{ ...HDR, width: 88 }}>{t("saved.columns.status")}</th>
              <th style={{ ...HDR, width: 100, textAlign: "center" }}>{t("saved.columns.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l, idx) => {
              const checked  = selectedIds.includes(l.id);
              const type     = l.product_type || "—";
              const oem      = (l.oem_numbers || []).slice(0, 2).join(", ") +
                               ((l.oem_numbers?.length || 0) > 2 ? ` +${l.oem_numbers.length - 2}` : "");
              const kNums    = (l.k_number_list || []).slice(0, 2).join(", ") +
                               ((l.k_number_list?.length || 0) > 2 ? ` +${l.k_number_list.length - 2}` : "");
              const hasDesc  = !!l.description_html?.trim();
              const isGen    = generatingIds.includes(l.id);
              const bg       = checked ? "rgba(19,93,255,0.07)" : idx % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent";

              return (
                <tr key={l.id} style={{ background: bg, transition: "background 0.1s" }}>
                  <td style={{ ...COL, textAlign: "center" }}>
                    <input type="checkbox" checked={checked} onChange={() => onToggleOne(l.id)}
                      style={{ cursor: "pointer", accentColor: "var(--blue)" }} />
                  </td>
                  <td style={{ ...COL, color: "var(--text-accent)", fontFamily: "monospace", fontSize: 12 }}>
                    {l.article_number || "—"}
                  </td>
                  <td style={{ ...COL, color: "var(--text)", fontWeight: 600, maxWidth: 220 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.title || "—"}
                    </div>
                    {l.compatibility_count > 0 && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        {t("saved.vehicleApplications", { n: l.compatibility_count })}
                      </div>
                    )}
                  </td>
                  <td style={COL}>
                    <DescriptionBadge hasDescription={hasDesc} />
                  </td>
                  <td style={{ ...COL, color: "var(--text)", maxWidth: 120, fontSize: 12 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{type}</div>
                  </td>
                  <td style={{ ...COL, color: "var(--text-muted)", fontSize: 12, maxWidth: 140 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {kNums || "—"}
                    </div>
                  </td>
                  <td style={{ ...COL, color: "var(--text-muted)", fontSize: 12, maxWidth: 170 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {oem || "—"}
                    </div>
                  </td>
                  <td style={{ ...COL, color: "var(--text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                    {fmtDate(l.savedAt, i18n.language)}
                  </td>
                  <td style={COL}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <StatusBadge status={l.status} />
                      {l.status === "Exported" && (
                        <button onClick={() => onStatusChange(l.id, "Draft")} title={t("saved.resetToDraft")}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 11, padding: "1px 4px" }}>
                          ↺
                        </button>
                      )}
                    </div>
                  </td>
                  <td style={{ ...COL, textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "center", alignItems: "center" }}>

                      {/* ⚡ Generate description — shown only when missing */}
                      {!hasDesc && (
                        <button
                          onClick={() => onGenerateOne(l.id)}
                          disabled={isGen}
                          title={isGen ? t("saved.generating") : t("saved.generateDescription")}
                          style={{
                            padding: "3px 7px", borderRadius: 6, fontSize: 12,
                            cursor: isGen ? "default" : "pointer",
                            border:      "1px solid rgba(19,93,255,0.30)",
                            background:  isGen ? "var(--border-light)" : "rgba(19,93,255,0.14)",
                            color:       isGen ? "var(--text-dim)" : "var(--text-accent)",
                            fontWeight: 600, transition: "all 0.14s"
                          }}
                        >
                          {isGen ? "…" : "+"}
                        </button>
                      )}

                      {/* 📋 Copy HTML — shown when description exists */}
                      {hasDesc && <CopyHtmlButton html={l.description_html} />}

                      {/* ↗ View / Edit */}
                      <button
                        onClick={() => onOpenDetail(l.id)}
                        title={t("saved.viewEdit")}
                        style={{
                          padding: "3px 8px", borderRadius: 6, fontSize: 12,
                          cursor: "pointer",
                          border:     "1px solid var(--border-strong)",
                          background: "var(--border-light)", color: "var(--text)",
                          fontWeight: 600, transition: "all 0.14s"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border-strong)"; e.currentTarget.style.color = "var(--text)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--border-light)"; e.currentTarget.style.color = "var(--text)"; }}
                      >
                        ↗
                      </button>

                      {/* × Delete */}
                      <button
                        onClick={() => onDeleteOne(l.id)}
                        title={t("saved.deleteListing")}
                        style={{
                          width: 24, height: 24, borderRadius: 6,
                          border: "1px solid rgba(220,38,38,0.15)",
                          background: "rgba(220,38,38,0.06)", color: "var(--text-muted)",
                          cursor: "pointer", fontSize: 13,
                          display: "inline-flex", alignItems: "center", justifyContent: "center"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--red)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
                      >×</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Detail: Specifics editor ─────────────────────────────────────────────────
// Lightweight editable table used inside ListingDetail.
// Renders section header rows as non-editable dividers.

function DetailSpecificsEditor({ rows, onChange }) {
  const { t } = useTranslation();
  const updateRow  = (id, field, val) => onChange(rows.map((r) => r.id === id ? { ...r, [field]: val } : r));
  const deleteRow  = (id) => onChange(rows.filter((r) => r.id !== id));
  const addRow     = () => onChange([...rows, { id: makeSpecId(), label: "", value: "", section: "Additional", keys: [] }]);

  const elements = [];
  let lastSection = null;

  rows.forEach((row, i) => {
    if (row.section !== lastSection) {
      lastSection = row.section;
      elements.push(
        <tr key={`sec-${row.section}-${i}`}>
          <td colSpan={3} style={{
            padding: "7px 10px 3px", fontSize: 10, fontWeight: 800,
            color: "var(--text-dim)", letterSpacing: "0.08em", textTransform: "uppercase",
            background: "var(--bg-surface3)", borderBottom: "1px solid var(--border-light)"
          }}>
            {SECTION_TITLES[row.section] || row.section}
          </td>
        </tr>
      );
    }
    elements.push(
      <tr key={row.id}>
        <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--border-light)", width: "38%" }}>
          <input value={row.label} onChange={(e) => updateRow(row.id, "label", e.target.value)}
            style={{
              width: "100%", background: "var(--border-light)",
              border: "1px solid var(--border)", borderRadius: 5,
              color: "var(--text-muted)", fontSize: 12, padding: "3px 7px", outline: "none",
              boxSizing: "border-box"
            }}
          />
        </td>
        <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--border-light)" }}>
          <input value={row.value} onChange={(e) => updateRow(row.id, "value", e.target.value)}
            style={{
              width: "100%", background: "var(--border-light)",
              border: "1px solid var(--border)", borderRadius: 5,
              color: "var(--text)", fontSize: 12, padding: "3px 7px", outline: "none",
              boxSizing: "border-box"
            }}
          />
        </td>
        <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--border-light)", width: 32, textAlign: "center" }}>
          <button onClick={() => deleteRow(row.id)}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--red)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
            style={{
              width: 22, height: 22, borderRadius: 5, display: "inline-flex",
              alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(220,38,38,0.15)", background: "rgba(220,38,38,0.06)",
              color: "var(--text-muted)", cursor: "pointer", fontSize: 12
            }}
          >×</button>
        </td>
      </tr>
    );
  });

  return (
    <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-light)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...HDR, padding: "6px 10px", fontSize: 10 }}>{t("saved.label")}</th>
            <th style={{ ...HDR, padding: "6px 10px", fontSize: 10 }}>{t("saved.value")}</th>
            <th style={{ ...HDR, width: 32 }}></th>
          </tr>
        </thead>
        <tbody>{elements}</tbody>
      </table>
      <div style={{ padding: "7px 10px", borderTop: "1px solid var(--border-light)", background: "var(--bg-surface3)" }}>
        <button onClick={addRow} style={{
          ...SMALL_BUTTON_STYLE, fontSize: 11, padding: "4px 10px",
          background: "var(--border-light)", boxShadow: "none", color: "var(--text-muted)"
        }}>
          + {t("saved.addRow")}
        </button>
      </div>
    </div>
  );
}

// ─── Listing detail view ──────────────────────────────────────────────────────
// Replaces the table when a row's "↗ View" is clicked.
// Provides: editable title/SKU/BIN price, editable item specifics,
// description preview, generate/regenerate description (with theme selector), save button.

function ListingDetail({ listing, onClose, onSave }) {
  const { t, i18n } = useTranslation();
  const { session } = useSession();
  const [editedTitle,    setEditedTitle]    = useState(listing.title    || "");
  const [editedSku,      setEditedSku]      = useState(listing.sku      || "");
  const [editedBinPrice, setEditedBinPrice] = useState(listing.bin_price || "");
  const [editedSpecs,    setEditedSpecs]    = useState(() => getSpecs(listing));
  const [themeId,        setThemeId]        = useState(getSavedTheme);
  const [generating,     setGenerating]     = useState(false);
  const [genError,       setGenError]       = useState("");
  const [previewHtml,    setPreviewHtml]    = useState(listing.description_html || "");
  const [showRawHtml,    setShowRawHtml]    = useState(false);
  const hasDesc = !!previewHtml?.trim();

  const generateDesc = async () => {
    if (!listing.article_number) { setGenError(t("saved.noArticleNumber")); return; }
    setGenerating(true); setGenError("");
    try {
      const res  = await fetch(`${API_URL}/lookup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(buildLookupBody({ articleNumber: listing.article_number, themeId })),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("saved.generationFailed"));
      const html = data.generated_html || "";
      setPreviewHtml(html);
      onSave({ description_html: html }); // persist immediately
    } catch (err) {
      setGenError(err.message || t("saved.generationFailed"));
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    onSave({
      title:           editedTitle,
      sku:             editedSku,
      bin_price:       editedBinPrice,
      custom_specifics: editedSpecs,
    });
  };

  const labelStyle = {
    fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
    letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6
  };

  return (
    <div style={{
      background: "var(--bg-nav)", borderRadius: 20,
      border: "1px solid var(--border-strong)",
      boxShadow: "0 4px 32px rgba(0,0,0,0.35)"
    }}>
      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 20px", borderBottom: "1px solid var(--border)",
        flexWrap: "wrap"
      }}>
        <button onClick={onClose} style={{
          ...SMALL_BUTTON_STYLE, padding: "6px 12px", fontSize: 12,
          background: "var(--border-light)", boxShadow: "none", color: "var(--text-muted)"
        }}>← {t("generator.back")}</button>

        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
            {listing.article_number || t("saved.listingDetail")}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>
            {fmtDate(listing.savedAt, i18n.language)}
            {(listing.compatibility_count > 0) && ` ${t("saved.vehicleApplicationsShort", { n: listing.compatibility_count })}`}
          </div>
        </div>

        <StatusBadge status={listing.status} />

        <button onClick={handleSave} style={{
          ...SMALL_BUTTON_STYLE, fontSize: 12, padding: "7px 18px",
          background: "var(--blue)", boxShadow: "0 0 16px rgba(19,93,255,0.32)"
        }}>
          💾 {t("common.save")}
        </button>
      </div>

      {/* ── Body: two columns ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>

        {/* Left: title + SKU/BIN Price + item specifics */}
        <div style={{
          borderRight: "1px solid var(--border-light)",
          padding: 20, display: "flex", flexDirection: "column", gap: 16
        }}>

          {/* Title */}
          <div>
            <div style={labelStyle}>{t("saved.columns.title")}</div>
            <input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "var(--border-light)", border: "1px solid var(--border-strong)",
                borderRadius: 10, color: "var(--text)", fontSize: 14, fontWeight: 600,
                padding: "10px 14px", outline: "none",
              }}
            />
          </div>

          {/* SKU + BIN Price row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={labelStyle}>SKU</div>
              <input
                value={editedSku}
                onChange={(e) => setEditedSku(e.target.value)}
                placeholder={listing.article_number || t("saved.skuPlaceholder")}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "var(--border-light)", border: "1px solid var(--border)",
                  borderRadius: 8, color: "var(--text)", fontSize: 13,
                  padding: "8px 12px", outline: "none", fontFamily: "monospace"
                }}
              />
            </div>
            <div>
              <div style={labelStyle}>{t("saved.binPrice")}</div>
              <input
                value={editedBinPrice}
                onChange={(e) => setEditedBinPrice(e.target.value)}
                placeholder={t("saved.binPricePlaceholder")}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "var(--border-light)", border: "1px solid var(--border)",
                  borderRadius: 8, color: "var(--text)", fontSize: 13,
                  padding: "8px 12px", outline: "none"
                }}
              />
            </div>
          </div>

          {/* K Numbers */}
          {(listing.k_number_list || []).length > 0 && (
            <div>
              <div style={labelStyle}>{t("saved.columns.kNumbers")}</div>
              <div style={{
                fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7, wordBreak: "break-word",
                background: "var(--border-light)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "8px 12px"
              }}>
                {(listing.k_number_list || []).join(", ")}
              </div>
            </div>
          )}

          {/* Item Specifics */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={labelStyle}>{t("saved.itemSpecifics")}</div>
            <div style={{ overflowY: "auto", maxHeight: 500 }}>
              <DetailSpecificsEditor rows={editedSpecs} onChange={setEditedSpecs} />
            </div>
          </div>
        </div>

        {/* Right: description */}
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Controls bar */}
          <div style={{
            display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
            background: "var(--bg-surface3)", borderRadius: 12, padding: "10px 14px",
            border: "1px solid var(--border-light)"
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 0.4 }}>
              {t("saved.description")}
            </div>
            <DescriptionBadge hasDescription={hasDesc} />
            <div style={{ flex: 1 }} />
            {/* Theme selector */}
            <select value={themeId} onChange={(e) => setThemeId(e.target.value)} style={{
              padding: "5px 8px", borderRadius: 8, fontSize: 11,
              background: "var(--bg-surface2)", color: "var(--text-muted)",
              border: "1px solid var(--border-strong)", cursor: "pointer"
            }}>
              {THEME_IDS.map((id) => <option key={id} value={id}>{t(`saved.themes.${id}`)}</option>)}
            </select>
            {/* Generate / Regenerate */}
            <button onClick={generateDesc} disabled={generating} style={{
              ...SMALL_BUTTON_STYLE, fontSize: 12, padding: "6px 14px",
              background:  generating ? "var(--text-dim)" : hasDesc ? "rgba(22,163,74,0.28)" : "var(--blue)",
              boxShadow:   generating ? "none"    : hasDesc ? "0 0 12px rgba(22,163,74,0.22)" : "0 0 12px rgba(19,93,255,0.25)",
              opacity:     generating ? 0.7 : 1,
              cursor:      generating ? "default" : "pointer"
            }}>
              {generating ? t("saved.generating") : hasDesc ? t("saved.regenerate") : t("saved.generate")}
            </button>

            {/* Copy HTML */}
            {hasDesc && (
              <CopyButton
                value={previewHtml}
                title={t("saved.copyHtmlTitle")}
                style={{
                  fontSize: 12, padding: "6px 12px",
                  background: "var(--border-light)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border-strong)",
                  boxShadow: "none",
                }}
              >
                {t("saved.copyHtml")}
              </CopyButton>
            )}
          </div>

          {/* Error */}
          {genError && (
            <div style={{
              fontSize: 12, color: "var(--red)",
              background: "rgba(220,38,38,0.08)", borderRadius: 8,
              padding: "8px 12px", border: "1px solid rgba(220,38,38,0.20)"
            }}>
              {genError}
            </div>
          )}

          {/* Rendered preview */}
          {hasDesc ? (
            <div style={{
              background: "var(--text-on-dark)", borderRadius: 14, padding: 16,
              flex: 1, overflowY: "auto", maxHeight: 480, overflowX: "hidden"
            }}>
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          ) : (
            <div style={{
              flex: 1, minHeight: 260, display: "grid", placeItems: "center",
              background: "var(--bg-surface3)", border: "1px dashed var(--border)",
              borderRadius: 14, color: "var(--text-muted)", fontSize: 14, textAlign: "center", padding: 24
            }}>
              <div>
                <div style={{ marginBottom: 12, opacity: 0.35 }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div style={{ color: "var(--text-muted)", fontWeight: 500 }}>{t("saved.noDescriptionYet")}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  {t("saved.selectThemeGenerate")}
                </div>
              </div>
            </div>
          )}

          {/* Raw HTML toggle — available when description exists */}
          {hasDesc && (
            <div>
              <button
                onClick={() => setShowRawHtml((v) => !v)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 11, color: "var(--text-dim)", fontWeight: 600,
                  padding: "4px 0", letterSpacing: 0.3
                }}
              >
                {showRawHtml ? t("saved.hideHtml") : t("saved.showHtml")}
              </button>
              {showRawHtml && (
                <textarea
                  readOnly
                  value={previewHtml}
                  style={{
                    display: "block", width: "100%", boxSizing: "border-box",
                    marginTop: 6, height: 180, resize: "vertical",
                    background: "var(--bg-surface3)", color: "var(--text-accent)",
                    border: "1px solid var(--border)", borderRadius: 10,
                    fontSize: 11, fontFamily: "monospace", lineHeight: 1.5,
                    padding: "10px 12px", outline: "none"
                  }}
                  onClick={(e) => e.target.select()}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Item Specifics export tab ────────────────────────────────────────────────

function ItemSpecificsExport({ listings }) {
  const { t } = useTranslation();
  const filledCols = useMemo(() => {
    const colSet = new Set();
    listings.forEach((l) => {
      getSpecs(l).forEach((r) => { if (r.value?.trim()) colSet.add(r.label); });
    });
    const predefined = SPEC_SCHEMA.map((f) => f.label).filter((lbl) => colSet.has(lbl));
    const extra      = [...colSet].filter((lbl) => !SPEC_SCHEMA.find((f) => f.label === lbl));
    return predefined.concat(extra);
  }, [listings]);

  if (listings.length === 0) {
    return (
      <div style={{
        minHeight: 200, display: "grid", placeItems: "center",
        background: "var(--bg-surface3)", border: "1px dashed var(--border)",
        borderRadius: 16, color: "var(--text-muted)", fontSize: 14
      }}>
        {t("saved.emptyFilter")}
      </div>
    );
  }

  const rows = listings.map((l) => {
    const mapped = getSpecs(l);
    const vm = {}; mapped.forEach((r) => { vm[r.label] = r.value; });
    return { listing: l, vm };
  });

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ ...HDR, minWidth: 200, position: "sticky", left: 0, zIndex: 2 }}>{t("saved.columns.title")}</th>
              {filledCols.map((col) => (
                <th key={col} style={{ ...HDR, minWidth: 120, whiteSpace: "nowrap" }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ listing, vm }, idx) => (
              <tr key={listing.id} style={{ background: idx % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent" }}>
                <td style={{
                  ...COL, color: "var(--text)", fontWeight: 600,
                  position: "sticky", left: 0,
                  background: idx % 2 === 0 ? "var(--bg-surface2)" : "var(--bg-surface3)",
                  maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>
                  {listing.title}
                </td>
                {filledCols.map((col) => (
                  <td key={col} style={{ ...COL, color: "var(--text)", whiteSpace: "nowrap" }}>
                    {vm[col] || <span style={{ color: "var(--text-dim)" }}>—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GeneratedListings({
  listings,
  onUpdateStatus,
  onUpdateStatusBatch,
  onUpdateListing,
  onRemove,
  onRemoveBatch,
  canBulkGenerate = false,
}) {
  const { t } = useTranslation();
  const { session } = useSession();
  const [innerTab,           setInnerTab]           = useState("listings");
  const [dateFilter,         setDateFilter]         = useState("all");
  const [customFrom,         setCustomFrom]         = useState("");
  const [customTo,           setCustomTo]           = useState("");
  const [selectedIds,        setSelectedIds]        = useState([]);
  const [deletePending,      setDeletePending]      = useState(null); // null | "batch" | "<id>"
  const [detailId,           setDetailId]           = useState(null); // listing ID open in detail view
  const [generatingIds,      setGeneratingIds]      = useState([]);   // IDs currently generating
  const [bulkGenProgress,    setBulkGenProgress]    = useState(null); // null | { done, total }
  const [showAdlisterSettings, setShowAdlisterSettings] = useState(false);

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const today     = todayStr();
    const yesterday = yesterdayStr();
    return listings.filter((l) => {
      const d = l.savedAt?.slice(0, 10) || "";
      if (dateFilter === "today")     return d === today;
      if (dateFilter === "yesterday") return d === yesterday;
      if (dateFilter === "custom") {
        if (customFrom && d < customFrom) return false;
        if (customTo   && d > customTo)   return false;
        return true;
      }
      return true;
    });
  }, [listings, dateFilter, customFrom, customTo]);

  // ── Selection ───────────────────────────────────────────────────────────────
  const filteredIds  = useMemo(() => filtered.map((l) => l.id), [filtered]);
  const allSelected  = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));
  const selInFilter  = selectedIds.filter((id) => filteredIds.includes(id)).length;

  const toggleOne = (id) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...filteredIds])]);
    }
  };

  // Whichever IDs are "active": selection if any are checked, else everything shown
  const activeIds = () => {
    const sel = selectedIds.filter((id) => filteredIds.includes(id));
    return sel.length > 0 ? sel : filteredIds;
  };

  // ── Detail view ─────────────────────────────────────────────────────────────
  const detailListing = detailId ? listings.find((l) => l.id === detailId) : null;

  const openDetail  = (id) => setDetailId(id);
  const closeDetail = ()   => setDetailId(null);

  const handleSaveDetail = (patch) => {
    if (detailId) onUpdateListing(detailId, patch);
  };

  // ── Description generation ──────────────────────────────────────────────────
  const generateOneDescription = async (id) => {
    const listing = listings.find((l) => l.id === id);
    if (!listing?.article_number) return;

    setGeneratingIds((prev) => [...prev, id]);
    try {
      const res  = await fetch(`${API_URL}/lookup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(buildLookupBody({
          articleNumber: listing.article_number,
          themeId: getSavedTheme(),
        })),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onUpdateListing(id, { description_html: data.generated_html || "" });
    } catch {
      // Fail silently for table-row generation; user can open detail view for error details
    } finally {
      setGeneratingIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const generateBulkDescriptions = async () => {
    if (!canBulkGenerate) return;
    // Only target listings that are missing descriptions
    const ids = activeIds().filter((id) => {
      const l = listings.find((x) => x.id === id);
      return l && !l.description_html?.trim();
    });
    if (!ids.length) return;

    setBulkGenProgress({ done: 0, total: ids.length });
    for (let i = 0; i < ids.length; i++) {
      await generateOneDescription(ids[i]);
      setBulkGenProgress({ done: i + 1, total: ids.length });
    }
    setBulkGenProgress(null);
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const confirmDelete = (key) => setDeletePending(key);

  const doDelete = () => {
    if (!deletePending) return;
    if (deletePending === "batch") {
      const ids = activeIds();
      onRemoveBatch(ids);
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      onRemove(deletePending);
      setSelectedIds((prev) => prev.filter((id) => id !== deletePending));
      if (detailId === deletePending) setDetailId(null);
    }
    setDeletePending(null);
  };

  // ── AdLister CSV export (85-column) ─────────────────────────────────────────
  // Column order: SKU · Title · Starting Price · Reserve Price · BIN Price ·
  //   Description · Store Category Name · Store Category 2 Name ·
  //   Image1-6 · Web Price · eBay Category Id · eBay Category2 Id ·
  //   Subtitle · QTY · Condition · Dispatch Time · Get It Fast ·
  //   Domestic 1-3 (Service/Cost/Additional) ·
  //   International 1-3 (Service/Cost/Additional) ·
  //   Best Offer Enabled/Accept/Decline · Ref Type · Ref Id ·
  //   Custom Specifics 1-20 Name+Value  (40 columns)
  //   = 22 + 9 + 9 + 3 + 2 + 40 = 85 columns

  const exportAdlisterCsv = () => {
    const ids      = activeIds();
    const toExport = listings.filter((l) => ids.includes(l.id));
    if (!toExport.length) return;

    const s = loadAdlisterSettings();

    const HEADERS = [
      "SKU", "Title", "Starting Price", "Reserve Price", "BIN Price", "Description",
      "Store Category Name", "Store Category 2 Name",
      "Image1", "Image2", "Image3", "Image4", "Image5", "Image6",
      "Web Price", "eBay Category Id", "eBay Category2 Id",
      "Subtitle", "QTY", "Condition", "Dispatch Time", "Get It Fast",
      // Domestic (3 × 3)
      "Domestic Shipping Service 1", "Domestic Shipping Cost 1", "Domestic Shipping Additional 1",
      "Domestic Shipping Service 2", "Domestic Shipping Cost 2", "Domestic Shipping Additional 2",
      "Domestic Shipping Service 3", "Domestic Shipping Cost 3", "Domestic Shipping Additional 3",
      // International (3 × 3)
      "International Shipping Service 1", "International Shipping Cost 1", "International Shipping Additional 1",
      "International Shipping Service 2", "International Shipping Cost 2", "International Shipping Additional 2",
      "International Shipping Service 3", "International Shipping Cost 3", "International Shipping Additional 3",
      // Best Offer
      "Best Offer Enabled", "Best Offer Accept", "Best Offer Decline",
      // Ref
      "Ref Type", "Ref Id",
      // Custom Specifics 1-20 (Name + Value = 40 columns)
      ...Array.from({ length: 20 }, (_, i) => [
        `Custom Specifics ${i + 1} Name`, `Custom Specifics ${i + 1} Value`
      ]).flat(),
    ];

    const dataRows = toExport.map((l) => {
      // Build up to 20 filled spec pairs
      const specPairs = getSpecs(l)
        .filter((r) => r.value?.trim())
        .slice(0, 20)
        .map((r) => [r.label, r.value]);
      // Pad to exactly 20 pairs
      while (specPairs.length < 20) specPairs.push(["", ""]);

      const cells = [
        escCsv(l.sku || l.article_number || ""), // SKU
        escCsv(l.title || ""),                   // Title
        "",                                       // Starting Price — always blank
        "",                                       // Reserve Price
        escCsv(l.bin_price || ""),               // BIN Price
        forceQuoteCsv(sanitizeHtmlForExport(l.description_html)), // Description — always quoted
        escCsv(s.storeCat  || ""),               // Store Category Name
        escCsv(s.storeCat2 || ""),               // Store Category 2 Name
        "", "", "", "", "", "",                   // Image1-6 — always blank
        escCsv(s.webPrice   || ""),              // Web Price
        escCsv(s.ebayCatId  || ""),              // eBay Category Id
        escCsv(s.ebayCat2Id || ""),              // eBay Category2 Id
        "",                                       // Subtitle
        escCsv(s.qty       || "1"),              // QTY
        escCsv(s.condition || "New"),            // Condition
        escCsv(s.dispatch  || "1"),              // Dispatch Time
        "",                                       // Get It Fast
        // Domestic shipping — always blank (filled manually in AdLister)
        "", "", "",
        "", "", "",
        "", "", "",
        // International shipping — always blank
        "", "", "",
        "", "", "",
        "", "", "",
        // Best Offer
        escCsv(s.bestOfferEnabled), escCsv(s.bestOfferAccept), escCsv(s.bestOfferDecline),
        // Ref
        escCsv(s.refType), escCsv(s.refId),
        // Custom Specifics 1-20 (flattened name/value pairs)
        ...specPairs.flat().map(escCsv),
      ];

      return cells.join(",");
    });

    const filename = `adlister-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv([HEADERS.map(escCsv).join(","), ...dataRows].join("\n"), filename);
    onUpdateStatusBatch(toExport.map((l) => l.id), "Exported");
  };

  // ── Item Specifics CSV (specifics tab) ──────────────────────────────────────
  const exportSpecificsCsv = () => {
    const ids      = activeIds();
    const toExport = listings.filter((l) => ids.includes(l.id));
    if (!toExport.length) return;

    const colSet = new Set();
    toExport.forEach((l) => {
      getSpecs(l).forEach((r) => { if (r.value?.trim()) colSet.add(r.label); });
    });
    const cols = SPEC_SCHEMA.map((f) => f.label).filter((c) => colSet.has(c))
      .concat([...colSet].filter((c) => !SPEC_SCHEMA.find((f) => f.label === c)));

    const headers  = ["Title", ...cols];
    const dataRows = toExport.map((l) => {
      const specs = getSpecs(l);
      const vm    = {}; specs.forEach((r) => { vm[r.label] = r.value; });
      return [l.title, ...cols.map((c) => vm[c] || "")].map(escCsv).join(",");
    });

    downloadCsv([headers.map(escCsv).join(","), ...dataRows].join("\n"),
      `item-specifics-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // ── Counts ──────────────────────────────────────────────────────────────────
  const draftCount    = listings.filter((l) => l.status === "Draft").length;
  const exportedCount = listings.filter((l) => l.status === "Exported").length;
  const withDescCount = listings.filter((l) => !!l.description_html?.trim()).length;

  // How many listings in the current active set are missing descriptions
  const missingDescCount = useMemo(() => {
    const pool = selInFilter > 0
      ? selectedIds.filter((id) => filteredIds.includes(id))
      : filteredIds;
    return pool.filter((id) => {
      const l = listings.find((x) => x.id === id);
      return l && !l.description_html?.trim();
    }).length;
  }, [selectedIds, filteredIds, listings, selInFilter]);

  const exportLabel = selInFilter > 0
    ? t("saved.selectedCount", { n: selInFilter })
    : t("saved.shownCount", { n: filtered.length });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "grid", gap: 20 }}>

      {/* ── Stats header ── */}
      <div style={{
        display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
        background: "var(--bg-nav)", borderRadius: 16, padding: "14px 20px",
        border: "1px solid var(--border)"
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{t("saved.title")}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
            {t("saved.subtitle")}
          </div>
        </div>
        {[
          { label: t("saved.statTotal"),     value: listings.length, color: "var(--text-accent)" },
          { label: t("saved.statWithDesc"),  value: withDescCount,   color: "#a78bfa" },
          { label: t("saved.statDraft"),     value: draftCount,      color: "var(--yellow)" },
          { label: t("saved.statExported"),  value: exportedCount,   color: "var(--green)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            textAlign: "center", padding: "8px 20px",
            background: "var(--bg-surface3)", borderRadius: 12,
            border: "1px solid var(--border-light)"
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Detail view (replaces table when a listing is open) ── */}
      {detailListing ? (
        <ListingDetail
          key={detailListing.id}
          listing={detailListing}
          onClose={closeDetail}
          onSave={handleSaveDetail}
        />
      ) : (
        <>
          {/* ── Inner tab bar ── */}
          <div style={{
            display: "flex", gap: 6, background: "var(--bg-surface3)",
            borderRadius: 14, padding: 4, border: "1px solid var(--border-light)"
          }}>
            {[
              { key: "listings",  label: t("saved.tabListings") },
              { key: "specifics", label: t("saved.tabSpecifics") },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setInnerTab(key)} style={{
                flex: 1, padding: "9px 14px", borderRadius: 10,
                border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
                background: innerTab === key ? "var(--blue)" : "transparent",
                color:      innerTab === key ? "var(--text-on-dark)"    : "var(--text-muted)",
                boxShadow:  innerTab === key ? "0 0 14px rgba(19,93,255,0.28)" : "none",
                transition: "all 0.18s ease"
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── Toolbar ── */}
          <div style={{
            background: "var(--bg-nav)", borderRadius: 14, padding: "12px 16px",
            border: "1px solid var(--border)",
            display: "flex", flexDirection: "column", gap: 10
          }}>
            <DateFilterBar
              filter={dateFilter} onFilter={setDateFilter}
              customFrom={customFrom} customTo={customTo}
              onCustomFrom={setCustomFrom} onCustomTo={setCustomTo}
            />

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>

              {/* Select / deselect */}
              <button onClick={toggleAll} style={{
                ...SMALL_BUTTON_STYLE, fontSize: 12,
                background: "var(--border)", boxShadow: "none", color: "var(--text)"
              }}>
                {allSelected ? t("saved.deselectAll") : t("saved.selectAll", { n: filtered.length })}
              </button>

              {selInFilter > 0 && (
                <button
                  onClick={() => setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)))}
                  style={{ ...SMALL_BUTTON_STYLE, fontSize: 12, background: "transparent", boxShadow: "none", color: "var(--text-muted)" }}
                >
                  {t("saved.clearSelected", { n: selInFilter })}
                </button>
              )}

              {/* ⚡ Bulk generate descriptions */}
              {canBulkGenerate && missingDescCount > 0 && !bulkGenProgress && (
                <button onClick={generateBulkDescriptions} style={{
                  ...SMALL_BUTTON_STYLE, fontSize: 12, padding: "6px 14px",
                  background: "rgba(99,102,241,0.16)", color: "#a5b4fc",
                  boxShadow: "none", border: "1px solid rgba(99,102,241,0.25)"
                }}>
                  {t("saved.generateDescriptions", { n: missingDescCount })}
                </button>
              )}

              {canBulkGenerate && bulkGenProgress && (
                <div style={{
                  fontSize: 12, color: "#a5b4fc",
                  background: "rgba(99,102,241,0.12)", borderRadius: 8,
                  padding: "5px 12px", border: "1px solid rgba(99,102,241,0.20)"
                }}>
                  {t("saved.generatingProgress", bulkGenProgress)}
                </div>
              )}

              <div style={{ flex: 1 }} />

              {/* Mark exported */}
              {selInFilter > 0 && (
                <button
                  onClick={() => onUpdateStatusBatch(selectedIds.filter((id) => filteredIds.includes(id)), "Exported")}
                  style={{ ...SMALL_BUTTON_STYLE, fontSize: 12, background: "rgba(74,222,128,0.12)", color: "var(--green)", boxShadow: "none" }}
                >
                  {t("saved.markExported", { n: selInFilter })}
                </button>
              )}

              {/* Delete */}
              {(selInFilter > 0 || filtered.length > 0) && (
                <button onClick={() => confirmDelete("batch")} style={{
                  ...SMALL_BUTTON_STYLE, fontSize: 12, background: "rgba(220,38,38,0.10)", color: "var(--red)", boxShadow: "none"
                }}>
                  {selInFilter > 0
                    ? t("saved.deleteSelected", { n: selInFilter })
                    : t("saved.deleteShown", { n: filtered.length })}
                </button>
              )}

              {/* AdLister settings toggle */}
              <button
                onClick={() => setShowAdlisterSettings((v) => !v)}
                title={t("saved.adlisterSettingsTitle")}
                style={{
                  ...SMALL_BUTTON_STYLE, fontSize: 12, padding: "6px 12px",
                  background: showAdlisterSettings ? "rgba(99,102,241,0.20)" : "var(--border-light)",
                  color:      showAdlisterSettings ? "#a5b4fc"              : "var(--text-muted)",
                  border:     showAdlisterSettings ? "1px solid rgba(99,102,241,0.35)" : "1px solid var(--border-strong)",
                  boxShadow: "none"
                }}
              >
                {t("saved.adlister")}
              </button>

              {/* Export AdLister CSV */}
              <button
                onClick={innerTab === "specifics" ? exportSpecificsCsv : exportAdlisterCsv}
                style={{ ...SMALL_BUTTON_STYLE, fontSize: 12, background: "#16a34a", boxShadow: "0 0 14px rgba(22,163,74,0.25)" }}
              >
                ↓ {innerTab === "specifics" ? t("saved.exportSpecifics") : t("saved.exportAdlister")} ({exportLabel})
              </button>
            </div>
          </div>

          {/* ── AdLister settings panel ── */}
          {showAdlisterSettings && <AdListerSettings />}

          {/* ── Delete confirmation ── */}
          {deletePending && (
            <div style={{
              background: "var(--red-bg)", border: "1px solid rgba(220,38,38,0.35)",
              borderRadius: 12, padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap"
            }}>
              <span style={{ fontSize: 13, color: "var(--red)", flex: 1 }}>
                {deletePending === "batch"
                  ? t("saved.deleteBatchConfirm", { n: selInFilter > 0 ? selInFilter : filtered.length })
                  : t("saved.deleteOneConfirm")}
                {" "}{t("saved.cannotUndo")}
              </span>
              <button onClick={doDelete}
                style={{ ...SMALL_BUTTON_STYLE, background: "#dc2626", fontSize: 12, padding: "6px 14px" }}>
                {t("common.delete")}
              </button>
              <button onClick={() => setDeletePending(null)}
                style={{ ...SMALL_BUTTON_STYLE, background: "var(--text-dim)", boxShadow: "none", fontSize: 12, padding: "6px 12px" }}>
                {t("common.cancel")}
              </button>
            </div>
          )}

          {/* ── Tab content ── */}
          {innerTab === "listings" && (
            <ListingsTable
              listings={filtered}
              selectedIds={selectedIds}
              onToggleOne={toggleOne}
              onToggleAll={toggleAll}
              onDeleteOne={(id) => confirmDelete(id)}
              onStatusChange={onUpdateStatus}
              onGenerateOne={generateOneDescription}
              onOpenDetail={openDetail}
              generatingIds={generatingIds}
            />
          )}

          {innerTab === "specifics" && (
            <ItemSpecificsExport listings={filtered} />
          )}
        </>
      )}
    </div>
  );
}
