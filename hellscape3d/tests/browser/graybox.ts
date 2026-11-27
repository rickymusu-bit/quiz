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
import { RUN } from "../../src/run/runScene.ts";
import { STRIP } from "../../src/run/strip.ts";

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
  panel: "question" | "feedback" | "roll" | "fork" | "ended" | null;
  bankId: string;
  questionId: string | null;
  questionText: string | null;
  outcome: "correct" | "wrong" | "timeout" | null;
  askedCount: number;
  timer: { remaining: number; total: number } | null;
  correctIndex?: number;
  forkChoices: { number: number; to: string; anchored: boolean }[];
  radar: { players: { id: string; active: boolean; onEdge: boolean; x: number; y: number }[]; exit: boolean; center: { x: number; y: number } };
  activePlayerId: string;
  stateActivePlayerId: string;
  occluders: { tiles: number; pillars: number; walkways: number; masses: number };
  activeScreen: { x: number; y: number } | null;
  panelTop: number | null;
  bafometto: { kind: "seat" } | { kind: "terminal"; cellId: string } | null;
  spoken: string[];
  speech: string | null;
  resumed: boolean;
  timerRemaining: number | null;
  totalCells: number;
  loadedTiles: string[];
  playerCells: Record<string, string>;
  stepsLeft: number;
  loadedSectors: string[];
  stats: {
    primitives: number;
    totalPrimitives: number;
    tiles: number;
    walkways: number;
    stubs: number;
    masses: number;
    players: number;
    loadedSectors: number;
    occupiedSectors: number;
    builds: number;
    lastBuildMs: number;
  };
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

