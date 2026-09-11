import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * The stylesheet is left as Vite's normal, render-blocking
 * `<link rel="stylesheet">` on purpose.
 *
 * This used to be rewritten into a preload+swap pattern to avoid blocking
 * render on CSS, on the theory that nothing is visible in `<div id="root">`
 * until the JS bundle mounts anyway, so there was nothing for unstyled CSS to
 * flash against. That reasoning only held on localhost, where network latency
 * is ~0 and CSS always "won" the race against the much-larger JS bundle in
 * testing. On a real network the relative arrival time of the two isn't fixed
 * — when JS finished first, React mounted real content styled by the
 * browser's defaults for a moment before the CSS swap landed: a real,
 * user-visible flash of unstyled content. Render-blocking CSS is the
 * standard browser behavior specifically because it makes this class of bug
 * impossible — the browser simply never paints anything until CSS is ready,
 * JS included. The cost is a few hundred ms on an explicitly "Unscored"
 * PageSpeed line item; that's a trivial trade against a real visual bug on
 * every load.
 */
function fetchPriorityEntry(): Plugin {
  return {
    name: "fetchpriority-entry-script",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        // The entry script still benefits from being marked high-priority —
        // it competes against 8 font preloads firing from <head> at the same
        // time, and this keeps it from being starved by them. Doesn't touch
        // CSS at all, so it carries none of the risk above.
        return html.replace(
          /<script type="module"([^>]*?) src="([^"]+)"([^>]*)>/,
          (_match, before, src, after) =>
            `<script type="module" fetchpriority="high"${before} src="${src}"${after}>`,
        );
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), fetchPriorityEntry()],
  resolve: {
    alias: [
      // @bible-strong/avatar-core compiles its JSON Schema at module scope, so
      // Ajv is unremovable by tree-shaking even though nothing on this site
      // calls the validator. See src/lib/ajvStub.ts for why it is safe to
      // replace and where the definition is actually checked instead.
      { find: /^ajv\/dist\/2020\.js$/, replacement: "/src/lib/ajvStub.ts" },
    ],
  },
});
