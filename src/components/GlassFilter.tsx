/**
 * The refraction filter for the nav bar.
 *
 * `backdrop-filter: blur(...) url(#id)` does not work — Chromium drops the
 * blur as soon as a filter reference joins the chain. Putting the blur inside
 * the SVG filter keeps both, so the whole effect is one reference: blur the
 * backdrop, lift its saturation, then bend it through a displacement map.
 *
 * The map is a vertical gradient. feDisplacementMap samples at
 * `y + scale * (G/255 - 0.5)`, so each rim has to reach *outward* for its
 * content: G=0 at the top samples from above the bar, G=255 at the bottom
 * samples from below it, and the middle sits at 128 and stays put. Both edges
 * then draw the outside world in and compress it against the rim, which is
 * what a lens does.
 *
 * The signs were the other way round before, which made the top rim sample
 * from below and the bottom rim from above. The two halves reached across each
 * other and met head-on at the bar's waist, leaving a hard horizontal seam
 * with the image mirrored either side of it.
 *
 * Uniform horizontally, so it stretches to any bar width without distorting;
 * the bar's height is fixed, which is the axis that matters.
 *
 * Rendered once, in the prerendered HTML, so the filter exists before the
 * bundle arrives. Browsers that do not take a filter reference in
 * backdrop-filter never resolve it — see the @supports gate in index.css.
 */
const BAND = 0.25;
const MAP =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='54' preserveAspectRatio='none'>` +
      `<defs><linearGradient id='b' x1='0' y1='0' x2='0' y2='1'>` +
      `<stop offset='0' stop-color='rgb(128,0,128)'/>` +
      `<stop offset='${BAND}' stop-color='rgb(128,128,128)'/>` +
      `<stop offset='${1 - BAND}' stop-color='rgb(128,128,128)'/>` +
      `<stop offset='1' stop-color='rgb(128,255,128)'/>` +
      `</linearGradient></defs><rect width='64' height='54' fill='url(%23b)'/></svg>`,
  );

function Glass({ id, brightness }: { id: string; brightness: number }) {
  return (
    <filter
      id={id}
      /* The region has to reach well past the bar. Each rim samples from
         outside it, and where the region stops the source is empty, so a
         region clipped to the element leaves a hard horizontal seam across the
         bar where the displaced band runs out of pixels. Measured on a
         text-free strip, worst row-to-row jump: 17.1 at the element bounds,
         13.8 at 130%, 1.2 at 220% — against 1.2 for a plain blur with no
         displacement at all. */
      x="-60%"
      y="-60%"
      width="220%"
      height="220%"
      colorInterpolationFilters="sRGB"
    >
      <feImage href={MAP} result="MAP" preserveAspectRatio="none" />
      <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="BLUR" />
      <feColorMatrix in="BLUR" type="saturate" values="1.65" result="RICH" />
      {/* The luminosity half of Apple's regular variant. The CSS fallback does
          this with brightness(); inside the filter it has to be a matrix. */}
      <feColorMatrix
        in="RICH"
        type="matrix"
        values={`${brightness} 0 0 0 0  0 ${brightness} 0 0 0  0 0 ${brightness} 0 0  0 0 0 1 0`}
        result="LIT"
      />
      <feDisplacementMap
        in="LIT"
        in2="MAP"
        scale="22"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  );
}

export default function GlassFilter() {
  return (
    <svg width="0" height="0" aria-hidden focusable="false" className="sr-filter">
      <defs>
        <Glass id="nav-glass" brightness={1.04} />
        <Glass id="nav-glass-dark" brightness={0.86} />
      </defs>
    </svg>
  );
}
