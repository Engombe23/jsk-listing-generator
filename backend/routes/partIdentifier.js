/**
 * Part Identifier — MVP visual matching via SerpAPI Google Lens
 *
 * POST /api/part-identifier/identify
 *   Accepts an uploaded part photo, stores it temporarily in Supabase Storage,
 *   calls Google Lens via SerpAPI, extracts OEM/article number candidates from
 *   the visual-match titles/snippets, ranks them by confidence, and returns the
 *   results so the user can select a match and jump to Listing Generator or
 *   Smart Pricing.
 *
 * Setup required (one-time):
 *   1. Add SERPAPI_KEY to backend/.env  (serpapi.com → Dashboard → API Key)
 *   2. In Supabase → Storage, create a private bucket named "part-identifier-temp"
 *      (private is fine — we use short-lived signed URLs so SerpAPI can fetch)
 *
 * MVP note:
 *   This uses SerpAPI Google Lens as a visual matching layer; results depend on
 *   public web data and will vary.  Long-term, PartLister may build its own part
 *   image index / vector search system.
 */

import express       from "express";
import multer        from "multer";
import crypto        from "crypto";
import { requireAuth }            from "../middleware/requireAuth.js";
import { supabaseAdmin, supabaseAdminReady } from "../lib/supabaseAdmin.js";
import { searchArticleByOem, artlookupByArticleNo } from "../compatibility/api.js";

const router = express.Router();

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const BUCKET      = "part-identifier-temp";

// ── File upload (memory storage — file never touches disk) ────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },                 // 10 MB hard cap
  fileFilter: (_req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error("Only JPG, PNG, and WEBP images are accepted."),
                       { code: "INVALID_FILE_TYPE" }));
    }
  },
});

// ── Part-number extraction ────────────────────────────────────────────────
//
// Automotive OEM / article / supplier numbers typically mix letters and digits
// and are 5-16 characters long after stripping spaces and punctuation.
// Examples normalised form: 03L103383AF  0986435356  LR073640  A6511801310
//
// We cast a wide net first and then filter noise by:
//   • Requiring at least one letter AND one digit
//   • Skipping common English words that happen to match (PART, FROM, …)
//   • Skipping pure-digit strings shorter than 7 chars
//   • Skipping strings longer than 18 chars (URLs, long SKUs, etc.)

const STOPWORDS = new Set([
  "WITH","FROM","THAT","THIS","FITS","PART","ITEM","TYPE","SIZE","CODE",
  "PLUS","MINI","MAXI","REAR","UNIT","AUTO","PUMP","PIPE","HIGH","LOAD",
  "FAST","FREE","NEXT","LAST","BEST","WILL","YOUR","HAVE","BEEN","THEY",
  "EACH","ALSO","ONLY","OVER","JUST","LIKE","WHEN","MORE","MOST","MADE",
  "USED","SOME","THAN","SUCH","BOTH","DOES","SAME","WHAT","INTO","THEN",
]);

// Matches: letter+digit combos and digit-led combos separated by hyphens/spaces/dots
const NUMBER_RX = /\b([A-Z0-9]{2,}(?:[-.\s][A-Z0-9]{2,})*)\b/g;

function normalise(raw) {
  return raw.toUpperCase().replace(/[\s.\-/]/g, "");
}

function extractCandidates(textSources) {
  // textSources: Array<{ text: string, weight: number }>
  const tally = new Map(); // normalised → { original, normalised, count, score }

  for (const { text, weight } of textSources) {
    const upper = text.toUpperCase();
    NUMBER_RX.lastIndex = 0;
    let m;
    while ((m = NUMBER_RX.exec(upper)) !== null) {
      const original   = m[1].trim();
      const normalised = normalise(original);

      if (normalised.length < 5 || normalised.length > 18)   continue;
      if (!/[A-Z]/.test(normalised) || !/\d/.test(normalised)) continue; // must mix letters + digits
      if (/^(HTTP|HTTPS|WWW)/.test(normalised))               continue;
      if (STOPWORDS.has(normalised.slice(0, 4)))               continue;

      if (!tally.has(normalised)) {
        tally.set(normalised, { original, normalised, count: 0, score: 0 });
      }
      const entry = tally.get(normalised);
      entry.count += 1;
      entry.score += weight;
    }
  }

  return [...tally.values()].sort((a, b) => b.score - a.score || b.count - a.count);
}

