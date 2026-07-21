// ─── Per-language string table ─────────────────────────────────────────────
const MARKETPLACE_TO_LANG = {
  "ebay-uk": "en", "ebay-de": "de", "ebay-fr": "fr",
  "ebay-it": "it", "ebay-es": "es", "ebay-ae": "ar", "ebay-tr": "tr",
};

const STR = {
  en: {
    vehicle: "Vehicle",
    years: "Production Years",
    yearsShort: "Years",
    kw: "kW", hp: "HP", cc: "CC",
    engineCodes: "Engine Codes",
    models: (mfr) => `${mfr} Models:`,
    notSpecified: "Not specified",
    oemNumbers: "OEM Numbers",
    oemRef: "OEM Reference Numbers",
    oemReplaces: "Replaces OEM Part Numbers:",
    interchangeable: "Interchangeable Part Numbers",
    interchangeableColon: "Interchangeable Part Numbers:",
    itemSpecifics: "Item Specifics",
    itemSpecificsColon: "Item Specifics:",
    compatVehicles: "Compatible Vehicles",
    compatVehiclesColon: "Compatible Vehicles:",
    compatVehiclesN: (n) => `Compatible Vehicles (${n} applications)`,
    warningLong: "Please review the images / compatibility to ensure you are ordering the correct part!",
    warningShort: "Please verify compatibility before ordering",
    warningVehicle: "Please verify compatibility with your vehicle before purchasing.",
    warningReview: "Please review the compatibility information before purchasing",
  },
  de: {
    vehicle: "Fahrzeug",
    years: "Baujahr",
    yearsShort: "Baujahr",
    kw: "kW", hp: "PS", cc: "cm³",
    engineCodes: "Motorcode",
    models: (mfr) => `${mfr} Modelle:`,
    notSpecified: "Nicht angegeben",
    oemNumbers: "OEM-Nummern",
    oemRef: "OEM-Referenznummern",
    oemReplaces: "Ersetzt OEM-Teilenummern:",
    interchangeable: "Austauschbare Teilenummern",
    interchangeableColon: "Austauschbare Teilenummern:",
    itemSpecifics: "Artikelmerkmale",
    itemSpecificsColon: "Artikelmerkmale:",
    compatVehicles: "Kompatible Fahrzeuge",
    compatVehiclesColon: "Kompatible Fahrzeuge:",
    compatVehiclesN: (n) => `Kompatible Fahrzeuge (${n} Anwendungen)`,
    warningLong: "Bitte überprüfen Sie die Bilder / Kompatibilität, um sicherzustellen, dass Sie das richtige Teil bestellen!",
    warningShort: "Bitte überprüfen Sie die Kompatibilität vor dem Kauf",
    warningVehicle: "Bitte prüfen Sie die Kompatibilität mit Ihrem Fahrzeug vor dem Kauf.",
    warningReview: "Bitte überprüfen Sie die Kompatibilitätsinformationen vor dem Kauf",
  },
  fr: {
    vehicle: "Véhicule",
    years: "Années de production",
    yearsShort: "Années",
    kw: "kW", hp: "CV", cc: "cm³",
    engineCodes: "Codes moteur",
    models: (mfr) => `${mfr} Modèles :`,
    notSpecified: "Non spécifié",
    oemNumbers: "Numéros OEM",
    oemRef: "Numéros de référence OEM",
    oemReplaces: "Remplace les références OEM :",
    interchangeable: "Numéros de pièces interchangeables",
    interchangeableColon: "Numéros de pièces interchangeables :",
    itemSpecifics: "Caractéristiques de l'article",
    itemSpecificsColon: "Caractéristiques de l'article :",
    compatVehicles: "Véhicules compatibles",
    compatVehiclesColon: "Véhicules compatibles :",
    compatVehiclesN: (n) => `Véhicules compatibles (${n} applications)`,
    warningLong: "Veuillez vérifier les images / la compatibilité pour vous assurer que vous commandez la bonne pièce !",
    warningShort: "Veuillez vérifier la compatibilité avant de commander",
    warningVehicle: "Veuillez vérifier la compatibilité avec votre véhicule avant l'achat.",
    warningReview: "Veuillez vérifier les informations de compatibilité avant l'achat",
  },
  it: {
    vehicle: "Veicolo",
    years: "Anni di produzione",
    yearsShort: "Anni",
    kw: "kW", hp: "CV", cc: "cm³",
    engineCodes: "Codici motore",
    models: (mfr) => `${mfr} Modelli:`,
    notSpecified: "Non specificato",
    oemNumbers: "Numeri OEM",
    oemRef: "Numeri di riferimento OEM",
    oemReplaces: "Sostituisce i codici OEM:",
    interchangeable: "Numeri di parti intercambiabili",
    interchangeableColon: "Numeri di parti intercambiabili:",
    itemSpecifics: "Specifiche articolo",
    itemSpecificsColon: "Specifiche articolo:",
    compatVehicles: "Veicoli compatibili",
    compatVehiclesColon: "Veicoli compatibili:",
    compatVehiclesN: (n) => `Veicoli compatibili (${n} applicazioni)`,
    warningLong: "Si prega di verificare le immagini / la compatibilità per assicurarsi di ordinare il pezzo corretto!",
    warningShort: "Verificare la compatibilità prima dell'acquisto",
    warningVehicle: "Si prega di verificare la compatibilità con il proprio veicolo prima dell'acquisto.",
    warningReview: "Si prega di verificare le informazioni di compatibilità prima dell'acquisto",
  },
  es: {
    vehicle: "Vehículo",
    years: "Años de producción",
    yearsShort: "Años",
    kw: "kW", hp: "CV", cc: "cm³",
    engineCodes: "Códigos de motor",
    models: (mfr) => `${mfr} Modelos:`,
    notSpecified: "No especificado",
    oemNumbers: "Números OEM",
    oemRef: "Números de referencia OEM",
    oemReplaces: "Sustituye números OEM:",
    interchangeable: "Números de piezas intercambiables",
    interchangeableColon: "Números de piezas intercambiables:",
    itemSpecifics: "Características del artículo",
    itemSpecificsColon: "Características del artículo:",
    compatVehicles: "Vehículos compatibles",
    compatVehiclesColon: "Vehículos compatibles:",
    compatVehiclesN: (n) => `Vehículos compatibles (${n} aplicaciones)`,
    warningLong: "¡Por favor, revise las imágenes / compatibilidad para asegurarse de que está pidiendo la pieza correcta!",
    warningShort: "Verifique la compatibilidad antes de comprar",
    warningVehicle: "Por favor, verifique la compatibilidad con su vehículo antes de comprar.",
    warningReview: "Por favor, revise la información de compatibilidad antes de comprar",
  },
  ar: {
    vehicle: "المركبة",
    years: "سنوات الإنتاج",
    yearsShort: "السنوات",
    kw: "كيلوواط", hp: "حصان", cc: "سم³",
    engineCodes: "رموز المحرك",
    models: (mfr) => `${mfr} الطرازات:`,
    notSpecified: "غير محدد",
    oemNumbers: "أرقام OEM",
    oemRef: "أرقام مرجع OEM",
    oemReplaces: "يستبدل أرقام قطع OEM:",
    interchangeable: "أرقام القطع القابلة للتبادل",
    interchangeableColon: "أرقام القطع القابلة للتبادل:",
    itemSpecifics: "مواصفات العنصر",
    itemSpecificsColon: "مواصفات العنصر:",
    compatVehicles: "المركبات المتوافقة",
    compatVehiclesColon: "المركبات المتوافقة:",
    compatVehiclesN: (n) => `المركبات المتوافقة (${n} تطبيقات)`,
    warningLong: "يرجى مراجعة الصور / التوافق للتأكد من طلب القطعة الصحيحة!",
    warningShort: "يرجى التحقق من التوافق قبل الطلب",
    warningVehicle: "يرجى التحقق من توافق القطعة مع سيارتك قبل الشراء.",
    warningReview: "يرجى مراجعة معلومات التوافق قبل الشراء",
  },
  tr: {
    vehicle: "Araç",
    years: "Üretim Yılları",
    yearsShort: "Yıllar",
    kw: "kW", hp: "BG", cc: "cm³",
    engineCodes: "Motor Kodları",
    models: (mfr) => `${mfr} Modelleri:`,
    notSpecified: "Belirtilmemiş",
    oemNumbers: "OEM Numaraları",
    oemRef: "OEM Referans Numaraları",
    oemReplaces: "OEM Parça Numaralarının Yerine Geçer:",
    interchangeable: "Değiştirilebilir Parça Numaraları",
    interchangeableColon: "Değiştirilebilir Parça Numaraları:",
    itemSpecifics: "Ürün Özellikleri",
    itemSpecificsColon: "Ürün Özellikleri:",
    compatVehicles: "Uyumlu Araçlar",
    compatVehiclesColon: "Uyumlu Araçlar:",
    compatVehiclesN: (n) => `Uyumlu Araçlar (${n} uygulama)`,
    warningLong: "Doğru parçayı sipariş ettiğinizden emin olmak için görselleri / uyumluluğu inceleyiniz!",
    warningShort: "Satın almadan önce uyumluluğu doğrulayınız",
    warningVehicle: "Satın almadan önce aracınızla uyumluluğu kontrol ediniz.",
    warningReview: "Satın almadan önce uyumluluk bilgilerini inceleyiniz",
  },
};

