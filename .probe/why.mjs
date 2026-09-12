import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", args:["--no-sandbox"] });

async function check(label, opts = {}) {
  const p = await b.newPage();
  const errs = [];
  p.on("pageerror", e => errs.push(e.message));
  p.on("console", m => { if (m.type()==="error") errs.push(m.text()); });
  if (opts.reduce) await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  if (opts.mobile) await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  else await p.setViewport({ width: 1280, height: 800 });
  await p.goto("http://localhost:5207/", { waitUntil: "networkidle0" });
  await new Promise(r=>setTimeout(r,4000));
  const r = await p.evaluate(() => ({
    mascot: !!document.querySelector(".onee"),
    opacity: document.querySelector(".onee") ? getComputedStyle(document.querySelector(".onee")).opacity : null,
  }));
  console.log(`${label.padEnd(34)} mascot=${r.mascot}  opacity=${r.opacity}  ${errs.length ? "ERR: " + errs[0].slice(0,80) : ""}`);
  await p.close();
}

await check("desktop, normal motion");
await check("desktop, REDUCED MOTION", { reduce: true });
await check("mobile, normal motion", { mobile: true });
await check("mobile, REDUCED MOTION", { mobile: true, reduce: true });

// does an unbound requestIdleCallback throw?
const p = await b.newPage();
await p.goto("http://localhost:5207/", { waitUntil: "domcontentloaded" });
const unbound = await p.evaluate(() => {
  try { const f = window.requestIdleCallback; f(() => {}); return "works unbound"; }
  catch (e) { return "THROWS: " + e.message; }
});
console.log("unbound requestIdleCallback:", unbound);
await b.close();
