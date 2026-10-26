import { useEffect, useRef, useState } from "react";

/**
 * The quote at the close of the homepage, cycling through the owner's three
 * picks in one spot. All three are in the HTML, stacked in a single grid
 * cell, so the spot always has the tallest quote's height and nothing below
 * it moves when one gives way to the next. Only the active one is visible.
 *
 * Screen readers get all three as plain text: nothing is aria-hidden and
 * there is no live region, so the rotation is never announced over whatever
 * else the person is reading.
 */
const quotes = [
  { text: "Once something is a passion, the motivation is there.", by: "Michael Schumacher" },
  { text: "Attack life, it’s going to kill you anyway.", by: "Steve McQueen" },
  { text: "Will he perform when he has money right in front of him?", by: "Remble, “Touchable”" },
];
const HOLD = 7000; // ms each quote stays up

export default function QuoteCycle() {
  const [on, setOn] = useState(0);
  // Picking a quote with the dots stops the rotation for good: content that
  // moves on its own for more than five seconds needs a way to stop it.
  const [stopped, setStopped] = useState(false);
  const [hover, setHover] = useState(false);
  const [seen, setSeen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Start only once the spot is on screen, so a visitor scrolling down meets
  // the first quote rather than whichever one the timer had reached.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Not tied to prefers-reduced-motion, for the reason Onee isn't (see
  // OneeCompanion); under it the change is a plain fade (era.css).
  useEffect(() => {
    if (stopped || hover || !seen) return;
    const t = window.setTimeout(() => setOn((i) => (i + 1) % quotes.length), HOLD);
    return () => window.clearTimeout(t);
  }, [on, stopped, hover, seen]);

  return (
    <div ref={box} onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <div className="qc">
        {quotes.map((q, i) => (
          <figure key={q.by} className={`qc-item ${i === on ? "is-on" : ""}`}>
            <blockquote className="font-display text-[1.75rem] leading-snug text-ink md:text-[2rem]">“{q.text}”</blockquote>
            <figcaption className="mt-2 text-sm text-dim">{q.by}</figcaption>
          </figure>
        ))}
      </div>
      <div className="qc-dots">
        {quotes.map((q, i) => (
          <button
            key={q.by}
            type="button"
            className="qc-dot"
            aria-label={`Show the quote by ${q.by.split(",")[0]}`}
            aria-pressed={i === on}
            onClick={() => {
              setOn(i);
              setStopped(true);
            }}
          />
        ))}
      </div>
    </div>
  );
}
