import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from "react-router-dom";

const DSN = import.meta.env.VITE_SENTRY_DSN;

if (DSN && typeof window !== "undefined") {
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE || "production",

    integrations: [
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      Sentry.replayIntegration(),
    ],

    tracesSampleRate: 0.1,
    // Propagate trace headers to the backend API on the same origin or Render
    tracePropagationTargets: [/^\/api/, /^https:\/\/.*\.onrender\.com/],

    replaysSessionSampleRate: 0,    // don't record every session
    replaysOnErrorSampleRate: 1.0,  // always record the session around an error
  });
}

export { Sentry };
