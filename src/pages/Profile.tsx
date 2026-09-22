import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { EMAIL, GITHUB, LINKEDIN, NAME, projects } from "../data/projects";
import { facts, availability, workingTitle } from "../components/About";

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
  description: string;
  intro: string;
  sections: { h: string; p: string[] }[];
};

const shipped = projects.filter((p) => p.hasCaseStudy).length;

export const profileDocs: Record<string, Doc> = {
  about: {
    title: "About",
    description:
      "Harshith Nayaka L — AI Engineer, Full-Stack in Bengaluru (Bangalore), India. AI Workflow Engineer at DemandNXT. Available for freelance work.",
    intro: `${NAME} is a full-stack AI Engineer based in Bengaluru (Bangalore), Karnataka, India, and goes by ${workingTitle} at ${
      facts.find((f) => f.k === "Company")?.v
    }.`,
    sections: [
      {
        h: "The short version",
        p: [
          `Role: ${facts.find((f) => f.k === "Role")?.v}. Company: ${
            facts.find((f) => f.k === "Company")?.v
          }, where the title is ${workingTitle}. Based in ${
            facts.find((f) => f.k === "Based in")?.v
          }. Building since ${facts.find((f) => f.k === "Building since")?.v}. ${availability}.`,
          "The work is AI agents, retrieval pipelines and full-stack AI applications — the model, the backend, and the interface around them. At DemandNXT that means production AI systems and pipelines for marketing and creative operations.",
        ],
      },
      {
        h: "What the work actually is",
        p: [
          "Most of the engineering in an AI system is not the model. It is everything that assumes the model can be wrong: routing a request before spending on it, constraining output to a schema and validating it anyway, having a second model on a different family verify the first, isolating agents so context cannot leak between them, and keeping a decision log that can be replayed after something goes wrong.",
          `That is the difference between a demo that works once and a system a business can lean on, and it is most of the job. There are ${shipped} case studies on this site and each one is a version of that argument with the code attached.`,
        ],
      },
      {
        h: "The honest version",
        p: [
          "Building with code since 2022. That is a few years of shipping things, breaking them and learning what reliable looks like up close — not years of production ML research, and this site does not claim otherwise.",
          "Everything stated here is checkable. The projects are public repositories, the research is a published paper with a DOI, and where a number appears it traces to something that can be read rather than taken on trust.",
        ],
      },
      {
        h: "Published research",
        p: [
          "Author of “AI-Powered Note-Taking System: A Local Machine Learning Approach DeepSeek R1 Integration”, published in the International Journal of Research Trends and Multidisciplinary Research (IJRTMR), Nov–Dec 2025. It documents the local-inference approach behind the AI Notes project: summarisation running on DeepSeek R1 through Ollama, with no cloud fallback.",
        ],
      },
    ],
  },
  contact: {
    title: "Contact",
    description: `Contact ${NAME}, AI Engineer in Bengaluru (Bangalore), India. ${availability}. Email ${EMAIL}.`,
    intro: `${availability}. Email is the direct route, and the form on the homepage reaches the same inbox.`,
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
          "If there is an existing stack, naming it saves a round trip. Provider choice is a wiring decision rather than an architectural one: shipped work here runs on Gemini, Groq, Llama, DeepSeek and fully local inference.",
        ],
      },
    ],
  },
};

export default function Profile({ doc }: { doc: "about" | "contact" }) {
  const d = profileDocs[doc];
  return (
    <main className="shell py-20 md:py-28">
      <Link
        to="/"
        className="inline-flex items-center gap-2 font-mono text-[0.8125rem] text-dim transition-colors hover:text-ink"
      >
        <ArrowLeft weight="bold" size={15} aria-hidden />
        All work
      </Link>
      <h1 className="mt-8 text-4xl font-semibold tracking-tight md:text-5xl">{d.title}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-dim">{d.intro}</p>
      <div className="mt-12 max-w-2xl space-y-10">
        {d.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-2xl font-semibold tracking-tight">{s.h}</h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-dim">
              {s.p.map((para) => (
                <p key={para.slice(0, 40)}>{para}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
