import { useEffect, useState } from "react";

/**
 * The record on repeat, as the player of the time: a brushed-silver portable
 * CD player with the disc behind its window, a backlit LCD, and a chrome
 * play button. No audio yet: the track is a placeholder until there is one
 * to name.
 */
export default function Turntable() {
  const [playing, setPlaying] = useState(false);
  const [secs, setSecs] = useState(0);
  // The LCD counts while it plays, the way the real ones did.
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setSecs((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [playing]);
  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  return (
    <div className="era-cd">
      <div aria-hidden className="era-cd-well">
        <span className={`era-cd-disc ${playing ? "is-spinning" : ""}`}>
          <span className="era-cd-hub" />
        </span>
      </div>
      <div className="era-cd-lcd">
        <p className="era-cd-lcd-top">
          <span>Track 01</span>
          <span>{clock}</span>
        </p>
        <p className="mt-1 truncate text-[0.9375rem] font-semibold">Song title</p>
        <p className="truncate text-sm opacity-75">Artist</p>
      </div>
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Pause" : "Play"}
        aria-pressed={playing}
        className="era-cd-btn"
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5.5v13l10.5-6.5z" /></svg>
        )}
      </button>
    </div>
  );
}
