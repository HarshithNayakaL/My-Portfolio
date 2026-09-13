import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import LiquidGlass from "liquid-glass-react";
import { scrollToSection } from "../lib/scrollToSection";
import ThemeToggle from "./ThemeToggle";

const sections = [
  { id: "work", label: "Work" },
  { id: "capabilities", label: "Capabilities" },
  { id: "skills", label: "Skills" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

/**
 * liquid-glass-react builds its refraction around an "edge mask": the
 * displacement map's luminance says how close a pixel is to the rim, so the
 * chromatic-aberration pass can be confined to the edge and the centre left
 * clean. The feColorMatrix that derives the mask writes luminance into RGB but
 * passes alpha through unchanged, and the feComponentTransfer immediately after
 * it reads *alpha*. Every displacement map the package ships is a fully opaque
 * image, so the mask comes out opaque everywhere: the aberration pass covers
 * the whole surface and the composite that would restore the clean centre
 * erases it instead. The three per-channel passes do not recombine to the
 * original, and the pill renders as a flat grey slab — rgb(159,159,159) over
 * this page — with no refraction at any displacement scale.
 *
 * Writing luminance into alpha instead makes the mask mean what the rest of the
 * graph already assumes it means.
 */
const LUMINANCE_TO_ALPHA = [
  "0 0 0 0 0",
  "0 0 0 0 0",
  "0 0 0 0 0",
  "0.3 0.3 0.3 0 0",
].join(" ");

export default function Nav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState("");
  // The scroll edge has nothing to obscure until something is under it, and a
  // full-width backdrop blur is not free, so it is mounted rather than merely
  // hidden — and only once the page has actually moved. This is also how the
  // effect behaves on Apple platforms: it appears as content scrolls beneath.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Correct the mask on the filter the package mounts, then hand the filter
  // back to the layer the stylesheet is holding it off. If the package's graph
  // is ever reshaped and the primitive no longer matches, the filter simply
  // stays off: a plainly frosted pill is a lesser effect but still a correct
  // one, where the grey slab is neither.
  const glass = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = glass.current;
    if (!root) return;
    const edge = root.querySelector(
      'filter feColorMatrix[result="EDGE_INTENSITY"]',
    );
    if (!edge) return; // the stylesheet already holds the filter back
    edge.setAttribute("values", LUMINANCE_TO_ALPHA);
    root.querySelectorAll<HTMLElement>(".glass__warp").forEach((el) => {
      el.style.setProperty("filter", el.style.filter, "important");
    });
  }, []);

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
      {/* Obscures content before it reaches the bar — see .scroll-edge. */}
      {scrolled && <div className="scroll-edge" aria-hidden />}
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 md:pt-5">
      {/* The pill is the one surface the whole page scrolls behind, so it is
          where a refraction filter has something to refract. */}
      {/* liquid-glass-react renders five stacked layers — two shadow plates,
          the glass itself and two highlight spans — and every one of them takes
          its position/top/left from the `style` passed in, then centres itself
          with translate(-50%, -50%). They only line up inside a positioned box
          that already has the pill's size; dropped into flow they scatter, two
          of them landing outside the viewport entirely. Hence the explicit
          wrapper and height rather than letting the pill size itself. */}
      <div ref={glass} className="relative h-[54px] w-full max-w-2xl">
      <LiquidGlass
        cornerRadius={999}
        padding="0"
        displacementScale={64}
        blurAmount={0.07}
        saturation={150}
        aberrationIntensity={2}
        elasticity={0.22}
        className="nav-glass"
        style={{ position: "absolute", top: "50%", left: "50%", width: "100%" }}
      >
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
              className={`relative rounded-full px-3 py-2 text-[13px] font-semibold transition-colors duration-300 ${
                s.id === "capabilities" ? "hidden md:inline-block" : ""
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
      </LiquidGlass>
      </div>
      </header>
    </>
  );
}
