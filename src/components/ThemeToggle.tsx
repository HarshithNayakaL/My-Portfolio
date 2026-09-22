import { useEffect, useState } from "react";
import { Sun, MoonStars } from "@phosphor-icons/react";

/**
 * Light/dark toggle. The initial theme is set by an inline script in
 * index.html (no flash); this just reflects and flips the `.dark` class
 * on <html> and persists the choice.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
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
