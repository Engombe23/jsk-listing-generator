import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getAuthCallbackUrl, supabase } from "../lib/supabaseClient";
import { loadPreferences } from "../useListingPreferences.js";
import i18n from "../i18n/index.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function prepareEmailLocale(email, lang) {
  try {
    await fetch(`${API_URL}/api/auth/set-email-locale`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, lang }),
    });
  } catch {
    // Best-effort; Auth still falls back to English in Dashboard templates.
  }
}

export default function ForgotPasswordForm() {
  const { t } = useTranslation();
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
      const siteLanguage = String(
        loadPreferences().siteLanguage || i18n.language || "en",
      )
        .toLowerCase()
        .split("-")[0];
      // Store i18n on user_metadata so Dashboard templates can use {{ .Data.i18n }}
      await prepareEmailLocale(email, siteLanguage);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthCallbackUrl({ lang: siteLanguage }),
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <p className="text-sm text-center">
        {t("auth.checkEmailReset")}
      </p>
    );
  }

  return (
    <form onSubmit={handleResetPassword}>
      <div className="flex flex-col gap-6">
        <div className="grid gap-2">
          <label htmlFor="email">{t("auth.email")}</label>
          <input
            id="email"
            type="email"
            placeholder={t("auth.emailPlaceholder")}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t("auth.sending") : t("auth.sendResetEmail")}
        </button>
      </div>
      <div className="mt-4 text-center text-sm">
        <Link to="/auth/login" className="underline underline-offset-4">
          {t("auth.backToLogin")}
        </Link>
      </div>
    </form>
  );
}
