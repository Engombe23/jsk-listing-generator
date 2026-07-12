// ─── Listing Preferences — shared module ─────────────────────────────────────
// Persists user-level listing defaults to localStorage.
// Import loadPreferences() anywhere to read current values.

const LS_KEY = "jsk_listing_prefs_v1";

export const PREF_DEFAULTS = {
  // General
  brand:             "",
  warranty:          "",
  countryOfMfr:      "",
  condition:         "",
  // Localisation
  language:          "English (UK)",
  currency:          "GBP",
  // Template defaults
  defaultTemplateId: "",
  shippingText:      "",
  returnsText:       "",
};

export function loadPreferences() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...PREF_DEFAULTS, ...JSON.parse(raw) } : { ...PREF_DEFAULTS };
  } catch {
    return { ...PREF_DEFAULTS };
  }
}

export function savePreferences(prefs) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(prefs)); } catch {}
}
