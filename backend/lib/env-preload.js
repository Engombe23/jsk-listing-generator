// env-preload.js — must be the FIRST import in every CLI script.
//
// Problem: api.js reads process.env.RAPIDAPI_KEY at module-load time.
// ESM evaluates imports in source order, so this module must be listed
// before any import that transitively loads api.js.
//
// This module resolves .env relative to the backend/ directory so the
// script works regardless of the cwd it is launched from.

import { fileURLToPath } from "url";
import { dirname, resolve, join } from "path";
import dotenv from "dotenv";

// backend/lib → backend/
const backendDir = dirname(dirname(fileURLToPath(import.meta.url)));
const envPath    = join(backendDir, ".env");

const { error } = dotenv.config({ path: envPath });

if (error) {
  const win = envPath.replace(/\//g, "\\");
  console.error(`\n[env] ERROR: Could not load .env from:\n  ${envPath}`);
  console.error(`\n[env] Fix: copy your backend .env file to that path, e.g.`);
  console.error(`  copy "C:\\Users\\Aaron\\listinggen\\backend\\.env" "${win}"\n`);
  process.exit(1);
}

// Belt-and-suspenders: catch missing keys before any API call is attempted
const required = ["RAPIDAPI_KEY", "VITE_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing  = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`[env] ERROR: Missing required env vars: ${missing.join(", ")}`);
  console.error(`[env] Check your backend/.env file.\n`);
  process.exit(1);
}

const key    = process.env.RAPIDAPI_KEY;
const masked = "*".repeat(key.length - 4) + key.slice(-4);
console.log(`[env] Loaded .env from ${envPath}`);
console.log(`[env] RAPIDAPI_KEY  : ${masked}`);
console.log(`[env] RAPIDAPI_HOST : ${process.env.RAPIDAPI_HOST || "autodoc-parts-catalog.p.rapidapi.com (default)"}`);
