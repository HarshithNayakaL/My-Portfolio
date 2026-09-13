/**
 * The refraction filter for the nav bar.
 *
 * `backdrop-filter: blur(...) url(#id)` does not work — Chromium drops the
 * blur as soon as a filter reference joins the chain. Putting the blur inside
 * the SVG filter keeps both, so the whole effect is one reference: blur the
 * backdrop, lift its saturation, then bend it through a displacement map.
 *
 * The map is a vertical gradient. feDisplacementMap reads 128 as "no offset",
 * so green at 255 along the top rim pulls the sample downward and 0 along the
 * bottom pulls it up — content compresses into both edges the way it does
 * through the rim of a real lens, and the middle, where the map sits at 128,
 * stays put. It is uniform horizontally, so it stretches to any bar width
 * without distorting; the bar's height is fixed, which is the axis that
 * matters.
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
      `<stop offset='0' stop-color='rgb(128,255,128)'/>` +
      `<stop offset='${BAND}' stop-color='rgb(128,128,128)'/>` +
      `<stop offset='${1 - BAND}' stop-color='rgb(128,128,128)'/>` +
      `<stop offset='1' stop-color='rgb(128,0,128)'/>` +
      `</linearGradient></defs><rect width='64' height='54' fill='url(%23b)'/></svg>`,
  );

function Glass({ id, brightness }: { id: string; brightness: number }) {
  return (
    <filter
      id={id}
      x="0"
      y="0"
      width="100%"
      height="100%"
      colorInterpolationFilters="sRGB"
    >
      <feImage href={MAP} result="MAP" preserveAspectRatio="none" />
      <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="BLUR" />
      <feColorMatrix in="BLUR" type="saturate" values="1.9" result="RICH" />
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
        <Glass id="nav-glass" brightness={1.06} />
        <Glass id="nav-glass-dark" brightness={0.82} />
      </defs>
    </svg>
  );
}
