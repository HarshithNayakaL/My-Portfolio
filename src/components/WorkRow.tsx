import { Link } from "react-router-dom";
import type { Project } from "../data/projects";
import Icon from "./Icon";

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
        className="work-panel"
      />
      {/* Left accent marker, growing from its middle on hover.

          It used to be a full-height bar pinned to the article's left edge,
          which put it 14px inside the panel above and left it overhanging the
          panel by 4px at each end — so it crossed the panel's 22px rounded
          corners and read as a stray line rather than an edge lighting up.
          It now sits exactly on the panel's left edge and stops well short of
          the corners, so the curve is never in its way. */}
      <span
        aria-hidden
        className="work-marker"
      />

      <div className="work-body">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-dim">
              {kicker}
            </span>
            {inProgress && (
              <span className="inline-flex items-center gap-2 text-[0.75rem] font-semibold text-accent-ink">
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
          <h3 className="work-title">
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
                className="work-tag"
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
                className="work-link"
              >
                {l.label}
                <Icon name="arrow-up-right" />
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
                <Icon
                  name="arrow-right"
                  className="work-cta-arrow"
                />
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
