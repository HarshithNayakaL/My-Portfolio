/**
 * Onee, the companion that lives on the site.
 *
 * Everything here — the geometry solver, the 24KB definition, the state
 * machine, the listeners, the SVG itself — sits behind one dynamic import
 * from OneeCompanion, so none of it is on the critical path and a visitor who
 * never gets the chunk simply has a site without a mascot.
 *
 * There is no React below this line, on purpose. Onee repaints its own paths
 * and rewrites its own transform sixty times a second; routing that through a
 * component would mean sixty renders a second of a tree React would then have
 * to diff. It owns a handful of DOM nodes and writes to them directly.
 */
import { readMood, DWELL_MS, type Senses } from "./oneeBehaviour";
import { createOneeRuntime, restingScene, type OneeAnimation } from "./oneeRuntime";

const SVG_NS = "http://www.w3.org/2000/svg";

// Layout. Onee keeps clear of the nav, hugs the edges, and is small enough
// that trailing a cursor never puts it on top of what you are reading.
const TOP_LIMIT = 104;
const EDGE = 18;
const BUBBLE = 96; // personal space it backs out of
const TRAIL = 232; // how far behind the pointer it prefers to sit

// Spring. Slack enough to read as an animal ambling after you rather than a
// cursor attachment.
const PULL = 0.07;
const DRAG = 0.84;

// Scroll momentum. Each scrolled pixel adds to a lag that bleeds off over
// about a second. Using the accumulated lag rather than instantaneous speed is
// what makes the effect readable: a flick's velocity is gone in 200ms, far too
// short for a lazy spring to travel any distance, so reading speed directly
// produced a 20px twitch where the intent was for Onee to be left behind and
// then come back down to you.
const LAG_PER_PX = 0.3;
const LAG_DECAY = 0.965;
const LAG_LIMIT = 190;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Which section is filling the viewport, by the largest slice on screen. */
function watchSections(onChange: (id: string | null) => void) {
  const ratios = new Map<string, number>();
  let observer: IntersectionObserver | undefined;

  const settle = () => {
    let best: string | null = null;
    let top = 0.12; // ignore sections barely peeking in
    for (const [id, ratio] of ratios) {
      if (ratio > top) {
        top = ratio;
        best = id;
      }
    }
    onChange(best);
  };

  const scan = () => {
    observer?.disconnect();
    ratios.clear();
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) ratios.set(e.target.id, e.intersectionRatio);
        settle();
      },
      { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] },
    );
    for (const el of document.querySelectorAll("section[id], div[id].page-enter section[id]")) {
      observer.observe(el);
    }
  };

  // Routes swap the whole page subtree, which takes the observed sections with
  // them, so the scan is redone whenever the tree settles after a change.
  let pending = 0;
  const mutations = new MutationObserver(() => {
    clearTimeout(pending);
    pending = window.setTimeout(scan, 300);
  });
  const main = document.querySelector("main");
  if (main) mutations.observe(main, { childList: true, subtree: true });

  scan();
  return () => {
    clearTimeout(pending);
    mutations.disconnect();
    observer?.disconnect();
  };
}

