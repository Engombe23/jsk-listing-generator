import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import de from "./locales/de.json";
import fr from "./locales/fr.json";
import it from "./locales/it.json";
import es from "./locales/es.json";
import ar from "./locales/ar.json";
import tr from "./locales/tr.json";

import landingEn from "./locales/landing/en.json";
import landingDe from "./locales/landing/de.json";
import landingFr from "./locales/landing/fr.json";
import landingIt from "./locales/landing/it.json";
import landingEs from "./locales/landing/es.json";
import landingAr from "./locales/landing/ar.json";
import landingTr from "./locales/landing/tr.json";

import guidesEn from "./locales/guides/en.json";
import guidesDe from "./locales/guides/de.json";
import guidesFr from "./locales/guides/fr.json";
import guidesIt from "./locales/guides/it.json";
import guidesEs from "./locales/guides/es.json";
import guidesAr from "./locales/guides/ar.json";
import guidesTr from "./locales/guides/tr.json";

// Full help-guide article bodies (English source of truth under frontend/src/help/articles/)
import articlesEn from "../help/articles/en.json";
import articlesDe from "../help/articles/de.json";
import articlesFr from "../help/articles/fr.json";
import articlesIt from "../help/articles/it.json";
import articlesEs from "../help/articles/es.json";
import articlesAr from "../help/articles/ar.json";
import articlesTr from "../help/articles/tr.json";

import { resolveSiteLanguage, getSiteLanguageByCode } from "./marketplaces.js";
import { applyDocumentMeta } from "./documentMeta.js";

function withPacks(base, landingPack, guidesPack, articlesPack) {
  const { authExtra, marketing, footer, landing } = landingPack;
  const { articleBodies: _ignored, ...helpRest } = guidesPack.help || {};
  return {
    ...base,
    marketing,
    footer,
    landing,
    auth: { ...base.auth, ...authExtra },
    ...guidesPack,
    help: {
      ...helpRest,
      articleBodies: articlesPack,
    },
  };
}

// First paint: user override, else cached country/browser language.
// LocaleApplier then refreshes from /api/geo when language was not set by the user.
function getInitialLanguage() {
  try {
    const raw = JSON.parse(localStorage.getItem("jsk_listing_prefs_v1") || "{}");
    return resolveSiteLanguage(raw);
  } catch {
    return "en";
  }
}

const initialLng = getInitialLanguage();
const initialLang = getSiteLanguageByCode(initialLng);
if (typeof document !== "undefined") {
  document.documentElement.lang = initialLng;
  document.documentElement.dir = initialLang.dir || "ltr";
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: withPacks(en, landingEn, guidesEn, articlesEn) },
      de: { translation: withPacks(de, landingDe, guidesDe, articlesDe) },
      fr: { translation: withPacks(fr, landingFr, guidesFr, articlesFr) },
      it: { translation: withPacks(it, landingIt, guidesIt, articlesIt) },
      es: { translation: withPacks(es, landingEs, guidesEs, articlesEs) },
      ar: { translation: withPacks(ar, landingAr, guidesAr, articlesAr) },
      tr: { translation: withPacks(tr, landingTr, guidesTr, articlesTr) },
    },
    lng: initialLng,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    defaultNS: "translation",
    ns: ["translation"],
  });

applyDocumentMeta(i18n);
i18n.on("languageChanged", () => applyDocumentMeta(i18n));

export default i18n;
