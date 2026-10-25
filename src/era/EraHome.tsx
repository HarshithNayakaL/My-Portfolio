import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import "./era.css";
import { EMAIL, GITHUB, LINKEDIN, NAME, projects } from "../data/projects";
import { getCaseStudy } from "../data/caseStudies";
import { agentSkills } from "../data/skills";
import { faqs } from "../components/Faq";
import { experience, headlineRole, identitySentence, paper, stack } from "../components/About";
import SystemFigure from "../components/SystemFigure";
import GitHubActivity from "../components/GitHubActivity";
import StartBanner from "./StartBanner";
import Turntable from "./Turntable";
import CarPet from "./CarPet";
import RoamingCars from "./RoamingCars";
import MarginObjects from "./MarginObjects";
import Garage from "./Garage";
import { Arrow, GitHubMark, GlobeMark, LinkedInMark, MailMark } from "./icons";

/**
 * The era homepage. One dashed frame holds the page (palakonweb.in), on grid
 * paper (upriyanshu.tech), with the photo taped down as a polaroid and the
 * margins set with objects of the time (garvitsingla.in). The cars are the
 * part that is mine: the F2004 follows the cursor, the others cross the page
 * on their own, and all of them are parked in a row at the bottom.
 */
/**
 * The case studies in data order, nudged so each row of two is a matched
 * pair: two screenshots, or two system figures. A figure is several times
 * taller than a screenshot, and a row that mixed them left the screenshot
 * card mostly empty space. A card waits for the next one of its kind, so
 * nothing moves more than a row or two from its place.
 */
const studies = (() => {
  const all = projects.filter((p) => p.hasCaseStudy);
  const out: typeof all = [];
  const waiting: Record<"shot" | "figure", (typeof all)[number] | null> = { shot: null, figure: null };
  for (const p of all) {
    const k = getCaseStudy(p.slug)?.shot ? "shot" : "figure";
    const held = waiting[k];
    if (held) {
      out.push(held, p);
      waiting[k] = null;
    } else waiting[k] = p;
  }
  for (const p of [waiting.shot, waiting.figure]) if (p) out.push(p);
  return out;
})();
const FIRST = 6;
const FIRST_FAQ = 6;

function useBengaluruTime() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);
  if (!now) return "";
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(now);
}

