/**
 * Text drawn the way the displays of the time drew it: a 5 x 7 grid of
 * square pixels per character, with the unlit pixels faintly visible. Each
 * glyph is five columns, top pixel in the lowest bit. Uppercase only, as
 * those displays were.
 */
const GLYPHS: Record<string, string> = {
  " ": "0000000000", "!": "00005F0000", '"': "0007000700", "'": "0000030000", "-": "0808080808", ".": "0000606000",
  ":": "0000140000", "/": "2010080402", "(": "001C224100", ")": "0041221C00",
  "0": "3E5149453E", "1": "00427F4000", "2": "7249494946", "3": "2141494D33", "4": "1814127F10",
  "5": "2745454539", "6": "3C4A494931", "7": "4121110907", "8": "3649494936", "9": "464949291E",
  A: "7C1211127C", B: "7F49494936", C: "3E41414122", D: "7F4141413E", E: "7F49494941", F: "7F09090901",
  G: "3E41415173", H: "7F0808087F", I: "00417F4100", J: "2040413F01", K: "7F08142241", L: "7F40404040",
  M: "7F021C027F", N: "7F0408107F", O: "3E4141413E", P: "7F09090906", Q: "3E4151215E", R: "7F09192946",
  S: "2649494932", T: "03017F0103", U: "3F4040403F", V: "1F2040201F", W: "3F4038403F", X: "6314081463",
  Y: "0304780403", Z: "6159494D43",
};

export default function DotMatrix({ text, cols, px, className }: { text: string; cols: number; px: number; className?: string }) {
  const chars = text.toUpperCase().padEnd(cols, " ").slice(0, cols);
  const lit: string[] = [];
  const dim: string[] = [];
  for (let c = 0; c < cols; c++) {
    const g = GLYPHS[chars[c]] ?? GLYPHS[" "];
    for (let x = 0; x < 5; x++) {
      const col = parseInt(g.slice(x * 2, x * 2 + 2), 16);
      for (let y = 0; y < 7; y++) (col >> y & 1 ? lit : dim).push(`M${c * 6 + x} ${y}h0.82v0.82h-0.82z`);
    }
  }
  return (
    <svg
      aria-hidden
      className={`dm ${className ?? ""}`}
      viewBox={`0 0 ${cols * 6 - 1} 7`}
      width={(cols * 6 - 1) * px}
      height={7 * px}
      shapeRendering="crispEdges"
    >
      <path className="dm-off" d={dim.join("")} />
      <path className="dm-on" d={lit.join("")} />
    </svg>
  );
}
