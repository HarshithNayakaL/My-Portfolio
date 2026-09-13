# Harshith — Portfolio

AI Engineer portfolio. One scrolling page (Hero, Selected Work, Capabilities,
Agent Skills, About, FAQ, Contact) plus per-project case-study routes and legal
pages. Light canvas with a dark mode, a single rust accent, Poppins display over
Inter body with DM Mono for labels.

The site is also built to be read by machines: every page is prerendered to
static HTML, has a markdown twin, and is mirrored by a read-only JSON API.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`); all theme tokens live in `src/index.css`
- React Router for case-study and legal routes
- Self-hosted fonts via `@fontsource`: Inter Variable (body), Poppins (display),
  DM Mono (labels) — served from `public/fonts`, preloaded in `index.html`
- Phosphor icons
- `@bible-strong/avatar-core` for the mascot's geometry
- `@vercel/edge` for the content-negotiation middleware

No animation library. Scroll reveals and the page transition are CSS keyframes
and IntersectionObserver; pulling in a runtime for that put the whole library in
the initial bundle.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check, client build, SSR build, prerender, API
npm run preview  # serve the production build
npm run lint     # type-check only
```

`npm run build` is four stages, and the later ones are the ones that matter:
`vite build` emits the client bundle, a second `vite build --ssr` emits
`dist-ssr/entry-server.js`, `scripts/prerender.mjs` walks every route and writes
real HTML plus each page's markdown twin, and `scripts/build-api.mjs` emits the
static JSON API. A plain `vite build` (`npm run build:client`) skips all of
that and produces an empty-shell SPA.

## Checks

```bash
npm run verify:negotiation   # 25 client shapes get the right representation
npm run verify:onee          # every mascot animation is reachable
npm run verify:llms          # needs a server: npm run preview, then pass its URL
```

`verify:llms` defaults to `http://localhost:4321` and takes an origin as its
first argument, so point it at whatever `npm run preview` prints.

## Deploy

Vercel. Build command `npm run build`, output `dist`.

- `middleware.ts` runs at the edge and does the content negotiation, the API
  route table, and JSON errors for anything under `/api`.
- `vercel.json` carries the rewrites and headers.
- `public/_redirects` is there for Netlify; nothing reads it on Vercel.

## Content

Everything real lives in `src/data/`:

- `projects.ts` — Selected Work cards, plus email / GitHub / LinkedIn.
- `caseStudies.ts` — full case studies (problem, build, pipeline diagram,
  judgment calls, results, tech). The architecture diagrams are data-driven:
  edit a `pipeline` array and the node graph re-renders.
- `skills.ts` — the Agent Skills section.
- `seo.ts` — per-route titles, descriptions and JSON-LD.
- `onee.avatar.json` — the mascot's definition.

Adding or removing a project means touching `projects.ts`, `caseStudies.ts`,
and the slug sets in `middleware.ts`. `scripts/build-api.mjs` fails the build if
those drift apart, so a mismatch is caught rather than shipped.

## The nav bar's glass

`src/components/GlassFilter.tsx` holds a `CONFIG` block using the parameter
names from [liquid-glass.ybouane.com](https://liquid-glass.ybouane.com) —
`blurAmount`, `refraction`, `chromAberration`, `edgeHighlight`, `fresnel`,
`zRadius`, and so on. Tune the bar by changing those numbers; the filter graph
is built from them.

That library itself can't run here: it sizes a WebGL canvas to everything it
refracts, and this page is 12,473px tall on desktop and 19,236px on a phone,
which needs a canvas past Chromium's 16,384px limit. So the effect is rebuilt
as one SVG filter referenced from `backdrop-filter`. WebKit and Gecko don't
resolve filter references there and fall back to the plain blur declared
alongside it — same frost, no refraction at the rim.

## Open

- [ ] Custom domain. Canonical URLs and `og:url` currently point at the
      `vercel.app` subdomain.
- [ ] Confirm the glass on iOS Safari. The fallback is declared first so it
      should hold, but it has not been checked on a real WebKit engine.
- [ ] The prerendered HTML is ~110KB, of which about 40% is Tailwind class
      attributes (47,748 bytes across 642 elements) and 11% JSON-LD.
