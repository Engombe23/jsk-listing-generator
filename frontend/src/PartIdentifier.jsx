import { useState, useRef, useCallback } from "react";
import { useSession } from "./context/SessionContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function ConfidenceBadge({ score }) {
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#d97706" : "#64748b";
  const bg    = score >= 70 ? "rgba(22,163,74,0.1)" : score >= 40 ? "rgba(217,119,6,0.1)" : "rgba(100,116,139,0.1)";
  const label = score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: bg, border: `1px solid ${color}40`,
      borderRadius: 20, padding: "3px 10px",
      fontSize: 11, fontWeight: 700, color,
    }}>
      <svg width="7" height="7" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill={color}/></svg>
      {label} · {score}%
    </div>
  );
}

function BestMatchCard({ match, onSendToListing, onSendToPricing }) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "2px solid rgba(22,163,74,0.4)",
      borderRadius: 16, padding: "20px",
    }}>
      {/* Verified header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.3)",
          borderRadius: 20, padding: "4px 10px",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>Verified in TecDoc</span>
        </div>
        <ConfidenceBadge score={match.confidence} />
      </div>

      {/* Part info */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
        {match.thumbnail && (
          <img
            src={match.thumbnail}
            alt=""
            style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, flexShrink: 0, border: "1px solid var(--border)" }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {match.productType && (
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
              {match.productType}
            </div>
          )}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 8 }}>
            {match.articleNumber && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Article No.</div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--text)" }}>{match.articleNumber}</div>
              </div>
            )}
            {match.oemNumber && match.oemNumber !== match.articleNumber && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>OEM No.</div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--text)" }}>{match.oemNumber}</div>
              </div>
            )}
            {match.brand && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Brand</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{match.brand}</div>
              </div>
            )}
          </div>
          {match.title && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.45, marginBottom: 2 }}>{match.title}</div>
          )}
          {match.thumbnailSource && (
            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>via {match.thumbnailSource}</div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: 14 }}>
        <button
          onClick={() => onSendToListing({ articleNumber: match.articleNumber || match.candidateNumber })}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "8px 16px", borderRadius: 8, border: "none",
            background: "var(--blue)", color: "#fff",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          Generate Listing
        </button>
        <button
          onClick={() => onSendToPricing({ query: match.oemNumber || match.articleNumber || match.candidateNumber })}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "8px 16px", borderRadius: 8,
            border: "1px solid var(--border)", background: "transparent",
            fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--text-muted)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2"/>
            <line x1="8" y1="6" x2="16" y2="6"/>
            <line x1="16" y1="10" x2="16" y2="18"/>
            <line x1="8" y1="14" x2="12" y2="14"/>
          </svg>
          Check Market Prices
        </button>
        {match.link && (
          <a
            href={match.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "8px 16px", borderRadius: 8,
              border: "1px solid var(--border)", background: "transparent",
              fontSize: 12, fontWeight: 600, color: "var(--text-muted)",
              textDecoration: "none", transition: "all 0.15s",
            }}
          >
            View Source ↗
          </a>
        )}
      </div>
    </div>
  );
}

function VisualMatchCard({ match }) {
  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border)",
      borderRadius: 10, padding: "10px 12px",
      display: "flex", gap: 10, alignItems: "center",
    }}>
      {match.thumbnail && (
        <img
          src={match.thumbnail}
          alt=""
          style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, flexShrink: 0, border: "1px solid var(--border)" }}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {match.title}
        </div>
        {match.source && (
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{match.source}</div>
        )}
      </div>
      {match.link && (
        <a
          href={match.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: "var(--text-dim)", flexShrink: 0, textDecoration: "none" }}
        >
          ↗
        </a>
      )}
    </div>
  );
}