export function mountOnee(host: HTMLElement): () => void {
  const scene = restingScene();

  // --- the character ------------------------------------------------------
  const shell = document.createElement("div");
  shell.className = "onee";

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "-150 -150 300 300");
  svg.setAttribute("class", "onee__svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  const el = <K extends keyof SVGElementTagNameMap>(name: K) =>
    document.createElementNS(SVG_NS, name);

  // The body outline is needed twice — once to draw, once to clip the eyes to
  // the face — so it is defined once and referenced, and the frame loop only
  // ever rewrites one `d` for it.
  const defs = el("defs");
  const body = el("path");
  body.id = "onee-body";
  body.setAttribute("d", scene.geometry.headPath);
  const clip = el("clipPath");
  clip.id = "onee-clip";
  const clipUse = el("use");
  clipUse.setAttribute("href", "#onee-body");
  clip.append(clipUse);
  defs.append(body, clip);

  const skin = el("use");
  skin.setAttribute("href", "#onee-body");
  skin.setAttribute("fill", scene.colors.body);

  const face = el("g");
  face.setAttribute("clip-path", "url(#onee-clip)");
  face.setAttribute("fill", scene.colors.eyes);
  const left = el("path");
  const right = el("path");
  left.setAttribute("d", scene.geometry.leftPath);
  right.setAttribute("d", scene.geometry.rightPath);
  face.append(left, right);

  svg.append(defs, skin, face);
  shell.append(svg);
  host.append(shell);

  // --- what it knows ------------------------------------------------------
  const now0 = performance.now();
  const senses: Senses = {
    now: now0,
    lastInputAt: now0,
    pointer: { x: 0, y: 0, speed: 0, seenAt: 0, inside: false },
    reach: Infinity,
    scroll: { speed: 0, flips: 0, at: 0 },
    atFoot: false,
    section: null,
    overAction: false,
    poke: { at: -Infinity, streak: 0, total: 0 },
    bornAt: now0,
    firstFootAt: Infinity,
  };

  // Whether Onee chases a cursor or rides the scroll is decided by the events
  // that actually arrive, not by a media query. `(hover: hover)` is a claim
  // about the device, and it is wrong often enough to matter — hybrid laptops
  // report coarse, some headless and embedded browsers report no hover at all
  // while sending perfectly good mouse events. So: a real mouse or pen move
  // turns following on, a real touch turns it back off, and a device with both
  // tracks whichever the visitor picked up last.
  let roams = false;

  let pos = { x: 0, y: 0 };
  const vel = { x: 0, y: 0 };
  let lag = 0;
  let side: 1 | -1 = 1;
  let size = 72;

  const measure = () => {
    size = shell.offsetWidth || 72;
  };

  const home = () => ({
    x: window.innerWidth - EDGE - size / 2,
    y: window.innerHeight - EDGE - size / 2 - (roams ? 0 : 12),
  });

  pos = home();
  measure();

  // --- listeners ----------------------------------------------------------
  const stir = () => {
    // Waking is its own beat: coming back from drowsy or asleep restarts the
    // clock so `waking` gets to play before anything else takes the face.
    if (senses.now - senses.lastInputAt > 40_000) senses.bornAt = senses.now;
    senses.lastInputAt = senses.now;
  };

  let lastMove = { x: 0, y: 0, t: 0 };
  const onMove = (e: PointerEvent) => {
    const t = performance.now();
    if (e.pointerType === "touch") {
      roams = false;
      senses.pointer.inside = false;
      return;
    }
    roams = true;
    const dt = Math.max(16, t - lastMove.t);
    if (lastMove.t) {
      const d = Math.hypot(e.clientX - lastMove.x, e.clientY - lastMove.y);
      // Smoothed so one stuttery sample can't read as a lunge.
      senses.pointer.speed = senses.pointer.speed * 0.6 + (d / dt) * 1000 * 0.4;
    }
    lastMove = { x: e.clientX, y: e.clientY, t };
    senses.pointer.x = e.clientX;
    senses.pointer.y = e.clientY;
    if (!senses.pointer.inside) senses.pointer.seenAt = t;
    senses.pointer.inside = true;
    stir();
  };

  // Fired on the root element, so it means the pointer left the window itself
  // rather than merely crossed from one element to the next.
  const onLeave = () => {
    senses.pointer.inside = false;
    senses.pointer.speed = 0;
    senses.pointer.seenAt = performance.now();
  };

  const onOver = (e: Event) => {
    const target = e.target as Element | null;
    senses.overAction = !!target?.closest?.("a[href], button:not(.onee)");
  };

  let lastScroll = { y: window.scrollY, t: now0, dir: 0 };
  const onScroll = () => {
    const t = performance.now();
    const y = window.scrollY;
    const dt = Math.max(16, t - lastScroll.t);
    const speed = ((y - lastScroll.y) / dt) * 1000;
    const dir = Math.sign(speed);
    if (dir !== 0 && dir !== lastScroll.dir) {
      // A run of direction changes inside a couple of seconds reads as someone
      // hunting up and down for something they can't find.
      senses.scroll.flips = t - senses.scroll.at < 2_000 ? senses.scroll.flips + 1 : 1;
      lastScroll.dir = dir;
    }
    lag += (y - lastScroll.y) * LAG_PER_PX;
    senses.scroll.speed = senses.scroll.speed * 0.5 + speed * 0.5;
    senses.scroll.at = t;
    lastScroll = { y, t, dir: lastScroll.dir };

    const foot = y + window.innerHeight >= document.documentElement.scrollHeight - 140;
    if (foot && !senses.atFoot) senses.firstFootAt = Math.min(senses.firstFootAt, t);
    senses.atFoot = foot;
    stir();
  };

  const onPoke = (e: Event) => {
    e.preventDefault();
    const t = performance.now();
    senses.poke.streak = t - senses.poke.at < 1_400 ? senses.poke.streak + 1 : 1;
    senses.poke.at = t;
    senses.poke.total += 1;
    stir();
  };

  const onResize = () => {
    measure();
    pos.x = clamp(pos.x, EDGE + size / 2, window.innerWidth - EDGE - size / 2);
    pos.y = clamp(pos.y, TOP_LIMIT, window.innerHeight - EDGE - size / 2);
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave, { passive: true });
  document.addEventListener("pointerover", onOver, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("keydown", stir, { passive: true });
  shell.addEventListener("pointerdown", onPoke);

  const stopSections = watchSections((id) => {
    senses.section = id;
  });

  // --- the loop -----------------------------------------------------------
  let mood: OneeAnimation = "waking";
  let moodSince = now0;

  const runtime = createOneeRuntime((frame) => {
    const t = performance.now();
    senses.now = t;

    // Pointer speed bleeds off, or a pointer parked mid-screen would read as
    // travelling at whatever its last sample said forever.
    if (t - lastMove.t > 120) senses.pointer.speed *= 0.85;
    if (t - senses.scroll.at > 160) senses.scroll.speed *= 0.8;
    lag *= LAG_DECAY;

    senses.reach = senses.pointer.inside
      ? Math.hypot(pos.x - senses.pointer.x, pos.y - senses.pointer.y)
      : Infinity;

    // --- mood
    const next = readMood(senses).animation;
    if (next !== mood && t - moodSince > DWELL_MS) {
      mood = next;
      moodSince = t;
      runtime.play(mood);
    }

    // --- where it wants to be
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // The roaming band: the lower part of the viewport, clear of the nav.
    // Onee is confined to it unless the cursor comes down to join it. Letting
    // it trail a cursor freely in two dimensions looked right in the abstract
    // and was wrong on the page — it parked on the middle of the H1 and ate a
    // word. A character that wanders is charming; one that covers the headline
    // is a bug wearing a costume.
    const floor = vh - EDGE - size / 2;
    const ceiling = Math.min(floor, Math.max(TOP_LIMIT + size / 2, vh * 0.68));

    // Idle patrol. The exponent biases the sweep toward the ends of its travel,
    // so Onee loiters near the left and right edges — where the margins are —
    // and crosses the middle of the column briskly instead of parking in it.
    const swing = Math.sin(t / 11_000);
    const edged = Math.sign(swing) * Math.abs(swing) ** 0.35;
    const sweepX = vw / 2 + edged * (vw / 2 - EDGE - size / 2);
    const sweepY = ceiling + (Math.sin(t / 7_300 + 1.2) * 0.5 + 0.5) * (floor - ceiling);

    // Scrolling drags Onee behind — down the page pulls it up the screen — and
    // it glides back down once the scrolling stops. That lag is what makes it
    // read as being carried along rather than pinned to the glass, and on a
    // touch device it is the only movement cue there is.
    const dragged = sweepY - clamp(lag, -LAG_LIMIT, LAG_LIMIT);

    let tx: number;
    let ty: number;

    if (roams && senses.pointer.inside) {
      const dx = pos.x - senses.pointer.x;
      const dy = pos.y - senses.pointer.y;
      const d = Math.hypot(dx, dy) || 1;

      if (senses.pointer.y > ceiling - 60) {
        // The cursor has come down into Onee's band, so it gets the run of two
        // dimensions: back off if crowded, amble over if left behind, potter
        // about if the distance is comfortable.
        const nx = dx / d;
        const ny = dy / d;
        if (d < BUBBLE) {
          tx = senses.pointer.x + nx * BUBBLE * 1.9;
          ty = senses.pointer.y + ny * BUBBLE * 1.9;
        } else if (d > TRAIL) {
          tx = senses.pointer.x + nx * TRAIL * 0.82;
          ty = senses.pointer.y + ny * TRAIL * 0.82;
        } else {
          tx = pos.x + Math.sin(t / 3_300) * 12;
          ty = pos.y + Math.sin(t / 2_450 + 1.7) * 9;
        }
        // Even backing away from a crowding cursor, it stays in the band —
        // fleeing upward is how it ended up on the headline in the first place.
        ty = clamp(ty, ceiling, floor);
      } else {
        // The cursor is up in the reading area. Onee shadows it left and right
        // but stays low, so it is visibly tracking you without climbing over
        // the thing you are reading. The side it sits on only flips once the
        // cursor is well past it, or it would jitter across the cursor every
        // time the two lined up.
        if (Math.abs(dx) > 48) side = Math.sign(dx) as 1 | -1;
        tx = senses.pointer.x + side * TRAIL * 0.6;
        ty = dragged;
      }
    } else {
      tx = sweepX;
      ty = dragged;
    }

    // Scroll momentum is the one thing allowed above the band: it is transient,
    // and nothing on a page mid-flick is being read anyway. The nav is never
    // negotiable.
    tx = clamp(tx, EDGE + size / 2, vw - EDGE - size / 2);
    ty = clamp(ty, TOP_LIMIT + size / 2, floor);

    vel.x = (vel.x + (tx - pos.x) * PULL) * DRAG;
    vel.y = (vel.y + (ty - pos.y) * PULL) * DRAG;
    pos.x += vel.x;
    pos.y += vel.y;

    // Leans into its own motion, and breathes.
    const tilt = clamp(vel.x * 1.2, -16, 16);
    const breath = 1 + Math.sin(t / 920) * 0.018;
    shell.style.transform =
      `translate3d(${Math.round(pos.x - size / 2)}px, ${Math.round(pos.y - size / 2)}px, 0)` +
      ` rotate(${tilt.toFixed(2)}deg) scale(${breath.toFixed(3)})`;

    // --- the face
    const g = frame.geometry;
    body.setAttribute("d", g.headPath);
    left.setAttribute("d", g.leftPath);
    left.setAttribute("opacity", g.leftVisible ? "1" : "0");
    right.setAttribute("d", g.rightPath);
    right.setAttribute("opacity", g.rightVisible ? "1" : "0");
  }, mood);

  // Nothing to animate for in a background tab.
  const onVisibility = () => (document.hidden ? runtime.stop() : runtime.start());
  document.addEventListener("visibilitychange", onVisibility);

  // Onee arrives asleep and opens its eyes, which doubles as the entrance: it
  // fades up over its first beat instead of appearing fully formed.
  requestAnimationFrame(() => shell.classList.add("is-awake"));

  return () => {
    runtime.stop();
    stopSections();
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    document.removeEventListener("pointerover", onOver);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("keydown", stir);
    document.removeEventListener("visibilitychange", onVisibility);
    shell.remove();
  };
}
