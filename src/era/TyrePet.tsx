import { useEffect, useRef } from "react";

/**
 * A Pirelli tyre that follows the pointer, the way oneko's cat does: it rolls
 * up beside the cursor, stops, and waits until the cursor moves off again.
 * It turns by exactly the distance it covers, so it rolls rather than slides.
 */
const D = 46; // diameter, px
const MAX = 7; // px per frame at full speed
const STOP = 40; // close enough: stop and wait

export default function TyrePet() {
  const el = useRef<HTMLDivElement>(null);
  const wheel = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Not tied to prefers-reduced-motion, for the reason Onee isn't (see
    // OneeCompanion): Windows sets it when animation effects are turned off
    // for speed, and the owner's machine is set that way. A display setting is
    // not a request to take the tyre away.
    let x = 24;
    let y = window.innerHeight - D - 24;
    let tx = x;
    let ty = y;
    let v = 0;
    let turn = 0; // degrees
    let raf = 0;

    // Stops just below and to one side of the pointer, never under it, so it
    // doesn't cover what the cursor is pointing at.
    const aim = (cx: number, cy: number) => {
      tx = cx + (cx > x + D / 2 ? -D - 10 : 14);
      ty = cy + 14;
    };
    const onMove = (e: PointerEvent) => aim(e.clientX, e.clientY);
    const onResize = () => {
      x = Math.min(x, window.innerWidth - D);
      y = Math.min(y, window.innerHeight - D);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("resize", onResize);

    const frame = () => {
      const dx = tx - x;
      const dy = ty - y;
      const d = Math.hypot(dx, dy);
      v = d > STOP ? Math.min(MAX, v + 0.35, d / 10) : v * 0.7;
      if (v > 0.05 && d > 0.5) {
        const sx = (dx / d) * v;
        const sy = (dy / d) * v;
        x = Math.max(0, Math.min(window.innerWidth - D, x + sx));
        y = Math.max(0, Math.min(window.innerHeight - D, y + sy));
        // Rolling: the rim turns by the arc it travels, clockwise going right.
        turn += ((Math.hypot(sx, sy) * (sx >= 0 ? 1 : -1)) / (D / 2)) * (180 / Math.PI);
      }
      if (el.current) el.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (wheel.current) wheel.current.style.transform = `rotate(${turn}deg)`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    // data-onee-avoid: the mascot keeps clear of this (src/lib/onee.ts).
    <div ref={el} aria-hidden className="era-pet" data-onee-avoid="body" style={{ width: D, height: D }}>
      {/* Lazy, so a phone, where the tyre is hidden, never fetches it. */}
      <img ref={wheel} src="/era/tyre.webp" alt="" width={D} height={D} loading="lazy" decoding="async" />
    </div>
  );
}
