import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import { ThemeProvider } from "./context/ThemeContext";
import i18n from "./i18n/index.js";
import { SITE_LANGUAGES } from "./i18n/marketplaces.js";

function LocaleApplier() {
  useEffect(() => {
    // Apply saved language and direction on first mount
    try {
      const prefs = JSON.parse(localStorage.getItem("jsk_listing_prefs_v1") || "{}");
      const code = prefs.siteLanguage || "en";
      i18n.changeLanguage(code);
      const lang = SITE_LANGUAGES.find(l => l.code === code);
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
