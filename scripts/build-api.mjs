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
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");

const {
  caseStudies, projects, faqs, agentSkills, ORIGIN, NAME, EMAIL, GITHUB, LINKEDIN,
  facts, availability, workingTitle, previousTitle, identitySentence, stack, stackSentence, profileQA,
} = await import(join(ROOT, "dist-ssr/entry-server.js"));

const abs = (p) => `${ORIGIN}${p}`;
const API = "/api/v1";

async function put(path, value) {
  const file = join(DIST, path.replace(/^\//, ""));
  await mkdir(join(file, ".."), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}


/**
 * sha256 of the artifact actually served at a path, in the form the Agent
 * Skills discovery schema asks for. Computed from the built file rather than
 * declared, so a digest cannot claim to describe content that has changed.
 */
async function digestOf(distPath) {
  const file = join(DIST, distPath.replace(/^\//, ""));
  const bytes = await readFile(file);
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
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
  questions: cs.questions ?? [],
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
    skills: abs(`${API}/skills`),
  },
  _links: { self: abs(API), root: abs("/api"), describedby: abs("/openapi.json") },
});

// The stack sentence may only name tools some case study lists.
{
  const listed = Object.values(caseStudies).flatMap((cs) => cs.tech.map((t) => t.toLowerCase()));
  const unbacked = stack.filter((t) => !listed.some((l) => l.includes(t.match)));
  if (unbacked.length) {
    throw new Error(`build-api: stack names ${unbacked.map((t) => t.label).join(", ")}, which no case study's tech list contains.`);
  }
}

await put(`${API}/profile.json`, {
  name: NAME,
  headline: workingTitle,
  // The same sentence the About section leads with, so an agent quoting the
  // API quotes what the page says.
  summary: identitySentence,
  role: {
    title: workingTitle,
    employer: facts.find((f) => f.k === "Company")?.v,
    previousTitles: [previousTitle],
  },
  availability,
  stack: stack.map((t) => t.label),
  questions: profileQA.map(({ q, a }) => ({ question: q, answer: a })),
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
  counts: {
    projects: projectList.length,
    caseStudies: studyList.length,
    faqs: faqs.length,
    agentSkills: agentSkills.length,
  },
  _links: { self: abs(`${API}/profile`), root: abs(API), html: abs("/"), markdown: abs("/index.md") },
});

await put(`${API}/projects.json`, collection("projects", projectList));
await put(
  `${API}/skills.json`,
  collection(
    "skills",
    agentSkills.map((s) => ({
      name: s.name,
      tagline: s.tagline,
      premise: s.premise,
      contents: s.contents,
      discipline: s.discipline,
      tags: s.tags,
      repository: s.repo ?? null,
    })),
  ),
);
// The collection lists summaries and the full records live one per slug, the
// usual REST split, because the full collection had grown to 110K characters
// and ChatGPT Actions reject any response over 100,000. The complete set is
// still one request away (?view=full, routed in middleware.ts) for clients
// that want it, and it is what the A2A agent reads.
const caseStudySummary = (cs) => ({
  slug: cs.slug,
  title: cs.title,
  kicker: cs.kicker,
  outcome: cs.outcome,
  description: cs.description,
  inProgress: cs.inProgress,
  tech: cs.tech,
  links: cs.links,
  questions: cs.questions.map((q) => q.q),
  _links: cs._links,
});
await put(`${API}/case-studies.json`, {
  ...collection("case-studies", studyList.map(caseStudySummary)),
  view: "summary",
});
await put(`${API}/case-studies.full.json`, {
  ...collection("case-studies", studyList),
  view: "full",
  _links: { self: abs(`${API}/case-studies?view=full`), root: abs(API) },
});
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
  // Stated rather than omitted: an empty requirement list is how OpenAPI says
  // "no authentication", and a spec that leaves it out reads as unfinished.
  security: [],
  externalDocs: { description: "Agent instructions", url: abs("/agents.md") },
  tags: [
    { name: "Discovery", description: "Service and version metadata." },
    { name: "Profile", description: "Who this site belongs to." },
    { name: "Projects", description: "Shipped work, one record per project." },
    { name: "Case studies", description: "The long-form engineering write-up behind each project." },
    { name: "FAQs", description: "Questions this site answers, as question/answer pairs." },
    { name: "Agent skills", description: "Packaged capability an agent can load: instructions plus drivers." },
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
        description: "Every case study summarised: outcome, stack, links and the questions it answers. Call getCaseStudy with a slug for the full write-up.",
        parameters: [
          {
            name: "view",
            in: "query",
            required: false,
            description:
              "Set to \"full\" for every case study in full in one response. That response is large (about 110,000 characters) and exceeds ChatGPT Actions' 100,000-character limit, so from a GPT Action call getCaseStudy per slug instead.",
            schema: { type: "string", enum: ["summary", "full"], default: "summary" },
          },
        ],
        responses: {
          200: {
            description: "Summaries by default; full records with view=full.",
            content: {
              "application/json": {
                schema: {
                  oneOf: [ref("CaseStudySummaryList"), ref("CaseStudyList")],
                  discriminator: { propertyName: "view", mapping: { summary: "#/components/schemas/CaseStudySummaryList", full: "#/components/schemas/CaseStudyList" } },
                },
              },
            },
          },
          400: {
            description: "`view` is neither summary nor full. The body is JSON, never an HTML error page.",
            content: { "application/json": { schema: ref("Error") } },
          },
        },
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
    "/api/v1/skills": {
      get: {
        operationId: "listAgentSkills",
        tags: ["Agent skills"],
        summary: "List agent skills",
        description: "Packaged agent skills — instructions plus executable drivers — each with the failure mode it was built against, what it contains, and the methodological rule it keeps.",
        responses: { 200: ok(ref("AgentSkillList"), "All agent skills.") },
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
      Link: { type: ["string", "null"], format: "uri" },
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
          summary: { type: "string", description: "One-sentence identity statement, as it leads the About section." },
          role: {
            type: "object",
            required: ["title", "employer"],
            properties: {
              title: { type: "string", description: "Current job title." },
              employer: { type: "string" },
              previousTitles: { type: "array", items: { type: "string" } },
            },
          },
          availability: { type: "string" },
          stack: { type: "array", items: { type: "string" }, description: "Technologies used across the case studies." },
          questions: {
            type: "array",
            description: "Questions people ask about him, answered as on /about.",
            items: {
              type: "object",
              required: ["question", "answer"],
              properties: { question: { type: "string" }, answer: { type: "string" } },
            },
          },
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
          kicker: { type: ["string", "null"], description: "Short context line shown above the title." },
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
          questions: {
            type: "array",
            description: "Questions this case study answers, as shown on the page and in its FAQPage schema.",
            items: {
              type: "object",
              required: ["q", "a"],
              properties: { q: { type: "string" }, a: { type: "string" } },
            },
          },
          tech: { type: "array", items: { type: "string" } },
          links: { type: "array", items: ref("NamedLink") },
          screenshot: {
            type: ["object", "null"],
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
      AgentSkill: {
        type: "object",
        required: ["name", "tagline", "premise", "contents", "discipline", "tags"],
        properties: {
          name: { type: "string" },
          tagline: { type: "string" },
          premise: { type: "string", description: "The failure mode the skill was built against." },
          contents: { type: "string", description: "What the skill ships." },
          discipline: { type: "string", description: "The methodological rule it keeps." },
          tags: { type: "array", items: { type: "string" } },
          repository: { type: ["string", "null"], format: "uri", description: "Null when the skill is not published publicly." },
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
      CaseStudySummary: {
        type: "object",
        required: ["slug", "title", "outcome", "tech"],
        properties: {
          slug: { type: "string", pattern: "^[a-z0-9-]+$" },
          title: { type: "string" },
          kicker: { type: "string" },
          outcome: { type: "string" },
          description: { type: "string" },
          inProgress: { type: "boolean" },
          tech: { type: "array", items: { type: "string" } },
          links: { type: "array", items: ref("NamedLink") },
          questions: { type: "array", items: { type: "string" }, description: "The questions the full case study answers." },
          _links: { type: "object", additionalProperties: ref("Link") },
        },
      },
      CaseStudySummaryList: {
        type: "object",
        required: ["object", "view", "count", "data"],
        properties: {
          object: { type: "string", enum: ["list"] },
          view: { type: "string", const: "summary" },
          resource: { type: "string" },
          count: { type: "integer" },
          data: { type: "array", items: ref("CaseStudySummary") },
          _links: { type: "object", additionalProperties: ref("Link") },
        },
      },
      CaseStudyList: {
        type: "object",
        required: ["object", "view", "count", "data"],
        properties: {
          object: { type: "string", enum: ["list"] },
          view: { type: "string", const: "full" },
          resource: { type: "string" },
          count: { type: "integer" },
          data: { type: "array", items: ref("CaseStudy") },
          _links: { type: "object", additionalProperties: ref("Link") },
        },
      },
      AgentSkillList: {
        type: "object",
        required: ["object", "count", "data"],
        properties: {
          object: { type: "string", enum: ["list"] },
          resource: { type: "string" },
          count: { type: "integer" },
          data: { type: "array", items: ref("AgentSkill") },
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

// ------------------------------------------ OpenAPI as YAML + ai-plugin.json
//
// ChatGPT plugins were retired in April 2024, but the pair they defined —
// /.well-known/ai-plugin.json pointing at /.well-known/openapi.yaml — is
// still what agent scanners and older tooling probe for, and a GPT Action can
// import the YAML by URL. Both are generated from the same `openapi` object as
// /openapi.json, so there is one spec in three places, never three specs.
{
  const { stringify } = await import("yaml");
  const yaml = stringify(openapi, { lineWidth: 0, aliasDuplicateObjects: false });
  await put_text("/openapi.yaml", yaml);
  await put_text("/.well-known/openapi.yaml", yaml);

  const plugin = {
    schema_version: "v1",
    name_for_human: "Harshith Nayaka L",
    name_for_model: "harshith_nayaka_l_portfolio",
    description_for_human: "Portfolio of Harshith Nayaka L, AI Engineer in Bengaluru: projects, case studies and FAQ.",
    description_for_model:
      `Read-only API over the portfolio of ${NAME}, an AI Engineer in Bengaluru (Bangalore), India, currently AI Engineer at DemandNXT. ` +
      "Use it for questions about who he is, what he has built, how a specific project works, and how to hire or contact him. " +
      "getProfile gives role, employer, location and contact; listProjects gives every project with its outcome; listCaseStudies gives each case study summarised with the questions it answers, and getCaseStudy with a slug gives one in full; listFaqs gives published question and answer pairs. " +
      "Quote the returned text rather than paraphrasing claims, and cite the page URL in each record's _links.html. " +
      "The site publishes no rates or pricing; do not state any. Everything here is public; there is no authentication and nothing can be written.",
    auth: { type: "none" },
    api: { type: "openapi", url: abs("/.well-known/openapi.yaml"), has_user_authentication: false },
    logo_url: abs("/logo.png"),
    contact_email: EMAIL,
    legal_info_url: abs("/legal/terms"),
  };
  const limits = { name_for_human: 20, name_for_model: 50, description_for_human: 100, description_for_model: 8000 };
  for (const [field, max] of Object.entries(limits)) {
    if (plugin[field].length > max) {
      throw new Error(`build-api: ai-plugin.json ${field} is ${plugin[field].length} characters; the limit is ${max}.`);
    }
  }
  if (!/^[a-zA-Z0-9_]+$/.test(plugin.name_for_model)) {
    throw new Error("build-api: ai-plugin.json name_for_model may contain only letters, digits and underscores.");
  }
  await put("/.well-known/ai-plugin.json", plugin);
}

// ------------------------------------------------- RFC 9727 API catalog

await put("/.well-known/api-catalog.json", {
  linkset: [
    {
      anchor: ORIGIN,
      // RFC 9727 wants the catalogued APIs themselves under `item`; the
      // service-* relations describe them. Without `item` the linkset says
      // "here is documentation" without ever naming the API it documents.
      item: [
        {
          href: abs("/api"),
          type: "application/json",
          title: `${NAME} portfolio API — service root`,
        },
        {
          href: abs(`${API}`),
          type: "application/json",
          title: "Version 1 — current, stable",
        },
        {
          href: abs("/mcp"),
          type: "application/json",
          title: `${NAME} portfolio MCP server — Streamable HTTP, read-only`,
        },
        {
          href: abs("/a2a"),
          type: "application/json",
          title: `${NAME} portfolio A2A agent — JSON-RPC, A2A 1.0 and 0.3, read-only`,
        },
      ],
      "service-desc": [
        {
          href: abs("/.well-known/mcp/server-card.json"),
          type: "application/json",
          title: `${NAME} portfolio MCP server — server card`,
        },
        {
          href: abs("/.well-known/agent-card.json"),
          type: "application/json",
          title: `${NAME} portfolio A2A agent — agent card`,
        },
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

// ---------------------------------------------------- MCP server card
//
// A2A_SKILLS and A2A_VERSIONS come out of the same transpile and are used by
// the agent card further down.
let MCP_TOOLS, MCP_VERSIONS, A2A_SKILLS, A2A_VERSIONS;
//
// The MCP server itself lives in middleware.ts (POST /mcp). Its tool table is
// read from that file here, the way scripts/check-negotiation.mjs reads the
// negotiation rule, so the card is generated from the code that serves the
// tools rather than from a second list that could drift.
{
  const { transformSync } = await import("esbuild");
  const src = (await readFile(join(ROOT, "middleware.ts"), "utf8")).replace(
    /^import[^;]+from "@vercel\/edge";$/m,
    "const rewrite = () => {}, next = () => {};",
  );
  const js = transformSync(src, { loader: "ts", format: "esm" }).code;
  ({ MCP_TOOLS, MCP_VERSIONS, A2A_SKILLS, A2A_VERSIONS } = await import(
    `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
  ));
  const card = {
    name: "harshith-nayaka-l-portfolio",
    title: `${NAME} — portfolio`,
    description:
      `Read-only MCP server over ${NAME}'s portfolio: profile, projects, case studies, FAQ and agent skills. ` +
      "The same content as the site and its JSON API; no authentication, nothing can be written or sent.",
    version: "1.0.0",
    serverUrl: abs("/mcp"),
    websiteUrl: ORIGIN,
    protocolVersion: MCP_VERSIONS[0],
    supportedProtocolVersions: MCP_VERSIONS,
    transport: { type: "streamable-http", url: abs("/mcp") },
    authentication: { required: false },
    capabilities: { tools: { listChanged: false } },
    tools: MCP_TOOLS.map(({ name, title, description, inputSchema }) => ({
      name,
      title,
      description,
      inputSchema,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    })),
    documentation: abs("/developers"),
  };
  await put("/.well-known/mcp/server-card.json", card);
}

// ------------------------------------------------ GitHub contributions
//
// Data for the contribution graph, from github.com/grubersjoe/github-contributions-api.
// The page reads /data/github-contributions.json, which on Vercel is the live
// function in api/github-contributions.mjs. This writes the snapshot the page
// falls back to when that function fails, and the only data `npm run preview`
// has, since it runs no functions.
//
// A failed fetch never fails the build. The snapshot is simply not written,
// and if the live endpoint is down too the section renders nothing rather than
// a graph of zeroes that would read as a year of no work.
{
  const { GITHUB_USER, fetchContributions } = await import(join(ROOT, "api/_contributions.mjs"));
  const user = GITHUB.replace(/\/+$/, "").split("/").pop();
  if (user !== GITHUB_USER) {
    throw new Error(
      `build-api: api/_contributions.mjs GITHUB_USER is "${GITHUB_USER}" but src/data/projects.ts GITHUB is "${user}".`,
    );
  }
  try {
    const data = await fetchContributions(user);
    await put("/data/github-contributions.snapshot.json", data);
    console.log(`[api] GitHub contributions snapshot: ${data.total} in the last year (${data.contributions.length} days)`);
  } catch (err) {
    console.warn(`[api] GitHub contributions snapshot skipped: ${err.message}`);
  }
}

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
  `- [Case studies](${abs(`${API}/case-studies`)}): every case study summarised, with \`?view=full\` for the complete write-ups — problem, build, pipeline stages, results, stack. One record: \`${abs(`${API}/case-studies/maestro`)}\`.`,
  `- [FAQs](${abs(`${API}/faqs`)}): question and answer pairs.`,
  "",
  "## Authentication",
  "",
  "None. Every record served here is already public on the site, so there is no key to obtain, no token to refresh and no scope to request.",
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
  `- [JSON collection](${abs(`${API}/case-studies?view=full`)}): the same corpus as structured records.`,
  "",
].join("\n");

await put_text("/work/llms.txt", workLlms);

async function put_text(path, body) {
  const file = join(DIST, path.replace(/^\//, ""));
  await mkdir(join(file, ".."), { recursive: true });
  await writeFile(file, body, "utf8");
}


// -------------------------------------------------------- developer portal
//
// /developers, because "the API docs are at /openapi.json" is only useful to
// someone who already knows the API exists. A portal is the page a person or
// an agent lands on when they are looking for one, and it is where the
// answers to "is there a key", "is there a rate limit" and "what happens when
// it fails" belong — stated, rather than left to be discovered by trying.
const developerPortal = [
  `# ${NAME} — Developer portal`,
  "",
  "> Public, read-only JSON over everything on this site. No key, no signup, no rate limit, no write surface.",
  "",
  "## Quickstart",
  "",
  "```",
  `curl ${abs("/api/v1/projects")}`,
  "```",
  "",
  "That is the whole setup. There is no authentication step because there is nothing here that is not already public on the page.",
  "",
  "## Endpoints",
  "",
  `| Method | Path | Returns |`,
  `| --- | --- | --- |`,
  `| GET | [\`/api\`](${abs("/api")}) | Service root and available versions |`,
  `| GET | [\`/api/v1\`](${abs(API)}) | Every collection in this version |`,
  `| GET | [\`/api/v1/profile\`](${abs(`${API}/profile`)}) | Name, headline, location, contact, focus areas |`,
  `| GET | [\`/api/v1/projects\`](${abs(`${API}/projects`)}) | Every project, strongest first |`,
  `| GET | \`/api/v1/projects/{slug}\` | One project |`,
  `| GET | [\`/api/v1/case-studies\`](${abs(`${API}/case-studies`)}) | Every case study, summarised; \`?view=full\` for all of them in full |`,
  `| GET | \`/api/v1/case-studies/{slug}\` | One case study, in full |`,
  `| GET | [\`/api/v1/faqs\`](${abs(`${API}/faqs`)}) | Question and answer pairs |`,
  `| GET | [\`/api/v1/skills\`](${abs(`${API}/skills`)}) | Packaged agent skills published from this site |`,
  "",
  "## MCP server",
  "",
  `The same content is also served over the Model Context Protocol at \`${abs("/mcp")}\` — Streamable HTTP, protocol 2025-11-25, read-only, no authentication. Add that URL as a remote MCP server in any MCP client.`,
  "",
  "| Tool | Returns |",
  "| --- | --- |",
  "| `get_profile` | Name, role, location, availability, contact |",
  "| `list_projects` | Every project with its outcome, tags and slug |",
  "| `get_case_study` | The full write-up for one project, by slug |",
  "| `list_faqs` | The site's question and answer pairs |",
  "| `list_agent_skills` | The published agent skills |",
  "",
  `Server card: [\`/.well-known/mcp/server-card.json\`](${abs("/.well-known/mcp/server-card.json")}).`,
  "",
  "## A2A agent",
  "",
  `An Agent2Agent (A2A) agent answers at \`${abs("/a2a")}\` over the JSON-RPC binding, protocol versions 1.0 and 0.3. Send it a message; it replies with a completed task whose artifact quotes the site's published answer and its source URL. There is no model behind it, so it never answers beyond what the site says. Stateless: no task is stored, and streaming and push notifications are off.`,
  "",
  "| Skill | Send | Returns |",
  "| --- | --- | --- |",
  ...A2A_SKILLS.map((s) => `| \`${s.id}\` | e.g. "${s.examples[0]}" | ${s.name} |`),
  "",
  "```bash",
  `curl -s ${abs("/a2a")} \\`,
  "  -H 'Content-Type: application/json' -H 'A2A-Version: 1.0' \\",
  `  -d '{"jsonrpc":"2.0","id":1,"method":"SendMessage","params":{"message":{"messageId":"1","role":"ROLE_USER","parts":[{"text":"Where is Harshith based?"}]}}}'`,
  "```",
  "",
  `Agent card: [\`/.well-known/agent-card.json\`](${abs("/.well-known/agent-card.json")}). With the official SDK (\`pip install a2a-sdk\`), pass the site origin to \`A2ACardResolver\` and the client picks the interface itself.`,
  "",
  "## Authentication",
  "",
  "None, deliberately. Every record served here is already public on the site, so there is no key to obtain, no token to refresh and no scope to request. Every operation is a read; nothing can be mutated, so there is no separate test environment to point you at and no production data at risk from calling it.",
  "",
  "## Rate limits",
  "",
  "None. The responses are static files on a CDN, so the API has the same availability and the same limits as the site itself.",
  "",
  "## Errors",
  "",
  "Anything under `/api` that does not resolve returns JSON, never an HTML error page:",
  "",
  "```json",
  JSON.stringify(
    {
      error: {
        code: "not_found",
        message: 'No projects record with the slug "nope".',
        hint: "GET /api/v1/projects lists every valid slug.",
        documentation: abs("/openapi.json"),
      },
    },
    null,
    2,
  ),
  "```",
  "",
  "`code` is stable and safe to branch on. `hint` names the call that will tell you the valid values.",
  "",
  "## Machine-readable description",
  "",
  `- [OpenAPI 3.1](${abs("/openapi.json")}) — every route typed, with a unique operationId and a description on each operation.`,
  `- [API catalog](${abs("/.well-known/api-catalog")}) — RFC 9727 linkset.`,
  `- [Agent skills index](${abs("/.well-known/agent-skills/index.json")}) — capabilities, when to use them, and a sha256 digest of each artifact.`,
  `- [Agent resource catalog](${abs("/.well-known/ard.json")}) — every agent-readable resource on this host.`,
  "",
  "## Versioning",
  "",
  "`/api/v1` is current and stable. Fields are added, never removed or retyped. A breaking change would ship as `/api/v2` with v1 still serving.",
  "",
  "## Other formats",
  "",
  "Every page is also a document. Append `/index.md` or `.md` to any route, send `Accept: text/markdown`, or add `?mode=agent`.",
  "",
  `- [llms.txt](${abs("/llms.txt")}) — the index, with a when-to-use section.`,
  `- [llms-full.txt](${abs("/llms-full.txt")}) — every case study in one fetch.`,
  `- [agents.md](${abs("/agents.md")}) — what this site is a good source for, and what it is not.`,
  "",
].join("\n");

// ---------------------------------------------------------------- auth.md
//
// The agent-auth walkthrough (github.com/workos/auth.md), written for a
// service that has no auth. An agent following that spec reads it section by
// section, so each section answers in place: there is nothing to register,
// claim or exchange. Advertising OAuth metadata or an identity endpoint would
// send it looking for machinery that does not exist.
const authMd = [
  `# Authentication — ${NAME} portfolio`,
  "",
  "> No credentials exist for this site. The JSON API, the MCP server and every page are public and read-only: call them directly, with no key, token or account.",
  "",
  "## Discover",
  "",
  `There is no authorization server, so there is no \`/.well-known/oauth-protected-resource\` or \`/.well-known/oauth-authorization-server\` and no \`agent_auth\` block. Endpoints never answer 401, so there is no \`WWW-Authenticate\` challenge to read. What exists: the REST API at ${abs("/api")}, described by ${abs("/openapi.json")}, and the MCP server at ${abs("/mcp")}.`,
  "",
  "## Pick a method",
  "",
  "Anonymous access is the only method, and it is sufficient for everything: every operation is a read of public content.",
  "",
  "## Register, Claim, Exchange",
  "",
  "Not applicable. There is no client registration, no identity to claim and no token to exchange.",
  "",
  "## Use the access_token",
  "",
  "Send requests without an `Authorization` header:",
  "",
  "```",
  `curl ${abs("/api/v1/projects")}`,
  "```",
  "",
  "## Errors",
  "",
  `Errors are JSON with a stable \`code\`, a \`message\` and a \`hint\` naming the call that lists valid values. None of them are auth errors. Details in the [developer portal](${abs("/developers")}).`,
  "",
  "## Revocation",
  "",
  "Nothing is issued, so there is nothing to revoke.",
  "",
].join("\n");

await put_text("/auth.md", authMd);

await put_text("/developers/index.md", developerPortal);
await put_text("/developers.md", developerPortal);

// A scoped llms.txt for the portal, so an agent after integration detail can
// fetch that alone instead of the whole manual.
await put_text(
  "/developers/llms.txt",
  [
    `# ${NAME} — Developer portal`,
    "",
    "> How to call the read-only JSON API on this site: endpoints, error shape, versioning and the machine-readable descriptions of all of it.",
    "",
    "No key, no signup, no rate limit, no write surface. Static JSON on a CDN.",
    "",
    "## Start here",
    "",
    `- [Developer portal](${abs("/developers")}): quickstart, endpoint table, auth, errors, versioning.`,
    `- [OpenAPI 3.1 description](${abs("/openapi.json")}): every route typed, one operationId and a description per operation.`,
    `- [Service root](${abs("/api")}): available versions.`,
    "",
    "## Resources",
    "",
    `- [Profile](${abs(`${API}/profile`)}): name, headline, location, contact, focus areas.`,
    `- [Projects](${abs(`${API}/projects`)}): every project, strongest first.`,
    `- [Case studies](${abs(`${API}/case-studies`)}): every case study summarised; \`?view=full\` for the full write-ups, or one at a time by slug.`,
    `- [FAQs](${abs(`${API}/faqs`)}): question and answer pairs.`,
    `- [Agent skills](${abs(`${API}/skills`)}): the packaged skills published from this site.`,
    "",
    "## Errors",
    "",
    `- [Error shape](${abs("/developers")}): every failure under /api returns JSON with a stable code, a message and a hint naming the call that lists valid values.`,
    "",
  ].join("\n"),
);

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
// The agent card describes the A2A agent in middleware.ts (POST /a2a), and its
// skills are read from that file's A2A_SKILLS, so the card cannot advertise a
// skill the handler does not serve. It used to name /api/v1 as an A2A
// endpoint, which answers no A2A method.
//
// The card is written for A2A 1.0 (supportedInterfaces, one entry per
// protocol version) and also carries the 0.3 top-level fields (url,
// preferredTransport, protocolVersion). A 0.3 client reads only those, a 1.0
// client reads only supportedInterfaces, and both SDKs were run against the
// deployed card to confirm neither rejects the other's fields.

await put("/.well-known/agent-card.json", {
  name: `${NAME} — portfolio agent`,
  description:
    `Answers questions about ${NAME}, an AI Engineer in Bengaluru, India: his role, projects, how he works and how to hire him. ` +
    "Every answer is quoted verbatim from the site's published FAQ, case studies or profile, with its source URL; there is no model behind it and nothing is generated. " +
    "Read-only and stateless: no authentication, no task storage, no streaming.",
  supportedInterfaces: A2A_VERSIONS.map((protocolVersion) => ({
    url: abs("/a2a"),
    protocolBinding: "JSONRPC",
    protocolVersion,
  })),
  provider: { organization: NAME, url: ORIGIN },
  version: "2.0.0",
  documentationUrl: abs("/developers"),
  iconUrl: abs("/favicon.svg"),
  capabilities: { streaming: false, pushNotifications: false, extendedAgentCard: false },
  securitySchemes: {},
  securityRequirements: [],
  defaultInputModes: ["text/plain", "application/json"],
  defaultOutputModes: ["text/markdown", "application/json"],
  skills: A2A_SKILLS.map((skill) => ({
    ...skill,
    tags: [...skill.tags],
    examples: [...skill.examples],
    inputModes: ["text/plain", "application/json"],
    outputModes: ["text/markdown", "application/json"],
  })),
  // A2A 0.3 fields, for clients that predate supportedInterfaces.
  protocolVersion: "0.3.0",
  url: abs("/a2a"),
  preferredTransport: "JSONRPC",
});

// ------------------------------------------------ ARD manifest
//
// Agentic Resource Discovery (agenticresourcediscovery.org, spec 0.91). It
// used to be two hand-copied static files in public/.well-known, which listed
// the MCP server by its endpoint under a made-up media type and mixed plain
// documents in with agentic resources. It is now generated from the same
// tables that serve each resource, and lists only what ARD indexes: the API,
// the MCP server, the A2A agent and the published agent skills, each under
// the media type the spec's conformance tool recognises and pointing at the
// resource's own descriptor. Documents (llms.txt, agents.md, the sitemap)
// stay discoverable through llms.txt; the conformance tool reads any text/*
// entry as a malformed skill.
//
// /.well-known/ard.json is the path the spec requires consumers to fetch.
// ai-catalog.json is its predecessor, which consumers MAY still consult, so
// the same document is written to both. Every page also carries
// <link rel="ard">, the other mechanism consumers MUST honour.
{
  const host = new URL(ORIGIN).host;
  const urn = (namespace, name) => `urn:air:${host}:${namespace}:${name}`;
  const trustManifest = { identity: ORIGIN, identityType: "https" };
  const base = { "@context": "https://agenticresourcediscovery.org/context/v1", updatedAt: new Date(stamp).toISOString() };
  const operations = Object.values(openapi.paths).flatMap((m) => Object.values(m).map((op) => op.operationId));
  const entries = [
    {
      ...base,
      identifier: urn("api", "rest-v1"),
      displayName: `${NAME} — portfolio REST API`,
      type: "application/vnd.oai.openapi+json;version=3.1",
      url: abs("/openapi.json"),
      description:
        `Read-only JSON API over ${NAME}'s profile, projects, case studies, FAQ and agent skills. No authentication, no write operations; also importable as a ChatGPT Action.`,
      capabilities: operations,
      representativeQueries: [
        `what has ${NAME} built`,
        "get the Maestro case study as structured JSON",
        "which projects use retrieval-augmented generation",
      ],
      version: openapi.info.version,
      trustManifest,
    },
    {
      ...base,
      identifier: urn("mcp", "portfolio"),
      displayName: `${NAME} — portfolio MCP server`,
      type: "application/mcp-server-card+json",
      url: abs("/.well-known/mcp/server-card.json"),
      description:
        `Read-only MCP server (Streamable HTTP, ${abs("/mcp")}) over ${NAME}'s profile, projects, case studies, FAQ and agent skills. No authentication.`,
      capabilities: MCP_TOOLS.map((t) => t.name),
      representativeQueries: [
        `add ${NAME}'s portfolio as an MCP server`,
        "look up an AI engineer's case studies over MCP",
        "get the Cannon case study through an MCP tool",
      ],
      trustManifest,
    },
    {
      ...base,
      identifier: urn("a2a", "portfolio-agent"),
      displayName: `${NAME} — portfolio A2A agent`,
      type: "application/a2a-agent-card+json",
      url: abs("/.well-known/agent-card.json"),
      description:
        `A2A agent (JSON-RPC, 1.0 and 0.3, ${abs("/a2a")}) that answers questions about ${NAME}, AI Engineer in Bengaluru, by quoting the site's published answers with their source. Read-only, no authentication.`,
      capabilities: A2A_SKILLS.map((s) => s.id),
      representativeQueries: [
        "find an AI engineer in Bengaluru to hire",
        `ask ${NAME}'s agent what he has built`,
        ...A2A_SKILLS.slice(0, 2).map((s) => s.examples[0]),
      ].slice(0, 5),
      trustManifest,
    },
    ...agentSkills
      .filter((s) => s.skillFile)
      .map((s) => ({
        ...base,
        identifier: urn("skill", s.name),
        displayName: s.name,
        type: 'text/markdown; profile="urn:air:agent-skills"',
        url: s.skillFile,
        description: `${s.tagline}. ${s.premise}`,
        tags: s.tags,
        representativeQueries: s.queries,
        metadata: { repository: s.repo },
        trustManifest,
      })),
  ];

  // The spec's own checks (Appendix D), enforced here so a bad entry fails
  // the build rather than an indexer.
  for (const e of entries) {
    const where = `build-api: ARD entry ${e.identifier}`;
    if (!/^urn:air:[a-zA-Z0-9.-]+(:[a-zA-Z0-9._-]+)+$/.test(e.identifier)) throw new Error(`${where}: identifier is not urn:air:<publisher>:<namespace>:<name>.`);
    if (!e.displayName || !e.type) throw new Error(`${where}: displayName and type are required.`);
    if (Boolean(e.url) === Boolean(e.data)) throw new Error(`${where}: exactly one of url or data.`);
    const n = e.representativeQueries?.length ?? 0;
    if (n < 2 || n > 5) throw new Error(`${where}: representativeQueries has ${n}; the spec asks for 2-5.`);
    if (new URL(e.trustManifest.identity).host !== e.identifier.split(":")[2]) throw new Error(`${where}: trustManifest.identity does not match the URN publisher.`);
  }

  const manifest = {
    specVersion: "0.91",
    host: {
      displayName: NAME,
      identifier: host,
      description:
        `Portfolio and engineering case studies of ${NAME}, an AI Engineer in Bengaluru, India: a read-only REST API, an MCP server, an A2A agent and published agent skills. Documents for agents are indexed at ${abs("/llms.txt")}.`,
    },
    entries,
  };
  await put("/.well-known/ard.json", manifest);
  await put("/.well-known/ai-catalog.json", manifest);
}

const SKILL_ARTIFACT = {
  "list-projects": "/api/v1/projects.json",
  "get-case-study": "/api/v1/case-studies.json",
  "get-profile": "/api/v1/profile.json",
  "list-agent-skills": "/api/v1/skills.json",
  "read-page-markdown": "/index.md",
  "read-full-corpus": "/llms-full.txt",
};

await put("/.well-known/agent-skills/index.json", {
  $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
  name: `${NAME} — portfolio`,
  description:
    "Capabilities this host exposes to agents. Read-only: documents and JSON, no task execution and no write surface.",
  homepage: ORIGIN,
  // When to use this, stated plainly rather than left to be inferred from a
  // capability list. An agent deciding whether to call a host needs the jobs
  // it is right for, and the jobs it is wrong for, in the same place.
  whenToUse: {
    goodFor: [
      "Answering questions about Harshith Nayaka L specifically: what he has built, how a given system works, how to reach him.",
      "Reading a worked example of multi-model orchestration, verifier design, agent isolation or local-only inference, written by the engineer who built it with the source public.",
      "Pulling structured records — projects, case studies, FAQs — instead of parsing a rendered page.",
    ],
    notFor: [
      "Anything transactional. This is one engineer's portfolio, not a product: there is no account, no write surface and nothing to purchase.",
      "Pricing, rates, availability or engagement terms. They are not published here, and inventing them would be worse than the gap.",
      "General questions about AI engineering that are not about this person's work.",
    ],
    howToCall:
      "Start at /api/v1 for structured records, /llms.txt for the index, or /llms-full.txt for every case study in one fetch. Any page route also answers Accept: text/markdown and ?mode=agent.",
  },
  skills: [
    {
      name: "list-projects",
      type: "skill-md",
      description: "List every project with its outcome, tags, status and links.",
      url: abs(`${API}/projects`),
      endpoint: abs(`${API}/projects`),
      method: "GET",
      contentType: "application/json",
      schema: abs("/openapi.json#/paths/~1api~1v1~1projects/get"),
    },
    {
      name: "get-case-study",
      type: "skill-md",
      description: "Fetch one project's full engineering write-up: problem, architecture, pipeline stages, results and stack.",
      url: abs(`${API}/case-studies`),
      endpoint: abs(`${API}/case-studies/{slug}`),
      method: "GET",
      contentType: "application/json",
      schema: abs("/openapi.json#/paths/~1api~1v1~1case-studies~1%7Bslug%7D/get"),
    },
    {
      name: "get-profile",
      type: "skill-md",
      description: "Fetch name, headline, location, contact details and focus areas.",
      url: abs(`${API}/profile`),
      endpoint: abs(`${API}/profile`),
      method: "GET",
      contentType: "application/json",
      schema: abs("/openapi.json#/paths/~1api~1v1~1profile/get"),
    },
    {
      name: "list-agent-skills",
      type: "skill-md",
      description: "List the packaged agent skills published from this site, each with the failure mode it was built against and its public repository.",
      url: abs(`${API}/skills`),
      endpoint: abs(`${API}/skills`),
      method: "GET",
      contentType: "application/json",
      schema: abs("/openapi.json#/paths/~1api~1v1~1skills/get"),
    },
    {
      name: "read-page-markdown",
      type: "skill-md",
      description: "Read any page as clean markdown. Append /index.md or .md to a route, send Accept: text/markdown, or add ?mode=agent.",
      url: abs("/index.md"),
      endpoint: abs("/index.md"),
      method: "GET",
      contentType: "text/markdown",
    },
    {
      name: "read-full-corpus",
      type: "skill-md",
      description: "Read every case study inlined in one fetch instead of paging through the site.",
      url: abs("/llms-full.txt"),
      endpoint: abs("/llms-full.txt"),
      method: "GET",
      contentType: "text/markdown",
    },
  ].map((skill) => ({ ...skill, digest: SKILL_ARTIFACT[skill.name] })),
});

// Swap the artifact paths recorded above for real hashes of those artifacts.
{
  const file = join(DIST, ".well-known/agent-skills/index.json");
  const index = JSON.parse(await readFile(file, "utf8"));
  for (const skill of index.skills) {
    skill.digest = await digestOf(skill.digest);
  }
  await writeFile(file, `${JSON.stringify(index, null, 2)}\n`, "utf8");
}

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

// Same failure, other table: an extensionless rewrite in vercel.json that
// middleware.ts does not pass through is answered with the markdown 404 for
// any client that doesn't ask for text/html, because middleware runs first.
{
  const vercel = JSON.parse(await readFile(join(ROOT, "vercel.json"), "utf8"));
  const src = middleware.match(/REWRITTEN_ROUTE\s*=\s*\/(.+)\/;/)?.[1];
  if (!src) throw new Error("build-api: could not find REWRITTEN_ROUTE in middleware.ts");
  const passes = new RegExp(src);
  const blocked = (vercel.rewrites ?? [])
    .map((r) => r.source)
    .filter((s) => !/\.[a-z0-9]{2,5}$/i.test(s) && !passes.test(s));
  if (blocked.length) {
    throw new Error(
      `build-api: vercel.json rewrites ${blocked.join(", ")} but middleware.ts REWRITTEN_ROUTE does not let it through.`,
    );
  }
}

// ------------------------------------------------ GPT Actions limits
//
// ChatGPT Actions reject a response over 100,000 characters and an operation
// summary or description over 300 (parameters: 700). The case-study
// collection crossed the first limit unnoticed at 110K, so every operation
// in the spec is checked here against the file it serves, with a margin: at
// 90,000 the build fails while there is still room to decide what to split.
// ?view=full is the one documented exception and says so in its parameter.
{
  const { readdir } = await import("node:fs/promises");
  const walk = async (dir) =>
    (await readdir(dir, { withFileTypes: true })).flatMap((e) => (e.isDirectory() ? [] : [join(dir, e.name)]));
  const files = [
    ...(await walk(join(DIST, "api/v1"))),
    ...(await walk(join(DIST, "api/v1/projects"))),
    ...(await walk(join(DIST, "api/v1/case-studies"))),
    join(DIST, "api/index.json"),
  ].filter((f) => f.endsWith(".json") && !f.endsWith(".full.json"));
  const over = [];
  for (const f of files) {
    const chars = [...(await readFile(f, "utf8"))].length;
    if (chars > 90_000) over.push(`${f.slice(DIST.length)} (${chars})`);
  }
  if (over.length) {
    throw new Error(`build-api: API responses over 90,000 characters (ChatGPT Actions limit is 100,000): ${over.join(", ")}`);
  }
  const long = [];
  for (const [path, methods] of Object.entries(openapi.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      for (const field of ["summary", "description"]) {
        if ((op[field] ?? "").length > 300) long.push(`${method.toUpperCase()} ${path} ${field}`);
      }
      for (const prm of op.parameters ?? []) {
        if ((prm.description ?? "").length > 700) long.push(`${method.toUpperCase()} ${path} parameter ${prm.name}`);
      }
    }
  }
  if (long.length) throw new Error(`build-api: OpenAPI text over the ChatGPT Actions limits: ${long.join(", ")}`);
}

console.log(
  `[api] ${projectList.length} projects, ${studyList.length} case studies, ${faqs.length} faqs, OpenAPI 3.1, RFC 9727 catalog`,
);
