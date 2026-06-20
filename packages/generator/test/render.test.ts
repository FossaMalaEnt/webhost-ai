import { test } from "node:test";
import assert from "node:assert/strict";
import { generateSite, slugify, escapeHtml } from "../src/index.ts";
import type { Business } from "../src/index.ts";

const sample: Business = {
  name: "Bella's Trattoria",
  industry: "Italian Restaurant",
  tagline: "Handmade pasta in the heart of Austin.",
  about: "Family-run since 1998, serving classic Italian dishes.",
  location: "Austin, TX",
  services: [
    { name: "Dinner Service", description: "Seasonal pasta and wood-fired mains." },
    { name: "Private Events", description: "Book the back room for up to 30 guests." },
  ],
  contact: { phone: "+1 512-555-0100", email: "hi@bellas.example", address: "12 Main St" },
  brandColor: "#7a1f1f",
};

test("generateSite returns html and a slug", () => {
  const site = generateSite(sample);
  assert.equal(site.slug, "bella-s-trattoria");
  assert.match(site.html, /<!doctype html>/);
  assert.match(site.html, /Bella&#39;s Trattoria/); // name is HTML-escaped
  assert.match(site.html, /Dinner Service/);
  assert.match(site.html, /Private Events/);
  assert.match(site.html, /#7a1f1f/); // brand color applied
});

test("generateSite requires a name", () => {
  assert.throws(() => generateSite({ ...sample, name: "" }), /name is required/);
});

test("slugify produces url-safe slugs", () => {
  assert.equal(slugify("  Joe's Plumbing & Heating! "), "joe-s-plumbing-heating");
});

test("escapeHtml neutralizes script injection", () => {
  assert.equal(escapeHtml("<script>alert(1)</script>"), "&lt;script&gt;alert(1)&lt;/script&gt;");
});

test("invalid brand color falls back to default accent", () => {
  const site = generateSite({ ...sample, brandColor: "not-a-color" });
  assert.match(site.html, /#0b6e4f/);
});
