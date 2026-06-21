import type { Business, Service, Image } from "../../generator/src/index.ts";
import type { Lead } from "./types.ts";

/**
 * Industry-aware defaults used to turn a sparse {@link Lead} into a credible
 * {@link Business} the generator can render. The goal is a demo that looks like
 * it was made *for this business* — not a generic placeholder — using only the
 * lead's name, industry, and location.
 *
 * Each profile is deterministic: same lead in → same demo out, so previews are
 * stable across rebuilds and safe to link in outreach.
 */
interface IndustryProfile {
  /** Keys (substrings) of the lead.industry this profile matches. */
  match: string[];
  brandColor: string;
  template: "classic" | "bold";
  ctaLabel: string;
  /** Curated, on-topic hero image (Unsplash). Alt text added per business. */
  heroSrc: string;
  heroAlt: string;
  /** Short phrase that completes "…in {location}." for the tagline. */
  taglineLead: string;
  /** Sentence fragment that follows the name in the about section. */
  aboutLead: string;
  /** Default services if the lead lists none. */
  services: Service[];
}

const PROFILES: IndustryProfile[] = [
  {
    match: ["restaurant", "trattoria", "diner", "bistro", "eatery", "pizzeria", "italian", "mexican", "thai"],
    brandColor: "#b91c1c",
    template: "bold",
    ctaLabel: "Book a table",
    heroSrc: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
    heroAlt: "A warm, inviting restaurant dining room",
    taglineLead: "Fresh, made-from-scratch food and a warm welcome",
    aboutLead: "is a neighborhood favorite",
    services: [
      { name: "Dine In", description: "A comfortable dining room and friendly service for lunch and dinner." },
      { name: "Takeout & Delivery", description: "Your favorites, ready to go or brought to your door." },
      { name: "Private Events", description: "Birthdays, gatherings, and celebrations — we'll take care of the food." },
    ],
  },
  {
    match: ["cafe", "coffee", "bakery", "patisserie", "espresso"],
    brandColor: "#92400e",
    template: "classic",
    ctaLabel: "See our menu",
    heroSrc: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=80",
    heroAlt: "A cozy cafe counter with fresh pastries",
    taglineLead: "Freshly baked, locally loved",
    aboutLead: "is a local cafe and bakery",
    services: [
      { name: "Coffee & Espresso", description: "Carefully sourced beans, pulled and poured by hand." },
      { name: "Fresh Bakes", description: "Pastries, breads, and cakes baked in-house every morning." },
      { name: "Catering", description: "Trays and boxes for meetings, events, and special occasions." },
    ],
  },
  {
    match: ["plumb", "hvac", "heating", "electric", "roofing", "contractor", "handyman", "construction"],
    brandColor: "#1d4ed8",
    template: "bold",
    ctaLabel: "Request a quote",
    heroSrc: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=1600&q=80",
    heroAlt: "A professional tradesperson at work",
    taglineLead: "Fast, honest work and upfront pricing",
    aboutLead: "is a licensed, family-owned trade business",
    services: [
      { name: "Repairs", description: "Prompt, reliable fixes — we show up on time and get it done right." },
      { name: "Installations", description: "Quality installs with workmanship you can count on." },
      { name: "Maintenance", description: "Routine service to keep things running and prevent surprises." },
    ],
  },
  {
    match: ["salon", "hair", "barber", "beauty", "spa", "nails", "lash"],
    brandColor: "#be185d",
    template: "bold",
    ctaLabel: "Book an appointment",
    heroSrc: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1600&q=80",
    heroAlt: "A bright, modern salon interior",
    taglineLead: "Look and feel your best",
    aboutLead: "is a welcoming salon",
    services: [
      { name: "Cuts & Styling", description: "Modern cuts and styling tailored to you." },
      { name: "Color", description: "Balayage, highlights, and full color by experienced stylists." },
      { name: "Treatments", description: "Conditioning and care that keeps your hair healthy." },
    ],
  },
  {
    match: ["auto", "mechanic", "repair", "tire", "garage", "car ", "automotive"],
    brandColor: "#b45309",
    template: "bold",
    ctaLabel: "Schedule service",
    heroSrc: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1600&q=80",
    heroAlt: "A clean, professional auto repair shop",
    taglineLead: "Honest auto repair done right the first time",
    aboutLead: "is a trusted local auto shop",
    services: [
      { name: "Diagnostics & Repair", description: "Accurate diagnosis and quality repairs, explained in plain English." },
      { name: "Maintenance", description: "Oil changes, brakes, and tune-ups to keep you on the road." },
      { name: "Tires", description: "Sales, mounting, balancing, and rotation." },
    ],
  },
  {
    match: ["landscap", "lawn", "garden", "tree", "pest", "cleaning", "maid", "janitor"],
    brandColor: "#15803d",
    template: "classic",
    ctaLabel: "Get a free estimate",
    heroSrc: "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=1600&q=80",
    heroAlt: "A neat, professionally maintained property",
    taglineLead: "Reliable service and results you'll notice",
    aboutLead: "is a dependable local service business",
    services: [
      { name: "Regular Service", description: "Scheduled visits that keep things looking their best." },
      { name: "One-Time Jobs", description: "Big cleanups and projects handled start to finish." },
      { name: "Free Estimates", description: "No-obligation quotes so you know the price up front." },
    ],
  },
  {
    match: ["dental", "dentist", "chiro", "clinic", "medical", "therapy", "wellness", "fitness", "gym", "yoga", "pilates"],
    brandColor: "#0e7490",
    template: "classic",
    ctaLabel: "Book a visit",
    heroSrc: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80",
    heroAlt: "A clean, calming health and wellness space",
    taglineLead: "Caring, professional service in",
    aboutLead: "is a trusted local practice",
    services: [
      { name: "New Clients Welcome", description: "Friendly, professional care from your first visit." },
      { name: "Flexible Scheduling", description: "Appointments that fit your life, including evenings." },
      { name: "Personalized Plans", description: "Care tailored to your goals and needs." },
    ],
  },
];

