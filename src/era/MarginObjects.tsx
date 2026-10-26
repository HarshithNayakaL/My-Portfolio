import { useState, type CSSProperties } from "react";

/**
 * The digicam laid in the left margin at an angle, the way an object sits on
 * a desk rather than floating. Wide screens only; below that there is no
 * margin to put it in. (The rally cars sat in the margins as CD albums too,
 * until the owner had them removed.)
 *
 * One camera, chosen by theme so it always stands out from the page: the
 * purple Cyber-shot on the light page, the silver one on the dark page.
 * Hover it and it says something, press it and the flash goes. Both are lazy,
 * so the one hidden by the theme (and both, below the width that shows the
 * margins) is never downloaded.
 */
type Spot = { side: "l" | "r"; top: number; x: number; rot: number };

const CAMERA: Spot & { w: number } = { side: "l", top: 190, x: 0, rot: -11, w: 170 };

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
