/**
 * Pagina di prova, non pubblicata: graybox, regia e interfaccia provvisoria con
 * le domande delle banche della versione precedente.
 *
 * Senza parametri riprende la partita salvata nel browser, se esiste.
 * Parametri: ?seed=… (città: partita nuova), ?bank=ID (banca di domande del
 * catalogo per una partita nuova; predefinita la prima), ?steps=N (azioni automatiche
 * iniziali, senza regia: partita nuova), ?new=1 (partita nuova), ?timer=S (secondi per domanda), ?view=overview, ?motion=reduced,
 * ?intro=off (senza l'apertura di Bafometto),
 * ?reveal=all (SOLO SVILUPPO: città intera), ?occlusion=off (SOLO SVILUPPO:
 * ostacoli opachi, per confronto), ?sectors=off (SOLO SVILUPPO: città presentata
 * sempre intera), ?sectors=R (SOLO SVILUPPO: raggio di caricamento forzato a R,
 * più corto di quello sicuro: si vedono comparire i settori), ?test=1 (espone ai
 * test la risposta corretta).
 * Tasti: 1–4 risposte e alternative, Invio lancia il dado, Spazio o S
 * saltano la regia, F accelera ×3, V cambia inquadratura, A esegue
 * un'azione automatica (sviluppo).
 */
import { CameraDirector, SHOTS, type Frame } from "./director/director.ts";
import { applyAction, createGame, publicView, rngFromSeed, saveToStorage, visitedCells, type Game, type GameAction, type GameState, type KeyValueStorage } from "./logic/index.ts";
import { buildCityLayout } from "./layout/layout.ts";
import { GrayboxRenderer, type CameraMode } from "./render/graybox.ts";
import { buildSceneModel, presentedView, revealAllView, type SceneModel } from "./scene/model.ts";
import { NO_OCCLUDERS, type Occluders } from "./scene/occlusion.ts";
import { citySlab, visibleRadius, type Focus } from "./scene/sectors.ts";
import { Hud, type ForkChoice, type HudState, type Panel } from "./ui/hud.ts";
import { minimapShapes } from "./ui/minimap.ts";
import { CATALOG, loadBank } from "./questions/catalog.ts";
import { ask, loadLog, newLog, outcomeOf, present, recordAnswer, saveLog, type GivenAnswer, type PresentedQuestion, type QuestionLog } from "./questions/deck.ts";
import { DEFAULT_QUESTION_SECONDS, QuestionTimer } from "./ui/timer.ts";
import { decideStart, loadQuestionClock, memoryStorage, questionKey, saveQuestionClock } from "./session.ts";

const params = new URLSearchParams(location.search);

/** Salvataggio nel browser; senza `localStorage` la partita funziona ma non si riprende. */
let storageNotice: string | null = null;
const storage: KeyValueStorage = (() => {
  try {
    const probe = "hellscape3d-prova";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    storageNotice = "Salvataggio non disponibile in questo browser: la partita non potrà essere ripresa.";
    return memoryStorage();
  }
})();
const start = decideStart(params, storage, "graybox-1");
const resumed = start.kind === "resume";
const revealAll = params.get("reveal") === "all";
const testHooks = params.get("test") === "1";
/** SOLO SVILUPPO: ?occlusion=off disattiva la trasparenza degli ostacoli, per confronto. */
const occlusionEnabled = params.get("occlusion") !== "off";
/** Caricamento per settori: raggio calcolato (predefinito), disattivato o forzato (sviluppo). */
const sectorsParam = params.get("sectors");
const forcedSectorRadius = sectorsParam && sectorsParam !== "off" && Number(sectorsParam) > 0 ? Number(sectorsParam) : null;
const sectorsEnabled = sectorsParam !== "off";
const reducedMotion = params.get("motion") === "reduced" || matchMedia("(prefers-reduced-motion: reduce)").matches;
const questionSeconds = Math.max(1, Number(params.get("timer")) || DEFAULT_QUESTION_SECONDS);
let mode: CameraMode = params.get("view") === "overview" ? "overview" : "player";
let speed = 1;

const game: Game =
  start.kind === "resume"
    ? start.game
    : createGame({
        seed: start.seed,
        players: [
          { id: "p1", name: "Dannato 1" },
          { id: "p2", name: "Dannato 2" },
        ],
      }).game;
const seed = game.map.seed;

/**
 * Banca di domande: per una partita ripresa quella registrata con la partita,
 * per una nuova quella indicata da ?bank= o la prima del catalogo.
 */
