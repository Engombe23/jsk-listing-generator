/** Map a saved_listings DB row → frontend listing shape. */
export function listingFromRow(row) {
  return {
    id: row.id,
    savedAt: row.saved_at,
    status: row.status ?? "Draft",
    title: row.title ?? "",
    article_number: row.article_number ?? "",
    description_html: row.description_html ?? "",
    item_specifics: row.item_specifics ?? [],
    specifications: row.specifications ?? [],
    oem_numbers: row.oem_numbers ?? [],
    k_number_list: row.k_number_list ?? [],
    engine_codes: row.engine_codes ?? [],
    custom_specifics: row.custom_specifics ?? undefined,
    compatibility_count: row.compatibility_count ?? 0,
    product_type: row.product_type ?? "",
    sku: row.sku ?? "",
    bin_price: row.bin_price ?? "",
    article_image: row.article_image ?? "",
  };
}

/** Map a frontend listing (or generator result entry) → DB insert/update payload (no id/user_id). */
export function listingToRow(listing) {
  const row = {
    status: listing.status ?? "Draft",
    title: listing.title ?? "",
    article_number: listing.article_number ?? "",
    description_html: listing.description_html ?? "",
    item_specifics: listing.item_specifics ?? [],
    specifications: listing.specifications ?? [],
    oem_numbers: listing.oem_numbers ?? [],
    k_number_list: listing.k_number_list ?? [],
    engine_codes: listing.engine_codes ?? [],
    compatibility_count: listing.compatibility_count ?? 0,
    product_type: listing.product_type ?? "",
    sku: listing.sku ?? "",
    bin_price: listing.bin_price ?? "",
    article_image: listing.article_image ?? "",
    updated_at: new Date().toISOString(),
  };
  if (listing.custom_specifics !== undefined) {
    row.custom_specifics = listing.custom_specifics;
  }
  if (listing.savedAt) {
    row.saved_at = listing.savedAt;
  }
  return row;
}

/** Map a saved_products DB row → frontend product shape. */
export function productFromRow(row) {
  return {
    id: row.id,
    savedAt: row.saved_at,
    name: row.name ?? "Unnamed Product",
    itemCost: row.item_cost ?? 0,
    shippingCost: row.shipping_cost ?? 0,
    sellingPrice: row.selling_price ?? 0,
    fvfPct: row.fvf_pct ?? 0,
    fixedFee: row.fixed_fee ?? 0,
    promoPct: row.promo_pct ?? 0,
    vatRegistered: row.vat_registered ?? false,
    profit: row.profit ?? 0,
    margin: row.margin ?? 0,
    markup: row.markup ?? 0,
    ebayFVF: row.ebay_fvf ?? 0,
    ebayPromo: row.ebay_promo ?? 0,
    vatAmount: row.vat_amount ?? 0,
  };
}

/** Map a frontend product → DB insert payload (no id/user_id). */
export function productToRow(product) {
  return {
    name: product.name ?? "Unnamed Product",
    item_cost: product.itemCost ?? 0,
    shipping_cost: product.shippingCost ?? 0,
    selling_price: product.sellingPrice ?? 0,
    fvf_pct: product.fvfPct ?? 0,
    fixed_fee: product.fixedFee ?? 0,
    promo_pct: product.promoPct ?? 0,
    vat_registered: !!product.vatRegistered,
    profit: product.profit ?? 0,
    margin: product.margin ?? 0,
    markup: product.markup ?? 0,
    ebay_fvf: product.ebayFVF ?? 0,
    ebay_promo: product.ebayPromo ?? 0,
    vat_amount: product.vatAmount ?? 0,
    saved_at: product.savedAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
