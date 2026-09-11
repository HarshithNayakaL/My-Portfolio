/**
 * Onee's mind.
 *
 * Every one of the 23 animations in the definition is reachable from something
 * a visitor actually does — scripts/check-onee-moods.mjs fails the check if one
 * stops being. Several are reachable more than one way, because the ambient
 * pools deal most of them out as well; what matters is that none is dead.
 *
 * Kept apart from onee.ts so the state machine can be read as a list of moods
 * rather than picked out of a frame loop.
 */
import type { OneeAnimation } from "./oneeRuntime";

/** Everything the companion knows about the visitor, sampled each frame. */
export type Senses = {
  now: number;
  /** Last pointer move, scroll, key or tap — anything that says someone is there. */
  lastInputAt: number;
  /** Pointer position and how fast it is travelling, in px/s. */
  pointer: { x: number; y: number; speed: number; seenAt: number; inside: boolean };
  /** Distance from Onee's centre to the pointer, in px. */
  reach: number;
  /** Signed scroll speed in px/s, and how often it has changed direction lately. */
  scroll: { speed: number; flips: number; at: number };
  /** Whether the visitor has reached the end of the page. */
  atFoot: boolean;
  /** Section id currently filling the viewport, if any. */
  section: string | null;
  /** Set while the pointer is over any link or button on the page. */
  overAction: boolean;
  /** When the last poke landed, and how many have landed in quick succession. */
  poke: { at: number; streak: number; total: number };
  /** When the page finished waking Onee up. */
  bornAt: number;
  /** First time the visitor has ever reached the foot of the page this visit. */
  firstFootAt: number;
  /** True while Onee is crossing the screen to a new spot. */
  travelling: boolean;
  /** When it last finished a crossing, so arriving somewhere gets its own beat. */
  arrivedAt: number;
  /** Ticks every few seconds. Ambient moods step through their pool on it. */
  beat: number;
};

export type Mood = { animation: OneeAnimation; until?: number };

// How long a reaction owns the face before the next rule gets a say. Without a
// floor, a pointer skimming past would flicker Onee through four animations in
// half a second and read as a glitch rather than a character.
export const DWELL_MS = 700;

const REACTIONS: OneeAnimation[] = [
  "playful",
  "laughing",
  "excited",
  "proud",
  "shy",
  "celebrate",
];

// Idle ladder. Onee loses interest, then gets heavy-lidded, then drops off.
const BORED_AFTER = 18_000;
const DROWSY_AFTER = 40_000;
const ASLEEP_AFTER = 70_000;

const WAKE_MS = 2_400;
const BUBBLE = 96; // personal space, px
const LOOM = 190; // close enough to be watched, px
const LUNGE = 1_100; // px/s of pointer speed that reads as a charge
const STARTLE = 1_900; // px/s that reads as a jump-scare
const SCAN = 1_500; // px/s of scrolling that reads as hunting for something

// Ambient moods come in pools rather than one animation per situation, and
// step through them on `beat`. Holding a single animation for as long as
// somebody reads a section is technically correct and reads as a screensaver;
// a character sat at a desk fidgets. The first entry is the section's
// signature mood, so the pools stay legible and the guard can assert them.
const SECTION_POOLS: Record<string, OneeAnimation[]> = {
  work: ["working", "thinking", "curious", "working", "proud", "listening"],
  capabilities: ["thinking", "working", "listening", "curious", "thinking"],
  approach: ["thinking", "curious", "listening", "thinking", "working"],
  skills: ["searching", "thinking", "excited", "curious", "searching", "proud"],
  about: ["curious", "listening", "shy", "happy", "curious", "playful"],
  faq: ["listening", "thinking", "confused", "curious", "listening"],
  contact: ["happy", "excited", "playful", "celebrate", "happy", "laughing"],
};

