import { Router } from "express";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import {
  createJob,
  runImport,
  buildImportReport,
  stopJob,
  isJobActive,
} from "../lib/import-runner.js";

const router = Router();

const JOBS_TABLE = "tecdoc_import_jobs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function intOpt(req, key, fallback) {
  const v = parseInt(req.body?.[key] ?? req.query?.[key], 10);
  return Number.isFinite(v) ? v : fallback;
}

// Fire an import in the background (no await) and swallow top-level errors so
// they don't crash the web server process.
function fireAndForget(jobId, opts) {
  runImport(jobId, opts).catch(e => {
    console.error(`[admin-import] job ${jobId} failed: ${e.message}`);
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/admin/import/start
router.post("/admin/import/start", requireAdmin, async (req, res) => {
  try {
    const job = await createJob();
    const opts = {
      dryRun:               req.body?.dry_run === true,
      filterManufacturerId: req.body?.manufacturer_id ?? null,
      filterModelId:        req.body?.model_id ?? null,
      batchSize:            intOpt(req, "batch_size", 250),
      delayMs:              intOpt(req, "delay_ms", 400),
    };
    fireAndForget(job.id, opts);
    res.json({ job_id: job.id, status: "running" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/import/resume/:jobId
router.post("/admin/import/resume/:jobId", requireAdmin, async (req, res) => {
  const { jobId } = req.params;
  try {
    if (isJobActive(jobId)) {
      return res.status(409).json({ error: "Job is already running in this process." });
    }
    // Update status so the runner sees it as resumable
    await supabaseAdmin
      .from(JOBS_TABLE)
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .eq("id", jobId);

    const opts = {
      batchSize: intOpt(req, "batch_size", 250),
      delayMs:   intOpt(req, "delay_ms", 400),
    };
    fireAndForget(jobId, opts);
    res.json({ job_id: jobId, status: "running" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/import/stop/:jobId
router.post("/admin/import/stop/:jobId", requireAdmin, async (req, res) => {
  const { jobId } = req.params;
  try {
    // Signal the in-process runner (if it's in this process)
    stopJob(jobId);
    // Also write to DB so a CLI-launched runner can pick it up on its next poll
    await supabaseAdmin
      .from(JOBS_TABLE)
      .update({ status: "stopping", updated_at: new Date().toISOString() })
      .eq("id", jobId);
    res.json({ job_id: jobId, status: "stopping" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/import/jobs
router.get("/admin/import/jobs", requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from(JOBS_TABLE)
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/import/jobs/:jobId
router.get("/admin/import/jobs/:jobId", requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from(JOBS_TABLE)
      .select("*")
      .eq("id", req.params.jobId)
      .single();
    if (error) return res.status(404).json({ error: "Job not found" });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/import/report
router.get("/admin/import/report", requireAdmin, async (req, res) => {
  try {
    const report = await buildImportReport(req.query.manufacturer_id ?? null);
    res.json(report);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/import/manufacturer/:manufacturerId
// Import a single manufacturer (all its models) as a quick one-off.
router.post("/admin/import/manufacturer/:manufacturerId", requireAdmin, async (req, res) => {
  const { manufacturerId } = req.params;
  try {
    const job = await createJob();
    fireAndForget(job.id, {
      filterManufacturerId: manufacturerId,
      batchSize:            intOpt(req, "batch_size", 250),
      delayMs:              intOpt(req, "delay_ms", 400),
    });
    res.json({ job_id: job.id, status: "running", manufacturer_id: manufacturerId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/import/model/:modelId
// Import a single model as a quick one-off.
router.post("/admin/import/model/:modelId", requireAdmin, async (req, res) => {
  const { modelId } = req.params;
  try {
    const job = await createJob();
    fireAndForget(job.id, {
      filterModelId: modelId,
      batchSize:     intOpt(req, "batch_size", 250),
      delayMs:       intOpt(req, "delay_ms", 400),
    });
    res.json({ job_id: job.id, status: "running", model_id: modelId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/import/retry-failures/:jobId
// Re-run only the models that failed in a given job.
router.post("/admin/import/retry-failures/:jobId", requireAdmin, async (req, res) => {
  const { jobId } = req.params;
  try {
    const { data: job, error } = await supabaseAdmin
      .from(JOBS_TABLE)
      .select("failed_models")
      .eq("id", jobId)
      .single();

    if (error || !job) return res.status(404).json({ error: "Job not found" });

    const failedModels = Array.isArray(job.failed_models) ? job.failed_models : [];
    if (!failedModels.length) return res.json({ message: "No failed models to retry." });

    const retryJob = await createJob({ status: "pending" });
    const results  = [];

    // Process failed models serially in the background
    (async () => {
      for (const { manufacturerId, modelId, manufacturerName, modelName } of failedModels) {
        const miniJob = await createJob();
        try {
          await runImport(miniJob.id, {
            filterManufacturerId: manufacturerId,
            filterModelId: modelId,
            delayMs: 600,
          });
          results.push({ modelId, status: "ok" });
        } catch (e) {
          results.push({ modelId, status: "failed", error: e.message });
        }
      }
      // Clear failed_models on success
      await supabaseAdmin
        .from(JOBS_TABLE)
        .update({ failed_models: results.filter(r => r.status !== "ok"), updated_at: new Date().toISOString() })
        .eq("id", jobId);
    })().catch(e => console.error("[admin-import] retry-failures error:", e.message));

    res.json({ retry_job_id: retryJob.id, retrying: failedModels.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
