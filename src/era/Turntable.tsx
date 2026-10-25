import { useState } from "react";

/** The record on repeat. No audio yet: the track is a placeholder until there
 *  is one to name. */
export default function Turntable() {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="era-music">
      <div aria-hidden className="era-platter">
        <span className={`era-vinyl ${playing ? "is-spinning" : ""}`}>
          <span className="era-vinyl-label" />
        </span>
        <span className={`era-arm ${playing ? "is-on" : ""}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[max(12px,0.75rem)] text-dim">
          <span aria-hidden className={`era-dot ${playing ? "is-on" : ""}`} />
          {playing ? "Now spinning" : "On repeat"}
        </p>
        <p className="mt-1 truncate text-[0.9375rem] font-semibold text-ink">Song title</p>
        <p className="truncate text-sm text-dim">Artist</p>
      </div>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5l11 7-11 7z" /></svg>
        )}
      </button>
    </div>
  );
}
