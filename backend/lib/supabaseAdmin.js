import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Used ONLY on the backend (never sent to
// the browser) to write/read analytics events. Requires SUPABASE_SERVICE_ROLE_KEY
// (Project Settings → API → service_role secret in Supabase) in backend/.env,
// in addition to the existing VITE_SUPABASE_URL.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = (SUPABASE_URL && SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export const supabaseAdminReady = !!supabaseAdmin;
