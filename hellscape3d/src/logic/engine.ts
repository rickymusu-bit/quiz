/**
 * Motore dei turni: unica autorità sullo stato di gioco.
 *
 * Turno: domanda; se corretta, dado e avanzamento. Gli effetti si applicano
 * soltanto alla casella d'arrivo.
 *
 * Bivi (specifica §3): il bivio non è una casella ma il punto di passaggio
 * dopo una casella con più successive. Lo si attraversa soltanto avanzando:
 * l'avanzamento si sospende, il giocatore sceglie il ramo senza domanda e
 * prosegue con i passi residui. Il bivio non conta come passo e nessun
 * avanzamento vi termina.
 *
 * Regole PROVVISORIE, in attesa della specifica del regolamento (§10):
 * - la difficoltà della domanda è quella della casella su cui inizia il turno;
 * - risposta errata o tempo scaduto: nessun movimento;
 * - i passi oltre l'uscita vanno persi; vince il primo che esce;
 * - le caselle speciali producono l'evento d'arrivo ma non hanno ancora effetti.
 */
import { reveal } from "./exploration.ts";
import { generateCityMap, type GenerateOptions } from "./generator.ts";
import { randomSeed, rngFromSeed, rngFromState } from "./rng.ts";
import type { AnswerOutcome, GameAction, GameEvent, GameState, PlayerState, RulesConfig } from "./state.ts";
import { hasJunction } from "./graph.ts";
import type { CityMap, Difficulty } from "./types.ts";

export class GameRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameRuleError";
  }
}

export const DEFAULT_RULES: Readonly<RulesConfig> = Object.freeze({ sightRange: 2 });
export const MAX_PLAYERS = 6;

export interface Game {
  map: CityMap;
  state: GameState;
}

export interface Transition {
  state: GameState;
  events: GameEvent[];
}

export interface PlayerSetup {
  id: string;
  name: string;
}

export function resolveRules(partial: Partial<RulesConfig> = {}): RulesConfig {
  const rules = { ...DEFAULT_RULES, ...partial };
  if (!Number.isInteger(rules.sightRange) || rules.sightRange < 1 || rules.sightRange > 10) {
    throw new RangeError("Regole non valide: sightRange");
  }
  return rules;
}

/** Avvia una partita su una mappa già generata. `diceStream` distingue simulazioni sulla stessa mappa. */
export function startGame(
  map: CityMap,
  players: readonly PlayerSetup[],
  options: { rules?: Partial<RulesConfig>; diceStream?: string } = {},
): Transition {
  if (players.length < 1 || players.length > MAX_PLAYERS) throw new RangeError(`Da 1 a ${MAX_PLAYERS} giocatori`);
  const ids = players.map((p) => p.id);
  if (ids.some((id) => typeof id !== "string" || id.length === 0) || new Set(ids).size !== ids.length) {
    throw new RangeError("Identificativi dei giocatori mancanti o duplicati");
  }
  const rules = resolveRules(options.rules);
  const state: GameState = {
    format: "hellscape3d-state",
    rules,
    players: players.map(({ id, name }) => ({ id, name, cellId: map.startId, escaped: false })),
    activeIndex: 0,
    turn: 0,
    phase: "question",
    committedBranch: null,
    questionDifficulty: null,
    stepsLeft: 0,
    lastRoll: null,
    explored: [],
    dice: rngFromSeed(map.seed, options.diceStream ?? "dice").snapshot(),
    winnerId: null,
  };
  const events: GameEvent[] = [];
  const added = reveal(map, state.explored, map.startId, rules.sightRange);
  events.push({ type: "explored", cellIds: added });
  beginTurn(map, state, events);
  return { state, events };
}

/** Nuova partita: seed casuale se non indicato, mappa generata, primo turno avviato. */
export function createGame(options: {
  players: readonly PlayerSetup[];
  seed?: string;
  themeId?: string;
  generator?: GenerateOptions["config"];
  rules?: Partial<RulesConfig>;
}): { game: Game; events: GameEvent[] } {
  const generate: GenerateOptions = { seed: options.seed ?? randomSeed() };
  if (options.themeId !== undefined) generate.themeId = options.themeId;
  if (options.generator !== undefined) generate.config = options.generator;
  const map = generateCityMap(generate);
  const start = options.rules === undefined ? startGame(map, options.players) : startGame(map, options.players, { rules: options.rules });
  return { game: { map, state: start.state }, events: start.events };
}

/**
 * Applica un'azione e restituisce il nuovo stato. Lo stato ricevuto non viene
 * modificato; un'azione non ammessa nella fase corrente solleva GameRuleError.
 */
