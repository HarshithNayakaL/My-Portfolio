import { useEffect, useRef, useState } from "react";
import { useInView } from "../lib/useInView";

/**
 * Honest stack marquee. These are the tools actually used across the work
 * (not "trusted by" clients). Logos are self-hosted Simple Icons SVGs under
 * /public/icons (no third-party CDN, so no extra connection or cache miss).
 * Items are tactile capsules that spring on hover; the whole strip fades and
 * lifts in on scroll so the section reads as alive, not a static logo wall.
 */
type Tool = { name: string; slug?: string };

const rowA: Tool[] = [
  { name: "Gemini", slug: "googlegemini" },
  { name: "Google Cloud", slug: "googlecloud" },
  { name: "Hugging Face", slug: "huggingface" },
  { name: "Ollama", slug: "ollama" },
  { name: "Llama 3.1" },
  { name: "DeepSeek R1" },
];

const rowB: Tool[] = [
  { name: "React", slug: "react" },
  { name: "Node.js", slug: "nodedotjs" },
  { name: "TypeScript", slug: "typescript" },
  { name: "MongoDB", slug: "mongodb" },
  { name: "n8n", slug: "n8n" },
  { name: "Python", slug: "python" },
];

function Item({ tool }: { tool: Tool }) {
  return (
    <span className="stack-pill mx-2.5 shrink-0 text-dim">
      {tool.slug && (
        <img
          src={`/icons/${tool.slug}.svg`}
          alt=""
          aria-hidden
          width={18}
          height={18}
          loading="lazy"
          decoding="async"
          className="h-[18px] w-[18px] opacity-90"
        />
      )}
      <span className="font-mono text-[15px] tracking-tight">{tool.name}</span>
    </span>
  );
}

// Pixels per second. Both rows travel at exactly this rate, in opposite
// directions: the two rows hold different words, so they are different widths,
// and the hardcoded durations they used to carry made the wider row move
// faster. Deriving each row's duration from its own measured width is what
// keeps them reading as one mechanism at every window size.
const MARQUEE_SPEED = 28;

/**
 * One row of the strip.
 *
 * The loop is the usual trick — render the list twice, slide the track by half
 * its width, and the second copy lands exactly where the first began. That
 * only holds while one copy is wider than the window. It wasn't: a copy of the
 * shorter row is about 830px, so on anything above that the slide ran the
 * content off the end and left a growing hole of empty page, while the other
 * row happened to be at a fuller part of its cycle. The rows looked like they
 * were running independently because one of them was visibly running out.
 *
 * So the list is repeated enough times to cover the window first, and *that*
 * is what gets doubled. The guarantee restored is `repeats * copyWidth >=
 * window width`, which is what makes the seam impossible to reach.
 */
function Row({ tools, reverse }: { tools: Tool[]; reverse?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [repeats, setRepeats] = useState(1);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const sync = () => {
      // The track holds `repeats` copies, twice over.
      const copyWidth = track.scrollWidth / (2 * repeats);
      if (copyWidth <= 0) return;
      const needed = Math.max(1, Math.ceil(window.innerWidth / copyWidth));
      if (needed !== repeats) setRepeats(needed);
      // The keyframe travels -50%, so the loop distance is whatever half the
      // track comes to once the repeats are settled.
      track.style.setProperty(
        "--marquee-duration",
        `${(needed * copyWidth) / MARQUEE_SPEED}s`,
      );
    };

    sync();
    // Web fonts land after first paint and change the width of every pill, and
    // a resize changes how many copies it takes to cover the window. Both
    // invalidate the measurement, so it is re-derived rather than taken once
    // and trusted.
    const observer = new ResizeObserver(sync);
    observer.observe(track);
    window.addEventListener("resize", sync, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [repeats]);

  const covering = Array.from({ length: repeats }, () => tools).flat();
  const looped = [...covering, ...covering];

  return (
    <div className="marquee-mask marquee-group overflow-hidden py-1.5">
      <div ref={trackRef} className={`marquee-track ${reverse ? "rev" : ""}`}>
        {looped.map((t, i) => (
          <Item key={`${t.name}-${i}`} tool={t} />
        ))}
      </div>
    </div>
  );
}

export default function TechMarquee() {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <section
      ref={ref}
      aria-label="Tools and models used across the work"
      className={`reveal ${inView ? "is-in" : ""} border-y border-line bg-surface/20 py-12`}
    >
      <div className="shell mb-7 flex items-center gap-3">
        <span className="h-3 w-px bg-accent" aria-hidden />
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-dim">
          The stack behind the work
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Row tools={rowA} />
        <Row tools={rowB} reverse />
      </div>
    </section>
  );
}
