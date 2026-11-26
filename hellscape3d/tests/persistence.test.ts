import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SAVE_KEY,
  SaveError,
  applyAction,
  deserializeGame,
  loadFromStorage,
  saveToStorage,
  serializeGame,
  type Game,
  type GameState,
  type KeyValueStorage,
} from "../src/logic/index.ts";
import { autoAction, newGame } from "./helpers.ts";

function advance(game: Game, steps: number): GameState {
  let state = game.state;
  for (let i = 0; i < steps && state.phase !== "ended"; i++) state = applyAction(game.map, state, autoAction(game, state)).state;
  return state;
}

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

test("il ricaricamento conserva mondo, progressi e sequenza dei dadi", () => {
  const { game } = newGame("ripresa");
  const mid: Game = { map: game.map, state: advance(game, 17) };
  const restored = deserializeGame(serializeGame(mid));
  assert.deepEqual(restored.map, game.map);
  assert.deepEqual(restored.state, mid.state);
  // Proseguendo, la partita ripresa e quella originale restano identiche.
  assert.deepEqual(advance(restored, 40), advance(mid, 40));
});

test("il ricaricamento conserva una scelta al bivio in attesa, con i passi residui", () => {
  const { game } = newGame("ripresa-bivio");
  let state = game.state;
  while (state.phase !== "fork") state = applyAction(game.map, state, autoAction(game, state)).state;
  const restored = deserializeGame(serializeGame({ map: game.map, state }));
  assert.deepEqual(restored.state, state);
  assert.ok(restored.state.stepsLeft > 0);
  const option = game.map.options[state.players[state.activeIndex]!.cellId]![0]!;
  assert.deepEqual(applyAction(restored.map, restored.state, { type: "chooseBranch", to: option.to }), applyAction(game.map, state, { type: "chooseBranch", to: option.to }));
});

test("salvataggio in una chiave dedicata, senza toccare i salvataggi del runner", () => {
  const legacy = JSON.stringify({ version: "3.0.0", players: [{ name: "x", score: 10 }] });
  const storage = memoryStorage({ "fool-v1": legacy, "fool-settings-v1": "{}" });
  assert.equal(loadFromStorage(storage), null);
  const { game } = newGame();
  saveToStorage(storage, game);
  assert.ok(storage.data.has(SAVE_KEY));
  assert.equal(storage.data.get("fool-v1"), legacy);
  assert.equal(storage.data.get("fool-settings-v1"), "{}");
  assert.deepEqual(loadFromStorage(storage), game);
});

test("salvataggi incompatibili o manomessi rifiutati esplicitamente", () => {
  const { game } = newGame();
  const good = JSON.parse(serializeGame(game));
  const variant = (change: (save: any) => void): string => {
    const copy = structuredClone(good);
    change(copy);
    return JSON.stringify(copy);
  };
  const cases: [string, string | RegExp][] = [
    ["{", /illeggibile/],
    [JSON.stringify({ version: "3.0.0", players: [] }), /Non è un salvataggio/],
    // Formato precedente, con il bivio come casella e `forkContext` nello stato.
    [variant((s) => ((s.saveVersion = 1), (s.generatorVersion = "1.0.0"), (s.state.forkContext = null))), /Versione del salvataggio/],
    [variant((s) => (s.saveVersion = 4)), /Versione del salvataggio/],
    [variant((s) => (s.generatorVersion = "0.9.0")), /generatore/],
    [variant((s) => (s.seed = "altro")), /non corrisponde/],
    [variant((s) => (s.generatorConfig.dieFaces = 8)), /non corrisponde/],
    [variant((s) => (s.themeId = "inesistente")), /ricostruire/],
    [variant((s) => (s.state.players[0].cellId = "zz")), /casella inesistente/],
    [variant((s) => (s.state.phase = "volo")), /fase sconosciuta/],
    [variant((s) => (s.state.activeIndex = 5)), /giocatore attivo/],
    [variant((s) => (s.state.dice = [1, 2])), /dado/],
    [variant((s) => (s.state.winnerId = "a")), /conclusa/],
    [variant((s) => (s.state.committedBranch = s.state.players[0].cellId)), /ramo impegnato/],
    [variant((s) => ((s.state.phase = "fork"), (s.state.stepsLeft = 2))), /fuori da un bivio/],
    [variant((s) => (s.saveVersion = 2)), /Versione del salvataggio/],
    [variant((s) => delete s.state.traversed), /tratti percorsi/],
    [variant((s) => (s.state.traversed = [`${s.state.players[0].cellId}>zz`])), /tratti percorsi/],
    [variant((s) => (s.state.players[1].cellId = s.state.explored.find((id: string) => id !== s.state.players[1].cellId))), /non percorsa/],
  ];
  for (const [json, message] of cases) {
    assert.throws(() => deserializeGame(json), (error: unknown) => error instanceof SaveError && (typeof message === "string" ? error.message.includes(message) : message.test(error.message)), json.slice(0, 80));
  }
});
