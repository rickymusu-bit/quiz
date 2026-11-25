/** Stato di gioco serializzabile, azioni ed eventi del motore. */
import type { RngState } from "./rng.ts";
import type { Difficulty } from "./types.ts";

export type GamePhase = "fork" | "question" | "roll" | "ended";
export type AnswerOutcome = "correct" | "wrong" | "timeout";

export interface RulesConfig {
  /** Passi visibili in avanti da ogni casella attraversata (minimo 1: le alternative di un bivio sono sempre visibili). */
  sightRange: number;
}

export interface PlayerState {
  id: string;
  name: string;
  cellId: string;
  escaped: boolean;
}

export interface GameState {
  format: "hellscape3d-state";
  rules: RulesConfig;
  players: PlayerState[];
  activeIndex: number;
  /** Turni iniziati dall'avvio della partita, per tutti i giocatori. */
  turn: number;
  phase: GamePhase;
  /** Bivio a inizio turno (scelta prima della domanda) o durante l'avanzamento. */
  forkContext: "turn-start" | "movement" | null;
  /** Ramo scelto a inizio turno, da imboccare al primo passo dopo il dado. */
  committedBranch: string | null;
  questionDifficulty: Difficulty | null;
  stepsLeft: number;
  lastRoll: number | null;
  /** Celle esplorate collettivamente, ordinate. */
  explored: string[];
  /** Stato del flusso pseudocasuale del dado. */
  dice: RngState;
  winnerId: string | null;
}

export type GameAction =
  | { type: "chooseBranch"; to: string }
  | { type: "answer"; outcome: AnswerOutcome }
  | { type: "roll" };

/** Eventi per regia, HUD e audio. Non contengono informazioni nascoste. */
export type GameEvent =
  | { type: "turnStarted"; turn: number; playerId: string; cellId: string }
  | { type: "branchChoiceRequested"; playerId: string; cellId: string; context: "turn-start" | "movement" }
  | { type: "branchChosen"; playerId: string; cellId: string; to: string }
  | { type: "questionRequested"; playerId: string; difficulty: Difficulty }
  | { type: "answerResolved"; playerId: string; outcome: AnswerOutcome }
  | { type: "diceRolled"; playerId: string; value: number }
  | { type: "moved"; playerId: string; path: string[] }
  | { type: "explored"; cellIds: string[] }
  | { type: "arrived"; playerId: string; cellId: string; special: string | null }
  | { type: "escaped"; playerId: string }
  | { type: "turnEnded"; playerId: string }
  | { type: "gameEnded"; winnerId: string };
