/**
 * Conformance check for the llms.txt v2 spec (llmstxt.org, revised August 2026).
 *
 * Run against a server serving dist/. Checks the three things v2 added on top
 * of v1 — markdown twins of pages, the link relations that let an agent find
 * them, and llms.txt links pointing at LLM-friendly content — plus the file
 * format itself, which v2 restates unchanged:
 *
 *   optional BOM, then a required H1, then an optional blockquote summary,
 *   then any number of non-heading blocks, then H2-delimited file lists whose
 *   items are `- [name](url)` with optional `: notes`.
 *
 * Usage: node scripts/check-llms-txt.mjs [origin]
 */
const ORIGIN = process.argv[2] ?? "http://localhost:4321";

let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`  FAIL  ${msg}`);
};
const pass = (msg) => console.log(`  ok    ${msg}`);

const get = async (url) => {
  const r = await fetch(url);
  return { status: r.status, type: r.headers.get("content-type") ?? "", link: r.headers.get("link"), body: await r.text() };
};

// ---------------------------------------------------------------- the file
console.log("llms.txt format");
const llms = await get(`${ORIGIN}/llms.txt`);
if (llms.status !== 200) fail(`/llms.txt returned ${llms.status}`);
if (!/^text\/plain|^text\/markdown/.test(llms.type)) fail(`/llms.txt content-type is ${llms.type}`);

const text = llms.body.replace(/^﻿/, ""); // an optional BOM is allowed
const lines = text.split("\n");

if (!/^# \S/.test(lines[0])) fail("first line is not an H1 (the only required section)");
else pass("H1 present as the first line");

if ((text.match(/^# /gm) ?? []).length !== 1) fail("more than one H1");
else pass("exactly one H1");

const afterH1 = lines.slice(1).filter((l) => l.trim())[0] ?? "";
if (!afterH1.startsWith("> ")) fail("no blockquote summary after the H1");
else pass("blockquote summary follows the H1");

// Everything before the first H2 must be free of headings; everything after is
// H2-delimited file lists.
const [preamble, ...sections] = text.split(/^## /m);
if (/^#{1,6} /m.test(preamble.split("\n").slice(1).join("\n"))) {
  fail("a heading appears in the preamble before the first H2");
} else pass("preamble contains no headings");

const linkRe = /^- \[([^\]]+)\]\(([^)]+)\)(: .*)?$/;
const urls = [];
for (const sec of sections) {
  const [name, ...rest] = sec.split("\n");
  for (const line of rest) {
    if (!line.trim()) continue;
    if (line.startsWith("- ")) {
      const m = line.match(linkRe);
      if (!m) fail(`malformed list item in "${name.trim()}": ${line.slice(0, 70)}`);
      else urls.push({ section: name.trim(), url: m[2] });
    } else if (/^#{1,6} /.test(line)) {
      fail(`nested heading inside section "${name.trim()}"`);
    }
  }
}
pass(`${sections.length} H2 sections, ${urls.length} well-formed links`);

// ------------------------------------------------- links point at markdown
console.log("\nllms.txt links resolve and are LLM-friendly");
const internal = urls.filter((u) => u.url.startsWith("https://harshith-nayaka-l-portfolio.vercel.app"));
for (const { url } of internal) {
  const local = url.replace("https://harshith-nayaka-l-portfolio.vercel.app", ORIGIN);
  const r = await get(local);
  if (r.status !== 200) { fail(`${url} -> ${r.status}`); continue; }
  if (r.body.trimStart().startsWith("<!doctype") || r.body.trimStart().startsWith("<!DOCTYPE")) {
    fail(`${url} serves HTML, not LLM-friendly content`);
    continue;
  }
  if (url.endsWith(".md") && !r.type.includes("text/markdown")) {
    fail(`${url} content-type is ${r.type}, expected text/markdown`);
  }
}
pass(`${internal.length} internal links checked`);

// --------------------------------------------------------- discovery links
console.log("\nrel=alternate / rel=describedby on every page");
const routes = ["/", "/work/maestro", "/work/craftconnect", "/work/ai-notes", "/work/nova-ai", "/work/blogspace", "/work/cannon", "/work/replydesk", "/work/creative-ops-pipeline", "/legal/privacy", "/legal/terms", "/legal/cookies"];
for (const route of routes) {
  const page = await get(`${ORIGIN}${route}`);
  if (page.status !== 200) { fail(`${route} -> ${page.status}`); continue; }

  const alt = page.body.match(/<link[^>]+rel="alternate"[^>]*>/i)?.[0] ?? "";
  if (!alt) { fail(`${route}: no rel="alternate" link`); continue; }
  if (!/type="text\/markdown"/i.test(alt)) fail(`${route}: alternate link lacks type="text/markdown"`);

  const href = alt.match(/href="([^"]+)"/i)?.[1] ?? "";
  const expected = route === "/" ? "/index.md" : `${route}/index.md`;
  if (!href.endsWith(expected)) fail(`${route}: alternate points at ${href}, expected ...${expected}`);

  if (!/<link[^>]+rel="describedby"[^>]+href="[^"]*\/llms\.txt"/i.test(page.body)) {
    fail(`${route}: no rel="describedby" pointing at llms.txt`);
  }

  const md = await get(`${ORIGIN}${expected}`);
  if (md.status !== 200) fail(`${expected} -> ${md.status}`);
  else if (!md.type.includes("text/markdown")) fail(`${expected} content-type is ${md.type}`);
  else if (!/^#\s/.test(md.body)) fail(`${expected} does not start with an H1`);
  else if (md.body.trimStart().startsWith("<!")) fail(`${expected} served the SPA fallback, not markdown`);
}
pass(`${routes.length} routes have a working markdown twin`);

console.log(
  failures === 0
    ? "\nllms.txt v2: conformant"
    : `\nllms.txt v2: ${failures} problem(s)`,
);
process.exit(failures === 0 ? 0 : 1);
