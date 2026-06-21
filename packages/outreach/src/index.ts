// @webhost/outreach — the acquisition loop: source leads, auto-generate a
// personalized demo site for each, and produce a ready-to-send message with a
// live preview link. Dogfoods @webhost/generator. See docs/ARCHITECTURE.md.
export type {
  Lead,
  OutreachDraft,
  OutreachResult,
  CampaignResult,
} from "./types.ts";
export { leadToBusiness } from "./enrich.ts";
export { draftOutreach } from "./message.ts";
export { runCampaign, previewUrlFor } from "./campaign.ts";
export type { CampaignOptions } from "./campaign.ts";
