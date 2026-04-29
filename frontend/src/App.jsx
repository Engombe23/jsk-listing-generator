import React, { memo, useState, useRef } from "react";
import {
  BUTTON_BASE,
  SMALL_BUTTON_STYLE,
  primaryButtonStyle,
  StatPill,
  Card,
  FieldLabel,
  TextInput,
  EditableTextarea,
  ReadOnlyTextarea,
  InfoBox
} from "./shared.jsx";
import PriceCalculator from "./PriceCalculator.jsx";
import SavedProducts from "./SavedProducts.jsx";
import CompatibilityChecker from "./CompatibilityChecker.jsx";
import { useSavedProducts } from "./useSavedProducts.js";

export default function App() {
  const [page, setPage] = useState("listing");
  const { products, save, remove } = useSavedProducts();
  const loadProductRef = useRef(null);
  const [prefilledArticle, setPrefilledArticle] = useState("");

  const handleLoadProduct = (product) => {
    setPage("calculator");
    setTimeout(() => {
      if (loadProductRef.current) loadProductRef.current(product);
    }, 50);
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
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #b70017 0%, #8e0012 100%)",
            color: "#fff",
            borderRadius: 32,
            padding: "34px 34px",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.08), 0 0 30px rgba(183,0,23,0.28), 0 22px 48px rgba(0,0,0,0.34)",
            marginBottom: 16,
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
            Generate structured listings, clean HTML descriptions, batch CSV exports,
            and calculate selling prices with full eBay fee breakdowns.
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
            <StatPill value="Price & Margin Calculator" />
          </div>
        </div>

        {/* Page tabs */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 24,
            background: "#111317",
            borderRadius: 20,
            padding: 6,
            border: "1px solid rgba(255,255,255,0.08)"
          }}
        >
          {[
            { key: "listing", label: "Listing Generator" },
            { key: "calculator", label: "Price Calculator" },
            {
              key: "saved",
              label: `Saved Products${products.length ? ` (${products.length})` : ""}`
            },
            { key: "compatibility", label: "Compatibility Checker" }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPage(key)}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
                background: page === key ? "#b70017" : "transparent",
                color: page === key ? "#fff" : "#9ca3af",
                boxShadow:
                  page === key ? "0 0 16px rgba(183,0,23,0.28)" : "none",
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
          />
        )}
        {page === "calculator" && (
          <PriceCalculator
            onSave={save}
            onLoadHandled={(fn) => { loadProductRef.current = fn; }}
          />
        )}
        {page === "saved" && (
          <SavedProducts
            products={products}
            onDelete={remove}
            onLoad={handleLoadProduct}
          />
        )}
        {page === "compatibility" && (
          <CompatibilityChecker
            onSendToListing={({ articleNumber }) => {
              setPrefilledArticle(articleNumber || "");
              setPage("listing");
            }}
          />
        )}
      </div>
    </div>
  );
}

function ListingGenerator({ prefilledArticle, onPrefilledConsumed }) {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const [articleNumber, setArticleNumber] = useState(prefilledArticle || "");

  React.useEffect(() => {
    if (prefilledArticle) {
      setArticleNumber(prefilledArticle);
      if (onPrefilledConsumed) onPrefilledConsumed();
    }
  }, [prefilledArticle]);
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
    <>
      {error ? (
        <div
          style={{
            background: "#1a1214",
            color: "#fecdd3",
            border: "1px solid rgba(183,0,23,0.45)",
            borderRadius: 20,
            padding: 16,
            marginBottom: 20,
            boxShadow:
              "0 0 20px rgba(183,0,23,0.14), 0 10px 22px rgba(0,0,0,0.22)"
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
            centeredTitle
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
            centeredTitle
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
            centeredTitle
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
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#ffffff",
                        lineHeight: 1.5
                      }}
                    >
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
                    <div
                      style={{
                        fontSize: 14,
                        color: "#ffffff",
                        lineHeight: 1.6,
                        wordBreak: "break-word"
                      }}
                    >
                      {(result.k_number_list || []).join(", ") || "—"}
                    </div>
                    <button
                      onClick={() =>
                        copyText((result.k_number_list || []).join(", "))
                      }
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
                    dangerouslySetInnerHTML={{
                      __html: result.generated_html || ""
                    }}
                  />
                </InfoBox>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
