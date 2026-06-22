import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import posthog from "../lib/posthogClient";
import { getCachedProfile, refreshUserPlan } from "../lib/billing";
import { getListingLimit, hasPlanFeature } from "../lib/plans";

const SessionContext = createContext({
  session: null,
  plan: "free",
  profile: null,
  refreshPlan: async () => "free",
  hasFeature: () => false,
  listingLimit: 0,
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
        posthog.identify(s.user.id, { email: s.user.email });
        syncPlan(s.user.id);
      } else {
        posthog.reset();
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

  const value = useMemo(() => ({
    session,
    plan,
    profile,
    refreshPlan: () => syncPlan(session?.user?.id ?? null),
    hasFeature: (feature) => hasPlanFeature(plan, feature),
    listingLimit: getListingLimit(plan),
  }), [session, plan, profile, syncPlan]);

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
