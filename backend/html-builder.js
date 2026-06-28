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

function buildBodyRow(v, i, rowBg1 = "#ffffff", rowBg2 = "#f5f5f5", borderColor = "#000000", showEC = true, L) {
  const engineCodes = uniq(v.engine_codes || []).join(", ");
  const bg = i % 2 === 0 ? rowBg1 : rowBg2;
  return `<tr style="background:${bg};">
  <td style="border:1px solid ${borderColor};padding:7px 10px;text-align:left;font-size:13px;">${escapeHtml(v.vehicle)}</td>
  <td style="border:1px solid ${borderColor};padding:7px 8px;text-align:center;font-size:13px;">${escapeHtml(v.production_years)}</td>
  <td style="border:1px solid ${borderColor};padding:7px 8px;text-align:center;font-size:13px;">${escapeHtml(v.kw || "")}</td>
  <td style="border:1px solid ${borderColor};padding:7px 8px;text-align:center;font-size:13px;">${escapeHtml(v.hp || "")}</td>
  <td style="border:1px solid ${borderColor};padding:7px 8px;text-align:center;font-size:13px;">${escapeHtml(v.cc || "")}</td>
  ${showEC ? `<td style="border:1px solid ${borderColor};padding:7px 8px;text-align:center;font-size:13px;">${escapeHtml(engineCodes)}</td>` : ""}
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
  const showCompat = opts.showCompatibilityTable !== false;
  const showXrefs  = opts.showInterchangeableNumbers !== false;
  const showEC     = opts.showEngineCodes !== false;
  const cols       = showEC ? 6 : 5;

  const oems   = uniq(data.oem_numbers || []);
  const specs  = uniq(data.specifications || []);
  const rows   = data.compatibility_rows || [];
  const xrefs  = data.interchangeable_parts || [];
  const grouped = groupByManufacturer(rows);

  const manufacturerTables = showCompat ? Object.keys(grouped).sort().map((mfr) => {
    const bodyRows = grouped[mfr].map((v, i) => buildBodyRow(v, i, "#ffffff", "#f5f5f5", "#000000", showEC, L)).join("\n");
    return `<div style="margin-bottom:14px;"><table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
  <thead>
    <tr><th colspan="${cols}" style="border:1px solid #000000;background:#000000;color:${t.primaryColor};font-weight:bold;text-align:center;padding:9px 10px;font-size:16px;">${escapeHtml(L.models(mfr))}</th></tr>
    <tr style="background:${t.tableHeaderBackground};">
      <th style="border:1px solid #000000;padding:7px 10px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.vehicle}</th>
      <th style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.years}</th>
      <th style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.kw}</th>
      <th style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.hp}</th>
      <th style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.cc}</th>
      ${showEC ? `<th style="border:1px solid #000000;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.engineCodes}</th>` : ""}
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table></div>`;
  }).join("\n") : "";

  const oemHtml    = oems.length  ? oems.map(escapeHtml).join(", ") : L.notSpecified;
  const specsHtml  = specs.length ? specs.map((s) => `<div style="padding:2px 0;">${escapeHtml(s)}</div>`).join("") : `<div style="padding:2px 0;">${L.notSpecified}</div>`;
  const xrefsBlock = (showXrefs && xrefs.length) ? `
  <div style="margin:0 0 12px;">
    <div style="background:${t.primaryColor};color:#ffffff;font-weight:bold;text-align:center;padding:8px 12px;font-size:17px;">${L.interchangeableColon}</div>
    <div style="background:#ffffff;padding:12px 16px;font-size:14px;line-height:1.8;border:1px solid ${t.primaryColor};border-top:none;">${buildCrossRefsHtml(xrefs)}</div>
  </div>` : "";

  return `<div style="max-width:1100px;margin:0 auto;padding:12px;border:1px solid #cccccc;background:#efefef;font-family:Arial,sans-serif;color:#000000;">
  <div style="font-size:20px;font-weight:bold;color:#000000;text-align:center;margin:6px 0 16px;line-height:1.4;">${escapeHtml(data.product_name || "")}</div>
  <div style="max-width:860px;margin:0 auto 16px;background:#ffffff;color:${t.primaryColor};font-weight:bold;text-align:center;padding:12px 18px;border:2px solid ${t.primaryColor};font-size:15px;line-height:1.5;">&#9888; ${escapeHtml(L.warningLong)}</div>
  <div style="margin:0 0 12px;">
    <div style="background:${t.primaryColor};color:#ffffff;font-weight:bold;text-align:center;padding:8px 12px;font-size:17px;">${L.oemReplaces}</div>
    <div style="background:#ffffff;padding:12px 16px;text-align:center;font-size:15px;line-height:1.7;border:1px solid ${t.primaryColor};border-top:none;">${oemHtml}</div>
  </div>${xrefsBlock}
  <div style="margin:0 0 12px;">
    <div style="background:${t.primaryColor};color:#ffffff;font-weight:bold;text-align:center;padding:8px 12px;font-size:17px;">${L.itemSpecificsColon}</div>
    <div style="background:#ffffff;padding:12px 16px;text-align:center;font-size:15px;line-height:1.7;border:1px solid ${t.primaryColor};border-top:none;">${specsHtml}</div>
  </div>
  ${showCompat ? `<div style="background:${t.primaryColor};color:#ffffff;font-weight:bold;text-align:center;padding:8px 12px;font-size:17px;margin:0 0 14px;">${L.compatVehiclesColon}</div>
  ${manufacturerTables}` : ""}
