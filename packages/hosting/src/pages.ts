import { escapeHtml } from "../../generator/src/index.ts";
import type { SiteRecord } from "./types.ts";

/**
 * Hosting-layer pages that are NOT the customer's generated site: the
 * payment-required gate, the 404, and a small index of live sites. Kept here so
 * the Worker and the static builder render byte-identical responses.
 */

const accent = (record: SiteRecord): string =>
  /^#[0-9a-fA-F]{6}$/.test(record.business.brandColor ?? "") ? record.business.brandColor! : "#0b6e4f";

function shell(title: string, accentColor: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${escapeHtml(title)}</title>
<style>
  :root { --accent: ${accentColor}; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center;
    font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #0c0f14; color: #e9eef5; padding: 2rem; }
  main { max-width: 34rem; text-align: center; }
  .badge { display: inline-block; padding: .35rem .8rem; border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 22%, transparent);
    color: var(--accent); font-weight: 600; font-size: .8rem; letter-spacing: .04em;
    text-transform: uppercase; margin-bottom: 1.25rem; }
  h1 { font-size: clamp(1.6rem, 4vw, 2.4rem); margin: 0 0 .75rem; }
  p { color: #aab4c0; margin: 0 0 1.5rem; }
  a.cta { display: inline-block; padding: .8rem 1.4rem; border-radius: .6rem;
    background: var(--accent); color: #fff; text-decoration: none; font-weight: 600; }
  ul { list-style: none; padding: 0; text-align: left; margin: 1.5rem auto 0; max-width: 26rem; }
  li { padding: .6rem .9rem; border: 1px solid #1d2530; border-radius: .5rem; margin-bottom: .5rem; }
  li a { color: var(--accent); text-decoration: none; }
  footer { margin-top: 2rem; color: #5b6776; font-size: .8rem; }
</style>
</head>
<body>
<main>
${body}
<footer>Hosted by Webhost AI</footer>
</main>
</body>
</html>
`;
}

/** Shown at a site's URL before payment is recorded. This IS the go-live gate. */
export function gatePage(record: SiteRecord): string {
  const name = escapeHtml(record.business.name);
  return shell(
    `${record.business.name} — coming soon`,
    accent(record),
    `<span class="badge">Payment required</span>
<h1>${name} isn't live yet</h1>
<p>This website is ready to go live. It will be published the moment payment is recorded — hosting, SSL, and your custom domain are all included.</p>
<a class="cta" href="https://webhost.ai/checkout?site=${encodeURIComponent(record.slug)}">Take it live</a>`,
  );
}

/** Generic 404 for unknown hosts/slugs. */
export function notFoundPage(): string {
  return shell(
    "Site not found",
    "#0b6e4f",
    `<span class="badge">404</span>
<h1>No site here yet</h1>
<p>This address isn't pointed at a live Webhost AI site.</p>
<a class="cta" href="https://webhost.ai">Get your site</a>`,
  );
}

/** Small index of currently-live sites (handy for verification + demos). */
export function indexPage(live: SiteRecord[]): string {
  const items = live.length
    ? live
        .map(
          (r) =>
            `<li><a href="/sites/${escapeHtml(r.slug)}/">${escapeHtml(r.business.name)}</a> — ${escapeHtml(
              r.business.industry,
            )}</li>`,
        )
        .join("\n")
    : `<li>No live sites yet.</li>`;
  return shell(
    "Webhost AI — live sites",
    "#0b6e4f",
    `<span class="badge">Live sites</span>
<h1>Published customer sites</h1>
<p>Each site below is live because its payment was recorded.</p>
<ul>
${items}
</ul>`,
  );
}
