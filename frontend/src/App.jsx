import React, { memo, useState, useRef, useEffect, useMemo } from "react";
import { supabase } from "./lib/supabaseClient";
import { useSession } from "./context/SessionContext";
import {
  BUTTON_BASE,
  SMALL_BUTTON_STYLE,
  INPUT_STYLE,
  primaryButtonStyle,
  StatPill,
  Card,
  FieldLabel,
  TextInput,
  EditableTextarea,
  ReadOnlyTextarea,
  InfoBox,
  CopyButton
} from "./shared.jsx";
import TabbedListingPreview, { USE_TABBED_PREVIEW } from "./TabbedListingPreview.jsx";
import PriceCalculator from "./PriceCalculator.jsx";
import SavedProducts from "./SavedProducts.jsx";
import CompatibilityChecker from "./CompatibilityChecker.jsx";
import Account, { ProfileDropdown } from "./Account.jsx";
import { useSavedProducts } from "./useSavedProducts.js";
import { useGeneratedListings } from "./useGeneratedListings.js";
import { useSessionState } from "./useSessionState.js";
import GeneratedListings from "./GeneratedListings.jsx";
import { SPEC_SCHEMA, SECTION_TITLES, mapApiSpecsToSchema } from "./itemSpecificsSchema.js";

// ─── Description themes (mirrors backend) ────────────────────────────────────

const THEMES = [
  { id: "clean-default",     name: "Clean Default" },
  { id: "dark-header",       name: "Dark Header" },
  { id: "table-focused",     name: "Table Focused" },
  { id: "minimal",           name: "Minimal" },
  { id: "professional-blue", name: "Professional Blue" }
];

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

const LS_THEME_KEY     = "jsk_theme_v2";
const LS_TEMPLATES_KEY = "jsk_custom_templates_v1";

function getSavedTheme() {
  try { return localStorage.getItem(LS_THEME_KEY) || "clean-default"; }
  catch { return "clean-default"; }
}
function saveTheme(id) {
  try { localStorage.setItem(LS_THEME_KEY, id); } catch {}
}

// ── Custom template storage ───────────────────────────────────────────────────
function loadCustomTemplates() {
  try { return JSON.parse(localStorage.getItem(LS_TEMPLATES_KEY) || "[]"); }
  catch { return []; }
}
function persistCustomTemplates(list) {
  try { localStorage.setItem(LS_TEMPLATES_KEY, JSON.stringify(list)); } catch {}
}

// Strip article-specific content from HTML, keeping structure + header text.
// Light-background divs and table cells are cleared; dark-background headers kept.
function blankContentHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  tmp.querySelectorAll("div, td, th, p, span").forEach((el) => {
    const bg = el.style.background || el.style.backgroundColor || "";
    const isDarkBg = bg && bg !== "var(--text-on-dark)" && bg !== "white" &&
      !bg.startsWith("rgb(255,255,255") && !bg.startsWith("rgba(255,255,255");
    if (!isDarkBg && el.children.length === 0) el.textContent = "";
  });
  // Also blank manufacturer header cells (e.g. "BMW Models:") — these are
  // dark-bg <th> cells in the first thead row; they contain brand-specific names
  // that must be refilled when the template is applied to a different listing.
  tmp.querySelectorAll("thead tr:first-child th").forEach((th) => {
    th.textContent = "";
  });
  // Also clear table rows (but keep the table/thead structure)
  tmp.querySelectorAll("tbody tr").forEach((tr) => tr.remove());
  return tmp.innerHTML;
}

// Merge a blank template (structure + styling only) with freshly generated HTML.
// Fills:
//  • Empty <tbody> elements  → replaced with tbody content from generated HTML
//  • Blank clearable leaves  → the same leaf nodes that blankContentHtml cleared,
//                              refilled with matching content from generated HTML
// Matching is positional — works because templates are created from the same
// listing format, so the section order and element tree structure are identical.
function mergeTemplateWithContent(templateHtml, generatedHtml) {
  if (!templateHtml || !generatedHtml) return templateHtml || generatedHtml || "";

  const tpl = document.createElement("div");
  tpl.innerHTML = templateHtml;
  const gen = document.createElement("div");
  gen.innerHTML = generatedHtml;

  // ── 1. Refill empty <tbody> rows from generated ───────────────────────────
  const tplTbodies = Array.from(tpl.querySelectorAll("tbody"));
  const genTbodies = Array.from(gen.querySelectorAll("tbody"));
  tplTbodies.forEach((tbody, i) => {
    if (tbody.children.length === 0 && genTbodies[i]) {
      tbody.innerHTML = genTbodies[i].innerHTML;
    }
  });

  // ── 2. Collect clearable leaf elements (same criteria as blankContentHtml) ─
  //    div / p / td / th / span with no element children, not inside a tbody
  const CLEARABLE = new Set(["DIV", "P", "TD", "TH", "SPAN"]);

  function clearableLeaves(root) {
    const out = [];
    function walk(el) {
      if (el.nodeName === "TBODY") return; // tbodies handled above
      if (CLEARABLE.has(el.nodeName) && el.children.length === 0) {
        out.push(el);
        return;
      }
      Array.from(el.children).forEach(walk);
    }
    Array.from(root.children).forEach(walk);
    return out;
  }

  const tplLeaves = clearableLeaves(tpl);
  const genLeaves = clearableLeaves(gen);

  // ── 3. Refill blank leaves from generated ────────────────────────────────
  // The textContent check protects real structural headers (e.g. "Replaces OEM
  // Part Numbers:") — those are dark-bg but still have text so they're skipped.
  // Manufacturer header cells ("BMW Models:") are now blanked by blankContentHtml
  // so they correctly get refilled here with the new brand name.
  tplLeaves.forEach((tplLeaf, i) => {
    const genLeaf = genLeaves[i];
    if (!genLeaf) return;
    if (tplLeaf.textContent.trim() !== "") return; // still has text — skip
    tplLeaf.innerHTML = genLeaf.innerHTML;
  });

  return tpl.innerHTML;
}

function makeRowId() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { session } = useSession();
  const [page, setPage] = useState(
    () => sessionStorage.getItem("jsk_active_page") || "listing"
  );
  const [accountSubPage, setAccountSubPage] = useState("account");

  // Session-state key prefixes per page — used to wipe state on navigation away
  const PAGE_SS_PREFIXES = {
    listing:       "jsk_gen_",
    calculator:    "jsk_calc_",
    compatibility: "jsk_compat_",
  };

  const navigateTo = (key) => {
    if (key !== page) {
      const prefix = PAGE_SS_PREFIXES[page];
      if (prefix) {
        Object.keys(sessionStorage)
          .filter((k) => k.startsWith(prefix))
          .forEach((k) => sessionStorage.removeItem(k));
      }
    }
    sessionStorage.setItem("jsk_active_page", key);
    setPage(key);
  };

  // Navigate from profile dropdown — account sub-pages or logout
  const handleProfileNav = async (subPage) => {
    if (subPage === "logout") {
      await supabase.auth.signOut();
      window.location.href = "/auth/login";
      return;
    }
    setAccountSubPage(subPage);
    navigateTo("account");
  };
  const { products, save, remove } = useSavedProducts();
  const {
    listings: generatedListings,
    autoSave,
    updateStatus,
    updateStatusBatch,
    updateListing: updateGeneratedListing,
    remove: removeGenerated,
    removeBatch: removeBatchGenerated,
  } = useGeneratedListings();
  const loadProductRef = useRef(null);
  const [prefilledArticle, setPrefilledArticle] = useState("");

  const handleLoadProduct = (product) => {
    // loadProductRef.current is set by PriceCalculator via onLoadHandled
    setTimeout(() => { if (loadProductRef.current) loadProductRef.current(product); }, 50);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: 24
      }}
    >
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>

        {/* Navbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-nav)",
            borderRadius: 20,
            padding: "14px 24px",
            border: "1px solid var(--border)",
            marginBottom: 16,
            boxShadow: "0 4px 24px rgba(0,0,0,0.28)"
          }}
        >
          <img src="/logo.png" alt="PartLister" style={{ height: 32, width: "auto" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>
              Listing Tool
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {session?.user?.email && (
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginRight: 4 }}>
                  {session.user.email}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleProfileNav("logout")}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 12px",
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.35)",
                  borderRadius: 99, cursor: "pointer", transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--red)" }}>Log out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page tabs */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 24,
            background: "var(--bg-nav)",
            borderRadius: 20,
            padding: 6,
            border: "1px solid var(--border)"
          }}
        >
          {[
            { key: "listing",       label: "Listing Generator" },
            { key: "calculator",    label: "Price Calculator" },
            { key: "compatibility", label: "Compatibility Checker" },
            { key: "account",       label: "Account" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => navigateTo(key)}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
                background: page === key ? "var(--blue)" : "transparent",
                color:      page === key ? "var(--text-on-dark)"    : "var(--text-muted)",
                boxShadow:  page === key ? "0 0 16px rgba(19,93,255,0.28)" : "none",
                transition: "all 0.2s ease"
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {page === "listing" && (
          <ListingGenerator
            prefilledArticle={prefilledArticle}
            onPrefilledConsumed={() => setPrefilledArticle("")}
            onAutoSave={autoSave}
            listings={generatedListings}
            onUpdateStatus={updateStatus}
            onUpdateStatusBatch={updateStatusBatch}
            onUpdateListing={updateGeneratedListing}
            onRemove={removeGenerated}
            onRemoveBatch={removeBatchGenerated}
          />
        )}
        {page === "calculator" && (
          <PriceCalculator
            onSave={save}
            onLoadHandled={(fn) => { loadProductRef.current = fn; }}
            products={products}
            onDeleteProduct={remove}
            onLoadProduct={handleLoadProduct}
          />
        )}
        {page === "compatibility" && (
          <CompatibilityChecker
            onSendToListing={({ articleNumber }) => {
              setPrefilledArticle(articleNumber || "");
              navigateTo("listing");
            }}
          />
        )}
        {page === "account" && (
          <Account initialPage={accountSubPage} />
        )}
      </div>
    </div>
  );
}

// ─── ListingGenerator ─────────────────────────────────────────────────────────
// innerPage: "generate" | "generated"
// phase:     "idle" | "searching" | "selecting" | "generating" | "done"

function ListingGenerator({
  prefilledArticle, onPrefilledConsumed, onAutoSave,
  listings, onUpdateStatus, onUpdateStatusBatch, onUpdateListing, onRemove, onRemoveBatch,
}) {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  // ── Inner page ────────────────────────────────────────────────────────────
  const [innerPage, setInnerPage] = useSessionState("jsk_gen_inner_page", "generate");

  // ── Single listing state ──────────────────────────────────────────────────
  const [query,         setQuery]         = useSessionState("jsk_gen_query", prefilledArticle || "");
  const [inputSku,      setInputSku]      = useSessionState("jsk_gen_sku", "");
  const [phase,         setPhase]         = useState("idle");
  const [searchResults, setSearchResults] = useState([]);
  const [result,        setResult]        = useSessionState("jsk_gen_result", null);
  const [error,         setError]         = useState("");
  const [themeId,       setThemeId]       = useState(getSavedTheme);
  const [customTemplates,    setCustomTemplates]    = useState(loadCustomTemplates);
  const [customTemplateHtml, setCustomTemplateHtml] = useState(null);

  // ── Batch state ───────────────────────────────────────────────────────────
  const [batchRows,    setBatchRows]    = useSessionState("jsk_gen_batch_rows", [{ id: makeRowId(), articleNo: "", sku: "", binPrice: "" }]);
  const [batchLoading, setBatchLoading] = useState(false);

  // ── Live HTML ref (lifted from ListingOutput for Copy HTML in right panel) ──
  const liveHtmlRef = useRef("");

  // ── Resolved HTML for TabbedListingPreview (no editing, so computed here) ──
  const displayHtml = useMemo(
    () => customTemplateHtml && result
      ? mergeTemplateWithContent(customTemplateHtml, result.generated_html ?? "")
      : (result?.generated_html ?? ""),
    [customTemplateHtml, result?.generated_html]
  );

  // Keep liveHtmlRef in sync when using the tabbed preview
  useEffect(() => {
    if (USE_TABBED_PREVIEW && result) {
      liveHtmlRef.current = displayHtml;
    }
  }, [displayHtml, result]);

  const isLoading  = phase === "searching" || phase === "generating";
  const canSearch  = query.trim().length > 0;
  const canBatch   = batchRows.some((r) => r.articleNo.trim() && r.sku.trim() && r.binPrice.trim());

  useEffect(() => {
    if (prefilledArticle) {
      setInnerPage("generate"); // always land on Generate when a prefill arrives
      setQuery(prefilledArticle);
      if (onPrefilledConsumed) onPrefilledConsumed();
    }
  }, [prefilledArticle]);

  // ── Search (OEM or article number → candidates) ──────────────────────────
  const handleSearch = async () => {
    if (!canSearch || isLoading) return;
    setPhase("searching");
    setError("");
    setSearchResults([]);
    setResult(null);
    try {
      const res  = await fetch(`${API_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      const articles = data.articles || [];
      if (articles.length === 0) throw new Error(`No articles found for "${query.trim()}"`);
      if (articles.length === 1) {
        await generateListing(articles[0].articleNo || articles[0].articleId);
      } else {
        setSearchResults(articles);
        setPhase("selecting");
      }
    } catch (err) {
      setError(String(err.message || err));
      setPhase("idle");
    }
  };

  // ── Generate from a chosen article number ────────────────────────────────
  const generateListing = async (articleNo) => {
    setPhase("generating");
    setError("");
    try {
      const res  = await fetch(`${API_URL}/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleNumber: String(articleNo), themeId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");
      setResult(data);
      setPhase("done");
      onAutoSave?.({ ...data, sku: inputSku.trim() });
    } catch (err) {
      setError(String(err.message || err));
      setPhase(searchResults.length > 0 ? "selecting" : "idle");
    }
  };

  // ── Save a custom template ────────────────────────────────────────────────
  const handleSaveTemplate = (name, html) => {
    const tpl = { id: makeRowId(), name: name.trim() || "Custom Template", html };
    const updated = [...customTemplates, tpl];
    setCustomTemplates(updated);
    persistCustomTemplates(updated);
  };

  const handleDeleteTemplate = (id) => {
    const updated = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(updated);
    persistCustomTemplates(updated);
    if (customTemplateHtml && customTemplates.find((t) => t.id === id)?.html === customTemplateHtml) {
      setCustomTemplateHtml(null);
    }
  };

  // ── Theme change: re-render if listing already done ──────────────────────
  const handleThemeChange = (newId) => {
    saveTheme(newId);
    setThemeId(newId);
    setCustomTemplateHtml(null); // always go back to API-rendered HTML
    if (phase === "done" && result) {
      setPhase("generating");
      fetch(`${API_URL}/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleNumber: result.article_number, themeId: newId })
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setResult(data);
          onAutoSave?.({ ...data, sku: inputSku.trim() }); // keep saved listing in sync
        })
        .catch((err) => setError(String(err.message || err)))
        .finally(() => setPhase("done"));
    }
  };

  // ── Batch row helpers ─────────────────────────────────────────────────────
  const addBatchRow = () =>
    setBatchRows((prev) => [...prev, { id: makeRowId(), articleNo: "", sku: "", binPrice: "" }]);

  const removeBatchRow = (id) =>
    setBatchRows((prev) => prev.filter((r) => r.id !== id));

  const updateBatchRow = (id, field, value) =>
    setBatchRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));

  // ── Batch export ──────────────────────────────────────────────────────────
  const handleBatchExport = async () => {
    if (!canBatch || batchLoading) return;
    setBatchLoading(true);
    setError("");
    try {
      const rows = batchRows
        .filter((r) => r.articleNo.trim() && r.sku.trim() && r.binPrice.trim())
        .map(({ articleNo, sku, binPrice }) => ({ articleNumber: articleNo.trim(), sku: sku.trim(), binPrice: binPrice.trim() }));
      const res = await fetch(`${API_URL}/batch-export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, themeId })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Batch export failed"); }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = "batch-listings.csv";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (err) { setError(String(err.message || err)); }
    finally { setBatchLoading(false); }
  };

  const copyText = async (v) => { await navigator.clipboard.writeText(v || ""); };

  const btnLabel =
    phase === "searching"  ? "Searching…"   :
    phase === "generating" ? "Generating…"  :
    "Search & Generate";

  const listingCount = listings?.length ?? 0;

  return (
    <>
      {/* ── Inner tab bar ── */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 20,
        background: "var(--bg-nav)", borderRadius: 16, padding: 5,
        border: "1px solid var(--border)"
      }}>
        {[
          { key: "generate",  label: "Generate" },
          { key: "generated", label: `Generated Listings${listingCount ? ` (${listingCount})` : ""}` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setInnerPage(key)}
            style={{
              flex: 1, padding: "10px 16px", borderRadius: 12,
              border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
              background: innerPage === key ? "var(--blue)" : "transparent",
              color:      innerPage === key ? "var(--text-on-dark)" : "var(--text-muted)",
              boxShadow:  innerPage === key ? "0 0 14px rgba(19,93,255,0.28)" : "none",
              transition: "all 0.18s ease"
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Generate tab ── */}
      {innerPage === "generate" && (<>
        {error && (
          <div style={{
            background: "var(--bg-surface3)", color: "var(--red)",
            border: "1px solid rgba(220,38,38,0.45)", borderRadius: 20,
            padding: 16, marginBottom: 20,
            boxShadow: "0 0 20px rgba(220,38,38,0.10)"
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr 290px", gap: 20, alignItems: "start" }}>

          {/* ── Left column: form + AI titles + final title ── */}
          <div style={{ display: "grid", gap: 20 }}>

            {/* Single Listing */}
            <Card
              title="Single Listing"
              subtitle="Enter a TecDoc article number or OEM / reference number."
              centeredTitle
            >
              <div style={{ display: "grid", gap: 14 }}>

                <div>
                  <FieldLabel>Article No. or OEM Number</FieldLabel>
                  <TextInput
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      if (phase !== "idle") { setPhase("idle"); setSearchResults([]); setResult(null); }
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="e.g. AOP858 or LR002465"
                  />
                </div>

                <div>
                  <FieldLabel>
                    SKU{" "}
                    <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: 11 }}>(optional)</span>
                  </FieldLabel>
                  <TextInput
                    value={inputSku}
                    onChange={(e) => setInputSku(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Your internal SKU"
                  />
                </div>

                {/* Description Theme / Preset selector */}
                <div>
                  <FieldLabel>Description Preset</FieldLabel>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {THEMES.map((t) => {
                      const active = themeId === t.id && !customTemplateHtml;
                      return (
                        <button
                          key={t.id}
                          onClick={() => handleThemeChange(t.id)}
                          style={{
                            padding: "6px 12px", borderRadius: 10, fontSize: 12, cursor: "pointer",
                            border:     active ? "1px solid var(--blue)"    : "1px solid rgba(255,255,255,0.14)",
                            background: active ? "var(--border-blue)" : "var(--border-light)",
                            color:      active ? "var(--text-accent)"              : "var(--text-muted)",
                            fontWeight: active ? 700 : 400,
                            transition: "all 0.15s ease"
                          }}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom (saved) templates */}
                  {customTemplates.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, marginBottom: 6, letterSpacing: 0.4 }}>
                        MY TEMPLATES
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {customTemplates.map((t) => {
                          const active = customTemplateHtml === t.html;
                          return (
                            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                              <button
                                onClick={() => setCustomTemplateHtml(t.html)}
                                style={{
                                  padding: "6px 12px", borderRadius: "10px 0 0 10px", fontSize: 12, cursor: "pointer",
                                  border:     active ? "1px solid #f59e0b"        : "1px solid rgba(255,255,255,0.14)",
                                  borderRight: "none",
                                  background: active ? "rgba(245,158,11,0.18)"    : "var(--border-light)",
                                  color:      active ? "var(--yellow)"                  : "var(--text-muted)",
                                  fontWeight: active ? 700 : 400,
                                  transition: "all 0.15s ease"
                                }}
                              >
                                {t.name}
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(t.id)}
                                title="Delete template"
                                style={{
                                  padding: "6px 7px", borderRadius: "0 10px 10px 0", fontSize: 11, cursor: "pointer",
                                  border:     "1px solid rgba(255,255,255,0.14)",
                                  background: "rgba(220,38,38,0.07)",
                                  color:      "var(--red)",
                                  transition: "all 0.15s ease"
                                }}
                              >×</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSearch}
                  disabled={isLoading || !canSearch}
                  style={primaryButtonStyle(isLoading || !canSearch)}
                >
                  {btnLabel}
                </button>
              </div>
            </Card>

            {/* AI Title Suggestions (shown after a listing is generated) */}
            {phase === "done" && result && (
              <AiTitleSuggestions
                result={result}
                apiUrl={API_URL}
                onUseTitle={(title) => {
                  setResult((prev) => {
                    const updated = { ...prev, generated_title: title };
                    onAutoSave?.({ ...updated, sku: inputSku.trim() });
                    return updated;
                  });
                }}
              />
            )}

          </div>

          {/* ── Middle column: listing output ── */}
          <div style={phase === "done" && result ? {} : { gridColumn: "2 / 4" }}>
            {(phase === "idle" || phase === "searching" || phase === "generating") && (
              <Card title="Output" subtitle="Generated listing content and live preview." centeredTitle>
                <EmptyOutputPanel
                  message={
                    phase === "searching"  ? "Searching for matching articles…" :
                    phase === "generating" ? "Generating listing…" :
                    "Enter an article or OEM number and press Search & Generate."
                  }
                />
              </Card>
            )}

            {phase === "selecting" && (
              <Card
                title="Select Article"
                subtitle={`Found ${searchResults.length} matches for "${query}" — click one to generate`}
                centeredTitle
              >
                <ArticleSelector
                  articles={searchResults}
                  onSelect={(articleNo) => generateListing(articleNo)}
                />
              </Card>
            )}

            {phase === "done" && result && (
              USE_TABBED_PREVIEW ? (
                <TabbedListingPreview
                  result={result}
                  html={displayHtml}
                  copyText={copyText}
                  renderSpecifics={() => (
                    <ItemSpecificsTab result={result} copyText={copyText} />
                  )}
                />
              ) : (
                <ListingOutput
                  result={result}
                  copyText={copyText}
                  customTemplateHtml={customTemplateHtml}
                  onSaveTemplate={handleSaveTemplate}
                  noRightPanel
                  onHtmlChange={(html) => { liveHtmlRef.current = html; }}
                />
              )
            )}
          </div>

          {/* ── Right column: article info & actions ── */}
          {phase === "done" && result && (
            <div style={{ display: "grid", gap: 12, position: "sticky", top: 16, maxHeight: "calc(100vh - 60px)", overflowY: "auto" }}>

              {/* Article chip */}
              <div style={{
                background: "var(--bg-nav)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "12px 16px",
                display: "flex", flexDirection: "column", gap: 4
              }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>Article</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-on-dark)" }}>{result.article_number || "—"}</div>
                {result.product_type && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{result.product_type}</div>
                )}
                {result.compatibility_count > 0 && (
                  <div style={{ fontSize: 11, color: "var(--green)", marginTop: 2 }}>
                    ✓ {result.compatibility_count} compatible vehicles
                  </div>
                )}
              </div>

              {/* Product Image — directly below article chip */}
              {result.article_image && (
                <div style={{
                  background: "var(--bg-surface3)", border: "1px solid var(--border)",
                  borderRadius: 14, padding: 12,
                  display: "flex", justifyContent: "center", alignItems: "center"
                }}>
                  <img src={result.article_image} alt={result.generated_title || "Product"}
                    style={{ maxWidth: "100%", maxHeight: 160, objectFit: "contain", borderRadius: 8 }} />
                </div>
              )}

              {/* Quick Actions */}
              <div style={{ display: "grid", gap: 8 }}>
                <CopyButton
                  onCopy={() => navigator.clipboard.writeText(liveHtmlRef.current || "")}
                  style={{ width: "100%", textAlign: "center", fontSize: 13 }}
                >
                  📋 Copy HTML
                </CopyButton>
              </div>

              {/* Active Title */}
              <div style={{
                background: "var(--bg-nav)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "12px 16px"
              }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
                  Title
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-on-dark)", lineHeight: 1.5, wordBreak: "break-word" }}>
                  {result.generated_title || "—"}
                </div>
                <div style={{
                  fontSize: 10, marginTop: 5, textAlign: "right",
                  color: (result.generated_title || "").length > 80 ? "var(--red)" :
                         (result.generated_title || "").length >= 70 ? "var(--green)" : "var(--text-muted)"
                }}>
                  {(result.generated_title || "").length} / 80
                </div>
              </div>

              {/* K Numbers */}
              {(result.k_number_list || []).length > 0 && (
                <div style={{
                  background: "var(--bg-nav)", border: "1px solid var(--border)",
                  borderRadius: 14, padding: "12px 16px"
                }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>K Numbers</div>
                  <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6, wordBreak: "break-word" }}>
                    {(result.k_number_list || []).join(", ")}
                  </div>
                  <CopyButton
                    value={(result.k_number_list || []).join(", ")}
                    style={{ marginTop: 8, fontSize: 11, padding: "5px 10px" }}
                  >
                    Copy K Numbers
                  </CopyButton>
                </div>
              )}

              {/* OEM Numbers */}
              {(result.oem_numbers || []).length > 0 && (
                <div style={{
                  background: "var(--bg-nav)", border: "1px solid var(--border)",
                  borderRadius: 14, padding: "12px 16px"
                }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>OEM Numbers</div>
                  <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6, wordBreak: "break-word" }}>
                    {(result.oem_numbers || []).slice(0, 8).join(", ")}
                    {(result.oem_numbers || []).length > 8 ? ` +${(result.oem_numbers || []).length - 8} more` : ""}
                  </div>
                </div>
              )}

              {/* Description HTML (collapsible) — uses a local toggle */}
              <RightPanelHtmlToggle htmlRef={liveHtmlRef} />

            </div>
          )}
        </div>
      </>)}

      {/* ── Generated Listings tab ── */}
      {innerPage === "generated" && (
        <GeneratedListings
          listings={listings}
          onUpdateStatus={onUpdateStatus}
          onUpdateStatusBatch={onUpdateStatusBatch}
          onUpdateListing={onUpdateListing}
          onRemove={onRemove}
          onRemoveBatch={onRemoveBatch}
        />
      )}
    </>
  );
}

// ─── Empty output placeholder ─────────────────────────────────────────────────

function EmptyOutputPanel({ message }) {
  return (
    <div style={{
      minHeight: 420, display: "grid", placeItems: "center",
      background: "var(--bg-surface3)", border: "1px dashed var(--border-strong)",
      borderRadius: 20, color: "var(--text-muted)", fontSize: 15, textAlign: "center", padding: 24
    }}>
      {message}
    </div>
  );
}

// ─── Article selector ─────────────────────────────────────────────────────────

function ArticleSelector({ articles, onSelect }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {articles.map((a, i) => (
        <button
          key={a.articleId || a.articleNo || i}
          onClick={() => onSelect(a.articleNo || a.articleId)}
          style={{
            display: "grid", gridTemplateColumns: "auto 1fr",
            gap: 14, alignItems: "center",
            background: "var(--border-light)", border: "1px solid var(--border-strong)",
            borderRadius: 14, padding: "14px 16px",
            cursor: "pointer", textAlign: "left", transition: "all 0.15s ease", width: "100%"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(19,93,255,0.10)"; e.currentTarget.style.borderColor = "rgba(19,93,255,0.4)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--border-light)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}
        >
          {/* Brand badge */}
          <div style={{
            background: a.brand ? "var(--blue)" : "var(--border)",
            color:      a.brand ? "var(--text-on-dark)"    : "var(--text-muted)",
            fontWeight: 700, fontSize: 11, padding: "4px 10px", borderRadius: 8,
            whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 0.5,
            border: a.brand ? "none" : "1px solid var(--border-strong)"
          }}>
            {a.brand || "—"}
          </div>

          {/* Info */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-on-dark)", marginBottom: 3 }}>
              {a.productName || "—"}
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Article No. <span style={{ color: "var(--text)" }}>{a.articleNo || "—"}</span>
              </span>
              {a.oemNumbers?.length > 0 && (
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  OEM: <span style={{ color: "var(--text)" }}>
                    {a.oemNumbers.slice(0, 3).join(", ")}{a.oemNumbers.length > 3 ? ` +${a.oemNumbers.length - 3}` : ""}
                  </span>
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Full listing output ──────────────────────────────────────────────────────

// ─── Section parser ───────────────────────────────────────────────────────────

// Returns { sections, wrapperOpen, wrapperClose }
// If the HTML is a single wrapper element (e.g. one outer <div>), we break
// open its children so each child becomes its own editable section.
// wrapperOpen / wrapperClose let us re-wrap on exit so the HTML stays identical.
function parseSections(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html.trim();
  const topKids = Array.from(tmp.children);

  // Single wrapper element → go one level deeper
  if (topKids.length === 1) {
    const wrapper = topKids[0];
    const innerKids = Array.from(wrapper.children);
    if (innerKids.length > 1) {
      // Build the opening tag by cloning without children
      const clone = wrapper.cloneNode(false); // shallow
      const openTag = clone.outerHTML.replace(/<\/[^>]+>$/, ""); // strip auto close tag
      const closeTag = `</${wrapper.tagName.toLowerCase()}>`;
      return {
        wrapperOpen:  openTag,
        wrapperClose: closeTag,
        sections: innerKids.map((el) => ({ id: makeRowId(), html: el.outerHTML }))
      };
    }
  }

  // Multiple top-level elements — no wrapper needed
  const kids = topKids.length > 0 ? topKids : [tmp];
  return {
    wrapperOpen:  null,
    wrapperClose: null,
    sections: kids.map((el) => ({ id: makeRowId(), html: el.outerHTML }))
  };
}

// ─── Individual editable section ─────────────────────────────────────────────
// Uses a ref to set initial HTML so React never overwrites in-progress edits.

const SectionEditor = memo(function SectionEditor({ sectionId, initialHtml, onBlur, onKeyDown }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = initialHtml;
  }, [sectionId]); // only re-init when the section is brand-new (new ID)

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onBlur(e.currentTarget.innerHTML)}
      onKeyDown={onKeyDown}
      style={{ outline: "none", minHeight: 8, cursor: "text" }}
    />
  );
});

// ─── Insert zone (shown between sections in edit mode) ────────────────────────

const BLOCK_TEMPLATES = [
  {
    label: "Text",
    html: '<div style="padding:12px 16px;font-size:15px;line-height:1.7;color:#333333;">Type your text here.</div>'
  },
  {
    label: "Red Header",
    html: '<div style="background:#cc0000;color:#ffffff;font-weight:bold;text-align:center;padding:8px 12px;font-size:17px;">New Section Header</div>'
  },
  {
    label: "Note ⚠",
    html: '<div style="background:#fff8e1;border:1px solid #f59e0b;padding:12px 16px;font-size:14px;color:#92400e;border-radius:4px;">⚠️ Add your note here.</div>'
  },
  {
    label: "Info ℹ",
    html: '<div style="background:#eff6ff;border:1px solid #3b82f6;padding:12px 16px;font-size:14px;color:#1e40af;border-radius:4px;">ℹ️ Add info here.</div>'
  },
  {
    label: "Divider",
    html: '<hr style="border:none;border-top:2px solid #e5e7eb;margin:8px 0;" />'
  },
];

function InsertZone({ onInsert }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative", zIndex: 2 }}>
      {open ? (
        /* expanded chooser */
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
          padding: "8px 10px", margin: "4px 0",
          background: "var(--bg-surface2)", border: "1px dashed #93c5fd", borderRadius: 10
        }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, marginRight: 2 }}>INSERT:</span>
          {BLOCK_TEMPLATES.map((t) => (
            <button
              key={t.label}
              onClick={() => { onInsert(t.html); setOpen(false); }}
              style={{
                padding: "4px 12px", borderRadius: 8, fontSize: 12,
                background: "var(--blue)", color: "var(--text-on-dark)",
                border: "none", cursor: "pointer", fontWeight: 600
              }}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => setOpen(false)}
            style={{
              padding: "4px 8px", borderRadius: 8, fontSize: 12,
              background: "transparent", color: "var(--text-muted)",
              border: "1px solid #d1d5db", cursor: "pointer", marginLeft: 2
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        /* hover-reveal dashed line with + button */
        <div
          className="insert-zone-trigger"
          onClick={() => setOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 0,
            height: 22, cursor: "pointer", margin: "2px 0",
            opacity: 0, transition: "opacity 0.15s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
        >
          <div style={{ flex: 1, height: 1, background: "var(--blue)", opacity: 0.5 }} />
          <span style={{
            padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700,
            background: "var(--blue)", color: "var(--text-on-dark)", margin: "0 6px",
            userSelect: "none", whiteSpace: "nowrap"
          }}>
            + Insert
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--blue)", opacity: 0.5 }} />
        </div>
      )}
    </div>
  );
}

// ─── RightPanelHtmlToggle ─────────────────────────────────────────────────────
// Small collapsible HTML viewer that reads from a ref (updated live by ListingOutput)

function RightPanelHtmlToggle({ htmlRef }) {
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState("");

  const toggle = () => {
    if (!open) setHtml(htmlRef.current || "");
    setOpen((v) => !v);
  };

  return (
    <div>
      <button
        onClick={toggle}
        style={{
          ...SMALL_BUTTON_STYLE, width: "100%", textAlign: "center",
          fontSize: 12, background: "var(--border-light)", boxShadow: "none",
          color: "var(--text-muted)", border: "1px solid var(--border-strong)"
        }}
      >
        {open ? "▲ Hide HTML" : "▼ Show Description HTML"}
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          <ReadOnlyTextarea value={html} minHeight={140} />
        </div>
      )}
    </div>
  );
}

// ─── AI Title Suggestions ────────────────────────────────────────────────────

const STYLE_LABELS = {
  engine_code_model_hybrid: "Engine Code + Model",
  vehicle_model_focused:    "Model + OEM",
  oem_focused:              "Engine Code + Model + OEM"
};

function AiTitleSuggestions({ result, apiUrl, onUseTitle }) {
  const [titles,   setTitles]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [copied,   setCopied]   = useState(null); // style key of last copied
  const [applied,  setApplied]  = useState(null); // style key of last applied

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setTitles(null);
    try {
      const payload = {
        productType:    result.product_type    || "",
        brand:          result.brand           || "",
        oemNumbers:     result.oem_numbers     || [],
        topModels:      result.top_models      || [],
        engineCodes:    result.engine_codes    || [],
        engineSizes:    result.engine_sizes    || [],
        fuelType:       result.fuel_type       || "",
        yearRange:      result.year_range      || "",
        maxTitleLength: 80
      };
      const res = await fetch(`${apiUrl}/api/ai/generate-titles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`AI title generation failed (HTTP ${res.status}). Please try again.`);
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI title generation failed.");
      if (!Array.isArray(data.titles) || data.titles.length === 0) {
        throw new Error("No titles returned.");
      }
      setTitles(data.titles);
    } catch (err) {
      setError(String(err.message || "AI title generation failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (title, style) => {
    try {
      await navigator.clipboard.writeText(title);
      setCopied(style);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  const charColor = (count) => {
    if (count >= 75) return "var(--green)";
    if (count >= 60) return "var(--yellow)";
    return "var(--text-muted)";
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, var(--blue) 0%, #7C3AED 100%)",
      borderRadius: 22,
      padding: 2,
      boxShadow: "0 0 24px var(--border-blue), 0 0 48px rgba(124,58,237,0.10)"
    }}>
    <div style={{
      background: "var(--bg-surface)",
      borderRadius: 20,
      padding: 20,
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: titles || error ? 16 : 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{
              fontSize: 11, fontWeight: 800, letterSpacing: 1,
              background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              textTransform: "uppercase"
            }}>✦ AI</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-on-dark)" }}>Title Suggestions</div>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Generate 3 optimised eBay title styles from the listing data.
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: "10px 20px", borderRadius: 12, border: "none",
            background: loading ? "rgba(19,93,255,0.3)" : "var(--blue)",
            color: "var(--text-on-dark)", fontWeight: 700, fontSize: 13,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "all 0.15s ease",
            whiteSpace: "nowrap", flexShrink: 0
          }}
        >
          {loading ? "Generating…" : titles ? "Regenerate" : "Generate AI Titles"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "var(--bg-surface3)", color: "var(--red)",
          border: "1px solid rgba(220,38,38,0.4)", borderRadius: 12,
          padding: "12px 14px", fontSize: 13
        }}>
          {error}
        </div>
      )}

      {/* Title cards */}
      {titles && (
        <div style={{ display: "grid", gap: 12 }}>
          {titles.map((t) => (
            <div key={t.style} style={{
              background: "var(--bg-surface3)",
              border: "1px solid var(--border)",
              borderRadius: 14, padding: 16
            }}>
              {/* Style label + char count */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
                  textTransform: "uppercase", letterSpacing: 0.6
                }}>
                  {STYLE_LABELS[t.style] || t.style}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: charColor(t.characterCount) }}>
                  {t.characterCount} / 80
                </span>
              </div>

              {/* Title text */}
              <div style={{
                fontSize: 15, fontWeight: 600, color: "var(--text-on-dark)",
                lineHeight: 1.4, marginBottom: 8,
                wordBreak: "break-word"
              }}>
                {t.title}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleCopy(t.title, t.style)}
                  style={{
                    padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", border: "1px solid var(--border-strong)",
                    background: copied === t.style ? "rgba(74,222,128,0.15)" : "var(--border-light)",
                    color: copied === t.style ? "var(--green)" : "var(--text-muted)",
                    transition: "all 0.15s ease"
                  }}
                >
                  {copied === t.style ? "Copied ✓" : "Copy"}
                </button>
                <button
                  onClick={() => {
                    onUseTitle(t.title);
                    setApplied(t.style);
                    setTimeout(() => setApplied(null), 2000);
                  }}
                  style={{
                    padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700,
                    cursor: "pointer",
                    border: applied === t.style ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(19,93,255,0.4)",
                    background: applied === t.style ? "rgba(74,222,128,0.15)" : "rgba(19,93,255,0.15)",
                    color: applied === t.style ? "var(--green)" : "var(--text-accent)",
                    transition: "all 0.15s ease"
                  }}
                >
                  {applied === t.style ? "✓ Applied!" : "Use this title"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
}

// ─── ListingOutput ────────────────────────────────────────────────────────────

function resolveHtml(customTemplateHtml, generatedHtml) {
  return customTemplateHtml
    ? mergeTemplateWithContent(customTemplateHtml, generatedHtml ?? "")
    : (generatedHtml ?? "");
}

function ListingOutput({ result, copyText, customTemplateHtml, onSaveTemplate, noRightPanel = false, onHtmlChange }) {
  const [innerTab,     setInnerTab]     = useState("overview"); // "overview" | "specifics"
  const [editMode,     setEditMode]     = useState(false);
  const [editedHtml,   setEditedHtml]   = useState(
    () => resolveHtml(customTemplateHtml, result.generated_html)
  );
  const [sections,     setSections]     = useState([]);
  const [wrapperOpen,  setWrapperOpen]  = useState(null);
  const [wrapperClose, setWrapperClose] = useState(null);
  const [textColor,    setTextColor]    = useState("#cc0000");
  const [boxBgColor,        setBoxBgColor]        = useState("var(--text-on-dark)");
  const [borderColor,       setBorderColor]       = useState("#000000");
  const [borderWidth,       setBorderWidth]       = useState("1px");
  const [tableBorderColor,  setTableBorderColor]  = useState("#cccccc");
  const [tableBorderWidth,  setTableBorderWidth]  = useState("1px");
  const [saveMode,          setSaveMode]          = useState(false);
  const [saveName,          setSaveName]          = useState("");
  const [showDescHtml,      setShowDescHtml]      = useState(false);

  // Refs that hold the DOM element to style — captured at mousedown (before
  // the color picker / select steals focus and kills the selection).
  const activeTargetRef = useRef(null);
  const activeTableRef  = useRef(null);

  // Sync whenever the generated HTML or selected template changes
  useEffect(() => {
    setEditedHtml(resolveHtml(customTemplateHtml, result.generated_html));
  }, [result.generated_html, customTemplateHtml]);

  // Notify parent of latest editedHtml (for Copy HTML in detached right panel)
  useEffect(() => {
    onHtmlChange?.(editedHtml);
  }, [editedHtml]);

  // ── Edit mode enter / exit ──────────────────────────────────────────────
  const enterEdit = () => {
    const parsed = parseSections(editedHtml);
    setSections(parsed.sections);
    setWrapperOpen(parsed.wrapperOpen);
    setWrapperClose(parsed.wrapperClose);
    setEditMode(true);
  };

  const joinHtml = (sects, open, close) => {
    const inner = sects.map((s) => s.html).join("\n");
    return open ? `${open}${inner}${close}` : inner;
  };

  const exitEdit = () => {
    // Flush any section whose blur hasn't fired yet by reading the DOM directly.
    // [data-sec] wraps the SectionEditor, so we need the [contenteditable] inside it.
    const dataSecs = document.querySelectorAll("[data-sec]");
    setSections((prev) => {
      const flushed = prev.map((s, i) => {
        const ce = dataSecs[i]?.querySelector("[contenteditable]");
        return { ...s, html: ce ? ce.innerHTML : s.html };
      });
      setEditedHtml(joinHtml(flushed, wrapperOpen, wrapperClose));
      return flushed;
    });
    setSaveMode(false);
    setSaveName("");
    setEditMode(false);
  };

  // ── Section CRUD ───────────────────────────────────────────────────────
  const updateSection = (idx, html) =>
    setSections((prev) => {
      const next = prev.map((s, i) => (i === idx ? { ...s, html } : s));
      setEditedHtml(joinHtml(next, wrapperOpen, wrapperClose));
      return next;
    });

  const insertSection = (atIdx, blockHtml) =>
    setSections((prev) => {
      const next = [...prev];
      next.splice(atIdx, 0, { id: makeRowId(), html: blockHtml });
      setEditedHtml(joinHtml(next, wrapperOpen, wrapperClose));
      return next;
    });

  const deleteSection = (idx) =>
    setSections((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setEditedHtml(joinHtml(next, wrapperOpen, wrapperClose));
      return next;
    });

  // ── Toolbar commands (work on current browser selection) ───────────────
  const exec = (cmd, val = null) => document.execCommand(cmd, false, val);

  const applyFontSize = (px) => {
    document.execCommand("fontSize", false, "7");
    document.querySelectorAll('[data-sec] font[size="7"]').forEach((el) => {
      el.removeAttribute("size");
      el.style.fontSize = px;
    });
  };

  const applyColor = (color) => {
    setTextColor(color);
    document.execCommand("foreColor", false, color);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.execCommand("insertLineBreak");
    }
  };

  // ── Styling helpers ────────────────────────────────────────────────────
  // Called ONLY from the preview-area onMouseDown (e.target is always the
  // real clicked element, captured before any picker/dropdown steals focus).
  // Toolbar buttons must NOT call this — their onMouseDown fires after the
  // preview click, and window.getSelection() at that point can be stale.
  const BLOCK_TAGS = new Set([
    "DIV","P","H1","H2","H3","H4","H5","H6",
    "SECTION","ARTICLE","HEADER","FOOTER","BLOCKQUOTE","PRE","LI"
  ]);

  const captureTarget = (clickedNode) => {
    if (!clickedNode) return;
    const startEl = clickedNode.nodeType === Node.ELEMENT_NODE
      ? clickedNode : clickedNode.parentElement;
    if (!startEl) return;

    // Find the contentEditable ancestor (SectionEditor root)
    let ceDiv = startEl;
    while (ceDiv && ceDiv.contentEditable !== "true") ceDiv = ceDiv.parentElement;
    if (!ceDiv) return; // click was outside any editor (gutter, InsertZone, etc.)

    // ① td / th → use that cell + its parent table
    let node = startEl;
    while (node && node !== ceDiv) {
      if (node.nodeName === "TD" || node.nodeName === "TH") {
        activeTargetRef.current = node;
        let tbl = node.parentElement;
        while (tbl && tbl.nodeName !== "TABLE") tbl = tbl.parentElement;
        activeTableRef.current = tbl?.nodeName === "TABLE" ? tbl : null;
        return;
      }
      node = node.parentElement;
    }

    // ② Find the nearest block-level ancestor below ceDiv.
    //    This targets the specific div/header the user actually clicked
    //    (e.g. the red header div, not the outer wrapper).
    let blockEl = startEl;
    while (blockEl && blockEl !== ceDiv) {
      if (BLOCK_TAGS.has(blockEl.nodeName)) {
        activeTargetRef.current = blockEl;
        activeTableRef.current  = null;
        return;
      }
      blockEl = blockEl.parentElement;
    }

    // ③ Fallback: direct child of ceDiv
    let sectionRoot = startEl;
    while (sectionRoot && sectionRoot.parentElement !== ceDiv) {
      sectionRoot = sectionRoot.parentElement;
    }
    activeTargetRef.current = (sectionRoot && sectionRoot !== ceDiv)
      ? sectionRoot : ceDiv.firstElementChild;
    activeTableRef.current = null;
  };

  // ── Container fill & border ────────────────────────────────────────────
  const applyBoxBackground = (color) => {
    setBoxBgColor(color);
    const el = activeTargetRef.current;
    if (el) el.style.background = color;
  };

  const applyBoxBorder = (color, width) => {
    setBorderColor(color);
    const el = activeTargetRef.current;
    if (!el) return;
    const w = width !== undefined ? width : borderWidth;
    if (width !== undefined) setBorderWidth(w);
    if (w === "0px") {
      el.style.border = "none";
    } else {
      el.style.borderStyle = "solid";
      el.style.borderColor = color;
      el.style.borderWidth = w;
    }
  };

  const applyBorderWidth = (width) => {
    setBorderWidth(width);
    const el = activeTargetRef.current;
    if (!el) return;
    if (width === "0px") {
      el.style.border = "none";
    } else {
      el.style.borderStyle = "solid";
      el.style.borderColor = borderColor;
      el.style.borderWidth = width;
    }
  };

  // ── Table-specific helpers ─────────────────────────────────────────────
  const applyTableCellBorder = (color, width) => {
    const c = color !== undefined ? color : tableBorderColor;
    const w = width !== undefined ? width : tableBorderWidth;
    if (color !== undefined) setTableBorderColor(color);
    if (width !== undefined) setTableBorderWidth(width);
    const tbl = activeTableRef.current;
    if (!tbl) return;
    tbl.style.borderCollapse = "collapse";
    tbl.querySelectorAll("td, th").forEach((cell) => {
      if (w === "0px") {
        cell.style.border = "none";
      } else {
        cell.style.borderStyle = "solid";
        cell.style.borderColor = c;
        cell.style.borderWidth = w;
      }
    });
    if (w === "0px") {
      tbl.style.border = "none";
    } else {
      tbl.style.borderStyle = "solid";
      tbl.style.borderColor = c;
      tbl.style.borderWidth = w;
    }
  };

  const applyTableBorderWidth = (width) => {
    applyTableCellBorder(tableBorderColor, width);
  };

  // ── Save current editing state as a reusable template ─────────────────
  const doSaveTemplate = () => {
    if (!onSaveTemplate) return;
    // Flush any unblurred sections directly from the DOM
    const dataSecs = document.querySelectorAll("[data-sec]");
    const flushed = sections.map((s, i) => {
      const ce = dataSecs[i]?.querySelector("[contenteditable]");
      return { ...s, html: ce ? ce.innerHTML : s.html };
    });
    const fullHtml  = joinHtml(flushed, wrapperOpen, wrapperClose);
    const blanked   = blankContentHtml(fullHtml);
    onSaveTemplate(saveName, blanked);
    setSaveMode(false);
    setSaveName("");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: noRightPanel ? "1fr" : "1fr 290px", gap: 20, alignItems: "start" }}>

      {/* ── Left: Preview / Item Specifics ── */}
      <div style={{ display: "grid", gap: 14 }}>

        {/* Tab bar */}
        <div style={{
          display: "flex", gap: 6,
          background: "var(--bg-nav)", borderRadius: 14, padding: 4,
          border: "1px solid var(--border-light)"
        }}>
          {[
            { key: "overview",  label: "Preview"        },
            { key: "specifics", label: "Item Specifics" }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setInnerTab(key)}
              style={{
                flex: 1, padding: "9px 14px", borderRadius: 10,
                border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
                background: innerTab === key ? "var(--blue)" : "transparent",
                color:      innerTab === key ? "var(--text-on-dark)"    : "var(--text-muted)",
                boxShadow:  innerTab === key ? "0 0 14px rgba(19,93,255,0.28)" : "none",
                transition: "all 0.18s ease"
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Editor Toolbar (preview tab + edit mode only) */}
        {innerTab === "overview" && editMode && (
          <EditorToolbar
            exec={exec}
            applyFontSize={applyFontSize}
            applyColor={applyColor}
            textColor={textColor}
            boxBgColor={boxBgColor}
            borderColor={borderColor}
            borderWidth={borderWidth}
            applyBoxBackground={applyBoxBackground}
            applyBoxBorder={applyBoxBorder}
            applyBorderWidth={applyBorderWidth}
            tableBorderColor={tableBorderColor}
            tableBorderWidth={tableBorderWidth}
            applyTableCellBorder={applyTableCellBorder}
            applyTableBorderWidth={applyTableBorderWidth}
          />
        )}

        {/* Live Preview */}
        {innerTab === "overview" && (
          <div
            onMouseDown={editMode ? (e) => captureTarget(e.target) : undefined}
            style={{
              background: "var(--text-on-dark)",
              border: editMode ? "2px solid var(--blue)" : "1px solid var(--border)",
              borderRadius: 18, padding: 18,
              overflowX: "auto", overflowY: "auto",
              maxHeight: "calc(100vh - 230px)",
              boxShadow: editMode ? "0 0 0 4px rgba(19,93,255,0.12)" : "0 0 16px rgba(19,93,255,0.08)"
            }}
          >
            {editMode ? (
              <>
                <InsertZone onInsert={(html) => insertSection(0, html)} />
                {sections.map((sec, idx) => (
                  <React.Fragment key={sec.id}>
                    <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 2 }}>
                      <div style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        gap: 4, paddingTop: 4, flexShrink: 0
                      }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
                          background: "#f3f4f6", borderRadius: 4,
                          padding: "1px 5px", userSelect: "none"
                        }}>{idx + 1}</span>
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => deleteSection(idx)}
                          title={`Delete section ${idx + 1}`}
                          style={{
                            width: 22, height: 22, borderRadius: 6,
                            background: "#fee2e2", color: "#ef4444",
                            border: "1px solid #fca5a5",
                            cursor: "pointer", fontSize: 14, lineHeight: 1,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0
                          }}
                        >×</button>
                      </div>
                      <div data-sec={idx} style={{ flex: 1, minWidth: 0 }}>
                        <SectionEditor
                          sectionId={sec.id}
                          initialHtml={sec.html}
                          onBlur={(html) => updateSection(idx, html)}
                          onKeyDown={handleKeyDown}
                        />
                      </div>
                    </div>
                    <InsertZone onInsert={(html) => insertSection(idx + 1, html)} />
                  </React.Fragment>
                ))}
              </>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: editedHtml }} />
            )}
          </div>
        )}

        {/* Item Specifics tab */}
        {innerTab === "specifics" && (
          <ItemSpecificsTab result={result} copyText={copyText} />
        )}

      </div>

      {/* ── Right: Info & Actions Panel (only when not in noRightPanel mode) ── */}
      {!noRightPanel && (
        <div style={{ display: "grid", gap: 12, position: "sticky", top: 16, maxHeight: "calc(100vh - 60px)", overflowY: "auto" }}>

          {/* Article chip */}
          <div style={{
            background: "var(--bg-nav)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "12px 16px",
            display: "flex", flexDirection: "column", gap: 4
          }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>Article</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-on-dark)" }}>{result.article_number || "—"}</div>
            {result.product_type && (
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{result.product_type}</div>
            )}
            {result.compatibility_count > 0 && (
              <div style={{ fontSize: 11, color: "var(--green)", marginTop: 2 }}>
                ✓ {result.compatibility_count} compatible vehicles
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ display: "grid", gap: 8 }}>
            <CopyButton
              value={result.generated_title}
              style={{ width: "100%", textAlign: "center", fontSize: 13 }}
            >
              📋 Copy Title
            </CopyButton>
            <CopyButton
              value={editedHtml}
              style={{ width: "100%", textAlign: "center", fontSize: 13 }}
            >
              📋 Copy HTML
            </CopyButton>
            {!editMode ? (
              <button
                onClick={enterEdit}
                style={{ ...SMALL_BUTTON_STYLE, width: "100%", textAlign: "center", fontSize: 13 }}
              >
                ✎ Edit Preview
              </button>
            ) : (
              <>
                <button
                  onClick={exitEdit}
                  style={{ ...SMALL_BUTTON_STYLE, width: "100%", textAlign: "center", fontSize: 13, background: "#16a34a", boxShadow: "0 0 16px rgba(22,163,74,0.3)" }}
                >
                  ✓ Done Editing
                </button>
                {saveMode ? (
                  <div style={{ display: "grid", gap: 6 }}>
                    <input
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && doSaveTemplate()}
                      placeholder="Template name…"
                      autoFocus
                      style={{
                        padding: "6px 10px", borderRadius: 10, fontSize: 12,
                        background: "var(--bg-surface2)", color: "var(--text-on-dark)",
                        border: "1px solid rgba(255,255,255,0.20)", outline: "none"
                      }}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={doSaveTemplate}
                        style={{ ...SMALL_BUTTON_STYLE, flex: 1, textAlign: "center", fontSize: 12, background: "#b45309", boxShadow: "0 0 12px rgba(180,83,9,0.3)" }}>
                        💾 Save
                      </button>
                      <button onClick={() => { setSaveMode(false); setSaveName(""); }}
                        style={{ ...SMALL_BUTTON_STYLE, flex: 1, textAlign: "center", fontSize: 12, background: "var(--text-dim)", boxShadow: "none" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSaveMode(true)}
                    style={{ ...SMALL_BUTTON_STYLE, width: "100%", textAlign: "center", fontSize: 12, background: "#92400e", boxShadow: "0 0 12px rgba(146,64,14,0.3)" }}
                  >
                    📐 Save as Template
                  </button>
                )}
              </>
            )}
          </div>

          {/* K Numbers */}
          {(result.k_number_list || []).length > 0 && (
            <div style={{
              background: "var(--bg-nav)", border: "1px solid var(--border)",
              borderRadius: 14, padding: "12px 16px"
            }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>K Numbers</div>
              <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6, wordBreak: "break-word" }}>
                {(result.k_number_list || []).join(", ")}
              </div>
              <CopyButton
                value={(result.k_number_list || []).join(", ")}
                style={{ marginTop: 8, fontSize: 11, padding: "5px 10px" }}
              >
                Copy K Numbers
              </CopyButton>
            </div>
          )}

          {/* OEM Numbers */}
          {(result.oem_numbers || []).length > 0 && (
            <div style={{
              background: "var(--bg-nav)", border: "1px solid var(--border)",
              borderRadius: 14, padding: "12px 16px"
            }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>OEM Numbers</div>
              <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6, wordBreak: "break-word" }}>
                {(result.oem_numbers || []).slice(0, 8).join(", ")}
                {(result.oem_numbers || []).length > 8 ? ` +${(result.oem_numbers || []).length - 8} more` : ""}
              </div>
            </div>
          )}

          {/* Product Image */}
          {result.article_image && (
            <div style={{
              background: "var(--bg-surface3)", border: "1px solid var(--border)",
              borderRadius: 14, padding: 12,
              display: "flex", justifyContent: "center", alignItems: "center"
            }}>
              <img src={result.article_image} alt={result.generated_title || "Product"}
                style={{ maxWidth: "100%", maxHeight: 160, objectFit: "contain", borderRadius: 8 }} />
            </div>
          )}

          {/* Description HTML (collapsible) */}
          <div>
            <button
              onClick={() => setShowDescHtml((v) => !v)}
              style={{
                ...SMALL_BUTTON_STYLE, width: "100%", textAlign: "center",
                fontSize: 12, background: "var(--border-light)", boxShadow: "none",
                color: "var(--text-muted)", border: "1px solid var(--border-strong)"
              }}
            >
              {showDescHtml ? "▲ Hide HTML" : "▼ Show Description HTML"}
            </button>
            {showDescHtml && (
              <div style={{ marginTop: 8 }}>
                <ReadOnlyTextarea value={editedHtml} minHeight={140} />
              </div>
            )}
          </div>

        </div>
      )}

      {/* Edit / Save Template controls shown inline when noRightPanel */}
      {noRightPanel && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: -6 }}>
          {!editMode ? (
            <button
              onClick={enterEdit}
              style={{ ...SMALL_BUTTON_STYLE, fontSize: 13 }}
            >
              ✎ Edit Preview
            </button>
          ) : (
            <>
              <button
                onClick={exitEdit}
                style={{ ...SMALL_BUTTON_STYLE, fontSize: 13, background: "#16a34a", boxShadow: "0 0 16px rgba(22,163,74,0.3)" }}
              >
                ✓ Done Editing
              </button>
              {saveMode ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doSaveTemplate()}
                    placeholder="Template name…"
                    autoFocus
                    style={{
                      padding: "6px 10px", borderRadius: 10, fontSize: 12,
                      background: "var(--bg-surface2)", color: "var(--text-on-dark)",
                      border: "1px solid rgba(255,255,255,0.20)", outline: "none"
                    }}
                  />
                  <button onClick={doSaveTemplate}
                    style={{ ...SMALL_BUTTON_STYLE, fontSize: 12, background: "#b45309", boxShadow: "0 0 12px rgba(180,83,9,0.3)" }}>
                    💾 Save
                  </button>
                  <button onClick={() => { setSaveMode(false); setSaveName(""); }}
                    style={{ ...SMALL_BUTTON_STYLE, fontSize: 12, background: "var(--text-dim)", boxShadow: "none" }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSaveMode(true)}
                  style={{ ...SMALL_BUTTON_STYLE, fontSize: 12, background: "#92400e", boxShadow: "0 0 12px rgba(146,64,14,0.3)" }}
                >
                  📐 Save as Template
                </button>
              )}
            </>
          )}
        </div>
      )}

    </div>
  );
}

// ─── Editor toolbar ───────────────────────────────────────────────────────────

function EditorToolbar({
  exec, applyFontSize, applyColor, textColor,
  boxBgColor, borderColor, borderWidth,
  applyBoxBackground, applyBoxBorder, applyBorderWidth,
  tableBorderColor, tableBorderWidth,
  applyTableCellBorder, applyTableBorderWidth
}) {
  const colorInputRef      = useRef(null);
  const boxBgInputRef      = useRef(null);
  const borderClrInputRef  = useRef(null);
  const tblBorderClrRef    = useRef(null);

  const FONT_SIZES = [
    ["8px","8"], ["10px","10"], ["12px","12"], ["13px","13"], ["14px","14"],
    ["16px","16"], ["18px","18"], ["20px","20"], ["24px","24"],
    ["28px","28"], ["32px","32"], ["36px","36"], ["48px","48"]
  ];

  const FONT_FAMILIES = [
    // System fonts
    ["Arial",           "Arial, sans-serif"],
    ["Verdana",         "Verdana, sans-serif"],
    ["Tahoma",          "Tahoma, sans-serif"],
    ["Trebuchet MS",    "'Trebuchet MS', sans-serif"],
    ["Georgia",         "Georgia, serif"],
    ["Times New Roman", "'Times New Roman', serif"],
    ["Courier New",     "'Courier New', monospace"],
    // Google fonts — sans-serif
    ["Inter",           "'Inter', sans-serif"],
    ["Roboto",          "'Roboto', sans-serif"],
    ["Open Sans",       "'Open Sans', sans-serif"],
    ["Lato",            "'Lato', sans-serif"],
    ["Poppins",         "'Poppins', sans-serif"],
    ["Montserrat",      "'Montserrat', sans-serif"],
    ["Raleway",         "'Raleway', sans-serif"],
    ["Nunito",          "'Nunito', sans-serif"],
    ["Ubuntu",          "'Ubuntu', sans-serif"],
    ["Oswald",          "'Oswald', sans-serif"],
    ["Noto Sans",       "'Noto Sans', sans-serif"],
    ["Source Sans 3",   "'Source Sans 3', sans-serif"],
    ["PT Sans",         "'PT Sans', sans-serif"],
    // Google fonts — serif
    ["Playfair Display","'Playfair Display', serif"],
    ["Merriweather",    "'Merriweather', serif"],
  ];

  const btn = (label, cmd, extra = {}) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); exec(cmd); }}
      title={cmd}
      style={{
        padding: "5px 10px", borderRadius: 8, cursor: "pointer",
        border: "1px solid rgba(255,255,255,0.15)",
        background: "var(--border)", color: "var(--text-on-dark)",
        fontSize: 13, userSelect: "none", lineHeight: 1.3,
        ...extra
      }}
    >
      {label}
    </button>
  );

  const sep = (
    <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.15)", margin: "0 2px" }} />
  );

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center",
      padding: "10px 12px", marginBottom: 12,
      background: "var(--bg-nav)", border: "1px solid var(--border-strong)",
      borderRadius: 14,
      position: "sticky", top: 0, zIndex: 50,
      backdropFilter: "blur(8px)"
    }}>

      {/* Text style */}
      {btn("B", "bold",          { fontWeight: 900 })}
      {btn("I", "italic",        { fontStyle: "italic" })}
      {btn("U", "underline",     { textDecoration: "underline" })}
      {btn("S̶", "strikeThrough", { textDecoration: "line-through" })}

      {sep}

      {/* Alignment */}
      {btn("≡ L", "justifyLeft")}
      {btn("≡ C", "justifyCenter")}
      {btn("≡ R", "justifyRight")}

      {sep}

      {/* Font family */}
      <select
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          if (!e.target.value) return;
          exec("fontName", e.target.value);
          e.target.value = "";
        }}
        defaultValue=""
        style={{
          padding: "5px 8px", borderRadius: 8, fontSize: 12,
          background: "var(--bg-surface2)", color: "var(--text-on-dark)",
          border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer",
          maxWidth: 150
        }}
      >
        <option value="" disabled>Font</option>
        {FONT_FAMILIES.map(([label, val]) => (
          <option key={val} value={val} style={{ fontFamily: val }}>{label}</option>
        ))}
      </select>

      {/* Font size */}
      <select
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          if (!e.target.value) return;
          applyFontSize(e.target.value);
          e.target.value = "";
        }}
        defaultValue=""
        style={{
          padding: "5px 8px", borderRadius: 8, fontSize: 12,
          background: "var(--bg-surface2)", color: "var(--text-on-dark)",
          border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer"
        }}
      >
        <option value="" disabled>Size</option>
        {FONT_SIZES.map(([label, val]) => (
          <option key={val} value={`${val}px`}>{label}</option>
        ))}
      </select>

      {sep}

      {/* Text colour */}
      <button
        onMouseDown={(e) => { e.preventDefault(); colorInputRef.current?.click(); }}
        title="Text colour"
        style={{
          padding: "5px 10px", borderRadius: 8, cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.15)",
          background: "var(--border)", userSelect: "none",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2
        }}
      >
        <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1 }}>Text</span>
        <span style={{ fontSize: 13, color: "var(--text-on-dark)", lineHeight: 1, fontWeight: 700 }}>A</span>
        <span style={{ width: 16, height: 3, borderRadius: 2, background: textColor, display: "block" }} />
      </button>
      <input
        ref={colorInputRef}
        type="color"
        value={textColor}
        onChange={(e) => applyColor(e.target.value)}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
      />

      {sep}

      {/* Box / container background fill — works on divs and table cells */}
      <button
        onMouseDown={(e) => { e.preventDefault(); boxBgInputRef.current?.click(); }}
        title="Fill — sets background of the container or cell the cursor is in"
        style={{
          padding: "5px 10px", borderRadius: 8, cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.15)",
          background: "var(--border)", userSelect: "none",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2
        }}
      >
        <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1 }}>Fill</span>
        <span style={{ width: 16, height: 10, borderRadius: 3, background: boxBgColor, display: "block", border: "1px solid rgba(255,255,255,0.2)" }} />
      </button>
      <input
        ref={boxBgInputRef}
        type="color"
        value={boxBgColor}
        onChange={(e) => applyBoxBackground(e.target.value)}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
      />

      {/* Container border colour */}
      <button
        onMouseDown={(e) => { e.preventDefault(); borderClrInputRef.current?.click(); }}
        title="Border colour — sets border of the container or cell"
        style={{
          padding: "5px 10px", borderRadius: 8, cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.15)",
          background: "var(--border)", userSelect: "none",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2
        }}
      >
        <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1 }}>Border</span>
        <span style={{ width: 16, height: 10, borderRadius: 3, background: "transparent", display: "block", border: `2px solid ${borderColor}` }} />
      </button>
      <input
        ref={borderClrInputRef}
        type="color"
        value={borderColor}
        onChange={(e) => applyBoxBorder(e.target.value)}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
      />

      {/* Container border width */}
      <select
        onMouseDown={(e) => e.stopPropagation()}
        value={borderWidth}
        onChange={(e) => applyBorderWidth(e.target.value)}
        title="Border thickness"
        style={{
          padding: "5px 8px", borderRadius: 8, fontSize: 12,
          background: "var(--bg-surface2)", color: "var(--text-on-dark)",
          border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer"
        }}
      >
        <option value="0px">None</option>
        <option value="1px">1px</option>
        <option value="2px">2px</option>
        <option value="3px">3px</option>
        <option value="4px">4px</option>
        <option value="6px">6px</option>
      </select>

      {sep}

      {/* ── TABLE section ───────────────────────────────────────────────── */}
      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", userSelect: "none", letterSpacing: 0.5 }}>TABLE</span>

      {/* Table cell border colour */}
      <button
        onMouseDown={(e) => { e.preventDefault(); tblBorderClrRef.current?.click(); }}
        title="Table — set border colour on all cells"
        style={{
          padding: "5px 10px", borderRadius: 8, cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.15)",
          background: "var(--border)", userSelect: "none",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2
        }}
      >
        <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1 }}>Lines</span>
        {/* mini table icon */}
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none" style={{ display: "block" }}>
          <rect x="0.5" y="0.5" width="15" height="9" stroke={tableBorderColor} strokeWidth="1.2" fill="none" rx="1"/>
          <line x1="8" y1="0.5" x2="8" y2="9.5" stroke={tableBorderColor} strokeWidth="1"/>
          <line x1="0.5" y1="5" x2="15.5" y2="5" stroke={tableBorderColor} strokeWidth="1"/>
        </svg>
      </button>
      <input
        ref={tblBorderClrRef}
        type="color"
        value={tableBorderColor}
        onChange={(e) => applyTableCellBorder(e.target.value, undefined)}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
      />

      {/* Table cell border line weight */}
      <select
        onMouseDown={(e) => e.stopPropagation()}
        value={tableBorderWidth}
        onChange={(e) => applyTableBorderWidth(e.target.value)}
        title="Table line weight"
        style={{
          padding: "5px 8px", borderRadius: 8, fontSize: 12,
          background: "var(--bg-surface2)", color: "var(--text-on-dark)",
          border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer"
        }}
      >
        <option value="0px">No lines</option>
        <option value="1px">1px</option>
        <option value="2px">2px</option>
        <option value="3px">3px</option>
        <option value="4px">4px</option>
      </select>

      {sep}

      {/* Clear formatting */}
      <button
        onMouseDown={(e) => { e.preventDefault(); exec("removeFormat"); }}
        title="Clear text formatting"
        style={{
          padding: "5px 10px", borderRadius: 8, cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.15)",
          background: "var(--border)", color: "var(--text-muted)",
          fontSize: 12, userSelect: "none"
        }}
      >
        Clear
      </button>
    </div>
  );
}

// ─── Item Specifics Tab ───────────────────────────────────────────────────────

const LS_SAVED_KEY = "jsk_saved_products";

function loadSavedFromStorage() {
  try { return JSON.parse(localStorage.getItem(LS_SAVED_KEY) || "[]"); }
  catch { return []; }
}

// SPEC_SCHEMA, SECTION_TITLES, and mapApiSpecsToSchema are imported from ./itemSpecificsSchema.js

function ItemSpecificsTab({ result, copyText }) {
  const buildInitialRows = (res) => mapApiSpecsToSchema(res);

  const [rows,        setRows]        = useState(() => buildInitialRows(result));
  const [showReset,   setShowReset]   = useState(false);
  const [showAddRow,  setShowAddRow]  = useState(false);
  const [newLabel,    setNewLabel]    = useState("");
  const [newValue,    setNewValue]    = useState("");
  const [savedProds]                  = useState(loadSavedFromStorage);
  const [batchOpen,   setBatchOpen]   = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [dateFilter,  setDateFilter]  = useState("today");

  const updateRow = (id, val) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, value: val } : r)));

  const updateLabel = (id, val) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, label: val } : r)));

  const deleteRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));

  const addRow = () => {
    if (!newLabel.trim()) return;
    setRows((prev) => [...prev, { id: makeRowId(), label: newLabel.trim(), value: newValue.trim(), section: "Additional", keys: [] }]);
    setNewLabel(""); setNewValue(""); setShowAddRow(false);
  };

  const doReset = () => { setRows(buildInitialRows(result)); setShowReset(false); };

  // ── CSV helpers ─────────────────────────────────────────────────────────────
  const escCsv = (v) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const downloadCsv = (content, filename) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const exportCurrent = () => {
    const header = ["Product Name", ...rows.map((r) => r.label)].map(escCsv).join(",");
    const vals   = [result.generated_title || "", ...rows.map((r) => r.value)].map(escCsv).join(",");
    const name   = (result.generated_title || "item-specifics").replace(/\s+/g, "-").toLowerCase();
    downloadCsv(`${header}\n${vals}`, `${name}.csv`);
  };

  const getBatchProds = () => {
    if (selectedIds.length > 0) return savedProds.filter((p) => selectedIds.includes(p.id));
    if (dateFilter === "today") {
      const t = new Date(); t.setHours(0, 0, 0, 0);
      return savedProds.filter((p) => { const d = new Date(p.savedAt); d.setHours(0,0,0,0); return d.getTime() === t.getTime(); });
    }
    return savedProds;
  };

  const exportBatch = () => {
    const prods = getBatchProds();
    if (!prods.length) return;

    // Column order: Product Name + all predefined labels + any extras found across listings
    const predefinedLabels = SPEC_SCHEMA.map((f) => f.label);
    const extraLabels = new Set();
    prods.forEach((p) => {
      mapApiSpecsToSchema(p)
        .filter((r) => r.section === "Additional" && r.label)
        .forEach((r) => extraLabels.add(r.label));
    });
    const cols = ["Product Name", ...predefinedLabels, ...Array.from(extraLabels)];

    const csvRows = [
      cols.map(escCsv).join(","),
      ...prods.map((p) => {
        const mapped = mapApiSpecsToSchema(p);
        const valueMap = {};
        mapped.forEach((r) => { valueMap[r.label] = r.value; });
        return cols.map((c) => escCsv(c === "Product Name" ? (p.generated_title || "") : (valueMap[c] || ""))).join(",");
      })
    ];
    downloadCsv(csvRows.join("\n"), "batch-item-specifics.csv");
  };

  const toggleSelected = (id) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const todayLabel = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const batchCount = getBatchProds().length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "grid", gap: 14 }}>

      {/* Actions bar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <CopyButton
          onCopy={() => copyText(rows.map((r) => `${r.label}: ${r.value}`).join("\n"))}
          style={{ fontSize: 12 }}
        >
          Copy All
        </CopyButton>
        <button
          onClick={exportCurrent}
          style={{ ...SMALL_BUTTON_STYLE, fontSize: 12, background: "#16a34a", boxShadow: "0 0 14px rgba(22,163,74,0.25)" }}
        >
          ↓ CSV (This Listing)
        </button>
        <button
          onClick={() => { setBatchOpen((v) => !v); }}
          style={{
            ...SMALL_BUTTON_STYLE, fontSize: 12,
            background: batchOpen ? "#164e63" : "var(--blue)",
            boxShadow: "0 0 14px rgba(14,116,144,0.25)"
          }}
        >
          ↓ CSV (Batch){batchOpen ? " ▲" : " ▼"}
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowAddRow((v) => !v)}
          style={{
            ...SMALL_BUTTON_STYLE, fontSize: 12,
            background: showAddRow ? "var(--text-dim)" : "var(--border)",
            boxShadow: "none", color: showAddRow ? "var(--text)" : "var(--text-muted)"
          }}
        >
          + Add Field
        </button>
        <button
          onClick={() => setShowReset(true)}
          style={{ ...SMALL_BUTTON_STYLE, fontSize: 12, background: "rgba(220,38,38,0.12)", color: "var(--red)", boxShadow: "none" }}
        >
          ↺ Reset
        </button>
      </div>

      {/* Reset confirmation */}
      {showReset && (
        <div style={{
          background: "var(--red-bg)", border: "1px solid rgba(220,38,38,0.35)",
          borderRadius: 12, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap"
        }}>
          <span style={{ fontSize: 13, color: "var(--red)", flex: 1 }}>
            Reset all fields to the originally generated values?
          </span>
          <button onClick={doReset}
            style={{ ...SMALL_BUTTON_STYLE, background: "#dc2626", fontSize: 12, padding: "6px 14px" }}>
            Reset
          </button>
          <button onClick={() => setShowReset(false)}
            style={{ ...SMALL_BUTTON_STYLE, background: "var(--text-dim)", boxShadow: "none", fontSize: 12, padding: "6px 12px" }}>
            Cancel
          </button>
        </div>
      )}

      {/* Batch export panel */}
      {batchOpen && (
        <div style={{
          background: "var(--bg-surface3)", border: "1px solid rgba(14,116,144,0.35)",
          borderRadius: 16, padding: 16
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#67e8f9", marginBottom: 12 }}>
            Batch CSV Export — Item Specifics
          </div>
          {savedProds.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              No saved listings found. Save a listing from the Price Calculator first.
            </div>
          ) : (<>
            {/* Date filter */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {[
                { key: "today", label: `Today  (${todayLabel})` },
                { key: "all",   label: `All Listings (${savedProds.length})` }
              ].map(({ key, label }) => {
                const active = dateFilter === key && selectedIds.length === 0;
                return (
                  <button key={key}
                    onClick={() => { setDateFilter(key); setSelectedIds([]); }}
                    style={{
                      padding: "5px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                      border:      active ? "1px solid #0e7490" : "1px solid var(--border-strong)",
                      background:  active ? "rgba(14,116,144,0.20)" : "transparent",
                      color:       active ? "#67e8f9" : "var(--text-muted)",
                      fontWeight:  active ? 700 : 400, transition: "all 0.15s"
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Listing list with checkboxes */}
            <div style={{ maxHeight: 220, overflowY: "auto", display: "grid", gap: 3, marginBottom: 12 }}>
              {savedProds.map((p) => {
                const checked = selectedIds.includes(p.id);
                return (
                  <label key={p.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "7px 10px", borderRadius: 8, cursor: "pointer",
                    background: checked ? "rgba(14,116,144,0.15)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${checked ? "rgba(14,116,144,0.35)" : "transparent"}`,
                    transition: "all 0.12s"
                  }}>
                    <input type="checkbox" checked={checked}
                      onChange={() => toggleSelected(p.id)}
                      style={{ cursor: "pointer", accentColor: "var(--blue)" }} />
                    <span style={{ fontSize: 12, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.generated_title || p.title || "Untitled"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
                      {p.savedAt ? new Date(p.savedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : ""}
                    </span>
                  </label>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={exportBatch} style={{
                ...SMALL_BUTTON_STYLE, fontSize: 12,
                background: "var(--blue)", boxShadow: "0 0 14px rgba(14,116,144,0.28)"
              }}>
                ↓ Download CSV ({selectedIds.length > 0 ? `${selectedIds.length} selected` : `${batchCount} listings`})
              </button>
              {selectedIds.length > 0 && (
                <button onClick={() => setSelectedIds([])} style={{
                  ...SMALL_BUTTON_STYLE, fontSize: 12, background: "transparent",
                  boxShadow: "none", color: "var(--text-muted)"
                }}>
                  Clear Selection
                </button>
              )}
            </div>
          </>)}
        </div>
      )}

      {/* Add field form */}
      {showAddRow && (
        <div style={{
          background: "var(--bg-surface3)", border: "1px solid rgba(19,93,255,0.28)",
          borderRadius: 12, padding: 14
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: 10 }}>
            ADD CUSTOM FIELD
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "end" }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Field Name</div>
              <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRow()}
                placeholder="e.g. Material"
                style={{ ...INPUT_STYLE, padding: "8px 10px", fontSize: 13 }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Value</div>
              <input value={newValue} onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRow()}
                placeholder="e.g. Steel"
                style={{ ...INPUT_STYLE, padding: "8px 10px", fontSize: 13 }} />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={addRow} disabled={!newLabel.trim()}
                style={{ ...SMALL_BUTTON_STYLE, fontSize: 12, opacity: newLabel.trim() ? 1 : 0.4 }}>
                Add
              </button>
              <button onClick={() => { setShowAddRow(false); setNewLabel(""); setNewValue(""); }}
                style={{ ...SMALL_BUTTON_STYLE, background: "var(--text-dim)", boxShadow: "none", fontSize: 12 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Specifics table */}
      <div style={{
        background: "var(--bg-surface3)", border: "1px solid var(--border)",
        borderRadius: 16, overflow: "hidden"
      }}>
        {/* Column headers */}
        <div style={{
          display: "grid", gridTemplateColumns: "220px 1fr 72px 36px",
          padding: "8px 14px",
          background: "var(--bg-nav)", borderBottom: "1px solid var(--border)"
        }}>
          {["Field Name", "Value", "", ""].map((h, i) => (
            <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
          ))}
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            No item specifics available for this listing.
          </div>
        ) : (() => {
          // Render rows with section dividers
          const elements = [];
          let lastSection = null;
          let rowIndex = 0;

          rows.forEach((row) => {
            const sec = row.section || "Additional";

            // Section header whenever section changes
            if (sec !== lastSection) {
              const sectionRows = rows.filter((r) => (r.section || "Additional") === sec);
              const filled = sectionRows.filter((r) => r.value?.trim()).length;
              elements.push(
                <div key={`sec-${sec}`} style={{
                  display: "grid", gridTemplateColumns: "220px 1fr 72px 36px",
                  padding: "7px 14px",
                  background: "var(--bg-surface3)",
                  borderTop: lastSection ? "1px solid var(--border-light)" : "none",
                  borderBottom: "1px solid var(--border-light)"
                }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#4b6fa8", letterSpacing: "0.08em", gridColumn: "1 / 3" }}>
                    {SECTION_TITLES[sec] || sec.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 10, color: "#4b6fa8", textAlign: "right", gridColumn: "3 / 5" }}>
                    {filled}/{sectionRows.length} filled
                  </div>
                </div>
              );
              lastSection = sec;
            }

            const isEven = rowIndex % 2 === 0;
            rowIndex++;
            elements.push(
              <div key={row.id} style={{
                display: "grid", gridTemplateColumns: "220px 1fr 72px 36px",
                alignItems: "center",
                borderBottom: "1px solid var(--border-light)",
                background: isEven ? "rgba(255,255,255,0.015)" : "transparent"
              }}>
                {/* Label */}
                <input
                  value={row.label}
                  onChange={(e) => updateLabel(row.id, e.target.value)}
                  style={{
                    background: "transparent", border: "none", outline: "none",
                    borderRight: "1px solid var(--border-light)",
                    color: row.value?.trim() ? "var(--text-muted)" : "var(--text-dim)",
                    fontSize: 13, fontWeight: 600,
                    padding: "9px 14px", width: "100%", fontFamily: "inherit"
                  }}
                />
                {/* Value */}
                <input
                  value={row.value}
                  onChange={(e) => updateRow(row.id, e.target.value)}
                  placeholder="—"
                  style={{
                    background: "transparent", border: "none", outline: "none",
                    color: row.value?.trim() ? "var(--text-on-dark)" : "var(--text-dim)",
                    fontSize: 13,
                    padding: "9px 14px", width: "100%", fontFamily: "inherit"
                  }}
                />
                {/* Copy */}
                <CopyButton
                  value={row.value}
                  copiedLabel="✓"
                  style={{
                    margin: "0 5px",
                    padding: "5px 0",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--border-light)",
                    color: "var(--text-muted)",
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    boxShadow: "none",
                  }}
                >
                  Copy
                </CopyButton>
                {/* Delete */}
                <button
                  onClick={() => deleteRow(row.id)}
                  style={{
                    width: 24, height: 24, margin: "0 6px 0 0",
                    borderRadius: 6, border: "1px solid rgba(220,38,38,0.15)",
                    background: "rgba(220,38,38,0.06)", color: "var(--text-muted)",
                    cursor: "pointer", fontSize: 13,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.borderColor = "rgba(220,38,38,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "rgba(220,38,38,0.15)"; }}
                >×</button>
              </div>
            );
          });

          return elements;
        })()}
      </div>
    </div>
  );
}

// ─── Item Specifics panel (legacy inline view) ────────────────────────────────

function ItemSpecificsPanel({ itemSpecifics, specifications, onCopyAll }) {
  const copyText = async (value) => { await navigator.clipboard.writeText(value || ""); };

  const rows = itemSpecifics.length > 0
    ? itemSpecifics
    : specifications.map((s) => {
        const idx = s.indexOf(":");
        return idx > -1
          ? { label: s.slice(0, idx).trim(), value: s.slice(idx + 1).trim() }
          : { label: s, value: "" };
      });

  const allText = rows.map((r) => r.value ? `${r.label}: ${r.value}` : r.label).join("\n");

  return (
    <InfoBox title="Item Specifics">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <CopyButton onCopy={() => onCopyAll(allText)}>
          Copy All Item Specifics
        </CopyButton>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: i % 2 === 0 ? "var(--border-light)" : "var(--border-light)",
              borderRadius: 8, padding: "8px 12px", gap: 12
            }}
          >
            <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)", minWidth: 140, flexShrink: 0 }}>
                {row.label}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-on-dark)", wordBreak: "break-word" }}>
                {row.value}
              </span>
            </div>
            <CopyButton
              value={row.value ? `${row.label}: ${row.value}` : row.label}
              copiedLabel="✓"
              style={{ padding: "4px 10px", fontSize: 11, flexShrink: 0 }}
            >
              Copy
            </CopyButton>
          </div>
        ))}
      </div>
    </InfoBox>
  );
}
