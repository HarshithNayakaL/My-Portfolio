/**
 * Build-time static prerender.
 *
 * Runs after `vite build` (client) and `vite build --ssr` (server bundle).
 * For every route it renders the real React tree to HTML and writes a static
 * file, so a crawler that does not execute JavaScript still receives the full
 * page text — which is most AI answer-engine crawlers, and the reason the
 * case studies were previously invisible to them.
 *
 * It also rewrites per-route <title>, description, canonical and OG/Twitter
 * tags. Before this, index.html shipped one hardcoded canonical pointing at
 * "/", which every route inherited: that tells Google the case studies are
 * duplicates of the homepage rather than pages worth indexing.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");

const {
  render,
  routeSeo,
  allRoutes,
  ORIGIN,
  caseStudies,
  projects,
  NAME,
  EMAIL,
  GITHUB,
  LINKEDIN,
  faqs,
  legalDocs,
  LEGAL_UPDATED,
} = await import(join(ROOT, "dist-ssr/entry-server.js"));

let template = await readFile(join(DIST, "index.html"), "utf8");

// ------------------------------------------------------- inline the stylesheet
//
// Vite emits <link rel="stylesheet">, which blocks the first render: the
// browser cannot paint until that file has been requested, waited for and
// parsed. On mobile PageSpeed measured 150ms for the request and ~450ms of
// render-blocking, on top of a 480ms critical path, purely because the
// stylesheet is a second round trip discovered only after the HTML arrives.
//
// The whole sheet is ~9KB compressed — under the ~14KB that fits in the first
// congestion window — so inlining it costs one round trip's worth of bytes and
// saves one round trip's worth of waiting. The page now paints from the HTML
// response alone, with no external CSS on the critical path.
//
// Safe under the CSP because style-src already allows 'unsafe-inline' (the
// prerendered markup carries style attributes). Nothing to hash.
{
  const link = template.match(
    /<link\s+rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/i,
  );
  if (!link) {
    throw new Error("prerender: no stylesheet <link> in index.html — did the build change?");
  }
  const css = await readFile(join(DIST, link[1].replace(/^\//, "")), "utf8");
  // A literal </style> inside the CSS would close the element early. Vite has
  // no reason to emit one, but assert rather than trust it.
  if (/<\/style/i.test(css)) {
    throw new Error("prerender: stylesheet contains </style — cannot inline safely");
  }
  template = template.replace(link[0], `<style>${css}</style>`);
}

const escapeAttr = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Replace the content attribute of a meta tag matched by name or property. */
function setMeta(html, selector, value) {
  // Walk the <meta> tags and rewrite content on the one carrying `selector`.
  //
  // This used to build one regex spanning the whole tag, which quietly never
  // matched: `selector` already includes its value (name="description"), and
  // the pattern then appended another \s*=\s*"..." after it, so it was looking
  // for name="description"="...". Titles and canonicals had their own regexes
  // and were fine, which is exactly why the failure was invisible — every
  // route shipped the homepage's description and OG tags. Matching per tag and
  // touching only `content` is both correct and much harder to get wrong.
  const literal = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let matched = false;
  const out = html.replace(/<meta\b[^>]*>/gi, (tag) => {
    if (matched || !new RegExp(literal, "i").test(tag)) return tag;
    if (!/content\s*=\s*"/i.test(tag)) return tag;
    matched = true;
    return tag.replace(
      /(content\s*=\s*")[^"]*(")/i,
      `$1${escapeAttr(value)}$2`,
    );
  });
  if (!matched) {
    throw new Error(
      `prerender: no <meta> tag matched ${selector} — index.html changed shape?`,
    );
  }
  return out;
}

/** Route-specific structured data. The homepage keeps the full @graph
 *  (Person/WebSite/ProfilePage/ItemList/ScholarlyArticle); inner pages get a
 *  leaner graph describing that page plus a breadcrumb trail. */
function jsonLdFor(path, seo) {
  const personId = `${ORIGIN}/#person`;
  const slug = path.startsWith("/work/") ? path.slice("/work/".length) : null;
  const cs = slug ? caseStudies[slug] : null;

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: cs ? "Work" : "Legal",
        item: `${ORIGIN}/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: cs ? cs.title : seo.title.split(" | ")[0],
        item: seo.canonical,
      },
    ],
  };

  const graph = [breadcrumb];

  if (cs) {
    const project = projects.find((p) => p.slug === slug);
    graph.unshift({
      "@type": "Article",
      "@id": `${seo.canonical}#article`,
      headline: `${cs.title} — ${cs.kicker}`,
      name: cs.title,
      description: cs.outcome,
      author: { "@id": personId },
      creator: { "@id": personId },
      mainEntityOfPage: seo.canonical,
      url: seo.canonical,
      inLanguage: "en",
      dateModified: BUILD_TIME,
      isPartOf: { "@id": `${ORIGIN}/#website` },
      about: cs.tech,
      keywords: (project?.tags ?? cs.tech).join(", "),
      // Google's generative-AI guidance is explicit that images give a page
      // surfaces beyond a plain link, so the screenshot is declared rather
      // than left for a crawler to infer from the markup.
      ...(cs.shot
        ? {
            image: {
              "@type": "ImageObject",
              url: `${ORIGIN}${cs.shot.src}`,
              width: cs.shot.width,
              height: cs.shot.height,
              caption: cs.shot.alt,
            },
          }
        : {}),
    });
    graph.unshift({
      "@type": "Person",
      "@id": personId,
      name: NAME,
      url: `${ORIGIN}/`,
    });
  }

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

