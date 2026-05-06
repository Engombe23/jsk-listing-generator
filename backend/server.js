import "dotenv/config";
import express from "express";
import cors from "cors";
import { Parser } from "json2csv";
import { buildHtml } from "./html-builder.js";
import { getTemplateById, THEME_LIST } from "./templates/index.js";
import { checkCompatibility } from "./compatibility/checker.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "autodoc-parts-catalog.p.rapidapi.com";

const TYPE_ID           = "1";
const LANG_ID           = "4";
const COUNTRY_FILTER_ID = "63";

// Max individual vehicle-detail calls when the direct compatibility endpoint
// does not return engine-code data. Keeps worst-case calls low.
const VEHICLE_FETCH_CAP = 10;

// ─── In-memory caches ─────────────────────────────────────────────────────────

// vehicleId → raw vehicle-type-details response
const vehicleDetailCache = new Map();
// articleNumber → { normalized, articleId, articleImage }  (populated after first lookup)
const articleNormCache   = new Map();

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

function extractVehicleDetail(data) {
  return data?.vehicleType || data?.vehicleTypeDetails || data?.vehicleDetails || data?.data || data || null;
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

async function fetchVehicleDetails(vehicleId) {
  const url = `https://${RAPIDAPI_HOST}/api/types/type-id/${TYPE_ID}/vehicle-type-details/${vehicleId}/lang-id/${LANG_ID}/country-filter-id/${COUNTRY_FILTER_ID}`;
  try {
    const res = await fetch(url, { method: "GET", headers: apiHeaders() });
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

// ─── NEW: Direct article compatibility endpoint ───────────────────────────────
// Tries to get compatible vehicle list directly from the article number + supplier,
// which may include engine codes / kW / HP / CC per vehicle — one call instead of N.
//
// Autodoc endpoint: POST /api/articles/compatible-vehicles-by-article-number-supplier-id
// Falls back silently if unavailable or empty.

async function fetchCompatibleVehiclesDirect(articleNo, dataSupplierId) {
  if (!articleNo || !dataSupplierId) return null;
  const url = `https://${RAPIDAPI_HOST}/api/articles/compatible-vehicles-by-article-number-supplier-id`;
  const params = new URLSearchParams();
  params.append("langId", LANG_ID);
  params.append("typeId", TYPE_ID);
  params.append("articleNo", String(articleNo));
  params.append("dataSupplierId", String(dataSupplierId));
  try {
    const res = await fetch(url, { method: "POST", headers: apiHeaders(true), body: params.toString() });
    if (!res.ok) return null;
    const data = await res.json();
    // Could return an array or wrapper object
    const list = Array.isArray(data) ? data : (data?.data || data?.vehicles || data?.compatibleCars || null);
    return Array.isArray(list) && list.length > 0 ? list : null;
  } catch { return null; }
}

// ─── NEW: OEM-based vehicle list (re-uses Autodoc endpoint already in compat module) ──
// Returns vehicles by the article's first OEM number — may include engine codes.
// This is the same endpoint the compatibility checker uses for exact-match checks.

async function fetchVehiclesByOem(oemNumber) {
  if (!oemNumber) return null;
  const url = `https://${RAPIDAPI_HOST}/api/articles-oem/selecting-a-list-of-cars-for-oem-part-number`;
  const params = new URLSearchParams();
  params.append("langId", LANG_ID);
  params.append("articleOemNo", String(oemNumber));
  try {
    const res = await fetch(url, { method: "POST", headers: apiHeaders(true), body: params.toString() });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : null;
  } catch { return null; }
}

// Build a vehicleId → detail map from a direct/OEM vehicle list, but only when the
// response actually carries engine-code data (otherwise there's no benefit).

function vehicleListHasEngineData(list) {
  if (!Array.isArray(list) || list.length === 0) return false;
  return list.some((v) => {
    return (
      v?.engCodes       ||
      v?.engineCodes    ||
      v?.engineCode     ||
      v?.powerKw        ||
      v?.powerPs        ||
      v?.capacityTech
    );
  });
}

function buildVehicleMapFromList(list) {
  const map = {};
  for (const v of list) {
    const id = String(v?.vehicleId || v?.typeId || v?.kType || v?.id || "").trim();
    if (id) map[id] = v;
  }
  return map;
}

// Fetch vehicle details in batches, writing into the shared cache
async function fetchVehicleDetailsForIds(vehicleIds) {
  const BATCH_SIZE = 5;
  const result = {};

  for (let i = 0; i < vehicleIds.length; i += BATCH_SIZE) {
    const batch = vehicleIds.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (id) => {
        if (vehicleDetailCache.has(id)) return [id, vehicleDetailCache.get(id)];
        try {
          const data = await fetchVehicleDetails(id);
          vehicleDetailCache.set(id, data);
          return [id, data];
        } catch {
          return [id, null];
        }
      })
    );
    for (const [id, data] of batchResults) result[id] = data;
    if (i + BATCH_SIZE < vehicleIds.length) await sleep(300);
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

function normalizeTecdoc(articleResponse, vehicleDataById) {
  const article = articleResponse?.articles?.[0];
  if (!article) throw new Error("No article found");

  const compatibility = article.compatibleCars || [];

  const rows = compatibility.map((car) => {
    const raw    = vehicleDataById[String(car.vehicleId)] || null;
    const detail = raw ? extractVehicleDetail(raw) : null;

    // Engine codes: prefer vehicle detail, then fall back to anything on the car entry itself
    const rawCodes =
      detail?.engCodes       ||
      detail?.engineCodes    ||
      detail?.engineCode     ||
      car?.engCodes          ||
      car?.engineCodes       ||
      car?.engineCode        ||
      "";

    return {
      make:             car.manufacturerName || "",
      model:            car.modelName        || "",
      engine:           car.typeEngineName   || "",
      vehicle:          `${car.manufacturerName || ""} ${car.modelName || ""} ${car.typeEngineName || ""}`.trim(),
      production_years: formatYearRange(car.constructionIntervalStart, car.constructionIntervalEnd),
      kw:               cleanNumber(detail?.powerKw    ?? car?.powerKw),
      hp:               cleanNumber(detail?.powerPs    ?? car?.powerPs),
      cc:               cleanNumber(detail?.capacityTech ?? car?.capacityTech),
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

  // ── STEP 1: Try direct compatibility endpoint (1 call) ────────────────────
  // Preferred: returns vehicles with engine codes / kW / HP / CC already included.

  let vehicleDataById = {};
  let directUsed = false;

  const directList = await fetchCompatibleVehiclesDirect(articleNumber, dataSupplierId);
  if (directList && vehicleListHasEngineData(directList)) {
    vehicleDataById = buildVehicleMapFromList(directList);
    directUsed = true;
    console.log(`[Listing] ${articleNumber}: direct compat endpoint returned ${directList.length} vehicles with engine data`);
  }

  // ── STEP 2: OEM-based vehicle list (1 call, may include engine data) ──────
  if (!directUsed && oemNumbers.length > 0) {
    const oemList = await fetchVehiclesByOem(oemNumbers[0]);
    if (oemList && vehicleListHasEngineData(oemList)) {
      vehicleDataById = buildVehicleMapFromList(oemList);
      directUsed = true;
      console.log(`[Listing] ${articleNumber}: OEM vehicles endpoint returned ${oemList.length} vehicles with engine data`);
    }
  }

  // ── STEP 3: Fallback — individual vehicle detail calls (capped) ───────────
  // Only runs when neither direct endpoint returned engine-code data.
  if (!directUsed) {
    const vehicleIds  = uniq(cars.map((c) => String(c.vehicleId)).filter(Boolean));
    const alreadyCached = vehicleIds.filter((id) => vehicleDetailCache.has(id));
    const toFetch       = vehicleIds.filter((id) => !vehicleDetailCache.has(id)).slice(0, VEHICLE_FETCH_CAP);

    console.log(
      `[Listing] ${articleNumber}: fallback — ${alreadyCached.length} cached, fetching ${toFetch.length}/${vehicleIds.length} vehicle details`
    );

    if (toFetch.length > 0) {
      const fetched = await fetchVehicleDetailsForIds(toFetch);
      Object.assign(vehicleDataById, fetched);
    }

    // Merge in any already-cached entries
    for (const id of alreadyCached) {
      vehicleDataById[id] = vehicleDetailCache.get(id);
    }
  }

  // ── Normalize ─────────────────────────────────────────────────────────────
  const normalized = normalizeTecdoc(articleResponse, vehicleDataById);
  const kNumbers    = uniq(normalized.compatibility_rows.map((r) => r.k_number));
  const engineCodes = uniq(normalized.compatibility_rows.flatMap((r) => r.engine_codes || []));

  // ── Media ─────────────────────────────────────────────────────────────────
  const mediaResponse = await fetchArticleMedia(articleId);
  const articleImage  = extractFirstImageUrl(mediaResponse);

  // ── Build HTML ────────────────────────────────────────────────────────────
  const html = buildHtml({ ...normalized, engine_codes: engineCodes, k_numbers: kNumbers }, template);

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
    product_type:        normalized.product_name
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
