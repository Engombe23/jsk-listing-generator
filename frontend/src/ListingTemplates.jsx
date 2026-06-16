import React, { useState, useRef, useEffect, useCallback } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  surface:  "var(--bg-surface)",
  surface2: "var(--bg-surface2)",
  surface3: "var(--bg-surface3)",
  border:   "var(--border)",
  borderB:  "var(--border-blue)",
  blue:     "var(--blue)",
  blueB:    "var(--blue-bg)",
  text:     "var(--text)",
  muted:    "var(--text-muted)",
  dim:      "var(--text-dim)",
  green:    "var(--green)",
  yellow:   "var(--yellow)",
  red:      "var(--red)",
};

// ─── Placeholders ─────────────────────────────────────────────────────────────
export const PLACEHOLDERS = [
  { key: "{{TITLE}}",                   label: "Product Title",              color: "#6366f1" },
  { key: "{{DESCRIPTION}}",             label: "Description",                color: "#0ea5e9" },
  { key: "{{OE_NUMBERS}}",              label: "OE / OEM Numbers",           color: "#10b981" },
  { key: "{{INTERCHANGEABLE_NUMBERS}}", label: "Interchangeable Numbers",    color: "#f59e0b" },
  { key: "{{K_NUMBERS}}",              label: "K Numbers",                  color: "#8b5cf6" },
  { key: "{{ITEM_SPECIFICS}}",          label: "Item Specifics",             color: "#06b6d4" },
  { key: "{{COMPATIBILITY_TABLE}}",     label: "Compatibility Table",        color: "#3b82f6" },
  { key: "{{FITMENT_WARNING}}",         label: "Fitment Warning",            color: "#f87171" },
  { key: "{{WARRANTY}}",                label: "Warranty",                   color: "#34d399" },
  { key: "{{SHIPPING}}",                label: "Shipping",                   color: "#a78bfa" },
  { key: "{{RETURNS}}",                 label: "Returns Policy",             color: "#fb923c" },
];

// ─── Storage ──────────────────────────────────────────────────────────────────
const LS_KEY = "jsk_listing_templates_v1";
function loadTemplates()      { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; } }
function saveTemplates(list)  { try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {} }
function makeId()             { return Math.random().toString(36).slice(2, 10); }

function blankTemplate(name = "New Template") {
  return { id: makeId(), name, isDefault: false, useRawHtml: true, rawHtml: "", sections: {} };
}

// ─── Detection engine ─────────────────────────────────────────────────────────
// Each rule tries to find a section in the pasted HTML and returns a detection
// object. On success the corresponding HTML is replaced with the placeholder token.

const DETECTION_RULES = [
  {
    key:   "{{TITLE}}",
    label: "Product Title",
    confidence: "high",
    detect(html) {
      // H1/H2 tag, or centre-aligned large bold text
      const patterns = [
        /<h[12]([^>]*)>([\s\S]*?)<\/h[12]>/i,
        /<(?:div|p|span|b|strong)[^>]*(?:font-size\s*:\s*(?:1[89]|[2-9]\d)px|font-weight\s*:\s*(?:bold|[7-9]\d\d))[^>]*>([\s\S]{5,120}?)<\/(?:div|p|span|b|strong)>/i,
      ];
      for (const rx of patterns) {
        const m = html.match(rx);
        if (m) {
          const inner = (m[3] || m[2] || "").replace(/<[^>]+>/g, "").trim();
          if (inner.length >= 4 && inner.length <= 200) {
            return { match: m[0], inner, preview: inner.slice(0, 70) };
          }
        }
      }
      return null;
    },
    replace(html, match, inner) {
      // Replace the inner text only, keeping tags
      return html.replace(match.inner, "{{TITLE}}");
    },
  },

  {
    key:   "{{OE_NUMBERS}}",
    label: "OE / OEM Numbers",
    confidence: "high",
    detect(html) {
      // Heading that mentions OEM/OE/Replaces, followed by content until next heading or end
      const rx = /(<(?:b|strong|div|p|h[1-6])[^>]*>[^<]*(?:OEM|OE\b|Replaces|Original\s+Part|Part\s+No|Reference\s+No)[^<]*<\/(?:b|strong|div|p|h[1-6])>)([\s\S]{3,600}?)(?=<(?:b|strong|div|p|h[1-6])[^>]*>[^<]*(?:Item\s+Spec|Compat|Interch|K\s+Num|Warrant|Ship|Return|Warning)|$)/i;
      const m = html.match(rx);
      if (m) {
        const content = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (content.length > 2) return { heading: m[1], content: m[2], preview: content.slice(0, 60) };
      }
      return null;
    },
    replace(html, match) {
      return html.replace(match.content, "\n{{OE_NUMBERS}}\n");
    },
  },

  {
    key:   "{{INTERCHANGEABLE_NUMBERS}}",
    label: "Interchangeable Numbers",
    confidence: "high",
    detect(html) {
      const rx = /(<(?:b|strong|div|p|h[1-6])[^>]*>[^<]*(?:Interchang|Cross.?Ref|Also\s+Fits|Alternative|Aftermarket)[^<]*<\/(?:b|strong|div|p|h[1-6])>)([\s\S]{3,600}?)(?=<(?:b|strong|div|p|h[1-6])[^>]*>[^<]*(?:Item\s+Spec|Compat|OEM|K\s+Num|Warrant|Ship|Return|Warning)|$)/i;
      const m = html.match(rx);
      if (m) {
        const content = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (content.length > 2) return { heading: m[1], content: m[2], preview: content.slice(0, 60) };
      }
      return null;
    },
    replace(html, match) {
      return html.replace(match.content, "\n{{INTERCHANGEABLE_NUMBERS}}\n");
    },
  },

  {
    key:   "{{K_NUMBERS}}",
    label: "K Numbers",
    confidence: "medium",
    detect(html) {
      // Section heading mentioning K Numbers
      const rxHeading = /(<(?:b|strong|div|p|h[1-6])[^>]*>[^<]*K\s*Numbers?[^<]*<\/(?:b|strong|div|p|h[1-6])>)([\s\S]{3,400}?)(?=<(?:b|strong|div|p|h[1-6])|\s*$)/i;
      const m = html.match(rxHeading);
      if (m) {
        const content = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (content.length > 2) return { heading: m[1], content: m[2], preview: content.slice(0, 60) };
      }
      // Fallback: standalone K-number list
      const rxInline = /(\b(?:K\d{3,6}\s*[,;/]\s*){2,}K\d{3,6}\b)/;
      const m2 = html.match(rxInline);
      if (m2) return { inline: m2[1], preview: m2[1].slice(0, 60) };
      return null;
    },
    replace(html, match) {
      if (match.content) return html.replace(match.content, "\n{{K_NUMBERS}}\n");
      if (match.inline)  return html.replace(match.inline, "{{K_NUMBERS}}");
      return html;
    },
  },

  {
    key:   "{{ITEM_SPECIFICS}}",
    label: "Item Specifics",
    confidence: "high",
    detect(html) {
      const rx = /(<(?:b|strong|div|p|h[1-6])[^>]*>[^<]*(?:Item\s+Spec|Specifications?|Technical\s+Data|Product\s+Data)[^<]*<\/(?:b|strong|div|p|h[1-6])>)([\s\S]{10,1200}?)(?=<(?:b|strong|div|p|h[1-6])[^>]*>[^<]*(?:Compat|OEM|Interch|K\s+Num|Warrant|Ship|Return|Warning)|$)/i;
      const m = html.match(rx);
      if (m) {
        const content = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (content.length > 5) return { heading: m[1], content: m[2], preview: content.slice(0, 60) };
      }
      return null;
    },
    replace(html, match) {
      return html.replace(match.content, "\n{{ITEM_SPECIFICS}}\n");
    },
  },

  {
    key:   "{{COMPATIBILITY_TABLE}}",
    label: "Compatibility Table",
    confidence: "high",
    detect(html) {
      // Heading + a table block
      const rx = /(<(?:b|strong|div|p|h[1-6])[^>]*>[^<]*(?:Compatible|Fitment|Fits\s+Vehicles?|Vehicle\s+Compat)[^<]*<\/(?:b|strong|div|p|h[1-6])>)([\s\S]{20,}?<\/table>)/i;
      const m = html.match(rx);
      if (m) return { heading: m[1], content: m[2], preview: "Compatibility table detected" };
      // Fallback: just a <table> with kW/HP/CC headers
      const rxTable = /(<table[\s\S]*?(?:kW|HP|cc|Year|Vehicle)[\s\S]*?<\/table>)/i;
      const m2 = html.match(rxTable);
      if (m2) return { tableOnly: m2[1], preview: "Compatibility table detected" };
      return null;
    },
    replace(html, match) {
      if (match.content)   return html.replace(match.content,   "\n{{COMPATIBILITY_TABLE}}\n");
      if (match.tableOnly) return html.replace(match.tableOnly, "\n{{COMPATIBILITY_TABLE}}\n");
      return html;
    },
  },

  {
    key:   "{{FITMENT_WARNING}}",
    label: "Fitment Warning",
    confidence: "medium",
    detect(html) {
      const rx = /(<(?:div|p|span|b|strong)[^>]*(?:background[^;:]*(?:#ff|red|warning|f[0-9a-f]{5})|border[^;:]*red)[^>]*>)([\s\S]{10,400}?)(<\/(?:div|p|span|b|strong)>)/i;
      const m = html.match(rx);
      if (m) {
        const text = m[2].replace(/<[^>]+>/g, " ").trim();
        if (/verif|check|compat|order|correct|ensure/i.test(text)) {
          return { open: m[1], content: m[2], close: m[3], preview: text.slice(0, 70) };
        }
      }
      // Simpler: any warning-type text near "please check"
      const rx2 = /(<(?:p|div)[^>]*>[\s\S]*?(?:please (?:verify|check|review|ensure)[^<]{5,120})[\s\S]*?<\/(?:p|div)>)/i;
      const m2 = html.match(rx2);
      if (m2) {
        const text = m2[1].replace(/<[^>]+>/g, " ").trim();
        return { fullEl: m2[1], preview: text.slice(0, 70) };
      }
      return null;
    },
    replace(html, match) {
      if (match.fullEl) return html.replace(match.fullEl, "{{FITMENT_WARNING}}");
      return html.replace(match.open + match.content + match.close, match.open + "{{FITMENT_WARNING}}" + match.close);
    },
  },

  {
    key:   "{{WARRANTY}}",
    label: "Warranty",
    confidence: "medium",
    detect(html) {
      const rx = /(<(?:b|strong|div|p|h[1-6])[^>]*>[^<]*(?:Warrant|Guarantee)[^<]*<\/(?:b|strong|div|p|h[1-6])>)([\s\S]{5,400}?)(?=<(?:b|strong|div|p|h[1-6])|\s*$)/i;
      const m = html.match(rx);
      if (m) return { heading: m[1], content: m[2], preview: m[2].replace(/<[^>]+>/g, "").trim().slice(0, 60) };
      // Inline warranty text
      const rx2 = /(\d+[\s-]*(month|year)[\s-]*(?:parts?\s+)?(?:warrant|guarantee)[^<.]{0,60})/i;
      const m2 = html.match(rx2);
      if (m2) return { inline: m2[1], preview: m2[1].slice(0, 60) };
      return null;
    },
    replace(html, match) {
      if (match.content) return html.replace(match.content, "\n{{WARRANTY}}\n");
      if (match.inline)  return html.replace(match.inline,  "{{WARRANTY}}");
      return html;
    },
  },

  {
    key:   "{{SHIPPING}}",
    label: "Shipping",
    confidence: "medium",
    detect(html) {
      const rx = /(<(?:b|strong|div|p|h[1-6])[^>]*>[^<]*(?:Shipping|Delivery|Dispatch)[^<]*<\/(?:b|strong|div|p|h[1-6])>)([\s\S]{5,400}?)(?=<(?:b|strong|div|p|h[1-6])|\s*$)/i;
      const m = html.match(rx);
      if (m) return { heading: m[1], content: m[2], preview: m[2].replace(/<[^>]+>/g, "").trim().slice(0, 60) };
      const rx2 = /(free\s+(?:uk\s+)?delivery[^<.]{0,60}|dispatched\s+within\s+[^<.]{0,40})/i;
      const m2 = html.match(rx2);
      if (m2) return { inline: m2[1], preview: m2[1].slice(0, 60) };
      return null;
    },
    replace(html, match) {
      if (match.content) return html.replace(match.content, "\n{{SHIPPING}}\n");
      if (match.inline)  return html.replace(match.inline,  "{{SHIPPING}}");
      return html;
    },
  },

  {
    key:   "{{RETURNS}}",
    label: "Returns Policy",
    confidence: "low",
    detect(html) {
      const rx = /(<(?:b|strong|div|p|h[1-6])[^>]*>[^<]*(?:Return|Refund)[^<]*<\/(?:b|strong|div|p|h[1-6])>)([\s\S]{5,400}?)(?=<(?:b|strong|div|p|h[1-6])|\s*$)/i;
      const m = html.match(rx);
      if (m) return { heading: m[1], content: m[2], preview: m[2].replace(/<[^>]+>/g, "").trim().slice(0, 60) };
      const rx2 = /(\d+[\s-]*day\s+returns?[^<.]{0,60})/i;
      const m2 = html.match(rx2);
      if (m2) return { inline: m2[1], preview: m2[1].slice(0, 60) };
      return null;
    },
    replace(html, match) {
      if (match.content) return html.replace(match.content, "\n{{RETURNS}}\n");
      if (match.inline)  return html.replace(match.inline,  "{{RETURNS}}");
      return html;
    },
  },
];

function runDetection(rawHtml) {
  const detections = [];
  let processedHtml = rawHtml;

  for (const rule of DETECTION_RULES) {
    try {
      const match = rule.detect(processedHtml);
      if (match) {
        const newHtml = rule.replace(processedHtml, match);
        if (newHtml !== processedHtml) {
          detections.push({
            key:        rule.key,
            label:      rule.label,
            confidence: rule.confidence,
            preview:    match.preview || "(detected)",
            enabled:    true,
          });
          processedHtml = newHtml;
        }
      }
    } catch {}
  }

  return { detections, processedHtml };
}

// Revert a single placeholder replacement in processedHtml back to the original content
function revertPlaceholder(original, processed, key) {
  // Not trivial in general — simplest: re-run detection on original, skip this key
  // For now: replace the placeholder token with a note
  return processed.replace(new RegExp(escapeRegex(key), "g"), `<!-- ${key} reverted -->`);
}
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

// ─── Shared primitives ────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "ghost", size = "sm", disabled, full, style: extra }) {
  const [hov, setHov] = useState(false);
  const pad = size === "sm" ? "6px 14px" : "9px 20px";
  const fs  = size === "sm" ? 12 : 13;
  const v = {
    primary: { bg: hov ? "#1a6bff" : "var(--blue)", color: "#fff",            border: "var(--blue)" },
    ghost:   { bg: hov ? "var(--bg-surface2)" : "transparent", color: C.text, border: C.border },
    danger:  { bg: hov ? "rgba(220,38,38,0.09)" : "transparent", color: C.red, border: "rgba(220,38,38,0.22)" },
    subtle:  { bg: hov ? "var(--bg-surface2)" : "var(--bg-surface2)", color: C.muted, border: C.border },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: pad, fontSize: fs, fontWeight: 700, borderRadius: 8, width: full ? "100%" : undefined,
        background: v.bg, color: v.color, border: `1px solid ${v.border}`,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
        transition: "all 0.13s", outline: "none", whiteSpace: "nowrap", ...extra }}>
      {children}
    </button>
  );
}

function ConfBadge({ level }) {
  const map = {
    high:   { label: "High",   bg: "rgba(16,185,129,0.10)", color: "#10b981", bd: "rgba(16,185,129,0.25)" },
    medium: { label: "Medium", bg: "rgba(245,158,11,0.10)", color: "#f59e0b", bd: "rgba(245,158,11,0.25)" },
    low:    { label: "Low",    bg: "rgba(156,163,175,0.10)", color: "#9ca3af", bd: "rgba(156,163,175,0.25)" },
  };
  const m = map[level] || map.low;
  return (
    <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8,
      background: m.bg, color: m.color, border: `1px solid ${m.bd}`, borderRadius: 5, padding: "2px 7px" }}>
      {m.label}
    </span>
  );
}

// ─── Template Builder (3-panel inline) ───────────────────────────────────────
function TemplateBuilder({ initial, onSave, onCancel }) {
  const [phase,         setPhase]         = useState(initial?.rawHtml ? "review" : "input"); // "input" | "review"
  const [originalHtml,  setOriginalHtml]  = useState(initial?.rawHtml || "");
  const [processedHtml, setProcessedHtml] = useState(initial?.rawHtml || "");
  const [detections,    setDetections]    = useState([]);
  const [name,          setName]          = useState(initial?.name || "");
  const [previewTab,    setPreviewTab]    = useState("rendered"); // "rendered" | "raw"
  const [detecting,     setDetecting]     = useState(false);

  const handleDetect = useCallback(() => {
    if (!originalHtml.trim()) return;
    setDetecting(true);
    // Small delay so the UI updates first
    setTimeout(() => {
      const { detections: dets, processedHtml: proc } = runDetection(originalHtml);
      setDetections(dets);
      setProcessedHtml(proc);
      setPhase("review");
      setDetecting(false);
    }, 60);
  }, [originalHtml]);

  const handleReset = () => {
    setProcessedHtml(originalHtml);
    setDetections([]);
    setPhase("input");
  };

  // Toggle a detection on/off — when disabled, restore original content for that placeholder
  const toggleDetection = (key) => {
    setDetections(prev => prev.map(d => d.key === key ? { ...d, enabled: !d.enabled } : d));
    // Rebuild processedHtml from original applying only enabled rules
    setProcessedHtml(prev => {
      // Simple toggle: find the placeholder in processedHtml and revert if disabling
      const det = detections.find(d => d.key === key);
      if (!det) return prev;
      if (det.enabled) {
        // Disabling — revert placeholder to "(removed)" marker
        return prev.replace(new RegExp(escapeRegex(key), "g"), `<span style="opacity:0.4;font-style:italic">[${det.label} removed]</span>`);
      } else {
        // Re-enabling — re-run full detection and apply
        const { processedHtml: fresh } = runDetection(originalHtml);
        return fresh;
      }
    });
  };

  // Final HTML used for the template (enabled detections applied, disabled ones reverted)
  const finalHtml = processedHtml;

  const handleSave = () => {
    if (!name.trim()) return;
    const t = initial ? { ...initial } : blankTemplate(name);
    t.name       = name.trim();
    t.rawHtml    = finalHtml;
    t.useRawHtml = true;
    onSave(t);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", minHeight: 560 }}>

      {/* ── Builder header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 0 16px", borderBottom: `1px solid ${C.border}`, marginBottom: 16, flexShrink: 0 }}>
        <button onClick={onCancel} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, fontWeight: 600, padding: "4px 0" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
          Templates
        </button>
        <span style={{ color: C.border, fontSize: 16 }}>/</span>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Template name…"
          style={{ flex: 1, fontSize: 15, fontWeight: 700, color: C.text, background: "transparent", border: "none", outline: "none" }}
        />
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {phase === "review" && <Btn variant="ghost" onClick={handleReset}>← Back to edit</Btn>}
          <Btn variant="primary" onClick={handleSave} disabled={!name.trim() || !finalHtml.trim()}>
            Save Template
          </Btn>
        </div>
      </div>

      {/* ── Step indicator ── */}
      {phase === "input" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexShrink: 0 }}>
          <StepBadge n="1" active label="Paste HTML" />
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <StepBadge n="2" label="Review placeholders" />
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <StepBadge n="3" label="Save template" />
        </div>
      )}

      {/* ── 3-panel layout ── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: phase === "input" ? "1fr 320px" : "1fr 360px 1fr", gap: 16, overflow: "hidden", minHeight: 0 }}>

        {/* ══ LEFT: HTML input ══ */}
        <div style={{ display: "flex", flexDirection: "column", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow)" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Paste Listing HTML</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Paste your existing eBay listing HTML below.</div>
            </div>
            {originalHtml.trim() && (
              <button onClick={() => { setOriginalHtml(""); setProcessedHtml(""); setDetections([]); setPhase("input"); }}
                style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                Clear
              </button>
            )}
          </div>
          <textarea
            value={originalHtml}
            onChange={e => setOriginalHtml(e.target.value)}
            placeholder={`<div class="listing">\n  <h2>Oil Pump – Jaguar XF 5.0 V8</h2>\n  <!-- Paste your full eBay HTML here -->\n</div>`}
            spellCheck={false}
            style={{
              flex: 1, padding: "14px 16px", background: "transparent", border: "none",
              color: C.text, fontSize: 11.5, fontFamily: "ui-monospace, monospace",
              resize: "none", outline: "none", lineHeight: 1.7, minHeight: 0,
            }}
          />
          <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: C.muted }}>
              {originalHtml.length > 0 ? `${originalHtml.length.toLocaleString()} characters` : "No HTML pasted yet"}
            </span>
            <Btn variant="primary" size="md" onClick={handleDetect} disabled={!originalHtml.trim() || detecting}>
              {detecting ? "Detecting…" : "Auto-detect placeholders →"}
            </Btn>
          </div>
        </div>

        {/* ══ CENTER: Placeholder mapping (review phase only) ══ */}
        {phase === "review" && (
          <div style={{ display: "flex", flexDirection: "column", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow)" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Placeholder Mapping</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                {detections.length > 0
                  ? `${detections.length} section${detections.length !== 1 ? "s" : ""} detected. Toggle to include or exclude.`
                  : "No sections auto-detected — add placeholders manually in the HTML."}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>

              {/* Detected sections */}
              {detections.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: C.dim, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>
                    Detected sections
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {detections.map(det => {
                      const ph = PLACEHOLDERS.find(p => p.key === det.key);
                      return (
                        <DetectionRow
                          key={det.key}
                          detection={det}
                          color={ph?.color || "var(--blue)"}
                          onToggle={() => toggleDetection(det.key)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Manual placeholder insert */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, color: C.dim, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>
                  All placeholders
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
                  Click to copy a placeholder and paste it manually into your HTML where needed.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {PLACEHOLDERS.map(p => (
                    <PlaceholderChip key={p.key} ph={p} used={processedHtml.includes(p.key)} />
                  ))}
                </div>
              </div>
            </div>

            {/* Warning */}
            <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 8, background: "var(--yellow-bg)", border: "1px solid rgba(217,119,6,0.2)", borderRadius: 8, padding: "8px 12px" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <div style={{ fontSize: 11, color: "#92400e", lineHeight: 1.5 }}>
                  Review detected sections before saving. The original HTML is always preserved.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ RIGHT: Preview (review) / placeholder reference (input) ══ */}
        {phase === "review" ? (
          <div style={{ display: "flex", flexDirection: "column", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow)" }}>
            {/* Preview tabs */}
            <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, padding: "0 4px", flexShrink: 0 }}>
              {[["rendered", "Live Preview"], ["raw", "Template HTML"]].map(([k, l]) => (
                <button key={k} onClick={() => setPreviewTab(k)} style={{
                  padding: "11px 16px", border: "none", background: "transparent", cursor: "pointer",
                  fontSize: 12, fontWeight: previewTab === k ? 700 : 500,
                  color: previewTab === k ? "var(--blue)" : C.muted,
                  borderBottom: previewTab === k ? "2px solid var(--blue)" : "2px solid transparent",
                  marginBottom: -1, transition: "all 0.15s",
                }}>{l}</button>
              ))}
            </div>

            {previewTab === "rendered" ? (
              <iframe
                srcDoc={finalHtml || "<p style='padding:24px;font-family:sans-serif;color:#64748b'>No HTML yet.</p>"}
                style={{ flex: 1, border: "none", background: "#fff" }}
                sandbox="allow-same-origin"
                title="Template Preview"
              />
            ) : (
              <textarea
                value={finalHtml}
                onChange={e => setProcessedHtml(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1, padding: "14px 16px", background: "transparent", border: "none",
                  color: C.text, fontSize: 11, fontFamily: "ui-monospace, monospace",
                  resize: "none", outline: "none", lineHeight: 1.7,
                }}
              />
            )}
          </div>
        ) : (
          <PlaceholderReference />
        )}
      </div>
    </div>
  );
}

function StepBadge({ n, label, active }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
        background: active ? "var(--blue)" : "var(--bg-surface2)",
        border: `2px solid ${active ? "var(--blue)" : "var(--border)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 900, color: active ? "#fff" : C.muted,
      }}>{n}</div>
      <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? C.text : C.muted, whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

function DetectionRow({ detection, color, onToggle }) {
  return (
    <div style={{
      border: `1px solid ${detection.enabled ? color + "30" : "var(--border)"}`,
      borderRadius: 9, padding: "9px 12px",
      background: detection.enabled ? color + "06" : "transparent",
      transition: "all 0.13s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: detection.preview ? 5 : 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: detection.enabled ? color : "var(--border)", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: detection.enabled ? C.text : C.muted }}>{detection.label}</span>
        <ConfBadge level={detection.confidence} />
        <button onClick={onToggle} style={{
          padding: "2px 10px", fontSize: 10, fontWeight: 700, borderRadius: 6, cursor: "pointer",
          border: `1px solid ${detection.enabled ? color + "40" : "var(--border)"}`,
          background: detection.enabled ? color + "12" : "transparent",
          color: detection.enabled ? color : C.muted, transition: "all 0.13s",
        }}>
          {detection.enabled ? "On" : "Off"}
        </button>
      </div>
      {detection.preview && (
        <div style={{ fontSize: 10, color: C.muted, fontFamily: "ui-monospace, monospace", lineHeight: 1.4, paddingLeft: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {detection.preview}
        </div>
      )}
      <div style={{ marginTop: 5, paddingLeft: 16 }}>
        <code style={{ fontSize: 9, color: color, fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>{detection.key}</code>
      </div>
    </div>
  );
}

function PlaceholderChip({ ph, used }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(ph.key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };
  return (
    <button onClick={copy} style={{
      display: "flex", alignItems: "center", gap: 8, width: "100%",
      padding: "6px 10px", borderRadius: 7, border: `1px solid ${used ? ph.color + "30" : "var(--border)"}`,
      background: used ? ph.color + "08" : "transparent", cursor: "pointer",
      textAlign: "left", transition: "all 0.12s",
    }}
      onMouseEnter={e => e.currentTarget.style.background = ph.color + "0f"}
      onMouseLeave={e => e.currentTarget.style.background = used ? ph.color + "08" : "transparent"}
    >
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: ph.color, flexShrink: 0, opacity: used ? 1 : 0.4 }} />
      <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: used ? C.text : C.muted }}>{ph.label}</span>
      {used && <span style={{ fontSize: 9, color: ph.color, fontWeight: 700 }}>✓ used</span>}
      <code style={{ fontSize: 9, color: copied ? "#10b981" : ph.color, fontFamily: "ui-monospace, monospace", opacity: 0.85 }}>
        {copied ? "copied!" : ph.key}
      </code>
    </button>
  );
}

function PlaceholderReference() {
  return (
    <div style={{ display: "flex", flexDirection: "column", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow)" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Available Placeholders</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
          After detection, these will be auto-inserted. You can also copy and paste them manually.
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {PLACEHOLDERS.map(p => (
            <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "var(--bg-surface2)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{p.label}</div>
              </div>
              <code style={{ fontSize: 9, fontFamily: "ui-monospace, monospace", color: p.color, fontWeight: 700 }}>{p.key}</code>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--blue-bg)", border: "1px solid var(--border-blue)", borderRadius: 9 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--blue)", marginBottom: 5 }}>How it works</div>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
            Paste your HTML, click <strong style={{ color: C.text }}>Auto-detect</strong>, and Part Lister will scan for product-specific sections and replace them with placeholders. You can then review and adjust before saving.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template card (list view) ────────────────────────────────────────────────
function TemplateCard({ template, onEdit, onDuplicate, onDelete, onSetDefault }) {
  const [hov,      setHov]      = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const usedPhs = PLACEHOLDERS.filter(p => (template.rawHtml || "").includes(p.key));

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: C.surface, border: `1px solid ${hov ? "var(--border-strong)" : C.border}`,
        borderRadius: 12, padding: "14px 18px",
        transition: "border-color 0.13s, box-shadow 0.13s",
        boxShadow: hov ? "var(--shadow)" : "none",
        display: "flex", alignItems: "center", gap: 14,
      }}
    >
      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: template.isDefault ? "var(--blue-bg)" : "var(--bg-surface2)",
        border: `1px solid ${template.isDefault ? "var(--border-blue)" : C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={template.isDefault ? "var(--blue)" : C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>
        </svg>
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {template.name || "Untitled"}
          </span>
          {template.isDefault && (
            <span style={{ fontSize: 9, fontWeight: 800, color: "var(--blue)", background: "var(--blue-bg)", border: "1px solid var(--border-blue)", borderRadius: 4, padding: "2px 7px", letterSpacing: 0.6, textTransform: "uppercase" }}>Default</span>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {usedPhs.length > 0 ? usedPhs.slice(0, 6).map(p => (
            <span key={p.key} style={{ fontSize: 9, fontFamily: "ui-monospace, monospace", color: p.color, background: p.color + "10", border: `1px solid ${p.color}25`, borderRadius: 4, padding: "1px 5px" }}>
              {p.key}
            </span>
          )) : (
            <span style={{ fontSize: 11, color: C.muted }}>No placeholders detected</span>
          )}
          {usedPhs.length > 6 && <span style={{ fontSize: 10, color: C.muted }}>+{usedPhs.length - 6} more</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
        {!template.isDefault && (
          <ActionBtn onClick={onSetDefault} title="Set as default">Default</ActionBtn>
        )}
        <ActionBtn onClick={onEdit}>Edit</ActionBtn>
        <ActionBtn onClick={onDuplicate}>Duplicate</ActionBtn>

        <div ref={menuRef} style={{ position: "relative" }}>
          <ActionBtn onClick={() => setMenuOpen(o => !o)}>⋯</ActionBtn>
          {menuOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 200,
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: 5, minWidth: 140, boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
            }}>
              {!template.isDefault && (
                <MenuBtn onClick={() => { onSetDefault(); setMenuOpen(false); }}>Set as Default</MenuBtn>
              )}
              <MenuBtn onClick={() => { onDuplicate(); setMenuOpen(false); }}>Duplicate</MenuBtn>
              <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
              <MenuBtn danger onClick={() => { onDelete(); setMenuOpen(false); }}>Delete</MenuBtn>
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
        padding: "5px 12px", fontSize: 11, fontWeight: 600, borderRadius: 7,
        background: hov ? "var(--bg-surface2)" : "transparent",
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
        display: "flex", alignItems: "center", width: "100%",
        padding: "7px 12px", borderRadius: 7, border: "none",
        background: hov ? (danger ? "rgba(220,38,38,0.07)" : "var(--bg-surface2)") : "transparent",
        color: danger ? C.red : C.text, fontSize: 12, fontWeight: 600, cursor: "pointer",
      }}>{children}</button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ListingTemplates() {
  const [templates,  setTemplates]  = useState(loadTemplates);
  const [view,       setView]       = useState("list"); // "list" | "builder"
  const [editing,    setEditing]    = useState(null);   // template being edited

  const persist = (list) => { setTemplates(list); saveTemplates(list); };

  const handleSave = (t) => {
    const idx = templates.findIndex(x => x.id === t.id);
    persist(idx >= 0 ? templates.map(x => x.id === t.id ? t : x) : [...templates, t]);
    setView("list");
    setEditing(null);
  };

  const handleEdit      = (t)  => { setEditing(JSON.parse(JSON.stringify(t))); setView("builder"); };
  const handleNew       = ()   => { setEditing(blankTemplate("")); setView("builder"); };
  const handleDelete    = (id) => persist(templates.filter(x => x.id !== id));
  const handleDuplicate = (t)  => persist([...templates, { ...JSON.parse(JSON.stringify(t)), id: makeId(), name: `${t.name} (Copy)`, isDefault: false }]);
  const handleSetDefault= (id) => persist(templates.map(t => ({ ...t, isDefault: t.id === id })));
  const handleCancel    = ()   => { setView("list"); setEditing(null); };

  if (view === "builder") {
    return (
      <TemplateBuilder
        initial={editing}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: C.muted }}>
            {templates.length} template{templates.length !== 1 ? "s" : ""}
            {templates.find(t => t.isDefault) && (
              <span style={{ marginLeft: 8, color: "var(--blue)" }}>· default active</span>
            )}
          </div>
        </div>
        <Btn variant="primary" onClick={handleNew}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Template
        </Btn>
      </div>

      {/* Template list or empty state */}
      {templates.length === 0 ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "56px 24px", textAlign: "center", boxShadow: "var(--shadow)" }}>
          <div style={{ marginBottom: 14, opacity: 0.35, display: "flex", justifyContent: "center" }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>No templates yet</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.6, maxWidth: 340, margin: "0 auto 24px" }}>
            Paste an existing eBay listing HTML and Part Lister will auto-generate a reusable template with placeholders.
          </div>
          <Btn variant="primary" size="md" onClick={handleNew}>
            Create your first template
          </Btn>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {templates.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              onEdit={() => handleEdit(t)}
              onDuplicate={() => handleDuplicate(t)}
              onDelete={() => handleDelete(t.id)}
              onSetDefault={() => handleSetDefault(t.id)}
            />
          ))}
        </div>
      )}

      {/* Placeholder reference */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", boxShadow: "var(--shadow)" }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.dim, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
          Available Placeholders
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PLACEHOLDERS.map(p => (
            <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 5, background: p.color + "0c", border: `1px solid ${p.color}25`, borderRadius: 6, padding: "3px 9px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
              <code style={{ fontSize: 9, color: p.color, fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>{p.key}</code>
              <span style={{ fontSize: 9, color: C.muted }}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
