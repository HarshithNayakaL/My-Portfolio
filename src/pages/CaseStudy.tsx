import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ArrowRight, Info } from "@phosphor-icons/react";
import { getCaseStudy } from "../data/caseStudies";
import { EMAIL, NAME } from "../data/projects";
import PipelineDiagram from "../components/PipelineDiagram";
import Reveal from "../components/Reveal";

export default function CaseStudy() {
  const { slug } = useParams();
  const study = slug ? getCaseStudy(slug) : undefined;

  if (!study) {
    return (
      <div className="shell flex min-h-[60vh] flex-col items-start justify-center gap-5 py-32">
        <p className="font-mono text-sm text-faint">404 / case study not found</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          That case study isn't here.
        </h1>
        <Link
          to="/#work"
          className="inline-flex items-center gap-1.5 text-accent-ink hover:text-ink"
        >
          <ArrowLeft size={16} weight="bold" /> Back to work
        </Link>
      </div>
    );
  }

  return (
    <article className="pt-28 md:pt-32">
      {/* Header */}
      <header className="shell">
        <Reveal>
          <Link
            to="/#work"
            className="inline-flex items-center gap-1.5 font-mono text-[13px] text-dim transition-colors hover:text-ink"
          >
            <ArrowLeft size={15} weight="bold" /> All work
          </Link>

          <p className="mt-10 font-mono text-[12px] uppercase tracking-[0.2em] text-accent-ink">
            {study.kicker}
          </p>
          <h1 className="mt-5 max-w-4xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            {study.title}
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-dim md:text-xl">
            {study.outcome}
          </p>

          {/* Byline. Someone arriving here from a search has no idea who wrote
              this — the Article schema names an author but nothing on the page
              corroborated it. Google's guidance is to carry a byline wherever
              a reader would reasonably ask "who wrote this?", which a case
              study plainly is. */}
          <p className="mt-7 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-dim">
            <span>Written by</span>
            <Link
              to="/#about"
              rel="author"
              className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:text-accent-ink"
            >
              {NAME}
            </Link>
            <span aria-hidden className="text-faint">
              ·
            </span>
            <span>AI Engineer, Full-Stack — Bengaluru, India</span>
          </p>

          <dl className="mt-10 grid gap-px border-t border-line sm:grid-cols-2 lg:grid-cols-4">
            {study.meta.map((m) => (
              <div key={m.label} className="border-b border-line py-4 pr-4 sm:border-b-0">
                <dt className="font-mono text-[11px] font-medium uppercase tracking-wider text-dim">
                  {m.label}
                </dt>
                <dd className="mt-1.5 text-sm leading-snug text-ink">{m.value}</dd>
              </div>
            ))}
          </dl>

          {study.links.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-4">
              {study.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink transition-colors hover:text-ink"
                >
                  {l.label}
                  <ArrowUpRight size={15} weight="bold" />
                </a>
              ))}
            </div>
          )}

          {study.inProgress && (
            <div className="mt-8 flex items-start gap-3 rounded-[var(--radius-lg)] border border-accent/25 bg-accent-dim px-4 py-3.5 text-sm text-dim">
              <Info weight="bold" size={18} className="mt-0.5 shrink-0 text-accent-ink" />
              <p>
                This is the flagship write-up, still being finished. The
                architecture and engineering approach below are real; the full
                walkthrough with sample runs is on its way. It's a clean rebuild
                on public APIs, with no client data or proprietary logic.
              </p>
            </div>
          )}
        </Reveal>
      </header>

      {/* Screenshot of the running product, where one exists. Shown whole
          rather than cropped to a banner: each image is already trimmed to the
          region that carries the argument — Maestro's decision-log, Cannon's
          per-domain agents — and cropping it again to a letterbox would hide
          exactly that. width/height are the real intrinsic size, so the box is
          reserved before the file arrives and nothing shifts. */}
      {study.shot && (
        <section className="shell pt-12 md:pt-16">
          <Reveal>
            {/* Capped at 720px — comfortably under the 1080px capture width, so
                the image is always downscaled and never blown up past its own
                resolution. Letting it fill the 1238px content column upscaled
                it 1.15x, which read as soft, and made a tall capture swallow
                the viewport. Small on a phone by necessity: these are desktop
                interfaces, so the caption link is how you actually read one. */}
            <figure className="max-w-[720px]">
              <div className="elev overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface/50">
                <img
                  src={study.shot.src}
                  width={study.shot.width}
                  height={study.shot.height}
                  alt={study.shot.alt}
                  loading="lazy"
                  decoding="async"
                  className="block h-auto w-full"
                />
              </div>
              <figcaption className="mt-3 flex flex-wrap items-center gap-x-2 font-mono text-[12px] text-faint">
                <span>{study.title}, running.</span>
                <a
                  href={study.shot.src}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline decoration-line underline-offset-4 transition-colors hover:text-dim"
                >
                  Open full size
                </a>
                              </figcaption>
            </figure>
          </Reveal>
        </section>
      )}

      {/* The problem */}
      <Section title="The problem" body={study.problem} />

      {/* What I built */}
      <Section title="What I built" body={study.build} />

      {/* Architecture */}
      <section className="shell py-12 md:py-16">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            How it's wired
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-dim">
            The pipeline, end to end. Every stage assumes the model can be wrong,
            so the interesting work is in the verify steps, not just generation.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8">
            <PipelineDiagram stages={study.pipeline} />
            <Legend />
          </div>
        </Reveal>
      </section>

      {/* How it works */}
      <section className="shell py-12 md:py-16">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            The judgment calls
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-px md:grid-cols-2">
          {study.howItWorks.map((item, i) => (
            <Reveal key={item.title} delay={(i % 2) * 0.06}>
              <div className="h-full border-t border-line py-7 md:pr-8">
                <h3 className="text-lg font-medium tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-dim">
                  {item.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Results */}
      <section className="shell py-12 md:py-16">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            What it changed
          </h2>
        </Reveal>
        <div className="mt-8 flex flex-col gap-5">
          {study.results.map((r, i) => (
            <Reveal key={r.label} delay={i * 0.05}>
              <div className="elev grid gap-2 rounded-[var(--radius-lg)] border border-line bg-surface/50 p-6 md:grid-cols-[180px_1fr] md:gap-8">
                <p className="font-mono text-[12px] uppercase tracking-wider text-accent-ink">
                  {r.label}
                </p>
                <p className="text-[15px] leading-relaxed text-dim">{r.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Tech */}
      <section className="shell py-12 md:py-16">
        <Reveal>
          <h2 className="mb-6 font-mono text-[12px] font-medium uppercase tracking-[0.18em] text-dim">
            Built with
          </h2>
          <ul className="flex flex-wrap gap-2">
            {study.tech.map((t) => (
              <li
                key={t}
                className="rounded-[6px] border border-line px-3.5 py-1.5 font-mono text-[13px] text-dim"
              >
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="shell border-t border-line py-20 md:py-28">
        <Reveal>
          <h2 className="max-w-2xl text-balance text-2xl font-semibold tracking-tight md:text-4xl">
            Want something like this built for your work?
          </h2>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <a
              href={`mailto:${EMAIL}?subject=Project%20enquiry`}
              className="btn-accent group inline-flex items-center gap-2.5 rounded-full py-2.5 pl-5 pr-2.5 text-sm font-semibold"
            >
              Get in touch
              <span className="cta-icon">
                <ArrowUpRight weight="bold" size={14} />
              </span>
            </a>
            <Link
              to="/#work"
              className="inline-flex items-center gap-1.5 text-sm text-dim transition-colors hover:text-ink"
            >
              See more work
              <ArrowRight size={15} weight="bold" />
            </Link>
          </div>
        </Reveal>
      </section>
    </article>
  );
}

function Section({ title, body }: { title: string; body: string[] }) {
  return (
    <section className="shell py-12 md:py-16">
      <div className="grid gap-6 md:grid-cols-[180px_1fr] md:gap-12">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight md:sticky md:top-28 md:text-2xl">
            {title}
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="max-w-2xl space-y-5 text-base leading-relaxed text-dim md:text-lg">
            {body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Legend() {
  const items = [
    { dot: "bg-ink", label: "model" },
    { dot: "bg-dim", label: "logic" },
    { dot: "bg-accent", label: "verify / output" },
  ];
  return (
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
      {items.map((it) => (
        <span
          key={it.label}
          className="inline-flex items-center gap-2 font-mono text-[11px] font-medium text-dim"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${it.dot}`} aria-hidden />
          {it.label}
        </span>
      ))}
    </div>
  );
}