function getLang(opts) {
  const mp   = opts.targetMarketplace || "ebay-uk";
  const code = MARKETPLACE_TO_LANG[mp] || "en";
  return STR[code] || STR.en;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function buildCrossRefsHtml(refs, style = "default") {
  if (!Array.isArray(refs) || refs.length === 0) return "";

  const byBrand = {};
  for (const { brand, articleNo } of refs) {
    (byBrand[brand] = byBrand[brand] || []).push(articleNo);
  }

  const brandEntries = Object.entries(byBrand).sort(([a], [b]) => a.localeCompare(b));

  if (style === "inline") {
    const lines = brandEntries.map(([brand, nos]) =>
      `<span style="margin-right:18px;"><strong>${escapeHtml(brand)}:</strong> ${nos.map(escapeHtml).join(", ")}</span>`
    );
    return lines.join("");
  }

  if (style === "rows") {
    return brandEntries.map(([brand, nos]) =>
      `<tr><td style="border:1px solid #999;padding:6px 10px;font-weight:bold;background:#e8e8e8;font-size:13px;width:160px;">${escapeHtml(brand)}</td><td style="border:1px solid #999;padding:6px 10px;font-size:13px;">${nos.map(escapeHtml).join(", ")}</td></tr>`
    ).join("");
  }

  return brandEntries.map(([brand, nos]) =>
    `<div style="padding:2px 0;"><strong>${escapeHtml(brand)}:</strong> ${nos.map(escapeHtml).join(", ")}</div>`
  ).join("");
}

// Reformats "Label [unit]: value" → "Label: value unit"
function formatSpec(s) {
  const colonIdx = s.indexOf(":");
  if (colonIdx === -1) return s;
  const rawLabel  = s.slice(0, colonIdx).trim();
  const value     = s.slice(colonIdx + 1).trim();
  const unitMatch = rawLabel.match(/^(.+?)\s*\[([^\]]+)\]$/);
  if (unitMatch) return `${unitMatch[1].trim()}: ${value} ${unitMatch[2]}`;
  return s;
}

