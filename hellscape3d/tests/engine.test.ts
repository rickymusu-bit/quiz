import assert from "node:assert/strict";
import { test } from "node:test";
import { GameRuleError, applyAction, rngFromSeed, type Game, type GameEvent, type GameState, type RngState } from "../src/logic/index.ts";
import { autoAction, newGame, play } from "./helpers.ts";

/** Stato del dado che produce `value` al prossimo lancio. */
function diceFor(value: number): RngState {
  for (let i = 0; ; i++) {
    const rng = rngFromSeed("dice-search", String(i));
    const state = rng.snapshot();
    if (rng.int(1, 6) === value) return state;
  }
}

function predecessor(game: Game, id: string): string {
  return Object.values(game.map.cells).find((c) => c.next.includes(id))!.id;
}

/** Stato in cui il giocatore attivo sta per lanciare il dado da `cellId`. */
function readyToRoll(game: Game, cellId: string, value: number, committedBranch: string | null = null): GameState {
  const state = structuredClone(game.state);
  state.players[state.activeIndex]!.cellId = cellId;
  if (!state.explored.includes(cellId)) state.explored = [...state.explored, cellId].sort();
  state.phase = "roll";
  state.questionDifficulty = "media";
  state.committedBranch = committedBranch;
  state.dice = diceFor(value);
  return state;
}

const types = (events: readonly GameEvent[]): string[] => events.map((e) => e.type);

test("avvio: esplorazione iniziale e domanda del primo giocatore", () => {
  const { game, events } = newGame();
  assert.deepEqual(types(events), ["explored", "turnStarted", "questionRequested"]);
  assert.equal(game.state.phase, "question");
  assert.equal(game.state.turn, 1);
  assert.equal(game.state.questionDifficulty, game.map.cells[game.map.startId]!.difficulty);
  assert.ok(game.state.explored.includes(game.map.startId));
  assert.ok(game.state.players.every((p) => p.cellId === game.map.startId && !p.escaped));
});

test("risposta errata o tempo scaduto: nessun movimento, turno al giocatore successivo", () => {
  const { game } = newGame();
  for (const outcome of ["wrong", "timeout"] as const) {
    const { state, events } = applyAction(game.map, game.state, { type: "answer", outcome });
    assert.deepEqual(types(events), ["answerResolved", "turnEnded", "turnStarted", "questionRequested"]);
    assert.equal(state.players[0]!.cellId, game.map.startId);
    assert.equal(state.activeIndex, 1);
    assert.equal(state.turn, 2);
  }
});

test("risposta corretta, dado e avanzamento del numero di passi", () => {
  const { game } = newGame();
  const { state, events } = play(game, [{ type: "answer", outcome: "correct" }, { type: "roll" }]);
  const rolled = events.find((e) => e.type === "diceRolled");
  assert.ok(rolled && rolled.value >= 1 && rolled.value <= 6);
  const moved = events.filter((e) => e.type === "moved").flatMap((e) => e.path);
  const arrived = events.filter((e) => e.type === "arrived");
  assert.equal(arrived.length, 1);
  if (state.phase !== "fork") {
    assert.equal(moved.length, rolled.value);
    assert.equal(arrived[0]!.cellId, moved[moved.length - 1]);
    assert.equal(state.activeIndex, 1);
  }
});

test("le azioni non modificano lo stato ricevuto", () => {
  const { game } = newGame();
  const before = structuredClone(game.state);
  play(game, [{ type: "answer", outcome: "correct" }, { type: "roll" }]);
  assert.deepEqual(game.state, before);
});

test("azioni fuori fase rifiutate: nessuna doppia risoluzione", () => {
  const { game } = newGame();
  const afterAnswer = applyAction(game.map, game.state, { type: "answer", outcome: "correct" }).state;
  assert.throws(() => applyAction(game.map, afterAnswer, { type: "answer", outcome: "correct" }), GameRuleError);
  assert.throws(() => applyAction(game.map, game.state, { type: "roll" }), GameRuleError);
  assert.throws(() => applyAction(game.map, game.state, { type: "chooseBranch", to: game.map.startId }), GameRuleError);
  assert.throws(() => applyAction(game.map, game.state, { type: "answer", outcome: "boh" as never }), GameRuleError);
});

test("bivio attraversato durante l'avanzamento: sospensione, scelta e passi residui", () => {
  const { game } = newGame();
  const [forkId, options] = Object.entries(game.map.options)[0]!;
  const start = readyToRoll(game, predecessor(game, forkId), 4);
  const first = applyAction(game.map, start, { type: "roll" });
  assert.deepEqual(types(first.events).filter((t) => t !== "explored"), ["diceRolled", "moved", "branchChoiceRequested"]);
  assert.equal(first.state.phase, "fork");
  assert.equal(first.state.forkContext, "movement");
  assert.equal(first.state.stepsLeft, 3);
  assert.equal(first.state.players[0]!.cellId, forkId);
  for (const option of options) assert.ok(first.state.explored.includes(option.to), "alternative visibili al bivio");

  assert.throws(() => applyAction(game.map, first.state, { type: "chooseBranch", to: "inesistente" }), GameRuleError);
  const chosen = options[0]!.to;
  const second = applyAction(game.map, first.state, { type: "chooseBranch", to: chosen });
  const path = second.events.filter((e) => e.type === "moved").flatMap((e) => e.path);
  assert.equal(path[0], chosen);
  assert.equal(path.length, 3);
  assert.equal(second.state.activeIndex, 1);
});

