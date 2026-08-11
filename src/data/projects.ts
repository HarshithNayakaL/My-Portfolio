export type Project = {
  slug: string;
  title: string;
  outcome: string; // one-line, outcome-framed (not a feature list)
  tags: string[];
  links: { label: string; href: string }[];
  hasCaseStudy: boolean;
  status?: "in-progress";
  kicker?: string; // small context line
};

export const GITHUB = "https://github.com/HarshithNayakaL";
export const LINKEDIN =
  "https://www.linkedin.com/in/harshithnayakal";
export const EMAIL = "harshith28124@gmail.com";
export const NAME = "Harshith Nayaka L";
/** Submissions go through Web3Forms when a key is set; otherwise the form
 *  falls back to a prefilled mailto. Set VITE_WEB3FORMS_KEY in the env. */
export const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY as
  | string
  | undefined;

/** Ordered by strength - the grid renders them in this order. */
export const projects: Project[] = [
  {
    slug: "creative-ops-pipeline",
    title: "Creative-Ops Pipeline",
    kicker: "Flagship",
    outcome:
      "A multi-model content pipeline that replaces hours of manual production with validated, on-brand output.",
    tags: ["LLM orchestration", "Structured output", "QA gates", "Cost tiering"],
    links: [],
    hasCaseStudy: true,
  },
  {
    slug: "craftconnect",
    title: "CraftConnect",
    kicker: "Gen AI Exchange Hackathon 2025",
    outcome:
      "A multi-modal assistant that lets artisans run an online storefront by talking and showing, not typing.",
    tags: ["Voice + Vision", "Gemini", "Google Cloud", "Product lead"],
    links: [{ label: "GitHub", href: "https://github.com/HarshithNayakaL/craftconnect" }],
    hasCaseStudy: true,
  },
  {
    slug: "maestro",
    title: "Maestro",
    kicker: "Multi-model orchestration",
    outcome:
      "A glass-box engine that routes one task across free LLMs — conductor, thinker, worker, verifier — and returns a single verified answer with a full decision-log of every step.",
    tags: ["LLM orchestration", "Verifier gates", "FastAPI", "Decision-log"],
    links: [
      { label: "Live site", href: "https://maestro-psi-neon.vercel.app/" },
      { label: "GitHub", href: "https://github.com/HarshithNayakaL/Maestro" },
    ],
    hasCaseStudy: true,
  },
  {
    slug: "cannon",
    title: "Cannon",
    kicker: "Multi-agent, not multi-task",
    outcome:
      "A daily-driver multi-agent assistant where each domain gets its own specialist — own persona, own tools, own retrieval scope, isolation enforced at the query, not by convention.",
    tags: ["Multi-agent", "RAG", "Provider fallback", "Next.js 16"],
    links: [
      { label: "Live site", href: "https://cannon-multi-agents.vercel.app" },
      {
        label: "GitHub",
        href: "https://github.com/HarshithNayakaL/cannon-multi-agents",
      },
    ],
    hasCaseStudy: true,
  },
  {
    slug: "replydesk",
    title: "ReplyDesk",
    kicker: "WhatsApp lead agent",
    outcome:
      "A WhatsApp lead agent that captures every inbound message and auto-replies in ~8 seconds, with a live dashboard for the lead feed, pipeline, and response-time KPIs.",
    tags: ["WhatsApp", "Lead automation", "Real-time dashboard", "Agent"],
    links: [
      {
        label: "GitHub",
        href: "https://github.com/HarshithNayakaL/Whatsapp-Agent-Dashboard",
      },
    ],
    hasCaseStudy: true,
  },
  {
    slug: "nova-ai",
    title: "Nova AI",
    kicker: "Deployed LLM chat app",
    outcome:
      "A deployed chat app on Llama 3.1 8B that keeps the API token server-side behind a serverless proxy.",
    tags: ["Llama 3.1 8B", "Hugging Face", "Serverless proxy"],
    links: [
      { label: "GitHub", href: "https://github.com/HarshithNayakaL/CUSTOM-GPT" },
    ],
    hasCaseStudy: true,
  },
  {
    slug: "blogspace",
    title: "BlogSpace",
    kicker: "Live & deployed",
    outcome:
      "A full-stack blogging platform with JWT auth and an admin panel, live in production.",
    tags: ["React", "Node", "MongoDB", "JWT"],
    links: [
      {
        label: "Live site",
        href: "https://tangerine-cupcake-145674.netlify.app/login",
      },
      { label: "GitHub", href: "https://github.com/HarshithNayakaL/blogspace-internship" },
    ],
    hasCaseStudy: true,
  },
  {
    slug: "ai-notes",
    title: "AI Notes",
    kicker: "Local inference, no server",
    outcome:
      "A notes app running a local LLM through Ollama, so inference never leaves the machine.",
    tags: ["DeepSeek R1", "Ollama", "Local/self-hosted"],
    links: [{ label: "GitHub", href: "https://github.com/HarshithNayakaL/AI-Notes-App" }],
    hasCaseStudy: true,
  },
];

export const getProject = (slug: string) =>
  projects.find((p) => p.slug === slug);
