import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./era.css";
import { NAME, projects } from "../data/projects";
import { getCaseStudy } from "../data/caseStudies";
import Faq from "../components/Faq";
import SystemFigure from "../components/SystemFigure";
import MarginTrack from "./MarginTrack";
import F2004Stage from "./F2004Stage";
import Turntable from "./Turntable";
import RossiStrip from "./RossiStrip";
import { cars } from "./cars";

/**
 * The era homepage, built from the pencil sketch: photo and name, the record
 * player beside the F2004, project cards each with a car parked on top, cars
 * driving wavy tracks down both margins, and Rossi riding the footer.
 */
const studies = projects.filter((p) => p.hasCaseStudy);

function useBengaluruTime() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (!now) return "";
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(now);
}

export default function EraHome() {
  const time = useBengaluruTime();
  return (
    <>
      <div className="era">
        <MarginTrack side="left" carIds={["f2004", "delta-integrale", "mp4-22"]} />
        <MarginTrack side="right" carIds={["r26", "mp4-20", "redbull-vettel"]} />

        <div className="era-col">
          {/* Profile */}
          <section aria-labelledby="era-name" className="flex flex-wrap items-center gap-7 pt-36 md:pt-40">
            <div className="era-photo">
              <img src="/profile.jpg" alt={NAME} width={168} height={168} />
            </div>
            <div className="min-w-0 flex-1 basis-64">
              <h1 id="era-name" className="font-display text-5xl leading-none tracking-tight text-ink md:text-6xl">
                {NAME}
              </h1>
              <p className="mt-3 text-lg text-ink">AI Engineer</p>
              <p className="mt-1 text-[0.9375rem] text-dim">
                Leads AI engineering at DemandNXT · Bengaluru{time ? ` · ${time}` : ""}
              </p>
            </div>
          </section>
          <p className="mt-8 max-w-[34em] text-[1.0625rem] leading-relaxed text-dim">
            I build AI systems that hold up in production: agents, RAG pipelines and multi-model orchestration.
            Born in 2004, a petrolhead who doesn't drive yet.
          </p>

          <hr className="era-rule" />

          {/* Music and the F2004 */}
          <section aria-label="Music and the F2004" className="grid gap-8 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:items-end">
            <Turntable />
            <F2004Stage />
          </section>

          <hr className="era-rule" />

          {/* Work */}
          <section aria-labelledby="era-work" id="work">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="era-work" className="font-display text-4xl tracking-tight text-ink">Work</h2>
              <p className="text-[0.9375rem] text-dim">{studies.length} case studies</p>
            </div>
            <div className="era-grid">
              {studies.map((p, i) => {
                const cs = getCaseStudy(p.slug);
                const c = cars[i % cars.length];
                const carW = 118;
                return (
                  <Link key={p.slug} to={`/work/${p.slug}`} className="era-card">
                    <span aria-hidden className="era-parked" style={{ width: carW, height: carW / c.ratio, top: -(carW / c.ratio) + 6 }}>
                      <img src={c.src} alt="" width={carW} height={Math.round(carW / c.ratio)} loading="lazy" decoding="async" />
                    </span>
                    <span className="era-card-media">
                      {cs?.shot ? (
                        <img src={cs.shot.small ?? cs.shot.src} alt={cs.shot.alt} width={640} height={400} loading="lazy" decoding="async" />
                      ) : cs?.pipeline ? (
                        <span className="era-card-fig">
                          <SystemFigure stages={cs.pipeline} layout="stacked" />
                        </span>
                      ) : (
                        <span className="era-card-blank">{p.kicker}</span>
                      )}
                    </span>
                    <span className="block px-4 pb-4 pt-3">
                      <span className="block text-base font-semibold text-ink">{p.title}</span>
                      <span className="mt-0.5 block text-sm text-dim">{p.kicker}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <Faq />
      <RossiStrip />
    </>
  );
}
