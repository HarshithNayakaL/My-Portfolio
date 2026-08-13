import { caseStudies } from "./caseStudies";
import { NAME } from "./projects";

/** Canonical origin. Every canonical/OG URL is built from this one constant,
 *  so moving to a custom domain is a one-line change here plus vercel.json. */
export const ORIGIN = "https://harshith-nayaka-l-portfolio.vercel.app";

export const SITE_TITLE = `${NAME} — AI Engineer, Full-Stack`;

export type RouteSeo = {
  /** Full <title>. Kept under ~60 chars where possible. */
  title: string;
  description: string;
  /** Absolute canonical URL for this route. */
  canonical: string;
  /** og:type — "profile" for the homepage, "article" for case studies. */
  ogType: "profile" | "article" | "website";
};

const abs = (path: string) => `${ORIGIN}${path === "/" ? "/" : path}`;

/**
 * Every route the site serves, with its own title/description/canonical.
 *
 * Before this existed, index.html carried one hardcoded canonical pointing at
 * "/", which every route inherited — that tells Google the case study pages
 * are duplicates of the homepage and should not be indexed separately. Each
 * route now declares its own.
 */
export const routeSeo: Record<string, RouteSeo> = {
  "/": {
    title: `${SITE_TITLE} | Bengaluru`,
    description:
      "Full-stack AI Engineer in Bengaluru (Bangalore), India. I build AI agents, RAG pipelines and LLM apps, plus the backends and interfaces around them.",
    canonical: abs("/"),
    ogType: "profile",
  },
};

// Case studies: title/description derived from the case study data itself so
// the two can never drift apart. Description comes from metaDescription, not
// `outcome` — outcome is page prose and ranged from 99 to 213 characters,
// which search engines flag as too short or too long at both ends.
for (const [slug, cs] of Object.entries(caseStudies)) {
  routeSeo[`/work/${slug}`] = {
    title: `${cs.title} — ${cs.kicker} | ${NAME}`,
    description: cs.metaDescription,
    canonical: abs(`/work/${slug}`),
    ogType: "article",
  };
}

const legal: Record<string, { title: string; description: string }> = {
  privacy: {
    title: "Privacy Policy",
    description:
      "Privacy policy for this portfolio: what the contact form collects, why, how long it is kept, and your choices. No tracking, advertising or data sales.",
  },
  terms: {
    title: "Terms of Use",
    description:
      "Terms of use for this portfolio site: how the content and code may be used, what is provided as-is, and the limits of any liability.",
  },
  cookies: {
    title: "Cookie Policy",
    description:
      "Cookie policy for this site: no tracking or advertising cookies are used. The only value stored is your light or dark theme preference.",
  },
};

for (const [doc, meta] of Object.entries(legal)) {
  routeSeo[`/legal/${doc}`] = {
    title: `${meta.title} | ${NAME}`,
    description: meta.description,
    canonical: abs(`/legal/${doc}`),
    ogType: "website",
  };
}

/** Every path the prerenderer should emit as static HTML. */
export const allRoutes = Object.keys(routeSeo);

export const getRouteSeo = (path: string): RouteSeo =>
  routeSeo[path] ?? routeSeo["/"];
