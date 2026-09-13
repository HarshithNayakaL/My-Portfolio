/**
 * Guard: who gets the markdown twin and who gets the HTML document.
 *
 * The site publishes a markdown version of every page, and the point of the
 * negotiation is that an agent never has to parse a 110KB HTML document to
 * read a CV. Getting this wrong is invisible — the page still returns 200, it
 * is simply the wrong representation, and the only symptom is an agent
 * reporting truncated HTML somewhere else entirely. So the matrix is asserted.
 *
 * Run with `npm run verify:negotiation`.
 */
import { readFileSync } from "node:fs";
import { transformSync } from "esbuild";

const root = new URL("../", import.meta.url);
const src = readFileSync(new URL("middleware.ts", root), "utf8")
  // The decision is pure; the Vercel runtime import around it is not needed.
  .replace(/^import[^;]+from "@vercel\/edge";$/m, "const rewrite = () => {}, next = () => {};");
const js = transformSync(src, { loader: "ts", format: "esm" }).code;
const { servesMarkdown } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
);

const BROWSER = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,*/*;q=0.8";

// [name, user-agent, accept, mode, expected]
const cases = [
  // Real browsers must always get the real document.
  ["Chrome", "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36", BROWSER, null, false],
  ["Safari iOS", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Version/17.0 Mobile Safari", BROWSER, null, false],
  ["Firefox", "Mozilla/5.0 (X11; Linux) Gecko/20100101 Firefox/121.0", BROWSER, null, false],

  // Search crawlers: serving these anything but the HTML is cloaking.
  ["Googlebot", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", BROWSER, null, false],
  ["Googlebot, wildcard accept", "Mozilla/5.0 (compatible; Googlebot/2.1)", "*/*", null, false],
  ["Bingbot", "Mozilla/5.0 (compatible; bingbot/2.0)", "*/*", null, false],
  ["Applebot", "Mozilla/5.0 (compatible; Applebot/0.1)", "*/*", null, false],

  // Link unfurlers read og: tags out of <head>.
  ["Twitterbot", "Twitterbot/1.0", "*/*", null, false],
  ["facebookexternalhit", "facebookexternalhit/1.1", "*/*", null, false],
  ["LinkedInBot", "LinkedInBot/1.0", "*/*", null, false],
  ["Slackbot", "Slackbot-LinkExpanding 1.0", "*/*", null, false],
  ["Discordbot", "Mozilla/5.0 (compatible; Discordbot/2.0)", "*/*", null, false],

  // Auditing tools need the document they are auditing.
  ["Lighthouse", "Mozilla/5.0 Chrome-Lighthouse", BROWSER, null, false],

  // Named model crawlers — the original allowlist, still honoured.
  ["ChatGPT-User", "Mozilla/5.0 (compatible; ChatGPT-User/1.0)", "*/*", null, true],
  ["ClaudeBot", "Mozilla/5.0 (compatible; ClaudeBot/1.0)", "*/*", null, true],
  ["PerplexityBot", "Mozilla/5.0 (compatible; PerplexityBot/1.0)", "*/*", null, true],

  // The reason this guard exists: generic agent HTTP clients, none of which
  // are on any allowlist, all of which were being handed 110KB of HTML.
  ["python-requests", "python-requests/2.31.0", "*/*", null, true],
  ["node-fetch", "node-fetch/3.3.2", "*/*", null, true],
  ["axios", "axios/1.6.0", "*/*", null, true],
  ["curl", "curl/8.4.0", "*/*", null, true],
  ["Go http", "Go-http-client/2.0", "*/*", null, true],
  ["no user-agent at all", null, "*/*", null, true],
  ["no accept header at all", "some-unknown-agent/1.0", null, null, true],

  // Explicit asks.
  ["Accept: text/markdown", "curl/8.4.0", "text/markdown", null, true],
  ["?mode=agent from a browser", "Mozilla/5.0 Chrome/120", BROWSER, "agent", true],
];

let failures = 0;
for (const [name, ua, accept, mode, expected] of cases) {
  const got = servesMarkdown({ accept, ua, mode });
  if (got !== expected) {
    console.error(
      `  FAIL  ${name}: expected ${expected ? "markdown" : "HTML"}, got ${got ? "markdown" : "HTML"}`,
    );
    failures += 1;
  }
}

if (failures > 0) {
  console.error(`\nnegotiation: ${failures} of ${cases.length} wrong`);
  process.exit(1);
}
console.log(`negotiation: all ${cases.length} clients get the right representation`);
