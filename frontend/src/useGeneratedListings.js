import { useState, useEffect } from "react";

const STORAGE_KEY = "jsk_generated_listings_v1";

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function buildEntry(result) {
  return {
    id:                  makeId(),
    savedAt:             new Date().toISOString(),
    status:              "Draft",
    title:               result.generated_title     || "",
    article_number:      result.article_number      || "",
    description_html:    result.generated_html      || "",
    item_specifics:      result.item_specifics      || [],
    specifications:      result.specifications      || [],
    oem_numbers:         result.oem_numbers         || [],
    engine_codes:        result.engine_codes        || [],
    compatibility_count: result.compatibility_count || 0,
    product_type:        result.product_type        || "",
    sku:                 result.sku             || "",
    bin_price:           "",
    article_image:       result.article_image       || "",
  };
}

export function useGeneratedListings() {
  const [listings, setListings] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(listings)); } catch {}
  }, [listings]);

  // Called automatically after every successful generation.
  // Deduplicates: if the same article was already saved today, update it instead.
  const autoSave = (result) => {
    setListings((prev) => {
      const todayDate = new Date().toISOString().slice(0, 10);
      const existingIdx = prev.findIndex(
        (l) => l.article_number === result.article_number &&
               l.savedAt.slice(0, 10) === todayDate
      );
      const entry = buildEntry(result);
      if (existingIdx >= 0) {
        // Update but preserve original id, savedAt, and user-set status
        const next = [...prev];
        next[existingIdx] = {
          ...entry,
          id:      prev[existingIdx].id,
          savedAt: prev[existingIdx].savedAt,
          status:  prev[existingIdx].status,
        };
        return next;
      }
      return [entry, ...prev];
    });
  };

  const updateStatus = (id, status) =>
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));

  const updateStatusBatch = (ids, status) =>
    setListings((prev) => prev.map((l) => ids.includes(l.id) ? { ...l, status } : l));

  // Merge any patch fields into a single listing (used by detail view saves & description generation)
  const updateListing = (id, patch) =>
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, ...patch } : l));

  const remove = (id) =>
    setListings((prev) => prev.filter((l) => l.id !== id));

  const removeBatch = (ids) =>
    setListings((prev) => prev.filter((l) => !ids.includes(l.id)));

  return { listings, autoSave, updateStatus, updateStatusBatch, updateListing, remove, removeBatch };
}
