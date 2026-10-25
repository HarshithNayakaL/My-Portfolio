import { useEffect, useRef, useState } from "react";
import { byId } from "./cars";

/**
 * The banner: the F2004 on the grid under a start gantry. Pressing Start runs
 * the real procedure, five reds one by one, a random hold, lights out, and it
 * launches, comes round and stops back on its mark. Between starts other cars
 * of the era go past in the far lane.
 */
const PASSERS = ["r26", "mp4-20", "mp4-22", "redbull-vettel", "brawn-button", "ferrari-hamilton"];

type Phase = { k: "idle" } | { k: "lights"; n: number } | { k: "go" };

export default function StartBanner() {
  const car = byId("f2004");
  const [phase, setPhase] = useState<Phase>({ k: "idle" });
  const [passer, setPasser] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const start = () => {
    if (phase.k !== "idle") return;
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    for (let n = 1; n <= 5; n++) at(n * 550, () => setPhase({ k: "lights", n }));
    // The hold after the fifth light is random on purpose: it is what makes
    // a start impossible to anticipate.
    const out = 5 * 550 + 500 + Math.random() * 900;
    at(out, () => setPhase({ k: "go" }));
    at(out + 1800, () => setPhase({ k: "idle" }));
  };

  const lit = phase.k === "lights" ? phase.n : 0;
  const p = byId(PASSERS[passer % PASSERS.length]);

  return (
    <div className="era-banner" aria-label="The F2004 on the starting grid" role="group">
      <span aria-hidden className="era-banner-grass" />
      <span aria-hidden className="era-banner-kerb" />
      <span aria-hidden className="era-banner-road" />

      <span
        aria-hidden
        className="era-banner-passer"
        onAnimationIteration={() => setPasser((i) => i + 1)}
        style={{ width: 132, height: 132 / p.ratio }}
      >
        <img src={p.src} alt="" width={132} height={Math.round(132 / p.ratio)} />
      </span>

      <span aria-hidden className="era-gantry">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="era-gantry-pod">
            <span className={`era-light ${n <= lit ? "is-on" : ""}`} />
            <span className={`era-light ${n <= lit ? "is-on" : ""}`} />
          </span>
        ))}
      </span>

      <span aria-hidden className={`era-grid-car ${phase.k === "go" ? "is-go" : ""}`}>
        <span className="era-speedlines" />
        <span className={phase.k === "go" ? "" : "era-idle"}>
          <img src={car.src} alt="" width={236} height={Math.round(236 / car.ratio)} />
        </span>
        <span className="era-puff era-puff-1" />
        <span className="era-puff era-puff-2" />
        <span className="era-puff era-puff-3" />
      </span>

      <button type="button" onClick={start} disabled={phase.k !== "idle"} className="era-banner-btn">
        {phase.k === "idle" ? "Start" : phase.k === "go" ? "Away" : "Lights"}
      </button>
    </div>
  );
}
