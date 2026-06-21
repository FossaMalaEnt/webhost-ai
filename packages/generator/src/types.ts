/** A service a business offers, shown in the services grid. */
export interface Service {
  name: string;
  description: string;
  /** Optional price/label, e.g. "from $89" — shown under the service. */
  price?: string;
}

/** An image with required alt text (alt text is non-negotiable for a11y + SEO). */
export interface Image {
  /** URL or path to the image. */
  src: string;
  /** Descriptive alt text. */
  alt: string;
}

/** A short customer testimonial. */
export interface Testimonial {
  quote: string;
  author: string;
}

/** Opening hours row, e.g. { days: "Mon–Fri", hours: "9am – 6pm" }. */
export interface Hours {
  days: string;
  hours: string;
}

/** Visual template to render the site with. */
export type TemplateName = "classic" | "bold";

/** Everything we need to generate a small-business website. */
export interface Business {
  /** Business display name, e.g. "Bella's Trattoria". */
  name: string;
  /** Short industry/category, e.g. "Italian Restaurant". */
  industry: string;
  /** One-line value proposition shown in the hero. */
  tagline: string;
  /** Longer "about" paragraph. */
  about: string;
  /** City / area served, e.g. "Austin, TX". */
  location: string;
  services: Service[];
  contact: {
    phone?: string;
    email?: string;
    address?: string;
    /** Optional booking/quote URL used by the primary call-to-action. */
    bookingUrl?: string;
  };
  /** Brand accent color as a hex string, e.g. "#0b6e4f". Optional. */
  brandColor?: string;
  /** Which template to render. Defaults to "classic". */
  template?: TemplateName;
  /** Hero/background image. Falls back to a generated gradient if omitted. */
  heroImage?: Image;
  /** Image shown alongside the about section. Optional. */
  aboutImage?: Image;
  /** Optional photo gallery. */
  gallery?: Image[];
  /** Optional opening-hours table. */
  hours?: Hours[];
  /** Optional customer testimonials. */
  testimonials?: Testimonial[];
  /** Label for the primary call-to-action button. Defaults to "Get in touch". */
  ctaLabel?: string;
  /** Year the business was established, e.g. 1998. Shown for credibility. */
  established?: number;
}

/** Result of generating a site: the HTML plus metadata. */
export interface GeneratedSite {
  html: string;
  /** URL-safe slug derived from the business name. */
  slug: string;
  /** Final <title> used (handy for indexes/previews). */
  title: string;
  /** Meta description used. */
  description: string;
  /** Template the site was rendered with. */
  template: TemplateName;
  /** Size of the generated HTML in bytes. */
  bytes: number;
}
