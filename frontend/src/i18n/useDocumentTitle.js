import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { applyDocumentMeta } from "./documentMeta.js";

/** Sets the browser tab title; restores the localized default on unmount. */
export function useDocumentTitle(title) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!title) {
      applyDocumentMeta(i18n);
      return undefined;
    }
    document.title = title;
    return () => applyDocumentMeta(i18n);
  }, [title, i18n, i18n.language]);
}
