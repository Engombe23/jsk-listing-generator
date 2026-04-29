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
  const text = String(vehicle || "").trim().toUpperCase();

  if (text.startsWith("LAND ROVER"))   return "Land Rover";
  if (text.startsWith("ALFA ROMEO"))   return "Alfa Romeo";
  if (text.startsWith("MERCEDES-BENZ")) return "Mercedes-Benz";
  if (text.startsWith("ROLLS-ROYCE"))  return "Rolls-Royce";
  if (text.startsWith("VAUXHALL"))     return "Vauxhall";

  const first = text.split(" ")[0] || "Other";

  const MAP = {
    vw: "VW", audi: "Audi", bmw: "BMW", ford: "Ford", seat: "Seat",
    skoda: "Skoda", mini: "Mini", fiat: "Fiat", opel: "Opel",
    peugeot: "Peugeot", citroen: "Citroen", renault: "Renault",
    jaguar: "Jaguar", porsche: "Porsche", volvo: "Volvo",
    toyota: "Toyota", nissan: "Nissan", mazda: "Mazda",
    kia: "Kia", hyundai: "Hyundai", honda: "Honda",
    suzuki: "Suzuki", mitsubishi: "Mitsubishi", subaru: "Subaru",
    lexus: "Lexus", infiniti: "Infiniti", chrysler: "Chrysler",
    jeep: "Jeep", dodge: "Dodge", tesla: "Tesla"
  };

  return MAP[first.toLowerCase()] || (first.charAt(0) + first.slice(1).toLowerCase());
}

function buildManufacturerTable(title, rows, colors) {
  if (!rows.length) return "";

  const { primary, tableHeaderBg, tableHeaderText } = colors;

  const bodyRows = rows
    .map((v, i) => {
      const engineCodes = uniq(v.engine_codes || []).join(", ");
      const bg = i % 2 === 0 ? "#ffffff" : "#f5f5f5";

      return `<tr style="background:${bg};">
  <td style="border:1px solid #000000;padding:7px 10px;text-align:left;font-size:14px;">${escapeHtml(v.vehicle)}</td>
  <td style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:14px;">${escapeHtml(v.production_years)}</td>
  <td style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:14px;">${escapeHtml(v.kw || "")}</td>
  <td style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:14px;">${escapeHtml(v.hp || "")}</td>
  <td style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:14px;">${escapeHtml(v.cc || "")}</td>
  <td style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:14px;">${escapeHtml(engineCodes)}</td>
</tr>`;
    })
    .join("\n");

  return `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;margin-bottom:0;">
  <thead>
    <tr>
      <th colspan="6" style="border:1px solid #000000;background:#000000;color:${primary};font-weight:bold;text-align:center;padding:9px 10px;font-size:16px;">${escapeHtml(title)}</th>
    </tr>
    <tr style="background:${tableHeaderBg};">
      <th style="border:1px solid #000000;padding:7px 10px;text-align:center;font-size:14px;color:${tableHeaderText};font-weight:bold;">Vehicle</th>
      <th style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:14px;color:${tableHeaderText};font-weight:bold;">Production Years</th>
      <th style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:14px;color:${tableHeaderText};font-weight:bold;">kW</th>
      <th style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:14px;color:${tableHeaderText};font-weight:bold;">HP</th>
      <th style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:14px;color:${tableHeaderText};font-weight:bold;">CC</th>
      <th style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:14px;color:${tableHeaderText};font-weight:bold;">Engine Codes</th>
    </tr>
  </thead>
  <tbody>
${bodyRows}
  </tbody>
</table>`;
}

export function buildHtml(data, template = {}) {
  const primary          = template.primaryColor          || "#cc0000";
  const tableHeaderBg    = template.tableHeaderBackground || "#c2c2c2";
  const tableHeaderText  = template.tableHeaderTextColor  || "#000000";

  const colors = { primary, tableHeaderBg, tableHeaderText };

  const oems  = uniq(data.oem_numbers || []);
  const specs = uniq(data.specifications || []);
  const rows  = data.compatibility_rows || [];

  // Group by manufacturer, sort A→Z
  const grouped = {};
  for (const row of rows) {
    const mfr = getManufacturerName(row.vehicle);
    (grouped[mfr] = grouped[mfr] || []).push(row);
  }
  const manufacturerTables = Object.keys(grouped)
    .sort((a, b) => a.localeCompare(b))
    .map((mfr) => buildManufacturerTable(`${mfr} Models:`, grouped[mfr], colors))
    .join("\n");

  const oemHtml = oems.length
    ? oems.map(escapeHtml).join(", ")
    : "Not specified";

  const specsHtml = specs.length
    ? specs.map((s) => `<div style="padding:2px 0;">${escapeHtml(s)}</div>`).join("")
    : `<div style="padding:2px 0;">Not specified</div>`;

  return `<div style="max-width:1100px;margin:0 auto;padding:12px;border:1px solid #cccccc;background:#efefef;font-family:Arial,sans-serif;color:#000000;">

  <!-- Title -->
  <div style="font-size:20px;font-weight:bold;color:#000000;text-align:center;margin:6px 0 16px;line-height:1.4;">
    ${escapeHtml(data.product_name || "")}
  </div>

  <!-- Warning -->
  <div style="max-width:860px;margin:0 auto 16px;background:#ffffff;color:${primary};font-weight:bold;text-align:center;padding:12px 18px;border:2px solid ${primary};font-size:15px;line-height:1.5;">
    &#9888; Please review the images / compatibility to ensure you are ordering the correct part!
  </div>

  <!-- OEM Numbers -->
  <div style="margin:0 0 12px;">
    <div style="background:${primary};color:#ffffff;font-weight:bold;text-align:center;padding:8px 12px;font-size:17px;">
      Replaces OEM Part Numbers:
    </div>
    <div style="background:#ffffff;padding:12px 16px;text-align:center;font-size:15px;line-height:1.7;border:1px solid ${primary};border-top:none;">
      ${oemHtml}
    </div>
  </div>

  <!-- Item Specifics -->
  <div style="margin:0 0 12px;">
    <div style="background:${primary};color:#ffffff;font-weight:bold;text-align:center;padding:8px 12px;font-size:17px;">
      Item Specifics:
    </div>
    <div style="background:#ffffff;padding:12px 16px;text-align:center;font-size:15px;line-height:1.7;border:1px solid ${primary};border-top:none;">
      ${specsHtml}
    </div>
  </div>

  <!-- Compatible Vehicles header -->
  <div style="background:${primary};color:#ffffff;font-weight:bold;text-align:center;padding:8px 12px;font-size:17px;margin:0 0 0;">
    Compatible Vehicles:
  </div>

  <!-- Manufacturer tables -->
  ${manufacturerTables}

</div>`.trim();
}
