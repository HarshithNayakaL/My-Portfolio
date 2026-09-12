import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", args:["--no-sandbox"] });
const p = await b.newPage();
const errs = [];
p.on("console", m => { if (m.type()==="error") errs.push(m.text()); });
p.on("pageerror", e => errs.push("PAGEERROR: " + e.message));
p.on("requestfailed", r => errs.push("REQFAIL: " + r.url().split("/").pop() + " " + r.failure()?.errorText));
await p.setViewport({ width: 1280, height: 800 });
await p.goto("http://localhost:5207/", { waitUntil: "networkidle0" });
await new Promise(r=>setTimeout(r,4000));
const present = await p.evaluate(() => ({
  host: !!document.querySelector(".onee-host"),
  mascot: !!document.querySelector(".onee"),
  svgPaths: document.querySelectorAll(".onee__svg path").length,
}));
console.log("UNDER PRODUCTION CSP:", JSON.stringify(present));
console.log("errors:", errs.length ? errs.slice(0,6) : "none");
await b.close();
