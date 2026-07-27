import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import { ThemeProvider } from "./context/ThemeContext";
import i18n from "./i18n/index.js";
import { getSiteLanguageByCode } from "./i18n/marketplaces.js";
import { loadPreferences } from "./useListingPreferences.js";

function LocaleApplier() {
  useEffect(() => {
    // Seeds siteLanguage from the browser when unset, then applies lang/dir.
    try {
      const prefs = loadPreferences();
      const code = prefs.siteLanguage || "en";
      i18n.changeLanguage(code);
      const lang = getSiteLanguageByCode(code);
      document.documentElement.dir  = lang?.dir  || "ltr";
      document.documentElement.lang = code;
    } catch {}
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
