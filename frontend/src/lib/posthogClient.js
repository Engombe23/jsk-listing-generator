import posthog from "posthog-js";

const key  = import.meta.env.VITE_POSTHOG_KEY;
const host = import.meta.env.VITE_POSTHOG_HOST || "https://eu.i.posthog.com";

if (key && typeof window !== "undefined" && !posthog.__loaded) {
  posthog.init(key, {
    api_host: host,
    // SPA routing means real navigations don't trigger a full page load —
    // we capture pageviews manually on route change instead (see PostHogPageView).
    capture_pageview: false,
    capture_pageleave: true,
    person_profiles: "identified_only",
  });
}

export default posthog;
