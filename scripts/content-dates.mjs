// When each page last really changed.
//
// Read once, in vite.config.ts, and injected into both bundles as
// __CONTENT_DATES__ (per group) and __PAGE_DATES__ (per case study and guide),
// so the date a page shows in its footer, the dateModified in its structured
// data, its sitemap <lastmod> and its markdown twin's last-updated are one
// value. They used to be three: the sitemap and twin read git, while the
// Article and ProfilePage schema stamped the build time, so every deploy told
// Google every page had just changed.
//
// Then they were read from git at build time, which Vercel's shallow checkout
// gets wrong: a file untouched in the last few commits came back with the
// oldest commit the clone held, so the legal pages, last edited 12 October,
// went live as 31 October. Now every date is stamped into
// src/data/page-dates.json beside a fingerprint of the source text it covers,
// and the build only reads that file. If the text changes and the date does
// not, the build fails; `npm run dates` stamps it.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
// Footer.tsx is not here: it is chrome, and a layout change to it (the
// wheelie padding) re-dated every page on the site.
const SHARED = ["src/data/seo.ts", "src/components/About.tsx"];

export const SOURCE_GROUPS = {
  home: [...SHARED, "src/data/projects.ts", "src/data/caseStudies.ts", "src/data/guides.ts", "src/data/skills.ts", "src/components/Faq.tsx", "src/components/Capabilities.tsx", "src/components/Approach.tsx", "src/era/EraHome.tsx", "index.html"],
  work: [...SHARED, "src/data/caseStudies.ts", "src/data/projects.ts", "src/data/guides.ts", "src/era/EraCaseStudy.tsx"],
  // A guide quotes the case studies, so a change to one is a change to it.
  guides: [...SHARED, "src/data/guides.ts", "src/data/caseStudies.ts", "src/era/EraGuide.tsx"],
  // Only the documents themselves: seo.ts holds every route's title, so an
  // edit to /about's title used to re-date the privacy policy.
  legal: ["src/pages/Legal.tsx"],
  profile: [...SHARED, "src/pages/Profile.tsx", "src/data/profileQA.ts"],
};

// Case studies and guides each get their own date. As a group, one link fixed
// in Nova's case study moved the date on all eighteen pages, and Google uses
// lastmod only "if it's consistently and verifiably accurate"; it also lists
// changing dates "to make them seem fresh" as a warning sign.
//
// Every other page shares its group's date: the newest change to any file
// whose text reaches it.
export const PAGE_DATES_FILE = "src/data/page-dates.json";

/** The source text each dated entry covers: `group:<name>` for a page group,
 *  the route for a case study or guide. */
export function pageSources() {
  const out = {};
  for (const [group, files] of Object.entries(SOURCE_GROUPS)) {
    const text = files.map((f) => `${f}\n${readFileSync(`${ROOT}${f}`, "utf8")}`).join("\n");
    out[`group:${group}`] = { text, files };
  }
  const studies = readFileSync(`${ROOT}src/data/caseStudies.ts`, "utf8");
  for (const m of studies.matchAll(/^const \w+: CaseStudy = \{\n  slug: "([^"]+)"[\s\S]*?^\};$/gm)) {
    out[`/work/${m[1]}`] = { text: m[0], file: "src/data/caseStudies.ts", start: m[0].split("\n")[0] };
  }
  const guides = readFileSync(`${ROOT}src/data/guides.ts`, "utf8");
  for (const m of guides.matchAll(/^  \{\n    slug: "([^"]+)"[\s\S]*?^  \},?$/gm)) {
    out[`/guides/${m[1]}`] = { text: m[0], file: "src/data/guides.ts", start: `slug: "${m[1]}"` };
  }
  return out;
}

export const fingerprint = (text) => createHash("sha256").update(text.replace(/[ \t]+$/gm, "")).digest("hex").slice(0, 16);

/** Every stamped date, checked against the current text; throws if any is stale. */
function stampedDates() {
  const stored = JSON.parse(readFileSync(`${ROOT}${PAGE_DATES_FILE}`, "utf8"));
  const stale = [];
  const dates = {};
  for (const [route, { text }] of Object.entries(pageSources())) {
    const entry = stored[route];
    if (!entry || entry.fingerprint !== fingerprint(text)) stale.push(route);
    else dates[route] = entry.modified;
  }
  if (stale.length) {
    throw new Error(`${PAGE_DATES_FILE} is out of date for ${stale.join(", ")}: run \`npm run dates\` and commit it.`);
  }
  return dates;
}

/** Last-modified date per page group. */
export function contentDates() {
  const all = stampedDates();
  return Object.fromEntries(Object.keys(SOURCE_GROUPS).map((g) => [g, all[`group:${g}`]]));
}

/** Last-modified date per case-study and guide route. */
export function pageDates() {
  return Object.fromEntries(Object.entries(stampedDates()).filter(([k]) => !k.startsWith("group:")));
}
