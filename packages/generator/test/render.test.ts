import { test } from "node:test";
import assert from "node:assert/strict";
import { generateSite, slugify, escapeHtml, resolveAccent } from "../src/index.ts";
import type { Business } from "../src/index.ts";

const sample: Business = {
  name: "Bella's Trattoria",
  industry: "Italian Restaurant",
  tagline: "Handmade pasta in the heart of Austin.",
  about: "Family-run since 1998, serving classic Italian dishes.",
  location: "Austin, TX",
  established: 1998,
  services: [
    { name: "Dinner Service", description: "Seasonal pasta and wood-fired mains.", price: "from $18" },
    { name: "Private Events", description: "Book the back room for up to 30 guests." },
  ],
  gallery: [{ src: "https://example.com/a.jpg", alt: "A plated dish" }],
  hours: [{ days: "Mon–Fri", hours: "5pm – 10pm" }],
  testimonials: [{ quote: "Best in town.", author: "A regular" }],
  contact: { phone: "+1 512-555-0100", email: "hi@bellas.example", address: "12 Main St" },
  brandColor: "#7a1f1f",
};

test("generateSite returns html, slug, and metadata", () => {
  const site = generateSite(sample);
  assert.equal(site.slug, "bella-s-trattoria");
  assert.equal(site.template, "classic");
  assert.match(site.html, /<!doctype html>/);
  assert.match(site.html, /Bella&#39;s Trattoria/); // name is HTML-escaped
  assert.match(site.html, /Dinner Service/);
  assert.match(site.html, /Private Events/);
  assert.match(site.html, /#7a1f1f/); // brand color applied
  assert.ok(site.bytes > 1000);
  assert.match(site.title, /Bella/);
});

test("optional sections render when data is present", () => {
  const html = generateSite(sample).html;
  assert.match(html, /id="services"/);
  assert.match(html, /id="gallery"/);
  assert.match(html, /id="hours"/);
  assert.match(html, /id="reviews"/);
  assert.match(html, /id="about"/);
  assert.match(html, /id="contact"/);
  assert.match(html, /from \$18/); // service price
  assert.match(html, /Best in town/); // testimonial
  assert.match(html, /since 1998/); // established year
});

test("optional sections are omitted when data is absent", () => {
  const minimal: Business = {
    name: "Solo Co",
    industry: "Consulting",
    tagline: "We help.",
    about: "A small consultancy.",
    location: "Remote",
    services: [],
    contact: { email: "hi@solo.example" },
  };
  const html = generateSite(minimal).html;
  assert.doesNotMatch(html, /id="services"/);
  assert.doesNotMatch(html, /id="gallery"/);
  assert.doesNotMatch(html, /id="hours"/);
  assert.doesNotMatch(html, /id="reviews"/);
  assert.match(html, /id="about"/);
  assert.match(html, /id="contact"/);
});

test("bold template renders a distinct hero layout", () => {
  const site = generateSite({ ...sample, template: "bold" });
  assert.equal(site.template, "bold");
  assert.match(site.html, /hero-copy/); // bold-only structure
});

test("hero image is used as a background/photo and og:image", () => {
  const withImg = generateSite({
    ...sample,
    heroImage: { src: "https://cdn.example/hero.jpg", alt: "Storefront" },
  });
  assert.match(withImg.html, /hero\.jpg/);
  assert.match(withImg.html, /og:image/);
});

test("includes LocalBusiness structured data for SEO", () => {
  const html = generateSite(sample).html;
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /"@type": "LocalBusiness"/);
});

test("generateSite reports all missing required fields", () => {
  assert.throws(
    () => generateSite({ ...sample, name: "", tagline: "" }),
    /missing required field\(s\): name, tagline/,
  );
});

test("slugify produces url-safe slugs", () => {
  assert.equal(slugify("  Joe's Plumbing & Heating! "), "joe-s-plumbing-heating");
});

test("escapeHtml neutralizes script injection", () => {
  assert.equal(escapeHtml("<script>alert(1)</script>"), "&lt;script&gt;alert(1)&lt;/script&gt;");
});

test("untrusted input cannot break out of the document", () => {
  const evil = generateSite({
    ...sample,
    name: "</title><script>alert(1)</script>",
    about: '"><img src=x onerror=alert(1)>',
  });
  // The malicious markup must be neutralized into inert, escaped text —
  // no real <script> tag and no raw <img onerror=...> tag in the output.
  assert.doesNotMatch(evil.html, /<script>alert\(1\)<\/script>/);
  assert.doesNotMatch(evil.html, /<img src=x onerror=/);
  assert.match(evil.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test("invalid brand color falls back to default accent", () => {
  assert.equal(resolveAccent("not-a-color"), "#0b6e4f");
  assert.equal(resolveAccent("#7a1f1f"), "#7a1f1f");
  const site = generateSite({ ...sample, brandColor: "not-a-color" });
  assert.match(site.html, /#0b6e4f/);
});

test("generation is deterministic for the same input", () => {
  assert.equal(generateSite(sample).html, generateSite(sample).html);
});
