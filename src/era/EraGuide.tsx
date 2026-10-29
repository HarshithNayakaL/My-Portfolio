import type { ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import { getGuide, guides } from "../data/guides";
import { caseStudies } from "../data/caseStudies";
import { EMAIL, NAME } from "../data/projects";
import { headlineRole } from "../components/About";
import { Arrow } from "./icons";

/**
 * A guide, in the case study's frame (case.css): the railed column, every
 * row closed by a full-width dashed rule. The opening answer comes first
 * because it is the passage an answer engine lifts; each section then names
 * the case studies it was taken from, as links, so every claim on the page
 * is one click from the project that shows it.
 */
const published = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const anchor = (h: string) =>
  h
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function Row({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="cs-row">
      <div className={`cs-cell ${className}`}>{children}</div>
    </div>
  );
}

export default function EraGuide() {
  const { slug } = useParams();
  const guide = slug ? getGuide(slug) : undefined;

  if (!guide) {
    return (
      <div className="cs">
        <Row>
          <p className="text-sm text-dim">Guide not found</p>
          <h1 className="mt-2 text-[2rem] leading-tight text-ink">That guide isn't here.</h1>
          <Link to="/#guides" className="mt-5 inline-flex items-center gap-1.5 text-sm text-ink underline underline-offset-4">
            All guides
          </Link>
        </Row>
      </div>
    );
  }

  const others = guides.filter((g) => g.slug !== guide.slug);

  return (
    <article className="cs">
      <div className="cs-row cs-row-top">
        <div className="cs-cell cs-top" />
      </div>

      <Row className="cs-head">
        <Link to="/#guides" className="cs-back" aria-label="Back to all guides">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </Link>
        <div className="min-w-0">
          <h1 className="flex flex-col">
            <span className="text-[2.25rem] leading-[1.05] tracking-tight text-ink">{guide.title}</span>
            <span className="mt-1 font-sans text-[0.9375rem] font-medium leading-snug text-dim">
              <span className="sr-only">: </span>
              {guide.kicker}
            </span>
          </h1>
          <nav aria-label="Breadcrumb" className="mt-2 text-[max(12px,0.8125rem)] text-dim">
            <Link to="/#guides" className="hover:text-ink">Guides</Link>
            <span aria-hidden> / </span>
            <span className="text-ink">{guide.title}</span>
          </nav>
        </div>
      </Row>

      <Row>
        <p className="text-[1.0625rem] leading-relaxed text-ink">{guide.summary}</p>
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[max(12px,0.8125rem)] text-dim">
          <span>Written by</span>
          <Link to="/#about" rel="author" className="font-semibold text-ink underline underline-offset-4">
            {NAME}
          </Link>
          <span aria-hidden>·</span>
          <span>{headlineRole} · Bengaluru, India</span>
          <span aria-hidden>·</span>
          <span>
            Published <time dateTime={guide.published}>{published.format(new Date(guide.published))}</time>
          </span>
        </p>
      </Row>

      <Row>
        <nav aria-labelledby="guide-contents">
          <h2 id="guide-contents" className="font-sans text-sm font-semibold text-ink">In this guide</h2>
          <ol className="cs-toc">
            {guide.sections.map((s) => (
              <li key={s.h}>
                <a href={`#${anchor(s.h)}`}>{s.h}</a>
              </li>
            ))}
          </ol>
        </nav>
      </Row>

      {guide.sections.map((s) => (
        <Row key={s.h}>
          <section aria-labelledby={anchor(s.h)}>
            <h2 id={anchor(s.h)} className="cs-anchor text-[1.625rem] leading-tight tracking-tight text-ink">
              {s.h}
            </h2>
            <div className="cs-prose mt-4">{s.p.map((p, k) => <p key={k}>{p}</p>)}</div>
            {s.from.length > 0 && (
              <p className="mt-4 text-[max(12px,0.8125rem)] text-dim">
                From the case {s.from.length > 1 ? "studies" : "study"}:{" "}
                {s.from.map((slug, k) => (
                  <span key={slug}>
                    {k > 0 && ", "}
                    <Link to={`/work/${slug}`} className="font-medium text-ink underline underline-offset-4">
                      {caseStudies[slug]?.title ?? slug}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </section>
        </Row>
      ))}

      <Row>
        <section>
          <h2 className="text-[1.625rem] leading-tight tracking-tight text-ink">Questions this answers</h2>
          <div className="cs-faq mt-4">
            {guide.questions.map((q, k) => (
              <details key={q.q} open={k === 0}>
                <summary>
                  <span>{q.q}</span>
                  <span aria-hidden className="cs-plus" />
                </summary>
                <p>{q.a}</p>
              </details>
            ))}
          </div>
        </section>
      </Row>

      <Row>
        <h2 className="text-[1.625rem] leading-tight tracking-tight text-ink">Want something like this built?</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={`mailto:${EMAIL}?subject=Project%20enquiry`} className="cs-btn cs-btn-dark">
            Get in touch <Arrow />
          </a>
          <Link to="/#work" className="cs-btn">See the work</Link>
        </div>
      </Row>

      <div className="cs-row">
        <nav aria-label="More guides" className="cs-cell cs-nav">
          {others.map((g, k) => (
            <Link key={g.slug} to={`/guides/${g.slug}`} className={k === 1 ? "text-right" : undefined}>
              <span className="text-[max(12px,0.8125rem)] text-dim">Another guide</span>
              <span className="mt-0.5 block font-display text-xl text-ink">{g.title}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="cs-row cs-row-end" aria-hidden>
        <div className="cs-cell" />
      </div>
    </article>
  );
}
