import type { Business, GeneratedSite, TemplateName } from "./types.ts";
import { renderHtml, slugify } from "./templates.ts";

export type {
  Business,
  GeneratedSite,
  Service,
  Image,
  Testimonial,
  Hours,
  TemplateName,
} from "./types.ts";
export { escapeHtml, slugify, renderHtml, resolveAccent } from "./templates.ts";

/** Throw a clear error if the minimum fields needed for a credible site are missing. */
function validate(business: Business): void {
  const missing: string[] = [];
  if (!business.name?.trim()) missing.push("name");
  if (!business.industry?.trim()) missing.push("industry");
  if (!business.tagline?.trim()) missing.push("tagline");
  if (!business.location?.trim()) missing.push("location");
  if (!business.about?.trim()) missing.push("about");
  if (missing.length) {
    throw new Error(`generateSite: missing required field(s): ${missing.join(", ")}`);
  }
}

/**
 * Generate a complete website for a business.
 * This is the single entry point the marketing site, hosting pipeline,
 * and outreach tooling all call. Deterministic: same input → same output.
 */
export function generateSite(business: Business): GeneratedSite {
  validate(business);
  const { html, title, description } = renderHtml(business);
  const template: TemplateName = business.template === "bold" ? "bold" : "classic";
  return {
    html,
    slug: slugify(business.name),
    title,
    description,
    template,
    bytes: Buffer.byteLength(html, "utf8"),
  };
}
