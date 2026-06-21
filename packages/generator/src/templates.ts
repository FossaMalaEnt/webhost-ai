import type { Business, Image, TemplateName } from "./types.ts";

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

const DEFAULT_ACCENT = "#0b6e4f";

/** Resolve a valid 6-digit hex accent color, falling back to the brand default. */
export function resolveAccent(brandColor?: string): string {
  return brandColor && /^#[0-9a-fA-F]{6}$/.test(brandColor) ? brandColor : DEFAULT_ACCENT;
}

/** Return "#111111" or "#ffffff" — whichever is readable on top of `hex`. */
function readableOn(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Perceived luminance (sRGB-ish). > 150 → light bg → dark text.
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 150 ? "#111111" : "#ffffff";
}

/** Darken a hex color by `amount` (0–1) for gradients/hover states. */
function darken(hex: string, amount: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const r = clamp(parseInt(hex.slice(1, 3), 16) * (1 - amount));
  const g = clamp(parseInt(hex.slice(3, 5), 16) * (1 - amount));
  const b = clamp(parseInt(hex.slice(5, 7), 16) * (1 - amount));
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function img(image: Image, className: string, loading: "eager" | "lazy" = "lazy"): string {
  return `<img class="${className}" src="${escapeHtml(image.src)}" alt="${escapeHtml(
    image.alt,
  )}" loading="${loading}" decoding="async" />`;
}

/** Resolve the primary call-to-action href from the available contact channels. */
function ctaHref(business: Business): string {
  const { bookingUrl, phone, email } = business.contact;
  if (bookingUrl) return bookingUrl;
  if (phone) return `tel:${phone.replace(/[^+\d]/g, "")}`;
  if (email) return `mailto:${email}`;
  return "#contact";
}

function navLinks(business: Business): { id: string; label: string }[] {
  const links: { id: string; label: string }[] = [];
  if (business.services.length) links.push({ id: "services", label: "Services" });
  if (business.gallery?.length) links.push({ id: "gallery", label: "Gallery" });
  links.push({ id: "about", label: "About" });
  if (business.hours?.length) links.push({ id: "hours", label: "Hours" });
  links.push({ id: "contact", label: "Contact" });
  return links;
}

function navbar(business: Business): string {
  const cta = escapeHtml(business.ctaLabel ?? "Get in touch");
  const links = navLinks(business)
    .map((l) => `<a href="#${l.id}">${escapeHtml(l.label)}</a>`)
    .join("\n        ");
  return `  <nav class="nav" aria-label="Primary">
    <div class="wrap nav-inner">
      <a class="brand" href="#top">${escapeHtml(business.name)}</a>
      <div class="nav-links">
        ${links}
        <a class="btn btn-sm" href="${escapeHtml(ctaHref(business))}">${cta}</a>
      </div>
    </div>
  </nav>`;
}

function servicesSection(business: Business): string {
  if (business.services.length === 0) return "";
  const cards = business.services
    .map(
      (s) => `        <article class="card">
          <h3>${escapeHtml(s.name)}</h3>
          <p>${escapeHtml(s.description)}</p>${
            s.price ? `\n          <p class="price">${escapeHtml(s.price)}</p>` : ""
          }
        </article>`,
    )
    .join("\n");
  return `    <section id="services" class="section">
      <div class="wrap">
        <p class="eyebrow">What we offer</p>
        <h2>Our services</h2>
        <div class="grid">
${cards}
        </div>
      </div>
    </section>`;
}

function gallerySection(business: Business): string {
  if (!business.gallery?.length) return "";
  const items = business.gallery.map((g) => `        ${img(g, "shot")}`).join("\n");
  return `    <section id="gallery" class="section section-alt">
      <div class="wrap">
        <p class="eyebrow">A look inside</p>
        <h2>Gallery</h2>
        <div class="gallery">
${items}
        </div>
      </div>
    </section>`;
}

function aboutSection(business: Business): string {
  const since = business.established
    ? `<p class="since">Proudly serving ${escapeHtml(business.location)} since ${business.established}.</p>`
    : "";
  const image = business.aboutImage ? `\n        ${img(business.aboutImage, "about-img")}` : "";
  const aboutClass = business.aboutImage ? "about-grid" : "";
  return `    <section id="about" class="section">
      <div class="wrap ${aboutClass}">
        <div class="about-copy">
          <p class="eyebrow">About us</p>
          <h2>${escapeHtml(business.name)}</h2>
          <p>${escapeHtml(business.about)}</p>
          ${since}
        </div>${image}
      </div>
    </section>`;
}

function hoursSection(business: Business): string {
  if (!business.hours?.length) return "";
  const rows = business.hours
    .map(
      (h) =>
        `          <tr><th scope="row">${escapeHtml(h.days)}</th><td>${escapeHtml(h.hours)}</td></tr>`,
    )
    .join("\n");
  return `    <section id="hours" class="section section-alt">
      <div class="wrap narrow">
        <p class="eyebrow">Plan your visit</p>
        <h2>Opening hours</h2>
        <table class="hours">
          <tbody>
${rows}
          </tbody>
        </table>
      </div>
    </section>`;
}

function testimonialsSection(business: Business): string {
  if (!business.testimonials?.length) return "";
  const cards = business.testimonials
    .map(
      (t) => `        <figure class="quote">
          <blockquote>&ldquo;${escapeHtml(t.quote)}&rdquo;</blockquote>
          <figcaption>— ${escapeHtml(t.author)}</figcaption>
        </figure>`,
    )
    .join("\n");
  return `    <section id="reviews" class="section">
      <div class="wrap">
        <p class="eyebrow">What people say</p>
        <h2>Reviews</h2>
        <div class="quotes">
${cards}
        </div>
      </div>
    </section>`;
}

function contactSection(business: Business): string {
  const { phone, email, address } = business.contact;
  const rows: string[] = [];
  if (phone)
    rows.push(
      `          <li><span class="label">Call</span> <a href="tel:${escapeHtml(
        phone.replace(/[^+\d]/g, ""),
      )}">${escapeHtml(phone)}</a></li>`,
    );
  if (email)
    rows.push(
      `          <li><span class="label">Email</span> <a href="mailto:${escapeHtml(
        email,
      )}">${escapeHtml(email)}</a></li>`,
    );
  if (address)
    rows.push(`          <li><span class="label">Visit</span> <span>${escapeHtml(address)}</span></li>`);
  const cta = escapeHtml(business.ctaLabel ?? "Get in touch");
  return `    <section id="contact" class="section section-cta">
      <div class="wrap narrow">
        <p class="eyebrow">Get in touch</p>
        <h2>Let's talk</h2>
        <p>Serving ${escapeHtml(business.location)}. We'd love to hear from you.</p>
        <ul class="contact-list">
${rows.join("\n")}
        </ul>
        <a class="btn btn-lg" href="${escapeHtml(ctaHref(business))}">${cta}</a>
      </div>
    </section>`;
}

function footer(business: Business): string {
  const established = business.established ? ` Est. ${business.established}.` : "";
  return `  <footer>
    <div class="wrap">
      <p>&copy; ${escapeHtml(business.name)}.${established} All rights reserved.</p>
      <p class="by">Website &amp; hosting by <a href="https://fossamalaent.github.io/webhost-ai/">Webhost AI</a>.</p>
    </div>
  </footer>`;
}

/** Schema.org LocalBusiness JSON-LD — boosts SEO + search credibility. */
function jsonLd(business: Business): string {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.tagline,
    areaServed: business.location,
  };
  if (business.contact.phone) data.telephone = business.contact.phone;
  if (business.contact.email) data.email = business.contact.email;
  if (business.contact.address) data.address = business.contact.address;
  if (business.heroImage) data.image = business.heroImage.src;
  // JSON.stringify safely escapes the values; also neutralize </script>.
  const json = JSON.stringify(data, null, 2).replace(/<\//g, "<\\/");
  return `  <script type="application/ld+json">\n${json}\n  </script>`;
}

// ---- Templates -------------------------------------------------------------

function baseStyles(accent: string): string {
  const accentDark = darken(accent, 0.25);
  const onAccent = readableOn(accent);
  return `:root {
      --accent: ${accent};
      --accent-dark: ${accentDark};
      --on-accent: ${onAccent};
      --ink: #1a1a1a;
      --muted: #5a5a5a;
      --bg: #ffffff;
      --soft: #f5f6f5;
      --line: #e6e8e6;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; color: var(--ink); background: var(--bg);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.65; -webkit-font-smoothing: antialiased; }
    a { color: var(--accent-dark); }
    img { max-width: 100%; display: block; }
    .wrap { max-width: 1040px; margin: 0 auto; padding: 0 24px; }
    .narrow { max-width: 720px; }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.78rem;
      font-weight: 600; color: var(--accent-dark); margin: 0 0 8px; }
    .section { padding: 72px 0; }
    .section-alt { background: var(--soft); }
    .section h2 { font-size: clamp(1.6rem, 4vw, 2.2rem); margin: 0 0 28px; }
    .btn { display: inline-block; background: var(--accent); color: var(--on-accent);
      text-decoration: none; font-weight: 600; padding: 12px 22px; border-radius: 999px;
      transition: transform 0.12s ease, background 0.12s ease; }
    .btn:hover { background: var(--accent-dark); transform: translateY(-1px); }
    .btn-sm { padding: 8px 16px; font-size: 0.92rem; }
    .btn-lg { padding: 15px 30px; font-size: 1.05rem; margin-top: 22px; }
    .nav { position: sticky; top: 0; z-index: 10; background: rgba(255,255,255,0.92);
      backdrop-filter: saturate(180%) blur(8px); border-bottom: 1px solid var(--line); }
    .nav-inner { display: flex; align-items: center; justify-content: space-between; height: 64px; }
    .brand { font-weight: 700; font-size: 1.15rem; color: var(--ink); text-decoration: none; }
    .nav-links { display: flex; align-items: center; gap: 22px; }
    .nav-links a { color: var(--ink); text-decoration: none; font-size: 0.95rem; }
    .nav-links a:hover { color: var(--accent-dark); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 22px; }
    .card { background: var(--bg); border: 1px solid var(--line); border-radius: 14px; padding: 26px; }
    .card h3 { margin: 0 0 8px; font-size: 1.2rem; }
    .card p { margin: 0; color: var(--muted); }
    .card .price { margin-top: 10px; font-weight: 600; color: var(--accent-dark); }
    .gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
    .gallery .shot { width: 100%; height: 220px; object-fit: cover; border-radius: 12px; }
    .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
    .about-img { width: 100%; height: 100%; max-height: 380px; object-fit: cover; border-radius: 16px; }
    .about-copy .since { color: var(--muted); font-style: italic; }
    .hours { width: 100%; border-collapse: collapse; }
    .hours th, .hours td { text-align: left; padding: 12px 0; border-bottom: 1px solid var(--line); }
    .hours td { text-align: right; color: var(--muted); }
    .quotes { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 22px; }
    .quote { margin: 0; background: var(--soft); border-radius: 14px; padding: 26px; }
    .quote blockquote { margin: 0 0 12px; font-size: 1.08rem; }
    .quote figcaption { color: var(--muted); font-weight: 600; }
    .section-cta { background: linear-gradient(135deg, var(--accent), var(--accent-dark)); color: var(--on-accent); }
    .section-cta .eyebrow, .section-cta a, .section-cta h2, .section-cta p { color: var(--on-accent); }
    .section-cta .btn { background: var(--on-accent); color: var(--accent-dark); }
    .contact-list { list-style: none; padding: 0; margin: 22px 0 0; display: grid; gap: 12px; }
    .contact-list .label { display: inline-block; min-width: 64px; font-weight: 600; opacity: 0.85; }
    footer { background: #111; color: #cfd2cf; padding: 44px 0; text-align: center; font-size: 0.95rem; }
    footer a { color: #fff; }
    footer .by { opacity: 0.65; font-size: 0.85rem; margin-top: 6px; }
    @media (max-width: 760px) {
      .section { padding: 52px 0; }
      .nav-links { gap: 14px; }
      .nav-links a:not(.btn) { display: none; }
      .about-grid { grid-template-columns: 1fr; }
    }`;
}

function classicHero(business: Business): string {
  const cta = escapeHtml(business.ctaLabel ?? "Get in touch");
  const bg = business.heroImage
    ? `background-image: linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url('${escapeHtml(
        business.heroImage.src,
      )}'); background-size: cover; background-position: center;`
    : "background: linear-gradient(135deg, var(--accent), var(--accent-dark));";
  return `  <header id="top" class="hero" style="${bg}">
    <div class="wrap hero-inner">
      <p class="hero-eyebrow">${escapeHtml(business.industry)} &middot; ${escapeHtml(business.location)}</p>
      <h1>${escapeHtml(business.name)}</h1>
      <p class="hero-tagline">${escapeHtml(business.tagline)}</p>
      <a class="btn btn-lg" href="${escapeHtml(ctaHref(business))}">${cta}</a>
    </div>
  </header>`;
}

function classicStyles(): string {
  return `    .hero { color: #fff; padding: 120px 0 110px; text-align: center; }
    .hero-inner { max-width: 760px; }
    .hero-eyebrow { text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.85rem; font-weight: 600; opacity: 0.92; margin: 0 0 14px; color: #fff; }
    .hero h1 { font-size: clamp(2.4rem, 7vw, 4rem); line-height: 1.05; margin: 0 0 16px; }
    .hero-tagline { font-size: clamp(1.1rem, 3vw, 1.45rem); opacity: 0.95; margin: 0 auto 28px; max-width: 620px; }
    .hero .btn { background: #fff; color: var(--accent-dark); }
    .hero .btn:hover { background: #f0f0f0; }`;
}

function boldHero(business: Business): string {
  const cta = escapeHtml(business.ctaLabel ?? "Get in touch");
  const media = business.heroImage
    ? `      <div class="hero-media">${img(business.heroImage, "hero-photo", "eager")}</div>`
    : "";
  return `  <header id="top" class="hero">
    <div class="wrap hero-inner">
      <div class="hero-copy">
        <p class="hero-eyebrow">${escapeHtml(business.industry)} &middot; ${escapeHtml(business.location)}</p>
        <h1>${escapeHtml(business.name)}</h1>
        <p class="hero-tagline">${escapeHtml(business.tagline)}</p>
        <a class="btn btn-lg" href="${escapeHtml(ctaHref(business))}">${cta}</a>
      </div>
${media}
    </div>
  </header>`;
}

function boldStyles(): string {
  return `    .hero { background: #0f1115; color: #fff; padding: 70px 0; }
    .hero-inner { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 48px; align-items: center; }
    .hero-eyebrow { text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.85rem; font-weight: 600; color: var(--accent); margin: 0 0 14px; }
    .hero h1 { font-size: clamp(2.6rem, 6vw, 4.4rem); line-height: 1.02; margin: 0 0 18px; letter-spacing: -0.02em; }
    .hero-tagline { font-size: clamp(1.1rem, 2.4vw, 1.4rem); color: #c9ccd2; margin: 0 0 28px; }
    .hero-photo { width: 100%; height: 420px; object-fit: cover; border-radius: 18px; }
    @media (max-width: 760px) { .hero-inner { grid-template-columns: 1fr; gap: 28px; } .hero-photo { height: 280px; } }`;
}

function head(
  business: Business,
  accent: string,
  templateCss: string,
): { title: string; description: string; html: string } {
  const title = `${business.name} — ${business.industry} in ${business.location}`;
  const description = business.tagline;
  const ogImage = business.heroImage?.src ?? "";
  const ogTag = ogImage ? `\n  <meta property="og:image" content="${escapeHtml(ogImage)}" />` : "";
  const html = `<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="theme-color" content="${accent}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />${ogTag}
  <meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}" />
${jsonLd(business)}
  <style>
${baseStyles(accent)}
${templateCss}
  </style>
</head>`;
  return { title, description, html };
}

/**
 * Render a complete, self-contained HTML document for a business.
 * Inlines CSS so the output is a single deployable file with no asset
 * dependencies (images are referenced by URL) — cheap to host per-hostname.
 */
export function renderHtml(business: Business): { html: string; title: string; description: string } {
  const accent = resolveAccent(business.brandColor);
  const template: TemplateName = business.template === "bold" ? "bold" : "classic";

  const templateCss = template === "bold" ? boldStyles() : classicStyles();
  const hero = template === "bold" ? boldHero(business) : classicHero(business);
  const { title, description, html: headHtml } = head(business, accent, templateCss);

  const sections = [
    servicesSection(business),
    gallerySection(business),
    aboutSection(business),
    hoursSection(business),
    testimonialsSection(business),
    contactSection(business),
  ]
    .filter(Boolean)
    .join("\n\n");

  const html = `<!doctype html>
<html lang="en">
${headHtml}
<body>
${navbar(business)}
${hero}
  <main>
${sections}
  </main>
${footer(business)}
</body>
</html>
`;
  return { html, title, description };
}
