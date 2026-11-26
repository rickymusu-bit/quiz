/**
 * Turni attesi per raggiungere l'uscita, calcolati esattamente con
 * programmazione dinamica sul grafo aciclico.
 *
 * Modello del turno: domanda con probabilità di successo p (dipendente dalla
 * difficoltà della casella di partenza); se corretta, dado uniforme da 1 a
 * `faces` e avanzamento. Ai bivi, attraversati soltanto avanzando e senza
 * contare come passo, il giocatore conosce già il dado e sceglie il ramo
 * migliore. Gli effetti delle caselle speciali non sono ancora definiti e non
 * entrano nel calcolo.
 */
import type { Difficulty } from "./types.ts";
import { hasJunction, topologicalOrder } from "./graph.ts";

export interface BalanceCell {
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

export function cellValue(
  graph: BalanceGraph,
  values: ReadonlyMap<string, number>,
  id: string,
  profile: AnswerProfile,
  faces: number,
): number {
  if (id === graph.exitId) return 0;
  return turnValue(graph, values, id, profile[graph.cells[id]!.difficulty], faces);
}

/** Turni attesi da ogni casella, con la scelta migliore a ogni bivio. */
export function expectedTurns(graph: BalanceGraph, profile: AnswerProfile, faces: number): Map<string, number> {
  const order = topologicalOrder(graph.cells);
  if (!order) throw new Error("Il grafo non è aciclico");
  const cells = new Map<string, number>();
  for (let i = order.length - 1; i >= 0; i--) cells.set(order[i]!, cellValue(graph, cells, order[i]!, profile, faces));
  return cells;
}

export interface ForkBalance {
  /** Casella dopo la quale si trova il bivio. */
  forkId: string;
  /** Turni attesi dalla partenza imponendo ciascun ramo a questo bivio (scelta ottimale agli altri). */
  values: Map<string, number>;
  /** Differenza fra l'alternativa peggiore e la migliore. */
  gap: number;
}

/**
 * Competitività delle alternative di ogni bivio: turni attesi dalla partenza
 * imponendo ciascun ramo a chiunque attraversi quel bivio, con la scelta
 * migliore agli altri.
 */
export function forkBalance(graph: BalanceGraph, startId: string, profile: AnswerProfile, faces: number): ForkBalance[] {
  const out: ForkBalance[] = [];
  for (const [forkId, cell] of Object.entries(graph.cells)) {
    if (!hasJunction(cell)) continue;
    const values = new Map<string, number>();
    for (const to of cell.next) {
      const restricted: BalanceGraph = { exitId: graph.exitId, cells: { ...graph.cells, [forkId]: { ...cell, next: [to] } } };
      values.set(to, expectedTurns(restricted, profile, faces).get(startId)!);
    }
    const all = [...values.values()];
    out.push({ forkId, values, gap: Math.max(...all) - Math.min(...all) });
  }
  return out;
}