// Full ISO 8601 in canonical UTC.
//
// A bare "2026-08-10" is a valid schema.org Date, but Google's ProfilePage
// parser rejected it as "Invalid datetime value for dateModified" — it wants a
// datetime. Trailing Z rather than +00:00: both are valid ISO 8601, but Z is
// the form Google's own examples use and the one every parser accepts, and
// Search Console flagged the value again after the +00:00 change.
//
// Stamped at build time rather than hardcoded, so it cannot go stale.
const BUILD_TIME = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

function applySeo(html, path, seo, appHtml) {
  let out = html.replace("BUILD_TIMESTAMP", BUILD_TIME);

  out = out.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeAttr(seo.title)}</title>`,
  );
  out = setMeta(out, 'name="description"', seo.description);
  out = out.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/i,
    `$1${seo.canonical}$2`,
  );

  out = setMeta(out, 'property="og:title"', seo.title);
  out = setMeta(out, 'property="og:description"', seo.description);
  out = setMeta(out, 'property="og:url"', seo.canonical);
  out = setMeta(out, 'property="og:image:alt"', seo.title);
  out = setMeta(out, 'property="og:type"', seo.ogType);
  // Gemini's note: the social titles must match the page title exactly.
  out = setMeta(out, 'name="twitter:title"', seo.title);
  out = setMeta(out, 'name="twitter:description"', seo.description);

  if (path !== "/") {
    out = out.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/i,
      `<script type="application/ld+json">${jsonLdFor(path, seo)}</script>`,
    );
  }

  out = out.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${appHtml}</div>`,
  );

  return out;
}

// ------------------------------------------------------- markdown page bodies
//
// llms.txt v2 asks for a clean markdown version of any page an agent might
// need, served at the page's own URL. Routes here have no file extension, so
// the spec's rule for those applies: append index.md. /work/maestro therefore
// answers at /work/maestro/index.md.
//
// These are generated from the same modules the React pages render from, so a
// page and its markdown twin cannot drift apart.

const mdPathFor = (path) =>
  path === "/" ? "/index.md" : `${path.replace(/\/$/, "")}/index.md`;

