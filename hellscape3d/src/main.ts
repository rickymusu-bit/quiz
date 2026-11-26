/**
 * Pagina di prova del graybox (fase 2), non pubblicata.
 *
 * Parametri: ?seed=… (città), ?steps=N (azioni automatiche iniziali),
 * ?view=overview (panoramica delle zone esplorate), ?reveal=all (SOLO
 * SVILUPPO: mostra l'intera città per giudicare il layout).
 * Tasti: Spazio esegue un'azione automatica, V cambia inquadratura.
 *
 * Le risposte sono simulate con il profilo provvisorio: interfaccia e domande
 * fittizie arrivano in un passo successivo.
 */
import { applyAction, createGame, publicView, rngFromSeed, type Game, type GameAction, type GameState } from "./logic/index.ts";
import { buildCityLayout } from "./layout/layout.ts";
import { GrayboxRenderer, type CameraMode } from "./render/graybox.ts";
import { buildSceneModel, revealAllView } from "./scene/model.ts";

const params = new URLSearchParams(location.search);
const seed = params.get("seed") ?? "graybox-1";
const revealAll = params.get("reveal") === "all";
let mode: CameraMode = params.get("view") === "overview" ? "overview" : "player";

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
const renderer = new GrayboxRenderer(canvas);

function update(): void {
  const view = publicView(game.map, state);
  const model = buildSceneModel(game.map, layout, revealAll ? revealAllView(game.map, view) : view);
  renderer.resize(canvas.clientWidth, canvas.clientHeight);
  renderer.setModel(model, mode);
  renderer.render();
  const nameOf = (id: string): string => view.players.find((p) => p.id === id)!.name;
  hud.textContent = [
    `Graybox · seme ${seed}${revealAll ? " · CITTÀ RIVELATA (sviluppo)" : ""}`,
    view.winnerId
      ? `Turno ${view.turn} · partita conclusa · esce ${nameOf(view.winnerId)}`
      : `Turno ${view.turn} · ${PHASE_LABELS[view.phase]} · ${nameOf(view.activePlayerId)}`,
    "Spazio: azione automatica · V: inquadratura",
  ].join("\n");
  Object.assign(window, {
    __hellscape3d: {
      ready: true,
      seed,
      turn: view.turn,
      phase: view.phase,
      mode,
      revealAll,
      explored: [...state.explored],
      rendered: model.tiles.map((t) => t.id),
      totalCells: Object.keys(game.map.cells).length,
      layout: { attempt: layout.attempt, usedFallback: layout.usedFallback },
      stats: renderer.getStats(),
    },
  });
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" && state.phase !== "ended") {
    state = applyAction(game.map, state, autoAction(game.map, state)).state;
    update();
    event.preventDefault();
  } else if (event.code === "KeyV") {
    mode = mode === "player" ? "overview" : "player";
    update();
  }
});
window.addEventListener("resize", update);
update();
