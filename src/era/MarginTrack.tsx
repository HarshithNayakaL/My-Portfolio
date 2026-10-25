import { useEffect, useRef, useState } from "react";
import { byId, type EraCar } from "./cars";

/**
 * A wavy track running down one page margin, with cars driving it.
 *
 * The cars are side-view sprites, so they cannot simply rotate to follow the
 * path: a side view turned through a hairpin ends up upside down. Instead each
 * frame reads the path's tangent, mirrors the sprite when it heads right, and
 * tilts it by the slope, clamped so the hairpins read as turning round rather
 * than flipping over.
 */
const CAR_W = 104;
const MAX_TILT = 18;

function serpentine(w: number, h: number, flip: boolean) {
  const pad = 26;
  const gap = 230; // vertical distance between runs
  const x0 = pad;
  const x1 = Math.max(pad + 80, w - pad);
  let y = 70;
  let atLeft = !flip;
  let d = `M ${atLeft ? x0 : x1} ${y}`;
  while (y + gap < h - 60) {
    const from = atLeft ? x0 : x1;
    const to = atLeft ? x1 : x0;
    const span = to - from;
    // A gentle wave along each run, so it reads as a road, not a ruler line.
    d += ` C ${from + span * 0.3} ${y - 22}, ${from + span * 0.7} ${y + 22}, ${to} ${y}`;
    d += ` A 34 ${gap / 2} 0 0 ${atLeft ? 1 : 0} ${to} ${y + gap}`;
    y += gap;
    atLeft = !atLeft;
  }
  return d;
}

type Rider = { car: EraCar; at: number; speed: number };

export default function MarginTrack({ side, carIds }: { side: "left" | "right"; carIds: string[] }) {
  const box = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const [geo, setGeo] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setGeo({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const p = path.current;
    if (!p || geo.w < 140 || geo.h < 400) return;
    const total = p.getTotalLength();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const riders: Rider[] = carIds.map((id, i) => ({
      car: byId(id),
      at: (total / carIds.length) * i,
      speed: 1.1 + ((i * 37) % 10) / 14,
    }));
    let raf = 0;
    const frame = () => {
      riders.forEach((r, i) => {
        if (!reduce) r.at = (r.at + r.speed) % total;
        const a = p.getPointAtLength(r.at);
        const b = p.getPointAtLength(Math.min(total, r.at + 6));
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const right = dx > 0;
        const slope = (Math.atan2(dy, Math.abs(dx) || 0.0001) * 180) / Math.PI;
        const tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, slope)) * (right ? 1 : -1);
        const el = els.current[i];
        if (el) {
          const h = CAR_W / r.car.ratio;
          el.style.transform =
            `translate(${a.x - CAR_W / 2}px, ${a.y - h + 3}px) rotate(${tilt}deg) scaleX(${right ? -1 : 1})`;
        }
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [geo, carIds]);

  const d = geo.w ? serpentine(geo.w, geo.h, side === "right") : "";

  return (
    <div ref={box} aria-hidden className={`era-margin era-margin-${side}`}>
      <svg width={geo.w} height={geo.h} className="absolute inset-0">
        <path d={d} className="era-road" />
        <path ref={path} d={d} className="era-road-line" />
      </svg>
      {carIds.map((id, i) => {
        const c = byId(id);
        return (
          <div
            key={id}
            ref={(el) => { els.current[i] = el; }}
            className="era-rider"
            style={{ width: CAR_W, height: CAR_W / c.ratio }}
          >
            <img src={c.src} alt="" width={CAR_W} height={Math.round(CAR_W / c.ratio)} decoding="async" />
          </div>
        );
      })}
    </div>
  );
}
