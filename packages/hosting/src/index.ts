// @webhost/hosting — take generated sites live on real URLs and custom domains,
// gated on payment. See docs/ARCHITECTURE.md (PRE-4) for the design.
export type { SiteRecord, SiteStatus, ResolveOutcome } from "./types.ts";
export { SiteStore, normalizeHost } from "./store.ts";
export { isLive, provisionSite, recordPayment, setCustomDomain } from "./publish.ts";
export { resolveByHost, resolveBySlug, slugFromPath } from "./router.ts";
export { gatePage, notFoundPage, indexPage } from "./pages.ts";
export { buildStatic, buildFromFile } from "./build-static.ts";
