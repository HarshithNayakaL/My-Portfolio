import { useEffect, useState, type ReactNode } from "react";
import { scrollToSection } from "../lib/scrollToSection";

/**
 * A rail of section icons down the left of the page: the one for the section
 * you are reading sits on a tile that slides to it as you scroll, and
 * hovering an icon names it. Wide screens only, where the margin has room.
 *
 * It is fixed to the window but belongs to the page's frame, so it fades out
 * once the frame has scrolled past its middle; otherwise it hung over the
 * parked cars and the footer links at the bottom.
 */
const s = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

const sections: { id: string; label: string; icon: ReactNode }[] = [
  { id: "about", label: "About", icon: <svg {...s}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4" /></svg> },
  { id: "work", label: "Work", icon: <svg {...s}><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2h9A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" /></svg> },
  { id: "experience", label: "Experience", icon: <svg {...s}><rect x="3" y="7" width="18" height="12" rx="2" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12h18" /></svg> },
  { id: "capabilities", label: "Stack", icon: <svg {...s}><path d="m12 3 9 4.5-9 4.5-9-4.5z" /><path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" /></svg> },
  { id: "skills", label: "Agent skills", icon: <svg {...s}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6.3 6.3l2.1 2.1M15.6 15.6l2.1 2.1M6.3 17.7l2.1-2.1M15.6 8.4l2.1-2.1" /></svg> },
  { id: "github", label: "GitHub activity", icon: <svg {...s}><rect x="3" y="3" width="5" height="5" rx="1" /><rect x="10" y="3" width="5" height="5" rx="1" /><rect x="3" y="10" width="5" height="5" rx="1" /><rect x="10" y="10" width="5" height="5" rx="1" /><rect x="17" y="10" width="4" height="5" rx="1" /><rect x="10" y="17" width="5" height="4" rx="1" /></svg> },
  { id: "faq", label: "Questions", icon: <svg {...s}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6M12 17h.01" /></svg> },
  { id: "contact", label: "Contact", icon: <svg {...s}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg> },
];
const STEP = 40; // px from one icon to the next

export default function SectionRail() {
  const [active, setActive] = useState(0);
  const [away, setAway] = useState(false);

  useEffect(() => {
    // The section whose top has crossed the upper third of the window is the
    // one being read; the last to cross wins.
    const pick = () => {
      const line = window.innerHeight * 0.35;
      let at = 0;
      sections.forEach((sec, i) => {
        const el = document.getElementById(sec.id);
        if (el && el.getBoundingClientRect().top < line) at = i;
      });
      setActive(at);
      const frame = document.querySelector(".era-frame");
      setAway(!!frame && frame.getBoundingClientRect().bottom < window.innerHeight * 0.5 + 180);
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, []);

  return (
    <nav aria-label="Sections on this page" className={`era-rail ${away ? "is-away" : ""}`}>
      <span aria-hidden className="era-rail-tile" style={{ transform: `translateY(${active * STEP}px)` }} />
      {sections.map((sec, i) => (
        <a
          key={sec.id}
          href={`#${sec.id}`}
          className={i === active ? "is-active" : undefined}
          aria-current={i === active ? "location" : undefined}
          onClick={(e) => {
            e.preventDefault();
            scrollToSection(sec.id);
          }}
        >
          {sec.icon}
          <span className="era-rail-label">{sec.label}</span>
        </a>
      ))}
    </nav>
  );
}
