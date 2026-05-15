import {
  decodeVin,
  tecdocVinCheck,
  getVehicleTypeDetails,
  searchArticleByOem,
  artlookupByArticleNo,
  getArticleDetailsById,
  getOemsByArticleIds,
  getCompatibleCarsByArticleNo,
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
  getConfidenceLabel,
  compareVehicleToCompatibility,
  extractArticleInfo,
  extractFirstImageUrl
} from "./logic.js";

// ─── VIN response helpers ─────────────────────────────────────────────────────

// Parse the decoder-v3 response (array of {title, information} sections)
// into a flat key→value map of general vehicle info.
// Returns e.g. { make: "Land Rover", model: "Range Rover", year: "2006" }
function parseDecoderV3Info(data) {
  if (!Array.isArray(data)) return {};
  const flat = {};
  for (const section of data) {
    const info = section?.information;
    if (!info || typeof info !== "object") continue;
    for (const [k, v] of Object.entries(info)) {
      flat[k.toLowerCase().replace(/[\s/]+/g, "_")] = v;
    }
  }
  return {
    make:     flat.make      || "",
    model:    flat.model     || "",
    year:     flat.model_year || flat.year || "",
    bodyType: flat.vehicle_class || flat.vehicle_type || ""
  };
}

// Unwrap the tecdocVinCheck response into a flat, enriched vehicle array.
// Handles the autodoc nested structure:
//   { data: { matchingManufacturers: { array: [...] }, matchingModels: { array: [...] },
//             matchingVehicles: { array: [...] } }, status: ... }
function unwrapTecdocVehicles(data) {
  if (!data) return [];

  // ── Autodoc nested structure ───────────────────────────────────────────────
  const inner = data?.data;
  if (inner && typeof inner === "object" && inner.matchingVehicles?.array) {
    const vehicles = inner.matchingVehicles.array.filter(Boolean);
    const manuName  = inner.matchingManufacturers?.array?.[0]?.manuName  || "";
    const modelName = inner.matchingModels?.array?.[0]?.modelName         || "";
    // Enrich with make/model so normaliseVehicle() has something when
    // getVehicleTypeDetails() is unavailable.
    return vehicles.map((v) => ({
      ...v,
      manufacturerName: manuName,
      make:             manuName,
      modelName,
      model:            modelName,
      typeEngineName:   v.vehicleTypeDescription || "",
      variant:          v.vehicleTypeDescription || v.carName || ""
    }));
  }

  // ── Plain array ────────────────────────────────────────────────────────────
  if (Array.isArray(data)) return data.filter(Boolean);
  if (Array.isArray(inner) && inner.length > 0) return inner;

  // ── Common wrapper keys ────────────────────────────────────────────────────
  for (const key of ["vehicles", "result", "items", "records", "vehicleList"]) {
    if (Array.isArray(data[key]) && data[key].length > 0) return data[key];
  }

  // ── Single vehicle object ─────────────────────────────────────────────────
  if (data.vehicleId || data.typeId || data.kType || data.kTypeId || data.manufacturerName) {
    return [data];
  }

  return [];
}

// ─── In-memory caches ─────────────────────────────────────────────────────────

const _vinCache           = new Map(); // vin → { vehicleId, vehicle }
const _oemArticleCache    = new Map(); // oemNumber → { articleInfo, productType }
const _oemVehiclesCache   = new Map(); // oemNumber → vehicles[]
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

// ─── Vehicle option enrichment ────────────────────────────────────────────────
// Fetches full vehicle-type-details for each candidate in parallel so the
// selection screen can show HP, kW, engine codes, fuel type, and year range.
// Caps at 20 to avoid exploding the API quota.

