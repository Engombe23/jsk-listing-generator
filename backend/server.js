import "dotenv/config";
import { Sentry } from "./lib/sentry.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pLimit from "p-limit";
import { Parser } from "json2csv";
import { buildHtml } from "./html-builder.js";
import { getTemplateById, THEME_LIST } from "./templates/index.js";
import { checkCompatibility } from "./compatibility/checker.js";
import {
  detectProductType, buildEbayQuery, detectUnitType, getConfidence,
  conditionOptions, EXCLUSION_REASONS,
} from "./ebay-filter-rules.js";
import OpenAI from "openai";
import posthog from "posthog-js";
import analyticsRouter from "./routes/analytics.js";
import stripeRouter, { registerStripeWebhook } from "./routes/stripe.js";
import { stripeReady, CLIENT_URL } from "./lib/stripeConfig.js";
import { supabaseAdminReady } from "./lib/supabaseAdmin.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { canGenerateListing, incrementListingUsage, checkFeatureAccess } from "./lib/profiles.js";
import authRouter from "./routes/auth.js";
import partIdentifierRouter from "./routes/partIdentifier.js";
import contactRouter from "./routes/contact.js";

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const app = express();

// Needed for req.ip to reflect the real client IP (X-Forwarded-For) rather
// than Render's proxy — used by the signup-fingerprint abuse-detection check.
app.set("trust proxy", true);

registerStripeWebhook(app);

app.use(helmet());
app.use(cors({ origin: CLIENT_URL || "*" }));
app.use(express.json({ limit: "2mb" }));
app.use("/api", analyticsRouter);
app.use("/api", stripeRouter);
app.use("/api", authRouter);
app.use("/api", partIdentifierRouter);
app.use("/api", contactRouter);

// Rate limiters for cost-incurring endpoints (per IP, per minute).
// `trust proxy` is set above so req.ip reflects the real client IP.
const lookupLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });
const aiLimiter     = rateLimit({ windowMs: 60_000, max: 15, standardHeaders: true, legacyHeaders: false });
const ebayLimiter   = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false });

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

