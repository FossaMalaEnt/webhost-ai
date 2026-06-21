import { test } from "node:test";
import assert from "node:assert/strict";
import { leadToBusiness } from "../src/enrich.ts";
import { draftOutreach } from "../src/message.ts";
import { runCampaign, previewUrlFor } from "../src/campaign.ts";
import type { Lead } from "../src/types.ts";

const lead: Lead = {
  name: "Tony's Auto Repair",
  industry: "Auto Repair",
  location: "Tucson, AZ",
  owner: "Tony Marino",
  email: "tony@tonysauto.example",
  established: 1998,
  webPresence: "facebook-only",
};

test("leadToBusiness produces a Business the generator can render", () => {
  const b = leadToBusiness(lead);
  // Required-by-generator fields are all populated from a sparse lead.
  assert.ok(b.name && b.industry && b.tagline && b.about && b.location);
  assert.ok(b.tagline.includes("Tucson, AZ"));
  assert.ok(b.about.includes("Tony's Auto Repair"));
  assert.ok(b.about.includes("1998"), "established year should appear in about");
  assert.ok(b.services.length >= 1);
  assert.ok(b.heroImage?.alt.includes("Tony's Auto Repair"));
  // Auto profile picks the bold template + a non-default accent.
  assert.equal(b.template, "bold");
});

test("leadToBusiness is deterministic", () => {
  assert.deepEqual(leadToBusiness(lead), leadToBusiness(lead));
});

test("leadToBusiness uses lead specialties as services when present", () => {
  const b = leadToBusiness({
    name: "Maple Street Bakery",
    industry: "Bakery & Cafe",
    location: "Burlington, VT",
    specialties: ["sourdough breads", "custom cakes"],
  });
  const names = b.services.map((s) => s.name);
  assert.deepEqual(names, ["Sourdough Breads", "Custom Cakes"]);
});

test("leadToBusiness falls back for unknown industries", () => {
  const b = leadToBusiness({
    name: "Acme Widgets",
    industry: "Artisanal Widget Foundry",
    location: "Nowhere, NA",
  });
  assert.ok(b.services.length >= 1);
  assert.equal(b.brandColor, "#0b6e4f"); // fallback accent
});

test("leadToBusiness requires name, industry, location", () => {
  assert.throws(() => leadToBusiness({ name: "", industry: "x", location: "y" }));
  assert.throws(() => leadToBusiness({ name: "x", industry: "", location: "y" }));
  assert.throws(() => leadToBusiness({ name: "x", industry: "y", location: "" }));
});

test("draftOutreach grounds the message in real lead facts", () => {
  const url = "https://example.com/demos/tony-s-auto-repair/";
  const d = draftOutreach(lead, url);
  assert.ok(d.subject.includes("Tony's Auto Repair"));
  assert.ok(d.email.includes("Tony"), "greeting should use the owner's first name");
  assert.ok(d.email.includes(url), "email must include the live preview link");
  assert.ok(d.email.includes("Facebook"), "facebook-only hook should appear");
  assert.ok(d.sms.includes(url), "sms must include the preview link");
  assert.ok(d.sms.length <= 480);
});

test("previewUrlFor joins base and slug cleanly", () => {
  assert.equal(
    previewUrlFor("https://x.io/webhost-ai/", "tony-s-auto-repair"),
    "https://x.io/webhost-ai/demos/tony-s-auto-repair/",
  );
});

test("runCampaign runs the loop end to end over a batch", () => {
  const leads: Lead[] = [
    lead,
    { name: "Bella Notte Trattoria", industry: "Italian Restaurant", location: "Providence, RI" },
    { name: "Greenline Landscaping", industry: "Landscaping & Lawn Care", location: "Boise, ID" },
  ];
  const result = runCampaign(leads, {
    baseUrl: "https://fossamalaent.github.io/webhost-ai",
    now: "2026-06-22T00:00:00.000Z",
  });
  assert.equal(result.results.length, 3);
  assert.equal(result.errors.length, 0);
  for (const r of result.results) {
    // Acceptance criteria: each lead gets a preview link + a ready message.
    assert.ok(r.previewUrl.startsWith("https://fossamalaent.github.io/webhost-ai/demos/"));
    assert.ok(r.previewUrl.endsWith(`/${r.slug}/`));
    assert.ok(r.html.includes("<!doctype html>") || r.html.toLowerCase().includes("<!doctype html>"));
    assert.ok(r.html.includes(r.lead.name));
    assert.ok(r.draft.email.includes(r.previewUrl));
    assert.ok(r.draft.subject.length > 0);
  }
});

test("runCampaign collects bad leads into errors without aborting", () => {
  const result = runCampaign([
    { name: "", industry: "Auto Repair", location: "Tucson, AZ" },
    lead,
  ]);
  assert.equal(result.results.length, 1);
  assert.equal(result.errors.length, 1);
});
