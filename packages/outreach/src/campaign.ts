import { generateSite } from "../../generator/src/index.ts";
import { leadToBusiness } from "./enrich.ts";
import { draftOutreach } from "./message.ts";
import type { CampaignResult, Lead, OutreachResult } from "./types.ts";

export interface CampaignOptions {
  /**
   * Base URL the demos are/will be hosted at. The preview link for a lead is
   * `${baseUrl}/demos/${slug}/`. Defaults to the live GitHub Pages site.
   */
  baseUrl?: string;
  /** Override the generation timestamp (deterministic builds/tests). */
  now?: string;
}

const DEFAULT_BASE_URL = "https://fossamalaent.github.io/webhost-ai";

/** Trim a trailing slash so URL joins are predictable. */
function normalizeBase(url: string): string {
  return url.replace(/\/+$/, "");
}

/** The preview link a prospect receives for their generated demo. */
export function previewUrlFor(baseUrl: string, slug: string): string {
  return `${normalizeBase(baseUrl)}/demos/${slug}/`;
}

/**
 * Run the core acquisition loop over a batch of leads.
 *
 * For each lead: enrich → generate a personalized demo → compute its live
 * preview link → draft ready-to-send outreach. Pure (no IO): the caller decides
 * where to write the demo HTML and the campaign sheet. Bad leads are collected
 * into `errors` rather than aborting the whole batch.
 */
export function runCampaign(leads: Lead[], options: CampaignOptions = {}): CampaignResult {
  const baseUrl = normalizeBase(options.baseUrl ?? DEFAULT_BASE_URL);
  const results: OutreachResult[] = [];
  const errors: CampaignResult["errors"] = [];

  for (const lead of leads) {
    try {
      const business = leadToBusiness(lead);
      const site = generateSite(business);
      const previewUrl = previewUrlFor(baseUrl, site.slug);
      const draft = draftOutreach(lead, previewUrl);
      results.push({
        lead,
        slug: site.slug,
        previewUrl,
        html: site.html,
        template: site.template,
        draft,
      });
    } catch (err) {
      errors.push({ lead, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return {
    baseUrl,
    generatedAt: options.now ?? new Date().toISOString(),
    results,
    errors,
  };
}
