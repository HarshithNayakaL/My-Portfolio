/**
 * The banner: six helmets on display, Ferrari to Ferrari. Each stands in its
 * own lit bay: a back wall with a spotlight falling on it, a glossy shelf it
 * stands on, a contact shadow and a faint reflection. Hovering one selects
 * it the way a drawing tool does (a bounding box with corner handles) and
 * names the driver and team.
 */
const helmets = [
  { id: "schumacher", name: "Schumacher", team: "Ferrari" },
  { id: "alonso", name: "Alonso", team: "Renault" },
  { id: "raikkonen", name: "Räikkönen", team: "McLaren" },
  { id: "vettel", name: "Vettel", team: "Red Bull" },
  { id: "verstappen", name: "Verstappen", team: "Red Bull" },
  { id: "hamilton", name: "Hamilton", team: "Ferrari" },
];
// The cut-outs are all 320px tall and about 266 wide.
const W = 64;
const H = Math.round((W * 320) / 266);

export default function HelmetGrid() {
  return (
    // Decorative, and kept out of the page's text and images on purpose: the
    // helmets come before the profile photo, and a helmet must never become
    // the photo search results show for this page.
    <ul className="hg" aria-hidden>
      {helmets.map((h) => (
        <li key={h.id} className="hg-cell">
          <span aria-hidden className="hg-wall">
            <span className="hg-box"><i /><i /><i /><i /></span>
          </span>
          <span aria-hidden className="hg-shelf" />
          <span aria-hidden className="hg-shadow" />
          <img src={`/era/helmet-${h.id}.png`} alt="" aria-hidden width={W} height={H} decoding="async" className="hg-reflect" />
          <img
            src={`/era/helmet-${h.id}.png`}
            alt=""
            width={W}
            height={H}
            decoding="async"
            className="hg-helmet"
          />
          <span aria-hidden className="hg-cap">
            <b className="font-semibold">{h.name}</b> · {h.team}
          </span>
        </li>
      ))}
    </ul>
  );
}
