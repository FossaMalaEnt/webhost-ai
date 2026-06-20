// Local stand-in for the Cloudflare Worker: exercises the SAME multi-tenant
// host-routing + payment gate the Worker uses, so you can verify custom-domain
// behaviour locally without a Cloudflare account.
//
//   node serve.mjs                       # listens on :8788
//   curl -H 'Host: bloomandvine.com' localhost:8788     # live custom domain
//   curl localhost:8788/sites/northside-auto-repair/    # gated → HTTP 402
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateSite } from "../generator/src/index.ts";
import { SiteStore } from "./src/store.ts";
import { resolveByHost, resolveBySlug, slugFromPath } from "./src/router.ts";
import { gatePage, notFoundPage } from "./src/pages.ts";

const here = dirname(fileURLToPath(import.meta.url));
const registry = join(here, "data", "sites.json");
const primaryHost = process.env.PRIMARY_HOST || "localhost";
const port = Number(process.env.PORT) || 8788;
const HTML = { "content-type": "text/html; charset=utf-8" };

createServer((req, res) => {
  const store = SiteStore.fromFile(registry); // reload each request: edits take effect live
  const host = (req.headers.host || "").split(":")[0];
  const path = (req.url || "/").split("?")[0];

  const isPrimary = host === primaryHost || host.endsWith(`.${primaryHost}`);
  const outcome = !isPrimary
    ? resolveByHost(host, store)
    : resolveBySlug(slugFromPath(path) ?? "", store);

  if (outcome.kind === "serve") {
    res.writeHead(200, HTML).end(generateSite(outcome.record.business).html);
  } else if (outcome.kind === "gated") {
    res.writeHead(402, HTML).end(gatePage(outcome.record));
  } else {
    res.writeHead(404, HTML).end(notFoundPage());
  }
}).listen(port, () => {
  console.log(`Worker-equivalent host at http://localhost:${port} (primary host: ${primaryHost})`);
});