</div>`.trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME: dark-header
// ═══════════════════════════════════════════════════════════════════════════════

function buildHtmlDarkHeader(data, t, opts, L) {
  const showCompat = opts.showCompatibilityTable !== false;
  const showXrefs  = opts.showInterchangeableNumbers !== false;
  const showEC     = opts.showEngineCodes !== false;
  const cols       = showEC ? 6 : 5;

  const oems  = uniq(data.oem_numbers || []);
  const specs = uniq(data.specifications || []);
  const rows  = data.compatibility_rows || [];
  const xrefs = data.interchangeable_parts || [];
  const grouped = groupByManufacturer(rows);

  const manufacturerTables = showCompat ? Object.keys(grouped).sort().map((mfr) => {
    const bodyRows = grouped[mfr].map((v, i) => buildBodyRow(v, i, "#ffffff", "#f5f5f5", "#cccccc", showEC, L)).join("\n");
    return `<div style="margin:0 12px 14px;border:1px solid #dddddd;"><table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
  <thead>
    <tr><th colspan="${cols}" style="border:1px solid #333333;background:#111111;color:${t.primaryColor};font-weight:bold;text-align:center;padding:10px 10px;font-size:15px;letter-spacing:0.5px;">${escapeHtml(L.models(mfr))}</th></tr>
    <tr style="background:${t.tableHeaderBackground};">
      <th style="border:1px solid #444444;padding:7px 10px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.vehicle}</th>
      <th style="border:1px solid #444444;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.yearsShort}</th>
      <th style="border:1px solid #444444;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.kw}</th>
      <th style="border:1px solid #444444;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.hp}</th>
      <th style="border:1px solid #444444;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.cc}</th>
      ${showEC ? `<th style="border:1px solid #444444;padding:7px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.engineCodes}</th>` : ""}
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table></div>`;
  }).join("\n") : "";

  const oemHtml    = oems.length  ? oems.map(escapeHtml).join("&nbsp;&nbsp;|&nbsp;&nbsp;") : L.notSpecified;
  const specsHtml  = specs.length ? specs.map((s) => `<div style="padding:3px 0;border-bottom:1px solid #eeeeee;">${escapeHtml(s)}</div>`).join("") : `<div style="padding:3px 0;">${L.notSpecified}</div>`;
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
  const showCompat = opts.showCompatibilityTable !== false;
  const showXrefs  = opts.showInterchangeableNumbers !== false;
  const showEC     = opts.showEngineCodes !== false;
  const cols       = showEC ? 6 : 5;

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
    const colonIdx = s.indexOf(":");
    const label = colonIdx > -1 ? s.slice(0, colonIdx).trim() : s;
    const value = colonIdx > -1 ? s.slice(colonIdx + 1).trim() : "";
    metaRows.push(`<tr><td style="border:1px solid #999;padding:6px 10px;font-weight:bold;background:#e8e8e8;font-size:13px;">${escapeHtml(label)}</td><td style="border:1px solid #999;padding:6px 10px;font-size:13px;">${escapeHtml(value)}</td></tr>`);
  }

  const manufacturerTables = showCompat ? Object.keys(grouped).sort().map((mfr) => {
    const bodyRows = grouped[mfr].map((v, i) => buildBodyRow(v, i, "#ffffff", "#f0f0f0", "#999999", showEC, L)).join("\n");
    return `<div style="margin-bottom:14px;"><table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
  <thead>
    <tr><th colspan="${cols}" style="border:1px solid #555555;background:${t.primaryColor};color:#ffffff;font-weight:bold;text-align:left;padding:7px 10px;font-size:14px;">${escapeHtml(mfr)}</th></tr>
    <tr style="background:${t.tableHeaderBackground};">
      <th style="border:1px solid #999;padding:6px 8px;font-size:12px;color:${t.tableHeaderTextColor};text-align:left;">${L.vehicle}</th>
      <th style="border:1px solid #999;padding:6px 8px;font-size:12px;color:${t.tableHeaderTextColor};text-align:center;">${L.yearsShort}</th>
      <th style="border:1px solid #999;padding:6px 6px;font-size:12px;color:${t.tableHeaderTextColor};text-align:center;">${L.kw}</th>
      <th style="border:1px solid #999;padding:6px 6px;font-size:12px;color:${t.tableHeaderTextColor};text-align:center;">${L.hp}</th>
      <th style="border:1px solid #999;padding:6px 6px;font-size:12px;color:${t.tableHeaderTextColor};text-align:center;">${L.cc}</th>
      ${showEC ? `<th style="border:1px solid #999;padding:6px 8px;font-size:12px;color:${t.tableHeaderTextColor};text-align:center;">${L.engineCodes}</th>` : ""}
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table></div>`;
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
  const showCompat = opts.showCompatibilityTable !== false;
  const showXrefs  = opts.showInterchangeableNumbers !== false;
  const showEC     = opts.showEngineCodes !== false;

  const oems  = uniq(data.oem_numbers || []);
  const specs = uniq(data.specifications || []);
  const rows  = data.compatibility_rows || [];
  const xrefs = data.interchangeable_parts || [];
  const grouped = groupByManufacturer(rows);

  const manufacturerTables = showCompat ? Object.keys(grouped).sort().map((mfr) => {
    const bodyRows = grouped[mfr].map((v, i) => {
      const engineCodes = uniq(v.engine_codes || []).join(", ");
      const bg = i % 2 === 0 ? "#ffffff" : "#fafafa";
      return `<tr style="background:${bg};">
  <td style="border-bottom:1px solid #e5e5e5;padding:6px 8px;font-size:13px;">${escapeHtml(v.vehicle)}</td>
  <td style="border-bottom:1px solid #e5e5e5;padding:6px 8px;font-size:13px;text-align:center;">${escapeHtml(v.production_years)}</td>
  <td style="border-bottom:1px solid #e5e5e5;padding:6px 6px;font-size:13px;text-align:center;">${escapeHtml(v.kw || "")}</td>
  <td style="border-bottom:1px solid #e5e5e5;padding:6px 6px;font-size:13px;text-align:center;">${escapeHtml(v.hp || "")}</td>
  <td style="border-bottom:1px solid #e5e5e5;padding:6px 6px;font-size:13px;text-align:center;">${escapeHtml(v.cc || "")}</td>
  ${showEC ? `<td style="border-bottom:1px solid #e5e5e5;padding:6px 8px;font-size:13px;text-align:center;">${escapeHtml(engineCodes)}</td>` : ""}
