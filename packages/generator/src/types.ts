/** A service a business offers, shown in the services grid. */
export interface Service {
  name: string;
  description: string;
}

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
  };
  /** Brand accent color as a hex string, e.g. "#0b6e4f". Optional. */
  brandColor?: string;
}

/** Result of generating a site: the HTML plus metadata. */
export interface GeneratedSite {
  html: string;
  /** URL-safe slug derived from the business name. */
  slug: string;
}
