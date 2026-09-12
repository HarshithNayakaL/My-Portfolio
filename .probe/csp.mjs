import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";
const CSP = "default-src 'self'; script-src 'self' 'sha256-MCXATBsOF7lKklDTciGqoH52Ayi2IaSeBCv0t5BQpJc='; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.web3forms.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; require-trusted-types-for 'script'; trusted-types default; upgrade-insecure-requests";
const types={".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json",".svg":"image/svg+xml",".woff2":"font/woff2",".webp":"image/webp",".png":"image/png",".txt":"text/plain",".xml":"application/xml",".md":"text/markdown"};
createServer(async (req,res)=>{
  let f=join("dist",decodeURIComponent(req.url.split("?")[0]));
  try{ if((await stat(f)).isDirectory()) f=join(f,"index.html"); }catch{ if(!extname(f)) f+="/index.html"; }
  try{
    const b=await readFile(f);
    // Exactly what production sends, minus upgrade-insecure-requests so http works.
    res.writeHead(200,{ "content-type":types[extname(f)]??"application/octet-stream",
      "content-security-policy": CSP.replace("; upgrade-insecure-requests","") });
    res.end(b);
  }catch{res.writeHead(404);res.end("nf");}
}).listen(5207,()=>console.log("ready"));
