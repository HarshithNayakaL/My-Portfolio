import { useEffect, useRef } from "react";

/**
 * Mounts Onee, the companion that follows you around the site.
 *
 * Deliberately thin. Everything that makes Onee work — the geometry solver,
 * the definition, the state machine, the listeners — is behind the dynamic
 * import below, so the character costs the initial bundle nothing but this
 * file and an empty div. It is decorative, so it is not prerendered and not in
 * the accessibility tree: a crawler, a screen reader and a visitor with no
 * JavaScript all get the site without it, which is the whole content.
 */
export default function OneeCompanion() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // A reduced-motion preference asks for less movement, not less site. This
    // used to skip the mount entirely, which hid Onee from everyone running
    // with animation effects turned off — a setting plenty of people have on
    // without ever thinking of themselves as needing it, and the reason it
    // looked like the mascot had simply stopped working. They get a still
    // Onee instead: it sits in the corner and changes its face when tapped,
    // with no frame loop and nothing that moves on its own.
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let teardown: (() => void) | undefined;
    let cancelled = false;

    // Waits for the browser to finish the work that matters before spending
    // anything on the mascot.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
    const handle = idle(() => {
      import("../lib/onee")
        .then(({ mountOnee }) => {
          if (!cancelled) teardown = mountOnee(host, calm);
        })
        .catch(() => {
          // A site without its mascot is the site. Nothing to report.
        });
    });

    return () => {
      cancelled = true;
      window.cancelIdleCallback?.(handle as number);
      teardown?.();
    };
  }, []);

  return <div ref={hostRef} className="onee-host" aria-hidden="true" />;
}
