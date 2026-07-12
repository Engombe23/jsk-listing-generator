const GA_ID  = import.meta.env.VITE_GA_ID;
const ADS_ID = import.meta.env.VITE_ADS_ID;

if (GA_ID && typeof window !== "undefined") {
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID);
  if (ADS_ID) gtag("config", ADS_ID);
}
