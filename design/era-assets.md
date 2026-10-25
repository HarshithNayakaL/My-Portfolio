# Era redesign: assets

`design/era-source/` holds the images as uploaded. `public/era/` holds the
cleaned versions the page uses: black backgrounds removed (pure black flooded
from the corners at 1% tolerance; more ate into dark liveries), trimmed to the
subject, two-up images split, and resized for 2x display. Every car faces left.

## In `public/era/`

| File | From | Notes |
| --- | --- | --- |
| `car-f2004.png` | 26 | Chosen over 04: has the driver |
| `car-r26.png` | 15 | |
| `car-mp4-20.png` | 24 | Chosen over 09: has the driver |
| `car-mp4-22.png` | 17 | Chosen over 23 and 27: driver, and the right number (2) |
| `car-ferrari-hamilton.png` | 08 | Chosen over 06 and 10 |
| `car-redbull-verstappen.png` | 05 | |
| `car-redbull-vettel.png` | 11 | |
| `car-brawn-button.png` | 07 | |
| `car-delta-integrale.png` | 03 | Chosen over 22: straight side view, like the rest |
| `car-impreza.png` | 14 | |
| `car-celica.png` | 16 | |
| `car-evo.png` | 18 | |
| `car-escort.png` | 21 | |
| `camera-sony-silver.png` | 02 | |
| `camera-sony-purple.png` | 12 | |
| `camera-canon.png` | 20 | |
| `rossi-bike.png` | 13 (bottom) | |
| `rossi-wheelie.png` | 13 (top) | |
| `razr-closed.png` | 19 (left) | |
| `razr-open.png` | 19 (right) | |

Not used: 01 (the four rally cars again, as one grid), 04, 06, 09, 10, 22,
23, 25 (the cameras again), 27, 28 (the Razr again).

## Still needed for the sketch

- Helmets: done. Six front views (Schumacher, Alonso, Raikkonen, Vettel,
  Verstappen, Hamilton), originals in `era-source/helmets/`, cut out to
  `public/era/helmet-*.png`. They are the banner now (`src/era/HelmetGrid.tsx`),
  so a separate `banner.png` is no longer needed. Rossi's helmet would still
  be welcome.
- Top-down cars (nose up), if the cars in the margins should follow the wavy
  tracks. Without them, side views drive the straight parts.

## Before this goes public

Most liveries carry real sponsor marks, including tobacco brands (Marlboro,
Mild Seven, Rothmans). They are fine for a preview; for the live site,
versions with the text removed are the safer choice.
