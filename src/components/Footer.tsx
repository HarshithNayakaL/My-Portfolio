import { useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { scrollToSection } from "../lib/scrollToSection";
import { EMAIL, LINKEDIN, GITHUB, NAME } from "../data/projects";

const nav = [
  { id: "work", label: "Work" },
  { id: "capabilities", label: "Capabilities" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

const legal = [
  { to: "/legal/privacy", label: "Privacy Policy" },
  { to: "/legal/terms", label: "Terms of Use" },
  { to: "/legal/cookies", label: "Cookie Policy" },
];

/**
 * The agent-facing surface, linked from the page rather than only from
 * robots.txt and llms.txt. An agent that lands on the homepage can find the
 * JSON API and its OpenAPI description without guessing at /api or /docs, and
 * a person curious about how the site is built can read the same things.
 */
const forAgents = [
  { href: "/api", label: "JSON API" },
  { href: "/openapi.json", label: "OpenAPI 3.1" },
  { href: "/llms.txt", label: "llms.txt" },
  { href: "/agents.md", label: "Agent guide" },
  { href: "/index.md", label: "This page as markdown" },
];

const connect = [
  { href: `mailto:${EMAIL}`, label: "Email", ext: false },
  { href: LINKEDIN, label: "LinkedIn", ext: true },
  { href: GITHUB, label: "GitHub", ext: true },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const { pathname } = useLocation();
  const navigate = useNavigate();

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

  const col = "flex flex-col gap-3";
  const head =
    "font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-faint";
  const link =
    "text-left text-sm font-medium text-dim transition-colors hover:text-accent-ink";

  return (
    <footer className="border-t border-line bg-surface/30">
      <div className="shell py-14 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.25fr_repeat(4,1fr)] lg:gap-10">
          {/* Brand */}
          <div className="max-w-xs">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 font-mono text-base font-semibold text-ink transition-colors hover:text-accent-ink"
            >
              <span className="h-2.5 w-2.5 rounded-[2px] bg-accent" aria-hidden />
              {NAME}
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-dim">
              AI Engineer, Full-Stack — agents, RAG, and production-grade AI
              systems. Currently AI Workflow Engineer at DemandNXT.
            </p>
          </div>

          <nav className={col} aria-label="Sections">
            <p className={head}>Navigate</p>
            {nav.map((n) => (
              <button key={n.id} onClick={() => goTo(n.id)} className={link}>
                {n.label}
              </button>
            ))}
          </nav>

          <nav className={col} aria-label="Legal">
            <p className={head}>Legal</p>
            {legal.map((l) => (
              <Link key={l.to} to={l.to} className={link}>
                {l.label}
              </Link>
            ))}
          </nav>

          <nav className={col} aria-label="For agents">
            <p className={head}>For agents</p>
            {forAgents.map((a) => (
              <a key={a.href} href={a.href} className={link}>
                {a.label}
              </a>
            ))}
          </nav>

          <nav className={col} aria-label="Connect">
            <p className={head}>Connect</p>
            {connect.map((c) => (
              <a
                key={c.label}
                href={c.href}
                {...(c.ext
                  ? { target: "_blank", rel: "noreferrer noopener" }
                  : {})}
                className={link}
              >
                {c.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] font-medium text-faint">
            © {year} {NAME}. All rights reserved.
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            Reliability is the feature.
          </p>
        </div>
      </div>
    </footer>
  );
}
