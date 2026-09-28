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

const PAGE_ROUTE = /^\/$|^\/(about|contact)$|^\/work\/[a-z0-9-]+$|^\/legal\/[a-z0-9-]+$/;

/**
 * `<route>.md` as well as `<route>/index.md`.
 *
 * llms.txt v2 specifies the index.md form for extensionless routes, and that
 * is what the pages advertise. But the reflex of an agent handed a URL is to
 * append `.md` to it, and a 404 there reads as "this site has no markdown"
 * even though every page has had a twin all along. Both spellings now resolve
 * to the same file; the advertised one stays canonical.
 */
const DOT_MD_ROUTE = /^(\/work\/[a-z0-9-]+|\/legal\/[a-z0-9-]+|\/about|\/contact|\/index)\.md$/;
const HAS_EXTENSION = /\.[a-z0-9]{2,5}$/i;

/**
 * `<document>.md` for a document that is not a page: /llms.txt.md,
 * /openapi.json.md, /.well-known/api-catalog.md. An agent that learned "append
 * .md for markdown" applies it to every URL it holds, and a 404 there reads as
 * "this site has no markdown" rather than "that one is already plain text".
 */
const RESOURCE_MD =
  /^(\/(?:[a-z0-9._-]+\/)*[a-z0-9_-]+\.(?:txt|json|yaml|xml|jsonl)|\/\.well-known\/(?:api-catalog|mcp))\.md$/i;

/**
 * Extensionless paths that vercel.json rewrites to a static file. Middleware
 * runs before rewrites, so without this a client sending Accept: *\/* (curl,
 * fetch, most agents) fell through to the markdown 404 below — the developer
 * portal and the RFC 9727 api-catalog answered browsers and nobody else.
 * Keep in step with the "rewrites" block in vercel.json.
 */
const REWRITTEN_ROUTE = /^\/(developers|docs|\.well-known\/api-catalog|\.well-known\/mcp)$/;

const ORIGIN = "https://harshith-nayaka-l-portfolio.vercel.app";

/**
 * The API's route table, mirrored here so a bad slug can be answered with JSON
 * rather than falling through to the HTML 404 page. `scripts/build-api.mjs`
 * fails the build if either set drifts from the data.
 */
const API_COLLECTIONS = new Set(["profile", "projects", "case-studies", "faqs", "skills"]);
const PROJECT_SLUGS = new Set([
  "spectra",
  "personal-os-mcp",
  "brandforge",
  "brand-audit-platform",
  "creative-ops-pipeline",
  "craftconnect",
  "maestro",
  "cannon",
  "replydesk",
  "nova-ai",
  "ai-notes",
]);
const CASE_STUDY_SLUGS = new Set([
  "spectra",
  "personal-os-mcp",
  "craftconnect",
  "brandforge",
  "brand-audit-platform",
  "creative-ops-pipeline",
  "replydesk",
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
/**
 * Clients that genuinely need the HTML document even though they send a
 * wildcard Accept header: search crawlers, which must see exactly what a
 * visitor sees, and link unfurlers, which read og: tags out of <head>.
 *
 * This list can be enumerated and stays still. The set of "things that are an
 * AI agent" cannot, which is why the fallback below is framed the other way
 * round — anything that did not ask for HTML and is not one of these gets the
 * markdown twin.
 */
const WANTS_HTML =
  /(Googlebot|Google-InspectionTool|Storebot-Google|Bingbot|BingPreview|Slurp|DuckDuckBot|YandexBot|Baiduspider|Sogou|Exabot|ia_archiver|Twitterbot|facebookexternalhit|LinkedInBot|Slackbot|Discordbot|TelegramBot|WhatsApp|SkypeUriPreview|redditbot|Pinterest|vkShare|embedly|Iframely|Lighthouse|Chrome-Lighthouse|PageSpeed|GTmetrix|Applebot(?!-Extended))/i;

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
/**
 * Should this client get the markdown twin rather than the HTML document?
 *
 * Two ways to qualify. Either it asked — `Accept: text/markdown`, `?mode=agent`,
 * or a named model crawler — or it never asked for HTML in the first place.
 *
 * That second clause is the important one. Matching a list of known agent
 * user-agents meant every agent *not* on the list was handed the full 110KB
 * HTML document, which is where the truncated-page reports came from: an
 * allowlist of "things that are an AI agent" is unbounded and permanently out
 * of date. Turning it around removes the guessing — a browser always names
 * text/html in Accept, while a scripted client (requests, fetch, curl, an
 * agent's HTTP layer) sends a bare wildcard or nothing at all. The clients
 * that send a wildcard and still need real HTML are search crawlers and link
 * unfurlers, which are a finite, stable set, so those are named explicitly.
 */
export function servesMarkdown({
  accept,
  ua,
  mode,
}: {
  accept: string | null;
  ua: string | null;
  mode: string | null;
}): boolean {
  const agent = ua ?? "";
  if (prefersMarkdown(accept) || mode === "agent" || MARKDOWN_BOTS.test(agent)) {
    return true;
  }
  if (WANTS_HTML.test(agent)) return false;
  return !(accept ?? "").toLowerCase().includes("text/html");
}

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

const PAGED = new Set(["projects", "case-studies", "faqs", "skills"]);

/**
 * One page of a list collection. Every list is small enough to serve whole,
 * so paging is opt-in: ?limit and ?cursor slice the same static file, and the
 * cursor is an opaque offset so it can become something else without
 * breaking a client that only passes it back.
 */
async function pageOf(file: string, url: URL): Promise<Response> {
  const limitParam = url.searchParams.get("limit");
  const cursorParam = url.searchParams.get("cursor");
  const limit = limitParam === null ? null : Number(limitParam);
  if (limit !== null && !(Number.isInteger(limit) && limit >= 1 && limit <= 50)) {
    return jsonError(400, "invalid_parameter", `limit must be a whole number from 1 to 50, not "${limitParam}".`, "Omit limit for the whole collection.");
  }
  let offset = 0;
  if (cursorParam !== null) {
    const decoded = (() => {
      try {
        return atob(cursorParam.replace(/-/g, "+").replace(/_/g, "/"));
      } catch {
        return "";
      }
    })();
    const m = decoded.match(/^o:(\d+)$/);
    if (!m) {
      return jsonError(400, "invalid_cursor", "cursor is not one this API issued.", "Pass next_cursor from the previous page unchanged, or omit cursor to start from the first page.");
    }
    offset = Number(m[1]);
  }
  const res = await fetch(new URL(file, url));
  if (!res.ok) return jsonError(502, "unavailable", "The collection could not be read.", "Try again shortly.");
  const list = (await res.json()) as { data: unknown[]; _links?: Record<string, unknown> };
  const size = limit ?? list.data.length;
  const data = list.data.slice(offset, offset + size);
  const end = offset + data.length;
  const hasMore = end < list.data.length;
  const nextCursor = hasMore ? btoa(`o:${end}`).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : null;
  const self = new URL(url.pathname + url.search, ORIGIN);
  const next = new URL(self);
  if (nextCursor) next.searchParams.set("cursor", nextCursor);
  return new Response(
    `${JSON.stringify(
      {
        ...list,
        count: data.length,
        total: list.data.length,
        has_more: hasMore,
        next_cursor: nextCursor,
        data,
        _links: { ...list._links, self: self.href, ...(nextCursor ? { next: next.href } : {}) },
      },
      null,
      2,
    )}\n`,
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Access-Control-Allow-Origin": "*",
        Link: `<${ORIGIN}/openapi.json>; rel="service-desc"${nextCursor ? `, <${next.href}>; rel="next"` : ""}`,
        "X-Robots-Tag": "noindex",
      },
    },
  );
}

