import { next, rewrite } from "@vercel/edge";

/**
 * Serve the markdown twin when a client asks for markdown.
 *
 * Every route already publishes a clean markdown version at <route>/index.md
 * and advertises it with rel="alternate" type="text/markdown". That covers an
 * agent that reads the head or llms.txt first. This covers the other path: an
 * agent that lands on the canonical URL from a web search and simply asks for
 * markdown in its Accept header (the acceptmarkdown.com convention).
 *
 * The matcher lists page routes explicitly rather than using a catch-all, so
 * assets, the markdown files themselves, llms.txt and unknown paths never
 * enter the function at all — unknown paths in particular must keep reaching
 * Vercel's 404 handling untouched.
 */
export const config = {
  matcher: [
    "/",
    "/work/:slug",
    "/legal/:doc",
  ],
};

/**
 * True when the client prefers markdown over HTML.
 *
 * Browsers send text/html with a q-weighted wildcard, which contains no
 * text/markdown at all, so they fall through untouched. A wildcard alone is
 * not treated as a request for markdown — a bare wildcard means "anything", and
 * answering it with markdown would hand a raw document to any client that
 * didn't care, including curl and link previewers.
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
  if (!prefersMarkdown(request.headers.get("accept"))) return next();

  const url = new URL(request.url);
  const base = url.pathname.replace(/\/$/, "");
  return rewrite(new URL(`${base}/index.md`, url));
}
