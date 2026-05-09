// ─── eBay Smart Pricing: Central Configuration ───────────────────────────────
//
// This file is the single source of truth for all Smart Pricing logic.
// No pricing/filtering decisions should be hard-coded elsewhere.
//
// ── conditionOptions ─────────────────────────────────────────────────────────
//   Maps UI condition keys to eBay Browse API filter strings.
//   Note: eBay condition 2500 = "Manufacturer Refurbished" (closest to
//   "Remanufactured / Reconditioned" in UK automotive parts listings).
//
// ── EXCLUSION_REASONS ────────────────────────────────────────────────────────
//   Canonical reason strings attached to every excluded listing.
//
// ── productFilterRules ───────────────────────────────────────────────────────
//   Each entry describes one automotive part type.
//
//   productType    – display name shown in the UI
//   synonyms       – terms used to DETECT the type from the search query
//   requiredAny    – phrases that MUST appear in an eBay listing title
//   exclude        – phrases that must NOT appear in a listing title
//   unitSensitive  – true → sets/kits/bundles/pairs excluded from pricing
//                    (parts sold per-unit where qty distorts price)
//   highMultiplier – listing price > (initial median × highMultiplier) → excluded
//   lowMultiplier  – listing price < (initial median × lowMultiplier)  → excluded
//   minimumResults – minimum relevant listings before flagging low-data warning
//
// ── Detection ────────────────────────────────────────────────────────────────
//   Longest-match-wins across all synonyms.
//   "cylinder head gasket" (20 chars, Head Gasket rule) beats
//   "cylinder head"        (14 chars, Cylinder Head rule).
//
// ── Exclusion conflict notes ─────────────────────────────────────────────────
//   Terms omitted from exclude[] because they are substrings of requiredAny[]:
//   • Head Gasket         – "cylinder head" removed
//   • Rocker Cover Gasket – "rocker cover"  removed
//   • Turbo Gasket        – "turbocharger"  removed
//   • DPF Pressure Sensor – "dpf"           removed
//   • Injector Seal       – "injector"      removed
// ─────────────────────────────────────────────────────────────────────────────

// ─── Condition options ────────────────────────────────────────────────────────
export const conditionOptions = [
  {
    key:        "new",
    label:      "New",
    ebayFilter: "conditionIds:{1000|1500}",
  },
  {
    key:        "used",
    label:      "Used",
    ebayFilter: "conditionIds:{3000}",
  },
  {
    key:        "remanufactured",
    label:      "Remanufactured",
    // eBay 2500 = Manufacturer Refurbished — closest match for remanufactured
    // / reconditioned automotive parts on eBay UK.
    ebayFilter: "conditionIds:{2500}",
  },
];

// ─── Exclusion reasons ────────────────────────────────────────────────────────
export const EXCLUSION_REASONS = {
  TITLE_FILTER: "Excluded by product-type title filter",
  SET_KIT:      "Excluded as likely set/kit/bundle",
  HIGH_OUTLIER: "Excluded as high-price outlier",
  LOW_OUTLIER:  "Excluded as low-price outlier",
  NO_PRICE:     "No valid price",
};

