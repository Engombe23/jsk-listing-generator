// ─── Listing Preferences — shared module ─────────────────────────────────────
// Persists user-level listing defaults to localStorage.
// Import loadPreferences() anywhere to read current values.

import {
  detectBrowserLanguage,
  detectBrowserLocalisation,
  getMarketplaceById,
} from "./i18n/marketplaces.js";

const LS_KEY = "jsk_listing_prefs_v1";

export const PREF_DEFAULTS = {
  // General
  brand:              "",
  warranty:           "",
  countryOfMfr:       "",
  condition:          "",
  // Localisation — static fallbacks; fresh installs seed from the browser
  siteLanguage:       "en",
  targetMarketplace:  "ebay-uk",
  currency:           "GBP",
  // Template defaults
  defaultTemplateId:  "",
  shippingText:       "",
  returnsText:        "",
};

/** Defaults for a new / reset prefs form: browser locale → marketplace + currency. */
export function getDefaultPreferences() {
  const loc = detectBrowserLocalisation();
  return {
    ...PREF_DEFAULTS,
    siteLanguage: loc.siteLanguage,
    targetMarketplace: loc.targetMarketplace,
    currency: loc.currency,
  };
}

export function loadPreferences() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      const prefs = getDefaultPreferences();
      savePreferences(prefs);
      return prefs;
    }

    const saved = JSON.parse(raw);
    let dirty = false;

    // Migrate legacy 'language' field → targetMarketplace (detect, don't force UK)
    if (saved.language && !saved.targetMarketplace) {
      saved.targetMarketplace = detectBrowserLocalisation().targetMarketplace;
      delete saved.language;
      dirty = true;
    }

    // Seed any localisation fields the user has never set.
    if (!saved.siteLanguage) {
      saved.siteLanguage = detectBrowserLanguage();
      dirty = true;
    }
    if (!saved.targetMarketplace) {
      saved.targetMarketplace = detectBrowserLocalisation().targetMarketplace;
      dirty = true;
    }
    if (!saved.currency) {
      const mp = getMarketplaceById(saved.targetMarketplace);
      saved.currency = mp.currency;
      dirty = true;
    }

    const merged = { ...PREF_DEFAULTS, ...saved };
    if (dirty) savePreferences(merged);
    return merged;
  } catch {
    return getDefaultPreferences();
  }
}

export function savePreferences(prefs) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(prefs)); } catch {}
}
