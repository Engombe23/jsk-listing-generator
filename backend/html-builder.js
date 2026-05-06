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
  if (text.startsWith("LAND ROVER"))    return "Land Rover";
  if (text.startsWith("ALFA ROMEO"))    return "Alfa Romeo";
  if (text.startsWith("MERCEDES-BENZ")) return "Mercedes-Benz";
  if (text.startsWith("ROLLS-ROYCE"))   return "Rolls-Royce";
  if (text.startsWith("VAUXHALL"))      return "Vauxhall";
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

// ─── Row builder (shared across themes) ──────────────────────────────────────

function buildBodyRow(v, i, rowBg1 = "#ffffff", rowBg2 = "#f5f5f5", borderColor = "#000000") {
  const engineCodes = uniq(v.engine_codes || []).join(", ");
  const bg = i % 2 === 0 ? rowBg1 : rowBg2;
  return `<tr style="background:${bg};">
  <td style="border:1px solid ${borderColor};padding:7px 10px;text-align:left;font-size:13px;">${escapeHtml(v.vehicle)}</td>
  <td style="border:1px solid ${borderColor};padding:7px 8px;text-align:center;font-size:13px;">${escapeHtml(v.production_years)}</td>
  <td style="border:1px solid ${borderColor};padding:7px 8px;text-align:center;font-size:13px;">${escapeHtml(v.kw || "")}</td>
  <td style="border:1px solid ${borderColor};padding:7px 8px;text-align:center;font-size:13px;">${escapeHtml(v.hp || "")}</td>
  <td style="border:1px solid ${borderColor};padding:7px 8px;text-align:center;font-size:13px;">${escapeHtml(v.cc || "")}</td>
  <td style="border:1px solid ${borderColor};padding:7px 8px;text-align:center;font-size:13px;">${escapeHtml(engineCodes)}</td>
</tr>`;
}

// ─── Grouped compatibility tables ────────────────────────────────────────────

