import {
  lookupVehicleByVin,
  listManufacturers,
  listModelsByManufacturer,
  listVehicleTypesByModel,
  getVehicleTypeDetails,
  searchArticleByOem,
  getArticleDetails,
  searchPartsByVehicle,
  getArticleMedia
} from "./api.js";
import { normaliseVehicle, enrichVehicleWithTypeDetails, normaliseMake, normaliseYear, normaliseModel } from "./normalise.js";
import {
  rankArticleResults,
  compareVehicleToCompatibility,
  getConfidenceLabel,
  extractArticleInfo,
  extractFirstImageUrl
} from "./logic.js";

// ─── Response extractors ──────────────────────────────────────────────────────

// Parse the Autodoc VIN decoder-v5 response:
// { "vin-data-1": { "encodingOptions": 15, "content": "{JSON string}" }, ... }
function extractVehicleFromVinResponse(vinData) {
  if (!vinData || typeof vinData !== "object") return null;

  const merged = {};
  const keys = Object.keys(vinData).filter((k) => k.startsWith("vin-data-")).sort();

  for (const key of keys) {
    const entry = vinData[key];
    if (!entry) continue;
    if (typeof entry.content === "string") {
      try { Object.assign(merged, JSON.parse(entry.content)); } catch {}
    } else if (typeof entry === "object") {
      Object.assign(merged, entry);
    }
  }

  return Object.keys(merged).length > 0 ? merged : null;
}

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

// ─── K number resolution ──────────────────────────────────────────────────────

// Step A: Try to resolve the K number + base vehicle info from the article's
// compatibleCars list by filtering on make + year. Returns { kNum, car } or null.
function resolveKFromCompatibleCars(vehicle, compatibleCars) {
  if (!vehicle.make || !Array.isArray(compatibleCars) || compatibleCars.length === 0) return null;

  const candidates = compatibleCars.filter((car) => {
    const carMake = normaliseMake(car.manufacturerName || car.make || car.brand || "");
    if (carMake !== vehicle.make) return false;

    if (vehicle.year) {
      const from = normaliseYear(car.constructionIntervalStart || car.yearFrom) || 0;
      const to   = normaliseYear(car.constructionIntervalEnd   || car.yearTo)   || 2100;
      if (vehicle.year < from || vehicle.year > to) return false;
    }

    return true;
  });

  if (candidates.length === 0) return null;

  if (vehicle.model) {
    candidates.sort((a, b) => {
      const am = normaliseModel(a.modelName || a.model || "");
      const bm = normaliseModel(b.modelName || b.model || "");
      const aMatch = am.includes(vehicle.model) || vehicle.model.includes(am) ? 1 : 0;
      const bMatch = bm.includes(vehicle.model) || vehicle.model.includes(bm) ? 1 : 0;
      return bMatch - aMatch;
    });
  }

  const car = candidates[0];
  const kNum = String(car.vehicleId || car.id || car.typeId || "").trim();
  return kNum ? { kNum, car } : null;
}

