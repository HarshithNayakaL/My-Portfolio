import { useEffect, useRef, useState } from "react";
import { rossi, stoner } from "./cars";
import "./rossi.css";

/**
 * Rossi riding along the very bottom of the footer, left to right, and pulling a
 * wheelie or two on the way across before he rides off and comes round
 * again. The bike is drawn facing right, so it never needs mirroring.
 *
 * Stoner chases him on the Ducati, Laguna Seca 2008 style: right behind on
 * the same line, closing into his slipstream and dropping back again, the
 * gap swinging between about 0 and 80px.
 *
 * The two Rossi sprites aren't drawn at the same scale. At these widths their
 * tyres come out the same size and the rear wheel sits the same distance
 * from the left edge, so swapping one for the other, left and bottom
 * aligned, keeps the rear wheel planted.
 */
const RIDE_W = 130;
const WHEELIE_W = 100;
const SPEED = 190; // px per second
// Wide enough that his tyres come out the size of Rossi's.
const STONER_W = 106;

export default function RossiRide() {
  const strip = useRef<HTMLDivElement>(null);
  const bike = useRef<HTMLDivElement>(null);
  const chaser = useRef<HTMLDivElement>(null);
  const [wheelie, setWheelie] = useState(false);

  useEffect(() => {
    const box = strip.current;
    if (!box) return;
    // Not tied to prefers-reduced-motion, for the reason Onee isn't (see
    // OneeCompanion): Windows sets it when animation effects are turned off
    // for speed, and the owner's machine is set that way. A display setting is
    // not a request to take Rossi away.
    let raf = 0;
    let last = 0;
    let x = -RIDE_W - 40;
    let restAt = 0; // while off the right edge, the time to come round again
    // Where on this pass the wheelies start, as x positions, and how long
    // each lasts in px of travel.
    let plan: { at: number; len: number }[] = [];
    let on = false;
    // Where in his closing and dropping back the chase is, in radians.
    let phase = Math.random() * Math.PI * 2;
    const newPass = () => {
      const w = box.clientWidth;
      const n = Math.random() < 0.5 ? 1 : 2;
      plan = [];
      let from = w * 0.12;
      for (let i = 0; i < n; i++) {
        const at = from + Math.random() * (w * (n === 1 ? 0.55 : 0.3));
        const len = SPEED * (1.1 + Math.random() * 0.8);
        plan.push({ at, len });
        from = at + len + w * 0.08;
      }
    };
    newPass();

    const frame = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      const w = box.clientWidth;
      if (restAt) {
        if (t >= restAt) {
          restAt = 0;
          x = -RIDE_W - 40;
          newPass();
        }
      } else {
        x += SPEED * dt;
        phase += dt * ((Math.PI * 2) / 4.5);
      }
      const gap = 40 + 42 * Math.sin(phase);
      const sx = x - STONER_W - gap;
      // The pass is over once the chaser is off the far edge too.
      if (!restAt && sx > w + 40) restAt = t + 1500 + Math.random() * 2500;
      const up = plan.some((p) => x >= p.at && x < p.at + p.len);
      if (up !== on) {
        on = up;
        setWheelie(up);
      }
      if (bike.current) bike.current.style.transform = `translateX(${x}px)`;
      if (chaser.current) chaser.current.style.transform = `translateX(${sx}px)`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const img = wheelie ? rossi.wheelie : rossi.ride;
  const w = wheelie ? WHEELIE_W : RIDE_W;
  return (
    <div ref={strip} aria-hidden className="era-rossi">
      <div ref={chaser} className="era-rossi-bike" style={{ transform: `translateX(${-RIDE_W - STONER_W - 160}px)` }}>
        <img
          src={stoner.src}
          alt=""
          width={STONER_W}
          height={Math.round(STONER_W / stoner.ratio)}
          loading="lazy"
          decoding="async"
          style={{ width: STONER_W }}
        />
      </div>
      <div ref={bike} className="era-rossi-bike" style={{ transform: `translateX(${-RIDE_W - 40}px)` }}>
        <img src={img.src} alt="" width={w} height={Math.round(w / img.ratio)} loading="lazy" decoding="async" style={{ width: w }} />
      </div>
    </div>
  );
}
