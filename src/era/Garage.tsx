import { cars } from "./cars";

/**
 * Every car on the site parked in one row at the foot of the page. Hovering
 * one rolls it forward and names it. Rossi isn't parked: he rides the strip
 * below.
 */
export default function Garage() {
  return (
    <div aria-hidden className="era-garage">
      {cars.map((c) => {
        const w = c.kind === "f1" ? 80 : 68;
        return (
          <span key={c.id} className="era-bay" data-label={c.label} style={{ width: w }}>
            <img src={c.src} alt="" width={w} height={Math.round(w / c.ratio)} loading="lazy" decoding="async" />
          </span>
        );
      })}
    </div>
  );
}
