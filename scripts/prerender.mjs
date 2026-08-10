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
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");

const { render, routeSeo, allRoutes, ORIGIN, caseStudies, projects, NAME } =
  await import(join(ROOT, "dist-ssr/entry-server.js"));

const template = await readFile(join(DIST, "index.html"), "utf8");

const escapeAttr = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Replace the content attribute of a meta tag matched by name or property. */
function setMeta(html, selector, value) {
  const re = new RegExp(
    `(<meta\\s+[^>]*${selector}\\s*=\\s*"[^"]*"[^>]*content\\s*=\\s*")[^"]*(")`,
    "i",
  );
  if (re.test(html)) return html.replace(re, `$1${escapeAttr(value)}$2`);
  // content-before-name ordering
  const re2 = new RegExp(
    `(<meta\\s+[^>]*content\\s*=\\s*")[^"]*("[^>]*${selector}\\s*=\\s*"[^"]*"[^>]*>)`,
    "i",
  );
  return html.replace(re2, `$1${escapeAttr(value)}$2`);
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
      isPartOf: { "@id": `${ORIGIN}/#website` },
      about: cs.tech,
      keywords: (project?.tags ?? cs.tech).join(", "),
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

function applySeo(html, path, seo, appHtml) {
  let out = html;

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
  out = out.replace(
    /(<meta\s+property="og:type"\s+content=")[^"]*(")/i,
    `$1${seo.ogType}$2`,
  );
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

// ---------------------------------------------------------------- prerender

let count = 0;
for (const path of allRoutes) {
  const seo = routeSeo[path];
  const appHtml = await render(path);
  const html = applySeo(template, path, seo, appHtml);

  const outFile =
    path === "/"
      ? join(DIST, "index.html")
      : join(DIST, path.replace(/^\//, ""), "index.html");

  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, html, "utf8");
  count++;
}

// ------------------------------------------------------------ llms-full.txt

/** Flatten a case study into readable markdown — the full text an answer
 *  engine would otherwise have to execute JS to reach. */
function caseStudyMarkdown(slug, cs) {
  const L = [];
  L.push(`## ${cs.title} — ${cs.kicker}`);
  L.push("");
  L.push(`URL: ${ORIGIN}/work/${slug}`);
  L.push("");
  L.push(`**Outcome:** ${cs.outcome}`);
  L.push("");
  if (cs.meta?.length) {
    L.push(cs.meta.map((m) => `- **${m.label}:** ${m.value}`).join("\n"));
    L.push("");
  }
  if (cs.problem?.length) {
    L.push("### Problem", "", cs.problem.join("\n\n"), "");
  }
  if (cs.build?.length) {
    L.push("### What I built", "", cs.build.join("\n\n"), "");
  }
  if (cs.pipeline?.length) {
    L.push("### Pipeline", "");
    for (const stage of cs.pipeline) {
      const nodes = stage.nodes
        .map((n) => (n.detail ? `${n.label} (${n.detail})` : n.label))
        .join(" → ");
      L.push(`- **${stage.title}:** ${nodes}`);
    }
    L.push("");
  }
  if (cs.howItWorks?.length) {
    L.push("### How it works", "");
    for (const item of cs.howItWorks) {
      L.push(`**${item.title}**`, "", item.body, "");
    }
  }
  if (cs.results?.length) {
    L.push("### Results", "");
    for (const r of cs.results) L.push(`**${r.label}:** ${r.body}`, "");
  }
  if (cs.tech?.length) {
    L.push(`### Tech`, "", cs.tech.join(", "), "");
  }
  if (cs.links?.length) {
    L.push(
      "### Links",
      "",
      cs.links.map((l) => `- [${l.label}](${l.href})`).join("\n"),
      "",
    );
  }
  L.push("---", "");
  return L.join("\n");
}

const llmsTxt = await readFile(join(ROOT, "public/llms.txt"), "utf8");
// Reuse the H1 + summary blockquote + intro paragraph from llms.txt verbatim so
// the two files can never describe the site differently.
const header = llmsTxt.split("\n## ")[0].trimEnd();

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
  `Site: ${ORIGIN}/`,
  "Email: harshith28124@gmail.com",
  "GitHub: https://github.com/HarshithNayakaL",
  "LinkedIn: https://www.linkedin.com/in/harshith-nayaka-l-518b98348",
  "",
].join("\n");

await writeFile(join(DIST, "llms-full.txt"), full, "utf8");

console.log(
  `prerendered ${count} routes + llms-full.txt (${(full.length / 1024).toFixed(1)}KB)`,
);