// ─── Product filter rules ─────────────────────────────────────────────────────
export const productFilterRules = [

  // ── Cylinder Head ────────────────────────────────────────────────────────────
  {
    productType:    "Cylinder Head",
    synonyms:       ["cylinder head", "bare head", "complete head", "engine head", "head assembly"],
    requiredAny:    ["cylinder head", "bare head", "complete head", "engine head", "head assembly"],
    exclude:        ["gasket", "bolts", "bolt set", "rocker cover", "camshaft",
                     "valve", "valves", "manifold", "seal", "repair kit", "timing kit"],
    unitSensitive:  false,
    highMultiplier: 3.5,
    lowMultiplier:  0.35,
    minimumResults: 3,
  },

  // ── Head Gasket ──────────────────────────────────────────────────────────────
  {
    productType:    "Head Gasket",
    synonyms:       ["head gasket", "cylinder head gasket"],
    requiredAny:    ["head gasket", "cylinder head gasket"],
    // "cylinder head" omitted — substring of required "cylinder head gasket"
    exclude:        ["full gasket set", "headset", "head set", "bolts",
                     "rocker cover gasket", "manifold gasket"],
    unitSensitive:  false,
    highMultiplier: 4.0,
    lowMultiplier:  0.3,
    minimumResults: 3,
  },

  // ── Full Gasket Set ──────────────────────────────────────────────────────────
  {
    productType:    "Full Gasket Set",
    synonyms:       ["full gasket set", "engine gasket set", "conversion set", "overhaul gasket set"],
    requiredAny:    ["full gasket set", "engine gasket set", "conversion set", "overhaul gasket set"],
    exclude:        ["head gasket only", "rocker cover gasket", "sump gasket",
                     "manifold gasket", "turbo gasket", "single gasket"],
    unitSensitive:  false,
    highMultiplier: 3.0,
    lowMultiplier:  0.3,
    minimumResults: 3,
  },

  // ── Rocker Cover Gasket ──────────────────────────────────────────────────────
  {
    productType:    "Rocker Cover Gasket",
    synonyms:       ["rocker cover gasket", "valve cover gasket"],
    requiredAny:    ["rocker cover gasket", "valve cover gasket"],
    // "rocker cover" omitted — substring of required "rocker cover gasket"
    exclude:        ["head gasket", "full gasket set", "sump gasket", "manifold gasket"],
    unitSensitive:  false,
    highMultiplier: 4.0,
    lowMultiplier:  0.3,
    minimumResults: 3,
  },

  // ── Turbo Gasket ─────────────────────────────────────────────────────────────
  {
    productType:    "Turbo Gasket",
    synonyms:       ["turbo gasket", "turbocharger gasket", "turbo mounting gasket", "turbo fitting kit"],
    requiredAny:    ["turbo gasket", "turbocharger gasket", "turbo mounting gasket", "turbo fitting kit"],
    // "turbocharger" omitted — substring of required "turbocharger gasket"
    exclude:        ["turbo core", "cartridge", "actuator", "manifold gasket", "exhaust gasket"],
    unitSensitive:  false,
    highMultiplier: 4.0,
    lowMultiplier:  0.3,
    minimumResults: 3,
  },

  // ── Oil Pump ─────────────────────────────────────────────────────────────────
  {
    productType:    "Oil Pump",
    synonyms:       ["oil pump", "engine oil pump"],
    requiredAny:    ["oil pump", "engine oil pump"],
    exclude:        ["water pump", "fuel pump", "vacuum pump", "gasket",
                     "seal", "strainer", "chain", "repair kit", "pickup pipe"],
    unitSensitive:  false,
    highMultiplier: 3.0,
    lowMultiplier:  0.35,
    minimumResults: 3,
  },

  // ── Water Pump ───────────────────────────────────────────────────────────────
  {
    productType:    "Water Pump",
    synonyms:       ["water pump", "coolant pump"],
    requiredAny:    ["water pump", "coolant pump"],
    exclude:        ["oil pump", "fuel pump", "vacuum pump",
                     "thermostat", "housing only", "pulley only"],
    unitSensitive:  false,
    highMultiplier: 3.0,
    lowMultiplier:  0.35,
    minimumResults: 3,
  },

  // ── Timing Chain Kit ─────────────────────────────────────────────────────────
  {
    productType:    "Timing Chain Kit",
    synonyms:       ["timing chain kit", "timing chain set", "chain kit"],
    requiredAny:    ["timing chain kit", "timing chain set", "chain kit"],
    exclude:        ["timing belt", "cambelt", "aux belt",
                     "tensioner only", "guide only", "sprocket only",
                     "oil pump chain", "single chain"],
    unitSensitive:  false,
    highMultiplier: 3.0,
    lowMultiplier:  0.4,
    minimumResults: 3,
  },

  // ── Timing Belt Kit ──────────────────────────────────────────────────────────
  {
    productType:    "Timing Belt Kit",
    synonyms:       ["timing belt kit", "cambelt kit", "cam belt kit"],
    requiredAny:    ["timing belt kit", "cambelt kit", "cam belt kit"],
    exclude:        ["timing chain", "chain kit", "aux belt", "fan belt",
                     "belt only", "tensioner only", "water pump only"],
    unitSensitive:  false,
    highMultiplier: 3.0,
    lowMultiplier:  0.4,
    minimumResults: 3,
  },

  // ── Camshaft ─────────────────────────────────────────────────────────────────
  {
    productType:    "Camshaft",
    synonyms:       ["camshaft", "inlet camshaft", "exhaust camshaft"],
    requiredAny:    ["camshaft", "inlet camshaft", "exhaust camshaft"],
    exclude:        ["sensor", "seal", "pulley", "sprocket",
                     "timing kit", "follower", "rocker arm"],
    unitSensitive:  false,
    highMultiplier: 3.0,
    lowMultiplier:  0.35,
    minimumResults: 3,
  },

  // ── Crankshaft ───────────────────────────────────────────────────────────────
  {
    productType:    "Crankshaft",
    synonyms:       ["crankshaft"],
    requiredAny:    ["crankshaft"],
    exclude:        ["pulley", "sensor", "seal", "bearing",
                     "main bearing", "crankshaft pulley", "timing gear"],
    unitSensitive:  false,
    highMultiplier: 3.5,
    lowMultiplier:  0.35,
    minimumResults: 3,
  },

  // ── Connecting Rod ───────────────────────────────────────────────────────────
  {
    productType:    "Connecting Rod",
    synonyms:       ["connecting rod", "conrod", "con rod"],
    requiredAny:    ["connecting rod", "conrod", "con rod"],
    exclude:        ["bearing", "bolt", "piston", "crankshaft", "used engine", "engine block"],
    unitSensitive:  true,
    highMultiplier: 2.5,
    lowMultiplier:  0.35,
    minimumResults: 3,
  },

  // ── Piston ───────────────────────────────────────────────────────────────────
  {
    productType:    "Piston",
    synonyms:       ["piston", "piston kit"],
    requiredAny:    ["piston", "piston kit"],
    exclude:        ["piston rings only", "ring set", "conrod", "engine block", "liner", "bearing"],
    unitSensitive:  true,
    highMultiplier: 2.5,
    lowMultiplier:  0.35,
    minimumResults: 3,
  },

  // ── Piston Rings ─────────────────────────────────────────────────────────────
  {
    productType:    "Piston Rings",
    synonyms:       ["piston rings", "piston ring set", "ring set"],
    requiredAny:    ["piston rings", "piston ring set", "ring set"],
    exclude:        ["piston kit", "liner", "conrod", "bearing"],
    unitSensitive:  true,
    highMultiplier: 2.5,
    lowMultiplier:  0.35,
    minimumResults: 3,
  },

  // ── Main Bearings ────────────────────────────────────────────────────────────
  {
    productType:    "Main Bearings",
    synonyms:       ["main bearing", "main bearings", "crankshaft bearing", "crankshaft bearings"],
    requiredAny:    ["main bearing", "main bearings", "crankshaft bearing", "crankshaft bearings"],
    exclude:        ["big end bearing", "conrod bearing", "thrust washer", "wheel bearing"],
    unitSensitive:  true,
    highMultiplier: 2.5,
    lowMultiplier:  0.35,
    minimumResults: 3,
  },

  // ── Big End Bearings ─────────────────────────────────────────────────────────
  {
    productType:    "Big End Bearings",
    synonyms:       ["big end bearing", "big end bearings", "conrod bearing", "connecting rod bearing"],
    requiredAny:    ["big end bearing", "big end bearings", "conrod bearing", "connecting rod bearing"],
    exclude:        ["main bearing", "thrust washer", "wheel bearing"],
    unitSensitive:  true,
    highMultiplier: 2.5,
    lowMultiplier:  0.35,
    minimumResults: 3,
  },

  // ── Inlet Valve ──────────────────────────────────────────────────────────────
  {
    productType:    "Inlet Valve",
    synonyms:       ["inlet valve", "intake valve"],
    requiredAny:    ["inlet valve", "intake valve"],
    exclude:        ["exhaust valve", "egr valve", "valve stem seal", "valve spring", "valve guide"],
    unitSensitive:  true,
    highMultiplier: 2.5,
    lowMultiplier:  0.35,
    minimumResults: 3,
  },

  // ── Exhaust Valve ────────────────────────────────────────────────────────────
  {
    productType:    "Exhaust Valve",
    synonyms:       ["exhaust valve"],
    requiredAny:    ["exhaust valve"],
    exclude:        ["inlet valve", "intake valve", "egr valve",
                     "valve stem seal", "valve spring", "valve guide"],
    unitSensitive:  true,
    highMultiplier: 2.5,
    lowMultiplier:  0.35,
    minimumResults: 3,
  },

  // ── Rocker Arm ───────────────────────────────────────────────────────────────
  {
    productType:    "Rocker Arm",
    synonyms:       ["rocker arm", "cam follower", "finger follower"],
    requiredAny:    ["rocker arm", "cam follower", "finger follower"],
    exclude:        ["rocker cover", "tappet", "lifter", "camshaft", "valve"],
    unitSensitive:  true,
    highMultiplier: 2.5,
    lowMultiplier:  0.35,
    minimumResults: 3,
  },

  // ── Hydraulic Lifter / Tappet ────────────────────────────────────────────────
  {
    productType:    "Hydraulic Lifter",
    synonyms:       ["hydraulic lifter", "tappet", "hydraulic tappet"],
    requiredAny:    ["hydraulic lifter", "tappet", "hydraulic tappet"],
    exclude:        ["rocker arm", "camshaft", "valve", "lifter pump"],
    unitSensitive:  true,
    highMultiplier: 3.0,
    lowMultiplier:  0.35,
    minimumResults: 3,
  },

  // ── EGR Valve ────────────────────────────────────────────────────────────────
  {
    productType:    "EGR Valve",
    synonyms:       ["egr valve", "exhaust gas recirculation valve"],
    requiredAny:    ["egr valve", "exhaust gas recirculation valve"],
    exclude:        ["egr cooler", "egr pipe", "gasket", "blanking plate", "sensor only"],
    unitSensitive:  false,
    highMultiplier: 3.0,
    lowMultiplier:  0.35,
    minimumResults: 3,
  },

  // ── DPF Pressure Sensor ──────────────────────────────────────────────────────
  {
    productType:    "DPF Pressure Sensor",
    synonyms:       ["dpf pressure sensor", "exhaust pressure sensor", "differential pressure sensor"],
    requiredAny:    ["dpf pressure sensor", "exhaust pressure sensor", "differential pressure sensor"],
    // "dpf" omitted — substring of required "dpf pressure sensor"
    exclude:        ["dpf filter", "pipe only", "hose only", "egr sensor"],
    unitSensitive:  false,
    highMultiplier: 3.5,
    lowMultiplier:  0.3,
    minimumResults: 3,
  },

  // ── Injector Seal ────────────────────────────────────────────────────────────
  {
    productType:    "Injector Seal",
    synonyms:       ["injector seal", "injector washer", "injector copper washer", "injector seal kit"],
    requiredAny:    ["injector seal", "injector washer", "injector copper washer", "injector seal kit"],
    // "injector" omitted — appears in every required term
    exclude:        ["fuel injector", "injector pipe", "leak off pipe", "nozzle"],
    unitSensitive:  true,
    highMultiplier: 4.0,
    lowMultiplier:  0.3,
    minimumResults: 3,
  },

  // ── Glow Plug ────────────────────────────────────────────────────────────────
  {
    productType:    "Glow Plug",
    synonyms:       ["glow plug", "heater plug"],
    requiredAny:    ["glow plug", "heater plug"],
    exclude:        ["glow plug relay", "controller", "module", "wiring loom"],
    unitSensitive:  true,
    highMultiplier: 3.0,
    lowMultiplier:  0.35,
    minimumResults: 3,
  },
];

