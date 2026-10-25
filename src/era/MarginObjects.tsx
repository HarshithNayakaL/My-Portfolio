import { useState, type CSSProperties } from "react";
import { byId } from "./cars";

/**
 * Things laid in the margins beside the page, each at its own angle, the way
 * objects sit around a desk rather than floating: the rally cars as CD
 * albums in their jewel cases, the disc half out, and one digicam. Wide
 * screens only; below that there is no margin to put them in.
 *
 * One camera, chosen by theme so it always stands out from the page: the
 * purple Cyber-shot on the light page, the silver one on the dark page.
 * Hover it and it says something, press it and the flash goes. Both are lazy,
 * so the one hidden by the theme (and both, below the width that shows the
 * margins) is never downloaded.
 */
type Spot = { side: "l" | "r"; top: number; x: number; rot: number };
type Album = Spot & { car: string; make: string; model: string; tone: string };

const CAMERA: Spot & { w: number } = { side: "l", top: 190, x: 0, rot: -11, w: 170 };

// The five rally cars, each on a cover in its livery's colours. The disc
// slides out on the side away from the page.
const albums: Album[] = [
  { side: "r", top: 150, x: 6, rot: 5, car: "delta-integrale", make: "Lancia", model: "Delta Integrale", tone: "martini" },
  { side: "l", top: 760, x: -6, rot: -4, car: "celica", make: "Toyota", model: "Celica GT-Four", tone: "castrol" },
  { side: "r", top: 1320, x: 0, rot: -5, car: "impreza", make: "Subaru", model: "Impreza", tone: "555" },
  { side: "l", top: 1880, x: 4, rot: 6, car: "evo", make: "Mitsubishi", model: "Lancer Evolution", tone: "ralliart" },
  { side: "r", top: 2480, x: -4, rot: 4, car: "escort", make: "Ford", model: "Escort RS Cosworth", tone: "rothmans" },
];
const COVER = 162;

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
      {albums.map((a) => {
        const c = byId(a.car);
        const w = 120;
        return (
          <figure key={a.car} aria-hidden className={`era-album era-album-${a.side} tone-${a.tone}`} style={place(a, COVER)}>
            <span className="era-album-disc" />
            <span className="era-album-case">
              <span className="era-album-cover">
                <span className="era-album-title">
                  <span className="block text-[12px] font-semibold leading-none">{a.make}</span>
                  <span className="mt-1 block font-display text-[17px] leading-[1.05]">{a.model}</span>
                </span>
                <img src={c.src} alt="" width={w} height={Math.round(w / c.ratio)} loading="lazy" decoding="async" />
              </span>
            </span>
          </figure>
        );
      })}

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
        <img className="era-cam-light" src="/era/camera-sony-purple.webp" alt="" loading="lazy" width={CAMERA.w} height={Math.round((CAMERA.w * 291) / 480)} />
        <img className="era-cam-dark" src="/era/camera-sony-silver.webp" alt="" loading="lazy" width={CAMERA.w} height={Math.round((CAMERA.w * 293) / 480)} />
      </button>


      {flash > 0 && <span key={flash} aria-hidden className="era-flash" />}
    </>
  );
}
