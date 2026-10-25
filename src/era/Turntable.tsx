import { useEffect, useState } from "react";
import DotMatrix from "./DotMatrix";

/**
 * The record on repeat, as a premium car head unit of the early 2000s, after
 * the Pioneer the owner picked: a light brushed-silver face, a big volume
 * knob, a round four-way pad, and a wide backlit blue LCD with dark pixel
 * text and boxed soft keys. The pad's centre is the one real control, play
 * and pause; while it plays the time counts, the title scrolls and the Pause
 * key reads off. No maker's badge, and no audio: the disc in it is the one
 * on repeat, "Yeah!" by Usher, 2004's biggest song.
 */
const TITLE = "USHER - YEAH!";
const COLS = 15;

export default function Turntable() {
  const [playing, setPlaying] = useState(false);
  const [secs, setSecs] = useState(0);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const clock = setInterval(() => setSecs((n) => n + 1), 1000);
    // Scrolls a character at a time, as the displays did.
    const scroll = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : window.setInterval(() => setShift((n) => n + 1), 280);
    return () => {
      clearInterval(clock);
      clearInterval(scroll);
    };
  }, [playing]);

  const loop = TITLE + "     ";
  const line = playing
    ? (loop + loop).slice(shift % loop.length, (shift % loop.length) + COLS)
    : TITLE;
  const time = `TIME ${String(Math.floor(secs / 60)).padStart(2, "0")}'${String(secs % 60).padStart(2, "0")}"`;

  const keys: [string, boolean][] = [
    ["REPEAT ON", true],
    ["RANDOM OFF", false],
    ["T.SCAN OFF", false],
    [playing ? "PAUSE OFF" : "PAUSE ON", !playing],
  ];

  return (
    <div className={`pv ${playing ? "is-playing" : ""}`}>
      <div aria-hidden className="pv-side">
        <span className="pv-knob" />
        <span className="pv-btns">
          <span className="pv-btn"><i />Source</span>
          <span className="pv-btn"><i />Display</span>
        </span>
      </div>

      <div className="pv-bezel">
        <div className="pv-lcd" aria-hidden>
          <div className="pv-main">
            <DotMatrix text="CD   TRACK 01" cols={13} px={2.2} />
            <DotMatrix text={line} cols={COLS} px={3.6} className="pv-title" />
            <div className="pv-time">
              <svg aria-hidden className="pv-cd" viewBox="0 0 24 24" width="22" height="22">
                <path d="M20 7a9 9 0 1 0 0 10" />
                <path d="M16.5 9a5 5 0 1 0 0 6" />
                <circle cx="12" cy="12" r="1.6" />
              </svg>
              <DotMatrix text={time} cols={12} px={2.6} />
            </div>
          </div>
          <div aria-hidden className="pv-keys">
            {keys.map(([label, on]) => (
              <span key={label.split(" ")[0]} className={on ? "is-on" : undefined}>
                <DotMatrix text={label} cols={10} px={1.5} />
              </span>
            ))}
            <span className="pv-key-wide">
              <DotMatrix text="D.MODE" cols={6} px={1.5} />
            </span>
          </div>
        </div>
      </div>

      <div className="pv-side">
        <span className="pv-pad">
          <span aria-hidden className="pv-pad-arrows"><i /><i /><i /><i /></span>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause" : "Play"}
            aria-pressed={playing}
            className="pv-pad-centre"
          >
            {playing ? (
              <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z" /></svg>
            )}
          </button>
        </span>
        <span aria-hidden className="pv-btns">
          <span className="pv-btn"><i />Band</span>
          <span className="pv-btn"><i />Eject</span>
        </span>
      </div>
    </div>
  );
}
