# Era redesign: assets

Upload into `public/era/` on this branch. PNG with a transparent background,
pixel art at its native size (no upscaling, no smoothing; the page scales it
up with crisp pixels). Lowercase names with hyphens, exactly as below, so the
page picks each one up without code changes.

| File | What it is | Where it goes (from the sketch) |
| --- | --- | --- |
| `banner.png` | Wide pixel-art scene, roughly 4:1 (e.g. 480 x 120) | Top of the page |
| `photo.jpg` | Square photo of you (optional; the current one is used otherwise) | Profile, left of the name |
| `helmet-schumacher.png` | Helmet, side or front view, about 32 x 32 | Helmet row under the name, and on work cards |
| `helmet-alonso.png` | Same | Same |
| `helmet-raikkonen.png` | Same | Same |
| `helmet-hamilton.png` | Same | Same |
| `helmet-rossi.png` | Same (optional) | Same |
| `f2004.png` | F2004, side view, about 96 x 28 | Next to the music player |
| `car-<name>-side.png` | Each F1 car, side view, about 96 x 28 (e.g. `car-r26-side.png`) | On the work cards |
| `car-<name>-top.png` | Each F1 car, top-down view, nose up, about 28 x 64 | Driving along the wavy tracks in the margins |
| `rossi-bike.png` | Rossi on the bike, side view, about 64 x 40 | Riding across the footer |

Car names to use: `f2004`, `f2000`, `r25`, `r26`, `mp4-20`, `mp4-22`, `f10`,
`ferrari-2026`.

Anything not uploaded yet shows as a marked placeholder, so the page works
while assets arrive.
