import { FUEL_TYPE_MAP } from "./config.js";

export function normaliseMake(make) {
  if (!make) return "";
  const upper = String(make).toUpperCase().trim();
  if (upper === "VOLKSWAGEN") return "VW";
  return upper;
}

export function normaliseModel(model) {
  if (!model) return "";
  return String(model)
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normaliseEngineCode(code) {
  if (!code) return [];
  return String(code)
    .split(/[,\s;|\/]+/)
    .map((s) => s.toUpperCase().trim())
    .filter(Boolean);
}

export function normaliseEngineSize(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  const litres = num < 20 ? num : num / 1000;
  return Math.round(litres * 10) / 10;
}

export function normaliseEngineSizeCc(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  // If < 20 assume already in litres, convert to cc
  const cc = num < 20 ? Math.round(num * 1000) : Math.round(num);
  return cc > 0 ? cc : null;
}

export function normaliseFuelType(fuel) {
  if (!fuel) return null;
  const lower = String(fuel).toLowerCase().trim();
  // Try direct match first
  if (FUEL_TYPE_MAP[lower]) return FUEL_TYPE_MAP[lower];
  // Try partial / token match
  for (const [key, val] of Object.entries(FUEL_TYPE_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

export function normaliseYear(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr);
  const match = str.match(/(\d{4})/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  if (year < 1900 || year > 2200) return null;
  return year;
}

// VIN year table: position 10 character → model year
const VIN_YEAR_MAP = {
  A:2010,B:2011,C:2012,D:2013,E:2014,F:2015,G:2016,H:2017,J:2018,K:2019,
  L:2020,M:2021,N:2022,P:2023,R:2024,S:2025,T:2026,V:2027,W:2028,X:2029,
  Y:2030,"1":2001,"2":2002,"3":2003,"4":2004,"5":2005,"6":2006,"7":2007,
  "8":2008,"9":2009
};

function yearFromVin(vin) {
  if (!vin || vin.length < 11) return null;
  return VIN_YEAR_MAP[vin[9].toUpperCase()] || null;
}

// Extract engine displacement in litres from a variant/engine-name string.
// e.g. "3.0 D 4x4" → 3.0,  "2.0 TDI" → 2.0,  "306D1(M57D30)" → null
function engineSizeFromVariant(str) {
  if (!str) return null;
  const m = String(str).match(/(\d+[.,]\d+)/);
  if (!m) return null;
  const val = parseFloat(m[1].replace(",", "."));
  // Only treat as litres if in a sensible engine-size range
  return val > 0.5 && val < 10 ? val : null;
}

export function normaliseVehicle(raw) {
  if (!raw) return null;

  const vinStr = raw.vin || raw.VIN || null;

  const make = normaliseMake(
    raw.manufacturerName || raw.manufacturer || raw.manufacture ||
    raw.make || raw.brand || raw.Make
  );

  const year =
    normaliseYear(
      raw.constructionIntervalStart || raw.yearFrom || raw.year ||
      raw.Year || raw.modelYear || raw.ProductionYear
    ) || yearFromVin(vinStr);

  const powerKwRaw = raw.powerKw ?? raw.kW ?? raw.kw ?? null;
  const powerPsRaw = raw.powerPs ?? raw.powerHp ?? raw.hp ?? raw.HP ?? null;

  // Prefer displacement from the variant/engine-name string (marketing value,
  // e.g. "3.0 D 4x4") because TecDoc's capacityTech is sometimes stored with
  // reduced precision (e.g. 2900cc → 2.9L instead of 2993cc → 3.0L).
  const variantStr = raw.typeEngineName || raw.typeName || raw.variant || raw.Variant || "";
  const engineSizeLitres =
    engineSizeFromVariant(variantStr) ??
    normaliseEngineSize(raw.capacityTech || raw.engineSize || raw.displacement || raw.EngineSize || raw.engineDisplacement);

  const rawCc = raw.capacityTech || raw.engineSize || raw.displacement || raw.EngineSize || raw.engineDisplacement;

  return {
    vehicleId: raw.vehicleId || raw.typeId || raw.kType || raw.id || null,
    make,
    model: normaliseModel(raw.modelName || raw.model || raw.series || raw.Model),
    variant: variantStr || null,
    year,
    yearTo: normaliseYear(raw.constructionIntervalEnd || raw.yearTo),
    fuelType: normaliseFuelType(raw.fuelType || raw.fuel || raw.fuelTypeDescription || raw.FuelType || raw.fuelTypeName),
    engineSizeLitres,
    engineSizeCc: normaliseEngineSizeCc(rawCc),
    engineCodes: normaliseEngineCode(raw.engCodes || raw.engineCodes || raw.engineCode || raw.EngineCode),
    powerKw: powerKwRaw != null ? parseFloat(powerKwRaw) || null : null,
    powerPs: powerPsRaw != null ? Math.round(parseFloat(powerPsRaw)) || null : null,
    cylinders: raw.cylinderCount || raw.cylinders || raw.cylinderNo || null,
    vin: vinStr,
    raw
  };
}

// Merge vehicle type detail data (from /api/types/type-id/1/vehicle-type-details/...)
// into an already-normalised vehicle object. Call this after resolving the K number.
export function enrichVehicleWithTypeDetails(vehicle, detail) {
  if (!detail) return vehicle;

  const raw = detail?.vehicleType || detail?.vehicleTypeDetails || detail?.data || detail;

  return {
    ...vehicle,
    model:           vehicle.model || normaliseModel(raw.modelName || raw.model || raw.series || ""),
    variant:         vehicle.variant || raw.typeEngineName || raw.typeName || raw.variant || null,
    yearTo:          vehicle.yearTo  || normaliseYear(raw.constructionIntervalEnd || raw.yearTo),
    fuelType:        vehicle.fuelType        || normaliseFuelType(raw.fuelType || raw.fuelTypeName || raw.fuelTypeDescription || ""),
    engineSizeLitres:vehicle.engineSizeLitres|| normaliseEngineSize(raw.capacityTech || raw.displacement || raw.engineSize),
    engineCodes:     vehicle.engineCodes?.length ? vehicle.engineCodes : normaliseEngineCode(raw.engCodes || raw.engineCodes || raw.engineCode || ""),
    powerKw:         vehicle.powerKw  ?? (raw.powerKw  != null ? parseFloat(raw.powerKw)              || null : null),
    powerPs:         vehicle.powerPs  ?? (raw.powerPs  != null ? Math.round(parseFloat(raw.powerPs))  || null : null),
    cylinders:       vehicle.cylinders ?? (raw.cylinderCount || raw.cylinders || raw.cylinderNo || null)
  };
}
