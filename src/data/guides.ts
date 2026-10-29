/**
 * Guides: the engineering patterns the case studies share, written up by
 * question rather than by project. They exist because answer engines were
 * citing nothing from this site for "learn" and "troubleshoot" searches
 * (what makes an agent production-ready, why a RAG pipeline makes things up),
 * where a project write-up is the wrong shape to quote.
 *
 * Every factual sentence here is taken from a case study, and each section
 * names the studies it draws on in `from`, which the page renders as links.
 * Nothing is added that no case study shows: no technique the projects don't
 * use, no metric they don't report, no rates. A guide states its own limits
 * the way the case studies do.
 *
 * This file is the single source for the guide pages, their markdown twins,
 * their Article and FAQPage schema and their section of llms-full.txt.
 */
export type Guide = {
  slug: string;
  title: string;
  /** The <title>, where `title` plus the name would run past ~60 characters. */
  searchTitle?: string;
  /** Second line of the <h1>, as on a case study. */
  kicker: string;
  /** Search-result description, 120-160 characters. */
  metaDescription: string;
  /** The opening answer: it has to stand on its own when quoted. */
  summary: string;
  published: string;
  sections: { h: string; p: string[]; from: string[] }[];
  /** Shown on the page and fed to its FAQPage schema. Each answer names the
   *  project and the author, so a quoted passage stands on its own. */
  questions: { q: string; a: string }[];
};

