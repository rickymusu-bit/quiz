/**
 * Nebbia di guerra ed esplorazione collettiva.
 *
 * Le aree esplorate sono uno stato esplicito e condiviso. La vista pubblica è
 * l'unica fonte per HUD, minimappa e regia: non contiene distanze, seed,
 * posizione dell'uscita non ancora vista né celle inesplorate.
 */
import { forwardWithin } from "./graph.ts";
import type { GamePhase, GameState } from "./state.ts";
import type { CellKind, CityMap, Difficulty, RelativeLength } from "./types.ts";

/** Aggiunge le celle visibili da `fromId`; restituisce soltanto quelle nuove, in ordine stabile. */
export function reveal(map: CityMap, explored: string[], fromId: string, sightRange: number): string[] {
  const known = new Set(explored);
  const added = forwardWithin(map.cells, fromId, sightRange).filter((id) => !known.has(id));
  explored.push(...added);
  explored.sort();
  return added;
}

/** Tratto percorso `da>a` scomposto. */
export function splitEdge(edge: string): [string, string] {
  const i = edge.indexOf(">");
  return [edge.slice(0, i), edge.slice(i + 1)];
}

/** Caselle percorse da almeno un giocatore: la partenza e gli arrivi dei tratti percorsi, ordinate. */
export function visitedCells(startId: string, traversed: readonly string[]): string[] {
  return [...new Set([startId, ...traversed.map((edge) => splitEdge(edge)[1])])].sort();
}

export interface PublicCell {
  id: string;
  kind: CellKind;
  district: string;
  special: string | null;
  /** Soltanto archi verso celle già esplorate. */
  next: string[];
  /** Il percorso prosegue in una zona non ancora esplorata. */
  continuesIntoFog: boolean;
}

export interface PublicForkOption {
  to: string;
  relative: RelativeLength;
  difficulty: Difficulty;
}

export interface PublicView {
  themeId: string;
  turn: number;
  phase: GamePhase;
  activePlayerId: string;
  players: { id: string; name: string; cellId: string; escaped: boolean }[];
  cells: PublicCell[];
  forkOptions: PublicForkOption[] | null;
  questionDifficulty: Difficulty | null;
  lastRoll: number | null;
  stepsLeft: number;
  winnerId: string | null;
}

export function publicView(map: CityMap, state: GameState): PublicView {
  const explored = new Set(state.explored);
  const active = state.players[state.activeIndex]!;
  const cells = state.explored.map((id): PublicCell => {
    const cell = map.cells[id]!;
    return {
      id,
      kind: cell.kind,
      district: cell.district,
      special: cell.special,
      next: cell.next.filter((to) => explored.has(to)),
      continuesIntoFog: cell.next.some((to) => !explored.has(to)),
    };
  });
  const forkOptions =
    state.phase === "fork"
      ? map.options[active.cellId]!.map(({ to, relative, difficulty }) => ({ to, relative, difficulty }))
      : null;
  return {
    themeId: map.themeId,
    turn: state.turn,
    phase: state.phase,
    activePlayerId: active.id,
    players: state.players.map(({ id, name, cellId, escaped }) => ({ id, name, cellId, escaped })),
    cells,
    forkOptions,
    questionDifficulty: state.questionDifficulty,
    lastRoll: state.lastRoll,
    stepsLeft: state.stepsLeft,
    winnerId: state.winnerId,
  };
}
