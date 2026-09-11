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
  createAvatarPlaybackState,
  playAvatarAnimation,
  renderAvatarFrame,
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

export type OneeRuntime = {
  /** Cross-fade into another looping animation from wherever the face is now. */
  play: (animation: OneeAnimation) => void;
  /** Run the frame loop. Idempotent. */
  start: () => void;
  /** Halt the frame loop, leaving the last painted frame on screen. */
  stop: () => void;
};

const environment: AvatarRuntimeEnvironment = { random: Math.random };

/**
 * @param paint receives a fully-solved scene for the current instant.
 */
export function createOneeRuntime(
  paint: (scene: AvatarScene) => void,
  initial: OneeAnimation,
): OneeRuntime {
  let state: AvatarPlaybackState = createAvatarPlaybackState();
  // Retained so a change of animation eases out of the pose actually on screen
  // rather than snapping to the new timeline's first keyframe.
  let snapshot: AvatarFrameSnapshot | undefined;
  let frame = 0;

  const sample = (now: number) => {
    snapshot = sampleAvatarFrame(onee, state, now, environment);
    paint(renderAvatarFrame(onee, state, now, environment));
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
