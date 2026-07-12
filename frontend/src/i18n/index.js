import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import de from "./locales/de.json";
import fr from "./locales/fr.json";
import it from "./locales/it.json";
import es from "./locales/es.json";
import ar from "./locales/ar.json";
import tr from "./locales/tr.json";

// Load saved language before first render so there's no flash of English text.
function getInitialLanguage() {
  try {
    const prefs = JSON.parse(localStorage.getItem("jsk_listing_prefs_v1") || "{}");
    return prefs.siteLanguage || "en";
  } catch {
    return "en";
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      fr: { translation: fr },
      it: { translation: it },
      es: { translation: es },
      ar: { translation: ar },
      tr: { translation: tr },
    },
    lng: getInitialLanguage(),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    // No namespace — keep it flat for this app
    defaultNS: "translation",
    ns: ["translation"],
  });

export default i18n;
