import { LANG_ID, TYPE_ID, COUNTRY_FILTER_ID } from "./config.js";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "autodoc-parts-catalog.p.rapidapi.com";

function apiHeaders(includeContentType = false) {
  const headers = {
    "x-rapidapi-key": RAPIDAPI_KEY,
    "x-rapidapi-host": RAPIDAPI_HOST
  };
  if (includeContentType) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }
  return headers;
}

// ─── 1. TecDoc VIN Check (legacy — kept for reference) ───────────────────────
// GET /api/vin/tecdoc-vin-check/{vin}

export async function tecdocVinCheck(vin) {
  const cleaned = String(vin).trim().replace(/\s+/g, "").toUpperCase();
  const url = `https://${RAPIDAPI_HOST}/api/vin/tecdoc-vin-check/${cleaned}`;

  const res = await fetch(url, {
    method: "GET",
    headers: apiHeaders()
  });

  if (!res.ok) throw new Error(`TecDoc VIN check failed for "${vin}": HTTP ${res.status}`);
  return res.json();
}

// ─── 1b. VIN Decoder v3 ───────────────────────────────────────────────────────
// GET /api/vin/decoder-v3/{vin}
// Returns an array of matching vehicles (may be 0, 1, or many).

export async function decodeVin(vin) {
  const cleaned = String(vin).trim().replace(/\s+/g, "").toUpperCase();
  const url = `https://${RAPIDAPI_HOST}/api/vin/decoder-v3/${cleaned}`;
  const res = await fetch(url, { method: "GET", headers: apiHeaders() });
  if (!res.ok) throw new Error(`VIN decode failed for "${vin}": HTTP ${res.status}`);
  return res.json();
}

// ─── 2. Vehicle Type Details ──────────────────────────────────────────────────
// GET /api/types/type-id/1/vehicle-type-details/{vehicleId}/lang-id/4/country-filter-id/63

export async function getVehicleTypeDetails(vehicleId) {
  const url = `https://${RAPIDAPI_HOST}/api/types/type-id/${TYPE_ID}/vehicle-type-details/${vehicleId}/lang-id/${LANG_ID}/country-filter-id/${COUNTRY_FILTER_ID}`;
  const res = await fetch(url, { method: "GET", headers: apiHeaders() });
  if (!res.ok) return null;
  return res.json();
}

// ─── 3. Search Articles by OEM — primary ─────────────────────────────────────
// POST /api/articles-oem/article-oem-search-no  body: langId=4&articleOemNo={oem}

export async function searchArticleByOem(oemNumber) {
  const url = `https://${RAPIDAPI_HOST}/api/articles-oem/article-oem-search-no`;

  const params = new URLSearchParams();
  params.append("langId", LANG_ID);
  params.append("articleOemNo", oemNumber);

  const res = await fetch(url, {
    method: "POST",
    headers: apiHeaders(true),
    body: params.toString()
  });

  if (!res.ok) throw new Error(`OEM search failed for "${oemNumber}": HTTP ${res.status}`);
  return res.json();
}

// ─── 4. Search Articles by Article No — fallback ──────────────────────────────
// GET /api/artlookup/search-articles-by-article-no?langId=4&articleNo={oem}&articleType=OENumber

