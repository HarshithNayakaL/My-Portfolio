/**
 * Submit every URL in the sitemap to IndexNow.
 * https://www.indexnow.org/documentation
 *
 * IndexNow is a push protocol: instead of waiting to be crawled, the site
 * tells participating engines a URL changed. Bing, Yandex, Seznam and Naver
 * share submissions with each other, so one POST reaches all of them.
 *
 * This matters here because of who reads Bing's index. ChatGPT's web search
 * is served from it, so being absent from Bing means being invisible to
 * ChatGPT no matter how good the page is. Every indexing effort on this site
 * so far went through Google Search Console, which does nothing for Bing.
 *
 * Run after a deploy:  node scripts/indexnow.mjs
 * The key file must already be live at the site root or engines return 403.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const KEY = "2c57529720e86b07aa1e46b046b43e88";
const HOST = "harshith-nayaka-l-portfolio.vercel.app";
const ORIGIN = `https://${HOST}`;

const sitemap = readFileSync(join(ROOT, "public/sitemap.xml"), "utf8");
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

// The plain-text files aren't in the sitemap (sitemaps are for pages), but
// they're worth pushing too — they're the ones written for machines to read.
urlList.push(`${ORIGIN}/llms.txt`, `${ORIGIN}/llms-full.txt`);

if (!urlList.length) {
  console.error("no URLs found in sitemap.xml");
  process.exit(1);
}

// Verify the key file is actually reachable first. A 403 from the engines is
// otherwise indistinguishable from a bad key, and this is the usual cause.
const keyUrl = `${ORIGIN}/${KEY}.txt`;
const keyRes = await fetch(keyUrl);
const keyBody = (await keyRes.text()).trim();
if (!keyRes.ok || keyBody !== KEY) {
  console.error(
    `key file check failed: ${keyUrl} -> ${keyRes.status}, body ${JSON.stringify(keyBody.slice(0, 40))}`,
  );
  console.error("Deploy first; the key must be live before submitting.");
  process.exit(1);
}
console.log(`key file OK (${keyUrl})`);

const body = {
  host: HOST,
  key: KEY,
  keyLocation: keyUrl,
  urlList,
};

// api.indexnow.org fans the submission out to every participating engine, so
// one POST covers Bing, Yandex, Seznam and Naver rather than four.
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});

const text = await res.text();
const meaning =
  {
    200: "OK — submitted",
    202: "Accepted — key validation pending",
    400: "Bad request — invalid format",
    403: "Forbidden — key not valid or not reachable",
    422: "Unprocessable — URLs don't match host/key",
    429: "Too many requests",
  }[res.status] ?? "unexpected";

console.log(`submitted ${urlList.length} URLs -> ${res.status} (${meaning})`);
if (text.trim()) console.log(text.trim().slice(0, 300));
process.exit(res.status === 200 || res.status === 202 ? 0 : 1);
