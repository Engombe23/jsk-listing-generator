// ─── Shared item specifics schema ────────────────────────────────────────────
// Used by ItemSpecificsTab (single listing editor) and GeneratedListings (batch export).

// ─── Product type normalisation ──────────────────────────────────────────────
// Maps TecDoc product name fragments → internal product type key.
// Ordered most-specific → least-specific to avoid false prefix matches.

export const PRODUCT_TYPE_NORM = [
  { patterns: ["head gasket"],                                           key: "head_gasket"    },
  { patterns: ["piston ring"],                                           key: "piston_rings"   },
  { patterns: ["big end bearing", "main bearing", "engine bearing"],     key: "bearing"        },
  { patterns: ["oil pump"],                                              key: "oil_pump"       },
  { patterns: ["water pump"],                                            key: "water_pump"     },
  { patterns: ["connecting rod", "conrod", "con rod"],                   key: "connecting_rod" },
  { patterns: ["cylinder head"],                                         key: "cylinder_head"  },
  { patterns: ["starter motor", "starter"],                              key: "starter_motor"  },
  { patterns: ["alternator"],                                            key: "alternator"     },
  { patterns: ["piston"],                                                key: "piston"         },
  { patterns: ["gasket"],                                                key: "gasket"         },
  { patterns: ["bearing"],                                               key: "bearing"        },
  { patterns: ["camshaft"],                                              key: "camshaft"       },
  { patterns: ["crankshaft"],                                            key: "crankshaft"     },
  { patterns: ["valve"],                                                 key: "head_valve"     },
];

export function normalizeProductType(productType) {
  if (!productType) return null;
  const lower = productType.toLowerCase().trim();
  for (const { patterns, key } of PRODUCT_TYPE_NORM) {
    if (patterns.some((p) => lower.includes(p))) return key;
  }
  return null;
}

// ─── Product-specific field groups ───────────────────────────────────────────
// Each key maps to additional fields shown ONLY for that product type.
// Fields whose labels already exist in SPEC_SCHEMA are filtered out at
// runtime (mapApiSpecsToSchema) to avoid duplicates.

export const PRODUCT_SPECIFIC_FIELDS = {
  oil_pump: [
    { label: "Operating Mode",       keys: ["operating mode", "mode of operation", "pump type"] },
    { label: "Number of Teeth",      keys: ["number of teeth", "no. of teeth", "teeth", "tooth count"] },
    { label: "Pressure Rating",      keys: ["pressure rating", "oil pressure", "pressure"] },
    { label: "Drive Type",           keys: ["drive type", "drive mechanism", "drive"] },
  ],
  water_pump: [
    { label: "With Thermostat",      keys: ["with thermostat", "thermostat included", "thermostat"] },
    { label: "Pulley Diameter",      keys: ["pulley diameter"] },
    { label: "Number of Ribs",       keys: ["number of ribs", "ribs", "belt ribs"] },
    { label: "Flange Type",          keys: ["flange type", "flange"] },
  ],
  connecting_rod: [
    { label: "Centre to Centre Length", keys: ["centre to centre", "center to center", "ctc", "ctc length"] },
    { label: "Big End Diameter",     keys: ["big end diameter", "big end bore", "big end"] },
    { label: "Small End Diameter",   keys: ["small end diameter", "small end bore", "small end", "pin bore diameter"] },
    { label: "Bush Included",        keys: ["bush included", "bushing included", "bush"] },
    { label: "Bolt Type",            keys: ["bolt type", "rod bolt"] },
  ],
  cylinder_head: [
    { label: "Number of Valves",     keys: ["number of valves", "valve count", "valves per cylinder", "no. of valves"] },
    { label: "Valves Included",      keys: ["valves included", "with valves", "complete with valves"] },
    { label: "Camshaft Included",    keys: ["camshaft included", "with camshaft", "complete with camshaft"] },
    { label: "Valve Diameter",       keys: ["valve diameter", "valve head diameter"] },
    { label: "Valve Stem Diameter",  keys: ["valve stem diameter", "stem diameter"] },
  ],
  starter_motor: [
    { label: "Voltage",              keys: ["voltage", "rated voltage", "volts"] },
    { label: "Power Rating",         keys: ["power", "power output", "kw rating", "wattage", "power rating"] },
    { label: "Number of Teeth",      keys: ["number of teeth", "no. of teeth", "pinion teeth", "teeth"] },
    { label: "Rotation Direction",   keys: ["rotation direction", "direction of rotation", "rotation"] },
  ],
  alternator: [
    { label: "Voltage",              keys: ["voltage", "rated voltage", "volts"] },
    { label: "Amperage Output",      keys: ["amperage", "ampere", "amps", "current output", "rated current"] },
    { label: "Pulley Type",          keys: ["pulley type", "pulley"] },
    { label: "Number of Ribs",       keys: ["number of ribs", "ribs", "belt ribs"] },
  ],
  bearing: [
    { label: "Bearing Type",         keys: ["bearing type", "type of bearing"] },
    { label: "Tolerance Class",      keys: ["tolerance class", "tolerance", "class"] },
  ],
  gasket: [
    { label: "Number of Layers",     keys: ["number of layers", "layers", "multi-layer"] },
    { label: "Seal Type",            keys: ["seal type", "sealing type", "seal"] },
  ],
  head_gasket: [
    { label: "Number of Layers",     keys: ["number of layers", "layers", "multi-layer"] },
    { label: "Seal Type",            keys: ["seal type", "sealing type", "seal"] },
  ],
  piston: [
    { label: "Pin Diameter",         keys: ["pin diameter", "gudgeon pin diameter", "wrist pin diameter", "gudgeon pin"] },
    { label: "Oversize",             keys: ["oversize", "oversize amount", "boring size", "os"] },
  ],
  piston_rings: [
    // TecDoc returns ring dimension values under "Component Number" for piston ring kits
    { label: "Ring Thickness",       keys: ["ring thickness", "ring width", "component number"] },
    { label: "Number of Rings",      keys: ["number of rings", "rings", "ring count", "no. of rings"] },
  ],
  head_valve: [
    { label: "Valve Diameter",       keys: ["valve diameter", "head diameter"] },
    { label: "Valve Stem Diameter",  keys: ["valve stem diameter", "stem diameter"] },
    { label: "Valve Length",         keys: ["valve length", "overall length"] },
    { label: "Valve Type",           keys: ["valve type"] },
  ],
  camshaft: [
    { label: "Camshaft Position",    keys: ["camshaft position", "cam position", "position"] },
    { label: "Intake / Exhaust",     keys: ["intake exhaust", "inlet exhaust", "intake", "exhaust"] },
  ],
  crankshaft: [
    { label: "Number of Journals",   keys: ["number of journals", "main journals", "journals"] },
    { label: "Journal Diameter",     keys: ["journal diameter", "main journal diameter"] },
    { label: "Pin Diameter",         keys: ["pin diameter", "crankpin diameter", "big end pin"] },
  ],
};

