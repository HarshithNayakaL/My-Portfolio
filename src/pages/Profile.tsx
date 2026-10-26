import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { EMAIL, GITHUB, LINKEDIN, NAME, projects } from "../data/projects";
import { facts, availability, headlineRole, identitySentence, stackSentence, experience } from "../components/About";
import { caseStudies } from "../data/caseStudies";
import { profileQA } from "../data/profileQA";
import AllStudies from "../components/AllStudies";

/**
 * /about and /contact: the entity anchors.
 *
 * These exist because an answer engine looking for "who is this, where are
 * they, how do I reach them" had nowhere to land. The homepage carries both
 * as anchors — #about and #contact — and an anchor is not a page: it cannot
 * be cited on its own, cannot carry its own title and description, and does
 * not appear as a result. An audit of this site scored "about and contact
 * pages" as an outright failure for exactly that reason.
 *
 * They deliberately do not repeat the homepage sections. Two URLs carrying the
 * same paragraphs is a duplicate-content problem, and the homepage is the
 * stronger of the two. These carry what the homepage summarises: the full
 * record, stated once, in the place a machine expects to find it.
 */

type Doc = {
  title: string;
  /** The visible <h1>. "About" and "Contact" named nothing a search matches. */
  h1?: string;
  /** When set, the <h1> renders as name + headline on two visual lines; its
   *  text stays `h1` exactly, joined by a visually hidden " — ". */
  h1Split?: [string, string];
  /** The <title>, where "About | Name" says nothing a searcher asked. */
  searchTitle?: string;
  description: string;
  intro: string;
  sections: { h: string; p: string[] }[];
  /** Question-and-answer pairs rendered after the sections, with FAQPage schema. */
  qa?: { h: string; items: { q: string; a: string }[] };
};

const shipped = projects.filter((p) => p.hasCaseStudy).length;

