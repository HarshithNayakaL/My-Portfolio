import { cars, rossi } from "./cars";

/**
 * Every car on the site parked in one row at the foot of the page, with
 * Rossi's bike on the end. Hovering one rolls it forward and names it.
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
      <span className="era-bay era-bay-bike" data-label="Yamaha, Rossi" style={{ width: 60 }}>
        <img src={rossi.ride.src} alt="" width={60} height={Math.round(60 / rossi.ride.ratio)} loading="lazy" decoding="async" />
      </span>
    </div>
  );
}
