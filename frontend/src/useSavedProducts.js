import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabaseClient";
import { useSession } from "./context/SessionContext";
import { productFromRow, productToRow } from "./lib/savedDataMappers";

const LOCAL_KEY = "jsk_saved_products";
const migratedKey = (userId) => `jsk_migrated_products_${userId}`;

function readLocalProducts() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function migrateLocalProducts(userId) {
  if (!userId || localStorage.getItem(migratedKey(userId))) return;
  const local = readLocalProducts();
  if (local.length === 0) {
    localStorage.setItem(migratedKey(userId), "1");
    return;
  }

  const rows = local.map((item) => ({
    user_id: userId,
    ...productToRow({
      ...item,
      savedAt: item.savedAt || new Date().toISOString(),
    }),
  }));

  const { error } = await supabase.from("saved_products").insert(rows);
  if (error) {
    console.warn("[saved_products] localStorage migration failed:", error.message);
    return;
  }

  localStorage.setItem(migratedKey(userId), "1");
  try {
    localStorage.removeItem(LOCAL_KEY);
  } catch {
    /* ignore */
  }
}

export function useSavedProducts() {
  const { session } = useSession();
  const userId = session?.user?.id ?? null;
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(!!userId);

  const loadProducts = useCallback(async (uid) => {
    if (!uid) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      await migrateLocalProducts(uid);

      const { data, error } = await supabase
        .from("saved_products")
        .select("*")
        .eq("user_id", uid)
        .order("saved_at", { ascending: false });

      if (error) {
        console.warn("[saved_products] load failed:", error.message);
        setProducts([]);
      } else {
        setProducts((data || []).map(productFromRow));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts(userId);
  }, [userId, loadProducts]);

  const save = useCallback(
    async (product) => {
      if (!userId) return;

      const savedAt = new Date().toISOString();
      const insertPayload = {
        user_id: userId,
        ...productToRow({ ...product, savedAt }),
      };

      const { data, error } = await supabase
        .from("saved_products")
        .insert(insertPayload)
        .select("*")
        .single();

      if (error) {
        console.warn("[saved_products] insert failed:", error.message);
        return;
      }

      const created = productFromRow(data);
      setProducts((prev) => [created, ...prev]);
    },
    [userId]
  );

  const remove = useCallback(
    async (id) => {
      if (!userId) return;
      setProducts((prev) => prev.filter((p) => p.id !== id));
      const { error } = await supabase
        .from("saved_products")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) {
        console.warn("[saved_products] delete failed:", error.message);
        loadProducts(userId);
      }
    },
    [userId, loadProducts]
  );

  return { products, save, remove, isLoading };
}
