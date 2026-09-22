import { CaretRight, CaretDown } from "@phosphor-icons/react";
import type { PipelineStage, PipelineNode } from "../data/caseStudies";

const kindStyles: Record<NonNullable<PipelineNode["kind"]>, string> = {
  input: "border-line",
  model: "border-line",
  logic: "border-line",
  gate: "border-accent/40",
  output: "border-accent/60",
};

const kindDot: Record<NonNullable<PipelineNode["kind"]>, string> = {
  input: "bg-ink/60",
  model: "bg-ink",
  logic: "bg-dim",
  gate: "bg-accent",
  output: "bg-accent",
};

function NodeBox({ node }: { node: PipelineNode }) {
  const kind = node.kind ?? "logic";
  return (
    <div
      className={`rounded-[var(--radius)] border ${kindStyles[kind]} bg-elevated px-3.5 py-3`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${kindDot[kind]}`}
          aria-hidden
        />
        <span className="text-[0.8125rem] font-medium leading-tight text-ink">
          {node.label}
        </span>
      </div>
      {node.detail && (
        <p className="mt-1.5 pl-3.5 font-mono text-[0.6875rem] leading-snug text-faint">
          {node.detail}
        </p>
      )}
    </div>
  );
}

export default function PipelineDiagram({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="elev overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface/50 p-5 md:p-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-2">
        {stages.map((stage, i) => (
          <div key={stage.title} className="contents md:flex md:flex-1 md:items-stretch">
            <div className="flex-1">
              <p className="mb-3 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-faint">
                {stage.title}
              </p>
              <div className="flex flex-col gap-3">
                {stage.nodes.map((n) => (
                  <NodeBox key={n.id} node={n} />
                ))}
              </div>
            </div>

            {i < stages.length - 1 && (
              <div
                className="flex shrink-0 items-center justify-center self-center text-line-strong md:px-1"
                aria-hidden
              >
                <CaretDown weight="bold" size={18} className="md:hidden" />
                <CaretRight weight="bold" size={18} className="hidden md:block" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
