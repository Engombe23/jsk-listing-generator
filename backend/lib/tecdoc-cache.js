import { supabaseAdmin, supabaseAdminReady } from "./supabaseAdmin.js";

const TABLE = "tecdoc_vehicle_cache";

// ─── Read ─────────────────────────────────────────────────────────────────────

// Batch-fetch vehicle records from the Supabase cache.
// Returns a Map keyed by vehicle_id as a string (matches TecDoc response field types).
export async function lookupVehiclesByIds(vehicleIds) {
  if (!supabaseAdminReady || !vehicleIds?.length) return new Map();

  const ids = [...new Set(
    vehicleIds.map(v => Number(v)).filter(n => Number.isFinite(n) && n > 0)
  )];
  if (!ids.length) return new Map();

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("vehicle_id,engine_codes,power_kw,power_hp,capacity_cc,manufacturer_name,model_name,type_engine_name")
    .in("vehicle_id", ids);

  if (error) {
    console.error("[tecdoc-cache] lookup error:", error.message);
    return new Map();
  }

  return new Map((data || []).map(r => [String(r.vehicle_id), r]));
}

// ─── Write ────────────────────────────────────────────────────────────────────

// Upsert an array of already-normalised records into the cache.
export async function saveVehicles(records) {
  if (!supabaseAdminReady || !records?.length) return;

  const now = new Date().toISOString();
  const rows = records.map(r => ({ ...r, last_synced_at: now }));

  const { error } = await supabaseAdmin
    .from(TABLE)
    .upsert(rows, { onConflict: "vehicle_id" });

  if (error) console.error("[tecdoc-cache] save error:", error.message);
}

// ─── Normalise ────────────────────────────────────────────────────────────────

// Returns v if it is a non-empty, non-null value; otherwise undefined (so the
// next ?? operand is tried). Prevents empty-string API values from blocking
// the fallback chain and reaching Postgres as "" for numeric columns.
function val(...candidates) {
  for (const v of candidates) {
    if (v !== null && v !== undefined && v !== "") return v;
  }
  return null;
}

function toNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toInt(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = parseInt(v, 10);
  return Number.isInteger(n) ? n : null;
}

// Maps a raw TecDoc API vehicle/engine-type row to the DB schema.
// Pass { manufacturerName, modelName } from the parent level (the API doesn't
// always repeat them on the engine-type object).
export function normalizeVehicleRecord(apiRow, { manufacturerName = "", modelName = "" } = {}) {
  const vid = val(apiRow.vehicleId, apiRow.typeId, apiRow.kType, apiRow.kTypeId, apiRow.id);
  const vehicleIdNum = toInt(vid);
  if (!vehicleIdNum || vehicleIdNum <= 0) return null;

  return {
    vehicle_id:           vehicleIdNum,
    engine_id:            apiRow.engineId ? String(apiRow.engineId) : null,
    manufacturer_name:    manufacturerName || apiRow.manufacturerName || apiRow.manuName || "",
    model_name:           modelName || apiRow.modelName || apiRow.carModelName || "",
    type_engine_name:     val(apiRow.typeEngineName, apiRow.typeName, apiRow.carTypeName, apiRow.engineName) ?? "",
    engine_codes:         normalizeEngCodes(
                            apiRow.engCodes || apiRow.engineCodes || apiRow.engineCode || apiRow.motorCodes || ""
                          ),
    power_kw:             toNum(val(apiRow.powerKw,  apiRow.kw)),
    power_hp:             toNum(val(apiRow.powerPs,  apiRow.ps,  apiRow.hp)),
    capacity_cc:          toNum(val(apiRow.capacityTech, apiRow.displacement, apiRow.cc)),
    capacity_litres:      toNum(val(apiRow.capacityLitres, apiRow.capacityLtr)),
    fuel_type:            val(apiRow.fuelType, apiRow.fuel),
    body_type:            val(apiRow.bodyType, apiRow.body),
    number_of_cylinders:  toInt(val(apiRow.numberOfCylinders, apiRow.cylinders)),
    construction_start:   parseDate(val(apiRow.constructionIntervalStart, apiRow.yearFrom)),
    construction_end:     parseDate(val(apiRow.constructionIntervalEnd,   apiRow.yearTo)),
    raw_data:             apiRow,
    first_synced_at:      new Date().toISOString(),
    last_synced_at:       new Date().toISOString(),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Split, deduplicate, and uppercase engine codes from any raw format.
export function normalizeEngCodes(raw) {
  if (!raw) return [];
  const str = Array.isArray(raw) ? raw.join(",") : String(raw);
  return [...new Set(
    str.split(/[,;\|\/\s]+/).map(c => c.trim().toUpperCase()).filter(Boolean)
  )];
}

// Parse construction-interval strings into ISO date strings (YYYY-MM-DD).
// TecDoc returns various formats: YYYY-MM, MM/YYYY, YYYYMM, YYYY.
export function parseDate(val) {
  if (!val) return null;
  const s = String(val).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}$/.test(s))       return `${s}-01`;

  const mmy = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmy) return `${mmy[2]}-${mmy[1].padStart(2, "0")}-01`;

  const yyyymm = s.match(/^(\d{4})(\d{2})$/);
  if (yyyymm) return `${yyyymm[1]}-${yyyymm[2]}-01`;

  if (/^\d{4}$/.test(s)) return `${s}-01-01`;

  return null;
}
