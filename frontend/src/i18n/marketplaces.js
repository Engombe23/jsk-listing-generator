// ─── Marketplace & Site Language config ──────────────────────────────────────
// Adding a new marketplace: add an entry here + a translation file in locales/.
// No application logic needs changing.
//
// Auto localisation combines two signals:
//   1. Visitor country (IP via /api/geo) — primary for marketplace + language
//   2. Browser language/region — fallback when geo is unavailable, and to
//      disambiguate bilingual countries (CH, BE). Account overrides always win.

export const MARKETPLACES = [
  { id: "ebay-uk", label: "eBay UK",          language: "en", locale: "en-GB", currency: "GBP", flag: "🇬🇧", dir: "ltr" },
  { id: "ebay-de", label: "eBay Germany",     language: "de", locale: "de-DE", currency: "EUR", flag: "🇩🇪", dir: "ltr" },
  { id: "ebay-fr", label: "eBay France",      language: "fr", locale: "fr-FR", currency: "EUR", flag: "🇫🇷", dir: "ltr" },
  { id: "ebay-it", label: "eBay Italy",       language: "it", locale: "it-IT", currency: "EUR", flag: "🇮🇹", dir: "ltr" },
  { id: "ebay-es", label: "eBay Spain",       language: "es", locale: "es-ES", currency: "EUR", flag: "🇪🇸", dir: "ltr" },
  { id: "ebay-ae", label: "eBay Middle East", language: "ar", locale: "ar-AE", currency: "USD", flag: "🇦🇪", dir: "rtl" },
  { id: "ebay-tr", label: "eBay Turkey",      language: "tr", locale: "tr-TR", currency: "TRY", flag: "🇹🇷", dir: "ltr" },
];

export const SITE_LANGUAGES = [
  { code: "en", label: "English",    flag: "🇬🇧", dir: "ltr" },
  { code: "fr", label: "Français",   flag: "🇫🇷", dir: "ltr" },
  { code: "de", label: "Deutsch",    flag: "🇩🇪", dir: "ltr" },
  { code: "it", label: "Italiano",   flag: "🇮🇹", dir: "ltr" },
  { code: "es", label: "Español",    flag: "🇪🇸", dir: "ltr" },
  { code: "ar", label: "العربية",    flag: "🇦🇪", dir: "rtl" },
  { code: "tr", label: "Türkçe",     flag: "🇹🇷", dir: "ltr" },
];

const GEO_CACHE_KEY = "jsk_geo_localisation_v1";

/** ISO country → site language (UI). Unlisted countries → English. */
const COUNTRY_TO_LANGUAGE = {
  GB: "en", UK: "en", IE: "en", US: "en", AU: "en", NZ: "en", CA: "en",
  ZA: "en", SG: "en", MT: "en", CY: "en",
  FR: "fr", BE: "fr", LU: "fr", MC: "fr",
  DE: "de", AT: "de", LI: "de",
  IT: "it", SM: "it", VA: "it",
  ES: "es", AD: "es",
  TR: "tr",
  AE: "ar", SA: "ar", EG: "ar", YE: "ar", QA: "ar", KW: "ar", BH: "ar",
  OM: "ar", JO: "ar", LB: "ar", IQ: "ar", SY: "ar", MA: "ar", TN: "ar", DZ: "ar",
  CH: "de",
};

/** ISO country → Target Marketplace. Unlisted → eBay UK. */
const COUNTRY_TO_MARKETPLACE = {
  GB: "ebay-uk", UK: "ebay-uk", IE: "ebay-uk", US: "ebay-uk", AU: "ebay-uk",
  NZ: "ebay-uk", CA: "ebay-uk", ZA: "ebay-uk", SG: "ebay-uk", MT: "ebay-uk", CY: "ebay-uk",
  FR: "ebay-fr", BE: "ebay-fr", LU: "ebay-fr", MC: "ebay-fr",
  DE: "ebay-de", AT: "ebay-de", LI: "ebay-de", CH: "ebay-de",
  IT: "ebay-it", SM: "ebay-it", VA: "ebay-it",
  ES: "ebay-es", AD: "ebay-es",
  TR: "ebay-tr",
  AE: "ebay-ae", SA: "ebay-ae", EG: "ebay-ae", YE: "ebay-ae", QA: "ebay-ae",
  KW: "ebay-ae", BH: "ebay-ae", OM: "ebay-ae", JO: "ebay-ae", LB: "ebay-ae",
  IQ: "ebay-ae", SY: "ebay-ae", MA: "ebay-ae", TN: "ebay-ae", DZ: "ebay-ae",
};

const LANG_TO_MARKETPLACE = {
  en: "ebay-uk",
  de: "ebay-de",
  fr: "ebay-fr",
  it: "ebay-it",
  es: "ebay-es",
  ar: "ebay-ae",
  tr: "ebay-tr",
};

/** Countries where browser language should pick among fr/de/it. */
const BILINGUAL_COUNTRIES = new Set(["CH", "BE"]);

export function getMarketplaceById(id) {
  return MARKETPLACES.find(m => m.id === id) || MARKETPLACES[0];
}

