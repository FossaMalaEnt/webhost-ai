import { generateSite } from "../../generator/src/index.ts";
import type { Business } from "../../generator/src/index.ts";
import type { SiteRecord } from "./types.ts";
import type { SiteStore } from "./store.ts";
import { normalizeHost } from "./store.ts";

/**
 * The payment-gated publish state machine.
 *
 * Invariant: a site is only live once a payment is recorded. `provisionSite`
 * creates a `preview` record with no `paidAt`; `recordPayment` is the ONLY way
 * to set `paidAt`/`published`. {@link isLive} is the gate every serving path
 * (Worker + static builder) consults, and it requires `paidAt` — so go-live is
 * impossible without a recorded payment, even if `status` is hand-edited.
 */

/** A site is live iff a payment has been recorded for it. */
export function isLive(record: SiteRecord): boolean {
  return Boolean(record.paidAt) && record.status === "published";
}

export interface ProvisionOptions {
  /** Optional customer-owned domain to attach now (served once live). */
  customDomain?: string;
  /** Override the provisioning timestamp (tests / deterministic builds). */
  now?: string;
}

/** Provision (or re-provision) a site from business details. Always starts in `preview`. */
export function provisionSite(
  store: SiteStore,
  business: Business,
  options: ProvisionOptions = {},
): SiteRecord {
  const { slug } = generateSite(business); // validates business + derives slug
  const existing = store.getBySlug(slug);
  const record: SiteRecord = {
    slug,
    status: existing?.status ?? "preview",
    business,
    customDomain: options.customDomain
      ? normalizeHost(options.customDomain)
      : existing?.customDomain,
    paidAt: existing?.paidAt,
    createdAt: existing?.createdAt ?? options.now ?? new Date().toISOString(),
  };
  store.upsert(record);
  return record;
}

export interface PaymentOptions {
  now?: string;
}

/**
 * Record a payment for a site → flips it to `published` and stamps `paidAt`.
 * Idempotent: re-recording keeps the original `paidAt`. Throws if the slug is unknown.
 */
export function recordPayment(
  store: SiteStore,
  slug: string,
  options: PaymentOptions = {},
): SiteRecord {
  const existing = store.getBySlug(slug);
  if (!existing) {
    throw new Error(`recordPayment: no site provisioned for slug "${slug}"`);
  }
  const record: SiteRecord = {
    ...existing,
    status: "published",
    paidAt: existing.paidAt ?? options.now ?? new Date().toISOString(),
  };
  store.upsert(record);
  return record;
}

/** Attach or update a custom domain on an existing site. */
export function setCustomDomain(store: SiteStore, slug: string, domain: string): SiteRecord {
  const existing = store.getBySlug(slug);
  if (!existing) {
    throw new Error(`setCustomDomain: no site provisioned for slug "${slug}"`);
  }
  const record: SiteRecord = { ...existing, customDomain: normalizeHost(domain) };
  store.upsert(record);
  return record;
}
