import { useInView } from "../lib/useInView";

const statement =
  "Most AI demos work once. The hard part is the hundredth run: the malformed response, the model that drifts, the edge case nobody tested. I build for that run. Validation at every boundary, gates that catch drift, and failures that save their work instead of losing it.";

/**
 * The words brighten in sequence as the section comes into view.
 *
 * Deliberately CSS-only: this used to run GSAP ScrollTrigger with a scrubbed
 * tween, which pulled ~110KB of JS into every page load and measured layout on
 * every scroll frame (the "forced reflow" in the perf audit). An
 * IntersectionObserver fires once, then staggered CSS transitions do the work —
 * no scroll listener, no layout reads, nothing to recompute per frame.
 */
export default function Approach() {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.15 });
  const words = statement.split(" ");

  return (
    <section
      ref={ref}
      className="relative overflow-hidden border-y border-line bg-surface/30"
    >
      <div className="shell relative flex max-w-4xl flex-col justify-center py-24 md:py-32">
        <h2 className="sr-only">How I think about reliability</h2>
        <p className="text-balance text-2xl font-medium leading-[1.35] tracking-tight md:text-[2.6rem] md:leading-[1.3]">
          {words.map((w, i) => (
            <span
              key={i}
              className={`approach-word${inView ? " is-lit" : ""}`}
              // Stagger capped so the tail of a long statement doesn't lag far
              // behind the reader.
              style={{ transitionDelay: `${Math.min(i * 0.028, 1.6)}s` }}
            >
              {w}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
