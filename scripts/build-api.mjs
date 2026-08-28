/**
 * Build-time generation of the public read-only JSON API.
 *
 * The content on this site — profile, projects, case studies, FAQs — is
 * already public and already static. It was only ever reachable as HTML or
 * markdown, which means an agent that wanted one field had to fetch and parse
 * a whole page. This publishes the same records as JSON, generated from the
 * same modules the React pages render from, so the API and the pages cannot
 * disagree.
 *
 * Everything is emitted as static files. There is no server, no database and
 * nothing to authenticate: the API is public by design, so there is no auth
 * flow to document and no rate limit to advertise. Routing from the
 * extensionless paths (/api/v1/projects) onto these files, and the JSON error
 * for anything else under /api, happens in middleware.ts.
 */
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");

const { caseStudies, projects, faqs, ORIGIN, NAME, EMAIL, GITHUB, LINKEDIN } =
  await import(join(ROOT, "dist-ssr/entry-server.js"));

const abs = (p) => `${ORIGIN}${p}`;
const API = "/api/v1";

async function put(path, value) {
  const file = join(DIST, path.replace(/^\//, ""));
  await mkdir(join(file, ".."), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

// ------------------------------------------------------------- resources

const projectResource = (p) => ({
  slug: p.slug,
  title: p.title,
  kicker: p.kicker ?? null,
  outcome: p.outcome,
  tags: p.tags,
  status: p.status ?? "shipped",
  links: p.links,
  hasCaseStudy: p.hasCaseStudy,
  _links: {
    self: abs(`${API}/projects/${p.slug}`),
    caseStudy: p.hasCaseStudy ? abs(`${API}/case-studies/${p.slug}`) : null,
    html: abs(`/work/${p.slug}`),
    markdown: abs(`/work/${p.slug}/index.md`),
  },
});

const caseStudyResource = (cs) => ({
  slug: cs.slug,
  title: cs.title,
  kicker: cs.kicker,
  outcome: cs.outcome,
  description: cs.metaDescription,
  inProgress: Boolean(cs.inProgress),
  meta: cs.meta,
  problem: cs.problem,
  build: cs.build,
  pipeline: cs.pipeline,
  howItWorks: cs.howItWorks,
  results: cs.results,
  tech: cs.tech,
  links: cs.links,
  screenshot: cs.shot
    ? { url: abs(cs.shot.src), width: cs.shot.width, height: cs.shot.height, alt: cs.shot.alt }
    : null,
  _links: {
    self: abs(`${API}/case-studies/${cs.slug}`),
    project: abs(`${API}/projects/${cs.slug}`),
    html: abs(`/work/${cs.slug}`),
    markdown: abs(`/work/${cs.slug}/index.md`),
  },
});

const collection = (name, items) => ({
  object: "list",
  resource: name,
  count: items.length,
  data: items,
  _links: { self: abs(`${API}/${name}`), root: abs(API) },
});

// --------------------------------------------------------------- writes

const projectList = projects.map(projectResource);
const studyList = Object.values(caseStudies).map(caseStudyResource);

await put("/api/index.json", {
  name: `${NAME} — portfolio API`,
  description:
    "Read-only JSON over the profile, projects, case studies and FAQ content on this site. Public: no key, no auth, no rate limit, no write operations.",
  versions: { v1: abs(API) },
  current: abs(API),
  openapi: abs("/openapi.json"),
  _links: {
    self: abs("/api"),
    describedby: abs("/openapi.json"),
    catalog: abs("/.well-known/api-catalog"),
    documentation: abs("/api/llms.txt"),
  },
});

await put(`${API}/index.json`, {
  version: "v1",
  description: "Version 1 of the read-only portfolio API. Additive changes only; a breaking change ships as /api/v2 and this version keeps serving.",
  resources: {
    profile: abs(`${API}/profile`),
    projects: abs(`${API}/projects`),
    caseStudies: abs(`${API}/case-studies`),
    faqs: abs(`${API}/faqs`),
  },
  _links: { self: abs(API), root: abs("/api"), describedby: abs("/openapi.json") },
});

await put(`${API}/profile.json`, {
  name: NAME,
  headline: "AI Engineer, Full-Stack",
  location: { city: "Bengaluru", region: "Karnataka", country: "IN" },
  email: EMAIL,
  profiles: { github: GITHUB, linkedin: LINKEDIN },
  focus: [
    "AI agents and multi-agent orchestration",
    "Retrieval-augmented generation",
    "LLM integration and output reliability",
    "Multi-modal pipelines (voice, vision, text)",
    "Full-stack application engineering around AI",
  ],
  counts: { projects: projectList.length, caseStudies: studyList.length, faqs: faqs.length },
  _links: { self: abs(`${API}/profile`), root: abs(API), html: abs("/"), markdown: abs("/index.md") },
});

await put(`${API}/projects.json`, collection("projects", projectList));
await put(`${API}/case-studies.json`, collection("case-studies", studyList));
await put(
  `${API}/faqs.json`,
  collection(
    "faqs",
    faqs.map((f, i) => ({ id: `faq-${i + 1}`, question: f.q, answer: f.a })),
  ),
);

for (const p of projectList) await put(`${API}/projects/${p.slug}.json`, p);
for (const cs of studyList) await put(`${API}/case-studies/${cs.slug}.json`, cs);

// ------------------------------------------------------------ OpenAPI 3.1

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const ok = (schema, description) => ({
  description,
  content: { "application/json": { schema } },
});
const notFound = {
  description: "No resource with that identifier. The body is JSON, never an HTML error page.",
  content: { "application/json": { schema: ref("Error") } },
};
const slugParam = (what) => ({
  name: "slug",
  in: "path",
  required: true,
  description: `Slug of the ${what}, as returned in the \`slug\` field of the list response.`,
  schema: { type: "string", pattern: "^[a-z0-9-]+$" },
});

const openapi = {
  openapi: "3.1.0",
  info: {
    title: `${NAME} — portfolio API`,
    version: "1.0.0",
    summary: "Read-only JSON over this portfolio's profile, projects, case studies and FAQs.",
    description: [
      `Public, read-only API over the same content the pages of ${ORIGIN} render.`,
      "",
      "No authentication, no API key, no rate limit and no write operations: every",
      "record here is already public on the site. Responses are static JSON served",
      "from the CDN, so the API has the same availability as the site itself.",
      "",
      "Anything under /api that does not resolve returns a JSON error body rather",
      "than an HTML error page.",
    ].join("\n"),
    contact: { name: NAME, email: EMAIL, url: ORIGIN },
    license: { name: "Content © Harshith Nayaka L", url: abs("/legal/terms") },
  },
  servers: [{ url: ORIGIN, description: "Production" }],
  externalDocs: { description: "Agent instructions", url: abs("/agents.md") },
  tags: [
    { name: "Discovery", description: "Service and version metadata." },
    { name: "Profile", description: "Who this site belongs to." },
    { name: "Projects", description: "Shipped work, one record per project." },
    { name: "Case studies", description: "The long-form engineering write-up behind each project." },
    { name: "FAQs", description: "Questions this site answers, as question/answer pairs." },
  ],
  paths: {
    "/api": {
      get: {
        operationId: "getServiceRoot",
        tags: ["Discovery"],
        summary: "Service root",
        description: "Lists the available API versions and points at the OpenAPI document.",
        responses: { 200: ok(ref("ServiceRoot"), "Service metadata.") },
      },
    },
    "/api/v1": {
      get: {
        operationId: "getVersionRoot",
        tags: ["Discovery"],
        summary: "Version 1 root",
        description: "Lists every resource collection available in version 1.",
        responses: { 200: ok(ref("VersionRoot"), "Version metadata and resource links.") },
      },
    },
    "/api/v1/profile": {
      get: {
        operationId: "getProfile",
        tags: ["Profile"],
        summary: "Get the profile",
        description: "Name, headline, location, contact details and focus areas of the engineer this site belongs to.",
        responses: { 200: ok(ref("Profile"), "The profile record.") },
      },
    },
    "/api/v1/projects": {
      get: {
        operationId: "listProjects",
        tags: ["Projects"],
        summary: "List projects",
        description: "Every project on the site, ordered strongest first — the same order the homepage grid renders.",
        responses: { 200: ok(ref("ProjectList"), "All projects.") },
      },
    },
    "/api/v1/projects/{slug}": {
      get: {
        operationId: "getProject",
        tags: ["Projects"],
        summary: "Get one project",
        description: "A single project by slug, with links to its case study, HTML page and markdown twin.",
        parameters: [slugParam("project")],
        responses: { 200: ok(ref("Project"), "The project."), 404: notFound },
      },
    },
    "/api/v1/case-studies": {
      get: {
        operationId: "listCaseStudies",
        tags: ["Case studies"],
        summary: "List case studies",
        description: "Every case study in full, including problem framing, architecture, pipeline stages, results and stack.",
        responses: { 200: ok(ref("CaseStudyList"), "All case studies.") },
      },
    },
    "/api/v1/case-studies/{slug}": {
      get: {
        operationId: "getCaseStudy",
        tags: ["Case studies"],
        summary: "Get one case study",
        description: "The full engineering write-up for one project: what the problem was, what was built, how the pipeline is staged, what it produced, and what it runs on.",
        parameters: [slugParam("case study")],
        responses: { 200: ok(ref("CaseStudy"), "The case study."), 404: notFound },
      },
    },
    "/api/v1/faqs": {
      get: {
        operationId: "listFaqs",
        tags: ["FAQs"],
        summary: "List FAQs",
        description: "Question and answer pairs covering both the technical questions an answer engine fields and the ones a prospective client asks before starting.",
        responses: { 200: ok(ref("FaqList"), "All FAQ entries.") },
      },
    },
  },
  components: {
    schemas: {
      Error: {
        type: "object",
        description: "Every failure under /api returns this shape.",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string", description: "Stable machine-readable code.", examples: ["not_found"] },
              message: { type: "string", description: "Human-readable explanation." },
              hint: { type: "string", description: "What to do instead." },
              documentation: { type: "string", format: "uri", description: "Where the valid routes are listed." },
            },
          },
        },
      },
      Link: { type: "string", format: "uri", nullable: true },
      ServiceRoot: {
        type: "object",
        required: ["name", "versions", "current"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          versions: { type: "object", additionalProperties: { type: "string", format: "uri" } },
          current: { type: "string", format: "uri" },
          openapi: { type: "string", format: "uri" },
          _links: { type: "object", additionalProperties: ref("Link") },
        },
      },
      VersionRoot: {
        type: "object",
        required: ["version", "resources"],
        properties: {
          version: { type: "string", examples: ["v1"] },
          description: { type: "string" },
          resources: { type: "object", additionalProperties: { type: "string", format: "uri" } },
          _links: { type: "object", additionalProperties: ref("Link") },
        },
      },
      Profile: {
        type: "object",
        required: ["name", "headline", "location", "email"],
        properties: {
          name: { type: "string" },
          headline: { type: "string" },
          location: {
            type: "object",
            required: ["city", "country"],
            properties: {
              city: { type: "string" },
              region: { type: "string" },
              country: { type: "string", description: "ISO 3166-1 alpha-2." },
            },
          },
          email: { type: "string", format: "email" },
          profiles: { type: "object", additionalProperties: { type: "string", format: "uri" } },
          focus: { type: "array", items: { type: "string" } },
          counts: { type: "object", additionalProperties: { type: "integer" } },
          _links: { type: "object", additionalProperties: ref("Link") },
        },
      },
      NamedLink: {
        type: "object",
        required: ["label", "href"],
        properties: { label: { type: "string" }, href: { type: "string", format: "uri" } },
      },
      Project: {
        type: "object",
        required: ["slug", "title", "outcome", "tags", "hasCaseStudy"],
        properties: {
          slug: { type: "string", pattern: "^[a-z0-9-]+$" },
          title: { type: "string" },
          kicker: { type: "string", nullable: true, description: "Short context line shown above the title." },
          outcome: { type: "string", description: "One line, framed as an outcome rather than a feature list." },
          tags: { type: "array", items: { type: "string" } },
          status: { type: "string", enum: ["shipped", "in-progress"] },
          links: { type: "array", items: ref("NamedLink") },
          hasCaseStudy: { type: "boolean" },
          _links: { type: "object", additionalProperties: ref("Link") },
        },
      },
      LabelledText: {
        type: "object",
        required: ["label", "value"],
        properties: { label: { type: "string" }, value: { type: "string" } },
      },
      PipelineStage: {
        type: "object",
        required: ["title", "nodes"],
        properties: {
          title: { type: "string" },
          nodes: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "label"],
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                detail: { type: "string" },
                kind: { type: "string", enum: ["input", "model", "logic", "gate", "output"] },
              },
            },
          },
        },
      },
      CaseStudy: {
        type: "object",
        required: ["slug", "title", "outcome", "tech"],
        properties: {
          slug: { type: "string", pattern: "^[a-z0-9-]+$" },
          title: { type: "string" },
          kicker: { type: "string" },
          outcome: { type: "string" },
          description: { type: "string", description: "Search-result length summary, 120-160 characters." },
          inProgress: { type: "boolean" },
          meta: { type: "array", items: ref("LabelledText") },
          problem: { type: "array", items: { type: "string" }, description: "Paragraphs framing the problem." },
          build: { type: "array", items: { type: "string" }, description: "Paragraphs describing what was built." },
          pipeline: { type: "array", items: ref("PipelineStage") },
          howItWorks: {
            type: "array",
            items: {
              type: "object",
              required: ["title", "body"],
              properties: { title: { type: "string" }, body: { type: "string" } },
            },
          },
          results: {
            type: "array",
            items: {
              type: "object",
              required: ["label", "body"],
              properties: { label: { type: "string" }, body: { type: "string" } },
            },
          },
          tech: { type: "array", items: { type: "string" } },
          links: { type: "array", items: ref("NamedLink") },
          screenshot: {
            type: "object",
            nullable: true,
            required: ["url", "width", "height", "alt"],
            properties: {
              url: { type: "string", format: "uri" },
              width: { type: "integer" },
              height: { type: "integer" },
              alt: { type: "string" },
            },
          },
          _links: { type: "object", additionalProperties: ref("Link") },
        },
      },
      Faq: {
        type: "object",
        required: ["id", "question", "answer"],
        properties: {
          id: { type: "string" },
          question: { type: "string" },
          answer: { type: "string" },
        },
      },
      ProjectList: {
        type: "object",
        required: ["object", "count", "data"],
        properties: {
          object: { type: "string", enum: ["list"] },
          resource: { type: "string" },
          count: { type: "integer" },
          data: { type: "array", items: ref("Project") },
          _links: { type: "object", additionalProperties: ref("Link") },
        },
      },
      CaseStudyList: {
        type: "object",
        required: ["object", "count", "data"],
        properties: {
          object: { type: "string", enum: ["list"] },
          resource: { type: "string" },
          count: { type: "integer" },
          data: { type: "array", items: ref("CaseStudy") },
          _links: { type: "object", additionalProperties: ref("Link") },
        },
      },
      FaqList: {
        type: "object",
        required: ["object", "count", "data"],
        properties: {
          object: { type: "string", enum: ["list"] },
          resource: { type: "string" },
          count: { type: "integer" },
          data: { type: "array", items: ref("Faq") },
          _links: { type: "object", additionalProperties: ref("Link") },
        },
      },
    },
  },
};

