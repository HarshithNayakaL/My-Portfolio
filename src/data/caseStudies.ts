export type PipelineNode = {
  id: string;
  label: string;
  detail?: string;
  kind?: "input" | "model" | "logic" | "gate" | "output";
};

export type PipelineStage = {
  title: string; // short column heading, e.g. "Capture"
  nodes: PipelineNode[];
};

export type HowItWorksItem = {
  title: string;
  body: string;
};

export type CaseStudy = {
  slug: string;
  title: string;
  outcome: string;
  kicker: string;
  meta: { label: string; value: string }[];
  inProgress?: boolean;
  problem: string[];
  build: string[];
  pipeline: PipelineStage[];
  howItWorks: HowItWorksItem[];
  results: { label: string; body: string }[];
  tech: string[];
  /** Search-result description, 120-160 characters. Written for the snippet
   *  rather than reusing `outcome`: that is prose for the page and its length
   *  swings from 99 to 213 characters, which search engines flag either way. */
  metaDescription: string;
  /** When the case study first appeared on this site: the author time of the
   *  commit that added it (git log -S on its slug; brand-audit-platform was
   *  first published as seo-command-center). Stored, not computed at build,
   *  because Vercel builds from a shallow clone that would get it wrong.
   *  Feeds Article.datePublished and the visible "Published" line. */
  published: string;
  /** Replaces `kicker` where it means nothing to a search ("Flagship"): in
   *  the <title>, and in the page's eyebrow line, which is part of its <h1>. */
  searchKicker?: string;
  /** Questions people search for that this case study answers, shown on the
   *  page ("Questions this answers") and feeding its FAQPage schema, markdown
   *  twin, llms-full.txt and the API. Each answer states its answer in the
   *  first sentence and names the project and author, so a quoted passage
   *  stands on its own; every fact in it is taken from this case study. */
  questions?: { q: string; a: string }[];
  /** Real screenshot of the running product. Intrinsic size is the full
   *  capture; the page frames a preview of it, but the served file is whole
   *  so image search and AI surfaces get the entire thing. */
  shot?: { src: string; width: number; height: number; alt: string };
  links: { label: string; href: string }[];
};

const craftconnect: CaseStudy = {
  slug: "craftconnect",
  published: "2026-06-06T01:30:29Z",
  title: "CraftConnect",
  kicker: "Gen AI Exchange Hackathon 2025",
  searchKicker: "Multi-modal artisan assistant",
  outcome:
    "Let an artisan stand up an online storefront by talking and showing a product, instead of typing forms in a language that isn't theirs.",
  meta: [
    { label: "Role", value: "Product lead, full frontend, co-built backend" },
    { label: "Context", value: "Gen AI Exchange Hackathon 2025" },
    { label: "Scale", value: "270,000+ developers nationally" },
    { label: "Status", value: "Built & deployed on Google Cloud" },
  ],
  problem: [
    "Most artisans don't lose sales because their craft isn't good enough. They lose them because getting a product online means typing English product descriptions, setting prices, writing tags, and fighting a form-heavy interface that assumes you already know e-commerce.",
    "That barrier is the whole problem. The skill is in the hands; the friction is in the keyboard.",
  ],
  build: [
    "CraftConnect removes the keyboard. An artisan photographs a product and describes it out loud in their own language. From that, the system produces a complete, structured listing: a title, a written description, suggested categories and tags, and a storefront page, ready to publish.",
    "It's multi-modal by necessity, not for show. The photo carries information the voice doesn't (material, colour, form), and the voice carries information the photo can't (story, intended use, price intent). The pipeline fuses both into one validated listing.",
    "I led the product, built the entire frontend, co-built the backend, and owned the decisions that actually mattered: which AI services to use where, and what the end-to-end user journey should feel like.",
  ],
  pipeline: [
    {
      title: "Capture",
      nodes: [
        { id: "voice", label: "Voice input", detail: "Artisan's own language", kind: "input" },
        { id: "photo", label: "Product photo", detail: "One or more images", kind: "input" },
      ],
    },
    {
      title: "Understand",
      nodes: [
        { id: "stt", label: "Speech-to-text", detail: "Transcribe + detect language", kind: "model" },
        { id: "vision", label: "Vision analysis", detail: "Gemini reads the product", kind: "model" },
      ],
    },
    {
      title: "Compose",
      nodes: [
        { id: "fuse", label: "Fuse signals", detail: "Voice intent + visual attributes", kind: "logic" },
        { id: "gen", label: "Listing generation", detail: "Gemini, schema-constrained", kind: "model" },
      ],
    },
    {
      title: "Verify",
      nodes: [
        { id: "validate", label: "Validate fields", detail: "Title, price, tags present & sane", kind: "gate" },
        { id: "translate", label: "Localize", detail: "Buyer-facing language", kind: "logic" },
      ],
    },
    {
      title: "Publish",
      nodes: [
        { id: "store", label: "Storefront page", detail: "Ready to go live", kind: "output" },
      ],
    },
  ],
  howItWorks: [
    {
      title: "Voice and vision are treated as two witnesses, not one",
      body: "The photo and the spoken description are analyzed separately, then reconciled. When they agree, confidence is high. When they conflict (the voice says 'silk' but the image reads cotton), the system surfaces it rather than silently guessing. That's a deliberate reliability choice, not an accident of the model.",
    },
    {
      title: "Generation is schema-constrained, not free-text",
      body: "The model isn't asked to 'write a listing'. It's asked to fill a defined structure: title, description, category, tags, price band. Constraining the output shape is what makes it usable by the rest of the app instead of being a paragraph someone still has to parse.",
    },
    {
      title: "Language is decoupled from logic",
      body: "The artisan speaks one language; the buyer may read another. Localization happens as its own step at the end, so the understanding pipeline never has to care what language it started in. One pipeline, many markets.",
    },
    {
      title: "AI service selection was a judgment call, not a default",
      body: "I chose where to spend model capability and where a cheaper, narrower service was enough. Speech-to-text, multimodal reasoning, and generation are different jobs with different cost and latency profiles, and they were wired accordingly.",
    },
  ],
  results: [
    {
      label: "What changed",
      body: "A task that previously required literacy in English, e-commerce, and form-filling collapses into 'show it and say it'. The artisan's expertise stays in the craft, not the keyboard.",
    },
    {
      label: "Recognition",
      body: "Built and deployed for the Gen AI Exchange Hackathon 2025, a national event with 270,000+ developers, and reached the semi-finals.",
    },
    {
      label: "Honest scope",
      body: "This was a hackathon build, not a production marketplace. The value it proves is the interaction model and the multi-modal pipeline behind it, both of which hold up.",
    },
  ],
  tech: [
    "Gemini (multimodal)",
    "Google Cloud Speech-to-Text",
    "Google Cloud",
    "React",
    "Node.js",
    "Structured / schema-constrained output",
  ],
  shot: {
    src: "/shots/craftconnect.7e7af1fa.webp",
    width: 1440,
    height: 900,
    alt: "CraftConnect's assistant screen: the heading 'How can I help you today?' above a large microphone button, prompting the user to speak about their business, with a Type control beside it for switching to text and Marketplace, Resources and Community navigation across the top.",
  },
  questions: [
    {
      q: "How can AI help artisans sell their products online?",
      a: "By removing the keyboard. In CraftConnect, which Harshith Nayaka L led and which reached the semi-finals of the Gen AI Exchange Hackathon 2025, an artisan photographs a product and describes it aloud in their own language, and the system produces a complete structured listing — title, description, categories, tags and a storefront page — ready to publish. The expertise stays in the craft instead of in English product copy and e-commerce forms.",
    },
    {
      q: "How do you combine voice and image input in a multimodal AI app?",
      a: "Treat them as two witnesses rather than one input. In CraftConnect, built by Harshith Nayaka L’s team, the photo and the spoken description are analysed separately and then reconciled: when they agree, confidence is high, and when they conflict — the voice says silk, the image reads cotton — the system surfaces it instead of guessing. The listing is then generated against a fixed schema, and localisation runs as its own final step so the understanding pipeline never depends on the input language.",
    },
  ],
  metaDescription:
    "Voice-and-photo assistant on Google Gemini letting artisans run an online storefront by talking, not typing. Gen AI Exchange Hackathon 2025 semi-finalist.",
  links: [{ label: "View on GitHub", href: "https://github.com/HarshithNayakaL/craftconnect" }],
};

