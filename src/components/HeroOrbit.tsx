/**
 * The agent tooling the work is built with, floating in the hero's otherwise
 * empty right half. Decorative only (aria-hidden, no links), hidden below lg
 * where the headline needs the full width, and still under reduced motion.
 */
const tiles: { slug: string; name: string; x: number; y: number; s: number; rot: number; dur: number; del: number; mono?: boolean }[] = [
  { slug: "claudecode", name: "Claude Code", x: 40, y: 6, s: 112, rot: -4, dur: 7.5, del: 0 },
  { slug: "codex", name: "Codex", x: 4, y: 40, s: 96, rot: 5, dur: 8.2, del: -2 },
  { slug: "openai", name: "Agents API", x: 70, y: 46, s: 96, rot: -3, dur: 7.9, del: -1, mono: true },
  { slug: "mcp", name: "MCP", x: 34, y: 76, s: 84, rot: 4, dur: 6.9, del: -4, mono: true },
];

export default function HeroOrbit() {
  return (
    <div aria-hidden className="pointer-events-none absolute right-[3%] top-[17%] hidden h-[62%] w-[33%] lg:block">
      <div className="absolute inset-0">
        {tiles.map((t) => (
          <div
            key={t.slug}
            className="orbit-tile"
            style={{
              left: `${t.x}%`, top: `${t.y}%`, width: t.s, height: t.s,
              ["--rot" as string]: `${t.rot}deg`, ["--dur" as string]: `${t.dur}s`, ["--del" as string]: `${t.del}s`,
            }}
          >
            <img src={`/icons/${t.slug}.svg`} alt="" width={48} height={48} decoding="async" className={t.mono ? "icon-mono" : undefined} />
            <span>{t.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
