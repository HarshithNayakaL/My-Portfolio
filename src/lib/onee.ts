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
import {
  createOneeRuntime,
  restingScene,
  type Gaze,
  type OneeAnimation,
} from "./oneeRuntime";

const SVG_NS = "http://www.w3.org/2000/svg";

// Layout. The nav is the one place Onee may never go; everywhere else in the
// window is fair game, subject to the hit test in `isFree` below.
const TOP_LIMIT = 104;
const EDGE = 18;
const BUBBLE = 96; // personal space it backs out of
const TRAIL = 232; // how far behind the pointer it prefers to sit

// Spring. Slack enough to read as an animal ambling after you rather than a
// cursor attachment.
const PULL = 0.062;
const DRAG = 0.86;
// Crossing the screen gets a stiffer, looser spring so a trip reads as a
// deliberate scurry with a little overshoot at the end, not a slow slide.
const PULL_TRAVEL = 0.1;
const DRAG_TRAVEL = 0.84;
const ARRIVED_WITHIN = 26; // px from the perch before it counts as landed

// How long Onee stays somewhere before finding a new spot, and how often the
// ambient mood pools step forward.
const PERCH_MIN_MS = 2_600;
const PERCH_MAX_MS = 5_400;
// Retried sooner than a full stay when there was nowhere free to go, so a
// crowded screen doesn't pin Onee in one corner for twenty seconds.
const PERCH_RETRY_MS = 1_100;
const BEAT_MS = 2_900;

// A perch has to be this far away to be worth the trip.
const PERCH_TRAVEL_MIN = 170;