/** Case study body, with headings starting at `depth`. */
function caseStudyBody(cs, depth) {
  const h = "#".repeat(depth);
  const L = [];
  if (cs.meta?.length) {
    L.push(cs.meta.map((m) => `- **${m.label}:** ${m.value}`).join("\n"), "");
  }
  if (cs.problem?.length) L.push(`${h} The problem`, "", cs.problem.join("\n\n"), "");
  if (cs.build?.length) L.push(`${h} What I built`, "", cs.build.join("\n\n"), "");
  if (cs.pipeline?.length) {
    L.push(`${h} Pipeline`, "");
    for (const stage of cs.pipeline) {
      const nodes = stage.nodes
        .map((n) => (n.detail ? `${n.label} (${n.detail})` : n.label))
        .join(" → ");
      L.push(`- **${stage.title}:** ${nodes}`);
    }
    L.push("");
  }
  if (cs.howItWorks?.length) {
    L.push(`${h} The judgment calls`, "");
    for (const item of cs.howItWorks) L.push(`**${item.title}**`, "", item.body, "");
  }
  if (cs.results?.length) {
    L.push(`${h} What it changed`, "");
    for (const r of cs.results) L.push(`**${r.label}:** ${r.body}`, "");
  }
  if (cs.tech?.length) L.push(`${h} Built with`, "", cs.tech.join(", "), "");
  if (cs.links?.length) {
    L.push(
      `${h} Links`,
      "",
      cs.links.map((l) => `- [${l.label}](${l.href})`).join("\n"),
      "",
    );
  }
  return L;
}

function markdownFor(path, seo) {
  const abs = (p) => `${ORIGIN}${p}`;
  const slug = path.startsWith("/work/") ? path.slice("/work/".length) : null;

  if (slug) {
    const cs = caseStudies[slug];
    return [
      `# ${cs.title} — ${cs.kicker}`,
      "",
      `> ${cs.outcome}`,
      "",
      `Case study by ${NAME}, AI Engineer (Full-Stack), Bengaluru, India.`,
      `Canonical page: ${seo.canonical}`,
      "",
      ...caseStudyBody(cs, 2),
    ].join("\n");
  }

  if (path.startsWith("/legal/")) {
    const doc = legalDocs[path.slice("/legal/".length)];
    return [
      `# ${doc.title}`,
      "",
      `> ${doc.intro}`,
      "",
      `Last updated: ${LEGAL_UPDATED}. Canonical page: ${seo.canonical}`,
      "",
      ...doc.sections.flatMap((s) => [`## ${s.h}`, "", ...s.p, ""]),
      "This is a plain-language summary for a personal site, not formal legal advice.",
      `For anything specific, email ${EMAIL}.`,
      "",
    ].join("\n");
  }

  // Homepage: the overview an agent should read first, with every onward link
  // pointing at markdown rather than back into HTML.
  return [
    `# ${NAME} — AI Engineer, Full-Stack`,
    "",
    `> ${routeSeo["/"].description}`,
    "",
    `Canonical page: ${seo.canonical}`,
    "",
    "## Selected work",
    "",
    ...projects.map((p) => {
      const md = p.hasCaseStudy ? abs(mdPathFor(`/work/${p.slug}`)) : null;
      const links = p.links.map((l) => `[${l.label}](${l.href})`).join(" · ");
      return (
        `- **${p.title}**${p.kicker ? ` — ${p.kicker}` : ""}: ${p.outcome}` +
        (md ? ` [Case study](${md}).` : "") +
        (links ? ` ${links}` : "")
      );
    }),
    "",
    "## Questions worth asking",
    "",
    ...faqs.flatMap((f) => [`**${f.q}**`, "", f.a, ""]),
    "## Elsewhere",
    "",
    `- [GitHub](${GITHUB})`,
    `- [LinkedIn](${LINKEDIN})`,
    `- Email: ${EMAIL}`,
    `- [Every case study in one file](${abs("/llms-full.txt")})`,
    "",
  ].join("\n");
}

// ---------------------------------------------------------------- prerender

