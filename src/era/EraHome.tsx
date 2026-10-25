import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import "./era.css";
import { EMAIL, GITHUB, LINKEDIN, NAME, projects } from "../data/projects";
import { getCaseStudy } from "../data/caseStudies";
import { agentSkills } from "../data/skills";
import { faqs } from "../components/Faq";
import { experience, headlineRole, identitySentence, paper, stack } from "../components/About";
import GitHubActivity from "../components/GitHubActivity";
import StartBanner from "./StartBanner";
import Turntable from "./Turntable";
import CarPet from "./CarPet";
import HangingCamera from "./HangingCamera";
import RossiStrip from "./RossiStrip";
import { cars } from "./cars";

/**
 * The era homepage. The layout follows harshitr.me: one railed column, every
 * section opened by a full-width hatched band, a playable banner on top. The
 * grid paper and the record card come from upriyanshu.tech, and the F2004 that
 * chases the cursor stands in for its puppy.
 */
const studies = projects.filter((p) => p.hasCaseStudy);
const FIRST = 6;
// A project with no screenshot gets a car parked in its frame instead. The
// F2004 is left out: it is already the banner and the cursor pet.
const covers = cars.filter((c) => c.id !== "f2004");

function useClock(timeZone?: string) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return "";
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", second: "2-digit", timeZone }).format(now);
}

function Band({ id, title, aside }: { id: string; title: string; aside?: ReactNode }) {
  return (
    <div className="era-band">
      <div className="era-band-cell">
        <h2 id={id} className="text-[1.75rem] leading-none tracking-tight text-ink md:text-[2rem]">{title}</h2>
        {aside}
      </div>
    </div>
  );
}

const svg = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const GitHubMark = () => (
  <svg {...svg} fill="currentColor" stroke="none"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.84c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" /></svg>
);
const LinkedInMark = () => (
  <svg {...svg} fill="currentColor" stroke="none"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" /></svg>
);
const MailMark = () => (<svg {...svg}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>);
const PageMark = () => (<svg {...svg}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>);
const GlobeMark = () => (<svg {...svg}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>);
const PinMark = () => (<svg {...svg} width={14} height={14}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);
const Arrow = () => (<svg {...svg} width={14} height={14}><path d="M7 17 17 7M8 7h9v9" /></svg>);

