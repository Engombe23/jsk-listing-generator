import posthog from "posthog-js";

const key  = import.meta.env.VITE_POSTHOG_KEY;
const host = import.meta.env.VITE_POSTHOG_HOST || "https://eu.i.posthog.com";

try {
  if (key && typeof window !== "undefined" && !posthog.__loaded) {
    posthog.init(key, {
      api_host: host,
      capture_pageview: false,
      capture_pageleave: true,
      person_profiles: "identified_only",
    });
  }
} catch {
  // Brave Shields or other privacy tools may block posthog — fail silently.
}

const safePosthog = {
  capture:    (...args) => { try { posthog.capture(...args);    } catch {} },
  identify:   (...args) => { try { posthog.identify(...args);   } catch {} },
  register:   (...args) => { try { posthog.register(...args);   } catch {} },
  reset:      (...args) => { try { posthog.reset(...args);      } catch {} },
  alias:      (...args) => { try { posthog.alias(...args);      } catch {} },
  group:      (...args) => { try { posthog.group(...args);      } catch {} },
  isFeatureEnabled: (...args) => { try { return posthog.isFeatureEnabled(...args); } catch { return false; } },
};

export default safePosthog;
