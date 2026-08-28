import { next, rewrite } from "@vercel/edge";

/**
 * Edge routing for agents.
 *
 * Four jobs, all of them about handing a non-browser client the representation
 * it can actually use:
 *
 *   1. Content negotiation. A client that asks for markdown — via `Accept:
 *      text/markdown`, via `?mode=agent`, or by being a known answer-engine
 *      crawler — gets the route's markdown twin instead of the HTML page.
 *   2. A markdown 404 for a client that asked for markdown, with the recovery
 *      links it needs to find its way back.
 *   3. Routing the extensionless API paths (/api/v1/projects) onto the static
 *      JSON the build emits (/api/v1/projects.json).
 *   4. A JSON error body for anything else under /api. An agent that gets a
 *      126KB HTML error page back from an API call has no way to tell a
 *      missing record from a broken one.
 *
 * Static assets are excluded by the matcher so they never invoke this at all,
 * and anything with a file extension outside /api passes straight through —
 * without that guard a request for /index.md would be rewritten to
 * /index.md/index.md.
 */
export const config = {
  matcher: ["/((?!assets/|fonts/|icons/|shots/|_vercel/).*)"],
};

const PAGE_ROUTE = /^\/$|^\/work\/[a-z0-9-]+$|^\/legal\/[a-z0-9-]+$/;
const HAS_EXTENSION = /\.[a-z0-9]{2,5}$/i;

const ORIGIN = "https://harshith-nayaka-l-portfolio.vercel.app";

/**
 * The API's route table, mirrored here so a bad slug can be answered with JSON
 * rather than falling through to the HTML 404 page. `scripts/build-api.mjs`
 * fails the build if either set drifts from the data.
 */
const API_COLLECTIONS = new Set(["profile", "projects", "case-studies", "faqs"]);
const PROJECT_SLUGS = new Set([
  "creative-ops-pipeline",
  "craftconnect",
  "maestro",
  "cannon",
  "replydesk",
  "nova-ai",
  "blogspace",
  "ai-notes",
]);
const CASE_STUDY_SLUGS = new Set([
  "craftconnect",
  "creative-ops-pipeline",
  "replydesk",
  "blogspace",
  "cannon",
  "nova-ai",
  "ai-notes",
  "maestro",
]);

/**
 * Answer-engine crawlers that read a page to answer a question, rather than to
 * rank it. They get markdown directly: same content, no navigation chrome, no
 * client-side rendering to guess at.
 *
 * Googlebot and Bingbot are deliberately absent. They index the HTML that
 * human visitors see, and handing them a different representation of the page
 * is the thing search engines call cloaking.
 */
const MARKDOWN_BOTS =
  /(GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-User|Claude-SearchBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|meta-externalagent|Meta-ExternalFetcher|DuckAssistBot|YouBot|cohere-ai|MistralAI-User|DeepSeekBot|ora-agent|ora-scan)/i;

const NOT_FOUND_MD = `# 404 — page not found

That path does not exist on this site.

## Where to look instead

- [Sitemap](${ORIGIN}/sitemap.xml): every page on this site
- [llms.txt](${ORIGIN}/llms.txt): the agent index, including what this site is and is not a good source for
- [llms-full.txt](${ORIGIN}/llms-full.txt): every case study inlined in one file
- [API](${ORIGIN}/api/llms.txt): the same content as read-only JSON
- [Home](${ORIGIN}/): selected work, capabilities and contact

Each page also serves a markdown twin at its own URL with \`/index.md\` appended,
and this site answers \`Accept: text/markdown\` and \`?mode=agent\` on any page route.
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

function jsonError(
  status: number,
  code: string,
  message: string,
  hint: string,
): Response {
  return new Response(
    `${JSON.stringify(
      { error: { code, message, hint, documentation: `${ORIGIN}/openapi.json` } },
      null,
      2,
    )}\n`,
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=0, must-revalidate",
        Link: `<${ORIGIN}/openapi.json>; rel="service-desc", <${ORIGIN}/.well-known/api-catalog>; rel="api-catalog"`,
        "X-Robots-Tag": "noindex",
      },
    },
  );
}

/** Map an extensionless API path onto the static JSON the build emitted. */
function routeApi(path: string, url: URL): Response {
  if (path === "/api") return rewrite(new URL("/api/index.json", url));
  if (path === "/api/v1") return rewrite(new URL("/api/v1/index.json", url));

  const one = path.match(/^\/api\/v1\/([a-z-]+)$/);
  if (one) {
    return API_COLLECTIONS.has(one[1])
      ? rewrite(new URL(`/api/v1/${one[1]}.json`, url))
      : jsonError(
          404,
          "unknown_collection",
          `There is no "${one[1]}" collection in v1 of this API.`,
          "GET /api/v1 lists every collection this version serves.",
        );
  }

  const item = path.match(/^\/api\/v1\/(projects|case-studies)\/([a-z0-9-]+)$/);
  if (item) {
    const [, collection, slug] = item;
    const known = collection === "projects" ? PROJECT_SLUGS : CASE_STUDY_SLUGS;
    return known.has(slug)
      ? rewrite(new URL(`/api/v1/${collection}/${slug}.json`, url))
      : jsonError(
          404,
          "not_found",
          `No ${collection.replace("-", " ")} record with the slug "${slug}".`,
          `GET /api/v1/${collection} lists every valid slug.`,
        );
  }

  if (/^\/api\/v[0-9]+/.test(path)) {
    return jsonError(
      404,
      "unknown_route",
      `${path} is not a route in this API.`,
      "GET /api/v1 lists every collection, or read /openapi.json for the full route table.",
    );
  }

  return jsonError(
    404,
    "unknown_version",
    `${path} is not a version of this API.`,
    "v1 is the only version. Start at /api for the version index.",
  );
}

export default function middleware(request: Request) {
  if (request.method !== "GET" && request.method !== "HEAD") return next();

  const url = new URL(request.url);
  const path = url.pathname.replace(/(.)\/$/, "$1");

  // The API answers in JSON, including when it has nothing to answer with.
  // Its own static .json files carry an extension and pass through untouched.
  if (path === "/api" || path.startsWith("/api/")) {
    if (HAS_EXTENSION.test(path)) return next();
    return routeApi(path, url);
  }

  if (HAS_EXTENSION.test(path)) return next();

  const asked =
    prefersMarkdown(request.headers.get("accept")) ||
    url.searchParams.get("mode") === "agent" ||
    MARKDOWN_BOTS.test(request.headers.get("user-agent") ?? "");

  if (!asked) return next();

  if (PAGE_ROUTE.test(path)) {
    return rewrite(new URL(`${path === "/" ? "" : path}/index.md`, url));
  }

  return new Response(NOT_FOUND_MD, {
    status: 404,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      Vary: "Accept, Accept-Encoding, User-Agent",
      Link: `<${ORIGIN}/sitemap.xml>; rel="index", <${ORIGIN}/llms.txt>; rel="describedby"`,
      "X-Robots-Tag": "noindex",
    },
  });
}
