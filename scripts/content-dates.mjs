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
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SHARED = ["src/data/seo.ts", "src/components/About.tsx", "src/components/Footer.tsx"];

export const SOURCE_GROUPS = {
  home: [...SHARED, "src/data/projects.ts", "src/data/caseStudies.ts", "src/data/skills.ts", "src/components/Faq.tsx", "src/components/Hero.tsx", "index.html"],
  work: [...SHARED, "src/data/caseStudies.ts", "src/data/projects.ts", "src/pages/CaseStudy.tsx"],
  legal: ["src/data/seo.ts", "src/components/Footer.tsx", "src/pages/Legal.tsx"],
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
