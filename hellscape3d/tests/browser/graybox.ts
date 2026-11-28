/**
 * Verifica nel browser delle pagine del prototipo: build Vite reale, Chromium,
 * viewport desktop e mobile orizzontale. Controlla che la scena disegni solo le
 * celle esplorate, che il canvas non sia vuoto e che non ci siano errori.
 * Il gioco (index.html, scena di corsa) porta le verifiche del flusso di
 * partita; la vista della città (citta.html, solo sviluppo) quelle sue proprie:
 * celle mostrate, kit disegnato, panoramica e città rivelata.
 * Le verifiche il cui esito dipende dalle dimensioni dello schermo
 * (impaginazione, inquadrature, proporzioni) girano in entrambe le viewport;
 * quelle di sola logica (timer, salvataggi, battute) solo nella prima.
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
import { buildCityLayout } from "../../src/layout/layout.ts";
import { roomOf } from "../../src/run/rooms.ts";
import { RUN_SPEED } from "../../src/run/runDirector.ts";
import { STRIP } from "../../src/run/strip.ts";
import { newGame } from "../helpers.ts";

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
  seed: string;
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
  questionTopic: string | null;
  topics: string[];
  playerNames: string[];
  summaryOpen: boolean;
  timer: { remaining: number; total: number } | null;
  correctIndex?: number;
  forkChoices: { number: number; to: string; anchored: boolean }[];
  radar: { players: { id: string; active: boolean; onEdge: boolean; x: number; y: number }[]; exit: boolean; center: { x: number; y: number } };
  activePlayerId: string;
  stateActivePlayerId: string;
  activeScreen: { x: number; y: number } | null;
  panelTop: number | null;
  spoken: string[];
  speech: string | null;
  resumed: boolean;
  timerRemaining: number | null;
  questionVisibleFor: number;
  totalCells: number;
  playerCells: Record<string, string>;
  stepsLeft: number;
  fade: number;
  /** Solo vista della città. */
  mode: "player" | "overview";
  stats: { primitives: number; tiles: number; walkways: number; stubs: number; masses: number; players: number };
}

/**
 * Stanze di esempio per la scena di corsa, scelte in Node (la generazione non
 * dipende dal browser): ogni tipo di stanza ciclica almeno una volta, con le
 * pendenze salita, piano e discesa coperte fra tutte, più partenza e uscita.
 * Restituisce `tipo/pendenza` → parametri dell'anteprima.
 */
