// ─── Listing Preferences — shared hook ───────────────────────────────────────
// Persists user-level defaults to localStorage.
// Import anywhere to read or update preferences.

const LS_KEY = "jsk_listing_prefs_v1";

export const PREF_DEFAULTS = {
  // General
  brand:             "",
  warranty:          "",
  countryOfMfr:      "",
  condition:         "",
  placement:         "",
  quantity:          "",
  // Localisation
  language:          "English (UK)",
  currency:          "GBP",
  // Template defaults
  defaultTemplateId: "",
  descriptionNote:   "",
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
