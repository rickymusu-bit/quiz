"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  { execFileSync } = require("node:child_process");
const revision = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: path.resolve(__dirname, ".."),
  encoding: "utf8",
}).trim();
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "dist");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const mime = {
  ".png": "image/png",
  ".webp": "image/webp",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".svg": "image/svg+xml",
};
const data = (p) =>
  "data:" +
  (mime[path.extname(p)] || "application/octet-stream") +
  ";base64," +
  fs.readFileSync(path.join(root, p)).toString("base64");
const safe = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
function css(content, base) {
  return content.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/g, (all, q, url) =>
    /^(data:|https?:|#)/.test(url)
      ? all
      : 'url("' + data(path.posix.normalize(path.posix.join(base, url))) + '")',
  );
}
function inline(file) {
  return read(file)
    .replace(
      /<link\b[^>]*href="([^"]+\.css)"[^>]*>/g,
      (_, p) => "<style>" + css(read(p), path.posix.dirname(p)) + "</style>",
    )
    .replace(
      /<style>([\s\S]*?)<\/style>/g,
      (_, s) => "<style>" + css(s, ".") + "</style>",
    )
    .replace(
      /<script src="([^"]+)"><\/script>/g,
      (_, p) =>
        "<script>" + read(p).replace(/<\/script/gi, "<\\/script") + "</script>",
    )
    .replace(
      /\b(src|poster)="(assets\/[^\"]+)"/g,
      (_, attr, p) => attr + '="' + data(p) + '"',
    );
}
function addCerberoAssets(assets) {
  const frames=require('../assets/hell-cerbero-frames.js');
  const paths=new Set([...frames.walk.map(f=>f.asset),frames.parts.asset,frames.jaw?.asset,frames.flames?.asset].filter(Boolean));
  for(const file of paths)assets[file]=data(file);
}
function offline(review = false) {
  const catalog = JSON.parse(read("datasets.json")),
    texts = {
      "datasets.json": read("datasets.json"),
      "Fool_regole.html": read("Fool_regole.html"),
    };
  for (const bank of catalog.banche) texts[bank.url] = read(bank.url);
  const assets = {};

  for(const name of ["black-stone-bridge-v1.png","lava-sea-v2.png","portal-side-v3.png","portal-rocks-v1.png","sacrificio-v1.png","arsenico-v1.png"])
    assets["assets/hell-race/"+name]=data("assets/hell-race/"+name);
  for (const name of fs.readdirSync(path.join(root, "assets/hell-race")))
    if (name.endsWith(".webp") && !['portal-flames-v1.webp','demon-actions-v1.webp','demon-ending-v1.webp'].includes(name))
      assets["assets/hell-race/" + name] = data("assets/hell-race/" + name);
  for (const file of ["assets/game-over.png"])
    assets[file] = data(file);
  addCerberoAssets(assets);
  const config = { texts, assets };
  const pages = {};
  for (const file of ["index.html", "Fool.html", "Fool_regole.html"]) {
    let html = inline(file);
    if (file === "index.html")
      html = html.replaceAll("'fool-v1'", "'hellscape-offline-v1:fool-v1'");
    const runtime = `window.HellscapeOffline={...parent.HellscapePreview.resources,search:parent.HellscapePreview.search};window.hellscapePreviewHome=()=>parent.HellscapePreview.navigate('index.html');document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;const url=new URL(a.getAttribute('href'),'https://offline.invalid/');const file=url.pathname.split('/').pop()||'index.html';if(['index.html','Fool.html','Fool_regole.html'].includes(file)){e.preventDefault();e.stopImmediatePropagation();parent.HellscapePreview.navigate(file+url.search);}},true);`;
    // The iframe receives launch parameters without relying on file:// query handling.
    html = html.replace("<head>", "<head><script>" + runtime + "</script>");
    pages[file] = html;
  }
  const fixed = `const resources=${safe(config)},pages=${safe(pages)};const frame=document.querySelector('iframe');window.HellscapePreview={resources,navigate(route){const url=new URL(route,'https://offline.invalid/');let html=pages[url.pathname.slice(1)];if(!html)throw Error('Unknown preview page');this.search=url.search;frame.srcdoc=html;}};HellscapePreview.navigate('index.html');`;
  fs.writeFileSync(
    path.join(out, review ? "Hellscape-review.html" : "Hellscape-offline.html"),
    '<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hellscape — anteprima offline</title><meta name="hellscape-revision" content="' +
      revision +
      '"><style>html,body,iframe{width:100%;height:100%;margin:0;border:0;display:block;background:#090909}</style><iframe title="Hellscape" allow="fullscreen"></iframe><script>' +
      fixed + (review ? "\n" + read("scripts/quality-preview.js") : "") +
      "</script></html>",
  );
}
function ammoPreview(){
  const assets={};

  for(const name of ['vehicles-drive-v1.webp','infernal-world-v1.webp','ammo-relics-v1.webp','lava-bridge-v1.webp','lava-lake-v1.webp','black-stone-bridge-v1.png','lava-sea-v2.png','sacrificio-v1.png','arsenico-v1.png']){
    const p='assets/hell-race/'+name;assets[p]=data(p);
  }
  addCerberoAssets(assets);
  const html=inline('Ammo-preview.html').replace('<head>','<head><meta name="hellscape-revision" content="'+revision+'"><script>window.HellscapeOffline={assets:'+safe(assets)+'};</script>');
  fs.writeFileSync(path.join(out,'Hellscape-Ammo.html'),html);
}
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(
  path.join(out, "revision.json"),
  JSON.stringify({ revision }, null, 2) + "\n",
);
if (process.argv.includes("--quality-preview")) offline(true);
else if (process.argv.includes("--ammo-preview")) ammoPreview();
else if (process.argv.includes("--offline")) {offline();ammoPreview();}
else {
  const site = path.join(out, "site");
  fs.mkdirSync(site, { recursive: true });
  // Preserve every published route and its assets, including the preview page.
  // Offline packaging is a separate optional branch above, not a site dependency.
  const publishedPaths = [
    "index.html",
    "Fool.html",
    "Fool_regole.html",
    "Ammo-preview.html",
    "datasets.json",
    ".nojekyll",
    "dataset",
    "assets",
  ];
  for (const p of publishedPaths)
    fs.cpSync(path.join(root, p), path.join(site, p), { recursive: true });
}
