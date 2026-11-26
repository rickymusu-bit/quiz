/**
 * Verifica nel browser della pagina graybox: build Vite reale, Chromium,
 * viewport desktop e mobile orizzontale. Controlla che la scena disegni solo le
 * celle esplorate, che il canvas non sia vuoto e che non ci siano errori.
 * Screenshot in artifacts/hellscape3d/ (cartella ignorata da git).
 *
 * Uso: npm run test:hellscape3d:browser
 * (HELLSCAPE3D_CPU_THROTTLE=N rallenta JavaScript di N volte; approssimazione dei runner lenti)
 */
import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { chromium, type Page } from "playwright";
import { build, preview } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const artifacts = resolve(root, "../artifacts/hellscape3d");
mkdirSync(artifacts, { recursive: true });

interface Point {
  x: number;
  y: number;
  z: number;
}

interface DebugInfo {
  ready: boolean;
  turn: number;
  phase: string;
  revealAll: boolean;
  busy: boolean;
  explored: string[];
  shown: string[];
  rendered: string[];
  pawns: Record<string, Point>;
  cellPositions: Record<string, Point>;
  panel: "question" | "roll" | "fork" | "ended" | null;
  timer: { remaining: number; total: number } | null;
  correctIndex?: number;
  forkChoices: { number: number; to: string; anchored: boolean }[];
  minimap: string[];
  activePlayerId: string;
  stateActivePlayerId: string;
  totalCells: number;
  stats: { tiles: number; walkways: number; stubs: number; masses: number; players: number };
}

const VIEWPORTS = [
  { name: "desktop-1440x900", viewport: { width: 1440, height: 900 }, isMobile: false },
  { name: "mobile-844x390", viewport: { width: 844, height: 390 }, isMobile: true },
] as const;

const CASES = [
  { name: "inizio", query: "seed=graybox-1" },
  { name: "partita-avanzata", query: "seed=graybox-1&steps=16" },
  { name: "panoramica-esplorata", query: "seed=graybox-1&steps=16&view=overview" },
  { name: "citta-rivelata-sviluppo", query: "seed=graybox-1&reveal=all&view=overview" },
] as const;

async function waitReady(page: Page): Promise<void> {
  await page.waitForFunction(() => (window as unknown as { __hellscape3d?: DebugInfo }).__hellscape3d?.ready === true, null, { timeout: 30_000 });
}

/** A regia ferma: celle mostrate = esplorate = disegnate, pedine sulle caselle dello stato. */
function assertSettled(debug: DebugInfo): void {
  assert.equal(debug.busy, false);
  assert.deepEqual(debug.shown, debug.explored);
  assert.deepEqual(debug.rendered, debug.explored);
  assert.deepEqual(debug.minimap, debug.explored, "minimappa diversa dalle celle esplorate");
  assert.equal(debug.activePlayerId, debug.stateActivePlayerId);
  for (const [id, p] of Object.entries(debug.pawns)) {
    const q = debug.cellPositions[id]!;
    assert.ok(Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) < 1e-6, `pedina ${id} non sulla sua casella`);
  }
}

async function info(page: Page): Promise<DebugInfo> {
  return page.evaluate(() => (window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d);
}

/** Deviazione standard della luminanza: un canvas vuoto o uniforme vale circa 0. */
async function luminanceSpread(png: Buffer): Promise<number> {
  const image = await loadImage(png);
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, image.width, image.height);
  let sum = 0,
    sum2 = 0,
    n = 0;
  for (let i = 0; i < data.length; i += 16) {
    const y = 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
    sum += y;
    sum2 += y * y;
    n++;
  }
  return Math.sqrt(sum2 / n - (sum / n) ** 2);
}

