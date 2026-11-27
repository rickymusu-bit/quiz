/**
 * Pagine di prova, non pubblicate: partita con le domande delle banche della
 * versione precedente, interfaccia provvisoria e una vista intercambiabile.
 * `index.html` è il gioco, con la scena di corsa (specifica §6);
 * `citta.html` mostra la stessa partita nella città a tre quarti, strumento di sviluppo.
 *
 * Senza parametri riprende la partita salvata nel browser; se non c'è, apre la
 * schermata di avvio (banca, argomenti, giocatori, durata). ?new=1 apre la
 * schermata di avvio anche se esiste un salvataggio.
 * Parametri di sviluppo e test, che saltano la schermata: ?seed=… (città),
 * ?bank=ID, ?steps=N (azioni automatiche iniziali, senza regia), ?timer=S (secondi per domanda), ?view=overview, ?motion=reduced,
 * ?intro=off (senza l'apertura di Bafometto),
 * ?reveal=all (SOLO SVILUPPO: città intera), ?occlusion=off (SOLO SVILUPPO:
 * ostacoli opachi, per confronto), ?sectors=off (SOLO SVILUPPO: città presentata
 * sempre intera), ?sectors=R (SOLO SVILUPPO: raggio di caricamento forzato a R,
 * più corto di quello sicuro: si vedono comparire i settori), ?test=1 (espone ai
 * test la risposta corretta).
 * Solo nella scena di corsa: ?camera=laterale|angolata|trequarti|spalle
 * (SOLO SVILUPPO: inquadratura fissa), ?anteprima=ID o bivio:ID (SOLO
 * SVILUPPO: mostra quella stanza), ?t=S (SOLO TEST: istante fisso).
 * Tasti: 1–4 risposte e alternative, Invio lancia il dado, Spazio o S
 * saltano la regia, F accelera ×3, V cambia inquadratura, A esegue
 * un'azione automatica (sviluppo).
 */
import "./ui/hud.css";
import { applyAction, createGame, rngFromSeed, saveToStorage, type Game, type GameAction, type GameState, type KeyValueStorage } from "./logic/index.ts";
import { buildCityLayout } from "./layout/layout.ts";
import { panelInset } from "./render/viewOffset.ts";
import { PRESETS, type PresetKind } from "./run/camera.ts";
import { CityView } from "./views/cityView.ts";
import { RunView } from "./views/runView.ts";
import type { GameView } from "./views/view.ts";
import { Hud, type ForkChoice, type HudState, type Panel } from "./ui/hud.ts";
import { radarShapes, type RadarShapes } from "./ui/radar.ts";
import { CATALOG, loadBank } from "./questions/catalog.ts";
import { ask, loadLog, newLog, outcomeOf, present, recordAnswer, saveLog, type GivenAnswer, type PresentedQuestion, type QuestionLog } from "./questions/deck.ts";
import { DEFAULT_QUESTION_SECONDS, QuestionTimer } from "./ui/timer.ts";
import { decideStart, defaultName, loadLastSettings, loadQuestionClock, memoryStorage, questionKey, saveLastSettings, saveQuestionClock, type GameSettings } from "./session.ts";
import { showSetup } from "./ui/setup.ts";

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
/** SOLO SVILUPPO E TEST: durata della domanda imposta dall'indirizzo, al posto di quella della partita. */
const timerParam = Number(params.get("timer")) > 0 ? Math.max(1, Number(params.get("timer"))) : null;
/** Vista della pagina: scena di corsa (index.html, il gioco) o città (citta.html, solo sviluppo). */
const sceneKind = document.body.dataset.scena === "citta" ? "citta" : "corsa";
let speed = 1;

/** Schermata di avvio: impostazioni della partita nuova, ricordate per la volta successiva. */
const settings: GameSettings | null =
  start.kind === "setup"
    ? await showSetup(document.body, {
        catalog: CATALOG,
        loadBank,
        initial: loadLastSettings(storage),
        notice: start.notice ?? storageNotice,
        saved: start.saved,
        defaultSeconds: DEFAULT_QUESTION_SECONDS,
      })
    : null;
if (settings) {
  try {
    saveLastSettings(storage, settings);
  } catch {
    // Senza salvataggio la schermata non sarà precompilata la prossima volta: nessun altro effetto.
  }
}

const players = settings ? settings.players.map((name, i) => ({ id: `p${i + 1}`, name })) : [defaultName(0), defaultName(1)].map((name, i) => ({ id: `p${i + 1}`, name }));
// Partita nuova dalla schermata: seme casuale. Con ?seed= (sviluppo e test) il seme indicato.
const game: Game = start.kind === "resume" ? start.game : createGame(start.kind === "new" ? { seed: start.seed, players } : { players }).game;
const seed = game.map.seed;

/**
 * Banca di domande: per una partita ripresa quella registrata con la partita,
 * per una nuova quella indicata da ?bank= o la prima del catalogo.
 */
