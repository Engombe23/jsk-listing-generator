import { useState, useEffect, useRef, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ── helpers ───────────────────────────────────────────────────────────────────

let _uid = 0;
const uid = () => String(++_uid);

function authHeaders(session) {
  return {
    "Content-Type": "application/json",
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return [];
  const header = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim().toLowerCase());
  const oemIdx   = header.findIndex(h => h.includes("part") || h.includes("oem") || h.includes("article") || h.includes("number") || h === "input");
  const skuIdx   = header.findIndex(h => h === "sku" || h.includes("sku"));
  const priceIdx = header.findIndex(h => h.includes("price") || h.includes("bin"));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(c => c.replace(/^"|"$/g, "").trim());
    const inputNumber = oemIdx  >= 0 ? cols[oemIdx]   : cols[0] || "";
    const sku         = skuIdx  >= 0 ? cols[skuIdx]   : cols[1] || "";
    const binPrice    = priceIdx >= 0 ? cols[priceIdx] : cols[2] || "";
    if (inputNumber) rows.push({ id: uid(), inputNumber, sku, binPrice });
  }
  return rows;
}

function fmtTime(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60), s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

// ── status metadata ───────────────────────────────────────────────────────────

const STATUS_META = {
  queued:       { label: "Queued",       color: "#8a8fa8", bg: "#f1f2f7" },
  searching:    { label: "Searching",    color: "#d97706", bg: "#fffbeb" },
  generating:   { label: "Generating",   color: "#2563eb", bg: "#eff6ff" },
  completed:    { label: "Completed",    color: "#16a34a", bg: "#f0fdf4" },
  needs_review: { label: "Needs Review", color: "#9333ea", bg: "#faf5ff" },
  failed:       { label: "Failed",       color: "#dc2626", bg: "#fef2f2" },
  not_found:    { label: "Not Found",    color: "#6b7280", bg: "#f3f4f6" },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.queued;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
      color: m.color, background: m.bg,
    }}>
      {status === "searching" || status === "generating"
        ? <Spinner size={9} color={m.color} />
        : null}
      {m.label}
    </span>
  );
}

