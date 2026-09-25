/**
 * The one place the contribution graph's data is fetched and shaped, shared by
 * the build (scripts/build-api.mjs, which writes the snapshot) and the live
 * endpoint (api/github-contributions.mjs). The leading underscore keeps Vercel
 * from deploying this file as a function of its own.
 */

/** Must match `GITHUB` in src/data/projects.ts; build-api.mjs fails the build if it drifts. */
export const GITHUB_USER = "HarshithNayakaL";

const SOURCE = "https://github.com/grubersjoe/github-contributions-api";

export async function fetchContributions(user = GITHUB_USER, timeoutMs = 15_000) {
  const res = await fetch(
    `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(user)}?y=last`,
    { signal: AbortSignal.timeout(timeoutMs) },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
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
