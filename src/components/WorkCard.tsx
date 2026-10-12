import { Link } from "react-router-dom";
import type { Project } from "../data/projects";
import { getCaseStudy } from "../data/caseStudies";
import SystemFigure from "./SystemFigure";
import Icon from "./Icon";

/**
 * Work card. The frame shows the real product when there is a screenshot and
 * the case study's own system figure when there is not, so a project without
 * a UI (an MCP server, an n8n pipeline) still shows how it is built rather
 * than an empty box or a stock image.
 */
export default function WorkCard({ project, size = "lg" }: { project: Project; size?: "lg" | "sm" }) {
  const { title, kicker, outcome, tags, links, hasCaseStudy, status, slug } = project;
  const cs = getCaseStudy(slug);
  const shot = cs?.shot;
  const big = size === "lg";
  const inProgress = status === "in-progress";

  return (
    <article className="wcard group">
      {/* A row of cards shares one frame height through subgrid (see .wcard),
          so the figure frame can simply grow to fit its figure and never has
          to shrink it to fit a fixed box: a scaled-down figure is what made
          the labels unreadable. Screenshot frames have a floor and fill the
          row's height; the image is absolutely placed so it never sets it. */}
      <div className={`wfig ${shot ? (big ? "min-h-[400px]" : "min-h-[300px]") : ""}`}>
        {shot ? (
          <img
            src={shot.src}
            srcSet={shot.small ? `${shot.small} 640w, ${shot.src} ${shot.width}w` : undefined}
            // The frame shows the image at 86% of the card's width.
            sizes={big ? "(min-width: 1280px) 520px, (min-width: 768px) 40vw, 86vw" : "(min-width: 1280px) 340px, (min-width: 768px) 40vw, 86vw"}
            alt=""
            width={shot.width}
            height={shot.height}
            loading="lazy"
            decoding="async"
          />
        ) : cs ? (
          <div className="mx-auto w-full max-w-[280px] px-1 pb-6 pt-11 md:max-w-[320px]">
            <SystemFigure stages={cs.pipeline} layout="stacked" />
          </div>
        ) : null}
        <span className="wfig-tag" aria-hidden>{shot ? "Screenshot" : "System figure"}</span>
      </div>

      <div className={`flex flex-1 flex-col ${big ? "p-7" : "p-6"}`}>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[max(12px,0.8125rem)] font-medium text-dim">{kicker}</p>
          {inProgress && (
            <span className="inline-flex items-center gap-2 text-[max(12px,0.75rem)] font-semibold text-accent-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              In progress
            </span>
          )}
        </div>

        {/* The title is the card's real link; a stretched pseudo-element makes
            the whole card clickable without a second, nameless link. */}
        <h3 className={`mt-2 leading-[1.05] text-ink transition-colors group-hover:text-accent-ink ${big ? "text-[2.4rem]" : "text-[1.9rem]"}`}>
          {hasCaseStudy ? (
            <Link to={`/work/${slug}`} className="after:absolute after:inset-0 after:content-['']">
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>

        <p className={`mt-3 text-pretty leading-relaxed text-dim ${big ? "" : "line-clamp-3 text-[0.9375rem]"}`}>
          {outcome}
        </p>

        <ul className="mt-5 flex flex-wrap gap-1.5">
          {tags.slice(0, big ? 5 : 3).map((t) => (
            <li key={t} className="wchip">{t}</li>
          ))}
        </ul>

        <div className="relative z-10 mt-auto flex flex-wrap items-center gap-5 pt-6">
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
            // Decorative: the title above is the link.
            <span aria-hidden className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
              {inProgress ? "Preview" : "Case study"}
              <Icon name="arrow-right" className="transition-transform duration-500 group-hover:translate-x-1" />
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
