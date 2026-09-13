import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * A refracting glass panel, adapted from React Bits' GlassSurface.
 *
 * The effect is a `backdrop-filter` pointed at an SVG filter: a displacement
 * map is drawn at runtime as a data: URL sized to the element, then the red,
 * green and blue channels are displaced by slightly different amounts and
 * recombined, which is what produces the chromatic fringe at the edges. That
 * is real refraction rather than a blur, and it is the part of "liquid glass"
 * a plain `blur()` cannot fake.
 *
 * Three things are changed from the original, all because of this site:
 *
 *   - Theming. The original switches on `light-dark()` and
 *     `prefers-color-scheme`. This site has no `color-scheme` declared and
 *     themes itself by toggling `.dark` on <html>, so both would have ignored
 *     the toggle and followed the OS instead. The CSS keys off `.dark`.
 *   - Palette. Its shadows are blue (`rgba(31, 38, 135, …)`), which fights a
 *     terracotta-on-neutral page. They use the site's own glass tokens.
 *   - Sizing. The original takes fixed pixel dimensions. `auto` is allowed
 *     here so a pill can hug its contents, the displacement map being
 *     generated from the measured box either way.
 *   - `backgroundOpacity` is replaced by `frostBlur`. Displacement moves the
 *     backdrop without hiding it, so on its own the page drove straight
 *     through the nav and the links stopped being readable; the blur is what
 *     makes the panel legible and the filter is what makes it look like glass.
 *     A tint opacity was the wrong knob — the site's own glass token already
 *     supplies the fill.
 *
 * `backdrop-filter: url(#…)` is Chromium-only. Safari and Firefox get the
 * frosted-blur fallback, which is what the site already looked like.
 */
type Props = {
  children?: ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  frostBlur?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: "R" | "G" | "B";
  yChannel?: "R" | "G" | "B";
  mixBlendMode?: string;
  className?: string;
  style?: CSSProperties;
};

export default function GlassSurface({
  children,
  width = "100%",
  height = "auto",
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0,
  frostBlur = 28,
  saturation = 1.8,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = "R",
  yChannel = "G",
  mixBlendMode = "difference",
  className = "",
  style = {},
}: Props) {
  const uid = useId().replace(/:/g, "-");
  const filterId = `glass-filter-${uid}`;
  const redGradId = `red-grad-${uid}`;
  const blueGradId = `blue-grad-${uid}`;

  const [refracts, setRefracts] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const feImageRef = useRef<SVGFEImageElement>(null);
  const redRef = useRef<SVGFEDisplacementMapElement>(null);
  const greenRef = useRef<SVGFEDisplacementMapElement>(null);
  const blueRef = useRef<SVGFEDisplacementMapElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);

  useEffect(() => {
    const draw = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      const w = rect?.width || 400;
      const h = rect?.height || 200;
      const edge = Math.min(w, h) * (borderWidth * 0.5);
      const svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient><linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient></defs><rect x="0" y="0" width="${w}" height="${h}" fill="black"/><rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#${redGradId})"/><rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode:${mixBlendMode}"/><rect x="${edge}" y="${edge}" width="${w - edge * 2}" height="${h - edge * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)"/></svg>`;
      feImageRef.current?.setAttribute("href", `data:image/svg+xml,${encodeURIComponent(svg)}`);

      for (const [ref, offset] of [
        [redRef, redOffset],
        [greenRef, greenOffset],
        [blueRef, blueOffset],
      ] as const) {
        ref.current?.setAttribute("scale", String(distortionScale + offset));
        ref.current?.setAttribute("xChannelSelector", xChannel);
        ref.current?.setAttribute("yChannelSelector", yChannel);
      }
      blurRef.current?.setAttribute("stdDeviation", String(displace));
    };

    draw();
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver(draw);
    observer.observe(node);
    return () => observer.disconnect();
  }, [
    width, height, borderRadius, borderWidth, brightness, opacity, blur,
    displace, distortionScale, redOffset, greenOffset, blueOffset,
    xChannel, yChannel, mixBlendMode, redGradId, blueGradId,
  ]);

  // Only Chromium accepts an SVG filter in backdrop-filter. Everything else
  // takes the frosted fallback, so this is checked rather than assumed — and
  // it runs after mount, which keeps the prerendered markup and the first
  // client render identical.
  useEffect(() => {
    const probe = document.createElement("div");
    probe.style.backdropFilter = `url(#${filterId})`;
    setRefracts(probe.style.backdropFilter !== "");
  }, [filterId]);

  return (
    <div
      ref={containerRef}
      className={`glass-surface ${refracts ? "glass-surface--refract" : "glass-surface--frost"} ${className}`}
      style={
        {
          ...style,
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
          borderRadius: `${borderRadius}px`,
          "--glass-blur": `${frostBlur}px`,
          "--glass-sat": saturation,
          "--glass-filter": `url(#${filterId})`,
        } as CSSProperties
      }
    >
      <svg className="glass-surface__filter" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
            <feDisplacementMap ref={redRef} in="SourceGraphic" in2="map" result="dispRed" />
            <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
            <feDisplacementMap ref={greenRef} in="SourceGraphic" in2="map" result="dispGreen" />
            <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
            <feDisplacementMap ref={blueRef} in="SourceGraphic" in2="map" result="dispBlue" />
            <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur ref={blurRef} in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>
      <div className="glass-surface__content">{children}</div>
    </div>
  );
}
