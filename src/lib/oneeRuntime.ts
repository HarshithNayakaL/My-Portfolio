/**
 * Onee's animation runtime.
 *
 * This module is the only place that touches @bible-strong/avatar-core or the
 * 24KB avatar definition, and it is only ever reached through a dynamic
 * `import()` from OneeAvatar. Keeping it behind that boundary is the whole
 * point: the geometry solver, the playback state machine and the definition
 * together are ~90KB of JavaScript for a decorative character, and none of it
 * belongs in the bundle that has to arrive before the page is interactive.
 *
 * It does not render. It hands finished geometry back to the caller, which
 * writes it onto SVG nodes that already exist in the prerendered HTML.
 */
import {
  advanceAvatarPlayback,
  applyAmbientMotion,
  bodyFromDefinition,
  createAvatarPlaybackState,
  playAvatarAnimation,
  poseFromExpression,
  renderAvatar,
  renderAvatarDefinition,
  sampleAvatarFrame,
  type AvatarDefinition,
  type AvatarFrameSnapshot,
  type AvatarPlaybackState,
  type AvatarRuntimeEnvironment,
  type AvatarScene,
} from "@bible-strong/avatar-core";
import definition from "../data/onee.avatar.json";

// The Studio export carries roundness values above the 0..1 the published
// schema allows (morphRoundness 1.2, tip/base 2), so `validateAvatarDefinition`
// rejects it even though the solver renders it correctly — and renders it as
// the rounder, softer shape the character was actually designed with. Clamping
// to satisfy the validator visibly squares off the silhouette, so we skip
// validation and go straight to the solver, which is what the validator
// gatekeeps anyway.
const onee = definition as unknown as AvatarDefinition;

export type OneeAnimation = keyof typeof definition.animations;

export type OneeExpression = keyof typeof definition.expressions;

/** A single still pose, solved once. No playback, no frame loop. */
export const sceneFor = (expression: OneeExpression = "neutral" as OneeExpression): AvatarScene =>
  renderAvatarDefinition(onee, expression);

/** The pose Onee holds before anything has happened to it. */
export const restingScene = (): AvatarScene => sceneFor();

/**
 * A handful of pleasant faces for the still version of Onee, which has no
 * animation to cycle and changes expression only when someone taps it.
 */
export const STILL_FACES = [
  "neutral",
  "joyful-wide",
  "curious-left",
  "playful-right",
  "surprised-left",
  "joyful-down-right",
] as OneeExpression[];

/** Where the eyes are pointing, in the solver's own units. */
export type Gaze = { x: number; y: number };

export type OneeRuntime = {
  /** Cross-fade into another looping animation from wherever the face is now. */
  play: (animation: OneeAnimation) => void;
  /** Run the frame loop. Idempotent. */
  start: () => void;
  /** Halt the frame loop, leaving the last painted frame on screen. */
  stop: () => void;
};

const environment: AvatarRuntimeEnvironment = { random: Math.random };

// Fixed for the life of the page, so it is solved once instead of rebuilt from
// the definition on every frame.
const body = bodyFromDefinition(onee.body);

/**
 * Solve one frame, with the eyes aimed wherever the caller is pointing them.
 *
 * This is avatar-core's own `renderAvatarFrame`, reassembled from the parts it
 * is built from, because that function gives no way to pass an eye offset
 * through to the solver — and aiming the eyes is the difference between a
 * character that plays an animation at you and one that looks at you. Taking
 * it apart also samples the frame once per tick instead of the twice the
 * previous arrangement did.
 */
const solveFrame = (
  state: AvatarPlaybackState,
  now: number,
  gaze: Gaze,
): { scene: AvatarScene; snapshot: AvatarFrameSnapshot } => {
  const frame = sampleAvatarFrame(onee, state, now, environment);
  const expression = environment.reduceMotion
    ? frame.expression
    : applyAmbientMotion(frame.expression, frame.sampledAt);

  return {
    snapshot: frame,
    scene: {
      geometry: renderAvatar(poseFromExpression(expression), body.primary, frame.blink, {
        bodyNodes: body.nodes,
        eyeOffset: gaze,
      }),
      colors: {
        body: frame.colors.body ?? expression.bodyColor ?? onee.colors.body,
        eyes: frame.colors.eyes ?? expression.eyeColor ?? onee.colors.eyes,
      },
    },
  };
};

/**
 * @param paint receives a fully-solved scene for the current instant.
 * @param aim is read every frame for where the eyes should be pointing.
 */
export function createOneeRuntime(
  paint: (scene: AvatarScene) => void,
  initial: OneeAnimation,
  aim: () => Gaze,
): OneeRuntime {
  let state: AvatarPlaybackState = createAvatarPlaybackState();
  // Retained so a change of animation eases out of the pose actually on screen
  // rather than snapping to the new timeline's first keyframe.
  let snapshot: AvatarFrameSnapshot | undefined;
  let frame = 0;

  const sample = (now: number) => {
    const solved = solveFrame(state, now, aim());
    snapshot = solved.snapshot;
    paint(solved.scene);
  };

  const tick = (now: number) => {
    state = advanceAvatarPlayback(onee, state, now, environment);
    sample(now);
    // Every Onee animation is a loop, so this stays true; the guard is here so
    // a one-shot added later releases the frame loop instead of spinning.
    frame = state.status === "playing" ? requestAnimationFrame(tick) : 0;
  };

  const play = (animation: OneeAnimation) => {
    const next = playAvatarAnimation(onee, animation, performance.now(), snapshot);
    if (!next.ok) return;
    state = next.value;
    if (frame === 0) start();
  };

  const start = () => {
    if (frame !== 0) return;
    frame = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (frame === 0) return;
    cancelAnimationFrame(frame);
    frame = 0;
  };

  play(initial);
  return { play, start, stop };
}
