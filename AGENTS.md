# AGENTS.md

Instructions for AI coding agents working in this repository.

This is the source for **harshith-nayaka-l-portfolio.vercel.app** — a static,
prerendered React site that also publishes an agent-readable surface: markdown
twins of every page, a read-only JSON API, and the discovery documents that
point at both.

## Build

```bash
npm install
npm run build     # tsc -b -> vite build -> vite build --ssr -> prerender -> build-api
npm run lint      # tsc -b --noEmit
npm run verify:llms
```

`npm run build` is a chain, and every link matters:

1. `vite build` emits the client bundle.
2. `vite build --ssr src/entry-server.tsx` emits a server bundle whose only job
   is to give the build scripts one import path to the real data and the real
   React tree.
3. `scripts/prerender.mjs` renders every route to static HTML, writes the
   markdown twin next to it, and generates `sitemap.xml`, `404.html` and
   `llms-full.txt`.
4. `scripts/build-api.mjs` generates the JSON API, `openapi.json`, the
   schema.org JSONL feeds and the `.well-known` documents.

Never edit anything in `dist/`. It is generated on every build and your change
will be gone. Edit the source the generator reads from.

## Where content lives

There is one source of truth per kind of content, and the HTML page, the
markdown twin, the JSON record and `llms-full.txt` are all generated from it.
If a page and its markdown twin disagree, that is a bug in a generator, not a
reason to hand-edit the output.

| Content | Source |
| --- | --- |
| Projects (the homepage grid) | `src/data/projects.ts` |
| Case studies | `src/data/caseStudies.ts` |
| Per-route title/description/canonical | `src/data/seo.ts` |
| FAQ entries | `src/components/Faq.tsx` (exported as `faqs`) |
| Legal documents | `src/pages/Legal.tsx` |
| Structured data (JSON-LD) | `index.html` and `scripts/prerender.mjs` |

## Build-time guards

Three checks fail the build rather than shipping something broken. If one
fires, fix the cause — do not weaken the check.

- **Screenshot content hashes.** Every file in `public/shots/` is named
  `<name>.<sha256[0:8]>.webp` and served `immutable` for a year. The build
  recomputes the hash and fails on a mismatch, because editing an image without
  renaming it ships bytes that no cache will ever pick up.
- **Middleware slug drift.** `middleware.ts` carries the project and
  case-study slugs so it can answer a bad slug with JSON instead of an HTML
  404 page. `scripts/build-api.mjs` fails the build if either set drifts from
  the data. Add a project → add its slug to `middleware.ts`.
- **llms.txt conformance.** `npm run verify:llms` checks the file against the
  llms.txt v2 spec.

## Conventions

- **Comments explain why, not what.** The existing comments document decisions
  and the bugs that motivated them. Match that: a comment restating the line
  below it is noise.
- **Never invent a claim.** Everything on this site is checkable against a
  public repo, a deployed app or a published paper. Metrics, test counts,
  dates and placings must trace to something real. If you cannot verify a
  number, leave it out.
- **No commitments the owner has not made.** There are deliberately no rates,
  turnaround times or availability promises anywhere in the content.
- **Accessibility is enforced.** The site scores 100 on axe/Lighthouse
  accessibility. Watch list structure in particular: a `<dl>` may wrap each
  `<dt>`/`<dd>` pair in one `<div>`, never two nested ones.

## The agent surface

If you change routes, you change all of these — check each one:

- `/<route>/index.md` — markdown twin, with YAML frontmatter
- `Accept: text/markdown`, `?mode=agent`, and answer-engine user agents all
  resolve to the twin, via `middleware.ts`
- `/api/v1/...` — read-only JSON, described by `/openapi.json`
- `/.well-known/ard.json`, `/.well-known/agent-card.json`,
  `/.well-known/agent-skills/index.json`, `/.well-known/api-catalog`
- `/llms.txt`, `/llms-full.txt`, `/agents.md`, `/sitemap.xml`, `/schema-map.xml`

`public/agents.md` is a different document with a different audience: it tells
an agent *reading the site* what the site is a good source for. This file tells
an agent *editing the repository* how the repository works.
