import { supabaseAdmin } from "./supabaseAdmin.js";
import { normalizeVehicleRecord } from "./tecdoc-cache.js";
import {
  listManufacturers,
  listModelsByManufacturer,
  fetchEngineTypesByModel,
} from "../compatibility/api.js";

const JOBS_TABLE   = "tecdoc_import_jobs";
const CACHE_TABLE  = "tecdoc_vehicle_cache";
const DEFAULT_DELAY_MS  = 400;
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_BATCH_SIZE  = 250;

// ─── Job management ───────────────────────────────────────────────────────────

export async function createJob(extra = {}) {
  const { data, error } = await supabaseAdmin
    .from(JOBS_TABLE)
    .insert({ status: "pending", ...extra })
    .select()
    .single();
  if (error) throw new Error("Failed to create import job: " + error.message);
  return data;
}

async function getJob(jobId) {
  const { data, error } = await supabaseAdmin
    .from(JOBS_TABLE).select("*").eq("id", jobId).single();
  if (error) throw new Error("Job not found: " + error.message);
  return data;
}

async function updateJob(jobId, fields) {
  await supabaseAdmin
    .from(JOBS_TABLE)
    .update({ updated_at: new Date().toISOString(), ...fields })
    .eq("id", jobId);
}

// ─── Active-job registry (in-process stop signal) ─────────────────────────────
// Maps jobId → { stop: () => void }
const _activeJobs = new Map();

export function stopJob(jobId) {
  const entry = _activeJobs.get(jobId);
  if (entry) entry.stop();
}

export function isJobActive(jobId) {
  return _activeJobs.has(jobId);
}

// ─── Core import loop ─────────────────────────────────────────────────────────

