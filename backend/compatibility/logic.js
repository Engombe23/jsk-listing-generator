import { BRAND_TRUST_RANKING, CONFIDENCE_THRESHOLDS } from "./config.js";
import { normaliseMake, normaliseModel, normaliseEngineCode, normaliseEngineSize, normaliseFuelType, normaliseYear } from "./normalise.js";

export function getBrandTrustScore(brandName) {
  if (!brandName) return 0;
  const lower = String(brandName).toLowerCase().trim();
  const idx = BRAND_TRUST_RANKING.findIndex((b) => b === lower);
  if (idx === -1) return 0;
  return BRAND_TRUST_RANKING.length - idx;
}

export function rankArticleResults(articles) {
  if (!Array.isArray(articles)) return [];
  return [...articles].sort((a, b) => {
    const scoreA = getBrandTrustScore(a.brandName || a.brand || a.mfrName);
    const scoreB = getBrandTrustScore(b.brandName || b.brand || b.mfrName);
    if (scoreB !== scoreA) return scoreB - scoreA;
    const carsA = (a.compatibleCars || []).length;
    const carsB = (b.compatibleCars || []).length;
    if (carsB > 0 !== carsA > 0) return carsB > 0 ? 1 : -1;
    const imgA = a.imageUrl ? 1 : 0;
    const imgB = b.imageUrl ? 1 : 0;
    return imgB - imgA;
  });
}

