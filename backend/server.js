import "dotenv/config";
import express from "express";
import cors from "cors";
import { Parser } from "json2csv";
import { buildHtml } from "./html-builder.js";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://jsk-listing-generator-frontend.vercel.app"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: true
}));

app.options("*", cors());

app.use(express.json({ limit: "2mb" }));

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "tecdoc-catalog.p.rapidapi.com";

const TYPE_ID = "1";
const LANG_ID = "4";
const COUNTRY_FILTER_ID = "63";

function uniq(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

function formatYearRange(start, end) {
  const fmt = (value) => {
    if (!value) return "Onwards";
    return String(value).slice(0, 7);
  };
  return `${fmt(start)} to ${end ? fmt(end) : "Onwards"}`;
}

function cleanNumber(value) {
  if (!value) return "";
  return String(value).replace(/\.0+$/, "");
}

function splitEngineCodes(value) {
  if (!value) return [];
  return String(value)
    .split(/[,\n;/|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

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

  if (!res.ok) {
    throw new Error(`Failed to fetch article ${articleNumber}`);
  }

  return res.json();
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

  if (!res.ok) {
    return [];
  }

  const data = await res.json();

  return (
    data?.modelTypes ||
    data?.vehicleTypes ||
    data?.vehicles ||
    data?.data ||
    []
  );
}

async function fetchArticleMedia(articleId) {
  if (!articleId) return null;

  const url = `https://${RAPIDAPI_HOST}/articles/article-all-media-info?articleId=${articleId}&langId=${LANG_ID}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST
    }
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

function extractFirstImageUrl(mediaResponse) {
  if (!mediaResponse) return "";

  const urls = [];

  const walk = (obj) => {
    if (!obj) return;

    if (typeof obj === "string") {
      if (
        obj.startsWith("http") &&
        obj.match(/\.(jpg|jpeg|png|webp)/i)
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

  return urls[0] || "";
}

function findEngineMatch(car, engineRows) {
  if (!engineRows.length) return null;

  let match = engineRows.find(
    (r) => String(r.vehicleId) === String(car.vehicleId)
  );
  if (match) return match;

  return engineRows.find(
    (r) =>
      String(r.typeEngineName || "").toLowerCase() ===
      String(car.typeEngineName || "").toLowerCase()
  );
}

function normalizeTecdoc(articleResponse, engineDataByModelId) {
  const article = articleResponse?.articles?.[0];
  if (!article) throw new Error("No article found");

  const compatibility = article.compatibleCars || [];

  const rows = compatibility.map((car) => {
    const engineRows = engineDataByModelId[car.modelId] || [];
    const match = findEngineMatch(car, engineRows);

    return {
      vehicle: `${car.manufacturerName} ${car.modelName} ${car.typeEngineName}`,
      production_years: formatYearRange(
        car.constructionIntervalStart,
        car.constructionIntervalEnd
      ),
      kw: cleanNumber(match?.powerKw),
      hp: cleanNumber(match?.powerPs),
      cc: cleanNumber(match?.capacityTech),
      engine_codes: uniq(splitEngineCodes(match?.engineCodes)),
      k_number: String(car.vehicleId)
    };
  });

  return {
    product_name: article.articleProductName,
    oem_numbers: uniq((article.oemNo || []).map((o) => o.oemDisplayNo)),
    specifications: [],
    compatibility_rows: rows
  };
}

async function buildListingFromArticle(articleNumber) {
  const articleResponse = await fetchArticleDetails(articleNumber);
  const article = articleResponse?.articles?.[0];

  if (!article) {
    throw new Error("No article found");
  }

  const articleId = article.articleId;
  const cars = article.compatibleCars || [];
  const modelIds = uniq(cars.map((c) => c.modelId));

  const engineDataByModelId = {};

  for (const id of modelIds) {
    const data = await fetchEngineTypesByModel(id);
    engineDataByModelId[id] = data;
    await new Promise((r) => setTimeout(r, 250));
  }

  const normalized = normalizeTecdoc(articleResponse, engineDataByModelId);
  const html = buildHtml(normalized);
  const kNumbers = uniq(normalized.compatibility_rows.map((r) => r.k_number));
  const engineCodes = uniq(
    normalized.compatibility_rows.flatMap((r) => r.engine_codes || [])
  );

  const mediaResponse = await fetchArticleMedia(articleId);
  const articleImage = extractFirstImageUrl(mediaResponse);

  return {
    article_number: articleNumber,
    article_id: articleId,
    article_image: articleImage,
    generated_title: normalized.product_name,
    generated_html: html,
    k_number_list: kNumbers,
    oem_numbers: normalized.oem_numbers,
    engine_codes: engineCodes,
    compatibility_count: normalized.compatibility_rows.length
  };
}

app.post("/lookup", async (req, res) => {
  try {
    const { articleNumber } = req.body;

    if (!articleNumber) {
      return res.status(400).json({ error: "Missing articleNumber" });
    }

    const result = await buildListingFromArticle(articleNumber);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/batch-export", async (req, res) => {
  try {
    const { articleNumbers } = req.body;

    if (!Array.isArray(articleNumbers) || articleNumbers.length === 0) {
      return res.status(400).json({ error: "articleNumbers must be a non-empty array" });
    }

    const cleaned = uniq(
      articleNumbers
        .map((x) => String(x || "").trim())
        .filter(Boolean)
    );

    const rows = [];

    for (const articleNumber of cleaned) {
      try {
        console.log(`Batch processing ${articleNumber}...`);
        const result = await buildListingFromArticle(articleNumber);

        rows.push({
          article_number: result.article_number,
          title: result.generated_title,
          description_html: result.generated_html,
          k_numbers: result.k_number_list.join(","),
          oem_numbers: result.oem_numbers.join(", "),
          engine_codes: result.engine_codes.join(", "),
          compatibility_count: result.compatibility_count,
          article_image: result.article_image
        });
      } catch (err) {
        rows.push({
          article_number: articleNumber,
          title: "",
          description_html: "",
          k_numbers: "",
          oem_numbers: "",
          engine_codes: "",
          compatibility_count: "",
          article_image: "",
          error: err.message
        });
      }
    }

    const parser = new Parser({
      fields: [
        "article_number",
        "title",
        "description_html",
        "k_numbers",
        "oem_numbers",
        "engine_codes",
        "compatibility_count",
        "article_image",
        "error"
      ]
    });

    const csv = parser.parse(rows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="batch-listings.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});