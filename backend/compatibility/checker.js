import {
  tecdocVinCheck,
  getVehicleTypeDetails,
  searchArticleByOem,
  artlookupByArticleNo,
  getArticleDetails,
  getOemsByArticleIds,
  getVehiclesByOem,
  searchPartsByVehicle,
  getEquivalentOems,
  getArticleMedia
} from "./api.js";
import {
  normaliseVehicle,
  enrichVehicleWithTypeDetails,
  normaliseMake,
  normaliseYear,
  normaliseModel
} from "./normalise.js";
import {
  rankArticleResults,
  compareVehicleToCompatibility,
  getConfidenceLabel,
  extractArticleInfo,
  extractFirstImageUrl
} from "./logic.js";

// ─── In-memory caches ─────────────────────────────────────────────────────────

const _vinCache        = new Map(); // vin → { vehicleId, vehicle }
const _oemArticleCache = new Map(); // oemNumber → { articleInfo, productType }
const _oemVehiclesCache = new Map(); // oemNumber → vehicles[]
const _oemsByArticleCache = new Map(); // articleId → string[]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractArticlesArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.articles)) return data.articles;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

function extractPartsArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.articles)) return data.articles;
  if (data && Array.isArray(data.parts)) return data.parts;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

// Extract vehicleId from a TecDoc VIN check response — format is uncertain so
// try multiple known field paths before giving up.
function extractVehicleIdFromVinResponse(data) {
  if (!data || typeof data !== "object") return null;

  // Direct fields on the top-level object
  const direct =
    data.vehicleId  ||
    data.typeId      ||
    data.kType       ||
    data.kTypeId     ||
    data.carId       ||
    data.id          ||
    null;
  if (direct) return String(direct).trim();

  // First element of an array response
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    const fromArr =
      first?.vehicleId ||
      first?.typeId    ||
      first?.kType     ||
      first?.kTypeId   ||
      first?.carId     ||
      first?.id        ||
      null;
    if (fromArr) return String(fromArr).trim();
  }

  // Nested under common wrapper keys
  for (const key of ["data", "result", "vehicle", "car"]) {
    if (data[key] && typeof data[key] === "object") {
      const nested = data[key];
      const fromNested =
        nested.vehicleId ||
        nested.typeId    ||
        nested.kType     ||
        nested.kTypeId   ||
        nested.carId     ||
        nested.id        ||
        null;
      if (fromNested) return String(fromNested).trim();
    }
  }

  return null;
}

// Pull OEM number strings out of a getOemsByArticleIds response.
// Response may be: [{ articleId, oemNumbers: [] }] or a flat array of strings.
function extractOemStringsFromResponse(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  // Flat array of strings
  if (typeof raw[0] === "string") return raw.filter(Boolean);

  // Array of objects — look for oemNumbers or similar fields
  const strings = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;

    const nums =
      entry.oemNumbers     ||
      entry.oems           ||
      entry.oemNos         ||
      entry.articleOemNos  ||
      null;

    if (Array.isArray(nums)) {
      for (const n of nums) {
        if (typeof n === "string" && n.trim()) strings.push(n.trim());
        else if (n && typeof n === "object") {
          const s = n.oemNumber || n.oem || n.articleOemNo || n.value || "";
          if (s) strings.push(String(s).trim());
        }
      }
    } else {
      // The entry itself might have a single OEM field
      const s =
        entry.oemNumber     ||
        entry.oem           ||
        entry.articleOemNo  ||
        "";
      if (s) strings.push(String(s).trim());
    }
  }

  return strings.filter(Boolean);
}

// ─── Main checker ─────────────────────────────────────────────────────────────