function sampleRooms(): Map<string, string> {
  const periodic = ["corridoio", "sala", "ponte", "pozzo"];
  const found = new Map<string, string>();
  const slopes = new Set<string>();
  const candidates: { kind: string; slope: string; query: string }[] = [];
  for (let n = 1; n <= 20; n++) {
    const { game } = newGame(`graybox-${n}`);
    const layout = buildCityLayout(game.map);
    for (const id of Object.keys(game.map.cells).sort()) {
      const room = roomOf(game.map, layout, id);
      candidates.push({ kind: room.kind, slope: room.slope, query: `seed=graybox-${n}&anteprima=${id}` });
    }
  }
  for (const kind of ["partenza", "uscita"]) {
    const c = candidates.find((x) => x.kind === kind)!;
    found.set(`${c.kind}/${c.slope}`, c.query);
  }
  for (const kind of periodic) {
    const own = candidates.filter((x) => x.kind === kind);
    const c = own.find((x) => !slopes.has(x.slope)) ?? own[0];
    if (!c) throw new Error(`nessuna stanza ${kind} nei semi di prova`);
    slopes.add(c.slope);
    found.set(`${c.kind}/${c.slope}`, c.query);
  }
  // Pendenze non ancora coperte: un'altra stanza ciclica con quella pendenza.
  for (const slope of ["salita", "piano", "discesa"]) {
    if (slopes.has(slope)) continue;
    const c = candidates.find((x) => periodic.includes(x.kind) && x.slope === slope);
    if (!c) throw new Error(`nessuna stanza in ${slope} nei semi di prova`);
    slopes.add(slope);
    found.set(`${c.kind}/${c.slope}`, c.query);
  }
  return found;
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

/** Etichette delle porte al bivio: nessuna sovrapposizione con dado, turno, radar, avvisi e pannello. */
async function assertBadgesClear(page: Page): Promise<void> {
  const overlaps = await page.evaluate(() => {
    const rects = (selector: string): DOMRect[] =>
      [...document.querySelectorAll<HTMLElement>(selector)].filter((e) => !e.hidden && e.getClientRects().length > 0).map((e) => e.getBoundingClientRect());
    const hud = [".hud-turn", ".hud-die", ".hud-radar", ".hud-toast", ".hud-speech", ".hud-panel"].flatMap((s) => rects(s).map((r) => ({ s, r })));
    const found: string[] = [];
    rects(".hud-badge").forEach((b, i) => {
      for (const { s, r } of hud) if (b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top) found.push(`etichetta ${i + 1} su ${s}`);
    });
    return found;
  });
  assert.deepEqual(overlaps, [], "etichette delle porte sovrapposte all'interfaccia");
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
/**
 * Regia ferma: presentazione allineata allo stato. Nella scena di corsa la
 * stanza è quella del giocatore di turno (o del bivio da scegliere) e lui corre
 * in testa; nella città le celle mostrate e disegnate sono quelle esplorate.
 */
function assertSettled(debug: DebugInfo): void {
  assert.equal(debug.busy, false);
  const run = debug as DebugInfo & { view?: string; room?: { key: string }; runners?: string[] };
  if (run.view === "corsa") {
    const active = debug.playerCells[debug.stateActivePlayerId]!;
    assert.equal(run.room!.key, debug.phase === "fork" ? `bivio:${active}` : active, "scena fuori dalla stanza del giocatore di turno");
    if (debug.phase !== "fork") assert.equal(run.runners![0], debug.stateActivePlayerId);
    assert.equal(debug.fade, 0);
  } else {
    assert.deepEqual(debug.shown, debug.explored);
    assert.deepEqual(debug.rendered, debug.explored);
  }
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
/** Vista della città, solo sviluppo. Il gioco è la pagina principale (`url`). */
const city = `${url}citta.html`;
const executablePath = [process.env.CHROMIUM_PATH, "/usr/bin/chromium", "/opt/pw-browsers/chromium"].find((p) => p && existsSync(p));
const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
let failures = 0;
const kinds = sampleRooms();
try {
  for (const device of VIEWPORTS) {
    /** Verifiche di sola logica: una volta, nella prima viewport. */
    const logic = device === VIEWPORTS[0];
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
        await page.goto(`${city}?${testCase.query}`);
        await waitReady(page);
        const debug = await info(page);
        if (debug.revealAll) assert.equal(debug.rendered.length, debug.totalCells, "città rivelata incompleta");
        else assertSettled(debug);
        if (testCase.name === "inizio") assert.equal(debug.radar.exit, false, "uscita sul radar già alla partenza");
        assert.equal(debug.stats.tiles, debug.rendered.length);
        assert.ok(debug.stats.primitives > debug.stats.tiles * 8, `kit modulare non disegnato (${debug.stats.primitives} primitive)`);
        assert.equal(debug.stats.players, 2);
        // Con un pannello aperto, la pedina di turno resta nell'area libera sopra il pannello.
        if (debug.mode === "player" && debug.panelTop !== null) {
          await page.waitForFunction(() => {
            const d = (window as unknown as { __hellscape3d: DebugInfo & { inset: number } }).__hellscape3d;
            return d.panelTop !== null && d.activeScreen !== null && Math.abs(window.innerHeight - d.panelTop - d.inset) < 1;
          }, null, { timeout: 10_000 });
          const settled = await info(page);
          assert.ok(settled.activeScreen!.y < settled.panelTop!, `pedina sotto il pannello (${settled.activeScreen!.y} ≥ ${settled.panelTop})`);
        }
        const png = await page.screenshot({ path: join(artifacts, `${testCase.name}-${device.name}.png`) });
        const spread = await luminanceSpread(png);
        assert.ok(spread > 8, `canvas apparentemente vuoto (deviazione ${spread.toFixed(1)})`);
        console.log(`ok   ${label} · celle ${debug.rendered.length}/${debug.totalCells} · turno ${debug.turn} · contrasto ${spread.toFixed(1)}`);
      } catch (error) {
        failures++;
        console.log(`FAIL ${label}: ${(error as Error).message}`);
      }
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
      // Il tempo consumato non supera quello in cui la domanda è stata visibile: durante la regia il timer è fermo.
      if (debug.panel === "question") {
        const used = debug.timer!.total - debug.timer!.remaining;
        assert.ok(used <= debug.questionVisibleFor + 1e-6, `il timer è scorso durante la regia (${used.toFixed(2)} s su ${debug.questionVisibleFor.toFixed(2)} s visibili)`);
      }
      console.log(`ok   ${device.name} · domanda della banca, esito con spiegazione anche dopo il ricaricamento, dado e timer fermo durante la regia`);

      // Risposta errata con il mouse e scadenza del timer (sola logica).
      if (logic) {
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
      }

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
      await assertBadgesClear(page);
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
    // Bafometto nel gioco: battuta d'apertura, terminale, intervento finale, movimento ridotto.
    try {
      const spokenNow = (moment: string): Promise<unknown> =>
        page.waitForFunction((m) => (window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d.spoken.includes(m), moment, { timeout: 10_000 });
      await page.goto(`${url}?seed=graybox-1`);
      await waitReady(page, false);
      await spokenNow("intro");
      let debug = await info(page);
      assert.deepEqual(debug.spoken, ["intro"]);
      assert.ok(await page.locator(".hud-speech").isVisible(), "battuta non visibile");
      assert.equal(debug.busy, true, "l'apertura non è una regia");
      assert.equal(debug.panel, null, "pannelli visibili durante l'intervento");
      assert.equal(await page.locator(".hud-panel").isVisible(), false, "contenitore del pannello visibile");
      await page.screenshot({ path: join(artifacts, `bafometto-apertura-${device.name}.png`) });
      await page.keyboard.press("KeyS");
      debug = await info(page);
      assertSettled(debug);
      assert.equal(debug.panel, "question");

      // Terminale, fine partita e movimento ridotto: sola logica.
      if (logic) {
      await page.goto(`${url}?seed=graybox-3&steps=7`);
      await waitReady(page);
      await page.keyboard.press("KeyA");
      await spokenNow("terminal");
      debug = await info(page);
      assert.ok(debug.spoken.includes("terminal") && !debug.spoken.includes("intro"));
      assert.ok(await page.locator(".hud-speech").isVisible());
      await page.screenshot({ path: join(artifacts, `bafometto-terminale-${device.name}.png`) });
      await page.waitForFunction(() => (window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d.busy === false, null, { timeout: 10_000 });
      assertSettled(await info(page));

      await page.goto(`${url}?seed=graybox-1&steps=40`);
      await waitReady(page);
      await page.keyboard.press("KeyA");
      await spokenNow("end");
      await page.waitForFunction(() => (window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d.busy === false, null, { timeout: 10_000 });
      debug = await info(page);
      assert.equal(debug.phase, "ended");
      assert.equal(debug.panel, "ended");
      assert.equal(debug.radar.exit, true, "all'uscita il radar non la mostra");
      assert.ok(debug.spoken.includes("end"));
      // «Nuova città» riapre la schermata di avvio, con la partita salvata da riprendere.
      await page.getByRole("button", { name: "Nuova città" }).click();
      await page.locator("#setup").waitFor({ timeout: 15_000 });
      assert.ok(new URL(page.url()).searchParams.get("new") === "1", "«Nuova città» non apre la schermata di avvio");

      await page.goto(`${url}?seed=graybox-1&motion=reduced`);
      await waitReady(page, false);
      debug = await info(page);
      assert.equal(debug.busy, false);
      assert.deepEqual(debug.spoken, ["intro"]);
      assert.ok(await page.locator(".hud-speech").isVisible(), "battuta assente con il movimento ridotto");
      }
      console.log(`ok   ${device.name} · Bafometto: apertura${logic ? ", terminale, fine partita, movimento ridotto" : ""}`);
    } catch (error) {
      failures++;
      console.log(`FAIL ${device.name} · Bafometto: ${(error as Error).message}`);
    }
    // Ripresa della partita salvata: stesso stato, nessuna apertura ripetuta, timer non restituito (sola logica).
    if (logic) try {
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

      // Salvataggio incompatibile: conservato a parte, schermata di avvio con avviso.
      await page.evaluate(() => localStorage.setItem("hellscape3d-save", '{"format":"hellscape3d-save","saveVersion":99}'));
      await page.goto(url);
      await page.locator("#setup").waitFor({ timeout: 15_000 });
      assert.match((await page.locator(".setup-notice").textContent()) ?? "", /non utilizzabile/);
      assert.equal(await page.locator("#setup-resume").count(), 0, "ripresa proposta senza salvataggio utilizzabile");
      assert.equal(await page.evaluate(() => localStorage.getItem("hellscape3d-save-scartato")), '{"format":"hellscape3d-save","saveVersion":99}');
      await page.locator("#setup-start:not([disabled])").click();
      await waitReady(page);
      assert.equal((await info(page)).resumed, false);
      assert.equal(await page.evaluate(() => localStorage.getItem("fool-v1")), "runner-intatto", "salvataggio del runner modificato");
      console.log(`ok   ${device.name} · ripresa della partita, timer conservato, salvataggio incompatibile`);
    } catch (error) {
      failures++;
      console.log(`FAIL ${device.name} · ripresa: ${(error as Error).message}`);
    }
    // Schermata di avvio: banca, argomenti, giocatori, durata; impostazioni salvate con la partita e ricordate.
    try {
      await page.evaluate(() => localStorage.clear());
      await page.goto(url);
      await page.locator("#setup").waitFor({ timeout: 15_000 });
      await page.locator("#setup-topics input").first().waitFor();
      assert.equal(await page.locator("#setup-resume").count(), 0);
      assert.equal(await page.evaluate(() => "__hellscape3d" in window), false, "partita avviata prima della schermata");
      await page.screenshot({ path: join(artifacts, `avvio-${device.name}.png`) });
      const banks = await page.locator("#setup-bank option").evaluateAll((o) => o.map((x) => (x as HTMLOptionElement).value));
      await page.locator("#setup-bank").selectOption(banks.at(-1)!);
      await page.locator("#setup-topics input").first().waitFor();
      await page.locator("#setup-players").selectOption("3");
      const names = page.locator(".setup-name");
      assert.equal(await names.count(), 3);
      await names.nth(0).fill("Ada");
      await names.nth(1).fill("");
      await names.nth(2).fill("Cleo");
      await page.locator("#setup-seconds").fill("20");
      // Nessun argomento: non si comincia.
      await page.getByRole("button", { name: "Nessuno" }).click();
      assert.equal(await page.locator("#setup-start").isDisabled(), true, "si comincia senza argomenti");
      assert.match((await page.locator("#setup-issues").textContent()) ?? "", /almeno un argomento/);
      // Argomenti scelti finché coprono tutti i livelli.
      const boxes = page.locator("#setup-topics input");
      const chosen: string[] = [];
      for (let i = 0; i < (await boxes.count()) && (await page.locator("#setup-start").isDisabled()); i++) {
        await boxes.nth(i).check();
        chosen.push(await boxes.nth(i).inputValue());
      }
      assert.equal(await page.locator("#setup-start").isDisabled(), false, "argomenti che coprono i livelli rifiutati");
      await page.locator("#setup-seconds").fill("5");
      assert.equal(await page.locator("#setup-start").isDisabled(), true, "durata fuori intervallo accettata");
      await page.locator("#setup-seconds").fill("20");
      const topicCount = await boxes.count();
      await page.screenshot({ path: join(artifacts, `avvio-compilata-${device.name}.png`) });
      await page.locator("#setup-start").click();
      await waitReady(page);
      let debug = await info(page);
      assert.equal(await page.locator("#setup").count(), 0);
      assert.deepEqual(debug.playerNames, ["Ada", "Dannato 2", "Cleo"]);
      assert.equal(debug.bankId, banks.at(-1));
      // Tutti gli argomenti scelti equivalgono all'intera banca (elenco vuoto).
      const allTopics = chosen.length === topicCount ? [] : chosen;
      assert.deepEqual(debug.topics, allTopics);
      assert.equal(debug.panel, "question");
      assert.equal(debug.timer!.total, 20);
      assert.ok(chosen.includes(debug.questionTopic!), `domanda fuori dagli argomenti scelti (${debug.questionTopic})`);
      const seedA = debug.seed;
      // Ripresa: stessa durata e stessi argomenti.
      await page.goto(url);
      await waitReady(page, false);
      debug = await info(page);
      assert.equal(debug.resumed, true);
      assert.equal(debug.timer!.total, 20);
      assert.deepEqual(debug.topics, allTopics);
      // Nuova partita: schermata precompilata, ripresa proposta; seme diverso.
      await page.goto(`${url}?new=1`);
      await page.locator("#setup-topics input").first().waitFor();
      assert.equal(await page.locator("#setup-bank").inputValue(), banks.at(-1));
      assert.equal(await page.locator("#setup-players").inputValue(), "3");
      assert.deepEqual(await page.locator(".setup-name").evaluateAll((i) => i.map((x) => (x as HTMLInputElement).value)), ["Ada", "Dannato 2", "Cleo"]);
      assert.equal(await page.locator("#setup-seconds").inputValue(), "20");
      assert.deepEqual(await page.locator("#setup-topics input:checked").evaluateAll((i) => i.map((x) => (x as HTMLInputElement).value)), chosen);
      assert.equal(await page.locator("#setup-resume").count(), 1);
      await page.locator("#setup-players").selectOption("1");
      await page.getByRole("button", { name: "Tutti" }).click();
      await page.locator("#setup-start").click();
      await waitReady(page);
      debug = await info(page);
      assert.deepEqual(debug.playerNames, ["Ada"]);
      assert.deepEqual(debug.topics, []);
      assert.notEqual(debug.seed, seedA, "stessa città nella partita nuova");
      console.log(`ok   ${device.name} · schermata di avvio: scelte, validazione, ripresa, impostazioni ricordate`);
    } catch (error) {
      failures++;
      console.log(`FAIL ${device.name} · schermata di avvio: ${(error as Error).message}`);
    }
    // Riepilogo a fine partita: conteggi coerenti con le domande giocate, schermata che scorre, chiusura con Esc.
    try {
      await page.goto(`${url}?seed=graybox-1&steps=30&intro=off&test=1`);
      await waitReady(page);
      for (let i = 0; i < 40 && (await info(page)).phase !== "ended"; i++) {
        await page.keyboard.press("KeyA");
        await page.waitForFunction(() => (window as unknown as { __hellscape3d: DebugInfo }).__hellscape3d.busy === false, null, { timeout: 20_000 });
      }
      let debug = await info(page);
      assert.equal(debug.phase, "ended");
      assert.ok(debug.askedCount > 0, "nessuna domanda giocata prima della fine");
      await page.getByRole("button", { name: "Riepilogo della partita" }).click();
      const dialog = page.getByRole("dialog", { name: "Riepilogo della partita" });
      await dialog.waitFor();
      assert.equal(await dialog.locator(".summary-item").count(), debug.askedCount, "domande del riepilogo diverse da quelle giocate");
      const rows = await dialog.locator("table").first().locator("tbody tr").count();
      assert.equal(rows, debug.playerNames.length);
      const totals = await dialog.locator("table").first().locator("tbody tr td:last-child").allTextContents();
      assert.equal(totals.reduce((t, v) => t + Number(v), 0), debug.askedCount);
      // Formule della banca rese con KaTeX (la partita di prova ne contiene), con il MathML per gli screen reader.
      const formulas = await dialog.locator(".katex").count();
      assert.ok(formulas > 0, "nessuna formula resa nel riepilogo");
      assert.equal(await dialog.locator(".katex-mathml").count(), formulas);
      assert.equal(await page.locator(".katex-error").count(), 0);
      assert.ok(!/Qrecipiente/.test((await dialog.locator(".summary-items").evaluate((e) => {
        const copy = e.cloneNode(true) as HTMLElement;
        copy.querySelectorAll(".katex").forEach((k) => k.remove());
        return copy.textContent ?? "";
      }))), "formula rimasta come testo semplice");
      const box = (await dialog.boundingBox())!;
      const viewport = page.viewportSize()!;
      assert.ok(box.y >= 0 && box.y + box.height <= viewport.height + 1, "riepilogo fuori dallo schermo");
      await page.screenshot({ path: join(artifacts, `riepilogo-${device.name}.png`) });
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector("#summary"));
      debug = await info(page);
      assert.equal(debug.summaryOpen, false);
      assert.equal(await page.evaluate(() => document.activeElement?.textContent), "Riepilogo della partita", "fuoco non restituito");
      console.log(`ok   ${device.name} · riepilogo a fine partita: ${debug.askedCount} domande, ${rows} giocatori, ${formulas} formule`);
    } catch (error) {
      failures++;
      console.log(`FAIL ${device.name} · riepilogo: ${(error as Error).message}`);
    }
    // Scena di corsa (index.html): stanze senza giunture per tipo, partita con la regia della corsa, movimento ridotto.
    try {
      type RunDebug = DebugInfo & {
        view: string;
        room: { key: string; kind: string; slope: string; cellId: string };
        runners: string[];
        running: boolean;
        approach: number;
      };
      const runInfo = (): Promise<RunDebug> => page.evaluate(() => (window as unknown as { __hellscape3d: RunDebug }).__hellscape3d);
      const canvasPng = async (): Promise<Buffer> =>
        Buffer.from((await page.evaluate(() => document.querySelector<HTMLCanvasElement>("#scene")!.toDataURL("image/png"))).split(",")[1]!, "base64");
      const open = async (query: string): Promise<RunDebug> => {
        await page.goto(`${url}?${query}`);
        await page.waitForFunction(() => (window as unknown as { __hellscape3d?: { ready: boolean } }).__hellscape3d?.ready === true, null, { timeout: 30_000 });
        if (/(^|&)t=/.test(query)) {
          // Istante fisso: si confronta la scena ferma. Dopo il primo fotogramma la presentazione cambia ancora
          // (margine del pannello della domanda, avvicinamento della camera), e su un runner lento un'attesa
          // fissa può catturare un'immagine di passaggio: si attende il margine finale e due immagini uguali.
          await page.waitForFunction(() => {
            const d = (window as unknown as { __hellscape3d: { inset: number; panelTop: number | null } }).__hellscape3d;
            return Math.abs((d.panelTop === null ? 0 : window.innerHeight - d.panelTop) - d.inset) < 0.5;
          }, null, { timeout: 10_000 });
          let previous = await canvasPng();
          for (let i = 0; i < 40; i++) {
            await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
            const next = await canvasPng();
            if (next.equals(previous)) break;
            assert.ok(i < 39, `${query}: la scena con l'istante fisso non si ferma`);
            previous = next;
          }
        } else await page.waitForTimeout(250);
        return runInfo();
      };
      // Stanze di esempio (anteprime), ciclo senza giunture: dopo un periodo l'immagine è identica, a metà è diversa.
      // Dipende dalle proporzioni dello schermo (quanta striscia è in vista): entrambe le viewport.
      const period = STRIP.period / RUN_SPEED.normal;
      for (const [kind, query] of kinds) {
        const d = await open(`${query}&intro=off&t=1.3`);
        assert.equal(`${d.room.kind}/${d.room.slope}`, kind, "stanza dell'anteprima diversa da quella generata in Node");
        const a = await canvasPng();
        assert.ok((await luminanceSpread(a)) > 8, `${kind}: scena apparentemente vuota`);
        await page.screenshot({ path: join(artifacts, `stanza-${kind.replace("/", "-")}-${device.name}.png`) });
        // L'uscita non è ciclica: basta che non sia vuota.
        if (kind.startsWith("uscita")) continue;
        await open(`${query}&intro=off&t=${1.3 + period}`);
        assert.ok(a.equals(await canvasPng()), `${kind}: l'immagine non si ripete dopo un periodo`);
        await open(`${query}&intro=off&t=${1.3 + period / 2}`);
        assert.ok(!a.equals(await canvasPng()), `${kind}: la stanza non scorre`);
      }
      // Partita con la regia della corsa: a regia ferma la scena è nella stanza del giocatore di turno.
      // Regia a velocità ×3 (tasto F): si controllano gli stati a regia ferma, non i tempi.
      let d = await open("seed=graybox-1&intro=off&test=1");
      assert.equal(d.view, "corsa");
      await page.keyboard.press("KeyF");
      let forks = 0;
      for (let action = 0; action < 40 && d.phase !== "ended"; action++) {
        await page.keyboard.press("KeyA");
        await page.waitForFunction(() => (window as unknown as { __hellscape3d: { busy: boolean } }).__hellscape3d.busy === false, null, { timeout: 20_000 });
        d = await runInfo();
        if (d.phase === "ended") break;
        const active = d.playerCells[d.stateActivePlayerId]!;
        if (d.phase === "fork") {
          forks++;
          assert.equal(d.room.key, `bivio:${active}`);
          assert.ok(!d.running && d.approach === 0, "non fermo davanti alle porte");
          assert.ok(d.forkChoices.length >= 2 && d.forkChoices.every((c) => c.anchored), "porte non segnalate");
          await assertBadgesClear(page);
          if (forks === 1) await page.screenshot({ path: join(artifacts, `corsa-bivio-${device.name}.png`) });
        } else {
          assert.equal(d.room.key, active, "scena fuori dalla stanza del giocatore di turno");
          assert.equal(d.runners[0], d.stateActivePlayerId);
        }
        assert.equal(d.fade, 0);
        assertRadar(d);
      }
      assert.ok(forks > 0, "nessun bivio nella partita di prova");
      // Movimento ridotto: la stanza resta ferma.
      await open("seed=graybox-1&intro=off&motion=reduced");
      const still = await canvasPng();
      await page.waitForTimeout(700);
      assert.ok(still.equals(await canvasPng()), "con il movimento ridotto la stanza si muove");
      console.log(`ok   ${device.name} · scena di corsa: ${kinds.size} tipi di stanza senza giunture, partita con ${forks} bivi, movimento ridotto`);
    } catch (error) {
      failures++;
      console.log(`FAIL ${device.name} · scena di corsa: ${(error as Error).message}`);
    }
    // Movimento ridotto: nessuna animazione, presentazione sempre allineata allo stato (sola logica).
    if (logic) try {
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
