import React, { useState, useRef, useEffect, useCallback } from "react";

// ─── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      "#0A1628",
  card:    "#0F1E35",
  card2:   "#080f1e",
  border:  "rgba(255,255,255,0.08)",
  border2: "rgba(255,255,255,0.05)",
  blue:    "#135DFF",
  text:    "#e2e8f0",
  sub:     "#94a3b8",
  muted:   "#4b5563",
  dim:     "#1e2d42",
  green:   "#10b981",
  amber:   "#f59e0b",
  red:     "#ef4444",
};

// ─── Placeholders ─────────────────────────────────────────────────────────────
const PLACEHOLDERS = [
  { key: "{{PRODUCT_TITLE}}",   label: "Product Title" },
  { key: "{{OEM_NUMBER}}",      label: "OEM Number" },
  { key: "{{DESCRIPTION}}",     label: "Description" },
  { key: "{{COMPATIBILITY}}",   label: "Compatibility" },
  { key: "{{ENGINE_CODES}}",    label: "Engine Codes" },
  { key: "{{ITEM_SPECIFICS}}",  label: "Item Specifics" },
  { key: "{{WARRANTY}}",        label: "Warranty" },
  { key: "{{SHIPPING}}",        label: "Shipping" },
  { key: "{{RETURNS}}",         label: "Returns" },
];

// ─── Default section content ──────────────────────────────────────────────────
const DEFAULT_SECTIONS = {
  description: { enabled: true,  label: "Description",    content: "{{DESCRIPTION}}" },
  warranty:    { enabled: true,  label: "Warranty",       content: "12-month manufacturer's warranty included." },
  shipping:    { enabled: true,  label: "Shipping",       content: "{{SHIPPING}}" },
  returns:     { enabled: true,  label: "Returns",        content: "{{RETURNS}}" },
  footer:      { enabled: false, label: "Footer Notes",   content: "" },
};

const SECTION_ORDER = ["description", "warranty", "shipping", "returns", "footer"];

// ─── Storage ──────────────────────────────────────────────────────────────────
const LS_KEY = "jsk_listing_templates_v1";

function loadTemplates() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}
function saveTemplates(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {}
}
function makeId() { return Math.random().toString(36).slice(2, 10); }

function blankTemplate(name = "New Template") {
  return {
    id:         makeId(),
    name,
    isDefault:  false,
    useRawHtml: false,
    rawHtml:    "",
    sections:   JSON.parse(JSON.stringify(DEFAULT_SECTIONS)),
  };
}

// ─── HTML → placeholder import ────────────────────────────────────────────────
function autoReplacePlaceholders(html) {
  let out = html;

  // OEM / part numbers — standalone alphanumeric codes 6–14 chars with digits
  out = out.replace(/\b([A-Z]{0,4}[0-9]{2}[A-Z0-9]{4,12})\b/g, (m) => {
    // Skip pure CSS hex colours / numbers inside style attributes
    return m;
  });

  // "Fits [Brand] ..." compatibility lines
  out = out.replace(/\bFits\s+[A-Z][a-zA-Z0-9\s,/–-]{4,60}/g, "{{COMPATIBILITY}}");

  // Compatibility section headers
  out = out.replace(/Compatible\s+(with|for)\s+[^<\n]{4,80}/gi, "{{COMPATIBILITY}}");

  // Engine code patterns like "N47D20A", "OM651"
  out = out.replace(/\b([A-Z]{1,3}[0-9]{2,3}[A-Z0-9]{0,6})\b/g, (m) => {
    if (m.length >= 5 && m.length <= 12 && /[0-9]/.test(m)) return "{{ENGINE_CODES}}";
    return m;
  });

  // OEM reference labels
  out = out.replace(/(OEM|Part\s*No\.?|Reference)[:\s]+[A-Z0-9\s,/–-]{4,30}/gi,
    (m, p1) => `${p1}: {{OEM_NUMBER}}`);

  // Shipping text
  out = out.replace(/(Free\s+(UK\s+)?Delivery|Dispatched\s+within[^<\n]{0,40})/gi, "{{SHIPPING}}");

  // Returns text
  out = out.replace(/(30[\s-]day\s+returns?|Returns?\s+accepted[^<\n]{0,40})/gi, "{{RETURNS}}");

  // Warranty text
  out = out.replace(/([0-9]+[\s-]*(month|year)[\s-]*warranty[^<\n]{0,40})/gi, "{{WARRANTY}}");

  return out;
}

