import React, { memo, useState } from "react";

const BUTTON_BASE = {
  padding: "13px 16px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
  transition: "all 0.2s ease"
};

const SMALL_BUTTON_STYLE = {
  ...BUTTON_BASE,
  background: "#b70017",
  color: "#fff",
  padding: "10px 14px",
  boxShadow: "0 0 16px rgba(183,0,23,0.24)"
};

const INPUT_STYLE = {
  width: "100%",
  padding: "14px 14px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#1a1d22",
  color: "#ffffff",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)"
};

const TEXTAREA_STYLE = {
  width: "100%",
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#1a1d22",
  color: "#ffffff",
  fontSize: 14,
  fontFamily: "monospace",
  outline: "none",
  resize: "vertical",
  boxSizing: "border-box",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)"
};

function primaryButtonStyle(disabled) {
  return {
    ...BUTTON_BASE,
    background: disabled ? "#4b5563" : "#b70017",
    color: "#fff",
    boxShadow: disabled ? "none" : "0 0 18px rgba(183,0,23,0.28), 0 8px 20px rgba(0,0,0,0.22)"
  };
}

const StatPill = memo(function StatPill({ value }) {
  return (
    <div
      style={{
        padding: "11px 16px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.18)",
        color: "#ffffff",
        fontSize: 13,
        fontWeight: 600,
        backdropFilter: "blur(6px)",
        boxShadow: "0 0 14px rgba(255,255,255,0.05)"
      }}
    >
      {value}
    </div>
  );
});

