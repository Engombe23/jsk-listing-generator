// ─── Marketplace & Site Language config ──────────────────────────────────────
// Adding a new marketplace: add an entry here + a translation file in locales/.
// No application logic needs changing.

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
    const base = String(tag).toLowerCase().split("-")[0];
    if (supported.has(base)) return base;
  }
  return "en";
}

/**
 * Region → marketplace for common browser locales.
 * Checked before language-only fallback so en-GB → UK, de-AT → DE, ar-YE → AE, etc.
 */
const REGION_TO_MARKETPLACE = {
  gb: "ebay-uk", uk: "ebay-uk",
  de: "ebay-de", at: "ebay-de",
  fr: "ebay-fr", be: "ebay-fr", lu: "ebay-fr", mc: "ebay-fr",
  it: "ebay-it", sm: "ebay-it", va: "ebay-it",
  es: "ebay-es",
  tr: "ebay-tr",
  ae: "ebay-ae", sa: "ebay-ae", eg: "ebay-ae", ye: "ebay-ae",
  qa: "ebay-ae", kw: "ebay-ae", bh: "ebay-ae", om: "ebay-ae",
  jo: "ebay-ae", lb: "ebay-ae", iq: "ebay-ae", sy: "ebay-ae",
  ma: "ebay-ae", tn: "ebay-ae", dz: "ebay-ae",
  // Switzerland: prefer language of the tag (de-CH / fr-CH / it-CH handled below)
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

/** Map browser locale to the closest Target Marketplace id. */
export function detectBrowserMarketplace() {
  const candidates = browserLanguageTags();

  for (const tag of candidates) {
    const parts = String(tag).toLowerCase().replace(/_/g, "-").split("-");
    const lang = parts[0];
    const region = parts[1];

    // Switzerland / bilingual: use language half of the tag
    if (region === "ch") {
      if (lang === "fr") return "ebay-fr";
      if (lang === "it") return "ebay-it";
      if (lang === "de") return "ebay-de";
    }

    if (region && REGION_TO_MARKETPLACE[region]) {
      return REGION_TO_MARKETPLACE[region];
    }
  }

  for (const tag of candidates) {
    const lang = String(tag).toLowerCase().split(/[-_]/)[0];
    if (LANG_TO_MARKETPLACE[lang]) return LANG_TO_MARKETPLACE[lang];
  }

  return "ebay-uk";
}

/** Site language + marketplace + currency defaults from the browser locale. */
export function detectBrowserLocalisation() {
  const marketplaceId = detectBrowserMarketplace();
  const mp = getMarketplaceById(marketplaceId);
  return {
    siteLanguage: detectBrowserLanguage(),
    targetMarketplace: mp.id,
    currency: mp.currency,
  };
}

/** Prefer an explicitly saved siteLanguage; otherwise detect from the browser. */
export function resolveSiteLanguage(rawPrefs) {
  const saved = rawPrefs?.siteLanguage;
  if (typeof saved === "string" && SITE_LANGUAGES.some(l => l.code === saved)) {
    return saved;
  }
  return detectBrowserLanguage();
}