/** Pagina pronta e regia ferma; un'eventuale apertura di Bafometto viene saltata (ha una verifica dedicata). */
async function waitReady(page: Page, skipIntro = true): Promise<void> {
  await page.waitForFunction(() => (window as unknown as { __hellscape3d?: DebugInfo }).__hellscape3d?.ready === true, null, { timeout: 30_000 });
  if (skipIntro && (await info(page)).busy) {
    await page.keyboard.press("KeyS");
    await page.waitForFunction(() => (window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d.busy === false, null, { timeout: 5_000 });
  }
}

/** Radar: un punto per giocatore, quello di turno al centro; nessuna casella disegnata. */
function assertRadar(debug: DebugInfo): void {
  assert.equal(debug.radar.players.length, Object.keys(debug.pawns).length);
  const active = debug.radar.players.filter((p) => p.active);
  assert.equal(active.length, 1);
  assert.equal(active[0]!.id, debug.activePlayerId);
  assert.ok(Math.hypot(active[0]!.x - debug.radar.center.x, active[0]!.y - debug.radar.center.y) < 1e-6, "giocatore di turno fuori dal centro");
}

/** A regia ferma: celle mostrate = esplorate = disegnate, pedine sulle caselle dello stato. */
function assertSettled(debug: DebugInfo): void {
  assert.equal(debug.busy, false);
  assert.deepEqual(debug.shown, debug.explored);
  assert.deepEqual(debug.rendered, debug.explored);
  assertRadar(debug);
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
        if (testCase.name === "inizio") assert.equal(debug.radar.exit, false, "uscita sul radar già alla partenza");
        assert.equal(debug.stats.tiles, debug.loadedTiles.length);
        assert.ok(debug.loadedTiles.every((id) => debug.rendered.includes(id)), "casella caricata fuori dalla vista presentata");
        assert.ok(debug.stats.primitives > debug.stats.tiles * 8, `kit modulare non disegnato (${debug.stats.primitives} primitive)`);
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
        assertRadar(during);
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
      // Si attende la condizione, non un tempo fisso: i dati di debug si aggiornano a ogni fotogramma, e sul
      // runner della CI (WebGL software) un fotogramma dopo il caricamento può durare più di un secondo.
      const before = debug.timer!.remaining;
      await page
        .waitForFunction((start) => ((window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d.timer?.remaining ?? start) <= start - 0.8, before, { timeout: 10_000 })
        .catch(() => assert.fail("il timer non scorre con la domanda visibile"));
      debug = await info(page);
      assert.equal(debug.panel, "question");
      // Domanda vera dalla banca della versione precedente, con argomento.
      assert.ok(debug.questionId && !/fittizia/i.test(debug.questionText ?? ""), "domanda non presa dalla banca");
      assert.match((await page.locator(".hud-difficulty").textContent()) ?? "", / · \S/);
      const asked = debug.questionId;
      await page.keyboard.press(`Digit${debug.correctIndex! + 1}`);
      await page.waitForTimeout(100);
      debug = await info(page);
      assert.equal(debug.panel, "feedback", "dopo la risposta non compare l'esito");
      assert.equal(debug.outcome, "correct");
      assert.equal(debug.questionId, asked);
      assert.match((await page.locator(".hud-outcome").textContent()) ?? "", /Risposta corretta/);
      assert.ok(await page.locator(".hud-explanation").isVisible(), "spiegazione non visibile");
      // L'esito sopravvive al ricaricamento: niente seconda risposta alla stessa domanda.
      await page.goto(url);
      await waitReady(page, false);
      debug = await info(page);
      assert.equal(debug.panel, "feedback", "dopo il ricaricamento si può rispondere di nuovo");
      assert.equal(debug.questionId, asked);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(100);
      debug = await info(page);
      assert.equal(debug.panel, "roll", "dopo l'esito non compare il dado");
      await page.locator(".hud-panel .hud-primary").click();
      await page.waitForTimeout(150);
      debug = await info(page);
      assert.equal(debug.busy, true, "il dado non avvia la camminata");
      assert.equal(debug.panel, null);
      await waitIdle();
      debug = await info(page);
      assertSettled(debug);
      if (debug.panel === "question") assert.ok(debug.timer!.total - debug.timer!.remaining < 0.5, "il timer è scorso durante la regia");
      console.log(`ok   ${device.name} · domanda della banca, esito con spiegazione anche dopo il ricaricamento, dado e timer fermo durante la regia`);

      // Risposta errata con il mouse: il turno passa all'altro giocatore.
      await page.goto(`${url}?seed=graybox-1&steps=15&test=1`);
      await waitReady(page);
      debug = await info(page);
      const wrong = (debug.correctIndex! + 1) % 4;
      const player = debug.stateActivePlayerId;
      await page.locator(".hud-panel .hud-option").nth(wrong).click();
      await page.waitForTimeout(100);
      debug = await info(page);
      assert.equal(debug.outcome, "wrong");
      assert.equal(debug.stateActivePlayerId, player, "il turno passa prima di aver letto l'esito");
      assert.match((await page.locator(".hud-solution").textContent()) ?? "", /Risposta corretta: /);
      await page.locator(".hud-panel .hud-primary").click();
      await waitIdle();
      debug = await info(page);
      assert.notEqual(debug.stateActivePlayerId, player, "la risposta errata non passa il turno");
      assertSettled(debug);

      // Scadenza del timer.
      // Si attende la condizione, non un tempo fisso: il timer avanza al massimo di 1 s per fotogramma,
      // e un fotogramma lento (compilazione degli shader in WebGL software) rallenterebbe un'attesa fissa.
      // Timer di 3 s: abbastanza lungo da non scadere prima del controllo iniziale, anche con
      // i primi fotogrammi lenti dopo il caricamento (con 1 s era già scaduto alla lettura).
      await page.goto(`${url}?seed=graybox-1&steps=15&timer=3`);
      await waitReady(page);
      debug = await info(page);
      assert.equal(debug.panel, "question");
      assert.equal(debug.timer!.total, 3);
      assert.equal(debug.stateActivePlayerId, player);
      await page.waitForFunction(() => (window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d.outcome === "timeout", null, { timeout: 15_000 });
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        (before) => {
          const d = (window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d;
          return d.stateActivePlayerId !== before && !d.busy;
        },
        player,
        { timeout: 15_000 },
      );
      assertSettled(await info(page));
      console.log(`ok   ${device.name} · risposta errata e scadenza del timer`);

      // Bivio: si incontra solo avanzando, numeri sugli imbocchi, scelta da tastiera, poi i passi residui.
      await page.goto(`${url}?seed=graybox-1&steps=7`);
      await waitReady(page);
      debug = await info(page);
      assert.equal(debug.panel, "fork");
      assert.ok(debug.stepsLeft > 0, "scelta al bivio fuori da un avanzamento");
      const mover = debug.stateActivePlayerId;
      const beforeFork = debug.playerCells[mover]!;
      assert.ok(debug.forkChoices.length >= 2 && debug.forkChoices.every((c) => c.anchored), "alternative non segnalate nella scena");
      assert.equal(await page.locator(".hud-badge").count(), debug.forkChoices.length);
      const chosen = debug.forkChoices[1]!.to;
      await page.keyboard.press("Digit2");
      await page.waitForTimeout(100);
      await waitIdle();
      debug = await info(page);
      assertSettled(debug);
      assert.ok(debug.explored.includes(chosen));
      assert.notEqual(debug.playerCells[mover], beforeFork, "dopo la scelta il giocatore resta prima del bivio");
      await page.locator(".hud-radar").screenshot({ path: join(artifacts, `radar-${device.name}.png`) });
      console.log(`ok   ${device.name} · scelta al bivio durante l'avanzamento, passi residui sul ramo scelto`);
    } catch (error) {
      failures++;
      console.log(`FAIL ${device.name} · interfaccia: ${(error as Error).message}`);
    }
    // Ostacoli: la passerella sopraelevata davanti alla pedina diventa trasparente; il pannello non la copre.
    try {
      for (const occlusion of ["on", "off"] as const) {
        await page.goto(`${url}?seed=graybox-38&steps=9${occlusion === "off" ? "&occlusion=off" : ""}`);
        await waitReady(page);
        await page.waitForFunction(() => {
          const d = (window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d;
          return d.panelTop !== null && d.activeScreen !== null && Math.abs(window.innerHeight - d.panelTop - (d as unknown as { inset: number }).inset) < 1;
        }, null, { timeout: 10_000 });
        const debug = await info(page);
        if (occlusion === "on") assert.equal(debug.occluders.walkways, 1, "passerella occludente non rilevata");
        else assert.equal(debug.occluders.walkways + debug.occluders.tiles + debug.occluders.masses, 0);
        assert.ok(debug.activeScreen!.y < debug.panelTop!, `pedina sotto il pannello (${debug.activeScreen!.y} ≥ ${debug.panelTop})`);
        await page.screenshot({ path: join(artifacts, `ostacolo-${occlusion}-${device.name}.png`) });
      }
      console.log(`ok   ${device.name} · ostacolo trasparente e pedina sopra il pannello`);
    } catch (error) {
      failures++;
      console.log(`FAIL ${device.name} · ostacoli: ${(error as Error).message}`);
    }
    // Settori: con il raggio calcolato l'immagine coincide con la città intera; con un raggio forzato
    // molto più corto si scarica davvero, ma stato, radar e caselle delle pedine restano intatti.
    try {
      const canvasPixels = async (query: string): Promise<{ png: Buffer; debug: DebugInfo }> => {
        await page.goto(`${url}?${query}`);
        await waitReady(page);
        // Inquadratura ferma: il margine riservato al pannello ha raggiunto il valore finale.
        await page.waitForFunction(() => {
          const d = (window as unknown as { __hellscape3d: DebugInfo & { inset: number } }).__hellscape3d;
          return d.panelTop === null ? d.inset === 0 : Math.abs(window.innerHeight - d.panelTop - d.inset) < 0.5;
        }, null, { timeout: 10_000 });
        await page.waitForTimeout(300);
        // Pixel del solo canvas WebGL: lo screenshot dell'elemento includerebbe l'interfaccia sovrapposta (timer).
        const data = await page.evaluate(() => document.querySelector<HTMLCanvasElement>("#scene")!.toDataURL("image/png"));
        return { png: Buffer.from(data.split(",")[1]!, "base64"), debug: await info(page) };
      };
      let detected = 0;
      for (const query of ["seed=graybox-9&steps=20", "seed=graybox-1&steps=30", "seed=graybox-1&steps=36"]) {
        const sectored = await canvasPixels(query);
        const whole = await canvasPixels(`${query}&sectors=off`);
        assert.ok(sectored.png.equals(whole.png), `${query}: immagine diversa dalla città intera`);
        assert.equal(sectored.debug.stats.primitives, whole.debug.stats.primitives);
        // Controllo di sensibilità: con un raggio troppo corto almeno un'inquadratura perde pezzi visibili.
        // (Gli elementi scaricati fuori dall'inquadratura non cambiano l'immagine.)
        const short = await canvasPixels(`${query}&sectors=4`);
        assert.ok(short.debug.stats.primitives < whole.debug.stats.primitives, `${query}: il raggio forzato non scarica (${short.debug.stats.primitives})`);
        if (!short.png.equals(whole.png)) detected++;
      }
      assert.ok(detected > 0, "il confronto delle immagini non rileva i settori mancanti");

      const play = async (query: string) => {
        await page.goto(`${url}?seed=graybox-9&intro=off${query}`);
        await waitReady(page);
        let unloaded = 0,
          samples = 0,
          slowestBuild = 0;
        for (let action = 0; action < 24; action++) {
          await page.keyboard.press("KeyA");
          for (let k = 0; k < 6; k++) {
            await page.waitForTimeout(90);
            const d = await info(page);
            samples++;
            if (d.stats.primitives < d.stats.totalPrimitives) unloaded++;
            slowestBuild = Math.max(slowestBuild, d.stats.lastBuildMs);
            assert.deepEqual(d.rendered, d.shown, "vista presentata alterata dai settori");
            assertRadar(d);
            // Le caselle su cui si trovano le pedine nello stato restano disegnate, anche durante la regia.
            // (una casella non ancora mostrata dalla regia non fa parte della vista presentata).
            for (const cell of Object.values(d.playerCells)) {
              if (d.shown.includes(cell)) assert.ok(d.loadedTiles.includes(cell), `casella ${cell} di una pedina scaricata`);
            }
            if (!d.busy) break;
          }
          await page.waitForFunction(() => (window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d.busy === false, null, { timeout: 15_000 });
        }
        const end = await info(page);
        assertSettled(end);
        return { end, unloaded, samples, slowestBuild };
      };
      const forced = await play("&steps=20&sectors=4");
      const whole = await play("&steps=20&sectors=off");
      assert.ok(forced.unloaded > 0, "il raggio forzato non scarica nulla");
      assert.equal(whole.unloaded, 0);
      assert.equal(forced.end.turn, whole.end.turn);
      assert.deepEqual(forced.end.explored, whole.end.explored, "esplorazione diversa con i settori");
      assert.deepEqual(forced.end.cellPositions, whole.end.cellPositions, "posizioni dei giocatori diverse con i settori");
      assert.deepEqual(forced.end.radar, whole.end.radar);
      await page.screenshot({ path: join(artifacts, `settori-forzati-${device.name}.png`) });
      console.log(
        `ok   ${device.name} · settori: immagine identica alla città intera (raggio corto rilevato in ${detected}/3); raggio forzato ${forced.unloaded}/${forced.samples} campioni con scaricamento, ` +
          `ricostruzioni ${forced.end.stats.builds} (la più lenta ${forced.slowestBuild.toFixed(1)} ms), stato e radar invariati`,
      );
    } catch (error) {
      failures++;
      console.log(`FAIL ${device.name} · settori: ${(error as Error).message}`);
    }
    // Bafometto: apertura dalla sede, terminale locale, intervento finale, movimento ridotto.
    try {
      const seatState = (): Promise<unknown> =>
        page.waitForFunction(() => (window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d.bafometto?.kind === "seat", null, { timeout: 8_000 });
      await page.goto(`${url}?seed=graybox-1`);
      await waitReady(page, false);
      await seatState();
      let debug = await info(page);
      assert.deepEqual(debug.spoken, ["intro"]);
      assert.ok(await page.locator(".hud-speech").isVisible(), "battuta non visibile");
      assert.deepEqual(debug.rendered, debug.shown, "la sede mostra celle non esplorate");
      assert.equal(debug.panel, null, "pannelli visibili durante l'intervento");
      assert.equal(await page.locator(".hud-panel").isVisible(), false, "contenitore del pannello visibile");
      await page.screenshot({ path: join(artifacts, `bafometto-sede-${device.name}.png`) });
      await page.keyboard.press("KeyS");
      debug = await info(page);
      assertSettled(debug);
      assert.equal(debug.panel, "question");

      await page.goto(`${url}?seed=graybox-3&steps=7`);
      await waitReady(page);
      await page.keyboard.press("KeyA");
      await page.waitForFunction(() => (window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d.bafometto?.kind === "terminal", null, { timeout: 10_000 });
      debug = await info(page);
      assert.ok(debug.spoken.includes("terminal") && !debug.spoken.includes("intro"));
      assert.ok(await page.locator(".hud-speech").isVisible());
      await page.screenshot({ path: join(artifacts, `bafometto-terminale-${device.name}.png`) });
      await page.waitForFunction(() => (window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d.busy === false, null, { timeout: 10_000 });
      assertSettled(await info(page));

      await page.goto(`${url}?seed=graybox-1&steps=40`);
      await waitReady(page);
      await page.keyboard.press("KeyA");
      await seatState();
      await page.waitForFunction(() => (window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d.busy === false, null, { timeout: 10_000 });
      debug = await info(page);
      assert.equal(debug.phase, "ended");
      assert.equal(debug.panel, "ended");
      assert.equal(debug.radar.exit, true, "all'uscita il radar non la mostra");
      assert.ok(debug.spoken.includes("end"));

      await page.goto(`${url}?seed=graybox-1&motion=reduced`);
      await waitReady(page, false);
      debug = await info(page);
      assert.equal(debug.busy, false);
      assert.deepEqual(debug.spoken, ["intro"]);
      assert.ok(await page.locator(".hud-speech").isVisible(), "battuta assente con il movimento ridotto");
      console.log(`ok   ${device.name} · Bafometto: sede, terminale, fine partita, movimento ridotto`);
    } catch (error) {
      failures++;
      console.log(`FAIL ${device.name} · Bafometto: ${(error as Error).message}`);
    }
    // Ripresa della partita salvata: stesso stato, nessuna apertura ripetuta, timer non restituito.
    try {
      await page.goto(`${url}?seed=graybox-1&intro=off`);
      await waitReady(page);
      await page.evaluate(() => localStorage.setItem("fool-v1", "runner-intatto"));
      for (let i = 0; i < 9; i++) {
        await page.keyboard.press("KeyA");
        await page.waitForFunction(() => (window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d.busy === false, null, { timeout: 15_000 });
      }
      const before = await info(page);
      assert.ok(await page.evaluate(() => localStorage.getItem("hellscape3d-save") !== null), "salvataggio assente");
      await page.goto(url);
      await waitReady(page, false);
      const after = await info(page);
      assert.equal(after.resumed, true, "partita non ripresa");
      assert.equal(after.busy, false, "apertura ripetuta alla ripresa");
      assert.deepEqual(after.spoken, []);
      assert.equal(after.turn, before.turn);
      assert.equal(after.phase, before.phase);
      assert.equal(after.stateActivePlayerId, before.stateActivePlayerId);
      assert.deepEqual(after.explored, before.explored);
      assert.deepEqual(after.cellPositions, before.cellPositions);
      assertSettled(after);
      assert.match((await page.locator(".hud-toast").textContent()) ?? "", /Partita ripresa/);

      // Tempo residuo della domanda conservato attraverso il ricaricamento.
      await page.goto(`${url}?seed=graybox-1&steps=15`);
      await waitReady(page);
      // Si attende che siano trascorsi 3 s, qualunque sia la durata della domanda.
      await page.waitForFunction(() => {
        const d = (window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d;
        return d.timer !== null && d.timer.total - d.timer.remaining >= 3;
      }, null, { timeout: 15_000 });
      const left = (await info(page)).timerRemaining!;
      await page.goto(url);
      await waitReady(page, false);
      const resumedLeft = (await info(page)).timerRemaining!;
      assert.equal((await info(page)).panel, "question");
      assert.ok(resumedLeft <= left + 0.6 && resumedLeft < (await info(page)).timer!.total - 1, `tempo restituito dal ricaricamento (${left.toFixed(2)} → ${resumedLeft.toFixed(2)})`);

      // Salvataggio incompatibile: conservato a parte, partita nuova con avviso.
      await page.evaluate(() => localStorage.setItem("hellscape3d-save", '{"format":"hellscape3d-save","saveVersion":99}'));
      await page.goto(url);
      await waitReady(page);
      assert.equal((await info(page)).resumed, false);
      assert.equal(await page.evaluate(() => localStorage.getItem("hellscape3d-save-scartato")), '{"format":"hellscape3d-save","saveVersion":99}');
      assert.match((await page.locator(".hud-toast").textContent()) ?? "", /non utilizzabile/);
      assert.equal(await page.evaluate(() => localStorage.getItem("fool-v1")), "runner-intatto", "salvataggio del runner modificato");
      console.log(`ok   ${device.name} · ripresa della partita, timer conservato, salvataggio incompatibile`);
    } catch (error) {
      failures++;
      console.log(`FAIL ${device.name} · ripresa: ${(error as Error).message}`);
    }
    // Scena di corsa (pagina corsa.html): quattro inquadrature, scenario ciclico senza giunture, movimento ridotto.
    try {
      const canvasPng = async (): Promise<Buffer> =>
        Buffer.from((await page.evaluate(() => document.querySelector<HTMLCanvasElement>("#scene")!.toDataURL("image/png"))).split(",")[1]!, "base64");
      const at = async (query: string): Promise<Buffer> => {
        await page.goto(`${url}corsa.html?${query}`);
        await page.waitForFunction(() => (window as unknown as { __corsa?: { ready: boolean } }).__corsa?.ready === true, null, { timeout: 30_000 });
        await page.waitForTimeout(200);
        return canvasPng();
      };
      const period = STRIP.period,
        speed = RUN.speed;
      for (const camera of ["laterale", "angolata", "trequarti", "spalle"]) {
        const first = await at(`camera=${camera}&t=1.3&players=2`);
        const spread = await luminanceSpread(first);
        assert.ok(spread > 8, `${camera}: scena apparentemente vuota (${spread.toFixed(1)})`);
        assert.ok(await page.locator(".hud-panel .hud-option").first().isVisible(), `${camera}: domanda non visibile`);
        // Un periodo dopo l'immagine è identica pixel per pixel: il ciclo non ha giunture.
        const later = await at(`camera=${camera}&t=${1.3 + period / speed}&players=2`);
        assert.ok(first.equals(later), `${camera}: l'immagine non si ripete dopo un periodo`);
        // A metà periodo invece la scena è cambiata: lo scenario scorre davvero.
        assert.ok(!first.equals(await at(`camera=${camera}&t=${1.3 + period / speed / 2}&players=2`)), `${camera}: lo scenario non scorre`);
        await page.goto(`${url}corsa.html?camera=${camera}&t=1.3&players=2`);
        await page.waitForFunction(() => (window as unknown as { __corsa?: { ready: boolean } }).__corsa?.ready === true);
        await page.screenshot({ path: join(artifacts, `corsa-${camera}-${device.name}.png`) });
      }
      // Movimento ridotto: lo scenario resta fermo.
      await page.goto(`${url}corsa.html?motion=reduced`);
      await page.waitForFunction(() => (window as unknown as { __corsa?: { ready: boolean } }).__corsa?.ready === true);
      const still = await canvasPng();
      await page.waitForTimeout(700);
      assert.ok(still.equals(await canvasPng()), "con il movimento ridotto lo scenario si muove");
      console.log(`ok   ${device.name} · scena di corsa: quattro inquadrature, ciclo senza giunture, movimento ridotto`);
    } catch (error) {
      failures++;
      console.log(`FAIL ${device.name} · scena di corsa: ${(error as Error).message}`);
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