// ─── Base schema ──────────────────────────────────────────────────────────────
// Always present regardless of product type.

export const SPEC_SCHEMA = [
  // ── Core ──────────────────────────────────────────────────────────────────
  { label: "Brand",                         section: "Core",      keys: ["brand"] },
  { label: "Manufacturer Part Number",       section: "Core",      keys: [] },
  { label: "Type",                           section: "Core",      keys: ["product type", "part type", "component type", "article type"] },
  { label: "Reference OE/OEM Number",        section: "Core",      keys: [] },
  { label: "Placement on Vehicle",           section: "Core",      keys: ["placement", "fitting side", "axle", "position on vehicle", "installation location", "vehicle side"] },
  { label: "Manufacturer Warranty",          section: "Core",      keys: ["warranty"] },
  { label: "Country/Region of Manufacture",  section: "Core",      keys: ["country of origin", "country of manufacture", "region of manufacture", "made in"] },
  // ── Engine / Internal Parts ───────────────────────────────────────────────
  { label: "Engine Codes",                   section: "Engine",    keys: [] },
  { label: "Engine Size",                    section: "Engine",    keys: ["displacement", "engine capacity", "cubic capacity", "engine size", "engine displacement", "capacity"] },
  { label: "Fuel Type",                      section: "Engine",    keys: ["fuel type", "fuel system", "fuel"] },
  { label: "Number of Cylinders",            section: "Engine",    keys: ["number of cylinders", "cylinders", "cylinder count", "no. of cylinders"] },
  { label: "Valve Count",                    section: "Engine",    keys: ["valve count", "number of valves", "valves per cylinder", "valves"] },
  { label: "Bore Diameter",                  section: "Engine",    keys: ["bore diameter", "cylinder bore", "bore ø", "piston bore"] },
  { label: "Stroke Length",                  section: "Engine",    keys: ["stroke length", "stroke"] },
  { label: "Compression Height",             section: "Engine",    keys: ["compression height", "ch"] },
  { label: "Material",                       section: "Engine",    keys: ["material", "construction material", "housing material"] },
  { label: "Fitting Position",               section: "Engine",    keys: ["fitting position", "mounting position", "installation position", "assembly position", "build position"] },
  // ── General Technical Specifications ─────────────────────────────────────
  { label: "Length",                         section: "Technical", keys: ["total length", "overall length", " length", "^length"] },
  { label: "Width",                          section: "Technical", keys: ["total width", "overall width", " width", "^width"] },
  { label: "Height",                         section: "Technical", keys: ["total height", "overall height", " height", "^height"] },
  { label: "Thickness",                      section: "Technical", keys: ["thickness", "wall thickness", "sheet thickness"] },
  { label: "Diameter",                       section: "Technical", keys: ["nominal diameter", "overall diameter", "^diameter"] },
  { label: "Inner Diameter",                 section: "Technical", keys: ["inner diameter", "internal diameter", "inside diameter", "id "] },
  { label: "Outer Diameter",                 section: "Technical", keys: ["outer diameter", "external diameter", "outside diameter", "od "] },
  { label: "Thread Size",                    section: "Technical", keys: ["thread size", "thread pitch", "thread type", "thread diameter", "thread"] },
  { label: "Weight",                         section: "Technical", keys: ["weight", "mass", "net weight"] },
];