/** Map an extensionless API path onto the static JSON the build emitted. */
function routeApi(path: string, url: URL): Response | Promise<Response> {
  if (path === "/api") return rewrite(new URL("/api/index.json", url));
  if (path === "/api/v1") return rewrite(new URL("/api/v1/index.json", url));

  const paged = url.searchParams.has("limit") || url.searchParams.has("cursor");

  if (path === "/api/v1/case-studies" && url.searchParams.has("view")) {
    const view = url.searchParams.get("view");
    if (view === "full") {
      return paged ? pageOf("/api/v1/case-studies.full.json", url) : rewrite(new URL("/api/v1/case-studies.full.json", url));
    }
    if (view !== "summary") {
      return jsonError(
        400,
        "invalid_parameter",
        `view must be "summary" or "full", not "${view}".`,
        "Omit view for summaries, or use view=full for every case study in full.",
      );
    }
  }

  const one = path.match(/^\/api\/v1\/([a-z-]+)$/);
  if (one) {
    if (paged && PAGED.has(one[1])) return pageOf(`/api/v1/${one[1]}.json`, url);
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


// ------------------------------------------------------------------ MCP server
//
// A read-only Model Context Protocol server over the same content as the JSON
// API, so an MCP client (Claude, ChatGPT, an IDE agent) can add this site as a
// server and call it natively instead of scraping pages.
//
// Streamable HTTP transport, spec 2025-11-25, in its simplest conforming
// shape: every request gets one application/json response, there are no
// server-initiated messages, so GET is 405 rather than an SSE stream, and no
// sessions. Each tool reads the static JSON the build already emits, so the
// server can never disagree with the API or the pages.
//
// The tool table is exported so scripts/build-api.mjs can generate the server
// card from it: one list, so the card cannot advertise a tool this handler
// does not serve.
//
// No authentication, deliberately: everything it returns is already public on
// this site. That is also why any https Origin is accepted. The spec's
// Origin check exists to stop DNS rebinding against servers on a local
// network, and a public read-only host has nothing for that to reach.

export const MCP_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26"];

const MCP_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id, Last-Event-ID",
};

type McpResult = { data: unknown; text?: string; error?: string };

type McpTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  /** Reads the static JSON the build emitted and shapes it for the call. */
  run: (args: Record<string, unknown>, url: URL) => Promise<McpResult>;
};

type McpResource = { uri: string; name: string; title: string; description?: string; mimeType: string };

type McpServer = {
  name: string;
  title: string;
  description: string;
  instructions: string;
  tools: McpTool[];
  /** Readable documents, listed by resources/list and served by resources/read. */
  resources: (url: URL) => Promise<McpResource[]>;
};

// The same image the site uses for its logo, so a client listing the server
// shows the brand a person already saw on the page.
export const MCP_ICONS = [
  { src: `${ORIGIN}/logo.png`, mimeType: "image/png", sizes: ["512x512"] },
  { src: `${ORIGIN}/favicon.svg`, mimeType: "image/svg+xml", sizes: ["any"] },
];

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const words = (s: string) => new Set(terms(s));

export const MCP_TOOLS: McpTool[] = [
  {
    name: "get_profile",
    title: "Profile",
    description:
      "Who Harshith Nayaka L is: role, employer, location, availability, contact email and public profiles. Start here for questions about the person rather than a project.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: async (_args, url) => ({ data: await loadJson(url, "/api/v1/profile.json") }),
  },
  {
    name: "list_projects",
    title: "Projects",
    description:
      "Every project in the portfolio with a one-line outcome, tags, status, links and its slug, optionally narrowed to one topic. Use the slug with get_case_study for the full write-up.",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description:
            "Only projects whose title, outcome or tags mention this, e.g. \"RAG\", \"MCP\", \"WhatsApp\", \"multi-agent\". Omit for every project.",
        },
      },
      additionalProperties: false,
    },
    run: async (args, url) => {
      const list = await loadJson<{ data: (Project & { tags?: string[] })[] }>(url, "/api/v1/projects.json");
      const topic = terms(text(args.topic));
      if (!topic.length) return { data: list };
      const data = list.data.filter((p) => {
        const w = words(`${p.title} ${p.kicker ?? ""} ${p.outcome} ${(p.tags ?? []).join(" ")}`);
        return topic.some((t) => w.has(t));
      });
      return { data: { ...list, count: data.length, data, topic: text(args.topic) } };
    },
  },
  {
    name: "get_case_study",
    title: "Case study",
    description:
      "The full case study for one project: the problem, what was built, the pipeline, the engineering decisions, results, stack and sources.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          enum: [...CASE_STUDY_SLUGS],
          description: "The project's slug, as returned by list_projects.",
        },
      },
      required: ["slug"],
      additionalProperties: false,
    },
    run: async (args, url) => {
      const slug = text(args.slug);
      if (!CASE_STUDY_SLUGS.has(slug)) {
        return {
          data: { slugs: [...CASE_STUDY_SLUGS] },
          error: `No case study with slug "${slug}". Valid slugs: ${[...CASE_STUDY_SLUGS].join(", ")}.`,
        };
      }
      return { data: await loadJson(url, `/api/v1/case-studies/${slug}.json`) };
    },
  },
  {
    name: "list_faqs",
    title: "FAQ",
    description:
      "The questions and answers from the site's FAQ (hiring and availability, what the role involves, technical questions answered from the projects), optionally ranked against a question.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Only the entries that share words with this, best match first. Omit for every entry in site order.",
        },
      },
      additionalProperties: false,
    },
    run: async (args, url) => {
      const list = await loadJson<{ data: { question: string; answer: string }[] }>(url, "/api/v1/faqs.json");
      const query = text(args.query);
      if (!query) return { data: list };
      const ranked = rank(query, list.data.map((f) => ({ ...f, source: `${ORIGIN}/#faq` })));
      const data = ranked.map((r) => ({ question: r.doc.question, answer: r.doc.answer, score: Number(r.score.toFixed(3)) }));
      return { data: { ...list, count: data.length, data, query } };
    },
  },
  {
    name: "list_agent_skills",
    title: "Agent skills",
    description:
      "The published agent skills: what each one does, the method behind it, and its repository. Pass a name for one skill.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "One skill's name, e.g. \"humanizer\". Omit for every skill." },
      },
      additionalProperties: false,
    },
    run: async (args, url) => {
      const list = await loadJson<{ data: { name: string }[] }>(url, "/api/v1/skills.json");
      const name = text(args.name).toLowerCase();
      if (!name) return { data: list };
      const data = list.data.filter((s) => s.name.toLowerCase() === name);
      if (!data.length) {
        return {
          data: { names: list.data.map((s) => s.name) },
          error: `No skill named "${name}". Skills: ${list.data.map((s) => s.name).join(", ")}.`,
        };
      }
      return { data: { ...list, count: 1, data } };
    },
  },
  {
    name: "answer_question",
    title: "Answer a question",
    description:
      "Answers a question about Harshith Nayaka L or his work by quoting the site's own published answer, with its source URL. Returns \"no published answer\" rather than composing one.",
    inputSchema: {
      type: "object",
      properties: {
        question: {
          type: "string",
          minLength: 3,
          description: "The question in plain language, e.g. \"Is he available for freelance work?\" or \"How does Maestro verify answers?\".",
        },
      },
      required: ["question"],
      additionalProperties: false,
    },
    run: async (args, url) => {
      const question = text(args.question);
      if (question.length < 3) return { data: {}, error: "question must be at least 3 characters." };
      const reply = await answer(url, question, null);
      return { data: reply.data, text: reply.text };
    },
  },
];