function Spinner({ size = 14, color = "var(--blue)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: "spin 0.8s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}

// ── empty row factory ─────────────────────────────────────────────────────────

const emptyRow = () => ({ id: uid(), inputNumber: "", sku: "", binPrice: "" });

// ── main component ────────────────────────────────────────────────────────────

export default function BulkListingGenerator({ session }) {
  const [mode, setMode]       = useState("input"); // "input" | "active"
  const [rows, setRows]       = useState([emptyRow(), emptyRow(), emptyRow()]);
  const [errors, setErrors]   = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [jobId,  setJobId]   = useState(() => sessionStorage.getItem("jsk_bulk_job") || null);
  const [job,    setJob]     = useState(null);
  const [items,  setItems]   = useState([]);

  const [reviewItem, setReviewItem] = useState(null);
  const [exporting,  setExporting]  = useState(false);

  const pollRef      = useRef(null);
  const startTimeRef = useRef(null);
  const fileRef      = useRef(null);

  // ── fetch job state ────────────────────────────────────────────────────────
  const fetchJob = useCallback(async (id) => {
    const res = await fetch(`${API_URL}/api/bulk/jobs/${id}`, { headers: authHeaders(session) });
    if (!res.ok) return null;
    return res.json();
  }, [session]);

  // ── start polling when jobId is set ───────────────────────────────────────
  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      const data = await fetchJob(jobId);
      if (!data) return;
      setJob(data.job);
      setItems(data.items || []);
      if (data.job.status === "completed") {
        clearInterval(pollRef.current);
      }
    };

    setMode("active");
    if (!startTimeRef.current) startTimeRef.current = Date.now();
    poll();
    pollRef.current = setInterval(poll, 2500);
    return () => clearInterval(pollRef.current);
  }, [jobId, fetchJob]);

  // ── re-poll when user retries / picks ─────────────────────────────────────
  const restartPoll = useCallback(() => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const data = await fetchJob(jobId);
      if (!data) return;
      setJob(data.job);
      setItems(data.items || []);
      if (data.job.status === "completed") clearInterval(pollRef.current);
    }, 2500);
  }, [jobId, fetchJob]);

  // ── input table helpers ───────────────────────────────────────────────────
  const addRow = () => setRows(r => [...r, emptyRow()]);

  const removeRow = (id) => setRows(r => r.filter(row => row.id !== id));

  const updateRow = (id, field, val) =>
    setRows(r => r.map(row => row.id === id ? { ...row, [field]: val } : row));

  const handlePaste = (e, id) => {
    const text = e.clipboardData.getData("text");
    const lines = text.split(/\r?\n/).map(l => l.split(/\t|,/));
    if (lines.length > 1) {
      e.preventDefault();
      const newRows = lines
        .map(cols => ({
          id: uid(),
          inputNumber: (cols[0] || "").trim(),
          sku:         (cols[1] || "").trim(),
          binPrice:    (cols[2] || "").trim(),
        }))
        .filter(r => r.inputNumber);
      setRows(r => {
        const without = r.filter(row => row.id !== id);
        return [...without, ...newRows];
      });
    }
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCsv(ev.target.result);
      if (parsed.length) setRows(parsed);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    const seenNums = new Set(), seenSkus = new Set();
    const validRows = rows.filter(r => r.inputNumber.trim());

    if (!validRows.length) {
      errs._global = "Add at least one part number.";
      setErrors(errs);
      return false;
    }

    rows.forEach(r => {
      if (!r.inputNumber.trim()) return;
      const num = r.inputNumber.trim().toUpperCase();
      const sku = r.sku.trim().toUpperCase();
      if (seenNums.has(num)) errs[`dup_num_${r.id}`] = "Duplicate part number";
      else seenNums.add(num);
      if (sku && seenSkus.has(sku)) errs[`dup_sku_${r.id}`] = "Duplicate SKU";
      else if (sku) seenSkus.add(sku);
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;

    const validRows = rows.filter(r => r.inputNumber.trim());
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/bulk/jobs`, {
        method: "POST",
        headers: authHeaders(session),
        body: JSON.stringify({
          items: validRows.map(r => ({
            inputNumber: r.inputNumber.trim(),
            sku:         r.sku.trim(),
            binPrice:    r.binPrice.trim(),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create job");
      sessionStorage.setItem("jsk_bulk_job", data.jobId);
      startTimeRef.current = Date.now();
      setJobId(data.jobId);
    } catch (err) {
      setErrors({ _global: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // ── retry ──────────────────────────────────────────────────────────────────
  const handleRetry = async () => {
    await fetch(`${API_URL}/api/bulk/jobs/${jobId}/retry`, {
      method: "POST",
      headers: authHeaders(session),
      body: "{}",
    });
    restartPoll();
  };

  // ── pick article for needs_review ─────────────────────────────────────────
  const handlePick = async (itemId, articleNo) => {
    setReviewItem(null);
    await fetch(`${API_URL}/api/bulk/jobs/${jobId}/pick`, {
      method: "POST",
      headers: authHeaders(session),
      body: JSON.stringify({ itemId, articleNo }),
    });
    restartPoll();
  };

  // ── export ─────────────────────────────────────────────────────────────────
  const handleExport = async (type) => {
    setExporting(true);
    try {
      const url = `${API_URL}/api/bulk/jobs/${jobId}/${type}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${session?.access_token}` } });
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = type === "export" ? `bulk-export.csv` : `bulk-report.csv`;
      a.click();
    } finally {
      setExporting(false);
    }
  };

  // ── reset to new job ───────────────────────────────────────────────────────
  const handleNewJob = () => {
    clearInterval(pollRef.current);
    sessionStorage.removeItem("jsk_bulk_job");
    setJobId(null);
    setJob(null);
    setItems([]);
    setRows([emptyRow(), emptyRow(), emptyRow()]);
    setErrors({});
    startTimeRef.current = null;
    setMode("input");
  };

  // ── progress calculations ──────────────────────────────────────────────────
  const done     = (job?.completed_count || 0) + (job?.failed_count || 0) + (job?.needs_review_count || 0);
  const total    = job?.total_items || 0;
  const pct      = total > 0 ? Math.round((done / total) * 100) : 0;
  const elapsed  = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0;
  const rate     = done > 0 ? elapsed / done : 0;
  const remaining = rate > 0 && done < total ? (total - done) * rate : null;

  const countByStatus = items.reduce((acc, it) => {
    acc[it.status] = (acc[it.status] || 0) + 1;
    return acc;
  }, {});

  const isProcessing = job?.status === "processing" || job?.status === "pending";
  const isComplete   = job?.status === "completed";
  const hasFailed    = (job?.failed_count || 0) + (job?.not_found_count || 0) > 0;
  const needsReviewCount = job?.needs_review_count || 0;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .bulk-row-input {
          width: 100%; padding: 7px 10px; border: 1px solid var(--border);
          borderRadius: 7px; background: var(--bg); color: var(--text);
          font-size: 13px; box-sizing: border-box; outline: none;
          transition: border-color 0.15s;
        }
        .bulk-row-input:focus { border-color: var(--blue); }
        .bulk-row-input.err { border-color: var(--red, #dc2626); }
        .bulk-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 16px; border-radius: 8px; font-size: 13px;
          font-weight: 600; cursor: pointer; border: none; transition: opacity 0.15s;
        }
        .bulk-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .bulk-btn:hover:not(:disabled) { opacity: 0.85; }
      `}</style>

      {/* ── Input mode ──────────────────────────────────────────────────────── */}
      {mode === "input" && (
        <div>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text)" }}>Bulk Listing Generator</h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                Enter part numbers or OEM references. Listings are saved automatically.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="bulk-btn"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                onClick={() => fileRef.current?.click()}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Import CSV
              </button>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleCsvUpload} />
            </div>
          </div>

          {/* CSV hint */}
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--blue-bg, #eff6ff)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 8, fontSize: 12, color: "var(--text-muted)" }}>
            CSV format: <strong>Part Number / OEM</strong>, <strong>SKU</strong>, <strong>BIN Price</strong> (optional).
            First row can be a header. You can also paste multi-column data directly into the table.
          </div>

          {/* Table */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 160px 110px 36px", padding: "8px 12px", background: "var(--bg-alt, var(--bg))", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)", textAlign: "center" }}>#</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>Part Number / OEM</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>SKU</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>BIN Price</span>
              <span />
            </div>
            {rows.map((row, i) => (
              <div key={row.id} style={{ display: "grid", gridTemplateColumns: "36px 1fr 160px 110px 36px", padding: "5px 12px", borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "var(--text-dim)", textAlign: "center" }}>{i + 1}</span>
                <input
                  className={`bulk-row-input${errors[`dup_num_${row.id}`] ? " err" : ""}`}
                  placeholder="e.g. 1K0122291E or N47 D20 A"
                  value={row.inputNumber}
                  onChange={e => updateRow(row.id, "inputNumber", e.target.value)}
                  onPaste={e => handlePaste(e, row.id)}
                  title={errors[`dup_num_${row.id}`] || undefined}
                />
                <input
                  className={`bulk-row-input${errors[`dup_sku_${row.id}`] ? " err" : ""}`}
                  placeholder="SKU-001"
                  value={row.sku}
                  onChange={e => updateRow(row.id, "sku", e.target.value)}
                  title={errors[`dup_sku_${row.id}`] || undefined}
                />
                <input
                  className="bulk-row-input"
                  placeholder="£0.00"
                  value={row.binPrice}
                  onChange={e => updateRow(row.id, "binPrice", e.target.value)}
                />
                <button
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1}
                  style={{ background: "none", border: "none", cursor: rows.length === 1 ? "not-allowed" : "pointer", color: "var(--text-dim)", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, borderRadius: 4, opacity: rows.length === 1 ? 0.3 : 1 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Add row + submit */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button className="bulk-btn"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
              onClick={addRow}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Row
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {errors._global && (
                <span style={{ fontSize: 12, color: "var(--red, #dc2626)" }}>{errors._global}</span>
              )}
              <button className="bulk-btn"
                style={{ background: "var(--blue)", color: "#fff" }}
                disabled={submitting}
                onClick={handleSubmit}>
                {submitting ? <Spinner size={13} color="#fff" /> : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                )}
                Generate {rows.filter(r => r.inputNumber.trim()).length || ""} Listings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active job mode ──────────────────────────────────────────────────── */}
      {mode === "active" && (
        <div>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
                {isComplete ? "Bulk Job Complete" : "Generating Listings…"}
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                Job ID: {jobId?.slice(0, 8)}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {isComplete && hasFailed && (
                <button className="bulk-btn"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                  onClick={handleRetry}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
                  </svg>
                  Retry Failed
                </button>
              )}
              {isComplete && (job?.completed_count || 0) > 0 && (
                <>
                  <button className="bulk-btn"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                    disabled={exporting}
                    onClick={() => handleExport("report")}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    Export Report
                  </button>
                  <button className="bulk-btn"
                    style={{ background: "var(--blue)", color: "#fff" }}
                    disabled={exporting}
                    onClick={() => handleExport("export")}>
                    {exporting ? <Spinner size={13} color="#fff" /> : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    )}
                    Export Listings
                  </button>
                </>
              )}
              {isComplete && (
                <button className="bulk-btn"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                  onClick={handleNewJob}>
                  New Job
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {!isComplete && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {done} / {total} complete
                </span>
                <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  {remaining !== null ? `Est. ${fmtTime(remaining)} remaining` : "Estimating…"}
                </span>
              </div>
              <div style={{ height: 8, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "var(--blue)", borderRadius: 99, transition: "width 0.5s ease" }} />
              </div>
            </div>
          )}

          {/* Status summary chips */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { key: "completed",    label: "Completed",    icon: "✓", color: "#16a34a" },
              { key: "needs_review", label: "Needs Review", icon: "?", color: "#9333ea" },
              { key: "failed",       label: "Failed",       icon: "✕", color: "#dc2626" },
              { key: "not_found",    label: "Not Found",    icon: "–", color: "#6b7280" },
              { key: "searching",    label: "Searching",    icon: "…", color: "#d97706" },
              { key: "generating",   label: "Generating",   icon: "…", color: "#2563eb" },
              { key: "queued",       label: "Queued",       icon: "·", color: "#8a8fa8" },
            ].map(({ key, label, icon, color }) => {
              const count = countByStatus[key] || 0;
              if (!count && key !== "completed") return null;
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, border: "1px solid var(--border)", background: "var(--bg-surface)", fontSize: 12, fontWeight: 600 }}>
                  <span style={{ color, fontSize: 14 }}>{icon}</span>
                  <span style={{ color: "var(--text)" }}>{count}</span>
                  <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>{label}</span>
                </div>
              );
            })}
          </div>

          {/* Items table */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 130px 1fr 130px 40px", padding: "8px 12px", background: "var(--bg-alt, var(--bg))", borderBottom: "1px solid var(--border)" }}>
              {["#", "Input Number", "SKU", "Product / Article", "Status", ""].map((h, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>{h}</span>
              ))}
            </div>
            {items.map((item, i) => {
              const candidates = (() => {
                try { return item.candidates ? JSON.parse(item.candidates) : null; } catch { return null; }
              })();
              const isReviewOpen = reviewItem === item.id;
              return (
                <div key={item.id}>
                  <div style={{
                    display: "grid", gridTemplateColumns: "40px 1fr 130px 1fr 130px 40px",
                    padding: "9px 12px", borderBottom: "1px solid var(--border)",
                    alignItems: "center", gap: 6,
                    background: isReviewOpen ? "var(--blue-bg, #eff6ff)" : "transparent",
                  }}>
                    <span style={{ fontSize: 12, color: "var(--text-dim)", textAlign: "center" }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: "var(--text)", fontFamily: "monospace" }}>
                      {item.input_number}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.sku || "—"}</span>
                    <span style={{ fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.product_name
                        ? <><span style={{ color: "var(--text-dim)", fontSize: 11 }}>{item.resolved_article_number} · </span>{item.product_name}</>
                        : <span style={{ color: "var(--text-dim)", fontStyle: "italic" }}>—</span>}
                    </span>
                    <StatusBadge status={item.status} />
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      {item.status === "needs_review" && candidates && (
                        <button
                          title="Pick article"
                          onClick={() => setReviewItem(isReviewOpen ? null : item.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#9333ea", display: "flex", alignItems: "center", padding: 4 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Needs-review candidate picker */}
                  {isReviewOpen && candidates && (
                    <div style={{ padding: "12px 52px 16px", background: "var(--blue-bg, #eff6ff)", borderBottom: "1px solid var(--border)" }}>
                      <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: "#1e40af" }}>
                        {candidates.length} articles found — choose the best match:
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {candidates.map(c => (
                          <button key={c.articleNo}
                            onClick={() => handlePick(item.id, c.articleNo)}
                            style={{
                              display: "flex", alignItems: "center", gap: 12,
                              padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                              background: "var(--bg-surface)", border: "1px solid var(--border)",
                              textAlign: "left", transition: "border-color 0.15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = "#2563eb"}
                            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                            {c.imageUrl && (
                              <img
                                src={`${API_URL}/api/image-proxy?url=${encodeURIComponent(c.imageUrl)}`}
                                alt=""
                                style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 4, flexShrink: 0 }}
                                onError={e => { e.target.style.display = "none"; }}
                              />
                            )}
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                                {c.brand} {c.articleNo}
                              </div>
                              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.productName}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Error message */}
                  {item.status === "failed" && item.error_message && (
                    <div style={{ padding: "4px 52px 8px", background: "#fef2f2", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 11, color: "#dc2626" }}>{item.error_message}</span>
                    </div>
                  )}
                  {item.status === "not_found" && (
                    <div style={{ padding: "4px 52px 8px", background: "#f3f4f6", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 11, color: "#6b7280" }}>Part number not recognised in TecDoc catalogue</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
