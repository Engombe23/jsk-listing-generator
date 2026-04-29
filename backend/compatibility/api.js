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

// ─── VIN ──────────────────────────────────────────────────────────────────────

export async function lookupVehicleByVin(vin) {
  const cleaned = String(vin).trim().replace(/\s+/g, "").toUpperCase();
  const url = `https://${RAPIDAPI_HOST}/api/vin/decoder-v5/${cleaned}`;

  const res = await fetch(url, {
    method: "GET",
    headers: apiHeaders()
  });

  if (!res.ok) throw new Error(`VIN lookup failed for "${vin}": HTTP ${res.status}`);
  return res.json();
}

// ─── Manufacturer / Model / Vehicle Type browse ───────────────────────────────

// Cache manufacturers list — it's large and rarely changes
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

export async function listVehicleTypesByModel(modelId) {
  const url = `https://${RAPIDAPI_HOST}/api/models/type-id/${TYPE_ID}/model-id/${modelId}/lang-id/${LANG_ID}/country-filter-id/${COUNTRY_FILTER_ID}`;
  const res = await fetch(url, { method: "GET", headers: apiHeaders() });
  if (!res.ok) throw new Error(`Failed to get vehicle types for model ${modelId}: HTTP ${res.status}`);
  return res.json();
}

// Full spec for a single vehicle type (KW, HP, fuel, engine code, cylinders, etc.)
export async function getVehicleTypeDetails(vehicleId) {
  const url = `https://${RAPIDAPI_HOST}/api/types/type-id/${TYPE_ID}/vehicle-type-details/${vehicleId}/lang-id/${LANG_ID}/country-filter-id/${COUNTRY_FILTER_ID}`;
  const res = await fetch(url, { method: "GET", headers: apiHeaders() });
  if (!res.ok) return null;
  return res.json();
}

// ─── OEM / Article ───────────────────────────────────────────────────────────

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

export async function searchPartsByVehicle(vehicleId) {
  const url = `https://${RAPIDAPI_HOST}/api/articles-oem/selecting-oem-parts-vehicle-modification-description-product-group/type-id/${TYPE_ID}/vehicle-id/${vehicleId}/lang-id/${LANG_ID}/search-param/filter`;

  try {
    const res = await fetch(url, { method: "GET", headers: apiHeaders() });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

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
