# Era redesign: assets

`design/era-source/` holds the images as uploaded. `public/era/` holds the
cleaned versions the page uses: black backgrounds removed (pure black flooded
from the corners at 1% tolerance; more ate into dark liveries), trimmed to the
subject, two-up images split, then saved as WebP at twice the size each is
drawn (cars 280px wide, helmets 136, cameras 340, Rossi 220 riding and 202 in the wheelie, Stoner 230 and 212). Every
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
| `rossi-bike.webp` | 31 | `31_yamaha_rossi_2009.png`, the 2009 Fiat Yamaha, period-correct beside Stoner's 2008 Ducati. Cut as below |
| `rossi-wheelie.webp` | 33 | `33_yamaha_rossi_2009_wheelie_steep.png`, paired with 34: same canvas and angle. Cut as below, plus the halo step |
| `stoner-wheelie.webp` | 34 | `34_ducati_stoner_wheelie.png`. Cut as below, plus the halo step |
| `stoner-bike.webp` | 30 | `30_ducati_stoner_no1.png`. Cut as below |

The two bikes are cut differently from the cars. Their tyre treads are pure
black inside a lighter outline, and the background reaches between the tyres
and the bodywork, so neither a floodfill nor hole-filling works on its own:
a floodfill at 1-2% leaks through gaps in the outline into the tread, and
closing the mask (dilate 7, erode 7) bridged the real gaps into black
blocks. The cut that works: threshold the brightest channel at 0.8%, drop
specks under 400px, remove only the black connected to the image edge, draw
each wheel disc opaque (6px inside the tyre, at measured centres) because a
wheel's black interior touches the gap behind it, then close with a 2.5px
disk to smooth the tyre edges without bridging anything real.

The wheelies (33, 34) also carry a faint dark ring about 10px outside the
tyres, a glow in the art that the threshold keeps. The halo step: open the
mask with a 2.5px disk and drop pieces under 5000px, which cuts the rings
loose, then keep the full mask only within 4px of that opened shape, so
the outline survives intact and the rings, further out, do not.

Not used: 01 (the four rally cars again, as one grid), 13 (Rossi on the later
Monster Yamaha, replaced by 31 and 33), 32 (a shallower 2009 wheelie), 19 (the Razr), 20 (the
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
