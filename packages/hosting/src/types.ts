import type { Business } from "../../generator/src/index.ts";

/**
 * Lifecycle of a customer site.
 * - `preview`  — generated, viewable as a demo, but NOT live as the customer's site.
 * - `published` — payment recorded; the site is live on its real URL (and custom domain).
 *
 * The single source of truth for "is this live?" is `paidAt`: a site only goes
 * live once a payment has been recorded. `status` is a human-readable label kept
 * in sync by {@link recordPayment}. See {@link isLive}.
 */
export type SiteStatus = "preview" | "published";

/** One customer site in the hosting registry. */
export interface SiteRecord {
  /** URL-safe slug derived from the business name; the site's path on our shared host. */
  slug: string;
  status: SiteStatus;
  /** The structured business input the site is generated from. */
  business: Business;
  /**
   * Optional customer-owned domain to point at this site, e.g. "bellastrattoria.com".
   * Served by the Cloudflare Worker (Cloudflare for SaaS). Lower-cased, no scheme.
   */
  customDomain?: string;
  /** ISO timestamp set when payment is recorded. Absent ⇒ not paid ⇒ not live. */
  paidAt?: string;
  /** ISO timestamp the site was first provisioned. */
  createdAt: string;
}

/** What the router decided to do for a given request. */
export type ResolveOutcome =
  | { kind: "serve"; record: SiteRecord }
  | { kind: "gated"; record: SiteRecord }
  | { kind: "not_found" };
