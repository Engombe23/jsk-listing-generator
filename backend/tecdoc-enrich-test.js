import "dotenv/config";
import fs from "fs";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "tecdoc-catalog.p.rapidapi.com";

const ARTICLE_NUMBER = "AOP858";
const TYPE_ID = "1";
const LANG_ID = "4";
const COUNTRY_FILTER_ID = "63";

async function fetchArticleDetails(articleNumber) {
  const url = `https://${RAPIDAPI_HOST}/articles/article-number-details`;

  const params = new URLSearchParams();
  params.append("typeId", TYPE_ID);
  params.append("langId", LANG_ID);
  params.append("countryFilterId", COUNTRY_FILTER_ID);
  params.append("articleNo", articleNumber);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST
    },
    body: params.toString()
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Article details failed (${res.status}): ${text}`);
  }

  return JSON.parse(text);
}

async function fetchEngineTypesByModel(modelId) {
  const url = `https://${RAPIDAPI_HOST}/types/type-id/${TYPE_ID}/list-vehicles-types/${modelId}/lang-id/${LANG_ID}/country-filter-id/${COUNTRY_FILTER_ID}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST
    }
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Engine types failed (${res.status}): ${text}`);
  }

  return JSON.parse(text);
}

function uniq(arr) {
  return [...new Set(arr)];
}

function formatYearRange(start, end) {
  const fmt = (value) => {
    if (!value) return "Onwards";
    return String(value).slice(0, 7);
  };

  return `${fmt(start)} to ${end ? fmt(end) : "Onwards"}`;
}

function cleanNumber(value) {
  if (value === null || value === undefined || value === "") return "";
  return String(value).replace(/\.0+$/, "");
}

function splitEngineCodes(value) {
  if (!value) return [];
  return String(value)
    .split(/[,\n;/|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function findEngineMatch(car, engineRows) {
  if (!Array.isArray(engineRows) || engineRows.length === 0) return null;

  let match = engineRows.find((row) => String(row.vehicleId) === String(car.vehicleId));
  if (match) return match;

  match = engineRows.find(
    (row) =>
      String(row.typeEngineName || "").trim().toLowerCase() ===
        String(car.typeEngineName || "").trim().toLowerCase() &&
      String(row.constructionIntervalStart || "") === String(car.constructionIntervalStart || "") &&
      String(row.constructionIntervalEnd || "") === String(car.constructionIntervalEnd || "")
  );
  if (match) return match;

  match = engineRows.find(
    (row) =>
      String(row.typeEngineName || "").trim().toLowerCase() ===
      String(car.typeEngineName || "").trim().toLowerCase()
  );
  if (match) return match;

  return null;
}

function normalizeTecdoc(articleResponse, engineDataByModelId) {
  const firstArticle = articleResponse?.articles?.[0];
  if (!firstArticle) {
    throw new Error("No article found in TecDoc response");
  }

  const productName = firstArticle.articleProductName || "";
  const oemNumbers = uniq(
    (firstArticle.oemNo || [])
      .map((x) => x?.oemDisplayNo)
      .filter(Boolean)
  );

  const compatibleCars = firstArticle.compatibleCars || [];

  const compatibilityRows = compatibleCars.map((car) => {
    const engineRows = engineDataByModelId[String(car.modelId)] || [];
    const engineMatch = findEngineMatch(car, engineRows);

    return {
      vehicle: `${car.manufacturerName || ""} ${car.modelName || ""} ${car.typeEngineName || ""}`
        .replace(/\s+/g, " ")
        .trim(),
      production_years: formatYearRange(car.constructionIntervalStart, car.constructionIntervalEnd),
      kw: cleanNumber(engineMatch?.powerKw || ""),
      hp: cleanNumber(engineMatch?.powerPs || ""),
      cc: cleanNumber(engineMatch?.capacityTech || ""),
      engine_codes: uniq(splitEngineCodes(engineMatch?.engineCodes || "")),
      k_number: String(car.vehicleId || "")
    };
  });

  const engineCodes = uniq(
    compatibilityRows.flatMap((row) => row.engine_codes || [])
  );

  return {
    article_number: firstArticle.articleNo || "",
    article_id: firstArticle.articleId || "",
    product_name: productName,
    oem_numbers: oemNumbers,
    specifications: [],
    engine_codes: engineCodes,
    compatibility_rows: compatibilityRows
  };
}

async function main() {
  if (!RAPIDAPI_KEY) {
    throw new Error("Missing RAPIDAPI_KEY in .env");
  }

  console.log(`Fetching article details for ${ARTICLE_NUMBER}...`);
  const articleResponse = await fetchArticleDetails(ARTICLE_NUMBER);

  fs.writeFileSync(
    "tecdoc-article-response.json",
    JSON.stringify(articleResponse, null, 2),
    "utf8"
  );
  console.log("Saved tecdoc-article-response.json");

  const firstArticle = articleResponse?.articles?.[0];
  if (!firstArticle) {
    console.log("No article found.");
    return;
  }

  const compatibleCars = firstArticle.compatibleCars || [];
  const uniqueModelIds = uniq(
    compatibleCars.map((car) => String(car.modelId)).filter(Boolean)
  );

  console.log(`Found ${compatibleCars.length} compatible rows`);
  console.log(`Found ${uniqueModelIds.length} unique modelIds`);

  const engineDataByModelId = {};

  for (const modelId of uniqueModelIds) {
    try {
      console.log(`Fetching engine data for modelId ${modelId}...`);

      const data = await fetchEngineTypesByModel(modelId);

      const rows =
        data?.modelTypes ||
        data?.vehicleTypes ||
        data?.vehicles ||
        data?.data ||
        [];

      engineDataByModelId[String(modelId)] = Array.isArray(rows) ? rows : [];

      await new Promise((resolve) => setTimeout(resolve, 350));
    } catch (err) {
      console.error(`Failed modelId ${modelId}:`, err.message);
      engineDataByModelId[String(modelId)] = [];
    }
  }

  fs.writeFileSync(
    "tecdoc-engine-by-model.json",
    JSON.stringify(engineDataByModelId, null, 2),
    "utf8"
  );
  console.log("Saved tecdoc-engine-by-model.json");

  const normalized = normalizeTecdoc(articleResponse, engineDataByModelId);

  fs.writeFileSync(
    "tecdoc-normalized.json",
    JSON.stringify(normalized, null, 2),
    "utf8"
  );
  console.log("Saved tecdoc-normalized.json");

  console.log("");
  console.log("Done. Normalized preview:");
  console.log(JSON.stringify(normalized, null, 2));
}

main().catch((err) => {
  console.error("Fatal error:");
  console.error(err);
});