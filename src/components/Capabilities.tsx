import type { CSSProperties } from "react";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import { useTilt } from "../lib/useTilt";
import { useInView } from "../lib/useInView";

type Tile = {
  title: string;
  body: string;
  span: string;
  feature?: boolean; // wider tiles get the tinted treatment
};

const tiles: Tile[] = [
  {
    title: "AI agents & orchestration",
    body: "Multi-step, tool-using agents that reason, call tools, and recover from failure — not a single prompt.",
    span: "lg:col-span-2",
    feature: true,
  },
  {
    title: "RAG & retrieval",
    body: "Retrieval pipelines that ground answers in real data, validated before anything reaches a user.",
    span: "lg:col-span-1",
  },
  {
    title: "Full-stack AI apps",
    body: "The whole thing shipped: the model, the backend, and the interface a person uses.",
    span: "lg:col-span-1",
  },
  {
    title: "Output reliability",
    body: "The same correct shape back every time, so the rest of the system can trust it.",
    span: "lg:col-span-1",
  },
  {
    title: "Backend & infra",
    body: "Production APIs and backends the AI layer runs on — FastAPI, Node, Postgres, serverless.",
    span: "lg:col-span-2",
    feature: true,
  },
  {
    title: "Workflow automation",
    body: "Automating the glue work between tools with n8n. One tool in the kit, not the whole toolbox.",
    span: "lg:col-span-1",
  },
];

function TileCard({ tile, index }: { tile: Tile; index: number }) {
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();
  const { ref, onMouseMove, onMouseLeave } = useTilt(6);
  return (
    <div
      ref={viewRef}
      className={`reveal ${inView ? "is-in" : ""} ${tile.span} [perspective:1100px]`}
      style={{ "--delay": `${(index % 3) * 0.08}s` } as CSSProperties}
    >
      <article
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ transformStyle: "preserve-3d" }}
        className="group glass-card spotlight relative flex h-full min-h-[200px] flex-col justify-start overflow-hidden rounded-[var(--radius-lg)] p-6 active:scale-[0.99]"
      >
        <div className="relative" style={{ transform: "translateZ(20px)" }}>
          <h3 className="text-lg font-semibold tracking-tight text-ink transition-colors duration-500 group-hover:text-accent-ink">
            {tile.title}
          </h3>
          <p className="mt-2 max-w-md text-[0.9375rem] leading-relaxed text-dim">
            {tile.body}
          </p>
        </div>
      </article>
    </div>
  );
}

export default function Capabilities() {
  return (
    <section id="capabilities" className="scroll-mt-28 border-t border-line bg-surface/20">
      <div className="shell py-20 md:py-28">
        <Reveal>
          <SectionHeading
            title="What I can do for you"
            intro="Framed as what it does for your business, not a list of tech badges. Ordered by what matters most."
          />
        </Reveal>

        <div className="mt-14 grid auto-rows-[minmax(200px,auto)] grid-flow-dense grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {tiles.map((t, i) => (
            <TileCard key={t.title} tile={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
