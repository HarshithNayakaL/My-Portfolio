import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { scrollToSection } from "../lib/scrollToSection";
import ThemeToggle from "./ThemeToggle";

/**
 * `from` is the width at which a link earns its place in the bar. The pill is
 * a fixed-height stadium with a circular control pinned to its right end, and
 * `overflow: hidden` on the glass, so a row that does not fit does not wrap or
 * scroll — it is cut off. At 320px the full row measures 341px against 262px
 * of usable width, which put the theme toggle 70px outside the pill.
 *
 * Widest labels drop first: Capabilities is covered by Skills, and Skills by
 * the Work entries, so the phone bar keeps Work, About and Contact.
 */
const sections = [
  { id: "work", label: "Work", from: "" },
  { id: "capabilities", label: "Capabilities", from: "hidden md:inline-block" },
  { id: "skills", label: "Skills", from: "hidden sm:inline-block" },
  { id: "about", label: "About", from: "" },
  { id: "contact", label: "Contact", from: "" },
];

export default function Nav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState("");
  // Track which section is in view to light the matching nav link.
  useEffect(() => {
    if (pathname !== "/") {
      setActive("");
      return;
    }
    const ids = sections.map((s) => s.id);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  const goTo = useCallback(
    (id: string) => {
      if (pathname === "/") scrollToSection(id);
      else {
        navigate("/");
        window.setTimeout(() => scrollToSection(id), 150);
      }
    },
    [pathname, navigate],
  );

  return (
    <>
      {/* The pill positions itself rather than sitting inside a flex header:
          one element, one place its geometry is defined. */}
      <div className="nav-pill">
      <nav className="flex w-full items-center justify-between gap-2 rounded-full py-2 pl-4 pr-2">
        <Link
          to="/"
          onClick={() => pathname === "/" && goTo("top")}
          className="group flex shrink-0 items-center gap-2 font-mono text-[15px] font-semibold tracking-tight text-ink"
          aria-label="Harshith, home"
        >
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-[3px] bg-accent transition-transform duration-300 group-hover:rotate-45"
          />
          <span className="hidden sm:inline">harshith</span>
        </Link>

        <div className="flex items-center gap-0.5">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => goTo(s.id)}
              aria-current={active === s.id ? "true" : undefined}
              className={`relative rounded-full px-2 py-2 text-[13px] font-semibold transition-colors duration-300 sm:px-3 ${
                s.from
              } ${active === s.id ? "text-accent-ink" : "text-dim hover:text-ink"}`}
              style={{ touchAction: "manipulation" }}
            >
              {active === s.id && (
                <span
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-full bg-accent-dim"
                />
              )}
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span className="hidden h-5 w-px bg-line sm:inline-block" aria-hidden />
          <ThemeToggle />
        </div>
      </nav>
      </div>
    </>
  );
}