// ─── Detect product type from user search query ───────────────────────────────
// Longest-match-wins: the synonym with the most characters that appears in the
// query wins, ensuring "cylinder head gasket" beats "cylinder head".
export function detectProductType(query) {
  const q = query.toLowerCase().trim();
  let best = null, bestLen = 0;
  for (const rule of productFilterRules) {
    for (const syn of rule.synonyms) {
      const s = syn.toLowerCase();
      if (s.length > bestLen && q.includes(s)) {
        bestLen = s.length;
        best    = rule;
      }
    }
  }
  return best; // null if no match
}

// ─── Build eBay query with single-word negative keywords ─────────────────────
// Single-word exclusions are appended directly (e.g. -gasket).
// Multi-word exclusions are handled server-side in the title filter because
// eBay's Browse API does not reliably support negative phrase syntax.
export function buildEbayQuery(baseQuery, rule) {
  if (!rule) return baseQuery;
  const negatives = rule.exclude
    .filter(term => !term.includes(" "))
    .slice(0, 6)
    .map(term => `-${term}`)
    .join(" ");
  return negatives ? `${baseQuery} ${negatives}` : baseQuery;
}

// ─── Title filter ─────────────────────────────────────────────────────────────
// Simple pass/fail for compatibility. Server uses richer inline logic.
export function filterItems(items, rule) {
  if (!rule) return { relevant: items, excluded: [] };
  const relevant = [], excluded = [];
  for (const item of items) {
    const title      = (item.title || "").toLowerCase();
    const hasRequired = rule.requiredAny.some(t => title.includes(t.toLowerCase()));
    const hasExcluded = rule.exclude.some(t => title.includes(t.toLowerCase()));
    if (hasRequired && !hasExcluded) relevant.push(item);
    else                             excluded.push(item);
  }
  return { relevant, excluded };
}

