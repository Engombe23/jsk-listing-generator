import "dotenv/config";
import { Sentry } from "./lib/sentry.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pLimit from "p-limit";
import { Parser } from "json2csv";
import {
  buildHtml,
  getLanguageCodeForMarketplace,
  getTecdocLangId,
  MARKETPLACE_LANG_LABELS,
  MARKETPLACE_TO_LANG,
} from "./html-builder.js";
import { getTemplateById, THEME_LIST } from "./templates/index.js";
import { checkCompatibility } from "./compatibility/checker.js";
import { getCompatibleCarsByArticleNo } from "./compatibility/api.js";
import {
  detectProductType, buildEbayQuery, detectUnitType, getConfidence,
  conditionOptions, EXCLUSION_REASONS,
} from "./ebay-filter-rules.js";
import { getEbayMarketplaceId, getMarketplaceCurrency } from "./lib/ebay-categories.js";
import OpenAI from "openai";
import { PostHog } from "posthog-node";
const posthog = new PostHog(
  process.env.POSTHOG_API_KEY || "",
  { host: process.env.POSTHOG_HOST || "https://us.i.posthog.com" }
);
import analyticsRouter from "./routes/analytics.js";
import stripeRouter, { registerStripeWebhook } from "./routes/stripe.js";
import { stripeReady, CLIENT_URL } from "./lib/stripeConfig.js";
import { supabaseAdmin, supabaseAdminReady } from "./lib/supabaseAdmin.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { canGenerateListing, incrementListingUsage, checkFeatureAccess } from "./lib/profiles.js";
import authRouter from "./routes/auth.js";
import partIdentifierRouter from "./routes/partIdentifier.js";
import contactRouter from "./routes/contact.js";
import adminImportRouter from "./routes/admin-import.js";
import { lookupVehiclesByIds } from "./lib/tecdoc-cache.js";

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const app = express();

// Needed for req.ip to reflect the real client IP (X-Forwarded-For) rather
// than Render's proxy — used by the signup-fingerprint abuse-detection check.
app.set("trust proxy", 1); // Trust exactly one proxy hop (Render's load balancer)

registerStripeWebhook(app);

app.use(helmet());
app.use(cors({ origin: CLIENT_URL || "*" }));
app.use(express.json({ limit: "2mb" }));
app.use("/api", analyticsRouter);
app.use("/api", stripeRouter);
app.use("/api", authRouter);
app.use("/api", partIdentifierRouter);
app.use("/api", contactRouter);
app.use("/api", adminImportRouter);

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

const VALID_MARKETPLACES = new Set(Object.keys(MARKETPLACE_TO_LANG));

/** Normalise listing language / section toggles from a request body. */
function normalizeListingOpts(body = {}) {
  const mp = VALID_MARKETPLACES.has(body.targetMarketplace)
    ? body.targetMarketplace
    : "ebay-uk";
  const lo = body.listingOptions && typeof body.listingOptions === "object"
    ? body.listingOptions
    : {};
  return {
    targetMarketplace: mp,
    tecdocLangId: getTecdocLangId(mp),
    showCompatibilityTable:     lo.showCompatibilityTable !== false,
    showInterchangeableNumbers: lo.showInterchangeableNumbers !== false,
    showEngineCodes:            lo.showEngineCodes !== false,
  };
}