const creativeOps: CaseStudy = {
  slug: "creative-ops-pipeline",
  published: "2026-06-06T01:30:29Z",
  title: "Creative-Ops Pipeline",
  kicker: "~90-node n8n workflow",
  outcome:
    "A multi-model content pipeline that turns a one-line brief into validated, on-brand output, without a human babysitting every step.",
  meta: [
    { label: "Type", value: "Production AI pipeline" },
    { label: "Scale", value: "~90-node n8n workflow" },
    { label: "Focus", value: "Reliability & cost engineering" },
    { label: "Pattern", value: "Multi-model + QA gates" },
  ],
  problem: [
    "Producing on-brand content at volume is mostly invisible manual labour: drafting, reformatting, checking it didn't drift off-brand, fixing the one field that came back malformed, doing it again tomorrow. It scales linearly with headcount, which is to say it doesn't scale.",
    "The interesting problem isn't 'can an LLM write this'. It's 'can a system produce this reliably, at a sane cost, and fail safely when a model misbehaves'.",
  ],
  build: [
    "A pipeline that takes a structured brief and runs it through tiered models, schema-constrained generation, and explicit quality gates before anything is considered done. Cheap models do the bulk work; expensive models are spent only where judgment is actually needed.",
    "Every stage assumes the model can be wrong. Output is validated against a schema, checked by a QA gate, and when something fails the run is logged with enough context to recover, not silently dropped.",
    "This is a clean rebuild around public APIs that demonstrates the architecture and the engineering judgment behind it, with generic demo content in place of any real campaign data.",
  ],
  pipeline: [
    {
      title: "Intake",
      nodes: [
        { id: "brief", label: "Structured brief", detail: "What, for whom, constraints", kind: "input" },
      ],
    },
    {
      title: "Route",
      nodes: [
        { id: "cheap", label: "Draft (low-cost model)", detail: "Bulk generation", kind: "model" },
        { id: "premium", label: "Refine (high-capability model)", detail: "Only where it pays off", kind: "model" },
      ],
    },
    {
      title: "Structure",
      nodes: [
        { id: "schema", label: "Schema-constrained output", detail: "Generate then validate", kind: "logic" },
      ],
    },
    {
      title: "Gate",
      nodes: [
        { id: "rules", label: "Rule checks", detail: "Format, fields, limits", kind: "gate" },
        { id: "critique", label: "LLM critique gate", detail: "On-brand? On-spec?", kind: "gate" },
      ],
    },
    {
      title: "Resolve",
      nodes: [
        { id: "errlog", label: "Error log that still saves", detail: "Recover, don't drop", kind: "logic" },
        { id: "publish", label: "Approved output", detail: "Ready downstream", kind: "output" },
      ],
    },
  ],
  howItWorks: [
    {
      title: "Cost-tiered models, spent on purpose",
      body: "Not every token needs a frontier model. The bulk of generation runs on a cheaper model; the expensive one is reserved for the steps where its judgment changes the outcome. The result is the same quality bar at a fraction of the bill.",
    },
    {
      title: "Generate, then validate, then trust",
      body: "Structured output is requested against a schema, but the schema request is treated as a hope, not a guarantee. Every output is validated before the pipeline acts on it. Malformed responses are caught at the boundary, not three steps later.",
    },
    {
      title: "QA gates as code, not vibes",
      body: "Quality is checked explicitly: deterministic rule checks for the things rules can catch, and an LLM critique pass for the judgment calls ('is this actually on-brand'). Nothing passes on optimism.",
    },
    {
      title: "Failures save their work",
      body: "When a run breaks, it isn't thrown away. It's logged with enough context to resume or retry the failing step, so a single bad model response never costs the whole job.",
    },
  ],
  results: [
    {
      label: "What it demonstrates",
      body: "Judgment about where to spend compute, how to make LLM output trustworthy enough to build on, and how to fail without losing work.",
    },
    {
      label: "Honesty note",
      body: "This is a clean rebuild on public APIs with generic demo content. No client data, no proprietary logic. The skill is the point, not the source material.",
    },
  ],
  tech: [
    "n8n",
    "LLM orchestration",
    "Tiered model routing",
    "Schema-constrained output",
    "Validation layer",
    "QA gates",
    "Structured logging",
  ],
  questions: [
    {
      q: "How do you build a reliable AI content pipeline in n8n?",
      a: "Assume the model can be wrong at every step. Harshith Nayaka L’s Creative-Ops Pipeline is a ~90-node n8n workflow that routes a structured brief through tiered models, requests schema-constrained output and validates it anyway, and passes everything through QA gates — deterministic rules for what rules can catch and an LLM critique for whether it is actually on-brand. When a run fails it is logged with enough context to resume the failing step, so one bad model response never costs the whole job.",
    },
    {
      q: "How do you reduce LLM costs in a marketing content pipeline?",
      a: "Spend the expensive model only where its judgment changes the outcome. In the Creative-Ops Pipeline built by Harshith Nayaka L, the bulk of generation runs on a cheaper model and the expensive one is reserved for the steps that need judgment, keeping the same quality bar for far less. Nova, a related project, goes further by scoring each request before any model is chosen.",
    },
  ],
  metaDescription:
    "Multi-model content pipeline turning a one-line brief into validated, on-brand output through tiered routing, schema-constrained generation and QA gates.",
  links: [],
};

const brandforge: CaseStudy = {
  slug: "brandforge",
  published: "2026-09-10T00:51:52Z",
  searchKicker: "AI brand campaign pipeline",
  title: "BrandForge",
  kicker: "Flagship",
  outcome:
    "Give it a brand's website and one product photo. It researches the brand from that site, pins what cannot change about the product, plans its own campaign, generates six images, grades its own work, repairs what it can and refuses what it cannot safely fix.",
  meta: [
    { label: "Type", value: "Multi-model generation pipeline" },
    { label: "Focus", value: "Brand fidelity & product identity" },
    { label: "Pattern", value: "Generate → verify → repair → block" },
    { label: "Status", value: "Open source, orchestration runs in-process or on n8n" },
  ],
  problem: [
    "Ask a generative model for a brand's campaign imagery and you get two failures that look like success. The brand gets imagined: a model asked about a company recalls a stereotype of its category rather than the company itself, and produces something plausible for a coffee brand instead of something true about this one. And the product drifts: image models produce a convincing member of a category, not your item, so the handle changes shape, the label moves, and the result is unusable for the one job it had.",
    "Both failures pass a casual glance. That is what makes them expensive — nobody catches them until a customer does.",
  ],
  build: [
    "The brand is observed, never recalled. A bounded Playwright crawl reads the brand's own site, and every conclusion the model draws is tagged observed — backed by a specific piece of evidence on a specific page — or inferred, meaning the model generalised. The distinction is surfaced in the interface rather than flattened, so a person reviewing the output can see which claims are grounded.",
    "The product is pinned before anything is generated. One pass analyses the supplied photo into a canonical identity plus a set of invariants — the attributes that must survive every shot. Generation then runs through the image edits endpoint with that photo as the anchor rather than text-to-image, because text-to-image has nothing to be faithful to.",
    "Then it grades itself, and the grading is not advisory. A multimodal QA pass compares each generated shot against the original attribute by attribute. The model scores; deterministic code decides. A failed invariant forces a repair no matter how good the aesthetic score, an invariant the model failed to report on counts as a failure rather than a pass, and running out of repair budget produces a BLOCK — shipped visibly as blocked, never quietly dropped or silently passed.",
    "The whole thing is brand-agnostic by construction: point it at a different brand with no code change and the crawl, the kit and the plan all regenerate.",
  ],
  pipeline: [
    {
      title: "Intake",
      nodes: [
        { id: "url", label: "Brand URL", detail: "SSRF-guarded", kind: "input" },
        { id: "photo", label: "Product photo", detail: "Magic-byte checked", kind: "input" },
      ],
    },
    {
      title: "Observe",
      nodes: [
        { id: "crawl", label: "Bounded crawl", detail: "Playwright, page ceiling", kind: "logic" },
        { id: "kit", label: "Brand kit", detail: "Observed vs inferred", kind: "model" },
      ],
    },
    {
      title: "Pin",
      nodes: [
        { id: "identity", label: "Product identity", detail: "Invariants extracted once", kind: "model" },
      ],
    },
    {
      title: "Plan",
      nodes: [
        { id: "shots", label: "Six shot contracts", detail: "The campaign, planned", kind: "logic" },
      ],
    },
    {
      title: "Generate",
      nodes: [
        { id: "gen", label: "Image edits", detail: "Your photo as anchor, 3 at a time", kind: "model" },
      ],
    },
    {
      title: "Verify",
      nodes: [
        { id: "qa", label: "Multimodal QA", detail: "Attribute by attribute", kind: "gate" },
        { id: "verdict", label: "Pass · Repair · Block", detail: "Code decides, not the model", kind: "output" },
      ],
    },
  ],
  howItWorks: [
    {
      title: "The model scores, the code decides",
      body: "QA returns numbers; it does not return a verdict. Deterministic code reads those numbers against the product invariants, and any failed invariant forces a repair however high the aesthetic score came back. An invariant the model simply did not mention is treated as a failure, not an absence of evidence — otherwise silence becomes a pass, which is the easiest way for a grader to be useless.",
    },
    {
      title: "A refusal is a result",
      body: "When repairs run out, the shot is marked BLOCKED and shipped as blocked: it keeps full layout weight in the gallery and carries the reason it failed and what QA saw. A pipeline that hides its failures is reporting a higher success rate than it earned, and the person reviewing it has no way to know.",
    },
    {
      title: "Nothing is discarded",
      body: "A repaired shot keeps every earlier attempt, the exact prompt that produced it, and each QA verdict on disk. The run also writes a full event log. That is what makes a bad output diagnosable after the fact instead of a mystery.",
    },
    {
      title: "Reviewable with no keys and no network",
      body: "Every screen can be exercised from local fixtures, and the fixtures refuse to impersonate real output: run ids are prefixed, the manifest carries a fixture flag, and the model fields say so in words. A demo that quietly looks like a real result is a lie waiting to be quoted.",
    },
    {
      title: "One implementation, two orchestrators",
      body: "The pipeline runs in-process by default and can hand orchestration to n8n by switching one environment variable. Both paths call the same stage functions — there is one implementation, not a code path and a workflow that drift apart. The exported workflow's node types are read from the installed n8n and re-checked by a script.",
    },
    {
      title: "Keys never reach the browser",
      body: "Both model credentials live only in the API process; the frontend has none and the dev server proxies to it. A preflight command reports which keys the API can actually see, so a missing key surfaces before a run starts spending.",
    },
  ],
  results: [
    {
      label: "What it proves",
      body: "That a generative pipeline can be held to a standard rather than admired for its best output — brand claims traced to evidence, product attributes verified rather than assumed, and failures surfaced instead of hidden.",
    },
    {
      label: "Verification",
      body: "One command runs eight groups with no keys and no external network: palette contrast at WCAG AA across 15 pairs, 52 unit tests over the deterministic parts, a production build, n8n workflow build and integrity (every node reachable, every money-spending HTTP node carrying an error path), 16 SSRF vectors rejected, API security and error paths, and a UI sweep across three viewports.",
    },
    {
      label: "Honest status",
      body: "The pipeline up to brand analysis has been exercised against real sites. Everything past it — brand kit, product identity, planning, generation, QA and repair — is implemented and schema-validated but needs live API keys to run end to end.",
    },
  ],
  tech: [
    "Node.js",
    "TypeScript",
    "React",
    "Vite",
    "Playwright",
    "Google Gemini (multimodal)",
    "OpenAI image edits",
    "n8n",
    "Zod",
  ],
  questions: [
    {
      q: "How do you keep AI-generated product images faithful to the real product?",
      a: "Pin the product before generating anything, then verify every shot against it. BrandForge, built by Harshith Nayaka L, analyses the supplied photo into a canonical identity and a set of invariants, generates through an image-edits endpoint anchored on that photo rather than text-to-image, and compares each shot to the original attribute by attribute. A failed invariant forces a repair however good the aesthetic score, an invariant the grader did not report on counts as a failure, and a shot that runs out of repairs ships visibly as blocked.",
    },
    {
      q: "How do you stop AI from inventing a brand’s identity?",
      a: "Make it read the brand instead of recalling it, because a model asked about a company tends to reproduce a stereotype of its category. BrandForge, built by Harshith Nayaka L, runs a bounded crawl of the brand’s own website and tags every conclusion as observed — backed by specific evidence on a specific page — or inferred, and shows that distinction to the person reviewing the output rather than flattening it.",
    },
  ],
  metaDescription:
    "Multi-model campaign pipeline: observes a brand from its own site, pins the product's invariants, then grades its own images and blocks what it cannot fix.",
  links: [
    {
      label: "View on GitHub",
      href: "https://github.com/HarshithNayakaL/BrandForge",
    },
  ],
};

