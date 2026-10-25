import { useEffect, useState } from "react";
import { byId } from "./cars";

/**
 * The F2004 on its own bit of track: idling (engine shake, exhaust), and every
 * so often launching off to the left, coming round from the right and braking
 * back onto its mark. Clicking it launches it straight away.
 */
export default function F2004Stage() {
  const car = byId("f2004");
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    if (!launching) return;
    const t = setTimeout(() => setLaunching(false), 1700);
    return () => clearTimeout(t);
  }, [launching]);

  return (
    <figure className="m-0">
      <button
        type="button"
        onClick={() => setLaunching(true)}
        aria-label="Launch the F2004"
        className="era-stage group"
      >
        <span aria-hidden className="era-stage-road" />
        <span aria-hidden className={launching ? "era-launch" : "era-lap"}>
          <span className="era-speedlines" />
          <span className="era-idle">
            <img src={car.src} alt="" width={260} height={Math.round(260 / car.ratio)} />
          </span>
          <span className="era-puff era-puff-1" />
          <span className="era-puff era-puff-2" />
          <span className="era-puff era-puff-3" />
        </span>
      </button>
      <figcaption className="mt-3 text-[0.9375rem] text-dim">
        <span className="font-semibold text-ink">F2004.</span> The car from the year I was born. Click it.
      </figcaption>
    </figure>
  );
}