export function compareVehicleToCompatibility(vehicle, compatibilityList) {
  if (!vehicle || !Array.isArray(compatibilityList) || compatibilityList.length === 0) {
    return {
      matched: false,
      score: 0,
      matchedBy: null,
      matchedFields: [],
      conflictingFields: [],
      notes: ["No compatibility data available"]
    };
  }

  // Step 1: exact vehicleId match
  if (vehicle.vehicleId) {
    const exactMatch = compatibilityList.find(
      (c) =>
        String(c.vehicleId || c.typeId || c.kType || c.id) === String(vehicle.vehicleId)
    );
    if (exactMatch) {
      return {
        matched: true,
        score: 95,
        matchedBy: "tecDocTypeId",
        matchedFields: ["vehicleId"],
        conflictingFields: [],
        notes: ["Exact TecDoc vehicle ID match"]
      };
    }
  }

  // Step 2: fuzzy scoring
  let bestScore = -Infinity;
  let bestCar = null;
  let bestMatchedFields = [];
  let bestConflictingFields = [];
  let bestNotes = [];

  for (const car of compatibilityList) {
    let score = 0;
    const matchedFields = [];
    const conflictingFields = [];
    const notes = [];

    // Engine codes — checked first because an exact engine-code match proves
    // physical compatibility even when the make differs (e.g. BMW M57D30 engine
    // fitted to Land Rover Range Rover III — the part fits both).
    const carEngineCodes = normaliseEngineCode(car.engCodes || car.engineCodes || car.engineCode);
    let engineCodeMatched = false;
    if (vehicle.engineCodes && vehicle.engineCodes.length > 0 && carEngineCodes.length > 0) {
      const overlap = vehicle.engineCodes.filter((ec) => carEngineCodes.includes(ec));
      if (overlap.length > 0) {
        score += 55; // dominant signal — overrides make mismatch
        matchedFields.push("engineCode");
        notes.push(`Engine code match: ${overlap.join(", ")}`);
        engineCodeMatched = true;
      } else {
        score -= 15;
        conflictingFields.push("engineCode");
        notes.push(`Engine code mismatch: vehicle ${vehicle.engineCodes.join(",")} vs part ${carEngineCodes.join(",")}`);
      }
    }

    // Make — penalise mismatch but do NOT hard-skip.
    // A strong engine-code match (above) can legitimately overcome a make
    // difference (shared-platform engines, badge-engineered vehicles, etc.).
    const carMake = normaliseMake(car.manufacturerName || car.make || car.brand);
    if (vehicle.make && carMake) {
      if (carMake === vehicle.make) {
        score += 20;
        matchedFields.push("make");
      } else if (!engineCodeMatched) {
        // Skip this car only when there is no engine-code evidence of compatibility
        continue;
      } else {
        // Engine codes matched despite different make — apply a small penalty and note it
        score -= 10;
        conflictingFields.push("make");
        notes.push(`Make mismatch (${vehicle.make} vs ${carMake}) — overridden by engine code match`);
      }
    }

    // Model
    const carModel = normaliseModel(car.modelName || car.model || car.series);
    if (vehicle.model && carModel) {
      if (carModel.includes(vehicle.model) || vehicle.model.includes(carModel)) {
        score += 20;
        matchedFields.push("model");
      } else {
        score -= 10;
        conflictingFields.push("model");
      }
    }

    // Year range
    const carYearFrom = normaliseYear(car.constructionIntervalStart || car.yearFrom);
    const carYearTo = normaliseYear(car.constructionIntervalEnd || car.yearTo) || 2100;
    if (vehicle.year) {
      if (vehicle.year >= (carYearFrom || 0) && vehicle.year <= carYearTo) {
        score += 10;
        matchedFields.push("year");
      } else if (carYearFrom) {
        score -= 20;
        conflictingFields.push("year");
        notes.push(`Year ${vehicle.year} outside range ${carYearFrom}–${carYearTo}`);
      }
    }

    // Engine size
    const carEngineStr = car.typeEngineName || car.typeName || "";
    const engineMatch = carEngineStr.match(/(\d+[.,]\d+)/);
    if (engineMatch && vehicle.engineSizeLitres != null) {
      const carLitres = parseFloat(engineMatch[1].replace(",", "."));
      if (Math.abs(carLitres - vehicle.engineSizeLitres) <= 0.1) {
        score += 10;
        matchedFields.push("engineSize");
      }
    }

    // Fuel type
    const carFuel = normaliseFuelType(car.fuelType || car.fuel || car.fuelTypeDescription);
    if (vehicle.fuelType && carFuel) {
      if (carFuel === vehicle.fuelType) {
        score += 10;
        matchedFields.push("fuelType");
      } else {
        score -= 20;
        conflictingFields.push("fuelType");
        notes.push(`Fuel mismatch: vehicle ${vehicle.fuelType} vs part ${carFuel}`);
      }
    }

    // Power kW
    const carPowerKw = car.powerKw != null ? parseFloat(car.powerKw) : null;
    if (vehicle.powerKw != null && carPowerKw != null) {
      if (Math.abs(carPowerKw - vehicle.powerKw) <= 5) {
        score += 5;
        matchedFields.push("powerKw");
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCar = car;
      bestMatchedFields = matchedFields;
      bestConflictingFields = conflictingFields;
      bestNotes = notes;
    }
  }

  if (bestCar === null) {
    return {
      matched: false,
      score: 0,
      matchedBy: "fuzzy",
      matchedFields: [],
      conflictingFields: [],
      notes: ["No matching vehicle found in compatibility list"]
    };
  }

  // Hard fail if engine code conflict AND score < 50 AND no engine-code match
  if (bestConflictingFields.includes("engineCode") &&
      !bestMatchedFields.includes("engineCode") &&
      bestScore < 50) {
    return {
      matched: false,
      score: 0,
      matchedBy: "fuzzy",
      matchedFields: bestMatchedFields,
      conflictingFields: bestConflictingFields,
      notes: [...bestNotes, "Hard fail: conflicting engine code with low confidence score"]
    };
  }

  return {
    matched: bestScore >= CONFIDENCE_THRESHOLDS.LIKELY,
    score: Math.max(0, bestScore),
    matchedBy: "fuzzy",
    matchedFields: bestMatchedFields,
    conflictingFields: bestConflictingFields,
    notes: bestNotes
  };
}

export function getConfidenceLabel(score) {
  if (score >= 90) return "High Confidence — Compatible";
  if (score >= 70) return "Likely Compatible";
  if (score >= 50) return "Possible Match — Manual Check Required";
  return "Unable to Confirm";
}

export function determineProductType(article) {
  return article.articleProductName || article.productName || article.description || "";
}

export function extractArticleInfo(article) {
  return {
    articleId: article.articleId || article.id || null,
    articleNumber: article.articleNo || article.articleNumber || article.artNr || null,
    brand: article.brandName || article.brand || article.mfrName || null,
    productType: determineProductType(article),
    description: article.articleProductName || article.description || null,
    oemNumbers: (article.oemNo || article.oemNumbers || []).map(
      (o) => o.oemDisplayNo || o.oemNo || o
    ).filter(Boolean),
    compatibleCars: article.compatibleCars || [],
    imageUrl: article.imageUrl || null
  };
}

export function extractFirstImageUrl(mediaResponse) {
  if (!mediaResponse) return null;

  const urls = [];

  const walk = (obj) => {
    if (!obj) return;
    if (typeof obj === "string") {
      if (
        obj.startsWith("http") &&
        (/\.(jpg|jpeg|png|webp)/i.test(obj) || obj.includes("img.tecalliance"))
      ) {
        urls.push(obj);
      }
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }
    if (typeof obj === "object") {
      Object.values(obj).forEach(walk);
    }
  };

  walk(mediaResponse);
  return urls[0] || null;
}
