import "dotenv/config";
import express from "express";
import cors from "cors";
import { Parser } from "json2csv";
import { buildHtml } from "./html-builder.js";
import { getTemplateById } from "./templates/index.js";
import { checkCompatibility } from "./compatibility/checker.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "autodoc-parts-catalog.p.rapidapi.com";

const TYPE_ID = "1";
const LANG_ID = "4";
const COUNTRY_FILTER_ID = "63";

function uniq(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatYearRange(start, end) {
  const fmt = (value) => {
    if (!value) return "Onwards";
    return String(value).slice(0, 7);
  };
  return `${fmt(start)} to ${end ? fmt(end) : "Onwards"}`;
}

function cleanNumber(value) {
  if (!value && value !== 0) return "";
  return String(value).replace(/\.0+$/, "");
}

function splitEngineCodes(value) {
  if (!value) return [];
  return String(value)
    .split(/[,\n;/|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractSpecLabel(spec) {
  return (
    spec?.criteriaDescription ||
    spec?.criteriaName ||
    spec?.description ||
    spec?.name ||
    spec?.label ||
    ""
  );
}

function extractSpecValue(spec) {
  return (
    spec?.formattedValue ||
    spec?.criteriaValue ||
    spec?.displayValue ||
    spec?.value ||
    spec?.valueText ||
    ""
  );
}

async function fetchArticleDetails(articleNumber) {
  const url = `https://${RAPIDAPI_HOST}/api/articles/article-number-details`;

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
    throw new Error(`Failed to fetch article ${articleNumber}: ${res.status}`);
  }

  return res.json();
}

async function fetchVehicleDetails(vehicleId) {
  const url = `https://${RAPIDAPI_HOST}/api/types/type-id/${TYPE_ID}/vehicle-type-details/${vehicleId}/lang-id/${LANG_ID}/country-filter-id/${COUNTRY_FILTER_ID}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST
    }
  });

  if (!res.ok) return null;

  return res.json();
}

// Fetch vehicle details for many IDs in parallel batches to avoid rate limits
async function fetchVehicleDetailsForIds(vehicleIds) {
  const BATCH_SIZE = 5;
  const result = {};

  for (let i = 0; i < vehicleIds.length; i += BATCH_SIZE) {
    const batch = vehicleIds.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (id) => {
        try {
          const data = await fetchVehicleDetails(id);
          return [id, data];
        } catch {
          return [id, null];
        }
      })
    );

    for (const [id, data] of batchResults) {
      result[id] = data;
    }

    if (i + BATCH_SIZE < vehicleIds.length) {
      await sleep(300);
    }
  }

  return result;
}

async function fetchArticleMedia(articleId) {
  if (!articleId) return null;

  const url = `https://${RAPIDAPI_HOST}/api/articles/article-all-media-info`;

  const params = new URLSearchParams();
  params.append("langId", LANG_ID);
  params.append("articleId", String(articleId));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST
    },
    body: params.toString()
  });

  if (!res.ok) return null;

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
        (obj.includes("img.tecalliance") || obj.match(/\.(jpg|jpeg|png|webp)/i))
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

function extractVehicleDetail(data) {
  // Handle multiple possible response shapes from the autodoc API
  return (
    data?.vehicleType ||
    data?.vehicleTypeDetails ||
    data?.vehicleDetails ||
    data?.data ||
    data ||
    null
  );
}

function normalizeTecdoc(articleResponse, vehicleDataById) {
  const article = articleResponse?.articles?.[0];
  if (!article) throw new Error("No article found");

  const compatibility = article.compatibleCars || [];

  const rows = compatibility.map((car) => {
    const raw = vehicleDataById[String(car.vehicleId)] || null;
    const detail = raw ? extractVehicleDetail(raw) : null;

    return {
      make: car.manufacturerName || "",
      model: car.modelName || "",
      engine: car.typeEngineName || "",
      vehicle: `${car.manufacturerName || ""} ${car.modelName || ""} ${car.typeEngineName || ""}`.trim(),
      production_years: formatYearRange(
        car.constructionIntervalStart,
        car.constructionIntervalEnd
      ),
      kw: cleanNumber(detail?.powerKw),
      hp: cleanNumber(detail?.powerPs),
      cc: cleanNumber(detail?.capacityTech),
      engine_codes: uniq(
        splitEngineCodes(detail?.engCodes || detail?.engineCodes || detail?.engineCode || "")
      ),
      k_number: String(car.vehicleId || "")
    };
  });

  const specifications = uniq(
    (article.allSpecifications || [])
      .map((spec) => {
        const label = extractSpecLabel(spec);
        const value = extractSpecValue(spec);

        if (!label && !value) return "";
        if (label && value) return `${label}: ${value}`;
        return label || value;
      })
      .filter(Boolean)
  );

  return {
    product_name: article.articleProductName || "",
    oem_numbers: uniq((article.oemNo || []).map((o) => o.oemDisplayNo)),
    specifications,
    compatibility_rows: rows
  };
}

async function buildListingFromArticle(articleNumber, templateId = "jsk-default") {
  const articleResponse = await fetchArticleDetails(articleNumber);
  const article = articleResponse?.articles?.[0];

  if (!article) {
    throw new Error("No article found");
  }

  const articleId = article.articleId;
  const cars = article.compatibleCars || [];
  const vehicleIds = uniq(cars.map((c) => String(c.vehicleId)).filter(Boolean));

  console.log(`Fetching details for ${vehicleIds.length} vehicles...`);
  const vehicleDataById = await fetchVehicleDetailsForIds(vehicleIds);

  const normalized = normalizeTecdoc(articleResponse, vehicleDataById);

  const kNumbers = uniq(normalized.compatibility_rows.map((r) => r.k_number));
  const engineCodes = uniq(
    normalized.compatibility_rows.flatMap((r) => r.engine_codes || [])
  );

  const template = getTemplateById(templateId);

  const html = buildHtml(
    {
      ...normalized,
      engine_codes: engineCodes,
      k_numbers: kNumbers
    },
    template
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
    specifications: normalized.specifications,
    compatibility_count: normalized.compatibility_rows.length,
    product_type: normalized.product_name,
    template_id: template.id,
    template_name: template.name
  };
}

app.post("/lookup", async (req, res) => {
  try {
    const rawArticleNumber = req.body.articleNumber || "";
    const articleNumber = String(rawArticleNumber).trim().replace(/\s+/g, "");
    const templateId = req.body.templateId || "jsk-default";

    if (!articleNumber) {
      return res.status(400).json({ error: "Missing articleNumber" });
    }

    const result = await buildListingFromArticle(articleNumber, templateId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/batch-export", async (req, res) => {
  try {
    const { rows, templateId = "jsk-default" } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "rows must be a non-empty array" });
    }

    const cleanedRows = rows
      .map((row) => ({
        articleNumber: String(row.articleNumber || "").trim().replace(/\s+/g, ""),
        sku: String(row.sku || "").trim(),
        binPrice: String(row.binPrice || "").trim()
      }))
      .filter((row) => row.articleNumber && row.sku && row.binPrice);

    if (cleanedRows.length === 0) {
      return res.status(400).json({ error: "No valid rows found" });
    }

    const exportRows = [];

    for (const row of cleanedRows) {
      try {
        console.log(`Batch processing ${row.articleNumber} with template ${templateId}...`);
        const result = await buildListingFromArticle(row.articleNumber, templateId);

        const oemString = uniq(result.oem_numbers || []).join(", ");
        const engineCodesString = uniq(result.engine_codes || []).join(", ");
        const kNumbersString = uniq(result.k_number_list || []).join(", ");

        exportRows.push({
          "Title": result.generated_title || "",
          "SKU": row.sku,
          "BIN Price": row.binPrice,
          "Description": result.generated_html || "",
          "Custom Specifics 1 Name": "Brand",
          "Custom Specifics 1 Value": "JSK",
          "Custom Specifics 2 Name": "Reference OE/OEM Number",
          "Custom Specifics 2 Value": oemString,
          "Custom Specifics 3 Name": "Manufacturer Part Number",
          "Custom Specifics 3 Value": row.sku,
          "Custom Specifics 4 Name": "Product Type",
          "Custom Specifics 4 Value": result.product_type || "",
          "Custom Specifics 5 Name": "Country of Manufacture",
          "Custom Specifics 5 Value": "United Kingdom",
          "Custom Specifics 6 Name": "Compatible Engine Codes",
          "Custom Specifics 6 Value": engineCodesString,
          "Custom Specifics 7 Name": "K Numbers",
          "Custom Specifics 7 Value": kNumbersString,
          "Article Number": row.articleNumber,
          "Template": result.template_name || "",
          "Error": ""
        });
      } catch (err) {
        exportRows.push({
          "Title": "",
          "SKU": row.sku,
          "BIN Price": row.binPrice,
          "Description": "",
          "Custom Specifics 1 Name": "Brand",
          "Custom Specifics 1 Value": "JSK",
          "Custom Specifics 2 Name": "Reference OE/OEM Number",
          "Custom Specifics 2 Value": "",
          "Custom Specifics 3 Name": "Manufacturer Part Number",
          "Custom Specifics 3 Value": row.sku,
          "Custom Specifics 4 Name": "Product Type",
          "Custom Specifics 4 Value": "",
          "Custom Specifics 5 Name": "Country of Manufacture",
          "Custom Specifics 5 Value": "United Kingdom",
          "Custom Specifics 6 Name": "Compatible Engine Codes",
          "Custom Specifics 6 Value": "",
          "Custom Specifics 7 Name": "K Numbers",
          "Custom Specifics 7 Value": "",
          "Article Number": row.articleNumber,
          "Template": "",
          "Error": err.message
        });
      }
    }

    const parser = new Parser({
      fields: [
        "Title",
        "SKU",
        "BIN Price",
        "Description",
        "Custom Specifics 1 Name",
        "Custom Specifics 1 Value",
        "Custom Specifics 2 Name",
        "Custom Specifics 2 Value",
        "Custom Specifics 3 Name",
        "Custom Specifics 3 Value",
        "Custom Specifics 4 Name",
        "Custom Specifics 4 Value",
        "Custom Specifics 5 Name",
        "Custom Specifics 5 Value",
        "Custom Specifics 6 Name",
        "Custom Specifics 6 Value",
        "Custom Specifics 7 Name",
        "Custom Specifics 7 Value",
        "Article Number",
        "Template",
        "Error"
      ]
    });

    const csv = parser.parse(exportRows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="adlister-batch-export.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/compatibility/check", async (req, res) => {
  try {
    const { vin, oemNumber, partType, engineCode, make, model, year, fuelType, engineSize } = req.body;
    if (!oemNumber) {
      return res.status(400).json({ error: "oemNumber is required" });
    }
    if (!vin && !make && !model && !year) {
      return res.status(400).json({ error: "Provide a VIN, or at least Make + Model + Year" });
    }
    const result = await checkCompatibility({ vin, oemNumber, partType, engineCode, make, model, year, fuelType, engineSize });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});