const brandAuditPlatform: CaseStudy = {
  slug: "brand-audit-platform",
  published: "2026-09-10T00:51:52Z",
  title: "Multi-Brand Audit Platform",
  kicker: "Internal tooling, in production",
  searchKicker: "SEO audit tooling",
  outcome:
    "An internal audit platform a marketing team runs on: it crawls every brand site in the portfolio in a real browser, scores them against a model where every weight is tied to something Google actually published, and hands back paste-ready copy fixes.",
  meta: [
    { label: "Type", value: "Internal production platform" },
    { label: "Context", value: "Multi-brand portfolio, internal marketing team" },
    { label: "Focus", value: "Defensible scoring & evidence" },
    { label: "Status", value: "In production \u2014 proprietary, no code shown" },
  ],
  problem: [
    "Every SEO tool shows you a number. Almost none of them can tell you where the number came from. Google does not publish numeric ranking weights, and its own Lighthouse SEO score weights every audit equally while its documentation states plainly that the score is not a ranking signal. So a single score is a judgement, and most tools present it as a measurement.",
    "That matters the moment someone acts on it. A team reading a confident 80 will spend real budget on the wrong page — and the tool that produced it has no way to defend the number in a room.",
  ],
  build: [
    "Every check declares its own evidence basis: an impact tier, a weight, and a source URL. Five tiers, from blocker (the page cannot be indexed, so it cannot rank at any quality) through confirmed, relevance and appearance down to hygiene. The goal is not false precision — it is that every weight traces to a public statement, and the ordering is defensible even where the exact number is a judgement call.",
    "Applying that honestly meant correcting the tool against Google's own documentation rather than against intuition. Meta description had been weighted like a ranking factor; Google says it is not one, so it was down-weighted to appearance. Heading order had been weighted like a ranking factor; Google says it does not matter if they are out of order, so it was reclassified as hygiene — still worth fixing for accessibility, no longer priced like a ranking lever.",
    "Checks are weighted, not counted. A missing title and one image without alt text are not the same event, and under the old equal-weight model both moved the category to 50. And a failed indexing blocker caps the whole score at 25, because a page carrying noindex could previously report 74 and sit mid-table while its real search value was zero.",
    "The AI layer is additive and boxed in. The whole audit runs end to end with no API keys at all; insights generate only when a key is present, and the free crawl layer never calls the model. Cached insights carry forward onto new runs and record which run they reasoned over, so a superseded read is labelled as based on an earlier crawl rather than presented as current.",
  ],
  pipeline: [
    {
      title: "Crawl",
      nodes: [
        { id: "browser", label: "Real browser render", detail: "Playwright, three viewports", kind: "input" },
      ],
    },
    {
      title: "Parse",
      nodes: [
        { id: "parse", label: "Rendered HTML", detail: "Images and inline SVG alike", kind: "logic" },
      ],
    },
    {
      title: "Check",
      nodes: [
        { id: "checks", label: "20 pure checks", detail: "Five categories, unit-tested", kind: "gate" },
      ],
    },
    {
      title: "Score",
      nodes: [
        { id: "weight", label: "Weighted by evidence", detail: "Blocker caps at 25", kind: "logic" },
      ],
    },
    {
      title: "Explain",
      nodes: [
        { id: "ai", label: "Analyst read", detail: "Optional, cached, never required", kind: "model" },
        { id: "export", label: "Handoff document", detail: "PDF · Word · HTML", kind: "output" },
      ],
    },
  ],
  howItWorks: [
    {
      title: "A check that cannot run must say so",
      body: "Unmeasured checks used to return a soft warn worth 60 points for something nobody tested, and the run-level rollup then averaged pages as equals — so nine inner pages resting on one trivially-passing check outvoted the one page actually assessed, nine to one. Unmeasured checks are now excluded outright and pages are weighted by how much evidence each contributed. On a representative shape that moved a category from 93 to 69, which is the number being honest rather than the number being worse.",
    },
    {
      title: "A false alarm costs more than a miss",
      body: "The robots check scanned every Disallow line without tracking which user-agent group it belonged to. Two sites blocking a single aggressive crawler — normal hygiene — were reported as blocking their entire site, and the AI layer faithfully amplified that into a catastrophic finding. Nothing was wrong with either site. A false alarm on the most severe finding a tool can report burns the credibility of every other finding on the page, so the parser now groups by user-agent and both real files are pinned as regression tests.",
    },
    {
      title: "The AI must never invent facts about the business",
      body: "Asked to replace broken placeholder counters on a homepage, the model proposed a set of plausible, well-written, entirely invented business metrics — years trading, projects completed, clients served. Pasted as-is that publishes a lie on a company's own site. The instruction not to invent metrics had been read as SEO metrics only; it now separately forbids inventing facts about the business and requires a bracketed placeholder, and the interface detects any remaining placeholder and warns before the copy can be pasted live.",
    },
    {
      title: "Which SVGs actually owe a name",
      body: "The obvious accessibility rule — every SVG needs a title — is wrong, and produced 83 findings on one homepage, burying the real ones. Following axe-core's actual criteria instead, a name is owed in two cases: the SVG claims an image role, or it is the entire content of a link or button. That second case caught 60 genuine defects on one site: commercial internal links whose only content was an unnamed icon, so a screen reader announced 'link' and nothing else and Google got zero anchor text for a money page.",
    },
    {
      title: "Reasoning tokens share the answer's budget",
      body: "The insight feature silently stopped working while reporting success. The model bills its reasoning against the same output ceiling the answer comes from; a real call spent 4,868 tokens thinking and 3,309 answering against a ceiling of 8,192, truncated the JSON mid-string, and the script exited zero — so the button said refreshed over week-old data. The ceiling was resized from measurement across every site, truncation is now detected before parsing rather than surfacing as a parser error, and a run that writes nothing exits non-zero.",
    },
    {
      title: "Checks tests cannot make",
      body: "Typecheck catches type errors and tests catch broken behaviour, but neither catches a broken promise — code claiming something exists elsewhere when it does not. A doc referenced in a comment but never written, an env var read in code but missing from the example file, an npm script named in documentation but absent from the manifest, a database table written but never read. All four had shipped undetected. A separate doctor command checks exactly that one thing and runs on every change.",
    },
  ],
  results: [
    {
      label: "What it proves",
      body: "That a score can be built to be defended rather than displayed. Every weight in the model traces to a public statement, every check names its evidence tier, and the tool corrects itself against primary documentation when the two disagree.",
    },
    {
      label: "Measured, not guessed",
      body: "Crawl profiling found the network-idle wait burning its full timeout on most pages because ad and analytics tags hold connections open — 35 to 58 percent of every page's time spent waiting for nothing. Blocking third-party tag hosts and running inner pages three at a time took one site from 110 seconds to 44, with scores byte-identical before and after. Concurrency is capped at 3 from measurement: sequential 39.5s, three at a time 28.6s, six at a time 46.9s.",
    },
    {
      label: "Verification",
      body: "171 tests over the pure checks, the scoring rollup, and recorded API fixtures for the awkward cases — a metric returned as a string, an SVG with no title — so the edge cases are exercised without a network call.",
    },
    {
      label: "Honest limits",
      body: "Field data cannot be measured from a lab run, and the tool says so rather than substituting a proxy. Lab vitals are captured with third-party trackers blocked, which makes them optimistic by construction: a page that looks slow here is slower in the wild, never faster. That caveat ships in the interface, on the cell, not in a footnote.",
    },
  ],
  tech: [
    "Next.js",
    "TypeScript",
    "Playwright",
    "SQLite",
    "Drizzle ORM",
    "Google Gemini (multimodal)",
    "Vitest",
    "PageSpeed Insights API",
  ],
  questions: [
    {
      q: "Is the Lighthouse SEO score a Google ranking signal?",
      a: "No. Google’s documentation states that the Lighthouse SEO score is not a ranking signal, and it weights every audit equally. That is why the multi-brand audit platform Harshith Nayaka L built for a marketing team weights each check by its evidence instead: five tiers from blocker to hygiene, each with a weight and a source URL tying it to a public Google statement, and a failed indexing blocker caps the whole score at 25.",
    },
    {
      q: "How do you stop AI from inventing facts in website copy suggestions?",
      a: "Forbid it explicitly, then check the output for it. In the audit platform Harshith Nayaka L built, the model once proposed plausible but invented business metrics — years trading, projects completed, clients served — to replace placeholder counters, which would have published a lie on the company’s own site. The instruction now separately forbids inventing facts about the business and requires a bracketed placeholder, and the interface detects any remaining placeholder and warns before the copy can go live.",
    },
  ],
  metaDescription:
    "Internal audit tooling for a multi-brand portfolio: real-browser crawling, a score where every weight traces to a public source, and paste-ready copy fixes.",
  links: [],
};

