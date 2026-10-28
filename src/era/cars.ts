/**
 * The pixel-art cars in public/era/. Every image faces left, so anything that
 * moves them mirrors the image when it drives to the right.
 *
 * `ratio` is width / height of the cleaned image, so a car can be laid out at
 * any width without waiting for the image to load.
 */
export type EraCar = { id: string; src: string; label: string; ratio: number; kind: "f1" | "rally" };

const car = (id: string, label: string, w: number, h: number, kind: EraCar["kind"] = "f1"): EraCar => ({
  id,
  src: `/era/car-${id}.webp`,
  label,
  ratio: w / h,
  kind,
});

export const cars: EraCar[] = [
  car("f2004", "Ferrari F2004, Schumacher", 640, 173),
  car("r26", "Renault R26, Alonso", 640, 172),
  car("mp4-20", "McLaren MP4-20, Raikkonen", 640, 175),
  car("mp4-22", "McLaren MP4-22, Hamilton", 640, 170),
  car("bmw-kubica", "BMW Sauber F1.08, Kubica", 2063, 522),
  car("ferrari-hamilton", "Ferrari, Hamilton", 640, 167),
  car("redbull-verstappen", "Red Bull, Verstappen", 640, 167),
  car("redbull-vettel", "Red Bull, Vettel", 640, 168),
  car("brawn-button", "Brawn, Button", 640, 164),
  car("delta-integrale", "Lancia Delta Integrale", 640, 243, "rally"),
  car("impreza", "Subaru Impreza", 640, 210, "rally"),
  car("celica", "Toyota Celica", 640, 217, "rally"),
  car("evo", "Mitsubishi Lancer Evo", 640, 205, "rally"),
  car("escort", "Ford Escort RS Cosworth", 640, 214, "rally"),
];

export const byId = (id: string) => cars.find((c) => c.id === id) ?? cars[0];

export const rossi = {
  ride: { src: "/era/rossi-bike.webp", ratio: 480 / 235 },
  wheelie: { src: "/era/rossi-wheelie.webp", ratio: 480 / 372 },
};

// Stoner's Ducati with the #1 plate, as in 2008, the Laguna Seca year.
export const stoner = { src: "/era/stoner-bike.webp", ratio: 230 / 127 };
