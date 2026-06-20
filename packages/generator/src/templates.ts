import type { Business } from "./types.ts";

/** Escape a string for safe interpolation into HTML text/attributes. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Lowercase, URL-safe slug from arbitrary text. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function contactLine(business: Business): string {
  const { phone, email, address } = business.contact;
  const parts: string[] = [];
  if (phone) parts.push(`<a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a>`);
  if (email) parts.push(`<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`);
  if (address) parts.push(`<span>${escapeHtml(address)}</span>`);
  return parts.join(" &middot; ");
}

function servicesGrid(business: Business): string {
  if (business.services.length === 0) return "";
  const cards = business.services
    .map(
      (s) => `      <article class="card">
        <h3>${escapeHtml(s.name)}</h3>
        <p>${escapeHtml(s.description)}</p>
      </article>`,
    )
    .join("\n");
  return `  <section id="services" class="section">
    <h2>What we do</h2>
    <div class="grid">
${cards}
    </div>
  </section>`;
}

/**
 * Render a complete, self-contained HTML document for a business.
 * Inlines CSS so the output is a single deployable file with no asset
 * dependencies — cheap to host and trivial to serve per-hostname.
 */
export function renderHtml(business: Business): string {
  const accent = business.brandColor && /^#[0-9a-fA-F]{6}$/.test(business.brandColor)
    ? business.brandColor
    : "#0b6e4f";
  const title = `${business.name} — ${business.industry}`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(business.tagline)}" />
  <style>
    :root { --accent: ${accent}; --ink: #1a1a1a; --muted: #5a5a5a; --bg: #ffffff; --soft: #f6f7f6; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: var(--ink); background: var(--bg); line-height: 1.6; }
    a { color: var(--accent); }
    .wrap { max-width: 960px; margin: 0 auto; padding: 0 20px; }
    header.hero { background: linear-gradient(135deg, var(--accent), #000); color: #fff; padding: 80px 0; }
    header.hero .wrap { text-align: center; }
    header.hero h1 { font-size: clamp(2rem, 6vw, 3.4rem); margin: 0 0 12px; }
    header.hero p { font-size: clamp(1.05rem, 3vw, 1.4rem); opacity: 0.92; margin: 0 auto; max-width: 640px; }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.8rem; opacity: 0.85; margin-bottom: 8px; }
    .section { padding: 56px 0; }
    .section h2 { font-size: 1.8rem; margin-top: 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }
    .card { background: var(--soft); border-radius: 12px; padding: 22px; }
    .card h3 { margin: 0 0 8px; }
    .card p { margin: 0; color: var(--muted); }
    #about { background: var(--soft); }
    footer { background: #111; color: #ddd; padding: 40px 0; text-align: center; font-size: 0.95rem; }
    footer a { color: #fff; }
    .contact-line { margin-top: 10px; }
    @media (max-width: 600px) { .section { padding: 40px 0; } }
  </style>
</head>
<body>
  <header class="hero">
    <div class="wrap">
      <div class="eyebrow">${escapeHtml(business.industry)} &middot; ${escapeHtml(business.location)}</div>
      <h1>${escapeHtml(business.name)}</h1>
      <p>${escapeHtml(business.tagline)}</p>
    </div>
  </header>

  <main class="wrap">
${servicesGrid(business)}

    <section id="about" class="section" style="border-radius:12px; padding-left:22px; padding-right:22px;">
      <h2>About us</h2>
      <p>${escapeHtml(business.about)}</p>
    </section>

    <section id="contact" class="section">
      <h2>Get in touch</h2>
      <p>Serving ${escapeHtml(business.location)}.</p>
      <p class="contact-line">${contactLine(business)}</p>
    </section>
  </main>

  <footer>
    <div class="wrap">
      <p>&copy; ${escapeHtml(business.name)}. All rights reserved.</p>
      <p style="opacity:0.6;font-size:0.85rem;">Website &amp; hosting by Webhost AI.</p>
    </div>
  </footer>
</body>
</html>
`;
}