// Same but returns { label, value } for table-cell rendering
function parseSpec(s) {
  const colonIdx  = s.indexOf(":");
  const rawLabel  = colonIdx > -1 ? s.slice(0, colonIdx).trim() : s;
  const value     = colonIdx > -1 ? s.slice(colonIdx + 1).trim() : "";
  const unitMatch = rawLabel.match(/^(.+?)\s*\[([^\]]+)\]$/);
  if (unitMatch) return { label: unitMatch[1].trim(), value: value ? `${value} ${unitMatch[2]}` : value };
  return { label: rawLabel, value };
}

function buildBodyRow(v, i, rowBg1 = "#ffffff", rowBg2 = "#f5f5f5", borderColor = "#000000") {
  const bg = i % 2 === 0 ? rowBg1 : rowBg2;
  return `<tr style="background:${bg};">
  <td style="border:1px solid ${borderColor};padding:7px 10px;text-align:left;font-size:13px;">${escapeHtml(v.vehicle)}</td>
  <td style="border:1px solid ${borderColor};padding:7px 8px;text-align:center;font-size:13px;white-space:nowrap;">${escapeHtml(v.production_years)}</td>
  <td style="border:1px solid ${borderColor};padding:7px 8px;text-align:center;font-size:13px;">${escapeHtml(v.kw || "")}</td>
  <td style="border:1px solid ${borderColor};padding:7px 8px;text-align:center;font-size:13px;">${escapeHtml(v.hp || "")}</td>
  <td style="border:1px solid ${borderColor};padding:7px 8px;text-align:center;font-size:13px;">${escapeHtml(v.cc || "")}</td>
</tr>`;
}

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

