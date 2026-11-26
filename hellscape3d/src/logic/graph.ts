/** Algoritmi sul grafo orientato delle caselle. */

interface Linked {
  next: readonly string[];
}

/** Dopo la casella c'è un bivio: per lasciarla avanzando bisogna scegliere il ramo. */
export function hasJunction(cell: Linked): boolean {
  return cell.next.length > 1;
}

/** Ordine topologico (algoritmo di Kahn); null se il grafo contiene cicli o archi verso celle inesistenti. */
export function topologicalOrder(cells: Readonly<Record<string, Linked>>): string[] | null {
  const indegree = new Map<string, number>();
  for (const id of Object.keys(cells)) indegree.set(id, 0);
  for (const cell of Object.values(cells)) {
    for (const to of cell.next) {
      const current = indegree.get(to);
      if (current === undefined) return null;
      indegree.set(to, current + 1);
    }
  }
  const queue = [...indegree].filter(([, degree]) => degree === 0).map(([id]) => id);
  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const to of cells[id]!.next) {
      const degree = indegree.get(to)! - 1;
      indegree.set(to, degree);
      if (degree === 0) queue.push(to);
    }
  }
  return order.length === indegree.size ? order : null;
}

/**
 * Distanza minima o massima, in passi, da ogni cella all'uscita.
 * Le celle che non raggiungono l'uscita ricevono Infinity (minimo) o -Infinity (massimo).
 */
export function distancesToExit(
  cells: Readonly<Record<string, Linked>>,
  exitId: string,
  mode: "min" | "max" = "min",
): Record<string, number> {
  const order = topologicalOrder(cells);
  if (!order) throw new Error("Il grafo non è aciclico");
  const unreachable = mode === "min" ? Infinity : -Infinity;
  const pick = mode === "min" ? Math.min : Math.max;
  const out: Record<string, number> = {};
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i]!;
    const next = cells[id]!.next;
    out[id] = id === exitId ? 0 : next.length === 0 ? unreachable : 1 + pick(...next.map((to) => out[to]!));
  }
  return out;
}

export function reachableFrom(cells: Readonly<Record<string, Linked>>, startId: string): Set<string> {
  const seen = new Set<string>();
  const stack = [startId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (seen.has(id) || !cells[id]) continue;
    seen.add(id);
    stack.push(...cells[id].next);
  }
  return seen;
}

/** Celle raggiungibili in avanti entro `range` passi, compresa quella di partenza. */
export function forwardWithin(cells: Readonly<Record<string, Linked>>, fromId: string, range: number): string[] {
  const depth = new Map<string, number>([[fromId, 0]]);
  const queue = [fromId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const d = depth.get(id)!;
    if (d >= range) continue;
    for (const to of cells[id]?.next ?? []) {
      if (!depth.has(to)) {
        depth.set(to, d + 1);
        queue.push(to);
      }
    }
  }
  return [...depth.keys()];
}
