import type { Game, GameAction, GameEvent, GameState } from "../src/logic/index.ts";
import { applyAction, createGame } from "../src/logic/index.ts";

export const TWO_PLAYERS = [
  { id: "a", name: "Dannato A" },
  { id: "b", name: "Dannato B" },
];

export function newGame(seed = "test-seed"): { game: Game; events: GameEvent[] } {
  return createGame({ seed, players: TWO_PLAYERS });
}

/** Applica una sequenza di azioni accumulando gli eventi. */
export function play(game: Game, actions: readonly GameAction[]): { state: GameState; events: GameEvent[] } {
  let state = game.state;
  const events: GameEvent[] = [];
  for (const action of actions) {
    const result = applyAction(game.map, state, action);
    state = result.state;
    events.push(...result.events);
  }
  return { state, events };
}

/** Prossima azione di una partita automatica: risposte sempre corrette, ramo indicato dalla strategia. */
export function autoAction(game: Game, state: GameState, branch: "piu-breve" | "piu-lungo" = "piu-breve"): GameAction {
  switch (state.phase) {
    case "fork": {
      const cellId = state.players[state.activeIndex]!.cellId;
      return { type: "chooseBranch", to: game.map.options[cellId]!.find((o) => o.relative === branch)!.to };
    }
    case "question":
      return { type: "answer", outcome: "correct" };
    case "roll":
      return { type: "roll" };
    case "ended":
      throw new Error("Partita conclusa");
  }
}
