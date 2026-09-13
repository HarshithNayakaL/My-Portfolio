import { useEffect } from "react";
import { bevelMap } from "../lib/bevelMap";

/**
 * The glass filter for the nav bar, built to the parameter set at
 * https://liquid-glass.ybouane.com — same names, same meanings, same defaults.
 * That library needs its WebGL canvas sized to everything it refracts, which
 * this page is far too tall for, so the effect is rebuilt here as one SVG
 * filter referenced from backdrop-filter. Adjust it from CONFIG below.
 *
 * The blur lives inside the filter rather than beside it in the CSS chain:
 * Chromium drops a blur() as soon as a url() joins the chain.
 */
const CONFIG = {
  /** 0 = sharp, 1 = maximum blur. */
  blurAmount: 0.16,
  /** How much the glass bends light. */
  refraction: 0.69,
  /** Colour fringing at the edges. */
  chromAberration: 0.05,
  /** Inner glow / rim lighting. */
  edgeHighlight: 0.05,
  /** Specular highlight. */
  specular: 0,
  /** Reflection at grazing angles, which is to say along the rim. */
  fresnel: 1,
  /** -0.5 to 0.5 */
  brightness: 0,
  /** -1 to 1 */
  saturation: 0,
  /**
   * Corner radius and bevel depth, in CSS px. The playground's 40/40 is for a
   * panel taller than this bar: the bar is a 54px stadium, so its corner
   * radius is 27 by definition and a 40px bevel would have no flat middle left
   * to be flat. Both are clamped to half the height.
   */
  cornerRadius: 27,
  zRadius: 22,
  /** 0 = biconvex pill, 1 = dome. */
  bevelMode: 0 as 0 | 1,
};

/** blurAmount is 0..1; 1 is a blur wide enough to erase a bar this tall. */
const BLUR_PX = CONFIG.blurAmount * 40;
/** How far a bevel this deep throws the sample at full tilt. */
const SCALE = CONFIG.refraction * CONFIG.zRadius;

/**
 * The map the filter starts with, before one is painted at the bar's measured
 * size. A vertical gradient gets the long edges right, which is most of the
 * bar; the effect below replaces it with one that follows the rounded ends.
 */
const FALLBACK_MAP =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='54' preserveAspectRatio='none'>` +
      `<defs><linearGradient id='b' x1='0' y1='0' x2='0' y2='1'>` +
      `<stop offset='0' stop-color='rgb(128,0,128)'/>` +
      `<stop offset='0.4' stop-color='rgb(128,128,0)'/>` +
      `<stop offset='0.6' stop-color='rgb(128,128,0)'/>` +
      `<stop offset='1' stop-color='rgb(128,255,128)'/>` +
      `</linearGradient></defs><rect width='64' height='54' fill='url(%23b)'/></svg>`,
  );

/** Keep one channel, and make it opaque so the screen below reconstructs. */
const only = {
  r: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1",
  g: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 0 1",
  b: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 0 1",
};

function Glass({ id, tint }: { id: string; tint: number }) {
  const bright = 1 + CONFIG.brightness + tint;
  const pass = (ch: "r" | "g" | "b", scale: number) => (
    <>
      <feDisplacementMap
        in="LIT"
        in2="MAP"
        scale={scale}
        xChannelSelector="R"
        yChannelSelector="G"
        result={`D${ch}`}
      />
      <feColorMatrix in={`D${ch}`} type="matrix" values={only[ch]} result={`C${ch}`} />
    </>
  );
  return (
    <filter
      id={id}
      /* The region has to reach well past the bar. Each rim samples from
         outside it, and where the region ends the source is empty, so a region
         clipped to the element leaves a hard seam across the bar where the
         displaced band runs out of pixels. Measured as the worst row-to-row
         jump on a smooth backdrop: 17.1 at the element bounds, 13.8 at 130%,
         1.2 at 220% — against 1.2 for a plain blur displacing nothing. */
      x="-60%"
      y="-60%"
      width="220%"
      height="220%"
      colorInterpolationFilters="sRGB"
    >
      <feImage id={`${id}-map`} href={FALLBACK_MAP} result="MAP" preserveAspectRatio="none" />
      <feGaussianBlur in="SourceGraphic" stdDeviation={BLUR_PX} result="BLUR" />
      <feColorMatrix in="BLUR" type="saturate" values={String(1 + CONFIG.saturation)} result="RICH" />
      <feColorMatrix
        in="RICH"
        type="matrix"
        values={`${bright} 0 0 0 0  0 ${bright} 0 0 0  0 0 ${bright} 0 0  0 0 0 1 0`}
        result="LIT"
      />
      {/* Refraction, three times over: each colour channel lands a fraction
          apart, which is the fringing real glass shows at its rim. */}
      {pass("r", SCALE * (1 + CONFIG.chromAberration))}
      {pass("g", SCALE)}
      {pass("b", SCALE * (1 - CONFIG.chromAberration))}
      <feBlend in="Cr" in2="Cg" mode="screen" result="RG" />
      <feBlend in="RG" in2="Cb" mode="screen" result="BENT" />
      {/* Edge highlight and fresnel, both drawn through the map's blue
          channel — the steepness of the bevel, which peaks along the rim and
          is exactly where a grazing reflection lands. */}
      <feColorMatrix
        in="MAP"
        type="matrix"
        values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 ${
          (CONFIG.edgeHighlight + CONFIG.specular) * CONFIG.fresnel * 6
        } 0 0`}
        result="RIM"
      />
      <feFlood floodColor="#fff" result="LIGHT" />
      <feComposite in="LIGHT" in2="RIM" operator="in" result="GLOW" />
      <feBlend in="BENT" in2="GLOW" mode="screen" />
    </filter>
  );
}

export default function GlassFilter() {
  // Paint the map at the bar's real size, and again whenever that changes.
  useEffect(() => {
    const pill = document.querySelector<HTMLElement>(".nav-pill");
    if (!pill) return;
    let last = "";
    const paint = () => {
      const { width, height } = pill.getBoundingClientRect();
      if (width < 2 || height < 2) return;
      const key = `${Math.round(width)}x${Math.round(height)}`;
      if (key === last) return;
      last = key;
      const url = bevelMap(width, height, {
        zRadius: CONFIG.zRadius,
        cornerRadius: CONFIG.cornerRadius,
        bevelMode: CONFIG.bevelMode,
      });
      if (!url) return;
      for (const id of ["nav-glass-map", "nav-glass-dark-map"]) {
        document.getElementById(id)?.setAttribute("href", url);
      }
    };
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(pill);
    return () => ro.disconnect();
  }, []);

  return (
    <svg width="0" height="0" aria-hidden focusable="false" className="sr-filter">
      <defs>
        {/* One tint step apart, so the bar sits just off its own canvas in
            each theme rather than vanishing into it. */}
        <Glass id="nav-glass" tint={0.02} />
        <Glass id="nav-glass-dark" tint={-0.06} />
      </defs>
    </svg>
  );
}
