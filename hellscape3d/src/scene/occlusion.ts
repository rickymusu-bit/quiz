/**
 * Ostacoli fra camera e giocatore attivo (specifica §6): i volumi attraversati
 * dal segmento che va dalla camera ai piedi o alla testa della pedina vengono
 * resi trasparenti dal renderer. Il calcolo considera solo ciò che è disegnato,
 * quindi vedere attraverso un ostacolo non rivela zone inesplorate.
 */
import type { Vec3 } from "../layout/types.ts";
import { massBox, PAWN_SIGHT_HEIGHTS, pillarBox, tileBox, walkwayBox, type Box } from "./dimensions.ts";
import type { SceneModel } from "./model.ts";

export interface Occluders {
  /** Identificativi delle caselle (piastrelle) da rendere trasparenti. */
  tiles: string[];
  /** Identificativi delle caselle i cui piloni vanno resi trasparenti. */
  pillars: string[];
  /** Indici in `model.walkways`. */
  walkways: number[];
  /** Indici in `model.masses`. */
  masses: number[];
}

export const NO_OCCLUDERS: Readonly<Occluders> = Object.freeze({ tiles: [], pillars: [], walkways: [], masses: [] });

/** Il segmento a→b attraversa il riquadro? Metodo delle lastre, estremi inclusi. */
export function segmentIntersectsBox(a: Vec3, b: Vec3, box: Box): boolean {
  let t0 = 0,
    t1 = 1;
  for (const axis of ["x", "y", "z"] as const) {
    const delta = b[axis] - a[axis];
    if (Math.abs(delta) < 1e-12) {
      if (a[axis] < box.min[axis] || a[axis] > box.max[axis]) return false;
      continue;
    }
    let near = (box.min[axis] - a[axis]) / delta,
      far = (box.max[axis] - a[axis]) / delta;
    if (near > far) [near, far] = [far, near];
    t0 = Math.max(t0, near);
    t1 = Math.min(t1, far);
    if (t0 > t1) return false;
  }
  return true;
}

function contains(box: Box, p: Vec3): boolean {
  return p.x >= box.min.x && p.x <= box.max.x && p.y >= box.min.y && p.y <= box.max.y && p.z >= box.min.z && p.z <= box.max.z;
}

/** Volumi che nascondono la pedina in `focus` vista da `camera`. */
export function findOccluders(model: SceneModel, camera: Vec3, focus: Vec3): Occluders {
  const targets = PAWN_SIGHT_HEIGHTS.map((h) => ({ x: focus.x, y: focus.y + h, z: focus.z }));
  const blocks = (box: Box): boolean => targets.some((t) => !contains(box, t) && segmentIntersectsBox(camera, t, box));
  return {
    tiles: model.tiles.filter((tile) => blocks(tileBox(tile.position, tile.kind))).map((tile) => tile.id),
    pillars: model.tiles.filter((tile) => blocks(pillarBox(tile.position))).map((tile) => tile.id),
    walkways: model.walkways.flatMap((w, i) => (blocks(walkwayBox(w.a, w.b)) ? [i] : [])),
    masses: model.masses.flatMap((m, i) => (blocks(massBox(m)) ? [i] : [])),
  };
}

export function occludersKey(o: Occluders): string {
  return `${o.tiles.join()}|${o.pillars.join()}|${o.walkways.join()}|${o.masses.join()}`;
}