const novaAi: CaseStudy = {
  slug: "nova-ai",
  published: "2026-06-06T06:00:39Z",
  title: "Nova",
  kicker: "Cost-tiered model routing",
  outcome:
    "A chat app that reads every turn, scores how hard it is, and sends it to the smallest model that can carry it — stamping the lane, the reasoning and the cost onto every answer.",
  meta: [
    { label: "Type", value: "Deployed web app" },
    { label: "Roster", value: "gpt-oss-20b · qwen3.6-27b · gpt-oss-120b" },
    { label: "Routing", value: "Signal scoring + arbiter model" },
    { label: "Role", value: "Solo build" },
  ],
  problem: [
    "Every chat app sends one model everything. \"Translate this line\" and \"find the race condition in this worker pool and prove it\" land on the same endpoint, so you either overpay on the easy turns or underserve the hard ones. There is no third option when the roster is one model long.",
    "The obvious fix — a router that starts cheap and climbs — is the trap. Score from zero upward and almost every turn clears the bar for the fast lane, because most prompts trip two or three keywords at most. You end up with a router that technically works and quietly answers everything badly.",
  ],
  build: [
    "Nova scores each turn on four axes — reasoning, code, breadth and context — with deterministic keyword and pattern evidence that runs instantly and always runs. That produces a prior: a lane and a complexity reading between 0 and 100.",
    "Then a small arbiter model reads the same turn alongside the prior and returns a lane, a complexity number and a one-line rationale as JSON. It is allowed to overrule the arithmetic, because a scorer cannot tell that \"explain CRDTs to someone who ships code, not papers\" is a drafting job rather than a research one.",
    "Three lanes: gpt-oss-20b for lookups and rewrites, qwen3.6-27b for drafting and long context, gpt-oss-120b for reasoning, math and code review. Every answer is stamped with the lane it took, the complexity reading, the arbiter's rationale and what it cost, and the lane switch overrides routing entirely when you already know what you want.",
  ],
  pipeline: [
    {
      title: "Read",
      nodes: [
        { id: "turn", label: "Turn + history", detail: "What the user just sent", kind: "input" },
      ],
    },
    {
      title: "Score",
      nodes: [
        { id: "signals", label: "Four axes", detail: "reasoning · code · breadth · context", kind: "logic" },
        { id: "prior", label: "Complexity prior", detail: "0-100, deterministic", kind: "logic" },
      ],
    },
    {
      title: "Arbitrate",
      nodes: [
        { id: "arb", label: "Arbiter", detail: "gpt-oss-20b, JSON, 4s budget", kind: "model" },
        { id: "rules", label: "Floor rules", detail: "Pushback never routes below L2", kind: "gate" },
      ],
    },
    {
      title: "Answer",
      nodes: [
        { id: "lane", label: "Lane model", detail: "20B, 27B or 120B", kind: "model" },
      ],
    },
    {
      title: "Show",
      nodes: [
        { id: "stamp", label: "Stamped answer", detail: "Lane, complexity, rationale, cost", kind: "output" },
      ],
    },
  ],
  howItWorks: [
    {
      title: "The middle lane is the default, not the cheap one",
      body: "A turn has to earn its way down to the fast lane by being demonstrably trivial, or up to the deep lane by being demonstrably hard. Climbing from zero would leave everything in the 20B model, which is the failure mode that makes routers feel worse than no router at all. Starting from the middle means the router only has to recognise the two extremes, which is the part it can actually do reliably.",
    },
    {
      title: "The arbiter is allowed to be slow, wrong or absent",
      body: "It gets a 4-second budget and a 120-token cap. If it times out, returns unparseable JSON, or names a lane that does not exist, the deterministic prior stands. If the routing endpoint itself fails, the browser falls back to its own copy of the scorer. Routing never blocks an answer — the worst case is a blunter decision, never a spinner.",
    },
    {
      title: "Keyword evidence has diminishing returns",
      body: "Each axis scores as 100 × (1 − decay^hits), so the first match already counts for most of the signal and the fifth adds almost nothing. A flat per-hit score reads real prompts as trivial, because people write two clauses, not a checklist of trigger words.",
    },
    {
      title: "Disagreement is a routing signal",
      body: "\"That's wrong\", \"go deeper\", \"not what I asked\" — a turn that pushes back on the previous answer never routes below the middle lane, whatever the keywords say. The last answer was already judged insufficient; sending the follow-up somewhere smaller is the one move guaranteed to be wrong.",
    },
    {
      title: "One coordinator changes the answer",
      body: "\"Summarise this\" is trivial. \"Summarise this and list the open questions\" is two asks wearing the same opener, so the presence of a coordinator disqualifies a turn from the trivial shortcut. Cheap tests like this catch the cases where a scorer would otherwise be confidently wrong.",
    },
    {
      title: "Routing costs about as much as a greeting",
      body: "The arbiter runs on the cheapest lane, capped at 120 tokens with temperature zero and JSON-mode enforced. Paying a 120B model to decide which model to use would defeat the entire exercise.",
    },
  ],
  results: [
    {
      label: "What changed",
      body: "Difficulty stopped being something the user has to declare. There is no model picker to get wrong, and no flat rate for turns that did not need it — but the decision is never hidden, because every answer shows the lane, the reading and the rationale that produced it.",
    },
    {
      label: "What it took to be safe",
      body: "Three levels of fallback for one decision that is not allowed to fail: arbiter to prior, endpoint to browser-side scorer, automatic routing to a manual lane switch. The provider key stays in the serverless function throughout; the browser never holds a credential, and threads live in localStorage rather than on a server.",
    },
    {
      label: "Honest scope",
      body: "A deployed personal app, not a production service. There is no evaluation set proving the routing beats always-using-the-large-model, and the lane assignments are judgement rather than measurement. The architecture is the claim here, not a benchmark.",
    },
  ],
  tech: [
    "gpt-oss-20b / 120b",
    "qwen3.6-27b",
    "Groq · Hugging Face routers",
    "Vercel serverless",
    "Streaming",
    "Vanilla JS, no framework",
  ],
  shot: {
    src: "/shots/nova-ai.bf8eb4ca.webp",
    width: 1080,
    height: 962,
    alt: "Nova's opening screen: an AUTO / L1 / L2 / L3 lane switch above the heading \"One prompt in. The right model out.\", three coloured lane cards naming gpt-oss-20b, qwen3.6-27b and gpt-oss-120b with their per-million-token prices, and four example prompts each tagged with the lane they would route to.",
  },
  questions: [
    {
      q: "How do you route prompts to the cheapest LLM that can handle them?",
      a: "Score the prompt first, and start from the middle lane rather than the cheapest one. Nova, built by Harshith Nayaka L, scores each turn on reasoning, code, breadth and context with deterministic evidence, then a small arbiter model confirms or overrules that with a one-line rationale; a turn has to prove it is trivial to drop to the fast lane or hard to reach the deep one. Every answer shows its lane, complexity reading, rationale and cost.",
    },
    {
      q: "Why do LLM routers send prompts to the wrong model?",
      a: "Most start cheap and climb, and because most prompts trip only two or three keywords, almost every turn clears the bar for the fast lane — a router that technically works and quietly answers everything badly. Nova, built by Harshith Nayaka L, defaults to the middle lane, scores keyword evidence with diminishing returns, never routes pushback like “that’s wrong” below the middle, and treats a second request in one prompt as disqualifying it from the trivial shortcut.",
    },
  ],
  metaDescription:
    "Chat app that scores every turn for difficulty and routes it across three model tiers, showing the lane, the reasoning and the cost on each answer.",
  links: [
    { label: "Live app", href: "https://custom-gpt-silk.vercel.app/" },
    { label: "View on GitHub", href: "https://github.com/HarshithNayakaL/CUSTOM-GPT" },
  ],
};

const aiNotes: CaseStudy = {
  slug: "ai-notes",
  published: "2026-06-06T06:00:39Z",
  title: "AI Notes",
  kicker: "Local inference, no server",
  searchKicker: "Local-LLM notes app",
  outcome:
    "A note-taking app whose AI features run entirely on your own machine, so your notes never leave it.",
  meta: [
    { label: "Type", value: "Local-LLM web app" },
    { label: "Model", value: "DeepSeek R1 via Ollama" },
    { label: "Role", value: "Solo build" },
  ],
  problem: [
    "Almost every AI note app sends your writing to a third-party API. For private notes, that's the opposite of what you want, and it means the app is useless offline.",
    "I wanted to show the alternative most people skip: useful AI features that don't require a cloud call, a subscription, or trusting someone else with your data.",
  ],
  build: [
    "AI Notes runs DeepSeek R1 locally through Ollama, called straight from the browser. Summarize, improve writing, expand an idea, generate questions, extract keywords, all of it happens on the user's own machine.",
    "Built with plain HTML, CSS, and JavaScript, no frameworks, with notes stored locally in the browser. Once the model is pulled, the whole thing works offline. The point was to keep it dependency-light and prove local inference is a real option, not a compromise.",
  ],
  pipeline: [
    {
      title: "Write",
      nodes: [
        { id: "note", label: "Note in browser", detail: "Stored locally", kind: "input" },
      ],
    },
    {
      title: "Local model",
      nodes: [
        { id: "ollama", label: "Ollama runtime", detail: "On the user's machine", kind: "model" },
        { id: "ds", label: "DeepSeek R1", detail: "No external call", kind: "model" },
      ],
    },
    {
      title: "Assist",
      nodes: [
        { id: "ops", label: "Summarize / expand / extract", detail: "AI actions", kind: "logic" },
      ],
    },
    {
      title: "Stay private",
      nodes: [
        { id: "local", label: "Nothing leaves the device", detail: "Offline-capable", kind: "output" },
      ],
    },
  ],
  howItWorks: [
    {
      title: "Inference stays on the machine",
      body: "The model runs through Ollama locally. There's no API endpoint receiving your notes, because there's no external call at all. Privacy isn't a policy promise here, it's the architecture.",
    },
    {
      title: "Works offline once set up",
      body: "Pull the model once and the app keeps working with no internet. The AI features don't depend on a server being up or a bill being paid.",
    },
    {
      title: "Deliberately dependency-light",
      body: "Plain HTML, CSS, and JavaScript, no framework, browser storage for the notes. Small enough to understand fully, which was the point.",
    },
  ],
  results: [
    {
      label: "Published research",
      body: "The approach behind this project was written up and published: \"AI-Powered Note-Taking System: A Local Machine Learning Approach DeepSeek R1 Integration\", International Journal of Research Trends and Multidisciplinary Research (IJRTMR), Nov-Dec 2025, pp. 178-189 (DOI 10.59256/ijrtmr.20250506023). The paper reports 87% user satisfaction on content summarization with response times of 1.9-3.8 seconds.",
    },
    {
      label: "What it demonstrates",
      body: "That local and self-hosted inference is a practical choice, and the awareness of when keeping data on-device matters more than convenience.",
    },
    {
      label: "Scope",
      body: "A focused solo build proving the local-LLM pattern, not a feature-complete notes product.",
    },
  ],
  tech: [
    "DeepSeek R1",
    "Ollama (local)",
    "Vanilla JavaScript",
    "Browser storage",
  ],
  shot: {
    src: "/shots/ai-notes.f7ec4d0e.webp",
    width: 1440,
    height: 900,
    alt: "AI Notes with one entry open: a catalog sidebar headed 'local archive · DeepSeek R1', the note in a ruled editor with Save, Delete and Ask Archive actions above it, an 'AI Offline' badge in the top corner, and 'stored on this device' in the sidebar footer.",
  },
  questions: [
    {
      q: "How do you run DeepSeek R1 locally for AI note-taking?",
      a: "Through Ollama, called straight from the browser. AI Notes, built by Harshith Nayaka L, runs DeepSeek R1 locally to summarise, improve writing, expand ideas, generate questions and extract keywords, with notes kept in browser storage and no external API call at all, so it works offline once the model is pulled. The approach is published in IJRTMR (Nov–Dec 2025, DOI 10.59256/ijrtmr.20250506023), which reports 87% user satisfaction on summarisation with response times of 1.9 to 3.8 seconds.",
    },
  ],
  metaDescription:
    "Notes app running DeepSeek R1 locally through Ollama: summarisation and keyword extraction with inference that never leaves your own machine.",
  links: [
    { label: "View on GitHub", href: "https://github.com/HarshithNayakaL/AI-Notes-App" },
    {
      label: "Read the paper (DOI)",
      href: "https://www.doi.org/10.59256/ijrtmr.20250506023",
    },
  ],
};

