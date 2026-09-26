import { EMAIL, GITHUB, LINKEDIN, NAME, projects } from "./projects";
import { caseStudies } from "./caseStudies";
import { availability, previousTitle, stackList, workingTitle } from "../components/About";

/**
 * The follow-up questions people ask an AI about a person, answered the way
 * an AI answer is written.
 *
 * Google says AI Mode users ask "longer and more specific questions — as well
 * as follow-up questions to dig even deeper", and its AI Mode patent describes
 * how a follow-up is answered: the model rewrites it with the conversation's
 * context ("what are his projects?" becomes a search like "Harshith Nayaka L
 * projects"), searches that, and links each sentence it writes to the passage
 * that matches it most closely. So every answer here opens with the full name
 * and states the fact in its first sentence, the shape of the sentence the
 * model will write. An AI Mode audit in September 2026 found name queries
 * already cite this site but repeat stale or merged facts (an old job title,
 * an unrelated "Nova", projects credited to the employer); each answer below
 * states the current fact once, generated from the same data as the rest of
 * the site so it cannot drift.
 *
 * Never attribute a project to the employer: no case study says where it was
 * built, and the internal audit platform was deliberately de-attributed.
 *
 * Rendered on /about with a FAQPage schema, in the /about markdown twin, in
 * /api/v1/profile, and quoted by the A2A agent.
 */

const withStudies = projects.filter((p) => p.hasCaseStudy);
const label = (slug: string, fallback?: string) => caseStudies[slug]?.searchKicker ?? fallback ?? "";
const withCode = withStudies.filter((p) =>
  (caseStudies[p.slug]?.links ?? []).some((l) => l.href.includes("github.com")),
).length;

export const profileQA: { q: string; a: string }[] = [
  {
    q: `Who is ${NAME}?`,
    a: `${NAME} is an ${workingTitle} at DemandNXT in Bengaluru (Bangalore), India. He builds AI agents, RAG pipelines and AI workflow automation, along with the backends and interfaces around them, and he is available for freelance work.`,
  },
  {
    q: `What does ${NAME} do?`,
    a: `${NAME} builds AI systems that have to hold up in production: AI agents and multi-agent systems, RAG pipelines, AI workflow automation with n8n, and full-stack LLM apps. At DemandNXT he builds AI systems and pipelines for marketing and creative operations.`,
  },
  {
    q: `What is ${NAME}'s current job title?`,
    a: `${NAME}'s current job title is ${workingTitle} at DemandNXT in Bengaluru. Before this role he was ${previousTitle} at the same company.`,
  },
  {
    q: `Where is ${NAME} based?`,
    a: `${NAME} is based in Bengaluru (Bangalore), Karnataka, India.`,
  },
  {
    q: `What projects has ${NAME} built?`,
    a:
      `${NAME} has ${withStudies.length} projects with published case studies: ` +
      // Labels exactly as authored: any automatic re-casing breaks on some name
      // ("AI" became "aI", "WhatsApp" became "whatsApp").
      withStudies.map((p) => `${p.title} (${label(p.slug, p.kicker)})`).join(", ") +
      `. ${withCode} of them link to public code on GitHub (${GITHUB}), and every case study is on his site.`,
  },
  {
    q: `Does ${NAME} build AI agents and RAG pipelines?`,
    a: `Yes. ${NAME} builds AI agents, multi-agent systems and RAG pipelines. Cannon is a multi-agent assistant where each agent has its own tools and its own retrieval over Postgres with pgvector; Maestro routes one task across thinker, worker and verifier models; and Personal MCP OS is an 85-tool MCP server where risky actions wait for human approval.`,
  },
  {
    q: `Does ${NAME} work with n8n?`,
    a: `Yes. ${NAME} builds AI workflow automation in n8n. His Creative-Ops Pipeline is a roughly 90-node n8n workflow with model routing, schema-constrained output and QA gates, and BrandForge's orchestration can run on n8n.`,
  },
  {
    q: `What is ${NAME}'s tech stack?`,
    a: `${NAME} works in ${stackList}.`,
  },
  {
    q: `How much experience does ${NAME} have?`,
    a: `${NAME} has been building software since 2022. He is ${workingTitle} at DemandNXT, where he was previously ${previousTitle}, has ${withStudies.length} projects with published case studies, and co-authored a peer-reviewed paper on local LLM inference (IJRTMR, 2025).`,
  },
  {
    q: `Is ${NAME} available for freelance work?`,
    a: `Yes. ${NAME} is ${availability.replace(/^Available/, "available")} alongside his role at DemandNXT. The direct route is email: ${EMAIL}.`,
  },
  {
    q: `How can I contact ${NAME}?`,
    a: `Email ${NAME} at ${EMAIL}, or use the contact form on his site. His GitHub is ${GITHUB} and his LinkedIn is ${LINKEDIN}.`,
  },
  {
    q: `Has ${NAME} published any research?`,
    a: `Yes. ${NAME} co-authored “AI-Powered Note-Taking System: A Local Machine Learning Approach DeepSeek R1 Integration”, published in IJRTMR in Nov–Dec 2025 (DOI 10.59256/ijrtmr.20250506023). It documents the approach behind his AI Notes app, which runs DeepSeek R1 locally through Ollama.`,
  },
];
