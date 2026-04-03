function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function uniq(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

function getManufacturerName(vehicle) {
  const text = String(vehicle || "").trim();

  if (text.toUpperCase().startsWith("LAND ROVER")) return "Land Rover";
  if (text.toUpperCase().startsWith("ALFA ROMEO")) return "Alfa Romeo";
  if (text.toUpperCase().startsWith("VAUXHALL")) return "Vauxhall";
  if (text.toUpperCase().startsWith("MERCEDES-BENZ")) return "Mercedes-Benz";
  if (text.toUpperCase().startsWith("ROLLS-ROYCE")) return "Rolls-Royce";

  const firstWord = text.split(" ")[0] || "Other";
  const lower = firstWord.toLowerCase();

  if (lower === "vw") return "VW";
  if (lower === "seat") return "Seat";
  if (lower === "skoda") return "Skoda";
  if (lower === "audi") return "Audi";
  if (lower === "bmw") return "BMW";
  if (lower === "jaguar") return "Jaguar";
  if (lower === "ford") return "Ford";
  if (lower === "fiat") return "Fiat";
  if (lower === "peugeot") return "Peugeot";
  if (lower === "citroen") return "Citroen";
  if (lower === "renault") return "Renault";
  if (lower === "opel") return "Opel";
  if (lower === "mini") return "Mini";
  if (lower === "porsche") return "Porsche";
  if (lower === "volvo") return "Volvo";
  if (lower === "toyota") return "Toyota";
  if (lower === "nissan") return "Nissan";
  if (lower === "mazda") return "Mazda";
  if (lower === "kia") return "Kia";
  if (lower === "hyundai") return "Hyundai";
  if (lower === "honda") return "Honda";

  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
}

function buildManufacturerTable(title, rows) {
  if (!rows.length) return "";

  const bodyRows = rows
    .map((v, index) => {
      const engineCodes = uniq(v.engine_codes || []).join(", ");
      const rowBg = index % 2 === 0 ? "#ffffff" : "#f5f5f5";

      return `
        <tr style="background:${rowBg};">
          <td style="border:1px solid #000;padding:6px 8px;text-align:left;">${escapeHtml(v.vehicle)}</td>
          <td style="border:1px solid #000;padding:6px;text-align:center;">${escapeHtml(v.production_years)}</td>
          <td style="border:1px solid #000;padding:6px;text-align:center;">${escapeHtml(v.kw || "")}</td>
          <td style="border:1px solid #000;padding:6px;text-align:center;">${escapeHtml(v.hp || "")}</td>
          <td style="border:1px solid #000;padding:6px;text-align:center;">${escapeHtml(v.cc || "")}</td>
          <td style="border:1px solid #000;padding:6px;text-align:center;">${escapeHtml(engineCodes)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;margin-top:10px;">
      <thead>
        <tr>
          <th colspan="6" style="border:1px solid #000;background:#000;color:#cc0000;font-weight:bold;text-align:center;padding:8px;font-size:16px;">
            ${escapeHtml(title)}
          </th>
        </tr>
        <tr style="background:#c2c2c2;color:#000;font-weight:bold;">
          <th style="border:1px solid #000;padding:6px;text-align:center;">Vehicle</th>
          <th style="border:1px solid #000;padding:6px;text-align:center;">Production Years</th>
          <th style="border:1px solid #000;padding:6px;text-align:center;">kW</th>
          <th style="border:1px solid #000;padding:6px;text-align:center;">HP</th>
          <th style="border:1px solid #000;padding:6px;text-align:center;">CC</th>
          <th style="border:1px solid #000;padding:6px;text-align:center;">Engine Codes</th>
        </tr>
      </thead>
      <tbody>
        ${bodyRows}
      </tbody>
    </table>
  `;
}

export function buildHtml(data) {
  const oems = uniq(data.oem_numbers || []);
  const specs = uniq(data.specifications || []);
  const rows = data.compatibility_rows || [];

  const groupedByManufacturer = {};

  for (const row of rows) {
    const manufacturer = getManufacturerName(row.vehicle);
    if (!groupedByManufacturer[manufacturer]) {
      groupedByManufacturer[manufacturer] = [];
    }
    groupedByManufacturer[manufacturer].push(row);
  }

  const manufacturerOrder = Object.keys(groupedByManufacturer).sort((a, b) =>
    a.localeCompare(b)
  );

  const manufacturerTables = manufacturerOrder
    .map((manufacturer) =>
      buildManufacturerTable(`${manufacturer} Models:`, groupedByManufacturer[manufacturer])
    )
    .join("");

  const oemHtml = oems.length
    ? oems.map((oem) => `<div>${escapeHtml(oem)}</div>`).join("")
    : `<div>Not specified</div>`;

  const specsHtml = specs.length
    ? specs.map((spec) => `<div>${escapeHtml(spec)}</div>`).join("")
    : `<div>Not specified</div>`;

  return `
<div style="max-width:1120px;margin:0 auto;padding:10px;border:1px solid #bfbfbf;background:#efefef;font-family:Arial,sans-serif;color:#000;">

  <div style="font-size:20px;font-weight:bold;color:#000;text-align:center;margin:8px 0 16px 0;line-height:1.35;">
    ${escapeHtml(data.product_name || "")}
  </div>

  <div style="max-width:850px;margin:0 auto 18px auto;background:#fff3f3;color:#cc0000;font-weight:bold;text-align:center;padding:12px 18px;border:2px solid #cc0000;font-size:16px;line-height:1.45;">
    ⚠ Please review the images / compatibility to ensure you are ordering the correct part!
  </div>

  <div style="border:1px solid #cc0000;background:#fff;margin:0 0 14px 0;">
    <div style="background:#cc0000;color:#fff;font-weight:bold;text-align:center;padding:7px 10px;font-size:17px;">
      Replaces OEM Part Numbers:
    </div>
    <div style="padding:10px 14px;text-align:center;font-size:15px;line-height:1.55;">
      ${oemHtml}
    </div>
  </div>

  <div style="border:1px solid #cc0000;background:#fff;margin:0 0 14px 0;">
    <div style="background:#cc0000;color:#fff;font-weight:bold;text-align:center;padding:7px 10px;font-size:17px;">
      Item Specifics:
    </div>
    <div style="padding:10px 14px;text-align:center;font-size:15px;line-height:1.55;">
      ${specsHtml}
    </div>
  </div>

  <div style="border:1px solid #cc0000;background:#fff;margin:0 0 12px 0;">
    <div style="background:#cc0000;color:#fff;font-weight:bold;text-align:center;padding:7px 10px;font-size:17px;">
      Compatible Vehicles:
    </div>
  </div>

  ${manufacturerTables}

</div>
  `.trim();
}