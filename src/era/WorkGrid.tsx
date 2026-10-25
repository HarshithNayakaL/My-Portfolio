import { useRef, type PointerEvent as RPointerEvent } from "react";
import { Link } from "react-router-dom";
import type { Project } from "../data/projects";
import { getCaseStudy } from "../data/caseStudies";
import SystemFigure from "../components/SystemFigure";
import { GitHubMark, GlobeMark } from "./icons";

/**
 * The project grid, after harshitr.me's: each card opens on a framed preview
 * with the product peeking in from the corner, and on hover the card lifts,
 * the preview slides further in, a digicam's viewfinder appears over it, and
 * a label follows the cursor. A project with no screenshot peeks its system
 * figure instead, so the frame still shows how it is built.
 */
const isRepo = (href: string) => href.includes("github.com");
const yearOf = (iso?: string) => (iso ? new Date(iso).getUTCFullYear() : null);

export default function WorkGrid({ items, collapsed }: { items: Project[]; collapsed: boolean }) {
  const tip = useRef<HTMLSpanElement>(null);
  // One label for the whole grid, moved by the pointer: cheaper than one per
  // card, and it never has to be re-measured.
  const move = (e: RPointerEvent) => {
    if (e.pointerType !== "mouse" || !tip.current) return;
    tip.current.style.transform = `translate3d(${e.clientX + 16}px, ${e.clientY + 18}px, 0)`;
  };
  const show = (on: boolean) => tip.current?.classList.toggle("is-on", on);

  return (
    <>
      <div className={`wk-grid ${collapsed ? "is-collapsed" : ""}`} onPointerMove={move}>
        {items.map((p) => {
          const cs = getCaseStudy(p.slug);
          const shot = cs?.shot;
          const live = p.links.some((l) => !isRepo(l.href));
          const year = yearOf(cs?.published);
          return (
            <article
              key={p.slug}
              className="wk-card"
              onPointerEnter={(e) => e.pointerType === "mouse" && show(true)}
              onPointerLeave={() => show(false)}
            >
              <div className="wk-frame">
                <span className="wk-badge">
                  <span aria-hidden className={`era-mark ${live ? "" : "is-faint"}`} />
                  {p.status === "in-progress" ? "In progress" : live ? "Live" : "Open source"}
                </span>
                {/* The viewfinder: focus corners, recording, battery. Shapes,
                    not lettering, apart from one word. */}
                <span aria-hidden className="wk-finder">
                  <i className="tl" /><i className="tr" /><i className="bl" /><i className="br" />
                  <span className="wk-rec"><span className="era-mark is-rec" />Rec</span>
                  <span className="wk-batt" />
                </span>
                {shot ? (
                  <span className="wk-peek wk-peek-shot">
                    <img src={shot.small ?? shot.src} alt={shot.alt} width={640} height={400} loading="lazy" decoding="async" />
                  </span>
                ) : cs ? (
                  <span aria-hidden className="wk-peek wk-peek-fig">
                    <SystemFigure stages={cs.pipeline} layout="stacked" />
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex items-baseline justify-between gap-3">
                <h3 className="font-sans text-[1.0625rem] font-semibold text-ink">
                  <Link to={`/work/${p.slug}`} className="wk-link">{p.title}</Link>
                </h3>
                {year && <span className="shrink-0 text-sm text-dim">{year}</span>}
              </div>
              <p className="mt-0.5 text-[max(12px,0.8125rem)] text-dim">{p.kicker}</p>
              <p className="wk-outcome">{p.outcome}</p>

              <div className="wk-foot">
                <ul className="wk-tags">
                  {p.tags.map((t) => <li key={t}>{t}</li>)}
                </ul>
                {/* These go elsewhere, so the case-study label steps aside over them. */}
                <span className="wk-links" onPointerEnter={() => show(false)} onPointerLeave={(e) => e.pointerType === "mouse" && show(true)}>
                  {p.links.map((l) => (
                    <a key={l.href} href={l.href} target="_blank" rel="noreferrer noopener" aria-label={`${p.title}: ${l.label}`}>
                      {isRepo(l.href) ? <GitHubMark /> : <GlobeMark />}
                    </a>
                  ))}
                </span>
              </div>
            </article>
          );
        })}
      </div>
      <span ref={tip} aria-hidden className="wk-tip">View case study</span>
    </>
  );
}
