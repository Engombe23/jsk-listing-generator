import "dotenv/config";
import express from "express";
import cors from "cors";
import { Parser } from "json2csv";
import { buildHtml } from "./html-builder.js";
import { getTemplateById, THEME_LIST } from "./templates/index.js";
import { checkCompatibility } from "./compatibility/checker.js";
import {
  detectProductType, buildEbayQuery, detectUnitType, getConfidence,
  conditionOptions, EXCLUSION_REASONS,
} from "./ebay-filter-rules.js";
import OpenAI from "openai";

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "autodoc-parts-catalog.p.rapidapi.com";

const TYPE_ID           = "1";
const LANG_ID           = "4";
const COUNTRY_FILTER_ID = "63";

// ─── In-memory caches ─────────────────────────────────────────────────────────

// modelId → array of engine-type rows from /list-vehicles-types/{modelId}
const modelEngineCache = new Map();
// articleNumber → { normalized, articleId, articleImage }  (populated after first lookup)
const articleNormCache = new Map();

// ─── Shared helpers ───────────────────────────────────────────────────────────

function uniq(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatYearRange(start, end) {
  const fmt = (v) => (v ? String(v).slice(0, 7) : "Onwards");
  return `${fmt(start)} to ${end ? fmt(end) : "Onwards"}`;
}

function cleanNumber(value) {
  if (!value && value !== 0) return "";
  return String(value).replace(/\.0+$/, "");
}

function splitEngineCodes(value) {
  if (!value) return [];
  return String(value).split(/[,\n;/|]+/).map((s) => s.trim()).filter(Boolean);
}

function extractSpecLabel(spec) {
  return spec?.criteriaDescription || spec?.criteriaName || spec?.description || spec?.name || spec?.label || "";
}

function extractSpecValue(spec) {
  return spec?.formattedValue || spec?.criteriaValue || spec?.displayValue || spec?.value || spec?.valueText || "";
}

function apiHeaders(contentType = false) {
  const h = { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": RAPIDAPI_HOST };
  if (contentType) h["Content-Type"] = "application/x-www-form-urlencoded";
  return h;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchArticleDetails(articleNumber) {
  const url = `https://${RAPIDAPI_HOST}/api/articles/article-number-details`;
  const params = new URLSearchParams();
  params.append("typeId", TYPE_ID);
  params.append("langId", LANG_ID);
  params.append("countryFilterId", COUNTRY_FILTER_ID);
  params.append("articleNo", articleNumber);
  const res = await fetch(url, {
    method: "POST",
    headers: apiHeaders(true),
    body: params.toString()
  });
  if (!res.ok) throw new Error(`Failed to fetch article ${articleNumber}: ${res.status}`);
  return res.json();
}

async function fetchArticleMedia(articleId) {
  if (!articleId) return null;
  const url = `https://${RAPIDAPI_HOST}/api/articles/article-all-media-info`;
  const params = new URLSearchParams();
  params.append("langId", LANG_ID);
  params.append("articleId", String(articleId));
  try {
    const res = await fetch(url, { method: "POST", headers: apiHeaders(true), body: params.toString() });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}


// ─── OEM search helpers ───────────────────────────────────────────────────────
// Used when the user enters an OEM/reference number instead of a TecDoc article number.

async function searchArticleByOem(oemNumber) {
  const url = `https://${RAPIDAPI_HOST}/api/articles-oem/article-oem-search-no`;
  const params = new URLSearchParams();
  params.append("langId", LANG_ID);
  params.append("articleOemNo", oemNumber);
  try {
    const res = await fetch(url, { method: "POST", headers: apiHeaders(true), body: params.toString() });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function artlookupByOem(oemNumber) {
  const params = new URLSearchParams();
  params.append("langId", LANG_ID);
  params.append("articleNo", oemNumber);
  params.append("articleType", "OENumber");
  const url = `https://${RAPIDAPI_HOST}/api/artlookup/search-articles-by-article-no?${params.toString()}`;
  try {
    const res = await fetch(url, { method: "GET", headers: apiHeaders() });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// Resolve an input string to a full article-number-details response.
// Tries: direct article number → OEM search → artlookup OEM fallback.
// Returns { articleResponse, resolvedNumber } or throws.
async function resolveArticleResponse(input) {
  // 1. Direct article number
  let direct = null;
  try { direct = await fetchArticleDetails(input); } catch {}
  if (direct?.articles?.[0]) {
    return { articleResponse: direct, resolvedNumber: input };
  }

  // 2. OEM search (article-oem-search-no)
  const oemData = await searchArticleByOem(input);
  const oemArticles = Array.isArray(oemData)
    ? oemData
    : (oemData?.articles || oemData?.data || []);

  if (oemArticles.length > 0) {
    const best = oemArticles[0];
    const resolvedNo = best.articleNo || best.articleNumber || best.artNr || null;
    if (resolvedNo) {
      let detail = null;
      try { detail = await fetchArticleDetails(resolvedNo); } catch {}
      if (detail?.articles?.[0]) return { articleResponse: detail, resolvedNumber: resolvedNo };
    }
    // Use the OEM search result directly if detail fetch failed
    return { articleResponse: { articles: [best] }, resolvedNumber: resolvedNo || input };
  }

  // 3. Artlookup OEM fallback
  const lookupData = await artlookupByOem(input);
  const lookupArticles = Array.isArray(lookupData)
    ? lookupData
    : (lookupData?.articles || lookupData?.data || []);

  if (lookupArticles.length > 0) {
    const best = lookupArticles[0];
    const resolvedNo = best.articleNo || best.articleNumber || best.artNr || null;
    if (resolvedNo) {
      let detail = null;
      try { detail = await fetchArticleDetails(resolvedNo); } catch {}
      if (detail?.articles?.[0]) return { articleResponse: detail, resolvedNumber: resolvedNo };
    }
    return { articleResponse: { articles: [best] }, resolvedNumber: resolvedNo || input };
  }

  throw new Error(`No article found for "${input}" — try a TecDoc article number or OEM reference number`);
}

// ─── Model-series engine data (primary strategy) ─────────────────────────────
// Fetches ALL engine variants for a model series in one call.
// e.g. modelId for "Golf IV" returns every Golf IV variant with kW/HP/CC/engine codes.
// A part compatible with 100 vehicles typically spans only 8-15 unique model series,
// so this covers everything with far fewer calls than per-vehicle fetches.

async function fetchEngineTypesByModel(modelId) {
  const url = `https://${RAPIDAPI_HOST}/api/types/type-id/${TYPE_ID}/list-vehicles-types/${modelId}/lang-id/${LANG_ID}/country-filter-id/${COUNTRY_FILTER_ID}`;
  try {
    const res = await fetch(url, { method: "GET", headers: apiHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    const rows = data?.modelTypes || data?.vehicleTypes || data?.vehicles || data?.data || [];
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

// Match a compatibleCar entry to the best engine-type row from the model series.
// Priority: exact vehicleId → typeEngineName + date range → typeEngineName alone.
function findEngineMatch(car, engineRows) {
  if (!Array.isArray(engineRows) || engineRows.length === 0) return null;

  // 1. Exact vehicleId match
  const byId = engineRows.find(r => String(r.vehicleId) === String(car.vehicleId));
  if (byId) return byId;

  const carName  = String(car.typeEngineName  || "").trim().toLowerCase();
  const carStart = String(car.constructionIntervalStart || "");
  const carEnd   = String(car.constructionIntervalEnd   || "");

  // 2. typeEngineName + construction dates
  const byNameAndDate = engineRows.find(r =>
    String(r.typeEngineName || "").trim().toLowerCase() === carName &&
    String(r.constructionIntervalStart || "") === carStart &&
    String(r.constructionIntervalEnd   || "") === carEnd
  );
  if (byNameAndDate) return byNameAndDate;

  // 3. typeEngineName only
  return engineRows.find(r =>
    String(r.typeEngineName || "").trim().toLowerCase() === carName
  ) || null;
}

// Fetch engine data for all unique modelIds in a compatible-cars list.
// Results are cached in modelEngineCache (persists across requests).
async function fetchEngineDataByModelIds(cars) {
  const uniqueModelIds = uniq(cars.map(c => String(c.modelId)).filter(Boolean));
  const result = {};

  for (const modelId of uniqueModelIds) {
    if (modelEngineCache.has(modelId)) {
      result[modelId] = modelEngineCache.get(modelId);
    } else {
      const rows = await fetchEngineTypesByModel(modelId);
      modelEngineCache.set(modelId, rows);
      result[modelId] = rows;
      await sleep(300); // respect rate limits
    }
  }

  return result;
}

// ─── Image helper ─────────────────────────────────────────────────────────────

function extractFirstImageUrl(mediaResponse) {
  if (!mediaResponse) return "";
  const urls = [];
  const walk = (obj) => {
    if (!obj) return;
    if (typeof obj === "string") {
      if (obj.startsWith("http") && (obj.includes("img.tecalliance") || /\.(jpg|jpeg|png|webp)/i.test(obj))) {
        urls.push(obj);
      }
      return;
    }
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (typeof obj === "object") Object.values(obj).forEach(walk);
  };
  walk(mediaResponse);
  return urls[0] || "";
}

// ─── Normalize ────────────────────────────────────────────────────────────────

function normalizeTecdoc(articleResponse, engineDataByModelId) {
  const article = articleResponse?.articles?.[0];
  if (!article) throw new Error("No article found");

  const compatibility = article.compatibleCars || [];

  const rows = compatibility.map((car) => {
    // Look up the model-series engine list, then find the best match for this variant
    const engineRows = engineDataByModelId[String(car.modelId)] || [];
    const match      = findEngineMatch(car, engineRows);

    // Engine codes: matched engine row first, then any field on the car entry itself
    const rawCodes =
      match?.engCodes    ||
      match?.engineCodes ||
      match?.engineCode  ||
      car?.engCodes      ||
      car?.engineCodes   ||
      car?.engineCode    ||
      "";

    return {
      make:             car.manufacturerName || "",
      model:            car.modelName        || "",
      engine:           car.typeEngineName   || "",
      vehicle:          `${car.manufacturerName || ""} ${car.modelName || ""} ${car.typeEngineName || ""}`.trim(),
      production_years: formatYearRange(car.constructionIntervalStart, car.constructionIntervalEnd),
      kw:               cleanNumber(match?.powerKw      ?? car?.powerKw),
      hp:               cleanNumber(match?.powerPs      ?? car?.powerPs),
      cc:               cleanNumber(match?.capacityTech ?? car?.capacityTech),
      engine_codes:     uniq(splitEngineCodes(rawCodes)),
      k_number:         String(car.vehicleId || "")
    };
  });

  const specifications = uniq(
    (article.allSpecifications || [])
      .map((spec) => {
        const label = extractSpecLabel(spec);
        const value = extractSpecValue(spec)?.trim();
        if (!label || !value) return ""; // skip anything with missing label or empty value
        return `${label}: ${value}`;
      })
      .filter(Boolean)
  );

  // Structured item specifics (label + value objects) for the API response
  // Filter out specs with no value — TecDoc sometimes returns empty-string values
  // (e.g. "Standard Size [STD]: ") that add noise without useful information.
  const itemSpecifics = (article.allSpecifications || [])
    .map((spec) => ({
      label: extractSpecLabel(spec),
      value: extractSpecValue(spec)
    }))
    .filter((s) => s.label && s.value?.trim());

  return {
    product_name:     article.articleProductName || "",
    oem_numbers:      uniq((article.oemNo || []).map((o) => o.oemDisplayNo)),
    specifications,
    item_specifics:   itemSpecifics,
    compatibility_rows: rows,
    data_supplier_id: article.dataSupplierId || null
  };
}

// ─── Main listing builder (optimised) ────────────────────────────────────────

async function buildListingFromArticle(articleNumber, themeId = "clean-default") {
  const template = getTemplateById(themeId);

  // ── Cache hit: skip all data fetching, just rebuild HTML ──────────────────
  if (articleNormCache.has(articleNumber)) {
    const cached = articleNormCache.get(articleNumber);
    const html   = buildHtml(cached.normalized, template);
    return {
      ...cached.baseResult,
      generated_html: html,
      template_id:    template.id,
      template_name:  template.name
    };
  }

  // ── Resolve input → article (supports OEM numbers) ───────────────────────
  const { articleResponse, resolvedNumber } = await resolveArticleResponse(articleNumber);
  const article = articleResponse?.articles?.[0];
  if (!article) throw new Error(`No article found for "${articleNumber}"`);

  if (resolvedNumber !== articleNumber) {
    console.log(`[Listing] OEM "${articleNumber}" resolved to article "${resolvedNumber}"`);
  }

  const articleId      = article.articleId;
  const dataSupplierId = article.dataSupplierId || article.brandId || null;
  const cars           = article.compatibleCars || [];
  const oemNumbers     = uniq((article.oemNo || []).map((o) => o.oemDisplayNo).filter(Boolean));

  console.log(`[Listing] ${resolvedNumber}: ${cars.length} compatible vehicles in article response`);

  // ── Fetch engine data grouped by model series ─────────────────────────────
  // One call per unique modelId (e.g. "Golf IV") returns ALL engine variants for
  // that series — covers 100 compatible vehicles with ~10 calls instead of 100.
  const engineDataByModelId = await fetchEngineDataByModelIds(cars);
  const uniqueModelIds = Object.keys(engineDataByModelId);
  console.log(`[Listing] ${articleNumber}: fetched engine data for ${uniqueModelIds.length} model series`);

  // ── Normalize ─────────────────────────────────────────────────────────────
  const normalized = normalizeTecdoc(articleResponse, engineDataByModelId);
  const kNumbers    = uniq(normalized.compatibility_rows.map((r) => r.k_number));
  const engineCodes = uniq(normalized.compatibility_rows.flatMap((r) => r.engine_codes || []));

  // ── Media ─────────────────────────────────────────────────────────────────
  const mediaResponse = await fetchArticleMedia(articleId);
  const articleImage  = extractFirstImageUrl(mediaResponse);

  // ── Build HTML ────────────────────────────────────────────────────────────
  const html = buildHtml({ ...normalized, engine_codes: engineCodes, k_numbers: kNumbers }, template);

  // ── Derive summary fields for AI title generation ─────────────────────────
  const modelCounts = {};
  normalized.compatibility_rows.forEach((r) => {
    const key = `${r.make} ${r.model}`.trim();
    if (key) modelCounts[key] = (modelCounts[key] || 0) + 1;
  });
  const topModels = Object.entries(modelCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => name);

  const allYears = normalized.compatibility_rows.flatMap((r) => {
    const matches = [...(r.production_years || "").matchAll(/\d{4}/g)];
    return matches.map((m) => parseInt(m[0]));
  }).filter((y) => y > 1900 && y < 2100);
  const yearRange = allYears.length > 0
    ? `${Math.min(...allYears)}-${Math.max(...allYears)}`
    : "";

  const engineSizes = uniq(
    normalized.compatibility_rows
      .filter((r) => r.cc && parseFloat(r.cc) > 0)
      .map((r) => `${(parseFloat(r.cc) / 1000).toFixed(1)}L`)
  );

  const fuelCounts = {};
  normalized.compatibility_rows.forEach((r) => {
    const e = (r.engine || "").toLowerCase();
    let fuel = null;
    if (/diesel|tdi|hdi|cdi|dci|tdci|crdi|\bd\b/.test(e)) fuel = "Diesel";
    else if (/petrol|tsi|tfsi|gdi|gsi|\bt\b/.test(e))      fuel = "Petrol";
    else if (/hybrid|phev/.test(e))                         fuel = "Hybrid";
    else if (/electric|ev/.test(e))                         fuel = "Electric";
    if (fuel) fuelCounts[fuel] = (fuelCounts[fuel] || 0) + 1;
  });
  const fuelType = Object.entries(fuelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

  const baseResult = {
    article_number:      articleNumber,
    article_id:          articleId,
    article_image:       articleImage,
    generated_title:     normalized.product_name,
    k_number_list:       kNumbers,
    oem_numbers:         normalized.oem_numbers,
    engine_codes:        engineCodes,
    specifications:      normalized.specifications,
    item_specifics:      normalized.item_specifics,
    compatibility_count: normalized.compatibility_rows.length,
    compatibility_rows:  normalized.compatibility_rows,
    product_type:        normalized.product_name,
    top_models:          topModels,
    year_range:          yearRange,
    engine_sizes:        engineSizes,
    fuel_type:           fuelType
  };

  // Cache by both the input key and the resolved article number (OEM searches benefit from this)
  const cachePayload = { normalized: { ...normalized, engine_codes: engineCodes, k_numbers: kNumbers }, baseResult, articleImage };
  articleNormCache.set(articleNumber, cachePayload);
  if (resolvedNumber !== articleNumber) articleNormCache.set(resolvedNumber, cachePayload);

  return {
    ...baseResult,
    generated_html: html,
    template_id:    template.id,
    template_name:  template.name
  };
}

// ─── Article search (OEM or article number → list of matching articles) ──────

async function searchArticles(input) {
  const found = [];
  const seenIds = new Set();

  // Extract brand name from a raw TecDoc article object — tries every known
  // field name variation returned by the autodoc-parts-catalog API.
  const extractBrand = (a) =>
    // supplierName = the parts manufacturer (e.g. "ELRING", "FAI AutoParts")
    // manufacturerName = the vehicle OEM (e.g. "BMW") — kept as last resort only
    a.supplierName     ||
    a.brandName        ||
    a.brand            ||
    a.mfrName          ||
    a.brandShortName   ||
    a.articleBrandName ||
    a.mfr_name         ||
    // Sometimes brand is a nested object
    (typeof a.brand === "object" ? a.brand?.brandName || a.brand?.name : "") ||
    // Sometimes it appears in the article criteria/specifications list
    (a.allSpecifications || a.articleCriteria || [])
      .map((s) => ({ l: (s.criteriaDescription || s.criteriaName || s.name || "").toLowerCase(), v: s.formattedValue || s.criteriaValue || s.value || "" }))
      .find((s) => s.l === "brand" || s.l === "supplier")?.v ||
    // manufacturerName is the vehicle OEM in OEM searches — only use as absolute fallback
    "";

  const absorb = (list) => {
    for (const a of list) {
      const key = String(a.articleId || a.id || a.articleNo || a.artNr || "").trim();
      if (!key || seenIds.has(key)) continue;
      seenIds.add(key);
      found.push({
        articleId:   a.articleId  || a.id          || null,
        articleNo:   a.articleNo  || a.articleNumber || a.artNr || null,
        brand:       extractBrand(a),
        productName: a.articleProductName || a.productName || a.description || "",
        oemNumbers:  uniq((a.oemNo || []).map((o) => o.oemDisplayNo || o).filter((x) => typeof x === "string")),
        imageUrl:    a.imageUrl || null
      });
    }
  };

  // 1. Direct article-number-details (catches TecDoc article numbers)
  try {
    const direct = await fetchArticleDetails(input);
    const arts = direct?.articles || [];
    if (arts.length > 0) { absorb(arts); return found; }
  } catch {}

  // 2. OEM search — article-oem-search-no
  const oemData = await searchArticleByOem(input);
  const oemList = Array.isArray(oemData) ? oemData : (oemData?.articles || oemData?.data || []);
  absorb(oemList);

  // 3. Artlookup OEM fallback
  if (found.length === 0) {
    const lookupData = await artlookupByOem(input);
    const lookupList = Array.isArray(lookupData) ? lookupData : (lookupData?.articles || lookupData?.data || []);
    absorb(lookupList);
  }

  const filtered = found.filter((a) => a.articleNo || a.articleId);

  // 4. Enrich missing brand names — OEM search endpoints don't always return
  //    brand info, so batch-fetch article details for up to 10 missing results.
  const missingBrand = filtered.filter((a) => !a.brand && a.articleNo).slice(0, 10);
  if (missingBrand.length > 0) {
    await Promise.all(missingBrand.map(async (a) => {
      try {
        const detail = await fetchArticleDetails(a.articleNo);
        const art = detail?.articles?.[0];
        if (art) {
          a.brand = extractBrand(art);
          if (!a.productName) {
            a.productName = art.articleProductName || art.productName || art.description || "";
          }
          if (!a.oemNumbers?.length) {
            a.oemNumbers = uniq((art.oemNo || []).map((o) => o.oemDisplayNo || o).filter((x) => typeof x === "string"));
          }
        }
      } catch {}
    }));
  }

  return filtered;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Return available themes (used by the frontend selector)
app.get("/themes", (_req, res) => {
  res.json(THEME_LIST);
});

// Search: OEM number or article number → list of candidate articles for selection
app.post("/search", async (req, res) => {
  try {
    const query = String(req.body.query || "").trim().replace(/\s+/g, "");
    if (!query) return res.status(400).json({ error: "Missing query" });
    const articles = await searchArticles(query);
    res.json({ query, articles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/lookup", async (req, res) => {
  try {
    const articleNumber = String(req.body.articleNumber || "").trim().replace(/\s+/g, "");
    const themeId       = req.body.themeId || req.body.templateId || "clean-default";

    if (!articleNumber) return res.status(400).json({ error: "Missing articleNumber" });

    const result = await buildListingFromArticle(articleNumber, themeId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/batch-export", async (req, res) => {
  try {
    const { rows, themeId = "clean-default", templateId } = req.body;
    const resolvedTheme = themeId || templateId || "clean-default";

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "rows must be a non-empty array" });
    }

    const cleanedRows = rows
      .map((row) => ({
        articleNumber: String(row.articleNumber || "").trim().replace(/\s+/g, ""),
        sku:           String(row.sku      || "").trim(),
        binPrice:      String(row.binPrice || "").trim()
      }))
      .filter((row) => row.articleNumber && row.sku && row.binPrice);

    if (cleanedRows.length === 0) {
      return res.status(400).json({ error: "No valid rows found" });
    }

    const exportRows = [];

    for (const row of cleanedRows) {
      try {
        console.log(`Batch processing ${row.articleNumber}...`);
        const result = await buildListingFromArticle(row.articleNumber, resolvedTheme);

        exportRows.push({
          "Title":                       result.generated_title || "",
          "SKU":                         row.sku,
          "BIN Price":                   row.binPrice,
          "Description":                 result.generated_html || "",
          "Custom Specifics 1 Name":     "Brand",
          "Custom Specifics 1 Value":    "JSK",
          "Custom Specifics 2 Name":     "Reference OE/OEM Number",
          "Custom Specifics 2 Value":    uniq(result.oem_numbers || []).join(", "),
          "Custom Specifics 3 Name":     "Manufacturer Part Number",
          "Custom Specifics 3 Value":    row.sku,
          "Custom Specifics 4 Name":     "Product Type",
          "Custom Specifics 4 Value":    result.product_type || "",
          "Custom Specifics 5 Name":     "Country of Manufacture",
          "Custom Specifics 5 Value":    "United Kingdom",
          "Custom Specifics 6 Name":     "Compatible Engine Codes",
          "Custom Specifics 6 Value":    uniq(result.engine_codes || []).join(", "),
          "Custom Specifics 7 Name":     "K Numbers",
          "Custom Specifics 7 Value":    uniq(result.k_number_list || []).join(", "),
          "Article Number":              row.articleNumber,
          "Template":                    result.template_name || "",
          "Error":                       ""
        });
      } catch (err) {
        exportRows.push({
          "Title": "", "SKU": row.sku, "BIN Price": row.binPrice,
          "Description": "",
          "Custom Specifics 1 Name": "Brand", "Custom Specifics 1 Value": "JSK",
          "Custom Specifics 2 Name": "Reference OE/OEM Number", "Custom Specifics 2 Value": "",
          "Custom Specifics 3 Name": "Manufacturer Part Number", "Custom Specifics 3 Value": row.sku,
          "Custom Specifics 4 Name": "Product Type", "Custom Specifics 4 Value": "",
          "Custom Specifics 5 Name": "Country of Manufacture", "Custom Specifics 5 Value": "United Kingdom",
          "Custom Specifics 6 Name": "Compatible Engine Codes", "Custom Specifics 6 Value": "",
          "Custom Specifics 7 Name": "K Numbers", "Custom Specifics 7 Value": "",
          "Article Number": row.articleNumber,
          "Template": "",
          "Error": err.message
        });
      }
    }

    const parser = new Parser({
      fields: [
        "Title", "SKU", "BIN Price", "Description",
        "Custom Specifics 1 Name", "Custom Specifics 1 Value",
        "Custom Specifics 2 Name", "Custom Specifics 2 Value",
        "Custom Specifics 3 Name", "Custom Specifics 3 Value",
        "Custom Specifics 4 Name", "Custom Specifics 4 Value",
        "Custom Specifics 5 Name", "Custom Specifics 5 Value",
        "Custom Specifics 6 Name", "Custom Specifics 6 Value",
        "Custom Specifics 7 Name", "Custom Specifics 7 Value",
        "Article Number", "Template", "Error"
      ]
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="adlister-batch-export.csv"');
    res.send(parser.parse(exportRows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/compatibility/check", async (req, res) => {
  try {
    const {
      vin, oemNumber, partType, engineCode,
      make, model, year, fuelType, engineSize,
      selectedVehicleId
    } = req.body;

    console.log(`[/compatibility/check] vin=${vin || "-"} oem=${oemNumber || "-"} selectedVehicleId=${selectedVehicleId || "-"}`);

    if (!oemNumber) return res.status(400).json({ error: "oemNumber is required" });

    // selectedVehicleId is set when the user has chosen a vehicle from the
    // manual_vehicle_selection_required step — in that case we don't need
    // the other vehicle fields up-front.
    if (!selectedVehicleId && !vin && !make && !model && !year) {
      return res.status(400).json({ error: "Provide a VIN, or at least Make + Model + Year" });
    }

    const result = await checkCompatibility({
      vin, oemNumber, partType, engineCode,
      make, model, year, fuelType, engineSize,
      selectedVehicleId
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── AI Title Generation ──────────────────────────────────────────────────────
// POST /api/ai/generate-titles
// Calls OpenAI to produce 3 eBay-style listing titles from structured part data.

app.post("/api/ai/generate-titles", async (req, res) => {
  if (!openaiClient) {
    return res.status(503).json({ error: "OpenAI API key is not configured." });
  }

  const {
    productType  = "",
    brand        = "",
    oemNumbers   = [],
    topModels    = [],
    engineCodes  = [],
    engineSizes  = [],
    fuelType     = "",
    yearRange    = "",
    maxTitleLength = 80
  } = req.body;

  if (!productType) {
    return res.status(400).json({ error: "productType is required" });
  }

  // Strip "L" suffix from engine sizes — display as "2.5", "3.0" not "2.5L"
  const cleanEngSizes = engineSizes.map((s) => s.replace(/L$/i, "")).slice(0, 4);

  const prompt = `You are an expert eBay automotive parts listing writer specialising in UK automotive parts.

Generate exactly 3 listing titles using the templates and rules below.

═══ GLOBAL RULES ═══
- MINIMUM 70 characters, MAXIMUM 80 characters. Titles under 70 characters are not acceptable.
- To reach 70–80 characters: add more models, additional engine codes, extra engine sizes, or extend the year range until you hit the target. If still short, add the next most relevant model or engine code from the data.
- Never exceed 80 characters. Never cut off mid-word.
- Count characters carefully before finalising each title.
- Use only the data provided — never invent OEM numbers, models, engine codes, years or fitment.
- Engine sizes are numbers only, no unit: "2.5" not "2.5L"
- Engine size always immediately follows the make: "ISUZU 2.5 3.0 D-Max" not "ISUZU D-Max 2.5 3.0"
- Multiple engine sizes listed together: "2.5 3.0"
- Do NOT include fuel type
- Prioritise the most popular and commonly searched models; favour the most common engine codes when many exist
- Product name abbreviations are allowed only when widely recognised: "Conrod" for "Connecting Rod" is fine; do NOT shorten "Crankshaft" to "Crank"
- Prioritise high-value keywords first; trim lowest-value words only if exceeding 80

═══ TEMPLATES ═══

Style 1 — engine_code_model_hybrid
Template: [engine codes] [part name] For [MAKE] [engine sizes] [model(s)] [years]
Example:  4JK1 4JJ1 Connecting Rod For ISUZU 2.5 3.0 D-Max Rodeo 2006-2018

Style 2 — vehicle_model_focused
Template: [part name] For [MAKE] [engine sizes] [model(s)] [OEM number(s)]
Example:  Conrod For ISUZU 2.5 3.0 D-Max Rodeo 8973577163 89738892151

Style 3 — oem_focused
Template: [engine codes] [part name] For [MAKE] [engine sizes] [model(s)] [years] [OEM]
Example:  4JK1 4JJ1 Conrod For ISUZU 2.5 3.0 D-Max Rodeo 2006-2018 89738892151

═══ PART DATA ═══
- Product type: ${productType}
- OEM numbers: ${oemNumbers.slice(0, 4).join(" ") || "none"}
- Compatible models (most common first): ${topModels.slice(0, 6).join(", ") || "various"}
- Engine codes: ${engineCodes.slice(0, 6).join(" ") || ""}
- Engine sizes: ${cleanEngSizes.join(" ") || ""}
- Year range: ${yearRange || ""}

Respond with valid JSON only, no markdown:
{
  "titles": [
    { "style": "engine_code_model_hybrid", "title": "...", "characterCount": 0 },
    { "style": "vehicle_model_focused",    "title": "...", "characterCount": 0 },
    { "style": "oem_focused",              "title": "...", "characterCount": 0 }
  ],
  "warnings": []
}`;

  try {
    const completion = await openaiClient.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: "AI returned invalid JSON." });
    }

    // Hard-enforce 80-char limit and recalculate character counts server-side
    if (Array.isArray(parsed.titles)) {
      parsed.titles = parsed.titles.map((t) => {
        let title = (t.title || "").trim();
        if (title.length > 80) {
          // Trim to last complete word at or under 80 chars
          title = title.slice(0, 80).replace(/\s+\S*$/, "").trim();
        }
        return { ...t, title, characterCount: title.length };
      });
    }

    res.json(parsed);
  } catch (err) {
    console.error("[/api/ai/generate-titles]", err.message);
    res.status(500).json({ error: "AI title generation failed. Please try again." });
  }
});

// ─── OEM query detection ──────────────────────────────────────────────────────
// A query is treated as OEM/part-number if it contains NO descriptive English
// word (≥5 consecutive letters with no digits).  Matches:
//   LR110501R  95517856  BK3Q6A270  03L103373
// Does NOT match:
//   "M274 Cylinder Head"  "N47 Timing Chain Kit"  "Jaguar Oil Pump"
function isOemQuery(query) {
  const tokens = query.trim().split(/\s+/);
  const hasDescriptiveWord = tokens.some(t => /^[a-zA-Z]{5,}$/.test(t));
  if (hasDescriptiveWord) return false;
  const stripped = query.replace(/[\s\-\.]/g, '');
  return stripped.length >= 4 && /^[A-Z0-9]+$/i.test(stripped);
}

// ─── Market-group clustering helpers ─────────────────────────────────────────

const GROUP_STOP_WORDS = new Set([
  'for','and','the','with','new','used','oem','ref','fits','compatible','genuine',
  'aftermarket','free','delivery','shipping','quality','part','parts','number',
  'pair','assy','original','brand','stock','item','great','fast','high','from',
  'this','that','also','only','have','been','will','your','sale',
]);

// Tokenise a listing title into normalised searchable tokens
function titleTokens(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3 && !GROUP_STOP_WORDS.has(t));
}

// Derive a human-readable label for a cluster from its most common title tokens
function extractGroupLabel(items) {
  const freq = {};
  for (const item of items) {
    const seen = new Set(titleTokens(item.title));
    for (const t of seen) freq[t] = (freq[t] || 0) + 1;
  }
  const n = items.length;
  const top = Object.entries(freq)
    .filter(([, c]) => c >= Math.max(1, n * 0.35))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([t]) => t.charAt(0).toUpperCase() + t.slice(1));
  if (top.length > 0) return top.join(' / ');
  // Fallback: price range
  const prices = items.map(i => i.price).sort((a, b) => a - b);
  return `£${Math.round(prices[0])} – £${Math.round(prices[prices.length - 1])}`;
}

// Split a list of enriched items (must have .price) into price-gap clusters.
// A cluster boundary forms wherever the price ratio between adjacent sorted items ≥ 2.0
// (i.e. the next item costs at least twice as much as the previous one).
function clusterByPrice(items) {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => a.price - b.price);
  const prices = sorted.map(i => i.price);
  const clusters = [];
  let start = 0;
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] / prices[i - 1] >= 2.0) {
      clusters.push(sorted.slice(start, i));
      start = i;
    }
  }
  clusters.push(sorted.slice(start));
  return clusters;
}

// Build the full stats + listings object for one cluster.
// Applies IQR filtering within the cluster; if IQR removes everything, falls back
// to the unfiltered cluster so the group is never empty.
function computeGroupStats(items, currency, condition, condLabel, totalFetched) {
  if (!items || items.length === 0) return null;

  const prices = items.map(i => i.price).sort((a, b) => a - b);
  const iqrMedian = calcMedian(prices);
  const iqrQ1     = calcPercentile(prices, 0.25);
  const iqrQ3     = calcPercentile(prices, 0.75);
  const iqrVal    = iqrQ3 - iqrQ1;
  const lowerBound = iqrQ1 - 1.0 * iqrVal;
  const upperBound = Math.min(iqrQ3 + 1.0 * iqrVal, iqrMedian * 2.2);

  let relevant = items.filter(i => i.price >= lowerBound && i.price <= upperBound);
  const iqrOutlierCount = items.length - relevant.length;
  if (relevant.length === 0) relevant = items; // safety: never empty

  const fp = relevant.map(i => i.price).sort((a, b) => a - b);
  const n  = fp.length;
  const confidence = getConfidence(n);

  const listingShape = i => ({
    title: i.title, price: i.price, url: i.url, image: i.image,
    condition: i.condition, sellerName: i.sellerName,
    sellerFeedback: i.sellerFeedback, sellerFeedbackPct: i.sellerFeedbackPct,
    shippingCost: i.shippingCost, shippingType: i.shippingType,
    itemDate: i.itemDate,
  });

  return {
    low:     +fp[0].toFixed(2),
    high:    +fp[n - 1].toFixed(2),
    average: +(fp.reduce((s, v) => s + v, 0) / n).toFixed(2),
    median:  +calcMedian(fp).toFixed(2),
    currency, condition, conditionLabel: condLabel,
    priceCount:       n,
    relevantCount:    n,
    totalFetched,
    excludedByFilter: 0, excludedAsSetKit: 0,
    excludedHighOutlier: 0, excludedLowOutlier: 0,
    totalExcluded:    iqrOutlierCount,
    detectedType:     null,
    filterApplied:    false,
    unitSensitive:    false,
    confidenceLevel:  confidence.level,
    confidenceLabel:  confidence.label,
    confidenceColor:  confidence.color,
    iqrLowerBound:    +lowerBound.toFixed(2),
    iqrUpperBound:    +upperBound.toFixed(2),
    iqrOutlierCount,
    listings:         relevant.map(listingShape),
    excludedListings: [],
  };
}

// ─── Median helper ────────────────────────────────────────────────────────────
function calcMedian(sortedArr) {
  const n = sortedArr.length;
  if (n === 0) return null;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sortedArr[mid - 1] + sortedArr[mid]) / 2 : sortedArr[mid];
}

// Linear-interpolation percentile on a pre-sorted array (p = 0–1)
function calcPercentile(sortedArr, p) {
  const n = sortedArr.length;
  if (n === 0) return null;
  if (n === 1) return sortedArr[0];
  const idx  = p * (n - 1);
  const lo   = Math.floor(idx);
  const hi   = Math.ceil(idx);
  const frac = idx - lo;
  return sortedArr[lo] + frac * (sortedArr[hi] - sortedArr[lo]);
}

// ─── eBay OAuth token cache ───────────────────────────────────────────────────

let _ebayToken    = null;
let _ebayTokenExp = 0;

async function getEbayAccessToken() {
  const now = Date.now();
  if (_ebayToken && now < _ebayTokenExp - 60_000) return _ebayToken;

  const clientId     = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("eBay credentials not configured (EBAY_CLIENT_ID / EBAY_CLIENT_SECRET).");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization:  `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope"
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay OAuth failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data   = await res.json();
  _ebayToken    = data.access_token;
  _ebayTokenExp = now + (data.expires_in || 7200) * 1000;
  console.log(`[eBay] New access token cached, expires in ${data.expires_in}s`);
  return _ebayToken;
}

// ─── eBay Smart Pricing ───────────────────────────────────────────────────────
// POST /api/ebay/search-prices
// Fetches first page of active eBay UK listings and returns price statistics.
//
// Future extension points (not implemented yet):
//   - sold listings mode    (completedItems=true filter)
//   - condition filtering   (conditionIds param)
//   - category filtering    (category_ids param)
//   - exclude auctions      (buyingOptions=FIXED_PRICE filter)
//   - exclude sponsored     (not directly available via Browse API)
//   - AI pricing suggestion (pass stats + costs to OpenAI)

// ─── eBay Smart Pricing ───────────────────────────────────────────────────────
// POST /api/ebay/search-prices
//
// Full pipeline:
//   1. Resolve condition → eBay filter string
//   2. Detect product type from query; build eBay query with neg-keyword hints
//   3. Fetch top 25 listings for the selected condition
//   4. Title filter  (requiredAny + exclude per product rule)
//   5. Unit filter   (sets/kits/bundles removed for unit-sensitive types)
//   6. Initial median from surviving price-valid items
//   7. Multiplier outlier filter  (per-rule high/low thresholds)
//   8. Recalculate final stats from clean set
//   9. Return enriched response with per-reason exclusion counts
app.post("/api/ebay/search-prices", async (req, res) => {
  try {
    const { query, condition = "new" } = req.body;
    if (!query?.trim()) {
      return res.status(400).json({ error: "query is required" });
    }

    // ── Step 1: Resolve condition ─────────────────────────────────────────────
    const condOpt    = conditionOptions.find(c => c.key === condition);
    const condFilter = condOpt?.ebayFilter || null;
    const condLabel  = condOpt?.label      || condition;

    // ── Step 2: Detect product type + build filtered eBay query ───────────────
    const rule       = detectProductType(query.trim());
    const ebayQuery  = buildEbayQuery(query.trim(), rule);
    const searchIsOem = isOemQuery(query.trim());

    // ── Step 3: Fetch top 60 listings ─────────────────────────────────────────
    const token = await getEbayAccessToken();
    let url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(ebayQuery)}&limit=60&offset=0&fieldgroups=EXTENDED`;
    if (condFilter) url += `&filter=${condFilter}`;

    const ebayRes = await fetch(url, {
      headers: {
        Authorization:             `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_GB",
        "Content-Type":            "application/json",
      },
    });

    if (!ebayRes.ok) {
      const text = await ebayRes.text();
      throw new Error(`eBay search failed (${ebayRes.status}): ${text.slice(0, 300)}`);
    }

    const data         = await ebayRes.json();
    const rawItems     = data.itemSummaries || [];
    const totalFetched = rawItems.length;
    const currency     = rawItems.find(i => i.price?.currency)?.price?.currency || "GBP";

    // ── Step 4: Enrich items ──────────────────────────────────────────────────
    const enriched = rawItems.map(item => {
      const v           = parseFloat(item.price?.value);
      const shippingOpt = item.shippingOptions?.[0];
      const shippingVal = parseFloat(shippingOpt?.shippingCost?.value);
      return {
        title:             item.title || "",
        price:             Number.isFinite(v) && v > 0 ? v : null,
        url:               item.itemWebUrl || "",
        image:             item.image?.imageUrl || null,
        condition:         item.condition || "",
        sellerName:        item.seller?.username || "",
        sellerFeedback:    item.seller?.feedbackScore      != null ? Number(item.seller.feedbackScore)            : null,
        sellerFeedbackPct: item.seller?.feedbackPercentage != null ? parseFloat(item.seller.feedbackPercentage)   : null,
        shippingCost:      Number.isFinite(shippingVal) ? shippingVal : null,
        shippingType:      shippingOpt?.shippingType || null,
        itemDate:          item.itemCreationDate || null,
      };
    });

    const priceValid = enriched.filter(i => i.price !== null);

    // ── Shared empty-result helper ────────────────────────────────────────────
    const emptyResult = (extraMsg) => {
      const zeroResultsMsg = extraMsg
        || (rule
          ? `No relevant ${rule.productType} ${condLabel.toLowerCase()} listings found after filtering ${totalFetched} results. Try a different search term.`
          : `No ${condLabel.toLowerCase()} listings found for this search — try a different search term.`);
      return {
        low: null, high: null, average: null, median: null,
        currency, condition, conditionLabel: condLabel,
        priceCount: 0, totalFetched, relevantCount: 0,
        excludedByFilter: 0, excludedAsSetKit: 0,
        excludedHighOutlier: 0, excludedLowOutlier: 0, totalExcluded: 0,
        detectedType:    rule?.productType || null,
        filterApplied:   rule !== null,
        unitSensitive:   rule?.unitSensitive ?? false,
        confidenceLevel: "low", confidenceLabel: "Low", confidenceColor: "#ef4444",
        zeroResultsMsg,
        iqrLowerBound: null, iqrUpperBound: null, iqrOutlierCount: 0,
        listings: [], excludedListings: [],
      };
    };

    // ═════════════════════════════════════════════════════════════════════════
    // OEM FLOW — fast path, light IQR only, no grouping
    // ═════════════════════════════════════════════════════════════════════════
    if (searchIsOem) {
      if (priceValid.length === 0) {
        return res.json({ ...emptyResult(), searchType: "oem" });
      }

      const allSorted  = priceValid.map(i => i.price).sort((a, b) => a - b);
      const iqrMedian  = calcMedian(allSorted);
      const iqrQ1      = calcPercentile(allSorted, 0.25);
      const iqrQ3      = calcPercentile(allSorted, 0.75);
      const iqrVal     = iqrQ3 - iqrQ1;
      const lowerBound = iqrQ1 - 1.0 * iqrVal;
      const upperBound = Math.min(iqrQ3 + 1.0 * iqrVal, iqrMedian * 2.2);

      const relevantItems   = priceValid.filter(i => i.price >= lowerBound && i.price <= upperBound);
      const highExcluded    = priceValid.filter(i => i.price > upperBound);
      const lowExcluded     = priceValid.filter(i => i.price < lowerBound);
      const totalExcluded   = highExcluded.length + lowExcluded.length;

      if (relevantItems.length === 0) {
        return res.json({ ...emptyResult(), searchType: "oem" });
      }

      const fp  = relevantItems.map(i => i.price).sort((a, b) => a - b);
      const n   = fp.length;
      const conf = getConfidence(n);

      console.log(`[eBay OEM] "${query}" | ${condLabel} | fetched=${totalFetched} used=${n} outliers=${totalExcluded}`);

      return res.json({
        searchType: "oem",
        low:     +fp[0].toFixed(2),
        high:    +fp[n - 1].toFixed(2),
        average: +(fp.reduce((s, v) => s + v, 0) / n).toFixed(2),
        median:  +calcMedian(fp).toFixed(2),
        currency, condition, conditionLabel: condLabel,
        priceCount: n, totalFetched, relevantCount: n,
        excludedByFilter: 0, excludedAsSetKit: 0,
        excludedHighOutlier: highExcluded.length,
        excludedLowOutlier:  lowExcluded.length,
        totalExcluded,
        detectedType:    rule?.productType || null,
        filterApplied:   rule !== null,
        unitSensitive:   rule?.unitSensitive ?? false,
        confidenceLevel: conf.level, confidenceLabel: conf.label, confidenceColor: conf.color,
        iqrLowerBound:   +lowerBound.toFixed(2),
        iqrUpperBound:   +upperBound.toFixed(2),
        iqrOutlierCount: totalExcluded,
        listings: relevantItems.map(i => ({
          title: i.title, price: i.price, url: i.url, image: i.image,
          condition: i.condition, sellerName: i.sellerName,
          sellerFeedback: i.sellerFeedback, sellerFeedbackPct: i.sellerFeedbackPct,
          shippingCost: i.shippingCost, shippingType: i.shippingType, itemDate: i.itemDate,
        })),
        excludedListings: [
          ...highExcluded.map(i => ({ title: i.title, price: i.price, url: i.url, exclusionReason: "IQR upper outlier" })),
          ...lowExcluded.map(i  => ({ title: i.title, price: i.price, url: i.url, exclusionReason: "IQR lower outlier" })),
        ],
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // KEYWORD FLOW — cluster by price, then auto-select or prompt user
    // ═════════════════════════════════════════════════════════════════════════
    if (priceValid.length === 0) {
      return res.json({ ...emptyResult(), searchType: "keyword" });
    }

    const clusters    = clusterByPrice(priceValid);
    const totalValid  = priceValid.length;

    // Find a dominant cluster (≥85% of all listings, or only 1 cluster)
    const dominantIdx = clusters.length === 1
      ? 0
      : clusters.findIndex(c => c.length / totalValid >= 0.85);

    if (dominantIdx !== -1) {
      // ── Auto-select: IQR on dominant cluster, return normal response ─────
      const stats = computeGroupStats(
        clusters[dominantIdx], currency, condition, condLabel, totalFetched
      );

      if (!stats || stats.priceCount === 0) {
        return res.json({ ...emptyResult(), searchType: "keyword" });
      }

      const groups = clusters.map((c, idx) => ({
        id:           idx,
        label:        extractGroupLabel(c),
        count:        c.length,
        minPrice:     +Math.min(...c.map(i => i.price)).toFixed(2),
        maxPrice:     +Math.max(...c.map(i => i.price)).toFixed(2),
        autoSelected: idx === dominantIdx,
      }));

      console.log(
        `[eBay keyword] "${query}" | ${clusters.length} cluster(s), auto-selected #${dominantIdx} ` +
        `(${clusters[dominantIdx].length}/${totalValid} items)`
      );

      return res.json({
        ...stats,
        searchType:             "keyword",
        requiresGroupSelection: false,
        autoSelectedGroupIndex: dominantIdx,
        groups,
      });
    }

    // ── Multiple significant groups → return for user selection ─────────────
    const groups = clusters.map((c, idx) => {
      const s = computeGroupStats(c, currency, condition, condLabel, totalFetched);
      return {
        id:          idx,
        label:       extractGroupLabel(c),
        rawCount:    c.length,
        count:       s ? s.priceCount  : c.length,
        minPrice:    s ? s.low         : +Math.min(...c.map(i => i.price)).toFixed(2),
        maxPrice:    s ? s.high        : +Math.max(...c.map(i => i.price)).toFixed(2),
        medianPrice: s ? s.median      : null,
        stats:       s || null,   // full stats object for immediate use after selection
      };
    }).sort((a, b) => b.count - a.count); // largest group first

    console.log(
      `[eBay keyword] "${query}" | ${groups.length} groups detected: ` +
      groups.map(g => `"${g.label}" (${g.count} @ £${g.minPrice}–£${g.maxPrice})`).join(' | ')
    );

    return res.json({
      searchType:             "keyword",
      requiresGroupSelection: true,
      autoSelectedGroupIndex: null,
      groups,
      // Minimal envelope — frontend checks requiresGroupSelection before priceCount
      low: null, high: null, average: null, median: null,
      currency, condition, conditionLabel: condLabel,
      priceCount: 0, totalFetched,
      listings: [], excludedListings: [],
    });

  } catch (err) {
    console.error("[/api/ebay/search-prices]", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`OpenAI configured: ${openaiClient ? "YES" : "NO — OPENAI_API_KEY is missing"}`);
  console.log(`RapidAPI configured: ${RAPIDAPI_KEY ? "YES" : "NO"}`);
  console.log(`eBay configured: ${process.env.EBAY_CLIENT_ID ? "YES" : "NO — EBAY_CLIENT_ID/SECRET missing"}`);
});
