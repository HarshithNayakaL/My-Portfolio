import { useEffect, useRef } from "react";
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
// directions, which is the whole point of measuring: the two rows hold
// different words, so they are different widths, and a shared animation
// duration made the wider row move faster. On a laptop you see a slice of each
// and the mismatch passes; on a wide display both rows are visible end to end
// and they visibly race each other. Constant speed makes them read as one
// mechanism at every width.
const MARQUEE_SPEED = 28;

function Row({ tools, reverse }: { tools: Tool[]; reverse?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const sync = () => {
      // The list is rendered twice and the keyframe travels -50%, so the loop
      // distance is half the track.
      const distance = track.scrollWidth / 2;
      if (distance > 0) {
        track.style.setProperty(
          "--marquee-duration",
          `${distance / MARQUEE_SPEED}s`,
        );
      }
    };
    sync();
    // Web fonts land after first paint and change every pill's width, and a
    // window resize can rewrap nothing here but still rescale the icons — both
    // change the distance, so the duration is re-derived rather than measured
    // once and trusted.
    const observer = new ResizeObserver(sync);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const doubled = [...tools, ...tools];
  return (
    <div className="marquee-mask marquee-group overflow-hidden py-1.5">
      <div ref={trackRef} className={`marquee-track ${reverse ? "rev" : ""}`}>
        {doubled.map((t, i) => (
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