const maestro: CaseStudy = {
  slug: "maestro",
  published: "2026-08-03T13:25:26Z",
  title: "Maestro",
  kicker: "Multi-model LLM orchestration",
  outcome:
    "Get frontier-quality answers out of free models by orchestrating them: a conductor routes one task across thinker, worker, and verifier roles, and shows its work at every step.",
  meta: [
    { label: "Type", value: "Open-source orchestration engine" },
    { label: "Pattern", value: "Conductor + Thinker / Worker / Verifier" },
    { label: "Stack", value: "Python + FastAPI, deployed" },
    { label: "Status", value: "Live & deployed" },
  ],
  problem: [
    "A single free model is uneven: strong on some tasks, unreliable on others, and impossible to fully trust because you can't see how it reached an answer. The obvious workaround, pay for a bigger model, isn't the interesting one.",
    "The interesting claim, backed by Sakana's TRINITY and Mixture-of-Agents research, is that intelligent orchestration beats raw model size. Maestro is a glass-box, open-source rebuild of that idea: not cheaper tokens (the models are already free), but better answers from them, with the reasoning made visible instead of hidden.",
  ],
  build: [
    "A Conductor model reads a task and assigns Thinker, Worker, and Verifier roles across a pool of free LLMs, then a Synthesizer produces the final answer. Crucially, the Verifier is always a different model family than the Worker, which mitigates the well-documented 10–25% self-preference bias in LLM-as-judge.",
    "Every step appends to a structured, replayable decision-log, the plan, the routing rationale, each model's output, the verifier's verdict, token and latency cost. That log is the actual product: it's what a black-box orchestration layer can't give you.",
    "It's engineered to run in the real world on free tiers: a per-model token-bucket limiter enforcing both RPM and TPM, exponential backoff with jitter on 429s, and diversified fallback chains so one failed call never crashes a run. Models are swapped by editing one config file, never the orchestration code.",
    "It deploys publicly without leaking your quota: API-key auth, per-client rate limiting (globally consistent via Upstash Redis on serverless), security headers, input hardening, and strict CORS, with a startup self-audit that warns on unsafe production config.",
  ],
  pipeline: [
    {
      title: "Task",
      nodes: [
        { id: "task", label: "Task in", detail: "A single prompt / problem", kind: "input" },
      ],
    },
    {
      title: "Conduct",
      nodes: [
        { id: "conductor", label: "Conductor", detail: "Plan + routing rationale", kind: "model" },
      ],
    },
    {
      title: "Reason",
      nodes: [
        { id: "thinker", label: "Thinker", detail: "Strategy for the answer", kind: "model" },
        { id: "worker", label: "Worker", detail: "Produces the answer", kind: "model" },
      ],
    },
    {
      title: "Verify",
      nodes: [
        { id: "verify", label: "Verifier", detail: "Different model family; 1 bounded retry", kind: "gate" },
      ],
    },
    {
      title: "Deliver",
      nodes: [
        { id: "synth", label: "Synthesizer", detail: "Final answer", kind: "model" },
        { id: "log", label: "Decision-log", detail: "Every step, replayable", kind: "output" },
      ],
    },
  ],
  howItWorks: [
    {
      title: "The judge is never the same family as the worker",
      body: "LLM-as-judge has a measured 10–25% self-preference bias, so a model grading its own family's output is compromised. Maestro's verifier is always a different model family than the worker, and a failed check triggers exactly one bounded retry rather than an open-ended loop.",
    },
    {
      title: "The decision-log is the product",
      body: "Every run emits a complete JSON log: the plan, why each model was routed where, each step's output and verdict, and the token/latency totals. You can replay and audit exactly how an answer was built, which is the whole point of a glass-box design.",
    },
    {
      title: "Built for free-tier limits, honestly",
      body: "Groq's free tier binds on tokens-per-minute, not requests. Maestro reserves estimated tokens before a call so it defers instead of getting 429'd, backs off with jitter when it does, and falls back across model families. Long-context steps route to Gemini's roomier budget.",
    },
    {
      title: "Swap models without touching code",
      body: "The model pool, role chains, and rate limits live in one config file; the orchestration logic never hard-codes a model ID. When the Groq catalog rotates, or a Llama model is retired, you edit config, not Python.",
    },
    {
      title: "Deployable without leaking your quota",
      body: "API-key auth, per-client rate limiting that stays consistent across serverless instances via Upstash Redis, security headers, input hardening, and a production self-audit that warns on wildcard CORS or mock mode left on. It's meant to be put on the public internet safely.",
    },
  ],
  results: [
    {
      label: "What it demonstrates",
      body: "Systems thinking about LLMs: routing, verification across model families, honest cost accounting, rate-limit engineering, and a security posture, all in service of making unreliable free models produce trustworthy, auditable output.",
    },
    {
      label: "Honest disclosure",
      body: "Maestro's conductor is prompt/rule-based, not a trained coordinator like Fugu's evolved model. It's a faithful re-creation of the concept, made open and transparent, not a claim to have reproduced the trained artifact. The benchmark harness is deliberately built to report where orchestration doesn't help.",
    },
    {
      label: "Status",
      body: "Open-source (MIT) and deployed live on Vercel, with a mock provider so the full flow, dashboard, and tests run offline with no API keys.",
    },
  ],
  tech: [
    "Python",
    "FastAPI",
    "Groq (Llama / Qwen / gpt-oss)",
    "Google Gemini",
    "Pydantic",
    "Token-bucket rate limiting",
    "Upstash Redis",
    "Vercel / Railway",
    "n8n",
  ],
  shot: {
    src: "/shots/maestro.0a5f6953.webp",
    width: 1080,
    height: 1583,
    alt: "Maestro's main screen: the task box with a question typed into it, the Conductor, Consensus and Single mode selector, an optional API key field, and below them the orchestration timeline — Conductor, Thinker, Worker and a passing Verifier — each labelled with the model that ran it and its token and latency cost.",
  },
  questions: [
    {
      q: "How do you orchestrate multiple free LLMs to get a better answer?",
      a: "Split the task into roles and check the result with a different model. In Maestro, an open-source orchestration engine built by Harshith Nayaka L, a Conductor assigns Thinker, Worker and Verifier roles across a pool of free LLMs and a Synthesizer produces the final answer; the Verifier is always a different model family from the Worker, and a failed check triggers exactly one bounded retry. Every step goes into a replayable decision-log: the plan, the routing rationale, each output, the verdict, and token and latency cost.",
    },
    {
      q: "How do you handle Groq free-tier rate limits?",
      a: "Budget tokens before calling instead of recovering after failing. Groq’s free tier binds on tokens per minute rather than requests, so Maestro, built by Harshith Nayaka L, reserves estimated tokens through a per-model limiter that enforces both requests and tokens per minute, backs off exponentially with jitter on a 429, and falls back across model families. Long-context steps route to Gemini’s larger budget, and models are swapped in one config file rather than in code.",
    },
  ],
  metaDescription:
    "Multi-model orchestration engine: a conductor routes one task across thinker, worker and verifier roles, returning a verified answer with a full decision-log.",
  links: [
    { label: "Live app", href: "https://maestro-psi-neon.vercel.app/" },
    { label: "View on GitHub", href: "https://github.com/HarshithNayakaL/Maestro" },
  ],
};