// ------------------------------------------------------- docs MCP server
//
// POST /mcp/docs: the developer documentation over MCP, separate from the
// portfolio server above. That one answers "what has he built"; this one
// answers "how do I use this site's API, MCP, A2A or NLWeb surface", so an
// agent integrating with the site can read the docs over the same protocol
// it will call.

const DOCS = [
  { path: "/developers.md", title: "Developer portal", about: "Every agent surface on the site and how to call it" },
  { path: "/api/llms.txt", title: "JSON API guide", about: "The read-only REST API: routes, pagination, errors" },
  { path: "/auth.md", title: "Authentication", about: "Why no credentials exist and what that covers" },
  { path: "/agents.md", title: "Agent guide", about: "What the site is and is not a good source for" },
  { path: "/pricing.md", title: "Pricing", about: "What is free, and what the site does not publish" },
  { path: "/llms.txt", title: "llms.txt", about: "The site index for language models" },
  { path: "/openapi.yaml", title: "OpenAPI 3.1 description", about: "The REST API as a machine-readable spec" },
] as const;

const DOC_PATHS = DOCS.map((d) => d.path);

async function readDoc(url: URL, path: string): Promise<string> {
  const res = await fetch(new URL(path, url));
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  return res.text();
}

// A doc split at its headings, so a search returns the section that answers
// rather than the whole file.
function sections(path: string, title: string, body: string): Qa[] {
  const parts = body.split(/\n(?=#{1,3} )/);
  return parts
    .map((part) => {
      const heading = part.match(/^#{1,3} (.+)/)?.[1] ?? title;
      return { question: `${title}: ${heading}`, answer: part.trim(), source: `${ORIGIN}${path}` };
    })
    .filter((s) => s.answer.length > 40);
}

export const DOCS_MCP_TOOLS: McpTool[] = [
  {
    name: "list_docs",
    title: "List docs",
    description: "Every developer document on the site: its path, title and what it covers. Read one with get_doc.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: async () => ({
      data: { count: DOCS.length, data: DOCS.map((d) => ({ ...d, url: `${ORIGIN}${d.path}` })) },
    }),
  },
  {
    name: "get_doc",
    title: "Get doc",
    description: "One developer document in full, as markdown (the OpenAPI description is YAML).",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", enum: DOC_PATHS, description: "The document's path, as returned by list_docs." },
      },
      required: ["path"],
      additionalProperties: false,
    },
    run: async (args, url) => {
      const path = text(args.path);
      if (!(DOC_PATHS as readonly string[]).includes(path)) {
        return { data: { paths: DOC_PATHS }, error: `No document at "${path}". Paths: ${DOC_PATHS.join(", ")}.` };
      }
      const body = await readDoc(url, path);
      return { data: { path, url: `${ORIGIN}${path}`, content: body }, text: body };
    },
  },
  {
    name: "search_docs",
    title: "Search docs",
    description: "The documentation sections that best match a question, each with its source URL, best first.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 2, description: "What you want to know, e.g. \"how do I page through case studies\" or \"is there a rate limit\"." },
        limit: { type: "integer", minimum: 1, maximum: 10, default: 5, description: "How many sections to return." },
      },
      required: ["query"],
      additionalProperties: false,
    },
    run: async (args, url) => {
      const query = text(args.query);
      const limit = Math.min(10, Math.max(1, Number.isInteger(args.limit) ? (args.limit as number) : 5));
      const docs = (
        await Promise.all(
          // llms.txt is an index of the site's content, not documentation; left
          // in, its "Case studies" heading outranked the Pagination section
          // for "how do I page through case studies".
          DOCS.filter((d) => /\.(md|txt)$/.test(d.path) && d.path !== "/llms.txt").map(async (d) =>
            sections(d.path, d.title, await readDoc(url, d.path)),
          ),
        )
      ).flat();
      const hits = rank(query, docs)
        .slice(0, limit)
        .map((r) => ({ section: r.doc.question, source: r.doc.source, score: Number(r.score.toFixed(3)), content: r.doc.answer.slice(0, 2000) }));
      return { data: { query, count: hits.length, data: hits } };
    },
  },
];

const MCP_SERVERS: Record<string, McpServer> = {
  "/mcp": {
    name: "harshith-nayaka-l-portfolio",
    title: "Harshith Nayaka L — portfolio",
    description: "Read-only access to Harshith Nayaka L's portfolio: profile, projects, case studies, FAQ and agent skills.",
    instructions:
      "Read-only. Call get_profile for who Harshith Nayaka L is and how to reach him, list_projects to see the work, then get_case_study with a slug for depth. answer_question quotes the site's published answer to a question. Every page is also a resource in markdown. Nothing can be written or sent.",
    tools: MCP_TOOLS,
    resources: async (url) => {
      const studies = (await loadJson<{ data: { slug: string; title: string; outcome: string }[] }>(url, "/api/v1/case-studies.json")).data;
      const page = (path: string, name: string, title: string, description?: string): McpResource => ({
        uri: `${ORIGIN}${path === "/" ? "" : path}/index.md`,
        name,
        title,
        ...(description ? { description } : {}),
        mimeType: "text/markdown",
      });
      return [
        page("/", "home", "Home", "Selected work, the FAQ and contact"),
        page("/about", "about", "About Harshith Nayaka L", "Role, background, stack and the questions people ask about him"),
        page("/contact", "contact", "Contact"),
        ...studies.map((s) => page(`/work/${s.slug}`, s.slug, s.title, s.outcome)),
        { uri: `${ORIGIN}/llms-full.txt`, name: "llms-full", title: "Every case study in one file", mimeType: "text/markdown" },
      ];
    },
  },
  "/mcp/docs": {
    name: "harshith-nayaka-l-portfolio-docs",
    title: "Harshith Nayaka L — developer docs",
    description: "The developer documentation for the site's JSON API, MCP servers, A2A agent and NLWeb endpoint.",
    instructions:
      "Read-only documentation. list_docs shows every document, get_doc returns one, search_docs finds the section that answers a question. For the portfolio content itself, use the MCP server at " + `${ORIGIN}/mcp.`,
    tools: DOCS_MCP_TOOLS,
    resources: async () =>
      DOCS.map((d) => ({
        uri: `${ORIGIN}${d.path}`,
        name: d.path.replace(/^\//, ""),
        title: d.title,
        description: d.about,
        mimeType: d.path.endsWith(".yaml") ? "application/yaml" : "text/markdown",
      })),
  },
};

type JsonRpcId = string | number | null;

function mcpJson(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
      ...MCP_CORS,
      ...extra,
    },
  });
}

