// ─── Listing Preferences — shared module ─────────────────────────────────────
// Persists user-level listing defaults to localStorage.
// Import loadPreferences() anywhere to read current values.

const LS_KEY = "jsk_listing_prefs_v1";

export const PREF_DEFAULTS = {
  // General
  brand:              "",
  warranty:           "",
  countryOfMfr:       "",
  condition:          "",
  // Localisation
  siteLanguage:       "en",       // controls app UI language (i18next)
  targetMarketplace:  "ebay-uk",  // controls listing output language / format
  currency:           "GBP",
  // Template defaults
  defaultTemplateId:  "",
  shippingText:       "",
  returnsText:        "",
};

export function loadPreferences() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...PREF_DEFAULTS };
    const saved = JSON.parse(raw);
    // Migrate legacy 'language' field → targetMarketplace
    if (saved.language && !saved.targetMarketplace) {
      saved.targetMarketplace = "ebay-uk";
      delete saved.language;
    }
    return { ...PREF_DEFAULTS, ...saved };
  } catch {
    return { ...PREF_DEFAULTS };
  }
}

export function savePreferences(prefs) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(prefs)); } catch {}
}
