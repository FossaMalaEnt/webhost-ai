import type { Lead, OutreachDraft } from "./types.ts";

/**
 * Draft personalized outreach for a lead. Deterministic and template-based
 * (no LLM): every message is grounded in real lead facts — name, location,
 * and a live preview link — so it reads as written-for-them, not spam.
 *
 * The hook adapts to *why* the lead was sourced (weak/no web presence), which
 * is the whole pitch: "you don't have a real site; here's one we already built
 * for you, live, free to look at."
 */

const PRESENCE_HOOK: Record<NonNullable<Lead["webPresence"]>, string> = {
  none: "I noticed {name} doesn't have a website yet",
  "facebook-only": "I noticed {name} is on Facebook but doesn't have its own website",
  "outdated-site": "I came across {name} online and thought your website could do a lot more for you",
  "directory-only": "I found {name} in a local directory but couldn't find a website for you",
};

function hookFor(lead: Lead): string {
  const template = PRESENCE_HOOK[lead.webPresence ?? "none"];
  return template.replace("{name}", lead.name);
}

function greeting(lead: Lead): string {
  return lead.owner ? `Hi ${lead.owner.split(" ")[0]},` : `Hi there,`;
}

/** Build the email + SMS drafts for a single lead and its live preview URL. */
export function draftOutreach(lead: Lead, previewUrl: string): OutreachDraft {
  const hook = hookFor(lead);
  const subject = `A free website preview for ${lead.name}`;

  const email = [
    greeting(lead),
    "",
    `${hook} — so I built one for you to see what it could look like.`,
    "",
    `It's a real, live page (mobile-friendly, fast, ready to go), made just for ${lead.name} in ${lead.location}:`,
    "",
    previewUrl,
    "",
    "If you like it, we can have it live on your own domain — with hosting included — for one simple monthly price. Nothing to install, no separate hosting bill, and you only pay once you're happy with it.",
    "",
    "Want me to tweak anything on the preview — your services, photos, colors, hours? Just reply and I'll update it.",
    "",
    "Best,",
    "The Webhost AI team",
    "hello@webhost.ai",
  ].join("\n");

  const sms =
    `${greeting(lead)} ${hook}, so I made a free preview of one for ${lead.name}: ` +
    `${previewUrl} — live, mobile-friendly, hosting included if you like it. ` +
    `Happy to tweak anything. — Webhost AI`;

  return { subject, email, sms };
}