const rpcResult = (id: JsonRpcId, result: unknown) => mcpJson({ jsonrpc: "2.0", id, result });
const rpcError = (id: JsonRpcId, code: number, message: string, data?: unknown, status = 200) =>
  mcpJson({ jsonrpc: "2.0", id, error: { code, message, ...(data ? { data } : {}) } }, status);

async function handleMcp(request: Request, url: URL, server: McpServer): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...MCP_CORS, "Access-Control-Max-Age": "86400" } });
  }
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { Allow: "POST, OPTIONS", ...MCP_CORS } });
  }

  const origin = request.headers.get("origin");
  if (origin && !origin.startsWith("https://")) {
    return rpcError(null, -32600, "Origin not allowed: only https origins may call this server.", undefined, 403);
  }
  const version = request.headers.get("mcp-protocol-version");
  if (version && !MCP_VERSIONS.includes(version)) {
    return rpcError(null, -32600, `Unsupported MCP-Protocol-Version "${version}".`, { supported: MCP_VERSIONS }, 400);
  }

  let msg: { jsonrpc?: unknown; id?: JsonRpcId; method?: unknown; params?: Record<string, unknown> };
  try {
    msg = await request.json();
  } catch {
    return rpcError(null, -32700, "Parse error: the body is not valid JSON.", undefined, 400);
  }
  if (Array.isArray(msg) || !msg || msg.jsonrpc !== "2.0") {
    return rpcError(null, -32600, "Invalid request: send one JSON-RPC 2.0 object per POST.", undefined, 400);
  }

  // Notifications and client responses carry no id and get 202, no body.
  if (msg.id === undefined) return new Response(null, { status: 202, headers: MCP_CORS });

  const id = msg.id;
  const params = msg.params ?? {};

  switch (msg.method) {
    case "initialize": {
      const requested = String(params.protocolVersion ?? "");
      return rpcResult(id, {
        protocolVersion: MCP_VERSIONS.includes(requested) ? requested : MCP_VERSIONS[0],
        capabilities: { tools: { listChanged: false }, resources: { listChanged: false, subscribe: false } },
        serverInfo: {
          name: server.name,
          title: server.title,
          version: "1.1.0",
          description: server.description,
          websiteUrl: ORIGIN,
          icons: MCP_ICONS,
        },
        instructions: server.instructions,
      });
    }
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, {
        tools: server.tools.map(({ run: _run, ...tool }) => ({
          ...tool,
          annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
        })),
      });
    case "tools/call": {
      const tool = server.tools.find((t) => t.name === params.name);
      if (!tool) {
        return rpcError(id, -32602, `Unknown tool "${String(params.name)}".`, {
          tools: server.tools.map((t) => t.name),
        });
      }
      const args = (params.arguments ?? {}) as Record<string, unknown>;
      let result: McpResult;
      try {
        result = await tool.run(args, url);
      } catch {
        return rpcResult(id, {
          isError: true,
          content: [{ type: "text", text: `The site could not return this data. Try again, or read ${ORIGIN}/llms.txt.` }],
        });
      }
      if (result.error) {
        return rpcResult(id, { isError: true, content: [{ type: "text", text: result.error }], structuredContent: result.data });
      }
      return rpcResult(id, {
        content: [{ type: "text", text: result.text ?? JSON.stringify(result.data) }],
        structuredContent: result.data,
      });
    }
    case "resources/list":
      return rpcResult(id, { resources: await server.resources(url) });
    case "resources/templates/list":
      return rpcResult(id, { resourceTemplates: [] });
    case "resources/read": {
      const uri = String(params.uri ?? "");
      const resource = (await server.resources(url)).find((r) => r.uri === uri);
      if (!resource) return rpcError(id, -32002, `Resource not found: ${uri}`, { uri });
      const res = await fetch(new URL(new URL(uri).pathname, url), { headers: { Accept: "text/markdown" } });
      if (!res.ok) return rpcError(id, -32603, `The site returned ${res.status} for ${uri}.`);
      return rpcResult(id, { contents: [{ uri, mimeType: resource.mimeType, text: await res.text() }] });
    }
    default:
      return rpcError(id, -32601, `Method not found: ${String(msg.method)}.`);
  }
}

// ----------------------------------------------------------------- A2A agent
//
// POST /a2a: an Agent2Agent (A2A) agent over the JSON-RPC binding. The agent
// card used to point A2A clients at /api/v1, which is plain REST and answers
// no A2A method, so any client that trusted the card failed on its first call.
//
// What it does is narrow on purpose: it answers questions about Harshith
// Nayaka L and his work by retrieving the site's own published answers (the
// FAQ and each case study's questions) and quoting them verbatim with their
// source URL. There is no model behind it, so it cannot invent a claim the
// site does not make; a question the site does not answer gets "no published
// answer" and the address of everything it does cover.
//
// Both protocol versions are served. A2A 1.0 clients send `A2A-Version: 1.0`
// and PascalCase methods (SendMessage); the spec says a request with no
// version header is 0.3 (message/send, `kind` discriminators, lowercase
// enums), and most deployed clients are still 0.3. Method names never overlap
// between the two, so a request with no header and a 1.0 method name is
// answered as 1.0 rather than rejected.
//
// Stateless: every message completes in the same response and nothing is
// stored, so there is no task to fetch, cancel or subscribe to afterwards.
// The card says so (streaming and push notifications off), and those methods
// return the spec's own errors instead of pretending.

export const A2A_SKILLS = [
  {
    id: "answer-question",
    name: "Answer a question about Harshith Nayaka L",
    description:
      "Answers questions about Harshith Nayaka L, AI Engineer in Bengaluru: his role, projects, how he works and how to hire him. Each answer is quoted verbatim from the site's published FAQ or case studies, with its source URL. Nothing is generated.",
    tags: ["profile", "hiring", "faq", "ai-engineer", "bengaluru"],
    examples: [
      "Who is Harshith Nayaka L and where is he based?",
      "Can I hire an AI engineer in Bangalore for marketing workflows?",
      "How does Maestro verify its answers?",
    ],
  },
  {
    id: "list-projects",
    name: "List projects",
    description:
      "Every project in the portfolio with its one-line outcome and link. Send a data part {\"skill\": \"list-projects\"}, or ask for the projects in words.",
    tags: ["portfolio", "projects"],
    examples: ["What has Harshith built?", "List his projects."],
  },
  {
    id: "get-case-study",
    name: "Summarise a case study",
    description:
      "The outcome, results and links for one project, with the URL of its full write-up. Send a data part {\"skill\": \"get-case-study\", \"slug\": \"maestro\"}, or name the project.",
    tags: ["portfolio", "case-study", "architecture"],
    examples: ["Tell me about Cannon.", "Summarise the BrandForge case study."],
  },
] as const;

