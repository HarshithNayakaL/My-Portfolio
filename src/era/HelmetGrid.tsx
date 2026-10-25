/**
 * The banner: six helmets mapped on a square grid, each in its own cell
 * inside a bounding box with crosshairs and anchor points, like objects laid
 * out in a drawing tool. In order of era, Ferrari to Ferrari.
 */
const helmets = [
  { id: "schumacher", name: "Schumacher", team: "Ferrari", full: "Michael Schumacher" },
  { id: "alonso", name: "Alonso", team: "Renault", full: "Fernando Alonso" },
  { id: "raikkonen", name: "Räikkönen", team: "McLaren", full: "Kimi Räikkönen" },
  { id: "vettel", name: "Vettel", team: "Red Bull", full: "Sebastian Vettel" },
  { id: "verstappen", name: "Verstappen", team: "Red Bull", full: "Max Verstappen" },
  { id: "hamilton", name: "Hamilton", team: "Ferrari", full: "Lewis Hamilton" },
];
// The cut-outs are all 320px tall and about 266 wide.
const W = 60;
const H = Math.round((W * 320) / 266);

export default function HelmetGrid() {
  return (
    <ul className="hg" aria-label="Pixel-art F1 helmets">
      {helmets.map((h) => (
        <li key={h.id} className="hg-cell">
          <span aria-hidden className="hg-guides">
            <span className="hg-box"><i /><i /><i /><i /></span>
          </span>
          <img
            src={`/era/helmet-${h.id}.png`}
            alt={`${h.full}'s ${h.team} helmet, in pixel art`}
            width={W}
            height={H}
            decoding="async"
            className="hg-helmet"
          />
          <span className="hg-cap">
            <span className="block text-[max(12px,0.8125rem)] font-semibold text-ink">{h.name}</span>
            <span className="block text-[max(12px,0.75rem)] text-dim">{h.team}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
