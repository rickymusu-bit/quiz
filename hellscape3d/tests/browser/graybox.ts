/**
 * Verifica nel browser della pagina graybox: build Vite reale, Chromium,
 * viewport desktop e mobile orizzontale. Controlla che la scena disegni solo le
 * celle esplorate, che il canvas non sia vuoto e che non ci siano errori.
 * Screenshot in artifacts/hellscape3d/ (cartella ignorata da git).
 *
 * Uso: npm run test:hellscape3d:browser
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

interface DebugInfo {
  ready: boolean;
  turn: number;
  phase: string;
  revealAll: boolean;
  explored: string[];
  rendered: string[];
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
    const errors: string[] = [];
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
    page.on("pageerror", (error) => errors.push(String(error)));
    for (const testCase of CASES) {
      const label = `${device.name} · ${testCase.name}`;
      try {
        await page.goto(`${url}?${testCase.query}`);
        await page.waitForFunction(() => (window as unknown as { __hellscape3d?: DebugInfo }).__hellscape3d?.ready === true, null, { timeout: 30_000 });
        const debug = await info(page);
        if (debug.revealAll) assert.equal(debug.rendered.length, debug.totalCells, "città rivelata incompleta");
        else assert.deepEqual(debug.rendered, debug.explored, "celle disegnate diverse da quelle esplorate");
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
    // Avanzamento da tastiera: lo stato cambia e l'esplorazione non regredisce.
    try {
      await page.goto(`${url}?seed=graybox-1`);
      await page.waitForFunction(() => (window as unknown as { __hellscape3d?: DebugInfo }).__hellscape3d?.ready === true);
      const before = await info(page);
      for (let i = 0; i < 12; i++) await page.keyboard.press("Space");
      const after = await info(page);
      assert.ok(after.turn > before.turn, "lo spazio non fa avanzare la partita");
      assert.ok(after.explored.length >= before.explored.length);
      assert.deepEqual(after.rendered, after.explored);
      console.log(`ok   ${device.name} · avanzamento da tastiera (turno ${before.turn} → ${after.turn})`);
    } catch (error) {
      failures++;
      console.log(`FAIL ${device.name} · avanzamento da tastiera: ${(error as Error).message}`);
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
