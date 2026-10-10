import type { PipelineStage, PipelineNode } from "../data/caseStudies";

/**
 * A case study's pipeline drawn as an annotated system figure: plain boxes,
 * thin connectors that fan out through a bus, and the rule each gate enforces
 * written beside it as an italic margin note on a dashed accent leader.
 *
 * compact: the same figure for a work card. Labels only (the detail lives on
 * the case study), no stage gutter, and every box sits on a three-column grid
 * so rows of one, two and three line up on the same centre line.
 */

function wrap(t: string, n: number, max: number): string[] {
  const out: string[] = [];
  let cur = "";
  const words = t.split(" ").flatMap((w) => (w.length > n && w.includes("-") ? w.split(/(?<=-)/) : [w]));
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

export default function SystemFigure({
  stages, compact = "",
}: { stages: PipelineStage[]; compact?: "" | "lg" | "sm" }) {
  const sm = compact === "sm";
  const LH = sm ? 20 : compact ? 18 : 17, SFS = 10.5, GAP = compact ? 26 : 54;
  const AFS = sm ? 18 : compact ? 16 : 15; // margin note
  const ACH = sm ? 16 : compact ? 20 : 24; // chars per note line
  const X0 = sm ? 0 : 84;
  const span = compact ? (sm ? 400 : 440) : 428;
  const col = (span - 28) / 3;
  const AX = X0 + span + 26;

  let y = 6;
  const rows: Box[][] = [];
  const anns: { x: number; y: number; from: Box; lines: string[]; below: boolean }[] = [];
  const gutters: { y: number; t: string }[] = [];

  stages.forEach((st, si) => {
    const n = st.nodes.length;
    const bw = sm ? (n === 1 ? span * 0.6 : n === 2 ? (span - 14) / 2 : col) : compact ? col : n === 1 ? 250 : n === 2 ? 196 : col;
    const step = bw + 14;
    const sx = X0 + span / 2 - (n * bw + (n - 1) * 14) / 2;
    const FS = sm ? 15.5 : compact ? 14 : n === 3 ? 12.5 : 13.5;
    const gate = [...st.nodes].reverse().find((nd) => nd.kind === "gate");
    const boxes = st.nodes.map((nd, i) => {
      const annotated = nd === gate && !!nd.detail;
      const lbl = wrap(nd.label, Math.floor((bw - 22) / (FS * 0.58)), compact ? 3 : 2);
      const sub = compact || annotated || !nd.detail ? [] : wrap(nd.detail, Math.floor((bw - 24) / 5.6), 3);
      const h = (compact ? 16 : 24) + lbl.length * LH + (sub.length ? 6 + sub.length * (SFS + 4) : 0);
      return { x: sx + i * step, y, w: bw, h, node: nd, label: lbl, sub, fs: FS } as Box;
    });
    const rh = Math.max(...boxes.map((b) => b.h));
    boxes.forEach((b) => (b.h = rh));
    rows.push(boxes);
    gutters.push({ y, t: st.title });
    if (gate?.detail) {
      const b = boxes.find((bx) => bx.node === gate)!;
      const rightmost = b === boxes[boxes.length - 1];
      anns.push({
        x: AX,
        y: rightmost ? y + rh / 2 : y + rh + (compact ? 8 : 12),
        from: b,
        lines: wrap(gate.detail, ACH, 3),
        below: !rightmost,
      });
    }
    y += rh + (si < stages.length - 1 ? GAP : 6);
  });

  const H = Math.max(y, ...anns.map((a) => a.y + a.lines.length * (AFS + 3) + 4));
  // Crop the canvas to what was drawn, so the frame centres the figure itself
  // rather than a fixed canvas with empty margins on one side.
  const noteW = Math.max(0, ...anns.flatMap((a) => a.lines.map((l) => l.length))) * AFS * 0.43;
  const right = anns.length ? AX + 12 + noteW : X0 + span;
  // Compact: centre the boxes in the frame and let the notes hang into the
  // matching margin, instead of centring boxes+notes as one off-balance block.
  const left = sm ? Math.min(...rows.flat().map((b) => b.x)) - 2 : 0;
  const W = right - left;
  const cx = (b: Box) => b.x + b.w / 2;

  return (
    <svg
      viewBox={`${left} 0 ${W} ${H}`}
      className={compact ? "fig-diag h-full w-full" : "fig-diag h-auto w-full"}
      aria-hidden
    >
      {!sm &&
        gutters.map((g, i) => (
          <g key={i}>
            <text x={0} y={g.y + (compact ? 15 : 17)} className="sn">{String(i + 1).padStart(2, "0")}</text>
            <text x={0} y={g.y + (compact ? 30 : 33)} className="ds">{g.t}</text>
          </g>
        ))}
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
      {rows.flat().map((b) => (
        <g key={b.node.id}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={9} className={isAccent(b.node) ? "dn acc" : "dn"} />
          {b.label.map((l, i) => (
            <text key={i} x={b.x + 12} y={b.y + (compact ? 9 : 12) + b.fs * 0.85 + i * LH} className="dt" style={{ fontSize: b.fs }}>{l}</text>
          ))}
          {b.sub.map((l, i) => (
            <text key={i} x={b.x + 12} y={b.y + 12 + b.fs * 0.85 + b.label.length * LH + 4 + SFS + i * (SFS + 4)} className="ds">{l}</text>
          ))}
        </g>
      ))}
      {anns.map((a, i) => {
        const b = a.from;
        const d = a.below ? `M${b.x + b.w - 16} ${b.y + b.h} V${a.y} H${a.x - 4}` : `M${b.x + b.w} ${a.y} H${a.x - 4}`;
        return (
          <g key={i}>
            <path d={d} className="ann" />
            <rect x={a.x - 4} y={a.y - 3.5} width={7} height={7} fill="var(--accent)" />
            {a.lines.map((l, j) => (
              <text key={j} x={a.x + 10} y={a.y + AFS * 0.35 + j * (AFS + 3)} className="at" style={{ fontSize: AFS }}>{l}</text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
