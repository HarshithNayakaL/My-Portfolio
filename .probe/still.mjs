import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", args:["--no-sandbox"] });
const p = await b.newPage();
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:5207/", { waitUntil: "networkidle0" });
await new Promise(r=>setTimeout(r,3500));
const r = await p.evaluate(() => {
  const el = document.querySelector(".onee");
  if (!el) return null;
  const b = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height),
           onScreen: b.x >= 0 && b.y >= 0 && b.right <= innerWidth && b.bottom <= innerHeight,
           visible: cs.opacity === "1" && cs.visibility === "visible" };
});
console.log("REDUCED MOTION:", JSON.stringify(r));
const a = await p.evaluate(() => document.querySelector(".onee").style.transform);
await new Promise(x=>setTimeout(x,2500));
const c = await p.evaluate(() => document.querySelector(".onee").style.transform);
console.log("holds completely still:", a === c);
const before = await p.evaluate(() => document.querySelector("#onee-body").getAttribute("d").slice(0,30));
await p.mouse.click(r.x + r.w/2, r.y + r.h/2);
await new Promise(x=>setTimeout(x,400));
const after = await p.evaluate(() => document.querySelector("#onee-body").getAttribute("d").slice(0,30));
console.log("tap changes the face:", before !== after);
await p.screenshot({ path: ".probe/still.png", clip: { x: Math.max(0,r.x-40), y: Math.max(0,r.y-40), width: r.w+80, height: r.h+80 } });
await b.close();
