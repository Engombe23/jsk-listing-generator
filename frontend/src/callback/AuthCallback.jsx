import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ensureSessionFromAuthCallback, supabase } from "../lib/supabaseClient";
import { redirectToStripeCheckout } from "../lib/billing";
import { recordSignupFingerprint } from "../lib/signupGuard";
import {
  clearPendingCheckout,
  resolvePendingCheckout,
} from "../lib/plans";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const planFromUrl = params.get("plan") || "";
      const intervalFromUrl = params.get("interval") || "monthly";

      if (!code && !window.location.hash.includes("access_token")) {
        const { data: { session: existing } } = await supabase.auth.getSession();
        if (!existing) {
          if (!cancelled) {
            setMessage("Invalid confirmation link.");
            setTimeout(() => navigate("/auth/login", { replace: true }), 2000);
          }
          return;
        }
      }

      let session;
      let isRecovery = false;

      // Subscribe before exchange so we catch PASSWORD_RECOVERY event
      const { data: { subscription: recoverySub } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") isRecovery = true;
      });

      try {
        session = await ensureSessionFromAuthCallback(code);
      } catch (err) {
        console.error("[auth/callback]", err.message);
        recoverySub.unsubscribe();
        if (!cancelled) {
          setMessage("Could not complete sign-in. Please try again.");
          setTimeout(() => navigate("/auth/login", { replace: true }), 2500);
        }
        return;
      }

      recoverySub.unsubscribe();

      if (!session?.user) {
        if (!cancelled) {
          setMessage("Could not complete sign-in. Please try again.");
          setTimeout(() => navigate("/auth/login", { replace: true }), 2500);
        }
        return;
      }

      // Password recovery — redirect to update-password page with session in place
      if (isRecovery) {
        if (!cancelled) navigate("/auth/update-password", { replace: true });
        return;
      }

      const user = session.user;
      recordSignupFingerprint(session.access_token);
      const pending = resolvePendingCheckout({
        planFromUrl,
        intervalFromUrl,
        userMetadata: user.user_metadata,
      });

      if (pending) {
        clearPendingCheckout();
        if (!cancelled) setMessage("Account confirmed. Redirecting to payment…");
        try {
          await redirectToStripeCheckout({
            plan: pending.plan,
            interval: pending.interval,
          });
          return;
        } catch (err) {
          console.error("[auth/callback] checkout redirect failed:", err);
          if (!cancelled) {
            navigate(`/checkout?plan=${pending.plan}&interval=${pending.interval}`, { replace: true });
          }
          return;
        }
      }

      if (!cancelled) navigate("/", { replace: true });
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      fontFamily: "Inter, system-ui, sans-serif",
      color: "#4d6a8a",
    }}>
      <p>{message}</p>
    </div>
  );
}