export function getSiteLanguageByCode(code) {
  return SITE_LANGUAGES.find(l => l.code === code) || SITE_LANGUAGES[0];
}

function browserLanguageTags() {
  return [
    ...(typeof navigator !== "undefined" && Array.isArray(navigator.languages) ? navigator.languages : []),
    typeof navigator !== "undefined" ? navigator.language : null,
  ].filter(Boolean);
}

/** Map browser language tags (e.g. ar-YE, de-DE) to a supported site language code. */
export function detectBrowserLanguage() {
  const supported = new Set(SITE_LANGUAGES.map(l => l.code));
  for (const tag of browserLanguageTags()) {
    const base = String(tag).toLowerCase().split(/[-_]/)[0];
    if (supported.has(base)) return base;
  }
  return "en";
}

/**
 * Map browser locale to the closest Target Marketplace id.
 * Uses region when present (en-GB → UK, ar-YE → AE), else language.
 */
export function detectBrowserMarketplace() {
  const candidates = browserLanguageTags();

  for (const tag of candidates) {
    const parts = String(tag).toLowerCase().replace(/_/g, "-").split("-");
    const lang = parts[0];
    const region = parts[1]?.toUpperCase();

    if (region === "CH") {
      if (lang === "fr") return "ebay-fr";
      if (lang === "it") return "ebay-it";
      if (lang === "de") return "ebay-de";
    }

    if (region && COUNTRY_TO_MARKETPLACE[region]) {
      return COUNTRY_TO_MARKETPLACE[region];
    }
  }

  for (const tag of candidates) {
    const lang = String(tag).toLowerCase().split(/[-_]/)[0];
    if (LANG_TO_MARKETPLACE[lang]) return LANG_TO_MARKETPLACE[lang];
  }

  return "ebay-uk";
}

/** Site language + marketplace + currency from the browser locale only. */
export function detectBrowserLocalisation() {
  const siteLanguage = detectBrowserLanguage();
  const targetMarketplace = detectBrowserMarketplace();
  const mp = getMarketplaceById(targetMarketplace);
  return {
    source: "browser",
    country: null,
    siteLanguage,
    targetMarketplace: mp.id,
    currency: mp.currency,
  };
}

/**
 * Build localisation from an ISO country code, optionally refined by browser
 * language for bilingual countries (Switzerland, Belgium).
 */
export function localisationFromCountry(countryCode, browserLang = detectBrowserLanguage()) {
  const country = String(countryCode || "").trim().toUpperCase();
  if (!country) return detectBrowserLocalisation();

  let siteLanguage = COUNTRY_TO_LANGUAGE[country] || "en";
  let targetMarketplace = COUNTRY_TO_MARKETPLACE[country] || "ebay-uk";

  if (BILINGUAL_COUNTRIES.has(country) && ["fr", "de", "it"].includes(browserLang)) {
    siteLanguage = browserLang;
    targetMarketplace = LANG_TO_MARKETPLACE[browserLang] || targetMarketplace;
  }

  const mp = getMarketplaceById(targetMarketplace);
  const supported = new Set(SITE_LANGUAGES.map(l => l.code));
  if (!supported.has(siteLanguage)) siteLanguage = "en";

  return {
    source: "country",
    country,
    siteLanguage,
    targetMarketplace: mp.id,
    currency: mp.currency,
  };
}

function readGeoCache() {
  try {
    if (typeof sessionStorage === "undefined") return null;
    const raw = sessionStorage.getItem(GEO_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.siteLanguage && parsed?.targetMarketplace) return parsed;
  } catch {}
  return null;
}

function writeGeoCache(loc) {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(loc));
  } catch {}
}

/** Sync snapshot: cached geo → else browser localisation. */
export function getCachedLocalisation() {
  return readGeoCache() || detectBrowserLocalisation();
}

let _geoPromise = null;

/**
 * Prefer IP country (/api/geo); if geo is unavailable, fall back to browser language/region.
 */
export function fetchVisitorLocalisation() {
  const cached = readGeoCache();
  if (cached) return Promise.resolve(cached);

  if (!_geoPromise) {
    _geoPromise = fetch("/api/geo")
      .then((res) => {
        if (!res.ok) throw new Error(`geo ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const country = String(data?.country || "").trim().toUpperCase();
        if (!country || country === "XX") throw new Error("geo unknown");
        const loc = localisationFromCountry(country);
        writeGeoCache(loc);
        return loc;
      })
      .catch(() => {
        const loc = detectBrowserLocalisation();
        writeGeoCache(loc);
        return loc;
      });
  }
  return _geoPromise;
}

/**
 * Sync language for first paint.
 * User-chosen siteLanguage wins; otherwise cached country/browser auto language.
 */
export function resolveSiteLanguage(rawPrefs) {
  if (
    rawPrefs?.siteLanguageSetByUser &&
    typeof rawPrefs.siteLanguage === "string" &&
    SITE_LANGUAGES.some((l) => l.code === rawPrefs.siteLanguage)
  ) {
    return rawPrefs.siteLanguage;
  }
  return getCachedLocalisation().siteLanguage;
}
