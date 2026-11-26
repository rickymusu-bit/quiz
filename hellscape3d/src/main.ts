/**
 * Pagina di prova del graybox (fase 2), non pubblicata.
 *
 * Parametri: ?seed=… (città), ?steps=N (azioni automatiche iniziali, senza
 * regia), ?view=overview (panoramica delle zone esplorate), ?motion=reduced
 * (movimento ridotto), ?reveal=all (SOLO SVILUPPO: mostra l'intera città).
 * Tasti: Spazio esegue un'azione automatica (o salta la regia in corso),
 * S salta la regia, F accelera ×3, V cambia inquadratura.
 *
 * Le risposte sono simulate con il profilo provvisorio: interfaccia e domande
 * fittizie arrivano in un passo successivo.
 */
import { CameraDirector, type Frame } from "./director/director.ts";
import { applyAction, createGame, publicView, rngFromSeed, type Game, type GameAction, type GameState } from "./logic/index.ts";
import { buildCityLayout } from "./layout/layout.ts";
import { GrayboxRenderer, type CameraMode } from "./render/graybox.ts";
import { buildSceneModel, presentedView, revealAllView } from "./scene/model.ts";

const params = new URLSearchParams(location.search);
const seed = params.get("seed") ?? "graybox-1";
const revealAll = params.get("reveal") === "all";
const reducedMotion = params.get("motion") === "reduced" || matchMedia("(prefers-reduced-motion: reduce)").matches;
let mode: CameraMode = params.get("view") === "overview" ? "overview" : "player";
let speed = 1;

const { game } = createGame({
  seed,
  players: [
    { id: "p1", name: "Dannato 1" },
    { id: "p2", name: "Dannato 2" },
  ],
});
const layout = buildCityLayout(game.map);
const answers = rngFromSeed(seed, "dev:answers");
let state: GameState = game.state;

function autoAction(current: Game["map"], s: GameState): GameAction {
  switch (s.phase) {
    case "fork":
      return { type: "chooseBranch", to: answers.pick(current.options[s.players[s.activeIndex]!.cellId]!).to };
    case "question":
      return { type: "answer", outcome: answers.chance(current.config.answerProfile[s.questionDifficulty!]) ? "correct" : "wrong" };
    case "roll":
      return { type: "roll" };
    case "ended":
      throw new Error("Partita conclusa");
  }
}

const steps = Math.max(0, Math.min(2000, Number.parseInt(params.get("steps") ?? "0", 10) || 0));
for (let i = 0; i < steps && state.phase !== "ended"; i++) state = applyAction(game.map, state, autoAction(game.map, state)).state;

const PHASE_LABELS: Readonly<Record<GameState["phase"], string>> = {
  fork: "scelta al bivio",
  question: "domanda",
  roll: "lancio del dado",
  ended: "partita conclusa",
};

const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
const hud = document.querySelector<HTMLElement>("#hud")!;
const fade = document.querySelector<HTMLElement>("#fade")!;
const renderer = new GrayboxRenderer(canvas);
const director = new CameraDirector(game.map, layout, state, { reducedMotion });
let frame: Frame = director.getFrame();
let builtKey = "";
let model = buildModel();

function buildModel() {
  const view = { ...publicView(game.map, state), activePlayerId: frame.activePlayerId };
  return buildSceneModel(game.map, layout, revealAll ? revealAllView(game.map, view) : presentedView(game.map, view, frame.explored));
}

/** Ricostruisce la scena statica solo quando cambiano le celle mostrate, il giocatore attivo o la finestra. */
function draw(): void {
  const width = canvas.clientWidth,
    height = canvas.clientHeight;
  const key = `${width}x${height}|${frame.explored.join()}|${frame.activePlayerId}|${revealAll}`;
  if (key !== builtKey) {
    renderer.resize(width, height);
    model = buildModel();
    renderer.setModel(model);
    builtKey = key;
  }
  renderer.setPawnPositions(frame.pawns);
  if (mode === "overview") renderer.frameOverview(model);
  else renderer.setCameraPose(frame.camera);
  fade.style.opacity = String(frame.fade);
  renderer.render();
  const view = publicView(game.map, state);
  const nameOf = (id: string): string => view.players.find((p) => p.id === id)!.name;
  hud.textContent = [
    `Graybox · seme ${seed}${revealAll ? " · CITTÀ RIVELATA (sviluppo)" : ""}${reducedMotion ? " · movimento ridotto" : ""}`,
    view.winnerId
      ? `Turno ${view.turn} · partita conclusa · esce ${nameOf(view.winnerId)}`
      : `Turno ${view.turn} · ${PHASE_LABELS[view.phase]} · ${nameOf(view.activePlayerId)}${director.busy ? " · regia in corso" : ""}`,
    `Spazio: azione/salta · S: salta · F: velocità ×${speed} · V: inquadratura`,
  ].join("\n");
  Object.assign(window, {
    __hellscape3d: {
      ready: true,
      seed,
      turn: view.turn,
      phase: view.phase,
      mode,
      revealAll,
      reducedMotion,
      busy: director.busy,
      explored: [...state.explored],
      shown: [...frame.explored],
      rendered: model.tiles.map((t) => t.id),
      pawns: frame.pawns,
      stateCells: Object.fromEntries(state.players.map((p) => [p.id, p.cellId])),
      cellPositions: Object.fromEntries(state.players.map((p) => [p.id, layout.positions[p.cellId]])),
      fade: frame.fade,
      totalCells: Object.keys(game.map.cells).length,
      layout: { attempt: layout.attempt, usedFallback: layout.usedFallback },
      stats: renderer.getStats(),
    },
  });
}

function act(): void {
  if (director.busy) {
    frame = director.skip();
    return;
  }
  if (state.phase === "ended") return;
  const result = applyAction(game.map, state, autoAction(game.map, state));
  state = result.state;
  director.enqueue(result.events, state);
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    act();
    event.preventDefault();
  } else if (event.code === "KeyS") {
    frame = director.skip();
  } else if (event.code === "KeyF") {
    speed = speed === 1 ? 3 : 1;
  } else if (event.code === "KeyV") {
    mode = mode === "player" ? "overview" : "player";
  }
});

let last = performance.now();
function loop(now: number): void {
  const seconds = Math.min(0.1, (now - last) / 1000);
  last = now;
  frame = director.update(seconds * speed);
  draw();
  requestAnimationFrame(loop);
}
draw();
requestAnimationFrame(loop);
