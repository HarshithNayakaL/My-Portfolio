import { useEffect, useRef } from "react";
import { cars, type EraCar } from "./cars";

/**
 * A car of the era crossing the page now and then, straight across, left to
 * right or right to left. No suspension bounce: an F1 car on a straight
 * doesn't move.
 *
 * Kept quiet on purpose, at the owner's call that they had become too much:
 * one car at a time, 20-40s apart; once per visit on a phone, where a car
 * covers a large share of the screen; never setting off while the reader is
 * scrolling or has text selected; and only through empty space. Before each
 * run it measures what is on screen and picks a strip that is clear all the
 * way across, typically the gap between one section and the next heading;
 * with none free it waits. The car is placed in the page, not the window,
 * so a scroll mid-run carries it along with its gap instead of over text.
 * (There used to be pairs racing nose to tail every 4-9s, at random heights,
 * through the text.)
 */
const F1 = cars.filter((c) => c.kind === "f1");
const RALLY = cars.filter((c) => c.kind === "rally");
const LEAD = 700;
const GAP_MIN = 20_000;
const GAP_SPREAD = 20_000;
// How long after the last scroll counts as still reading on the move.
const SETTLE = 1500;
// Clear space kept above and below a car in its lane.
const PAD = 8;
// Anything a car must not cross: besides text, the images and controls, and
// whole panels, so a car never threads a card between two lines of its text.
const SOLID =
  "img, svg, video, canvas, input, textarea, select, button, table, details, " +
  ".hg, .era-polaroid, .era-object, .era-box, .era-caps, .era-chips, .wk-card, .pv-bezel, .enq, .qc, .era-garage, " +
  // The section heading bands, hairline to hairline: a car sits in the gap
  // above one, not across its line.
  ".era-section > :first-child";
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

const sizeOf = (car: EraCar) => {
  // Smaller on a phone, where a 120px car is a third of the screen.
  const small = window.innerWidth < 640;
  const w = car.kind === "f1" ? (small ? 78 : 120) : small ? 64 : 98;
  return { w, h: w / car.ratio };
};

/** The window rows, top to bottom, that hold nothing: [top, bottom] pairs. */
function freeRows(skip: Element): [number, number][] {
  const vh = window.innerHeight;
  const taken: [number, number][] = [];
  const add = (r: DOMRect) => {
    if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh) taken.push([r.top, r.bottom]);
  };
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeValue?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const range = document.createRange();
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const el = n.parentElement;
    if (!el || skip.contains(el)) continue;
    const box = el.getBoundingClientRect();
    if (box.bottom < 0 || box.top > vh) continue;
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) add(r);
  }
  for (const el of document.querySelectorAll(SOLID)) if (!skip.contains(el)) add(el.getBoundingClientRect());
  taken.sort((a, b) => a[0] - b[0]);
  // The fixed nav pill sits at the top whatever is under it.
  const free: [number, number][] = [];
  let y = 84;
  for (const [t, b] of taken) {
    if (t > y) free.push([y, Math.min(t, vh)]);
    y = Math.max(y, b);
    if (y >= vh) break;
  }
  if (y < vh) free.push([y, vh]);
  return free;
}

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

    // `y` is where the wheels go, in window coordinates.
    const launch = (car: EraCar, y: number, dir: 1 | -1, speed: number) => {
      const { w, h } = sizeOf(car);
      const img = document.createElement("img");
      img.src = car.src;
      img.alt = "";
      img.width = w;
      img.height = Math.round(h);
      img.className = "era-roamer";
      // The mascot steps out of this car's lane (src/lib/onee.ts).
      img.dataset.oneeAvoid = "lane";
      // The layer spans the page, so this pins the car to its gap there.
      img.style.top = `${y - h - box.getBoundingClientRect().top}px`;
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
      const car = pick(rally ? RALLY : F1);
      const { h } = sizeOf(car);
      const lanes = freeRows(box).filter(([t, b]) => b - t >= h + PAD * 2);
      // Nowhere clear on this screen: try again once the reader has moved on.
      if (!lanes.length) {
        timer = window.setTimeout(run, 3000);
        return;
      }
      const [t, b] = pick(lanes);
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      // Speeds are for a desktop window; a narrow one gets them scaled down
      // so a car is on screen long enough to be seen, not a blur.
      const scale = Math.max(0.4, Math.min(1, window.innerWidth / 1200));
      const speed = (rally ? 420 + Math.random() * 140 : 600 + Math.random() * 220) * scale;
      // Centred in the gap.
      launch(car, (t + b) / 2 + h / 2, dir, speed);
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
