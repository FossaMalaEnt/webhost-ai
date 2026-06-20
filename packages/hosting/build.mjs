// Build published customer sites into the shared static host output.
// Reads the committed registry and writes <outDir>/sites/<slug>/index.html.
// Default outDir is the marketing dist, so the same GitHub Pages deploy serves
// both our landing page and every paid customer site. Override with arg 1.
import { buildFromFile } from "./src/build-static.ts";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const registry = join(here, "data", "sites.json");
const outDir = resolve(process.argv[2] ?? join(here, "..", "..", "apps", "marketing", "dist"));

const result = await buildFromFile(registry, outDir);

console.log(`Hosting build → ${join(outDir, "sites")}`);
console.log(`  live:  ${result.live.length ? result.live.join(", ") : "(none)"}`);
console.log(`  gated: ${result.gated.length ? result.gated.join(", ") : "(none)"}`);
console.log(`  custom domains: ${result.customDomains.map((d) => d.domain).join(", ") || "(none)"}`);
