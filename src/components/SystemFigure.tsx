import type { PipelineStage, PipelineNode } from "../data/caseStudies";

/**
 * A case study's pipeline drawn as an annotated system figure: plain boxes,
 * thin connectors that fan out through a bus, and the rule each gate enforces.
 *
 * Two layouts, chosen by how much width the figure gets:
 *
 * - "wide" (case-study page from xl): stage gutter on the left, the rule as a
 *   serif margin note on a dashed accent leader to the right.
 * - "stacked" (every work card, and the case-study page below xl): one
 *   column, no gutter, numbered gate markers, and the rules as real
 *   text beside or under the figure. A notes column inside the SVG scaled the
 *   whole figure down until labels were 9-11px on a card; as HTML they stay
 *   at body size however narrow the figure gets.
 *
 * Type sizes are audited against the rendered page, not the viewBox: nothing
 * in a figure may draw below 12px, and no serif below 16px.
 */

function wrap(t: string, n: number, max: number): string[] {
  const out: string[] = [];
  let cur = "";
  const words = t
    .split(" ")
    .flatMap((w) => (w.length > n && w.includes("-") ? w.split(/(?<=-)/) : [w]))
    // A single word wider than the line can't wrap and would run out of its
    // box, so it is broken with a hyphen. Rare: only the narrowest boxes.
    .flatMap((w) => {
      if (w.length <= n || n < 4) return [w];
      const parts: string[] = [];
      let rest = w;
      while (rest.length > n) {
        parts.push(rest.slice(0, n - 1) + "-");
        rest = rest.slice(n - 1);
      }
      return [...parts, rest];
    });
  for (const w of words) {
    const sep = cur.endsWith("-") ? "" : " ";
    if (!cur) cur = w;
    else if ((cur + sep + w).length <= n) cur += sep + w;
    else { out.push(cur); cur = w; }
  }
  if (cur) out.push(cur);
  if (out.length > max) {
    const kept = out.slice(0, max);
    kept[max - 1] = kept[max - 1].slice(0, Math.max(1, n - 1)).replace(/\s+$/, "") + "…";
    return kept;
  }
  return out;
}

const isAccent = (n: PipelineNode) => n.kind === "gate" || n.kind === "output";

type Box = { x: number; y: number; w: number; h: number; node: PipelineNode; label: string[]; sub: string[]; fs: number };

/** Connectors between consecutive rows, fanning through a horizontal bus. */
function Buses({ rows }: { rows: Box[][] }) {
  const cx = (b: Box) => b.x + b.w / 2;
  return (
    <>
      {rows.slice(1).map((row, i) => {
        const prev = rows[i];
        const top = row[0].y, bottom = prev[0].y + prev[0].h, bus = bottom + (top - bottom) / 2;
        const xs = [...prev, ...row].map(cx);
        const d =
          prev.map((b) => `M${cx(b)} ${bottom} V${bus}`).join(" ") +
          ` M${Math.min(...xs)} ${bus} H${Math.max(...xs)} ` +
          row.map((b) => `M${cx(b)} ${bus} V${top}`).join(" ");
        return <path key={i} d={d} className="ln" />;
      })}
    </>
  );
}

export default function SystemFigure({
  stages, layout, details = false, notes = "below", fit = false, canvas = 312,
}: {
  stages: PipelineStage[];
  layout: "wide" | "stacked";
  /** stacked: show each step's detail line inside its box (case-study page). */
  details?: boolean;
  /** stacked: put the gate rules beside the figure (a wide card) or under it. */
  notes?: "below" | "side";
  /** stacked: scale the SVG to fill a fixed-height frame instead of its width. */
  fit?: boolean;
  /** stacked: drawing width in units. 312 suits a card or a phone; give it
   *  more only where it is drawn about that many px wide, so text stays at
   *  its own size instead of being scaled up. */
  canvas?: number;
}) {
  return layout === "wide" ? <WideFigure stages={stages} /> : <StackedFigure stages={stages} details={details} notes={notes} fit={fit} span={canvas} />;
}