const cannon: CaseStudy = {
  slug: "cannon",
  published: "2026-08-07T06:07:07Z",
  searchKicker: "Multi-agent personal assistant",
  title: "Cannon",
  kicker: "Multi-agent, not multi-task",
  outcome:
    "A personal assistant used daily, not demoed once: independent domain specialists that share infrastructure but deliberately never share context, with isolation enforced at the query rather than left to convention.",
  meta: [
    { label: "Type", value: "Multi-agent assistant, deployed" },
    { label: "Pattern", value: "Domain specialisation, not task orchestration" },
    { label: "Stack", value: "Next.js 16 + Vercel AI SDK 7" },
    { label: "Tests", value: "91 unit + 13 e2e specs" },
  ],
  problem: [
    "A single generalist chatbot wearing every hat is the easy build and the wrong one. Ask it about a workout and a work deadline in the same thread and it's carrying both contexts at once, with no real boundary between them, and no persona suited to either.",
    "The harder, more honest problem: build something used every day, not shown once. A fitness log with real training data behind it, a work board with real tasks on it, judged by whether it survives daily use, not by how it looks in a five-minute demo.",
  ],
  build: [
    "Cannon runs independent domain agents, each with its own persona, its own system prompt, its own tools, and its own retrieval scope. A fitness agent and a work agent share infrastructure but never share context. Cannon's own README draws the contrast directly: its sibling project Maestro splits a single task across collaborating roles; Cannon runs independent experts that don't collaborate at all. Different architecture, different problem.",
    "Isolation is enforced at the query, not by convention. The fitness agent can't read work documents even by accident: retrieval takes the agent id as an argument and the Postgres function filters on it internally, so there's no post-filter step a caller could forget to add. The memory store enforces the same boundary as a WHERE clause on the scan. Both paths are unit-tested with mirror-image queries.",
    "Provider fallback is modeled as a real interface, not a try/catch. A fallback model implements the AI SDK's provider interface and wraps Groq behind Gemini, so streaming, tool execution, and the UI stream protocol are all unaware a swap ever happened. It distinguishes two real failure modes — a call that never connects, versus one that connects and then errors mid-stream — and once real content is flowing, a failure is surfaced rather than silently restarted, because re-running a partially executed tool chain is worse than a visible error.",
    "Every external dependency has a working fallback, all the way down: no provider key and no database, and the app still boots, builds, passes its full test suite, and serves a working demo. Inference falls back to a scripted model implementing the real provider interface; embeddings fall back to a deterministic lexical embedder; storage falls back to a process-local store. That's what lets CI run true end-to-end tests with zero secrets, exercising the production code path instead of a mocked-out shortcut.",
  ],
  pipeline: [
    {
      title: "Route",
      nodes: [
        { id: "registry", label: "Agent registry", detail: "Explicit tab routing", kind: "logic" },
      ],
    },
    {
      title: "Specialise",
      nodes: [
        { id: "fitness", label: "Fitness agent", detail: "3 tools + RAG", kind: "model" },
        { id: "work", label: "Work agent", detail: "4 tools + RAG", kind: "model" },
      ],
    },
    {
      title: "Isolate",
      nodes: [
        { id: "scope", label: "Query-scoped retrieval", detail: "Agent id filters at the DB", kind: "gate" },
      ],
    },
    {
      title: "Infer",
      nodes: [
        { id: "groq", label: "Groq (primary)", detail: "Time-to-first-token budget", kind: "model" },
        { id: "gemini", label: "Gemini (fallback)", detail: "Different vendor, uncorrelated outage", kind: "model" },
      ],
    },
    {
      title: "Answer",
      nodes: [
        { id: "cards", label: "Typed tool-result cards", detail: "Not pasted JSON", kind: "output" },
      ],
    },
  ],
  howItWorks: [
    {
      title: "Isolation is a database filter, not a habit",
      body: "The fitness agent structurally cannot see work data. Retrieval takes the agent id as an argument the Postgres function filters on internally, and the memory store applies the same boundary as a WHERE clause — there's no separate post-filter step a caller could forget, and both paths carry mirror-image unit tests.",
    },
    {
      title: "A fallback chain that's a typed model, not a caught exception",
      body: "The fallback wraps Groq behind Gemini by implementing the AI SDK's actual provider interface, so every layer above it — streaming, tool execution, the UI stream protocol — stays unaware a swap happened. It separates a call that never connects from one that connects and fails mid-stream, and treats a mid-stream failure as something to surface, not silently retry, since re-running a half-executed tool chain is its own hazard.",
    },
    {
      title: "Fallbacks all the way down, so CI tests the real path",
      body: "No API key, no database, and the app still boots, builds, and serves a working demo: a scripted model standing in for inference, a deterministic lexical embedder standing in for embeddings, a process-local store standing in for Postgres. That's what makes it possible for CI to run true end-to-end tests with zero secrets against the production code path, not a mocked shortcut.",
    },
    {
      title: "The Prompt Inspector makes the engineering legible",
      body: "A docked panel shows the live system prompt driving the active agent, the tool signatures in scope, which provider actually answered, whether a fallback fired, and the retrieved chunks with their similarity scores. A real debugging aid that doubles as evidence for anyone reading the repo.",
    },
    {
      title: "No login, and that's a decision, not an oversight",
      body: "This is a single-user tool run by one person for their own training log and task board — a login screen would be friction with nothing behind it. Groq and Gemini already enforce their own free-tier ceilings, and the fallback chain already treats a 429 from either as a normal handoff, so there's no second rate limiter layered on top. The README states the tradeoff plainly: anyone with the URL can use the deployment, acceptable for a personal tool with an unlisted link, not something to hand to a wider audience without adding a gate back.",
    },
  ],
  results: [
    {
      label: "Tested, not just built",
      body: "91 unit tests cover the tools, the training maths, RAG scoping, chunking, all four failure modes of the fallback chain, and the store's filters and ranking. 13 end-to-end specs run twice each, desktop and mobile, against a real production build with zero provider keys — both agents' full tool loops, transcript isolation, the inspector, the responsive swap, theme persistence, and horizontal overflow at five breakpoints from 375px to 2200px.",
    },
    {
      label: "Deploys with nothing to configure",
      body: "Import the repo into Vercel with no environment variables set and it deploys and works immediately, seeded with fitness and work data. Real inference, real embeddings, and durable storage are opt-in upgrades layered on top of a system that already works without them.",
    },
    {
      label: "Honest about its own limits",
      body: "The README states its known limits directly rather than hiding them: no login (deliberate, for a single-user tool with an unlisted URL), no rate limiting beyond what Groq/Gemini already enforce, and no auto-routing between agents in v1, because a classifier that guesses wrong at 11pm is worse than an explicit tab.",
    },
  ],
  tech: [
    "Next.js 16 (App Router)",
    "Vercel AI SDK 7",
    "Groq + Gemini",
    "Supabase Postgres + pgvector",
    "TypeScript (strict)",
    "Vitest + Playwright",
    "GitHub Actions",
  ],
  shot: {
    src: "/shots/cannon.63aeed47.webp",
    width: 1080,
    height: 1180,
    alt: "Cannon's dispatch view: a sidebar of domain desks (Dispatch, Fitness, Work, Finance, Learning, Race Engineer) beside an agent grid where each desk lists its own tool count and retrieval scope, plus a card inviting a new agent to be described and built.",
  },
  questions: [
    {
      q: "What is the difference between a multi-agent and a multi-task AI assistant?",
      a: "A multi-task assistant is one model wearing every hat and carrying every context at once; a multi-agent assistant runs independent specialists. Cannon, built and used daily by Harshith Nayaka L, runs a fitness agent and a work agent, each with its own persona, system prompt, tools and retrieval scope; they share infrastructure but never share context, and the isolation is enforced inside the database query itself. Its sibling project Maestro is the other pattern: collaborating roles splitting one task.",
    },
    {
      q: "How do you add an LLM provider fallback without breaking streaming?",
      a: "Model the fallback as a provider, not a try/catch. In Cannon, built by Harshith Nayaka L, the fallback implements the AI SDK’s provider interface and wraps Groq behind Gemini, so streaming, tool execution and the UI stream protocol never see the swap. It distinguishes a call that never connects from one that fails mid-stream, and surfaces a mid-stream failure rather than silently retrying, because re-running a half-executed tool chain is worse than a visible error.",
    },
  ],
  metaDescription:
    "Multi-agent assistant where every domain is an independent specialist with its own prompt, tools and retrieval scope, isolated at the query itself.",
  links: [
    { label: "Live app", href: "https://cannon-multi-agents.vercel.app" },
    {
      label: "View on GitHub",
      href: "https://github.com/HarshithNayakaL/cannon-multi-agents",
    },
  ],
};

const replydesk: CaseStudy = {
  slug: "replydesk",
  published: "2026-08-03T13:25:26Z",
  title: "ReplyDesk",
  kicker: "WhatsApp lead agent",
  outcome:
    "Answer every inbound WhatsApp lead in seconds, automatically, with a live operations dashboard for the lead feed, pipeline, and response times.",
  meta: [
    { label: "Type", value: "Lead-response agent + dashboard" },
    { label: "Focus", value: "Speed-to-lead" },
    { label: "Role", value: "Solo build" },
    { label: "Status", value: "Interactive prototype" },
  ],
  problem: [
    "78% of customers buy from the business that responds first, yet the average small business takes around 29 hours to reply to a lead. By then the customer has already bought from someone faster.",
    "The gap isn't intent, it's operations. Leads arrive on WhatsApp at all hours, a human can't sit on the inbox 24/7, and every minute of delay is measurable lost revenue.",
  ],
  build: [
    "ReplyDesk is a WhatsApp lead agent that captures every inbound message and fires a first reply in roughly eight seconds, so no lead sits waiting. Around it sits a live operations dashboard, the piece that makes the automation legible to the person running it.",
    "The dashboard is the control room: a real-time lead feed, a pipeline breakdown of where each lead sits, a 'needs your attention' queue that surfaces the ones a human should actually touch, and response-time KPIs that keep the whole thing honest against that first-responder metric.",
    "It's a self-contained, interactive front-end prototype, you can simulate an incoming lead and watch it flow through capture, reply, and pipeline in real time, built to prove the interaction model and the operational value, not to be a finished SaaS.",
  ],
  pipeline: [
    {
      title: "Inbound",
      nodes: [
        { id: "msg", label: "WhatsApp message", detail: "A new lead arrives", kind: "input" },
      ],
    },
    {
      title: "Capture",
      nodes: [
        { id: "feed", label: "Into the lead feed", detail: "Logged in real time", kind: "logic" },
      ],
    },
    {
      title: "Respond",
      nodes: [
        { id: "reply", label: "Agent first reply", detail: "~8s, every time", kind: "model" },
      ],
    },
    {
      title: "Qualify",
      nodes: [
        { id: "route", label: "Score & route", detail: "Hot / warm / needs attention", kind: "gate" },
      ],
    },
    {
      title: "Operate",
      nodes: [
        { id: "dash", label: "Live dashboard", detail: "Feed, pipeline, KPIs", kind: "output" },
      ],
    },
  ],
  howItWorks: [
    {
      title: "Speed is the entire product",
      body: "The whole system is organized around one number: time to first reply. Answering in seconds instead of hours is the difference between winning the lead and losing it, so that metric sits front and center on the dashboard.",
    },
    {
      title: "A dashboard that shows the pipeline, not just a chat log",
      body: "Leads are broken down by stage so the operator can see the shape of the funnel at a glance, how many are hot, how many are cooling, where things are stuck, rather than scrolling an undifferentiated inbox.",
    },
    {
      title: "Automation that still asks for a human when it matters",
      body: "A 'needs your attention' queue pulls out the leads that genuinely require a person, so automation handles the volume while the operator spends their time only where it moves the needle.",
    },
    {
      title: "Built to be felt, not just described",
      body: "The prototype lets you simulate an incoming lead and watch it move through the system live, so the speed-to-lead value is something you experience in the interface rather than a claim in a slide.",
    },
  ],
  results: [
    {
      label: "What it proves",
      body: "Product sense around a real, quantified business problem: turning the 'respond first' statistic into an operational tool, and designing the dashboard an operator would actually run their day from.",
    },
    {
      label: "Honest scope",
      body: "This is a self-contained interactive front-end prototype with a simulate-lead demo, not a WhatsApp-connected production deployment. It's proof of the interaction and operations model, and it's honest about being exactly that.",
    },
  ],
  tech: [
    "WhatsApp (lead channel)",
    "LLM agent",
    "Real-time dashboard",
    "Vanilla JavaScript",
    "HTML / CSS",
  ],
  shot: {
    src: "/shots/replydesk.b0b90439.webp",
    width: 1080,
    height: 1310,
    alt: "ReplyDesk's lead operations dashboard: KPI tiles for average response time, leads today, hot leads, after-hours answers and percentage auto-handled; an 8-second agent reply compared against a 29-hour typical manual reply; and a live lead feed showing inbound WhatsApp messages with the agent's reply, a lead score, and whether each was auto-handled or routed to the owner.",
  },
  questions: [
    {
      q: "What does a WhatsApp AI lead agent do?",
      a: "It captures every inbound WhatsApp message and sends a first reply immediately, so no lead waits for a person. ReplyDesk, built by Harshith Nayaka L, replies in roughly eight seconds and pairs the automation with a live dashboard: a real-time lead feed, the pipeline by stage, a “needs your attention” queue for leads a human should handle, and response-time KPIs. It is an interactive front-end prototype with a simulate-lead demo, not a WhatsApp-connected production deployment.",
    },
  ],
  metaDescription:
    "WhatsApp lead agent answering every inbound message in about eight seconds, with a live dashboard for the lead feed, pipeline and response-time KPIs.",
  links: [
    {
      label: "View on GitHub",
      href: "https://github.com/HarshithNayakaL/Whatsapp-Agent-Dashboard",
    },
  ],
};

