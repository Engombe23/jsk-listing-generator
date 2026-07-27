// ─── Listing Preferences — shared module ─────────────────────────────────────
// Persists user-level listing defaults to localStorage.
// Import loadPreferences() anywhere to read current values.

import {
  fetchVisitorLocalisation,
  getCachedLocalisation,
  getMarketplaceById,
} from "./i18n/marketplaces.js";

const LS_KEY = "jsk_listing_prefs_v1";

export const PREF_DEFAULTS = {
  // General
  brand:              "",
  warranty:           "",
  countryOfMfr:       "",
  condition:          "",
  // Localisation — auto defaults from IP country (browser fallback)
  siteLanguage:       "en",
  targetMarketplace:  "ebay-uk",
  currency:           "GBP",
  siteLanguageSetByUser: false,
  marketplaceSetByUser:  false,
  // Template defaults
  defaultTemplateId:  "",
  shippingText:       "",
  returnsText:        "",
};

/** Sync defaults for forms: cached geo/browser localisation. */
export function getDefaultPreferences() {
  const loc = getCachedLocalisation();
  return {
    ...PREF_DEFAULTS,
    siteLanguage: loc.siteLanguage,
    targetMarketplace: loc.targetMarketplace,
    currency: loc.currency,
    siteLanguageSetByUser: false,
    marketplaceSetByUser: false,
  };
}

/** Async defaults from live IP country / browser fallback (Reset). */
export async function getDefaultPreferencesAsync() {
  const loc = await fetchVisitorLocalisation();
  return {
    ...PREF_DEFAULTS,
    siteLanguage: loc.siteLanguage,
    targetMarketplace: loc.targetMarketplace,
    currency: loc.currency,
    siteLanguageSetByUser: false,
    marketplaceSetByUser: false,
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

    if (saved.language && !saved.targetMarketplace) {
      saved.targetMarketplace = getCachedLocalisation().targetMarketplace;
      delete saved.language;
      dirty = true;
    }

    if (saved.siteLanguageSetByUser == null) {
      saved.siteLanguageSetByUser = false;
      dirty = true;
    }
    if (saved.marketplaceSetByUser == null) {
      saved.marketplaceSetByUser = false;
      dirty = true;
    }

    if (!saved.siteLanguageSetByUser) {
      const loc = getCachedLocalisation();
      if (saved.siteLanguage !== loc.siteLanguage) {
        saved.siteLanguage = loc.siteLanguage;
        dirty = true;
      }
    }
    if (!saved.marketplaceSetByUser) {
      const loc = getCachedLocalisation();
      if (saved.targetMarketplace !== loc.targetMarketplace || saved.currency !== loc.currency) {
        saved.targetMarketplace = loc.targetMarketplace;
        saved.currency = loc.currency;
        dirty = true;
      }
    } else if (!saved.currency && saved.targetMarketplace) {
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

/**
 * Apply IP-country (or browser fallback) localisation when the user has not locked prefs.
 */
export async function applyVisitorLocalisation() {
  const loc = await fetchVisitorLocalisation();
  const prefs = loadPreferences();
  let dirty = false;
  const next = { ...prefs };

  if (!prefs.siteLanguageSetByUser && prefs.siteLanguage !== loc.siteLanguage) {
    next.siteLanguage = loc.siteLanguage;
    dirty = true;
  }
  if (!prefs.marketplaceSetByUser) {
    if (prefs.targetMarketplace !== loc.targetMarketplace || prefs.currency !== loc.currency) {
      next.targetMarketplace = loc.targetMarketplace;
      next.currency = loc.currency;
      dirty = true;
    }
  }

  if (dirty) savePreferences(next);
  return next;
}

export function savePreferences(prefs) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(prefs)); } catch {}
}
