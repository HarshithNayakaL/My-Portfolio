import { useEffect, useState, type CSSProperties } from "react";
import { byId } from "./cars";

/**
 * Things laid in the margins beside the page: taped-down prints and the
 * digicams of the time, each at its own angle, the way objects sit around a
 * desk rather than floating. Wide screens only; below that there is no margin
 * to put them in.
 *
 * The silver Cyber-shot is the big one, and it is a camera: hover it and it
 * says something, press it and the flash goes. The other two are pocket-sized
 * and land somewhere different on every visit.
 */
type Spot = { side: "l" | "r"; top: number; x: number; rot: number };
type Print = Spot & { src: string; w: number; ratio: number; caption: string; tone: string };

const delta = byId("delta-integrale");
const r26 = byId("r26");
const mp422 = byId("mp4-22");
const impreza = byId("impreza");
const evo = byId("evo");

const SILVER: Spot & { w: number; ratio: number } = { side: "l", top: 190, x: 0, rot: -11, w: 170, ratio: 480 / 293 };

const prints: Print[] = [
  { side: "r", top: 150, x: 10, rot: 5, src: delta.src, w: 190, ratio: delta.ratio, caption: "Martini Delta", tone: "sky" },
  { side: "l", top: 1600, x: 20, rot: 4, src: evo.src, w: 180, ratio: evo.ratio, caption: "Lancer Evo", tone: "sun" },
  { side: "r", top: 1500, x: 0, rot: -6, src: r26.src, w: 200, ratio: r26.ratio, caption: "Renault R26", tone: "pit" },
  { side: "r", top: 2620, x: 10, rot: 4, src: mp422.src, w: 196, ratio: mp422.ratio, caption: "McLaren MP4-22", tone: "pit" },
  { side: "l", top: 3020, x: 0, rot: -5, src: impreza.src, w: 180, ratio: impreza.ratio, caption: "Impreza", tone: "sky" },
];

// The small cameras: icon-sized, little things left about the desk.
const SMALL_W = 62;
const small = [
  { src: "/era/camera-canon.png", ratio: 480 / 297 },
  { src: "/era/camera-sony-purple.png", ratio: 480 / 291 },
];
// The gaps between the prints, on both sides, where a small camera can land.
const SLOTS: Pick<Spot, "side" | "top">[] = [
  { side: "l", top: 640 }, { side: "l", top: 1080 }, { side: "l", top: 2180 }, { side: "l", top: 2560 }, { side: "l", top: 3460 },
  { side: "r", top: 620 }, { side: "r", top: 1020 }, { side: "r", top: 2060 }, { side: "r", top: 3160 }, { side: "r", top: 3520 },
];
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

/** Two slots, never side by side: different sides, or far apart on one. */
function scatter(): Spot[] {
  const a = SLOTS[Math.floor(Math.random() * SLOTS.length)];
  const rest = SLOTS.filter((s) => s.side !== a.side || Math.abs(s.top - a.top) > 900);
  const b = rest[Math.floor(Math.random() * rest.length)];
  return [a, b].map((s) => ({ ...s, x: Math.round(rand(-45, 45)), rot: Math.round(rand(-16, 16)) }));
}

const LINES = ["You look good.", "Hold that smile.", "Looking sharp.", "Nice shot."];

// Centred in its margin, then nudged, so it keeps its place at any window
// width instead of drifting toward the page or the edge.
// The left margin also holds the section rail beside the page, so things on
// that side sit RAIL_ROOM further out.
const RAIL_ROOM = 50;
const place = (s: Spot, w: number): CSSProperties => ({
  top: s.top,
  [s.side === "l" ? "left" : "right"]: `calc((50% - var(--col) / 2) / 2 - ${w / 2}px + ${s.x - (s.side === "l" ? RAIL_ROOM : 0)}px)`,
  transform: `rotate(${s.rot}deg)`,
  width: w,
});

export default function MarginObjects() {
  const [flash, setFlash] = useState(0);
  const [line, setLine] = useState(0);
  const said = LINES[Math.max(0, line - 1) % LINES.length];
  // Chosen after hydration: the page is prerendered, and a random spot in the
  // server's HTML would differ from the browser's first render.
  const [spots, setSpots] = useState<Spot[] | null>(null);
  useEffect(() => setSpots(scatter()), []);

  return (
    <>
      {prints.map((t) => (
        <figure key={t.caption} aria-hidden className={`era-print era-print-${t.tone}`} style={place(t, t.w + 28)}>
          <span className="era-tape" />
          <span className="era-print-photo">
            <img src={t.src} alt="" width={t.w} height={Math.round(t.w / t.ratio)} loading="lazy" decoding="async" />
          </span>
          <figcaption>{t.caption}</figcaption>
        </figure>
      ))}

      <button
        type="button"
        className="era-object era-object-btn"
        style={place(SILVER, SILVER.w)}
        aria-label="Take a photo with the Cyber-shot"
        // A new line each time the pointer arrives, not on every frame it is there.
        onPointerEnter={() => setLine((n) => n + 1)}
        onClick={() => setFlash((n) => n + 1)}
      >
        <span aria-hidden className="era-bubble" style={{ transform: `translateX(-50%) rotate(${-SILVER.rot}deg)` }}>
          {said}
        </span>
        <img src="/era/camera-sony-silver.png" alt="" width={SILVER.w} height={Math.round(SILVER.w / SILVER.ratio)} />
      </button>

      {spots?.map((s, i) => (
        <span key={small[i].src} aria-hidden className="era-object era-object-small" style={place(s, SMALL_W)}>
          <img src={small[i].src} alt="" width={SMALL_W} height={Math.round(SMALL_W / small[i].ratio)} decoding="async" />
        </span>
      ))}

      {flash > 0 && <span key={flash} aria-hidden className="era-flash" />}
    </>
  );
}