export const profileDocs: Record<string, Doc> = {
  about: {
    title: "About",
    // The "who is he" page. It used to carry the role-and-city people-list
    // title as well, which put it in competition with the homepage for the
    // same query (see src/data/seo.ts); it now answers the name question and
    // leaves the role query to the homepage. Role, city and specialties are
    // still stated in the body, where an answer engine quotes them from.
    h1: `About ${NAME}`,
    h1Split: [`About ${NAME}`, "Background, stack, published research and the questions people ask"],
    searchTitle: `About ${NAME} — Background, Stack and Published Research`,
    description: `Who ${NAME} is: his role at DemandNXT, what he has built since 2022, his stack, his co-authored IJRTMR paper, and answers to common questions.`,
    intro: identitySentence,
    sections: [
      {
        h: "At a glance",
        p: [
          `${headlineRole} at ${facts.find((f) => f.k === "Company")?.v} · Bengaluru (Bangalore), India · ${availability}.`,
          "Specialties: AI agents and multi-agent systems, RAG pipelines, AI workflow automation with n8n, and LLM apps built end to end.",
          "Shipped: Octo, a live multi-agent research workspace on the OpenAI Agents API; SPECTRA, a live AI search visibility audit; Personal MCP OS, an 85-tool local MCP server where risky actions wait for one-time human approval; Maestro, a live open-source multi-model LLM orchestration engine; and a roughly 90-node n8n content pipeline with QA gates.",
          stackSentence,
        ],
      },
      {
        h: "The short version",
        p: [
          `Role: ${headlineRole} at ${facts.find((f) => f.k === "Company")?.v}. Based in ${
            facts.find((f) => f.k === "Based in")?.v
          }. Building since ${facts.find((f) => f.k === "Building since")?.v}. ${availability}.`,
          "The work is AI agents, retrieval pipelines and AI applications built end to end — the model, the backend, and the interface around them. At DemandNXT he leads AI engineering: production AI systems and pipelines for marketing and creative operations across its six B2B brands. He is also migrating DemandNXT's own website from legacy WordPress to a codebase built with Astro.",
        ],
      },
      {
        // One line per project, name first: the shape a list answer quotes
        // ("built BrandForge, a …"), taken from the same data as the
        // homepage grid so it cannot drift.
        h: "Selected work, one line each",
        p: projects
          .filter((pr) => pr.hasCaseStudy)
          .map(
            (pr) =>
              `${pr.title} (${caseStudies[pr.slug]?.searchKicker ?? pr.kicker}): ${pr.outcome}`,
          ),
      },
      {
        h: "What the work actually is",
        p: [
          "Most of the engineering in an AI system is not the model. It is everything that assumes the model can be wrong: routing a request before spending on it, constraining output to a schema and validating it anyway, having a second model on a different family verify the first, isolating agents so context cannot leak between them, and keeping a decision log that can be replayed after something goes wrong.",
          `That is the difference between a demo that works once and a system a business can lean on, and it is most of the job. There are ${shipped} case studies on this site and each one is a version of that argument with the code attached.`,
        ],
      },
      {
        // This used to add "not years of production ML research". AI Mode
        // quoted that clause back as the reason to leave me off a list; the
        // start date is the fact, and it stays.
        h: "Everything here is checkable",
        p: [
          "Building with code since 2022: a few years of shipping things, breaking them and learning what reliable looks like up close.",
          "Everything stated here is checkable. Most projects are public repositories (the two internal ones, the Multi-Brand Audit Platform and the Creative-Ops Pipeline, say so on their pages), the research is a published paper with a DOI, and where a number appears it traces to something that can be read rather than taken on trust.",
        ],
      },
      {
        h: "Experience",
        p: experience.map((e) => `${e.title}, ${e.org} (${e.when.toLowerCase()}). ${e.note}`),
      },
      {
        h: "Published research",
        p: [
          "Co-author of “AI-Powered Note-Taking System: A Local Machine Learning Approach DeepSeek R1 Integration”, published in the International Journal of Research Trends and Multidisciplinary Research (IJRTMR), Nov–Dec 2025. It documents the local-inference approach behind the AI Notes project: summarisation running on DeepSeek R1 through Ollama, with no cloud fallback.",
        ],
      },
    ],
    qa: { h: `Questions people ask about ${NAME}`, items: profileQA },
  },
  contact: {
    title: "Contact",
    h1: `Hire ${NAME} for freelance AI work`,
    // The hiring page: "hire" and "freelance" with the specialties, but not
    // "AI Engineer in Bengaluru", which is the homepage's query (see
    // src/data/seo.ts). Availability for freelance work is stated on the site.
    searchTitle: `Hire ${NAME} for Freelance AI Work — Agents, RAG, n8n`,
    description: `Hire ${NAME} for freelance AI work: AI agents, RAG pipelines and n8n automation. ${availability}. Email ${EMAIL}.`,
    intro: `${identitySentence} Email is the direct route, and the form on the homepage reaches the same inbox.`,
    sections: [
      {
        h: "How to reach me",
        p: [
          `Email: ${EMAIL}. This is the fastest route and the one I read.`,
          `GitHub: ${GITHUB} — most of the work described on this site is public there.`,
          `LinkedIn: ${LINKEDIN}.`,
        ],
      },
      {
        h: "Availability and location",
        p: [
          `${availability}. Based in ${
            facts.find((f) => f.k === "Based in")?.v
          }, working with teams wherever they are.`,
          "There are no rates or turnaround times quoted anywhere on this site. Those depend entirely on the work, and publishing a number that cannot hold for every engagement would be a commitment rather than a fact.",
        ],
      },
      {
        h: "What helps in a first message",
        p: [
          "The rough steps of the process as it works today, and what a good outcome looks like. Not a specification — a specification written before anyone understands the failure modes usually describes the wrong system.",
          "If there is an existing stack, naming it saves a round trip. Provider choice is a wiring decision rather than an architectural one: shipped work here runs on OpenAI, Gemini, Groq, Llama, DeepSeek and fully local inference.",
        ],
      },
    ],
  },
};

export default function Profile({ doc }: { doc: "about" | "contact" }) {
  const d = profileDocs[doc];
  return (
    <article className="shell py-20 md:py-28">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-[max(12px,0.8125rem)] text-dim transition-colors hover:text-ink"
      >
        <ArrowLeft weight="bold" size={15} aria-hidden />
        All work
      </Link>
      {d.h1Split ? (
        <h1 className="mt-8 font-semibold tracking-tight">
          <span className="block text-4xl md:text-5xl">{d.h1Split[0]}</span>
          <span className="sr-only"> — </span>
          <span className="mt-3 block text-xl font-medium text-dim md:text-2xl">{d.h1Split[1]}</span>
        </h1>
      ) : (
        <h1 className="mt-8 text-4xl font-semibold tracking-tight md:text-5xl">{d.h1 ?? d.title}</h1>
      )}
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-dim">{d.intro}</p>
      <div className="mt-12 max-w-2xl space-y-10">
        {d.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-3xl tracking-tight md:text-4xl">{s.h}</h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-dim">
              {s.p.map((para) => (
                <p key={para.slice(0, 40)}>{para}</p>
              ))}
            </div>
          </section>
        ))}
        {d.qa && (
          <section>
            <h2 className="text-3xl tracking-tight md:text-4xl">{d.qa.h}</h2>
            <div className="mt-6 space-y-7">
              {d.qa.items.map((item) => (
                <div key={item.q}>
                  <h3 className="text-xl tracking-tight text-ink md:text-2xl">{item.q}</h3>
                  <p className="mt-2 text-base leading-relaxed text-dim">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        {doc === "about" && <AllStudies className="border-t border-line pt-8" />}
      </div>
    </article>
  );
}