const savedLog = resumed ? loadLog(storage, seed) : null;
const requestedBank = settings?.bankId ?? savedLog?.bankId ?? params.get("bank") ?? CATALOG[0]!.id;
const bankEntry = CATALOG.find((entry) => entry.id === requestedBank) ?? CATALOG[0]!;
const bankNotice = bankEntry.id === requestedBank ? null : `Banca «${requestedBank}» non disponibile: si usa «${bankEntry.name}».`;
const bank = await loadBank(bankEntry).catch((error: unknown) => {
  document.querySelector("#hud")!.textContent = `Domande non disponibili: ${(error as Error).message}`;
  throw error;
});
/** Registro delle domande: se manca o non appartiene a questa partita se ne apre uno nuovo. */
let questionLog: QuestionLog =
  (savedLog && savedLog.bankId === bank.id ? loadLog(storage, seed, bank) : null) ??
  newLog(seed, bank.id, { topics: settings?.topics ?? [], seconds: settings?.seconds ?? DEFAULT_QUESTION_SECONDS });
/** Durata della domanda: quella impostata con la partita (o imposta dall'indirizzo, solo sviluppo). */
const questionSeconds = timerParam ?? questionLog.seconds;
function storeLog(): void {
  try {
    saveLog(storage, questionLog);
  } catch {
    storageNotice = "Salvataggio non riuscito: la partita potrebbe non essere ripresa.";
  }
}
storeLog();
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
const shotParam = params.get("camera") as PresetKind | null;
const fixedTime = params.has("t") ? Number(params.get("t")) : undefined;
const view: GameView =
  sceneKind === "corsa"
    ? new RunView(canvas, game.map, layout, state, {
        reducedMotion,
        ...(shotParam && shotParam in PRESETS ? { shot: shotParam } : {}),
        ...(params.get("anteprima") ? { preview: params.get("anteprima")! } : {}),
        ...(fixedTime !== undefined && Number.isFinite(fixedTime) ? { fixedTime } : {}),
      })
    : new CityView(canvas, game.map, layout, state, {
        reducedMotion,
        revealAll,
        occlusion: occlusionEnabled,
        sectors: sectorsEnabled ? (forcedSectorRadius ?? "calcolato") : "off",
        overview: params.get("view") === "overview",
      });
// Intervento d'apertura di Bafometto, solo per una partita nuova.
if (!resumed && steps === 0 && !revealAll && params.get("intro") !== "off") view.intro();

/** Timer della domanda visibile (la domanda stessa è nel registro). */
let question: { key: string; timer: QuestionTimer } | null = null;
let die: { value: number; hideAt: number | null } | null = null;
let toast: { text: string; until: number } | null = resumed
  ? { text: "Partita ripresa", until: 2.5 }
  : storageNotice || bankNotice
    ? { text: storageNotice ?? bankNotice!, until: 6 }
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
    // Schermata di avvio, precompilata con le impostazioni di questa partita.
    location.search = "?new=1";
  },
});

/** Unica via per modificare lo stato: azione del motore, poi regia degli eventi. */
function perform(action: GameAction): void {
  if (view.busy || state.phase === "ended") return;
  const result = applyAction(game.map, state, action);
  state = result.state;
  persist();
  for (const event of result.events) if (event.type === "diceRolled") die = { value: event.value, hideAt: null };
  view.enqueue(result.events, state);
  // Le clip istantanee (movimento ridotto) si completano subito; quelle animate partono soltanto.
  view.update(0);
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
  if (!question || state.phase !== "question" || view.busy) return;
  questionLog = recordAnswer(questionLog, question.key, given);
  storeLog();
  question = null;
  if (!drawing) draw(0);
}

function proceed(): void {
  if (state.phase !== "question" || view.busy) return;
  const current = activeQuestion();
  if (current.answer === null) return;
  perform({ type: "answer", outcome: outcomeOf(current) });
}

/** Pannello da mostrare: solo a regia ferma, quando la presentazione coincide con lo stato. */
function currentPanel(): Panel | null {
  if (view.suppressPanels || view.busy) return null;
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
        anchor: view.forkAnchor(active.cellId, option.to),
      }));
      return { kind: "fork", key: `f:${state.turn}:${active.cellId}:${state.stepsLeft}`, choices };
    }
    case "ended":
      return { kind: "ended", key: "end", winnerName: state.players.find((p) => p.id === state.winnerId)!.name };
  }
}

const ORDER = { "piu-breve": 0, intermedio: 1, "piu-lungo": 2 } as const;

let lastPanel: Panel | null = null;
/** Secondi trascorsi con la domanda corrente visibile (verifica del timer). */
let questionVisibleFor = 0;
let inset = 0;

