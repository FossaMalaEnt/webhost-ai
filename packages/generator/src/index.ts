import type { Business, GeneratedSite } from "./types.ts";
import { renderHtml, slugify } from "./templates.ts";

export type { Business, GeneratedSite, Service } from "./types.ts";
export { escapeHtml, slugify, renderHtml } from "./templates.ts";

/**
 * Generate a complete website for a business.
 * This is the single entry point the marketing site, hosting pipeline,
 * and outreach tooling all call.
 */
export function generateSite(business: Business): GeneratedSite {
  if (!business.name?.trim()) {
    throw new Error("generateSite: business.name is required");
  }
  return {
    html: renderHtml(business),
    slug: slugify(business.name),
  };
}
