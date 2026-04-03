import "dotenv/config";
import fs from "fs";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function main() {
  console.log("Step 1: Reading tecdoc-normalized.json...");

  const raw = fs.readFileSync("tecdoc-normalized.json", "utf8");
  const normalized = JSON.parse(raw);

  console.log("Step 2: Loaded normalized TecDoc data.");
  console.log("Product:", normalized.product_name);
  console.log("Compatibility rows:", normalized.compatibility_rows?.length || 0);
  console.log("");

  console.log("Step 3: Sending data to OpenAI...");
  const start = Date.now();

  const response = await client.responses.create({
    model: "gpt-5.4-mini",
    input: [
      {
        role: "developer",
        content: `
You are formatting automotive parts data into an eBay listing.

Use only the supplied data.

Return JSON only with:
- generated_title
- generated_html
- k_number_list

IMPORTANT:
- k_number_list must be returned separately.
- generated_html must NOT include K numbers.
- Do not include supplier name, source brand, or article number.
- Do not use separator dashes between sections.
- Keep generated_title under 80 characters.
- The title can be simple.

The generated_html must contain ONLY these sections in this exact order:

1. Centered, bold, black product title

2. Red warning box with white bold text:
   "Please review the images / compatibility to ensure you are ordering the correct part!"

3. Bold static heading:
   "Replaces OEM Part Numbers:"
   followed by the OEM numbers

4. Bold static heading:
   "Item Specifics:"
   followed by the specifications
   - If no specifications exist, omit this section entirely

5. Bold static heading:
   "Engine Codes:"
   followed by engine codes grouped by manufacturer if possible
   - If no engine codes exist, omit this section entirely

6. Bold static heading:
   "Compatible Models:"
   followed by separate manufacturer sections
   - Create a separate compatibility table for each manufacturer
   - For example, Jaguar models in one table and Land Rover models in another
   - Each manufacturer section should have a bold heading using the manufacturer name

Each compatibility table must contain ONLY these columns:
- Vehicle
- Production Years
- kW
- HP
- cc

Formatting rules:
- inline styles only
- compact eBay-style layout
- clean spacing
- no extra commentary
- no extra headings beyond the required structure
- no supplier branding
- no article references
- all subheadings must be bold
- warning box must be red fill with white bold text
- title must be black, bold and centered
- compatibility tables must be bordered and compact
- manufacturer groups must be clearly separated
`
      },
      {
        role: "user",
        content: JSON.stringify(normalized)
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "ebay_listing_output",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            generated_title: { type: "string" },
            generated_html: { type: "string" },
            k_number_list: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["generated_title", "generated_html", "k_number_list"]
        }
      }
    }
  });

  const end = Date.now();
  console.log(`Step 4: OpenAI response received in ${((end - start) / 1000).toFixed(1)}s`);

  console.log("Step 5: Parsing response...");
  const result = JSON.parse(response.output_text);

  console.log("Step 6: Writing listing-output.json...");
  fs.writeFileSync(
    "listing-output.json",
    JSON.stringify(result, null, 2),
    "utf8"
  );

  console.log("");
  console.log("Done.");
  console.log("Saved listing-output.json");
  console.log("");
  console.log("Generated title:");
  console.log(result.generated_title);
  console.log("");
  console.log("K numbers:");
  console.log((result.k_number_list || []).join(", "));
}

main().catch((err) => {
  console.error("ERROR:");
  console.error(err);
});