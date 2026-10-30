import { useEffect, useState, type ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import { getCaseStudy } from "../data/caseStudies";
import { guidesCiting } from "../data/guides";
import { EMAIL, NAME, projects } from "../data/projects";
import { headlineRole } from "../components/About";
import SystemFigure, { fitsCanvas } from "../components/SystemFigure";
import AllStudies from "../components/AllStudies";
import { techIcon } from "./techIcons";
import { Arrow, GitHubMark, GlobeMark } from "./icons";
import { isDeployment, isRepo } from "./links";

/**
 * A case study, laid out after parascodes.is-a.dev's project
 * pages: one narrow railed column, every row closed by a dashed rule that runs
 * the width of the window with a dot where it crosses each rail, a clock over
 * the top, the screenshot framed, the links as cells. Everything the live
 * page says is still here (the byline, the date, the figure, the questions
 * and sources), because the structured data and the markdown twin are built
 * from the same study and check-site compares them with this page.
 */
const studyOrder = projects.filter((p) => p.hasCaseStudy);

const published = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return "";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(now);
}

/** A full-width row: the dashed rule above it crosses the window, the content stays in the column. */
function Row({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="cs-row">
      <div className={`cs-cell ${className}`}>{children}</div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Row>
      <section>
        <h2 className="text-[1.625rem] leading-tight tracking-tight text-ink">{title}</h2>
        <div className="mt-4">{children}</div>
      </section>
    </Row>
  );
}