await put("/openapi.json", openapi);

// ------------------------------------------------- RFC 9727 API catalog

await put("/.well-known/api-catalog.json", {
  linkset: [
    {
      anchor: ORIGIN,
      "service-desc": [
        {
          href: abs("/openapi.json"),
          type: "application/vnd.oai.openapi+json;version=3.1",
          title: `${NAME} portfolio API — OpenAPI 3.1 description`,
        },
      ],
      "service-doc": [
        { href: abs("/api/llms.txt"), type: "text/markdown", title: "API guide for agents" },
        { href: abs("/agents.md"), type: "text/markdown", title: "Agent instructions for this site" },
      ],
      "service-meta": [
        { href: abs("/api"), type: "application/json", title: "Service root" },
        { href: abs("/.well-known/ard.json"), type: "application/json", title: "Agentic Resource Discovery catalog" },
      ],
      status: [{ href: abs("/api/v1"), title: "Version 1 — current, stable" }],
    },
  ],
});

// --------------------------------------------------------- JSON 404 body

await put("/api/error-404.json", {
  error: {
    code: "not_found",
    message: "No such resource under /api.",
    hint: "Start at /api/v1 for the list of resource collections, or read /openapi.json for the full route table.",
    documentation: abs("/openapi.json"),
  },
});

