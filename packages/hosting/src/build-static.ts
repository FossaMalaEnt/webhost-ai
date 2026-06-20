import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateSite } from "../../generator/src/index.ts";
import { SiteStore } from "./store.ts";
import { isLive } from "./publish.ts";
import { gatePage, indexPage } from "./pages.ts";
import type { SiteRecord } from "./types.ts";

/**
 * Render the registry into a static deploy under `<outDir>/sites/`.
 *
 * This is the GitHub Pages production path: one shared host serving every
 * customer site by path. The payment gate is enforced here — a paid site emits
 * its real generated HTML; an unpaid site emits the {@link gatePage} placeholder
 * at the same URL, so go-live is visibly blocked until payment is recorded.
 *
 * Custom domains (a per-customer hostname) are a Cloudflare Worker concern and
 * are emitted to a manifest for that pipeline; GitHub Pages serves one domain
 * for the whole site, so it can't host many customer domains on its own.
 */
export interface BuildResult {
  live: string[];
  gated: string[];
  customDomains: { slug: string; domain: string }[];
}

export async function buildStatic(store: SiteStore, outDir: string): Promise<BuildResult> {
  const sitesDir = join(outDir, "sites");
  await mkdir(sitesDir, { recursive: true });

  const records = store.list().sort((a, b) => a.slug.localeCompare(b.slug));
  const result: BuildResult = { live: [], gated: [], customDomains: [] };

  for (const record of records) {
    const dir = join(sitesDir, record.slug);
    await mkdir(dir, { recursive: true });
    if (isLive(record)) {
      const { html } = generateSite(record.business);
      await writeFile(join(dir, "index.html"), html, "utf8");
      result.live.push(record.slug);
    } else {
      await writeFile(join(dir, "index.html"), gatePage(record), "utf8");
      result.gated.push(record.slug);
    }
    if (record.customDomain) {
      result.customDomains.push({ slug: record.slug, domain: record.customDomain });
    }
  }

  const liveRecords: SiteRecord[] = records.filter(isLive);
  await writeFile(join(sitesDir, "index.html"), indexPage(liveRecords), "utf8");
  // Manifest for the Cloudflare for SaaS provisioning step (custom hostnames).
  await writeFile(
    join(sitesDir, "custom-domains.json"),
    JSON.stringify({ domains: result.customDomains }, null, 2) + "\n",
    "utf8",
  );

  return result;
}

/** CLI/entry helper: build from a registry file into an output directory. */
export async function buildFromFile(registryPath: string, outDir: string): Promise<BuildResult> {
  const store = SiteStore.fromFile(registryPath);
  return buildStatic(store, outDir);
}
