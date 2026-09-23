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
    // Height reserved for the whole block (heading row + graph + footer), which
    // renders only once both the data and the graph's code have arrived.
    // Measured: 207px below sm, where the footer wraps, 185px above.
    <div ref={ref} className={`min-h-[13rem] sm:min-h-[11.625rem] ${className ?? ""}`}>
      {data && (
        <Suspense fallback={null}>
          {/* Centred as one block exactly as wide as the graph, so the heading
              and profile link line up with its edges on a wide screen instead
              of sitting at the far sides of the column. The width is only known
              once the data is in, which is why the heading waits for it too:
              drawing it earlier would make it jump sideways. On a phone the
              graph is wider than the screen, max-w-full applies, and it scrolls. */}
          <div className="mx-auto w-fit max-w-full">
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
            <div className="contrib-graph mt-5 text-dim">
              <GitHubGraph data={data} />
            </div>
          </div>
        </Suspense>
      )}
    </div>
  );
}
