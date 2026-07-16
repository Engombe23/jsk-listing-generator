import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./lib/supabaseClient";
import { useSession } from "./context/SessionContext";
import { listingFromRow, listingToRow } from "./lib/savedDataMappers";

const LOCAL_KEY = "jsk_generated_listings_v1";
const migratedKey = (userId) => `jsk_migrated_listings_${userId}`;

function buildEntry(result) {
  return {
    status: "Draft",
    title: result.generated_title || "",
    article_number: result.article_number || "",
    description_html: result.generated_html || "",
    item_specifics: result.item_specifics || [],
    specifications: result.specifications || [],
    oem_numbers: result.oem_numbers || [],
    k_number_list: result.k_number_list || [],
    engine_codes: result.engine_codes || [],
    compatibility_count: result.compatibility_count || 0,
    product_type: result.product_type || "",
    sku: result.sku || "",
    bin_price: "",
    article_image: result.article_image || "",
    savedAt: new Date().toISOString(),
  };
}

function readLocalListings() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function migrateLocalListings(userId) {
  if (!userId || localStorage.getItem(migratedKey(userId))) return;
  const local = readLocalListings();
  if (local.length === 0) {
    localStorage.setItem(migratedKey(userId), "1");
    return;
  }

  const rows = local.map((item) => ({
    user_id: userId,
    ...listingToRow({
      ...item,
      savedAt: item.savedAt || new Date().toISOString(),
    }),
  }));

  const { error } = await supabase.from("saved_listings").insert(rows);
  if (error) {
    console.warn("[saved_listings] localStorage migration failed:", error.message);
    return;
  }

  localStorage.setItem(migratedKey(userId), "1");
  try {
    localStorage.removeItem(LOCAL_KEY);
  } catch {
    /* ignore */
  }
}

export function useGeneratedListings() {
  const { session } = useSession();
  const userId = session?.user?.id ?? null;
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(!!userId);
  const listingsRef = useRef(listings);
  listingsRef.current = listings;

  const loadListings = useCallback(async (uid) => {
    if (!uid) {
      setListings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      await migrateLocalListings(uid);

      const { data, error } = await supabase
        .from("saved_listings")
        .select("*")
        .eq("user_id", uid)
        .order("saved_at", { ascending: false });

      if (error) {
        console.warn("[saved_listings] load failed:", error.message);
        setListings([]);
      } else {
        setListings((data || []).map(listingFromRow));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings(userId);
  }, [userId, loadListings]);

  const autoSave = useCallback(
    async (result) => {
      if (!userId) return;

      const todayDate = new Date().toISOString().slice(0, 10);
      const existing = listingsRef.current.find(
        (l) =>
          l.article_number === result.article_number &&
          (l.savedAt || "").slice(0, 10) === todayDate
      );

      const entry = buildEntry(result);

      if (existing) {
        const merged = {
          ...entry,
          id: existing.id,
          savedAt: existing.savedAt,
          status: existing.status,
        };
        setListings((prev) =>
          prev.map((l) => (l.id === existing.id ? merged : l))
        );

        const { error } = await supabase
          .from("saved_listings")
          .update(listingToRow(merged))
          .eq("id", existing.id)
          .eq("user_id", userId);

        if (error) {
          console.warn("[saved_listings] update failed:", error.message);
          loadListings(userId);
        }
        return;
      }

      const insertPayload = {
        user_id: userId,
        ...listingToRow(entry),
        saved_at: entry.savedAt,
      };

      const { data, error } = await supabase
        .from("saved_listings")
        .insert(insertPayload)
        .select("*")
        .single();

      if (error) {
        console.warn("[saved_listings] insert failed:", error.message);
        return;
      }

      const created = listingFromRow(data);
      setListings((prev) => [created, ...prev]);
    },
    [userId, loadListings]
  );

  const updateStatus = useCallback(
    async (id, status) => {
      if (!userId) return;
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status } : l))
      );
      const { error } = await supabase
        .from("saved_listings")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId);
      if (error) {
        console.warn("[saved_listings] status update failed:", error.message);
        loadListings(userId);
      }
    },
    [userId, loadListings]
  );

  const updateStatusBatch = useCallback(
    async (ids, status) => {
      if (!userId || !ids?.length) return;
      setListings((prev) =>
        prev.map((l) => (ids.includes(l.id) ? { ...l, status } : l))
      );
      const { error } = await supabase
        .from("saved_listings")
        .update({ status, updated_at: new Date().toISOString() })
        .in("id", ids)
        .eq("user_id", userId);
      if (error) {
        console.warn("[saved_listings] batch status update failed:", error.message);
        loadListings(userId);
      }
    },
    [userId, loadListings]
  );

  const updateListing = useCallback(
    async (id, patch) => {
      if (!userId) return;
      const current = listingsRef.current.find((l) => l.id === id);
      if (!current) return;
      const nextListing = { ...current, ...patch };
      setListings((prev) =>
        prev.map((l) => (l.id === id ? nextListing : l))
      );

      const { error } = await supabase
        .from("saved_listings")
        .update(listingToRow(nextListing))
        .eq("id", id)
        .eq("user_id", userId);
      if (error) {
        console.warn("[saved_listings] patch failed:", error.message);
        loadListings(userId);
      }
    },
    [userId, loadListings]
  );

  const remove = useCallback(
    async (id) => {
      if (!userId) return;
      setListings((prev) => prev.filter((l) => l.id !== id));
      const { error } = await supabase
        .from("saved_listings")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) {
        console.warn("[saved_listings] delete failed:", error.message);
        loadListings(userId);
      }
    },
    [userId, loadListings]
  );

  const removeBatch = useCallback(
    async (ids) => {
      if (!userId || !ids?.length) return;
      setListings((prev) => prev.filter((l) => !ids.includes(l.id)));
      const { error } = await supabase
        .from("saved_listings")
        .delete()
        .in("id", ids)
        .eq("user_id", userId);
      if (error) {
        console.warn("[saved_listings] batch delete failed:", error.message);
        loadListings(userId);
      }
    },
    [userId, loadListings]
  );

  return {
    listings,
    isLoading,
    autoSave,
    updateStatus,
    updateStatusBatch,
    updateListing,
    remove,
    removeBatch,
  };
}
