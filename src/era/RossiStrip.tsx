import { useEffect, useRef, useState } from "react";
import { rossi } from "./cars";

/**
 * Rossi riding the width of the page and back, now and then pulling a wheelie
 * mid-run. The bike faces right, so it is mirrored on the way back.
 */
const RIDE_W = 150;
const WHEELIE_W = 118;

export default function RossiStrip() {
  const box = useRef<HTMLDivElement>(null);
  const bike = useRef<HTMLDivElement>(null);
  const [wheelie, setWheelie] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = -RIDE_W;
    let dir = 1;
    let wheelieUntil = 0;
    let armed = true;
    let raf = 0;
    const frame = (t: number) => {
      const w = box.current?.clientWidth ?? 1000;
      if (!reduce) {
        x += dir * 2.4;
        if (dir > 0 && x > w + 20) { dir = -1; armed = true; }
        if (dir < 0 && x < -RIDE_W - 20) { dir = 1; armed = true; }
        const mid = Math.abs(x - w * 0.42) < 3;
        if (armed && mid) {
          armed = false;
          if (Math.random() < 0.6) { wheelieUntil = t + 1400; setWheelie(true); }
        }
        if (wheelieUntil && t > wheelieUntil) { wheelieUntil = 0; setWheelie(false); }
      }
      if (bike.current) bike.current.style.transform = `translateX(${x}px) scaleX(${dir})`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const img = wheelie ? rossi.wheelie : rossi.ride;
  const w = wheelie ? WHEELIE_W : RIDE_W;
  return (
    <div ref={box} aria-hidden className="era-rossi">
      <span className="era-rossi-road" />
      <div ref={bike} className="era-rossi-bike" style={{ width: RIDE_W }}>
        <img src={img.src} alt="" width={w} height={Math.round(w / img.ratio)} style={{ width: w }} />
      </div>
    </div>
  );
}
