import { useState, type CSSProperties } from "react";
import { byId } from "./cars";

/**
 * Things laid in the margins beside the page: the digicams of the time and a
 * few taped-down prints, each at its own spot and angle, the way objects sit
 * around a desk rather than floating. Wide screens only; below that there is
 * no margin to put them in. The silver Cyber-shot still fires its flash.
 */
type Spot = { side: "l" | "r"; top: number; x: number; rot: number };
type Thing =
  | (Spot & { kind: "object"; src: string; w: number; ratio: number; flash?: boolean })
  | (Spot & { kind: "print"; src: string; w: number; ratio: number; caption: string; tone: string });

const delta = byId("delta-integrale");
const r26 = byId("r26");
const mp422 = byId("mp4-22");
const impreza = byId("impreza");
const evo = byId("evo");

const things: Thing[] = [
  { kind: "object", side: "l", top: 190, x: 0, rot: -11, src: "/era/camera-sony-silver.png", w: 170, ratio: 480 / 293, flash: true },
  { kind: "print", side: "r", top: 150, x: 10, rot: 5, src: delta.src, w: 190, ratio: delta.ratio, caption: "Martini Delta", tone: "sky" },
  { kind: "object", side: "l", top: 860, x: 10, rot: 7, src: "/era/camera-canon.png", w: 160, ratio: 480 / 297 },
  { kind: "object", side: "r", top: 780, x: 0, rot: 9, src: "/era/camera-sony-purple.png", w: 160, ratio: 480 / 291 },
  { kind: "print", side: "l", top: 1600, x: 20, rot: 4, src: evo.src, w: 180, ratio: evo.ratio, caption: "Lancer Evo", tone: "sun" },
  { kind: "print", side: "r", top: 1500, x: 0, rot: -6, src: r26.src, w: 200, ratio: r26.ratio, caption: "Renault R26", tone: "pit" },
  { kind: "print", side: "r", top: 2620, x: 10, rot: 4, src: mp422.src, w: 196, ratio: mp422.ratio, caption: "McLaren MP4-22", tone: "pit" },
  { kind: "print", side: "l", top: 3020, x: 0, rot: -5, src: impreza.src, w: 180, ratio: impreza.ratio, caption: "Impreza", tone: "sky" },
];

export default function MarginObjects() {
  const [flash, setFlash] = useState(0);
  return (
    <>
      {things.map((t, i) => {
        const w = t.kind === "print" ? t.w + 28 : t.w;
        // Centred in its margin, then nudged, so it keeps its place at any
        // window width instead of drifting toward the page or the edge.
        const style = {
          top: t.top,
          [t.side === "l" ? "left" : "right"]: `calc((50% - var(--col) / 2) / 2 - ${w / 2}px + ${t.x}px)`,
          transform: `rotate(${t.rot}deg)`,
        } as CSSProperties;
        const img = <img src={t.src} alt="" width={t.w} height={Math.round(t.w / t.ratio)} loading="lazy" decoding="async" />;
        if (t.kind === "print") {
          return (
            <figure key={i} aria-hidden className={`era-print era-print-${t.tone}`} style={{ ...style, width: w }}>
              <span className="era-tape" />
              <span className="era-print-photo">{img}</span>
              <figcaption>{t.caption}</figcaption>
            </figure>
          );
        }
        return t.flash ? (
          <button
            key={i}
            type="button"
            className="era-object era-object-btn"
            style={{ ...style, width: w }}
            aria-label="Take a photo with the Cyber-shot"
            onClick={() => setFlash((n) => n + 1)}
          >
            {img}
          </button>
        ) : (
          <span key={i} aria-hidden className="era-object" style={{ ...style, width: w }}>
            {img}
          </span>
        );
      })}
      {flash > 0 && <span key={flash} aria-hidden className="era-flash" />}
    </>
  );
}
