/* Targeted pixel-title, vehicle preview and Ammo HUD regression test. */
const { chromium } = require("playwright");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
(async () => {
  const root = path.resolve(__dirname, "..");
  fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, "." + decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "/"));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    try {
      const ext = path.extname(file);
      res.setHeader("Content-Type", {
        ".html": "text/html", ".js": "application/javascript",
        ".css": "text/css", ".webp": "image/webp", ".json": "application/json",
        ".ttf": "font/ttf", ".png": "image/png"
      }[ext] || "application/octet-stream");
      res.end(fs.readFileSync(file));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle",
      "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
  });
  const page = await browser.newPage({viewport:{width:1366,height:900}});
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    const origin = "http://127.0.0.1:" + server.address().port;
    await page.goto(origin + "/");
    const title = page.locator("canvas.home-wordmark.pixel-wordmark");
    await title.waitFor();
    assert.equal(await title.evaluate(c=>c.width),256);
    assert.equal(await title.evaluate(c=>c.getAttribute("aria-label")),"HELLSCAPE");
    await page.screenshot({path:"artifacts/title-pixelated.png"});
    await page.goto(origin + "/Fool.html?start=1");
    await page.locator("#vehicle0").waitFor();
    await page.locator("#vehicle-preview-0 canvas").evaluate(c => {c.dataset.previousVehicle="true";});
    await page.locator("#vehicle0").selectOption("truck");
    assert.equal(await page.locator("#vehicle-preview-0 canvas").count(), 1);
    assert.equal(await page.locator("#vehicle-preview-0 canvas").getAttribute("data-previous-vehicle"),null,
      "Changing vehicle must replace its actual canvas sprite");
    assert.equal(await page.locator("#vehicle-preview-0").getAttribute("aria-label"),"Camion · Fortezza");
    await page.screenshot({path:"artifacts/customization-truck.png"});
    await page.getByRole("button",{name:/Inizia partita/}).click();
    await page.getByRole("button",{name:"Svela e avvia il tempo"}).waitFor();
    await page.evaluate(() => {
      const g=HellscapeUI.game.s;
      const owner=g.owner;
      g.groups[owner].inventory.push({id:"ux-test",type:"salta",target:null,origin:"ux"});
      HellscapeUI.renderGame();
    });
    await page.locator(".turn-order button").first().click();
    await page.locator("#dialog .ammo-round").first().click();
    assert(!((await page.locator("#ammo-info").innerText()).includes("Probabilità")));
    await page.locator("#ammo-info").getByRole("button",{name:"Chiudi"}).click();
    await page.locator("#dialog").getByRole("button",{name:"Chiudi",exact:true}).click();
    await page.evaluate(() => {
      const s=HellscapeUI.game.s, source=s.owner,target=(source+1)%3;
      s.effects.push({id:"ux-effect",type:"salta",source,target});
      s.events.push({id:"ux-event",message:"Ammo usata",activation:"ux-effect",
        copy:{id:"ux-copy",type:"salta",target:null},source,target,turn:s.turn});
      HellscapeUI.renderGame();
    });
    assert((await page.locator(".turn-order .effect-chip").innerText()).includes("Nope"));
    assert((await page.locator(".turn-order .ammo-impact").innerText()).includes("Nope"));
    await page.screenshot({path:"artifacts/ammo-effect-hud.png"});
    await page.evaluate(() => {
      const s=HellscapeUI.game.s;s.effects=[];s.turn++;
      HellscapeUI.renderGame();
    });
    assert.equal(await page.locator(".turn-order .effect-chip").count(),0);
    assert.equal(await page.locator(".turn-order .ammo-impact").count(),0);
    assert.deepEqual(errors,[]);
    console.log("PASS: pixel title, live vehicle preview, Ammo information and effects HUD");
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });