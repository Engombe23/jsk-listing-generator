import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

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
  { key: "{{TITLE}}",                   labelKey: "title",          color: "#6366f1" },
  { key: "{{DESCRIPTION}}",             labelKey: "description",    color: "#0ea5e9" },
  { key: "{{OE_NUMBERS}}",              labelKey: "oeNumbers",      color: "#10b981" },
  { key: "{{INTERCHANGEABLE_NUMBERS}}", labelKey: "interchangeable", color: "#f59e0b" },
  { key: "{{K_NUMBERS}}",               labelKey: "kNumbers",       color: "#8b5cf6" },
  { key: "{{ITEM_SPECIFICS}}",          labelKey: "itemSpecifics",  color: "#06b6d4" },
  { key: "{{COMPATIBILITY_TABLE}}",     labelKey: "compatibility",  color: "#3b82f6" },
  { key: "{{FITMENT_WARNING}}",         labelKey: "fitmentWarning", color: "#f87171" },
  { key: "{{WARRANTY}}",                labelKey: "warranty",       color: "#34d399" },
  { key: "{{SHIPPING}}",                labelKey: "shipping",       color: "#a78bfa" },
  { key: "{{RETURNS}}",                 labelKey: "returns",        color: "#fb923c" },
];

function phLabel(labelKey, t) {
  return t(`templates.ph.${labelKey}`);
}
function phLabelByToken(tokenKey, t) {
  const p = PLACEHOLDERS.find(x => x.key === tokenKey);
  return p ? phLabel(p.labelKey, t) : tokenKey;
}

// ─── Storage ──────────────────────────────────────────────────────────────────
const LS_KEY = "jsk_listing_templates_v1";
function loadTemplates()      { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; } }
function saveTemplates(list)  { try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {} }
function makeId()             { return Math.random().toString(36).slice(2, 10); }

function blankTemplate(name = "") {
  return { id: makeId(), name, isDefault: false, useRawHtml: true, rawHtml: "", sections: {} };
}

// ─── Detection engine ─────────────────────────────────────────────────────────
// Each rule tries to find a section in the pasted HTML and returns a detection
// object. On success the corresponding HTML is replaced with the placeholder token.

const DETECTION_RULES = [
  {
    key:   "{{TITLE}}",
    labelKey: "title",
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
    labelKey: "oeNumbers",
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
    labelKey: "interchangeable",
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
    labelKey: "kNumbers",
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
    labelKey: "itemSpecifics",
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
    labelKey: "compatibility",
    confidence: "high",
    detect(html) {
      // Heading + a table block
      const rx = /(<(?:b|strong|div|p|h[1-6])[^>]*>[^<]*(?:Compatible|Fitment|Fits\s+Vehicles?|Vehicle\s+Compat)[^<]*<\/(?:b|strong|div|p|h[1-6])>)([\s\S]{20,}?<\/table>)/i;
      const m = html.match(rx);
      if (m) return { heading: m[1], content: m[2], preview: "__COMPAT_TABLE__" };
      // Fallback: just a <table> with kW/HP/CC headers
      const rxTable = /(<table[\s\S]*?(?:kW|HP|cc|Year|Vehicle)[\s\S]*?<\/table>)/i;
      const m2 = html.match(rxTable);
      if (m2) return { tableOnly: m2[1], preview: "__COMPAT_TABLE__" };
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
    labelKey: "fitmentWarning",
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
      // Case 2: warning symbol + "please review/verify" — match just the sentence,
      // NOT the whole parent element, so product names before ⚠ are left untouched.
      const rx2 = /((?:⚠|&#9888;|&#x26A0;|&amp;#9888;|[⚠⚡❗]|&#\d{4,5};)[^<]*(?:please (?:verify|check|review|ensure)|review the compatibility)[^<.]{5,150})/i;
      const m2 = html.match(rx2);
      if (m2) {
        return { inline: m2[1], preview: m2[1].replace(/&[^;]+;/g, "").trim().slice(0, 70) };
      }
      // Case 3: element whose text is only the warning (no leading product name)
      const rx3 = /(<(?:p|div)[^>]*>)\s*(please (?:verify|check|review|ensure)[^<]{5,120})\s*(<\/(?:p|div)>)/i;
      const m3 = html.match(rx3);
      if (m3) {
        return { fullEl: m3[0], preview: m3[2].slice(0, 70) };
      }
      return null;
    },
    replace(html, match) {
      if (match.inline)  return html.split(match.inline).join("{{FITMENT_WARNING}}");
      if (match.fullEl)  return html.replace(match.fullEl, "{{FITMENT_WARNING}}");
      return html.replace(match.open + match.content + match.close, match.open + "{{FITMENT_WARNING}}" + match.close);
    },
  },

  {
    key:   "{{WARRANTY}}",
    labelKey: "warranty",
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
    labelKey: "shipping",
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
    labelKey: "returns",
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
            labelKey:   rule.labelKey,
            confidence: rule.confidence,
            preview:    match.preview || "__DETECTED__",
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

// ─── HTML processing helpers ──────────────────────────────────────────────────
function sanitizeHtml(html) {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script,object,embed").forEach(el => el.remove());
    doc.querySelectorAll("*").forEach(el => {
      [...el.attributes].forEach(attr => {
        if (attr.name.startsWith("on")) el.removeAttribute(attr.name);
        if (["href","src","action"].includes(attr.name) && /^javascript:/i.test(attr.value.trim()))
          el.removeAttribute(attr.name);
      });
    });
    // Preserve <style> blocks from <head> so class-based styles (dark backgrounds, white text, etc.) survive
    const headStyles = [...doc.head.querySelectorAll("style")].map(s => s.outerHTML).join("");
    return headStyles + doc.body.innerHTML;
  } catch { return html; }
}

function injectTids(html) {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    let n = 0;
    doc.querySelectorAll("div,p,h1,h2,h3,h4,h5,h6,table,ul,ol,li,section,header,footer,span,b,strong,em,td,th,tr")
      .forEach(el => { if (!el.hasAttribute("data-tid")) el.setAttribute("data-tid", String(++n)); });
    return doc.body.innerHTML;
  } catch { return html; }
}

function generateTemplateFromMarks(tidHtml, staticTids) {
  try {
    const doc = new DOMParser().parseFromString(tidHtml, "text/html");
    const saved = {};
    let n = 0;
    staticTids.forEach(tid => {
      const el = doc.querySelector(`[data-tid="${tid}"]`);
      if (!el) return;
      const marker = `__SL${n++}__`;
      saved[marker] = el.outerHTML.replace(` data-tid="${tid}"`, "");
      el.parentNode.replaceChild(doc.createTextNode(marker), el);
    });
    let modified = doc.body.innerHTML;
    const { detections, processedHtml } = runDetection(modified);
    let finalHtml = processedHtml;
    Object.entries(saved).forEach(([m, h]) => { finalHtml = finalHtml.split(m).join(h); });
    finalHtml = finalHtml.replace(/ data-tid="\d+"/g, "");
    return { finalHtml, detections };
  } catch {
    const { detections, processedHtml } = runDetection(tidHtml);
    return { finalHtml: processedHtml.replace(/ data-tid="\d+"/g, ""), detections };
  }
}

function buildSelectionIframe(tidHtml) {
  const js = `(function(){
var s=new Set(),mode='view',hov=null;
function paint(){
  document.querySelectorAll('[data-tid]').forEach(function(e){
    var t=e.getAttribute('data-tid'),isS=s.has(t),isH=e===hov&&mode==='select';
    e.style.outline=isS?'2px solid #10b981':isH?'2px dashed #3b82f6':'';
    e.style.outlineOffset='2px';
    e.style.background=isS?'rgba(16,185,129,0.07)':'';
    e.style.cursor=mode==='select'?'pointer':'';
  });
}
document.addEventListener('mouseover',function(e){
  if(mode!=='select')return;
  var el=e.target;while(el&&el!==document.body&&!el.hasAttribute('data-tid'))el=el.parentElement;
  if(el&&el.hasAttribute('data-tid')){hov=el;paint();}
},true);
document.addEventListener('mouseout',function(e){
  if(mode!=='select')return;
  var el=e.target;while(el&&el!==document.body&&!el.hasAttribute('data-tid'))el=el.parentElement;
  if(el===hov){hov=null;paint();}
},true);
document.addEventListener('click',function(e){
  if(mode!=='select')return;
  e.preventDefault();e.stopPropagation();
  var el=e.target;while(el&&el!==document.body&&!el.hasAttribute('data-tid'))el=el.parentElement;
  if(el&&el.hasAttribute('data-tid'))window.parent.postMessage({type:'tid-click',tid:el.getAttribute('data-tid')},'*');
},true);
window.addEventListener('message',function(e){
  if(!e.data)return;
  if(e.data.type==='set-mode'){mode=e.data.mode;paint();}
  if(e.data.type==='set-static'){s=new Set(e.data.tids);paint();}
});
})();`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;padding:0}
</style></head><body>${tidHtml}<scr` + `ipt>${js}</scr` + `ipt></body></html>`;
}

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
  const { t } = useTranslation();
  const map = {
    high:   { labelKey: "confHigh",   bg: "rgba(16,185,129,0.10)", color: "#10b981", bd: "rgba(16,185,129,0.25)" },
    medium: { labelKey: "confMedium", bg: "rgba(245,158,11,0.10)", color: "#f59e0b", bd: "rgba(245,158,11,0.25)" },
    low:    { labelKey: "confLow",    bg: "rgba(156,163,175,0.10)", color: "#9ca3af", bd: "rgba(156,163,175,0.25)" },
  };
  const m = map[level] || map.low;
  return (
    <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8,
      background: m.bg, color: m.color, border: `1px solid ${m.bd}`, borderRadius: 5, padding: "2px 7px" }}>
      {t(`templates.${m.labelKey}`)}
    </span>
  );
}

// ─── Template Builder ─────────────────────────────────────────────────────────
function TemplateBuilder({ initial, onSave, onCancel }) {
  const { t } = useTranslation();
  const [phase,         setPhase]         = useState(initial?.rawHtml ? "review" : "input"); // "input" | "review"
  const [originalHtml,  setOriginalHtml]  = useState(initial?.rawHtml || "");
  const [processedHtml, setProcessedHtml] = useState(initial?.rawHtml || "");
  const [detections,    setDetections]    = useState([]);
  const [name,          setName]          = useState(initial?.name || "");
  const [previewTab,    setPreviewTab]    = useState("rendered");
  const iframeRef = useRef(null);

  const [detecting, setDetecting] = useState(false);
  const finalHtml = processedHtml;

  const handleDetect = async () => {
    if (!originalHtml.trim()) return;
    setDetecting(true);
    try {
      const sanitized = sanitizeHtml(originalHtml);
      const { detections: dets, processedHtml: pHtml } = runDetection(sanitized);
      setProcessedHtml(pHtml);
      setDetections(dets);
      setPreviewTab("rendered");
      setPhase("review");
    } finally {
      setDetecting(false);
    }
  };

  const handleReset = () => setPhase("input");

  const toggleDetection = (key) => {
    setDetections(prev => {
      const det = prev.find(d => d.key === key);
      if (!det) return prev;
      if (det.enabled) {
        setProcessedHtml(ph => ph.replace(new RegExp(escapeRegex(key), "g"),
          `<span style="opacity:0.4;font-style:italic">${t("templates.removedMarker", { label: phLabelByToken(key, t) })}</span>`));
      } else {
        const { processedHtml: restored } = runDetection(sanitizeHtml(originalHtml));
        setProcessedHtml(restored);
      }
      return prev.map(d => d.key === key ? { ...d, enabled: !d.enabled } : d);
    });
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const tmpl = initial ? { ...initial } : blankTemplate(name);
    tmpl.name = name.trim(); tmpl.rawHtml = processedHtml; tmpl.useRawHtml = true;
    onSave(tmpl);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", minHeight: 560 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 16, borderBottom: `1px solid ${C.border}`, marginBottom: 16, flexShrink: 0 }}>
        <button onClick={onCancel} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, fontWeight: 600, padding: "4px 0" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
          {t("templates.breadcrumbs")}
        </button>
        <span style={{ color: C.border, fontSize: 16 }}>/</span>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t("templates.templateNamePlaceholder")}
          style={{ flex: 1, fontSize: 15, fontWeight: 700, color: C.text, background: "transparent", border: "none", outline: "none" }}
        />
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {phase === "review" && <Btn variant="ghost" onClick={handleReset}>{t("templates.backToEdit")}</Btn>}
          <Btn variant="primary" onClick={handleSave} disabled={!name.trim() || !finalHtml.trim()}>
            {t("templates.saveTemplate")}
          </Btn>
        </div>
      </div>

      {/* ── Step indicator ── */}
      {phase === "input" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexShrink: 0 }}>
          <StepBadge n="1" active label={t("templates.stepPaste")} />
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <StepBadge n="2" label={t("templates.stepReview")} />
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <StepBadge n="3" label={t("templates.stepSave")} />
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "grid", gridTemplateColumns: phase === "review" ? "1fr 280px 1fr" : "1fr", gap: 16 }}>

        {/* ══ LEFT: HTML input ══ */}
        <div style={{ display: "flex", flexDirection: "column", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow)" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t("templates.pasteTitle")}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{t("templates.pasteSubtitle")}</div>
            </div>
            {originalHtml.trim() && (
              <button onClick={() => { setOriginalHtml(""); setProcessedHtml(""); setDetections([]); setPhase("input"); }}
                style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                {t("templates.clear")}
              </button>
            )}
          </div>
          <textarea
            value={originalHtml}
            onChange={e => setOriginalHtml(e.target.value)}
            placeholder={t("templates.htmlPlaceholder")}
            spellCheck={false}
            style={{
              flex: 1, padding: "14px 16px", background: "transparent", border: "none",
              color: C.text, fontSize: 11.5, fontFamily: "ui-monospace, monospace",
              resize: "none", outline: "none", lineHeight: 1.7, minHeight: 0,
            }}
          />
          <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: C.muted }}>
              {originalHtml.length > 0 ? t("templates.charCount", { n: originalHtml.length.toLocaleString() }) : t("templates.noHtmlYet")}
            </span>
            <Btn variant="primary" size="md" onClick={handleDetect} disabled={!originalHtml.trim() || detecting}>
              {detecting ? t("templates.detecting") : t("templates.autoDetect")}
            </Btn>
          </div>
        </div>

        {/* ══ CENTER: Detected sections (review phase only) ══ */}
        {phase === "review" && (
          <div style={{ display: "flex", flexDirection: "column", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow)" }}>

            {/* Header */}
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t("templates.detectedTitle")}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {t("templates.detectedSubtitle")}
                  </div>
                </div>
              </div>
            </div>

            {/* Detected list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }}>

              {detections.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 8 }}>{t("templates.nothingDetected")}</div>
                  <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.6 }}>
                    {t("templates.nothingDetectedHint", { token: "{{OE_NUMBERS}}" })}
                  </div>
                </div>
              ) : (
                <>
                  {/* Found */}
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

                  {/* Not detected — dimmed rows so user knows what wasn't found */}
                  {(() => {
                    const found = new Set(detections.map(d => d.key));
                    const missing = PLACEHOLDERS.filter(p => !found.has(p.key));
                    if (!missing.length) return null;
                    return (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 1, margin: "6px 4px 6px" }}>{t("templates.notDetected")}</div>
                        {missing.map(p => (
                          <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 8, opacity: 0.45 }}>
                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.border, flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: 12, color: C.muted }}>{phLabel(p.labelKey, t)}</span>
                            <code style={{ fontSize: 9, color: C.dim, fontFamily: "ui-monospace, monospace" }}>{p.key}</code>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {/* Footer note */}
            <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, flexShrink: 0, fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
              {t("templates.manualHint")}
            </div>
          </div>
        )}

        {/* ══ RIGHT: Preview (review phase only) ══ */}
        {phase === "review" && (
          <div style={{ display: "flex", flexDirection: "column", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow)" }}>
            {/* Preview tabs */}
            <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, padding: "0 4px", flexShrink: 0 }}>
              {[["rendered", t("templates.livePreview")], ["raw", t("templates.templateHtml")]].map(([k, l]) => (
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
                srcDoc={finalHtml || `<p style='padding:24px;font-family:sans-serif;color:#64748b'>${t("templates.noHtmlPreview")}</p>`}
                style={{ flex: 1, border: "none", background: "#fff" }}
                sandbox="allow-same-origin"
                title={t("templates.previewTitle")}
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
        )}
      </div>
    </div>
  );
}

function StepBadge({ n, label, active, done }) {
  const bg  = active ? "var(--blue)" : done ? "rgba(16,185,129,0.15)" : "var(--bg-surface2)";
  const bd  = active ? "var(--blue)" : done ? "rgba(16,185,129,0.4)"  : "var(--border)";
  const col = active ? "#fff"        : done ? "#10b981"                : C.muted;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: bg, border: `2px solid ${bd}`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: col,
      }}>{done ? "✓" : n}</div>
      <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? C.text : C.muted, whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

function DetectionRow({ detection, color, onToggle }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const preview = detection.preview === "__COMPAT_TABLE__"
    ? t("templates.compatTableDetected")
    : detection.preview === "__DETECTED__"
      ? t("templates.detectedFallback")
      : detection.preview;
  return (
    <div style={{
      border: `1px solid ${detection.enabled ? color + "28" : "var(--border)"}`,
      borderRadius: 9,
      background: detection.enabled ? color + "05" : "var(--bg-surface2)",
      transition: "all 0.13s",
      overflow: "hidden",
    }}>
      {/* Main row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: detection.enabled ? color : "var(--border)", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: detection.enabled ? C.text : C.muted }}>{phLabel(detection.labelKey, t)}</span>
        <code style={{ fontSize: 9, fontFamily: "ui-monospace, monospace", color: detection.enabled ? color : C.dim, fontWeight: 700, flexShrink: 0 }}>{detection.key}</code>
        <ConfBadge level={detection.confidence} />
        {/* Toggle */}
        <button onClick={onToggle} style={{
          width: 42, height: 22, borderRadius: 11, cursor: "pointer", border: "none", flexShrink: 0,
          background: detection.enabled ? color : "var(--border)",
          position: "relative", transition: "background 0.2s",
        }}>
          <span style={{
            position: "absolute", top: 3, left: detection.enabled ? "calc(100% - 19px)" : 3,
            width: 16, height: 16, borderRadius: "50%", background: "#fff",
            transition: "left 0.2s", display: "block",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }} />
        </button>
      </div>
      {/* Preview (expandable) */}
      {preview && (
        <button onClick={() => setExpanded(e => !e)} style={{ width: "100%", padding: "0 12px 8px 28px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
          <div style={{ fontSize: 10, color: C.dim, fontFamily: "ui-monospace, monospace", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: expanded ? "normal" : "nowrap" }}>
            {preview}
          </div>
        </button>
      )}
    </div>
  );
}

function PlaceholderChip({ ph, used }) {
  const { t } = useTranslation();
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
      <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: used ? C.text : C.muted }}>{phLabel(ph.labelKey, t)}</span>
      {used && <span style={{ fontSize: 9, color: ph.color, fontWeight: 700 }}>{t("templates.used")}</span>}
      <code style={{ fontSize: 9, color: copied ? "#10b981" : ph.color, fontFamily: "ui-monospace, monospace", opacity: 0.85 }}>
        {copied ? t("templates.copied") : ph.key}
      </code>
    </button>
  );
}

function PlaceholderReference() {
  const { t } = useTranslation();
  return (
    <div style={{ display: "flex", flexDirection: "column", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow)" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t("templates.availablePlaceholders")}</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
          {t("templates.availablePlaceholdersHint")}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {PLACEHOLDERS.map(p => (
            <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "var(--bg-surface2)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{phLabel(p.labelKey, t)}</div>
              </div>
              <code style={{ fontSize: 9, fontFamily: "ui-monospace, monospace", color: p.color, fontWeight: 700 }}>{p.key}</code>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--blue-bg)", border: "1px solid var(--border-blue)", borderRadius: 9 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--blue)", marginBottom: 5 }}>{t("templates.howItWorks")}</div>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
            {t("templates.howItWorksBody")}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template card (list view) ────────────────────────────────────────────────
function TemplateCard({ template, onEdit, onDuplicate, onDelete, onSetDefault }) {
  const { t } = useTranslation();
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
            {template.name || t("templates.untitled")}
          </span>
          {template.isDefault && (
            <span style={{ fontSize: 9, fontWeight: 800, color: "var(--blue)", background: "var(--blue-bg)", border: "1px solid var(--border-blue)", borderRadius: 4, padding: "2px 7px", letterSpacing: 0.6, textTransform: "uppercase" }}>{t("templates.defaultBadge")}</span>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {usedPhs.length > 0 ? usedPhs.slice(0, 6).map(p => (
            <span key={p.key} style={{ fontSize: 9, fontFamily: "ui-monospace, monospace", color: p.color, background: p.color + "10", border: `1px solid ${p.color}25`, borderRadius: 4, padding: "1px 5px" }}>
              {p.key}
            </span>
          )) : (
            <span style={{ fontSize: 11, color: C.muted }}>{t("templates.noPlaceholders")}</span>
          )}
          {usedPhs.length > 6 && <span style={{ fontSize: 10, color: C.muted }}>{t("templates.moreCount", { n: usedPhs.length - 6 })}</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
        {!template.isDefault && (
          <ActionBtn onClick={onSetDefault} title={t("templates.setAsDefault")}>{t("templates.defaultBadge")}</ActionBtn>
        )}
        <ActionBtn onClick={onEdit}>{t("templates.edit")}</ActionBtn>
        <ActionBtn onClick={onDuplicate}>{t("templates.duplicate")}</ActionBtn>

        <div ref={menuRef} style={{ position: "relative" }}>
          <ActionBtn onClick={() => setMenuOpen(o => !o)}>⋯</ActionBtn>
          {menuOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 200,
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: 5, minWidth: 140, boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
            }}>
              {!template.isDefault && (
                <MenuBtn onClick={() => { onSetDefault(); setMenuOpen(false); }}>{t("templates.setAsDefaultMenu")}</MenuBtn>
              )}
              <MenuBtn onClick={() => { onDuplicate(); setMenuOpen(false); }}>{t("templates.duplicate")}</MenuBtn>
              <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
              <MenuBtn danger onClick={() => { onDelete(); setMenuOpen(false); }}>{t("templates.delete")}</MenuBtn>
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
  const { t } = useTranslation();
  const [templates,  setTemplates]  = useState(loadTemplates);
  const [view,       setView]       = useState("list"); // "list" | "builder"
  const [editing,    setEditing]    = useState(null);   // template being edited

  useEffect(() => {
    if (sessionStorage.getItem("jsk_templates_open_builder") === "1") {
      sessionStorage.removeItem("jsk_templates_open_builder");
      setEditing(blankTemplate(t("templates.newTemplateName")));
      setView("builder");
    }
  }, [t]);

  const persist = (list) => { setTemplates(list); saveTemplates(list); };

  const handleSave = (t) => {
    const idx = templates.findIndex(x => x.id === t.id);
    persist(idx >= 0 ? templates.map(x => x.id === t.id ? t : x) : [...templates, t]);
    setView("list");
    setEditing(null);
  };

  const handleEdit      = (t)  => { setEditing(JSON.parse(JSON.stringify(t))); setView("builder"); };
  const handleNew       = ()   => { setEditing(blankTemplate(t("templates.newTemplateName"))); setView("builder"); };
  const handleDelete    = (id) => persist(templates.filter(x => x.id !== id));
  const handleDuplicate = (template)  => persist([...templates, { ...JSON.parse(JSON.stringify(template)), id: makeId(), name: t("templates.copySuffix", { name: template.name }), isDefault: false }]);
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
            {templates.length === 1
              ? t("templates.countOne", { n: templates.length })
              : t("templates.countMany", { n: templates.length })}
            {templates.find(t => t.isDefault) && (
              <span style={{ marginLeft: 8, color: "var(--blue)" }}>{t("templates.defaultActive")}</span>
            )}
          </div>
        </div>
        <Btn variant="primary" onClick={handleNew}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {t("templates.newTemplate")}
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
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{t("templates.emptyTitle")}</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.6, maxWidth: 340, margin: "0 auto 24px" }}>
            {t("templates.emptyBody")}
          </div>
          <Btn variant="primary" size="md" onClick={handleNew}>
            {t("templates.createFirst")}
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
          {t("templates.availablePlaceholders")}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PLACEHOLDERS.map(p => (
            <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 5, background: p.color + "0c", border: `1px solid ${p.color}25`, borderRadius: 6, padding: "3px 9px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
              <code style={{ fontSize: 9, color: p.color, fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>{p.key}</code>
              <span style={{ fontSize: 9, color: C.muted }}>{phLabel(p.labelKey, t)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
