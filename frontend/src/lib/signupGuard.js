const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Fire-and-forget: records the signup's IP/user-agent for admin review of
// possible multi-accounting (see supabase/signup_abuse_prevention.sql for
// why this is a detection signal, not an automatic block). Never throws —
// this must never be allowed to break signup for a real user.
export function recordSignupFingerprint(accessToken) {
  if (!accessToken) return;
  try {
    fetch(`${API_URL}/api/auth/record-signup`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}
