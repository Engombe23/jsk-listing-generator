/**
 * Visitor country for Site Language / marketplace defaults.
 * On Vercel: x-vercel-ip-country. Behind Cloudflare: cf-ipcountry.
 * Local / unknown → fall through to browser localisation in the client.
 */
export default function handler(req, res) {
  const raw =
    req.headers["x-vercel-ip-country"] ||
    req.headers["cf-ipcountry"] ||
    req.headers["x-country-code"] ||
    "";
  const country = String(raw).trim().toUpperCase();
  res.setHeader("Cache-Control", "private, max-age=3600");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).json({ country: country || "XX" });
}
