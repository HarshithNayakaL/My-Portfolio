import { Link } from "react-router-dom";
import { projects } from "../data/projects";

const studyOrder = projects.filter((p) => p.hasCaseStudy);

// Previous/next alone gave each case study three internal links, and Search
// Console left the least-linked ones at "Discovered - currently not indexed".
// Listing every study from every study puts each one a single hop from any
// page Google already crawls.
export default function AllStudies({ current, className = "mt-10" }: { current?: string; className?: string }) {
  return (
    <nav aria-label="All case studies" className={className}>
      <h2 className="font-sans text-[max(12px,0.8125rem)] font-semibold text-dim">All case studies</h2>
      <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        {studyOrder
          .filter((p) => p.slug !== current)
          .map((p) => (
            <li key={p.slug} className="text-sm leading-snug">
              <Link to={`/work/${p.slug}`} className="text-ink underline decoration-line underline-offset-4 transition-colors hover:text-accent-ink">
                {p.title}
              </Link>
              {p.kicker && <span className="text-dim">: {p.kicker}</span>}
            </li>
          ))}
      </ul>
    </nav>
  );
}