</tr>`;
    }).join("\n");
    return `<div style="margin-bottom:14px;"><p style="font-weight:bold;font-size:14px;margin:0 0 6px;">${escapeHtml(mfr)}</p>
<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;border-top:2px solid ${t.primaryColor};">
  <thead>
    <tr style="background:${t.tableHeaderBackground};">
      <th style="padding:6px 8px;text-align:left;font-size:12px;color:${t.tableHeaderTextColor};">${L.vehicle}</th>
      <th style="padding:6px 8px;text-align:center;font-size:12px;color:${t.tableHeaderTextColor};">${L.yearsShort}</th>
      <th style="padding:6px 6px;text-align:center;font-size:12px;color:${t.tableHeaderTextColor};">${L.kw}</th>
      <th style="padding:6px 6px;text-align:center;font-size:12px;color:${t.tableHeaderTextColor};">${L.hp}</th>
      <th style="padding:6px 6px;text-align:center;font-size:12px;color:${t.tableHeaderTextColor};">${L.cc}</th>
      ${showEC ? `<th style="padding:6px 8px;text-align:center;font-size:12px;color:${t.tableHeaderTextColor};">${L.engineCodes}</th>` : ""}
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table></div>`;
  }).join("\n") : "";

  const oemText    = oems.length  ? oems.join(", ") : L.notSpecified;
  const specsHtml  = specs.length ? specs.map((s) => `<div>${escapeHtml(s)}</div>`).join("") : L.notSpecified;
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
  ${showCompat ? `<p style="font-weight:bold;font-size:13px;margin:0 0 14px;color:${t.primaryColor};">${L.compatVehicles}</p>
  ${manufacturerTables}` : ""}
</div>`.trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME: professional-blue
// ═══════════════════════════════════════════════════════════════════════════════

