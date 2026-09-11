import type { CSSProperties } from "react";
import { ArrowDown, ArrowUpRight } from "@phosphor-icons/react";
import Magnetic from "./Magnetic";
import { scrollToSection } from "../lib/scrollToSection";
import { NAME } from "../data/projects";

// Headline split so each word rises on its own beat (CSS mask reveal).
const HEAD_LEAD = "I build AI systems — agents, RAG, full-stack apps — engineered for".split(
  " ",
);
const d = (s: number) => ({ "--delay": `${s}s` }) as CSSProperties;
const wordDelay = (i: number) => 0.15 + i * 0.04;

export default function Hero() {
  const goTo = (id: string) => scrollToSection(id);

  return (
    <section className="relative flex flex-col overflow-hidden pb-20 pt-32 md:pt-40 landscape:min-h-[100svh] landscape:justify-center">
      <div className="shell relative z-10">
        {/* Eyebrow: a substantial role line + an availability marker. */}
        <div
          className="anim-rise mb-9 flex flex-wrap items-center gap-x-4 gap-y-2"
          style={d(0)}
        >
          {/* The name leads. This page has to rank for a person, and the name
              was previously absent from the entire hero — the H1 states what
              the work is, not who does it, and an engine reading the first
              screen saw a service description with no subject. There are
              several AI engineers named Harshith with portfolios; the ones
              that surface put their name where a reader and a parser both
              hit it first. */}
          <span className="text-base font-semibold tracking-tight text-ink">
            {NAME} <span className="text-dim">— AI Engineer, Full-Stack</span>
          </span>
          <span className="h-4 w-px bg-line-strong" aria-hidden />
          <span className="text-[15px] font-medium text-dim">
            AI Workflow Engineer @ DemandNXT
          </span>
          <span className="h-4 w-px bg-line-strong" aria-hidden />
          <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-accent-ink">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
            Available for freelance work
          </span>
        </div>

        {/* Headline */}
        <h1 className="max-w-[16ch] text-[clamp(2.6rem,7vw,5.5rem)] font-semibold leading-[1.03] tracking-[-0.02em] text-ink lg:max-w-[18ch]">
          {HEAD_LEAD.map((word, i) => (
            <span
              key={`${word}-${i}`}
              className="inline-block overflow-hidden align-bottom"
            >
              <span className="word-rise" style={d(wordDelay(i))}>
                {word}&nbsp;
              </span>
            </span>
          ))}
          <span className="inline-block overflow-hidden align-bottom">
            <span
              className="word-rise accent-shimmer"
              style={d(wordDelay(HEAD_LEAD.length))}
            >
              production.
            </span>
          </span>
        </h1>

        {/* Sub */}
        <p
          className="anim-rise mt-8 max-w-xl text-pretty text-base leading-relaxed text-dim md:text-lg"
          style={d(0.55)}
        >
          Concretely: LLM agents, RAG pipelines, and full-stack AI apps — plus
          the automation that ties them together. Built to hold up in
          production, not just in a demo.
        </p>

        {/* CTAs */}
        <div className="anim-rise mt-10 flex flex-wrap items-center gap-3" style={d(0.65)}>
          <Magnetic className="inline-block">
            <button
              onClick={() => goTo("work")}
              className="btn-accent group inline-flex items-center gap-2.5 rounded-full py-3 pl-6 pr-3 text-sm font-semibold"
              style={{ touchAction: "manipulation" }}
            >
              See my work
              <span className="cta-icon">
                <ArrowDown weight="bold" size={14} />
              </span>
            </button>
          </Magnetic>
          <Magnetic className="inline-block">
            <button
              onClick={() => goTo("contact")}
              className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-ink transition-colors hover:text-accent-ink active:translate-y-px"
              style={{ touchAction: "manipulation" }}
            >
              Get in touch
              <ArrowUpRight weight="bold" size={16} className="text-dim" />
            </button>
          </Magnetic>
        </div>
      </div>

      {/* Scroll cue */}
      <button
        onClick={() => goTo("work")}
        aria-label="Scroll to work"
        className="anim-rise relative z-10 mx-auto mt-14 flex flex-col items-center gap-1.5 text-dim transition-colors hover:text-accent-ink"
        style={d(0.9)}
      >
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.24em]">
          Scroll
        </span>
        <span className="anim-nudge" aria-hidden>
          <ArrowDown weight="bold" size={14} />
        </span>
      </button>
    </section>
  );
}
