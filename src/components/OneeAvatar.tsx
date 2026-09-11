import { memo, useEffect, useRef } from "react";
import { oneeFrame, ONEE_VIEWBOX } from "../data/oneeFrame";
import type { OneeAnimation, OneeRuntime } from "../lib/oneeRuntime";

/**
 * Onee — a small procedural character that watches the hero.
 *
 * Two halves, deliberately separated:
 *
 *   1. The SVG below, drawn from `oneeFrame` — a resting pose baked at build
 *      time by scripts/build-onee-frame.mjs. It costs nothing but its own
 *      markup, renders identically on the server and the client, and is what a
 *      visitor sees if the runtime never loads (slow network, JS disabled, a
 *      crawler). Nothing here starts hidden.
 *
 *   2. The animation runtime, a dynamic import. It arrives after paint and
 *      then writes geometry straight onto the nodes below with setAttribute,
 *      bypassing React entirely — which is why `OneeSvg` is memoised with no
 *      props. A re-render of the parent would otherwise reset every path back
 *      to the resting pose mid-animation.
 */

const svgNodes = ["head", "left", "right"] as const;

const OneeSvg = memo(function OneeSvg() {
  const f = oneeFrame;
  return (
    <svg
      viewBox={ONEE_VIEWBOX}
      className="block h-full w-full overflow-visible"
      aria-hidden="true"
      focusable="false"
    >
      {/* The body outline is ~7KB of path data and is needed twice — once to
          draw, once to clip the eyes. Defining it once and referencing it with
          <use> keeps that out of the HTML a second time, and means the runtime
          rewrites one `d` per frame instead of keeping two in sync. */}
      <defs>
        <path id="onee-body" data-onee="head" d={f.headPath} />
        <clipPath id="onee-clip">
          <use href="#onee-body" />
        </clipPath>
      </defs>
      {f.backPaths.map((d, i) => (
        <path key={`b${i}`} data-onee-back={i} d={d} fill={f.colors.body} />
      ))}
      <use href="#onee-body" fill={f.colors.body} />
      {/* Clipped to the body so a wide glance can't slide an eye off the face. */}
      <g clipPath="url(#onee-clip)" fill={f.colors.eyes}>
        <path data-onee="left" d={f.leftPath} opacity={f.leftVisible ? 1 : 0} />
        <path data-onee="right" d={f.rightPath} opacity={f.rightVisible ? 1 : 0} />
      </g>
      {f.frontPaths.map((d, i) => (
        <path key={`f${i}`} data-onee-front={i} d={d} fill={f.colors.body} />
      ))}
    </svg>
  );
});

type Props = {
  /** Looping animation to hold. Changing it cross-fades from the live pose. */
  animation: OneeAnimation;
  className?: string;
};

export default function OneeAvatar({ animation, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<OneeRuntime | null>(null);
  const wantedRef = useRef<OneeAnimation>(animation);

  // Load and drive the runtime. Runs once; the animation prop is read through
  // a ref so a change of expression never re-runs this effect (and never
  // re-imports or restarts the loop).
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // The site's rule is that motion is opt-in, not opt-out: under a reduced
    // motion preference the runtime is never fetched at all, and Onee simply
    // holds the resting pose that is already on screen. Nothing to cancel,
    // no bytes spent.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const nodes = Object.fromEntries(
      svgNodes.map((n) => [n, host.querySelector<SVGPathElement>(`[data-onee="${n}"]`)]),
    ) as Record<(typeof svgNodes)[number], SVGPathElement | null>;
    const backs = host.querySelectorAll<SVGPathElement>("[data-onee-back]");
    const fronts = host.querySelectorAll<SVGPathElement>("[data-onee-front]");

    let cancelled = false;
    let observer: IntersectionObserver | undefined;
    let onVisibility: (() => void) | undefined;

    import("../lib/oneeRuntime")
      .then(({ createOneeRuntime }) => {
        if (cancelled) return;

        const runtime = createOneeRuntime((scene) => {
          const g = scene.geometry;
          nodes.head?.setAttribute("d", g.headPath);
          nodes.left?.setAttribute("d", g.leftPath);
          nodes.left?.setAttribute("opacity", g.leftVisible ? "1" : "0");
          nodes.right?.setAttribute("d", g.rightPath);
          nodes.right?.setAttribute("opacity", g.rightVisible ? "1" : "0");
          backs.forEach((p, i) => p.setAttribute("d", g.backPaths[i] ?? ""));
          fronts.forEach((p, i) => p.setAttribute("d", g.frontPaths[i] ?? ""));
        }, wantedRef.current);

        runtimeRef.current = runtime;

        // A character animating in a scrolled-past hero, or in a background
        // tab, is pure battery burn. Both conditions park the frame loop.
        const resume = () =>
          !document.hidden && host.dataset.onscreen === "1"
            ? runtime.start()
            : runtime.stop();

        observer = new IntersectionObserver(
          ([entry]) => {
            host.dataset.onscreen = entry.isIntersecting ? "1" : "0";
            resume();
          },
          { rootMargin: "128px" },
        );
        observer.observe(host);

        onVisibility = resume;
        document.addEventListener("visibilitychange", onVisibility);
      })
      .catch(() => {
        // The resting pose is already painted, so a failed chunk fetch costs
        // the animation and nothing else. Nothing worth reporting to a visitor.
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (onVisibility) document.removeEventListener("visibilitychange", onVisibility);
      runtimeRef.current?.stop();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    wantedRef.current = animation;
    runtimeRef.current?.play(animation);
  }, [animation]);

  return (
    <div ref={hostRef} className={className} aria-hidden="true">
      <OneeSvg />
    </div>
  );
}
