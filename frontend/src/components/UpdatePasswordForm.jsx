import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useTranslation } from "react-i18next";

export default function UpdatePasswordForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Session is already established by AuthCallback (PASSWORD_RECOVERY event).
      // Just update the password directly.
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;

      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdatePassword}>
      <div className="flex flex-col gap-6">
        <div className="grid gap-2">
          <label htmlFor="password">{t("auth.newPassword")}</label>
          <input
            id="password"
            type="password"
            placeholder={t("auth.newPasswordPlaceholder")}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t("auth.saving") : t("auth.savePassword")}
        </button>
      </div>
    </form>
  );
}
