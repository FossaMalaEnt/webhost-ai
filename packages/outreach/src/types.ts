/**
 * A prospect business as we first encounter it: sparse, often with weak or no
 * web presence. This is the *input* to the outreach loop — far less than the
 * generator needs, so {@link "./enrich.ts"} fills in the credible defaults.
 */
export interface Lead {
  /** Business name, e.g. "Tony's Auto Repair". */
  name: string;
  /** Short industry/category, e.g. "Auto Repair". Drives enrichment defaults. */
  industry: string;
  /** City / area served, e.g. "Tucson, AZ". */
  location: string;
  /** Owner / contact person, used to personalize outreach. Optional. */
  owner?: string;
  phone?: string;
  email?: string;
  address?: string;
  /** Year established, if known — adds credibility to the demo. */
  established?: number;
  /** Known specialties/services; become the services grid if present. */
  specialties?: string[];
  /** Free-text note from research, e.g. "only a Facebook page, no website". */
  notes?: string;
  /** Why they're a fit, e.g. "no-website" | "facebook-only" | "outdated-site". */
  webPresence?: "none" | "facebook-only" | "outdated-site" | "directory-only";
  /** Optional hex brand color override. */
  brandColor?: string;
}

/** A ready-to-send outreach message in the channels we support. */
export interface OutreachDraft {
  /** Email subject line. */
  subject: string;
  /** Full plain-text email body. */
  email: string;
  /** Short SMS / DM variant (<= ~320 chars). */
  sms: string;
}

/** The per-lead result of the loop: a live preview plus a message to send. */
export interface OutreachResult {
  lead: Lead;
  /** URL-safe slug derived from the business name. */
  slug: string;
  /** Live preview link to the generated demo site. */
  previewUrl: string;
  /** The generated demo HTML (so callers can write it to disk / host it). */
  html: string;
  /** Template the demo was rendered with. */
  template: string;
  /** Personalized outreach copy. */
  draft: OutreachDraft;
}

/** The result of running the loop over a batch of leads. */
export interface CampaignResult {
  baseUrl: string;
  generatedAt: string;
  results: OutreachResult[];
  /** Leads that failed to process, with the reason. */
  errors: { lead: Lead; error: string }[];
}
