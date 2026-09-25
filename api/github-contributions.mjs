import { fetchContributions } from "./_contributions.mjs";

/**
 * Live data for the contribution graph, served at /data/github-contributions.json
 * through a rewrite in vercel.json. It used to be a file written at build time,
 * which froze the graph on the day of the last deploy: a week without a deploy
 * was a week of commits the graph never showed.
 *
 * The CDN holds a response for an hour and serves the stale copy for up to a
 * day while it refetches in the background, so the upstream API sees about one
 * request an hour, and the visitor's browser still talks only to this origin.
 * Browsers always revalidate, so nobody keeps yesterday's graph in their cache.
 *
 * On an upstream failure this answers 502 and is not cached; the page then
 * falls back to the snapshot the build wrote.
 */
export default {
  async fetch() {
    try {
      const data = await fetchContributions(undefined, 8_000);
      return Response.json(data, {
        headers: {
          "Cache-Control": "public, max-age=0, must-revalidate",
          "Vercel-CDN-Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      });
    } catch (err) {
      return Response.json(
        { error: "upstream_unavailable", detail: String(err?.message ?? err) },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }
  },
};
