import { projects } from "../data/projects";
import WorkCard from "./WorkCard";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import GitHubActivity from "./GitHubActivity";

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

      {/* The year of commits behind the projects below, ahead of them. */}
      <GitHubActivity className="mt-10 md:mt-14" />

      <div className="mt-10 grid gap-5 md:mt-12 md:grid-cols-2">
        {projects.slice(0, 4).map((p, i) => (
          <Reveal key={p.slug} delay={i * 0.05} className="wcard-cell">
            <WorkCard project={p} />
          </Reveal>
        ))}
      </div>
      {/* Three across only from xl: at lg a third of the row is ~300px, too
          narrow for a system figure to stay legible. */}
      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {projects.slice(4).map((p, i) => (
          <Reveal key={p.slug} delay={Math.min(i, 3) * 0.05} className="wcard-cell">
            <WorkCard project={p} size="sm" />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
