import Reveal from "./Reveal";

/** Resolvable DOI — the citable identifier, not just a publisher page link. */
const PAPER_DOI = "https://www.doi.org/10.59256/ijrtmr.20250506023";

const facts = [
  { k: "Role", v: "AI Engineer, Full-Stack" },
  { k: "Company", v: "DemandNXT" },
  { k: "Based in", v: "Bengaluru, India" },
  { k: "Building since", v: "2022" },
];

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
                className="pointer-events-none absolute bottom-3 left-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
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
                  <dt className="shrink-0 font-mono text-[12px] font-medium uppercase tracking-wider text-dim">
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
              <span className="text-[15px] font-semibold tracking-tight text-accent-ink">
                Available for freelance work
              </span>
            </span>

            <h2 className="mt-6 text-3xl font-semibold tracking-tight md:text-4xl">
              About
            </h2>

            <div className="mt-6 space-y-5 text-base leading-relaxed text-dim md:text-lg">
              <p>
                I'm Harshith — a full-stack AI Engineer based in Bengaluru
                (Bangalore), India. I build AI agents, RAG pipelines, and
                full-stack AI apps: the model, the backend, and the interface
                around them.
                At DemandNXT I go by AI Workflow Engineer, building
                production AI systems and pipelines for marketing and
                creative operations. My public work includes Maestro, a
                multi-model LLM orchestration engine, and Cannon, a
                multi-agent assistant with query-level domain isolation —
                both live and open-source.
              </p>
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
              <h3 className="font-mono text-[12px] font-medium uppercase tracking-wider text-dim">
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
              <p className="mt-2 font-mono text-[12px] text-faint">
                DOI: 10.59256/ijrtmr.20250506023
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
