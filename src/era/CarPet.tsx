import { useEffect, useRef } from "react";
import { byId } from "./cars";

/**
 * A small F2004 that follows the pointer around the page, the way oneko's cat
 * does: it drives up behind the cursor, brakes, and waits until the
 * cursor moves off again. On touch screens it drives to wherever was tapped.
 * The sprite faces left, so it is mirrored when driving right.
 */
const W = 84;
const MAX = 7; // px per frame at full speed
const STOP = 46; // close enough: park and idle

export default function CarPet() {
  const car = byId("f2004");
  const el = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const h = W / car.ratio;
    let x = 24;
    let y = window.innerHeight - h - 24;
    let tx = x;
    let ty = y;
    let v = 0;
    let face = 1; // 1 = left, as drawn
    let raf = 0;

    // The car parks just below and to one side of the pointer, never under
    // it, so it doesn't cover what the cursor is pointing at.
    const aim = (cx: number, cy: number) => {
      tx = cx + (cx > x + W / 2 ? -W - 10 : 14);
      ty = cy + 12;
    };
    const onMove = (e: PointerEvent) => aim(e.clientX, e.clientY);
    const onResize = () => {
      x = Math.min(x, window.innerWidth - W);
      y = Math.min(y, window.innerHeight - h);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("resize", onResize);

    const frame = () => {
      const dx = tx - x;
      const dy = ty - y;
      const d = Math.hypot(dx, dy);
      const moving = d > STOP;
      // Accelerate towards full speed, brake hard when inside the stop radius.
      v = moving ? Math.min(MAX, v + 0.35, d / 10) : v * 0.7;
      if (v > 0.05 && d > 0.5) {
        x += (dx / d) * v;
        y += (dy / d) * v;
      }
      if (Math.abs(dx) > 8 && moving) face = dx < 0 ? 1 : -1;
      x = Math.max(0, Math.min(window.innerWidth - W, x));
      y = Math.max(0, Math.min(window.innerHeight - h, y));
      if (el.current) el.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (body.current) {
        // Flat at all times: an F1 car neither bounces nor tilts.
        body.current.style.transform = `scaleX(${face})`;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, [car.ratio]);

  return (
    // data-onee-avoid: the mascot keeps clear of this car (src/lib/onee.ts).
    <div ref={el} aria-hidden className="era-pet" data-onee-avoid="body" style={{ width: W }}>
      <span ref={body} className="era-pet-body">
        <img src={car.src} alt="" width={W} height={Math.round(W / car.ratio)} />
      </span>
    </div>
  );
}