function buildConfidence(cand) {
  let s = 0;
  s += Math.min(cand.score * 8, 40);            // source quality
  s += Math.min((cand.count - 1) * 8, 24);      // repetition bonus
  if (cand.normalised.length >= 7 && cand.normalised.length <= 14) s += 10; // typical length
  if (/[A-Z]/.test(cand.normalised) && /\d/.test(cand.normalised)) s += 12; // mixed (already filtered, adds certainty)
  return Math.min(Math.round(s), 92);
}

// ── TecDoc verification ───────────────────────────────────────────────────

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

function extractFirstArticle(raw) {
  if (!raw) return null;
  const arr = Array.isArray(raw) ? raw
    : Array.isArray(raw?.articles) ? raw.articles
    : Array.isArray(raw?.data)     ? raw.data
    : (raw?.articleNo || raw?.articleNumber) ? [raw]
    : null;
  return arr && arr.length > 0 ? arr[0] : null;
}

async function verifyCandidate(normalised) {
  // 1. Try OEM search
  try {
    const raw = await withTimeout(searchArticleByOem(normalised), 5000);
    const a   = extractFirstArticle(raw);
    if (a) return {
      verified:    true,
      articleNumber: a.articleNo || a.articleNumber || normalised,
      brand:       a.brandName  || a.brand        || "",
      productType: a.articleProductName || a.productName || "",
      articleId:   a.articleId  || null,
      oemNumber:   normalised,
      source:      "oem_search",
    };
  } catch {}

  // 2. Fallback: article-number lookup
  try {
    const raw = await withTimeout(artlookupByArticleNo(normalised), 5000);
    const a   = extractFirstArticle(raw);
    if (a) return {
      verified:    true,
      articleNumber: a.articleNo || a.articleNumber || normalised,
      brand:       a.brandName  || a.brand        || "",
      productType: a.articleProductName || a.productName || "",
      articleId:   a.articleId  || null,
      oemNumber:   null,
      source:      "article_lookup",
    };
  } catch {}

  return { verified: false };
}

// ── Page crawler ──────────────────────────────────────────────────────────
// Skip URLs that can't contain part numbers (social media, maps, etc.)
const SKIP_DOMAIN_RX = /youtube\.com|facebook\.com|instagram\.com|twitter\.com|x\.com|tiktok\.com|pinterest\.com|reddit\.com|wikipedia\.org|maps\.google/i;

async function fetchPageText(url, timeoutMs = 6000) {
  if (!url || SKIP_DOMAIN_RX.test(url)) return null;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept":          "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html") && !ct.includes("text/plain")) return null;
    const html = await res.text();
    // Strip <script>/<style> blocks, then all HTML tags; cap at 100 KB
    return html
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .slice(0, 100_000)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");
  } catch {
    return null;
  }
}

