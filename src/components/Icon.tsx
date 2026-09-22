import type { CSSProperties } from "react";

type IconName = "plus" | "arrow-right" | "arrow-up-right";

/**
 * A decorative icon drawn by CSS (.icon-* in index.css) rather than inline
 * SVG, so a list of nineteen FAQ items doesn't carry nineteen copies of the
 * same path in the HTML. Always aria-hidden: every use sits beside text that
 * already says what the control does. `size` overrides the class default.
 */
export default function Icon({
  name,
  size,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`icon icon-${name}${className ? ` ${className}` : ""}`}
      style={size ? ({ "--icon-size": `${size}px` } as CSSProperties) : undefined}
    />
  );
}
