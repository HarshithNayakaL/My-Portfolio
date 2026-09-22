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

type McpTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  /** Static JSON file the tool returns, given its validated arguments. */
  file: (args: Record<string, unknown>) => string;
};

export const MCP_TOOLS: McpTool[] = [
  {
    name: "get_profile",
    title: "Profile",
    description:
      "Who Harshith Nayaka L is: role, employer, location, availability, contact email and public profiles. Start here for questions about the person rather than a project.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    file: () => "/api/v1/profile.json",
  },
  {
    name: "list_projects",
    title: "Projects",
    description:
      "Every project in the portfolio with a one-line outcome, tags, status, links and its slug. Use the slug with get_case_study for the full write-up.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    file: () => "/api/v1/projects.json",
  },
  {
    name: "get_case_study",
    title: "Case study",
    description:
      "The full case study for one project: the problem, what was built, the pipeline, the engineering decisions, results and stack.",
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
    file: (args) => `/api/v1/case-studies/${args.slug}.json`,
  },
  {
    name: "list_faqs",
    title: "FAQ",
    description:
      "The questions and answers from the site's FAQ: hiring and availability, what an AI workflow engineer does, and technical questions answered from the projects.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    file: () => "/api/v1/faqs.json",
  },
  {
    name: "list_agent_skills",
    title: "Agent skills",
    description:
      "The published agent skills: what each one does, the method behind it, and its repository.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    file: () => "/api/v1/skills.json",
  },
];

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

async function handleMcp(request: Request, url: URL): Promise<Response> {
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
        capabilities: { tools: { listChanged: false } },
        serverInfo: {
          name: "harshith-nayaka-l-portfolio",
          title: "Harshith Nayaka L — portfolio",
          version: "1.0.0",
          description: "Read-only access to Harshith Nayaka L's portfolio: profile, projects, case studies, FAQ and agent skills.",
          websiteUrl: ORIGIN,
        },
        instructions:
          "Read-only. Call get_profile for who Harshith Nayaka L is and how to reach him, list_projects to see the work, then get_case_study with a slug for depth. Everything here is also on the public site; nothing can be written or sent.",
      });
    }
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, {
        tools: MCP_TOOLS.map(({ file: _file, ...tool }) => ({
          ...tool,
          annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
        })),
      });
    case "tools/call": {
      const tool = MCP_TOOLS.find((t) => t.name === params.name);
      if (!tool) {
        return rpcError(id, -32602, `Unknown tool "${String(params.name)}".`, {
          tools: MCP_TOOLS.map((t) => t.name),
        });
      }
      const args = (params.arguments ?? {}) as Record<string, unknown>;
      if (tool.name === "get_case_study" && !CASE_STUDY_SLUGS.has(String(args.slug))) {
        return rpcResult(id, {
          isError: true,
          content: [{
            type: "text",
            text: `No case study with slug "${String(args.slug)}". Valid slugs: ${[...CASE_STUDY_SLUGS].join(", ")}.`,
          }],
        });
      }
      const res = await fetch(new URL(tool.file(args), url));
      if (!res.ok) {
        return rpcResult(id, {
          isError: true,
          content: [{ type: "text", text: `The site returned ${res.status} for this data. Try again, or read ${ORIGIN}/llms.txt.` }],
        });
      }
      const data = await res.json();
      return rpcResult(id, {
        content: [{ type: "text", text: JSON.stringify(data) }],
        structuredContent: data,
      });
    }
    default:
      return rpcError(id, -32601, `Method not found: ${String(msg.method)}.`);
  }
}

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/(.)\/$/, "$1");

  // The MCP endpoint takes POST, so it is routed before the GET/HEAD guard.
  // /.well-known/mcp answers the same protocol for clients that probe the
  // well-known path; a GET there is a discovery read and passes through to
  // the static server card.
  if (path === "/mcp" || (path === "/.well-known/mcp" && request.method !== "GET" && request.method !== "HEAD")) {
    return handleMcp(request, url);
  }

  if (request.method !== "GET" && request.method !== "HEAD") return next();

  // <route>.md -> <route>/index.md, before the extension guard below sends
  // anything with a dot straight through to the filesystem.
  // /api has no HTML page to twin; its markdown form is the API guide.
  if (path === "/api.md") return rewrite(new URL("/api/llms.txt", url));

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