const spectra: CaseStudy = {
  slug: "spectra",
  published: "2026-09-16T02:41:15Z",
  title: "SPECTRA",
  kicker: "AI search visibility audit",
  outcome:
    "Answers a narrower question than an SEO audit: what does an AI system actually understand about this site, what evidence supports that, and at which stage does a fact disappear?",
  meta: [
    { label: "Role", value: "Sole architect and engineer" },
    { label: "Stack", value: "Rust crawler, Bun/Hono API, React report" },
    { label: "Scoring", value: "spectra-v0.1, deterministic and versioned" },
    { label: "Status", value: "Deployed and public" },
  ],
  problem: [
    "Search visibility is a pipeline, not a page score. A fact can sit in the HTML and still vanish on the way to an answer — dropped by the crawler, lost in extraction, flattened in the semantic representation, misread by the model, or never retrieved. By the time you see the output, you cannot tell which of those happened.",
    "The tools on either side of this are unsatisfying. Conventional SEO tools inspect technical health and rankings, which is a different question. Generic AI-visibility checkers ask a model to grade a site and hand back a number nobody can audit — the score is the model's opinion, and there is no way to check its work.",
  ],
  build: [
    "SPECTRA keeps the evidence through every stage and measures deterministically on top of it. A Rust crawler does the hostile network work and emits structured evidence; TypeScript validates that at the process boundary; Gemini produces typed observations; and a separate scoring engine computes the numbers from registered checks only.",
    "The load-bearing rule is that the model never produces a score. It classifies the site and emits observations against a schema, and those become entities, relationships and claims that each reference the evidence they came from. Scoring consumes measured checks, never prose and never a model-authored number. That is what makes a result arguable rather than something you either believe or don't.",
    "Classification runs first and decides what is even worth checking. The system establishes the primary entity, archetype and purpose before selecting evaluation dimensions, so a restaurant is not marked down against checks meant for a B2B SaaS site. Irrelevant checks come back N/A and contribute to neither the earned points nor the denominator.",
  ],
  pipeline: [
    {
      title: "Crawl",
      nodes: [
        { id: "target", label: "Target URL", detail: "Validated and normalized", kind: "input" },
        { id: "dns", label: "DNS / IP safety", detail: "Rejects loopback, private, link-local, metadata", kind: "gate" },
        { id: "fetch", label: "Bounded fetch", detail: "Rust; 20 pages, depth 2, 2 MiB, 10s", kind: "logic" },
      ],
    },
    {
      title: "Evidence",
      nodes: [
        { id: "extract", label: "Extraction", detail: "Metadata, headings, JSON-LD, links, fingerprints", kind: "logic" },
        { id: "normalize", label: "Normalization", detail: "De-noise, keep evidence references", kind: "logic" },
        { id: "boundary", label: "Schema validation", detail: "Crawler output untrusted until validated", kind: "gate" },
      ],
    },
    {
      title: "Interpret",
      nodes: [
        { id: "classify", label: "Classification", detail: "Entity, archetype, purpose", kind: "model" },
        { id: "observe", label: "Typed observations", detail: "Schema-constrained; never scores", kind: "model" },
        { id: "graph", label: "Semantic graph", detail: "Entities, relationships, claims → evidence IDs", kind: "logic" },
      ],
    },
    {
      title: "Retrieve",
      nodes: [
        { id: "questions", label: "Question generation", detail: "From evidence-backed claims", kind: "model" },
        { id: "direct", label: "Direct evaluation", detail: "What the model understands unaided", kind: "model" },
        { id: "grounded", label: "Grounded retrieval", detail: "Optional; stored separately", kind: "model" },
      ],
    },
    {
      title: "Measure",
      nodes: [
        { id: "registry", label: "Dimension registry", detail: "Only registered checks can score", kind: "gate" },
        { id: "score", label: "spectra-v0.1", detail: "Weighted checks over a visible denominator", kind: "logic" },
        { id: "report", label: "Evidence-backed report", detail: "Survival stages, issues, repairs", kind: "output" },
      ],
    },
  ],
  howItWorks: [
    {
      title: "The model observes; it never scores",
      body: "Gemini classifies the site and emits observations against a response schema. Those are validated before anything downstream sees them, and the scoring engine accepts only typed checks from a controlled registry. An observation the registry does not know about cannot move the number. This is the difference between a score you can argue with and a score you can only accept.",
    },
    {
      title: "Every claim records where it died",
      body: "Each important claim carries a survival record across source, crawler, extraction, semantic graph, model understanding and retrieval — including the first stage that failed and why. That is the actual product: not 'your score is 62' but 'this fact is in your HTML and does not survive extraction'.",
    },
    {
      title: "Partial results stay useful",
      body: "A crawler failure is fatal, because without evidence there is nothing to measure. A model or grounding failure is not: the audit keeps the pages, metadata, structured data and every deterministic metric, and marks semantic evaluation unavailable. Without a Gemini key at all, the deterministic half still runs. Degrading to a blank page because one provider was down would have been the easy build and the useless one.",
    },
    {
      title: "The crawler is the security boundary, so it is Rust and it is paranoid",
      body: "It resolves and validates every destination and every redirect hop, rejecting non-HTTP schemes, embedded credentials, non-public addresses, oversized bodies and unsupported content types. Raw HTML never reaches the model. The defaults — 10s timeout, 2 MiB per response, 5 redirects, 20 pages, depth 2, concurrency 4 — are defense in depth, not a claim that arbitrary remote content is safe.",
    },
    {
      title: "Audits are immutable snapshots",
      body: "An audit is sealed on completion with its scoring version, so a re-scan is a second snapshot rather than an overwrite. Comparison aligns claims by normalized subject/predicate/object and evidence fingerprints and reports the deltas. Scores computed under different versions stay distinguishable instead of being silently mixed.",
    },
  ],
  results: [
    {
      label: "What it produces",
      body: "An evidence-linked report: the site's interpreted identity and purpose, an entity map, per-claim information-survival stages, retrievability and paraphrase stability, structured-evidence coverage, positioning bugs and the repairs for them — each traceable back to the source it came from.",
    },
    {
      label: "Why the scoring is deliberately dull",
      body: "spectra-v0.1 is weighted binary and ratio checks over a visible denominator. Each metric reports its version, calculation, applied and N/A checks, earned points and limitations. The initial weights are stated as engineering assumptions to be calibrated against labeled fixtures — not presented as science.",
    },
    {
      label: "Honest scope",
      body: "V1 has one production model provider, and search-grounded retrieval only runs where the configured Gemini API and model support it. The fixtures are test evidence, labeled as such, not dashboard metrics. The deployed build runs the Node compatibility crawler rather than the Rust binary, which it reports in the audit warnings rather than hiding.",
    },
  ],
  tech: [
    "Rust",
    "Bun + Hono",
    "React + Vite",
    "Gemini (schema-constrained)",
    "TypeScript monorepo",
    "PostgreSQL (production model)",
    "Deterministic scoring engine",
  ],
  shot: {
    src: "/shots/spectra.0f11b4f7.webp",
    width: 1079,
    height: 1738,
    alt: "SPECTRA's audit screen on a near-black canvas: an AEO badge over the heading \"Are you in the answer?\", fields for a site and for the questions buyers ask AI, a Gemini 3.1 Flash Lite model selector and a magenta Run audit button, above a panel reading \"27 checks, 4 layers, 1 score\" and a four-step explanation \u2014 crawl like an AI, ask like a buyer, read the answer, fix with code.",
  },
  questions: [
    {
      q: "How can I check whether my website appears in AI search answers?",
      a: "Ask an AI the questions your buyers ask, read what it answers, and trace why your facts do or do not survive — that is what SPECTRA, an AI search visibility (AEO) audit built by Harshith Nayaka L, does. It runs 27 checks across 4 layers and keeps the evidence at every stage, so a finding reads “this fact is in your HTML and does not survive extraction” rather than a bare score. The model classifies the site and emits typed observations; a separate deterministic engine computes every number from registered checks.",
    },
    {
      q: "Why do facts about my website disappear before an AI answers?",
      a: "Because search visibility is a pipeline, not a page score: a fact can sit in your HTML and still be dropped by the crawler, lost in extraction, flattened in the semantic representation, misread by the model or never retrieved. SPECTRA, built by Harshith Nayaka L, records for each important claim the first stage where it failed and why — across source, crawler, extraction, semantic graph, model understanding and retrieval — so a fix targets the stage that actually lost it.",
    },
    {
      q: "Can you trust an AI visibility score generated by an LLM?",
      a: "Not if the model produced the number, because a score that is a model’s opinion cannot be audited. In SPECTRA the model never produces a score: it emits observations against a schema, each tied to the evidence it came from, and a scoring engine computes results only from registered checks over a visible denominator. Every metric reports its version, calculation, applied and N/A checks, and its limitations.",
    },
  ],
  metaDescription:
    "AI search visibility (AEO) audit: asks AI what buyers ask, shows whether a site is in the answer, and scores 27 checks across 4 layers, each tied to evidence.",
  links: [
    { label: "Run an audit", href: "https://spectra-ai-aeo.vercel.app/" },
    { label: "View on GitHub", href: "https://github.com/HarshithNayakaL/spectra" },
  ],
};

