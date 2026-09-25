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

  if (path === "/api/v1/case-studies" && url.searchParams.has("view")) {
    const view = url.searchParams.get("view");
    if (view === "full") return rewrite(new URL("/api/v1/case-studies.full.json", url));
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
const SYNONYM: Record<string, string> = { bangalore: "bengaluru", hiring: "hire", hired: "hire", freelancer: "freelance" };

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

  const [faqs, profile] = await Promise.all([
    loadJson<{ data: { question: string; answer: string }[] }>(url, "/api/v1/faqs.json").then((r) => r.data),
    loadJson<{ summary?: string }>(url, "/api/v1/profile.json"),
  ]);
  const docs: Qa[] = [
    ...(profile.summary
      ? [{
          question: "About Harshith Nayaka L",
          answer: profile.summary,
          source: `${ORIGIN}/about`,
          keywords: "who current job role title position employer company works demandnxt based location city",
        }]
      : []),
    ...faqs.map((f) => ({ question: f.question, answer: f.answer, source: `${ORIGIN}/#faq` })),
    ...studies.flatMap((s) =>
      (s.questions ?? []).map((q) => ({ question: q.q, answer: q.a, source: `${ORIGIN}/work/${s.slug}` })),
    ),
  ];
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
  if (path === "/a2a") return handleA2a(request, url);

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
