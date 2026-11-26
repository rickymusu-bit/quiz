/**
 * Dimensioni dei volumi graybox e posizione della camera, condivise dal
 * renderer e dai calcoli puri (occlusione): una sola fonte, così che ciò che
 * si disegna e ciò che si calcola non possano divergere.
 */
import { DEFAULT_LAYOUT_CONFIG, VIEW_DIRECTION } from "../layout/layout.ts";
import type { Mass, Vec3 } from "../layout/types.ts";
import type { CellKind } from "../logic/types.ts";

export const TILE = Object.freeze({ size: 2.6, thickness: 0.5 });
export const WALKWAY = Object.freeze({ width: 1.3, thickness: 0.25 });
export const PILLAR_WIDTH = 0.7;
export const ABYSS_Y = DEFAULT_LAYOUT_CONFIG.abyssY;
/** Punti della pedina che devono restare visibili: piedi e testa. */
export const PAWN_SIGHT_HEIGHTS: readonly number[] = [0.4, 1.6];

export function tileScale(kind: CellKind): number {
  return kind === "start" || kind === "exit" ? 1.6 : 1;
}

/** Posizione della camera della vista a tre quarti: direzione fissa, distanza e inclinazione variabili. */
export function cameraPosition(target: Vec3, distance: number, pitch: number): Vec3 {
  return {
    x: target.x + VIEW_DIRECTION.x * Math.cos(pitch) * distance,
    y: target.y + Math.sin(pitch) * distance,
    z: target.z + VIEW_DIRECTION.z * Math.cos(pitch) * distance,
  };
}

export interface Box {
  min: Vec3;
  max: Vec3;
}

export function tileBox(position: Vec3, kind: CellKind): Box {
  const half = (TILE.size * tileScale(kind)) / 2;
  return {
    min: { x: position.x - half, y: position.y - TILE.thickness, z: position.z - half },
    max: { x: position.x + half, y: position.y, z: position.z + half },
  };
}

export function pillarBox(position: Vec3): Box {
  const half = PILLAR_WIDTH / 2;
  return {
    min: { x: position.x - half, y: ABYSS_Y, z: position.z - half },
    max: { x: position.x + half, y: position.y - TILE.thickness, z: position.z + half },
  };
}

/** Riquadro allineato agli assi che contiene la passerella (stima prudente per i tratti diagonali). */
export function walkwayBox(a: Vec3, b: Vec3): Box {
  const half = WALKWAY.width / 2;
  return {
    min: { x: Math.min(a.x, b.x) - half, y: Math.min(a.y, b.y) - WALKWAY.thickness * 1.5, z: Math.min(a.z, b.z) - half },
    max: { x: Math.max(a.x, b.x) + half, y: Math.max(a.y, b.y) - WALKWAY.thickness * 0.5, z: Math.max(a.z, b.z) + half },
  };
}

export function massBox(mass: Mass): Box {
  return {
    min: { x: mass.x - mass.width / 2, y: mass.bottom, z: mass.z - mass.depth / 2 },
    max: { x: mass.x + mass.width / 2, y: mass.top, z: mass.z + mass.depth / 2 },
  };
}

/**
 * Ottica della camera, nebbia e ombra del sole: usati dal renderer e dal
 * calcolo dei settori da tenere caricati, che deve coprire tutto ciò che può
 * comparire nell'inquadratura o proiettarvi un'ombra.
 */
export const CAMERA_OPTICS = Object.freeze({ fov: 40, near: 0.5 });

/** Nebbia lineare: oltre `far` (profondità nella vista) un volume coincide con lo sfondo. */
export function fogRange(distance: number): { near: number; far: number } {
  return { near: distance * 0.9, far: distance + 90 };
}

/** Il sole segue il punto inquadrato; la sua camera d'ombra è ortografica. */
export const SUN = Object.freeze({ offset: Object.freeze({ x: -30, y: 60, z: -15 }), shadowNear: 1, shadowFar: 300 });

export function shadowExtent(distance: number): number {
  return Math.max(45, distance);
}
