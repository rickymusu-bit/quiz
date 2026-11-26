/**
 * Minimappa condivisa (specifica §3): soltanto le caselle già percorse da
 * almeno un giocatore e i tratti percorsi, i giocatori e quello attivo. Non
 * mostra caselle viste in anticipo né tratti verso l'ignoto.
 *
 * - Un bivio percorso compare come punto di diramazione, distinto dalle
 *   caselle, con i soli rami già imboccati. Il punto sta poco oltre la casella
 *   che precede il bivio, nella direzione da cui vi si è arrivati: la sua
 *   posizione non dipende dai rami ancora sconosciuti.
 * - L'uscita, finché nessuno la raggiunge, è un simbolo staccato dal grafo in
 *   una posizione fissa, uguale in ogni partita (in alto a sinistra, verso cui
 *   avanza in generale il percorso in questo orientamento). Non suggerisce
 *   direzione né distanza.
 *
 * È orientata come la camera: in alto ciò che sta davanti alla vista a tre quarti.
 */
import { VIEW_DIRECTION } from "../layout/layout.ts";
import type { Vec3 } from "../layout/types.ts";
import { splitEdge, visitedCells } from "../logic/exploration.ts";
import type { CellKind, CityMap } from "../logic/types.ts";

export interface MinimapPoint {
  x: number;
  y: number;
}

export interface MinimapShapes {
  cells: (MinimapPoint & { id: string; kind: CellKind })[];
  edges: [MinimapPoint, MinimapPoint][];
  /** Punti di diramazione dei bivi percorsi. */
  junctions: (MinimapPoint & { after: string })[];
  /** Simbolo dell'uscita non ancora raggiunta, in posizione fissa; null quando è una casella percorsa. */
  exit: MinimapPoint | null;
  players: (MinimapPoint & { id: string; index: number; active: boolean })[];
  /** Pixel per unità di scena. */
  scale: number;
}

export interface MinimapInput {
  map: Pick<CityMap, "cells" | "startId" | "exitId">;
  positions: Readonly<Record<string, Vec3>>;
  /** Tratti percorsi mostrati (`da>a`). */
  traversed: readonly string[];
  players: readonly { id: string; index: number }[];
  pawns: Readonly<Record<string, Vec3>>;
  activePlayerId: string;
}

/** Distanza del punto di diramazione dalla casella che precede il bivio, in frazioni del tratto d'arrivo. */
export const JUNCTION_OFFSET = 0.45;
/** Fascia riservata in alto al simbolo dell'uscita, in pixel. */
export const EXIT_STRIP = 22;

/** Direzione in avanti della camera, sul piano orizzontale. */
const FORWARD = { x: -VIEW_DIRECTION.x, z: -VIEW_DIRECTION.z };
/** Destra dello schermo: avanti × alto. */
const RIGHT = { x: -FORWARD.z, z: FORWARD.x };

export function toMinimapPlane(p: Vec3): MinimapPoint {
  return { x: p.x * RIGHT.x + p.z * RIGHT.z, y: -(p.x * FORWARD.x + p.z * FORWARD.z) };
}

export function minimapShapes(input: MinimapInput, width: number, height: number, padding = 12, maxScale = 6): MinimapShapes {
  const { map, positions, traversed } = input;
  const at = (id: string): Vec3 => positions[id]!;
  const visited = visitedCells(map.startId, traversed);
  const exitReached = visited.includes(map.exitId);
  const edges = traversed.map(splitEdge);
  // Bivi percorsi: casella prima del bivio da cui è stato imboccato almeno un ramo.
  const junctionAt = new Map<string, Vec3>();
  for (const [from] of edges) {
    if (junctionAt.has(from) || map.cells[from]!.next.length < 2) continue;
    const arrival = edges.find(([, to]) => to === from);
    const before = arrival ? at(arrival[0]) : null;
    const p = at(from);
    junctionAt.set(from, before ? { x: p.x + (p.x - before.x) * JUNCTION_OFFSET, y: p.y, z: p.z + (p.z - before.z) * JUNCTION_OFFSET } : p);
  }

  const planeCells = visited.map((id) => ({ id, kind: map.cells[id]!.kind, ...toMinimapPlane(at(id)) }));
  const planeJunctions = [...junctionAt].map(([after, p]) => ({ after, ...toMinimapPlane(p) }));
  const pawnPoints = input.players.map((p) => ({ id: p.id, index: p.index, active: p.id === input.activePlayerId, ...toMinimapPlane(input.pawns[p.id]!) }));
  const all = [...planeCells, ...planeJunctions, ...pawnPoints];
  const top = padding + (exitReached ? 0 : EXIT_STRIP);
  const minX = Math.min(...all.map((p) => p.x)),
    maxX = Math.max(...all.map((p) => p.x)),
    minY = Math.min(...all.map((p) => p.y)),
    maxY = Math.max(...all.map((p) => p.y));
  const scale = Math.min(maxScale, (width - 2 * padding) / Math.max(1e-6, maxX - minX), (height - top - padding) / Math.max(1e-6, maxY - minY));
  const offsetX = width / 2 - ((minX + maxX) / 2) * scale,
    offsetY = (top + height - padding) / 2 - ((minY + maxY) / 2) * scale;
  const screen = (p: MinimapPoint): MinimapPoint => ({ x: p.x * scale + offsetX, y: p.y * scale + offsetY });
  const point = (id: string): MinimapPoint => screen(toMinimapPlane(at(id)));
  const junctions = new Map(planeJunctions.map((j) => [j.after, screen(j)]));

  const segments: [MinimapPoint, MinimapPoint][] = [];
  for (const [from, to] of edges) {
    const junction = junctions.get(from);
    if (!junction) segments.push([point(from), point(to)]);
    else segments.push([point(from), junction], [junction, point(to)]);
  }
  return {
    cells: planeCells.map((c) => ({ id: c.id, kind: c.kind, ...screen(c) })),
    // Il tratto fino al punto di diramazione è comune ai rami: compare una sola volta.
    edges: segments.filter(([a, b], i) => segments.findIndex(([c, d]) => c.x === a.x && c.y === a.y && d.x === b.x && d.y === b.y) === i),
    junctions: [...junctions].map(([after, p]) => ({ after, ...p })),
    exit: exitReached ? null : { x: padding + EXIT_STRIP / 2, y: padding + EXIT_STRIP / 2 - 4 },
    players: pawnPoints.map((p) => ({ id: p.id, index: p.index, active: p.active, ...screen(p) })),
    scale,
  };
}