function WideFigure({ stages }: { stages: PipelineStage[] }) {
  const X0 = 108, span = 440, LH = 19, SFS = 14, GAP = 54, AFS = 19, ACH = 22;
  const col = (span - 28) / 3;
  const AX = X0 + span + 26;
  let y = 6;
  const rows: Box[][] = [];
  const anns: { x: number; y: number; from: Box; lines: string[]; below: boolean }[] = [];
  const gutters: { y: number; t: string }[] = [];

  stages.forEach((st, si) => {
    const n = st.nodes.length;
    const bw = n === 1 ? 260 : n === 2 ? 205 : col;
    const sx = X0 + span / 2 - (n * bw + (n - 1) * 14) / 2;
    const FS = n === 3 ? 14 : 15;
    const gate = [...st.nodes].reverse().find((nd) => nd.kind === "gate");
    const boxes = st.nodes.map((nd, i) => {
      const annotated = nd === gate && !!nd.detail;
      const label = wrap(nd.label, Math.floor((bw - 22) / (FS * 0.57)), 2);
      const sub = annotated || !nd.detail ? [] : wrap(nd.detail, Math.floor((bw - 22) / (SFS * 0.55)), 3);
      const h = 24 + label.length * LH + (sub.length ? 6 + sub.length * (SFS + 4) : 0);
      return { x: sx + i * (bw + 14), y, w: bw, h, node: nd, label, sub, fs: FS } as Box;
    });
    const rh = Math.max(...boxes.map((b) => b.h));
    boxes.forEach((b) => (b.h = rh));
    rows.push(boxes);
    gutters.push({ y, t: st.title });
    if (gate?.detail) {
      const b = boxes.find((bx) => bx.node === gate)!;
      const rightmost = b === boxes[boxes.length - 1];
      anns.push({ x: AX, y: rightmost ? y + rh / 2 : y + rh + 12, from: b, lines: wrap(gate.detail, ACH, 3), below: !rightmost });
    }
    y += rh + (si < stages.length - 1 ? GAP : 6);
  });

  const H = Math.max(y, ...anns.map((a) => a.y + a.lines.length * (AFS + 3) + 4));
  const noteW = Math.max(0, ...anns.flatMap((a) => a.lines.map((l) => l.length))) * AFS * 0.43;
  const W = anns.length ? AX + 12 + noteW : X0 + span;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fig-diag h-auto w-full" aria-hidden>
      {gutters.map((g, i) => (
        <g key={i}>
          <text x={0} y={g.y + 19} className="sn" style={{ fontSize: 21 }}>{String(i + 1).padStart(2, "0")}</text>
          <text x={0} y={g.y + 40} className="ds" style={{ fontSize: SFS }}>{g.t}</text>
        </g>
      ))}
      <Buses rows={rows} />
      {rows.flat().map((b) => (
        <g key={b.node.id}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={9} className={isAccent(b.node) ? "dn acc" : "dn"} />
          {b.label.map((l, i) => (
            <text key={i} x={b.x + 12} y={b.y + 12 + b.fs * 0.85 + i * LH} className="dt" style={{ fontSize: b.fs }}>{l}</text>
          ))}
          {b.sub.map((l, i) => (
            <text key={i} x={b.x + 12} y={b.y + 12 + b.fs * 0.85 + b.label.length * LH + 4 + SFS + i * (SFS + 4)} className="ds" style={{ fontSize: SFS }}>{l}</text>
          ))}
        </g>
      ))}
      {anns.map((a, i) => {
        const b = a.from;
        const d = a.below ? `M${b.x + b.w - 16} ${b.y + b.h} V${a.y} H${a.x - 4}` : `M${b.x + b.w} ${a.y} H${a.x - 4}`;
        return (
          <g key={i}>
            <path d={d} className="ann" />
            <rect x={a.x - 4} y={a.y - 3.5} width={7} height={7} fill="var(--color-accent)" />
            {a.lines.map((l, j) => (
              <text key={j} x={a.x + 10} y={a.y + AFS * 0.35 + j * (AFS + 3)} className="at" style={{ fontSize: AFS }}>{l}</text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// Stacked-figure type, and text measured the way Inter sets it. A per-letter
// average wrapped "Classification" (narrow letters) early and let "Markdown,
// JSON, CSV" (wide ones) run into the border; approximate advances per glyph
// (em, regular weight) get both right. Checked against the rendered boxes on
// every case study at 1440 and 390px.
const LABEL_FS = 14;
const SUB_FS = 12.5;
const GAP_X = 10;
const ADV: Record<string, number> = {
  a: 0.56, b: 0.6, c: 0.53, d: 0.6, e: 0.56, f: 0.34, g: 0.6, h: 0.58, i: 0.25, j: 0.26, k: 0.53, l: 0.25, m: 0.87,
  n: 0.58, o: 0.58, p: 0.6, q: 0.6, r: 0.37, s: 0.51, t: 0.35, u: 0.58, v: 0.52, w: 0.78, x: 0.51, y: 0.52, z: 0.5,
  A: 0.66, B: 0.64, C: 0.7, D: 0.71, E: 0.58, F: 0.56, G: 0.72, H: 0.73, I: 0.27, J: 0.5, K: 0.64, L: 0.53, M: 0.87,
  N: 0.74, O: 0.75, P: 0.62, Q: 0.75, R: 0.64, S: 0.62, T: 0.61, U: 0.72, V: 0.66, W: 0.95, X: 0.64, Y: 0.62, Z: 0.6,
  " ": 0.26, ",": 0.27, ".": 0.27, ";": 0.27, ":": 0.27, "-": 0.4, "/": 0.37, "+": 0.6, "(": 0.33, ")": 0.33,
  "&": 0.65, "'": 0.22, "·": 0.3, "→": 0.7,
};
/** Width in px of `t` set in Inter at `fs`, 4% slack included; 600 weight runs ~5% wider. */
const textWidth = (t: string, fs: number, bold: boolean) =>
  [...t].reduce((w, ch) => w + (ADV[ch] ?? (/[0-9]/.test(ch) ? 0.6 : 0.6)), 0) * fs * (bold ? 1.05 : 1) * 1.04;
const boxWidth = (span: number, n: number) => (span - GAP_X * (n - 1)) / n;
// The numbered badge sits on a gate's first line only, so only that line is
// narrowed for it; the lines under it get the full width back.
const labelRoom = (bw: number) => bw - 22;
const BADGE_ROOM = 23;
const subRoom = (bw: number) => bw - 22;

/** Wrap by measured width. A word wider than the line is broken with a hyphen.
 *  `first` narrows the first line (for a badge beside it). */
function wrapW(t: string, room: number, fs: number, bold: boolean, max: number, first = room): string[] {
  const lines: string[] = [];
  const fits = (s: string) => textWidth(s, fs, bold) <= (lines.length === 0 ? first : room);
  const words = t.split(" ").flatMap((w) => {
    if (fits(w)) return [w];
    const parts = w.split(/(?<=-)/);
    const out: string[] = [];
    for (let p of parts) {
      while (!fits(p)) {
        let k = p.length - 1;
        while (k > 1 && !fits(p.slice(0, k) + "-")) k -= 1;
        out.push(p.slice(0, k) + "-");
        p = p.slice(k);
      }
      out.push(p);
    }
    return out;
  });
  let cur = "";
  for (const w of words) {
    const sep = cur.endsWith("-") ? "" : " ";
    if (!cur) cur = w;
    else if (fits(cur + sep + w)) cur += sep + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > max) {
    const kept = lines.slice(0, max);
    let last = kept[max - 1];
    while (last.length > 1 && !fits(last + "…")) last = last.slice(0, -1).trimEnd();
    kept[max - 1] = last + "…";
    return kept;
  }
  return lines;
}

/**
 * Whether every word of a pipeline fits its box at this canvas width. When
 * one doesn't, a page can draw the figure wider and let it scroll, rather
 * than break the word or shrink the type under the 12px floor.
 */
export function fitsCanvas(stages: PipelineStage[], canvas: number, details: boolean) {
  return stages.every((st) => {
    const bw = boxWidth(canvas, st.nodes.length);
    const gate = [...st.nodes].reverse().find((nd) => nd.kind === "gate" && nd.detail);
    return st.nodes.every((nd) => {
      const widest = (t: string, fs: number, bold: boolean) =>
        Math.max(...t.split(/\s+/).flatMap((w) => w.split(/(?<=-)/)).map((w) => textWidth(w, fs, bold)));
      const labelOk = widest(nd.label, LABEL_FS, true) <= labelRoom(bw);
      const subOk = !details || nd === gate || !nd.detail || widest(nd.detail, SUB_FS, false) <= subRoom(bw);
      return labelOk && subOk;
    });
  });
}

// Stacked-figure box metrics. Text is placed on baselines, and a box's height
// is read off the same baselines, so the two can never disagree.
const PAD_X = 11;
const PAD_Y = 10;
const labelBase = (b: Box, i: number) => b.y + PAD_Y + b.fs * 0.76 + i * b.fs * 1.28;
const subBase = (b: Box, i: number, sfs: number) => labelBase(b, b.label.length - 1) + sfs * 1.55 + i * sfs * 1.42;
const boxBottom = (b: Box, sfs: number) =>
  b.sub.length ? subBase(b, b.sub.length - 1, sfs) + sfs * 0.3 : labelBase(b, b.label.length - 1) + b.fs * 0.28;

function StackedFigure({
  stages, details, notes: notesAt, fit, span,
}: { stages: PipelineStage[]; details: boolean; notes: "below" | "side"; fit: boolean; span: number }) {
  // No step numbers: the boxes and connectors already read top to bottom.
  // Sized for the ~0.9x the figure is drawn at on a phone: box labels land
  // near 12.5px, details and markers near 12px.
  //
  // Every row spans the same width, a lone step included, so box edges line
  // up from row to row; a narrower centred single box made each row start
  // somewhere new. Heights come from the same baselines the text is drawn
  // on, so the last line always clears the border (descenders were being cut
  // when height and text positions were worked out separately).
  const X0 = 0, G = GAP_X, SFS = SUB_FS, GAP = 24;
  let y = 4;
  const rows: Box[][] = [];
  const notes: { box: Box; label: string; text: string }[] = [];

  stages.forEach((st, si) => {
    const n = st.nodes.length;
    const bw = boxWidth(span, n);
    const FS = LABEL_FS;
    const gate = [...st.nodes].reverse().find((nd) => nd.kind === "gate" && nd.detail);
    const boxes = st.nodes.map((nd, i) => {
      const room = labelRoom(bw);
      const label = wrapW(nd.label, room, FS, true, 3, nd === gate ? room - BADGE_ROOM : room);
      // Six lines is more than any detail needs in the narrowest box; a
      // detail cut off with an ellipsis would hide part of the claim.
      const sub = details && nd !== gate && nd.detail ? wrapW(nd.detail, subRoom(bw), SFS, false, 6) : [];
      const box = { x: X0 + i * (bw + G), y, w: bw, h: 0, node: nd, label, sub, fs: FS } as Box;
      box.h = boxBottom(box, SFS) - y + PAD_Y;
      return box;
    });
    const rh = Math.max(...boxes.map((b) => b.h));
    boxes.forEach((b) => (b.h = rh));
    rows.push(boxes);
    if (gate) notes.push({ box: boxes.find((b) => b.node === gate)!, label: gate.label, text: gate.detail! });
    y += rh + (si < stages.length - 1 ? GAP : 4);
  });

  const noteNo = (b: Box) => notes.findIndex((nt) => nt.box === b) + 1;
  const svg = (
    <svg
      viewBox={`0 0 ${X0 + span + 2} ${y}`}
      className={fit ? "fig-diag h-full w-full" : "fig-diag h-auto w-full"}
      aria-hidden
    >
      <Buses rows={rows} />
      {rows.flat().map((b) => {
        const k = noteNo(b);
        return (
          <g key={b.node.id}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={8} className={isAccent(b.node) ? "dn acc" : "dn"} />
            {b.label.map((l, i) => (
              <text key={i} x={b.x + PAD_X} y={labelBase(b, i)} className="dt" style={{ fontSize: b.fs }}>{l}</text>
            ))}
            {b.sub.map((l, i) => (
              <text key={i} x={b.x + PAD_X} y={subBase(b, i, SFS)} className="ds" style={{ fontSize: SFS }}>{l}</text>
            ))}
            {k > 0 && (
              // Centred on the first line of the label, inset like the text.
              <g>
                <rect x={b.x + b.w - PAD_X - 17} y={labelBase(b, 0) - b.fs * 0.36 - 8.5} width={17} height={17} rx={4} fill="var(--color-btn)" />
                <text x={b.x + b.w - PAD_X - 8.5} y={labelBase(b, 0) - b.fs * 0.36 + 5.2} textAnchor="middle" className="fig-num">{k}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
  const list = notes.length > 0 && (
    <ol className="fig-notes" aria-hidden>
      {notes.map((nt, i) => (
        <li key={nt.label}>
          <span className="fig-notes-n">{i + 1}</span>
          <span>
            <b>{nt.label}:</b> {nt.text}
          </span>
        </li>
      ))}
    </ol>
  );

  if (notesAt === "side") {
    return (
      <div className="grid h-full grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-center gap-7">
        <div className={fit ? "h-full min-h-0" : ""}>{svg}</div>
        {list}
      </div>
    );
  }
  return (
    <div className={fit ? "flex h-full flex-col gap-4" : "flex flex-col gap-4"}>
      <div className={fit ? "min-h-0 flex-1" : ""}>{svg}</div>
      {list}
    </div>
  );
}
