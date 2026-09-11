/**
 * Guard: every animation in Onee's definition must be reachable.
 *
 * The definition carries 23 animations. Shipping one the state machine can
 * never select is dead weight in the chunk and a character that is quietly
 * less alive than it looks, and neither shows up in a build or a screenshot.
 * So the moods are asserted here instead: each case below is a plausible
 * moment on the site, and it must produce the animation it is named after.
 *
 * Run with `npm run verify:onee`.
 */
import { readFileSync } from "node:fs";
import { transformSync } from "esbuild";

const root = new URL("../", import.meta.url);
const definition = JSON.parse(readFileSync(new URL("src/data/onee.avatar.json", root), "utf8"));

// oneeBehaviour imports nothing at runtime — only a type — so stripping the
// types leaves a module Node can import directly.
const source = readFileSync(new URL("src/lib/oneeBehaviour.ts", root), "utf8");
const js = transformSync(source, { loader: "ts", format: "esm" }).code;
const { readMood } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
);

const NOW = 1_000_000;
const base = () => ({
  now: NOW,
  lastInputAt: NOW,
  pointer: { x: 0, y: 0, speed: 0, seenAt: 0, inside: false },
  reach: Infinity,
  scroll: { speed: 0, flips: 0, at: 0 },
  atFoot: false,
  section: null,
  overAction: false,
  poke: { at: -Infinity, streak: 0, total: 0 },
  bornAt: NOW - 10_000,
  firstFootAt: Infinity,
  travelling: false,
  arrivedAt: -Infinity,
  beat: 0,
});
const withPointer = (s, extra) => ({ ...s, pointer: { ...s.pointer, inside: true, ...extra } });
const poked = (s, total, streak = 1) => ({ ...s, poke: { at: NOW - 200, streak, total } });

// One scenario per animation: what a visitor would be doing at that moment.
const scenarios = {
  waking: (s) => ({ ...s, bornAt: NOW - 200 }),
  playful: (s) => poked(s, 1),
  laughing: (s) => poked(s, 2),
  excited: (s) => poked(s, 3),
  proud: (s) => poked(s, 4),
  shy: (s) => ({ ...withPointer(s), reach: 40 }),
  celebrate: (s) => poked(s, 10),
  angry: (s) => poked(s, 6, 6),
  scared: (s) => ({ ...withPointer(s, { speed: 1400 }), reach: 40 }),
  surprised: (s) => ({ ...withPointer(s, { speed: 2200 }), reach: 600 }),
  listening: (s) => ({ ...withPointer(s, { seenAt: NOW - 400 }), reach: 150 }),
  suspicious: (s) => ({ ...withPointer(s, { seenAt: NOW - 5_000, speed: 10 }), reach: 150 }),
  searching: (s) => ({ ...s, scroll: { speed: 2400, flips: 1, at: NOW - 50 } }),
  confused: (s) => ({ ...s, scroll: { speed: 2400, flips: 4, at: NOW - 50 } }),
  sad: (s) => ({ ...s, pointer: { ...s.pointer, inside: false, seenAt: NOW - 1_000 } }),
  bored: (s) => ({ ...s, lastInputAt: NOW - 20_000 }),
  drowsy: (s) => ({ ...s, lastInputAt: NOW - 45_000 }),
  sleeping: (s) => ({ ...s, lastInputAt: NOW - 80_000 }),
  travelling: (s) => ({ ...s, travelling: true }),
  arriving: (s) => ({ ...s, arrivedAt: NOW - 300 }),
  working: (s) => ({ ...s, section: "work" }),
  thinking: (s) => ({ ...s, section: "capabilities" }),
  curious: (s) => ({ ...s, section: "about" }),
  happy: (s) => ({ ...s, section: "contact" }),
  idle: (s) => s,
};

let failures = 0;
const reached = new Set();

// A scenario named after an animation must produce it. The two named for a
// situation instead assert the head of the pool that situation draws from.
const POOL_HEADS = { travelling: "searching", arriving: "happy" };

for (const [name, build] of Object.entries(scenarios)) {
  const want = POOL_HEADS[name] ?? name;
  const senses = build(base());
  const got = readMood(senses).animation;
  reached.add(got);
  if (got !== want) {
    console.error(`  FAIL  scenario "${name}" produced "${got}", expected "${want}"`);
    failures += 1;
  }
  // Ambient moods rotate, so every entry in the pool has to be a real
  // animation and every one of them has to be reachable.
  for (let beat = 1; beat < 12; beat += 1) {
    reached.add(readMood({ ...senses, beat }).animation);
  }
}

const declared = definition.animationOrder;
const unreachable = declared.filter((name) => !reached.has(name));
const undeclared = [...reached].filter((name) => !declared.includes(name));

for (const name of unreachable) {
  console.error(`  FAIL  "${name}" is in the definition but nothing can trigger it`);
  failures += 1;
}
for (const name of undeclared) {
  console.error(`  FAIL  the state machine can select "${name}", which is not in the definition`);
  failures += 1;
}

if (failures > 0) {
  console.error(`\nonee moods: ${failures} problem(s)`);
  process.exit(1);
}
console.log(`onee moods: all ${declared.length} animations reachable, ${Object.keys(scenarios).length} scenarios correct`);
