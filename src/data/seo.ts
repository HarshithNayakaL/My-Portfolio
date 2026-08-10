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
      "Harshith Nayaka L is a full-stack AI Engineer based in Bengaluru, building AI agents, RAG pipelines, LLM apps, and the production backends and interfaces around them. Currently AI Workflow Engineer at DemandNXT.",
    canonical: abs("/"),
    ogType: "profile",
  },
};

// Case studies: title/description derived from the case study data itself so
// the two can never drift apart.
for (const [slug, cs] of Object.entries(caseStudies)) {
  routeSeo[`/work/${slug}`] = {
    title: `${cs.title} — ${cs.kicker} | ${NAME}`,
    description: cs.outcome,
    canonical: abs(`/work/${slug}`),
    ogType: "article",
  };
}

const legal: Record<string, { title: string; description: string }> = {
  privacy: {
    title: "Privacy Policy",
    description:
      "What this site collects (almost nothing), why, and your choices. No tracking, no advertising, no data sales.",
  },
  terms: {
    title: "Terms of Use",
    description: "Terms governing use of this portfolio site and its content.",
  },
  cookies: {
    title: "Cookie Policy",
    description:
      "This site uses no tracking or advertising cookies. The only stored value is your light/dark theme preference.",
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