export const SECTION_TITLES = {
  Core:       "CORE ITEM SPECIFICS",
  Engine:     "ENGINE / INTERNAL PARTS",
  Product:    "PRODUCT SPECIFICS",
  Technical:  "GENERAL TECHNICAL SPECIFICATIONS",
  Additional: "ADDITIONAL SPECIFICS",
};

// ─── Schema mapper ────────────────────────────────────────────────────────────
// Builds the full flat list of {id, label, value, section, keys} rows for a
// listing result object.
//
// Order: Core → Engine → Product (type-specific, deduped against base) → Technical → Additional
//
// "Product" fields are only added when the product type can be detected from
// res.product_type, and only for fields whose labels don't already exist in
// the base schema (to avoid displaying the same concept twice).

export function mapApiSpecsToSchema(res) {
  let _uid = 0;
  const uid = () => `s${++_uid}${Math.random().toString(36).slice(2, 5)}`;

  // ── Detect product type ────────────────────────────────────────────────────
  const productTypeKey = normalizeProductType(res.product_type);

  // ── Base schema fields ─────────────────────────────────────────────────────
  const baseLabels    = new Set(SPEC_SCHEMA.map((f) => f.label));
  const schemaFields  = SPEC_SCHEMA.map((f) => ({ ...f, id: uid(), value: "" }));
  const coreEngine    = schemaFields.filter((f) => f.section === "Core" || f.section === "Engine");
  const technical     = schemaFields.filter((f) => f.section === "Technical");

  // ── Product-specific fields (unique labels only) ───────────────────────────
  const productFields = (productTypeKey && PRODUCT_SPECIFIC_FIELDS[productTypeKey])
    ? PRODUCT_SPECIFIC_FIELDS[productTypeKey]
        .filter((f) => !baseLabels.has(f.label)) // skip if base schema already covers this label
        .map((f)   => ({ ...f, id: uid(), value: "", section: "Product" }))
    : [];

  // Combined array determines matching priority (first match wins)
  const fields = [...coreEngine, ...productFields, ...technical];

  // ── Static fills ───────────────────────────────────────────────────────────
  const find = (lbl) => fields.find((f) => f.label === lbl);
  find("Brand").value                       = "Aftermarket";
  find("Manufacturer Part Number").value    = res.article_number || "";
  find("Reference OE/OEM Number").value     = (res.oem_numbers  || []).join(", ");
  find("Engine Codes").value                = (res.engine_codes || []).join(", ");
  find("Type").value                        = res.product_type  || res.generated_title || "";

  // ── Parse API spec array ───────────────────────────────────────────────────
  const apiSpecs = (res.item_specifics?.length > 0
    ? res.item_specifics
    : (res.specifications || []).map((s) => {
        const idx = s.indexOf(":");
        return idx > -1
          ? { label: s.slice(0, idx).trim(), value: s.slice(idx + 1).trim() }
          : { label: s, value: "" };
      })
  ).filter((s) => s.label);

  // ── Fuzzy-match API specs → fields ─────────────────────────────────────────
  const usedIds = new Set(fields.filter((f) => f.value).map((f) => f.id));
  const extras  = [];

  for (const spec of apiSpecs) {
    const sLower = spec.label.toLowerCase().trim();
    let matched  = false;

    for (const field of fields) {
      if (usedIds.has(field.id)) continue;
      const keys = field.keys.length > 0 ? field.keys : [field.label.toLowerCase()];
      const isMatch = keys.some((k) => {
        const kc = k.replace(/^\^/, "");
        if (k.startsWith("^")) return sLower === kc;
        return sLower.includes(kc) || kc.includes(sLower);
      });
      if (isMatch) {
        field.value = spec.value || "";
        usedIds.add(field.id);
        matched = true;
        break;
      }
    }

    if (!matched && spec.value) {
      extras.push({ id: uid(), label: spec.label, value: spec.value, section: "Additional", keys: [] });
    }
  }

  return [...fields, ...extras];
}
