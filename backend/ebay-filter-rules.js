// ─── eBay Smart Pricing: Product Filter Rules ─────────────────────────────────
//
// Each rule describes one automotive part type.
//
//   productType    – Display name shown in the UI
//   synonyms       – Terms used to DETECT the type in the user's search query
//   requiredAny    – Phrases that must appear in eBay listing TITLES (filter)
//   exclude        – Phrases that must NOT appear in eBay listing titles
//   minimumResults – Minimum relevant listings before flagging low-data warning
//
// Detection: longest-match-wins across all synonyms from all rules.
//   "cylinder head gasket" (20 chars, Head Gasket rule) beats
//   "cylinder head"        (14 chars, Cylinder Head rule)
//   → correct type always wins even when terms overlap.
//
// To add a product type: append one entry to productFilterRules below.
// No other changes are required anywhere in the codebase.
//
// Exclusion conflicts resolved:
//   • Head Gasket    – "cylinder head" removed (substring of required "cylinder head gasket")
//   • Rocker Cover Gasket – "rocker cover" removed (substring of required "rocker cover gasket")
//   • Turbo Gasket   – "turbocharger" removed (substring of required "turbocharger gasket")
//   • DPF Pressure Sensor – "dpf" removed (substring of required "dpf pressure sensor")
//   • Injector Seal  – "injector" removed (substring of every required term)
// ─────────────────────────────────────────────────────────────────────────────