export const A2A_VERSIONS = ["1.0", "0.3"];

type A2aVersion = "1.0" | "0.3";
type Part = { text?: string; data?: unknown; mediaType?: string; kind?: string };
/** `keywords` are matched but never shown: they let a record with no question
 *  of its own (the profile) be found by the words people ask it with. */
type Qa = { question: string; answer: string; source: string; keywords?: string };
type Study = {
  slug: string;
  title: string;
  kicker?: string;
  outcome: string;
  results?: { label: string; body: string }[];
  questions?: { q: string; a: string }[];
  links?: { label: string; href: string }[];
};
type Project = { slug: string; title: string; kicker?: string; outcome: string; hasCaseStudy: boolean };

const A2A_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, A2A-Version, A2A-Extensions",
};

const METHODS_10 = new Set([
  "SendMessage", "SendStreamingMessage", "GetTask", "ListTasks", "CancelTask", "SubscribeToTask",
  "CreateTaskPushNotificationConfig", "GetTaskPushNotificationConfig",
  "ListTaskPushNotificationConfigs", "DeleteTaskPushNotificationConfig", "GetExtendedAgentCard",
]);

function a2aJson(body: unknown, version: A2aVersion | null, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
      ...(version ? { "A2A-Version": version } : {}),
      ...A2A_CORS,
    },
  });
}

// Error codes from the spec's mapping table (section 5.4), with a
// google.rpc.ErrorInfo detail as its JSON-RPC binding asks for.
const A2A_ERRORS = {
  TASK_NOT_FOUND: -32001,
  PUSH_NOTIFICATION_NOT_SUPPORTED: -32003,
  UNSUPPORTED_OPERATION: -32004,
  CONTENT_TYPE_NOT_SUPPORTED: -32005,
  EXTENDED_AGENT_CARD_NOT_CONFIGURED: -32007,
  VERSION_NOT_SUPPORTED: -32009,
} as const;

function a2aError(
  id: JsonRpcId,
  version: A2aVersion | null,
  reason: keyof typeof A2A_ERRORS | "INVALID_PARAMS" | "METHOD_NOT_FOUND" | "PARSE" | "INVALID_REQUEST",
  message: string,
  httpStatus = 200,
): Response {
  const code =
    reason === "INVALID_PARAMS" ? -32602
    : reason === "METHOD_NOT_FOUND" ? -32601
    : reason === "PARSE" ? -32700
    : reason === "INVALID_REQUEST" ? -32600
    : A2A_ERRORS[reason];
  const data = [{ "@type": "type.googleapis.com/google.rpc.ErrorInfo", reason, domain: "a2a-protocol.org" }];
  return a2aJson({ jsonrpc: "2.0", id, error: { code, message, data } }, version, httpStatus);
}

// ---- retrieval: plain term overlap weighted by rarity, over ~45 short docs.

const STOP = new Set(
  ("a an the is are was were be been being of to in on for and or with what how does do did can could would " +
    "should i you he his him me my it its this that there which who whom where when why about from by as at " +
    "into than then so if any some your yours tell know please get give show much many also just has have had me").split(" "),
);
const SYNONYM: Record<string, string> = {
  bangalore: "bengaluru",
  hiring: "hire",
  hired: "hire",
  freelancer: "freelance",
  // "page through" and "Pagination" are one idea; the stemmer cannot see it.
  pagination: "page",
  paginate: "page",
  paging: "page",
  paged: "page",
  pages: "page",
};

function terms(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => SYNONYM[w] ?? w)
    .map((w) => (w.length > 4 ? w.replace(/(ing|ed|es|s)$/, "") : w));
}

