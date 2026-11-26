/**
 * Minimappa condivisa (specifica §3): giocatori, giocatore attivo e aree già
 * esplorate collettivamente, vista dall'alto. Usa soltanto il modello della
 * scena, quindi non mostra la rete sconosciuta; l'inquadratura si adatta alle
 * sole zone mostrate. È orientata come la camera: in alto ciò che sta davanti
 * alla vista a tre quarti.
 */
import { VIEW_DIRECTION } from "../layout/layout.ts";
import type { Vec3 } from "../layout/types.ts";
import type { SceneModel } from "../scene/model.ts";

export interface MinimapPoint {
  x: number;
  y: number;
}

export interface MinimapShapes {
  cells: (MinimapPoint & { id: string; kind: string })[];
  edges: [MinimapPoint, MinimapPoint][];
  stubs: [MinimapPoint, MinimapPoint][];
  players: (MinimapPoint & { id: string; index: number; active: boolean })[];
  /** Pixel per unità di scena. */
  scale: number;
}

/** Direzione in avanti della camera, sul piano orizzontale. */
const FORWARD = { x: -VIEW_DIRECTION.x, z: -VIEW_DIRECTION.z };
/** Destra dello schermo: avanti × alto. */
const RIGHT = { x: -FORWARD.z, z: FORWARD.x };

export function toMinimapPlane(p: Vec3): MinimapPoint {
  return { x: p.x * RIGHT.x + p.z * RIGHT.z, y: -(p.x * FORWARD.x + p.z * FORWARD.z) };
}

export function minimapShapes(
  model: SceneModel,
  pawns: Readonly<Record<string, Vec3>>,
  activePlayerId: string,
  width: number,
  height: number,
  padding = 12,
  maxScale = 6,
): MinimapShapes {
  const planeCells = model.tiles.map((tile) => ({ id: tile.id, kind: tile.kind, ...toMinimapPlane(tile.position) }));
  const pawnPoints = model.players.map((p) => ({ id: p.id, index: p.index, active: p.id === activePlayerId, ...toMinimapPlane(pawns[p.id] ?? p.position) }));
  const all = [...planeCells, ...pawnPoints];
  const minX = Math.min(...all.map((p) => p.x)),
    maxX = Math.max(...all.map((p) => p.x)),
    minY = Math.min(...all.map((p) => p.y)),
    maxY = Math.max(...all.map((p) => p.y));
  const scale = Math.min(maxScale, (width - 2 * padding) / Math.max(1e-6, maxX - minX), (height - 2 * padding) / Math.max(1e-6, maxY - minY));
  const offsetX = width / 2 - ((minX + maxX) / 2) * scale,
    offsetY = height / 2 - ((minY + maxY) / 2) * scale;
  const screen = (p: MinimapPoint): MinimapPoint => ({ x: p.x * scale + offsetX, y: p.y * scale + offsetY });
  const segment = (a: Vec3, b: Vec3): [MinimapPoint, MinimapPoint] => [screen(toMinimapPlane(a)), screen(toMinimapPlane(b))];
  return {
    cells: planeCells.map((c) => ({ id: c.id, kind: c.kind, ...screen(c) })),
    edges: model.walkways.map((w) => segment(w.a, w.b)),
    stubs: model.stubs.map((w) => segment(w.a, w.b)),
    players: pawnPoints.map((p) => ({ id: p.id, index: p.index, active: p.active, ...screen(p) })),
    scale,
  };
}
