/**
 * The one place the contribution graph's data is fetched and shaped, shared by
 * the build (scripts/build-api.mjs, which writes the snapshot) and the live
 * endpoint (api/github-contributions.mjs). The leading underscore keeps Vercel
 * from deploying this file as a function of its own.
 */

import https from "node:https";
import { gunzipSync } from "node:zlib";

/** Must match `GITHUB` in src/data/projects.ts; build-api.mjs fails the build if it drifts. */
export const GITHUB_USER = "HarshithNayakaL";

const SOURCE = "https://github.com/grubersjoe/github-contributions-api";

// fetch() decodes whatever Content-Encoding a server sends, Brotli included,
// and CVE-2026-111497 (Node2Shell) is a remote-code-execution bug in Node's
// Brotli decoder. This API is someone else's server, so the request asks for
// gzip and an answer in any other encoding is refused before it is decoded.
function getJson(url, headers, timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { ...headers, "Accept-Encoding": "gzip" }, signal: AbortSignal.timeout(timeoutMs) },
      (res) => {
        const enc = (res.headers["content-encoding"] ?? "identity").trim().toLowerCase();
        if (res.statusCode < 200 || res.statusCode > 299) {
          res.destroy();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        if (enc !== "gzip" && enc !== "identity") {
          res.destroy();
          return reject(new Error(`refused Content-Encoding: ${enc}`));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("error", reject);
        res.on("end", () => {
          try {
            const raw = Buffer.concat(chunks);
            const text = (enc === "gzip" ? gunzipSync(raw, { maxOutputLength: 32 * 1024 * 1024 }) : raw).toString("utf8");
            resolve(JSON.parse(text));
          } catch (err) {
            reject(err);
          }
        });
      },
    );
    req.on("error", reject);
  });
}

export async function fetchContributions(user = GITHUB_USER, timeoutMs = 15_000) {
  const body = await getJson(
    `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(user)}?y=last`,
    // A named client rather than Node's anonymous default: a free public
    // API is entitled to know who is calling, and anonymous datacenter
    // traffic is what gets throttled first.
    { "User-Agent": `${user}-portfolio (+https://github.com/${user}/My-Portfolio)` },
    timeoutMs,
  );
  const contributions = (body.contributions ?? []).filter(
    (d) => typeof d.date === "string" && Number.isInteger(d.count) && d.level >= 0 && d.level <= 4,
  );
  const total = body.total?.lastYear;
  if (!contributions.length || !Number.isInteger(total)) throw new Error("unexpected response shape");
  return {
    user,
    profile: `https://github.com/${user}`,
    total,
    from: contributions[0].date,
    to: contributions.at(-1).date,
    fetchedAt: new Date().toISOString(),
    source: SOURCE,
    contributions,
  };
}