let radar: RadarShapes | null = null;

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
  // Il pannello in basso non copre il giocatore: l'inquadratura si centra nell'area libera.
  const target = panelInset();
  inset = reducedMotion ? target : inset + (target - inset) * Math.min(1, seconds * 8);
  if (Math.abs(inset - target) < 0.5) inset = target;
  for (const line of view.takeAnnouncements()) {
    speech = { text: line.text, until: clock + 3.5 };
    spoken.push(line.moment);
  }
  if (speech && clock >= speech.until) speech = null;
  fade.style.opacity = String(view.fade);
  view.setQuestionOpen(lastPanel?.kind === "question");
  view.draw(seconds, state, inset);

  const panel = currentPanel();
  // Il timer scorre solo con la domanda visibile, a regia ferma e pagina in primo piano, e solo dal fotogramma
  // successivo alla sua comparsa: il tempo di questo fotogramma è trascorso prima che la domanda si vedesse.
  const shownBefore = lastPanel?.kind === "question" && panel?.kind === "question" && lastPanel.key === panel.key;
  questionVisibleFor = panel?.kind === "question" ? (shownBefore ? questionVisibleFor + seconds : 0) : 0;
  if (question && panel?.kind === "question" && shownBefore && question.timer.tick(seconds, !document.hidden)) answer("timeout");
  if (question && clock - lastClockSave >= 0.5) {
    saveQuestionClock(storage, question.key, question.timer.remaining);
    lastClockSave = clock;
  }
  if (die) {
    if (!view.busy) die.hideAt ??= clock + 1.2;
    if (die.hideAt !== null && clock >= die.hideAt) die = null;
  }
  if (toast && clock >= toast.until) toast = null;
  lastPanel = currentPanel();

  const hudState: HudState = {
    turn: state.turn,
    players: state.players.map((p, index) => ({ id: p.id, name: p.name, index, active: p.id === view.activePlayerId, escaped: p.escaped })),
    panel: lastPanel,
    die: die?.value ?? null,
    toast: toast?.text ?? null,
    speech: speech?.text ?? null,
    dev: `Prova non pubblicata · seme ${seed} · ${bank.title} · ${view.label}${reducedMotion ? " · movimento ridotto" : ""} · velocità ×${speed} · A automatico`,
  };
  hud.update(hudState);
  radar = hud.drawRadar(
    radarShapes(
      { pawns: view.pawns, players: state.players.map((p, index) => ({ id: p.id, index })), activePlayerId: view.activePlayerId, exit: layout.positions[game.map.exitId]! },
      hudRadarSize(),
    ),
  );

  Object.assign(window, {
    __hellscape3d: {
      ready: true,
      seed,
      turn: state.turn,
      phase: state.phase,
      reducedMotion,
      busy: view.busy,
      panel: lastPanel?.kind ?? null,
      timer: question ? { remaining: question.timer.remaining, total: question.timer.duration } : null,
      correctIndex: testHooks && lastPanel?.kind === "question" ? lastPanel.question.correctIndex : undefined,
      bankId: bank.id,
      questionId: lastPanel?.kind === "question" || lastPanel?.kind === "feedback" ? lastPanel.question.id : null,
      questionText: lastPanel?.kind === "question" || lastPanel?.kind === "feedback" ? lastPanel.question.text : null,
      questionTopic: lastPanel?.kind === "question" || lastPanel?.kind === "feedback" ? lastPanel.question.topic : null,
      topics: questionLog.topics,
      playerNames: state.players.map((p) => p.name),
      outcome: lastPanel?.kind === "feedback" ? outcomeOf(lastPanel.question) : null,
      askedCount: questionLog.asked.length,
      forkChoices: lastPanel?.kind === "fork" ? lastPanel.choices.map((c) => ({ number: c.number, to: c.to, anchored: c.anchor !== null })) : [],
      activePlayerId: view.activePlayerId,
      stateActivePlayerId: state.players[state.activeIndex]!.id,
      explored: [...state.explored],
      radar: radar && {
        players: radar.players.map((p) => ({ id: p.id, active: p.active, onEdge: p.onEdge, x: p.x, y: p.y })),
        exit: radar.exit !== null,
        center: radar.center,
      },
      resumed,
      timerRemaining: question?.timer.remaining ?? null,
      questionVisibleFor,
      spoken: [...spoken],
      speech: speech?.text ?? null,
      inset,
      panelTop: panelInset() > 0 ? window.innerHeight - panelInset() : null,
      cellPositions: Object.fromEntries(state.players.map((p) => [p.id, layout.positions[p.cellId]])),
      playerCells: Object.fromEntries(state.players.map((p) => [p.id, p.cellId])),
      stepsLeft: state.stepsLeft,
      fade: view.fade,
      totalCells: Object.keys(game.map.cells).length,
      ...view.debug(),
    },
  });
}

function hudRadarSize(): number {
  const element = document.querySelector<HTMLElement>(".hud-radar")!;
  return Math.min(element.clientWidth, element.clientHeight);
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
    if (view.busy) {
      view.skip();
      draw(0);
    }
    if (event.code === "Space") event.preventDefault();
  } else if (event.code === "KeyF") speed = speed === 1 ? 3 : 1;
  else if (event.code === "KeyV") view.toggleMode();
  else if (event.code === "KeyA" && !view.busy && state.phase !== "ended") {
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
  view.update(Math.min(0.25, elapsed) * speed);
  draw(Math.min(1, elapsed));
  requestAnimationFrame(loop);
}
draw(0);
requestAnimationFrame(loop);