export const productFilterRules = [

  // ── Cylinder Head ────────────────────────────────────────────────────────────
  {
    productType:    "Cylinder Head",
    synonyms:       ["cylinder head", "bare head", "complete head", "engine head", "head assembly"],
    requiredAny:    ["cylinder head", "bare head", "complete head", "engine head", "head assembly"],
    exclude:        ["gasket", "bolts", "bolt set", "rocker cover", "camshaft",
                     "valve", "valves", "manifold", "seal", "repair kit", "timing kit"],
    minimumResults: 3,
  },

  // ── Head Gasket ──────────────────────────────────────────────────────────────
  {
    productType:    "Head Gasket",
    synonyms:       ["head gasket", "cylinder head gasket"],
    requiredAny:    ["head gasket", "cylinder head gasket"],
    exclude:        ["full gasket set", "headset", "head set", "bolts",
                     "rocker cover gasket", "manifold gasket"],
    minimumResults: 3,
  },

  // ── Full Gasket Set ──────────────────────────────────────────────────────────
  {
    productType:    "Full Gasket Set",
    synonyms:       ["full gasket set", "engine gasket set", "conversion set", "overhaul gasket set"],
    requiredAny:    ["full gasket set", "engine gasket set", "conversion set", "overhaul gasket set"],
    exclude:        ["head gasket only", "rocker cover gasket", "sump gasket",
                     "manifold gasket", "turbo gasket", "single gasket"],
    minimumResults: 3,
  },

  // ── Rocker Cover Gasket ──────────────────────────────────────────────────────
  {
    productType:    "Rocker Cover Gasket",
    synonyms:       ["rocker cover gasket", "valve cover gasket"],
    requiredAny:    ["rocker cover gasket", "valve cover gasket"],
    // "rocker cover" omitted — it is a substring of the required phrase
    exclude:        ["head gasket", "full gasket set", "sump gasket", "manifold gasket"],
    minimumResults: 3,
  },

  // ── Turbo Gasket ─────────────────────────────────────────────────────────────
  {
    productType:    "Turbo Gasket",
    synonyms:       ["turbo gasket", "turbocharger gasket", "turbo mounting gasket", "turbo fitting kit"],
    requiredAny:    ["turbo gasket", "turbocharger gasket", "turbo mounting gasket", "turbo fitting kit"],
    // "turbocharger" omitted — it is a substring of the required phrase
    exclude:        ["turbo core", "cartridge", "actuator", "manifold gasket", "exhaust gasket"],
    minimumResults: 3,
  },

  // ── Oil Pump ─────────────────────────────────────────────────────────────────
  {
    productType:    "Oil Pump",
    synonyms:       ["oil pump", "engine oil pump"],
    requiredAny:    ["oil pump", "engine oil pump"],
    exclude:        ["water pump", "fuel pump", "vacuum pump", "gasket",
                     "seal", "strainer", "chain", "repair kit", "pickup pipe"],
    minimumResults: 3,
  },

  // ── Water Pump ───────────────────────────────────────────────────────────────
  {
    productType:    "Water Pump",
    synonyms:       ["water pump", "coolant pump"],
    requiredAny:    ["water pump", "coolant pump"],
    exclude:        ["oil pump", "fuel pump", "vacuum pump",
                     "thermostat", "housing only", "pulley only"],
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
    minimumResults: 3,
  },

  // ── Timing Belt Kit ──────────────────────────────────────────────────────────
  {
    productType:    "Timing Belt Kit",
    synonyms:       ["timing belt kit", "cambelt kit", "cam belt kit"],
    requiredAny:    ["timing belt kit", "cambelt kit", "cam belt kit"],
    exclude:        ["timing chain", "chain kit", "aux belt", "fan belt",
                     "belt only", "tensioner only", "water pump only"],
    minimumResults: 3,
  },

  // ── Camshaft ─────────────────────────────────────────────────────────────────
  {
    productType:    "Camshaft",
    synonyms:       ["camshaft", "inlet camshaft", "exhaust camshaft"],
    requiredAny:    ["camshaft", "inlet camshaft", "exhaust camshaft"],
    exclude:        ["sensor", "seal", "pulley", "sprocket",
                     "timing kit", "follower", "rocker arm"],
    minimumResults: 3,
  },

  // ── Crankshaft ───────────────────────────────────────────────────────────────
  {
    productType:    "Crankshaft",
    synonyms:       ["crankshaft"],
    requiredAny:    ["crankshaft"],
    exclude:        ["pulley", "sensor", "seal", "bearing",
                     "main bearing", "crankshaft pulley", "timing gear"],
    minimumResults: 3,
  },

  // ── Connecting Rod ───────────────────────────────────────────────────────────
  {
    productType:    "Connecting Rod",
    synonyms:       ["connecting rod", "conrod", "con rod"],
    requiredAny:    ["connecting rod", "conrod", "con rod"],
    exclude:        ["bearing", "bolt", "piston", "crankshaft", "used engine", "engine block"],
    minimumResults: 3,
  },

  // ── Piston ───────────────────────────────────────────────────────────────────
  {
    productType:    "Piston",
    synonyms:       ["piston", "piston kit"],
    requiredAny:    ["piston", "piston kit"],
    exclude:        ["piston rings only", "ring set", "conrod", "engine block", "liner", "bearing"],
    minimumResults: 3,
  },

  // ── Piston Rings ─────────────────────────────────────────────────────────────
  {
    productType:    "Piston Rings",
    synonyms:       ["piston rings", "piston ring set", "ring set"],
    requiredAny:    ["piston rings", "piston ring set", "ring set"],
    exclude:        ["piston kit", "liner", "conrod", "bearing"],
    minimumResults: 3,
  },

  // ── Main Bearings ────────────────────────────────────────────────────────────
  {
    productType:    "Main Bearings",
    synonyms:       ["main bearing", "main bearings", "crankshaft bearing", "crankshaft bearings"],
    requiredAny:    ["main bearing", "main bearings", "crankshaft bearing", "crankshaft bearings"],
    exclude:        ["big end bearing", "conrod bearing", "thrust washer", "wheel bearing"],
    minimumResults: 3,
  },

  // ── Big End Bearings ─────────────────────────────────────────────────────────
  {
    productType:    "Big End Bearings",
    synonyms:       ["big end bearing", "big end bearings", "conrod bearing", "connecting rod bearing"],
    requiredAny:    ["big end bearing", "big end bearings", "conrod bearing", "connecting rod bearing"],
    exclude:        ["main bearing", "thrust washer", "wheel bearing"],
    minimumResults: 3,
  },

  // ── Inlet Valve ──────────────────────────────────────────────────────────────
  {
    productType:    "Inlet Valve",
    synonyms:       ["inlet valve", "intake valve"],
    requiredAny:    ["inlet valve", "intake valve"],
    exclude:        ["exhaust valve", "egr valve", "valve stem seal", "valve spring", "valve guide"],
    minimumResults: 3,
  },

  // ── Exhaust Valve ────────────────────────────────────────────────────────────
  {
    productType:    "Exhaust Valve",
    synonyms:       ["exhaust valve"],
    requiredAny:    ["exhaust valve"],
    exclude:        ["inlet valve", "intake valve", "egr valve",
                     "valve stem seal", "valve spring", "valve guide"],
    minimumResults: 3,
  },

  // ── Rocker Arm ───────────────────────────────────────────────────────────────
  {
    productType:    "Rocker Arm",
    synonyms:       ["rocker arm", "cam follower", "finger follower"],
    requiredAny:    ["rocker arm", "cam follower", "finger follower"],
    exclude:        ["rocker cover", "tappet", "lifter", "camshaft", "valve"],
    minimumResults: 3,
  },

  // ── Hydraulic Lifter / Tappet ────────────────────────────────────────────────
  {
    productType:    "Hydraulic Lifter",
    synonyms:       ["hydraulic lifter", "tappet", "hydraulic tappet"],
    requiredAny:    ["hydraulic lifter", "tappet", "hydraulic tappet"],
    exclude:        ["rocker arm", "camshaft", "valve", "lifter pump"],
    minimumResults: 3,
  },

  // ── EGR Valve ────────────────────────────────────────────────────────────────
  {
    productType:    "EGR Valve",
    synonyms:       ["egr valve", "exhaust gas recirculation valve"],
    requiredAny:    ["egr valve", "exhaust gas recirculation valve"],
    exclude:        ["egr cooler", "egr pipe", "gasket", "blanking plate", "sensor only"],
    minimumResults: 3,
  },

  // ── DPF Pressure Sensor ──────────────────────────────────────────────────────
  {
    productType:    "DPF Pressure Sensor",
    synonyms:       ["dpf pressure sensor", "exhaust pressure sensor", "differential pressure sensor"],
    requiredAny:    ["dpf pressure sensor", "exhaust pressure sensor", "differential pressure sensor"],
    // "dpf" omitted — it is a substring of the required "dpf pressure sensor"
    exclude:        ["dpf filter", "pipe only", "hose only", "egr sensor"],
    minimumResults: 3,
  },

  // ── Injector Seal ────────────────────────────────────────────────────────────
  {
    productType:    "Injector Seal",
    synonyms:       ["injector seal", "injector washer", "injector copper washer", "injector seal kit"],
    requiredAny:    ["injector seal", "injector washer", "injector copper washer", "injector seal kit"],
    // "injector" omitted — it appears in every required term; use more specific excludes
    exclude:        ["fuel injector", "injector pipe", "leak off pipe", "nozzle"],
    minimumResults: 3,
  },

  // ── Glow Plug ────────────────────────────────────────────────────────────────
  {
    productType:    "Glow Plug",
    synonyms:       ["glow plug", "heater plug"],
    requiredAny:    ["glow plug", "heater plug"],
    exclude:        ["glow plug relay", "controller", "module", "wiring loom"],
    minimumResults: 3,
  },
];

