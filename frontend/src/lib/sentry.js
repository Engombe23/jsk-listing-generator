// Initialise Sentry for the React frontend.
// Set VITE_SENTRY_DSN in your environment to enable reporting.
// No-op when the variable is absent (local dev, CI).
import * as Sentry from "@sentry/react";

const DSN = import.meta.env.VITE_SENTRY_DSN;

if (DSN && typeof window !== "undefined") {
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE || "production",
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}

export { Sentry };
