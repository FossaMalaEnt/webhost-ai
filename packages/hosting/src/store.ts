import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { SiteRecord } from "./types.ts";

/**
 * The site registry. The committed JSON file is the source of truth for what is
 * provisioned and what is paid/live. CI reads it to build the live static deploy;
 * the operator CLI mutates it (provision / record payment) and a push redeploys.
 *
 * In Cloudflare production this same shape is mirrored in KV/D1; the registry
 * format is intentionally storage-agnostic so the Worker and the static builder
 * read identical records.
 */
export class SiteStore {
  private readonly bySlug = new Map<string, SiteRecord>();

  constructor(records: SiteRecord[] = []) {
    for (const r of records) this.bySlug.set(r.slug, r);
  }

  /** Load a registry from a JSON file. Missing file ⇒ empty store. */
  static fromFile(path: string): SiteStore {
    let raw: string;
    try {
      raw = readFileSync(path, "utf8");
    } catch {
      return new SiteStore([]);
    }
    const parsed = JSON.parse(raw) as { sites?: SiteRecord[] };
    return new SiteStore(parsed.sites ?? []);
  }

  list(): SiteRecord[] {
    return [...this.bySlug.values()];
  }

  getBySlug(slug: string): SiteRecord | undefined {
    return this.bySlug.get(slug);
  }

  /** Look up a site by a customer-owned custom domain (case-insensitive). */
  getByHost(host: string): SiteRecord | undefined {
    const wanted = normalizeHost(host);
    if (!wanted) return undefined;
    for (const r of this.bySlug.values()) {
      if (r.customDomain && normalizeHost(r.customDomain) === wanted) return r;
    }
    return undefined;
  }

  upsert(record: SiteRecord): void {
    this.bySlug.set(record.slug, record);
  }

  /** Persist the registry back to a JSON file (stable slug order). */
  saveToFile(path: string): void {
    const sites = this.list().sort((a, b) => a.slug.localeCompare(b.slug));
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify({ sites }, null, 2) + "\n", "utf8");
  }
}

/** Strip scheme, port, trailing dot, and `www.`; lower-case. Empty ⇒ "". */
export function normalizeHost(host: string): string {
  return host
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "")
    .replace(/^www\./, "");
}
