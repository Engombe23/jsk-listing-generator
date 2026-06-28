import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function UpdatePasswordForm() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Hold the code in a ref — don't exchange it on mount, only on submit.
  // Exchanging on mount creates a live session immediately, which lets users
  // skip setting a new password and navigate straight into the app.
  const codeRef = useRef(new URLSearchParams(window.location.search).get("code"));

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const code = codeRef.current;
      if (code) {
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeErr) throw new Error("This reset link has expired. Please request a new one.");
        codeRef.current = null; // prevent re-use on a second submit attempt
      }

      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;

      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdatePassword}>
      <div className="flex flex-col gap-6">
        <div className="grid gap-2">
          <label htmlFor="password">New password</label>
          <input
            id="password"
            type="password"
            placeholder="New password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save new password"}
        </button>
      </div>
    </form>
  );
}