async function enrichVehicleOptions(vehicles, vin) {
  const CAP = 20;
  const toEnrich = vehicles.slice(0, CAP);

  const enriched = await Promise.all(
    toEnrich.map(async (v) => {
      const vId = String(
        v.vehicleId || v.typeId || v.kType || v.kTypeId || v.id || ""
      ).trim();

      if (!vId) return normaliseVehicle({ ...v, vin });

      let raw = {};
      try {
        const detail = await getVehicleTypeDetails(vId);
        console.log(`[enrichVehicle] vId=${vId} detail keys: ${Object.keys(detail || {}).join(", ")}`);
        console.log(`[enrichVehicle] vId=${vId} raw detail (first 400): ${JSON.stringify(detail).slice(0, 400)}`);

        raw =
          detail?.vehicleType        ||
          detail?.vehicleTypeDetails ||
          detail?.vehicleDetails     ||
          detail?.data               ||
          detail                     ||
          {};
      } catch (err) {
        console.log(`[enrichVehicle] vId=${vId} getVehicleTypeDetails threw: ${err.message}`);
      }

      // Parse carName as last-resort fallback for make/model when type-details
      // doesn't return usable data.  Format: "MAKE MODEL VARIANT"
      const carName = v.carName || v.vehicle || "";
      const fallbackMake  = v.make  || v.manufacturerName || "";
      const fallbackModel = v.model || v.modelName        || "";

      const merged = {
        // carName first so explicit fields below override it
        ...(carName && !fallbackMake  ? { manufacturerName: carName.split(" ")[0] } : {}),
        ...(carName && !fallbackModel ? { modelName: carName.split(" ").slice(1).join(" ") } : {}),
        // Sparse VIN-list entry (already enriched with make/model in unwrapVehicleArray)
        ...v,
        // Full type-details (best source — overrides everything above)
        ...raw,
        vehicleId: vId,
        vin
      };

      const normed = normaliseVehicle(merged);
      console.log(`[enrichVehicle] vId=${vId} → make=${normed?.make} model=${normed?.model} variant=${normed?.variant} kw=${normed?.powerKw}`);
      return normed;
    })
  );

  return enriched.filter(Boolean);
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
  engineSize,
  selectedVehicleId
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

  if (selectedVehicleId) {
    // User already picked a vehicle from the multi-vehicle selection screen
    vehicleId = String(selectedVehicleId).trim();
    const selCacheKey = `sel:${vehicleId}`;
    const cached = _vinCache.get(selCacheKey);
    if (cached) {
      normalisedVehicle = cached.vehicle;
      console.log(`[VIN] selected vehicle cache hit → vehicleId=${vehicleId}`);
    } else {
      try {
        const detail = await getVehicleTypeDetails(vehicleId);
        const rawVehicle =
          detail?.vehicleType        ||
          detail?.vehicleTypeDetails ||
          detail?.data               ||
          detail                     ||
          {};
        normalisedVehicle = normaliseVehicle({ ...rawVehicle, vehicleId, vin });
        _vinCache.set(selCacheKey, { vehicleId, vehicle: normalisedVehicle });
        console.log(`[VIN] selected vehicleId=${vehicleId} make=${normalisedVehicle?.make} model=${normalisedVehicle?.model}`);
      } catch (err) {
        result.errors.push({ step: "vehicleLookup", message: `Vehicle detail fetch failed: ${err.message}` });
      }
    }
  } else if (vin) {
    const cached = _vinCache.get(vin);
    if (cached) {
      if (cached.multipleVehicles) {
        return {
          status: "manual_vehicle_selection_required",
          vehicleOptions: cached.vehicleOptions,
          errors: []
        };
      }
      vehicleId = cached.vehicleId;
      normalisedVehicle = cached.vehicle;
      console.log(`[VIN] cache hit → vehicleId=${vehicleId}`);
    } else {
      // ── Step 1a: decoder-v3 → general info (make/model/year for fallback) ─
      // decoder-v3 returns [{title, information:{Make,Model,Year...}}] sections.
      // It does NOT return TecDoc vehicleIds — used only for descriptive fallback.
      let vinInfoFromDecoder = {};
      try {
        const decoderData = await decodeVin(vin);
        vinInfoFromDecoder = parseDecoderV3Info(decoderData);
        console.log(`[VIN] decoder-v3 info → make=${vinInfoFromDecoder.make} model=${vinInfoFromDecoder.model} year=${vinInfoFromDecoder.year}`);
      } catch (err) {
        console.log(`[VIN] decoder-v3 threw: ${err.message} (non-fatal)`);
      }

      // ── Step 1b: tecdocVinCheck → TecDoc vehicleIds ───────────────────────
      try {
        const tecdocData = await tecdocVinCheck(vin);
        console.log(`[VIN] tecdocVinCheck raw (first 600): ${JSON.stringify(tecdocData).slice(0, 600)}`);

        const tecdocVehicles = unwrapTecdocVehicles(tecdocData);
        console.log(`[VIN] tecdocVinCheck unwrapped → ${tecdocVehicles.length} vehicle(s)`);

        if (tecdocVehicles.length > 1) {
          // Multiple TecDoc matches → fetch full details then show picker
          const vehicleOptions = await enrichVehicleOptions(tecdocVehicles, vin);
          _vinCache.set(vin, { multipleVehicles: true, vehicleOptions });
          console.log(`[VIN] ${tecdocVehicles.length} vehicles → manual_vehicle_selection_required`);
          return {
            status: "manual_vehicle_selection_required",
            vehicleOptions,
            errors: []
          };
        } else if (tecdocVehicles.length === 1) {
          const v = tecdocVehicles[0];
          vehicleId = String(v.vehicleId || v.typeId || v.kType || v.kTypeId || v.id || "").trim() || null;
          if (vehicleId) {
            const detail = await getVehicleTypeDetails(vehicleId);
            const rawVehicle =
              detail?.vehicleType        ||
              detail?.vehicleTypeDetails ||
              detail?.data               ||
              detail                     ||
              {};
            // Spread v first (enriched with make/model from matchingManufacturers/matchingModels)
            // then rawVehicle overrides with full type-details where available.
            normalisedVehicle = normaliseVehicle({ ...v, ...rawVehicle, vehicleId, vin });
          } else {
            normalisedVehicle = normaliseVehicle({ ...v, vin });
            vehicleId = normalisedVehicle?.vehicleId || null;
          }
          if (normalisedVehicle) {
            _vinCache.set(vin, { vehicleId, vehicle: normalisedVehicle });
            console.log(`[VIN] K=${vehicleId} make=${normalisedVehicle.make} model=${normalisedVehicle.model} variant=${normalisedVehicle.variant}`);
          }
        } else {
          // 0 TecDoc vehicles — cannot proceed without an exact vehicle ID
          console.log("[VIN] tecdocVinCheck returned 0 vehicles → unable_to_confirm");
          return {
            status: "unable_to_confirm",
            vehicle: null,
            checkedPart: null,
            matchReasoning: null,
            alternativePart: null,
            errors: [{
              step: "vehicleLookup",
              message: "This VIN could not be matched to a TecDoc vehicle. Compatibility cannot be confirmed without an exact vehicle ID."
            }]
          };
        }
      } catch (err) {
        return {
          status: "unable_to_confirm",
          vehicle: null,
          checkedPart: null,
          matchReasoning: null,
          alternativePart: null,
          errors: [{ step: "vehicleLookup", message: `VIN lookup failed: ${err.message}` }]
        };
      }
    }
  }

  // Guard: if we still have no vehicleId at this point, stop — we cannot do
  // a reliable compatibility check without an exact TecDoc vehicle ID.
  if (!vehicleId) {
    return {
      status: "unable_to_confirm",
      vehicle: normalisedVehicle,
      checkedPart: null,
      matchReasoning: null,
      alternativePart: null,
      errors: [{ step: "vehicleLookup", message: "No TecDoc vehicle ID could be resolved from the provided VIN." }]
    };
  }

  result.vehicle = normalisedVehicle;

  // ── STEP 2 — Search articles by OEM number ───────────────────────────────

  let articleInfo;
  let productType;
  let compatibleVehicles = [];

  const oemCached = _oemArticleCache.get(oemNumber);
  if (oemCached) {
    articleInfo        = oemCached.articleInfo;
    productType        = oemCached.productType;
    compatibleVehicles = _oemVehiclesCache.get(oemNumber) || [];
    console.log(`[OEM] cache hit → ${compatibleVehicles.length} vehicles`);
  } else {
    let articles = [];
    try {
      articles = extractArticlesArray(await searchArticleByOem(oemNumber));
    } catch (err) {
      result.errors.push({ step: "oemSearch", message: err.message });
    }

    if (articles.length === 0) {
      try {
        articles = extractArticlesArray(await artlookupByArticleNo(oemNumber));
      } catch (err) {
        result.errors.push({ step: "oemSearch", message: err.message });
      }
    }

    if (articles.length === 0) {
      result.errors.push({ step: "oemSearch", message: `No articles found for "${oemNumber}"` });
      return result;
    }

    // ── STEP 3 — Select article and fetch complete details ────────────────────
    const best       = rankArticleResults(articles)[0];
    const articleId  = best.articleId || best.id || null;
    const articleNo  = best.articleNo || best.articleNumber || best.artNr || "";
    const supplierId = best.supplierId || best.dataSupplierId || null;

    console.log(`[STEP3] articles found: ${articles.slice(0, 5).map(a => `${a.articleNo||a.articleNumber||"?"}(${a.articleProductName||a.productName||"?"})` ).join(", ")}`);

    let fullArticle = best;
    if (articleId) {
      try {
        const detailArticles = extractArticlesArray(await getArticleDetailsById(articleId));
        if (detailArticles.length > 0 && detailArticles[0]) fullArticle = detailArticles[0];
      } catch (err) {
        result.errors.push({ step: "articleDetails", message: err.message });
      }
    }

    console.log(`[STEP3] full article keys: ${Object.keys(fullArticle || {}).join(", ")}`);
    console.log(`[STEP3] full article raw (first 800): ${JSON.stringify(fullArticle).slice(0, 800)}`);

    articleInfo            = extractArticleInfo(fullArticle);
    articleInfo.supplierId = (fullArticle && fullArticle.supplierId) || supplierId;
    articleInfo.articleNo  = articleInfo.articleNumber || articleNo;
    // Capture any category/generic article ID present in the full details for use in Step 6
    articleInfo.genericArticleId =
      fullArticle?.genericArticleId ||
      fullArticle?.genericArticle?.id ||
      fullArticle?.categoryId        ||
      fullArticle?.assemblyGroupId   ||
      null;
    productType            = articleInfo.productType || partType || "";
    console.log(`[STEP3] genericArticleId=${articleInfo.genericArticleId}`);

    console.log(`[OEM] selected article=${articleInfo.articleNo} supplier=${articleInfo.supplierId} productType=${productType}`);

    // Fetch image (silent)
    try {
      const imgUrl = extractFirstImageUrl(await getArticleMedia(articleInfo.articleId || articleId));
      if (imgUrl) articleInfo.imageUrl = imgUrl;
    } catch {}

    // ── STEP 4 — Fetch compatible vehicles ───────────────────────────────────
    // Strategy A: getVehiclesByOem — the most direct endpoint.
    // Asks TecDoc "which vehicles is this OEM number listed for?" and returns
    // vehicleIds directly. Works for any OEM number regardless of supplierId.
    try {
      const oemVehicles = await getVehiclesByOem(oemNumber);
      const oemVehicleList = Array.isArray(oemVehicles)
        ? oemVehicles
        : (oemVehicles?.vehicles || oemVehicles?.data || []);
      if (oemVehicleList.length > 0) {
        compatibleVehicles.push(...oemVehicleList);
        console.log(`[OEM] getVehiclesByOem → ${oemVehicleList.length} vehicles`);
      }
    } catch (err) {
      console.log(`[OEM] getVehiclesByOem failed: ${err.message}`);
    }

    // Strategy B: getCompatibleCarsByArticleNo — article-level compatible cars.
    // Supplements Strategy A with any additional vehicles from the aftermarket
    // article's compatibility list (catches cross-references not in OEM list).
    if (articleInfo.articleNo && articleInfo.supplierId) {
      try {
        const raw = await getCompatibleCarsByArticleNo(articleInfo.articleNo, articleInfo.supplierId);
        if (raw?.articles && Array.isArray(raw.articles)) {
          for (const art of raw.articles) {
            if (Array.isArray(art.compatibleCars)) compatibleVehicles.push(...art.compatibleCars);
          }
        } else if (Array.isArray(raw)) {
          compatibleVehicles.push(...raw);
        }
        console.log(`[OEM] after getCompatibleCarsByArticleNo → ${compatibleVehicles.length} total vehicles`);
      } catch (err) {
        console.log(`[OEM] getCompatibleCarsByArticleNo failed: ${err.message}`);
      }
    }

    // Deduplicate by vehicleId so we don't get false confidence from duplicates
    const seenVids = new Set();
    compatibleVehicles = compatibleVehicles.filter(v => {
      const vid = String(v.vehicleId || v.typeId || v.kType || v.id || "").trim();
      if (!vid || seenVids.has(vid)) return false;
      seenVids.add(vid);
      return true;
    });
    console.log(`[OEM] deduplicated compatible vehicles → ${compatibleVehicles.length}`);

    _oemArticleCache.set(oemNumber, { articleInfo, productType });
    _oemVehiclesCache.set(oemNumber, compatibleVehicles);
  }

  if (!articleInfo) {
    console.log("[ERROR] articleInfo is null/undefined before checkedPart assignment");
    result.status = "error";
    result.errors.push({ step: "articleInfo", message: "Failed to extract article info" });
    return result;
  }

  result.checkedPart = { ...articleInfo, compatible: false };

  // ── STEP 5 — Match TecDoc vehicle ID against compatible vehicles ──────────

  function findExactIdMatch(arr, targetId) {
    return arr.find((v) => {
      const vId = String(v.vehicleId || v.typeId || v.kType || v.kTypeId || v.id || "").trim();
      return vId && vId === String(targetId).trim();
    });
  }

  const exactMatch = compatibleVehicles.length > 0
    ? findExactIdMatch(compatibleVehicles, vehicleId)
    : null;

  if (exactMatch) {
    console.log(`[STEP5] vehicleId ${vehicleId} matched in compatible vehicles`);
    result.status = "compatible";
    result.checkedPart = { ...(result.checkedPart || {}), compatible: true };
    result.matchReasoning  = { matched: true, score: 100, matchedBy: "tecDocTypeId", notes: ["Exact TecDoc vehicle ID match"] };
    result.confidenceScore = 100;
    result.confidenceLabel = getConfidenceLabel(100);
    return result;
  }

  console.log(`[STEP5] vehicleId ${vehicleId} not found in ${compatibleVehicles.length} vehicles — trying OEM equivalence`);

  // ── Shared OEM normaliser ─────────────────────────────────────────────────
  // Strip spaces, dashes, dots and normalise case so "03L 103 383 AF",
  // "03L-103383AF" and "03L103383AF" all compare equal.
  function normalizeOem(oem) {
    return String(oem || "").replace(/[\s\-\.]/g, "").toUpperCase();
  }
  const normalizedUserOem = normalizeOem(oemNumber);

  // ── Pre-fetch OEM parts for this vehicle (shared by Step 5a and Step 6) ──
  // Fetch once here and reuse in both steps to avoid duplicate API calls.
  const productTypeLower = (productType || "").toLowerCase();
  const productWords = productTypeLower.split(/[\s,()]+/).filter(w => w.length > 3);

  let cachedVehicleOemParts = [];
  let cachedUsedTerm        = null;
  {
    const searchTerms = [];
    if (productTypeLower) searchTerms.push(productTypeLower);
    for (const w of productWords) { if (!searchTerms.includes(w)) searchTerms.push(w); }
    searchTerms.push("filter"); // broad fallback

    for (const term of searchTerms) {
      const raw   = await searchPartsByVehicle(vehicleId, term);
      const parts = extractPartsArray(raw);
      console.log(`[preload] searchPartsByVehicle(${vehicleId}, "${term}") → ${parts.length}`);
      if (parts.length > 0) { cachedVehicleOemParts = parts; cachedUsedTerm = term; break; }
    }
  }

  // ── STEP 5a — OEM Equivalence Match ──────────────────────────────────────
  // Check whether the user's OEM number appears inside the OEM cross-references
  // of any part that IS known to fit this specific vehicle.
  // This catches incomplete TecDoc mappings where one article's compat list
  // omits a vehicle that another equivalent article correctly includes.
  //
  // Only checks parts fetched FOR this vehicle — never a global OEM scan —
  // to avoid false positives from supersessions or shared part families.

  if (normalizedUserOem && cachedVehicleOemParts.length > 0) {
    let oemEquivMatch = null;

    // Check each vehicle OEM part's articleOemNo directly
    for (const part of cachedVehicleOemParts) {
      const partOem = normalizeOem(part.articleOemNo || part.oemNo || part.oem || "");
      if (partOem && partOem === normalizedUserOem) {
        oemEquivMatch = { part, via: "directOemRef" };
        break;
      }
    }

    // If not found by direct field, fetch full OEM reference lists for the top parts
    if (!oemEquivMatch) {
      const TOP = 6;
      const oemRefResults = await Promise.all(
        cachedVehicleOemParts.slice(0, TOP).map(async p => {
          const artId = p.articleId || p.id || null;
          if (!artId) return [];
          try {
            const refs = extractOemStringsFromResponse(await getOemsByArticleIds([artId]));
            return refs.map(normalizeOem);
          } catch { return []; }
        })
      );
      oemRefResults.forEach((refs, i) => {
        if (!oemEquivMatch && refs.includes(normalizedUserOem)) {
          oemEquivMatch = { part: cachedVehicleOemParts[i], via: "oemCrossRef" };
        }
      });
    }

    if (oemEquivMatch) {
      console.log(`[STEP5a] OEM equivalence match via ${oemEquivMatch.via}: ${oemNumber} found in vehicle ${vehicleId} parts`);
      result.status          = "compatible";
      result.checkedPart     = { ...(result.checkedPart || {}), compatible: true };
      result.matchReasoning  = {
        matched: true, score: 92, matchedBy: "oemEquivalence",
        matchedFields: ["oemNumber"],
        conflictingFields: [],
        notes: [
          `OEM ${oemNumber} found in vehicle-specific part references (${oemEquivMatch.via})`,
          "TecDoc compatibility confirmed via OEM cross-reference for this vehicle"
        ]
      };
      result.confidenceScore = 92;
      result.confidenceLabel = getConfidenceLabel(92);
      return result;
    }

    console.log(`[STEP5a] OEM ${normalizedUserOem} not found in ${cachedVehicleOemParts.length} vehicle parts — trying fuzzy`);
  }

  // ── STEP 5b — Fuzzy attribute match ──────────────────────────────────────
  // Lower-priority fallback. Only runs when exact ID and OEM equivalence both
  // failed. Infers compatibility from shared vehicle attributes (engine code,
  // make, model, year, fuel type) across the part's known compatible vehicles.

  if (normalisedVehicle && compatibleVehicles.length > 0) {
    const fuzzy = compareVehicleToCompatibility(normalisedVehicle, compatibleVehicles);
    console.log(`[STEP5b] fuzzy score=${fuzzy.score} matched=${fuzzy.matched} fields=${fuzzy.matchedFields?.join(",")}`);

    if (fuzzy.score >= 50) {
      result.status          = "compatible";
      result.checkedPart     = { ...(result.checkedPart || {}), compatible: true };
      result.matchReasoning  = fuzzy;
      result.confidenceScore = fuzzy.score;
      result.confidenceLabel = getConfidenceLabel(fuzzy.score);
      return result;
    }
  }

  result.matchReasoning  = { matched: false, score: 0, matchedBy: null, notes: [`Vehicle ID ${vehicleId} not found in compatible vehicles list`] };
  result.confidenceScore = 0;
  result.confidenceLabel = getConfidenceLabel(0);

  // ── STEP 6 — Alternative compatible part search ───────────────────────────
  // Final fallback: use the OEM parts we already fetched for this vehicle
  // (cachedVehicleOemParts) to find an aftermarket alternative for the user.
  // Reuses the preloaded result — no duplicate API call needed.

  try {
    const words = productWords; // already computed above

    let oemPartsForVehicle = cachedVehicleOemParts;
    let usedTerm           = cachedUsedTerm;

    if (oemPartsForVehicle.length === 0) {
      console.log(`[STEP6] no OEM parts found for vehicle ${vehicleId} with any search term`);
      result.status = "not_compatible";
      return result;
    }

    // Filter to OEM parts whose product name matches our target type
    const matchingOemParts = oemPartsForVehicle.filter((p) => {
      const name = (
        p.articleProductName || p.productGroupName || p.assemblyGroupName || p.productName || ""
      ).toLowerCase();
      return name === productTypeLower || words.some((w) => name.includes(w));
    });

    console.log(`[STEP6] "${productType}" → ${matchingOemParts.length} matching OEM parts (of ${oemPartsForVehicle.length} total with term="${usedTerm}")`);

    if (matchingOemParts.length === 0) {
      const available = [...new Set(
        oemPartsForVehicle.slice(0, 10).map((p) =>
          p.articleProductName || p.productGroupName || p.assemblyGroupName || p.productName || "?"
        )
      )];
      console.log(`[STEP6] available part types from "${usedTerm}": ${available.join(", ")}`);
      result.status = "not_compatible";
      return result;
    }

    // Extract OEM article numbers from matching OEM parts
    const oemNosFromVehicle = matchingOemParts
      .map((p) => p.articleOemNo || p.oemNo || p.oem || p.articleNo || "")
      .filter(Boolean);

    console.log(`[STEP6] OEM numbers found for vehicle: ${oemNosFromVehicle.join(", ")}`);

    if (oemNosFromVehicle.length === 0) {
      console.log(`[STEP6] no OEM numbers found in matching parts`);
      result.status = "not_compatible";
      return result;
    }

    // Search all OEM numbers in parallel, collect all candidates
    const oemResults = await Promise.all(
      oemNosFromVehicle.slice(0, 9).map(async (oem) => {
        try {
          const found = extractArticlesArray(await searchArticleByOem(oem));
          console.log(`[STEP6] OEM "${oem}" → ${found.length} aftermarket articles`);
          return found;
        } catch (err) {
          console.log(`[STEP6] searchArticleByOem("${oem}") threw: ${err.message}`);
          return [];
        }
      })
    );
    const allAltCandidates = oemResults.flat();

    if (allAltCandidates.length === 0) {
      console.log(`[STEP6] no aftermarket articles found for any OEM numbers`);
      result.status = "not_compatible";
      return result;
    }

    // Keep only articles whose product type exactly matches the target
    const altArticles = allAltCandidates.filter((a) => {
      const name = (a.articleProductName || a.productName || "").toLowerCase();
      return name === productTypeLower;
    });

    console.log(`[STEP6] ${allAltCandidates.length} candidates → ${altArticles.length} exact matches for "${productType}"`);

    if (altArticles.length === 0) {
      console.log(`[STEP6] no articles with exact product type "${productType}" found`);
      result.status = "not_compatible";
      return result;
    }

    // Pick best article and fetch complete details
    const bestAlt        = rankArticleResults(altArticles)[0];
    const bestAltId      = bestAlt.articleId || bestAlt.id || null;
    let   fullAltArticle = bestAlt;

    if (bestAltId) {
      try {
        const details = extractArticlesArray(await getArticleDetailsById(bestAltId));
        if (details.length > 0 && details[0]) fullAltArticle = details[0];
      } catch {}
    }

    const altInfo      = extractArticleInfo(fullAltArticle);
    altInfo.supplierId = (fullAltArticle && fullAltArticle.supplierId) || bestAlt.supplierId || null;
    altInfo.articleNo  = altInfo.articleNumber || bestAlt.articleNo || "";
    console.log(`[STEP6] selected: article=${altInfo.articleNo} brand=${altInfo.brand} type=${altInfo.productType}`);

    // Fetch OEM numbers — seed from the vehicle OEM numbers we already found,
    // then supplement with getOemsByArticleIds for any additional cross-refs.
    {
      // The OEM numbers we used to find this article are valid OEM refs for the part
      const seedOems = oemNosFromVehicle.slice();

      let apiOems = [];
      if (altInfo.articleId) {
        const cachedOems = _oemsByArticleCache.get(String(altInfo.articleId));
        if (cachedOems) {
          apiOems = cachedOems;
        } else {
          try {
            apiOems = extractOemStringsFromResponse(await getOemsByArticleIds([altInfo.articleId]));
            if (apiOems.length > 0) {
              _oemsByArticleCache.set(String(altInfo.articleId), apiOems);
            }
          } catch {}
        }
      }

      // Merge and deduplicate
      const merged = [...new Set([...seedOems, ...apiOems])];
      if (merged.length > 0) altInfo.oemNumbers = merged;
      console.log(`[STEP6] alt OEM numbers (${merged.length}): ${merged.join(", ")}`);
    }

    // Fetch image
    try {
      const altImg = extractFirstImageUrl(await getArticleMedia(altInfo.articleId));
      if (altImg) altInfo.imageUrl = altImg;
    } catch {}

    result.alternativePart = { ...altInfo, compatible: true };
    result.status          = "alternative_found";
    return result;

  } catch (err) {
    console.log(`[STEP6] threw: ${err.message}`);
    result.errors.push({ step: "alternativeSearch", message: err.message });
  }

  result.status = "not_compatible";
  return result;
}