function Section({ id, title, aside, children }: { id: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-h`} id={id} className="era-section">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={`${id}-h`} className="text-[1.875rem] leading-tight tracking-tight text-ink">{title}</h2>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

const socials = [
  { label: "GitHub", href: GITHUB, icon: <GitHubMark /> },
  { label: "LinkedIn", href: LINKEDIN, icon: <LinkedInMark /> },
  { label: "Email", href: `mailto:${EMAIL}`, icon: <MailMark /> },
];

// Logos the site already ships in /icons; `mono` ones are black and get
// inverted in dark mode.
const stackIcon: Record<string, { src: string; mono?: boolean }> = {
  Python: { src: "/icons/python.svg" },
  TypeScript: { src: "/icons/typescript.svg" },
  React: { src: "/icons/react.svg" },
  "Node.js": { src: "/icons/nodedotjs.svg" },
  n8n: { src: "/icons/n8n.svg" },
  "Google Gemini": { src: "/icons/googlegemini.svg" },
  OpenAI: { src: "/icons/openai.svg", mono: true },
  "PostgreSQL with pgvector": { src: "/icons/postgresql.svg" },
  "the Model Context Protocol": { src: "/icons/mcp.svg", mono: true },
};
const stackName = (l: string) => (l === "the Model Context Protocol" ? "Model Context Protocol" : l);

/** What the little browser bar over a screenshot says: the live host, or the repo path. */
const addressOf = (links: { href: string }[]) => {
  const live = links.find((l) => !l.href.includes("github.com")) ?? links[0];
  if (!live) return "";
  const u = new URL(live.href);
  return (u.host + u.pathname).replace(/\/$/, "");
};

export default function EraHome() {
  const time = useBengaluruTime();
  const [allWork, setAllWork] = useState(false);
  const [allFaq, setAllFaq] = useState(false);

  return (
    <div className="era">
      <RoamingCars />
      <CarPet />
      <MarginObjects />

      <div className="era-frame">
        <StartBanner />

        {/* Hero */}
        <section aria-labelledby="era-name" className="era-hero">
          <figure className="era-polaroid">
            <span aria-hidden className="era-tape" />
            <img src="/profile.jpg" alt={NAME} width={180} height={180} />
            <figcaption>harshith</figcaption>
          </figure>
          <div className="era-hero-name min-w-0">
            <h1 id="era-name" className="text-[2.75rem] leading-[1.02] tracking-tight text-ink md:text-[3.25rem]">
              {NAME}
            </h1>
            <p className="mt-2 text-lg text-ink">{headlineRole}</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-dim">
              <span aria-hidden className="era-live" />
              Bengaluru, India{time ? ` · ${time}` : ""}
            </p>
          </div>
          <ul className="era-hero-links flex flex-wrap gap-2">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} className="era-pill" {...(s.href.startsWith("http") ? { target: "_blank", rel: "noreferrer noopener" } : {})}>
                  {s.icon}
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <Section id="about" title="About">
          <div className="space-y-4 text-[1.0625rem] leading-relaxed text-dim">
            <p className="text-ink">{identitySentence}</p>
            <p>
              At DemandNXT, AI work across the company's six B2B brands runs through me, from the agents and
              pipelines to how they ship. What I care about is the unglamorous part: an AI system that behaves the
              same on the hundredth run as on the first.
            </p>
            <p>
              Born in 2004, raised on the cars of the years right after: Schumacher's F2004, Alonso's Renault,
              Kimi and Hamilton at McLaren, Rossi on the Yamaha, and a Martini Lancia Delta in a Java game on a
              Nokia. A petrolhead who doesn't drive.
            </p>
          </div>
          <Turntable />
        </Section>

        <Section id="work" title="Work" aside={<p className="text-sm text-dim">{studies.length} case studies</p>}>
          <div className={`era-work ${allWork ? "" : "is-collapsed"}`}>
            {studies.map((p) => {
              const cs = getCaseStudy(p.slug);
              const shot = cs?.shot;
              return (
                <article key={p.slug} className="era-card">
                  {shot ? (
                    <div className="era-browser">
                      <div aria-hidden className="era-browser-bar">
                        <span className="era-browser-dots"><i /><i /><i /></span>
                        <span className="truncate">{addressOf(p.links)}</span>
                      </div>
                      <img src={shot.small ?? shot.src} alt={shot.alt} width={640} height={400} loading="lazy" decoding="async" />
                    </div>
                  ) : cs ? (
                    <div className="era-card-figure">
                      <SystemFigure stages={cs.pipeline} layout="stacked" />
                    </div>
                  ) : null}
                  <div className="era-card-body">
                    <p className="text-[max(12px,0.8125rem)] text-dim">{p.kicker}</p>
                    <h3 className="mt-1 font-sans text-lg font-semibold text-ink">
                      <Link to={`/work/${p.slug}`} className="era-card-link">{p.title}</Link>
                    </h3>
                    <p className="era-card-outcome">{p.outcome}</p>
                    <ul className="era-tags">
                      {p.tags.map((t) => <li key={t}>{t}</li>)}
                    </ul>
                    <div className="era-card-foot">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-ink">Case study <Arrow /></span>
                      <span className="era-card-links">
                        {p.links.map((l) => (
                          <a key={l.href} href={l.href} target="_blank" rel="noreferrer noopener" aria-label={`${p.title}: ${l.label}`}>
                            {l.href.includes("github.com") ? <GitHubMark /> : <GlobeMark />}
                          </a>
                        ))}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {studies.length > FIRST && (
            <div className="mt-6 flex justify-center">
              <button type="button" className="era-pill" aria-expanded={allWork} onClick={() => setAllWork((v) => !v)}>
                {allWork ? "Show fewer" : `Show all ${studies.length}`}
              </button>
            </div>
          )}
        </Section>

        <Section id="experience" title="Experience">
          <ol className="era-box era-rows">
            {experience.map((e) => (
              <li key={e.title}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-sans text-base font-semibold text-ink">{e.title}</h3>
                  <span className="text-sm text-dim">{e.when}</span>
                </div>
                <p className="text-sm text-dim">{e.org}</p>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-dim">{e.note}</p>
              </li>
            ))}
            <li>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="font-sans text-base font-semibold text-ink">Published research</h3>
                <span className="text-sm text-dim">{paper.issue}</span>
              </div>
              <p className="text-sm text-dim">IJRTMR</p>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-dim">
                Co-author of{" "}
                <a href={paper.url} target="_blank" rel="noreferrer noopener" className="era-inline-link">
                  “{paper.title}”
                </a>
                , the local-inference approach behind the AI Notes project. DOI {paper.doi}.
              </p>
            </li>
          </ol>
        </Section>

        {/* The id is the nav's "Capabilities" target. */}
        <Section id="capabilities" title="Stack">
          <ul className="era-chips">
            {stack.map((s) => {
              const icon = stackIcon[s.label];
              return (
                <li key={s.label}>
                  {icon && <img src={icon.src} alt="" width={16} height={16} className={icon.mono ? "icon-mono" : undefined} />}
                  {stackName(s.label)}
                </li>
              );
            })}
          </ul>
        </Section>

        <Section id="skills" title="Agent skills">
          <ul className="era-box era-rows">
            {agentSkills.map((s) => (
              <li key={s.name}>
                <h3 className="font-sans text-base font-semibold text-ink">
                  {s.repo ? (
                    <a href={s.repo} target="_blank" rel="noreferrer noopener" className="era-inline-link">{s.name}</a>
                  ) : (
                    s.name
                  )}
                </h3>
                <p className="mt-1 text-[0.9375rem] leading-relaxed text-dim">{s.tagline}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="github" title="GitHub activity">
          <div className="era-box era-gh">
            <GitHubActivity />
          </div>
        </Section>

        {/* Visible text for the FAQPage schema. */}
        <Section id="faq" title="Questions">
          <div className={`era-box era-faq ${allFaq ? "" : "is-collapsed"}`}>
            {faqs.map((f, i) => (
              <details key={f.q} open={i === 0}>
                <summary>
                  <span>{f.q}</span>
                  <span aria-hidden className="era-faq-plus" />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          {faqs.length > FIRST_FAQ && (
            <div className="mt-6 flex justify-center">
              <button type="button" className="era-pill" aria-expanded={allFaq} onClick={() => setAllFaq((v) => !v)}>
                {allFaq ? "Show fewer" : `Show all ${faqs.length} questions`}
              </button>
            </div>
          )}
        </Section>
      </div>

      {/* The close, outside the frame. */}
      <section aria-labelledby="contact-h" id="contact" className="era-close">
        <figure className="m-0">
          <blockquote className="font-display text-[1.75rem] leading-snug text-ink md:text-[2rem]">
            “Once something is a passion, the motivation is there.”
          </blockquote>
          <figcaption className="mt-2 text-sm text-dim">Michael Schumacher</figcaption>
        </figure>
        <h2 id="contact-h" className="mt-12 text-[2rem] leading-tight text-ink">Have something in mind?</h2>
        <p className="mt-2 text-base text-dim">Tell me what you're building and where it's stuck.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/contact" className="era-pill era-pill-dark">
            Get in touch <Arrow />
          </Link>
          <a href={`mailto:${EMAIL}`} className="era-pill">
            <MailMark />
            {EMAIL}
          </a>
        </div>
      </section>

      <Garage />
    </div>
  );
}