export async function artlookupByArticleNo(articleNo) {
  const params = new URLSearchParams();
  params.append("langId", LANG_ID);
  params.append("articleNo", articleNo);
  params.append("articleType", "OENumber");

  const url = `https://${RAPIDAPI_HOST}/api/artlookup/search-articles-by-article-no?${params.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: apiHeaders()
  });

  if (!res.ok) throw new Error(`Artlookup search failed for "${articleNo}": HTTP ${res.status}`);
  return res.json();
}

// ─── 5. Article details by article number ─────────────────────────────────────
// POST /api/articles/article-number-details

export async function getArticleDetails(articleNumber) {
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

  if (!res.ok) throw new Error(`Article details fetch failed for "${articleNumber}": HTTP ${res.status}`);
  return res.json();
}

// ─── 6. Get OEM numbers by list of article IDs ────────────────────────────────
// POST /api/articles/get-oems-by-list-of-articles-ids  body: articleId={id}

export async function getOemsByArticleIds(articleIds) {
  const url = `https://${RAPIDAPI_HOST}/api/articles/get-oems-by-list-of-articles-ids`;

  const params = new URLSearchParams();
  for (const id of articleIds) {
    params.append("articleId", String(id));
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: apiHeaders(true),
      body: params.toString()
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ─── 7. List ALL vehicles compatible with an OEM number (KEY endpoint) ─────────
// POST /api/articles-oem/selecting-a-list-of-cars-for-oem-part-number
//   body: langId=4&articleOemNo={oem}
// Returns array of vehicles with vehicleId fields.

export async function getVehiclesByOem(oemNumber) {
  const url = `https://${RAPIDAPI_HOST}/api/articles-oem/selecting-a-list-of-cars-for-oem-part-number`;

  const params = new URLSearchParams();
  params.append("langId", LANG_ID);
  params.append("articleOemNo", oemNumber);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: apiHeaders(true),
      body: params.toString()
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ─── 8. OEM parts by vehicle ID ───────────────────────────────────────────────
// GET /api/articles-oem/selecting-oem-parts-vehicle-modification-description-product-group/
//   type-id/1/vehicle-id/{vehicleId}/lang-id/4/search-param/filter

export async function searchPartsByVehicle(vehicleId, searchParam = "filter") {
  const url = `https://${RAPIDAPI_HOST}/api/articles-oem/selecting-oem-parts-vehicle-modification-description-product-group/type-id/${TYPE_ID}/vehicle-id/${vehicleId}/lang-id/${LANG_ID}/search-param/${encodeURIComponent(searchParam)}`;

  try {
    const res = await fetch(url, { method: "GET", headers: apiHeaders() });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ─── 9. Equivalent OEM numbers ────────────────────────────────────────────────
// POST /api/articles-oem/all-equal-oem-no  body: langId=4&articleOemNo={oem}

export async function getEquivalentOems(oemNumber) {
  const url = `https://${RAPIDAPI_HOST}/api/articles-oem/all-equal-oem-no`;

  const params = new URLSearchParams();
  params.append("langId", LANG_ID);
  params.append("articleOemNo", oemNumber);

  const res = await fetch(url, {
    method: "POST",
    headers: apiHeaders(true),
    body: params.toString()
  });

  if (!res.ok) throw new Error(`Equivalent OEMs fetch failed for "${oemNumber}": HTTP ${res.status}`);
  return res.json();
}

// ─── 10. Complete article details by article ID ───────────────────────────────
// POST /api/articles/article-id-complete-details
// More complete than article-number-details — includes OEM numbers, attributes, etc.

export async function getArticleDetailsById(articleId) {
  const url = `https://${RAPIDAPI_HOST}/api/articles/article-id-complete-details`;

  const params = new URLSearchParams();
  params.append("typeId", TYPE_ID);
  params.append("langId", LANG_ID);
  params.append("articleId", String(articleId));
  params.append("countryFilterId", COUNTRY_FILTER_ID);

  const res = await fetch(url, {
    method: "POST",
    headers: apiHeaders(true),
    body: params.toString()
  });

  if (!res.ok) throw new Error(`Article complete details fetch failed for ID "${articleId}": HTTP ${res.status}`);
  return res.json();
}

// ─── 11. Compatible vehicles by article number + supplier ID ──────────────────
// GET /api/articles/get-compatible-cars-by-article-number/type-id/{typeId}
//   ?langId=4&supplierId={supplierId}&articleNo={articleNo}&countryFilterId=63

export async function getCompatibleCarsByArticleNo(articleNo, supplierId) {
  const params = new URLSearchParams();
  params.append("langId", LANG_ID);
  params.append("supplierId", String(supplierId));
  params.append("articleNo", articleNo);
  params.append("countryFilterId", COUNTRY_FILTER_ID);

  const url = `https://${RAPIDAPI_HOST}/api/articles/get-compatible-cars-by-article-number/type-id/${TYPE_ID}?${params.toString()}`;

  console.log(`[getCompatibleCars] URL: ${url}`);

  try {
    const res = await fetch(url, { method: "GET", headers: apiHeaders() });
    console.log(`[getCompatibleCars] HTTP ${res.status}`);
    if (!res.ok) return [];
    const data = await res.json();
    console.log(`[getCompatibleCars] raw response (first 400): ${JSON.stringify(data).slice(0, 400)}`);
    return data;
  } catch (err) {
    console.log(`[getCompatibleCars] threw: ${err.message}`);
    return [];
  }
}

// ─── Article media ────────────────────────────────────────────────────────────
// POST /api/articles/article-all-media-info

export async function getArticleMedia(articleId) {
  const url = `https://${RAPIDAPI_HOST}/api/articles/article-all-media-info`;

  const params = new URLSearchParams();
  params.append("langId", LANG_ID);
  params.append("articleId", String(articleId));

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: apiHeaders(true),
      body: params.toString()
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Manufacturer list with in-memory cache ───────────────────────────────────

let _manufacturersCache = null;

export async function listManufacturers() {
  if (_manufacturersCache) return _manufacturersCache;
  const url = `https://${RAPIDAPI_HOST}/api/manufacturers/list/type-id/${TYPE_ID}`;
  const res = await fetch(url, { method: "GET", headers: apiHeaders() });
  if (!res.ok) throw new Error(`Failed to list manufacturers: HTTP ${res.status}`);
  const data = await res.json();
  _manufacturersCache = Array.isArray(data) ? data : (data?.data || data?.manufacturers || []);
  return _manufacturersCache;
}

export async function listModelsByManufacturer(manufacturerId) {
  const url = `https://${RAPIDAPI_HOST}/api/models/list/type-id/${TYPE_ID}/manufacturer-id/${manufacturerId}/lang-id/${LANG_ID}/country-filter-id/${COUNTRY_FILTER_ID}`;
  const res = await fetch(url, { method: "GET", headers: apiHeaders() });
  if (!res.ok) throw new Error(`Failed to list models for manufacturer ${manufacturerId}: HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.data || data?.models || []);
}

// ─── List all product/part names ──────────────────────────────────────────────
// GET /api/category/list-products-names/lang-id/4
// Returns every known part category name — useful for normalising product types.

let _productNamesCache = null;

export async function listProductNames() {
  if (_productNamesCache) return _productNamesCache;
  const url = `https://${RAPIDAPI_HOST}/api/category/list-products-names/lang-id/${LANG_ID}`;
  const res = await fetch(url, { method: "GET", headers: apiHeaders() });
  if (!res.ok) throw new Error(`Failed to list product names: HTTP ${res.status}`);
  const data = await res.json();
  _productNamesCache = Array.isArray(data) ? data : (data?.data || data?.categories || []);
  return _productNamesCache;
}

// ─── Vehicle spare part criteria (all categories for a vehicle) ───────────────
// GET /api/types/selecting-all-criteria-for-spare-parts-of-a-passenger-car-using-an-olap-query
//   /type-id/{typeId}/lang-id/{langId}/country-filter-id/{countryFilterId}/vehicle-id/{vehicleId}
// Returns all spare-part categories (with categoryId) available for a given vehicle.

export async function getVehicleSparePartCriteria(vehicleId) {
  const url = `https://${RAPIDAPI_HOST}/api/types/selecting-all-criteria-for-spare-parts-of-a-passenger-car-using-an-olap-query/type-id/${TYPE_ID}/lang-id/${LANG_ID}/country-filter-id/${COUNTRY_FILTER_ID}/vehicle-id/${vehicleId}`;
  try {
    const res = await fetch(url, { method: "GET", headers: apiHeaders() });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ─── Article list by vehicle ID and category ID ───────────────────────────────
// POST /api/articles/list-articles
// body: langId, typeId, categoryId, vehicleId
// Returns all articles (parts) for a specific vehicle + part category combination.

export async function listArticlesByVehicleAndCategory(vehicleId, categoryId) {
  const url = `https://${RAPIDAPI_HOST}/api/articles/list-articles`;

  const params = new URLSearchParams();
  params.append("langId", LANG_ID);
  params.append("typeId", TYPE_ID);
  params.append("countryFilterId", COUNTRY_FILTER_ID);
  params.append("categoryId", String(categoryId));
  if (vehicleId != null) params.append("vehicleId", String(vehicleId));

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: apiHeaders(true),
      body: params.toString()
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
