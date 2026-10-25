import { useEffect, useState } from "react";

/**
 * The opening, after harshitr.me's: a dark drafting sheet on which this
 * page's own layout draws itself, box by box (the frame, the banner, the
 * polaroid, the name, the sections, the cards), and then the sheet lifts
 * away to the real thing.
 *
 * Timed entirely in CSS, so it plays from the prerendered HTML and ends on
 * its own: a visitor without JavaScript still gets the page after it. It is
 * drawn once per visit to the site; coming back to the homepage from a case
 * study goes straight to the page.
 */
let played = false;

export default function Intro() {
  // Read at mount: the server and the hydrating client both see `false` on
  // the first load, so the markup matches; later mounts skip it.
  const [show] = useState(() => !played);
  useEffect(() => {
    played = true;
  }, []);
  if (!show) return null;

  // Each piece draws in order; --d is its delay in seconds.
  const d = (s: number) => ({ ["--d" as string]: `${s}s` });
  return (
    <div aria-hidden className="era-intro">
      <svg viewBox="0 0 820 640" className="era-intro-sheet" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="era-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          </pattern>
        </defs>
        {/* the frame */}
        <rect pathLength={1} className="ln dash" style={d(0)} x="10" y="10" width="800" height="620" rx="22" />
        {/* the banner, and its start gantry */}
        <rect pathLength={1} className="ln" style={d(0.15)} x="40" y="34" width="740" height="170" rx="12" />
        <path pathLength={1} className="ln thin" style={d(0.3)} d="M40 34 L780 204 M780 34 L40 204" />
        <rect pathLength={1} className="ln" style={d(0.35)} x="350" y="46" width="120" height="30" rx="4" />
        {/* the polaroid, tilted */}
        <g transform="rotate(-4 120 300)">
          <rect pathLength={1} className="ln" style={d(0.45)} x="56" y="232" width="128" height="148" />
          <path pathLength={1} className="ln thin" style={d(0.55)} d="M64 240 L176 352 M176 240 L64 352" />
        </g>
        {/* the name, role, place, links */}
        <rect className="fill" style={d(0.6)} x="220" y="262" width="300" height="34" rx="4" />
        <rect className="fill" style={d(0.68)} x="220" y="306" width="120" height="14" rx="3" />
        <rect className="fill" style={d(0.74)} x="220" y="328" width="170" height="12" rx="3" />
        {[0, 1, 2].map((i) => (
          <rect key={i} pathLength={1} className="ln" style={d(0.8 + i * 0.05)} x={220 + i * 92} y="354" width="84" height="26" rx="13" />
        ))}
        {/* about */}
        <rect className="fill" style={d(0.95)} x="40" y="414" width="90" height="16" rx="3" />
        {[0, 1, 2].map((i) => (
          <rect key={i} className="fill soft" style={d(1 + i * 0.05)} x="40" y={442 + i * 16} width={i === 2 ? 520 : 740} height="8" rx="2" />
        ))}
        {/* the record card */}
        <rect pathLength={1} className="ln dash" style={d(1.12)} x="40" y="500" width="740" height="40" rx="10" />
        {/* the first two work cards */}
        {[0, 1].map((i) => (
          <g key={i}>
            <rect pathLength={1} className="ln" style={d(1.22 + i * 0.08)} x={40 + i * 378} y="560" width="362" height="64" rx="12" />
            <rect pathLength={1} className="ln thin" style={d(1.3 + i * 0.08)} x={52 + i * 378} y="572" width="338" height="40" rx="8" />
          </g>
        ))}
      </svg>
    </div>
  );
}
