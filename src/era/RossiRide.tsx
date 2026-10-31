import { useEffect, useRef, useState } from "react";
import { rossi, stoner } from "./cars";
import "./rossi.css";

/**
 * Rossi riding along the very bottom of the footer, left to right, with
 * Stoner chasing him, before both ride off and come round again. On a pass
 * one or the other pulls a wheelie, never both at once. The bikes are drawn
 * facing right, so they never need mirroring.
 *
 * Stoner chases him on the Ducati, Laguna Seca 2008 style: right behind on
 * the same line, easing into his slipstream and back out, the gap between
 * 16 and 36px. It used to swing from -2 to 80px every 4.5s: the bikes
 * overlapped at the closest point, and Stoner's speed surged and dropped by
 * a third around Rossi's, so they never looked like one race pace. Over a
 * 9s cycle the swing moves Stoner at most 4% faster or slower than Rossi.
 *
 * Rossi is sized to stand as tall as Stoner, about 58px. Matching their
 * tyres instead left him visibly smaller: the Yamaha art draws bigger wheels
 * for the size of the bike, so equal tyres meant a shorter, lower bike.
 *
 * Each wheelie is drawn at a slightly different scale from its rider's
 * riding sprite, so its width is set from the tyres to keep the rider the
 * same size, and `shift` is how much further in from the left edge its rear
 * axle sits. Pulling it back by that much, bottom aligned, keeps the rear
 * wheel planted when one sprite is swapped for the other.
 */
const SIZE = {
  rossi: { ride: { w: 110, shift: 0 }, wheelie: { w: 101, shift: 3 } },
  stoner: { ride: { w: 106, shift: 0 }, wheelie: { w: 106, shift: 4 } },
};
const ART = { rossi, stoner };
type Rider = keyof typeof SIZE;
const SPEED = 190; // px per second
const RIDE_W = SIZE.rossi.ride.w;
const STONER_W = SIZE.stoner.ride.w;

function Bike({ who, up }: { who: Rider; up: boolean }) {
  const pose = up ? "wheelie" : "ride";
  const { w, shift } = SIZE[who][pose];
  const img = ART[who][pose];
  return (
    <img
      src={img.src}
      alt=""
      width={w}
      height={Math.round(w / img.ratio)}
      loading="lazy"
      decoding="async"
      style={{ width: w, position: "relative", left: -shift }}
    />
  );
}

export default function RossiRide() {
  const strip = useRef<HTMLDivElement>(null);
  const bike = useRef<HTMLDivElement>(null);
  const chaser = useRef<HTMLDivElement>(null);
  const [up, setUp] = useState<Rider | null>(null);

  useEffect(() => {
    const box = strip.current;
    if (!box) return;
    // Loaded ahead, or the first wheelie of a visit swaps to an image that
    // isn't there yet and the bike blinks out.
    for (const art of [rossi.wheelie, stoner.wheelie]) new Image().src = art.src;
    // Not tied to prefers-reduced-motion, for the reason Onee isn't (see
    // OneeCompanion): Windows sets it when animation effects are turned off
    // for speed, and the owner's machine is set that way. A display setting is
    // not a request to take Rossi away.
    let raf = 0;
    let last = 0;
    let x = -RIDE_W - 40;
    let restAt = 0; // while off the right edge, the time to come round again
    // The wheelies on this pass: who, where Rossi is when it starts (Stoner's
    // are pushed on by about his distance behind, so he is on screen), and
    // how long it lasts in px of travel.
    let plan: { who: Rider; at: number; len: number }[] = [];
    let on: Rider | null = null;
    // Where in his closing and dropping back the chase is, in radians.
    let phase = Math.random() * Math.PI * 2;
    const newPass = () => {
      const w = box.clientWidth;
      const n = Math.random() < 0.5 ? 1 : 2;
      // Two on a pass are one each, in either order.
      const first: Rider = Math.random() < 0.5 ? "rossi" : "stoner";
      plan = [];
      let from = w * 0.12;
      for (let i = 0; i < n; i++) {
        const who: Rider = i === 0 ? first : first === "rossi" ? "stoner" : "rossi";
        const at = from + Math.random() * (w * (n === 1 ? 0.55 : 0.3)) + (who === "stoner" ? STONER_W + 30 : 0);
        const len = SPEED * (1.1 + Math.random() * 0.8);
        plan.push({ who, at, len });
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
        phase += dt * ((Math.PI * 2) / 9);
      }
      const gap = 26 + 10 * Math.sin(phase);
      const sx = x - STONER_W - gap;
      // The pass is over once the chaser is off the far edge too.
      if (!restAt && sx > w + 40) restAt = t + 1500 + Math.random() * 2500;
      const now = plan.find((p) => x >= p.at && x < p.at + p.len)?.who ?? null;
      if (now !== on) {
        on = now;
        setUp(now);
      }
      if (bike.current) bike.current.style.transform = `translateX(${x}px)`;
      if (chaser.current) chaser.current.style.transform = `translateX(${sx}px)`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={strip} aria-hidden className="era-rossi">
      <div ref={chaser} className="era-rossi-bike" style={{ transform: `translateX(${-RIDE_W - STONER_W - 160}px)` }}>
        <Bike who="stoner" up={up === "stoner"} />
      </div>
      <div ref={bike} className="era-rossi-bike" style={{ transform: `translateX(${-RIDE_W - 40}px)` }}>
        <Bike who="rossi" up={up === "rossi"} />
      </div>
    </div>
  );
}
