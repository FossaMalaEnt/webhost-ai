import type { SiteRecord, ResolveOutcome } from "./types.ts";
import type { SiteStore } from "./store.ts";
import { isLive } from "./publish.ts";
import { normalizeHost } from "./store.ts";

/**
 * Pure request routing, shared by the Cloudflare Worker (host-based, multi-tenant)
 * and the static builder (path-based, GitHub Pages). Given a way to find the site,
 * decide whether to serve it, gate it (payment required), or 404.
 */

function outcomeFor(record: SiteRecord | undefined): ResolveOutcome {
  if (!record) return { kind: "not_found" };
  return isLive(record) ? { kind: "serve", record } : { kind: "gated", record };
}

/** Production path: resolve by the request's Host header (custom domain). */
export function resolveByHost(host: string, store: SiteStore): ResolveOutcome {
  return outcomeFor(store.getByHost(normalizeHost(host)));
}

/** Shared-host path: resolve by `/sites/<slug>/` style slug. */
export function resolveBySlug(slug: string, store: SiteStore): ResolveOutcome {
  return outcomeFor(store.getBySlug(slug));
}

/** Extract a site slug from a request path like `/sites/bella-s/`. Null if not a site path. */
export function slugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/sites\/([a-z0-9-]+)\/?$/);
  return m ? m[1] : null;
}
