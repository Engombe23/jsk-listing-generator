import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import { ThemeProvider } from "./context/ThemeContext";
import i18n from "./i18n/index.js";
import { getSiteLanguageByCode } from "./i18n/marketplaces.js";
import { applyVisitorLocalisation } from "./useListingPreferences.js";

function applyDocumentLocale(code) {
  const lang = getSiteLanguageByCode(code);
  document.documentElement.dir = lang?.dir || "ltr";
  document.documentElement.lang = code;
  i18n.changeLanguage(code);
}

function LocaleApplier() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prefs = await applyVisitorLocalisation();
        if (cancelled) return;
        applyDocumentLocale(prefs.siteLanguage || "en");
      } catch {
        if (!cancelled) applyDocumentLocale(i18n.language || "en");
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return null;
}

export default function Providers() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <LocaleApplier />
        <Outlet />
      </SessionProvider>
    </ThemeProvider>
  );
}
