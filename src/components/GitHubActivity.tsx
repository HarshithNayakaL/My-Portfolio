import { Suspense, lazy, useEffect, useState } from "react";
import { useInView } from "../lib/useInView";
import { GITHUB } from "../data/projects";
import type { Contributions } from "./GitHubGraph";

const loadGraph = () => import("./GitHubGraph");
const GitHubGraph = lazy(loadGraph);

/**
 * GitHub contribution graph (Kibo UI), drawn in the browser rather than
 * prerendered. It is ~370 SVG rects, which in the static HTML would add about
 * 55KB and push the FAQ and contact sections back past where agents that
 * fetch the page as HTML truncate it. The prerendered markup reserves the
 * graph's height so nothing shifts when it appears.
 *
 * Data is a same-origin JSON file written at build time (build-api.mjs). The
 * data and the graph's code are both requested only once the section is near
 * the viewport, in parallel.
 */
export default function GitHubActivity({ className }: { className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [data, setData] = useState<Contributions | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!inView || data || failed) return;
    loadGraph().catch(() => {}); // start the chunk download alongside the data
    fetch("/data/github-contributions.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Contributions) => setData(d))
      .catch(() => setFailed(true));
  }, [inView, data, failed]);

  if (failed) return null;

  return (
    <div ref={ref} className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="font-mono text-[0.75rem] font-medium uppercase tracking-wider text-dim">
          GitHub activity
        </h3>
        <a
          href={GITHUB}
          target="_blank"
          rel="noreferrer noopener"
          className="text-sm font-medium text-dim transition-colors hover:text-accent-ink"
        >
          <span className="sr-only">Harshith's </span>GitHub profile
          <span aria-hidden> ↗</span>
        </a>
      </div>

      {/* Height reserved to the graph's own: 12px month labels + 8px gap +
          7 rows of 11px blocks with 3px gaps, then the footer, which wraps to
          a second line below sm. Measured: 167px on a phone, 152px above. */}
      <div className="contrib-graph mt-5 min-h-[10.5rem] text-dim sm:min-h-[9.5rem]">
        {data && (
          <Suspense fallback={null}>
            <GitHubGraph data={data} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