// Gaze. How far the eyes travel at full deflection, in the solver's own units.
// Deliberately short of what the face can take: the offset is added on top of
// whatever eye position the current expression already holds, and the two
// stack, so the amplitude that looked right on a neutral face pinned the eyes
// against the edge of the head on an expression already glancing that way.
// Full deflection is reached when whatever Onee is watching is GAZE_RANGE
// away, and the easing matters as much as the numbers: eyes that snap to a
// cursor read as a readout, eyes that catch up read as attention.
//
// Both axes run the same way as the viewport — positive x moves the eyes
// right, positive y moves them down — so a screen-space delta feeds straight
// in with no flip.
const GAZE_X = 18;
const GAZE_Y = 12;
const GAZE_RANGE = 460;
const GAZE_EASE = 0.14;

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
    travelling: false,
    arrivedAt: now0,
    beat: 0,
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
  let size = 72;
  let perch = { x: 0, y: 0 };
  let perchUntil = 0;
  let checkedAt = 0;
  let spotIsFree = true;
  const gaze: Gaze = { x: 0, y: 0 };

  const measure = () => {
    size = shell.offsetWidth || 72;
  };

  const home = () => ({
    x: window.innerWidth - EDGE - size / 2,
    y: window.innerHeight - EDGE - size / 2 - (roams ? 0 : 12),
  });

  pos = home();
  measure();
  perch = { ...pos };

  // --- where it is allowed to stand ---------------------------------------
  // Onee roams the whole window, not a safe strip along the bottom, which
  // means it has to know what is underneath before it lands. Candidate spots
  // are hit-tested against the real page: anything resting on a word, a link
  // or a button is thrown out, so it ends up in the margins, the gaps between
  // sections and the empty half of a split layout — wherever those happen to
  // be on the page you are actually reading.
  const INTERACTIVE = "a[href], button, input, textarea, select";
  const PAINTED = "img, svg, video, canvas";
  // Onee takes pointer events so it can be poked, which means a naive
  // elementFromPoint at a spot it already occupies returns Onee and reports
  // clear space. Looking past the host layer is what makes the test mean
  // "what is under Onee" rather than "is Onee there".
  const under = (x: number, y: number) =>
    document.elementsFromPoint(x, y).find((node) => !host.contains(node)) ?? null;

  // Where the words on an element actually are. Measured, not inferred from
  // the tag or from whether the element holds text somewhere, because the work
  // rows stretch a link's hit area across the whole row with an `::after`
  // overlay: every point in the row returns that <a>, and asking the <a>
  // whether it contains text answers yes for a spot 400px from the title.
  // Ranges give the real rectangles the glyphs occupy.
  const textCache = new Map<Element, DOMRect[]>();
  const wordRects = (el: Element) => {
    const cached = textCache.get(el);
    if (cached) return cached;
    const rects: DOMRect[] = [];
    for (const node of el.childNodes) {
      if (node.nodeType !== 3 || !node.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const box of range.getClientRects()) {
        if (box.width > 1 && box.height > 1) rects.push(box);
      }
    }
    textCache.set(el, rects);
    return rects;
  };

  const onWords = (el: Element, x: number, y: number) => {
    const pad = 6;
    for (const r of wordRects(el)) {
      if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) {
        return true;
      }
    }
    return false;
  };

  /**
   * What it would cost Onee to stand here — 0 is empty page.
   *
   * Scored rather than pass/fail because a strict test has a failure mode
   * worse than the thing it prevents: on the work list every row carries a
   * full-bleed link overlay, so nothing anywhere passed, no new spot was ever
   * chosen, and Onee sat frozen on a project title for the length of the
   * section. Scoring always yields a least-bad answer, so it keeps moving.
   *
   * Words cost more than click targets on purpose. Covering a word makes the
   * page unreadable; overlapping a link that already spans the whole row costs
   * a 96px patch of a target you can still hit anywhere else along it.
   */
  const spotCost = (x: number, y: number) => {
    const r = size * 0.34;
    let cost = 0;
    for (const [px, py] of [
      [x, y],
      [x - r, y],
      [x + r, y],
      [x, y - r],
      [x, y + r],
    ]) {
      const hit = under(px, py);
      if (!hit) {
        cost += 4; // outside the window
        continue;
      }
      if (hit.closest(PAINTED) || onWords(hit, px, py)) cost += 3;
      else if (hit.closest(INTERACTIVE)) cost += 2;
    }
    return cost;
  };

  const isFree = (x: number, y: number) => spotCost(x, y) === 0;

  // Choosing a spot is spread over frames rather than done in one go. The
  // search is ~40 candidates at five hit tests each, and every hit test
  // resolves layout; running the lot inside a single frame cost 121ms on a
  // throttled phone — one dropped frame every few seconds, which is precisely
  // the jank a decoration has no right to introduce. A handful of candidates
  // per frame costs nothing measurable and the answer is still ready in a
  // fifth of a second, which is faster than anyone can notice Onee deciding.
  const SEARCH_CANDIDATES = 40;
  const SEARCH_PER_FRAME = 4;

  type Spot = { x: number; y: number };
  let search: {
    tried: number;
    best: Spot | null;
    bestCost: number;
    near: Spot | null;
    nearCost: number;
  } | null = null;

  const beginSearch = () => {
    // Rectangles are viewport-relative and the page moves under them, so the
    // measurements only hold for the length of one search.
    textCache.clear();
    search = { tried: 0, best: null, bestCost: Infinity, near: null, nearCost: Infinity };
  };

  /**
   * Advance the hunt for somewhere to stand. Returns the chosen spot once the
   * search finishes, null while it is still looking or if nowhere will do.
   */
  const stepSearch = (): Spot | null | undefined => {
    if (!search) return undefined;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const minX = EDGE + size / 2;
    const maxX = vw - EDGE - size / 2;
    const minY = TOP_LIMIT + size / 2;
    const maxY = vh - EDGE - size / 2;
    if (maxX <= minX || maxY <= minY) {
      search = null;
      return null;
    }

    for (let i = 0; i < SEARCH_PER_FRAME && search.tried < SEARCH_CANDIDATES; i += 1) {
      search.tried += 1;
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      const cost = spotCost(x, y);
      // Somewhere far enough away that the trip is worth watching.
      if (Math.hypot(x - pos.x, y - pos.y) > PERCH_TRAVEL_MIN) {
        if (cost < search.bestCost) {
          search.bestCost = cost;
          search.best = { x, y };
        }
      } else if (cost < search.nearCost) {
        search.nearCost = cost;
        search.near = { x, y };
      }
      if (search.bestCost === 0) break; // empty page, nothing will beat it
    }

    if (search.bestCost > 0 && search.tried < SEARCH_CANDIDATES) return undefined;
    const chosen = search.best ?? search.near;
    search = null;
    return chosen;
  };

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
    perchUntil = 0; // the layout moved; find somewhere that is still empty

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
    const floor = vh - EDGE - size / 2;

    // Is anyone actually steering? A cursor that hasn't moved in a couple of
    // seconds means somebody is reading, not playing, and Onee should go back
    // to its own business instead of hovering at their elbow for the rest of
    // the page. This one condition is most of what makes it feel alive rather
    // than tethered.
    const engaged = roams && senses.pointer.inside && t - lastMove.t < 2_400;

    let tx: number;
    let ty: number;

    if (engaged) {
      // Following. Onee keeps to a distance it likes, backing off when
      // crowded and ambling over when left behind — but it shadows the cursor
      // sideways rather than climbing after it, because trailing a cursor
      // freely in two dimensions parked it on the middle of the H1 and ate a
      // word. A character that wanders is charming; one that covers the
      // headline is a bug wearing a costume.
      const dx = pos.x - senses.pointer.x;
      const dy = pos.y - senses.pointer.y;
      const d = Math.hypot(dx, dy) || 1;
      const nx = dx / d;
      const ny = dy / d;

      if (d < BUBBLE) {
        tx = senses.pointer.x + nx * BUBBLE * 1.9;
        ty = senses.pointer.y + ny * BUBBLE * 1.9;
      } else if (d > TRAIL) {
        tx = senses.pointer.x + nx * TRAIL * 0.82;
        ty = senses.pointer.y + ny * TRAIL * 0.82;
      } else {
        tx = pos.x + Math.sin(t / 2_100) * 16;
        ty = pos.y + Math.sin(t / 1_700 + 1.7) * 12;
      }
      // It may only settle beside the cursor where the page is empty; if the
      // spot it wants is on top of something, it holds its current perch and
      // watches from there instead. Throttled hard: `isFree` is five hit tests,
      // each of which resolves layout, and running that every frame while the
      // cursor moves is three hundred forced layouts a second for a decoration.
      if (t - checkedAt > 200) {
        checkedAt = t;
        // Same reason as in beginSearch: the rectangles are viewport-relative and
        // the page scrolls under them. Clearing also stops the cache holding
        // references to elements a route change has already thrown away.
        textCache.clear();
        spotIsFree = isFree(clamp(tx, 0, vw), clamp(ty, 0, vh));
      }
      if (!spotIsFree) {
        tx = perch.x;
        ty = perch.y;
      }
      perch = { x: pos.x, y: pos.y };
      perchUntil = t + PERCH_MIN_MS;
    } else {
      // Left to itself, Onee goes places: it picks an empty spot anywhere in
      // the window, crosses to it, hangs about for a few seconds and moves on.
      if (t > perchUntil && !search) beginSearch();
      const found = stepSearch();
      if (found !== undefined) {
        if (found) {
          perch = found;
          perchUntil = t + PERCH_MIN_MS + Math.random() * (PERCH_MAX_MS - PERCH_MIN_MS);
        } else {
          perchUntil = t + PERCH_RETRY_MS;
        }
      }
      // Fidgets around the spot rather than standing on it. Being perfectly
      // still between trips is what made it read as a sticker between moves.
      tx = perch.x + Math.sin(t / 2_300) * 15;
      // Scrolling drags it behind — down the page pulls it up the screen — and
      // it glides back once the scrolling stops. That lag is what makes it read
      // as being carried along rather than pinned to the glass, and on a touch
      // device it is the only movement cue there is.
      ty = perch.y + Math.sin(t / 1_900 + 0.8) * 11 - clamp(lag, -LAG_LIMIT, LAG_LIMIT);
    }

    const minX = EDGE + size / 2;
    const maxX = vw - EDGE - size / 2;
    const minY = TOP_LIMIT + size / 2;
    tx = clamp(tx, minX, maxX);
    ty = clamp(ty, minY, floor);

    // --- the trip
    const gap = Math.hypot(tx - pos.x, ty - pos.y);
    const wasTravelling = senses.travelling;
    senses.travelling = gap > ARRIVED_WITHIN * 2.6;
    if (wasTravelling && !senses.travelling) senses.arrivedAt = t;
    senses.beat = Math.floor(t / BEAT_MS);

    const pull = senses.travelling ? PULL_TRAVEL : PULL;
    const drag = senses.travelling ? DRAG_TRAVEL : DRAG;
    vel.x = (vel.x + (tx - pos.x) * pull) * drag;
    vel.y = (vel.y + (ty - pos.y) * pull) * drag;
    pos.x += vel.x;
    pos.y += vel.y;

    // The walls are on the position, not just the target. A spring tuned to
    // overshoot on arrival will sail past a clamped target — which is how Onee
    // ended up 130px off the right edge and tucked behind the nav. Bouncing
    // off rather than sticking keeps the overshoot, which is the part that
    // makes a trip look like a scurry.
    for (const [key, lo, hi] of [
      ["x", minX, maxX],
      ["y", minY, floor],
    ] as const) {
      if (pos[key] < lo) {
        pos[key] = lo;
        vel[key] *= -0.35;
      } else if (pos[key] > hi) {
        pos[key] = hi;
        vel[key] *= -0.35;
      }
    }

    // --- what it is watching
    // With a pointer on screen Onee watches the pointer. Without one it
    // watches where it is going, so a touch device gets a character that looks
    // where it is headed rather than one that stares blankly ahead for the
    // whole visit. Asleep it watches nothing.
    const awake = mood !== "sleeping" && mood !== "drowsy";
    const atX = senses.pointer.inside ? senses.pointer.x - pos.x : vel.x * 34;
    const atY = senses.pointer.inside ? senses.pointer.y - pos.y : vel.y * 34;
    gaze.x += ((awake ? clamp(atX / GAZE_RANGE, -1, 1) * GAZE_X : 0) - gaze.x) * GAZE_EASE;
    gaze.y += ((awake ? clamp(atY / GAZE_RANGE, -1, 1) * GAZE_Y : 0) - gaze.y) * GAZE_EASE;

    // Leans into its own motion and towards whatever it is watching, and
    // breathes. The lean is small on purpose: a tilt of the head, not a turn
    // of the whole body.
    const tilt = clamp(vel.x * 1.2 + gaze.x * 0.18, -18, 18);
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
  }, mood, () => gaze);

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
