import { useState } from "react";

/** A record player for whatever is on repeat. No audio yet: the song is a
 *  placeholder until there is one to name. */
export default function Turntable() {
  const [playing, setPlaying] = useState(false);
  return (
    <figure className="m-0">
      <div className="era-deck">
        <div aria-hidden className={`era-vinyl ${playing ? "is-spinning" : ""}`}>
          <span className="era-vinyl-label" />
        </div>
        <span aria-hidden className={`era-arm ${playing ? "is-on" : ""}`} />
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
          aria-pressed={playing}
          className="era-play"
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M7 5l12 7-12 7z" /></svg>
          )}
        </button>
      </div>
      <figcaption className="mt-3 text-[0.9375rem] text-dim">
        <span className="font-semibold text-ink">{playing ? "Now spinning:" : "On repeat:"}</span> [song] by [artist]
      </figcaption>
    </figure>
  );
}
