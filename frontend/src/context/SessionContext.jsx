import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import posthog from "../lib/posthogClient";
import { getCachedProfile, refreshUserPlan } from "../lib/billing";
import { getListingLimit, hasPlanFeature } from "../lib/plans";
import { isInternalUser } from "../lib/internalUsers";

// Frontend copy is for UX only (showing "Unlimited"/all features in the UI
// for admin convenience) — the real enforcement boundary is the backend's
// WHITELISTED_EMAILS check in requireAuth-gated routes.
const WHITELISTED_EMAILS = ["aaron@partlister.app", "engombe@partlister.app"];

const SessionContext = createContext({
  session: null,
  plan: "free",
  profile: null,
  refreshPlan: async () => "free",
  hasFeature: () => false,
  listingLimit: 0,
  listingsUsed: 0,
  isWhitelisted: false,
});

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [plan, setPlan] = useState("free");
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncPlan = useCallback(async (userId) => {
    const nextPlan = await refreshUserPlan(userId);
    setPlan(nextPlan);
    setProfile(getCachedProfile());
    return nextPlan;
  }, []);

  useEffect(() => {
    const syncIdentity = (s) => {
      if (s?.user) {
        const email    = s.user.email;
        const internal = isInternalUser(email);

        // PostHog: identify the person and register internal_user as a super
        // property so it's automatically included on every subsequent capture.
        posthog.identify(s.user.id, { email, internal_user: internal });
        posthog.register({ internal_user: internal });

        // GA4: set as a user property so it persists across all events in the
        // session and can be used as an audience filter in GA4 reports.
        window.gtag?.("set", "user_properties", { internal_user: internal });

        syncPlan(s.user.id);
      } else {
        // posthog.reset() clears registered super-properties too.
        posthog.reset();
        window.gtag?.("set", "user_properties", { internal_user: false });
        syncPlan(null);
      }
    };

    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      setSession(initial);
      syncIdentity(initial);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      syncIdentity(nextSession);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [syncPlan]);

  const isWhitelisted = !!session?.user?.email &&
    WHITELISTED_EMAILS.includes(session.user.email.toLowerCase());

  // Whitelisted accounts see "Unlimited"/all features in the UI, mirroring
  // the bypass the backend applies for real. Doesn't grant anything on its
  // own — it's just so the admin UI doesn't show upgrade prompts to admins.
  const effectivePlan = isWhitelisted ? "scale" : plan;

  const value = useMemo(() => ({
    session,
    plan,
    profile,
    refreshPlan: () => syncPlan(session?.user?.id ?? null),
    hasFeature: (feature) => hasPlanFeature(effectivePlan, feature),
    listingLimit: getListingLimit(effectivePlan),
    listingsUsed: profile?.listings_used ?? 0,
    isWhitelisted,
  }), [session, plan, profile, syncPlan, effectivePlan, isWhitelisted]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(180deg, var(--bg) 0%, var(--bg) 100%)",
          color: "rgba(255,255,255,0.6)",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 14,
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}
