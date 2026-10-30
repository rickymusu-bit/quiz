/* Original illustrated title, vehicle preview and Ammo HUD regression test. */
const { chromium } = require("playwright");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
(async () => {
  const root = path.resolve(__dirname, "..");
  fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(req.url.split("?")[0]);
    const file = path.resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
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
    const title = page.locator("img.home-wordmark");
    await title.waitFor();
    await title.evaluate(c=>c.decode());
    assert.equal(await title.evaluate(c=>c.naturalWidth),2172);
    assert.equal(await title.evaluate(c=>getComputedStyle(c).imageRendering),'auto');
    assert.equal(await title.getAttribute("src"),"assets/hellscape-logo.webp");
    assert.equal(await title.getAttribute("alt"),"HELLSCAPE");
    await page.screenshot({path:"artifacts/title-original.png"});
    await page.goto(origin + "/Fool.html?start=1");
    await page.locator("#vehicle0").waitFor();
    const headerTitle = page.locator('img.hellscape-logo');
    await headerTitle.evaluate(c=>c.decode());
    assert.equal(await headerTitle.evaluate(c=>c.naturalWidth),2172);
    await page.locator("#vehicle-preview-0 canvas").evaluate(c => {c.dataset.previousVehicle="true";});
    await page.locator("#vehicle0").selectOption("truck");
    assert.equal(await page.locator("#vehicle-preview-0 canvas").count(), 1);
    assert.equal(await page.locator("#vehicle-preview-0 canvas").getAttribute("data-previous-vehicle"),null,
      "Changing vehicle must replace its actual canvas sprite");
    assert.equal(await page.locator("#vehicle-preview-0").getAttribute("aria-label"),"Camion · Fortezza");
    await page.screenshot({path:"artifacts/customization-truck.png"});
    await page.getByRole("button",{name:/Inizia partita/}).click();
    await page.getByRole("button",{name:"Svela e avvia il tempo"}).waitFor();
    // Player lives must be visible even when all three HUD windows are collapsed.
    const players = page.locator(".turn-order .player-window");
    assert.equal(await players.count(), 3);
    assert.equal(await page.locator(".turn-order .player-window[open]").count(), 0);
    for (const card of await players.all()) {
      assert.equal(await card.locator(".lives .heart").count(), 3);
      assert(await card.locator(".lives").isVisible());
      assert.equal(
        await card.locator(".heart").first().evaluate(el => getComputedStyle(el, "::before").content),
        '"♥"',
      );
    }
    await page.evaluate(() => {
      const state = HellscapeUI.game.s;
      // Legacy roundCount saves previously displayed an extra "Domanda N di M".
      state.config.questionCount = 39;
      state.groups[0].damage = 1;
      HellscapeUI.renderGame();
    });
    assert.match(await page.locator(".operation-body .turn-progress").innerText(), /turno 1 di 13/i);
    assert(!/domanda\s+\d+\s+di\s+\d+/i.test(await page.locator(".operation-body").innerText()));
    const damaged = page.locator('.turn-order button[data-team="0"] .lives');
    assert.match(await damaged.getAttribute("aria-label"), /2 vite su 3/);
    assert.equal(await damaged.locator(".heart.lost").count(), 1);
    assert(await damaged.isVisible());
    const liquid = await page.locator(".vial-liquid").evaluate(el => getComputedStyle(el).backgroundImage);
    assert(liquid.includes("rgb(101, 13, 25)"), "The timer must use the dark blood-red palette");
    await page.screenshot({path:"artifacts/hud-lives-blood-vial-desktop.png"});
    await page.setViewportSize({width:667,height:375});
    for (const life of await page.locator(".turn-order .lives").all()) assert(await life.isVisible());
    await page.screenshot({path:"artifacts/hud-lives-blood-vial-landscape.png"});
    await page.setViewportSize({width:1366,height:900});
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
    // The HUD returns after the new Ammo cinematic finishes.
    await page.locator(".turn-order").waitFor({state:"visible"});
    assert((await page.locator(".turn-order .effect-chip").innerText()).includes("Catene"));
    assert((await page.locator(".turn-order .ammo-impact").innerText()).includes("Catene"));
    await page.screenshot({path:"artifacts/ammo-effect-hud.png"});
    await page.evaluate(() => {
      const s=HellscapeUI.game.s;s.effects=[];s.turn++;
      HellscapeUI.renderGame();
    });
    assert.equal(await page.locator(".turn-order .effect-chip").count(),0);
    assert.equal(await page.locator(".turn-order .ammo-impact").count(),0);
    assert.deepEqual(errors,[]);
    console.log("PASS: original illustrated titles, live vehicle preview, Ammo information and effects HUD");
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