const savedLog = resumed ? loadLog(storage, seed) : null;
const requestedBank = savedLog?.bankId ?? params.get("bank") ?? CATALOG[0]!.id;
const bankEntry = CATALOG.find((entry) => entry.id === requestedBank) ?? CATALOG[0]!;
const bankNotice = bankEntry.id === requestedBank ? null : `Banca «${requestedBank}» non disponibile: si usa «${bankEntry.name}».`;
const bank = await loadBank(bankEntry).catch((error: unknown) => {
  document.querySelector("#hud")!.textContent = `Domande non disponibili: ${(error as Error).message}`;
  throw error;
});
/** Registro delle domande: se manca o non appartiene a questa partita se ne apre uno nuovo. */
let questionLog: QuestionLog = (savedLog && savedLog.bankId === bank.id ? loadLog(storage, seed, bank) : null) ?? newLog(seed, bank.id);
function storeLog(): void {
  try {
    saveLog(storage, questionLog);
  } catch {
    storageNotice = "Salvataggio non riuscito: la partita potrebbe non essere ripresa.";
  }
}
storeLog();
const layout = buildCityLayout(game.map);
const slab = citySlab(layout);
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

const steps = resumed ? 0 : Math.max(0, Math.min(2000, Number.parseInt(params.get("steps") ?? "0", 10) || 0));
for (let i = 0; i < steps && state.phase !== "ended"; i++) state = applyAction(game.map, state, autoAction(state)).state;

/** Lo stato del motore si salva subito, prima e indipendentemente dalla regia. */
function persist(): void {
  try {
    saveToStorage(storage, { map: game.map, state });
  } catch {
    storageNotice = "Salvataggio non riuscito: la partita potrebbe non essere ripresa.";
  }
}
if (!resumed) persist();

const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
const fade = document.querySelector<HTMLElement>("#fade")!;
const renderer = new GrayboxRenderer(canvas);
const director = new CameraDirector(game.map, layout, state, { reducedMotion });
renderer.setSeat(director.seatPosition);
// Intervento d'apertura di Bafometto, solo per una partita nuova.
if (!resumed && steps === 0 && !revealAll && params.get("intro") !== "off") director.intro();
let frame: Frame = director.getFrame();
let builtKey = "";
let builtSize = "";
let model: SceneModel = buildModel();

/** Timer della domanda visibile (la domanda stessa è nel registro). */
let question: { key: string; timer: QuestionTimer } | null = null;
let die: { value: number; hideAt: number | null } | null = null;
let toast: { text: string; until: number } | null = resumed
  ? { text: "Partita ripresa", until: 2.5 }
  : start.notice || storageNotice || bankNotice
    ? { text: (start.kind === "new" ? start.notice : null) ?? storageNotice ?? bankNotice!, until: 6 }
    : null;
let lastClockSave = 0;
/** Battuta di Bafometto visibile, con il tempo di lettura (anche con il movimento ridotto). */
let speech: { text: string; until: number } | null = null;
const spoken: string[] = [];
let clock = 0;

