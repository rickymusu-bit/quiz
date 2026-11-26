/**
 * Pagina di prova della fase 2, non pubblicata: graybox, regia e interfaccia
 * provvisoria con domande fittizie.
 *
 * Parametri: ?seed=… (città), ?steps=N (azioni automatiche iniziali, senza
 * regia), ?timer=S (secondi per domanda), ?view=overview, ?motion=reduced,
 * ?reveal=all (SOLO SVILUPPO: città intera), ?test=1 (espone ai test la
 * risposta corretta).
 * Tasti: 1–4 risposte e alternative, Invio lancia il dado, Spazio o S
 * saltano la regia, F accelera ×3, V cambia inquadratura, A esegue
 * un'azione automatica (sviluppo).
 */
import { CameraDirector, type Frame } from "./director/director.ts";
import { applyAction, createGame, publicView, rngFromSeed, type GameAction, type GameState } from "./logic/index.ts";
import { buildCityLayout } from "./layout/layout.ts";
import { GrayboxRenderer, type CameraMode } from "./render/graybox.ts";
import { buildSceneModel, presentedView, revealAllView, type SceneModel } from "./scene/model.ts";
import { Hud, type ForkChoice, type HudState, type Panel } from "./ui/hud.ts";
import { minimapShapes } from "./ui/minimap.ts";
import { fakeQuestion, type FakeQuestion } from "./ui/questions.ts";
import { DEFAULT_QUESTION_SECONDS, QuestionTimer } from "./ui/timer.ts";

const params = new URLSearchParams(location.search);
const seed = params.get("seed") ?? "graybox-1";
const revealAll = params.get("reveal") === "all";
const testHooks = params.get("test") === "1";
const reducedMotion = params.get("motion") === "reduced" || matchMedia("(prefers-reduced-motion: reduce)").matches;
const questionSeconds = Math.max(1, Number(params.get("timer")) || DEFAULT_QUESTION_SECONDS);
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

/** Azione automatica di sviluppo, con risposte simulate secondo il profilo provvisorio. */
function autoAction(s: GameState): GameAction {
  switch (s.phase) {
    case "fork":
      return { type: "chooseBranch", to: answers.pick(game.map.options[s.players[s.activeIndex]!.cellId]!).to };
    case "question":
      return { type: "answer", outcome: answers.chance(game.map.config.answerProfile[s.questionDifficulty!]) ? "correct" : "wrong" };
    case "roll":
      return { type: "roll" };
    case "ended":
      throw new Error("Partita conclusa");
  }
}

const steps = Math.max(0, Math.min(2000, Number.parseInt(params.get("steps") ?? "0", 10) || 0));
for (let i = 0; i < steps && state.phase !== "ended"; i++) state = applyAction(game.map, state, autoAction(state)).state;

const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
const fade = document.querySelector<HTMLElement>("#fade")!;
const renderer = new GrayboxRenderer(canvas);
const director = new CameraDirector(game.map, layout, state, { reducedMotion });
let frame: Frame = director.getFrame();
let builtKey = "";
let model: SceneModel = buildModel();

let question: { key: string; data: FakeQuestion; timer: QuestionTimer } | null = null;
let die: { value: number; hideAt: number | null } | null = null;
let toast: { text: string; until: number } | null = null;
let clock = 0;

const hud = new Hud(document.querySelector<HTMLElement>("#hud")!, {
  answer: (index) => answer(index),
  roll: () => perform({ type: "roll" }),
  choose: (to) => perform({ type: "chooseBranch", to }),
  restart: () => {
    const next = new URLSearchParams({ seed: `${seed}+` });
    location.search = next.toString();
  },
});

function buildModel(): SceneModel {
  const view = { ...publicView(game.map, state), activePlayerId: frame.activePlayerId };
  return buildSceneModel(game.map, layout, revealAll ? revealAllView(game.map, view) : presentedView(game.map, view, frame.explored));
}

/** Unica via per modificare lo stato: azione del motore, poi regia degli eventi. */
function perform(action: GameAction): void {
  if (director.busy || state.phase === "ended") return;
  const result = applyAction(game.map, state, action);
  state = result.state;
  for (const event of result.events) if (event.type === "diceRolled") die = { value: event.value, hideAt: null };
  director.enqueue(result.events, state);
  // Le clip istantanee (movimento ridotto) si completano subito; quelle animate partono soltanto.
  frame = director.update(0);
  // Aggiornamento immediato di scena, interfaccia e dati di debug, salvo azioni nate durante il disegno (scadenza del timer).
  if (!drawing) draw(0);
}

function answer(index: number | "timeout"): void {
  if (!question || state.phase !== "question" || director.busy) return;
  const outcome = index === "timeout" ? "timeout" : index === question.data.correctIndex ? "correct" : "wrong";
  toast = { text: outcome === "correct" ? "Risposta corretta" : outcome === "wrong" ? "Risposta errata: il turno passa" : "Tempo scaduto: il turno passa", until: clock + 1.6 };
  question = null;
  perform({ type: "answer", outcome });
}