function rank(query: string, docs: Qa[]): { doc: Qa; score: number }[] {
  const q = [...new Set(terms(query))];
  if (!q.length) return [];
  const indexed = docs.map((doc) => ({
    doc,
    qt: new Set(terms(`${doc.question} ${doc.keywords ?? ""}`)),
    at: new Set(terms(doc.answer)),
  }));
  const idf = (t: string) => {
    const n = indexed.filter((d) => d.qt.has(t) || d.at.has(t)).length;
    return Math.log(1 + indexed.length / (1 + n));
  };
  const weights = new Map(q.map((t) => [t, idf(t)]));
  const max = q.reduce((sum, t) => sum + 2 * weights.get(t)!, 0);
  return indexed
    .map(({ doc, qt, at }) => ({
      doc,
      score: q.reduce((s, t) => s + (qt.has(t) ? 2 : at.has(t) ? 1 : 0) * weights.get(t)!, 0) / max,
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

async function loadJson<T>(url: URL, path: string): Promise<T> {
  const res = await fetch(new URL(path, url));
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  return (await res.json()) as T;
}

// Every answer the site publishes, as one retrieval corpus: the profile
// summary and questions, the FAQ, and each case study's questions. Shared by
// the A2A agent, the MCP answer_question tool and NLWeb /ask so all three quote
// the same text.
async function publishedAnswers(url: URL, studies: Study[]): Promise<Qa[]> {
  const [faqs, profile] = await Promise.all([
    loadJson<{ data: { question: string; answer: string }[] }>(url, "/api/v1/faqs.json").then((r) => r.data),
    loadJson<{ summary?: string; questions?: { question: string; answer: string }[] }>(url, "/api/v1/profile.json"),
  ]);
  return [
    ...(profile.summary
      ? [{
          question: "About Harshith Nayaka L",
          answer: profile.summary,
          source: `${ORIGIN}/about`,
          keywords: "who current job role title position employer company works demandnxt based location city",
        }]
      : []),
    ...(profile.questions ?? []).map((f) => ({ question: f.question, answer: f.answer, source: `${ORIGIN}/about` })),
    ...faqs.map((f) => ({ question: f.question, answer: f.answer, source: `${ORIGIN}/#faq` })),
    ...studies.flatMap((s) =>
      (s.questions ?? []).map((q) => ({ question: q.q, answer: q.a, source: `${ORIGIN}/work/${s.slug}` })),
    ),
  ];
}

type Answer = { skill: string; text: string; data: Record<string, unknown> };

async function answer(url: URL, text: string, request: Record<string, unknown> | null): Promise<Answer> {
  const skill = typeof request?.skill === "string" ? request.skill : null;
  const lower = text.toLowerCase();

  const listProjects = async (): Promise<Answer> => {
    const { data } = await loadJson<{ data: (Project & { tags?: string[] })[] }>(url, "/api/v1/projects.json");
    // "Which projects use multi-agent systems?" should get those projects, not
    // all eleven: keep the ones sharing a content word with the question, and
    // fall back to the full list when the question names no topic.
    const generic = new Set(terms("project projects portfolio work built build made list which use used system systems harshith nayaka"));
    const topic = terms(text).filter((t) => !generic.has(t));
    const matching = topic.length
      ? data.filter((p) => {
          const words = new Set(terms(`${p.title} ${p.kicker ?? ""} ${p.outcome} ${(p.tags ?? []).join(" ")}`));
          return topic.some((t) => words.has(t));
        })
      : [];
    const items = (matching.length ? matching : data).map((p) => ({
      slug: p.slug,
      title: p.title,
      outcome: p.outcome,
      url: p.hasCaseStudy ? `${ORIGIN}/work/${p.slug}` : ORIGIN,
    }));
    return {
      skill: "list-projects",
      text: [
        matching.length
          ? `Harshith Nayaka L's projects matching "${topic.join(" ")}" (${items.length}):`
          : `Harshith Nayaka L's projects, strongest first (${items.length}):`,
        "",
        ...items.map((p) => `- **${p.title}** — ${p.outcome} ${p.url}`),
      ].join("\n"),
      data: { skill: "list-projects", projects: items, source: `${ORIGIN}/#work` },
    };
  };

  if (skill === "list-projects") return listProjects();

  const studies = (await loadJson<{ data: Study[] }>(url, "/api/v1/case-studies.full.json")).data;

  const summarise = (s: Study): Answer => {
    const page = `${ORIGIN}/work/${s.slug}`;
    return {
      skill: "get-case-study",
      text: [
        `## ${s.title}${s.kicker ? ` — ${s.kicker}` : ""}`,
        "",
        s.outcome,
        "",
        ...(s.results ?? []).map((r) => `- **${r.label}:** ${r.body}`),
        "",
        ...(s.links ?? []).map((l) => `${l.label}: ${l.href}`),
        `Full write-up: ${page} (markdown: ${page}/index.md)`,
      ].join("\n"),
      data: {
        skill: "get-case-study",
        slug: s.slug,
        title: s.title,
        outcome: s.outcome,
        results: s.results ?? [],
        links: s.links ?? [],
        source: page,
        markdown: `${page}/index.md`,
      },
    };
  };

  if (skill === "get-case-study") {
    const study = studies.find((s) => s.slug === request?.slug);
    if (study) return summarise(study);
    return {
      skill: "get-case-study",
      text: `No case study with slug "${String(request?.slug)}". Valid slugs: ${studies.map((s) => s.slug).join(", ")}.`,
      data: { skill: "get-case-study", error: "unknown_slug", slugs: studies.map((s) => s.slug) },
    };
  }

  if (
    (/\b(projects?|portfolio)\b/.test(lower) && /\b(list|all|what|which|show|built|build|made)\b/.test(lower)) ||
    /\bwhat (has|did|does) \S+( \S+)? (built|build|made|make|shipped)\b/.test(lower)
  ) {
    return listProjects();
  }

  // Rates are the one thing people ask that the site deliberately does not
  // publish. Answered directly, because term overlap alone matched "rate" to
  // an answer about API rate limits.
  if (
    /\b(hourly|rates?|pricing|price|prices|charges?|fees?|quote|budget|how much|cost)\b/.test(lower) &&
    !/\b(tokens?|models?|llms?|api|limits?|inference|gpu)\b/.test(lower)
  ) {
    return {
      skill: "answer-question",
      text: "The site publishes no rates or pricing. To ask, email Harshith Nayaka L at harshith28124@gmail.com.",
      data: { skill: "answer-question", match: null, pricingPublished: false, contact: "harshith28124@gmail.com" },
    };
  }

  const docs = await publishedAnswers(url, studies);
  const ranked = rank(text, docs);
  const named = studies.find((s) => new RegExp(`\\b(${s.slug.replace(/-/g, "[- ]")}|${s.title.replace(/[^\w\s]/g, ".?")})\\b`, "i").test(text));

  // A question naming a project is answered from that project's own
  // questions if one fits; otherwise the project's summary is the answer.
  let top = ranked[0];
  if (named) {
    // "Tell me about Cannon" or "What is SPECTRA?" asks for the project
    // itself: nothing is left once the name is taken out.
    const nameTerms = new Set(terms(`${named.slug.replace(/-/g, " ")} ${named.title}`));
    if (!terms(text).some((t) => !nameTerms.has(t))) return summarise(named);
    const own = ranked.find((r) => r.doc.source === `${ORIGIN}/work/${named.slug}` && r.score >= 0.45);
    if (!own) return summarise(named);
    top = own;
  }

  if (!top || top.score < 0.3) {
    return {
      skill: "answer-question",
      text: [
        "The site has no published answer to that question, and this agent only quotes published answers.",
        "",
        `Everything the site covers is listed at ${ORIGIN}/llms.txt. For anything else, email Harshith Nayaka L at harshith28124@gmail.com.`,
      ].join("\n"),
      data: { skill: "answer-question", match: null, index: `${ORIGIN}/llms.txt`, contact: "harshith28124@gmail.com" },
    };
  }
  const related = ranked.filter((r) => r !== top && r.score >= 0.25).slice(0, 3);
  return {
    skill: "answer-question",
    text: [
      top.doc.answer,
      "",
      top.doc.keywords
        ? `Source: ${top.doc.source}`
        : `Source: ${top.doc.source} (published answer to "${top.doc.question}")`,
      ...(related.length ? ["", "Related published answers:", ...related.map((r) => `- ${r.doc.question} ${r.doc.source}`)] : []),
    ].join("\n"),
    data: {
      skill: "answer-question",
      match: { question: top.doc.question, answer: top.doc.answer, source: top.doc.source },
      related: related.map((r) => ({ question: r.doc.question, source: r.doc.source })),
      quoted: true,
    },
  };
}

function uuid(): string {
  return crypto.randomUUID();
}

async function handleA2a(request: Request, url: URL): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...A2A_CORS, "Access-Control-Max-Age": "86400" } });
  }
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "This is an A2A JSON-RPC endpoint: POST a JSON-RPC 2.0 request. The agent card is at /.well-known/agent-card.json.",
        agentCard: `${ORIGIN}/.well-known/agent-card.json`,
      }),
      { status: 405, headers: { Allow: "POST, OPTIONS", "Content-Type": "application/json; charset=utf-8", ...A2A_CORS } },
    );
  }

  let msg: { jsonrpc?: unknown; id?: JsonRpcId; method?: unknown; params?: Record<string, unknown> };
  try {
    msg = await request.json();
  } catch {
    return a2aError(null, null, "PARSE", "Invalid JSON payload", 400);
  }
  if (Array.isArray(msg) || !msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return a2aError(null, null, "INVALID_REQUEST", "Request payload validation error: send one JSON-RPC 2.0 object per POST.", 400);
  }
  const id = msg.id ?? null;
  const method = msg.method;

  const header = (request.headers.get("a2a-version") ?? url.searchParams.get("A2A-Version") ?? "").trim();
  const requested = header.split(".").slice(0, 2).join(".");
  let version: A2aVersion;
  if (!header) version = METHODS_10.has(method) ? "1.0" : "0.3";
  else if (requested === "1.0" || requested === "0.3") version = requested;
  else {
    return a2aError(id, null, "VERSION_NOT_SUPPORTED", `A2A version "${header}" is not supported. Supported: ${A2A_VERSIONS.join(", ")}.`);
  }
  const v10 = version === "1.0";
  const is = (m10: string, m03: string) => method === (v10 ? m10 : m03);

  if (is("SendMessage", "message/send")) {
    const params = msg.params ?? {};
    const message = params.message as { parts?: Part[]; contextId?: string; messageId?: string; role?: string } | undefined;
    if (!message || !Array.isArray(message.parts) || message.parts.length === 0) {
      return a2aError(id, version, "INVALID_PARAMS", "Invalid parameters: message.parts must contain at least one part.");
    }
    const texts = message.parts.filter((p) => typeof p.text === "string").map((p) => p.text as string);
    const dataPart = message.parts.find((p) => p.data && typeof p.data === "object" && !Array.isArray(p.data));
    if (!texts.length && !dataPart) {
      return a2aError(id, version, "CONTENT_TYPE_NOT_SUPPORTED", "Only text parts, and data parts naming a skill, are supported.");
    }

    const config = (params.configuration ?? {}) as { acceptedOutputModes?: string[] };
    const accepted = config.acceptedOutputModes?.length ? config.acceptedOutputModes : null;
    const acceptsText = !accepted || accepted.some((m) => /^(text\/(plain|markdown|\*)|\*\/\*)$/.test(m));
    const acceptsJson = !accepted || accepted.some((m) => /^(application\/(json|\*)|\*\/\*)$/.test(m));
    if (!acceptsText && !acceptsJson) {
      return a2aError(id, version, "CONTENT_TYPE_NOT_SUPPORTED", "This agent answers in text/markdown, text/plain or application/json.");
    }

    let result: Answer;
    try {
      result = await answer(url, texts.join("\n"), (dataPart?.data as Record<string, unknown>) ?? null);
    } catch {
      return a2aJson({ jsonrpc: "2.0", id, error: { code: -32603, message: "Internal error: the site's data could not be read. Try again." } }, version);
    }

    const parts: Part[] = [];
    if (acceptsText) parts.push(v10 ? { text: result.text, mediaType: "text/markdown" } : { kind: "text", text: result.text });
    if (acceptsJson) parts.push(v10 ? { data: result.data, mediaType: "application/json" } : { kind: "data", data: result.data });

    const artifact = { artifactId: uuid(), name: result.skill, parts };
    const status = { state: v10 ? "TASK_STATE_COMPLETED" : "completed", timestamp: new Date().toISOString() };
    const contextId = typeof message.contextId === "string" && message.contextId ? message.contextId : uuid();
    const task = v10
      ? { id: uuid(), contextId, status, artifacts: [artifact] }
      : { kind: "task", id: uuid(), contextId, status, artifacts: [artifact] };
    return a2aJson({ jsonrpc: "2.0", id, result: v10 ? { task } : task }, version);
  }

  if (is("GetTask", "tasks/get") || is("CancelTask", "tasks/cancel") || is("SubscribeToTask", "tasks/resubscribe")) {
    return a2aError(id, version, "TASK_NOT_FOUND", "Task not found: this agent is stateless and completes every message in the response that carried it, so no task is kept.");
  }
  if (v10 && method === "ListTasks") {
    return a2aJson({ jsonrpc: "2.0", id, result: { tasks: [], nextPageToken: "", pageSize: 0, totalSize: 0 } }, version);
  }
  if (is("SendStreamingMessage", "message/stream")) {
    return a2aError(id, version, "UNSUPPORTED_OPERATION", "Streaming is not supported (capabilities.streaming is false). Use " + (v10 ? "SendMessage." : "message/send."));
  }
  if (/PushNotificationConfig/i.test(method)) {
    return a2aError(id, version, "PUSH_NOTIFICATION_NOT_SUPPORTED", "Push notifications are not supported (capabilities.pushNotifications is false).");
  }
  if (is("GetExtendedAgentCard", "agent/getAuthenticatedExtendedCard")) {
    return a2aError(id, version, "EXTENDED_AGENT_CARD_NOT_CONFIGURED", "There is no extended agent card: nothing here needs authentication.");
  }
  return a2aError(id, version, "METHOD_NOT_FOUND", `Method not found: ${method}.`);
}