// Step B (fallback): Resolve K number via API chain —
// manufacturer list → model list → vehicle types list → filter by year.
// Used when the OEM article has no compatibleCars match (e.g. for alternative search).
async function resolveKNumberViaApi(vehicle) {
  if (!vehicle.make) return null;

  try {
    // 1. Find manufacturer
    const manufacturers = await listManufacturers();
    console.log(`[resolveK] Got ${manufacturers.length} manufacturers`);

    const mfrMatch = manufacturers.find((m) => {
      const name = normaliseMake(m.name || m.manufacturerName || m.mfrName || "");
      return name === vehicle.make;
    });
    if (!mfrMatch) {
      console.log(`[resolveK] No manufacturer match for "${vehicle.make}"`);
      return null;
    }

    const mfrId = mfrMatch.id || mfrMatch.manufacturerId || mfrMatch.mfrId;
    console.log(`[resolveK] Manufacturer "${vehicle.make}" → ID ${mfrId}`);

    // 2. Find model
    const models = await listModelsByManufacturer(mfrId);
    console.log(`[resolveK] Got ${models.length} models for manufacturer ${mfrId}`);

    let modelId = null;
    if (vehicle.model && models.length > 0) {
      const modelMatch = models.find((m) => {
        const name = normaliseModel(m.name || m.modelName || m.series || "");
        return name.includes(vehicle.model) || vehicle.model.includes(name);
      });
      if (modelMatch) {
        modelId = modelMatch.id || modelMatch.modelId;
        console.log(`[resolveK] Model "${vehicle.model}" → ID ${modelId}`);
      }
    }

    if (!modelId) {
      console.log(`[resolveK] No model match for "${vehicle.model}" — cannot narrow to K number`);
      return null;
    }

    // 3. Get vehicle types for the model
    const typesRaw = await listVehicleTypesByModel(modelId);
    console.log(`[resolveK] Vehicle types raw:`, JSON.stringify(typesRaw).slice(0, 500));

    const types = Array.isArray(typesRaw)
      ? typesRaw
      : (typesRaw?.vehicleTypes || typesRaw?.types || typesRaw?.data || []);

    if (types.length === 0) {
      console.log(`[resolveK] No vehicle types found for model ${modelId}`);
      return null;
    }

    // 4. Filter by year
    const yearFiltered = vehicle.year
      ? types.filter((t) => {
          const from = normaliseYear(t.constructionIntervalStart || t.yearFrom) || 0;
          const to   = normaliseYear(t.constructionIntervalEnd   || t.yearTo)   || 2100;
          return vehicle.year >= from && vehicle.year <= to;
        })
      : types;

    if (yearFiltered.length === 0) {
      console.log(`[resolveK] No vehicle types matched year ${vehicle.year}`);
      return null;
    }

    const kNum = String(yearFiltered[0].vehicleId || yearFiltered[0].id || yearFiltered[0].typeId || "").trim();
    console.log(`[resolveK] Resolved K number: ${kNum}`);
    return kNum || null;

  } catch (err) {
    console.log(`[resolveK] API chain failed: ${err.message}`);
    return null;
  }
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

  // ── Step 1: Vehicle identity from VIN (or manual fields) ──────────────────
  let normalisedVehicle;

  if (vin) {
    try {
      const vinData = await lookupVehicleByVin(vin);
      const vinVehicle = extractVehicleFromVinResponse(vinData);
      if (vinVehicle) {
        normalisedVehicle = normaliseVehicle({ ...vinVehicle, vin });
      }
      if (!normalisedVehicle || (!normalisedVehicle.make && !normalisedVehicle.model)) {
        console.log("[VIN] decoded but no usable fields. Raw keys:", Object.keys(vinData || {}).join(", "));
        normalisedVehicle = null;
      } else {
        console.log("[VIN] resolved →", normalisedVehicle.make, normalisedVehicle.model, normalisedVehicle.year);
      }
    } catch (err) {
      result.errors.push({ step: "vehicleLookup", message: `VIN lookup failed: ${err.message}` });
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
    normalisedVehicle = normaliseVehicle({
      make, model, year, fuelType,
      engineSize, engineCode
    });
    if (vin) {
      result.errors.push({ step: "vehicleLookup", message: "VIN decoded but returned no make/model — using manually entered vehicle details." });
    }
  }

  // Overlay any manual overrides on top of VIN data
  if (make)        normalisedVehicle.make            = normaliseMake(make);
  if (model)       normalisedVehicle.model           = normaliseModel(model);
  if (year)        normalisedVehicle.year            = normaliseYear(year);

  result.vehicle = normalisedVehicle;

  // ── Step 2: OEM article search ────────────────────────────────────────────
  let bestArticle;
  try {
    const oemData = await searchArticleByOem(oemNumber);
    const articles = extractArticlesArray(oemData);
    if (articles.length === 0) throw new Error("No articles found for OEM number");
    bestArticle = rankArticleResults(articles)[0];
  } catch (err) {
    result.errors.push({ step: "oemSearch", message: err.message });
    return result;
  }

  // ── Step 3: Article details ───────────────────────────────────────────────
  let articleDetails;
  try {
    const articleNo = bestArticle.articleNo || bestArticle.articleNumber || bestArticle.artNr;
    const detailsData = await getArticleDetails(articleNo);
    const detailArticles = extractArticlesArray(detailsData);
    if (detailArticles.length === 0) throw new Error("No article details returned");
    articleDetails = detailArticles[0];
  } catch (err) {
    result.errors.push({ step: "articleDetails", message: err.message });
    return result;
  }

  // ── Step 4: Media ─────────────────────────────────────────────────────────
  let imageUrl = null;
  try {
    const mediaData = await getArticleMedia(articleDetails.articleId || articleDetails.id);
    imageUrl = extractFirstImageUrl(mediaData);
  } catch {}

  const articleInfo = extractArticleInfo(articleDetails);
  if (imageUrl) articleInfo.imageUrl = imageUrl;
  result.checkedPart = { ...articleInfo, compatible: false };

  // ── Step 3.5: Resolve K number + enrich vehicle from compatibleCars ─────────
  if (!normalisedVehicle.vehicleId) {
    const resolved = resolveKFromCompatibleCars(normalisedVehicle, articleInfo.compatibleCars);
    if (resolved) {
      const { kNum, car } = resolved;
      // Pull model + variant directly from the matched compatible car — no extra API call
      normalisedVehicle = {
        ...normalisedVehicle,
        vehicleId: kNum,
        model:   normalisedVehicle.model   || normaliseModel(car.modelName  || car.model  || ""),
        variant: normalisedVehicle.variant || car.typeEngineName || car.typeName || car.variant || null,
        yearTo:  normalisedVehicle.yearTo  || normaliseYear(car.constructionIntervalEnd || car.yearTo)
      };
      console.log(`[K] Resolved K=${kNum} model="${normalisedVehicle.model}" variant="${normalisedVehicle.variant}"`);
    } else {
      console.log(`[K] No match in compatibleCars for make=${normalisedVehicle.make} year=${normalisedVehicle.year}`);
    }
  }

  // ── Step 3.6: Fetch full spec via vehicle type details ────────────────────
  console.log(`[V] vehicleId for spec fetch: ${normalisedVehicle.vehicleId}`);
  if (normalisedVehicle.vehicleId) {
    try {
      const typeDetail = await getVehicleTypeDetails(normalisedVehicle.vehicleId);
      console.log(`[V] typeDetail keys:`, typeDetail ? Object.keys(typeDetail).join(", ") : "null");
      if (typeDetail) {
        normalisedVehicle = enrichVehicleWithTypeDetails(normalisedVehicle, typeDetail);
        console.log(`[V] enriched → kw=${normalisedVehicle.powerKw} hp=${normalisedVehicle.powerPs} fuel=${normalisedVehicle.fuelType} codes=${normalisedVehicle.engineCodes} cyl=${normalisedVehicle.cylinders}`);
      }
    } catch (err) {
      console.log(`[V] enrichment error: ${err.message}`);
    }
  }

  result.vehicle = normalisedVehicle;

  // ── Step 5: Compatibility check ───────────────────────────────────────────
  const comparison = compareVehicleToCompatibility(normalisedVehicle, articleInfo.compatibleCars);
  result.matchReasoning = comparison;
  result.confidenceScore = comparison.score;
  result.confidenceLabel = getConfidenceLabel(comparison.score);

  if (comparison.score >= 70) {
    result.status = "compatible";
    result.checkedPart.compatible = true;
    return result;
  }

  if (comparison.score >= 50) {
    result.status = "manual_check_required";
    return result;
  }

  // ── Step 6: Not compatible — search for alternative ───────────────────────
  // Need a vehicleId (K number) for the vehicle-based parts search.
  // If we still don't have one, try the API chain: manufacturer → model → types.
  let vehicleId = normalisedVehicle.vehicleId;

  if (!vehicleId) {
    vehicleId = await resolveKNumberViaApi(normalisedVehicle);
    if (vehicleId) {
      normalisedVehicle = { ...normalisedVehicle, vehicleId };
      result.vehicle = normalisedVehicle;
    }
  }

  if (vehicleId) {
    try {
      const partsData = await searchPartsByVehicle(vehicleId);
      const parts = extractPartsArray(partsData);

      // Filter by product type
      let filtered = parts;
      if (articleInfo.productType) {
        const firstWord = articleInfo.productType.split(/\s+/)[0].toLowerCase();
        if (firstWord.length > 2) {
          const typed = parts.filter((p) => {
            const pType = (p.articleProductName || p.productName || p.description || "").toLowerCase();
            return pType.includes(firstWord);
          });
          if (typed.length > 0) filtered = typed;
        }
      }

      const rankedAlts = rankArticleResults(filtered);
      if (rankedAlts.length > 0) {
        const altArticle = rankedAlts[0];
        const altInfo = extractArticleInfo(altArticle);

        // Get alt article full details (for complete OEM numbers)
        try {
          const altNo = altInfo.articleNumber || altArticle.articleNo || altArticle.artNr;
          if (altNo) {
            const altDetails = await getArticleDetails(altNo);
            const altDetailArticles = extractArticlesArray(altDetails);
            if (altDetailArticles.length > 0) {
              const fullAlt = extractArticleInfo(altDetailArticles[0]);
              Object.assign(altInfo, {
                oemNumbers: fullAlt.oemNumbers,
                productType: fullAlt.productType || altInfo.productType,
                articleId: fullAlt.articleId || altInfo.articleId
              });
            }
          }
        } catch {}

        // Get alt image
        try {
          const altMedia = await getArticleMedia(altInfo.articleId);
          const altImg = extractFirstImageUrl(altMedia);
          if (altImg) altInfo.imageUrl = altImg;
        } catch {}

        result.alternativePart = { ...altInfo, compatible: true };
        result.status = "alternative_found";
        return result;
      }
    } catch (err) {
      result.errors.push({ step: "alternativeSearch", message: err.message });
    }
  }

  result.status = "not_compatible";
  return result;
}