// ------------------------------------------- modular llms.txt per area

const apiLlms = [
  `# ${NAME} — portfolio API`,
  "",
  "> Read-only JSON over the profile, projects, case studies and FAQs on this site. Public: no key, no auth, no rate limit, no write operations.",
  "",
  "Static JSON served from the CDN, generated at build time from the same modules the pages render from. Anything under /api that does not resolve returns a JSON error body, never an HTML error page.",
  "",
  "## Start here",
  "",
  `- [Service root](${abs("/api")}): available versions.`,
  `- [OpenAPI 3.1 description](${abs("/openapi.json")}): every route, typed, with an operationId and a description on each operation.`,
  `- [API catalog](${abs("/.well-known/api-catalog")}): RFC 9727 linkset.`,
  "",
  "## Resources",
  "",
  `- [Profile](${abs(`${API}/profile`)}): name, headline, location, contact, focus areas.`,
  `- [Projects](${abs(`${API}/projects`)}): every project, strongest first. One record: \`${abs(`${API}/projects/maestro`)}\`.`,
  `- [Case studies](${abs(`${API}/case-studies`)}): the full write-up behind each project — problem, build, pipeline stages, results, stack. One record: \`${abs(`${API}/case-studies/maestro`)}\`.`,
  `- [FAQs](${abs(`${API}/faqs`)}): question and answer pairs.`,
  "",
  "## Authentication",
  "",
  "None. Every record served here is already public on the site, so there is no key to obtain, no token to refresh and no scope to request. There is deliberately no write surface and no sandbox: nothing here can be mutated, so there is no production data to protect.",
  "",
  "## Versioning",
  "",
  "`/api/v1` is current and stable. Fields are added, never removed or retyped; a breaking change would ship as `/api/v2` with v1 still serving.",
  "",
].join("\n");