// Nothing in particular on screen — still no reason to stand perfectly still.
const AMBIENT: OneeAnimation[] = [
  "idle",
  "curious",
  "listening",
  "idle",
  "thinking",
  "playful",
  "idle",
  "searching",
];

// Landing somewhere new is worth a beat of its own, and crossing the screen
// should look like going somewhere rather than sliding.
const ARRIVALS: OneeAnimation[] = ["happy", "playful", "proud", "excited", "surprised", "curious"];
const TRAVELLING: OneeAnimation[] = ["searching", "curious"];
const ARRIVAL_MS = 1_500;

const pick = (pool: OneeAnimation[], beat: number) => pool[beat % pool.length];

/**
 * Pick the animation Onee should be holding. Ordered: the first rule that
 * matches wins, so the loud, deliberate things (being poked, being crowded)
 * outrank the ambient ones (what section you are reading, how bored it is).
 */
export function readMood(s: Senses): Mood {
  const sincePoke = s.now - s.poke.at;
  const sinceInput = s.now - s.lastInputAt;

  // Just born. Onee opens its eyes before doing anything else.
  if (s.now - s.bornAt < WAKE_MS) return { animation: "waking" };

  // Poked. Hammering on it wears out the welcome.
  if (sincePoke < 2_800) {
    if (s.poke.streak >= 5) return { animation: "angry" };
    if (s.poke.total > 0 && s.poke.total % 10 === 0) return { animation: "celebrate" };
    return { animation: REACTIONS[(s.poke.total - 1) % REACTIONS.length] };
  }

  // Crowded. Inside its personal space it shrinks away; charged at, it bolts.
  if (s.pointer.inside && s.reach < BUBBLE) {
    return { animation: s.pointer.speed > LUNGE ? "scared" : "shy" };
  }

  // Something moved fast enough to make it flinch.
  if (s.pointer.inside && s.pointer.speed > STARTLE) return { animation: "surprised" };

  // Hovering something clickable — it leans in at whatever you are about to do.
  if (s.overAction) return { animation: "excited" };

  // Being watched from just outside arm's reach. A pointer that creeps in and
  // loiters gets side-eye; one that arrives and settles gets attention.
  if (s.pointer.inside && s.reach < LOOM) {
    const loitering = s.now - s.pointer.seenAt > 2_000;
    if (loitering && s.pointer.speed < 40) return { animation: "suspicious" };
    return { animation: "listening" };
  }

  // Scrolling. Thrashing up and down reads as lost; one long sweep reads as
  // looking for something.
  if (Math.abs(s.scroll.speed) > SCAN && s.now - s.scroll.at < 240) {
    return { animation: s.scroll.flips >= 3 ? "confused" : "searching" };
  }

  // Made it to the bottom. The first time is worth a party; after that it is
  // merely something to be pleased about.
  if (s.atFoot) {
    return { animation: s.now - s.firstFootAt < 4_000 ? "celebrate" : "proud" };
  }

  // The visitor took the pointer off the window entirely.
  if (!s.pointer.inside && s.pointer.seenAt > 0 && s.now - s.pointer.seenAt < 6_000) {
    return { animation: "sad" };
  }

  // Nobody has done anything for a while.
  if (sinceInput > ASLEEP_AFTER) return { animation: "sleeping" };
  if (sinceInput > DROWSY_AFTER) return { animation: "drowsy" };
  if (sinceInput > BORED_AFTER) return { animation: "bored" };

  // Just landed somewhere new — a beat of pleasure at having gone there.
  if (s.now - s.arrivedAt < ARRIVAL_MS) return { animation: pick(ARRIVALS, s.beat) };

  // On its way across the screen, so it looks like it is going somewhere.
  if (s.travelling) return { animation: pick(TRAVELLING, s.beat) };

  // Reading something in particular.
  const pool = s.section ? SECTION_POOLS[s.section] : undefined;
  if (pool) return { animation: pick(pool, s.beat) };

  return { animation: pick(AMBIENT, s.beat) };
}
