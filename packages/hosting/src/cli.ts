import { readFileSync } from "node:fs";
import { SiteStore } from "./store.ts";
import { provisionSite, recordPayment, setCustomDomain, isLive } from "./publish.ts";
import type { Business } from "../../generator/src/index.ts";

/**
 * Operator CLI for the hosting registry. The registry file is the source of
 * truth; mutating it and pushing redeploys the live static host.
 *
 *   node src/cli.ts list                                  [--registry path]
 *   node src/cli.ts provision <business.json> [--domain d] [--registry path]
 *   node src/cli.ts pay <slug>                            [--registry path]
 *   node src/cli.ts set-domain <slug> <domain>           [--registry path]
 *
 * Read-only commands print; mutating commands save back to the registry file.
 */
const DEFAULT_REGISTRY = new URL("../data/sites.json", import.meta.url).pathname;

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

function statusLine(store: SiteStore): string {
  const rows = store.list().map((r) => {
    const state = isLive(r) ? "LIVE" : "gated (unpaid)";
    const domain = r.customDomain ? `  [${r.customDomain}]` : "";
    return `  ${r.slug.padEnd(28)} ${state.padEnd(16)} ${r.business.name}${domain}`;
  });
  return rows.length ? rows.join("\n") : "  (registry empty)";
}

function main(): void {
  const [cmd, ...rest] = process.argv.slice(2);
  const registry = flag(rest, "registry") ?? DEFAULT_REGISTRY;
  const store = SiteStore.fromFile(registry);

  switch (cmd) {
    case "list":
      console.log(statusLine(store));
      return;

    case "provision": {
      const file = rest[0];
      if (!file) throw new Error("provision: expected a path to a business JSON file");
      const business = JSON.parse(readFileSync(file, "utf8")) as Business;
      const rec = provisionSite(store, business, { customDomain: flag(rest, "domain") });
      store.saveToFile(registry);
      console.log(`Provisioned "${rec.business.name}" → slug ${rec.slug} (status: ${rec.status}, not live until paid)`);
      return;
    }

    case "pay": {
      const slug = rest[0];
      if (!slug) throw new Error("pay: expected a slug");
      const rec = recordPayment(store, slug);
      store.saveToFile(registry);
      console.log(`Payment recorded for ${rec.slug} → status ${rec.status}, live since ${rec.paidAt}`);
      return;
    }

    case "set-domain": {
      const [slug, domain] = rest;
      if (!slug || !domain) throw new Error("set-domain: expected <slug> <domain>");
      const rec = setCustomDomain(store, slug, domain);
      store.saveToFile(registry);
      console.log(`Custom domain for ${rec.slug} set to ${rec.customDomain}`);
      return;
    }

    default:
      console.error("Usage: cli.ts <list|provision|pay|set-domain> [...args] [--registry path]");
      process.exitCode = 1;
  }
}

main();
