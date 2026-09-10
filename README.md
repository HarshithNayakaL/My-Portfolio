# Harshith — Portfolio

AI Engineer portfolio. Single-page scroll (Hero, Selected Work, Capabilities, About, Contact) plus reusable case-study pages. Design direction **D1 "Engineered"**: near-black canvas, single electric-lime accent, mono + sans pairing, node-graph / pipeline motifs.

## Stack
- Vite + React + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`, theme tokens in `src/index.css`)
- Motion (`motion/react`) for scroll reveals + hero entrance
- Self-hosted variable fonts: Geist (sans) + JetBrains Mono (mono), via `@fontsource-variable`
- Phosphor icons
- React Router (case-study routes)

## Develop
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to /dist
npm run preview  # serve the production build
```

## Deploy
Static SPA. Build command `npm run build`, output dir `dist`.
- **Netlify:** `public/_redirects` handles SPA routing.
- **Vercel:** `vercel.json` handles SPA rewrites.

## Editing content
All real content lives in `src/data/`:
- `projects.ts` — the Selected Work cards, plus email / GitHub / LinkedIn.
- `caseStudies.ts` — full case-study content (problem, build, pipeline diagram, judgment calls, results, tech).

The architecture diagrams are data-driven: edit the `pipeline` arrays in `caseStudies.ts` and the node-graph renders automatically.

## Remaining content TODOs (the `[FILL]`s)
- [ ] **Real photo** of Harshith. Drop a square image in `/public` and swap the monogram block in `src/components/About.tsx` (marked with a `TODO` comment) for an `<img>`.
- [ ] **Nova AI live URL** and **CraftConnect repo URL** — currently both link to the GitHub profile in `src/data/projects.ts`. Replace with exact URLs when available.
- [x] **Flagship case study** is `brandforge` — a real, public repo replacing the former `creative-ops-pipeline` placeholder.
- [ ] **Domain** + final OG URL (`og:url` not yet set in `index.html`).
- [ ] **"Open to select freelance projects"** chip in `About.tsx` — remove it if you'd rather not signal availability to employers.
- [ ] Optional: a real **OG preview PNG**. `public/og-image.svg` exists, but some social scrapers don't render SVG; export a 1200×630 PNG and point `og:image` at it for guaranteed previews.