// ── Route ─────────────────────────────────────────────────────────────────
router.post(
  "/part-identifier/identify",
  requireAuth,
  // Wrap multer so its errors reach our JSON error handler
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (!err) return next();
      const msg =
        err.code === "LIMIT_FILE_SIZE"    ? "Image is too large. Maximum size is 10 MB."   :
        err.code === "INVALID_FILE_TYPE"  ? err.message                                     :
                                            "Upload failed. Please try again.";
      return res.status(400).json({ error: msg });
    });
  },
  async (req, res) => {
    if (!req.file)    return res.status(400).json({ error: "No image provided." });
    if (!SERPAPI_KEY) return res.status(503).json({ error: "Part Identifier is not configured on this server (missing SERPAPI_KEY)." });
    if (!supabaseAdminReady) return res.status(503).json({ error: "Storage not configured (missing Supabase credentials)." });

    const ext      = { "image/png": "png", "image/webp": "webp" }[req.file.mimetype] ?? "jpg";
    const fileName = `temp/${crypto.randomUUID()}.${ext}`;

    try {
      // 1. Upload to Supabase Storage
      const { error: upErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

      if (upErr) {
        console.error("[part-id] upload:", upErr.message);
        const hint = upErr.message?.toLowerCase().includes("bucket")
          ? " (Create the 'part-identifier-temp' bucket in Supabase → Storage.)"
          : "";
        return res.status(500).json({ error: `Image storage failed.${hint}` });
      }

      // 2. Signed URL — 90 s is plenty for SerpAPI to fetch the image
      const { data: signed, error: signErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUrl(fileName, 90);

      if (signErr || !signed?.signedUrl) {
        return res.status(500).json({ error: "Could not prepare image for analysis." });
      }

      // 3. Call SerpAPI Google Lens
      const serpUrl =
        `https://serpapi.com/search?engine=google_lens` +
        `&url=${encodeURIComponent(signed.signedUrl)}` +
        `&api_key=${SERPAPI_KEY}` +
        `&no_cache=false`;

      const serpRes = await fetch(serpUrl, {
        headers: { Accept: "application/json" },
        signal:  AbortSignal.timeout(25_000),
      });

      if (!serpRes.ok) {
        const body = await serpRes.text().catch(() => "");
        console.error("[part-id] serpapi:", serpRes.status, body.slice(0, 300));
        return res.status(502).json({ error: "Visual analysis failed. Please try again." });
      }

      const data          = await serpRes.json();
      const visualMatches = data.visual_matches ?? [];
      const kg            = data.knowledge_graph ?? {};

      // 4. Fetch top visual match pages in parallel — full page text gives far
      //    more signal than the short titles/snippets in the Lens response.
      const topUrls   = visualMatches.slice(0, 5).map(vm => vm.link).filter(Boolean);
      const pageTexts = await Promise.all(topUrls.map(url => fetchPageText(url)));

      // 5. Build weighted text sources.
      //    Page content is primary; titles/snippets are a lightweight fallback
      //    for pages that couldn't be fetched.
      const textSources = [];
      for (const text of pageTexts) {
        if (text) textSources.push({ text, weight: 6 });
      }
      for (const vm of visualMatches) {
        if (vm.title)   textSources.push({ text: vm.title,   weight: 1 });
        if (vm.snippet) textSources.push({ text: vm.snippet, weight: 1 });
      }
      if (kg.title)       textSources.push({ text: kg.title,       weight: 4 });
      if (kg.description) textSources.push({ text: kg.description, weight: 2 });

      // 6. Extract candidate part numbers and score them
      const candidates = extractCandidates(textSources);

      // 7. Verify top candidates against TecDoc — stop at first success
      let bestMatch = null;
      for (const cand of candidates.slice(0, 3)) {
        const v = await verifyCandidate(cand.normalised);
        if (!v.verified) continue;
        const vm = visualMatches.find(m =>
          normalise((m.title ?? "") + (m.snippet ?? "")).includes(cand.normalised)
        );
        bestMatch = {
          candidateNumber:    cand.normalised,
          displayNumber:      cand.original,
          articleNumber:      v.articleNumber,
          brand:              v.brand,
          productType:        v.productType,
          articleId:          v.articleId,
          oemNumber:          v.oemNumber,
          verificationSource: v.source,
          title:              vm?.title     ?? cand.original,
          thumbnailSource:    vm?.source    ?? "",
          link:               vm?.link      ?? null,
          thumbnail:          vm?.thumbnail ?? null,
          confidence:         Math.max(buildConfidence(cand), 65),
        };
        break;
      }

      // 8. Build unverified visual matches (supporting evidence only — no action buttons)
      const bestTitle = bestMatch?.title;
      const otherMatches = visualMatches
        .filter(vm => vm.title !== bestTitle)
        .slice(0, 8)
        .map(vm => ({
          title:     vm.title     ?? "Unknown part",
          source:    vm.source    ?? "",
          link:      vm.link      ?? null,
          thumbnail: vm.thumbnail ?? null,
        }));

      return res.json({ bestMatch, otherMatches, totalVisualMatches: visualMatches.length });

    } catch (err) {
      console.error("[part-id] error:", err.message);
      return res.status(500).json({ error: "Identification failed. Please try again." });
    } finally {
      // Always clean up the temp file — fire-and-forget
      supabaseAdmin?.storage.from(BUCKET).remove([fileName]).catch(() => {});
    }
  }
);

export default router;
