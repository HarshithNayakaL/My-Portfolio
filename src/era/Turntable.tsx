import { useEffect, useState } from "react";

/**
 * The record on repeat, as a car head unit of the early 2000s: a dark-silver
 * faceplate with a CD slot, a big volume knob ringed in red, red-lit keys and
 * a blue backlit LCD that scrolls the track while it plays. The knob is the
 * one real control (press to play or pause, as on the units it is drawn
 * from); the other keys are part of the drawing. No audio yet: the track is a
 * placeholder until there is one to name.
 */
const TRACK = "Song title · Artist";

export default function Turntable() {
  const [playing, setPlaying] = useState(false);
  const [secs, setSecs] = useState(0);
  // The display counts while it plays, the way the real ones did.
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setSecs((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [playing]);
  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  return (
    <div className={`hu ${playing ? "is-playing" : ""}`}>
      <div className="hu-face">
        <span aria-hidden className="hu-slot" />
        <div className="hu-main">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause" : "Play"}
            aria-pressed={playing}
            className="hu-knob"
          >
            <span aria-hidden className="hu-knob-cap">
              {playing ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z" /></svg>
              )}
            </span>
          </button>

          <span aria-hidden className="hu-keys hu-keys-l">
            <span className="hu-key"><svg width="14" height="10" viewBox="0 0 28 20" fill="currentColor"><path d="M14 10 26 2v16zM2 10l12-8v16z" /></svg></span>
            <span className="hu-key"><svg width="14" height="10" viewBox="0 0 28 20" fill="currentColor"><path d="M14 10 2 2v16zM26 10 14 2v16z" /></svg></span>
          </span>

          <div className="hu-lcd" aria-live="off">
            <p className="hu-lcd-top">
              <span>Track 01</span>
              <span className="hu-eq" aria-hidden><i /><i /><i /><i /><i /></span>
              <span>{clock}</span>
            </p>
            <p className="hu-lcd-line">
              <span className="hu-lcd-text">{playing ? `${TRACK}  ·  ${TRACK}` : TRACK}</span>
            </p>
          </div>

          <span aria-hidden className="hu-keys hu-keys-r">
            <span className="hu-key hu-key-round"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5 4 15h16zM4 18h16v2H4z" /></svg></span>
            <span className="hu-key hu-key-wide">Dspl</span>
          </span>
        </div>

        <div aria-hidden className="hu-row">
          <span className="hu-key hu-key-source">Source</span>
          <span className="hu-presets">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <span key={n} className="hu-key hu-preset">{n}</span>
            ))}
          </span>
          <span className="hu-aux" />
        </div>
      </div>
    </div>
  );
}