test("arrivo esatto sul bivio: scelta a inizio turno, poi domanda della difficoltà del ramo", () => {
  const { game } = newGame();
  const [forkId, options] = Object.entries(game.map.options)[0]!;
  const landed = applyAction(game.map, readyToRoll(game, predecessor(game, forkId), 1), { type: "roll" });
  assert.equal(landed.state.players[0]!.cellId, forkId);
  assert.equal(landed.state.activeIndex, 1);

  // Il secondo giocatore sbaglia: torna il turno al primo, fermo sul bivio.
  const back = applyAction(game.map, landed.state, { type: "answer", outcome: "wrong" });
  assert.equal(back.state.phase, "fork");
  assert.equal(back.state.forkContext, "turn-start");
  assert.deepEqual(back.events.at(-1), { type: "branchChoiceRequested", playerId: "a", cellId: forkId, context: "turn-start" });

  for (const option of options) {
    const chose = applyAction(game.map, back.state, { type: "chooseBranch", to: option.to });
    assert.equal(chose.state.phase, "question");
    assert.equal(chose.state.questionDifficulty, option.difficulty);
    const moved = play({ map: game.map, state: chose.state }, [{ type: "answer", outcome: "correct" }, { type: "roll" }]);
    assert.equal(moved.events.find((e) => e.type === "moved")!.path[0], option.to);
  }

  // Errore dopo la scelta: il giocatore resta sul bivio e al turno successivo può cambiare ramo.
  const wrong = play({ map: game.map, state: back.state }, [
    { type: "chooseBranch", to: options[0]!.to },
    { type: "answer", outcome: "wrong" },
    { type: "answer", outcome: "wrong" },
  ]);
  assert.equal(wrong.state.players[0]!.cellId, forkId);
  assert.equal(wrong.state.committedBranch, null);
  assert.equal(applyAction(game.map, wrong.state, { type: "chooseBranch", to: options[1]!.to }).state.questionDifficulty, options[1]!.difficulty);
});

test("effetti soltanto sulla casella d'arrivo, non su quelle attraversate", () => {
  const { game } = newGame("speciali");
  const special = Object.values(game.map.cells).find(
    (c) => c.special !== null && game.map.cells[c.next[0]!]!.kind === "path" && game.map.cells[predecessor(game, c.id)]!.kind === "path",
  )!;
  const from = predecessor(game, special.id);
  const exact = applyAction(game.map, readyToRoll(game, from, 1), { type: "roll" });
  assert.deepEqual(
    exact.events.filter((e) => e.type === "arrived"),
    [{ type: "arrived", playerId: "a", cellId: special.id, special: special.special }],
  );
  const beyond = applyAction(game.map, readyToRoll(game, from, 2), { type: "roll" });
  const arrived = beyond.events.filter((e) => e.type === "arrived");
  assert.equal(arrived.length, 1);
  assert.equal(arrived[0]!.cellId, special.next[0]);
  assert.equal(arrived[0]!.special, game.map.cells[special.next[0]!]!.special);
});

test("uscita: il primo che esce vince, i passi in eccesso si perdono, la partita si chiude", () => {
  const { game } = newGame();
  const result = applyAction(game.map, readyToRoll(game, predecessor(game, game.map.exitId), 6), { type: "roll" });
  assert.deepEqual(types(result.events).slice(-3), ["arrived", "escaped", "gameEnded"]);
  assert.equal(result.state.phase, "ended");
  assert.equal(result.state.winnerId, "a");
  assert.equal(result.state.players[0]!.cellId, game.map.exitId);
  assert.equal(result.state.stepsLeft, 0);
  for (const action of [{ type: "roll" }, { type: "answer", outcome: "correct" }] as const) {
    assert.throws(() => applyAction(game.map, result.state, action), GameRuleError);
  }
});

test("partite complete deterministiche, con domande della difficoltà della casella", () => {
  const run = (branch: "piu-breve" | "piu-lungo") => {
    const { game, events } = newGame("completa");
    let state = game.state;
    const log = [...events];
    while (state.phase !== "ended") {
      if (state.turn > 500) throw new Error("partita senza fine");
      const result = applyAction(game.map, state, autoAction(game, state, branch));
      for (const event of result.events) {
        if (event.type === "questionRequested") {
          const player = result.state.players.find((p) => p.id === event.playerId)!;
          const cell = game.map.cells[player.cellId]!;
          const expected = cell.kind === "fork" ? game.map.cells[result.state.committedBranch!]!.difficulty : cell.difficulty;
          assert.equal(event.difficulty, expected);
        }
      }
      log.push(...result.events);
      state = result.state;
    }
    return { state, log };
  };
  for (const branch of ["piu-breve", "piu-lungo"] as const) {
    const a = run(branch);
    assert.deepEqual(run(branch), a);
    assert.ok(a.state.winnerId === "a" || a.state.winnerId === "b");
  }
});

test("giocatori non validi rifiutati", async () => {
  const { createGame } = await import("../src/logic/index.ts");
  assert.throws(() => createGame({ seed: "x", players: [] }), RangeError);
  assert.throws(() => createGame({ seed: "x", players: [{ id: "a", name: "A" }, { id: "a", name: "B" }] }), RangeError);
  assert.throws(() => createGame({ seed: "x", players: [{ id: "a", name: "A" }], rules: { sightRange: 0 } }), RangeError);
});
