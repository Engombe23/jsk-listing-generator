import { supabaseAdmin, supabaseAdminReady } from "../lib/supabaseAdmin.js";

// Backend-only allowlist — separate from the frontend's VITE_ADMIN_EMAILS so
// it's never bundled into client JS. Configure via ADMIN_EMAILS in
// backend/.env, e.g. ADMIN_EMAILS="you@example.com,colleague@example.com".
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Verifies the Supabase access token sent as "Authorization: Bearer <token>"
// and checks the resulting user's email against the admin allowlist.
// This is the actual security boundary for /api/analytics/* — the frontend
// route guard (AdminRoute.jsx) only controls UI navigation, not API access.
export async function requireAdmin(req, res, next) {
  if (!supabaseAdminReady) {
    return res.status(503).json({ error: "Analytics storage is not configured (missing SUPABASE_SERVICE_ROLE_KEY)." });
  }
  if (ADMIN_EMAILS.length === 0) {
    return res.status(503).json({ error: "Admin access is not configured (missing ADMIN_EMAILS on the backend)." });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing admin authorization token." });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  const email = data?.user?.email?.toLowerCase();

  if (error || !email || !ADMIN_EMAILS.includes(email)) {
    return res.status(403).json({ error: "Not authorized to access admin analytics." });
  }

  req.adminUser = data.user;
  next();
}
