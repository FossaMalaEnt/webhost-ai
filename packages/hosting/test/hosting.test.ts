import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SiteStore, normalizeHost } from "../src/store.ts";
import { provisionSite, recordPayment, setCustomDomain, isLive } from "../src/publish.ts";
import { resolveByHost, resolveBySlug, slugFromPath } from "../src/router.ts";
import { buildStatic } from "../src/build-static.ts";
import type { Business } from "../../generator/src/index.ts";

const business: Business = {
  name: "Bloom & Vine Florist",
  industry: "Florist",
  tagline: "Fresh arrangements for every occasion.",
  about: "A family-run florist.",
  location: "Portland, OR",
  services: [{ name: "Bouquets", description: "Seasonal hand-tied arrangements." }],
  contact: { email: "hi@bloomandvine.example" },
  brandColor: "#9b2d6b",
};

test("provisioned sites are NOT live until payment is recorded", () => {
  const store = new SiteStore();
  const rec = provisionSite(store, business, { now: "2026-01-01T00:00:00.000Z" });
  assert.equal(rec.status, "preview");
  assert.equal(rec.paidAt, undefined);
  assert.equal(isLive(rec), false, "a provisioned-but-unpaid site must not be live");
});

test("recordPayment is the only path to go live, and is idempotent", () => {
  const store = new SiteStore();
  provisionSite(store, business);
  const paid = recordPayment(store, "bloom-vine-florist", { now: "2026-02-02T00:00:00.000Z" });
  assert.equal(paid.status, "published");
  assert.equal(paid.paidAt, "2026-02-02T00:00:00.000Z");
  assert.equal(isLive(paid), true);
  // Re-recording keeps the original timestamp.
  const again = recordPayment(store, "bloom-vine-florist", { now: "2026-03-03T00:00:00.000Z" });
  assert.equal(again.paidAt, "2026-02-02T00:00:00.000Z");
});

test("the gate cannot be bypassed by hand-setting status without payment", () => {
  const store = new SiteStore();
  provisionSite(store, business);
  const rec = store.getBySlug("bloom-vine-florist")!;
  store.upsert({ ...rec, status: "published" }); // forged status, no paidAt
  assert.equal(isLive(store.getBySlug("bloom-vine-florist")!), false);
});

test("recordPayment on an unknown slug throws", () => {
  assert.throws(() => recordPayment(new SiteStore(), "nope"), /no site provisioned/);
});

test("router serves paid sites, gates unpaid ones, 404s unknowns", () => {
  const store = new SiteStore();
  provisionSite(store, business, { customDomain: "BloomAndVine.com" });
  assert.equal(resolveBySlug("bloom-vine-florist", store).kind, "gated");
  assert.equal(resolveByHost("bloomandvine.com", store).kind, "gated");
  recordPayment(store, "bloom-vine-florist");
  assert.equal(resolveBySlug("bloom-vine-florist", store).kind, "serve");
  // Custom domain resolves case-insensitively and ignores www./scheme.
  assert.equal(resolveByHost("https://www.bloomandvine.com/", store).kind, "serve");
  assert.equal(resolveBySlug("ghost", store).kind, "not_found");
  assert.equal(resolveByHost("unknown.example", store).kind, "not_found");
});

test("setCustomDomain normalizes the host", () => {
  const store = new SiteStore();
  provisionSite(store, business);
  const rec = setCustomDomain(store, "bloom-vine-florist", "WWW.Bloom-And-Vine.com");
  assert.equal(rec.customDomain, "bloom-and-vine.com");
});

test("normalizeHost strips scheme, port, www, trailing dot", () => {
  assert.equal(normalizeHost("https://www.Example.com:443/"), "example.com");
  assert.equal(normalizeHost("example.com."), "example.com");
});

test("slugFromPath only matches /sites/<slug>/ paths", () => {
  assert.equal(slugFromPath("/sites/bloom-vine-florist/"), "bloom-vine-florist");
  assert.equal(slugFromPath("/sites/bloom-vine-florist"), "bloom-vine-florist");
  assert.equal(slugFromPath("/"), null);
  assert.equal(slugFromPath("/sites/"), null);
});

test("buildStatic emits real HTML for paid sites and the gate for unpaid", async () => {
  const store = new SiteStore();
  // Paid → live
  provisionSite(store, business, { customDomain: "bloomandvine.com" });
  recordPayment(store, "bloom-vine-florist");
  // Unpaid → gated
  provisionSite(store, { ...business, name: "Northside Auto" });

  const out = mkdtempSync(join(tmpdir(), "host-build-"));
  const result = await buildStatic(store, out);

  assert.deepEqual(result.live, ["bloom-vine-florist"]);
  assert.deepEqual(result.gated, ["northside-auto"]);
  assert.deepEqual(result.customDomains, [{ slug: "bloom-vine-florist", domain: "bloomandvine.com" }]);

  const liveHtml = readFileSync(join(out, "sites", "bloom-vine-florist", "index.html"), "utf8");
  assert.match(liveHtml, /Bloom &amp; Vine Florist/);
  assert.match(liveHtml, /Bouquets/);
  assert.doesNotMatch(liveHtml, /Payment required/);

  const gatedHtml = readFileSync(join(out, "sites", "northside-auto", "index.html"), "utf8");
  assert.match(gatedHtml, /Payment required/);
  assert.match(gatedHtml, /Northside Auto<\/h1>|Northside Auto isn't live yet/);

  const manifest = JSON.parse(readFileSync(join(out, "sites", "custom-domains.json"), "utf8"));
  assert.deepEqual(manifest.domains, [{ slug: "bloom-vine-florist", domain: "bloomandvine.com" }]);
  assert.ok(existsSync(join(out, "sites", "index.html")));
});

test("SiteStore round-trips through a JSON file", () => {
  const store = new SiteStore();
  provisionSite(store, business, { customDomain: "bloomandvine.com" });
  recordPayment(store, "bloom-vine-florist");
  const path = join(mkdtempSync(join(tmpdir(), "host-store-")), "sites.json");
  store.saveToFile(path);
  const reloaded = SiteStore.fromFile(path);
  const rec = reloaded.getBySlug("bloom-vine-florist")!;
  assert.equal(isLive(rec), true);
  assert.equal(rec.customDomain, "bloomandvine.com");
});