function buildHtmlDefault(data, t, opts, L) {
  const showCompat  = opts.showCompatibilityTable !== false;
  const showXrefs   = opts.showInterchangeableNumbers !== false;
  const showEC      = opts.showEngineCodes !== false;
  const engineCodes = uniq(data.engine_codes || []);
  const red         = t.primaryColor || "#cc0000";
  const dark        = "#1a1a2e";

  const oems    = uniq(data.oem_numbers || []);
  const specs   = uniq(data.specifications || []);
  const rows    = data.compatibility_rows || [];
  const xrefs   = data.interchangeable_parts || [];
  const grouped = groupByManufacturer(rows);

  const itemSpecs = specs.map(s => parseSpec(s)).filter(s => s.label && s.value);

  const manufacturerTables = showCompat ? Object.keys(grouped)
    .sort((a, b) => grouped[b].length - grouped[a].length)
    .map((mfr) => {
      const bodyRows = grouped[mfr].map((v, i) => buildBodyRow(v, i, "#ffffff", "#f8f8f8", "#e8e8e8")).join("\n");
      return `<details style="margin-bottom:8px;">
<summary style="background:#ffffff;color:#111111;font-weight:bold;padding:10px 40px 10px 14px;font-size:14px;cursor:pointer;list-style:none;display:block;position:relative;border-bottom:1px solid #d0d0d0;">${escapeHtml(L.models(mfr))} (${grouped[mfr].length})<span style="position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:12px;line-height:1;color:#666666;">&#9660;</span></summary>
<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
  <thead>
    <tr style="background:#f5f5f5;">
      <th style="border-bottom:2px solid #e0e0e0;padding:7px 10px;text-align:left;font-size:12px;color:#555555;font-weight:bold;">${L.vehicle}</th>
      <th style="border-bottom:2px solid #e0e0e0;padding:7px 8px;text-align:center;font-size:12px;color:#555555;font-weight:bold;white-space:nowrap;">${L.years}</th>
      <th style="border-bottom:2px solid #e0e0e0;padding:7px 8px;text-align:center;font-size:12px;color:#555555;font-weight:bold;">${L.kw}</th>
      <th style="border-bottom:2px solid #e0e0e0;padding:7px 8px;text-align:center;font-size:12px;color:#555555;font-weight:bold;">${L.hp}</th>
      <th style="border-bottom:2px solid #e0e0e0;padding:7px 8px;text-align:center;font-size:12px;color:#555555;font-weight:bold;">${L.cc}</th>
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table></details>`;
    }).join("\n") : "";

  const oemHtml = oems.length ? oems.map(escapeHtml).join(", ") : L.notSpecified;

  const specsTableHtml = itemSpecs.length ? `<table style="width:100%;border-collapse:collapse;">${
    itemSpecs.map((s, i) => {
      const bg = i % 2 === 0 ? "#ffffff" : "#f8f8f8";
      return `<tr style="background:${bg};"><td style="padding:8px 14px;font-size:13px;font-weight:bold;width:45%;border-bottom:1px solid #eaeaea;color:#333333;">${escapeHtml(s.label)}</td><td style="padding:8px 14px;font-size:13px;border-bottom:1px solid #eaeaea;color:#555555;">${escapeHtml(s.value)}</td></tr>`;
    }).join("")
  }</table>` : `<div style="padding:10px 14px;font-size:13px;color:#888888;">${L.notSpecified}</div>`;

  const xrefsBlock = (showXrefs && xrefs.length) ? `
<div style="margin:0 0 16px;">
  <div style="background:${red};color:#ffffff;font-weight:bold;text-align:center;padding:9px 12px;font-size:15px;">${L.interchangeableColon}</div>
  <div style="border:1px solid #eaeaea;border-top:none;padding:12px 16px;font-size:13px;line-height:1.8;background:#ffffff;">${buildCrossRefsHtml(xrefs)}</div>
</div>` : "";

  const ecBlock = (showEC && engineCodes.length) ? `
<div style="border:1.5px solid ${red};padding:12px 16px;margin:0 0 16px;border-radius:4px;background:#ffffff;">
  <table style="border-collapse:collapse;margin-bottom:6px;"><tr>
    <td style="padding-right:8px;vertical-align:middle;width:28px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="${red}" xmlns="http://www.w3.org/2000/svg"><path d="M18.92 5.01C18.72 4.42 18.16 4 17.5 4h-11C5.84 4 5.28 4.42 5.08 5.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-6.99zM6.5 15c-.83 0-1.5-.67-1.5-1.5S5.67 12 6.5 12s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"/></svg></td>
    <td style="vertical-align:middle;"><strong style="color:${red};font-size:14px;">${escapeHtml(L.engineCodes)}</strong></td>
  </tr></table>
  <div style="font-size:13px;color:#333333;line-height:1.7;">${escapeHtml(engineCodes.join(", "))}</div>
</div>` : "";

  return `<div style="max-width:900px;margin:0 auto;padding:16px 20px;font-family:Arial,sans-serif;color:#222222;background:#ffffff;">
<div style="display:flex;align-items:center;margin:0 0 18px;gap:12px;">
  <div style="flex:1;height:2px;background:${red};"></div>
  <div style="font-size:24px;font-weight:bold;color:#111111;white-space:nowrap;">${escapeHtml(data.product_name || "")}</div>
  <div style="flex:1;height:2px;background:${red};"></div>
</div>
<div style="border:1.5px solid ${red};padding:10px 14px;margin:0 0 16px;font-size:13px;font-weight:bold;color:${red};border-radius:3px;">&#9888; ${escapeHtml(L.warningLong)}</div>
<div style="margin:0 0 16px;">
  <div style="background:${red};color:#ffffff;font-weight:bold;text-align:center;padding:9px 12px;font-size:15px;">${L.oemReplaces}</div>
  <div style="border:1px solid #eaeaea;border-top:none;padding:12px 16px;text-align:center;font-size:14px;color:#333333;background:#ffffff;">${oemHtml}</div>
</div>${xrefsBlock}
<div style="margin:0 0 16px;">
  <div style="background:${red};color:#ffffff;font-weight:bold;text-align:center;padding:9px 12px;font-size:15px;">${L.itemSpecificsColon}</div>
  <div style="border:1px solid #eaeaea;border-top:none;">${specsTableHtml}</div>
</div>
${ecBlock}${showCompat ? `<div style="font-weight:bold;font-size:16px;margin:0 0 12px;color:#111111;padding-bottom:8px;border-bottom:2px solid #eaeaea;">${L.compatVehiclesColon}</div>
${manufacturerTables}` : ""}
</div>`.trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME: dark-header
// ═══════════════════════════════════════════════════════════════════════════════

function buildHtmlDarkHeader(data, t, opts, L) {
  const showCompat   = opts.showCompatibilityTable !== false;
  const showXrefs    = opts.showInterchangeableNumbers !== false;
  const showEC       = opts.showEngineCodes !== false;
  const engineCodes  = uniq(data.engine_codes || []);

  const oems  = uniq(data.oem_numbers || []);
  const specs = uniq(data.specifications || []);
  const rows  = data.compatibility_rows || [];
  const xrefs = data.interchangeable_parts || [];
  const grouped = groupByManufacturer(rows);

  const manufacturerTables = showCompat ? Object.keys(grouped)
    .sort((a, b) => grouped[b].length - grouped[a].length)
    .map((mfr) => {
    const bodyRows = grouped[mfr].map((v, i) => buildBodyRow(v, i, "#ffffff", "#f5f5f5", "#cccccc")).join("\n");
    return `<details open style="margin:0 12px 14px;border:1px solid #dddddd;">
<summary style="background:#111111;color:${t.primaryColor};font-weight:bold;padding:10px 40px 10px 10px;font-size:15px;letter-spacing:0.5px;cursor:pointer;list-style:none;display:block;position:relative;">${escapeHtml(L.models(mfr))} (${grouped[mfr].length})<span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:12px;line-height:1;opacity:0.7;">&#9660;</span></summary>
<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
  <thead>
    <tr style="background:${t.tableHeaderBackground};">
      <th style="border:1px solid #444444;padding:7px 10px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.vehicle}</th>
      <th style="border:1px solid #444444;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;white-space:nowrap;">${L.yearsShort}</th>
      <th style="border:1px solid #444444;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.kw}</th>
      <th style="border:1px solid #444444;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.hp}</th>
      <th style="border:1px solid #444444;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.cc}</th>
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table></details>`;
  }).join("\n") : "";

  const oemHtml    = oems.length  ? oems.map(escapeHtml).join("&nbsp;&nbsp;|&nbsp;&nbsp;") : L.notSpecified;
  const specsHtml  = specs.length ? specs.map((s) => `<div style="padding:3px 0;border-bottom:1px solid #eeeeee;">${escapeHtml(formatSpec(s))}</div>`).join("") : `<div style="padding:3px 0;">${L.notSpecified}</div>`;
  const xrefsBlock = (showXrefs && xrefs.length) ? `
  <div style="margin:0 12px 10px;">
    <div style="background:#111111;color:${t.primaryColor};font-weight:bold;padding:6px 10px;font-size:14px;text-transform:uppercase;letter-spacing:0.8px;">${L.interchangeable}</div>
    <div style="padding:10px 12px;font-size:14px;line-height:1.8;border:1px solid #dddddd;border-top:none;">${buildCrossRefsHtml(xrefs)}</div>
  </div>` : "";

  return `<div style="max-width:1100px;margin:0 auto;padding:0;border:2px solid #111111;background:#ffffff;font-family:Arial,sans-serif;color:#111111;">
  <div style="background:#111111;color:${t.primaryColor};font-size:22px;font-weight:bold;text-align:center;padding:16px 12px;line-height:1.3;">${escapeHtml(data.product_name || "")}</div>
  <div style="margin:12px 12px;background:#fff8f8;color:#991111;font-weight:bold;text-align:center;padding:10px 14px;border:2px solid #cc0000;font-size:14px;line-height:1.5;">&#9888; ${escapeHtml(L.warningReview)}</div>
  <div style="margin:0 12px 10px;">
    <div style="background:#111111;color:${t.primaryColor};font-weight:bold;padding:6px 10px;font-size:14px;text-transform:uppercase;letter-spacing:0.8px;">${L.oemRef}</div>
    <div style="padding:10px 12px;font-size:14px;line-height:1.8;border:1px solid #dddddd;border-top:none;">${oemHtml}</div>
  </div>${xrefsBlock}
  <div style="margin:0 12px 10px;">
    <div style="background:#111111;color:${t.primaryColor};font-weight:bold;padding:6px 10px;font-size:14px;text-transform:uppercase;letter-spacing:0.8px;">${L.itemSpecifics}</div>
    <div style="padding:10px 12px;font-size:14px;line-height:1.8;border:1px solid #dddddd;border-top:none;">${specsHtml}</div>
  </div>
  ${showEC && engineCodes.length ? `<div style="margin:0 12px 10px;padding:10px 12px;font-size:14px;line-height:1.8;border:1px solid #dddddd;"><strong style="color:#111111;display:block;margin-bottom:4px;">${L.engineCodes}:</strong>${escapeHtml(engineCodes.join(", "))}</div>` : ""}
  ${showCompat ? `<div style="margin:0 12px 14px;">
    <div style="background:#111111;color:${t.primaryColor};font-weight:bold;padding:6px 10px;font-size:14px;text-transform:uppercase;letter-spacing:0.8px;">${L.compatVehicles}</div>
  </div>
  ${manufacturerTables}` : ""}
</div>`.trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME: table-focused
// ═══════════════════════════════════════════════════════════════════════════════

function buildHtmlTableFocused(data, t, opts, L) {
  const showCompat   = opts.showCompatibilityTable !== false;
  const showXrefs    = opts.showInterchangeableNumbers !== false;
  const showEC       = opts.showEngineCodes !== false;
  const engineCodes  = uniq(data.engine_codes || []);

  const oems  = uniq(data.oem_numbers || []);
  const specs = uniq(data.specifications || []);
  const rows  = data.compatibility_rows || [];
  const xrefs = data.interchangeable_parts || [];
  const grouped = groupByManufacturer(rows);

  const metaRows = [];
  if (oems.length) {
    metaRows.push(`<tr><td style="border:1px solid #999;padding:6px 10px;font-weight:bold;background:#e8e8e8;font-size:13px;width:160px;">${L.oemNumbers}</td><td style="border:1px solid #999;padding:6px 10px;font-size:13px;">${oems.map(escapeHtml).join(", ")}</td></tr>`);
  }
  if (showXrefs && xrefs.length) {
    metaRows.push(buildCrossRefsHtml(xrefs, "rows"));
  }
  for (const s of specs) {
    const { label, value } = parseSpec(s);
    metaRows.push(`<tr><td style="border:1px solid #999;padding:6px 10px;font-weight:bold;background:#e8e8e8;font-size:13px;">${escapeHtml(label)}</td><td style="border:1px solid #999;padding:6px 10px;font-size:13px;">${escapeHtml(value)}</td></tr>`);
  }
  if (showEC && engineCodes.length) {
    metaRows.push(`<tr><td style="border:1px solid #999;padding:6px 10px;font-weight:bold;background:#e8e8e8;font-size:13px;">${L.engineCodes}</td><td style="border:1px solid #999;padding:6px 10px;font-size:13px;">${escapeHtml(engineCodes.join(", "))}</td></tr>`);
  }

  const manufacturerTables = showCompat ? Object.keys(grouped)
    .sort((a, b) => grouped[b].length - grouped[a].length)
    .map((mfr) => {
    const bodyRows = grouped[mfr].map((v, i) => buildBodyRow(v, i, "#ffffff", "#f0f0f0", "#999999")).join("\n");
    return `<details open style="margin-bottom:14px;">
<summary style="background:${t.primaryColor};color:#ffffff;font-weight:bold;padding:7px 40px 7px 10px;font-size:14px;cursor:pointer;list-style:none;display:block;position:relative;">${escapeHtml(mfr)} (${grouped[mfr].length})<span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:12px;line-height:1;opacity:0.8;">&#9660;</span></summary>
<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
  <thead>
    <tr style="background:${t.tableHeaderBackground};">
      <th style="border:1px solid #999;padding:6px 8px;font-size:12px;color:${t.tableHeaderTextColor};text-align:left;">${L.vehicle}</th>
      <th style="border:1px solid #999;padding:6px 8px;font-size:12px;color:${t.tableHeaderTextColor};text-align:center;white-space:nowrap;">${L.yearsShort}</th>
      <th style="border:1px solid #999;padding:6px 6px;font-size:12px;color:${t.tableHeaderTextColor};text-align:center;">${L.kw}</th>
      <th style="border:1px solid #999;padding:6px 6px;font-size:12px;color:${t.tableHeaderTextColor};text-align:center;">${L.hp}</th>
      <th style="border:1px solid #999;padding:6px 6px;font-size:12px;color:${t.tableHeaderTextColor};text-align:center;">${L.cc}</th>
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table></details>`;
  }).join("\n") : "";

  return `<div style="max-width:1100px;margin:0 auto;padding:10px;background:#f7f7f7;font-family:Arial,sans-serif;color:#111111;border:1px solid #cccccc;">
  <div style="font-size:18px;font-weight:bold;text-align:center;padding:10px 0 8px;color:#111111;">${escapeHtml(data.product_name || "")}</div>
  <div style="background:#fff3cd;border:1px solid #e0a800;padding:8px 12px;text-align:center;font-size:13px;font-weight:bold;margin-bottom:10px;">&#9888; ${escapeHtml(L.warningShort)}</div>
  <div style="margin-bottom:10px;">
    <table style="width:100%;border-collapse:collapse;">${metaRows.join("")}</table>
  </div>
  ${showCompat ? `<div style="background:${t.primaryColor};color:#ffffff;font-weight:bold;padding:7px 10px;font-size:14px;margin-bottom:14px;">${L.compatVehiclesN(rows.length)}</div>
  ${manufacturerTables}` : ""}
</div>`.trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME: minimal
// ═══════════════════════════════════════════════════════════════════════════════

function buildHtmlMinimal(data, t, opts, L) {
  const showCompat   = opts.showCompatibilityTable !== false;
  const showXrefs    = opts.showInterchangeableNumbers !== false;
  const showEC       = opts.showEngineCodes !== false;
  const engineCodes  = uniq(data.engine_codes || []);

  const oems  = uniq(data.oem_numbers || []);
  const specs = uniq(data.specifications || []);
  const rows  = data.compatibility_rows || [];
  const xrefs = data.interchangeable_parts || [];
  const grouped = groupByManufacturer(rows);

  const manufacturerTables = showCompat ? Object.keys(grouped)
    .sort((a, b) => grouped[b].length - grouped[a].length)
    .map((mfr) => {
    const bodyRows = grouped[mfr].map((v, i) => {
      const bg = i % 2 === 0 ? "#ffffff" : "#fafafa";
      return `<tr style="background:${bg};">
  <td style="border-bottom:1px solid #e5e5e5;padding:6px 8px;font-size:13px;">${escapeHtml(v.vehicle)}</td>
  <td style="border-bottom:1px solid #e5e5e5;padding:6px 8px;font-size:13px;text-align:center;white-space:nowrap;">${escapeHtml(v.production_years)}</td>
  <td style="border-bottom:1px solid #e5e5e5;padding:6px 6px;font-size:13px;text-align:center;">${escapeHtml(v.kw || "")}</td>
  <td style="border-bottom:1px solid #e5e5e5;padding:6px 6px;font-size:13px;text-align:center;">${escapeHtml(v.hp || "")}</td>
  <td style="border-bottom:1px solid #e5e5e5;padding:6px 6px;font-size:13px;text-align:center;">${escapeHtml(v.cc || "")}</td>
</tr>`;
    }).join("\n");
    return `<details open style="margin-bottom:14px;">
<summary style="font-weight:bold;font-size:14px;padding:6px 24px 6px 0;cursor:pointer;list-style:none;display:block;color:${t.primaryColor};border-bottom:2px solid ${t.primaryColor};position:relative;">${escapeHtml(mfr)} (${grouped[mfr].length})<span style="position:absolute;right:2px;top:50%;transform:translateY(-50%);font-size:12px;line-height:1;">&#9660;</span></summary>
<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
  <thead>
    <tr style="background:${t.tableHeaderBackground};">
      <th style="padding:6px 8px;text-align:left;font-size:12px;color:${t.tableHeaderTextColor};">${L.vehicle}</th>
      <th style="padding:6px 8px;text-align:center;font-size:12px;color:${t.tableHeaderTextColor};white-space:nowrap;">${L.yearsShort}</th>
      <th style="padding:6px 6px;text-align:center;font-size:12px;color:${t.tableHeaderTextColor};">${L.kw}</th>
      <th style="padding:6px 6px;text-align:center;font-size:12px;color:${t.tableHeaderTextColor};">${L.hp}</th>
      <th style="padding:6px 6px;text-align:center;font-size:12px;color:${t.tableHeaderTextColor};">${L.cc}</th>
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table></details>`;
  }).join("\n") : "";

  const oemText    = oems.length  ? oems.join(", ") : L.notSpecified;
  const specsHtml  = specs.length ? specs.map((s) => `<div>${escapeHtml(formatSpec(s))}</div>`).join("") : L.notSpecified;
  const xrefsBlock = (showXrefs && xrefs.length) ? `
  <p style="font-weight:bold;font-size:13px;margin:0 0 3px;color:${t.primaryColor};">${L.interchangeable}</p>
  <div style="font-size:13px;color:#444444;line-height:1.8;margin-bottom:12px;">${buildCrossRefsHtml(xrefs, "inline")}</div>` : "";

  return `<div style="max-width:1100px;margin:0 auto;padding:14px 16px;background:#ffffff;font-family:Arial,sans-serif;color:#222222;border:1px solid #e0e0e0;">
  <h2 style="font-size:18px;font-weight:bold;margin:0 0 10px;color:#111111;">${escapeHtml(data.product_name || "")}</h2>
  <p style="color:#888888;font-size:13px;margin:0 0 12px;">${escapeHtml(L.warningVehicle)}</p>
  <p style="font-weight:bold;font-size:13px;margin:0 0 3px;color:${t.primaryColor};">${L.oemRef}</p>
  <p style="font-size:13px;margin:0 0 12px;color:#444444;">${escapeHtml(oemText)}</p>${xrefsBlock}
  <p style="font-weight:bold;font-size:13px;margin:0 0 3px;color:${t.primaryColor};">${L.itemSpecifics}</p>
  <div style="font-size:13px;color:#444444;line-height:1.8;margin-bottom:12px;">${specsHtml}</div>
  ${showEC && engineCodes.length ? `<p style="font-weight:bold;font-size:13px;margin:0 0 3px;color:${t.primaryColor};">${L.engineCodes}:</p><div style="font-size:13px;color:#444444;line-height:1.8;margin-bottom:12px;">${escapeHtml(engineCodes.join(", "))}</div>` : ""}
  ${showCompat ? `<p style="font-weight:bold;font-size:13px;margin:0 0 14px;color:${t.primaryColor};">${L.compatVehicles}</p>
  ${manufacturerTables}` : ""}
</div>`.trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME: professional-blue
// ═══════════════════════════════════════════════════════════════════════════════

function buildHtmlProfessionalBlue(data, t, opts, L) {
  const showCompat   = opts.showCompatibilityTable !== false;
  const showXrefs    = opts.showInterchangeableNumbers !== false;
  const showEC       = opts.showEngineCodes !== false;
  const engineCodes  = uniq(data.engine_codes || []);

  const oems  = uniq(data.oem_numbers || []);
  const specs = uniq(data.specifications || []);
  const rows  = data.compatibility_rows || [];
  const xrefs = data.interchangeable_parts || [];
  const grouped = groupByManufacturer(rows);

  const manufacturerTables = showCompat ? Object.keys(grouped)
    .sort((a, b) => grouped[b].length - grouped[a].length)
    .map((mfr) => {
    const bodyRows = grouped[mfr].map((v, i) => {
      const bg = i % 2 === 0 ? "#ffffff" : "#eef4fb";
      return `<tr style="background:${bg};">
  <td style="border:1px solid #b8d0e8;padding:6px 10px;font-size:13px;">${escapeHtml(v.vehicle)}</td>
  <td style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;white-space:nowrap;">${escapeHtml(v.production_years)}</td>
  <td style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;">${escapeHtml(v.kw || "")}</td>
  <td style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;">${escapeHtml(v.hp || "")}</td>
  <td style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;">${escapeHtml(v.cc || "")}</td>
</tr>`;
    }).join("\n");
    return `<details open style="padding:0 14px 8px;margin-bottom:14px;">
<summary style="background:${t.primaryColor};color:#ffffff;font-weight:bold;padding:8px 40px 8px 10px;font-size:14px;cursor:pointer;list-style:none;display:block;margin:0 -14px 0 -14px;position:relative;">${escapeHtml(mfr)} (${grouped[mfr].length})<span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:12px;line-height:1;opacity:0.8;">&#9660;</span></summary>
<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
  <thead>
    <tr style="background:${t.tableHeaderBackground};">
      <th style="border:1px solid #b8d0e8;padding:6px 10px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.vehicle}</th>
      <th style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;white-space:nowrap;">${L.years}</th>
      <th style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.kw}</th>
      <th style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.hp}</th>
      <th style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.cc}</th>
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table></details>`;
  }).join("\n") : "";

  const oemHtml    = oems.length  ? oems.map(escapeHtml).join("&nbsp; &nbsp;") : L.notSpecified;
  const specsHtml  = specs.length ? `<table style="width:100%;border-collapse:collapse;">${specs.map((s, i) => {
    const { label, value } = parseSpec(s);
    const bg = i % 2 === 0 ? "#ffffff" : "#eef4fb";
    return `<tr style="background:${bg};"><td style="border:1px solid #b8d0e8;padding:5px 10px;font-size:13px;font-weight:bold;width:200px;color:#1a3a6b;">${escapeHtml(label)}</td><td style="border:1px solid #b8d0e8;padding:5px 10px;font-size:13px;">${escapeHtml(value)}</td></tr>`;
  }).join("")}</table>` : `<div style="font-size:13px;color:#666;">${L.notSpecified}</div>`;
  const xrefsBlock = (showXrefs && xrefs.length) ? `
    <div style="margin-bottom:12px;">
      <div style="background:${t.primaryColor};color:#ffffff;font-weight:bold;padding:6px 12px;font-size:13px;display:inline-block;margin-bottom:4px;">${L.interchangeable}</div>
      <div style="padding:8px 12px;background:#ffffff;border:1px solid #b8d0e8;font-size:14px;line-height:1.8;">${buildCrossRefsHtml(xrefs)}</div>
    </div>` : "";

  return `<div style="max-width:1100px;margin:0 auto;padding:0;border:1px solid #b8d0e8;background:#f5f9ff;font-family:Arial,sans-serif;color:#111111;">
  <div style="background:${t.primaryColor};color:#ffffff;font-size:20px;font-weight:bold;text-align:center;padding:14px 16px;letter-spacing:0.3px;">${escapeHtml(data.product_name || "")}</div>
  <div style="background:#fff3cd;border-bottom:1px solid #e0a800;padding:9px 16px;text-align:center;font-size:13px;font-weight:bold;color:#664d03;">&#9888; ${escapeHtml(L.warningReview)}</div>
  <div style="padding:12px 14px 0;">
    <div style="margin-bottom:12px;">
      <div style="background:${t.primaryColor};color:#ffffff;font-weight:bold;padding:6px 12px;font-size:13px;display:inline-block;margin-bottom:4px;">${L.oemRef}</div>
      <div style="padding:8px 12px;background:#ffffff;border:1px solid #b8d0e8;font-size:14px;line-height:1.8;">${oemHtml}</div>
    </div>${xrefsBlock}
    <div style="margin-bottom:12px;">
      <div style="background:${t.primaryColor};color:#ffffff;font-weight:bold;padding:6px 12px;font-size:13px;display:inline-block;margin-bottom:4px;">${L.itemSpecifics}</div>
      ${specsHtml}
    </div>
    ${showEC && engineCodes.length ? `<div style="margin-bottom:12px;padding:8px 12px;background:#ffffff;border:1px solid #b8d0e8;font-size:13px;line-height:1.8;"><strong style="color:#1a3a6b;display:block;margin-bottom:4px;">${L.engineCodes}:</strong>${escapeHtml(engineCodes.join(", "))}</div>` : ""}
  </div>
  ${showCompat ? `<div style="padding:4px 14px 14px;">
    <div style="background:${t.primaryColor};color:#ffffff;font-weight:bold;padding:6px 12px;font-size:13px;display:inline-block;">${L.compatVehicles}</div>
  </div>
  ${manufacturerTables}` : ""}
</div>`.trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DISPATCHER
// ═══════════════════════════════════════════════════════════════════════════════

export function buildHtml(data, template = {}, opts = {}) {
  const layout = template.layout || "default";
  const L      = getLang(opts);

  switch (layout) {
    case "dark-header":       return buildHtmlDarkHeader(data, template, opts, L);
    case "table-focused":     return buildHtmlTableFocused(data, template, opts, L);
    case "minimal":           return buildHtmlMinimal(data, template, opts, L);
    case "professional-blue": return buildHtmlProfessionalBlue(data, template, opts, L);
    default:                  return buildHtmlDefault(data, template, opts, L);
  }
}
