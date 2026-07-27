const fs = require("fs");
const path = require("path");

const root = __dirname;
const guides = path.join(__dirname, "..", "..", "i18n", "locales", "guides");
const langs = ["en", "fr", "de", "it", "es", "ar", "tr"];

const ARTICLE_ORDER = [
  "how-to-generate-your-first-listing",
  "understanding-compatibility-results",
  "smart-pricing-explained",
  "export-listings-to-ebay",
  "using-the-price-calculator",
  "how-to-use-the-compatibility-checker",
  "choosing-a-listing-template",
  "understanding-part-references",
];

const DESCS = {
  en: {
    "how-to-generate-your-first-listing":
      "Step-by-step guide to creating a listing from an OEM/Article number.",
    "understanding-compatibility-results":
      "Learn how compatibility matches are found and what they mean.",
    "smart-pricing-explained":
      "How our pricing data helps you list competitively and profitably.",
    "export-listings-to-ebay":
      "How to export and upload your listings to eBay in one click.",
    "using-the-price-calculator":
      "Calculate fees, VAT, profit margin and more with ease.",
    "how-to-use-the-compatibility-checker":
      "Verify whether a part fits a specific vehicle using a part number or VIN.",
    "choosing-a-listing-template":
      "Choose templates and content toggles that match your listing style.",
    "understanding-part-references":
      "Understand OE, OEM and TecDoc article numbers for better matches.",
  },
  fr: {
    "how-to-generate-your-first-listing":
      "Guide étape par étape pour créer une annonce à partir d'un numéro OEM/article.",
    "understanding-compatibility-results":
      "Comprendre l'origine et la lecture des résultats de compatibilité.",
    "smart-pricing-explained":
      "Comment les données de prix vous aident à lister de façon compétitive.",
    "export-listings-to-ebay":
      "Exporter et importer vos annonces sur eBay en un clic.",
    "using-the-price-calculator":
      "Calculez frais, TVA, marge et plus encore facilement.",
    "how-to-use-the-compatibility-checker":
      "Vérifiez si une pièce convient à un véhicule via numéro ou VIN.",
    "choosing-a-listing-template":
      "Choisissez modèles et options de contenu adaptés à votre style.",
    "understanding-part-references":
      "Comprendre les numéros OE, OEM et TecDoc pour de meilleurs résultats.",
  },
  de: {
    "how-to-generate-your-first-listing":
      "Schritt-für-Schritt-Anleitung zur Erstellung einer Anzeige aus OEM-/Artikelnummer.",
    "understanding-compatibility-results":
      "So entstehen Kompatibilitätsergebnisse und so lesen Sie sie.",
    "smart-pricing-explained":
      "Wie Preisdaten Ihnen helfen, wettbewerbsfähig zu listen.",
    "export-listings-to-ebay":
      "Anzeigen exportieren und mit einem Klick bei eBay hochladen.",
    "using-the-price-calculator":
      "Gebühren, MwSt., Marge und mehr einfach berechnen.",
    "how-to-use-the-compatibility-checker":
      "Passgenauigkeit per Teilenummer oder FIN prüfen.",
    "choosing-a-listing-template":
      "Vorlagen und Inhaltsoptionen für Ihren Listing-Stil wählen.",
    "understanding-part-references":
      "OE-, OEM- und TecDoc-Nummern für bessere Treffer verstehen.",
  },
  it: {
    "how-to-generate-your-first-listing":
      "Guida passo passo per creare un annuncio da un numero OEM/articolo.",
    "understanding-compatibility-results":
      "Come si ottengono e si leggono i risultati di compatibilità.",
    "smart-pricing-explained":
      "Come i dati di prezzo aiutano a listare in modo competitivo.",
    "export-listings-to-ebay":
      "Esporta e carica gli annunci su eBay in un clic.",
    "using-the-price-calculator":
      "Calcola commissioni, IVA, margine e altro con facilità.",
    "how-to-use-the-compatibility-checker":
      "Verifica se un pezzo calza un veicolo con numero o VIN.",
    "choosing-a-listing-template":
      "Scegli template e opzioni di contenuto per il tuo stile.",
    "understanding-part-references":
      "Comprendi OE, OEM e numeri articolo TecDoc per risultati migliori.",
  },
  es: {
    "how-to-generate-your-first-listing":
      "Guía paso a paso para crear un anuncio desde un número OEM/artículo.",
    "understanding-compatibility-results":
      "Cómo se obtienen y se leen los resultados de compatibilidad.",
    "smart-pricing-explained":
      "Cómo los datos de precios te ayudan a listar de forma competitiva.",
    "export-listings-to-ebay":
      "Exporta y sube tus anuncios a eBay en un clic.",
    "using-the-price-calculator":
      "Calcula tarifas, IVA, margen y más con facilidad.",
    "how-to-use-the-compatibility-checker":
      "Comprueba si una pieza encaja en un vehículo con número o VIN.",
    "choosing-a-listing-template":
      "Elige plantillas y opciones de contenido según tu estilo.",
    "understanding-part-references":
      "Entiende números OE, OEM y TecDoc para mejores resultados.",
  },
  ar: {
    "how-to-generate-your-first-listing":
      "دليل خطوة بخطوة لإنشاء إعلان من رقم OEM/مقالة.",
    "understanding-compatibility-results":
      "تعرّف على كيفية إيجاد نتائج التوافق ومعناها.",
    "smart-pricing-explained":
      "كيف تساعدك بيانات التسعير على الإدراج بشكل تنافسي.",
    "export-listings-to-ebay":
      "صدّر إعلاناتك وارفعها إلى eBay بنقرة واحدة.",
    "using-the-price-calculator":
      "احسب الرسوم وضريبة القيمة المضافة والهامش بسهولة.",
    "how-to-use-the-compatibility-checker":
      "تحقق مما إذا كان الجزء يناسب مركبة باستخدام الرقم أو VIN.",
    "choosing-a-listing-template":
      "اختر القوالب وخيارات المحتوى المناسبة لأسلوبك.",
    "understanding-part-references":
      "افهم أرقام OE وOEM وTecDoc للحصول على نتائج أفضل.",
  },
  tr: {
    "how-to-generate-your-first-listing":
      "OEM/makale numarasından ilan oluşturmak için adım adım rehber.",
    "understanding-compatibility-results":
      "Uyumluluk sonuçlarının nasıl bulunduğunu ve ne anlama geldiğini öğrenin.",
    "smart-pricing-explained":
      "Fiyat verilerinin rekabetçi listelemenize nasıl yardımcı olduğu.",
    "export-listings-to-ebay":
      "İlanlarınızı tek tıkla eBay'e dışa aktarın ve yükleyin.",
    "using-the-price-calculator":
      "Ücretleri, KDV'yi, marjı ve daha fazlasını kolayca hesaplayın.",
    "how-to-use-the-compatibility-checker":
      "Parça numarası veya VIN ile uyumluluğu doğrulayın.",
    "choosing-a-listing-template":
      "İlan stilinize uygun şablon ve içerik seçeneklerini seçin.",
    "understanding-part-references":
      "Daha iyi eşleşmeler için OE, OEM ve TecDoc numaralarını anlayın.",
  },
};

const TIP = {
  en: "Tip:",
  fr: "Conseil :",
  de: "Tipp:",
  it: "Suggerimento:",
  es: "Consejo:",
  ar: "نصيحة:",
  tr: "İpucu:",
};

for (const lang of langs) {
  const articles = JSON.parse(
    fs.readFileSync(path.join(root, `${lang}.json`), "utf8"),
  );
  const g = JSON.parse(
    fs.readFileSync(path.join(guides, `${lang}.json`), "utf8"),
  );
  delete g.help.articleBodies;
  g.help.articles = ARTICLE_ORDER.map((slug) => ({
    slug,
    title: articles[slug].title,
    desc: DESCS[lang][slug],
    time: articles[slug].time,
  }));
  g.help.articleChrome = {
    ...(g.help.articleChrome || {}),
    tipLabel: TIP[lang],
  };
  fs.writeFileSync(
    path.join(guides, `${lang}.json`),
    `${JSON.stringify(g, null, 2)}\n`,
    "utf8",
  );
  console.log("updated guides", lang, g.help.articles.length);
}
