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
// window is fair game, subject to the hit test in `spotCost` below.
const TOP_LIMIT = 104;
const EDGE = 18;

// Things that move on their own and that Onee must keep clear of: anything
// marked `data-onee-avoid`. "body" is the thing itself; "lane" is something
// crossing the screen sideways at speed, so its whole horizontal run ahead
// and behind counts, not just where it is this frame.
const AVOID = "[data-onee-avoid]";
const AVOID_PAD = 18;
// Around something parked: wider, because the cursor car arrives at speed
// and gets a frame or two in before Onee has moved.
const BODY_PAD = 36;
// About a second of warning at the speed the cars cross.
const LANE_REACH = 720;
const AVOID_REFRESH_MS = 90;

// Spring. Slack enough to read as an animal ambling after you rather than a
// cursor attachment.
const PULL = 0.062;
const DRAG = 0.86;
// Crossing the screen gets a stiffer, looser spring so a trip reads as a
// deliberate scurry with a little overshoot at the end, not a slow slide.
const PULL_TRAVEL = 0.1;
const DRAG_TRAVEL = 0.84;
const PULL_DODGE = 0.17;
const DRAG_DODGE = 0.78;
const DODGE_MS = 700;
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

// The things on a page worth looking at. Onee treats the site as somewhere it
// lives rather than a backdrop it floats over: it notices headings, buttons,
// links, pictures and the stack pills, looks at them, and prefers to settle
// beside one rather than in the middle of blank space.
const INTEREST = "a[href], button, h1, h2, h3, img, .stack-pill";
const INTEREST_REFRESH_MS = 900;
// Enough of the page to look around; a cap so a long document does not make
// the scan proportional to how much has been written.
const INTEREST_MAX = 48;
// Close enough to a thing that sitting here reads as sitting *with* it.
const BESIDE = 210;
// How long it holds its attention on one thing before glancing at another.
const LOOK_MIN_MS = 1_400;
const LOOK_MAX_MS = 3_600;

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

  const paintScene = (next: typeof scene) => {
    body.setAttribute("d", next.geometry.headPath);
    left.setAttribute("d", next.geometry.leftPath);
    left.setAttribute("opacity", next.geometry.leftVisible ? "1" : "0");
    right.setAttribute("d", next.geometry.rightPath);
    right.setAttribute("opacity", next.geometry.rightVisible ? "1" : "0");
  };

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
  let dodgeUntil = 0;
  let interests: DOMRect[] = [];
  let interestsAt = 0;
  let focus: { x: number; y: number } | null = null;
  let focusUntil = 0;
  let hovered: Element | null = null;
  let hoveredAt: { x: number; y: number } | null = null;
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
   * The things on screen worth a look — refreshed on a throttle rather than
   * per frame, because it is a query plus a rect read for every match and
   * both resolve layout.
   */
  const refreshInterests = (now: number) => {
    if (now - interestsAt < INTEREST_REFRESH_MS) return;
    // Mid-flick every rect is stale by the time it is read, and Onee is busy
    // being dragged along behind the scroll anyway. Skipping the scan keeps
    // the one expensive thing it does out of the frames that can least afford
    // it — the p95 of a scrolling frame was the only place this showed up.
    if (Math.abs(senses.scroll.speed) > 600 && now - senses.scroll.at < 300) return;
    interestsAt = now;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const found: DOMRect[] = [];
    for (const el of document.querySelectorAll(INTEREST)) {
      if (host.contains(el)) continue;
      const r = el.getBoundingClientRect();
      // Offscreen, or too small to be a thing rather than a detail.
      if (r.width < 16 || r.height < 12) continue;
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      found.push(r);
      if (found.length >= INTEREST_MAX) break;
    }
    interests = found;
    // The page may have scrolled under the cursor since the hover began.
    if (hovered) hoveredAt = centreOf(hovered);
  };

  const centreOf = (target: Element) => {
    const r = target.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  /** How close the nearest thing worth looking at is to a point. */
  const nearestInterest = (x: number, y: number) => {
    let best = Infinity;
    for (const r of interests) {
      const dx = Math.max(r.left - x, 0, x - r.right);
      const dy = Math.max(r.top - y, 0, y - r.bottom);
      best = Math.min(best, Math.hypot(dx, dy));
    }
    return best;
  };

  /**
   * Choose something to look at, and hold the look for an uneven beat.
   *
   * Weighted towards whatever is nearby, so Onee attends to its own corner of
   * the page rather than staring across the room, but never at only the
   * closest thing — always fixating on the nearest object is the tell that
   * something is running a rule rather than looking around.
   */
  const glance = (now: number) => {
    if (now < focusUntil && focus) return;
    focusUntil = now + LOOK_MIN_MS + Math.random() * (LOOK_MAX_MS - LOOK_MIN_MS);
    if (interests.length === 0) {
      focus = null;
      return;
    }
    const ranked = interests
      .map((r) => {
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        return { x: cx, y: cy, d: Math.hypot(cx - pos.x, cy - pos.y) };
      })
      .sort((a, b) => a.d - b.d)
      .slice(0, 5);
    focus = ranked[Math.floor(Math.random() * ranked.length)] ?? null;
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

  // The cars. They take no pointer events, so the hit test above never sees
  // them; their boxes are read directly, a handful of rects on a throttle.
  type Zone = { left: number; right: number; top: number; bottom: number; lane: boolean };
  let zones: Zone[] = [];
  let zonesAt = -Infinity;
  const refreshZones = (now: number) => {
    if (now - zonesAt < AVOID_REFRESH_MS) return;
    zonesAt = now;
    zones = [];
    for (const el of document.querySelectorAll<HTMLElement>(AVOID)) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.bottom < 0 || r.top > window.innerHeight) continue;
      const lane = el.dataset.oneeAvoid === "lane";
      const reach = lane ? LANE_REACH : BODY_PAD;
      const pad = lane ? AVOID_PAD : BODY_PAD;
      zones.push({ left: r.left - reach, right: r.right + reach, top: r.top - pad, bottom: r.bottom + pad, lane });
    }
  };
  // Measured against Onee as drawn, which tilts and breathes past its
  // layout box, not the box itself.
  const reachOf = () => size * 0.7;
  const zoneAt = (x: number, y: number) => {
    const h = reachOf();
    return zones.find((z) => x + h > z.left && x - h < z.right && y + h > z.top && y - h < z.bottom) ?? null;
  };

  // Choosing a spot is spread over frames rather than done in one go. The
  // search is ~40 candidates at five hit tests each, and every hit test
  // resolves layout; running the lot inside a single frame cost 121ms on a
  // throttled phone — one dropped frame every few seconds, which is precisely
  // the jank a decoration has no right to introduce. A handful of candidates
  // per frame costs nothing measurable and the answer is still ready in a
  // fifth of a second, which is faster than anyone can notice Onee deciding.
  const SEARCH_CANDIDATES = 40;
  const SEARCH_PER_FRAME = 2;

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
    interestsAt = 0;
    refreshInterests(performance.now());
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
      // Empty space beside something — a card, a heading, a button — beats
      // empty space in the middle of nowhere. This is most of what makes Onee
      // read as living on the page rather than floating above it: it ends up
      // perched next to things, the way a cat picks the arm of the sofa over
      // the middle of the floor. One point of penalty, so it only breaks a tie
      // between otherwise equally clear spots and never pushes it onto text.
      const cost = spotCost(x, y) + (nearestInterest(x, y) < BESIDE ? 0 : 1) + (zoneAt(x, y) ? 10 : 0);
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
    const action = target?.closest?.("a[href], button:not(.onee)") ?? null;
    senses.overAction = !!action;
    // Kept so Onee can look at the thing you are reaching for rather than at
    // the cursor on top of it — the difference between a pet watching your
    // hand and one watching what your hand is doing. The centre is measured
    // here and when the interests refresh, never per frame: reading a rect
    // resolves layout, and doing that sixty times a second for the whole time
    // a cursor rests on a link is a lot of work to learn nothing new.
    hovered = action;
    hoveredAt = action ? centreOf(action) : null;
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

    // Onee doesn't follow the cursor. On this site a car does, and the two
    // chasing the same pointer sat on top of each other; Onee keeps its own
    // business instead and still watches you with its eyes.
    let tx: number;
    let ty: number;

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

    // Out of the way of the cars. If one is on Onee, or bearing down its
    // lane, it steps clear: above or below a lane (a car crossing sideways
    // can't be outrun along it), or to whichever side is nearest of
    // something parked. The new spot becomes its perch, so it waits there
    // rather than drifting straight back into the road.
    refreshZones(t);
    const hit = zoneAt(pos.x, pos.y) ?? zoneAt(tx, ty);
    if (hit) {
      const h = reachOf() + 12;
      const options = [
        { x: pos.x, y: hit.top - h },
        { x: pos.x, y: hit.bottom + h },
        ...(hit.lane ? [] : [{ x: hit.left - h, y: pos.y }, { x: hit.right + h, y: pos.y }]),
      ]
        .filter((o) => o.x >= EDGE + size / 2 && o.x <= vw - EDGE - size / 2)
        .filter((o) => o.y >= TOP_LIMIT + size / 2 && o.y <= floor)
        .filter((o) => !zoneAt(o.x, o.y))
        .sort((p, q) => Math.hypot(p.x - pos.x, p.y - pos.y) - Math.hypot(q.x - pos.x, q.y - pos.y));
      if (options[0]) {
        perch = options[0];
        perchUntil = t + PERCH_MIN_MS;
        dodgeUntil = t + DODGE_MS;
        search = null;
        tx = perch.x;
        ty = perch.y;
      }
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

    // Getting out of a car's way is a hop, not an amble.
    const dodging = t < dodgeUntil;
    const pull = dodging ? PULL_DODGE : senses.travelling ? PULL_TRAVEL : PULL;
    const drag = dodging ? DRAG_DODGE : senses.travelling ? DRAG_TRAVEL : DRAG;
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
    // In order: the thing you are reaching for, then you, then whatever it has
    // wandered off to look at on its own. The last one is the point — a
    // character that only ever tracks the cursor is an instrument, and one
    // that looks around at the room it is in is an animal. Asleep it watches
    // nothing.
    const awake = mood !== "sleeping" && mood !== "drowsy";
    refreshInterests(t);
    glance(t);

    let lookAt: { x: number; y: number } | null = null;
    if (hoveredAt && senses.pointer.inside) {
      lookAt = hoveredAt;
    } else if (senses.pointer.inside) {
      lookAt = { x: senses.pointer.x, y: senses.pointer.y };
    } else if (focus) {
      lookAt = focus;
    }

    // With nothing to look at it watches where it is going, so a touch device
    // still gets a character following its own path rather than staring ahead.
    const atX = lookAt ? lookAt.x - pos.x : vel.x * 34;
    const atY = lookAt ? lookAt.y - pos.y : vel.y * 34;
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
    paintScene(frame);
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
