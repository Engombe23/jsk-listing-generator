/** Sync <title> and meta description with the active i18n language. */
export function applyDocumentMeta(i18n) {
  if (typeof document === "undefined" || !i18n) return;
  const title = i18n.t("meta.documentTitle");
  if (title && title !== "meta.documentTitle") {
    document.title = title;
  }
  const description = i18n.t("meta.documentDescription");
  if (description && description !== "meta.documentDescription") {
    const el = document.querySelector('meta[name="description"]');
    if (el) el.setAttribute("content", description);
  }
}
