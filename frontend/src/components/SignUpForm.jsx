import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase, getAuthCallbackUrl } from "../lib/supabaseClient";
import { trackEvent } from "../lib/analytics";
import { redirectToStripeCheckout } from "../lib/billing";
import {
  getPlan,
  isValidPaidPlan,
  savePendingCheckout,
} from "../lib/plans";
import { checkoutAuthHref } from "../pages/checkout/CheckoutSteps";
import CheckoutSteps from "../pages/checkout/CheckoutSteps";

const EyeIcon = ({ off }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {off ? (
      <>
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
        <line x1="2" y1="2" x2="22" y2="22"/>
      </>
    ) : (
      <>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    )}
  </svg>
);

export default function SignUpForm({ submitLabel }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || "";
  const interval = searchParams.get("interval") || "monthly";
  const paidSignup = isValidPaidPlan(plan, interval);
  const planInfo = paidSignup ? getPlan(plan) : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      if (paidSignup) savePendingCheckout(plan, interval);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: paidSignup
            ? { pending_plan: plan, pending_interval: interval }
            : undefined,
          emailRedirectTo: paidSignup
            ? getAuthCallbackUrl({ plan, interval })
            : getAuthCallbackUrl(),
        },
      });
      if (error) throw error;

      trackEvent("user_signed_up", { user_id: data?.user?.id });

      if (paidSignup && data?.session?.user) {
        await redirectToStripeCheckout({
          plan,
          interval,
          userId: data.session.user.id,
          email: data.session.user.email,
        });
        return;
      }

      if (!paidSignup) {
        trackEvent("trial_started", { user_id: data?.user?.id });
      }

      navigate("/auth/sign-up-success", {
        replace: true,
        state: paidSignup
          ? { pendingPayment: { plan, interval, planName: planInfo?.name } }
          : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const loginHref = paidSignup ? checkoutAuthHref("/auth/login", plan, interval) : "/auth/login";

  return (
    <form onSubmit={handleSignUp}>
      {paidSignup && <CheckoutSteps activeStep={2} />}

      <div className="flex flex-col gap-6">
        <div className="grid gap-2">
          <label htmlFor="email">Email address</label>
          <div className="input-wrap">
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-2">
          <label htmlFor="password">Password</label>
          <div className="input-wrap">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon off={showPassword} />
            </button>
          </div>
        </div>
        <div className="grid gap-2">
          <label htmlFor="repeat-password">Repeat password</label>
          <div className="input-wrap">
            <input
              id="repeat-password"
              type={showRepeatPassword ? "text" : "password"}
              placeholder="Repeat your password"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowRepeatPassword((v) => !v)}
              aria-label={showRepeatPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon off={showRepeatPassword} />
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Creating account…" : (
            <>
              {submitLabel}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </>
          )}
        </button>
      </div>

      <div className="auth-divider"><span>or</span></div>

      <div className="text-center text-sm">
        <span className="auth-footer-text">Already have an account? </span>
        <Link to={loginHref}>Sign in</Link>
      </div>
    </form>
  );
}
