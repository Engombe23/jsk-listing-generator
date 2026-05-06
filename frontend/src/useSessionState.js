import { useState, useCallback } from "react";

/**
 * Drop-in replacement for useState that persists the value in sessionStorage.
 * Survives page refresh; clears when the tab is closed.
 *
 * Usage:
 *   const [result, setResult] = useSessionState("my_key", null);
 */
export function useSessionState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored !== null) return JSON.parse(stored);
    } catch {}
    return typeof defaultValue === "function" ? defaultValue() : defaultValue;
  });

  const setValueAndStore = useCallback(
    (newValueOrFn) => {
      setValue((prev) => {
        const next =
          typeof newValueOrFn === "function" ? newValueOrFn(prev) : newValueOrFn;
        try {
          if (next === null || next === undefined) {
            sessionStorage.removeItem(key);
          } else {
            sessionStorage.setItem(key, JSON.stringify(next));
          }
        } catch {}
        return next;
      });
    },
    [key]
  );

  return [value, setValueAndStore];
}
