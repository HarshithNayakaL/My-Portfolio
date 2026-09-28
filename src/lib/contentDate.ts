/** Page groups that share source files, and so share a last-updated date.
 *  Must match SOURCE_GROUPS in scripts/content-dates.mjs. */
export type ContentGroup = "home" | "work" | "legal" | "profile";

export const groupFor = (path: string): ContentGroup =>
  path.startsWith("/work/") ? "work"
  : path.startsWith("/legal/") ? "legal"
  : path === "/about" || path === "/contact" ? "profile"
  : "home";

/** ISO 8601 UTC ("2026-09-26T08:18:15Z") of the page's last real content
 *  change. Injected at build time, identical in the server and client bundles,
 *  and used by the prerender for dateModified, the sitemap and the twins. */
export const contentDate = (path: string): string => __CONTENT_DATES__[groupFor(path)];
