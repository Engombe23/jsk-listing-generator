import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// Keyed by authenticated user ID (set by requireAuth). Falls back to the
// express-rate-limit ipKeyGenerator helper which handles IPv6 correctly.
function keyByUser(req) {
  return req.user?.id || ipKeyGenerator(req);
}

function makeLimiter({ max, windowMinutes, message }) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    keyGenerator: keyByUser,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "rate_limited", message: message || "Too many requests — please slow down and try again shortly." },
  });
}

// Listing generation (TecDoc lookup) — the core, most frequently used flow.
export const listingGenerationLimiter = makeLimiter({
  max: 30, windowMinutes: 10,
  message: "Too many listing generation requests. Please wait a few minutes before trying again.",
});

// Compatibility checks (TecDoc + vehicle lookups).
export const compatibilityLimiter = makeLimiter({
  max: 30, windowMinutes: 10,
  message: "Too many compatibility checks. Please wait a few minutes before trying again.",
});

// eBay Smart Pricing searches.
export const ebaySearchLimiter = makeLimiter({
  max: 30, windowMinutes: 10,
  message: "Too many price searches. Please wait a few minutes before trying again.",
});

// OpenAI title generation — most expensive per-call, tightest limit.
export const aiTitlesLimiter = makeLimiter({
  max: 20, windowMinutes: 10,
  message: "Too many AI title requests. Please wait a few minutes before trying again.",
});
