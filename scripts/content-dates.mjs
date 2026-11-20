// When each group of pages last really changed, from git.
//
// Computed once, in vite.config.ts, and injected into both bundles as
// __CONTENT_DATES__, so the date a page shows in its footer, the dateModified
// in its structured data, its sitemap <lastmod> and its markdown twin's
// last-updated are one value. They used to be three: the sitemap and twin
// read git, while the Article and ProfilePage schema stamped the build time,
// so every deploy told Google every page had just changed.
//
// A page's date is the newest commit to any file whose text reaches it. Pages
// in a group share their sources, so they share a date.
import { execFileSync } from "node:child_process";
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

const iso = (d) => new Date(d).toISOString().replace(/\.\d{3}Z$/, "Z");

export function contentDates() {
  const now = iso(Date.now());
  return Object.fromEntries(
    Object.entries(SOURCE_GROUPS).map(([group, files]) => {
      try {
        const out = execFileSync("git", ["log", "-1", "--format=%cI", "--", ...files], {
          cwd: ROOT,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        }).trim();
        // No git, or no history for these paths in a shallow clone: fall back
        // to the build time rather than failing the build.
        return [group, out ? iso(out) : now];
      } catch {
        return [group, now];
      }
    }),
  );
}

// Case studies and guides each get their own date. As a group, one link fixed
// in Nova's case study moved the date on all eighteen pages, and Google uses
// lastmod only "if it's consistently and verifiably accurate"; it also lists
// changing dates "to make them seem fresh" as a warning sign.
//
// Their dates live in src/data/page-dates.json beside a fingerprint of the
// source text each page is built from, not in git: Vercel's checkout is
// shallow, and history that stops short of a page's last edit would date it
// to whatever commit the clone happens to start at. If a page's text changes
// and its date does not, the build fails; `npm run dates` stamps it.
export const PAGE_DATES_FILE = "src/data/page-dates.json";

/** The source text each case-study and guide page is built from, by route. */
export function pageSources() {
  const out = {};
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

/** Last-modified date per case-study and guide route; throws if any is stale. */
export function pageDates() {
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
