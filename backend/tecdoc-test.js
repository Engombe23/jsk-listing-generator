import "dotenv/config";
import fs from "fs";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "tecdoc-catalog.p.rapidapi.com";
const articleNumber = "AOP858";

async function testTecdoc() {
  if (!RAPIDAPI_KEY) {
    throw new Error("Missing RAPIDAPI_KEY in .env");
  }

  const url = `https://${RAPIDAPI_HOST}/articles/article-number-details`;

  const params = new URLSearchParams();
  params.append("typeId", "1");
  params.append("langId", "4");
  params.append("countryFilterId", "63");
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

  console.log("Status:", res.status);

  fs.writeFileSync("tecdoc-response.json", text, "utf8");
  console.log("Saved response to tecdoc-response.json");
}

testTecdoc().catch((err) => {
  console.error(err);
});