export function applyAction(map: CityMap, previous: GameState, action: GameAction): Transition {
  const state = structuredClone(previous);
  const events: GameEvent[] = [];
  const player = state.players[state.activeIndex]!;
  switch (action.type) {
    case "chooseBranch":
      chooseBranch(map, state, player, action.to, events);
      break;
    case "answer":
      answer(map, state, player, action.outcome, events);
      break;
    case "roll":
      roll(map, state, player, events);
      break;
    default:
      throw new GameRuleError(`Azione sconosciuta: ${(action as { type: unknown }).type}`);
  }
  return { state, events };
}

function expectPhase(state: GameState, phase: GameState["phase"], action: string): void {
  if (state.phase !== phase) throw new GameRuleError(`${action} non ammesso nella fase ${state.phase}`);
}

function beginTurn(map: CityMap, state: GameState, events: GameEvent[]): void {
  const player = state.players[state.activeIndex]!;
  state.turn += 1;
  state.committedBranch = null;
  state.questionDifficulty = null;
  state.stepsLeft = 0;
  state.lastRoll = null;
  events.push({ type: "turnStarted", turn: state.turn, playerId: player.id, cellId: player.cellId });
  askQuestion(state, player, map.cells[player.cellId]!.difficulty, events);
}

function askQuestion(state: GameState, player: PlayerState, difficulty: Difficulty, events: GameEvent[]): void {
  state.phase = "question";
  state.questionDifficulty = difficulty;
  events.push({ type: "questionRequested", playerId: player.id, difficulty });
}

function chooseBranch(map: CityMap, state: GameState, player: PlayerState, to: string, events: GameEvent[]): void {
  expectPhase(state, "fork", "La scelta del ramo");
  const option = map.options[player.cellId]?.find((o) => o.to === to);
  if (!option) throw new GameRuleError(`Ramo non disponibile da ${player.cellId}: ${to}`);
  events.push({ type: "branchChosen", playerId: player.id, cellId: player.cellId, to });
  state.committedBranch = to;
  move(map, state, player, events);
}

function answer(map: CityMap, state: GameState, player: PlayerState, outcome: AnswerOutcome, events: GameEvent[]): void {
  expectPhase(state, "question", "La risposta");
  if (outcome !== "correct" && outcome !== "wrong" && outcome !== "timeout") throw new GameRuleError(`Esito sconosciuto: ${String(outcome)}`);
  events.push({ type: "answerResolved", playerId: player.id, outcome });
  if (outcome === "correct") {
    state.phase = "roll";
  } else {
    endTurn(map, state, player, events);
  }
}

function roll(map: CityMap, state: GameState, player: PlayerState, events: GameEvent[]): void {
  expectPhase(state, "roll", "Il lancio del dado");
  const dice = rngFromState(state.dice);
  const value = dice.int(1, map.config.dieFaces);
  state.dice = dice.snapshot();
  state.lastRoll = value;
  state.stepsLeft = value;
  events.push({ type: "diceRolled", playerId: player.id, value });
  move(map, state, player, events);
}

/** Avanza fino a esaurire i passi o raggiungere l'uscita; a un bivio si sospende finché il ramo non è scelto. */
function move(map: CityMap, state: GameState, player: PlayerState, events: GameEvent[]): void {
  const path: string[] = [];
  const revealed: string[] = [];
  const flush = (): void => {
    if (path.length > 0) events.push({ type: "moved", playerId: player.id, path: path.splice(0) });
    if (revealed.length > 0) events.push({ type: "explored", cellIds: revealed.splice(0) });
  };
  while (state.stepsLeft > 0 && player.cellId !== map.exitId) {
    const cell = map.cells[player.cellId]!;
    let to: string;
    if (hasJunction(cell)) {
      if (state.committedBranch === null) {
        flush();
        state.phase = "fork";
        events.push({ type: "branchChoiceRequested", playerId: player.id, cellId: cell.id, stepsLeft: state.stepsLeft });
        return;
      }
      to = state.committedBranch;
      state.committedBranch = null;
    } else {
      to = cell.next[0]!;
    }
    player.cellId = to;
    state.stepsLeft -= 1;
    path.push(to);
    revealed.push(...reveal(map, state.explored, to, state.rules.sightRange));
  }
  flush();
  state.stepsLeft = 0;
  const arrival = map.cells[player.cellId]!;
  events.push({ type: "arrived", playerId: player.id, cellId: arrival.id, special: arrival.special });
  if (arrival.id === map.exitId) {
    player.escaped = true;
    state.phase = "ended";
    state.winnerId = player.id;
    events.push({ type: "escaped", playerId: player.id }, { type: "gameEnded", winnerId: player.id });
    return;
  }
  endTurn(map, state, player, events);
}

function endTurn(map: CityMap, state: GameState, player: PlayerState, events: GameEvent[]): void {
  events.push({ type: "turnEnded", playerId: player.id });
  state.activeIndex = (state.activeIndex + 1) % state.players.length;
  beginTurn(map, state, events);
}
