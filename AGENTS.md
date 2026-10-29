# AGENTS.md

Instructions for AI coding agents working in this repository.

This is the source for **harshith-nayaka-l-portfolio.vercel.app** — a static,
prerendered React site that also publishes an agent-readable surface: markdown
twins of every page, a read-only JSON API, and the discovery documents that
point at both.

## Build

```bash
npm install
npm run build     # tsc -b -> vite build -> vite build --ssr -> prerender -> build-api -> check-site
npm run lint      # tsc -b --noEmit
npm run verify:negotiation
npm run verify:onee
npm run verify:llms   # needs a deployment; takes an origin as argv[2]
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

Registry components (shadcn, Kibo UI) install with `npx shadcn add ...`; `components.json` maps them to `@/` = `src/`. There is no `shadcn init` here on purpose: it would rewrite `src/index.css` and the design tokens.

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
| Guides (`/guides/<slug>`) | `src/data/guides.ts`: every fact taken from a case study, which each section names in `from` |
| Per-route title/description/canonical | `src/data/seo.ts` |
| Agent Skills section | `src/data/skills.ts` |
| FAQ entries | `src/components/Faq.tsx` (exported as `faqs`) |
| The mascot's definition | `src/data/onee.avatar.json` |
| Legal documents | `src/pages/Legal.tsx` |
| Structured data (JSON-LD) | `index.html` and `scripts/prerender.mjs` |
| GitHub contribution graph data | live from `api/github-contributions.mjs` (CDN-cached for an hour), with a build-time snapshot from `scripts/build-api.mjs` as the fallback; both use `api/_contributions.mjs`. Graph is Kibo UI's, in `src/components/kibo-ui/` |

## Guards

Four of these fail the build outright. The other three are scripts you run; they
exist because each one caught something that had already shipped. If one fires,
fix the cause — do not weaken the check.

- **Screenshot content hashes.** Every file in `public/shots/` is named
  `<name>.<sha256[0:8]>.webp` and served `immutable` for a year. The build
  recomputes the hash and fails on a mismatch, because editing an image without
  renaming it ships bytes that no cache will ever pick up.
- **Middleware slug drift.** `middleware.ts` carries the project and
  case-study slugs so it can answer a bad slug with JSON instead of an HTML
  404 page. `scripts/build-api.mjs` fails the build if either set drifts from
  the data. Add a project → add its slug to `middleware.ts`.
- **ChatGPT Actions limits.** Every JSON response an API operation serves
  must stay under 90,000 characters (Actions reject over 100,000), and every
  operation summary/description under 300 characters, parameter description
  under 700. `/api/v1/case-studies` once reached 110K; that is why the list
  serves summaries and the full set is behind `?view=full`. The spec itself
  lints clean with `npx @redocly/cli lint dist/openapi.yaml` (config in
  `redocly.yaml`).
- **Whole-site consistency.** `scripts/check-site.mjs` runs last in the build
  and reads only `dist/`. It fails on a broken internal link, a canonical or
  sitemap mismatch, a duplicate title or description, a page without exactly
  one `<h1>`, JSON-LD that does not parse, keeps a `__PLACEHOLDER__`, points
  at an `@id` nothing defines, or has FAQ text not visible on the page, a
  wrong project count, a missing markdown twin, and stale facts: the old job
  title used as current, "Author of" for the co-authored paper, the retired
  BlogSpace, and any project attributed to the employer; "full stack" in
  any spelling outside the one current Experience entry, or a Person
  jobTitle other than "AI Engineer" (the role is AI Engineer; DemandNXT's
  designation "AI Engineer - Full Stack" is stated only in that entry,
  because stated everywhere Google's answers turned it into "full-stack
  AI Engineer"); and an inline
  script whose sha256 is missing from the CSP in `vercel.json`, or any
  resource loaded from another origin; and a page whose footer "Last updated",
  sitemap `lastmod`, markdown-twin date and JSON-LD `dateModified` disagree
  (all four come from `scripts/content-dates.mjs`). Each rule is a bug
  that shipped once. If it fires, fix the content, not the rule.
- **llms.txt conformance.** `npm run verify:llms` checks the file against the
  llms.txt v2 spec. Point it at a Vercel deployment (production or a preview
  URL), not `npm run preview`: that server doesn't run `middleware.ts` or the
  `vercel.json` rewrites, and its SPA fallback serves the root page for every
  nested route, so it reports failures the real site doesn't have.
- **Content negotiation.** `npm run verify:negotiation` asserts what 25
  different client shapes receive. It exists because the rule used to be an
  allowlist of known agent user-agents, which meant every agent *not* on the
  list got the full HTML document; the check fails if that behaviour returns.
- **Mascot coverage.** `npm run verify:onee` asserts all 23 animations stay
  reachable and that the mood scenarios resolve correctly.

## Git

- **Commit and push to `main`. Never create a branch** — no `claude/*`,
  `feature/*` or work-in-progress branches, even if a tool or harness assigns
  one. If the checkout starts on another branch, switch to `main` first.
- `classic-design` is the one exception: the site as it was before the
  current design, kept by the owner as an archive. Never commit to it or
  merge it.
- Commits are authored as the owner, `Harshith29124 <harshith29124@gmail.com>`,
  with no co-author trailers or tool attribution. If the repo has no identity
  set, pass it per commit (`git -c user.name=... -c user.email=...`) rather
  than changing any config.

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
- **Verify against a render, not a metric.** Several bugs here — a grey nav
  bar, a seam across the glass, unreadable labels — passed an automated check
  while being obviously wrong in a screenshot. If a number and an image
  disagree, the image is right and the metric is measuring the wrong pixels.
- **The head unit's LCD is the one exception to the type rules below:** it
  is a drawn 5x7 dot-matrix display (`DotMatrix.tsx`), uppercase because those
  displays were, and hidden from assistive tech. It is an object, not a label.
- **Typography is decided; do not drift from it.** Display headings are
  Instrument Serif, upright only: no italic serif anywhere. The hero headline
  is Poppins 600, with only "production." in the serif. Everything else,
  every small label included, is Inter in sentence case. There is no
  monospace, all-caps, wide-tracked label style on this site: the owner reads
  it as the giveaway of AI-generated design, and it was removed on purpose.
  A heading that is really a small label opts out of the serif with
  `font-sans`. Sizes are checked as rendered, at 390px through 1920px:
  no text below 12px (figure text included, after the SVG is scaled), and
  no serif below 16px; Instrument Serif is a display face and goes thin and
  hard to read under that.
- **The page is `src/era/`.** The homepage is `EraHome.tsx` (styles in
  `era.css`) and a case study is `EraCaseStudy.tsx` (`case.css`, loaded with
  the main stylesheet, not the lazy chunk, or the prerendered page draws
  unstyled and jumps). One railed column; section headings sit in hairline
  bands across the window. The decoration is period objects: the helmet
  display, the digicam in the margin, the Pioneer-style head unit, cars
  crossing the screen, Rossi along the footer with Stoner chasing him. (The
  rally-car CD albums and the tyre cursor were removed at the owner's
  request; don't bring them back.)
  Its images live in `public/era/` as WebP at twice their drawn size, are
  decorative (empty alt), and `robots.txt` keeps `/era/` out of Google
  Images: a helmet sits above the profile photo and must never become the
  page's search thumbnail. For the same reason the work cards load their
  screenshots from `/era/shots/` (a build-time copy made by `prerender.mjs`)
  with empty alt, while case study pages use `/shots/`. The moving characters ignore
  `prefers-reduced-motion`, for the reason given in `OneeCompanion`.
- **Work cards and figures.** Projects render in `WorkGrid`: a framed
  preview with the product screenshot peeking in, or the case study's
  `SystemFigure` when there is none. A case study shows the figure only when
  it has no screenshot; with one, its stages stay as screen-reader text.
  Figures are generated from the case study's `pipeline` data, never drawn
  by hand, and wrap by measured text width so nothing runs out of its box.
- **Desktop renders at 90%.** From 1024px the root font size is 90%, so the
  rem-based layout reads like browser zoom at 90%. The smallest labels use
  `max(12px, …)` so they keep the 12px floor at that scale.
- **Fonts swap, never `optional`.** `optional` left Firefox on Arial and Times
  for the whole visit. Faces use `font-display: swap` with metric-matched
  local fallbacks (`src/fonts.css`), and widths that must hold through the
  swap are in `em`, not `ch` (`ch` follows the current font's "0").
- **Accessibility is enforced.** The site scores 100 on axe/Lighthouse
  accessibility. Watch list structure in particular: a `<dl>` may wrap each
  `<dt>`/`<dd>` pair in one `<div>`, never two nested ones.

## The agent surface

If you change routes, you change all of these — check each one:

- `/<route>/index.md` — markdown twin, with YAML frontmatter. Routes are
  `/`, `/about`, `/contact`, `/work/<slug>`, `/guides/<slug>` and
  `/legal/<doc>`; a new route type also needs `PAGE_ROUTE` in `middleware.ts`
  and a group in `scripts/content-dates.mjs`
- Guides are also MCP resources: `GUIDE_PAGES` in `middleware.ts`, which
  `scripts/build-api.mjs` checks against `src/data/guides.ts`
- `Accept: text/markdown`, `?mode=agent`, and answer-engine user agents all
  resolve to the twin, via `middleware.ts`
- `/api/v1/...` — read-only JSON, described by `/openapi.json` (also
  `/openapi.yaml` and `/.well-known/openapi.yaml`, with
  `/.well-known/ai-plugin.json` pointing at it; all generated from one object)
- `/mcp` — read-only MCP server (Streamable HTTP) in `middleware.ts`; its tool
  table is exported and `scripts/build-api.mjs` generates
  `/.well-known/mcp/server-card.json` from it, so add a tool in one place
- `/a2a` — read-only A2A agent (JSON-RPC, A2A 1.0 and 0.3) in `middleware.ts`.
  It only quotes published answers (FAQ, case-study questions, the profile
  summary) with their source URL; never give it a model or a way to compose
  text, or it can say things the site does not. Its skill table is exported
  and `scripts/build-api.mjs` generates `/.well-known/agent-card.json` from it
- `/mcp/docs` — a second read-only MCP server over the developer docs
  (`DOCS_MCP_TOOLS` in `middleware.ts`). Its card is generated to
  `/.well-known/mcp/docs-server-card.json` and also served at
  `/mcp/docs/.well-known/mcp/server-card.json`, because the host-level card
  describes `/mcp` and a checker comparing it to this server reports drift
- `/ask` — NLWeb (v0.55, list mode, JSON or SSE) in `middleware.ts`. Same
  rule as `/a2a`: it only returns published answers (`publishedAnswers()`),
  never generated text
- List endpoints take `?limit` and `?cursor` (paged in `middleware.ts`, the
  fields declared in the OpenAPI spec); `<document>.md` serves a markdown
  view of non-page documents such as `/llms.txt.md`
- `/pricing.md` — everything is free and no hiring rates are published;
  generated by `build-api.mjs`
- `plugin.json` and `mcp.json` at the repo root — the Agent Plugins manifest
  for both MCP servers; keep the server URLs in step with `middleware.ts`
- `/auth.md` — states that no credentials exist; generated by `build-api.mjs`
- `/.well-known/ard.json` (and the identical predecessor `ai-catalog.json`) —
  the Agentic Resource Discovery manifest, generated in `build-api.mjs` from
  the OpenAPI spec, `MCP_TOOLS`, `A2A_SKILLS` and `src/data/skills.ts`. It
  lists agentic resources only, never plain documents. A published skill needs
  `skillFile` (raw SKILL.md URL, checked to resolve) and 2-5 `queries`. Every
  page links it with `<link rel="ard">`. Check with the spec's conformance
  tool: `conformance-test manifest dist/.well-known/ard.json` from
  github.com/ards-project/ard-spec
- `/.well-known/agent-card.json`, `/.well-known/agent-skills/index.json`,
  `/.well-known/api-catalog`
- `/llms.txt`, `/llms-full.txt`, `/agents.md`, `/sitemap.xml`, `/schema-map.xml`

`public/agents.md` is a different document with a different audience: it tells
an agent *reading the site* what the site is a good source for. This file tells
an agent *editing the repository* how the repository works.
