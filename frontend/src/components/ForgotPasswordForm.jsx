import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <p className="text-sm text-center">
        Check your email for a link to reset your password.
      </p>
    );
  }

  return (
    <form onSubmit={handleResetPassword}>
      <div className="flex flex-col gap-6">
        <div className="grid gap-2">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send reset email"}
        </button>
      </div>
      <div className="mt-4 text-center text-sm">
        <Link to="/auth/login" className="underline underline-offset-4">
          Back to login
        </Link>
      </div>
    </form>
  );
}
