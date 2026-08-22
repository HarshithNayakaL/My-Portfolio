import { next, rewrite } from "@vercel/edge";

/**
 * Content negotiation for agents.
 *
 * Two jobs, both keyed on the same signal — the client explicitly asked for
 * markdown:
 *
 *   1. On a real page route, serve that route's markdown twin. Every route
 *      already publishes one at <route>/index.md and advertises it with
 *      rel="alternate" type="text/markdown", which covers an agent that reads
 *      the head or llms.txt first. This covers the one that lands on the
 *      canonical URL from a web search and just sets an Accept header.
 *   2. On a path that does not exist, answer the 404 in markdown too, with
 *      the recovery links an agent needs to find its way back. A browser still
 *      gets the styled 404.html; only a client that asked for markdown gets
 *      markdown.
 *
 * Static assets are excluded by the matcher so they never invoke this at all,
 * and anything with a file extension passes straight through — without that
 * guard a request for /index.md would be rewritten to /index.md/index.md.
 */
export const config = {
  matcher: ["/((?!assets/|fonts/|icons/|shots/|_vercel/).*)"],
};

const PAGE_ROUTE = /^\/$|^\/work\/[a-z0-9-]+$|^\/legal\/[a-z0-9-]+$/;
const HAS_EXTENSION = /\.[a-z0-9]{2,5}$/i;

const ORIGIN = "https://harshith-nayaka-l-portfolio.vercel.app";

const NOT_FOUND_MD = `# 404 — page not found

That path does not exist on this site.

## Where to look instead

- [Sitemap](${ORIGIN}/sitemap.xml): every page on this site
- [llms.txt](${ORIGIN}/llms.txt): the agent index, including what this site is and is not a good source for
- [llms-full.txt](${ORIGIN}/llms-full.txt): every case study inlined in one file
- [Home](${ORIGIN}/): selected work, capabilities and contact

Each page also serves a markdown twin at its own URL with \`/index.md\` appended,
and this site answers \`Accept: text/markdown\` on any page route.
`;

/**
 * True when the client prefers markdown over HTML.
 *
 * Browsers send text/html plus a q-weighted wildcard and never name
 * text/markdown, so they fall through untouched. A bare wildcard is
 * deliberately not treated as a request for markdown: it means "anything", and
 * answering it with a raw document would hand markdown to curl, link
 * previewers and every other client that never asked.
 */
function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  let markdown = -1;
  let html = -1;
  for (const part of accept.split(",")) {
    const [typeRaw, ...params] = part.trim().split(";");
    const type = typeRaw.trim().toLowerCase();
    const qParam = params.find((p) => p.trim().startsWith("q="));
    const q = qParam ? Number.parseFloat(qParam.split("=")[1]) : 1;
    if (Number.isNaN(q)) continue;
    if (type === "text/markdown") markdown = Math.max(markdown, q);
    if (type === "text/html") html = Math.max(html, q);
  }
  if (markdown < 0) return false;
  return markdown >= html;
}

export default function middleware(request: Request) {
  if (request.method !== "GET" && request.method !== "HEAD") return next();

  const url = new URL(request.url);
  const path = url.pathname;

  if (HAS_EXTENSION.test(path)) return next();
  if (!prefersMarkdown(request.headers.get("accept"))) return next();

  if (PAGE_ROUTE.test(path)) {
    return rewrite(new URL(`${path.replace(/\/$/, "")}/index.md`, url));
  }

  return new Response(NOT_FOUND_MD, {
    status: 404,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      Vary: "Accept, Accept-Encoding",
      Link: `<${ORIGIN}/sitemap.xml>; rel="index", <${ORIGIN}/llms.txt>; rel="describedby"`,
      "X-Robots-Tag": "noindex",
    },
  });
}
