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
  /** Real screenshot of the running product. Intrinsic size is the full
   *  capture; the page frames a preview of it, but the served file is whole
   *  so image search and AI surfaces get the entire thing. */
  shot?: { src: string; width: number; height: number; alt: string };
  links: { label: string; href: string }[];
};

const craftconnect: CaseStudy = {
  slug: "craftconnect",
  title: "CraftConnect",
  kicker: "Gen AI Exchange Hackathon 2025",
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
  metaDescription:
    "Multi-modal assistant letting artisans run an online storefront by talking and showing instead of typing. Gen AI Exchange Hackathon 2025 semi-finalist.",
  links: [{ label: "View on GitHub", href: "https://github.com/HarshithNayakaL/craftconnect" }],
};

const creativeOps: CaseStudy = {
  slug: "creative-ops-pipeline",
  title: "Creative-Ops Pipeline",
  kicker: "Flagship case study",
  outcome:
    "A multi-model content pipeline that turns a one-line brief into validated, on-brand output, without a human babysitting every step.",
  meta: [
    { label: "Type", value: "Production AI pipeline" },
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
    "LLM orchestration",
    "Tiered model routing",
    "Schema-constrained output",
    "Validation layer",
    "QA gates",
    "Structured logging",
  ],
  metaDescription:
    "Multi-model content pipeline turning a one-line brief into validated, on-brand output through tiered routing, schema-constrained generation and QA gates.",
  links: [],
};

const novaAi: CaseStudy = {
  slug: "nova-ai",
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
  metaDescription:
    "Chat app that scores every turn for difficulty and routes it across three model tiers, showing the lane, the reasoning and the cost on each answer.",
  links: [
    { label: "Live app", href: "https://custom-gpt-silk.vercel.app/" },
    { label: "View on GitHub", href: "https://github.com/HarshithNayakaL/CUSTOM-GPT" },
  ],
};

const blogspace: CaseStudy = {
  slug: "blogspace",
  title: "BlogSpace",
  kicker: "Live & deployed full-stack",
  outcome:
    "A complete blogging platform with authentication, roles, and an admin panel, built end to end and running in production.",
  meta: [
    { label: "Type", value: "Full-stack web app" },
    { label: "Stack", value: "React + Node + MongoDB" },
    { label: "Role", value: "Solo, front to back" },
  ],
  problem: [
    "A blogging platform sounds simple until you list what it actually needs: accounts, secure login, two kinds of users, content that only the right people can edit, and an admin who can moderate all of it. That's a real application, not a toy.",
    "I built it solo, end to end, as proof I can take a full-stack product from auth to deployment without hand-waving the hard parts.",
  ],
  build: [
    "BlogSpace handles the full lifecycle: register and log in with JWT-based auth and hashed passwords, write and publish posts in a rich-text editor, and manage everything through an admin panel with role-based access.",
    "Users get drafts, published states, tags, auto-generated excerpts and read-time. Admins get user promotion/demotion and post moderation. It's deployed across Netlify, Render, and MongoDB Atlas, and it's live, not a localhost screenshot.",
  ],
  pipeline: [
    {
      title: "Auth",
      nodes: [
        { id: "register", label: "Register / login", detail: "JWT + bcrypt", kind: "input" },
        { id: "role", label: "Role assignment", detail: "User vs admin", kind: "logic" },
      ],
    },
    {
      title: "Content",
      nodes: [
        { id: "editor", label: "Rich-text editor", detail: "Draft / publish", kind: "input" },
        { id: "crud", label: "Post CRUD", detail: "Owned by author", kind: "logic" },
      ],
    },
    {
      title: "Guard",
      nodes: [
        { id: "protect", label: "Protected routes", detail: "Access by role", kind: "gate" },
      ],
    },
    {
      title: "Admin",
      nodes: [
        { id: "moderate", label: "Moderation panel", detail: "Manage users & posts", kind: "output" },
      ],
    },
  ],
  howItWorks: [
    {
      title: "Auth done properly, not faked",
      body: "JWT tokens, bcrypt-hashed passwords, protected routes, and role-based access control. The boring security fundamentals that separate a real app from a tutorial, implemented rather than skipped.",
    },
    {
      title: "Two user classes, enforced server-side",
      body: "Users manage their own content; admins manage everyone's. The boundary is enforced on the backend, not hidden in the UI, so the permission model actually holds.",
    },
    {
      title: "Deployed across three services",
      body: "Frontend on Netlify, backend on Render, database on MongoDB Atlas. Wiring those together and keeping them talking in production is its own skill, and it's live.",
    },
  ],
  results: [
    {
      label: "What it proves",
      body: "End-to-end full-stack capability: a working auth system, a real permission model, and a deployment that strangers can actually use.",
    },
    {
      label: "Try it",
      body: "It's live and clickable, with demo accounts available, the strongest kind of proof: not a description, a working thing.",
    },
  ],
  tech: [
    "React",
    "Node.js / Express",
    "MongoDB / Mongoose",
    "JWT + bcrypt",
    "Netlify + Render",
  ],
  metaDescription:
    "Full-stack blogging platform with JWT authentication, role-based access and an admin panel, built on React, Node and MongoDB, and live in production.",
  links: [{ label: "View on GitHub", href: "https://github.com/HarshithNayakaL/blogspace-internship" }],
};

const aiNotes: CaseStudy = {
  slug: "ai-notes",
  title: "AI Notes",
  kicker: "Local inference, no server",
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
  title: "Maestro",
  kicker: "Multi-model orchestration",
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
  metaDescription:
    "Multi-model orchestration engine: a conductor routes one task across thinker, worker and verifier roles, returning a verified answer with a full decision-log.",
  links: [
    { label: "Live app", href: "https://maestro-psi-neon.vercel.app/" },
    { label: "View on GitHub", href: "https://github.com/HarshithNayakaL/Maestro" },
  ],
};

const cannon: CaseStudy = {
  slug: "cannon",
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
  metaDescription:
    "WhatsApp lead agent answering every inbound message in about eight seconds, with a live dashboard for the lead feed, pipeline and response-time KPIs.",
  links: [
    {
      label: "View on GitHub",
      href: "https://github.com/HarshithNayakaL/Whatsapp-Agent-Dashboard",
    },
  ],
};

export const caseStudies: Record<string, CaseStudy> = {
  craftconnect,
  "creative-ops-pipeline": creativeOps,
  maestro,
  cannon,
  replydesk,
  "nova-ai": novaAi,
  blogspace,
  "ai-notes": aiNotes,
};

export const getCaseStudy = (slug: string): CaseStudy | undefined =>
  caseStudies[slug];
