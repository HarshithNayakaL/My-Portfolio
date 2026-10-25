import { useState } from "react";

/**
 * A Sony Cyber-shot hanging by its wrist strap in the left margin, swinging a
 * little. Pressing it fires the flash. Wide screens only; below that the
 * margin it hangs in doesn't exist.
 */
export default function HangingCamera() {
  const [flash, setFlash] = useState(0);
  return (
    <>
      <div className="era-hang">
        <span aria-hidden className="era-hang-cord" />
        <button
          type="button"
          className="era-hang-cam"
          aria-label="Take a photo with the Cyber-shot"
          onClick={() => setFlash((n) => n + 1)}
        >
          <img src="/era/camera-sony-silver.png" alt="" width={150} height={Math.round(150 / (480 / 293))} />
        </button>
      </div>
      {flash > 0 && <span key={flash} aria-hidden className="era-flash" />}
    </>
  );
}