// ─── Detect product type from user search query ───────────────────────────────
// Uses longest-match-wins: the synonym with the most characters that matches the
// query wins. This ensures "cylinder head gasket" (20 chars, Head Gasket rule)
// beats "cylinder head" (14 chars, Cylinder Head rule).
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
// Single-word exclusions are appended to the eBay query string (e.g. -gasket).
// Multi-word exclusions are handled server-side in filterItems() because
// eBay's Browse API does not reliably support negative phrase syntax.
export function buildEbayQuery(baseQuery, rule) {
  if (!rule) return baseQuery;
  const negatives = rule.exclude
    .filter(term => !term.includes(" ")) // single-word only
    .slice(0, 6)                          // keep URL reasonable length
    .map(term => `-${term}`)
    .join(" ");
  return negatives ? `${baseQuery} ${negatives}` : baseQuery;
}

// ─── Filter eBay items against a product rule ─────────────────────────────────
// Returns { relevant, excluded } arrays.
// When no rule is provided (type undetected) all items pass as relevant.
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

// ─── Confidence level ─────────────────────────────────────────────────────────
export function getConfidence(relevantCount) {
  if (relevantCount >= 15) return { level: "high",        label: "High confidence",   color: "#4ade80" };
  if (relevantCount >= 8)  return { level: "medium",      label: "Medium confidence", color: "#fbbf24" };
  if (relevantCount >= 3)  return { level: "low",         label: "Low confidence",    color: "#f97316" };
  return                          { level: "insufficient", label: "Not enough data",   color: "#f87171" };
}
