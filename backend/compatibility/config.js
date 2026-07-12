export const BRAND_TRUST_RANKING = [
  "genuine",
  "oe",
  "original",
  "elring",
  "victor reinz",
  "fai",
  "amc",
  "kolbenschmidt",
  "mahle",
  "febi",
  "blue print"
];

export const TYPE_ID = "1";
export const LANG_ID = "4";
export const COUNTRY_FILTER_ID = "63";

export const REG_NUMBER_TYPE = process.env.REG_NUMBER_TYPE || "2";

export const FUEL_TYPE_MAP = {
  diesel: "diesel",
  d: "diesel",
  crdi: "diesel",
  tdci: "diesel",
  tdi: "diesel",
  cdi: "diesel",
  hdi: "diesel",
  dci: "diesel",
  petrol: "petrol",
  gasoline: "petrol",
  p: "petrol",
  tsi: "petrol",
  tfsi: "petrol",
  gdi: "petrol",
  electric: "electric",
  ev: "electric",
  hybrid: "hybrid",
  phev: "hybrid"
};

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 90,
  LIKELY: 70,
  POSSIBLE: 50
};
