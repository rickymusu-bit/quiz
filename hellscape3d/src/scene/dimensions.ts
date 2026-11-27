/**
 * Dimensioni dei volumi graybox e camera della vista della città, condivise
 * dal kit, dal renderer e dai test: una sola fonte.
 */
import { DEFAULT_LAYOUT_CONFIG, VIEW_DIRECTION } from "../layout/layout.ts";
import type { Vec3 } from "../layout/types.ts";
import type { CellKind } from "../logic/types.ts";

export const TILE = Object.freeze({ size: 2.6, thickness: 0.5 });
export const WALKWAY = Object.freeze({ width: 1.3, thickness: 0.25 });
export const ABYSS_Y = DEFAULT_LAYOUT_CONFIG.abyssY;

export function tileScale(kind: CellKind): number {
  return kind === "start" || kind === "exit" ? 1.6 : 1;
}

/** Inquadratura della vista della città: punto guardato, distanza e inclinazione (radianti sopra l'orizzonte). */
export interface CameraPose {
  target: Vec3;
  distance: number;
  pitch: number;
}

/** Inquadratura fissa sul giocatore di turno nella vista della città. */
export const CITY_SHOT = Object.freeze({ distance: 38, pitch: (50 * Math.PI) / 180 });

/** Posizione della camera della vista a tre quarti: direzione fissa, distanza e inclinazione variabili. */
export function cameraPosition(target: Vec3, distance: number, pitch: number): Vec3 {
  return {
    x: target.x + VIEW_DIRECTION.x * Math.cos(pitch) * distance,
    y: target.y + Math.sin(pitch) * distance,
    z: target.z + VIEW_DIRECTION.z * Math.cos(pitch) * distance,
  };
}

/** Ottica della camera, nebbia e ombra del sole della vista della città. */
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
