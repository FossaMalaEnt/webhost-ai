// Build the Webhost AI marketing site to apps/marketing/dist/.
// Dogfoods @webhost/generator: our own landing page is a generated site.
// Node strips the TypeScript types from the imported .ts source at runtime.
import { generateSite } from "../../packages/generator/src/index.ts";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "dist");

const company = {
  name: "Webhost AI",
  industry: "Websites with hosting included",
  tagline:
    "We build your small-business website and host it for you — see it live before you pay.",
  about:
    "Webhost AI designs, builds, and hosts professional websites for small businesses. " +
    "No setup headaches, no separate hosting bill, no agency retainer — one simple package. " +
    "We even generate a free preview of your future site so you can see it before you commit.",
  location: "Online — serving small businesses everywhere",
  services: [
    { name: "Done-for-you website", description: "A clean, fast, mobile-friendly site built from your business details." },
    { name: "Hosting included", description: "Reliable hosting, SSL, and a custom domain — all handled for you." },
    { name: "Free preview", description: "See a real demo of your site before you pay a cent." },
  ],
  contact: { email: "hello@webhost.ai" },
  brandColor: "#0b6e4f",
};

const { html } = generateSite(company);

await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, "index.html"), html, "utf8");
// .nojekyll keeps GitHub Pages from mangling paths and speeds publishing.
await writeFile(join(outDir, ".nojekyll"), "", "utf8");

console.log(`Built marketing site -> ${join(outDir, "index.html")} (${html.length} bytes)`);