await put_text("/api/llms.txt", apiLlms);

const workLlms = [
  `# ${NAME} — case studies`,
  "",
  "> The long-form engineering write-up behind each shipped project: what the problem was, what was built, how it is staged, what it produced, and what it runs on.",
  "",
  `Each case study is served three ways: an HTML page, a markdown twin at the same URL with \`/index.md\` appended, and a JSON record under \`${abs(`${API}/case-studies`)}\`.`,
  "",
  "## Case studies",
  "",
  ...Object.values(caseStudies).map(
    (cs) =>
      `- [${cs.title} — ${cs.kicker}](${abs(`/work/${cs.slug}/index.md`)}): ${cs.metaDescription} JSON: ${abs(`${API}/case-studies/${cs.slug}`)}`,
  ),
  "",
  "## Everything at once",
  "",
  `- [llms-full.txt](${abs("/llms-full.txt")}): every case study inlined in one fetch.`,
  `- [JSON collection](${abs(`${API}/case-studies`)}): the same corpus as structured records.`,
  "",
].join("\n");

await put_text("/work/llms.txt", workLlms);

async function put_text(path, body) {
  const file = join(DIST, path.replace(/^\//, ""));
  await mkdir(join(file, ".."), { recursive: true });
  await writeFile(file, body, "utf8");
}

// ------------------------------------- schema.org feeds + NLWeb schema map
//
// A JSONL feed is the shape an ingestion pipeline actually wants: one
// schema.org object per line, no page to scrape and no HTML to strip. The
// schema map is the index robots.txt points a crawler at.

const caseStudyJsonLd = (cs) => ({
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "@id": abs(`/work/${cs.slug}`),
  url: abs(`/work/${cs.slug}`),
  headline: `${cs.title} — ${cs.kicker}`,
  name: cs.title,
  description: cs.metaDescription,
  abstract: cs.outcome,
  author: { "@type": "Person", name: NAME, url: ORIGIN },
  keywords: cs.tech.join(", "),
  encoding: [
    { "@type": "MediaObject", encodingFormat: "text/markdown", contentUrl: abs(`/work/${cs.slug}/index.md`) },
    { "@type": "MediaObject", encodingFormat: "application/json", contentUrl: abs(`${API}/case-studies/${cs.slug}`) },
  ],
  ...(cs.shot ? { image: abs(cs.shot.src) } : {}),
});

const faqJsonLd = (f, i) => ({
  "@context": "https://schema.org",
  "@type": "Question",
  "@id": `${ORIGIN}/#faq-${i + 1}`,
  name: f.q,
  acceptedAnswer: { "@type": "Answer", text: f.a },
});

const jsonl = (rows) => rows.map((r) => JSON.stringify(r)).join("\n") + "\n";

await put_text(
  "/feeds/case-studies.jsonl",
  jsonl(Object.values(caseStudies).map(caseStudyJsonLd)),
);
await put_text("/feeds/faqs.jsonl", jsonl(faqs.map(faqJsonLd)));

// Dated by the commit that last touched the data behind the feeds, not by the
// build. Stamping "now" on every deploy teaches an ingester that this file's
// lastmod means nothing, which is exactly the signal it is there to carry.
const stamp = (() => {
  for (const file of ["src/data/caseStudies.ts", "src/components/Faq.tsx"]) {
    try {
      const out = execFileSync("git", ["log", "-1", "--format=%cI", "--", file], {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (out) return out;
    } catch {
      // No git in the build image, or a shallow clone. Fall through.
    }
  }
  return new Date().toISOString();
})();
await put_text(
  "/schema-map.xml",
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<schemamap xmlns="https://nlweb.ai/schemas/schemamap/0.1">',
    ...[
      ["/feeds/case-studies.jsonl", "Every case study as a schema.org TechArticle, one per line."],
      ["/feeds/faqs.jsonl", "Every FAQ as a schema.org Question with its accepted answer."],
    ].map(([path, description]) =>
      [
        "  <schema>",
        `    <loc>${abs(path)}</loc>`,
        "    <type>application/jsonl</type>",
        `    <lastmod>${stamp}</lastmod>`,
        `    <description>${description}</description>`,
        "  </schema>",
      ].join("\n"),
    ),
    "</schemamap>",
    "",
  ].join("\n"),
);

// ------------------------------------------------- A2A card + skills index
//
// Both describe the same thing honestly: this host serves documents and
// read-only data. It is not an agent that can be delegated a task, and saying
// otherwise would send an agent looking for an endpoint that does not exist.

await put("/.well-known/agent-card.json", {
  protocolVersion: "0.3.0",
  name: `${NAME} — portfolio`,
  description:
    "Read-only source of engineering case studies, project records and profile data for Harshith Nayaka L. Serves documents and JSON; it does not execute tasks.",
  url: abs("/api/v1"),
  preferredTransport: "HTTP+JSON",
  provider: { organization: NAME, url: ORIGIN },
  version: "1.0.0",
  documentationUrl: abs("/agents.md"),
  capabilities: { streaming: false, pushNotifications: false, stateTransitionHistory: false },
  defaultInputModes: ["text/plain"],
  defaultOutputModes: ["application/json", "text/markdown"],
  securitySchemes: {},
  security: [],
  skills: [
    {
      id: "list-projects",
      name: "List projects",
      description: "Return every project on this site with its outcome, tags, status and links.",
      tags: ["portfolio", "projects"],
      examples: ["What has Harshith built?", "Which projects involve multi-agent systems?"],
      inputModes: ["text/plain"],
      outputModes: ["application/json"],
    },
    {
      id: "get-case-study",
      name: "Get a case study",
      description: "Return the full engineering write-up for one project: problem, architecture, pipeline stages, results and stack.",
      tags: ["portfolio", "case-study", "architecture"],
      examples: ["How does Maestro's verifier work?", "Explain Cannon's agent isolation."],
      inputModes: ["text/plain"],
      outputModes: ["application/json", "text/markdown"],
    },
    {
      id: "get-profile",
      name: "Get the profile",
      description: "Return name, headline, location, contact details and focus areas.",
      tags: ["profile", "contact"],
      examples: ["Who is Harshith Nayaka L?", "How do I contact him?"],
      inputModes: ["text/plain"],
      outputModes: ["application/json"],
    },
  ],
});

await put("/.well-known/agent-skills/index.json", {
  version: "0.2.0",
  name: `${NAME} — portfolio`,
  description: "Capabilities this host exposes to agents. Read-only: documents and JSON, no task execution and no write surface.",
  homepage: ORIGIN,
  skills: [
    {
      name: "list-projects",
      description: "List every project with its outcome, tags, status and links.",
      endpoint: abs(`${API}/projects`),
      method: "GET",
      contentType: "application/json",
      schema: abs("/openapi.json#/paths/~1api~1v1~1projects/get"),
    },
    {
      name: "get-case-study",
      description: "Fetch one project's full engineering write-up: problem, architecture, pipeline stages, results and stack.",
      endpoint: abs(`${API}/case-studies/{slug}`),
      method: "GET",
      contentType: "application/json",
      schema: abs("/openapi.json#/paths/~1api~1v1~1case-studies~1%7Bslug%7D/get"),
    },
    {
      name: "get-profile",
      description: "Fetch name, headline, location, contact details and focus areas.",
      endpoint: abs(`${API}/profile`),
      method: "GET",
      contentType: "application/json",
      schema: abs("/openapi.json#/paths/~1api~1v1~1profile/get"),
    },
    {
      name: "read-page-markdown",
      description: "Read any page as clean markdown. Append /index.md to a route, send Accept: text/markdown, or add ?mode=agent.",
      endpoint: abs("/index.md"),
      method: "GET",
      contentType: "text/markdown",
    },
    {
      name: "read-full-corpus",
      description: "Read every case study inlined in one fetch instead of paging through the site.",
      endpoint: abs("/llms-full.txt"),
      method: "GET",
      contentType: "text/markdown",
    },
  ],
});

// --------------------------------------------------- middleware drift guard
//
// middleware.ts carries the slug tables so it can answer a bad slug with JSON
// instead of letting Vercel fall through to the HTML 404 page. A hardcoded
// table silently rots the moment a project is added or renamed, so the build
// fails rather than shipping an API that 404s a page that exists.
const middleware = await readFile(join(ROOT, "middleware.ts"), "utf8");
for (const [name, want] of [
  ["PROJECT_SLUGS", projects.map((p) => p.slug)],
  ["CASE_STUDY_SLUGS", Object.keys(caseStudies)],
]) {
  const block = middleware.match(new RegExp(`${name}[^=]*=\\s*new Set\\(\\[([^\\]]*)\\]`));
  if (!block) throw new Error(`build-api: could not find ${name} in middleware.ts`);
  const have = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const missing = want.filter((s) => !have.includes(s));
  const extra = have.filter((s) => !want.includes(s));
  if (missing.length || extra.length) {
    throw new Error(
      `build-api: middleware.ts ${name} is out of sync with the data.` +
        (missing.length ? ` Missing: ${missing.join(", ")}.` : "") +
        (extra.length ? ` Stale: ${extra.join(", ")}.` : ""),
    );
  }
}

console.log(
  `[api] ${projectList.length} projects, ${studyList.length} case studies, ${faqs.length} faqs, OpenAPI 3.1, RFC 9727 catalog`,
);
