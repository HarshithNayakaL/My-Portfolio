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
 *   column, step numbers only, numbered gate markers, and the rules as real
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
  stages, layout, details = false, notes = "below", fit = false,
}: {
  stages: PipelineStage[];
  layout: "wide" | "stacked";
  /** stacked: show each step's detail line inside its box (case-study page). */
  details?: boolean;
  /** stacked: put the gate rules beside the figure (a wide card) or under it. */
  notes?: "below" | "side";
  /** stacked: scale the SVG to fill a fixed-height frame instead of its width. */
  fit?: boolean;
}) {
  return layout === "wide" ? <WideFigure stages={stages} /> : <StackedFigure stages={stages} details={details} notes={notes} fit={fit} />;
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

function StackedFigure({
  stages, details, notes: notesAt, fit,
}: { stages: PipelineStage[]; details: boolean; notes: "below" | "side"; fit: boolean }) {
  // Sized for the ~0.9x the figure is drawn at on a 390px phone: box labels
  // land near 13px, details and markers near 12px, step numbers near 20px.
  const X0 = 30, span = 312, G = 10, LH = 18.5, SFS = 12.5, GAP = 28;
  let y = 4;
  const rows: Box[][] = [];
  const nums: number[] = [];
  const notes: { box: Box; label: string; text: string }[] = [];

  stages.forEach((st, si) => {
    const n = st.nodes.length;
    const bw = n === 1 ? 220 : (span - G * (n - 1)) / n;
    const sx = X0 + span / 2 - (n * bw + (n - 1) * G) / 2;
    const FS = n === 3 ? 14 : 15;
    const gate = [...st.nodes].reverse().find((nd) => nd.kind === "gate" && nd.detail);
    const boxes = st.nodes.map((nd, i) => {
      const label = wrap(nd.label, Math.floor((bw - (nd === gate ? 36 : 18)) / (FS * 0.56)), 3);
      const sub = details && nd !== gate && nd.detail ? wrap(nd.detail, Math.floor((bw - 18) / 6.6), 4) : [];
      const h = 18 + label.length * LH + (sub.length ? 4 + sub.length * (SFS + 4) : 0);
      return { x: sx + i * (bw + G), y, w: bw, h, node: nd, label, sub, fs: FS } as Box;
    });
    const rh = Math.max(...boxes.map((b) => b.h));
    boxes.forEach((b) => (b.h = rh));
    rows.push(boxes);
    nums.push(y);
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
      {nums.map((ny, i) => (
        <text key={i} x={0} y={ny + 19} className="sn" style={{ fontSize: 23 }}>{String(i + 1).padStart(2, "0")}</text>
      ))}
      <Buses rows={rows} />
      {rows.flat().map((b) => {
        const k = noteNo(b);
        return (
          <g key={b.node.id}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={9} className={isAccent(b.node) ? "dn acc" : "dn"} />
            {b.label.map((l, i) => (
              <text key={i} x={b.x + 10} y={b.y + 9 + b.fs * 0.85 + i * LH} className="dt" style={{ fontSize: b.fs }}>{l}</text>
            ))}
            {b.sub.map((l, i) => (
              <text key={i} x={b.x + 10} y={b.y + 9 + b.fs * 0.85 + b.label.length * LH + 2 + SFS + i * (SFS + 4)} className="ds" style={{ fontSize: SFS }}>{l}</text>
            ))}
            {k > 0 && (
              <g>
                <rect x={b.x + b.w - 23} y={b.y + 6} width={17} height={17} rx={4} fill="var(--color-btn)" />
                <text x={b.x + b.w - 14.5} y={b.y + 19} textAnchor="middle" className="fig-num">{k}</text>
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
