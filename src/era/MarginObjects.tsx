import { useState, type CSSProperties } from "react";
import { byId } from "./cars";

/**
 * Things laid in the margins beside the page: taped-down prints and the
 * digicams of the time, each at its own angle, the way objects sit around a
 * desk rather than floating. Wide screens only; below that there is no margin
 * to put them in.
 *
 * One camera, chosen by theme so it always stands out from the page: the
 * black Canon on the light page, the silver Cyber-shot on the dark one.
 * Hover it and it says something, press it and the flash goes.
 */
type Spot = { side: "l" | "r"; top: number; x: number; rot: number };
type Print = Spot & { src: string; w: number; ratio: number; caption: string; tone: string };

const delta = byId("delta-integrale");
const r26 = byId("r26");
const mp422 = byId("mp4-22");
const impreza = byId("impreza");
const evo = byId("evo");

const CAMERA: Spot & { w: number } = { side: "l", top: 190, x: 0, rot: -11, w: 170 };

const prints: Print[] = [
  { side: "r", top: 150, x: 10, rot: 5, src: delta.src, w: 190, ratio: delta.ratio, caption: "Martini Delta", tone: "sky" },
  { side: "l", top: 1600, x: 20, rot: 4, src: evo.src, w: 180, ratio: evo.ratio, caption: "Lancer Evo", tone: "sun" },
  { side: "r", top: 1500, x: 0, rot: -6, src: r26.src, w: 200, ratio: r26.ratio, caption: "Renault R26", tone: "pit" },
  { side: "r", top: 2620, x: 10, rot: 4, src: mp422.src, w: 196, ratio: mp422.ratio, caption: "McLaren MP4-22", tone: "pit" },
  { side: "l", top: 3020, x: 0, rot: -5, src: impreza.src, w: 180, ratio: impreza.ratio, caption: "Impreza", tone: "sky" },
];

const LINES = ["You look good.", "Hold that smile.", "Looking sharp.", "Nice shot."];

// Centred in its margin, then nudged, so it keeps its place at any window
// width instead of drifting toward the page or the edge.
const place = (s: Spot, w: number): CSSProperties => ({
  top: s.top,
  [s.side === "l" ? "left" : "right"]: `calc((50% - var(--col) / 2) / 2 - ${w / 2}px + ${s.x}px)`,
  transform: `rotate(${s.rot}deg)`,
  width: w,
});

export default function MarginObjects() {
  const [flash, setFlash] = useState(0);
  const [line, setLine] = useState(0);
  const said = LINES[Math.max(0, line - 1) % LINES.length];

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
        style={place(CAMERA, CAMERA.w)}
        aria-label="Take a photo"
        // A new line each time the pointer arrives, not on every frame it is there.
        onPointerEnter={() => setLine((n) => n + 1)}
        onClick={() => setFlash((n) => n + 1)}
      >
        <span aria-hidden className="era-bubble" style={{ transform: `translateX(-50%) rotate(${-CAMERA.rot}deg)` }}>
          {said}
        </span>
        <img className="era-cam-light" src="/era/camera-canon.png" alt="" width={CAMERA.w} height={Math.round((CAMERA.w * 297) / 480)} />
        <img className="era-cam-dark" src="/era/camera-sony-silver.png" alt="" width={CAMERA.w} height={Math.round((CAMERA.w * 293) / 480)} />
      </button>


      {flash > 0 && <span key={flash} aria-hidden className="era-flash" />}
    </>
  );
}
