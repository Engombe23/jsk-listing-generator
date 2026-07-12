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
