// Sentry must be initialised before any other imports in server.js so
// its Node.js instrumentation can patch http, express, etc. at module load time.
// If SENTRY_DSN is not set the SDK is a no-op and nothing is reported.
import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "production",
    tracesSampleRate: 0.1,
  });
}

export { Sentry };
