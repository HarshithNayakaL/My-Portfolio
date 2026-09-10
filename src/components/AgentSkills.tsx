import type { CSSProperties } from "react";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import { useInView } from "../lib/useInView";
import { agentSkills, type AgentSkill } from "../data/skills";

/**
 * Packaged agent skills, kept out of the work grid on purpose.
 *
 * These are not products and they are not case studies — nothing here is
 * deployed and nothing has users. What they are is a claim about method, so
 * the card leads with the failure mode each was built against rather than with
 * a feature list. Read that way the section answers a question the case
 * studies do not: how the person writing this decides what is true before
 * building on it.
 */
function SkillCard({ skill, index }: { skill: AgentSkill; index: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "is-in" : ""}`}
      style={{ "--delay": `${(index % 2) * 0.08}s` } as CSSProperties}
    >
      <article className="glass-card spotlight group flex h-full flex-col rounded-[var(--radius-lg)] p-6 md:p-7">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-mono text-base font-semibold tracking-tight text-ink transition-colors duration-500 group-hover:text-accent-ink">
            {skill.name}
          </h3>
          {skill.repo ? (
            <a
              href={skill.repo}
              target="_blank"
              rel="noreferrer noopener"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint underline-offset-4 transition-colors hover:text-accent-ink hover:underline"
            >
              GitHub ↗
            </a>
          ) : null}
        </div>

        <p className="mt-1.5 text-[15px] font-medium text-dim">{skill.tagline}</p>

        <dl className="mt-5 flex flex-1 flex-col gap-4">
          <div>
            <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
              Why it exists
            </dt>
            <dd className="mt-1.5 text-[15px] leading-relaxed text-dim">
              {skill.premise}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
              What's in it
            </dt>
            <dd className="mt-1.5 text-[15px] leading-relaxed text-dim">
              {skill.contents}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
              The rule it keeps
            </dt>
            <dd className="mt-1.5 text-[15px] leading-relaxed text-dim">
              {skill.discipline}
            </dd>
          </div>
        </dl>

        <ul className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
          {skill.tags.map((t) => (
            <li
              key={t}
              className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-faint"
            >
              {t}
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}

export default function AgentSkills() {
  return (
    <section id="skills" className="scroll-mt-28 border-t border-line">
      <div className="shell py-20 md:py-28">
        <Reveal>
          <SectionHeading
            title="Agent skills"
            intro="Capability packaged so an agent can load it: instructions plus executable drivers. Each one exists because a whole category of advice about its subject turned out to be folklore, and the primary source said something different."
          />
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {agentSkills.map((s, i) => (
            <SkillCard key={s.name} skill={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