let count = 0;
for (const path of allRoutes) {
  const seo = routeSeo[path];
  const appHtml = await render(path);
  let html = applySeo(template, path, seo, appHtml);

  // llms.txt v2 discovery: rel="alternate" type="text/markdown" points at this
  // page's markdown twin, rel="describedby" at the llms.txt covering it. Both
  // sit next to the canonical so anything already parsing <head> link
  // relations finds them without a second pass.
  const mdPath = mdPathFor(path);
  html = html.replace(
    /(<link\s+rel="canonical"[^>]*>)/i,
    `$1<link rel="alternate" type="text/markdown" href="${ORIGIN}${mdPath}">` +
      `<link rel="describedby" href="${ORIGIN}/llms.txt">`,
  );

  const dir = path === "/" ? DIST : join(DIST, path.replace(/^\//, ""));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "index.html"), html, "utf8");
  await writeFile(join(dir, "index.md"), markdownFor(path, seo), "utf8");
  count++;
}

// -------------------------------------------------- screenshot cache safety

/**
 * Every screenshot is served with `Cache-Control: immutable, max-age=31536000`,
 * which is a promise that the bytes at that URL will never change. That promise
 * was broken once: two screenshots were swapped, corrected an hour later under
 * the same filenames, and every browser that had loaded the page in between
 * kept showing the wrong image — for a year, with no way to bust it.
 *
 * So the filename now carries a hash of the content, and this asserts the two
 * agree. Editing an image without renaming it fails the build instead of
 * silently shipping a file no cache will ever pick up.
 */
for (const cs of Object.values(caseStudies)) {
  if (!cs.shot) continue;
  const file = join(DIST, cs.shot.src.replace(/^\//, ""));
  const bytes = await readFile(file);
  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 8);
  const [name, stamp, ext] = basename(file).split(".");
  if (stamp !== digest || ext !== "webp") {
    throw new Error(
      `prerender: ${cs.shot.src} content hash is ${digest} — rename it to ` +
        `${name}.${digest}.webp and update caseStudies.ts, or caches will ` +
        `keep serving the old image forever.`,
    );
  }
}

// ------------------------------------------------------------ llms-full.txt

/** Flatten a case study for llms-full.txt. Shares caseStudyBody with the
 *  per-page markdown so the two renderings can never describe a project
 *  differently — only the heading depth and the preamble differ. */
function caseStudyMarkdown(slug, cs) {
  return [
    `## ${cs.title} — ${cs.kicker}`,
    "",
    `URL: ${ORIGIN}/work/${slug}`,
    `Markdown: ${ORIGIN}/work/${slug}/index.md`,
    "",
    `**Outcome:** ${cs.outcome}`,
    "",
    ...caseStudyBody(cs, 3),
    "---",
    "",
  ].join("\n");
}

const llmsTxt = await readFile(join(ROOT, "public/llms.txt"), "utf8");
// Reuse the H1 + summary blockquote + intro paragraph from llms.txt verbatim so
// the two files can never describe the site differently. Paragraphs that talk
// about llms-full.txt are dropped: llms.txt points readers here, and copying
// that pointer into this file leaves it telling you to read what you are
// already reading.
const header = llmsTxt
  .split("\n## ")[0]
  .trimEnd()
  .split("\n\n")
  .filter((block) => !block.includes("llms-full.txt"))
  .join("\n\n");

const full = [
  header.replace(
    /^# .*$/m,
    `# ${NAME} — AI Engineer, Full-Stack (full content)`,
  ),
  "",
  // The llms.txt spec allows one H1 only, followed by a blockquote, then any
  // number of non-heading sections, then H2-delimited sections — so this note
  // is a paragraph and every case study below is an H2.
  "This is the expanded companion to /llms.txt: the complete text of every case",
  "study on the site, inlined so it can be read in one fetch without crawling",
  "each page or executing JavaScript.",
  "",
  ...Object.entries(caseStudies).map(([slug, cs]) =>
    caseStudyMarkdown(slug, cs),
  ),
  "## Contact",
  "",
  // Pulled from the shared constants rather than retyped: these were hardcoded
  // here and silently went stale when the LinkedIn URL changed, so llms-full.txt
  // kept shipping a dead profile link.
  `Site: ${ORIGIN}/`,
  `Email: ${EMAIL}`,
  `GitHub: ${GITHUB}`,
  `LinkedIn: ${LINKEDIN}`,
  "",
].join("\n");

await writeFile(join(DIST, "llms-full.txt"), full, "utf8");

console.log(
  `prerendered ${count} routes + llms-full.txt (${(full.length / 1024).toFixed(1)}KB)`,
);
