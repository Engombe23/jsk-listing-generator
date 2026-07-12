import { supabaseAdmin, supabaseAdminReady } from "../lib/supabaseAdmin.js";

// Verifies the Supabase access token sent as "Authorization: Bearer <token>"
// and attaches the resulting user to req.user. Used on every endpoint that
// needs to know "who is calling" for plan/usage enforcement — listing
// generation, compatibility checks, smart pricing searches. This is the real
// security boundary; the frontend's hasFeature()/listingLimit checks are UX
// only and can't be trusted on their own.
export async function requireAuth(req, res, next) {
  if (!supabaseAdminReady) {
    return res.status(503).json({ error: "Auth is not configured (missing SUPABASE_SERVICE_ROLE_KEY)." });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing authorization token." });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid or expired session." });
  }

  req.user = { id: data.user.id, email: data.user.email?.toLowerCase() || null };
  next();
}