export async function runImport(jobId, opts = {}) {
  const {
    dryRun             = false,
    filterManufacturerId = null,
    filterModelId      = null,
    delayMs            = DEFAULT_DELAY_MS,
    batchSize          = DEFAULT_BATCH_SIZE,
    onProgress         = null,
  } = opts;

  let stopped = false;
  _activeJobs.set(jobId, { stop: () => { stopped = true; } });

  const shouldStop = async () => {
    if (stopped) return true;
    // Also honour a DB-level stop request (for cross-process signalling)
    const { data } = await supabaseAdmin.from(JOBS_TABLE).select("status").eq("id", jobId).single();
    return data?.status === "stopping";
  };

  try {
    const job = await getJob(jobId);

    // Resume counters from existing job state (in case we were paused mid-run)
    let manufacturersProcessed = job.manufacturers_processed ?? 0;
    let modelsProcessed        = job.models_processed        ?? 0;
    let vehicleRecords         = job.vehicle_records_processed ?? 0;
    const failedModels         = Array.isArray(job.failed_models) ? [...job.failed_models] : [];

    await updateJob(jobId, { status: "running", started_at: job.started_at || new Date().toISOString() });

    // ── Fetch full manufacturer list ──
    const manufacturers = await listManufacturers();
    console.log(`[Importer] ${manufacturers.length} manufacturers found`);

    // ── Resume-point lookup ──
    const resumeManuId  = job.current_manufacturer_id  || null;
    const resumeModelId = job.current_model_id         || null;

    const manuStartIdx = resumeManuId
      ? Math.max(0, manufacturers.findIndex(m => String(m.manufacturerId ?? m.id ?? "") === resumeManuId))
      : 0;

    for (let mi = manuStartIdx; mi < manufacturers.length; mi++) {
      const manu    = manufacturers[mi];
      const manuId  = String(manu.manufacturerId ?? manu.id ?? "");
      const manuName = manu.manufacturerName || manu.name || manuId;

      if (filterManufacturerId && manuId !== String(filterManufacturerId)) continue;
      if (await shouldStop()) { await updateJob(jobId, { status: "paused" }); return; }

      await updateJob(jobId, { current_manufacturer_id: manuId, current_manufacturer_name: manuName });

      let models;
      try {
        models = await listModelsByManufacturer(manuId);
      } catch (e) {
        console.error(`[Importer] Failed to fetch models for ${manuName}: ${e.message}`);
        continue;
      }

      // Within the resume manufacturer, start from the resume model; otherwise start from 0
      const modelStartIdx = (mi === manuStartIdx && resumeModelId)
        ? Math.max(0, models.findIndex(m => String(m.modelId ?? m.id ?? "") === resumeModelId))
        : 0;

      for (let modi = modelStartIdx; modi < models.length; modi++) {
        const model     = models[modi];
        const modelId   = String(model.modelId ?? model.id ?? "");
        const modelName = model.modelName || model.name || modelId;

        if (filterModelId && modelId !== String(filterModelId)) continue;
        if (await shouldStop()) { await updateJob(jobId, { status: "paused" }); return; }

        await updateJob(jobId, { current_model_id: modelId, current_model_name: modelName });

        let vehicles = [];
        let fetchOk  = false;

        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            vehicles = await fetchEngineTypesByModel(modelId);
            fetchOk  = true;
            break;
          } catch (e) {
            if (attempt === 2) {
              console.warn(`[Importer] ${manuName}/${modelName}: ${e.message}`);
              failedModels.push({ manuId, manuName, modelId, modelName, error: e.message });
            } else {
              await sleep((attempt + 1) * 1200);
            }
          }
        }

        if (fetchOk && vehicles.length > 0) {
          const records = vehicles
            .map(v => normalizeVehicleRecord(v, { manufacturerName: manuName, modelName }))
            .filter(r => r && Number.isInteger(r.vehicle_id) && r.vehicle_id > 0);

          if (!dryRun && records.length > 0) {
            for (let i = 0; i < records.length; i += batchSize) {
              const batch = records.slice(i, i + batchSize);
              const { error } = await supabaseAdmin
                .from(CACHE_TABLE)
                .upsert(batch, { onConflict: "vehicle_id" });
              if (error) {
                // Batch failed — retry one record at a time to salvage valid rows
                for (const record of batch) {
                  const { error: e2 } = await supabaseAdmin
                    .from(CACHE_TABLE)
                    .upsert(record, { onConflict: "vehicle_id" });
                  if (e2) console.warn(`[Importer] skip vehicle ${record.vehicle_id} (${modelName}): ${e2.message}`);
                }
              }
            }
          }

          vehicleRecords += records.length;
        }

        modelsProcessed++;
        onProgress?.({ manufacturersProcessed, modelsProcessed, vehicleRecords });

        await updateJob(jobId, {
          models_processed:           modelsProcessed,
          vehicle_records_processed:  vehicleRecords,
          failed_models:              failedModels,
        });

        await sleep(delayMs);
      }

      manufacturersProcessed++;
      await updateJob(jobId, {
        manufacturers_processed: manufacturersProcessed,
        current_model_id:        null,
        current_model_name:      null,
      });
    }

    await updateJob(jobId, {
      status:       "completed",
      completed_at: new Date().toISOString(),
    });

    console.log(
      `[Importer] Complete — ${manufacturersProcessed} manufacturers, ` +
      `${modelsProcessed} models, ${vehicleRecords} vehicle records`
    );
  } catch (e) {
    console.error("[Importer] Fatal error:", e.message);
    await updateJob(jobId, { status: "failed", last_error: e.message });
    throw e;
  } finally {
    _activeJobs.delete(jobId);
  }
}

// ─── Pre-run report ───────────────────────────────────────────────────────────

export async function buildImportReport(filterManufacturerId = null) {
  const manufacturers = await listManufacturers();
  const subset = filterManufacturerId
    ? manufacturers.filter(m => String(m.manufacturerId ?? m.id ?? "") === String(filterManufacturerId))
    : manufacturers;

  let totalModels = 0;
  for (const manu of subset.slice(0, 20)) { // sample first 20 for speed
    try {
      const models = await listModelsByManufacturer(String(manu.manufacturerId ?? manu.id ?? ""));
      totalModels += models.length;
    } catch {}
  }

  const avgModelsPerManu = subset.length > 0 ? totalModels / Math.min(subset.length, 20) : 0;
  const estimatedModels  = Math.round(avgModelsPerManu * subset.length);
  const estimatedCalls   = estimatedModels; // 1 API call per model
  const estimatedMinutes = Math.round((estimatedCalls * 0.4) / 60); // 400ms delay per call

  return {
    manufacturers:    subset.length,
    estimatedModels,
    estimatedApiCalls: estimatedCalls,
    estimatedMinutes,
    requiredEnvVars: ["RAPIDAPI_KEY", "VITE_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
  };
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