export default function PartIdentifier({ onSendToListing, onSendToPricing }) {
  const { session } = useSession();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [results, setResults]   = useState(null);
  const [error, setError]       = useState("");
  const inputRef = useRef(null);

  const processFile = useCallback((f) => {
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("Only JPG, PNG, and WEBP images are supported.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("Image is too large. Maximum size is 10 MB.");
      return;
    }
    setFile(f);
    setError("");
    setResults(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
    e.target.value = "";
  };

  const handleIdentify = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${API_URL}/api/part-identifier/identify`, {
        method: "POST",
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Identification failed.");
      setResults(data);
    } catch (err) {
      setError(err.message || "Identification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResults(null);
    setError("");
  };

  const hasResults = results && !loading;
  const hasBestMatch = hasResults && !!results.bestMatch;
  const hasOtherMatches = hasResults && results.otherMatches?.length > 0;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: -0.5 }}>
            Part Identifier
          </h1>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
            background: "rgba(19,93,255,0.12)", color: "var(--blue)",
            border: "1px solid rgba(19,93,255,0.25)", borderRadius: 6,
            padding: "3px 8px",
          }}>
            BETA
          </span>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
          Upload a photo of an automotive part to identify it and verify the part number against the TecDoc database.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>

        {/* ── Left: upload + results ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Drop zone */}
          {!preview && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "var(--blue)" : "var(--border-strong)"}`,
                borderRadius: 16, padding: "52px 24px", textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "var(--blue-bg)" : "var(--bg-surface)",
                transition: "all 0.15s",
              }}
            >
              <svg
                width="44" height="44" viewBox="0 0 24 24" fill="none"
                stroke={dragOver ? "var(--blue)" : "var(--border-strong)"}
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ display: "block", margin: "0 auto 16px" }}
              >
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                Drop a part photo here
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18 }}>
                or click to browse — JPG, PNG, WEBP up to 10 MB
              </div>
              <div style={{
                display: "inline-block", padding: "9px 22px", borderRadius: 10,
                background: "var(--blue)", color: "#fff",
                fontSize: 13, fontWeight: 700, pointerEvents: "none",
              }}>
                Choose Photo
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>
          )}

          {/* Preview + identify button */}
          {preview && (
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ position: "relative" }}>
                <img
                  src={preview}
                  alt="Part to identify"
                  style={{ width: "100%", maxHeight: 320, objectFit: "contain", display: "block", background: "var(--bg-surface2)", padding: 16, boxSizing: "border-box" }}
                />
                <button
                  onClick={reset}
                  title="Remove image"
                  style={{
                    position: "absolute", top: 10, right: 10,
                    width: 30, height: 30, borderRadius: "50%",
                    background: "rgba(0,0,0,0.5)", border: "none",
                    color: "#fff", fontSize: 16, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >×</button>
              </div>
              <div style={{ padding: "14px 16px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{file?.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{file ? `${(file.size / 1024).toFixed(0)} KB` : ""}</div>
                </div>
                <button
                  onClick={handleIdentify}
                  disabled={loading}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "10px 22px", borderRadius: 10, border: "none",
                    background: loading ? "var(--border)" : "var(--blue)",
                    color: loading ? "var(--text-muted)" : "#fff",
                    fontSize: 13, fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {loading ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ animation: "ogSpin 0.8s linear infinite" }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Identifying…
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      Identify Part
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              background: "var(--red-bg)", border: "1px solid rgba(220,38,38,0.22)",
              borderRadius: 10, padding: "12px 16px",
            }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--red)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 800 }}>!</div>
              <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.55 }}>
                <strong style={{ color: "var(--red)" }}>Error:</strong> {error}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "36px 24px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--border-blue)", borderTop: "3px solid var(--blue)", animation: "ogSpin 0.8s linear infinite" }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>Identifying part…</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Google Lens → product pages → TecDoc verification</div>
            </div>
          )}

          {/* Results */}
          {hasResults && (
            <div>
              {/* Results header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                  {hasBestMatch ? "Verified match found" : hasOtherMatches ? "No verified matches — visual results only" : "No matches found"}
                </div>
                {results.totalVisualMatches > 0 && (
                  <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
                    from {results.totalVisualMatches} visual matches
                  </span>
                )}
                <button
                  onClick={reset}
                  style={{
                    marginLeft: "auto", fontSize: 12, fontWeight: 600,
                    padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                    border: "1px solid var(--border)", background: "transparent",
                    color: "var(--text-muted)",
                  }}
                >
                  Try Another Photo
                </button>
              </div>

              {/* Best Matched Part */}
              {hasBestMatch && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 8 }}>
                    Best Matched Part
                  </div>
                  <BestMatchCard
                    match={results.bestMatch}
                    onSendToListing={onSendToListing}
                    onSendToPricing={onSendToPricing}
                  />
                </div>
              )}

              {/* Other visual matches */}
              {hasOtherMatches && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-dim)" }}>
                      {hasBestMatch ? "Other visual matches" : "Visual matches (unverified)"}
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: "var(--text-dim)",
                      background: "var(--bg-surface2)", border: "1px solid var(--border)",
                      borderRadius: 4, padding: "1px 6px",
                    }}>
                      Not verified · No listing actions available
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {results.otherMatches.map((match, i) => (
                      <VisualMatchCard key={i} match={match} />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!hasBestMatch && !hasOtherMatches && (
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "36px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
                    No part numbers could be identified from this image.<br/>
                    Try a clearer photo with the part number label visible.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: tips + disclaimer ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 12 }}>
              Tips for best results
            </div>
            {[
              { icon: "📸", text: "Photograph the part number label or stamped numbers directly" },
              { icon: "💡", text: "Good lighting helps — avoid shadows over text" },
              { icon: "🔍", text: "Zoom in on the label if possible" },
              { icon: "🖼️", text: "Clear background improves visual matching accuracy" },
              { icon: "✅", text: "Only verified TecDoc matches can be used for listings" },
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: i < 4 ? 9 : 0 }}>
                <span style={{ flexShrink: 0 }}>{tip.icon}</span>
                <span>{tip.text}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#d97706", marginBottom: 6 }}>⚠ Beta Feature</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
              Part identification uses Google Lens for visual matching and TecDoc for number verification. Only verified matches unlock listing and pricing actions. Always check the physical part before listing.
            </div>
          </div>

          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 12 }}>
              How it works
            </div>
            {[
              { step: "1", text: "Your photo is sent to Google Lens for visual search" },
              { step: "2", text: "Part numbers extracted from results are verified against TecDoc" },
              { step: "3", text: "Verified matches show product name, brand, and article number" },
              { step: "4", text: "Jump directly to Listing Generator or Price Calculator" },
            ].map((s) => (
              <div key={s.step} style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.45, marginBottom: s.step !== "4" ? 10 : 0 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                  background: "var(--blue-bg)", border: "1px solid rgba(19,93,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800, color: "var(--blue)",
                }}>
                  {s.step}
                </div>
                <span style={{ paddingTop: 2 }}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