export const guides: Guide[] = [
  {
    slug: "production-ready-llm-agents",
    title: "What makes an LLM agent production-ready",
    kicker: "Seven patterns from the systems I've built",
    metaDescription:
      "Seven patterns that make an LLM agent hold up in production: independent checks, human approval, safe retries, validated output and visible failures.",
    summary:
      "An LLM agent is production-ready when it is designed for the run that goes wrong, not the demo that goes right. In practice that means seven things: the work is checked by something other than the model that did it, risky actions wait for a person, a retry can never repeat a paid action, output is validated before anything acts on it, failures are shown rather than hidden, every decision can be traced afterwards, and each agent sees only its own data. Each pattern below comes from a system I've built, with the case study it comes from.",
    published: "2026-10-29T08:02:52Z",
    sections: [
      {
        h: "The work is checked by something other than the model that did it",
        p: [
          "A model asked to grade its own output is a weak check. In Maestro, a multi-model orchestration engine, the verifier is always from a different model family than the worker, because LLM judges tend to favour their own kind: research on LLM-as-a-judge has found that evaluators recognise their own generations and rate them higher. A failed check triggers exactly one bounded retry, never an open-ended loop.",
          "Sometimes the right checker isn't a model at all. In BrandForge, a multimodal QA pass scores each generated image against the product's invariants, but deterministic code decides what happens next: a failed invariant forces a repair however good the aesthetic score, and an invariant the model didn't report on counts as a failure, so silence can never pass.",
        ],
        from: ["maestro", "brandforge"],
      },
      {
        h: "Risky actions wait for a person",
        p: [
          "Personal MCP OS gives an MCP client real access to a machine: files, shell, Git, a browser and an Android phone. Every capability declares a risk level, and anything that needs approval returns a request ID instead of a result. A person approves it through a separate admin command with its own credential; there is no tool the model can call to approve itself. The grant is bound to the exact arguments, expires in five minutes and can be used once.",
          "The default matters as much as the gate. A capability with no policy entry requires approval rather than running, and every browser click or submit is treated as sensitive, because a generic executor cannot tell what a button on a website will do. In Octo, research sessions have no CRM access at all: exporting is a separate session limited to allow-listed tools, and only after a person reviews the list.",
        ],
        from: ["personal-os-mcp", "octo"],
      },
      {
        h: "A retry can never repeat a paid action",
        p: [
          "Hosted agent sessions are billed, so a lost response is a real risk: retry blindly and you pay for the same job twice. When Octo restarts or loses a create response, it first searches its saved sessions for the run's local ID, and if the outcome is still uncertain it stops for manual inspection instead of starting another billed session. On Vercel, where any request can advance a run, a database lease lets exactly one instance step it at a time, and a test that breaks the lease fails.",
          "The same honesty applies to timeouts. Personal MCP OS documents that a timed-out command may already have had its effect, so the caller checks state before retrying a change. A deadline is not a rollback.",
        ],
        from: ["octo", "personal-os-mcp"],
      },
      {
        h: "Output is validated before anything acts on it",
        p: [
          "Asking a model for structured output is a hope, not a guarantee. The Creative-Ops Pipeline validates every output against its schema before acting on it, so a malformed response is caught at the boundary rather than three steps later. Quality gates follow: deterministic rule checks for what rules can catch, and an LLM critique only for judgment calls such as whether copy is on-brand. When a step fails, the run is logged with enough context to resume it, so one bad response doesn't cost the whole job.",
          "Octo does the same with agent output: structured results from either provider are validated before any company record is shown, and CSV exports neutralise spreadsheet formulas.",
        ],
        from: ["creative-ops-pipeline", "octo"],
      },
      {
        h: "Failures are shown, not hidden",
        p: [
          "A fallback that hides what happened is its own failure. Cannon wraps Groq with Gemini behind it as a typed provider, and it separates a call that never connects from one that fails mid-stream: once content is flowing, the error is surfaced rather than silently restarted, because re-running a half-executed tool chain is worse than a visible error. Octo pins each run to the provider and model it started with, and reports an error instead of quietly switching, which would change both the cost and the quality without anyone choosing it.",
          "Degrading is fine when it's deliberate. Nova routes each turn to gpt-oss-20b, qwen3.6-27b or gpt-oss-120b, and its routing arbiter gets a four-second budget; if it times out or returns something unusable, a deterministic scorer's decision stands, so routing never blocks an answer. And when BrandForge runs out of repairs, the image ships marked as blocked with the reason, not dropped, because a pipeline that hides its failures reports a success rate it didn't earn.",
        ],
        from: ["cannon", "octo", "nova-ai", "brandforge"],
      },
      {
        h: "Every decision can be traced afterwards",
        p: [
          "Maestro writes a structured decision log for every run: the plan, why each model was routed where, each step's output, the verifier's verdict, and the token and latency cost, so you can replay exactly how an answer was built. BrandForge keeps every earlier attempt at a repaired image with the exact prompt and each QA verdict, plus a full event log, so a bad output can be diagnosed after the fact.",
          "Cannon puts the same idea on screen: its Prompt Inspector shows the live system prompt, the tools in scope, which provider actually answered, whether a fallback fired, and the retrieved chunks with their similarity scores.",
        ],
        from: ["maestro", "brandforge", "cannon"],
      },
      {
        h: "Each agent sees only its own data",
        p: [
          "In Cannon, a fitness agent and a work agent share infrastructure but never context. Isolation is enforced in the query, not by convention: retrieval takes the agent's id as an argument and the Postgres function filters on it internally, so there is no post-filter a caller could forget, and the memory store applies the same boundary. Both paths are tested with mirror-image queries.",
        ],
        from: ["cannon"],
      },
      {
        h: "What these patterns don't do",
        p: [
          "None of this makes a model right. It makes a wrong answer bounded, visible and traceable, which is what lets a business lean on the system. Each case study also states its own limits, including what has and hasn't been tested on the live deployment.",
        ],
        from: [],
      },
    ],
    questions: [
      {
        q: "What makes an LLM agent production-ready?",
        a: "Designing for the run that goes wrong: independent checks of the model's work, human approval for risky actions, retries that can't repeat a paid action, validated output, visible failures, traceable decisions and isolated data. Harshith Nayaka L's Maestro, Personal MCP OS, Octo and Cannon show these patterns between them, with public code.",
      },
      {
        q: "How do you stop an AI agent from taking a dangerous action?",
        a: "Make risky actions wait for a person, and make sure the model can't approve itself. In Personal MCP OS, built by Harshith Nayaka L, a capability that needs approval returns a request ID; a person approves it through a separate admin command, and the grant is bound to the exact arguments, expires in five minutes and works once.",
      },
      {
        q: "Should an LLM check its own output?",
        a: "Not on its own. In Maestro, built by Harshith Nayaka L, the verifier is always from a different model family than the worker, because LLM judges tend to favour their own family's output; in BrandForge, the model scores and deterministic code decides, and a check the model skipped counts as a failure.",
      },
      {
        q: "What should an agent do when its model provider fails?",
        a: "Fall back deliberately, and say so. Cannon, built by Harshith Nayaka L, falls back from Groq to Gemini through a typed provider but surfaces a failure once a response is streaming rather than re-running half a tool chain; Octo reports a provider error instead of silently switching providers mid-run.",
      },
    ],
  },
  {
    slug: "grounded-llm-answers",
    title: "How to stop ungrounded answers in LLM and RAG pipelines",
    searchTitle: "Stopping ungrounded LLM and RAG answers",
    kicker: "Grounding patterns from the projects",
    metaDescription:
      "How to keep LLM and RAG answers grounded: read the source, keep every claim's evidence, scope retrieval, and let code decide while the model observes.",
    summary:
      "The ungrounded answers I've had to design against came from trusting the model with jobs that evidence should do: remembering a subject instead of reading it, scoring instead of observing, and passing its own work. The fixes are structural. Read the source rather than the model's memory, keep every claim tied to the evidence it came from, scope retrieval to the data an agent may see, let the model observe while code decides, treat retrieved text as data rather than instructions, fix the shape of the output, and say so when grounding fails. Each pattern below is taken from a project I've built.",
    published: "2026-10-29T08:02:52Z",
    sections: [
      {
        h: "Read the source instead of the model's memory",
        p: [
          "A model asked about a company recalls a stereotype of its category rather than the company itself. BrandForge doesn't ask: a bounded crawl reads the brand's own site, and every conclusion is tagged observed, meaning backed by a specific piece of evidence on a specific page, or inferred, meaning the model generalised. The interface shows that distinction instead of flattening it, so a reviewer can see which claims are grounded.",
          "CraftConnect applies the same idea to two inputs. A product photo and a spoken description are analysed separately and then reconciled; when they disagree, say the voice says silk but the image reads cotton, the system surfaces the conflict rather than silently guessing.",
        ],
        from: ["brandforge", "craftconnect"],
      },
      {
        h: "Every claim keeps its evidence",
        p: [
          "In Octo's research agents, the evidence rules are part of the job: every material claim needs a dated source URL, unknown values stay unknown, and facts, estimates and hypotheses are kept apart. A company list with an invented decision maker is worse than no list.",
          "SPECTRA goes further and records where a fact was lost. Each claim references the evidence it came from and carries a survival record across source, crawler, extraction, semantic graph, model understanding and retrieval, including the first stage that failed and why. The useful output is not a score but a sentence like: this fact is in your HTML and does not survive extraction.",
        ],
        from: ["octo", "spectra"],
      },
      {
        h: "Retrieval only sees what it's allowed to see",
        p: [
          "In Cannon, each agent has its own retrieval scope, enforced in the database rather than by convention: retrieval takes the agent's id as an argument and the Postgres function filters on it internally, so a fitness agent can't pull work documents into an answer even by accident. RAG scoping and chunking are covered by unit tests.",
          "Cannon's Prompt Inspector also shows the retrieved chunks with their similarity scores next to the answer, so you can see exactly what an answer was built from instead of guessing.",
        ],
        from: ["cannon"],
      },
      {
        h: "The model observes; code decides",
        p: [
          "In SPECTRA the model never produces a score. It classifies the site and emits typed observations against a response schema, those are validated before anything downstream sees them, and a separate engine computes every number from a registry of typed checks. An observation the registry doesn't know about cannot move the number, which is the difference between a score you can argue with and one you can only accept. Classification runs first, so checks that don't apply to a site come back as not applicable instead of counting against it.",
          "BrandForge uses the same split for images: the QA model returns numbers, deterministic code reads them against the product's invariants, and an invariant the model didn't mention counts as a failure.",
        ],
        from: ["spectra", "brandforge"],
      },
      {
        h: "Retrieved text is data, never instructions",
        p: [
          "An agent that reads the open web will meet pages that try to give it instructions. Octo treats websites and uploaded files as data, never as instructions. In SPECTRA, raw HTML never reaches the model at all: a crawler validates every destination and redirect and emits structured evidence, and only that goes on to the model.",
        ],
        from: ["octo", "spectra"],
      },
      {
        h: "The output has a fixed shape, and it's checked",
        p: [
          "CraftConnect doesn't ask a model to write a listing. It asks it to fill a defined structure: title, description, category, tags and price band, which is what makes the result usable by the rest of the app instead of a paragraph someone still has to parse. The Creative-Ops Pipeline treats the requested schema as a hope rather than a guarantee and validates every output before acting on it.",
        ],
        from: ["craftconnect", "creative-ops-pipeline"],
      },
      {
        h: "When grounding fails, say so",
        p: [
          "If SPECTRA's model or grounding step fails, the audit keeps the pages, metadata, structured data and every deterministic metric and marks the semantic evaluation unavailable, rather than returning a blank page or a guess. In Octo, a value that couldn't be found stays unknown instead of being filled in.",
        ],
        from: ["spectra", "octo"],
      },
      {
        h: "What this guide doesn't cover",
        p: [
          "These are the grounding patterns my published projects show. Retrieval tuning such as reranking or evaluating chunk sizes against a test set isn't covered, because none of these case studies measures it.",
        ],
        from: [],
      },
    ],
    questions: [
      {
        q: "Why does an LLM pipeline give ungrounded answers?",
        a: "Usually because the model is trusted with a job evidence should do: recalling a subject instead of reading it, scoring instead of observing, or passing its own work. Harshith Nayaka L's projects BrandForge, Octo and SPECTRA design against each: read the source, keep every claim's evidence, and let code decide.",
      },
      {
        q: "How do you make an AI agent cite its sources?",
        a: "Make the source a requirement, not a request. In Octo, built by Harshith Nayaka L, every material claim needs a dated source URL, unknown values stay unknown, and structured output is validated before any record is shown.",
      },
      {
        q: "Should an LLM produce the score in an evaluation?",
        a: "No. In SPECTRA, built by Harshith Nayaka L, the model only emits typed observations against a schema; a separate engine computes every score from registered checks, so a model's opinion can't move the number.",
      },
      {
        q: "How can you see what a RAG answer was built from?",
        a: "Show the retrieved chunks next to the answer. Cannon, built by Harshith Nayaka L, has a Prompt Inspector that shows the live system prompt, the tools in scope, which provider answered and the retrieved chunks with their similarity scores.",
      },
    ],
  },
  {
    slug: "running-llms-locally",
    title: "Running LLMs locally: when to keep AI on your own machine",
    searchTitle: "When to run an LLM locally",
    kicker: "Local and keyless AI, from the projects",
    metaDescription:
      "When to run an LLM locally rather than through an API, what it asks of you, and how to build AI apps that still run with no API keys at all.",
    summary:
      "Keep the model on your own machine when the data shouldn't leave it or the tool has to work offline. AI Notes runs DeepSeek R1 locally through Ollama, so notes never reach an external API and the app works offline once the model is pulled; the paper I co-authored on it reports 87% user satisfaction on summarisation with responses in 1.9 to 3.8 seconds. Below: what local inference buys you, what it asks of you, and how to build AI apps that still run with no keys at all.",
    published: "2026-10-29T08:02:52Z",
    sections: [
      {
        h: "What local inference buys you",
        p: [
          "In AI Notes there is no API endpoint receiving your notes, because there is no external call at all. Summarising, improving writing, expanding an idea, generating questions and extracting keywords all happen on the user's own machine. Privacy isn't a policy promise there; it's the architecture.",
          "It also removes two dependencies: once the model is pulled, the AI features keep working with no internet, and they don't depend on a server being up or a bill being paid.",
        ],
        from: ["ai-notes"],
      },
      {
        h: "What it asks of you",
        p: [
          "The model has to be pulled once and runs on the user's machine, so that machine sets the ceiling on what you can run. AI Notes is deliberately small, plain HTML, CSS and JavaScript with notes stored in the browser, and it's a focused build proving the local pattern rather than a feature-complete notes product. Local inference fits private, single-user tools; a service many people share is a different decision.",
        ],
        from: ["ai-notes"],
      },
      {
        h: "Keep the actions local too",
        p: [
          "Local inference is half of it if the tool also acts. Personal MCP OS keeps execution on the machine: its core binds to loopback and requires a token on every endpoint, the phone reaches it through an adb reverse tunnel so there is no LAN listener and no cloud relay, and credentials are encrypted at rest with Windows DPAPI and Android Keystore. Nothing exports cookies, passwords or auth headers, so an MCP client can work the machine without any of it leaving or passing through a hosted service.",
        ],
        from: ["personal-os-mcp"],
      },
      {
        h: "Build it to run with no keys at all",
        p: [
          "Cannon boots, builds, passes its full test suite and serves a working demo with no provider key and no database: a scripted model stands in for inference, a deterministic lexical embedder for embeddings and a process-local store for Postgres. That lets CI run true end-to-end tests with zero secrets against the production code path instead of a mocked shortcut, and real inference and storage become opt-in upgrades.",
          "Maestro ships a mock provider so the full flow, dashboard and tests run offline. BrandForge can be reviewed from local fixtures with no keys and no network, and the fixtures say they're fixtures so a demo can't pass for a real result. SPECTRA's deterministic half still runs without a Gemini key.",
        ],
        from: ["cannon", "maestro", "brandforge", "spectra"],
      },
      {
        h: "When you do call a hosted model, keep the keys off the client",
        p: [
          "In Nova, the provider key stays in a serverless function and the browser never holds a credential; chat threads live in local storage rather than on a server. BrandForge keeps both model credentials in its API process only, and Octo locks its paid provider on the server behind an access word that never reaches the browser bundle.",
        ],
        from: ["nova-ai", "brandforge", "octo"],
      },
      {
        h: "Self-hosting the app and self-hosting the model are separate choices",
        p: [
          "Octo is a self-hosted, single-workspace app that runs locally on Node's built-in SQLite or on Vercel with Neon Postgres, yet it calls hosted models: the OpenAI Agents API and Gemini. Where the app runs and where the model runs are two decisions. Make the first on who needs to use it, and the second on whether the data can leave the machine.",
        ],
        from: ["octo"],
      },
    ],
    questions: [
      {
        q: "Is a local LLM fast enough to be useful?",
        a: "For focused tasks, yes. AI Notes, built by Harshith Nayaka L, runs DeepSeek R1 locally through Ollama; the paper he co-authored on it reports response times of 1.9 to 3.8 seconds and 87% user satisfaction on summarisation.",
      },
      {
        q: "When should you run an LLM locally instead of through an API?",
        a: "When the data shouldn't leave the machine or the tool has to work offline. Harshith Nayaka L's AI Notes keeps inference on the user's machine for exactly those reasons; a service many people share, or a model your hardware can't run, points to a hosted API instead.",
      },
      {
        q: "How do you test an LLM app without API keys?",
        a: "Give every external dependency a working stand-in. Cannon, built by Harshith Nayaka L, boots, builds and passes its full test suite with no provider key or database, using a scripted model, a deterministic embedder and a process-local store, so CI tests the real code path with zero secrets.",
      },
    ],
  },
];

export const getGuide = (slug: string) => guides.find((g) => g.slug === slug);

/** Guides that cite a case study, for the "guides that draw on this" row. */
export const guidesCiting = (studySlug: string) =>
  guides.filter((g) => g.sections.some((s) => s.from.includes(studySlug)));