const hud = new Hud(document.querySelector<HTMLElement>("#hud")!, {
  answer: (index) => answer(index),
  proceed: () => proceed(),
  roll: () => perform({ type: "roll" }),
  choose: (to) => perform({ type: "chooseBranch", to }),
  restart: () => {
    // Un seme esplicito avvia una partita nuova, che sostituisce il salvataggio.
    const next = new URLSearchParams({ seed: `${seed}+`, bank: bank.id });
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
  persist();
  for (const event of result.events) if (event.type === "diceRolled") die = { value: event.value, hideAt: null };
  director.enqueue(result.events, state);
  // Le clip istantanee (movimento ridotto) si completano subito; quelle animate partono soltanto.
  frame = director.update(0);
  // Aggiornamento immediato di scena, interfaccia e dati di debug, salvo azioni nate durante il disegno (scadenza del timer).
  if (!drawing) draw(0);
}

/** Domanda del giocatore attivo: assegnata e registrata alla prima richiesta, poi sempre la stessa. */
function activeQuestion(): PresentedQuestion {
  const key = questionKey(seed, state.turn, state.players[state.activeIndex]!.id);
  const result = ask(questionLog, bank, key, state.questionDifficulty!);
  if (result.log !== questionLog) {
    questionLog = result.log;
    storeLog();
  }
  return present(bank, result.asked);
}

/**
 * La risposta si registra subito (un ricaricamento non permette di
 * rispondere di nuovo) e si mostra l'esito; il motore la riceve con «Continua».
 */
function answer(given: GivenAnswer): void {
  if (!question || state.phase !== "question" || director.busy) return;
  questionLog = recordAnswer(questionLog, question.key, given);
  storeLog();
  question = null;
  if (!drawing) draw(0);
}

function proceed(): void {
  if (state.phase !== "question" || director.busy) return;
  const current = activeQuestion();
  if (current.answer === null) return;
  perform({ type: "answer", outcome: outcomeOf(current) });
}

/** Pannello da mostrare: solo a regia ferma, quando la presentazione coincide con lo stato. */
function currentPanel(): Panel | null {
  if (revealAll || director.busy) return null;
  const active = state.players[state.activeIndex]!;
  switch (state.phase) {
    case "question": {
      const current = activeQuestion();
      if (current.answer !== null) return { kind: "feedback", key: `e:${current.key}`, question: current };
      if (!question || question.key !== current.key) {
        // Dopo un ricaricamento la domanda riprende con il tempo residuo salvato, non con quello pieno.
        const remaining = loadQuestionClock(storage, current.key) ?? questionSeconds;
        question = { key: current.key, timer: new QuestionTimer(questionSeconds, remaining) };
      }
      return { kind: "question", key: current.key, question: current, remaining: question.timer.remaining, total: question.timer.duration };
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
      return { kind: "fork", key: `f:${state.turn}:${active.cellId}:${state.stepsLeft}`, choices };
    }
    case "ended":
      return { kind: "ended", key: "end", winnerName: state.players.find((p) => p.id === state.winnerId)!.name };
  }
}

const ORDER = { "piu-breve": 0, intermedio: 1, "piu-lungo": 2 } as const;

/**
 * Fuochi del caricamento per settori: il punto inquadrato, con il raggio che
 * la sua inquadratura può mostrare o ombreggiare, e ogni pedina, destinazione
 * possibile di un cambio di turno, con il raggio della più ampia delle
 * inquadrature ordinarie. In panoramica e con la città rivelata si carica tutto.
 */
function sectorFoci(aspect: number): Focus[] | null {
  if (!sectorsEnabled || revealAll || mode === "overview") return null;
  const target = frame.camera.target;
  const foci: Focus[] = [{ x: target.x, z: target.z, radius: forcedSectorRadius ?? visibleRadius(frame.camera, aspect, slab) }];
  for (const pawn of Object.values(frame.pawns)) {
    const radius = forcedSectorRadius ?? Math.max(...Object.values(SHOTS).map((shot) => visibleRadius({ target: pawn, ...shot }, aspect, slab)));
    foci.push({ x: pawn.x, z: pawn.z, radius });
  }
  return foci;
}

let lastPanel: Panel | null = null;
let inset = 0;
let occluders: Occluders = NO_OCCLUDERS;

/** Altezza, dal fondo dello schermo, occupata dal pannello visibile. */
function panelInset(): number {
  const panel = document.querySelector<HTMLElement>(".hud-panel");
  if (!panel || panel.hidden) return 0;
  return Math.max(0, window.innerHeight - panel.getBoundingClientRect().top);
}
let minimapCells: string[] = [];
let minimapJunctions = 0;
let minimapExit = true;

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
  const size = `${width}x${height}`;
  if (size !== builtSize) {
    renderer.resize(width, height);
    builtSize = size;
  }
  const key = `${frame.explored.join()}|${frame.activePlayerId}|${revealAll}`;
  if (key !== builtKey) {
    model = buildModel();
    renderer.setModel(model, seed);
    builtKey = key;
  }
  renderer.setPawnPositions(frame.pawns);
  if (mode === "overview") renderer.frameOverview(model);
  else renderer.setCameraPose(frame.camera);
  // Settori caricati: si aggiornano prima del disegno, quindi un fotogramma non mostra mai un settore mancante.
  renderer.updateSectors(sectorFoci(width / Math.max(1, height)));
  // Il pannello in basso non copre il giocatore: l'inquadratura si centra nell'area libera.
  const target = mode === "player" ? panelInset() : 0;
  inset = reducedMotion ? target : inset + (target - inset) * Math.min(1, seconds * 8);
  if (Math.abs(inset - target) < 0.5) inset = target;
  renderer.setBottomInset(inset);
  // Gli ostacoli fra camera e giocatore attivo diventano trasparenti.
  // Sulla sede di Bafometto la pedina non è inquadrata: niente ostacoli da rendere trasparenti.
  if (occlusionEnabled) occluders = frame.bafometto?.kind === "seat" ? renderer.clearOcclusion() : renderer.updateOcclusion(frame.pawns[frame.activePlayerId]!);
  renderer.setBafometto(
    frame.bafometto?.kind === "terminal" ? { kind: "terminal", position: layout.positions[frame.bafometto.cellId]! } : frame.bafometto,
  );
  for (const line of director.takeAnnouncements()) {
    speech = { text: line.text, until: clock + 3.5 };
    spoken.push(line.moment);
  }
  if (speech && clock >= speech.until) speech = null;
  fade.style.opacity = String(frame.fade);
  renderer.render();

  const panel = currentPanel();
  // Il timer scorre solo con la domanda visibile, a regia ferma e pagina in primo piano.
  if (question && panel?.kind === "question" && question.timer.tick(seconds, !document.hidden)) answer("timeout");
  if (question && clock - lastClockSave >= 0.5) {
    saveQuestionClock(storage, question.key, question.timer.remaining);
    lastClockSave = clock;
  }
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
    speech: speech?.text ?? null,
    dev: `Prova non pubblicata · seme ${seed} · ${bank.title}${revealAll ? " · CITTÀ RIVELATA" : ""}${reducedMotion ? " · movimento ridotto" : ""}${forcedSectorRadius ? ` · SETTORI r=${forcedSectorRadius}` : ""} · velocità ×${speed} · A automatico · V vista`,
  };
  hud.update(hudState);
  const minimapSize = hudMinimapSize();
  const shapes = minimapShapes(
    { map: game.map, positions: layout.positions, traversed: frame.traversed, players: state.players.map((p, index) => ({ id: p.id, index })), pawns: frame.pawns, activePlayerId: frame.activePlayerId },
    minimapSize.width,
    minimapSize.height,
  );
  minimapCells = hud.drawMinimap(shapes);
  minimapJunctions = shapes.junctions.length;
  minimapExit = shapes.exit !== null;

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
      correctIndex: testHooks && lastPanel?.kind === "question" ? lastPanel.question.correctIndex : undefined,
      bankId: bank.id,
      questionId: lastPanel?.kind === "question" || lastPanel?.kind === "feedback" ? lastPanel.question.id : null,
      questionText: lastPanel?.kind === "question" || lastPanel?.kind === "feedback" ? lastPanel.question.text : null,
      outcome: lastPanel?.kind === "feedback" ? outcomeOf(lastPanel.question) : null,
      askedCount: questionLog.asked.length,
      forkChoices: lastPanel?.kind === "fork" ? lastPanel.choices.map((c) => ({ number: c.number, to: c.to, anchored: c.anchor !== null })) : [],
      activePlayerId: frame.activePlayerId,
      stateActivePlayerId: state.players[state.activeIndex]!.id,
      explored: [...state.explored],
      shown: [...frame.explored],
      rendered: model.tiles.map((t) => t.id),
      loadedTiles: renderer.loadedTiles(),
      loadedSectors: renderer.loadedSectors(),
      sectors: sectorsEnabled ? (forcedSectorRadius ?? "calcolato") : "off",
      minimap: minimapCells,
      minimapJunctions,
      minimapExit,
      visited: visitedCells(game.map.startId, state.traversed),
      shownVisited: visitedCells(game.map.startId, frame.traversed),
      occluders: { tiles: occluders.tiles.length, pillars: occluders.pillars.length, walkways: occluders.walkways.length, masses: occluders.masses.length },
      occluderIds: [...occluders.tiles, ...occluders.pillars],
      bafometto: frame.bafometto,
      resumed,
      timerRemaining: question?.timer.remaining ?? null,
      spoken: [...spoken],
      speech: speech?.text ?? null,
      seat: director.seatPosition,
      cameraTarget: frame.camera.target,
      inset,
      activeScreen: renderer.project(frame.pawns[frame.activePlayerId]!),
      panelTop: panelInset() > 0 ? window.innerHeight - panelInset() : null,
      pawns: frame.pawns,
      cellPositions: Object.fromEntries(state.players.map((p) => [p.id, layout.positions[p.cellId]])),
      playerCells: Object.fromEntries(state.players.map((p) => [p.id, p.cellId])),
      stepsLeft: state.stepsLeft,
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

// Alla chiusura o al ricaricamento si salva subito il tempo residuo della domanda in corso.
window.addEventListener("pagehide", () => {
  if (question) saveQuestionClock(storage, question.key, question.timer.remaining);
});

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  const digit = /^Digit([1-4])$/.exec(event.code)?.[1] ?? /^Numpad([1-4])$/.exec(event.code)?.[1];
  if (digit && lastPanel?.kind === "question") answer(Number(digit) - 1);
  else if ((event.code === "Enter" || event.code === "NumpadEnter") && lastPanel?.kind === "feedback") {
    proceed();
    event.preventDefault();
  }
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
    // Sviluppo: risposta simulata secondo il profilo, registrata come le altre, senza fermarsi sull'esito.
    if (lastPanel?.kind === "question") {
      const action = autoAction(state);
      const correct = action.type === "answer" && action.outcome === "correct";
      toast = { text: correct ? "Risposta corretta (automatica)" : "Risposta errata (automatica)", until: clock + 1.6 };
      answer(correct ? lastPanel.question.correctIndex : (lastPanel.question.correctIndex + 1) % 4);
      proceed();
    } else if (lastPanel?.kind === "feedback") proceed();
    else if (state.phase !== "question") perform(autoAction(state));
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
