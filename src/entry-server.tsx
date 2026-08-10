import { Writable } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./App";

// Re-exported so the prerender script can pull route metadata and content
// from the same modules the app itself renders from — one source of truth,
// and one bundle for the build step to import.
export { routeSeo, allRoutes, ORIGIN } from "./data/seo";
export { caseStudies } from "./data/caseStudies";
export { projects, NAME } from "./data/projects";

/**
 * Render one route to a complete HTML string for the build-time prerenderer.
 *
 * Uses `renderToPipeableStream` rather than `renderToString` on purpose:
 * `renderToString` cannot resolve a `React.lazy` promise, so the code-split
 * case-study and legal routes would prerender their Suspense fallback (an
 * empty div) instead of real content — exactly the pages that most need to be
 * crawlable. `onAllReady` fires only once every Suspense boundary has
 * resolved, which is the behaviour a static build wants.
 */
export function render(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let settled = false;

    const sink = new Writable({
      write(chunk, _enc, cb) {
        // Collect raw bytes and decode once at the end: decoding per chunk
        // would corrupt any multi-byte character split across a boundary.
        chunks.push(Buffer.from(chunk));
        cb();
      },
      final(cb) {
        settled = true;
        // React 18's Node stream renderer fills a fixed 2048-byte view with
        // TextEncoder.encodeInto. When a multi-byte character (em dash, arrow,
        // curly quote — all over this site's copy) doesn't fit in the bytes
        // left in the view, encodeInto writes nothing and the remainder is
        // flushed as NUL padding; the character itself is emitted intact at
        // the start of the next view. So the text is complete and the NULs are
        // pure padding. They are never valid in HTML, and leaving them in made
        // the output a binary file to every text tool that touched it.
        resolve(Buffer.concat(chunks).toString("utf8").replace(/\0/g, ""));
        cb();
      },
    });

    const { pipe, abort } = renderToPipeableStream(
      <StaticRouter location={url}>
        <App />
      </StaticRouter>,
      {
        onAllReady() {
          pipe(sink);
        },
        onError(error) {
          if (!settled) {
            settled = true;
            reject(error);
          }
        },
      },
    );

    // A hung lazy import should fail the build loudly rather than emit a page
    // with a hole in it.
    setTimeout(() => {
      if (!settled) {
        settled = true;
        abort();
        reject(new Error(`Prerender timed out for route: ${url}`));
      }
    }, 20_000);
  });
}
