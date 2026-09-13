/**
 * Displacement map for the bar's bevel.
 *
 * feDisplacementMap reads a channel value of 128 as "no offset", 255 as +half
 * the scale and 0 as -half, so the map encodes, per pixel, which way the glass
 * surface is tilted and how steeply — the surface normal of the bevel, in R
 * (x) and G (y). Blue carries the steepness on its own, which is the mask the
 * edge highlight and the fresnel term are drawn through.
 *
 * Derived from the rounded rectangle's signed distance field so the bevel
 * follows the whole outline: the rounded ends bend what is behind them the way
 * the long edges do. Painted at the bar's real size rather than stretched from
 * a fixed image, since the bar's width tracks the viewport while its height
 * does not.
 */
export type Bevel = {
  /** `zRadius`: bevel depth, how far in from the edge the curvature reaches. */
  zRadius: number;
  /** `cornerRadius`, in CSS px. */
  cornerRadius: number;
  /** `bevelMode`: 0 = biconvex pill, 1 = dome (flat bottom). */
  bevelMode: 0 | 1;
};

/** Signed distance to a rounded rectangle: negative inside, zero on the edge. */
function distance(px: number, py: number, hw: number, hh: number, r: number) {
  const qx = Math.abs(px) - hw + r;
  const qy = Math.abs(py) - hh + r;
  return (
    Math.min(Math.max(qx, qy), 0) +
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) -
    r
  );
}

/** Outward normal, from whichever part of the outline is nearest. */
function normal(px: number, py: number, hw: number, hh: number, r: number) {
  const qx = Math.abs(px) - hw + r;
  const qy = Math.abs(py) - hh + r;
  const sx = Math.sign(px) || 1;
  const sy = Math.sign(py) || 1;
  if (qx > 0 && qy > 0) {
    const len = Math.hypot(qx, qy) || 1;
    return [(qx / len) * sx, (qy / len) * sy];
  }
  return qx > qy ? [sx, 0] : [0, sy];
}

export function bevelMap(
  width: number,
  height: number,
  { zRadius, cornerRadius, bevelMode }: Bevel,
): string {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(w, h);
  const hw = w / 2;
  const hh = h / 2;
  const r = Math.min(cornerRadius, hw, hh);
  const band = Math.max(1, Math.min(zRadius, hw, hh));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - hw;
      const py = y + 0.5 - hh;
      const inward = -distance(px, py, hw, hh, r);
      // 1 at the rim, 0 at `zRadius` deep and beyond.
      const u = Math.min(Math.max(inward / band, 0), 1);
      // Quarter-circle cross-section: steepest at the edge, easing to flat.
      // That profile is what reads as a lens rather than a chamfer.
      let tilt = Math.sqrt(Math.max(0, 1 - u * u));
      // Ease the outermost pixels back to nothing, or the three colour passes
      // separate against a hard boundary and the rim shows a coloured line
      // instead of a fringe.
      tilt *= Math.min(1, Math.max(0, inward / 2.5));
      let [nx, ny] = normal(px, py, hw, hh, r);
      // Dome: flat underside, so only the upper half is curved.
      if (bevelMode === 1 && py > 0) {
        ny = 0;
        tilt *= Math.max(0, 1 - py / hh);
      }
      const i = (y * w + x) * 4;
      // Each rim reaches outward for its content, which is the direction a
      // lens bends light. Reversed, the two halves reach across each other and
      // collide at the bar's waist, leaving a hard horizontal seam.
      img.data[i] = Math.round(128 + nx * tilt * 127);
      img.data[i + 1] = Math.round(128 + ny * tilt * 127);
      img.data[i + 2] = Math.round(tilt * 255);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}
