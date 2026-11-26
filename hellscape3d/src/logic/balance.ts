/**
 * Turni attesi per raggiungere l'uscita, calcolati esattamente con
 * programmazione dinamica sul grafo aciclico.
 *
 * Modello del turno: domanda con probabilità di successo p (dipendente dalla
 * difficoltà della casella di partenza o del ramo scelto al bivio); se corretta,
 * dado uniforme da 1 a `faces` e avanzamento; ai bivi attraversati il giocatore
 * sceglie l'alternativa migliore. Gli effetti delle caselle speciali non sono
 * ancora definiti e non entrano nel calcolo.
 */
import type { CellKind, Difficulty } from "./types.ts";
import { topologicalOrder } from "./graph.ts";

export interface BalanceCell {
  kind: CellKind;
  next: readonly string[];
  difficulty: Difficulty;
}

export interface BalanceGraph {
  exitId: string;
  cells: Readonly<Record<string, BalanceCell>>;
}

export type AnswerProfile = Readonly<Record<Difficulty, number>>;

/**
 * Caselle d'arrivo possibili da `fromId` con `steps` passi; `forced` impone il
 * primo passo (in tal caso `fromId` può anche non appartenere ancora al grafo).
 */
export function landingCells(graph: BalanceGraph, fromId: string, steps: number, forced: string | null = null): Set<string> {
  const out = new Set<string>();
  const walk = (id: string, left: number, first: string | null): void => {
    if (id === graph.exitId || left === 0) {
      out.add(id);
      return;
    }
    const next = first ? [first] : graph.cells[id]?.next;
    if (!next) throw new Error(`Cella inesistente: ${id}`);
    for (const to of next) walk(to, left - 1, null);
  };
  walk(fromId, steps, forced);
  return out;
}

/** Turni attesi partendo da `fromId` con probabilità di successo `p`, dati i valori a valle. */
export function turnValue(
  graph: BalanceGraph,
  values: ReadonlyMap<string, number>,
  fromId: string,
  p: number,
  faces: number,
  forced: string | null = null,
): number {
  let sum = 0;
  for (let roll = 1; roll <= faces; roll++) {
    let best = Infinity;
    for (const id of landingCells(graph, fromId, roll, forced)) {
      const value = values.get(id);
      if (value === undefined) throw new Error(`Valore non ancora calcolato per ${id}`);
      best = Math.min(best, value);
    }
    sum += best;
  }
  return (1 + p * (sum / faces)) / p;
}

/** Valori di ogni alternativa di un bivio (scelta impegnata a inizio turno). */
export function forkOptionValues(
  graph: BalanceGraph,
  values: ReadonlyMap<string, number>,
  forkId: string,
  profile: AnswerProfile,
  faces: number,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const to of graph.cells[forkId]!.next) {
    out.set(to, turnValue(graph, values, forkId, profile[graph.cells[to]!.difficulty], faces, to));
  }
  return out;
}

export function cellValue(
  graph: BalanceGraph,
  values: ReadonlyMap<string, number>,
  id: string,
  profile: AnswerProfile,
  faces: number,
): number {
  if (id === graph.exitId) return 0;
  const cell = graph.cells[id]!;
  if (cell.kind === "fork") return Math.min(...forkOptionValues(graph, values, id, profile, faces).values());
  return turnValue(graph, values, id, profile[cell.difficulty], faces);
}

export interface ExpectedTurns {
  cells: Map<string, number>;
  forks: Map<string, Map<string, number>>;
}

export function expectedTurns(graph: BalanceGraph, profile: AnswerProfile, faces: number): ExpectedTurns {
  const order = topologicalOrder(graph.cells);
  if (!order) throw new Error("Il grafo non è aciclico");
  const cells = new Map<string, number>();
  const forks = new Map<string, Map<string, number>>();
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i]!;
    if (graph.cells[id]!.kind === "fork") {
      const options = forkOptionValues(graph, cells, id, profile, faces);
      forks.set(id, options);
      cells.set(id, Math.min(...options.values()));
    } else {
      cells.set(id, cellValue(graph, cells, id, profile, faces));
    }
  }
  return { cells, forks };
}

export interface ForkBalance {
  forkId: string;
  /** Turni attesi dalla partenza imponendo ciascun ramo a questo bivio (scelta ottimale agli altri). */
  values: Map<string, number>;
  /** Differenza fra l'alternativa peggiore e la migliore. */
  gap: number;
}

/**
 * Competitività delle alternative di ogni bivio. Il ramo viene imposto sia a
 * chi inizia il turno sul bivio sia a chi lo attraversa durante l'avanzamento:
 * è il secondo caso, il più frequente, a favorire i rami difficili se le
 * lunghezze vengono bilanciate considerando soltanto il primo.
 */
export function forkBalance(graph: BalanceGraph, startId: string, profile: AnswerProfile, faces: number): ForkBalance[] {
  const out: ForkBalance[] = [];
  for (const [forkId, cell] of Object.entries(graph.cells)) {
    if (cell.kind !== "fork") continue;
    const values = new Map<string, number>();
    for (const to of cell.next) {
      const restricted: BalanceGraph = { exitId: graph.exitId, cells: { ...graph.cells, [forkId]: { ...cell, next: [to] } } };
      values.set(to, expectedTurns(restricted, profile, faces).cells.get(startId)!);
    }
    const all = [...values.values()];
    out.push({ forkId, values, gap: Math.max(...all) - Math.min(...all) });
  }
  return out;
}