export async function checkCompatibility({
  vin,
  oemNumber,
  partType,
  engineCode,
  make,
  model,
  year,
  fuelType,
  engineSize
}) {
  const result = {
    status: "error",
    confidenceScore: 0,
    confidenceLabel: "",
    vehicle: null,
    checkedPart: null,
    matchReasoning: null,
    alternativePart: null,
    errors: []
  };

  // ── STEP 1 — VIN → vehicleId + vehicle spec ────────────────────────────────

  let normalisedVehicle = null;
  let vehicleId = null;

  if (vin) {
    // Check cache first
    const cached = _vinCache.get(vin);
    if (cached) {
      vehicleId = cached.vehicleId;
      normalisedVehicle = cached.vehicle;
      console.log(`[VIN] cache hit → vehicleId=${vehicleId}`);
    } else {
      try {
        const vinData = await tecdocVinCheck(vin);
        console.log(`[VIN] raw response (first 500): ${JSON.stringify(vinData).slice(0, 500)}`);

        vehicleId = extractVehicleIdFromVinResponse(vinData);

        if (vehicleId) {
          const detail = await getVehicleTypeDetails(vehicleId);
          const rawVehicle =
            detail?.vehicleType        ||
            detail?.vehicleTypeDetails ||
            detail?.data               ||
            detail                     ||
            {};

          normalisedVehicle = normaliseVehicle({ ...rawVehicle, vehicleId, vin });
          console.log(`[VIN] K=${vehicleId} make=${normalisedVehicle.make} model=${normalisedVehicle.model} year=${normalisedVehicle.year}`);

          _vinCache.set(vin, { vehicleId, vehicle: normalisedVehicle });
        } else {
          console.log("[VIN] tecdocVinCheck returned no usable vehicleId. Raw keys:", Object.keys(vinData || {}).join(", "));
        }
      } catch (err) {
        result.errors.push({ step: "vehicleLookup", message: `VIN lookup failed: ${err.message}` });
      }
    }
  }

  // Manual field fallback
  if (!normalisedVehicle) {
    if (!make && !model && !year) {
      result.errors.push({
        step: "vehicleLookup",
        message: "No VIN provided and no vehicle details entered. Please enter a VIN or fill in Make + Model + Year."
      });
      return result;
    }

    normalisedVehicle = normaliseVehicle({ make, model, year, fuelType, engineSize, engineCode });

    if (vin) {
      result.errors.push({
        step: "vehicleLookup",
        message: "VIN lookup returned no vehicle ID — using manually entered vehicle details."
      });
    }
  }

  // Overlay any explicit manual overrides on top of VIN / cache data
  if (make)  normalisedVehicle.make  = normaliseMake(make);
  if (model) normalisedVehicle.model = normaliseModel(model);
  if (year)  normalisedVehicle.year  = normaliseYear(year);

  // Keep vehicleId in sync with whatever ended up in normalisedVehicle
  if (!vehicleId && normalisedVehicle.vehicleId) {
    vehicleId = normalisedVehicle.vehicleId;
  }

  result.vehicle = normalisedVehicle;

  // ── STEP 2 — OEM → article + productType ─────────────────────────────────

  let articleInfo;
  let productType;

  const oemCached = _oemArticleCache.get(oemNumber);
  if (oemCached) {
    articleInfo = oemCached.articleInfo;
    productType = oemCached.productType;
    console.log(`[OEM] cache hit for ${oemNumber}`);
  } else {
    // Primary: searchArticleByOem
    let articles = [];
    try {
      const oemData = await searchArticleByOem(oemNumber);
      articles = extractArticlesArray(oemData);
    } catch (err) {
      result.errors.push({ step: "oemSearch", message: `Primary OEM search failed: ${err.message}` });
    }

    // Fallback: artlookupByArticleNo
    if (articles.length === 0) {
      try {
        const fallbackData = await artlookupByArticleNo(oemNumber);
        articles = extractArticlesArray(fallbackData);
      } catch (err) {
        result.errors.push({ step: "oemSearch", message: `Fallback artlookup failed: ${err.message}` });
      }
    }

    if (articles.length === 0) {
      result.errors.push({ step: "oemSearch", message: `No articles found for OEM number "${oemNumber}"` });
      return result;
    }

    // Rank and pick best article
    const ranked = rankArticleResults(articles);
    const best = ranked[0];

    // Get full details
    let fullArticle = best;
    try {
      const articleNo =
        best.articleNo     ||
        best.articleNumber ||
        best.artNr         ||
        "";
      if (articleNo) {
        const detailsData = await getArticleDetails(articleNo);
        const detailArticles = extractArticlesArray(detailsData);
        if (detailArticles.length > 0) {
          fullArticle = detailArticles[0];
        }
      }
    } catch (err) {
      result.errors.push({ step: "articleDetails", message: err.message });
      // Continue with partial info from best
    }

    articleInfo = extractArticleInfo(fullArticle);
    productType = articleInfo.productType || partType || "";

    // Fetch image (silent)
    try {
      const mediaData = await getArticleMedia(articleInfo.articleId || fullArticle.articleId || fullArticle.id);
      const imgUrl = extractFirstImageUrl(mediaData);
      if (imgUrl) articleInfo.imageUrl = imgUrl;
    } catch {}

    _oemArticleCache.set(oemNumber, { articleInfo, productType });
  }

  result.checkedPart = { ...articleInfo, compatible: false };

  // ── STEP 3 — Get ALL vehicles compatible with this OEM ────────────────────

  let compatibleVehicles = [];

  const vehiclesCached = _oemVehiclesCache.get(oemNumber);
  if (vehiclesCached) {
    compatibleVehicles = vehiclesCached;
    console.log(`[OEM vehicles] cache hit → ${compatibleVehicles.length} vehicles`);
  } else {
    try {
      const rawVehicles = await getVehiclesByOem(oemNumber);
      compatibleVehicles = Array.isArray(rawVehicles) ? rawVehicles : [];
      console.log(`[OEM vehicles] ${compatibleVehicles.length} vehicles compatible with OEM ${oemNumber}`);
      _oemVehiclesCache.set(oemNumber, compatibleVehicles);
    } catch (err) {
      console.log(`[OEM vehicles] getVehiclesByOem failed: ${err.message}`);
      compatibleVehicles = [];
    }
  }

  // ── STEP 4 — Compatibility check ─────────────────────────────────────────

  let matchReasoning;

  if (vehicleId && compatibleVehicles.length > 0) {
    // Exact TecDoc vehicle ID match
    const exactMatch = compatibleVehicles.find((v) => {
      const vId = String(v.vehicleId || v.typeId || v.kType || v.kTypeId || v.id || "").trim();
      return vId && vId === String(vehicleId).trim();
    });

    if (exactMatch) {
      matchReasoning = {
        matched: true,
        score: 95,
        matchedBy: "tecDocTypeId",
        matchedFields: ["vehicleId"],
        conflictingFields: [],
        notes: ["Exact TecDoc vehicle ID match"]
      };
    } else {
      matchReasoning = {
        matched: false,
        score: 0,
        matchedBy: null,
        matchedFields: [],
        conflictingFields: [],
        notes: [
          `Vehicle ID ${vehicleId} not found in ${compatibleVehicles.length} compatible vehicles`
        ]
      };
    }
  } else {
    // No vehicleId available — fall back to fuzzy matching against compatibleCars
    matchReasoning = compareVehicleToCompatibility(
      normalisedVehicle,
      articleInfo.compatibleCars || []
    );
    matchReasoning.notes = matchReasoning.notes || [];
    matchReasoning.notes.push("No vehicle ID available — used fuzzy matching");
  }

  result.matchReasoning  = matchReasoning;
  result.confidenceScore = matchReasoning.score;
  result.confidenceLabel = getConfidenceLabel(matchReasoning.score);

  const isExactMatch = matchReasoning.matchedBy === "tecDocTypeId";

  if (matchReasoning.score >= 70 || isExactMatch) {
    result.status = "compatible";
    result.checkedPart.compatible = true;
    return result;
  }

  if (matchReasoning.score >= 50 && !isExactMatch) {
    result.status = "manual_check_required";
    return result;
  }

  // ── STEP 5 — Alternative search (score < 50 or no match) ─────────────────

  const useVehicleId = vehicleId || normalisedVehicle.vehicleId;

  if (!useVehicleId) {
    result.status = "not_compatible";
    return result;
  }

  try {
    const partsData = await searchPartsByVehicle(useVehicleId);
    const parts = extractPartsArray(partsData);

    // Filter by product type (first word, length > 2)
    let filtered = parts;
    if (productType) {
      const firstWord = productType.split(/\s+/)[0].toLowerCase();
      if (firstWord.length > 2) {
        const typed = parts.filter((p) => {
          const pType = (
            p.articleProductName ||
            p.productName        ||
            p.description        ||
            ""
          ).toLowerCase();
          return pType.includes(firstWord);
        });
        if (typed.length > 0) filtered = typed;
      }
    }

    const rankedAlts = rankArticleResults(filtered);

    if (rankedAlts.length === 0) {
      result.status = "not_compatible";
      return result;
    }

    const altArticle = rankedAlts[0];
    const altInfo = extractArticleInfo(altArticle);

    // Get full article details
    try {
      const altNo =
        altInfo.articleNumber ||
        altArticle.articleNo  ||
        altArticle.artNr      ||
        "";
      if (altNo) {
        const altDetails = await getArticleDetails(altNo);
        const altDetailArticles = extractArticlesArray(altDetails);
        if (altDetailArticles.length > 0) {
          const fullAlt = extractArticleInfo(altDetailArticles[0]);
          altInfo.productType = fullAlt.productType || altInfo.productType;
          altInfo.articleId   = fullAlt.articleId   || altInfo.articleId;
          // Merge OEM numbers — we'll try getOemsByArticleIds first below
          if (!altInfo.oemNumbers || altInfo.oemNumbers.length === 0) {
            altInfo.oemNumbers = fullAlt.oemNumbers || [];
          }
        }
      }
    } catch {}

    // Fetch OEM numbers via getOemsByArticleIds
    if (altInfo.articleId) {
      const cachedOems = _oemsByArticleCache.get(String(altInfo.articleId));
      if (cachedOems) {
        altInfo.oemNumbers = cachedOems;
      } else {
        try {
          const oemsRaw = await getOemsByArticleIds([altInfo.articleId]);
          console.log(`[altOEMs] raw response (first 300): ${JSON.stringify(oemsRaw).slice(0, 300)}`);
          const oems = extractOemStringsFromResponse(oemsRaw);
          if (oems.length > 0) {
            altInfo.oemNumbers = oems;
            _oemsByArticleCache.set(String(altInfo.articleId), oems);
          }
          // If empty, keep whatever extractArticleInfo already found
        } catch (err) {
          console.log(`[altOEMs] getOemsByArticleIds failed: ${err.message}`);
        }
      }
    }

    // Get alt image (silent)
    try {
      const altMedia = await getArticleMedia(altInfo.articleId);
      const altImg = extractFirstImageUrl(altMedia);
      if (altImg) altInfo.imageUrl = altImg;
    } catch {}

    result.alternativePart = { ...altInfo, compatible: true };
    result.status = "alternative_found";
    return result;

  } catch (err) {
    result.errors.push({ step: "alternativeSearch", message: err.message });
  }

  result.status = "not_compatible";
  return result;
}