function articleCacheKey(articleNumber, langId) {
  return `${String(articleNumber)}::${langId || LANG_ID}`;
}

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
let _tecdocCallCount = 0;
function fetchWithTimeout(url, options = {}, ms = 25000) {
  if (url.includes(RAPIDAPI_HOST)) _tecdocCallCount++;
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

// Return the raw TecDoc engine-code value as a single element, unchanged.
// No splitting or normalisation — the caller sees exactly what TecDoc returned.
function splitEngineCodes(value) {
  if (!value) return [];
  const str = String(value).trim();
  return str ? [str] : [];
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

async function fetchArticleDetails(articleNumber, langId = LANG_ID) {
  const url = `https://${RAPIDAPI_HOST}/api/articles/article-number-details`;
  const params = new URLSearchParams();
  params.append("typeId", TYPE_ID);
  params.append("langId", langId);
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

async function fetchArticleMedia(articleId, langId = LANG_ID) {
  if (!articleId) return null;
  const url = `https://${RAPIDAPI_HOST}/api/articles/article-all-media-info`;
  const params = new URLSearchParams();
  params.append("langId", langId);
  params.append("articleId", String(articleId));
  try {
    const res = await fetchWithTimeout(url, { method: "POST", headers: apiHeaders(true), body: params.toString() });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// Fetch cross-reference (interchangeable) part numbers for an article.
// These are aftermarket manufacturer numbers — Febi, FAI, Autopumps, SKF, etc.
// Endpoint: GET /api/artlookup/select-article-cross-references/article-id/{id}/lang-id/{langId}
async function fetchArticleCrossReferences(articleId, langId = LANG_ID) {
  if (!articleId) return [];
  const url = `https://${RAPIDAPI_HOST}/api/artlookup/select-article-cross-references/article-id/${encodeURIComponent(String(articleId))}/lang-id/${langId}`;
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

async function searchArticleByOem(oemNumber, langId = LANG_ID) {
  const url = `https://${RAPIDAPI_HOST}/api/articles-oem/article-oem-search-no`;
  const params = new URLSearchParams();
  params.append("langId", langId);
  params.append("articleOemNo", oemNumber);
  try {
    const res = await fetchWithTimeout(url, { method: "POST", headers: apiHeaders(true), body: params.toString() });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function artlookupByOem(oemNumber, langId = LANG_ID) {
  const params = new URLSearchParams();
  params.append("langId", langId);
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
async function artlookupByArticleNo(articleNo, langId = LANG_ID) {
  const params = new URLSearchParams();
  params.append("langId", langId);
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
async function resolveArticleResponse(input, langId = LANG_ID) {
  // 1. Direct article number
  let direct = null;
  try { direct = await fetchArticleDetails(input, langId); } catch {}
  if (direct?.articles?.[0]) {
    return { articleResponse: direct, resolvedNumber: input };
  }

  // 2. OEM search (article-oem-search-no)
  const oemData = await searchArticleByOem(input, langId);
  const oemArticles = Array.isArray(oemData)
    ? oemData
    : (oemData?.articles || oemData?.data || []);

  if (oemArticles.length > 0) {
    const best = oemArticles[0];
    const resolvedNo = best.articleNo || best.articleNumber || best.artNr || null;
    if (resolvedNo) {
      let detail = null;
      try { detail = await fetchArticleDetails(resolvedNo, langId); } catch {}
      if (detail?.articles?.[0]) return { articleResponse: detail, resolvedNumber: resolvedNo };
    }
    // Use the OEM search result directly if detail fetch failed
    return { articleResponse: { articles: [best] }, resolvedNumber: resolvedNo || input };
  }

  // 3. Artlookup OEM fallback
  const lookupData = await artlookupByOem(input, langId);
  const lookupArticles = Array.isArray(lookupData)
    ? lookupData
    : (lookupData?.articles || lookupData?.data || []);

  if (lookupArticles.length > 0) {
    const best = lookupArticles[0];
    const resolvedNo = best.articleNo || best.articleNumber || best.artNr || null;
    if (resolvedNo) {
      let detail = null;
      try { detail = await fetchArticleDetails(resolvedNo, langId); } catch {}
      if (detail?.articles?.[0]) return { articleResponse: detail, resolvedNumber: resolvedNo };
    }
    return { articleResponse: { articles: [best] }, resolvedNumber: resolvedNo || input };
  }

  // 4. Aftermarket article-number fallback (e.g. AOP858, FAI OFW1009A)
  const artData = await artlookupByArticleNo(input, langId);
  const artArticles = Array.isArray(artData)
    ? artData
    : (artData?.articles || artData?.data || []);

  if (artArticles.length > 0) {
    const best = artArticles[0];
    const resolvedNo = best.articleNo || best.articleNumber || best.artNr || null;
    if (resolvedNo) {
      let detail = null;
      try { detail = await fetchArticleDetails(resolvedNo, langId); } catch {}
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

async function fetchEngineTypesByModel(modelId, langId = LANG_ID) {
  const url = `https://${RAPIDAPI_HOST}/api/types/type-id/${TYPE_ID}/list-vehicles-types/${modelId}/lang-id/${langId}/country-filter-id/${COUNTRY_FILTER_ID}`;
  try {
    const res = await fetchWithTimeout(url, { method: "GET", headers: apiHeaders() }, 6000);
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

async function fetchEngineDataByModelIds(cars, langId = LANG_ID) {
  const uniqueModelIds = uniq(cars.map(c => String(c.modelId)).filter(Boolean));
  const result = {};
  const cacheKey = (id) => `${id}::${langId}`;

  // Split into cached vs uncached
  const cached   = uniqueModelIds.filter(id => modelEngineCache.has(cacheKey(id)));
  const uncached = uniqueModelIds.filter(id => !modelEngineCache.has(cacheKey(id))).slice(0, MAX_MODEL_LOOKUPS);

  // Fill cached results immediately
  for (const id of cached) result[id] = modelEngineCache.get(cacheKey(id));

  // Fetch uncached in parallel batches of 4
  const BATCH = 4;
  for (let i = 0; i < uncached.length; i += BATCH) {
    const batch = uncached.slice(i, i + BATCH);
    await Promise.all(batch.map(async (modelId) => {
      const rows = await fetchEngineTypesByModel(modelId, langId);
      cappedSet(modelEngineCache, cacheKey(modelId), rows, 500);
      result[modelId] = rows;
    }));
    if (i + BATCH < uncached.length) await sleep(50); // brief pause between batches
  }

  return result;
}

// ─── Image helper ─────────────────────────────────────────────────────────────

// Return the first image URL from the TecDoc article-all-media-info response.
// Takes the best available size from articleImages[0] without filtering by
// file extension — the image-proxy endpoint handles format detection.
function extractFirstImageUrl(mediaResponse) {
  if (!mediaResponse) return "";
  // API now returns an array directly; old format wrapped it under articleImages.
  const arr = Array.isArray(mediaResponse)
    ? mediaResponse
    : (mediaResponse.articleImages ?? mediaResponse.data?.articleImages ?? null);
  if (!Array.isArray(arr)) return "";
  for (const img of arr) {
    const url = img.s3image || img.imageURL4 || img.imageURL3 || img.imageURL2 || img.imageURL1 || "";
    if (url && url.startsWith("http")) return url;
  }
  return "";
}

// ─── Normalize ────────────────────────────────────────────────────────────────

function normalizeTecdoc(articleResponse, engineDataByModelId, vehicleCache = null) {
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
    const vidStr   = String(vid);
    const modelId  = String(car.modelId || car.carModelId || "");

    let engine_codes, kw, hp, cc;

    // Prefer Supabase cache when the vehicle is known — avoids a TecDoc API call
    if (vehicleCache?.has(vidStr)) {
      const cached = vehicleCache.get(vidStr);
      engine_codes = Array.isArray(cached.engine_codes) ? cached.engine_codes : splitEngineCodes(cached.engine_codes || "");
      kw = cached.power_kw  ?? null;
      hp = cached.power_hp  ?? null;
      cc = cached.capacity_cc ?? null;
    } else {
      // Look up model-series engine list, then find the best match for this variant
      const engineRows = (modelId ? engineDataByModelId[modelId] : null) || [];
      const match      = findEngineMatch({ ...car, typeEngineName: engine, constructionIntervalStart: yearFrom, constructionIntervalEnd: yearTo }, engineRows);

      // Engine codes — try match first, then every known field name on the car entry
      const rawCodes =
        match?.engCodes    || match?.engineCodes || match?.engineCode || match?.motorCodes ||
        car?.engCodes      || car?.engineCodes   || car?.engineCode   || car?.motorCodes   ||
        "";

      engine_codes = uniq(splitEngineCodes(rawCodes));
      kw = match?.powerKw   ?? car?.powerKw   ?? car?.kw  ?? null;
      hp = match?.powerPs   ?? car?.powerPs   ?? car?.ps  ?? car?.hp ?? null;
      cc = match?.capacityTech ?? car?.capacityTech ?? car?.displacement ?? car?.cc ?? null;
    }

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
      engine_codes: uniq(Array.isArray(engine_codes) ? engine_codes : splitEngineCodes(engine_codes)),
      k_number:     vidStr
    };
  }).filter(Boolean).sort((a, b) => {
    const ma = a.make.toLowerCase(), mb = b.make.toLowerCase();
    if (ma !== mb) return ma < mb ? -1 : 1;
    const moa = a.model.toLowerCase(), mob = b.model.toLowerCase();
    if (moa !== mob) return moa < mob ? -1 : 1;
    const ea = a.engine.toLowerCase(), eb = b.engine.toLowerCase();
    return ea < eb ? -1 : ea > eb ? 1 : 0;
  }); // remove ghost rows, sort by make → model → engine

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
    product_name:       article.articleProductName || "",
    oem_numbers:        uniq((article.oemNo || []).map((o) => o.oemDisplayNo)),
    specifications,
    item_specifics:     itemSpecifics,
    compatibility_rows: rows,
    engine_codes:       uniq(rows.flatMap(r => r.engine_codes || [])),
    data_supplier_id:   article.dataSupplierId || null
  };
}

// ─── Main listing builder (optimised) ────────────────────────────────────────

async function buildListingFromArticle(articleNumber, themeId = "clean-default", listingOpts = {}) {
  _tecdocCallCount = 0;
  const template = getTemplateById(themeId);
  const opts = {
    targetMarketplace: "ebay-uk",
    tecdocLangId: LANG_ID,
    showCompatibilityTable: true,
    showInterchangeableNumbers: true,
    showEngineCodes: true,
    ...listingOpts,
  };
  const langId = opts.tecdocLangId || getTecdocLangId(opts.targetMarketplace);
  const inputCacheKey = articleCacheKey(articleNumber, langId);

  // ── Cache hit: skip all data fetching, just rebuild HTML ──────────────────
  // Cache is keyed by article + TecDoc langId so product/vehicle text stays correct.
  if (articleNormCache.has(inputCacheKey)) {
    const cached = articleNormCache.get(inputCacheKey);
    const html   = buildHtml(cached.normalized, template, opts);
    return {
      ...cached.baseResult,
      generated_html:     html,
      template_id:        template.id,
      template_name:      template.name,
      target_marketplace: opts.targetMarketplace,
    };
  }

  // ── Resolve input → article (supports OEM numbers) ───────────────────────
  const { articleResponse, resolvedNumber } = await resolveArticleResponse(articleNumber, langId);
  const article = articleResponse?.articles?.[0];
  if (!article) throw new Error(`No article found for "${articleNumber}"`);

  if (resolvedNumber !== articleNumber) {
    console.log(`[Listing] OEM "${articleNumber}" resolved to article "${resolvedNumber}"`);
  }

  const articleId      = article.articleId;
  const dataSupplierId = article.dataSupplierId || article.brandId || null;
  const cars           = article.compatibleCars || [];
  const oemNumbers     = uniq((article.oemNo || []).map((o) => o.oemDisplayNo).filter(Boolean));

  console.log(`[Listing] ${resolvedNumber}: ${cars.length} compatible vehicles in article response (langId=${langId})`);
  if (cars[0]) console.log(`[Listing] sample car fields:`, JSON.stringify(Object.keys(cars[0])));
  if (cars[0]) console.log(`[Listing] sample car engine codes:`, cars[0].engCodes || cars[0].engineCodes || cars[0].engineCode || cars[0].motorCodes || "NONE");
  if (cars[0]) console.log(`[Listing] sample car kw/hp/cc:`, cars[0].powerKw, cars[0].powerPs, cars[0].capacityTech);

  // ── Test: getCompatibleCarsByArticleNo ────────────────────────────────────
  if (dataSupplierId) {
    const compatCars = await getCompatibleCarsByArticleNo(resolvedNumber, dataSupplierId);
    const sample = Array.isArray(compatCars) ? compatCars[0] : compatCars?.data?.[0] ?? compatCars;
    console.log(`[CompatCars] count:`, Array.isArray(compatCars) ? compatCars.length : "non-array");
    console.log(`[CompatCars] sample fields:`, sample ? JSON.stringify(Object.keys(sample)) : "none");
    console.log(`[CompatCars] sample engine codes:`, sample?.engCodes || sample?.engineCodes || sample?.engineCode || sample?.motorCodes || "NONE");
    console.log(`[CompatCars] sample kw/hp/cc:`, sample?.powerKw, sample?.powerPs, sample?.capacityTech);
  }

  // ── Supabase vehicle cache lookup ─────────────────────────────────────────
  // Batch-fetch all known vehicle IDs from the local cache to avoid repeated
  // TecDoc API calls. Vehicles missing from the cache fall back to the
  // model-level engine fetch below.
  const allVids = cars
    .map(c => String(c.vehicleId || c.typeId || c.kType || c.kTypeId || c.id || ""))
    .filter(Boolean);
  const vehicleCache = await lookupVehiclesByIds(allVids);
  console.log(`[Listing] ${articleNumber}: ${vehicleCache.size}/${allVids.length} vehicles from Supabase cache`);

  // Only call the TecDoc API for vehicles that were not in the cache
  const uncachedCars = allVids.length > 0
    ? cars.filter(c => !vehicleCache.has(String(c.vehicleId || c.typeId || c.kType || c.kTypeId || c.id || "")))
    : cars;
  const engineDataByModelId = uncachedCars.length > 0
    ? await fetchEngineDataByModelIds(uncachedCars)
    : {};
  console.log(`[Listing] ${articleNumber}: fetched engine data for ${Object.keys(engineDataByModelId).length} model series`);

  // ── Normalize ─────────────────────────────────────────────────────────────
  const normalized = normalizeTecdoc(articleResponse, engineDataByModelId, vehicleCache);
  const kNumbers    = uniq(normalized.compatibility_rows.map((r) => r.k_number));
  const engineCodes = uniq(normalized.compatibility_rows.flatMap((r) => r.engine_codes || []));

  // ── Media + Cross-references + OEM search (all parallel) ────────────────
  // Three sources run at the same time:
  //   1. article-all-media-info        → article image
  //   2. select-article-cross-refs     → article-ID specific cross-refs (varies by brand)
  //   3. article-oem-search-no         → ALL aftermarket articles for this OEM number
  //                                      (the real interchangeable list — brand-agnostic)
  const wantInterchangeable = opts.showInterchangeableNumbers !== false;
  const firstOem = normalized.oem_numbers?.[0] || null;
  const [mediaResponse, crossRefsRaw, oemSearchRaw] = await Promise.all([
    fetchArticleMedia(articleId, langId),
    wantInterchangeable ? fetchArticleCrossReferences(articleId, langId) : Promise.resolve([]),
    wantInterchangeable && firstOem ? searchArticleByOem(firstOem, langId) : Promise.resolve(null)
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
  const html = buildHtml(
    { ...normalized, engine_codes: engineCodes, k_numbers: kNumbers, interchangeable_parts: interchangeableParts },
    template,
    opts
  );

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

  // Cache by both the input key and the resolved article number (OEM searches benefit from this).
  // Include TecDoc langId so DE/FR/… catalogue text is not served from an EN cache entry.
  const cachePayload = { normalized: { ...normalized, engine_codes: engineCodes, k_numbers: kNumbers, interchangeable_parts: interchangeableParts }, baseResult, articleImage };
  cappedSet(articleNormCache, inputCacheKey, cachePayload, 200);
  if (resolvedNumber !== articleNumber) {
    cappedSet(articleNormCache, articleCacheKey(resolvedNumber, langId), cachePayload, 200);
  }

  console.log(`[Listing] ${articleNumber}: ${_tecdocCallCount} TecDoc API calls total`);

  return {
    ...baseResult,
    generated_html:     html,
    template_id:        template.id,
    template_name:      template.name,
    target_marketplace: opts.targetMarketplace,
    _debug_api_calls:   _tecdocCallCount,
  };
}

// ─── Article search (OEM or article number → list of matching articles) ──────

async function searchArticles(input, langId = LANG_ID) {
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
    const direct = await fetchArticleDetails(input, langId);
    const arts = direct?.articles || [];
    if (arts.length > 0) { absorb(arts); return found; }
  } catch {}

  // 2. OEM search — article-oem-search-no
  const oemData = await searchArticleByOem(input, langId);
  const oemList = Array.isArray(oemData) ? oemData : (oemData?.articles || oemData?.data || []);
  absorb(oemList);

  // 3. Artlookup OEM fallback
  if (found.length === 0) {
    const lookupData = await artlookupByOem(input, langId);
    const lookupList = Array.isArray(lookupData) ? lookupData : (lookupData?.articles || lookupData?.data || []);
    absorb(lookupList);
  }

  // 4. Aftermarket article-number search — catches supplier part numbers like AOP858, FAI OFW1009A
  if (found.length === 0) {
    const artData = await artlookupByArticleNo(input, langId);
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
        const detail = await fetchArticleDetails(a.articleNo, langId);
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

// Proxy TecDoc product images — cdn.tecalliance.net blocks direct browser loads
// (hotlink protection). The backend fetches without a browser Referer and pipes
// the response back so the frontend can display them without CORS issues.
app.get("/api/image-proxy", async (req, res) => {
  const raw = String(req.query.url || "").trim();
  if (!raw) return res.status(400).json({ error: "Missing url" });

  let parsed;
  try { parsed = new URL(raw); } catch { return res.status(400).json({ error: "Invalid url" }); }

  const ALLOWED_SUFFIXES = ["tecalliance.net", "your-objectstorage.com"];
  if (!ALLOWED_SUFFIXES.some(s => parsed.hostname.endsWith(s))) {
    console.warn(`[image-proxy] Blocked host: ${parsed.hostname}`);
    return res.status(403).json({ error: "Host not allowed" });
  }

  console.log(`[image-proxy] Fetching: ${raw}`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const upstream = await fetch(raw, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PartLister/1.0)" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    console.log(`[image-proxy] Response: ${upstream.status} ${upstream.headers.get("content-type")}`);
    if (!upstream.ok) return res.status(upstream.status).end();
    const upstreamType = upstream.headers.get("content-type") || "";
    if (upstreamType.startsWith("application/pdf") || upstreamType.startsWith("text/")) {
      console.warn(`[image-proxy] Skipping non-image content-type: ${upstreamType}`);
      return res.status(415).end();
    }

    const buf = Buffer.from(await upstream.arrayBuffer());

    // Detect real image format from magic bytes — CDN always returns binary/octet-stream
    let ct = "image/jpeg";
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) ct = "image/png";
    else if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) ct = "image/jpeg";
    else if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) ct = "image/gif";
    else if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
             buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) ct = "image/webp";

    console.log(`[image-proxy] Detected format: ${ct} (first bytes: ${buf.slice(0,4).toString("hex")})`);
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "no-cache");
    res.send(buf);
  } catch (e) {
    console.error(`[image-proxy] Error for ${raw}:`, e.message);
    res.status(502).json({ error: "Image fetch failed" });
  }
});

// Search: OEM number or article number → list of candidate articles for selection
app.post("/search", requireAuth, lookupLimiter, async (req, res) => {
  try {
    const query = String(req.body.query || "").trim().replace(/\s+/g, "");
    if (!query) return res.status(400).json({ error: "Missing query" });
    const listingOpts = normalizeListingOpts(req.body);
    const articles = await searchArticles(query, listingOpts.tecdocLangId);
    res.json({ query, articles, target_marketplace: listingOpts.targetMarketplace });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/lookup", requireAuth, lookupLimiter, async (req, res) => {
  try {
    const articleNumber = String(req.body.articleNumber || "").trim().replace(/\s+/g, "");
    const themeId       = req.body.themeId || req.body.templateId || "clean-default";
    const listingOpts   = normalizeListingOpts(req.body);

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

    const result = await buildListingFromArticle(articleNumber, themeId, listingOpts);

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
    const listingOpts   = normalizeListingOpts(req.body);

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
        const result = await buildListingFromArticle(row.articleNumber, resolvedTheme, listingOpts);
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

// ─── Bulk listing jobs ────────────────────────────────────────────────────────

// ─── Trusted manufacturer priority config ─────────────────────────────────────
// Edit this list to change brand ranking — no logic changes needed.
// Higher priority = preferred. Names are matched case-insensitively.
const TRUSTED_MANUFACTURERS = [
  // Tier 1 — OEM-quality suppliers
  { name: "MEYLE",          priority: 100 },
  { name: "LEMFORDER",      priority: 99  },
  { name: "LEMFÖRDER",      priority: 99  },
  { name: "TRW",            priority: 98  },
  { name: "SACHS",          priority: 97  },
  { name: "FAG",            priority: 96  },
  { name: "SKF",            priority: 95  },
  { name: "FEBI BILSTEIN",  priority: 94  },
  { name: "FEBI",           priority: 94  },
  { name: "BOSCH",          priority: 93  },
  { name: "NGK",            priority: 92  },
  { name: "VALEO",          priority: 91  },
  { name: "GATES",          priority: 90  },
  { name: "DAYCO",          priority: 89  },
  { name: "DELPHI",         priority: 88  },
  { name: "BEHR",           priority: 87  },
  { name: "MAHLE",          priority: 87  },
  { name: "ELRING",         priority: 86  },
  { name: "VICTOR REINZ",   priority: 85  },
  // Tier 2 — quality aftermarket
  { name: "FAI AUTOPARTS",  priority: 80  },
  { name: "FAI",            priority: 80  },
  { name: "OPTIMAL",        priority: 78  },
  { name: "TOPRAN",         priority: 77  },
  { name: "SWAG",           priority: 76  },
  { name: "MAPCO",          priority: 75  },
  { name: "RUVILLE",        priority: 75  },
  { name: "QUINTON HAZELL", priority: 74  },
  { name: "QH",             priority: 74  },
  { name: "CORTECO",        priority: 73  },
  { name: "SNR",            priority: 72  },
  { name: "NTN",            priority: 71  },
  { name: "NSK",            priority: 70  },
  { name: "KOYO",           priority: 69  },
  // Tier 3 — budget / data-enrichment brands
  { name: "JP GROUP",       priority: 60  },
  { name: "DT SPARE PARTS", priority: 50  },
];

// Normalise a brand name for lookup: uppercase, collapse whitespace/hyphens.
function normalizeMfrName(name) {
  return (name || "").toUpperCase().trim().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

// Build a fast priority lookup once at startup (normalised name → priority).
const MFR_PRIORITY = new Map(
  TRUSTED_MANUFACTURERS.map(m => [normalizeMfrName(m.name), m.priority])
);

// Score a single candidate. Manufacturer priority dominates (×1000) so it
// always beats data-quality noise within the same priority tier.
// Returns { score: number, reason: string }.
function scoreBulkCandidate(a) {
  let score = 0;
  const parts = [];

  const mfrPriority = MFR_PRIORITY.get(normalizeMfrName(a.brand));
  if (mfrPriority !== undefined) {
    score += mfrPriority * 1000;
    parts.push(`mfr:${a.brand}(p=${mfrPriority})`);
  }

  const oemCount = (a.oemNumbers || []).length;
  if (oemCount > 0) {
    score += Math.min(oemCount, 10) * 20;
    parts.push(`oem:${oemCount}`);
  }

  if (a.imageUrl) { score += 30; parts.push("image"); }

  const nameLen = (a.productName || "").length;
  if (nameLen > 5)  { score += 10; parts.push("name"); }
  if (nameLen > 20) { score += 10; }

  return { score, reason: parts.join(", ") || "data-score" };
}

// Select the best article from candidates. Never returns null when candidates
// is non-empty. Only sets needsReview:true for genuine product-type conflicts
// that cannot be resolved programmatically.
function selectBestBulkCandidate(candidates) {
  if (!candidates.length) return null;

  if (candidates.length === 1) {
    const { score, reason } = scoreBulkCandidate(candidates[0]);
    return { candidate: candidates[0], score, reason: `sole-result(${reason})`, needsReview: false };
  }

  const scored = candidates
    .map(a => { const { score, reason } = scoreBulkCandidate(a); return { ...a, _score: score, _reason: reason }; })
    .sort((a, b) => b._score - a._score);

  const top = scored[0];
  const topPriority = MFR_PRIORITY.get(normalizeMfrName(top.brand));

  if (topPriority !== undefined) {
    // Trusted manufacturer is at the top — auto-select it.
    return {
      candidate:   top,
      score:       top._score,
      reason:      `auto:trusted-mfr(${top.brand},p=${topPriority},${top._reason})`,
      needsReview: false,
    };
  }

  // No trusted manufacturer found — pick the best-scored result automatically
  // (user instruction: "choose the 1st one" when no configured supplier present).
  return {
    candidate:   top,
    score:       top._score,
    reason:      `auto:best-available(${top.brand || "unknown"},${top._reason})`,
    needsReview: false,
  };
}

// Process one item: resolve → generate → save. Updates Supabase at each step.
// Never throws — writes any failure into the item row instead.
async function processBulkItem(item, userId, userEmail, options) {
  const { themeId = "clean-default", listingOptions = {} } = options;
  const listingOpts = normalizeListingOpts(listingOptions);

  const patch = (fields) =>
    supabaseAdmin
      ?.from("bulk_listing_items")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", item.id);

  try {
    // 1. Resolve input → article
    await patch({ status: "searching" });

    const candidates = await searchArticles(
      item.input_number,
      listingOpts.tecdocLangId || LANG_ID
    );

    if (!candidates.length) {
      await patch({ status: "not_found", error_message: "No article found for this number" });
      return "not_found";
    }

    const selection = selectBestBulkCandidate(candidates);

    if (!selection) {
      await patch({ status: "not_found", error_message: "No article found for this number" });
      return "not_found";
    }

    if (selection.needsReview) {
      const candidateList = candidates.slice(0, 5).map(a => ({
        articleNo:   a.articleNo,
        brand:       a.brand,
        productName: a.productName,
        imageUrl:    a.imageUrl,
      }));
      await patch({
        status:           "needs_review",
        candidates:       JSON.stringify(candidateList),
        selection_score:  0,
        selection_reason: selection.reason || "ambiguous",
        error_message:    `${candidates.length} articles found — manual selection required`,
      });
      return "needs_review";
    }

    const resolvedArticleNo   = selection.candidate.articleNo;
    const resolvedSupplier    = selection.candidate.brand;
    const resolvedProductName = selection.candidate.productName;
    const selectionScore      = selection.score;
    const selectionReason     = selection.reason;

    if (!resolvedArticleNo) {
      await patch({ status: "not_found", error_message: "Could not determine article number" });
      return "not_found";
    }

    // 2. Check listing limit
    const access = await canGenerateListing(userId, userEmail);
    if (!access.allowed) {
      await patch({ status: "failed", error_message: "Listing limit reached — upgrade your plan" });
      return "failed";
    }

    // 3. Generate listing
    await patch({
      status:                  "generating",
      resolved_article_number: resolvedArticleNo,
      resolved_supplier:       resolvedSupplier,
      product_name:            resolvedProductName,
      selection_score:         selectionScore,
      selection_reason:        selectionReason,
    });

    const result = await buildListingFromArticle(resolvedArticleNo, themeId, listingOpts);

    // 4. Save to saved_listings
    let listingId = null;
    if (supabaseAdmin) {
      const { data: saved, error: saveErr } = await supabaseAdmin
        .from("saved_listings")
        .insert({
          user_id:             userId,
          status:              "Draft",
          title:               result.generated_title     || "",
          article_number:      result.article_number      || resolvedArticleNo,
          description_html:    result.generated_html      || "",
          item_specifics:      result.item_specifics      || [],
          specifications:      result.specifications      || [],
          oem_numbers:         result.oem_numbers         || [],
          k_number_list:       result.k_number_list       || [],
          engine_codes:        result.engine_codes        || [],
          compatibility_count: result.compatibility_count || 0,
          product_type:        result.product_type        || "",
          sku:                 item.sku                   || "",
          bin_price:           item.bin_price             || "",
          article_image:       result.article_image       || "",
        })
        .select("id")
        .maybeSingle();
      if (saveErr) console.error(`[BulkItem ${item.id}] saved_listings insert error:`, saveErr);
      listingId = saved?.id || null;
    }

    await incrementListingUsage(userId, userEmail);

    await patch({
      status:       "completed",
      listing_id:   listingId,
      product_name: result.generated_title || resolvedProductName,
    });
    return "completed";

  } catch (err) {
    await patch({ status: "failed", error_message: String(err.message).slice(0, 500) });
    return "failed";
  }
}

// Update the job's count columns from the current item statuses.
async function finaliseBulkJob(jobId) {
  if (!supabaseAdmin) return;
  const { data: all } = await supabaseAdmin
    .from("bulk_listing_items")
    .select("status")
    .eq("job_id", jobId);

  const counts = (all || []).reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const stillActive = ["queued", "searching", "generating"]
    .some(s => (counts[s] || 0) > 0);

  await supabaseAdmin
    .from("bulk_listing_jobs")
    .update({
      status:             stillActive ? "processing" : "completed",
      completed_count:    counts.completed    || 0,
      failed_count:       (counts.failed || 0) + (counts.not_found || 0),
      needs_review_count: counts.needs_review || 0,
      not_found_count:    counts.not_found    || 0,
      ...(stillActive ? {} : { completed_at: new Date().toISOString() }),
    })
    .eq("id", jobId);
}

// Process all queued items for a job (3 concurrent). Fires in background.
async function processBulkJob(jobId, userId, userEmail, options) {
  if (!supabaseAdmin) return;

  await supabaseAdmin
    .from("bulk_listing_jobs")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", jobId);

  const { data: items } = await supabaseAdmin
    .from("bulk_listing_items")
    .select("*")
    .eq("job_id", jobId)
    .eq("status", "queued")
    .order("row_index", { ascending: true });

  if (!items?.length) { await finaliseBulkJob(jobId); return; }

  const limit = pLimit(3);
  await Promise.all(
    items.map(item => limit(() => processBulkItem(item, userId, userEmail, options)))
  );
  await finaliseBulkJob(jobId);
}

// POST /api/bulk/jobs — create a new bulk job and start processing
app.post("/api/bulk/jobs", requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Database not configured" });

    const { items, themeId, listingOptions } = req.body;
    if (!Array.isArray(items) || !items.length)
      return res.status(400).json({ error: "items must be a non-empty array" });
    if (items.length > 500)
      return res.status(400).json({ error: "Maximum 500 items per bulk job" });

    const cleaned = items
      .map((it, i) => ({
        inputNumber: String(it.inputNumber || it.oem || "").trim().replace(/\s+/g, ""),
        sku:         String(it.sku       || "").trim(),
        binPrice:    String(it.binPrice  || "").trim(),
        rowIndex:    i,
      }))
      .filter(it => it.inputNumber);

    if (!cleaned.length) return res.status(400).json({ error: "No valid items" });

    const access = await canGenerateListing(req.user.id, req.user.email);
    if (!access.allowed)
      return res.status(403).json({ error: "limit_reached", message: "Listing limit reached. Upgrade to continue." });

    const options = {
      themeId:        themeId        || "clean-default",
      listingOptions: listingOptions || {},
    };

    const { data: job, error: je } = await supabaseAdmin
      .from("bulk_listing_jobs")
      .insert({ user_id: req.user.id, total_items: cleaned.length, options })
      .select("id")
      .maybeSingle();

    if (je || !job) return res.status(500).json({ error: je?.message || "Failed to create job" });

    await supabaseAdmin.from("bulk_listing_items").insert(
      cleaned.map(it => ({
        job_id:       job.id,
        user_id:      req.user.id,
        row_index:    it.rowIndex,
        input_number: it.inputNumber,
        sku:          it.sku,
        bin_price:    it.binPrice,
        status:       "queued",
      }))
    );

    setImmediate(() =>
      processBulkJob(job.id, req.user.id, req.user.email, options).catch(console.error)
    );

    res.json({ jobId: job.id, totalItems: cleaned.length });
  } catch (err) {
    console.error("[POST /api/bulk/jobs]", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bulk/jobs — list the user's recent jobs
app.get("/api/bulk/jobs", requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Database not configured" });
    const { data, error } = await supabaseAdmin
      .from("bulk_listing_jobs")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ jobs: data || [] });
  } catch (err) {
    console.error("[GET /api/bulk/jobs]", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bulk/jobs/:id — job header + all items
app.get("/api/bulk/jobs/:id", requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Database not configured" });
    const { id } = req.params;
    const [{ data: job, error: je }, { data: items, error: ie }] = await Promise.all([
      supabaseAdmin.from("bulk_listing_jobs").select("*").eq("id", id).eq("user_id", req.user.id).maybeSingle(),
      supabaseAdmin.from("bulk_listing_items").select("*").eq("job_id", id).order("row_index", { ascending: true }),
    ]);
    if (je || !job) return res.status(404).json({ error: "Job not found" });
    if (ie) return res.status(500).json({ error: ie.message });
    res.json({ job, items: items || [] });
  } catch (err) {
    console.error("[GET /api/bulk/jobs/:id]", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bulk/jobs/:id/retry — reset failed/not_found items and reprocess
app.post("/api/bulk/jobs/:id/retry", requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Database not configured" });
    const { id } = req.params;
    const { data: job } = await supabaseAdmin
      .from("bulk_listing_jobs")
      .select("id, options, status")
      .eq("id", id).eq("user_id", req.user.id).maybeSingle();
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.status === "processing") return res.status(409).json({ error: "Job is already processing" });

    await supabaseAdmin
      .from("bulk_listing_items")
      .update({ status: "queued", error_message: null, updated_at: new Date().toISOString() })
      .eq("job_id", id)
      .in("status", ["failed", "not_found"]);

    await supabaseAdmin
      .from("bulk_listing_jobs")
      .update({ status: "pending", completed_at: null })
      .eq("id", id);

    setImmediate(() =>
      processBulkJob(id, req.user.id, req.user.email, job.options || {}).catch(console.error)
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/bulk/jobs/:id/retry]", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bulk/jobs/:id/pick — select a specific article for a needs_review item
app.post("/api/bulk/jobs/:id/pick", requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Database not configured" });
    const { id } = req.params;
    const { itemId, articleNo } = req.body;
    if (!itemId || !articleNo) return res.status(400).json({ error: "itemId and articleNo required" });

    const { data: item } = await supabaseAdmin
      .from("bulk_listing_items")
      .select("*")
      .eq("id", itemId).eq("job_id", id).eq("user_id", req.user.id).maybeSingle();
    if (!item) return res.status(404).json({ error: "Item not found" });

    const { data: job } = await supabaseAdmin
      .from("bulk_listing_jobs").select("options").eq("id", id).maybeSingle();

    await supabaseAdmin
      .from("bulk_listing_items")
      .update({
        status:                  "queued",
        input_number:            articleNo,
        resolved_article_number: null,
        candidates:              null,
        error_message:           null,
        updated_at:              new Date().toISOString(),
      })
      .eq("id", itemId);

    const updatedItem = { ...item, input_number: articleNo };
    setImmediate(() =>
      processBulkItem(updatedItem, req.user.id, req.user.email, job?.options || {})
        .then(() => finaliseBulkJob(id))
        .catch(console.error)
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/bulk/jobs/:id/pick]", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bulk/jobs/:id/export — download completed items as Ad-Lister CSV
app.get("/api/bulk/jobs/:id/export", requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Database not configured" });
    const { id } = req.params;

    const { data: job } = await supabaseAdmin
      .from("bulk_listing_jobs").select("id").eq("id", id).eq("user_id", req.user.id).maybeSingle();
    if (!job) return res.status(404).json({ error: "Job not found" });

    // Step 1: fetch completed items (no join — large description_html causes nested
    // join responses to exceed Supabase's response size threshold for common parts
    // with 500+ compatible vehicles, silently dropping the field for affected rows).
    const { data: items } = await supabaseAdmin
      .from("bulk_listing_items")
      .select("*")
      .eq("job_id", id)
      .eq("status", "completed")
      .order("row_index", { ascending: true });

    if (!items?.length) return res.status(200).send("No completed items to export");

    // Step 2: fetch the saved_listings records separately by id.
    const listingIds = items.map(it => it.listing_id).filter(Boolean);
    const listingMap = new Map();
    if (listingIds.length) {
      const { data: listings } = await supabaseAdmin
        .from("saved_listings")
        .select("id, title, description_html, oem_numbers, engine_codes, k_number_list, product_type")
        .in("id", listingIds);
      for (const l of listings || []) listingMap.set(l.id, l);
    }

    const exportRows = items.map(item => {
      const sl = listingMap.get(item.listing_id) || {};
      return {
        "Title":                       sl.title                                     || "",
        "SKU":                         item.sku                                     || "",
        "BIN Price":                   item.bin_price                               || "",
        "Description":                 sl.description_html                          || "",
        "Custom Specifics 1 Name":     "Brand",
        "Custom Specifics 1 Value":    "JSK",
        "Custom Specifics 2 Name":     "Reference OE/OEM Number",
        "Custom Specifics 2 Value":    uniq(sl.oem_numbers  || []).join(", "),
        "Custom Specifics 3 Name":     "Manufacturer Part Number",
        "Custom Specifics 3 Value":    item.sku                                     || "",
        "Custom Specifics 4 Name":     "Product Type",
        "Custom Specifics 4 Value":    sl.product_type                              || "",
        "Custom Specifics 5 Name":     "Country of Manufacture",
        "Custom Specifics 5 Value":    "United Kingdom",
        "Custom Specifics 6 Name":     "Compatible Engine Codes",
        "Custom Specifics 6 Value":    uniq(sl.engine_codes || []).join(", "),
        "Custom Specifics 7 Name":     "K Numbers",
        "Custom Specifics 7 Value":    uniq(sl.k_number_list || []).join(", "),
        "Article Number":              item.resolved_article_number                 || item.input_number,
        "Template":                    "",
        "Error":                       "",
      };
    });

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
        "Article Number", "Template", "Error",
      ],
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="bulk-export-${id.slice(0, 8)}.csv"`);
    res.send(parser.parse(exportRows));
  } catch (err) {
    console.error("[GET /api/bulk/jobs/:id/export]", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bulk/jobs/:id/report — full job report (all items, all statuses)
app.get("/api/bulk/jobs/:id/report", requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Database not configured" });
    const { id } = req.params;

    const { data: job } = await supabaseAdmin
      .from("bulk_listing_jobs").select("id").eq("id", id).eq("user_id", req.user.id).maybeSingle();
    if (!job) return res.status(404).json({ error: "Job not found" });

    const { data: items } = await supabaseAdmin
      .from("bulk_listing_items")
      .select("row_index, input_number, sku, status, resolved_article_number, resolved_supplier, product_name, error_message")
      .eq("job_id", id)
      .order("row_index", { ascending: true });

    const parser = new Parser({
      fields: ["row_index", "input_number", "sku", "status", "resolved_article_number", "resolved_supplier", "product_name", "error_message"],
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="bulk-report-${id.slice(0, 8)}.csv"`);
    res.send(parser.parse(items || []));
  } catch (err) {
    console.error("[GET /api/bulk/jobs/:id/report]", err);
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
      selectedVehicleId, targetMarketplace
    } = req.body;
    const marketplace = VALID_MARKETPLACES.has(targetMarketplace)
      ? targetMarketplace
      : "ebay-uk";
    const langId = getTecdocLangId(marketplace);

    console.log(`[/compatibility/check] vin=${vin || "-"} oem=${oemNumber || "-"} selectedVehicleId=${selectedVehicleId || "-"} marketplace=${marketplace} langId=${langId}`);

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
      selectedVehicleId,
      langId
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
    maxTitleLength = 80,
    targetMarketplace = "ebay-uk",
  } = req.body;

  if (!productType) {
    return res.status(400).json({ error: "productType is required" });
  }

  const marketplace = VALID_MARKETPLACES.has(targetMarketplace) ? targetMarketplace : "ebay-uk";
  const langCode    = getLanguageCodeForMarketplace(marketplace);
  const langLabel   = MARKETPLACE_LANG_LABELS[langCode] || "English";

  // Strip "L" suffix from engine sizes — display as "2.5", "3.0" not "2.5L"
  const cleanEngSizes = engineSizes.map((s) => s.replace(/L$/i, "")).slice(0, 4);

  const prompt = `You are an expert eBay automotive parts listing writer for the ${marketplace} marketplace.

Generate exactly 3 listing titles using the templates and rules below.

═══ LANGUAGE ═══
- Write every title in ${langLabel}.
- Keep OEM numbers, engine codes, make/model names, and years unchanged (do not translate those identifiers).
- Translate only natural-language words such as the part name and the word equivalent of "For" when it is natural in ${langLabel}.

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
- Product name abbreviations are allowed only when widely recognised in ${langLabel}
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
//
// Full pipeline:
//   1. Resolve condition → eBay filter string
//   2. Detect product type from query; build eBay query with neg-keyword hints
//   3. Fetch top 60 listings for the selected Target Marketplace
//   4. Return price stats + enriched listings
app.post("/api/ebay/search-prices", requireAuth, ebayLimiter, async (req, res) => {
  try {
    const feature = await checkFeatureAccess(req.user.id, req.user.email, "smartPricing");
    if (!feature.allowed) {
      return res.status(403).json({
        error: "feature_restricted",
        message: "This feature is available on Growth and Scale plans.",
      });
    }

    const { query, condition = "new", targetMarketplace } = req.body;
    if (!query?.trim()) {
      return res.status(400).json({ error: "query is required" });
    }

    const marketplace = VALID_MARKETPLACES.has(targetMarketplace)
      ? targetMarketplace
      : "ebay-uk";
    const ebayMarketplaceId = getEbayMarketplaceId(marketplace);
    const defaultCurrency   = getMarketplaceCurrency(marketplace);

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
        "X-EBAY-C-MARKETPLACE-ID": ebayMarketplaceId,
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
    const currency     = rawItems.find(i => i.price?.currency)?.price?.currency || defaultCurrency;

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
        target_marketplace: marketplace,
        ebay_marketplace_id: ebayMarketplaceId,
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
      `[eBay] "${query}" | ${marketplace}/${ebayMarketplaceId} | ${condLabel} | fetched=${totalFetched} used=${n}`
    );

    posthog.capture({
      distinctId: "server",
      event: "ebay_price_search",
      properties: {
        condition,
        target_marketplace: marketplace,
        ebay_marketplace_id: ebayMarketplaceId,
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
      target_marketplace: marketplace,
      ebay_marketplace_id: ebayMarketplaceId,
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
    const { itemIds, targetMarketplace } = req.body;
    if (!Array.isArray(itemIds) || itemIds.length === 0) return res.json({});
    if (itemIds.length > 50) return res.status(400).json({ error: "Maximum 50 itemIds per request." });

    const marketplace = VALID_MARKETPLACES.has(targetMarketplace)
      ? targetMarketplace
      : "ebay-uk";
    const ebayMarketplaceId = getEbayMarketplaceId(marketplace);

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
                "X-EBAY-C-MARKETPLACE-ID":  ebayMarketplaceId,
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