// ─── Detect unit type from listing title ─────────────────────────────────────
// Used for unit-sensitive product types (connecting rods, valves, bearings etc.)
// to identify and exclude multi-unit listings that would distort single-unit pricing.
export function detectUnitType(title) {
  const t = (title || "").toLowerCase();

  // Single indicators — check first so "x1" doesn't fall into set logic
  if (/\bsingle\b|\bx1\b|\b1x\b|\bqty[\s:]?1\b/.test(t)) return "single";

  // Pair indicators
  if (/\bpair\b|\bx2\b|\b2x\b|\bset of 2\b|\bset of two\b|\bqty[\s:]?2\b/.test(t)) return "pair";

  // Set of 3+ (explicit quantity)
  if (/\bset of [3-9]\b|\bset of \d{2,}\b|\bpack of [3-9]\b|\bx[3-9]\b|\b[3-9]x\b/.test(t)) return "set";

  // Generic kit (no quantity specified — still multi-unit)
  if (/\bkit\b/.test(t)) return "kit";

  // Generic bundle
  if (/\bbundle\b/.test(t)) return "bundle";

  // Generic set or pack (without specific quantity)
  if (/\bset\b|\bpack\b/.test(t)) return "set";

  return "unknown";
}

// ─── Confidence level ─────────────────────────────────────────────────────────
// Thresholds based on relevant listings after all filtering.
export function getConfidence(relevantCount) {
  if (relevantCount >= 10) return { level: "high",        label: "High confidence",   color: "#4ade80" };
  if (relevantCount >= 6)  return { level: "medium",      label: "Medium confidence", color: "#fbbf24" };
  if (relevantCount >= 3)  return { level: "low",         label: "Low confidence",    color: "#f97316" };
  return                          { level: "insufficient", label: "Not enough data",   color: "#f87171" };
}
