import { useState, useEffect } from "react";

const STORAGE_KEY = "jsk_saved_products";

export function useSavedProducts() {
  const [products, setProducts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  const save = (product) => {
    setProducts((prev) => [
      { ...product, id: Date.now(), savedAt: new Date().toISOString() },
      ...prev
    ]);
  };

  const remove = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return { products, save, remove };
}