// ------------------------------------------------------------ NLWeb /ask
//
// GET or POST /ask: Microsoft's NLWeb protocol, list mode. Same corpus and
// ranking as the A2A agent, returned as NLWeb results (url, name, site,
// score, description, schema_object) rather than one quoted answer, so a
// client that speaks NLWeb gets the site's matching published answers and
// case studies in one call.
//
// Only list mode exists. summarize and generate would need a model writing
// text, and nothing on this surface may say what the site does not; a
// request for either is answered as a list and says so in _meta.mode.
//
// JSON by default. Streaming (SSE start / result / complete, the v0.55 event
// names) when asked: streaming=true, prefer.streaming, or
// Accept: text/event-stream.

export const NLWEB_VERSION = "0.55";
const NLWEB_SITE = "harshith-nayaka-l-portfolio";

const ASK_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

type AskItem = {
  url: string;
  name: string;
  site: string;
  score: number;
  description: string;
  schema_object: Record<string, unknown>[];
};

async function askResults(url: URL, query: string, limit: number): Promise<AskItem[]> {
  const studies = (await loadJson<{ data: (Study & { tech?: string[]; description?: string; category?: string | null })[] }>(url, "/api/v1/case-studies.full.json")).data;
  const answers = await publishedAnswers(url, studies);
  // Each case study is also a result in its own right, so "who built Maestro"
  // or "an MCP server project" can return the project, not only a question
  // about it.
  const projectDocs: Qa[] = studies.map((s) => ({
    question: `${s.title} ${s.category ?? ""} ${s.kicker ?? ""}`,
    answer: `${s.outcome} ${s.description ?? ""}`,
    source: `${ORIGIN}/work/${s.slug}`,
    // The stack only: words every project shares ("project", the author's
    // name) would lift all eleven equally and bury the one that matches.
    keywords: (s.tech ?? []).join(" "),
  }));
  const byStudy = new Map(studies.map((s) => [`${ORIGIN}/work/${s.slug}`, s]));
  return rank(query, [...projectDocs, ...answers])
    .filter((r) => r.score >= 0.15)
    .slice(0, limit)
    .map(({ doc, score }) => {
      const study = projectDocs.includes(doc) ? byStudy.get(doc.source) : undefined;
      return {
        url: doc.source,
        name: study ? study.title : doc.question,
        site: NLWEB_SITE,
        score: Number(score.toFixed(3)),
        description: study ? study.outcome : doc.answer,
        schema_object: [
          study
            ? {
                "@type": "Article",
                headline: study.title,
                description: study.outcome,
                url: doc.source,
                author: { "@type": "Person", name: "Harshith Nayaka L", url: `${ORIGIN}/` },
              }
            : {
                "@type": "Question",
                name: doc.question,
                url: doc.source,
                acceptedAnswer: { "@type": "Answer", text: doc.answer },
              },
        ],
      };
    });
}

function askJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", ...ASK_CORS },
  });
}

