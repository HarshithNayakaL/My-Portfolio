# Era redesign: assets

`design/era-source/` holds the images as uploaded. `public/era/` holds the
cleaned versions the page uses: black backgrounds removed (pure black flooded
from the corners at 1% tolerance; more ate into dark liveries), trimmed to the
subject, two-up images split, then saved as WebP at twice the size each is
drawn (cars 280px wide, helmets 136, cameras 340, Rossi 260, tyre 96). Every
car faces left.

## In `public/era/`

| File | From | Notes |
| --- | --- | --- |
| `car-f2004.webp` | 26 | Chosen over 04: has the driver |
| `car-r26.webp` | 15 | |
| `car-mp4-20.webp` | 24 | Chosen over 09: has the driver |
| `car-mp4-22.webp` | 17 | Chosen over 23 and 27: driver, and the right number (2) |
| `car-bmw-kubica.webp` | 29 | BMW Sauber F1.08, 2008; cut at 5% with a 1px edge trim, as its black was noisier |
| `car-ferrari-hamilton.webp` | 08 | Chosen over 06 and 10 |
| `car-redbull-verstappen.webp` | 05 | |
| `car-redbull-vettel.webp` | 11 | |
| `car-brawn-button.webp` | 07 | |
| `car-delta-integrale.webp` | 03 | Chosen over 22: straight side view, like the rest |
| `car-impreza.webp` | 14 | |
| `car-celica.webp` | 16 | |
| `car-evo.webp` | 18 | |
| `car-escort.webp` | 21 | |
| `camera-sony-silver.webp` | 02 | |
| `camera-sony-purple.webp` | 12 | |
| `rossi-bike.webp` | 13 (bottom) | |
| `rossi-wheelie.webp` | 13 (top) | |

Not used: 01 (the four rally cars again, as one grid), 19 (the Razr), 20 (the
Canon), 04, 06, 09, 10, 22,
23, 25 (the cameras again), 27, 28 (the Razr again).

## Still needed for the sketch

- Helmets: done. Six front views (Schumacher, Alonso, Raikkonen, Vettel,
  Verstappen, Hamilton), originals in `era-source/helmets/`, cut out to
  `public/era/helmet-*.webp`. They are the banner now (`src/era/HelmetGrid.tsx`),
  so a separate `banner.png` is no longer needed. Rossi's helmet would still
  be welcome.
- Top-down cars (nose up), if the cars in the margins should follow the wavy
  tracks. Without them, side views drive the straight parts.

## Sponsor marks

The liveries and helmets keep their real sponsor marks, tobacco brands
included (Marlboro, Mild Seven, West, Rothmans), as they ran in period.
Decided: they stay. Nothing on the site sells or promotes those products;
if a rights holder ever asks for a mark to come off, that one image is
swapped.