const Card = memo(function Card({ title, subtitle, children, centeredTitle = false, glow = false }) {
  return (
    <div
      style={{
        background: "#111317",
        borderRadius: 24,
        padding: 22,
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: glow
          ? "0 0 0 1px rgba(183,0,23,0.20), 0 0 26px rgba(183,0,23,0.14), 0 16px 36px rgba(0,0,0,0.30)"
          : "0 16px 36px rgba(0,0,0,0.28)"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: centeredTitle ? "center" : "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 18,
          textAlign: centeredTitle ? "center" : "left"
        }}
      >
        <div style={{ width: centeredTitle ? "100%" : "auto" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff" }}>{title}</div>
          {subtitle ? (
            <div
              style={{
                marginTop: 6,
                fontSize: 14,
                color: "#9ca3af",
                lineHeight: 1.55
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
});

const FieldLabel = memo(function FieldLabel({ children }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 13,
        fontWeight: 700,
        color: "#d1d5db",
        marginBottom: 8
      }}
    >
      {children}
    </label>
  );
});

const TextInput = memo(function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete="off"
      spellCheck={false}
      style={INPUT_STYLE}
    />
  );
});

const EditableTextarea = memo(function EditableTextarea({
  value,
  onChange,
  placeholder,
  minHeight = 220
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      spellCheck={false}
      style={{
        ...TEXTAREA_STYLE,
        minHeight
      }}
    />
  );
});

const ReadOnlyTextarea = memo(function ReadOnlyTextarea({ value, minHeight = 220 }) {
  return (
    <textarea
      value={value}
      readOnly
      spellCheck={false}
      style={{
        ...TEXTAREA_STYLE,
        minHeight,
        background: "#16191f"
      }}
    />
  );
});

const InfoBox = memo(function InfoBox({ title, children }) {
  return (
    <div
      style={{
        background: "#0f1115",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 20,
        padding: 16,
        boxShadow: "0 0 12px rgba(255,255,255,0.03)",
        alignSelf: "start"
      }}
    >
      <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
});

export default function App() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const [articleNumber, setArticleNumber] = useState("");
  const [batchInput, setBatchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const canLookup = articleNumber.trim().length > 0;
  const canBatchExport = batchInput.trim().length > 0;

  const handleLookup = async () => {
    if (!canLookup || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/lookup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ articleNumber: articleNumber.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Lookup failed");
      }

      setResult(data);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleBatchExport = async () => {
    if (!canBatchExport || batchLoading) return;

    setBatchLoading(true);
    setError("");

    try {
      const articleNumbers = batchInput
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean);

      const res = await fetch(`${API_URL}/batch-export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ articleNumbers })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Batch export failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "batch-listings.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBatchLoading(false);
    }
  };

  const copyText = async (value) => {
    await navigator.clipboard.writeText(value || "");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(183,0,23,0.12) 0%, rgba(11,13,16,1) 26%), linear-gradient(180deg, #0b0d10 0%, #111418 100%)",
        fontFamily: "Arial, sans-serif",
        padding: 24
      }}
    >
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #b70017 0%, #8e0012 100%)",
            color: "#fff",
            borderRadius: 32,
            padding: "34px 34px",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.08), 0 0 30px rgba(183,0,23,0.28), 0 22px 48px rgba(0,0,0,0.34)",
            marginBottom: 24,
            textAlign: "center"
          }}
        >
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.78)", marginBottom: 10 }}>
            JSK Listing Engine
          </div>

          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              letterSpacing: -1,
              marginBottom: 12,
              lineHeight: 1.05
            }}
          >
            Hello JSK Ecomm
          </div>

          <div
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.88)",
              maxWidth: 820,
              margin: "0 auto",
              lineHeight: 1.65
            }}
          >
            Generate structured listings, clean HTML descriptions and batch CSV exports from article numbers.
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: 20
            }}
          >
            <StatPill value="Live Single listing mode" />
            <StatPill value="Ready Batch CSV export" />
            <StatPill value="Enabled Preview panel" />
          </div>
        </div>

        {error ? (
          <div
            style={{
              background: "#1a1214",
              color: "#fecdd3",
              border: "1px solid rgba(183,0,23,0.45)",
              borderRadius: 20,
              padding: 16,
              marginBottom: 20,
              boxShadow: "0 0 20px rgba(183,0,23,0.14), 0 10px 22px rgba(0,0,0,0.22)"
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "420px 1fr",
            gap: 24,
            alignItems: "start"
          }}
        >
          <div style={{ display: "grid", gap: 24 }}>
            <Card
              title="Single Listing"
              subtitle="Generate one listing with title, HTML description, image and K numbers."
              centeredTitle={true}
            >
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <FieldLabel>Article Number</FieldLabel>
                  <TextInput
                    value={articleNumber}
                    onChange={(e) => setArticleNumber(e.target.value)}
                    placeholder="e.g. AOP858"
                  />
                </div>

                <button
                  onClick={handleLookup}
                  disabled={loading || !canLookup}
                  style={primaryButtonStyle(loading || !canLookup)}
                >
                  {loading ? "Generating..." : "Lookup & Generate"}
                </button>
              </div>
            </Card>

            <Card
              title="Batch CSV Export"
              subtitle="Paste multiple article numbers, one per line, and export a CSV."
              centeredTitle={true}
            >
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <FieldLabel>Article Numbers</FieldLabel>
                  <EditableTextarea
                    value={batchInput}
                    onChange={(e) => setBatchInput(e.target.value)}
                    placeholder={`AOP858\nTCK200\nABC123`}
                    minHeight={220}
                  />
                </div>

                <button
                  onClick={handleBatchExport}
                  disabled={batchLoading || !canBatchExport}
                  style={primaryButtonStyle(batchLoading || !canBatchExport)}
                >
                  {batchLoading ? "Generating CSV..." : "Generate Batch CSV"}
                </button>
              </div>
            </Card>
          </div>

          <div style={{ display: "grid", gap: 24 }}>
            <Card
              title="Output"
              subtitle="Generated listing content and live preview."
              centeredTitle={true}
              glow={!!result}
            >
              {!result ? (
                <div
                  style={{
                    minHeight: 420,
                    display: "grid",
                    placeItems: "center",
                    background: "#0f1115",
                    border: "1px dashed rgba(255,255,255,0.12)",
                    borderRadius: 20,
                    color: "#9ca3af",
                    fontSize: 15
                  }}
                >
                  No listing generated yet.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 20 }}>
                  <InfoBox title="Product Image">
                    {result.article_image ? (
                      <div
                        style={{
                          background: "#16191f",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 18,
                          padding: 16,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          minHeight: 260
                        }}
                      >
                        <img
                          src={result.article_image}
                          alt={result.generated_title || "Product"}
                          style={{
                            maxWidth: "100%",
                            maxHeight: 320,
                            objectFit: "contain",
                            borderRadius: 12
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          minHeight: 180,
                          display: "grid",
                          placeItems: "center",
                          background: "#16191f",
                          border: "1px dashed rgba(255,255,255,0.12)",
                          borderRadius: 18,
                          color: "#9ca3af",
                          fontSize: 14
                        }}
                      >
                        No image found.
                      </div>
                    )}
                  </InfoBox>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                      alignItems: "start"
                    }}
                  >
                    <InfoBox title="Generated Title">
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", lineHeight: 1.5 }}>
                        {result.generated_title || "—"}
                      </div>
                      <button
                        onClick={() => copyText(result.generated_title)}
                        style={{ ...SMALL_BUTTON_STYLE, marginTop: 12 }}
                      >
                        Copy Title
                      </button>
                    </InfoBox>

                    <InfoBox title="K Numbers">
                      <div style={{ fontSize: 14, color: "#ffffff", lineHeight: 1.6, wordBreak: "break-word" }}>
                        {(result.k_number_list || []).join(", ") || "—"}
                      </div>
                      <button
                        onClick={() => copyText((result.k_number_list || []).join(", "))}
                        style={{ ...SMALL_BUTTON_STYLE, marginTop: 12 }}
                      >
                        Copy K Numbers
                      </button>
                    </InfoBox>
                  </div>

                  <InfoBox title="Generated HTML">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginBottom: 10
                      }}
                    >
                      <button
                        onClick={() => copyText(result.generated_html)}
                        style={SMALL_BUTTON_STYLE}
                      >
                        Copy HTML
                      </button>
                    </div>

                    <ReadOnlyTextarea
                      value={result.generated_html || ""}
                      minHeight={220}
                    />
                  </InfoBox>

                  <InfoBox title="Live Preview">
                    <div
                      style={{
                        background: "#ffffff",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 18,
                        padding: 18,
                        overflowX: "auto",
                        boxShadow: "0 0 16px rgba(183,0,23,0.08)"
                      }}
                      dangerouslySetInnerHTML={{ __html: result.generated_html || "" }}
                    />
                  </InfoBox>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
