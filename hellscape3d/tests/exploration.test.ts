import assert from "node:assert/strict";
import { test } from "node:test";
import { applyAction, publicView, type Game, type GameState, type PublicView } from "../src/logic/index.ts";
import { autoAction, newGame } from "./helpers.ts";

const FORBIDDEN_KEYS = ["distanceToExit", "seed", "fingerprint", "config", "dice", "difficultyOfCells", "options", "answerProfile"];

function keysOf(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => keysOf(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      out.add(k);
      keysOf(v, out);
    }
  }
  return out;
}

function assertNoLeak(game: Game, state: GameState, view: PublicView): void {
  const explored = new Set(state.explored);
  const ids = view.cells.map((c) => c.id);
  assert.deepEqual(ids, state.explored);
  for (const cell of view.cells) for (const to of cell.next) assert.ok(explored.has(to));
  for (const player of view.players) assert.ok(explored.has(player.cellId));
  if (view.forkOptions) for (const option of view.forkOptions) {
    assert.ok(explored.has(option.to));
    assert.deepEqual(Object.keys(option).sort(), ["difficulty", "relative", "to"]);
  }
  const keys = keysOf(view);
  for (const key of FORBIDDEN_KEYS) assert.ok(!keys.has(key), `chiave esposta: ${key}`);
  // L'uscita compare solo se già esplorata.
  assert.equal(view.cells.some((c) => c.kind === "exit"), explored.has(game.map.exitId));
}

test("la vista iniziale mostra solo la zona di partenza", () => {
  const { game } = newGame();
  const view = publicView(game.map, game.state);
  assertNoLeak(game, game.state, view);
  assert.ok(!view.cells.some((c) => c.kind === "exit"));
  assert.ok(view.cells.some((c) => c.continuesIntoFog), "il percorso prosegue nella nebbia");
  assert.ok(view.cells.length <= 1 + 2 * 3, "visibilità limitata");
  assert.equal(view.forkOptions, null);
});

test("durante una partita intera nessuna vista rivela celle inesplorate o distanze", () => {
  for (const seed of ["nebbia-1", "nebbia-2", "nebbia-3"]) {
    const { game, events } = newGame(seed);
    let state = game.state;
    const announced = new Set(events.flatMap((e) => (e.type === "explored" ? e.cellIds : [])));
    let previous = state.explored.length;
    while (state.phase !== "ended") {
      const result = applyAction(game.map, state, autoAction(game, state, seed.endsWith("2") ? "piu-lungo" : "piu-breve"));
      state = result.state;
      for (const event of result.events) if (event.type === "explored") event.cellIds.forEach((id) => announced.add(id));
      assert.ok(state.explored.length >= previous, "l'esplorazione non regredisce");
      previous = state.explored.length;
      assertNoLeak(game, state, publicView(game.map, state));
    }
    assert.deepEqual([...announced].sort(), state.explored, "gli eventi annunciano ogni cella esplorata");
    assert.ok(state.explored.length < Object.keys(game.map.cells).length, "a fine partita restano zone inesplorate");
  }
});

test("al bivio le alternative espongono solo lunghezza relativa e difficoltà", () => {
  const { game } = newGame();
  let state = game.state;
  while (state.phase !== "fork") state = applyAction(game.map, state, autoAction(game, state)).state;
  const view = publicView(game.map, state);
  assert.ok(view.forkOptions && view.forkOptions.length >= 2);
  const relatives = view.forkOptions.map((o) => o.relative);
  assert.ok(relatives.includes("piu-breve") && relatives.includes("piu-lungo"));
  assertNoLeak(game, state, view);
});

test("l'esplorazione è collettiva: la vista è la stessa per tutti i giocatori", () => {
  const { game } = newGame();
  let state = game.state;
  for (let i = 0; i < 6 && state.phase !== "ended"; i++) state = applyAction(game.map, state, autoAction(game, state)).state;
  const view = publicView(game.map, state);
  const ids = new Set(view.cells.map((c) => c.id));
  for (const player of state.players) assert.ok(ids.has(player.cellId));
});
