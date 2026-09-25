import Reveal from "./Reveal";
import { NAME } from "../data/projects";

/** Resolvable DOI — the citable identifier, not just a publisher page link. */
const PAPER_DOI = "https://www.doi.org/10.59256/ijrtmr.20250506023";

/**
 * The identity facts, exported because the markdown twins need exactly these
 * and a second copy would drift. Everything here is rendered visibly on the
 * page below — Google's AI-features guidance asks that structured data match
 * the visible text, and the same reasoning applies to the agent surface.
 */
export const facts = [
  { k: "Role", v: "AI Engineer, Full-Stack" },
  { k: "Company", v: "DemandNXT" },
  { k: "Based in", v: "Bengaluru, India" },
  { k: "Building since", v: "2022" },
];

/**
 * Who this is, in one liftable statement: name, role, city, what the work is,
 * employer, availability. AI Mode answers a "list of AI workflow engineers in
 * Bangalore" question by fanning it out into ordinary searches and quoting the
 * plain sentence that names a person, a role and a place, so this sentence
 * leads the About and Contact pages, the markdown twins, llms.txt and the
 * Person schema, word for word. Every clause is a fact stated elsewhere on
 * the site; nothing here is new.
 */
export const identitySentence = `${NAME} is a full-stack AI Engineer based in Bengaluru (Bangalore), India, currently AI Engineer at DemandNXT, where he was previously AI Workflow Engineer. He builds AI agents, RAG pipelines and AI workflow automation for marketing and creative operations, and is available for freelance work.`;

/**
 * The stack, stated once in words. AI Mode fans a question like "AI engineer
 * in Bangalore who knows FastAPI" out into searches such as "Python FastAPI AI
 * engineer Bengaluru", and a passage only answers one if it names the tools;
 * before this they appeared only as chips scattered across case studies.
 * `match` must occur in some case study's `tech` list — build-api.mjs fails
 * the build otherwise — so this cannot name a tool the work does not show.
 */
export const stack: { label: string; match: string }[] = [
  { label: "Python", match: "python" },
  { label: "FastAPI", match: "fastapi" },
  { label: "TypeScript", match: "typescript" },
  { label: "React", match: "react" },
  { label: "Next.js", match: "next.js" },
  { label: "Node.js", match: "node.js" },
  { label: "n8n", match: "n8n" },
  { label: "Google Gemini", match: "gemini" },
  { label: "Groq-hosted open models", match: "groq" },
  { label: "OpenAI", match: "openai" },
  { label: "PostgreSQL with pgvector", match: "pgvector" },
  { label: "SQLite", match: "sqlite" },
  { label: "Redis", match: "redis" },
  { label: "the Model Context Protocol", match: "model context protocol" },
  { label: "Playwright", match: "playwright" },
  { label: "Vitest", match: "vitest" },
];

const pick = (...labels: string[]) => labels.map((l) => stack.find((x) => x.label === l)!.label);
/** The list alone, for places that supply their own lead-in (the twin's facts). */
export const stackList =
  `${pick("Python", "FastAPI").join(" and ")}; ` +
  `${pick("TypeScript", "React", "Next.js").join(", ")} and ${pick("Node.js")[0]}; ` +
  `${pick("n8n")[0]} for workflow automation; ` +
  `${pick("Google Gemini", "Groq-hosted open models").join(", ")} and ${pick("OpenAI")[0]} models; ` +
  `${pick("PostgreSQL with pgvector", "SQLite").join(", ")} and ${pick("Redis")[0]}; ` +
  `${pick("the Model Context Protocol")[0]}; and ${pick("Playwright", "Vitest").join(" and ")} for testing`;

/** Third person and self-contained, like the identity sentence, so the
 *  passage still names who and what when an answer engine lifts it alone. */
export const stackSentence = `Across these projects, ${NAME}'s full-stack AI engineering stack is ${stackList}.`;

/** The status line above the bio, and the one availability claim on the site. */
export const availability = "Available for freelance work";