// Evicts the oldest entry (Maps preserve insertion order) when the cap is hit.
function cappedSet(map, key, value, maxSize) {
  if (map.size >= maxSize && !map.has(key)) map.delete(map.keys().next().value);
  map.set(key, value);
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function uniq(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Wrap fetch with a hard timeout so a hung external API call never blocks forever.
function fetchWithTimeout(url, options = {}, ms = 25000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...options, signal: ctrl.signal })
    .finally(() => clearTimeout(timer));
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
  const res = await fetchWithTimeout(url, {
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
    const res = await fetchWithTimeout(url, { method: "POST", headers: apiHeaders(true), body: params.toString() });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// Fetch cross-reference (interchangeable) part numbers for an article.
// These are aftermarket manufacturer numbers — Febi, FAI, Autopumps, SKF, etc.
// Endpoint: GET /api/artlookup/select-article-cross-references/article-id/{id}/lang-id/4
async function fetchArticleCrossReferences(articleId) {
  if (!articleId) return [];
  const url = `https://${RAPIDAPI_HOST}/api/artlookup/select-article-cross-references/article-id/${encodeURIComponent(String(articleId))}/lang-id/${LANG_ID}`;
  try {
    const res = await fetchWithTimeout(url, { method: "GET", headers: apiHeaders() });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

// Parse the cross-references response into a clean array of { brand, articleNo } objects,
// grouped and deduplicated. Handles both array and object wrapper responses.
//
// oemNumbers:    the article's own OEM reference numbers — cross-refs whose articleNo
//               duplicates one of these are excluded (TecDoc sometimes returns OEM
//               vehicle-manufacturer numbers with wrong brand attribution).
// articleBrand:  the brand of the article being listed (e.g. "Motive", "Autopumps UK").
//               Cross-refs from this same brand are excluded — "interchangeable" means
//               a DIFFERENT manufacturer making the same part. Same-brand refs are just
//               a different (often wrong) part number from the same supplier.
function parseCrossReferences(raw, oemNumbers = [], articleBrand = "") {
  if (!raw) return [];
  const list = Array.isArray(raw)
    ? raw
    : (raw.articles || raw.crossReferences || raw.data || raw.result || []);
  if (!Array.isArray(list)) return [];

  // Normalise for case-insensitive comparison.
  const normaliseNo    = (s) => String(s || "").replace(/[\s\-\.]/g, "").toUpperCase();
  const normaliseName  = (s) => String(s || "").toLowerCase().trim();
  const oemSet         = new Set(oemNumbers.map(normaliseNo).filter(Boolean));
  const ownBrand       = normaliseName(articleBrand);

  const seen = new Set();
  const refs = [];

  for (const item of list) {
    if (!item || typeof item !== "object") continue;

    const brand = (
      item.brandName        ||
      item.supplierName     ||
      item.brand            ||
      item.mfrName          ||
      item.manufacturerName ||
      ""
    ).trim();

    const articleNo = (
      item.articleNo     ||
      item.articleNumber ||
      item.artNr         ||
      item.oemNo         ||
      ""
    ).trim();

    if (!brand || !articleNo) continue;

    // Skip cross-refs from the same brand as the article — these are not
    // interchangeable parts, just different (often incorrect) numbers from
    // the same supplier that TecDoc has incorrectly cross-linked.
    if (ownBrand && normaliseName(brand) === ownBrand) {
      console.log(`[CrossRef] Skipped ${brand} ${articleNo} — same brand as article`);
      continue;
    }

    // Skip cross-refs whose number duplicates one of the article's OEM refs.
    if (oemSet.has(normaliseNo(articleNo))) {
      console.log(`[CrossRef] Skipped ${brand} ${articleNo} — duplicates an OEM number`);
      continue;
    }

    const key = `${brand.toLowerCase()}::${articleNo.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const productName = (
      item.articleProductName || item.productName || item.productGroupName || ""
    ).trim();
    console.log(`[CrossRef] Accepted ${brand} ${articleNo}${productName ? ` ("${productName}")` : ""}`);

    refs.push({ brand, articleNo });
  }

  return refs;
}


// ─── OEM search helpers ───────────────────────────────────────────────────────
// Used when the user enters an OEM/reference number instead of a TecDoc article number.

async function searchArticleByOem(oemNumber) {
  const url = `https://${RAPIDAPI_HOST}/api/articles-oem/article-oem-search-no`;
  const params = new URLSearchParams();
  params.append("langId", LANG_ID);
  params.append("articleOemNo", oemNumber);
  try {
    const res = await fetchWithTimeout(url, { method: "POST", headers: apiHeaders(true), body: params.toString() });
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
    const res = await fetchWithTimeout(url, { method: "GET", headers: apiHeaders() });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// Search by aftermarket supplier article number (e.g. "AOP858", "FAI OFW1009A").
// Uses articleType=ArticleNumber which finds parts by their brand's own part number,
// not by OEM reference number.
async function artlookupByArticleNo(articleNo) {
  const params = new URLSearchParams();
  params.append("langId", LANG_ID);
  params.append("articleNo", articleNo);
  params.append("articleType", "ArticleNumber");
  const url = `https://${RAPIDAPI_HOST}/api/artlookup/search-articles-by-article-no?${params.toString()}`;
  try {
    const res = await fetchWithTimeout(url, { method: "GET", headers: apiHeaders() });
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

  // 4. Aftermarket article-number fallback (e.g. AOP858, FAI OFW1009A)
  const artData = await artlookupByArticleNo(input);
  const artArticles = Array.isArray(artData)
    ? artData
    : (artData?.articles || artData?.data || []);

  if (artArticles.length > 0) {
    const best = artArticles[0];
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
    const res = await fetchWithTimeout(url, { method: "GET", headers: apiHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    const rows = data?.modelTypes || data?.vehicleTypes || data?.vehicles || data?.data || [];
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

// Pull the vehicleId from a TecDoc car/engine-row object regardless of field name.
function getVid(obj) {
  return String(obj?.vehicleId || obj?.typeId || obj?.kType || obj?.kTypeId || obj?.id || "").trim();
}

// Pull typeEngineName from an engine row regardless of field name.
function getEngineRowName(r) {
  return String(r?.typeEngineName || r?.typeName || r?.carTypeName || r?.engineName || "").trim().toLowerCase();
}

// Match a compatibleCar entry to the best engine-type row from the model series.
// Priority: exact vehicleId → name+dates → dates only → name alone.
function findEngineMatch(car, engineRows) {
  if (!Array.isArray(engineRows) || engineRows.length === 0) return null;

  const carVid   = getVid(car);
  const carName  = String(car.typeEngineName || car.typeName || car.carTypeName || "").trim().toLowerCase();
  const carStart = String(car.constructionIntervalStart || car.yearFrom || "");
  const carEnd   = String(car.constructionIntervalEnd   || car.yearTo   || "");

  // 1. Exact vehicleId — try every known field name on both sides
  if (carVid) {
    const byId = engineRows.find(r => getVid(r) === carVid);
    if (byId) return byId;
  }

  // 2. Engine name + construction date range
  if (carName && carStart) {
    const byNameAndDate = engineRows.find(r =>
      getEngineRowName(r) === carName &&
      String(r.constructionIntervalStart || r.yearFrom || "") === carStart &&
      String(r.constructionIntervalEnd   || r.yearTo   || "") === carEnd
    );
    if (byNameAndDate) return byNameAndDate;
  }

  // 3. Date range only (useful when engine name field is absent but dates are present)
  if (carStart) {
    const byDates = engineRows.find(r =>
      String(r.constructionIntervalStart || r.yearFrom || "") === carStart &&
      String(r.constructionIntervalEnd   || r.yearTo   || "") === carEnd
    );
    if (byDates) return byDates;
  }

  // 4. Engine name alone
  if (carName) {
    return engineRows.find(r => getEngineRowName(r) === carName) || null;
  }

  return null;
}

// Fetch engine data for all unique modelIds in a compatible-cars list.
// Results are cached in modelEngineCache (persists across requests).
// Runs in parallel batches of 4 with 200ms between batches to respect rate limits.
// Capped at MAX_MODEL_LOOKUPS uncached fetches — the full compatibility list is still
// built from the article response; only engine-code enrichment is limited.
const MAX_MODEL_LOOKUPS = 60; // raised from 20 — parts like gaskets can have 40+ unique model series

async function fetchEngineDataByModelIds(cars) {
  const uniqueModelIds = uniq(cars.map(c => String(c.modelId)).filter(Boolean));
  const result = {};

  // Split into cached vs uncached
  const cached   = uniqueModelIds.filter(id => modelEngineCache.has(id));
  const uncached = uniqueModelIds.filter(id => !modelEngineCache.has(id)).slice(0, MAX_MODEL_LOOKUPS);

  // Fill cached results immediately
  for (const id of cached) result[id] = modelEngineCache.get(id);

  // Fetch uncached in parallel batches of 4
  const BATCH = 4;
  for (let i = 0; i < uncached.length; i += BATCH) {
    const batch = uncached.slice(i, i + BATCH);
    await Promise.all(batch.map(async (modelId) => {
      const rows = await fetchEngineTypesByModel(modelId);
      cappedSet(modelEngineCache, modelId, rows, 500);
      result[modelId] = rows;
    }));
    if (i + BATCH < uncached.length) await sleep(200); // brief pause between batches
  }

  return result;
}

// ─── Image helper ─────────────────────────────────────────────────────────────

function extractFirstImageUrl(mediaResponse) {
  if (!mediaResponse) return "";

  // Try the documented TecDoc articleImages array first (largest available size)
  const imgArr = mediaResponse.articleImages ?? mediaResponse.data?.articleImages ?? null;
  if (Array.isArray(imgArr) && imgArr.length > 0) {
    for (const img of imgArr) {
      const url = img.imageURL4 || img.imageURL3 || img.imageURL2 || img.imageURL1 || "";
      if (url && url.startsWith("http")) return url;
    }
  }

  // Fallback: walk the entire response tree for any tecalliance/tecdoc URL or image extension
  const urls = [];
  const walk = (obj, depth = 0) => {
    if (!obj || depth > 8) return;
    if (typeof obj === "string") {
      if (obj.startsWith("http") && (
        obj.includes("tecalliance") ||
        obj.includes("tecdoc") ||
        /\.(jpg|jpeg|png|webp)/i.test(obj)
      )) { urls.push(obj); }
      return;
    }
    if (Array.isArray(obj)) { obj.forEach((v) => walk(v, depth + 1)); return; }
    if (typeof obj === "object") Object.values(obj).forEach((v) => walk(v, depth + 1));
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
    // ── Consistent field extraction (TecDoc API field names vary by endpoint) ──
    const make    = car.manufacturerName || car.manuName   || car.make  || car.brand  || "";
    const model   = car.modelName        || car.carModelName || car.model || car.series || "";
    const engine  = car.typeEngineName   || car.carTypeName  || car.typeName || car.engineName || car.variant || "";
    const yearFrom = car.constructionIntervalStart || car.yearFrom || car.from || "";
    const yearTo   = car.constructionIntervalEnd   || car.yearTo   || car.to   || "";
    const vid      = car.vehicleId || car.typeId || car.kType || car.kTypeId || car.id || "";
    const modelId  = String(car.modelId || car.carModelId || "");

    // Look up model-series engine list, then find the best match for this variant
    const engineRows = (modelId ? engineDataByModelId[modelId] : null) || [];
    const match      = findEngineMatch({ ...car, typeEngineName: engine, constructionIntervalStart: yearFrom, constructionIntervalEnd: yearTo }, engineRows);

    // Engine codes — try match first, then every known field name on the car entry
    const rawCodes =
      match?.engCodes    || match?.engineCodes || match?.engineCode || match?.motorCodes ||
      car?.engCodes      || car?.engineCodes   || car?.engineCode   || car?.motorCodes   ||
      "";

    // Power + capacity — match overrides car entry if available
    const kw = match?.powerKw   ?? car?.powerKw   ?? car?.kw  ?? null;
    const hp = match?.powerPs   ?? car?.powerPs   ?? car?.ps  ?? car?.hp ?? null;
    const cc = match?.capacityTech ?? car?.capacityTech ?? car?.displacement ?? car?.cc ?? null;

    const vehicle = `${make} ${model} ${engine}`.trim();

    // Skip completely empty rows (no make AND no model) — these are ghost entries
    // with no useful data that would render as blank table rows.
    if (!make && !model && !engine) return null;

    return {
      make,  model,  engine,  vehicle,
      production_years: formatYearRange(yearFrom, yearTo),
      kw:           cleanNumber(kw),
      hp:           cleanNumber(hp),
      cc:           cleanNumber(cc),
      engine_codes: uniq(splitEngineCodes(rawCodes)),
      k_number:     String(vid)
    };
  }).filter(Boolean); // remove ghost rows

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

  // ── Media + Cross-references + OEM search (all parallel) ────────────────
  // Three sources run at the same time:
  //   1. article-all-media-info        → article image
  //   2. select-article-cross-refs     → article-ID specific cross-refs (varies by brand)
  //   3. article-oem-search-no         → ALL aftermarket articles for this OEM number
  //                                      (the real interchangeable list — brand-agnostic)
  const firstOem = normalized.oem_numbers?.[0] || null;
  const [mediaResponse, crossRefsRaw, oemSearchRaw] = await Promise.all([
    fetchArticleMedia(articleId),
    fetchArticleCrossReferences(articleId),
    firstOem ? searchArticleByOem(firstOem) : Promise.resolve(null)
  ]);

  const articleBrand = (
    article.supplierName     ||
    article.brandName        ||
    article.brand            ||
    article.mfrName          ||
    article.brandShortName   ||
    ""
  ).trim();

  const articleImage = extractFirstImageUrl(mediaResponse);

  // Normalise helpers (shared below)
  const normaliseNo   = (s) => String(s || "").replace(/[\s\-\.]/g, "").toUpperCase();
  const normaliseName = (s) => String(s || "").toLowerCase().trim();
  const oemSet        = new Set(normalized.oem_numbers.map(normaliseNo).filter(Boolean));
  const ownBrandKey   = normaliseName(articleBrand);

  // ── 1. Article's own brand + number (always first) ───────────────────────
  const ownArticleNo = (
    article.articleNo || article.articleNumber || article.artNr || resolvedNumber || ""
  ).trim();
  const ownRef = (articleBrand && ownArticleNo)
    ? [{ brand: articleBrand, articleNo: ownArticleNo }]
    : [];

  // ── 2. OEM search results — every aftermarket article for the OEM number ─
  // This is the primary interchangeable source: brand-agnostic, complete.
  const oemSearchList = Array.isArray(oemSearchRaw)
    ? oemSearchRaw
    : (oemSearchRaw?.articles || oemSearchRaw?.data || []);

  const fromOemSearch = oemSearchList
    .map((a) => ({
      brand:     (a.supplierName || a.brandName || a.brand || a.mfrName || "").trim(),
      articleNo: (a.articleNo || a.articleNumber || a.artNr || "").trim()
    }))
    .filter((r) => {
      if (!r.brand || !r.articleNo) return false;
      if (oemSet.has(normaliseNo(r.articleNo))) return false;        // skip OEM numbers
      if (normaliseName(r.brand) === ownBrandKey) return false;      // skip same brand (own ref already added above)
      return true;
    });

  // ── 3. Dedicated cross-ref endpoint — supplements OEM search ─────────────
  const crossRefs = parseCrossReferences(crossRefsRaw, normalized.oem_numbers, articleBrand);

  // ── Merge and deduplicate all three sources ───────────────────────────────
  const seen = new Set();
  const interchangeableParts = [];
  for (const ref of [...ownRef, ...fromOemSearch, ...crossRefs]) {
    const key = `${normaliseName(ref.brand)}::${normaliseNo(ref.articleNo)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    interchangeableParts.push(ref);
  }

  console.log(`[Listing] ${articleNumber}: own=${ownRef.length} oemSearch=${fromOemSearch.length} crossRefs=${crossRefs.length} total=${interchangeableParts.length} brand="${articleBrand}"`);

  // ── Build HTML ────────────────────────────────────────────────────────────
  const html = buildHtml({ ...normalized, engine_codes: engineCodes, k_numbers: kNumbers, interchangeable_parts: interchangeableParts }, template);

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
    article_number:       articleNumber,
    article_id:           articleId,
    article_image:        articleImage,
    generated_title:      normalized.product_name,
    k_number_list:        kNumbers,
    oem_numbers:          normalized.oem_numbers,
    interchangeable_parts: interchangeableParts,
    engine_codes:         engineCodes,
    specifications:       normalized.specifications,
    item_specifics:       normalized.item_specifics,
    compatibility_count:  normalized.compatibility_rows.length,
    compatibility_rows:   normalized.compatibility_rows,
    product_type:         normalized.product_name,
    top_models:           topModels,
    year_range:           yearRange,
    engine_sizes:         engineSizes,
    fuel_type:            fuelType
  };

  // Cache by both the input key and the resolved article number (OEM searches benefit from this)
  const cachePayload = { normalized: { ...normalized, engine_codes: engineCodes, k_numbers: kNumbers, interchangeable_parts: interchangeableParts }, baseResult, articleImage };
  cappedSet(articleNormCache, articleNumber, cachePayload, 200);
  if (resolvedNumber !== articleNumber) cappedSet(articleNormCache, resolvedNumber, cachePayload, 200);

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

  // 4. Aftermarket article-number search — catches supplier part numbers like AOP858, FAI OFW1009A
  if (found.length === 0) {
    const artData = await artlookupByArticleNo(input);
    const artList = Array.isArray(artData) ? artData : (artData?.articles || artData?.data || []);
    absorb(artList);
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
app.post("/search", requireAuth, lookupLimiter, async (req, res) => {
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

app.post("/lookup", requireAuth, lookupLimiter, async (req, res) => {
  try {
    const articleNumber = String(req.body.articleNumber || "").trim().replace(/\s+/g, "");
    const themeId       = req.body.themeId || req.body.templateId || "clean-default";

    if (!articleNumber) return res.status(400).json({ error: "Missing articleNumber" });

    // Listing limit check — happens BEFORE generation, never consumes a
    // credit on its own. The credit is only spent after a successful result.
    const access = await canGenerateListing(req.user.id, req.user.email);
    if (!access.allowed) {
      return res.status(403).json({
        error: "limit_reached",
        message: "You have reached your listing limit. Upgrade your plan to continue generating listings.",
      });
    }

    const result = await buildListingFromArticle(articleNumber, themeId);

    // Only increment usage once a real result has been returned — failures,
    // not-found, and server errors above never reach this line.
    await incrementListingUsage(req.user.id, req.user.email);

    posthog.capture({
      distinctId: "server",
      event: "listing_generated",
      properties: {
        article_number:      articleNumber,
        template_id:         result.template_id,
        compatibility_count: result.compatibility_count,
      },
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/batch-export", requireAuth, async (req, res) => {
  try {
    const { rows, themeId = "clean-default", templateId } = req.body;
    const resolvedTheme = themeId || templateId || "clean-default";

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "rows must be a non-empty array" });
    }
    if (rows.length > 100) {
      return res.status(400).json({ error: "Maximum 100 rows per batch export." });
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

    // Check the limit up-front so a user with zero credits left gets a clear
    // error instead of a CSV full of blank/errored rows.
    const initialAccess = await canGenerateListing(req.user.id, req.user.email);
    if (!initialAccess.allowed) {
      return res.status(403).json({
        error: "limit_reached",
        message: "You have reached your listing limit. Upgrade your plan to continue generating listings.",
      });
    }

    // Process up to 3 rows concurrently — Promise.all preserves input order.
    const batchLimit = pLimit(3);
    const exportRows = await Promise.all(cleanedRows.map((row) => batchLimit(async () => {
      const rowAccess = await canGenerateListing(req.user.id, req.user.email);
      if (!rowAccess.allowed) {
        return {
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
          "Error": "Listing limit reached — upgrade your plan to generate more.",
        };
      }
      try {
        console.log(`Batch processing ${row.articleNumber}...`);
        const result = await buildListingFromArticle(row.articleNumber, resolvedTheme);
        await incrementListingUsage(req.user.id, req.user.email);
        return {
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
          "Error":                       "",
        };
      } catch (err) {
        return {
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
          "Error": err.message,
        };
      }
    })));

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

    const successCount = exportRows.filter(r => !r["Error"]).length;
    posthog.capture({
      distinctId: "server",
      event: "batch_export_completed",
      properties: {
        total_rows:    cleanedRows.length,
        success_count: successCount,
        error_count:   cleanedRows.length - successCount,
        template_id:   resolvedTheme,
      },
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="adlister-batch-export.csv"');
    res.send(parser.parse(exportRows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/compatibility/check", requireAuth, async (req, res) => {
  try {
    const feature = await checkFeatureAccess(req.user.id, req.user.email, "compatibilityChecker");
    if (!feature.allowed) {
      return res.status(403).json({
        error: "feature_restricted",
        message: "This feature is available on Growth and Scale plans.",
      });
    }

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

app.post("/api/ai/generate-titles", requireAuth, aiLimiter, async (req, res) => {
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

    posthog.capture({
      distinctId: "server",
      event: "ai_titles_generated",
      properties: {
        product_type:  productType,
        model:         OPENAI_MODEL,
        titles_count:  parsed.titles?.length ?? 0,
      },
    });
    res.json(parsed);
  } catch (err) {
    console.error("[/api/ai/generate-titles]", err.message);
    res.status(500).json({ error: "AI title generation failed. Please try again." });
  }
});

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

  const res = await fetchWithTimeout("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization:  `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope"
  }, 15000);

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
app.post("/api/ebay/search-prices", requireAuth, ebayLimiter, async (req, res) => {
  try {
    const feature = await checkFeatureAccess(req.user.id, req.user.email, "smartPricing");
    if (!feature.allowed) {
      return res.status(403).json({
        error: "feature_restricted",
        message: "This feature is available on Growth and Scale plans.",
      });
    }

    const { query, condition = "new" } = req.body;
    if (!query?.trim()) {
      return res.status(400).json({ error: "query is required" });
    }

    // ── Step 1: Resolve condition ─────────────────────────────────────────────
    const condOpt    = conditionOptions.find(c => c.key === condition);
    const condFilter = condOpt?.ebayFilter || null;
    const condLabel  = condOpt?.label      || condition;

    // ── Step 2: Detect product type + build filtered eBay query ───────────────
    const rule      = detectProductType(query.trim());
    const ebayQuery = buildEbayQuery(query.trim(), rule);

    // ── Step 3: Fetch top 60 listings ─────────────────────────────────────────
    // URL built manually — eBay requires literal { } in filter strings; encoding breaks it.
    // fieldgroups=EXTENDED requests seller, image, and shipping data that are
    // omitted from the default response subset.
    const token = await getEbayAccessToken();
    let url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(ebayQuery)}&limit=60&offset=0&fieldgroups=EXTENDED`;
    if (condFilter) url += `&filter=${condFilter}`;

    const ebayRes = await fetchWithTimeout(url, {
      headers: {
        Authorization:             `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_GB",
        "Content-Type":            "application/json",
      },
    }, 20000);

    if (!ebayRes.ok) {
      const text = await ebayRes.text();
      throw new Error(`eBay search failed (${ebayRes.status}): ${text.slice(0, 300)}`);
    }

    const data         = await ebayRes.json();
    const rawItems     = data.itemSummaries || [];
    const totalFetched = rawItems.length;
    const currency     = rawItems.find(i => i.price?.currency)?.price?.currency || "GBP";

    // Debug: log the first item's raw shape so we can verify field availability
    if (rawItems[0]) {
      const s = rawItems[0];
      console.log("[eBay debug] first item keys:", Object.keys(s));
      console.log("[eBay debug] image:", s.image);
      console.log("[eBay debug] seller:", s.seller);
      console.log("[eBay debug] shippingOptions:", JSON.stringify(s.shippingOptions));
      console.log("[eBay debug] condition:", s.condition, "conditionId:", s.conditionId);
    }

    // Enrich each item — capture all fields needed for table view
    const enriched = rawItems.map(item => {
      const v           = parseFloat(item.price?.value);
      const shippingOpt = item.shippingOptions?.[0];
      const shippingVal = parseFloat(shippingOpt?.shippingCost?.value);
      return {
        itemId:            item.itemId || null,
        title:             item.title || "",
        price:             Number.isFinite(v) && v > 0 ? v : null,
        url:               item.itemWebUrl || "",
        image:             item.image?.imageUrl || null,
        condition:         item.condition || "",
        sellerName:        item.seller?.username || "",
        sellerFeedback:    item.seller?.feedbackScore    != null ? Number(item.seller.feedbackScore)          : null,
        sellerFeedbackPct: item.seller?.feedbackPercentage != null ? parseFloat(item.seller.feedbackPercentage) : null,
        shippingCost:      Number.isFinite(shippingVal) ? shippingVal : null,
        shippingType:      shippingOpt?.shippingType || null,
        itemDate:          item.itemCreationDate || null,
      };
    });

    // ── No exclusions — use all price-valid listings ──────────────────────────
    const priceValid    = enriched.filter(i => i.price !== null);
    const relevantItems = priceValid;

    // ── Final stats ───────────────────────────────────────────────────────────
    const finalPrices = relevantItems.map(i => i.price).sort((a, b) => a - b);
    const confidence  = getConfidence(finalPrices.length);

    const excludedByFilter    = 0;
    const excludedAsSetKit    = 0;
    const excludedHighOutlier = 0;
    const excludedLowOutlier  = 0;
    const totalExcluded       = 0;

    if (finalPrices.length === 0) {
      const zeroResultsMsg = rule
        ? `No relevant ${rule.productType} ${condLabel.toLowerCase()} listings found after filtering ${totalFetched} results. Try a different search term.`
        : `No ${condLabel.toLowerCase()} listings found for this search — try a different search term.`;

      return res.json({
        low: null, high: null, average: null, median: null,
        currency,
        condition,
        conditionLabel: condLabel,
        priceCount:          0,
        totalFetched,
        relevantCount:       0,
        excludedByFilter,
        excludedAsSetKit,
        excludedHighOutlier,
        excludedLowOutlier,
        totalExcluded,
        detectedType:    rule?.productType || null,
        filterApplied:   rule !== null,
        unitSensitive:   rule?.unitSensitive ?? false,
        confidenceLevel: confidence.level,
        confidenceLabel: confidence.label,
        confidenceColor: confidence.color,
        zeroResultsMsg,
        listings:         [],
        excludedListings: [],
      });
    }

    const n       = finalPrices.length;
    const low     = finalPrices[0];
    const high    = finalPrices[n - 1];
    const average = finalPrices.reduce((s, v) => s + v, 0) / n;
    const median  = calcMedian(finalPrices);

    console.log(
      `[eBay] "${query}" | ${condLabel} | fetched=${totalFetched} used=${n}`
    );

    posthog.capture({
      distinctId: "server",
      event: "ebay_price_search",
      properties: {
        condition,
        detected_type:   rule?.productType || null,
        total_fetched:   totalFetched,
        price_count:     n,
        median_price:    +median.toFixed(2),
      },
    });

    const allExcluded = [];

    res.json({
      low:     +low.toFixed(2),
      high:    +high.toFixed(2),
      average: +average.toFixed(2),
      median:  +median.toFixed(2),
      currency,
      condition,
      conditionLabel: condLabel,
      priceCount:          n,
      totalFetched,
      relevantCount:       n,
      excludedByFilter,
      excludedAsSetKit,
      excludedHighOutlier,
      excludedLowOutlier,
      totalExcluded,
      detectedType:    rule?.productType || null,
      filterApplied:   rule !== null,
      unitSensitive:   rule?.unitSensitive ?? false,
      confidenceLevel: confidence.level,
      confidenceLabel: confidence.label,
      confidenceColor: confidence.color,
      listings: relevantItems.map(i => ({
        itemId:            i.itemId,
        title:             i.title,
        price:             i.price,
        url:               i.url,
        image:             i.image,
        condition:         i.condition,
        sellerName:        i.sellerName,
        sellerFeedback:    i.sellerFeedback,
        sellerFeedbackPct: i.sellerFeedbackPct,
        shippingCost:      i.shippingCost,
        shippingType:      i.shippingType,
        itemDate:          i.itemDate,
      })),
      excludedListings: allExcluded,
    });

  } catch (err) {
    console.error("[/api/ebay/search-prices]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── eBay sold-count lookup ───────────────────────────────────────────────────
// POST /api/ebay/sold-counts
// Accepts { itemIds: string[] }, returns { [itemId]: soldQty | null }.
// Fetches item details in parallel (max 10 concurrent) with a 5-second timeout.
app.post("/api/ebay/sold-counts", requireAuth, ebayLimiter, async (req, res) => {
  try {
    const { itemIds } = req.body;
    if (!Array.isArray(itemIds) || itemIds.length === 0) return res.json({});
    if (itemIds.length > 50) return res.status(400).json({ error: "Maximum 50 itemIds per request." });

    const token   = await getEbayAccessToken();
    const results = {};
    const CONCURRENCY = 10;

    // Process in chunks to avoid hammering the API
    for (let i = 0; i < itemIds.length; i += CONCURRENCY) {
      const chunk = itemIds.slice(i, i + CONCURRENCY);
      await Promise.allSettled(chunk.map(async (itemId) => {
        try {
          const r = await fetchWithTimeout(
            `https://api.ebay.com/buy/browse/v1/item/${encodeURIComponent(String(itemId))}`,
            {
              method: "GET",
              headers: {
                "Authorization":            `Bearer ${token}`,
                "X-EBAY-C-MARKETPLACE-ID":  "EBAY_GB",
                "Content-Type":             "application/json",
              },
            },
            5000
          );
          if (!r.ok) { results[itemId] = null; return; }
          const data  = await r.json();
          const avail = Array.isArray(data.estimatedAvailabilities) ? data.estimatedAvailabilities[0] : null;
          results[itemId] = avail?.soldQuantity ?? null;
        } catch {
          results[itemId] = null;
        }
      }));
    }

    res.json(results);
  } catch (err) {
    console.error("[/api/ebay/sold-counts]", err.message);
    res.status(500).json({ error: err.message });
  }
});

Sentry.setupExpressErrorHandler(app);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`OpenAI configured: ${openaiClient ? "YES" : "NO — OPENAI_API_KEY is missing"}`);
  console.log(`RapidAPI configured: ${RAPIDAPI_KEY ? "YES" : "NO"}`);
  console.log(`eBay configured: ${process.env.EBAY_CLIENT_ID ? "YES" : "NO — EBAY_CLIENT_ID/SECRET missing"}`);
  console.log(`Stripe configured: ${stripeReady ? "YES" : "NO — STRIPE_API_KEY is missing"}`);
  console.log(`Supabase admin configured: ${supabaseAdminReady ? "YES" : "NO — SUPABASE_SERVICE_ROLE_KEY is missing"}`);
});

process.on("SIGTERM", () => posthog.shutdown());
process.on("SIGINT",  () => posthog.shutdown());
