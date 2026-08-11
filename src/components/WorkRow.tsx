import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import type { Project } from "../data/projects";

/**
 * Editorial work row. Each project reads as a full-width index entry — title,
 * outcome, tags — rather than a boxed card. A left accent bar grows on hover
 * and the whole row is a tap target into the case study (touch + mouse).
 */
export default function WorkRow({ project }: { project: Project }) {
  const { title, kicker, outcome, tags, links, hasCaseStudy, status, slug } = project;
  const inProgress = status === "in-progress";

  return (
    <article className="group relative border-t border-line">
      {/* soft glass panel fades in behind the row on hover/focus */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[-0.85rem] inset-y-1 rounded-[var(--radius-lg)] border border-transparent bg-elevated/0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:border-line group-hover:bg-elevated/45 group-focus-within:border-line group-focus-within:bg-elevated/45"
      />
      {/* left accent bar grows on hover/active */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[2px] origin-top scale-y-0 bg-accent transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-y-100 group-focus-within:scale-y-100"
      />

      <div className="pointer-events-none relative grid gap-6 py-9 pl-5 transition-[padding] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:pl-7 md:grid-cols-[1fr_auto] md:items-end md:gap-12 md:py-11">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-dim">
              {kicker}
            </span>
            {inProgress && (
              <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-accent-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                In progress
              </span>
            )}
          </div>

          {/* The title is the row's real link. It used to be plain text with a
              transparent full-bleed <Link tabIndex={-1}> stacked over the row,
              which meant the case study was unreachable by keyboard and had no
              accessible name beyond an aria-label — and left the visible
              "Case study →" affordance non-actionable. A stretched pseudo
              element keeps the whole row clickable without the ghost overlay. */}
          <h3 className="mt-3 font-display text-[1.7rem] font-semibold leading-[1.1] tracking-tight text-ink transition-colors duration-300 group-hover:text-accent-ink md:text-4xl">
            {hasCaseStudy ? (
              <Link
                to={`/work/${slug}`}
                className="pointer-events-auto after:absolute after:inset-0 after:z-0 after:content-['']"
              >
                {title}
              </Link>
            ) : (
              title
            )}
          </h3>

          <p className="mt-3 max-w-xl text-pretty leading-relaxed text-dim md:text-lg xl:max-w-3xl">
            {outcome}
          </p>

          <ul className="mt-5 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <li
                key={t}
                className="rounded-[6px] border border-line px-2.5 py-0.5 font-mono text-[11px] font-medium text-dim"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* right rail: actions */}
        <div className="flex items-center justify-end gap-6 md:justify-end">
          <div className="pointer-events-auto relative z-10 flex items-center gap-5">
            {links.map((l) => (
              <a
                key={l.href + l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`${l.label} — ${title}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-dim transition-colors hover:text-ink"
              >
                {l.label}
                <ArrowUpRight size={14} weight="bold" />
              </a>
            ))}
            {hasCaseStudy && (
              // Decorative: the title above is the actual link, so announcing
              // this again would give screen readers a second, nameless one.
              <span
                aria-hidden
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ink"
              >
                {inProgress ? "Preview" : "Case study"}
                <ArrowRight
                  weight="bold"
                  size={15}
                  className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1"
                />
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
