// Stamps src/data/page-dates.json: for every case study or guide whose source
// text changed since it was last stamped, sets its date to now. With
// --from-git, dates every page from the last commit that touched its block
// instead (needs full history: `git fetch --unshallow`). See content-dates.mjs.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PAGE_DATES_FILE, fingerprint, pageSources } from "./content-dates.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const FILE = `${ROOT}${PAGE_DATES_FILE}`;
const fromGit = process.argv.includes("--from-git");
const iso = (d) => new Date(d).toISOString().replace(/\.\d{3}Z$/, "Z");
// git -L takes basic regular expressions, where braces and parentheses are
// literal and \{ is an interval; only these need escaping.
const escape = (s) => s.replace(/[.*^$[\]\\/]/g, "\\$&");

const stored = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : {};
const next = {};
const changed = [];
for (const [route, { text, file, start }] of Object.entries(pageSources())) {
  const print = fingerprint(text);
  let modified = stored[route]?.fingerprint === print && !fromGit ? stored[route].modified : null;
  if (!modified && fromGit) {
    const end = file.endsWith("caseStudies.ts") ? "^};" : "^  },";
    const out = execFileSync(
      "git",
      ["log", "-1", "-s", "--format=%cI", "-L", `/${escape(start)}/,/${end}/:${file}`],
      { cwd: ROOT, encoding: "utf8" },
    ).trim();
    modified = iso(out.split("\n")[0]);
  }
  modified ??= iso(Date.now());
  if (stored[route]?.modified !== modified) changed.push(`${route} ${modified}`);
  next[route] = { modified, fingerprint: print };
}
writeFileSync(FILE, `${JSON.stringify(next, null, 2)}\n`);
console.log(changed.length ? changed.join("\n") : "page dates up to date");
