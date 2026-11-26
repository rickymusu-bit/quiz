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
function readyToRoll(game: Game, cellId: string, value: number): GameState {
  const state = structuredClone(game.state);
  state.players[state.activeIndex]!.cellId = cellId;
  if (!state.explored.includes(cellId)) state.explored = [...state.explored, cellId].sort();
  state.phase = "roll";
  state.questionDifficulty = game.map.cells[cellId]!.difficulty;
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

test("bivio attraversato avanzando: sospensione, scelta senza domanda, il bivio non conta come passo", () => {
  const { game } = newGame();
  // Le alternative sono indicizzate dalla casella che precede il bivio.
  const [beforeFork, options] = Object.entries(game.map.options)[0]!;
  const start = readyToRoll(game, predecessor(game, beforeFork), 4);
  const first = applyAction(game.map, start, { type: "roll" });
  assert.deepEqual(types(first.events).filter((t) => t !== "explored"), ["diceRolled", "moved", "branchChoiceRequested"]);
  assert.deepEqual(first.events.at(-1), { type: "branchChoiceRequested", playerId: "a", cellId: beforeFork, stepsLeft: 3 });
  assert.equal(first.state.phase, "fork");
  assert.equal(first.state.stepsLeft, 3);
  assert.equal(first.state.players[0]!.cellId, beforeFork, "un passo: dalla casella precedente a quella prima del bivio");
  for (const option of options) assert.ok(first.state.explored.includes(option.to), "alternative visibili al bivio");

  assert.throws(() => applyAction(game.map, first.state, { type: "chooseBranch", to: "inesistente" }), GameRuleError);
  assert.throws(() => applyAction(game.map, first.state, { type: "roll" }), GameRuleError);
  for (const option of options) {
    const second = applyAction(game.map, first.state, { type: "chooseBranch", to: option.to });
    assert.ok(!second.events.some((e) => e.type === "questionRequested" && e.playerId === "a"), "scelta senza domanda");
    const path = second.events.filter((e) => e.type === "moved").flatMap((e) => e.path);
    // Con il dado 4: un passo fino alla casella prima del bivio, tre sul ramo scelto.
    assert.equal(path[0], option.to);
    assert.equal(path.length, 3);
    assert.equal(second.state.committedBranch, null);
    // Tratti percorsi: uno per passo, consecutivi, compreso quello che attraversa il bivio.
    const walked = [beforeFork, ...path];
    for (let k = 1; k < walked.length; k++) assert.ok(second.state.traversed.includes(`${walked[k - 1]}>${walked[k]}`));
    for (const other of options) if (other.to !== option.to) assert.ok(!second.state.traversed.includes(`${beforeFork}>${other.to}`), "ramo non imboccato registrato");
    assert.equal(second.state.activeIndex, 1);
  }
});

test("avanzamento che termina prima del bivio: nessuna scelta fino all'avanzamento successivo", () => {
  const { game } = newGame();
  const [beforeFork, options] = Object.entries(game.map.options)[0]!;
  const landed = applyAction(game.map, readyToRoll(game, predecessor(game, beforeFork), 1), { type: "roll" });
  assert.equal(landed.state.players[0]!.cellId, beforeFork);
  assert.ok(!landed.events.some((e) => e.type === "branchChoiceRequested"));
  assert.equal(landed.state.activeIndex, 1);

  // Al turno successivo: domanda della difficoltà della casella, poi scelta al primo passo.
  const back = applyAction(game.map, landed.state, { type: "answer", outcome: "wrong" });
  assert.equal(back.state.phase, "question");
  assert.equal(back.state.questionDifficulty, game.map.cells[beforeFork]!.difficulty);
  const wrong = applyAction(game.map, back.state, { type: "answer", outcome: "wrong" });
  assert.equal(wrong.state.players[0]!.cellId, beforeFork, "dopo un errore resta sulla casella, senza scelta in sospeso");
  const rolled = play({ map: game.map, state: back.state }, [{ type: "answer", outcome: "correct" }, { type: "roll" }]);
  assert.equal(rolled.state.phase, "fork");
  assert.equal(rolled.state.players[0]!.cellId, beforeFork);
  assert.equal(rolled.state.stepsLeft, rolled.events.find((e) => e.type === "diceRolled")!.value, "il bivio non consuma passi");
  const chose = applyAction(game.map, rolled.state, { type: "chooseBranch", to: options[1]!.to });
  assert.equal(chose.events.find((e) => e.type === "moved")!.path[0], options[1]!.to);
});

test("effetti soltanto sulla casella d'arrivo, non su quelle attraversate", () => {
  const { game } = newGame("speciali");
  const special = Object.values(game.map.cells).find(
    (c) =>
      c.special !== null &&
      c.next.length === 1 &&
      game.map.cells[c.next[0]!]!.kind === "path" &&
      game.map.cells[predecessor(game, c.id)]!.kind === "path" &&
      game.map.cells[predecessor(game, c.id)]!.next.length === 1,
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

test("partite complete deterministiche, con domande della difficoltà della casella e scelte solo avanzando", () => {
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
          assert.equal(event.difficulty, cell.difficulty);
        }
      }
      for (const event of result.events) {
        if (event.type === "branchChoiceRequested") assert.ok(event.stepsLeft > 0 && game.map.options[event.cellId], "scelta fuori da un avanzamento");
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
