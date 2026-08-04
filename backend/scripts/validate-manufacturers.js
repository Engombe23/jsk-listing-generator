import "../lib/env-preload.js";
import { listManufacturers } from "../compatibility/api.js";

const manufacturers = await listManufacturers();
console.log(`\nTotal manufacturers returned for type-id=1 (PC): ${manufacturers.length}\n`);
console.log("First 20 manufacturer names:");
manufacturers.slice(0, 20).forEach((m, i) => {
  const id   = m.manufacturerId ?? m.id ?? "?";
  const name = m.manufacturerName || m.name || "(no name)";
  console.log(`  ${String(i + 1).padStart(2)}. [${id}] ${name}`);
});
