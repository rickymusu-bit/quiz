/**
 * Simulazioni Monte Carlo sul motore reale, per verificare che nessuna
 * strategia di scelta ai bivi domini in modo manifesto.
 */
import { applyAction, startGame } from "./engine.ts";
import { rngFromSeed, type Rng } from "./rng.ts";
import type { CityMap, ForkOption } from "./types.ts";
import type { AnswerProfile } from "./balance.ts";

export type BranchStrategy = (options: readonly ForkOption[], rng: Rng) => string;

export const STRATEGIES: Readonly<Record<"shortest" | "longest" | "random", BranchStrategy>> = {
  shortest: (options) => options.find((o) => o.relative === "piu-breve")!.to,
  longest: (options) => options.find((o) => o.relative === "piu-lungo")!.to,
  random: (options, rng) => rng.pick(options).to,
};

/** Turni impiegati da un giocatore solitario per uscire. */
export function simulateEscape(
  map: CityMap,
  strategy: BranchStrategy,
  profile: AnswerProfile,
  run: number,
  maxTurns = 1000,
): number {
  const rng = rngFromSeed(map.seed, `simulation:${run}`);
  let { state } = startGame(map, [{ id: "solo", name: "Solo" }], { diceStream: `simulation-dice:${run}` });
  while (state.phase !== "ended") {
    if (state.turn > maxTurns) throw new Error("Simulazione senza fine");
    switch (state.phase) {
      case "fork":
        state = applyAction(map, state, { type: "chooseBranch", to: strategy(map.options[state.players[0]!.cellId]!, rng) }).state;
        break;
      case "question":
        state = applyAction(map, state, { type: "answer", outcome: rng.chance(profile[state.questionDifficulty!]) ? "correct" : "wrong" }).state;
        break;
      case "roll":
        state = applyAction(map, state, { type: "roll" }).state;
        break;
    }
  }
  return state.turn;
}

export function meanEscapeTurns(map: CityMap, strategy: BranchStrategy, profile: AnswerProfile, runs: number): number {
  let total = 0;
  for (let run = 0; run < runs; run++) total += simulateEscape(map, strategy, profile, run);
  return total / runs;
}
