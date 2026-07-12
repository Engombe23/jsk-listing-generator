import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({ theme: "light", setTheme: () => {} });

function resolveEffective(theme) {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem("jsk_app_theme") || "light"; }
    catch { return "light"; }
  });

  const applyTheme = (t) => {
    document.documentElement.setAttribute("data-theme", resolveEffective(t));
  };

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem("jsk_app_theme", theme); } catch {}
  }, [theme]);

  // Keep system theme in sync with OS preference
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
