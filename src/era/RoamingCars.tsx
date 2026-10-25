import { useEffect, useRef } from "react";
import { cars, type EraCar } from "./cars";

/**
 * Cars of the era crossing the page now and then: straight across, left to
 * right or right to left, at a random height. Sometimes it is two of the same
 * kind racing nose to tail, the one behind a touch quicker so it can close up
 * or get past. No suspension bounce: an F1 car on a straight doesn't move.
 *
 * The F2004 is left out, it is the one following the cursor.
 */
const F1 = cars.filter((c) => c.kind === "f1" && c.id !== "f2004");
const RALLY = cars.filter((c) => c.kind === "rally");
const pick = (pool: EraCar[], not?: EraCar) => {
  const left = pool.filter((c) => c !== not);
  return left[Math.floor(Math.random() * left.length)];
};

export default function RoamingCars() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = layer.current;
    if (!box || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;

    const launch = (car: EraCar, y: number, dir: 1 | -1, speed: number, gap: number, front: boolean) => {
      const w = car.kind === "f1" ? 120 : 98;
      const h = w / car.ratio;
      const img = document.createElement("img");
      img.src = car.src;
      img.alt = "";
      img.width = w;
      img.height = Math.round(h);
      img.className = "era-roamer";
      img.style.top = `${y - h}px`;
      img.style.zIndex = front ? "2" : "1";
      box.appendChild(img);
      const vw = window.innerWidth;
      // Start further back by the gap, and run on past the far edge by the
      // same, so the car behind gets all the way across too.
      const from = dir > 0 ? -w - gap : vw + gap;
      const to = dir > 0 ? vw + w + 160 : -w - 160;
      const flip = dir > 0 ? -1 : 1; // drawn facing left
      const anim = img.animate(
        [
          { transform: `translateX(${from}px) scaleX(${flip})` },
          { transform: `translateX(${to}px) scaleX(${flip})` },
        ],
        { duration: (Math.abs(to - from) / speed) * 1000, easing: "linear" },
      );
      anim.onfinish = () => img.remove();
    };

    const run = () => {
      if (!document.hidden) {
        const rally = Math.random() < 0.3;
        const pool = rally ? RALLY : F1;
        const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
        const vh = window.innerHeight;
        const y = vh * (0.22 + Math.random() * 0.68);
        const speed = rally ? 420 + Math.random() * 140 : 600 + Math.random() * 220;
        const lead = pick(pool);
        launch(lead, y, dir, speed, 0, false);
        if (Math.random() < 0.55) {
          // The chaser runs a lane lower, which reads as nearer, and drawn
          // in front, so an overtake passes in front of the leader.
          launch(pick(pool, lead), y + 12, dir, speed * (1.02 + Math.random() * 0.07), 70 + Math.random() * 90, true);
        }
      }
      timer = window.setTimeout(run, 4000 + Math.random() * 5000);
    };
    timer = window.setTimeout(run, 2500);
    return () => {
      clearTimeout(timer);
      box.replaceChildren();
    };
  }, []);

  return <div ref={layer} aria-hidden className="era-roam" />;
}