async function handleAsk(request: Request, url: URL): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...ASK_CORS, "Access-Control-Max-Age": "86400" } });
  }
  if (request.method !== "GET" && request.method !== "POST" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "GET, POST, OPTIONS", ...ASK_CORS } });
  }

  // Flat parameters (query=, streaming=, mode=) from the URL or a form or
  // JSON body, plus the v0.55 structured body: { query: { text, site },
  // prefer: { streaming, mode }, meta: { version } }.
  const p: Record<string, unknown> = Object.fromEntries(url.searchParams);
  if (request.method === "POST") {
    const type = request.headers.get("content-type") ?? "";
    try {
      if (type.includes("application/json")) Object.assign(p, await request.json());
      else if (type.includes("application/x-www-form-urlencoded")) Object.assign(p, Object.fromEntries(new URLSearchParams(await request.text())));
    } catch {
      return askJson({ _meta: { response_type: "failure", version: NLWEB_VERSION }, error: { code: "invalid_body", message: "The body is not valid JSON." } }, 400);
    }
  }
  const structured = p.query && typeof p.query === "object" ? (p.query as Record<string, unknown>) : null;
  const prefer = p.prefer && typeof p.prefer === "object" ? (p.prefer as Record<string, unknown>) : {};
  const query = String(structured ? structured.text ?? "" : p.query ?? p.q ?? "").trim();
  const mode = String(prefer.mode ?? p.mode ?? "list");
  const flag = prefer.streaming ?? p.streaming;
  const streaming =
    flag === true || /^(true|1)$/i.test(String(flag ?? "")) || (request.headers.get("accept") ?? "").includes("text/event-stream");
  const limit = Math.min(20, Math.max(1, Number.parseInt(String(p.limit ?? "10"), 10) || 10));
  const queryId = String(p.query_id ?? crypto.randomUUID());

  if (!query) {
    return askJson(
      {
        _meta: { response_type: "failure", version: NLWEB_VERSION },
        error: { code: "missing_query", message: "Send the question as query, e.g. /ask?query=who+is+Harshith+Nayaka+L" },
      },
      400,
    );
  }

  const meta = { response_type: "answer", version: NLWEB_VERSION, mode: "list", site: NLWEB_SITE, ...(mode !== "list" ? { requested_mode: mode } : {}) };
  const results = await askResults(url, query, limit);
  const empty = results.length
    ? {}
    : { message: `No published answer matches. Everything the site covers is listed at ${ORIGIN}/llms.txt.` };

  if (!streaming) return askJson({ _meta: meta, query_id: queryId, query, results, ...empty });

  const event = (name: string, data: unknown) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
  const body =
    event("start", { _meta: meta, query_id: queryId, streaming: true }) +
    results.map((item, index) => event("result", { index, item })).join("") +
    event("complete", { _meta: { version: NLWEB_VERSION }, query_id: queryId, count: results.length, ...empty });
  return new Response(body, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", ...ASK_CORS },
  });
}

/**
 * Case studies that were retired, not renamed. These used to 301 to /#work,
 * which Google treats as a soft 404 and keeps the old URL indexed: a Google AI
 * Mode audit in September 2026 was still describing BlogSpace from it. 410
 * says the page is gone on purpose, which is the fastest way out of the index.
 * A renamed page (seo-command-center -> brand-audit-platform) keeps its 301.
 */
const RETIRED = /^\/work\/(blogspace)(\/index\.md|\.md)?$/;

function gone(): Response {
  const body =
    "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Removed | Harshith Nayaka L</title>" +
    "<meta name=\"robots\" content=\"noindex\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"></head>" +
    "<body style=\"font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;line-height:1.6\">" +
    "<main><h1>This project was removed</h1><p>It is no longer part of the portfolio.</p>" +
    `<p><a href="${ORIGIN}/#work">See the current work</a></p></main></body></html>`;
  return new Response(body, {
    status: 410,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "X-Robots-Tag": "noindex",
    },
  });
}

/** The document at `path`, served as markdown: text that already is
 *  markdown as-is, anything else fenced under a heading naming its source. */
async function resourceAsMarkdown(path: string, url: URL): Promise<Response> {
  const res = await fetch(new URL(path, url));
  const headers = {
    "Content-Type": "text/markdown; charset=utf-8",
    "Cache-Control": "public, max-age=0, must-revalidate",
    Link: `<${ORIGIN}${path}>; rel="alternate"`,
    "X-Robots-Tag": "noindex",
  };
  if (!res.ok) return new Response(NOT_FOUND_MD, { status: 404, headers });
  const body = await res.text();
  if (/\.txt$/.test(path) && /^#\s/.test(body)) return new Response(body, { headers });
  const type = (res.headers.get("content-type") ?? "text/plain").split(";")[0];
  const lang = /json/.test(type) ? "json" : /yaml/.test(type) ? "yaml" : /xml/.test(type) ? "xml" : "text";
  const md = [
    `# ${path}`,
    "",
    `The markdown view of [${ORIGIN}${path}](${ORIGIN}${path}), a \`${type}\` document, unchanged below. Every page and document on this site is listed at ${ORIGIN}/llms.txt.`,
    "",
    "```" + lang,
    body.trimEnd(),
    "```",
    "",
  ].join("\n");
  return new Response(md, { headers });
}

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/(.)\/$/, "$1");

  if (RETIRED.test(path)) return gone();

  // The MCP endpoint takes POST, so it is routed before the GET/HEAD guard.
  // /.well-known/mcp answers the same protocol for clients that probe the
  // well-known path; a GET there is a discovery read and passes through to
  // the static server card.
  if (path === "/mcp" || path === "/mcp/docs") return handleMcp(request, url, MCP_SERVERS[path]);
  if (path === "/.well-known/mcp" && request.method !== "GET" && request.method !== "HEAD") {
    return handleMcp(request, url, MCP_SERVERS["/mcp"]);
  }
  if (path === "/a2a") return handleA2a(request, url);
  if (path === "/ask") return handleAsk(request, url);

  if (request.method !== "GET" && request.method !== "HEAD") return next();

  // <route>.md -> <route>/index.md, before the extension guard below sends
  // anything with a dot straight through to the filesystem.
  // /api has no HTML page to twin; its markdown form is the API guide.
  if (path === "/api.md") return rewrite(new URL("/api/llms.txt", url));
  if (path === "/docs.md") return rewrite(new URL("/developers.md", url));

  const resourceMd = path.match(RESOURCE_MD);
  if (resourceMd) return resourceAsMarkdown(resourceMd[1], url);

  const dotMd = path.match(DOT_MD_ROUTE);
  if (dotMd && dotMd[1] !== "/index") {
    return rewrite(new URL(`${dotMd[1]}/index.md`, url));
  }

  // The API answers in JSON, including when it has nothing to answer with.
  // Its own static .json files carry an extension and pass through untouched.
  if (path === "/api" || path.startsWith("/api/")) {
    if (HAS_EXTENSION.test(path)) return next();
    return routeApi(path, url);
  }

  if (HAS_EXTENSION.test(path) || REWRITTEN_ROUTE.test(path)) return next();

  if (
    !servesMarkdown({
      accept: request.headers.get("accept"),
      ua: request.headers.get("user-agent"),
      mode: url.searchParams.get("mode"),
    })
  ) {
    return next();
  }

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