/**
 * The title held at DemandNXT, kept separate from `Role` because they are
 * different strings. The earlier title stays on record because it is true and
 * people still search for it.
 */
export const workingTitle = "AI Engineer";
export const previousTitle = "AI Workflow Engineer";

export default function About() {
  return (
    <section id="about" className="shell scroll-mt-28 py-20 md:py-28">
      <div className="grid gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-10 lg:gap-16">
        {/* Portrait + facts */}
        <Reveal>
          <div className="flex flex-col items-center md:sticky md:top-28 md:items-start">
            <div className="group glass-card relative aspect-square w-full max-w-xs overflow-hidden rounded-[var(--radius-lg)]">
              <img
                src="/profile.jpg"
                alt="Harshith Nayaka L"
                width={800}
                height={800}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
              />
              <div
                className="pointer-events-none absolute bottom-3 left-4 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-white"
                style={{ textShadow: "0 1px 6px rgba(0,0,0,0.65)" }}
              >
                Harshith Nayaka L
              </div>
            </div>

            <dl className="glass-card mt-6 max-w-xs rounded-[var(--radius)] px-4">
              {facts.map((f) => (
                <div
                  key={f.k}
                  className="flex items-baseline justify-between gap-4 border-t border-line py-3 first:border-t-0"
                >
                  <dt className="shrink-0 font-mono text-[0.75rem] font-medium uppercase tracking-wider text-dim">
                    {f.k}
                  </dt>
                  <dd className="text-right text-sm font-semibold text-ink">
                    {f.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        {/* Bio */}
        <Reveal delay={0.08}>
          <div className="max-w-xl">
            {/* Borderless status line — a live signal, not a badge */}
            <span className="inline-flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
              <span className="text-[0.9375rem] font-semibold tracking-tight text-accent-ink">
                {availability}
              </span>
            </span>

            <h2 className="mt-6 text-3xl font-semibold tracking-tight md:text-4xl">
              About
            </h2>

            <div className="mt-6 space-y-5 text-base leading-relaxed text-dim md:text-lg">
              {/* The identity sentence, verbatim, as the lead: the line an
                  answer engine can quote as a statement about a named person,
                  and the text the Person schema's description matches. The
                  first-person voice picks up after it. */}
              <p className="text-ink">{identitySentence}</p>
              <p>
                In practice that means the model, the backend, and the
                interface around it. My public work includes Maestro, a
                multi-model LLM orchestration engine, and Cannon, a
                multi-agent assistant with query-level domain isolation —
                both live and open-source.
              </p>
              <p>{stackSentence}</p>
              <p>
                I've been building with code since 2022. That isn't years of
                production ML, and I won't pretend it is. It's a few years of
                actually shipping things, breaking them, and learning what
                reliable looks like up close.
              </p>
              <p>
                What I care about is the unglamorous part: making AI systems
                behave the same way on the hundredth run as the first. That gap,
                between a demo and something a business can lean on, is most of
                the job, and it's the part I'm good at.
              </p>
            </div>

            {/* Published research. Real, citable proof-of-work — and the
                academic counterpart to the AI Notes case study. */}
            <div className="mt-10 border-t border-line pt-6">
              <h3 className="font-mono text-[0.75rem] font-medium uppercase tracking-wider text-dim">
                Published research
              </h3>
              <p className="mt-3 text-base leading-relaxed text-dim">
                Author of{" "}
                <a
                  href={PAPER_DOI}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium text-accent-ink underline decoration-line underline-offset-4 transition-colors hover:text-ink"
                >
                  “AI-Powered Note-Taking System: A Local Machine Learning
                  Approach DeepSeek R1 Integration”
                </a>
                , published in the International Journal of Research Trends and
                Multidisciplinary Research (IJRTMR), Nov–Dec 2025. It documents
                the local-inference approach behind the AI Notes project —
                running the model on-device so notes never leave the machine.
              </p>
              <p className="mt-2 font-mono text-[0.75rem] text-faint">
                DOI: 10.59256/ijrtmr.20250506023
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