function groupByManufacturer(rows) {
  const grouped = {};
  for (const row of rows) {
    const mfr = getManufacturerName(row.vehicle);
    (grouped[mfr] = grouped[mfr] || []).push(row);
  }
  return grouped;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME: default (Clean Default)
// ═══════════════════════════════════════════════════════════════════════════════

function buildHtmlDefault(data, t) {
  const oems  = uniq(data.oem_numbers || []);
  const specs = uniq(data.specifications || []);
  const rows  = data.compatibility_rows || [];
  const grouped = groupByManufacturer(rows);

  const manufacturerTables = Object.keys(grouped).sort().map((mfr) => {
    const bodyRows = grouped[mfr].map((v, i) => buildBodyRow(v, i, "#ffffff", "#f5f5f5", "#000000")).join("\n");
    return `<div style="margin-bottom:14px;"><table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
  <thead>
    <tr><th colspan="6" style="border:1px solid #000000;background:#000000;color:${t.primaryColor};font-weight:bold;text-align:center;padding:9px 10px;font-size:16px;">${escapeHtml(mfr)} Models:</th></tr>
    <tr style="background:${t.tableHeaderBackground};">
      <th style="border:1px solid #000000;padding:7px 10px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">Vehicle</th>
      <th style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">Production Years</th>
      <th style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">kW</th>
      <th style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">HP</th>
      <th style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">CC</th>
      <th style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">Engine Codes</th>
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table></div>`;
  }).join("\n");

  const oemHtml  = oems.length  ? oems.map(escapeHtml).join(", ") : "Not specified";
  const specsHtml = specs.length ? specs.map((s) => `<div style="padding:2px 0;">${escapeHtml(s)}</div>`).join("") : `<div style="padding:2px 0;">Not specified</div>`;

  return `<div style="max-width:1100px;margin:0 auto;padding:12px;border:1px solid #cccccc;background:#efefef;font-family:Arial,sans-serif;color:#000000;">
  <div style="font-size:20px;font-weight:bold;color:#000000;text-align:center;margin:6px 0 16px;line-height:1.4;">${escapeHtml(data.product_name || "")}</div>
  <div style="max-width:860px;margin:0 auto 16px;background:#ffffff;color:${t.primaryColor};font-weight:bold;text-align:center;padding:12px 18px;border:2px solid ${t.primaryColor};font-size:15px;line-height:1.5;">&#9888; Please review the images / compatibility to ensure you are ordering the correct part!</div>
  <div style="margin:0 0 12px;">
    <div style="background:${t.primaryColor};color:#ffffff;font-weight:bold;text-align:center;padding:8px 12px;font-size:17px;">Replaces OEM Part Numbers:</div>
    <div style="background:#ffffff;padding:12px 16px;text-align:center;font-size:15px;line-height:1.7;border:1px solid ${t.primaryColor};border-top:none;">${oemHtml}</div>
  </div>
  <div style="margin:0 0 12px;">
    <div style="background:${t.primaryColor};color:#ffffff;font-weight:bold;text-align:center;padding:8px 12px;font-size:17px;">Item Specifics:</div>
    <div style="background:#ffffff;padding:12px 16px;text-align:center;font-size:15px;line-height:1.7;border:1px solid ${t.primaryColor};border-top:none;">${specsHtml}</div>
  </div>
  <div style="background:${t.primaryColor};color:#ffffff;font-weight:bold;text-align:center;padding:8px 12px;font-size:17px;margin:0 0 14px;">Compatible Vehicles:</div>
  ${manufacturerTables}
</div>`.trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME: dark-header
// ═══════════════════════════════════════════════════════════════════════════════

function buildHtmlDarkHeader(data, t) {
  const oems  = uniq(data.oem_numbers || []);
  const specs = uniq(data.specifications || []);
  const rows  = data.compatibility_rows || [];
  const grouped = groupByManufacturer(rows);

  const manufacturerTables = Object.keys(grouped).sort().map((mfr) => {
    const bodyRows = grouped[mfr].map((v, i) => buildBodyRow(v, i, "#ffffff", "#f5f5f5", "#cccccc")).join("\n");
    return `<div style="margin:0 12px 14px;border:1px solid #dddddd;"><table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
  <thead>
    <tr><th colspan="6" style="border:1px solid #333333;background:#111111;color:${t.primaryColor};font-weight:bold;text-align:center;padding:10px 10px;font-size:15px;letter-spacing:0.5px;">${escapeHtml(mfr)} Models:</th></tr>
    <tr style="background:${t.tableHeaderBackground};">
      <th style="border:1px solid #444444;padding:7px 10px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">Vehicle</th>
      <th style="border:1px solid #444444;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">Years</th>
      <th style="border:1px solid #444444;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">kW</th>
      <th style="border:1px solid #444444;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">HP</th>
      <th style="border:1px solid #444444;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">CC</th>
      <th style="border:1px solid #444444;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">Engine Codes</th>
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table></div>`;
  }).join("\n");

  const oemHtml  = oems.length  ? oems.map(escapeHtml).join("&nbsp;&nbsp;|&nbsp;&nbsp;") : "Not specified";
  const specsHtml = specs.length ? specs.map((s) => `<div style="padding:3px 0;border-bottom:1px solid #eeeeee;">${escapeHtml(s)}</div>`).join("") : `<div style="padding:3px 0;">Not specified</div>`;

  return `<div style="max-width:1100px;margin:0 auto;padding:0;border:2px solid #111111;background:#ffffff;font-family:Arial,sans-serif;color:#111111;">
  <div style="background:#111111;color:${t.primaryColor};font-size:22px;font-weight:bold;text-align:center;padding:16px 12px;line-height:1.3;">${escapeHtml(data.product_name || "")}</div>
  <div style="margin:12px 12px;background:#fff8f8;color:#991111;font-weight:bold;text-align:center;padding:10px 14px;border:2px solid #cc0000;font-size:14px;line-height:1.5;">&#9888; Please review the images / compatibility to ensure you are ordering the correct part!</div>
  <div style="margin:0 12px 10px;">
    <div style="background:#111111;color:${t.primaryColor};font-weight:bold;padding:6px 10px;font-size:14px;text-transform:uppercase;letter-spacing:0.8px;">OEM Reference Numbers</div>
    <div style="padding:10px 12px;font-size:14px;line-height:1.8;border:1px solid #dddddd;border-top:none;">${oemHtml}</div>
  </div>
  <div style="margin:0 12px 10px;">
    <div style="background:#111111;color:${t.primaryColor};font-weight:bold;padding:6px 10px;font-size:14px;text-transform:uppercase;letter-spacing:0.8px;">Item Specifics</div>
    <div style="padding:10px 12px;font-size:14px;line-height:1.8;border:1px solid #dddddd;border-top:none;">${specsHtml}</div>
  </div>
  <div style="margin:0 12px 14px;">
    <div style="background:#111111;color:${t.primaryColor};font-weight:bold;padding:6px 10px;font-size:14px;text-transform:uppercase;letter-spacing:0.8px;">Compatible Vehicles</div>
  </div>
  ${manufacturerTables}
</div>`.trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME: table-focused
// ═══════════════════════════════════════════════════════════════════════════════

function buildHtmlTableFocused(data, t) {
  const oems  = uniq(data.oem_numbers || []);
  const specs = uniq(data.specifications || []);
  const rows  = data.compatibility_rows || [];
  const grouped = groupByManufacturer(rows);

  // Compact meta table (OEM + specs side by side)
  const metaRows = [];
  if (oems.length) {
    metaRows.push(`<tr><td style="border:1px solid #999;padding:6px 10px;font-weight:bold;background:#e8e8e8;font-size:13px;width:160px;">OEM Numbers</td><td style="border:1px solid #999;padding:6px 10px;font-size:13px;">${oems.map(escapeHtml).join(", ")}</td></tr>`);
  }
  for (const s of specs) {
    const colonIdx = s.indexOf(":");
    const label = colonIdx > -1 ? s.slice(0, colonIdx).trim() : s;
    const value = colonIdx > -1 ? s.slice(colonIdx + 1).trim() : "";
    metaRows.push(`<tr><td style="border:1px solid #999;padding:6px 10px;font-weight:bold;background:#e8e8e8;font-size:13px;">${escapeHtml(label)}</td><td style="border:1px solid #999;padding:6px 10px;font-size:13px;">${escapeHtml(value)}</td></tr>`);
  }

  const manufacturerTables = Object.keys(grouped).sort().map((mfr) => {
    const bodyRows = grouped[mfr].map((v, i) => buildBodyRow(v, i, "#ffffff", "#f0f0f0", "#999999")).join("\n");
    return `<div style="margin-bottom:14px;"><table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
  <thead>
    <tr><th colspan="6" style="border:1px solid #555555;background:${t.primaryColor};color:#ffffff;font-weight:bold;text-align:left;padding:7px 10px;font-size:14px;">${escapeHtml(mfr)}</th></tr>
    <tr style="background:${t.tableHeaderBackground};">
      <th style="border:1px solid #999;padding:6px 8px;font-size:12px;color:${t.tableHeaderTextColor};text-align:left;">Vehicle</th>
      <th style="border:1px solid #999;padding:6px 8px;font-size:12px;color:${t.tableHeaderTextColor};text-align:center;">Years</th>
      <th style="border:1px solid #999;padding:6px 6px;font-size:12px;color:${t.tableHeaderTextColor};text-align:center;">kW</th>
      <th style="border:1px solid #999;padding:6px 6px;font-size:12px;color:${t.tableHeaderTextColor};text-align:center;">HP</th>
      <th style="border:1px solid #999;padding:6px 6px;font-size:12px;color:${t.tableHeaderTextColor};text-align:center;">CC</th>
      <th style="border:1px solid #999;padding:6px 8px;font-size:12px;color:${t.tableHeaderTextColor};text-align:center;">Engine Codes</th>
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table></div>`;
  }).join("\n");

  return `<div style="max-width:1100px;margin:0 auto;padding:10px;background:#f7f7f7;font-family:Arial,sans-serif;color:#111111;border:1px solid #cccccc;">
  <div style="font-size:18px;font-weight:bold;text-align:center;padding:10px 0 8px;color:#111111;">${escapeHtml(data.product_name || "")}</div>
  <div style="background:#fff3cd;border:1px solid #e0a800;padding:8px 12px;text-align:center;font-size:13px;font-weight:bold;margin-bottom:10px;">&#9888; Please verify compatibility before ordering</div>
  <div style="margin-bottom:10px;">
    <table style="width:100%;border-collapse:collapse;">${metaRows.join("")}</table>
  </div>
  <div style="background:${t.primaryColor};color:#ffffff;font-weight:bold;padding:7px 10px;font-size:14px;margin-bottom:14px;">Compatible Vehicles (${rows.length} applications)</div>
  ${manufacturerTables}
</div>`.trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME: minimal
// ═══════════════════════════════════════════════════════════════════════════════

function buildHtmlMinimal(data, t) {
  const oems  = uniq(data.oem_numbers || []);
  const specs = uniq(data.specifications || []);
  const rows  = data.compatibility_rows || [];
  const grouped = groupByManufacturer(rows);

  const manufacturerTables = Object.keys(grouped).sort().map((mfr) => {
    const bodyRows = grouped[mfr].map((v, i) => {
      const engineCodes = uniq(v.engine_codes || []).join(", ");
      const bg = i % 2 === 0 ? "#ffffff" : "#fafafa";
      return `<tr style="background:${bg};">
  <td style="border-bottom:1px solid #e5e5e5;padding:6px 8px;font-size:13px;">${escapeHtml(v.vehicle)}</td>
  <td style="border-bottom:1px solid #e5e5e5;padding:6px 8px;font-size:13px;text-align:center;">${escapeHtml(v.production_years)}</td>
  <td style="border-bottom:1px solid #e5e5e5;padding:6px 6px;font-size:13px;text-align:center;">${escapeHtml(v.kw || "")}</td>
  <td style="border-bottom:1px solid #e5e5e5;padding:6px 6px;font-size:13px;text-align:center;">${escapeHtml(v.hp || "")}</td>
  <td style="border-bottom:1px solid #e5e5e5;padding:6px 6px;font-size:13px;text-align:center;">${escapeHtml(v.cc || "")}</td>
  <td style="border-bottom:1px solid #e5e5e5;padding:6px 8px;font-size:13px;text-align:center;">${escapeHtml(engineCodes)}</td>
</tr>`;
    }).join("\n");
    return `<div style="margin-bottom:14px;"><p style="font-weight:bold;font-size:14px;margin:0 0 6px;">${escapeHtml(mfr)}</p>
<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;border-top:2px solid ${t.primaryColor};">
  <thead>
    <tr style="background:${t.tableHeaderBackground};">
      <th style="padding:6px 8px;text-align:left;font-size:12px;color:${t.tableHeaderTextColor};">Vehicle</th>
      <th style="padding:6px 8px;text-align:center;font-size:12px;color:${t.tableHeaderTextColor};">Years</th>
      <th style="padding:6px 6px;text-align:center;font-size:12px;color:${t.tableHeaderTextColor};">kW</th>
      <th style="padding:6px 6px;text-align:center;font-size:12px;color:${t.tableHeaderTextColor};">HP</th>
      <th style="padding:6px 6px;text-align:center;font-size:12px;color:${t.tableHeaderTextColor};">CC</th>
      <th style="padding:6px 8px;text-align:center;font-size:12px;color:${t.tableHeaderTextColor};">Engine Codes</th>
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table></div>`;
  }).join("\n");

  const oemText  = oems.length  ? oems.join(", ") : "Not specified";
  const specsHtml = specs.length ? specs.map((s) => `<div>${escapeHtml(s)}</div>`).join("") : "Not specified";

  return `<div style="max-width:1100px;margin:0 auto;padding:14px 16px;background:#ffffff;font-family:Arial,sans-serif;color:#222222;border:1px solid #e0e0e0;">
  <h2 style="font-size:18px;font-weight:bold;margin:0 0 10px;color:#111111;">${escapeHtml(data.product_name || "")}</h2>
  <p style="color:#888888;font-size:13px;margin:0 0 12px;">Please verify compatibility with your vehicle before purchasing.</p>
  <p style="font-weight:bold;font-size:13px;margin:0 0 3px;color:${t.primaryColor};">OEM Reference Numbers</p>
  <p style="font-size:13px;margin:0 0 12px;color:#444444;">${escapeHtml(oemText)}</p>
  <p style="font-weight:bold;font-size:13px;margin:0 0 3px;color:${t.primaryColor};">Item Specifics</p>
  <div style="font-size:13px;color:#444444;line-height:1.8;margin-bottom:12px;">${specsHtml}</div>
  <p style="font-weight:bold;font-size:13px;margin:0 0 14px;color:${t.primaryColor};">Compatible Vehicles</p>
  ${manufacturerTables}
</div>`.trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME: professional-blue
// ═══════════════════════════════════════════════════════════════════════════════

function buildHtmlProfessionalBlue(data, t) {
  const oems  = uniq(data.oem_numbers || []);
  const specs = uniq(data.specifications || []);
  const rows  = data.compatibility_rows || [];
  const grouped = groupByManufacturer(rows);

  const manufacturerTables = Object.keys(grouped).sort().map((mfr) => {
    const bodyRows = grouped[mfr].map((v, i) => {
      const engineCodes = uniq(v.engine_codes || []).join(", ");
      const bg = i % 2 === 0 ? "#ffffff" : "#eef4fb";
      return `<tr style="background:${bg};">
  <td style="border:1px solid #b8d0e8;padding:6px 10px;font-size:13px;">${escapeHtml(v.vehicle)}</td>
  <td style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;">${escapeHtml(v.production_years)}</td>
  <td style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;">${escapeHtml(v.kw || "")}</td>
  <td style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;">${escapeHtml(v.hp || "")}</td>
  <td style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;">${escapeHtml(v.cc || "")}</td>
  <td style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;">${escapeHtml(engineCodes)}</td>
</tr>`;
    }).join("\n");
    return `<div style="padding:0 14px 8px;margin-bottom:14px;"><table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
  <thead>
    <tr><th colspan="6" style="border:1px solid #1a3a6b;background:${t.primaryColor};color:#ffffff;font-weight:bold;text-align:center;padding:8px 10px;font-size:14px;">${escapeHtml(mfr)}</th></tr>
    <tr style="background:${t.tableHeaderBackground};">
      <th style="border:1px solid #b8d0e8;padding:6px 10px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">Vehicle</th>
      <th style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">Production Years</th>
      <th style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">kW</th>
      <th style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">HP</th>
      <th style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">CC</th>
      <th style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">Engine Codes</th>
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table></div>`;
  }).join("\n");

  const oemHtml  = oems.length  ? oems.map(escapeHtml).join("&nbsp; &nbsp;") : "Not specified";
  const specsHtml = specs.length ? `<table style="width:100%;border-collapse:collapse;">${specs.map((s, i) => {
    const colonIdx = s.indexOf(":");
    const label = colonIdx > -1 ? s.slice(0, colonIdx).trim() : s;
    const value = colonIdx > -1 ? s.slice(colonIdx + 1).trim() : "";
    const bg = i % 2 === 0 ? "#ffffff" : "#eef4fb";
    return `<tr style="background:${bg};"><td style="border:1px solid #b8d0e8;padding:5px 10px;font-size:13px;font-weight:bold;width:200px;color:#1a3a6b;">${escapeHtml(label)}</td><td style="border:1px solid #b8d0e8;padding:5px 10px;font-size:13px;">${escapeHtml(value)}</td></tr>`;
  }).join("")}</table>` : `<div style="font-size:13px;color:#666;">Not specified</div>`;

  return `<div style="max-width:1100px;margin:0 auto;padding:0;border:1px solid #b8d0e8;background:#f5f9ff;font-family:Arial,sans-serif;color:#111111;">
  <div style="background:${t.primaryColor};color:#ffffff;font-size:20px;font-weight:bold;text-align:center;padding:14px 16px;letter-spacing:0.3px;">${escapeHtml(data.product_name || "")}</div>
  <div style="background:#fff3cd;border-bottom:1px solid #e0a800;padding:9px 16px;text-align:center;font-size:13px;font-weight:bold;color:#664d03;">&#9888; Please review the compatibility information before purchasing</div>
  <div style="padding:12px 14px 0;">
    <div style="margin-bottom:12px;">
      <div style="background:${t.primaryColor};color:#ffffff;font-weight:bold;padding:6px 12px;font-size:13px;display:inline-block;margin-bottom:4px;">OEM Reference Numbers</div>
      <div style="padding:8px 12px;background:#ffffff;border:1px solid #b8d0e8;font-size:14px;line-height:1.8;">${oemHtml}</div>
    </div>
    <div style="margin-bottom:12px;">
      <div style="background:${t.primaryColor};color:#ffffff;font-weight:bold;padding:6px 12px;font-size:13px;display:inline-block;margin-bottom:4px;">Item Specifics</div>
      ${specsHtml}
    </div>
  </div>
  <div style="padding:4px 14px 14px;">
    <div style="background:${t.primaryColor};color:#ffffff;font-weight:bold;padding:6px 12px;font-size:13px;display:inline-block;">Compatible Vehicles</div>
  </div>
  ${manufacturerTables}
</div>`.trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DISPATCHER
// ═══════════════════════════════════════════════════════════════════════════════

export function buildHtml(data, template = {}) {
  const layout = template.layout || "default";

  switch (layout) {
    case "dark-header":       return buildHtmlDarkHeader(data, template);
    case "table-focused":     return buildHtmlTableFocused(data, template);
    case "minimal":           return buildHtmlMinimal(data, template);
    case "professional-blue": return buildHtmlProfessionalBlue(data, template);
    default:                  return buildHtmlDefault(data, template);
  }
}