await build({ root, logLevel: "warn" });
const server = await preview({ root, logLevel: "warn", preview: { port: 0, host: "127.0.0.1" } });
const url = server.resolvedUrls?.local[0];
assert.ok(url, "server di anteprima non avviato");
const executablePath = [process.env.CHROMIUM_PATH, "/usr/bin/chromium", "/opt/pw-browsers/chromium"].find((p) => p && existsSync(p));
const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
let failures = 0;
try {
  for (const device of VIEWPORTS) {
    const context = await browser.newContext({ viewport: device.viewport, deviceScaleFactor: 1, isMobile: device.isMobile, hasTouch: device.isMobile });
    const page = await context.newPage();
    // HELLSCAPE3D_CPU_THROTTLE=N rallenta JavaScript di N volte. È solo un'approssimazione dei runner lenti:
    // non rallenta il rendering WebGL software e non ha riprodotto tutti i fallimenti osservati in CI.
    const throttle = Number(process.env.HELLSCAPE3D_CPU_THROTTLE ?? 0);
    if (throttle > 1) await (await context.newCDPSession(page)).send("Emulation.setCPUThrottlingRate", { rate: throttle });
    const errors: string[] = [];
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
    page.on("pageerror", (error) => errors.push(String(error)));
    for (const testCase of CASES) {
      const label = `${device.name} · ${testCase.name}`;
      try {
        await page.goto(`${url}?${testCase.query}`);
        await waitReady(page);
        const debug = await info(page);
        if (debug.revealAll) assert.equal(debug.rendered.length, debug.totalCells, "città rivelata incompleta");
        else assertSettled(debug);
        assert.equal(debug.stats.tiles, debug.rendered.length);
        assert.equal(debug.stats.players, 2);
        const png = await page.screenshot({ path: join(artifacts, `${testCase.name}-${device.name}.png`) });
        const spread = await luminanceSpread(png);
        assert.ok(spread > 8, `canvas apparentemente vuoto (deviazione ${spread.toFixed(1)})`);
        console.log(`ok   ${label} · celle ${debug.rendered.length}/${debug.totalCells} · turno ${debug.turn} · contrasto ${spread.toFixed(1)}`);
      } catch (error) {
        failures++;
        console.log(`FAIL ${label}: ${(error as Error).message}`);
      }
    }
    // Regia: animazione reale, salto e coerenza finale con lo stato.
    try {
      await page.goto(`${url}?seed=graybox-1`);
      await waitReady(page);
      const first = await info(page);
      let animated = 0;
      for (let action = 0; action < 30 && animated < 2; action++) {
        await page.keyboard.press("KeyA");
        await page.waitForTimeout(120);
        const during = await info(page);
        if (!during.busy) continue;
        animated++;
        assert.ok(during.shown.every((id) => during.explored.includes(id)), "celle mostrate prima di essere esplorate");
        assert.deepEqual(during.rendered, during.shown, "celle disegnate diverse da quelle mostrate dalla regia");
        assert.deepEqual(during.minimap, during.shown, "minimappa diversa dalle celle mostrate");
        assert.equal(during.panel, null, "pannello visibile durante la regia");
        if (animated === 2) {
          await page.keyboard.press("KeyS");
          await page.waitForTimeout(50);
          assert.equal((await info(page)).busy, false, "il salto non interrompe la regia");
        } else {
          await page.waitForFunction(() => (window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d.busy === false, null, { timeout: 15_000 });
        }
        assertSettled(await info(page));
      }
      assert.equal(animated, 2, "nessuna regia animata osservata");
      const after = await info(page);
      assert.ok(after.turn > first.turn, "la partita non è avanzata");
      console.log(`ok   ${device.name} · regia animata, salto e stato finale (turno ${first.turn} → ${after.turn})`);
    } catch (error) {
      failures++;
      console.log(`FAIL ${device.name} · regia: ${(error as Error).message}`);
    }
    // Interfaccia: domanda, timer, dado e scelta al bivio dall'interfaccia, con tastiera e clic.
    try {
      const waitIdle = (): Promise<unknown> =>
        page.waitForFunction(() => (window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d.busy === false, null, { timeout: 15_000 });
      await page.goto(`${url}?seed=graybox-1&steps=15&test=1`);
      await waitReady(page);
      let debug = await info(page);
      assert.equal(debug.panel, "question");
      assert.ok(await page.locator(".hud-panel .hud-option").first().isVisible(), "risposte non visibili");
      const before = debug.timer!.remaining;
      await page.waitForTimeout(1200);
      debug = await info(page);
      assert.ok(before - debug.timer!.remaining >= 0.8, "il timer non scorre con la domanda visibile");
      await page.keyboard.press(`Digit${debug.correctIndex! + 1}`);
      await page.waitForTimeout(100);
      debug = await info(page);
      assert.equal(debug.panel, "roll", "dopo la risposta corretta non compare il dado");
      await page.locator(".hud-panel .hud-primary").click();
      await page.waitForTimeout(150);
      debug = await info(page);
      assert.equal(debug.busy, true, "il dado non avvia la camminata");
      assert.equal(debug.panel, null);
      await waitIdle();
      debug = await info(page);
      assertSettled(debug);
      if (debug.panel === "question") assert.ok(debug.timer!.total - debug.timer!.remaining < 0.5, "il timer è scorso durante la regia");
      console.log(`ok   ${device.name} · domanda, dado e timer fermo durante la regia`);

      // Risposta errata con il mouse: il turno passa all'altro giocatore.
      await page.goto(`${url}?seed=graybox-1&steps=15&test=1`);
      await waitReady(page);
      debug = await info(page);
      const wrong = (debug.correctIndex! + 1) % 4;
      const player = debug.stateActivePlayerId;
      await page.locator(".hud-panel .hud-option").nth(wrong).click();
      await waitIdle();
      debug = await info(page);
      assert.notEqual(debug.stateActivePlayerId, player, "la risposta errata non passa il turno");
      assertSettled(debug);

      // Scadenza del timer.
      await page.goto(`${url}?seed=graybox-1&steps=15&timer=1`);
      await waitReady(page);
      await page.waitForTimeout(1600);
      await waitIdle();
      debug = await info(page);
      assert.notEqual(debug.stateActivePlayerId, player, "la scadenza non passa il turno");
      console.log(`ok   ${device.name} · risposta errata e scadenza del timer`);

      // Bivio: numeri sugli imbocchi, scelta da tastiera.
      await page.goto(`${url}?seed=graybox-1&steps=7`);
      await waitReady(page);
      debug = await info(page);
      assert.equal(debug.panel, "fork");
      assert.ok(debug.forkChoices.length >= 2 && debug.forkChoices.every((c) => c.anchored), "alternative non segnalate nella scena");
      assert.equal(await page.locator(".hud-badge").count(), debug.forkChoices.length);
      const chosen = debug.forkChoices[1]!.to;
      await page.keyboard.press("Digit2");
      await page.waitForTimeout(100);
      await waitIdle();
      debug = await info(page);
      assertSettled(debug);
      assert.ok(debug.explored.includes(chosen));
      console.log(`ok   ${device.name} · scelta al bivio`);
    } catch (error) {
      failures++;
      console.log(`FAIL ${device.name} · interfaccia: ${(error as Error).message}`);
    }
    // Movimento ridotto: nessuna animazione, presentazione sempre allineata allo stato.
    try {
      await page.goto(`${url}?seed=graybox-1&motion=reduced`);
      await waitReady(page);
      for (let action = 0; action < 15; action++) {
        await page.keyboard.press("KeyA");
        await page.waitForTimeout(40);
        const current = await info(page);
        assert.equal(current.busy, false, "regia animata con movimento ridotto");
        assertSettled(current);
      }
      console.log(`ok   ${device.name} · movimento ridotto`);
    } catch (error) {
      failures++;
      console.log(`FAIL ${device.name} · movimento ridotto: ${(error as Error).message}`);
    }
    if (errors.length > 0) {
      failures++;
      console.log(`FAIL ${device.name} · errori nella console: ${errors.join(" | ")}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise<void>((done) => server.httpServer.close(() => done()));
}
console.log(failures === 0 ? "Graybox: tutte le verifiche superate" : `Graybox: ${failures} verifiche fallite`);
process.exit(failures === 0 ? 0 : 1);