// ─── Build preview HTML from sections ────────────────────────────────────────
function buildPreviewHtml(template) {
  if (template.useRawHtml) return template.rawHtml || "<p style='color:#4b5563;font-style:italic'>No HTML entered.</p>";

  const rows = SECTION_ORDER
    .filter(k => template.sections[k]?.enabled)
    .map(k => {
      const s = template.sections[k];
      return `
        <div style="margin-bottom:16px;">
          <div style="font-size:10px;font-weight:800;color:#4b5563;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px;">${s.label}</div>
          <div style="font-size:13px;color:#94a3b8;white-space:pre-wrap;line-height:1.6;">${s.content || "<em>Empty</em>"}</div>
        </div>`;
    }).join("");

  return `<html><head><style>
    body { margin:0; padding:14px 18px; background:#080f1e; font-family:Inter,system-ui,sans-serif; color:#e2e8f0; }
    * { box-sizing:border-box; }
  </style></head><body>${rows || "<p style='color:#4b5563;font-style:italic'>Enable at least one section.</p>"}</body></html>`;
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "ghost", size = "sm", disabled, full }) {
  const [hov, setHov] = useState(false);
  const pad = size === "sm" ? "6px 14px" : "9px 20px";
  const fs  = size === "sm" ? 11 : 13;
  const v = {
    primary: { bg: hov ? "#1a6bff" : C.blue,   color: "#fff",   border: C.blue },
    ghost:   { bg: hov ? "rgba(255,255,255,0.07)" : "transparent", color: C.text, border: C.border },
    danger:  { bg: hov ? "rgba(239,68,68,0.12)" : "transparent", color: C.red,  border: "rgba(239,68,68,0.22)" },
    subtle:  { bg: hov ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)", color: C.sub, border: C.border2 },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: pad, fontSize: fs, fontWeight: 700, borderRadius: 8,
        background: v.bg, color: v.color, border: `1px solid ${v.border}`,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
        transition: "all 0.13s", outline: "none", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

function SL({ children }) {
  return <div style={{ fontSize: 9, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>{children}</div>;
}

function Badge({ children, color = C.blue }) {
  return (
    <span style={{ fontSize: 8, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: 0.8,
      background: `${color}1a`, border: `1px solid ${color}30`, borderRadius: 5, padding: "2px 7px" }}>
      {children}
    </span>
  );
}

// ─── Insert placeholder into textarea at cursor ───────────────────────────────
function insertAtCursor(ref, text, onUpdate) {
  const el = ref.current;
  if (!el) return;
  const start = el.selectionStart;
  const end   = el.selectionEnd;
  const val   = el.value;
  const newVal = val.slice(0, start) + text + val.slice(end);
  onUpdate(newVal);
  // Restore cursor after React re-render
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(start + text.length, start + text.length);
  });
}

// ─── Placeholder picker ───────────────────────────────────────────────────────
function PlaceholderPicker({ onPick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <Btn onClick={() => setOpen(o => !o)} variant="subtle">
        Insert Placeholder {open ? "▲" : "▼"}
      </Btn>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 300,
          background: "#0b1828", border: `1px solid ${C.border}`, borderRadius: 10,
          padding: 6, minWidth: 210, boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
        }}>
          {PLACEHOLDERS.map(p => (
            <button key={p.key} onClick={() => { onPick(p.key); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "7px 10px", borderRadius: 7, border: "none",
                background: "transparent", cursor: "pointer", gap: 10, textAlign: "left",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{p.label}</span>
              <code style={{ fontSize: 9, color: "#60a5fa", fontFamily: "monospace" }}>{p.key}</code>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Template Editor (slide-over panel) ───────────────────────────────────────
function EditorPanel({ template, onSave, onClose }) {
  const [t,  setT]  = useState(() => JSON.parse(JSON.stringify(template)));
  const [tab, setTab] = useState("sections"); // "sections" | "raw"
  const activeTextareaRef = useRef(null);
  const sectionTextareaRefs = useRef({});

  const set = (patch) => setT(prev => ({ ...prev, ...patch }));

  const setSection = (key, patch) => setT(prev => ({
    ...prev,
    sections: { ...prev.sections, [key]: { ...prev.sections[key], ...patch } },
  }));

  const handlePick = useCallback((placeholder) => {
    if (tab === "raw") {
      insertAtCursor(activeTextareaRef, placeholder, v => set({ rawHtml: v }));
    } else if (activeTextareaRef.current) {
      // find which section key owns the active textarea
      const key = Object.entries(sectionTextareaRefs.current).find(([, r]) => r === activeTextareaRef.current)?.[0];
      if (key) insertAtCursor(activeTextareaRef, placeholder, v => setSection(key, { content: v }));
    }
  }, [tab]);

  const previewHtml = buildPreviewHtml(t);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)",
      }} />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 401,
        width: "min(820px, 92vw)",
        background: "#0a1525", borderLeft: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column",
        boxShadow: "-12px 0 48px rgba(0,0,0,0.6)",
      }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "16px 22px",
          borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        }}>
          <input value={t.name} onChange={e => set({ name: e.target.value })}
            placeholder="Template name…"
            style={{ flex: 1, fontSize: 15, fontWeight: 800, color: C.text, background: "transparent",
              border: "none", outline: "none", caretColor: C.blue }} />
          <PlaceholderPicker onPick={handlePick} />
          <Btn variant="primary" onClick={() => onSave(t)}>Save Template</Btn>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.muted, fontSize: 18, cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}>✕</button>
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", gap: 2, padding: "10px 22px 0", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          {[["sections", "Sections"], ["raw", "Raw HTML"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: "7px 16px", fontSize: 12, fontWeight: 700, border: "none",
              background: tab === k ? "rgba(19,93,255,0.14)" : "transparent",
              borderBottom: tab === k ? `2px solid ${C.blue}` : "2px solid transparent",
              color: tab === k ? "#93c5fd" : C.muted, cursor: "pointer", borderRadius: "6px 6px 0 0",
            }}>{l}</button>
          ))}
        </div>

        {/* Body — split: left editor, right preview */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Left: editor */}
          <div style={{ flex: "0 0 55%", overflowY: "auto", padding: "18px 20px", borderRight: `1px solid ${C.border}` }}>

            {tab === "sections" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {SECTION_ORDER.map(key => {
                  const s = t.sections[key];
                  if (!sectionTextareaRefs.current[key]) sectionTextareaRefs.current[key] = null;
                  return (
                    <div key={key} style={{
                      background: C.card2, border: `1px solid ${s.enabled ? C.border : C.dim}`,
                      borderRadius: 11, overflow: "hidden", opacity: s.enabled ? 1 : 0.5,
                    }}>
                      {/* Section header */}
                      <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderBottom: s.enabled ? `1px solid ${C.border2}` : "none" }}>
                        <span style={{ flex: 1, fontSize: 12, fontWeight: 800, color: s.enabled ? C.text : C.muted }}>{s.label}</span>
                        <button onClick={() => setSection(key, { enabled: !s.enabled })} style={{
                          fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                          background: s.enabled ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${s.enabled ? "rgba(16,185,129,0.25)" : C.border2}`,
                          color: s.enabled ? C.green : C.muted, cursor: "pointer",
                        }}>
                          {s.enabled ? "Enabled" : "Disabled"}
                        </button>
                      </div>
                      {s.enabled && (
                        <textarea
                          ref={el => { sectionTextareaRefs.current[key] = el; }}
                          value={s.content}
                          onChange={e => setSection(key, { content: e.target.value })}
                          onFocus={e => { activeTextareaRef.current = e.target; }}
                          placeholder={`Enter ${s.label.toLowerCase()} content or use {{PLACEHOLDERS}}…`}
                          rows={4}
                          style={{
                            width: "100%", padding: "10px 14px", background: "transparent",
                            border: "none", color: C.sub, fontSize: 12, fontFamily: "monospace",
                            resize: "vertical", outline: "none", lineHeight: 1.6, boxSizing: "border-box",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, lineHeight: 1.6 }}>
                  Paste or edit raw HTML. Use <code style={{ color: "#60a5fa", fontSize: 10 }}>{"{{PLACEHOLDERS}}"}</code> anywhere in the markup.
                </div>
                <textarea
                  ref={el => { if (tab === "raw") activeTextareaRef.current = el; }}
                  value={t.rawHtml}
                  onChange={e => set({ rawHtml: e.target.value })}
                  onFocus={e => { activeTextareaRef.current = e.target; }}
                  placeholder={"<div>Paste your HTML here…</div>"}
                  style={{
                    width: "100%", minHeight: 420, padding: "12px 14px",
                    background: C.card2, border: `1px solid ${C.border}`,
                    color: "#93c5fd", fontSize: 11, fontFamily: "monospace",
                    resize: "vertical", outline: "none", borderRadius: 10, lineHeight: 1.7,
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ marginTop: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input type="checkbox" checked={t.useRawHtml} onChange={e => set({ useRawHtml: e.target.checked })} />
                    <span style={{ fontSize: 11, color: C.sub }}>Use raw HTML for this template (overrides sections)</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Right: live preview */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <SL>Live Preview</SL>
            </div>
            <iframe
              key={previewHtml}
              srcDoc={previewHtml}
              style={{ flex: 1, border: "none", background: C.card2 }}
              sandbox="allow-same-origin"
              title="Template Preview"
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Import HTML modal ────────────────────────────────────────────────────────
function ImportModal({ onImport, onClose }) {
  const [html,        setHtml]        = useState("");
  const [processed,   setProcessed]   = useState("");
  const [name,        setName]        = useState("Imported Template");
  const [step,        setStep]        = useState(1); // 1 = paste, 2 = review

  const handleDetect = () => {
    const out = autoReplacePlaceholders(html);
    setProcessed(out);
    setStep(2);
  };

  const handleImport = () => {
    const t = blankTemplate(name);
    t.rawHtml    = processed || html;
    t.useRawHtml = true;
    onImport(t);
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 401,
        width: "min(760px, 94vw)", maxHeight: "88vh",
        background: "#0a1525", border: `1px solid ${C.border}`, borderRadius: 16,
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 22px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>Import HTML Template</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              Paste existing HTML — Part Lister will detect and replace product-specific values with placeholders.
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.muted, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 0, padding: "10px 22px 0", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          {[["1", "Paste HTML"], ["2", "Review & Import"]].map(([n, l], i) => {
            const active = String(step) === n;
            return (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderBottom: active ? `2px solid ${C.blue}` : "2px solid transparent" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: active ? C.blue : C.dim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: "#fff" }}>{n}</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: active ? C.text : C.muted }}>{l}</span>
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {step === 1 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "18px 22px", gap: 14, overflow: "hidden" }}>
              <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.7 }}>
                Paste your eBay HTML listing template below. Part Lister will automatically detect and replace product titles, OEM numbers, compatibility text, and other item-specific values with reusable <code style={{ color: "#60a5fa", fontSize: 10 }}>{"{{PLACEHOLDERS}}"}</code>.
              </div>
              <textarea
                value={html}
                onChange={e => setHtml(e.target.value)}
                placeholder={"<div class='listing-header'>BMW N47 Connecting Rod Bearing Set…</div>"}
                style={{
                  flex: 1, padding: "12px 14px", background: C.card2,
                  border: `1px solid ${C.border}`, color: "#93c5fd", fontSize: 11,
                  fontFamily: "monospace", resize: "none", outline: "none",
                  borderRadius: 10, lineHeight: 1.7,
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Btn variant="primary" size="md" onClick={handleDetect} disabled={!html.trim()}>
                  Detect Placeholders →
                </Btn>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* Left: processed HTML */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ padding: "10px 16px 8px", borderBottom: `1px solid ${C.border2}`, flexShrink: 0 }}>
                  <SL>Processed HTML</SL>
                </div>
                <textarea
                  value={processed}
                  onChange={e => setProcessed(e.target.value)}
                  style={{
                    flex: 1, padding: "12px 14px", background: "transparent",
                    border: "none", color: "#93c5fd", fontSize: 11,
                    fontFamily: "monospace", resize: "none", outline: "none", lineHeight: 1.7,
                  }}
                />
              </div>

              {/* Right: detected placeholders + import settings */}
              <div style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", padding: "14px 16px", gap: 14, overflowY: "auto" }}>
                <div>
                  <SL>Detected Placeholders</SL>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {PLACEHOLDERS.filter(p => processed.includes(p.key)).map(p => (
                      <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, flexShrink: 0 }} />
                        <code style={{ fontSize: 9, color: "#60a5fa", fontFamily: "monospace" }}>{p.key}</code>
                      </div>
                    ))}
                    {!PLACEHOLDERS.some(p => processed.includes(p.key)) && (
                      <div style={{ fontSize: 11, color: C.muted }}>None detected — you can add them manually.</div>
                    )}
                  </div>
                </div>

                <div>
                  <SL>Template Name</SL>
                  <input value={name} onChange={e => setName(e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: 8, fontSize: 12,
                      background: C.card2, border: `1px solid ${C.border}`, color: C.text, outline: "none", boxSizing: "border-box" }} />
                </div>

                <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  <Btn variant="primary" size="md" full onClick={handleImport} disabled={!processed.trim()}>
                    Import Template
                  </Btn>
                  <Btn variant="ghost" size="sm" full onClick={() => setStep(1)}>← Back</Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Template card ────────────────────────────────────────────────────────────
function TemplateCard({ template, onEdit, onDuplicate, onDelete, onSetDefault }) {
  const [hov, setHov] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const enabledSections = Object.values(template.sections || {}).filter(s => s.enabled).length;

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: C.card, border: `1px solid ${hov ? "rgba(255,255,255,0.12)" : C.border}`,
        borderRadius: 12, padding: "14px 16px",
        transition: "border-color 0.13s, box-shadow 0.13s",
        boxShadow: hov ? "0 4px 20px rgba(0,0,0,0.3)" : "none",
        display: "flex", alignItems: "center", gap: 14,
      }}
    >
      {/* Icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        background: template.isDefault ? "rgba(19,93,255,0.16)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${template.isDefault ? "rgba(19,93,255,0.3)" : C.border2}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, color: template.isDefault ? "#93c5fd" : C.muted,
      }}>⬚</div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {template.name || "Untitled Template"}
          </span>
          {template.isDefault && <Badge color={C.blue}>Default</Badge>}
          {template.useRawHtml && <Badge color={C.amber}>Raw HTML</Badge>}
        </div>
        <div style={{ fontSize: 10, color: C.muted }}>
          {template.useRawHtml
            ? `${(template.rawHtml || "").length} characters`
            : `${enabledSections} section${enabledSections !== 1 ? "s" : ""} enabled`}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
        {!template.isDefault && (
          <ActionBtn onClick={onSetDefault} title="Set as Default">★</ActionBtn>
        )}
        <ActionBtn onClick={onEdit} title="Edit">Edit</ActionBtn>
        <ActionBtn onClick={onDuplicate} title="Duplicate">⧉</ActionBtn>

        {/* More menu */}
        <div ref={menuRef} style={{ position: "relative" }}>
          <ActionBtn onClick={() => setMenuOpen(o => !o)} title="More">⋯</ActionBtn>
          {menuOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 200,
              background: "#0b1828", border: `1px solid ${C.border}`, borderRadius: 9,
              padding: 5, minWidth: 130, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}>
              {!template.isDefault && (
                <MenuBtn onClick={() => { onSetDefault(); setMenuOpen(false); }}>★ Set Default</MenuBtn>
              )}
              <MenuBtn onClick={() => { onDuplicate(); setMenuOpen(false); }}>⧉ Duplicate</MenuBtn>
              <div style={{ height: 1, background: C.border2, margin: "4px 0" }} />
              <MenuBtn danger onClick={() => { onDelete(); setMenuOpen(false); }}>✕ Delete</MenuBtn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ children, onClick, title }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: "4px 10px", fontSize: 11, fontWeight: 700, borderRadius: 7,
        background: hov ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${C.border}`, color: C.text,
        cursor: "pointer", transition: "background 0.1s",
      }}>{children}</button>
  );
}

function MenuBtn({ children, onClick, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 8, width: "100%",
        padding: "7px 10px", borderRadius: 7, border: "none",
        background: hov ? (danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)") : "transparent",
        color: danger ? C.red : C.text, fontSize: 11, fontWeight: 600, cursor: "pointer",
      }}>{children}</button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ListingTemplates() {
  const [templates,    setTemplates]    = useState(loadTemplates);
  const [editing,      setEditing]      = useState(null);   // template obj or null
  const [showImport,   setShowImport]   = useState(false);

  const persist = (list) => { setTemplates(list); saveTemplates(list); };

  const handleSave = (t) => {
    const idx = templates.findIndex(x => x.id === t.id);
    const next = idx >= 0
      ? templates.map(x => x.id === t.id ? t : x)
      : [...templates, t];
    persist(next);
    setEditing(null);
  };

  const handleDelete = (id) => persist(templates.filter(x => x.id !== id));

  const handleDuplicate = (t) => {
    const dup = { ...JSON.parse(JSON.stringify(t)), id: makeId(), name: `${t.name} (Copy)`, isDefault: false };
    persist([...templates, dup]);
  };

  const handleSetDefault = (id) => persist(templates.map(t => ({ ...t, isDefault: t.id === id })));

  const handleNewTemplate = () => setEditing(blankTemplate("New Template"));

  const handleImport = (t) => {
    persist([...templates, t]);
    setShowImport(false);
    setEditing(t);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.muted }}>
            {templates.length} template{templates.length !== 1 ? "s" : ""}
            {templates.find(t => t.isDefault) && (
              <span style={{ marginLeft: 8, color: C.blue }}>· default active</span>
            )}
          </div>
        </div>
        <Btn variant="ghost"   onClick={() => setShowImport(true)}>Import HTML</Btn>
        <Btn variant="primary" onClick={handleNewTemplate}>+ New Template</Btn>
      </div>

      {/* Template list */}
      {templates.length === 0 ? (
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 13,
          padding: "48px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.3 }}>⬚</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 6 }}>No templates yet</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
            Create a reusable listing template or import an existing HTML design.
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Btn variant="primary" size="md" onClick={handleNewTemplate}>+ New Template</Btn>
            <Btn variant="ghost"   size="md" onClick={() => setShowImport(true)}>Import HTML</Btn>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {templates.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              onEdit={() => setEditing(JSON.parse(JSON.stringify(t)))}
              onDuplicate={() => handleDuplicate(t)}
              onDelete={() => handleDelete(t.id)}
              onSetDefault={() => handleSetDefault(t.id)}
            />
          ))}
        </div>
      )}

      {/* Placeholder reference */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "14px 18px" }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>
          Available Placeholders
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PLACEHOLDERS.map(p => (
            <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 6,
              background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.15)",
              borderRadius: 6, padding: "4px 10px" }}>
              <code style={{ fontSize: 9, color: "#60a5fa", fontFamily: "monospace" }}>{p.key}</code>
              <span style={{ fontSize: 9, color: C.muted }}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Editor panel */}
      {editing && (
        <EditorPanel
          template={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Import modal */}
      {showImport && (
        <ImportModal
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