const personalOsMcp: CaseStudy = {
  slug: "personal-os-mcp",
  published: "2026-09-16T02:41:15Z",
  title: "Personal MCP OS",
  kicker: "85-tool local execution layer",
  searchKicker: "85-tool local MCP server",
  outcome:
    "Gives an MCP client real hands on a machine — filesystem, shell, Git, browser, Android — behind a policy and approval layer that assumes the model will eventually ask for something it shouldn't.",
  meta: [
    { label: "Role", value: "Sole architect and engineer" },
    { label: "Surface", value: "85 MCP tools across Windows and Android" },
    { label: "Transport", value: "stdio adapter, loopback core, paired devices" },
    { label: "Status", value: "Runnable; local-first, no cloud dependency" },
  ],
  problem: [
    "An AI client that can only talk is limited to advice. One that can act is useful — and immediately dangerous, because the thing deciding what to run is a language model and the thing running it is your actual computer, with your files and your logged-in sessions.",
    "The usual answers are both bad. Lock it down to a toy sandbox and it cannot do the work you wanted. Give it unrestricted execution and you have handed a probabilistic system your user account. The interesting engineering is in the middle: full capability, with a boundary that a human controls and can inspect.",
  ],
  build: [
    "Personal MCP OS is a local execution layer with three processes. An MCP adapter speaks stdio to the client, one session per connection. A platform-independent core owns the device registry, routing, policy, approvals and audit. Separate agents — a Windows process and a native Kotlin Android companion — do the actual execution and are reached over authenticated transports.",
    "Capability is broad on purpose: 85 tools covering filesystem, shell and PowerShell, Git, a persistent Playwright Chromium, HTTP, clipboard, applications, and on Android the storage-access framework, intents, MediaStore and notification access. The tool reference is generated from the validated capability catalog rather than written by hand, so the documentation cannot drift from what the server actually exposes.",
    "Every capability declares a risk level — READ, WRITE, SENSITIVE or EXECUTE — and every argument shape is a Zod schema with unknown arguments rejected. Policy maps names or risk levels to allow, required or deny, with a capability override beating its risk level, and a missing policy entry requiring approval rather than defaulting open.",
  ],
  pipeline: [
    {
      title: "Client",
      nodes: [
        { id: "mcp", label: "MCP client", detail: "Any MCP-compatible client", kind: "input" },
        { id: "adapter", label: "stdio adapter", detail: "One session per connection", kind: "logic" },
      ],
    },
    {
      title: "Core",
      nodes: [
        { id: "validate", label: "Validate", detail: "Zod schema; unknown args rejected", kind: "gate" },
        { id: "route", label: "Route", detail: "Session preference; ambiguity rejected", kind: "logic" },
        { id: "policy", label: "Policy", detail: "Risk level and per-capability overrides", kind: "gate" },
      ],
    },
    {
      title: "Approval",
      nodes: [
        { id: "pending", label: "Approval required", detail: "Returns a request ID, not a result", kind: "gate" },
        { id: "human", label: "Human approves", detail: "Separate admin CLI and credential", kind: "input" },
        { id: "bound", label: "One-use grant", detail: "Bound to args, session, device; 5 min", kind: "gate" },
      ],
    },
    {
      title: "Execute",
      nodes: [
        { id: "windows", label: "Windows agent", detail: "Filesystem, shell, Git, Playwright, HTTP", kind: "logic" },
        { id: "android", label: "Android companion", detail: "SAF, intents, MediaStore, notifications", kind: "logic" },
      ],
    },
    {
      title: "Record",
      nodes: [
        { id: "audit", label: "SQLite audit", detail: "Mandatory; payload bodies omitted", kind: "output" },
        { id: "result", label: "Structured result", detail: "ok/data or typed error", kind: "output" },
      ],
    },
  ],
  howItWorks: [
    {
      title: "The model cannot approve its own request",
      body: "When a capability needs approval the call returns a request ID instead of a result. A human inspects the sanitized arguments in a terminal and approves through a separate admin CLI with its own credential — there is no MCP tool that grants approval. The grant is bound to the exact arguments, session, device and capability, expires in five minutes, and is consumed once. Re-running the same call needs a new one.",
    },
    {
      title: "Browser interaction is SENSITIVE by default, on principle",
      body: "Every click, key press, submit and download-triggering click requires approval, because a generic executor cannot infer what a website action does. There is deliberately no heuristic reading button text to decide a control looks harmless. `browser.evaluate` is implemented and denied by default: arbitrary page JavaScript removes the browser's confidentiality boundary and can reach page credentials.",
    },
    {
      title: "The security doc says what the boundary is not",
      body: "It states plainly that the program runs with the user's permissions, that approved shell commands, executable launches, Git hooks and page JavaScript can exceed the filesystem roots, and that command deny patterns are not a security boundary. Redaction is described as best effort. An execution layer that allows arbitrary commands cannot promise never to surface an unknown secret, and claiming otherwise would be the actual vulnerability.",
    },
    {
      title: "There are no credential-extraction tools, by omission",
      body: "Nothing exports cookies, passwords, storage state or auth headers. A persistent browser profile lets the browser use existing sessions without the server ever handing them over. Credentials are encrypted at rest — Windows DPAPI, Android Keystore AES-GCM — and the directories holding them are denied to the filesystem tools. Android notification retrieval returns metadata only, which keeps message bodies and OTPs out of reach.",
    },
    {
      title: "Nothing listens beyond loopback",
      body: "The core binds to loopback and requires a token on every endpoint except a one-use pairing route gated by a 128-bit, five-minute code. Browser-origin requests are rejected outright. The phone reaches the core through an adb reverse tunnel, so there is no LAN listener and no cloud relay. HTTP primitives resolve, validate and pin the destination address, block private ranges unless explicitly listed, and do not follow redirects.",
    },
    {
      title: "Timeout is not rollback",
      body: "The docs are explicit that a timed-out command, request or browser action may already have had an effect, and that the caller should check state before retrying a mutation. For a system whose whole job is side effects on a real machine, pretending a deadline undoes work would be the more dangerous simplification.",
    },
  ],
  results: [
    {
      label: "What it enables",
      body: "An MCP client can work a real machine end to end — read and edit files inside configured roots, run commands, drive Git, operate a persistent browser, and reach across to a paired Android device — without any of it leaving the machine or passing through a hosted service.",
    },
    {
      label: "Where the effort actually went",
      body: "Not the 85 tools; those are a catalog. The work is the boundary around them: risk classification, policy resolution, one-use approvals bound to exact arguments, canonical path checks for traversal and symlink escape, redaction, and a mandatory audit that records the action while omitting the payload.",
    },
    {
      label: "Honest scope",
      body: "This is a personal automation tool, not a hostile-code sandbox, and the documentation leads with that. Pairing tokens stay valid until local state is cleared and the daemon restarts — there is no remote revocation in V1. Path checks are not OS-level isolation against a local attacker racing filesystem operations.",
    },
  ],
  tech: [
    "Model Context Protocol (TypeScript SDK 1.30.0)",
    "TypeScript monorepo",
    "Kotlin (Android companion)",
    "Playwright Chromium",
    "Zod-validated capability catalog",
    "SQLite audit",
    "Windows DPAPI / Android Keystore",
  ],
  questions: [
    {
      q: "How do you safely give an AI agent access to your computer?",
      a: "Give it broad capability, then put a boundary around it that a human controls. In Personal MCP OS, built by Harshith Nayaka L, each of its 85 tools declares a risk level — READ, WRITE, SENSITIVE or EXECUTE — and policy maps it to allow, require approval or deny, with a missing entry requiring approval rather than defaulting open. An approval-gated call returns a request ID; a person approves it through a separate admin CLI, and the grant is bound to the exact arguments, expires in five minutes and is used once. No MCP tool can grant approval.",
    },
    {
      q: "Should an AI browser agent be allowed to click and submit on websites without approval?",
      a: "Not by default, because a generic executor cannot infer what a website action does. In Personal MCP OS, built by Harshith Nayaka L, every click, key press, submit and download-triggering click is classed SENSITIVE and needs human approval, and there is deliberately no heuristic that reads button text to decide a control looks harmless. Arbitrary page JavaScript is denied by default, since it removes the browser’s confidentiality boundary and can reach page credentials.",
    },
  ],
  metaDescription:
    "Local-first MCP execution layer: 85 tools across Windows and Android behind risk-based policy, one-use human approvals and a mandatory audit trail.",
  links: [
    {
      label: "View on GitHub",
      href: "https://github.com/HarshithNayakaL/personal-os-mcp",
    },
  ],
};

export const caseStudies: Record<string, CaseStudy> = {
  spectra,
  "personal-os-mcp": personalOsMcp,
  craftconnect,
  brandforge,
  "brand-audit-platform": brandAuditPlatform,
  "creative-ops-pipeline": creativeOps,
  maestro,
  cannon,
  replydesk,
  "nova-ai": novaAi,
  "ai-notes": aiNotes,
};

export const getCaseStudy = (slug: string): CaseStudy | undefined =>
  caseStudies[slug];
