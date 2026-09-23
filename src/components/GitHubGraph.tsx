import { useEffect, useRef, useState } from "react";
import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphLegend,
  ContributionGraphTotalCount,
  type Activity,
} from "@/components/kibo-ui/contribution-graph";

export type Contributions = { total: number; contributions: Activity[] };

// Intl rather than date-fns' format(), which would pull its locale data into
// this chunk for one caption.
const dayLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * The Kibo UI graph itself. Split out of GitHubActivity and loaded with a
 * dynamic import only when the section nears the viewport: the component and
 * date-fns added 10.4KB gzipped to the main bundle, which every visitor paid
 * for before first interaction, for a section near the bottom of the page.
 */
export default function GitHubGraph({ data }: { data: Contributions }) {
  const [hovered, setHovered] = useState<Activity | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  // Open on the most recent weeks: on a phone the graph is wider than the
  // screen, and the start of the scroll is a year ago.
  useEffect(() => {
    const el = wrap.current?.querySelector<HTMLElement>(".overflow-x-auto");
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  return (
    <div ref={wrap}>
      <ContributionGraph
        data={data.contributions}
        totalCount={data.total}
        blockSize={11}
        blockMargin={3}
        blockRadius={2}
        fontSize={12}
        labels={{ totalCount: "{{count}} contributions in the last year" }}
        className="w-full font-mono"
      >
        <ContributionGraphCalendar
          role="img"
          aria-label={`${data.total} contributions on GitHub in the last year`}
          // Scrolls sideways on narrow screens, so it has to be reachable by
          // keyboard to be scrollable by keyboard.
          tabIndex={0}
          className="contrib-scroll pb-1"
        >
          {({ activity, dayIndex, weekIndex }) => (
            <ContributionGraphBlock
              activity={activity}
              dayIndex={dayIndex}
              weekIndex={weekIndex}
              onMouseEnter={() => setHovered(activity)}
              onMouseLeave={() => setHovered(null)}
            />
          )}
        </ContributionGraphCalendar>
        <ContributionGraphFooter className="items-center text-[0.75rem]">
          {/* The hovered day replaces the total while the pointer is on a
              block; pointer-only by design, the total is what matters. */}
          <div aria-hidden={hovered ? true : undefined}>
            {hovered ? (
              <span className="text-ink">
                {hovered.count === 0 ? "No" : hovered.count} contribution
                {hovered.count === 1 ? "" : "s"} on{" "}
                {dayLabel.format(new Date(`${hovered.date}T00:00:00Z`))}
              </span>
            ) : (
              <ContributionGraphTotalCount />
            )}
          </div>
          {/* Own swatches: Kibo's default gives each one a <title> of
              "N contributions", but N is the intensity level, not a count,
              so a screen reader would read out numbers that are wrong. */}
          <ContributionGraphLegend>
            {({ level }) => (
              <svg width={11} height={11} aria-hidden>
                <rect data-level={level} width={11} height={11} rx={2} ry={2} />
              </svg>
            )}
          </ContributionGraphLegend>
        </ContributionGraphFooter>
      </ContributionGraph>
    </div>
  );
}
