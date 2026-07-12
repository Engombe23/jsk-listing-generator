import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    flowType: "pkce",
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const AUTH_CALLBACK_PATH = "/auth/callback";

export function getAuthCallbackUrl({ plan, interval } = {}) {
  const url = new URL(`${window.location.origin}${AUTH_CALLBACK_PATH}`);
  if (plan && interval) {
    url.searchParams.set("plan", plan);
    url.searchParams.set("interval", interval);
  }
  return url.toString();
}

let exchangeCodePromise = null;

export async function ensureSessionFromAuthCallback(code) {
  const { data: { session: existing } } = await supabase.auth.getSession();
  if (existing) return existing;

  if (code) {
    if (!exchangeCodePromise) {
      exchangeCodePromise = supabase.auth
        .exchangeCodeForSession(code)
        .then(({ data, error }) => {
          if (error) throw error;
          return data.session;
        })
        .finally(() => {
          exchangeCodePromise = null;
        });
    }
    return exchangeCodePromise;
  }

  const hash = window.location.hash?.replace(/^#/, "");
  if (hash) {
    const hashParams = new URLSearchParams(hash);
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
      return data.session;
    }
  }

  return null;
}
