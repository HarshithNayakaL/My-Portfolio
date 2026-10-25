import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import "./era.css";
import { EMAIL, GITHUB, LINKEDIN, NAME, projects } from "../data/projects";
import { agentSkills } from "../data/skills";
import { faqs } from "../components/Faq";
import { experience, headlineRole, identitySentence, paper, stack } from "../components/About";
import GitHubActivity from "../components/GitHubActivity";
import HelmetGrid from "./HelmetGrid";
import Turntable from "./Turntable";
import TyrePet from "./TyrePet";
import RoamingCars from "./RoamingCars";
import MarginObjects from "./MarginObjects";
import Garage from "./Garage";
import WorkGrid from "./WorkGrid";
import SectionRail from "./SectionRail";
import { Arrow, GitHubMark, LinkedInMark, MailMark } from "./icons";

/**
 * The era homepage. One dashed frame holds the page (palakonweb.in), on grid
 * paper (upriyanshu.tech), with the photo taped down as a polaroid and the
 * margins set with objects of the time (garvitsingla.in). The cars are the
 * part that is mine: a Pirelli tyre follows the cursor, the cars cross the page
 * on their own, and all of them are parked in a row at the bottom.
 */
// Every frame in the grid is the same height now, so the studies keep their
// data order: the order the site, the API and the agents all use.
const studies = projects.filter((p) => p.hasCaseStudy);
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

// The agent tooling the work is built with, floating over the stack.
const tools: { slug: string; name: string; rot: number; dur: number; del: number; mono?: boolean }[] = [
  { slug: "claudecode", name: "Claude Code", rot: -4, dur: 7.5, del: 0 },
  { slug: "codex", name: "Codex", rot: 5, dur: 8.2, del: -2 },
  { slug: "openai", name: "Agents API", rot: -3, dur: 7.9, del: -1, mono: true },
  { slug: "mcp", name: "MCP", rot: 4, dur: 6.9, del: -4, mono: true },
];

export default function EraHome() {
  const time = useBengaluruTime();
  const [allWork, setAllWork] = useState(false);
  const [allFaq, setAllFaq] = useState(false);

  return (
    <div className="era">
      <SectionRail />
      <RoamingCars />
      <TyrePet />
      <MarginObjects />

      <div className="era-frame">
        <HelmetGrid />

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
              <span aria-hidden className="era-mark" />
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
          <WorkGrid items={studies} collapsed={!allWork} />
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
          <div aria-hidden className="era-tools">
            {tools.map((t) => (
              <div
                key={t.slug}
                className="orbit-tile"
                style={{ ["--rot" as string]: `${t.rot}deg`, ["--dur" as string]: `${t.dur}s`, ["--del" as string]: `${t.del}s` }}
              >
                <img src={`/icons/${t.slug}.svg`} alt="" width={36} height={36} decoding="async" className={t.mono ? "icon-mono" : undefined} />
                <span>{t.name}</span>
              </div>
            ))}
          </div>
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
