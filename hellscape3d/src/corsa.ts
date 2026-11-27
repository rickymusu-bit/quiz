/**
 * Pagina di prova della scena di corsa (specifica §6), non pubblicata: serve a
 * confrontare le inquadrature prima di sceglierne una. Non è ancora collegata
 * al motore: mostra la casella scelta con il giocatore in corsa, il pannello
 * della domanda e il radar, come apparirebbero durante una domanda.
 *
 * Parametri: ?camera=laterale|angolata|trequarti|spalle (predefinita
 * angolata), ?seed=…, ?cell=ID (predefinita la prima casella dopo la partenza),
 * ?players=1|2 (due giocatori nella stessa casella), ?panel=off,
 * ?motion=reduced, ?t=S (istante fisso, per i test).
 */
import "./ui/hud.css";
import { generateCityMap } from "./logic/index.ts";
import { CATALOG, loadBank } from "./questions/catalog.ts";
import { ask, newLog, present } from "./questions/deck.ts";
import { RUN, RUN_CAMERAS, RunScene, type RunCamera } from "./run/runScene.ts";
import { buildStrip, STRIP } from "./run/strip.ts";
import { panelInset } from "./render/viewOffset.ts";
import { Hud } from "./ui/hud.ts";
import { radarShapes } from "./ui/radar.ts";

const params = new URLSearchParams(location.search);
const camera: RunCamera = RUN_CAMERAS.includes(params.get("camera") as RunCamera) ? (params.get("camera") as RunCamera) : "angolata";
const seed = params.get("seed") ?? "graybox-1";
const players = params.get("players") === "2" ? 2 : 1;
const reducedMotion = params.get("motion") === "reduced" || matchMedia("(prefers-reduced-motion: reduce)").matches;
const fixedTime = params.has("t") ? Number(params.get("t")) : null;

const map = generateCityMap({ seed });
const cellId = params.get("cell") && map.cells[params.get("cell")!] ? params.get("cell")! : map.cells[map.startId]!.next[0]!;
const cell = map.cells[cellId]!;

const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
const scene = new RunScene(canvas);
scene.setStrip(buildStrip(seed, cellId, cell.district));
scene.setRunners(Array.from({ length: players }, (_, i) => i));
scene.setCamera(camera);

const bank = await loadBank(CATALOG[0]!);
const question = present(bank, ask(newLog(seed, bank.id), bank, `corsa:${cellId}`, cell.difficulty).asked);
const hud = new Hud(document.querySelector<HTMLElement>("#hud")!, { answer: () => {}, proceed: () => {}, roll: () => {}, choose: () => {}, restart: () => {} });
const ids = Array.from({ length: players }, (_, i) => `p${i + 1}`);

function draw(distance: number): void {
  const width = canvas.clientWidth,
    height = canvas.clientHeight;
  if (canvas.width !== Math.round(width * scene.renderer.getPixelRatio())) scene.resize(width, height);
  hud.update({
    turn: 1,
    players: ids.map((id, index) => ({ id, name: `Dannato ${index + 1}`, index, active: index === 0, escaped: false })),
    panel: params.get("panel") === "off" ? null : { kind: "question", key: question.key, question, remaining: 45, total: 45 },
    die: null,
    toast: null,
    speech: null,
    dev: `Prova non pubblicata · scena di corsa · camera ${camera} · casella ${cellId} (${cell.district})${reducedMotion ? " · movimento ridotto" : ""}`,
  });
  const radarElement = document.querySelector<HTMLElement>(".hud-radar")!;
  const origin = { x: 0, y: 0, z: 0 };
  hud.drawRadar(
    radarShapes(
      { pawns: Object.fromEntries(ids.map((id) => [id, origin])), players: ids.map((id, index) => ({ id, index })), activePlayerId: "p1", exit: { x: 1e4, y: 0, z: 0 } },
      Math.min(radarElement.clientWidth, radarElement.clientHeight),
    ),
  );
  // Prima l'interfaccia, poi la scena: l'inquadratura si centra nell'area lasciata libera dal pannello.
  scene.setBottomInset(panelInset());
  scene.setDistance(distance);
  scene.render();
  Object.assign(window, { __corsa: { ready: true, camera, cellId, distance, period: STRIP.period, speed: RUN.speed, reducedMotion } });
}

const started = performance.now();
function loop(now: number): void {
  // Con il movimento ridotto lo scenario resta fermo; ?t= fissa l'istante per i test.
  const time = fixedTime ?? (reducedMotion ? 0 : (now - started) / 1000);
  draw(time * RUN.speed);
  if (fixedTime === null) requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
