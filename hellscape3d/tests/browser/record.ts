/**
 * Registrazione reale della pagina di prova per le evidenze (AGENTS.md):
 * video del browser registrato da Playwright in tempo reale e convertito in
 * GIF con ffmpeg. Non fa parte della CI.
 *
 * Uso: node hellscape3d/tests/browser/record.ts --seed graybox-9 --steps 12 --actions 14 \
 *        [--width 960 --height 540] [--name regia] [--query motion=reduced]
 * Pagina predefinita: il gioco (scena di corsa); --page citta.html per la vista della città. Con --actions 0 si registra per
 * --duration secondi senza azioni (per esempio un'anteprima: --query anteprima=ID).
 * Con --setup si parte dalla schermata di avvio (senza seme: città casuale), compilata
 * dall'interfaccia con giocatori, nomi, argomenti e durata, poi si gioca per --actions azioni.
 * Richiede ffmpeg nel PATH. Output in artifacts/hellscape3d/.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { chromium } from "playwright";
import { build, preview } from "vite";

const { values } = parseArgs({
  options: {
    seed: { type: "string", default: "graybox-9" },
    steps: { type: "string", default: "12" },
    actions: { type: "string", default: "10" },
    width: { type: "string", default: "960" },
    height: { type: "string", default: "540" },
    name: { type: "string", default: "regia" },
    query: { type: "string", default: "" },
    fps: { type: "string", default: "10" },
    /** Dopo N azioni ricarica la pagina senza parametri, per registrare la ripresa della partita. */
    "reload-after": { type: "string", default: "" },
    /** Pagina: vuota per il gioco, citta.html per la vista della città. */
    page: { type: "string", default: "" },
    duration: { type: "string", default: "10" },
    setup: { type: "boolean", default: false },
  },
});
const width = Number(values.width),
  height = Number(values.height);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const out = resolve(root, "../artifacts/hellscape3d");
const work = join(out, `video-${values.name}`);
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

const revision = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const dirty = execFileSync("git", ["status", "--porcelain", "--", "."], { cwd: root, encoding: "utf8" }).trim() !== "";

await build({ root, logLevel: "warn" });
const server = await preview({ root, logLevel: "warn", preview: { port: 0, host: "127.0.0.1" } });
const url = server.resolvedUrls!.local[0]!;
const executablePath = [process.env.CHROMIUM_PATH, "/usr/bin/chromium", "/opt/pw-browsers/chromium"].find((p) => p && existsSync(p));
const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, recordVideo: { dir: work, size: { width, height } } });
const page = await context.newPage();
const started = Date.now();
if (Number(values.actions) === 0) {
  await page.goto(`${url}${values.page}?seed=${values.seed}&steps=${values.steps}${values.query ? `&${values.query}` : ""}`);
  await page.waitForFunction(() => (window as unknown as { __hellscape3d?: { ready: boolean } }).__hellscape3d?.ready === true);
  await page.waitForTimeout(Number(values.duration) * 1000);
} else {
  if (values.setup) {
    // Schermata di avvio compilata dall'interfaccia, a velocità leggibile.
    await page.goto(`${url}${values.page}?test=1${values.query ? `&${values.query}` : ""}`);
    await page.locator("#setup-topics input").first().waitFor();
    await page.waitForTimeout(1200);
    await page.locator("#setup-players").selectOption("3");
    await page.waitForTimeout(600);
    for (const [i, name] of ["Ada", "Bruno", "Cleo"].entries()) {
      await page.locator(".setup-name").nth(i).fill("");
      await page.locator(".setup-name").nth(i).pressSequentially(name, { delay: 90 });
    }
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Nessuno" }).click();
    await page.waitForTimeout(900);
    const boxes = page.locator("#setup-topics input");
    for (let i = 0; i < (await boxes.count()) && (await page.locator("#setup-start").isDisabled()); i++) {
      await boxes.nth(i).check();
      await page.waitForTimeout(600);
    }
    await page.locator("#setup-seconds").fill("");
    await page.locator("#setup-seconds").pressSequentially("20", { delay: 120 });
    await page.waitForTimeout(1200);
    await page.locator("#setup-start").click();
  } else await page.goto(`${url}${values.page}?seed=${values.seed}&steps=${values.steps}&test=1${values.query ? `&${values.query}` : ""}`);
  await page.waitForFunction(() => (window as unknown as { __hellscape3d?: { ready: boolean } }).__hellscape3d?.ready === true);
  await page.waitForTimeout(800);
  // Si gioca dall'interfaccia, con pause leggibili; una risposta su quattro è volutamente errata.
  type Debug = { busy: boolean; panel: string | null; correctIndex?: number; forkChoices: { number: number }[] };
  const debug = (): Promise<Debug> => page.evaluate(() => (window as unknown as { __hellscape3d: Debug }).__hellscape3d);
  const reloadAfter = values["reload-after"] === "" ? -1 : Number(values["reload-after"]);
  for (let i = 0; i < Number(values.actions); i++) {
    await page.waitForFunction(() => !(window as unknown as { __hellscape3d: { busy: boolean } }).__hellscape3d.busy, null, { timeout: 20_000 });
    if (i === reloadAfter) {
      await page.waitForTimeout(700);
      // Senza seme né mosse: la pagina riprende la partita salvata (test=1 serve solo a conoscere la risposta corretta).
      await page.goto(`${url}${values.page}?test=1`);
      await page.waitForFunction(() => (window as unknown as { __hellscape3d?: { ready: boolean } }).__hellscape3d?.ready === true);
      await page.waitForTimeout(1500);
    }
    const d = await debug();
    if (d.panel === "question") {
      await page.waitForTimeout(1300);
      const index = i % 4 === 3 ? ((d.correctIndex ?? 0) + 1) % 4 : (d.correctIndex ?? 0);
      await page.keyboard.press(`Digit${index + 1}`);
    } else if (d.panel === "feedback") {
      await page.waitForTimeout(2600);
      await page.keyboard.press("Enter");
    } else if (d.panel === "roll") {
      await page.waitForTimeout(600);
      await page.keyboard.press("Enter");
    } else if (d.panel === "fork") {
      await page.waitForTimeout(1300);
      await page.keyboard.press(`Digit${(i % d.forkChoices.length) + 1}`);
    } else break;
    await page.waitForTimeout(150);
  }
  await page.waitForFunction(() => !(window as unknown as { __hellscape3d: { busy: boolean } }).__hellscape3d.busy, null, { timeout: 20_000 });
  await page.waitForTimeout(600);
}
const seconds = (Date.now() - started) / 1000;
const video = page.video()!;
await context.close();
await browser.close();
await new Promise<void>((done) => server.httpServer.close(() => done()));

const webm = join(work, "registrazione.webm");
renameSync(await video.path(), webm);
const gif = join(out, `${values.name}-${values.setup ? "avvio" : values.seed}-${width}x${height}-${revision}${dirty ? "-modificata" : ""}.gif`);
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error", "-i", webm,
  "-vf", `fps=${values.fps},split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
  gif,
]);
console.log(JSON.stringify({ gif, webm, viewport: `${width}x${height}`, seconds: Math.round(seconds * 10) / 10, revision, workingTreeModified: dirty }));
