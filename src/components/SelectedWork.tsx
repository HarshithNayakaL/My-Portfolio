import { projects } from "../data/projects";
import WorkRow from "./WorkRow";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

export default function SelectedWork() {
  return (
    <section className="shell scroll-mt-28 py-20 md:py-28">
      <Reveal>
        <SectionHeading
          id="work"
          title={<span id="work-heading">Selected work</span>}
          intro="A few systems worth showing. Each one is about an outcome — less manual work, faster operations, output you can rely on — not a list of features."
        />
      </Reveal>

      <div className="mt-10 md:mt-14">
        {projects.map((p, i) => (
          <Reveal key={p.slug} delay={Math.min(i, 4) * 0.05}>
            <WorkRow project={p} />
          </Reveal>
        ))}
        <div className="border-t border-line" aria-hidden />
      </div>
    </section>
  );
}