export default function EraCaseStudy() {
  const { slug } = useParams();
  const study = slug ? getCaseStudy(slug) : undefined;
  const time = useClock();

  if (!study) {
    return (
      <div className="cs">
        <Row className="cs-missing">
          <p className="text-sm text-dim">Case study not found</p>
          <h1 className="mt-2 text-[2rem] leading-tight text-ink">That case study isn't here.</h1>
          <Link to="/#work" className="mt-5 inline-flex items-center gap-1.5 text-sm text-ink underline underline-offset-4">
            Back to work
          </Link>
        </Row>
      </div>
    );
  }

  const live = study.links.some((l) => isDeployment(l.href));
  const status = study.inProgress ? "In progress" : live ? "Live" : "Code on GitHub";
  const i = studyOrder.findIndex((p) => p.slug === study.slug);
  const prev = studyOrder[(i - 1 + studyOrder.length) % studyOrder.length];
  const next = studyOrder[(i + 1) % studyOrder.length];

  const phoneFits = fitsCanvas(study.pipeline, 312, true);
  const intro =
    study.pipelineIntro ??
    "The pipeline, end to end. Every stage assumes the model can be wrong, so the interesting work is in the verify steps, not just generation.";

  const figure = (
    <figure className="m-0">
      <div className="cs-figure">
        {/* Drawn at its own size, never blown up to fill the column (at 400px
            a 312-unit figure put every label near 19px): a 400-unit canvas
            where there is 400px for it, the 312 one on a phone. */}
        <div className="mx-auto hidden max-w-[400px] sm:block">
          <SystemFigure stages={study.pipeline} layout="stacked" details canvas={400} />
        </div>
        {phoneFits ? (
          <div className="mx-auto max-w-[340px] sm:hidden">
            <SystemFigure stages={study.pipeline} layout="stacked" details />
          </div>
        ) : (
          // Words too long for a phone-width box: the full-size figure,
          // scrolling sideways, like the GitHub graph does on a phone.
          <div className="cs-figure-scroll sm:hidden">
            <div className="w-[400px]">
              <SystemFigure stages={study.pipeline} layout="stacked" details canvas={400} />
            </div>
          </div>
        )}
      </div>
      {/* The SVG is decorative to assistive tech; the same stages and steps
          are here as text, which is also what a crawler reads. */}
      <ol className="sr-only">
        {study.pipeline.map((st) => (
          <li key={st.title}>
            {st.title}: {st.nodes.map((n) => (n.detail ? `${n.label} (${n.detail})` : n.label)).join("; ")}
          </li>
        ))}
      </ol>
      <figcaption className="mt-3 text-[max(12px,0.8125rem)] text-dim">
        Fig. {study.shot ? 2 : 1}: {study.title}, end to end.
      </figcaption>
    </figure>
  );

  return (
    <article className="cs">
      {/* Over the top: dot paper and Bengaluru's time. */}
      <div className="cs-row cs-row-top">
        <div className="cs-cell cs-top">
          <span aria-hidden className="cs-clock">{time || " "}</span>
        </div>
      </div>

      {/* Header. The kicker is part of the <h1>: a heading of just "Maestro"
          carries none of the words anyone searches. */}
      <Row className="cs-head">
        <Link to="/#work" className="cs-back" aria-label="Back to all work">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </Link>
        <div className="min-w-0">
          <h1 className="flex flex-col">
            <span className="text-[2.25rem] leading-[1.05] tracking-tight text-ink">{study.title}</span>
            <span className="mt-1 font-sans text-[0.9375rem] font-medium leading-snug text-dim">
              <span className="sr-only">: </span>
              {study.searchKicker ?? study.kicker}
            </span>
          </h1>
          <nav aria-label="Breadcrumb" className="mt-2 text-[max(12px,0.8125rem)] text-dim">
            <Link to="/#work" className="hover:text-ink">Work</Link>
            <span aria-hidden> / </span>
            <span className="text-ink">{study.title}</span>
          </nav>
        </div>
      </Row>

      {/* The product, or with no screenshot, how it's built. Shown whole: each
          screenshot is already trimmed to the part that carries the argument.
          Not lazy: it is in the first screen. */}
      <Row>
        {study.shot ? (
          <figure className="m-0">
            <div className="cs-shot">
              <img
                src={study.shot.src}
                srcSet={study.shot.small ? `${study.shot.small} 640w, ${study.shot.src} ${study.shot.width}w` : undefined}
                sizes="(min-width: 760px) 680px, calc(100vw - 3rem)"
                width={study.shot.width}
                height={study.shot.height}
                alt={study.shot.alt}
                decoding="async"
              />
            </div>
            <figcaption className="mt-3 flex flex-wrap gap-x-2 text-[max(12px,0.8125rem)] text-dim">
              <span>{study.title}, running.</span>
              <a href={study.shot.src} target="_blank" rel="noreferrer noopener" className="underline underline-offset-4 hover:text-ink">
                Open full size
              </a>
            </figcaption>
          </figure>
        ) : (
          <>
            <h2 className="mb-4 text-[1.625rem] leading-tight tracking-tight text-ink">How it's wired</h2>
            <p className="mb-5 text-[0.9375rem] leading-relaxed text-dim">{intro}</p>
            {figure}
          </>
        )}
      </Row>

      {/* Links as cells, two to a row like the reference. */}
      {study.links.length > 0 && (
        <div className="cs-row">
          <ul className="cs-cell cs-links">
            {study.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noreferrer noopener">
                  {isRepo(l.href) ? <GitHubMark /> : <GlobeMark />}
                  {l.label}
                </a>
              </li>
            ))}
            {study.links.length % 2 === 1 && <li aria-hidden className="cs-links-empty" />}
          </ul>
        </div>
      )}

      {/* Overview */}
      <Row>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="font-display text-[1.75rem] leading-tight text-ink">{study.title}</p>
          <span className="flex items-center gap-2 text-sm text-dim">
            <span aria-hidden className={`cs-status ${study.inProgress ? "is-wip" : live ? "is-live" : ""}`} />
            {status}
          </span>
        </div>
        <p className="mt-3 text-[1.0625rem] leading-relaxed text-dim">{study.outcome}</p>
        {/* The byline and date the Article schema states, shown. */}
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[max(12px,0.8125rem)] text-dim">
          <span>Written by</span>
          <Link to="/#about" rel="author" className="font-semibold text-ink underline underline-offset-4">
            {NAME}
          </Link>
          <span aria-hidden>·</span>
          <span>{headlineRole} · Bengaluru, India</span>
          <span aria-hidden>·</span>
          <span>
            Published <time dateTime={study.published}>{published.format(new Date(study.published))}</time>
          </span>
        </p>
        {study.inProgress && <p className="cs-note">{study.inProgress}</p>}
      </Row>

      {/* Facts, as cells. */}
      <div className="cs-row">
        <dl className="cs-cell cs-facts">
          {study.meta.map((m) => (
            <div key={m.label}>
              <dt>{m.label}</dt>
              <dd>{m.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <Block title="The problem">
        <div className="cs-prose">{study.problem.map((p, k) => <p key={k}>{p}</p>)}</div>
      </Block>

      <Block title="What I built">
        <div className="cs-prose">{study.build.map((p, k) => <p key={k}>{p}</p>)}</div>
      </Block>

      {/* A study with a screenshot shows the product, not the diagram: the
          diagram is for work with nothing to show on screen. Its stages stay
          in the page as text for screen readers and crawlers. */}
      {study.shot && (
        <ol className="sr-only">
          {study.pipeline.map((st) => (
            <li key={st.title}>
              {st.title}: {st.nodes.map((n) => (n.detail ? `${n.label} (${n.detail})` : n.label)).join("; ")}
            </li>
          ))}
        </ol>
      )}

      <Block title="The judgment calls">
        <ul className="cs-list">
          {study.howItWorks.map((item) => (
            <li key={item.title}>
              <h3 className="font-sans text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-dim">{item.body}</p>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="What it changed">
        <ul className="cs-list">
          {study.results.map((r) => (
            <li key={r.label}>
              <p className="text-sm font-semibold text-ink">{r.label}</p>
              <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-dim">{r.body}</p>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Stack used">
        <ul className="cs-chips">
          {study.tech.map((t) => {
            const icon = techIcon(t);
            return (
              <li key={t}>
                {icon && <img src={icon.src} alt="" width={15} height={15} className={icon.mono ? "icon-mono" : undefined} />}
                {t}
              </li>
            );
          })}
        </ul>
      </Block>

      {study.questions?.length ? (
        <Block title="Questions this answers">
          <div className="cs-faq">
            {study.questions.map((q, k) => (
              <details key={q.q} open={k === 0}>
                <summary>
                  <span>{q.q}</span>
                  <span aria-hidden className="cs-plus" />
                </summary>
                <p>{q.a}</p>
              </details>
            ))}
          </div>
        </Block>
      ) : null}

      {study.sources?.length ? (
        <Block title="Sources">
          <ol className="cs-sources">
            {study.sources.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noreferrer noopener">{s.label}</a>
              </li>
            ))}
          </ol>
        </Block>
      ) : null}

      {guidesCiting(study.slug).length > 0 && (
        <Block title="Guides that draw on this project">
          <ul className="cs-list">
            {guidesCiting(study.slug).map((g) => (
              <li key={g.slug}>
                <Link to={`/guides/${g.slug}`} className="font-semibold text-ink underline underline-offset-4">
                  {g.title}
                </Link>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-dim">{g.metaDescription}</p>
              </li>
            ))}
          </ul>
        </Block>
      )}

      <Row>
        <h2 className="text-[1.625rem] leading-tight tracking-tight text-ink">Want something like this built?</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={`mailto:${EMAIL}?subject=Project%20enquiry`} className="cs-btn cs-btn-dark">
            Get in touch <Arrow />
          </a>
          <Link to="/#work" className="cs-btn">See more work</Link>
        </div>
      </Row>

      {/* Neighbours as cells, then every study: each one a hop from any other. */}
      {studyOrder.length > 1 && (
        <div className="cs-row">
          <nav aria-label="More case studies" className="cs-cell cs-nav">
            <Link to={`/work/${prev.slug}`}>
              <span className="text-[max(12px,0.8125rem)] text-dim">Previous</span>
              <span className="mt-0.5 block font-display text-xl text-ink">{prev.title}</span>
              <span className="block text-sm text-dim">{prev.kicker}</span>
            </Link>
            <Link to={`/work/${next.slug}`} className="text-right">
              <span className="text-[max(12px,0.8125rem)] text-dim">Next</span>
              <span className="mt-0.5 block font-display text-xl text-ink">{next.title}</span>
              <span className="block text-sm text-dim">{next.kicker}</span>
            </Link>
          </nav>
        </div>
      )}
      <Row>
        <AllStudies current={study.slug} className="" />
      </Row>
      <div className="cs-row cs-row-end" aria-hidden>
        <div className="cs-cell" />
      </div>
    </article>
  );
}
