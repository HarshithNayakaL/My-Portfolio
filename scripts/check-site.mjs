// Whole-site consistency check, run as the last step of `npm run build`.
//
// Every rule below exists because the mistake it catches shipped at least
// once: an unreplaced "__ITEMLIST__" in the homepage graph, a breadcrumb that
// filed /about under "Legal", the old job title surviving on some surfaces
// after a change, the paper credited to a sole author, a retired project still
// linked, and a project credited to the employer. Each fix was local; this
// makes the class of mistake fail the build instead of reaching production.
// It reads only dist/, so it checks what ships, not what the source intended.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");
const ORIGIN = "https://harshith-nayaka-l-portfolio.vercel.app";
const problems = [];
const fail = (rule, detail) => problems.push(`${rule}: ${detail}`);

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const files = walk(DIST).filter((f) => !f.includes(`${DIST}/assets/`));
const rel = (f) => f.slice(DIST.length);
const read = (f) => readFileSync(f, "utf8");
const unescape = (s) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");

const pages = new Map(
  files
    .filter((f) => f.endsWith("/index.html"))
    .map((f) => [rel(f).replace(/\/index\.html$/, "") || "/", read(f)]),
);

// ---- internal links resolve
// Paths served by middleware.ts or vercel.json rather than a file.
const ROUTED = new Set(["/mcp", "/mcp/docs", "/ask", "/a2a", "/developers", "/docs", "/.well-known/api-catalog", "/.well-known/mcp", "/data/github-contributions.json", "/api/v1/case-studies"]);
const resolves = (raw) => {
  const p = raw.split("#")[0].split("?")[0].replace(/\/$/, "") || "/";
  if (p === "/" || ROUTED.has(p)) return true;
  const twin = p.match(/^(\/work\/[a-z0-9-]+|\/about|\/contact|\/legal\/[a-z]+)\.md$/);
  if (twin && existsSync(join(DIST, twin[1], "index.md"))) return true;
  return [p, `${p}/index.html`, `${p}.json`, `${p}/index.json`, `${p}/index.md`].some((c) => existsSync(join(DIST, c)) && statSync(join(DIST, c)).isFile());
};
const TEXT = /\.(html|md|txt|json|xml|yaml|jsonl)$/;
for (const f of files.filter((f) => TEXT.test(f))) {
  const s = read(f);
  const urls = new Set([
    ...[...s.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map((m) => m[1]),
    ...[...s.matchAll(/https:\/\/harshith-nayaka-l-portfolio\.vercel\.app(\/[^\s"'<>)\]`,\\]*)/g)].map((m) => m[1]),
  ]);
  for (let u of urls) {
    u = u.replace(/[.:;]+$/, "");
    if (u.includes("{")) continue;
    if (!resolves(u)) fail("broken internal link", `${rel(f)} -> ${u}`);
  }
}

// ---- sitemap, canonical, titles, descriptions, headings
const sitemap = [...read(join(DIST, "sitemap.xml")).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const titles = new Map();
const descriptions = new Map();
for (const [route, s] of pages) {
  const expected = `${ORIGIN}${route === "/" ? "/" : route}`;
  const canonical = s.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (canonical !== expected) fail("canonical", `${route} has ${canonical}`);
  if (!sitemap.includes(expected)) fail("sitemap", `${route} missing from sitemap.xml`);
  const title = unescape(s.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
  const description = unescape(s.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1] ?? "");
  titles.set(title, [...(titles.get(title) ?? []), route]);
  descriptions.set(description, [...(descriptions.get(description) ?? []), route]);
  if (description.length < 25 || description.length > 160) fail("description length", `${route} is ${description.length}`);
  const h1 = (s.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) fail("h1", `${route} has ${h1}`);
}
for (const loc of sitemap) {
  const route = loc.slice(ORIGIN.length).replace(/\/$/, "") || "/";
  if (!pages.has(route)) fail("sitemap", `${loc} has no page`);
}
for (const [t, rs] of titles) if (rs.length > 1) fail("duplicate title", `"${t}" on ${rs.join(", ")}`);
for (const [d, rs] of descriptions) if (rs.length > 1) fail("duplicate description", rs.join(", "));

// ---- structured data: parses, no placeholders, references resolve, FAQ visible
const ldBlocks = (s) => [...s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const collect = (o, refs, ids) => {
  if (Array.isArray(o)) return o.forEach((v) => collect(v, refs, ids));
  if (!o || typeof o !== "object") return;
  const keys = Object.keys(o);
  if (o["@id"] && keys.length > 1) ids.add(o["@id"]);
  if (o["@id"] && keys.length === 1) refs.add(o["@id"]);
  Object.values(o).forEach((v) => collect(v, refs, ids));
};
const homeIds = new Set();
for (const b of ldBlocks(pages.get("/"))) collect(JSON.parse(b), new Set(), homeIds);
const visible = (s) => unescape(s.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
for (const [route, s] of pages) {
  const text = visible(s);
  for (const b of ldBlocks(s)) {
    if (/"__[A-Z_]+__"/.test(b)) fail("placeholder in JSON-LD", route);
    let ld;
    try {
      ld = JSON.parse(b);
    } catch (e) {
      fail("invalid JSON-LD", `${route}: ${e.message}`);
      continue;
    }
    const refs = new Set();
    const ids = new Set();
    collect(ld, refs, ids);
    for (const r of refs) if (!ids.has(r) && !homeIds.has(r)) fail("dangling @id", `${route} -> ${r}`);
    for (const node of ld["@graph"] ?? [ld]) {
      if (node?.["@type"] !== "FAQPage") continue;
      for (const q of node.mainEntity) {
        if (!text.includes(q.name)) fail("FAQ schema not visible", `${route}: ${q.name}`);
        if (!text.includes(q.acceptedAnswer.text.slice(0, 80))) fail("FAQ answer not visible", `${route}: ${q.name}`);
      }
    }
  }
}

// ---- facts that must read the same everywhere
const STALE = [
  [/(?<![Cc]o-)\bAuthor of\b/, "the paper is co-authored"],
  [/Full-Stack AI Engineer|AI Engineer, Full-Stack|AI Engineer \(Full-Stack\)|full-stack AI Engineer/, "the title is \"AI Engineer - Full Stack\""],
  [/blogspace|BlogSpace/, "BlogSpace was retired (410)"],
  [/seo-command-center/, "the old audit-platform URL only redirects"],
  [/select freelance/, "availability wording changed"],
  // Either order: "at DemandNXT ... BrandForge" and "BrandForge ... at DemandNXT".
  [/built at DemandNXT|at DemandNXT[^.]{0,60}\b(BrandForge|Maestro|Cannon|SPECTRA|Creative-Ops|audit platform)\b|\b(BrandForge|Maestro|Cannon|SPECTRA|Creative-Ops|audit platform)\b[^.]{0,60}at DemandNXT/, "no project is attributed to the employer"],
];
// "AI Workflow Engineer" is true only as the previous title.
const PREVIOUS = /previously (?:the )?AI Workflow Engineer|was (?:the )?AI Workflow Engineer|Previously:\*\* AI Workflow Engineer/;
for (const f of files.filter((f) => TEXT.test(f))) {
  const s = read(f);
  for (const [re, why] of STALE) {
    const m = s.match(re);
    if (m) fail("stale fact", `${rel(f)}: "${m[0]}" (${why})`);
  }
  for (const m of s.matchAll(/AI Workflow Engineer/g)) {
    const around = s.slice(Math.max(0, m.index - 60), m.index + 20);
    const inAliasList = /alternateName|previousTitles|"AI Workflow Engineer",?\s*$/.test(s.slice(Math.max(0, m.index - 400), m.index + 22));
    if (!PREVIOUS.test(around) && !inAliasList) fail("stale fact", `${rel(f)}: "AI Workflow Engineer" used as the current title`);
  }
}

// ---- CSP: every inline script is allowed by hash, nothing loads cross-origin
// Editing the inline theme script in index.html without updating its sha256
// in vercel.json does not fail anywhere else: the browser silently refuses to
// run it and the theme toggle breaks in production only.
{
  const csp = JSON.parse(read(join(ROOT, "vercel.json")))
    .headers.flatMap((h) => h.headers)
    .find((h) => h.key === "Content-Security-Policy").value;
  const scriptSrc = csp.split(";").map((d) => d.trim().split(/\s+/)).find((d) => d[0] === "script-src") ?? [];
  const allowed = new Set(scriptSrc.filter((v) => v.startsWith("'sha256-")).map((v) => v.slice(1, -1)));
  for (const f of files.filter((f) => f.endsWith(".html"))) {
    const s = read(f);
    for (const m of s.matchAll(/<script(?![^>]*type="application\/ld\+json")(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
      if (!m[1].trim()) continue;
      const hash = `sha256-${createHash("sha256").update(m[1]).digest("base64")}`;
      if (!allowed.has(hash)) fail("CSP", `${rel(f)} has an inline script whose hash ${hash} is not in vercel.json script-src`);
    }
    for (const m of s.matchAll(/<(?:script|link|img|source)[^>]+(?:src|href)="(https?:\/\/[^"]+)"/g)) {
      if (!m[1].startsWith(ORIGIN)) fail("CSP", `${rel(f)} loads ${m[1]} from another origin`);
    }
  }
}

// ---- one last-updated date per page, everywhere it is stated
// The Article and ProfilePage schema once stamped the build time while the
// sitemap and twins read git, so every deploy claimed every page had changed.
{
  const lastmod = new Map(
    [...read(join(DIST, "sitemap.xml")).matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map((m) => [
      m[1].slice(ORIGIN.length).replace(/\/$/, "") || "/",
      m[2],
    ]),
  );
  for (const [route, s] of pages) {
    const dates = {
      footer: s.match(/Last updated(?:<!-- -->)?\s*<time datetime="([^"]+)"/i)?.[1],
      sitemap: lastmod.get(route),
      twin: existsSync(join(DIST, route === "/" ? "" : route, "index.md"))
        ? read(join(DIST, route === "/" ? "" : route, "index.md")).match(/last-updated: "([^"]+)"/)?.[1]
        : undefined,
      ...Object.fromEntries([...s.matchAll(/"dateModified":"([^"]+)"/g)].map((m, i) => [`schema${i}`, m[1]])),
    };
    const values = new Set(Object.values(dates));
    if (Object.values(dates).some((v) => !v) || values.size !== 1) fail("last-updated date", `${route} ${JSON.stringify(dates)}`);
  }
}

// ---- counts and twins
const studies = JSON.parse(read(join(DIST, "api/v1/case-studies.json"))).count;
// Words as well as digits: llms.txt said "all eleven projects" long after
// that stopped being true, because this check only matched "11 projects".
const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
const countRe = new RegExp(`\\b(\\d+|${NUMBER_WORDS.join("|")}) (?:projects|case studies)\\b`, "gi");
for (const f of files.filter((f) => /\.(html|md|txt)$/.test(f))) {
  for (const m of read(f).matchAll(countRe)) {
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : NUMBER_WORDS.indexOf(m[1].toLowerCase());
    if (n !== studies) fail("project count", `${rel(f)} says "${m[0]}", there are ${studies}`);
  }
}
for (const route of pages.keys()) {
  const twin = join(DIST, route === "/" ? "" : route, "index.md");
  if (!existsSync(twin)) fail("markdown twin", `${route} has none`);
  else if (!/^---\n[\s\S]*?canonical: "/.test(read(twin))) fail("markdown twin", `${route} lacks frontmatter/canonical`);
}

if (problems.length) {
  console.error(`check-site: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`[check-site] ${pages.size} pages, ${files.length} files: links, sitemap, canonicals, titles, JSON-LD and facts consistent`);
