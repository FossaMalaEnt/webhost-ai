import { generateSite } from "../../generator/src/index.ts";
import { SiteStore } from "./store.ts";
import { resolveByHost, resolveBySlug, slugFromPath } from "./router.ts";
import { gatePage, notFoundPage } from "./pages.ts";
import type { SiteRecord } from "./types.ts";

/**
 * Production multi-tenant host: one Cloudflare Worker serving every customer
 * site. It routes by `Host` header (custom domains, via Cloudflare for SaaS),
 * falling back to `/sites/<slug>/` on our own apex. Sites and their publish
 * state live in a KV namespace so go-live/payment flips take effect instantly
 * with no redeploy. ~Zero marginal cost per site.
 *
 * Deploy needs a Cloudflare account + API token (escalated to the CEO). The
 * routing/gate logic is shared with the static builder and unit-tested, so this
 * is verified independently of the live deploy.
 */
export interface Env {
  /** KV namespace holding the registry JSON under key `registry`. */
  SITES: KVNamespace;
  /** Our own apex, e.g. "webhost.ai"; requests to it use path-based routing. */
  PRIMARY_HOST?: string;
}

/** Minimal KV surface we rely on (avoids a hard dep on @cloudflare/workers-types). */
export interface KVNamespace {
  get(key: string): Promise<string | null>;
}

const HTML = { "content-type": "text/html; charset=utf-8" } as const;

async function loadStore(env: Env): Promise<SiteStore> {
  const raw = await env.SITES.get("registry");
  if (!raw) return new SiteStore([]);
  const parsed = JSON.parse(raw) as { sites?: SiteRecord[] };
  return new SiteStore(parsed.sites ?? []);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const host = url.hostname;
    const store = await loadStore(env);

    // Custom-domain request → resolve by host unless it's our own apex.
    const isPrimary = env.PRIMARY_HOST && host.endsWith(env.PRIMARY_HOST);
    const outcome = !isPrimary
      ? resolveByHost(host, store)
      : resolveBySlug(slugFromPath(url.pathname) ?? "", store);

    switch (outcome.kind) {
      case "serve":
        return new Response(generateSite(outcome.record.business).html, { headers: HTML });
      case "gated":
        return new Response(gatePage(outcome.record), { status: 402, headers: HTML });
      case "not_found":
        return new Response(notFoundPage(), { status: 404, headers: HTML });
    }
  },
};
