import { useEffect, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { Sun, MoonStars } from "@phosphor-icons/react";

/**
 * Light/dark toggle. The initial theme is set by an inline script in
 * index.html (no flash); this just reflects and flips the `.dark` class
 * on <html> and persists the choice.
 *
 * The switch is a circle that grows out of the button and uncovers the new
 * theme, using a view transition (styles in index.css). Browsers without view
 * transitions, and visitors who ask for reduced motion, get the plain switch.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    const next = !dark;
    const root = document.documentElement;
    const apply = () => {
      // Synchronous, so the view transition's "after" snapshot already has
      // the new icon as well as the new colours.
      flushSync(() => setDark(next));
      root.classList.toggle("dark", next);
    };
    const r = e.currentTarget.getBoundingClientRect();
    root.style.setProperty("--theme-x", `${r.left + r.width / 2}px`);
    root.style.setProperty("--theme-y", `${r.top + r.height / 2}px`);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (document.startViewTransition && !reduce) document.startViewTransition(apply);
    else apply();
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* storage unavailable, ignore */
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-elevated/50 text-dim transition-colors hover:border-line-strong hover:text-accent-ink"
    >
      {dark ? <Sun size={17} weight="bold" /> : <MoonStars size={17} weight="bold" />}
    </button>
  );
}
