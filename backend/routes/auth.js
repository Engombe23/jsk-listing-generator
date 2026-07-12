import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { supabaseAdmin, supabaseAdminReady } from "../lib/supabaseAdmin.js";

const router = express.Router();

// POST /api/auth/record-signup — called once by the frontend right after a
// successful signup. Records IP + user agent for admin review (NOT an
// automatic block — see signup_abuse_prevention.sql for why).
router.post("/auth/record-signup", requireAuth, async (req, res) => {
  if (!supabaseAdminReady) return res.status(204).end(); // never block signup on this

  try {
    await supabaseAdmin.from("signup_fingerprints").insert({
      user_id:    req.user.id,
      ip_address: req.ip || null,
      user_agent: req.headers["user-agent"] || null,
    });
  } catch (err) {
    console.error("record-signup failed:", err.message);
    // Swallow the error — this is a best-effort detection signal, never a
    // reason to break signup for a real user.
  }
  res.status(204).end();
});

// GET /api/analytics/duplicate-accounts — admin-only. Returns IPs that have
// signed up 2+ distinct accounts, for manual review (shared IPs like
// offices/universities are common and legitimate, so this is a signal, not
// a verdict).
router.get("/analytics/duplicate-accounts", requireAdmin, async (req, res) => {
  if (!supabaseAdminReady) {
    return res.status(503).json({ error: "Analytics storage is not configured." });
  }
  try {
    const { data, error } = await supabaseAdmin
      .from("signup_fingerprints")
      .select("user_id, ip_address, created_at")
      .not("ip_address", "is", null)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw new Error(error.message);

    const byIp = new Map();
    (data || []).forEach((row) => {
      if (!byIp.has(row.ip_address)) byIp.set(row.ip_address, new Map());
      const users = byIp.get(row.ip_address);
      if (!users.has(row.user_id)) users.set(row.user_id, row.created_at);
    });

    const clusters = [];
    for (const [ip, users] of byIp.entries()) {
      if (users.size < 2) continue;
      const userIds = [...users.keys()];
      const emails = await Promise.all(userIds.map(async (id) => {
        try {
          const { data: u } = await supabaseAdmin.auth.admin.getUserById(id);
          return u?.user?.email || id;
        } catch { return id; }
      }));
      clusters.push({
        ip_address: ip,
        account_count: userIds.length,
        emails,
        last_signup: [...users.values()].sort().reverse()[0],
      });
    }
    clusters.sort((a, b) => b.account_count - a.account_count);

    res.json({ clusters: clusters.slice(0, 50) });
  } catch (err) {
    console.error("duplicate-accounts failed:", err.message);
    res.status(500).json({ error: "Failed to compute duplicate accounts" });
  }
});

export default router;
