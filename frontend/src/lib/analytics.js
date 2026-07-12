import { supabase } from "./supabaseClient";
import { isInternalUser } from "./internalUsers";

// ─── Internal usage analytics (separate from PostHog) ──────────────────────
// trackEvent() is the single entry point every component should use to record
// a usage_events row via the backend. Don't write fetch() calls to /api/events
// directly from components — always go through this helper so session/user/
// plan resolution stays in one place.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const SESSION_KEY = "jsk_analytics_session_id";

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) ||
        `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

// Cached from Supabase auth state so trackEvent() can stay synchronous.
let currentUserId    = null;
let currentUserEmail = null;

supabase.auth.getSession().then(({ data: { session } }) => {
  currentUserId    = session?.user?.id    || null;
  currentUserEmail = session?.user?.email || null;
});
supabase.auth.onAuthStateChange((_event, session) => {
  currentUserId    = session?.user?.id    || null;
  currentUserEmail = session?.user?.email || null;
});

import { getCachedPlan } from "./billing";

function getCurrentPlan() {
  return getCachedPlan();
}

/**
 * Record a usage event.
 *
 * trackEvent("listing_generated", { part_number, generation_time_ms, source: "listing_generator" })
 *
 * `source` inside metadata (or opts.source) is also lifted to its own top-level
 * column so it's filterable without reaching into JSONB.
 *
 * Every event automatically includes `internal_user` so internal team traffic
 * can be excluded from business metrics without changing query code.
 */
export function trackEvent(eventName, metadata = {}, opts = {}) {
  if (!eventName) return;

  const body = {
    event_name:    eventName,
    user_id:       currentUserId,
    session_id:    getSessionId(),
    plan:          opts.plan || getCurrentPlan(),
    page_url:      typeof window !== "undefined" ? window.location.href : null,
    source:        opts.source || metadata.source || null,
    internal_user: isInternalUser(currentUserEmail),
    metadata,
  };

  try {
    fetch(`${API_URL}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // keepalive lets the request survive a navigation triggered by the same
      // click (e.g. signup_clicked firing right before the route changes).
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never let analytics break the app.
  }
}

export { getSessionId };