/** Pannello da mostrare: solo a regia ferma, quando la presentazione coincide con lo stato. */
function currentPanel(): Panel | null {
  if (revealAll || director.busy) return null;
  const active = state.players[state.activeIndex]!;
  switch (state.phase) {
    case "question": {
      const key = `q:${state.turn}:${active.id}`;
      if (!question || question.key !== key) {
        question = { key, data: fakeQuestion(seed, state.turn, active.id, state.questionDifficulty!), timer: new QuestionTimer(questionSeconds) };
      }
      return { kind: "question", key, question: question.data, remaining: question.timer.remaining, total: question.timer.duration };
    }
    case "roll":
      return { kind: "roll", key: `r:${state.turn}` };
    case "fork": {
      const options = [...game.map.options[active.cellId]!].sort((a, b) => ORDER[a.relative] - ORDER[b.relative]);
      const choices: ForkChoice[] = options.map((option, i) => ({
        number: i + 1,
        to: option.to,
        relative: option.relative,
        difficulty: option.difficulty,
        anchor: mode === "player" ? renderer.project(layout.positions[option.to]!) : null,
      }));
      return { kind: "fork", key: `f:${state.turn}:${active.cellId}:${state.forkContext}`, choices };
    }
    case "ended":
      return { kind: "ended", key: "end", winnerName: state.players.find((p) => p.id === state.winnerId)!.name };
  }
}

const ORDER = { "piu-breve": 0, intermedio: 1, "piu-lungo": 2 } as const;

let lastPanel: Panel | null = null;
let minimapCells: string[] = [];

let drawing = false;
function draw(seconds: number): void {
  drawing = true;
  try {
    drawFrame(seconds);
  } finally {
    drawing = false;
  }
}

function drawFrame(seconds: number): void {
  clock += seconds;
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

  const panel = currentPanel();
  // Il timer scorre solo con la domanda visibile, a regia ferma e pagina in primo piano.
  if (question && panel?.kind === "question" && question.timer.tick(seconds, !document.hidden)) answer("timeout");
  if (die) {
    if (!director.busy) die.hideAt ??= clock + 1.2;
    if (die.hideAt !== null && clock >= die.hideAt) die = null;
  }
  if (toast && clock >= toast.until) toast = null;
  lastPanel = currentPanel();

  const hudState: HudState = {
    turn: state.turn,
    players: state.players.map((p, index) => ({ id: p.id, name: p.name, index, active: p.id === frame.activePlayerId, escaped: p.escaped })),
    panel: lastPanel,
    die: die?.value ?? null,
    toast: toast?.text ?? null,
    dev: `Prova non pubblicata · seme ${seed}${revealAll ? " · CITTÀ RIVELATA" : ""}${reducedMotion ? " · movimento ridotto" : ""} · velocità ×${speed} · A automatico · V vista`,
  };
  hud.update(hudState);
  const size = hudMinimapSize();
  minimapCells = hud.drawMinimap(minimapShapes(model, frame.pawns, frame.activePlayerId, size.width, size.height));

  Object.assign(window, {
    __hellscape3d: {
      ready: true,
      seed,
      turn: state.turn,
      phase: state.phase,
      mode,
      revealAll,
      reducedMotion,
      busy: director.busy,
      panel: lastPanel?.kind ?? null,
      timer: question ? { remaining: question.timer.remaining, total: question.timer.duration } : null,
      correctIndex: testHooks && question ? question.data.correctIndex : undefined,
      forkChoices: lastPanel?.kind === "fork" ? lastPanel.choices.map((c) => ({ number: c.number, to: c.to, anchored: c.anchor !== null })) : [],
      activePlayerId: frame.activePlayerId,
      stateActivePlayerId: state.players[state.activeIndex]!.id,
      explored: [...state.explored],
      shown: [...frame.explored],
      rendered: model.tiles.map((t) => t.id),
      minimap: minimapCells,
      pawns: frame.pawns,
      cellPositions: Object.fromEntries(state.players.map((p) => [p.id, layout.positions[p.cellId]])),
      fade: frame.fade,
      totalCells: Object.keys(game.map.cells).length,
      stats: renderer.getStats(),
    },
  });
}

function hudMinimapSize(): { width: number; height: number } {
  const element = document.querySelector<HTMLElement>(".hud-minimap")!;
  return { width: element.clientWidth, height: element.clientHeight };
}

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  const digit = /^Digit([1-4])$/.exec(event.code)?.[1] ?? /^Numpad([1-4])$/.exec(event.code)?.[1];
  if (digit && lastPanel?.kind === "question") answer(Number(digit) - 1);
  else if (digit && lastPanel?.kind === "fork") {
    const choice = lastPanel.choices[Number(digit) - 1];
    if (choice) perform({ type: "chooseBranch", to: choice.to });
  } else if ((event.code === "Enter" || event.code === "NumpadEnter") && lastPanel?.kind === "roll") {
    perform({ type: "roll" });
    event.preventDefault();
  } else if (event.code === "Space" || event.code === "KeyS") {
    if (director.busy) {
      frame = director.skip();
      draw(0);
    }
    if (event.code === "Space") event.preventDefault();
  } else if (event.code === "KeyF") speed = speed === 1 ? 3 : 1;
  else if (event.code === "KeyV") mode = mode === "player" ? "overview" : "player";
  else if (event.code === "KeyA" && !director.busy && state.phase !== "ended") {
    const action = autoAction(state);
    if (action.type === "answer") {
      toast = { text: action.outcome === "correct" ? "Risposta corretta (automatica)" : "Risposta errata (automatica)", until: clock + 1.6 };
      question = null;
    }
    perform(action);
  }
});

/**
 * Tempo reale fra un fotogramma e l'altro. La regia lo segue fino a 0,25 s per
 * fotogramma, così su un dispositivo lento le transizioni restano vicine alla
 * durata prevista; il timer della domanda fino a 1 s, così il ritorno su una
 * pagina rimasta in secondo piano non consuma il tempo.
 */
let last = performance.now();
function loop(now: number): void {
  const elapsed = Math.max(0, (now - last) / 1000);
  last = now;
  frame = director.update(Math.min(0.25, elapsed) * speed);
  draw(Math.min(1, elapsed));
  requestAnimationFrame(loop);
}
draw(0);
requestAnimationFrame(loop);
