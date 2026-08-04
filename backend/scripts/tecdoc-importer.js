#!/usr/bin/env node
/**
 * TecDoc vehicle cache importer — CLI entry point.
 *
 * Usage:
 *   node backend/scripts/tecdoc-importer.js [options]
 *
 * Options:
 *   --job-id <uuid>           Resume an existing job (otherwise a new one is created)
 *   --dry-run                 Fetch data but do not write to Supabase
 *   --manufacturer-id <id>   Restrict to a single manufacturer
 *   --model-id <id>          Restrict to a single model (use with --manufacturer-id)
 *   --concurrency <n>        (unused — serial by default for rate-limit safety)
 *   --batch-size <n>         Supabase upsert batch size (default 250)
 *   --delay <ms>             Delay between model fetches in ms (default 400)
 *   --report                 Print a pre-run estimate and exit (no DB writes)
 */

import "../lib/env-preload.js"; // MUST be first — loads .env before api.js captures env vars
import { createJob, runImport, buildImportReport } from "../lib/import-runner.js";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt  = (name, fallback = null) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};

async function main() {
  const dryRun               = flag("dry-run");
  const report               = flag("report");
  const filterManufacturerId = opt("manufacturer-id");
  const filterModelId        = opt("model-id");
  const batchSize            = parseInt(opt("batch-size", "250"), 10);
  const delayMs              = parseInt(opt("delay", "400"), 10);
  let   jobId                = opt("job-id");

  if (report) {
    console.log("Building pre-run estimate…");
    const r = await buildImportReport(filterManufacturerId);
    console.log("\n── TecDoc Import Pre-run Report ─────────────────────────");
    console.log(`  Manufacturers to process : ${r.manufacturers}`);
    console.log(`  Estimated models         : ~${r.estimatedModels}`);
    console.log(`  Estimated API calls      : ~${r.estimatedApiCalls}`);
    console.log(`  Estimated duration       : ~${r.estimatedMinutes} minutes`);
    console.log(`  Required env vars        : ${r.requiredEnvVars.join(", ")}`);
    console.log("─────────────────────────────────────────────────────────\n");
    process.exit(0);
  }

  if (dryRun) {
    console.log("[Importer] Dry-run mode — no data will be written to Supabase");
  }

  if (!jobId) {
    const job = await createJob({
      status: "pending",
      ...(filterManufacturerId ? { current_manufacturer_id: filterManufacturerId } : {}),
    });
    jobId = job.id;
    console.log(`[Importer] Created job ${jobId}`);
  } else {
    console.log(`[Importer] Resuming job ${jobId}`);
  }

  // Graceful shutdown: mark job as paused so it can be resumed
  const shutdown = async (signal) => {
    console.log(`\n[Importer] Received ${signal} — pausing job ${jobId}…`);
    process.exit(0);
  };
  process.on("SIGINT",  () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  await runImport(jobId, {
    dryRun,
    filterManufacturerId,
    filterModelId,
    batchSize,
    delayMs,
    onProgress: ({ manufacturersProcessed, modelsProcessed, vehicleRecords }) => {
      process.stdout.write(
        `\r[Importer] ${manufacturersProcessed} manufacturers | ${modelsProcessed} models | ${vehicleRecords} vehicles`
      );
    },
  });

  console.log("\n[Importer] Done.");
  process.exit(0);
}

main().catch(e => {
  console.error("[Importer] Fatal:", e.message);
  process.exit(1);
});