const contact = [
  { label: "GitHub", href: GITHUB, icon: <GitHubMark />, ext: true },
  { label: "LinkedIn", href: LINKEDIN, icon: <LinkedInMark />, ext: true },
  { label: "Email", href: `mailto:${EMAIL}`, icon: <MailMark />, ext: false },
  { label: "Contact page", href: "/contact", icon: <PageMark />, ext: false },
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

export default function EraHome() {
  const mine = useClock("Asia/Kolkata");
  const yours = useClock();
  const [allWork, setAllWork] = useState(false);
  const [allFaq, setAllFaq] = useState(false);

  return (
    <div className="era">
      <CarPet />
      <HangingCamera />
      <span aria-hidden className="era-sticker">
        <img src="/era/car-delta-integrale.png" alt="" width={180} height={Math.round(180 / (640 / 243))} />
      </span>

      {/* Banner */}
      <div className="era-col">
        <div className="pt-24 md:pt-28">
          <StartBanner />
        </div>
      </div>

      {/* Profile */}
      <div className="era-col">
        <section aria-labelledby="era-name" className="era-profile">
          <span className="era-avatar">
            <img src="/profile.jpg" alt={NAME} width={96} height={96} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 id="era-name" className="text-[2.375rem] leading-none tracking-tight text-ink md:text-[2.75rem]">
              {NAME}
            </h1>
            <p className="mt-2 text-base text-ink">{headlineRole}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-dim">
              <PinMark /> Bengaluru, India
            </p>
          </div>
          <dl className="era-clocks">
            <div><dt>Your time</dt><dd>{yours || " "}</dd></div>
            <div><dt>My time</dt><dd>{mine || " "}</dd></div>
          </dl>
        </section>
      </div>

      {/* About */}
      <Band id="about" title="About" />
      <div className="era-col">
        <div className="era-body">
          <ul className="era-bullets">
            <li>{identitySentence}</li>
            <li>
              At DemandNXT, AI work across the company's six B2B brands runs through me, from the agents and
              pipelines to how they ship. What I care about is the unglamorous part: an AI system that behaves the
              same on the hundredth run as on the first.
            </li>
            <li>
              Born in 2004, raised on the cars of the years right after: Schumacher's F2004, Alonso's Renault,
              Kimi and Hamilton at McLaren, Rossi on the Yamaha, and a Martini Lancia Delta in a Java game on a
              Nokia. A petrolhead who doesn't drive.
            </li>
          </ul>
          <Turntable />
        </div>
      </div>

      {/* Contact */}
      <Band id="contact" title="Contact" />
      <div className="era-col era-col-flush">
        <ul className="era-contact">
          {contact.map((c) => (
            <li key={c.label}>
              {c.ext ? (
                <a href={c.href} target="_blank" rel="noreferrer noopener">
                  <span className="era-contact-icon">{c.icon}</span>
                  {c.label}
                  <Arrow />
                </a>
              ) : c.href.startsWith("/") ? (
                <Link to={c.href}>
                  <span className="era-contact-icon">{c.icon}</span>
                  {c.label}
                  <Arrow />
                </Link>
              ) : (
                <a href={c.href}>
                  <span className="era-contact-icon">{c.icon}</span>
                  {c.label}
                  <Arrow />
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Work */}
      <Band id="work" title="Work" aside={<p className="text-sm text-dim">{studies.length} case studies</p>} />
      <div className="era-col">
        <div className={`era-work ${allWork ? "" : "is-collapsed"}`}>
          {studies.map((p, i) => {
            const cs = getCaseStudy(p.slug);
            const c = covers[i % covers.length];
            return (
              <article key={p.slug} className="era-card">
                <div className="era-card-frame">
                  {cs?.shot ? (
                    <img src={cs.shot.small ?? cs.shot.src} alt={cs.shot.alt} width={640} height={400} loading="lazy" decoding="async" />
                  ) : (
                    <span aria-hidden className="era-card-cover">
                      <img src={c.src} alt="" width={220} height={Math.round(220 / c.ratio)} loading="lazy" decoding="async" />
                    </span>
                  )}
                </div>
                <h3 className="mt-4 font-sans text-[1.0625rem] font-semibold text-ink">
                  <Link to={`/work/${p.slug}`} className="era-card-link">{p.title}</Link>
                </h3>
                <p className="mt-0.5 text-sm text-dim">{p.kicker}</p>
                <p className="era-card-outcome">{p.outcome}</p>
                <div className="era-card-foot">
                  <ul className="era-tags">
                    {p.tags.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                  <span className="era-card-links">
                    {p.links.map((l) => (
                      <a key={l.href} href={l.href} target="_blank" rel="noreferrer noopener" aria-label={`${p.title}: ${l.label}`}>
                        {l.href.includes("github.com") ? <GitHubMark /> : <GlobeMark />}
                      </a>
                    ))}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
        {studies.length > FIRST && (
          <div className="mt-8 flex justify-center">
            <button type="button" className="era-btn" aria-expanded={allWork} onClick={() => setAllWork((v) => !v)}>
              {allWork ? "Show fewer" : `Show all ${studies.length}`}
            </button>
          </div>
        )}
      </div>

      {/* Experience */}
      <Band id="experience" title="Experience" />
      <div className="era-col era-col-flush">
        <ol className="era-exp">
          {experience.map((e) => (
            <li key={e.title}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="font-sans text-base font-semibold text-ink">
                  {e.title} <span className="font-normal text-dim">· {e.org}</span>
                </h3>
                <span className="text-sm text-dim">{e.when}</span>
              </div>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-dim">{e.note}</p>
            </li>
          ))}
          <li>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="font-sans text-base font-semibold text-ink">
                Published research <span className="font-normal text-dim">· IJRTMR</span>
              </h3>
              <span className="text-sm text-dim">{paper.issue}</span>
            </div>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-dim">
              Co-author of{" "}
              <a href={paper.url} target="_blank" rel="noreferrer noopener" className="era-inline-link">
                “{paper.title}”
              </a>
              , the local-inference approach behind the AI Notes project. DOI {paper.doi}.
            </p>
          </li>
        </ol>
      </div>

      {/* Stack. The id is the nav's "Capabilities" target. */}
      <Band id="capabilities" title="Stack" />
      <div className="era-col">
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
      </div>

      {/* Agent skills */}
      <Band id="skills" title="Agent skills" />
      <div className="era-col era-col-flush">
        <ul className="era-exp">
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
      </div>

      {/* GitHub */}
      <Band
        id="github"
        title="GitHub activity"
        aside={
          <a href={GITHUB} target="_blank" rel="noreferrer noopener" className="flex items-center gap-1 text-sm text-dim hover:text-ink">
            HarshithNayakaL <Arrow />
          </a>
        }
      />
      <div className="era-col">
        <GitHubActivity className="era-gh" />
      </div>

      {/* Questions. Visible text for the FAQPage schema. */}
      <Band id="faq" title="Questions" />
      <div className="era-col era-col-flush">
        <div className={`era-faq ${allFaq ? "" : "is-collapsed"}`}>
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
        <div className="flex justify-center border-t border-line py-6">
          <button type="button" className="era-btn" aria-expanded={allFaq} onClick={() => setAllFaq((v) => !v)}>
            {allFaq ? "Show fewer" : `Show all ${faqs.length} questions`}
          </button>
        </div>
      </div>

      {/* Scrolled too far */}
      <Band id="end" title="Scrolled too far" />
      <div className="era-col">
        <div className="era-end">
          <p className="text-base text-dim">If you've read this far, you probably have something in mind.</p>
          <Link to="/contact" className="era-btn era-btn-dark">
            Get in touch <Arrow />
          </Link>
        </div>
      </div>

      {/* Quote */}
      <div className="era-band era-band-thin" aria-hidden><div className="era-band-cell" /></div>
      <div className="era-col">
        <figure className="era-quote">
          <blockquote className="font-display text-[1.75rem] leading-tight text-ink">
            “Once something is a passion, the motivation is there.”
          </blockquote>
          <figcaption className="mt-3 text-sm text-dim">Michael Schumacher</figcaption>
        </figure>
      </div>

      <RossiStrip />
    </div>
  );
}