function buildHtmlProfessionalBlue(data, t, opts, L) {
  const showCompat = opts.showCompatibilityTable !== false;
  const showXrefs  = opts.showInterchangeableNumbers !== false;
  const showEC     = opts.showEngineCodes !== false;
  const cols       = showEC ? 6 : 5;

  const oems  = uniq(data.oem_numbers || []);
  const specs = uniq(data.specifications || []);
  const rows  = data.compatibility_rows || [];
  const xrefs = data.interchangeable_parts || [];
  const grouped = groupByManufacturer(rows);

  const manufacturerTables = showCompat ? Object.keys(grouped).sort().map((mfr) => {
    const bodyRows = grouped[mfr].map((v, i) => {
      const engineCodes = uniq(v.engine_codes || []).join(", ");
      const bg = i % 2 === 0 ? "#ffffff" : "#eef4fb";
      return `<tr style="background:${bg};">
  <td style="border:1px solid #b8d0e8;padding:6px 10px;font-size:13px;">${escapeHtml(v.vehicle)}</td>
  <td style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;">${escapeHtml(v.production_years)}</td>
  <td style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;">${escapeHtml(v.kw || "")}</td>
  <td style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;">${escapeHtml(v.hp || "")}</td>
  <td style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;">${escapeHtml(v.cc || "")}</td>
  ${showEC ? `<td style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;">${escapeHtml(engineCodes)}</td>` : ""}
</tr>`;
    }).join("\n");
    return `<div style="padding:0 14px 8px;margin-bottom:14px;"><table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
  <thead>
    <tr><th colspan="${cols}" style="border:1px solid #1a3a6b;background:${t.primaryColor};color:#ffffff;font-weight:bold;text-align:center;padding:8px 10px;font-size:14px;">${escapeHtml(mfr)}</th></tr>
    <tr style="background:${t.tableHeaderBackground};">
      <th style="border:1px solid #b8d0e8;padding:6px 10px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.vehicle}</th>
      <th style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.years}</th>
      <th style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.kw}</th>
      <th style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.hp}</th>
      <th style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.cc}</th>
      ${showEC ? `<th style="border:1px solid #b8d0e8;padding:6px 8px;text-align:center;font-size:13px;color:${t.tableHeaderTextColor};font-weight:bold;">${L.engineCodes}</th>` : ""}
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table></div>`;
  }).join("\n") : "";

  const oemHtml    = oems.length  ? oems.map(escapeHtml).join("&nbsp; &nbsp;") : L.notSpecified;
  const specsHtml  = specs.length ? `<table style="width:100%;border-collapse:collapse;">${specs.map((s, i) => {
    const colonIdx = s.indexOf(":");
    const label = colonIdx > -1 ? s.slice(0, colonIdx).trim() : s;
    const value = colonIdx > -1 ? s.slice(colonIdx + 1).trim() : "";
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
