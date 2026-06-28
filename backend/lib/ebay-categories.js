/**
 * Maps TecDoc product names (article.articleProductName) to eBay category IDs.
 *
 * Category IDs are per-marketplace since each eBay national site has its own tree.
 * Matching uses keyword arrays; the first entry whose keywords all appear in the
 * lowercased product name wins. Order matters — put more specific entries first.
 *
 * To verify / update IDs: in Seller Hub open "Research" → "Find categories",
 * or use the eBay Taxonomy API: GET /commerce/taxonomy/v1/get_default_category_tree_id
 */

// ─── Per-marketplace category tables ─────────────────────────────────────────
// Each entry: { keywords: [string], id: string, name: string }
// keywords are ANDed: ALL must appear (as substrings) in the lowercased product name.

const MAPS = {
  // ─── eBay UK (EBAY_GB, site 3) ───────────────────────────────────────────
  // Root path: Vehicle Parts & Accessories (9801) → Car Parts (179697) → Engine & Engine Parts
  "ebay-uk": [
    // Engine internals
    { keywords: ["connecting rod"],                    id: "33558", name: "Crankshafts, Connecting Rods & Parts" },
    { keywords: ["conrod"],                            id: "33558", name: "Crankshafts, Connecting Rods & Parts" },
    { keywords: ["con rod"],                           id: "33558", name: "Crankshafts, Connecting Rods & Parts" },
    { keywords: ["crankshaft"],                        id: "33558", name: "Crankshafts, Connecting Rods & Parts" },
    { keywords: ["piston ring"],                       id: "33562", name: "Pistons, Rings, Rods & Parts" },
    { keywords: ["piston kit"],                        id: "33562", name: "Pistons, Rings, Rods & Parts" },
    { keywords: ["piston"],                            id: "33562", name: "Pistons, Rings, Rods & Parts" },
    { keywords: ["cylinder head gasket"],              id: "33563", name: "Gaskets & Seals" },
    { keywords: ["head gasket"],                       id: "33563", name: "Gaskets & Seals" },
    { keywords: ["cylinder head"],                     id: "33561", name: "Cylinder Heads & Parts" },
    { keywords: ["camshaft"],                          id: "33556", name: "Camshafts & Parts" },
    { keywords: ["big end bearing"],                   id: "33559", name: "Engine Bearings" },
    { keywords: ["main bearing"],                      id: "33559", name: "Engine Bearings" },
    { keywords: ["crankshaft bearing"],                id: "33559", name: "Engine Bearings" },
    { keywords: ["engine bearing"],                    id: "33559", name: "Engine Bearings" },
    { keywords: ["conrod bearing"],                    id: "33559", name: "Engine Bearings" },
    { keywords: ["rod bearing"],                       id: "33559", name: "Engine Bearings" },
    { keywords: ["small end bush"],                    id: "33559", name: "Engine Bearings" },
    { keywords: ["timing chain kit"],                  id: "33567", name: "Timing Chains & Kits" },
    { keywords: ["timing chain"],                      id: "33567", name: "Timing Chains & Kits" },
    { keywords: ["timing belt kit"],                   id: "33567", name: "Timing Chains & Kits" },
    { keywords: ["timing belt"],                       id: "33567", name: "Timing Chains & Kits" },
    { keywords: ["cam chain"],                         id: "33567", name: "Timing Chains & Kits" },
    { keywords: ["turbocharger"],                      id: "33569", name: "Turbos, Superchargers & Parts" },
    { keywords: ["turbo charger"],                     id: "33569", name: "Turbos, Superchargers & Parts" },
    { keywords: ["supercharger"],                      id: "33569", name: "Turbos, Superchargers & Parts" },
    { keywords: ["water pump"],                        id: "33571", name: "Water Pumps" },
    { keywords: ["oil pump"],                          id: "33570", name: "Oil Pumps" },
    // Gaskets & seals
    { keywords: ["oil seal"],                          id: "33563", name: "Gaskets & Seals" },
    { keywords: ["shaft seal"],                        id: "33563", name: "Gaskets & Seals" },
    { keywords: ["gasket set"],                        id: "33563", name: "Gaskets & Seals" },
    { keywords: ["gasket kit"],                        id: "33563", name: "Gaskets & Seals" },
    { keywords: ["gasket"],                            id: "33563", name: "Gaskets & Seals" },
    { keywords: ["seal kit"],                          id: "33563", name: "Gaskets & Seals" },
    // Brakes
    { keywords: ["brake disc"],                        id: "48489", name: "Brake Discs" },
    { keywords: ["brake rotor"],                       id: "48489", name: "Brake Discs" },
    { keywords: ["brake drum"],                        id: "48489", name: "Brake Drums" },
    { keywords: ["brake pad"],                         id: "48490", name: "Brake Pads & Shoes" },
    { keywords: ["brake shoe"],                        id: "48490", name: "Brake Pads & Shoes" },
    { keywords: ["brake caliper"],                     id: "48491", name: "Brake Calipers" },
    { keywords: ["brake master cylinder"],             id: "48492", name: "Brake Master Cylinders" },
    { keywords: ["abs sensor"],                        id: "48493", name: "ABS Sensors" },
    // Suspension & steering
    { keywords: ["shock absorber"],                    id: "48556", name: "Shock Absorbers & Struts" },
    { keywords: ["strut"],                             id: "48556", name: "Shock Absorbers & Struts" },
    { keywords: ["coil spring"],                       id: "48557", name: "Springs" },
    { keywords: ["ball joint"],                        id: "48559", name: "Ball Joints" },
    { keywords: ["control arm"],                       id: "48560", name: "Control Arms & Parts" },
    { keywords: ["wishbone"],                          id: "48560", name: "Control Arms & Parts" },
    { keywords: ["tie rod end"],                       id: "48561", name: "Tie Rod Ends" },
    { keywords: ["track rod end"],                     id: "48561", name: "Tie Rod Ends" },
    { keywords: ["tie rod"],                           id: "48561", name: "Tie Rod Ends" },
    { keywords: ["wheel bearing kit"],                 id: "48562", name: "Wheel Bearings" },
    { keywords: ["wheel bearing"],                     id: "48562", name: "Wheel Bearings" },
    { keywords: ["hub bearing"],                       id: "48562", name: "Wheel Bearings" },
    { keywords: ["steering rack"],                     id: "48563", name: "Steering Racks" },
    { keywords: ["power steering pump"],               id: "48564", name: "Power Steering Pumps" },
    { keywords: ["drive shaft"],                       id: "48565", name: "Drive Shafts & Axles" },
    { keywords: ["cv joint"],                          id: "48565", name: "Drive Shafts & Axles" },
    { keywords: ["driveshaft"],                        id: "48565", name: "Drive Shafts & Axles" },
    // Electrical
    { keywords: ["alternator"],                        id: "36087", name: "Alternators & Starters" },
    { keywords: ["starter motor"],                     id: "36087", name: "Alternators & Starters" },
    { keywords: ["starter"],                           id: "36087", name: "Alternators & Starters" },
    { keywords: ["ignition coil"],                     id: "36116", name: "Ignition Coils" },
    { keywords: ["spark plug"],                        id: "36117", name: "Spark Plugs" },
    { keywords: ["glow plug"],                         id: "36118", name: "Glow Plugs" },
    { keywords: ["lambda sensor"],                     id: "36119", name: "Lambda / O2 Sensors" },
    { keywords: ["oxygen sensor"],                     id: "36119", name: "Lambda / O2 Sensors" },
    { keywords: ["o2 sensor"],                         id: "36119", name: "Lambda / O2 Sensors" },
    { keywords: ["mass air flow"],                     id: "36120", name: "MAF Sensors" },
    { keywords: ["air flow sensor"],                   id: "36120", name: "MAF Sensors" },
    { keywords: ["crankshaft sensor"],                 id: "36121", name: "Crankshaft Sensors" },
    { keywords: ["camshaft sensor"],                   id: "36121", name: "Camshaft Sensors" },
    { keywords: ["throttle body"],                     id: "36122", name: "Throttle Bodies" },
    { keywords: ["egr valve"],                         id: "36123", name: "EGR Valves" },
    { keywords: ["fuel injector"],                     id: "36124", name: "Fuel Injectors" },
    { keywords: ["injector"],                          id: "36124", name: "Fuel Injectors" },
    { keywords: ["fuel pump"],                         id: "36125", name: "Fuel Pumps" },
    // Cooling
    { keywords: ["radiator"],                          id: "48601", name: "Radiators" },
    { keywords: ["thermostat"],                        id: "48602", name: "Thermostats" },
    { keywords: ["intercooler"],                       id: "48603", name: "Intercoolers" },
    { keywords: ["coolant reservoir"],                 id: "48604", name: "Coolant Reservoirs" },
    // Filters
    { keywords: ["oil filter"],                        id: "48700", name: "Oil Filters" },
    { keywords: ["air filter"],                        id: "48701", name: "Air Filters" },
    { keywords: ["fuel filter"],                       id: "48702", name: "Fuel Filters" },
    { keywords: ["cabin filter"],                      id: "48703", name: "Cabin Air Filters" },
    { keywords: ["pollen filter"],                     id: "48703", name: "Cabin Air Filters" },
    // Clutch & transmission
    { keywords: ["clutch kit"],                        id: "48800", name: "Clutch Kits" },
    { keywords: ["clutch disc"],                       id: "48800", name: "Clutch Kits" },
    { keywords: ["flywheel"],                          id: "48801", name: "Flywheels" },
    { keywords: ["dual mass flywheel"],                id: "48801", name: "Flywheels" },
    { keywords: ["gearbox"],                           id: "48802", name: "Gearboxes" },
    { keywords: ["transmission"],                      id: "48802", name: "Gearboxes" },
    // Exhaust
    { keywords: ["exhaust manifold"],                  id: "48900", name: "Exhaust Manifolds" },
    { keywords: ["catalytic converter"],               id: "48901", name: "Catalytic Converters" },
    { keywords: ["dpf"],                               id: "48902", name: "Diesel Particulate Filters" },
    { keywords: ["diesel particulate"],                id: "48902", name: "Diesel Particulate Filters" },
  ],

  // ─── eBay DE (EBAY_DE, site 77) ──────────────────────────────────────────
  // Root: Auto & Motorrad: Teile → Auto-Ersatz- & -Reparaturteile → Motorteile & Zubehör
  "ebay-de": [
    { keywords: ["connecting rod"],   id: "80076", name: "Kurbelwellen, Pleuel & Teile" },
    { keywords: ["conrod"],           id: "80076", name: "Kurbelwellen, Pleuel & Teile" },
    { keywords: ["con rod"],          id: "80076", name: "Kurbelwellen, Pleuel & Teile" },
    { keywords: ["crankshaft"],       id: "80076", name: "Kurbelwellen, Pleuel & Teile" },
    { keywords: ["piston ring"],      id: "80077", name: "Kolben, Ringe & Teile" },
    { keywords: ["piston"],           id: "80077", name: "Kolben, Ringe & Teile" },
    { keywords: ["cylinder head"],    id: "80078", name: "Zylinderkopf & Teile" },
    { keywords: ["head gasket"],      id: "80079", name: "Dichtungen & Simmerringe" },
    { keywords: ["gasket"],           id: "80079", name: "Dichtungen & Simmerringe" },
    { keywords: ["oil seal"],         id: "80079", name: "Dichtungen & Simmerringe" },
    { keywords: ["camshaft"],         id: "80080", name: "Nockenwellen & Teile" },
    { keywords: ["big end bearing"],  id: "80081", name: "Motorlager & Lagerschalen" },
    { keywords: ["main bearing"],     id: "80081", name: "Motorlager & Lagerschalen" },
    { keywords: ["timing chain"],     id: "80082", name: "Steuerkette & Kits" },
    { keywords: ["timing belt"],      id: "80082", name: "Steuerkette & Kits" },
    { keywords: ["turbocharger"],     id: "80083", name: "Turbolader & Teile" },
    { keywords: ["water pump"],       id: "80084", name: "Wasserpumpen" },
    { keywords: ["oil pump"],         id: "80085", name: "Ölpumpen" },
    { keywords: ["brake disc"],       id: "80100", name: "Bremsscheiben" },
    { keywords: ["brake pad"],        id: "80101", name: "Bremsbeläge" },
    { keywords: ["alternator"],       id: "80120", name: "Lichtmaschinen & Anlasser" },
    { keywords: ["starter motor"],    id: "80120", name: "Lichtmaschinen & Anlasser" },
    { keywords: ["fuel injector"],    id: "80130", name: "Einspritzdüsen" },
    { keywords: ["injector"],         id: "80130", name: "Einspritzdüsen" },
  ],

  // ─── eBay FR (EBAY_FR, site 71) ──────────────────────────────────────────
  "ebay-fr": [
    { keywords: ["connecting rod"],   id: "71450", name: "Bielles & Vilebrequins" },
    { keywords: ["conrod"],           id: "71450", name: "Bielles & Vilebrequins" },
    { keywords: ["crankshaft"],       id: "71450", name: "Bielles & Vilebrequins" },
    { keywords: ["piston ring"],      id: "71451", name: "Pistons & Segments" },
    { keywords: ["piston"],           id: "71451", name: "Pistons & Segments" },
    { keywords: ["cylinder head"],    id: "71452", name: "Culasses" },
    { keywords: ["head gasket"],      id: "71453", name: "Joints & Joints Spi" },
    { keywords: ["gasket"],           id: "71453", name: "Joints & Joints Spi" },
    { keywords: ["oil seal"],         id: "71453", name: "Joints & Joints Spi" },
    { keywords: ["camshaft"],         id: "71454", name: "Arbres à Cames" },
    { keywords: ["big end bearing"],  id: "71455", name: "Paliers & Coussinets" },
    { keywords: ["main bearing"],     id: "71455", name: "Paliers & Coussinets" },
    { keywords: ["timing chain"],     id: "71456", name: "Chaînes & Courroies de Distribution" },
    { keywords: ["timing belt"],      id: "71456", name: "Chaînes & Courroies de Distribution" },
    { keywords: ["turbocharger"],     id: "71457", name: "Turbocompresseurs" },
    { keywords: ["water pump"],       id: "71458", name: "Pompes à Eau" },
    { keywords: ["oil pump"],         id: "71459", name: "Pompes à Huile" },
    { keywords: ["brake disc"],       id: "71470", name: "Disques de Frein" },
    { keywords: ["brake pad"],        id: "71471", name: "Plaquettes de Frein" },
    { keywords: ["alternator"],       id: "71480", name: "Alternateurs & Démarreurs" },
    { keywords: ["starter motor"],    id: "71480", name: "Alternateurs & Démarreurs" },
    { keywords: ["fuel injector"],    id: "71490", name: "Injecteurs" },
    { keywords: ["injector"],         id: "71490", name: "Injecteurs" },
  ],

  // ─── eBay IT (EBAY_IT, site 101) ─────────────────────────────────────────
  "ebay-it": [
    { keywords: ["connecting rod"],   id: "60050", name: "Bielle e Alberi a Gomito" },
    { keywords: ["crankshaft"],       id: "60050", name: "Bielle e Alberi a Gomito" },
    { keywords: ["piston"],           id: "60051", name: "Pistoni e Segmenti" },
    { keywords: ["cylinder head"],    id: "60052", name: "Teste del Cilindro" },
    { keywords: ["gasket"],           id: "60053", name: "Guarnizioni e Paraolio" },
    { keywords: ["oil seal"],         id: "60053", name: "Guarnizioni e Paraolio" },
    { keywords: ["camshaft"],         id: "60054", name: "Alberi a Camme" },
    { keywords: ["timing chain"],     id: "60055", name: "Distribuzione" },
    { keywords: ["timing belt"],      id: "60055", name: "Distribuzione" },
    { keywords: ["turbocharger"],     id: "60056", name: "Turbocompressori" },
    { keywords: ["water pump"],       id: "60057", name: "Pompe dell'Acqua" },
    { keywords: ["brake disc"],       id: "60070", name: "Dischi Freno" },
    { keywords: ["brake pad"],        id: "60071", name: "Pastiglie Freno" },
    { keywords: ["alternator"],       id: "60080", name: "Alternatori e Motorini" },
  ],

  // ─── eBay ES (EBAY_ES, site 186) ─────────────────────────────────────────
  "ebay-es": [
    { keywords: ["connecting rod"],   id: "55050", name: "Bielas y Cigüeñales" },
    { keywords: ["crankshaft"],       id: "55050", name: "Bielas y Cigüeñales" },
    { keywords: ["piston"],           id: "55051", name: "Pistones y Aros" },
    { keywords: ["cylinder head"],    id: "55052", name: "Culatas" },
    { keywords: ["gasket"],           id: "55053", name: "Juntas y Retenes" },
    { keywords: ["oil seal"],         id: "55053", name: "Juntas y Retenes" },
    { keywords: ["camshaft"],         id: "55054", name: "Árbol de Levas" },
    { keywords: ["timing chain"],     id: "55055", name: "Distribución" },
    { keywords: ["timing belt"],      id: "55055", name: "Distribución" },
    { keywords: ["turbocharger"],     id: "55056", name: "Turbocompresores" },
    { keywords: ["water pump"],       id: "55057", name: "Bombas de Agua" },
    { keywords: ["brake disc"],       id: "55070", name: "Discos de Freno" },
    { keywords: ["brake pad"],        id: "55071", name: "Pastillas de Freno" },
    { keywords: ["alternator"],       id: "55080", name: "Alternadores y Motores de Arranque" },
  ],
};

// Fall back to eBay UK for marketplaces without a dedicated map
const FALLBACK = "ebay-uk";

/**
 * Returns { id, name } for the best-matching eBay category, or null if unrecognised.
 * @param {string} productName  - TecDoc articleProductName (English)
 * @param {string} marketplace  - Internal marketplace id e.g. "ebay-de"
 */
export function getEbayCategory(productName, marketplace = "ebay-uk") {
  if (!productName) return null;

  const lower = productName.toLowerCase();
  const map   = MAPS[marketplace] || MAPS[FALLBACK];
  const enMap = MAPS["ebay-uk"];

  for (const entry of map) {
    if (entry.keywords.every((kw) => lower.includes(kw))) {
      // Resolve the English name from the UK map (same keyword set) so the UI
      // always displays English regardless of which marketplace is selected.
      const enEntry = enMap.find(
        (e) => e.keywords.length === entry.keywords.length &&
               e.keywords.every((kw) => entry.keywords.includes(kw))
      );
      return { id: entry.id, name: enEntry ? enEntry.name : entry.name };
    }
  }
  return null;
}