/** Generic fallback for industries we don't have a tailored profile for. */
const FALLBACK: IndustryProfile = {
  match: [],
  brandColor: "#0b6e4f",
  template: "classic",
  ctaLabel: "Get in touch",
  heroSrc: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
  heroAlt: "A welcoming local business storefront",
  taglineLead: "Trusted local service you can count on",
  aboutLead: "is a local business",
  services: [
    { name: "Our Services", description: "Quality work and friendly service for every customer." },
    { name: "Local & Trusted", description: "Proudly serving our community with care." },
    { name: "Get a Quote", description: "Reach out and we'll get back to you quickly." },
  ],
};

function profileFor(industry: string): IndustryProfile {
  const needle = industry.toLowerCase();
  return PROFILES.find((p) => p.match.some((m) => needle.includes(m))) ?? FALLBACK;
}

/** Title-case a free-text specialty into a service name. */
function toServiceName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Turn a sparse {@link Lead} into a complete {@link Business} the generator can
 * render into a credible, personalized demo site. Deterministic and dependency
 * free — no network calls, no LLM — so previews are stable and free to produce.
 */
export function leadToBusiness(lead: Lead): Business {
  if (!lead.name?.trim()) throw new Error("leadToBusiness: lead.name is required");
  if (!lead.industry?.trim()) throw new Error("leadToBusiness: lead.industry is required");
  if (!lead.location?.trim()) throw new Error("leadToBusiness: lead.location is required");

  const profile = profileFor(lead.industry);
  const yearsClause = lead.established
    ? ` Serving the area since ${lead.established},`
    : "";

  const tagline = `${profile.taglineLead} in ${lead.location}.`;
  const about =
    `${lead.name} ${profile.aboutLead} serving ${lead.location} and the surrounding area.` +
    `${yearsClause} we pride ourselves on great work, fair prices, and treating every` +
    ` customer like a neighbor. Get in touch to see how we can help.`;

  const services: Service[] =
    lead.specialties && lead.specialties.length
      ? lead.specialties.slice(0, 6).map((s) => ({
          name: toServiceName(s),
          description: `Professional ${s.trim().toLowerCase()} you can rely on.`,
        }))
      : profile.services;

  const heroImage: Image = {
    src: profile.heroSrc,
    alt: `${lead.name} — ${profile.heroAlt}`,
  };

  const business: Business = {
    name: lead.name.trim(),
    industry: lead.industry.trim(),
    location: lead.location.trim(),
    tagline,
    about,
    services,
    brandColor: lead.brandColor ?? profile.brandColor,
    template: profile.template,
    ctaLabel: profile.ctaLabel,
    heroImage,
    contact: {
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
    },
  };
  if (lead.established) business.established = lead.established;
  return business;
}
