import { useEffect, useRef } from "react";
import { cars, type EraCar } from "./cars";

/**
 * A car of the era crossing the page now and then, straight across, left to
 * right or right to left. No suspension bounce: an F1 car on a straight
 * doesn't move.
 *
 * Kept quiet on purpose, at the owner's call that they had become too much:
 * one car at a time, 20-40s apart; along the bottom edge of the window, not
 * through the text at a random height; once per visit on a phone, where a
 * car covers a large share of the screen; and never setting off while the
 * reader is scrolling or has text selected. (There used to be pairs racing
 * nose to tail, every 4-9s.)
 */
const F1 = cars.filter((c) => c.kind === "f1");
const RALLY = cars.filter((c) => c.kind === "rally");
const LEAD = 700;
const GAP_MIN = 20_000;
const GAP_SPREAD = 20_000;
// How long after the last scroll counts as still reading on the move.
const SETTLE = 1500;
const pick = (pool: EraCar[]) => pool[Math.floor(Math.random() * pool.length)];

export default function RoamingCars() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = layer.current;
    // Not tied to prefers-reduced-motion, for the reason Onee isn't (see
    // OneeCompanion): Windows sets it when animation effects are turned off
    // for speed, and the owner's machine is set that way. A display setting is
    // not a request to take the cars away.
    if (!box) return;
    let timer = 0;
    let crossing = false;
    let crossed = 0;
    let lastScroll = 0;
    const onScroll = () => {
      lastScroll = performance.now();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const launch = (car: EraCar, y: number, dir: 1 | -1, speed: number) => {
      // Smaller on a phone, where a 120px car is a third of the screen.
      const small = window.innerWidth < 640;
      const w = car.kind === "f1" ? (small ? 78 : 120) : small ? 64 : 98;
      const h = w / car.ratio;
      const img = document.createElement("img");
      img.src = car.src;
      img.alt = "";
      img.width = w;
      img.height = Math.round(h);
      img.className = "era-roamer";
      // The mascot steps out of this car's lane (src/lib/onee.ts).
      img.dataset.oneeAvoid = "lane";
      img.style.top = `${y - h}px`;
      box.appendChild(img);
      const vw = window.innerWidth;
      // Each run starts LEAD px offscreen: the car is already in its lane,
      // out of sight, for about a second before it appears, which is the
      // warning the mascot needs to step out of the road (src/lib/onee.ts).
      const lead = LEAD * Math.max(0.4, Math.min(1, vw / 1200));
      const from = dir > 0 ? -w - lead : vw + lead;
      const to = dir > 0 ? vw + w + 160 : -w - 160;
      const flip = dir > 0 ? -1 : 1; // drawn facing left
      const anim = img.animate(
        [
          { transform: `translateX(${from}px) scaleX(${flip})` },
          { transform: `translateX(${to}px) scaleX(${flip})` },
        ],
        { duration: (Math.abs(to - from) / speed) * 1000, easing: "linear" },
      );
      crossing = true;
      anim.onfinish = () => {
        img.remove();
        crossing = false;
      };
    };

    const run = () => {
      const phone = window.innerWidth < 640;
      if (phone && crossed >= 1) return;
      const reading =
        performance.now() - lastScroll < SETTLE || (window.getSelection()?.toString().trim().length ?? 0) > 0;
      // Busy (hidden tab, a car still out, someone mid-scroll or selecting):
      // look again shortly rather than waiting out a whole gap.
      if (document.hidden || crossing || reading) {
        timer = window.setTimeout(run, 2000);
        return;
      }
      const rally = Math.random() < 0.3;
      const pool = rally ? RALLY : F1;
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      // Wheels on the bottom edge of the window, clear of the text.
      const y = window.innerHeight - 2;
      // Speeds are for a desktop window; a narrow one gets them scaled down
      // so a car is on screen long enough to be seen, not a blur.
      const scale = Math.max(0.4, Math.min(1, window.innerWidth / 1200));
      const speed = (rally ? 420 + Math.random() * 140 : 600 + Math.random() * 220) * scale;
      launch(pick(pool), y, dir, speed);
      crossed++;
      if (!phone) timer = window.setTimeout(run, GAP_MIN + Math.random() * GAP_SPREAD);
    };
    timer = window.setTimeout(run, 6000);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      box.replaceChildren();
    };
  }, []);

  return <div ref={layer} aria-hidden className="era-roam" />;
}
