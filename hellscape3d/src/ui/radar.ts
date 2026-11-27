/**
 * Radar (specifica §3): al posto della minimappa, i giocatori come punti
 * attorno al giocatore di turno, che sta al centro. Non disegna caselle né
 * percorsi.
 *
 * - Distanze in linea d'aria sul piano orizzontale, non lungo il percorso.
 * - Portata limitata: chi è più lontano compare come tacca sul bordo, nella
 *   propria direzione.
 * - L'uscita compare solo quando entra nella portata: è un indizio di
 *   avvicinamento, e prima non rivela né direzione né distanza.
 * - Orientamento fisso, come la camera della vista a tre quarti: in alto ciò
 *   che le sta davanti.
 */
import { VIEW_DIRECTION } from "../layout/layout.ts";
import type { Vec3 } from "../layout/types.ts";

/** Portata PROVVISORIA, in unità di scena (le caselle distano 4 unità): da tarare con gli indizi dell'uscita. */
export const RADAR_RANGE = 24;

export interface RadarPoint {
  x: number;
  y: number;
}

export interface RadarBlip extends RadarPoint {
  id: string;
  index: number;
  active: boolean;
  /** Fuori portata: tacca sul bordo nella direzione del giocatore. */
  onEdge: boolean;
}

export interface RadarShapes {
  center: RadarPoint;
  /** Raggio del radar in pixel. */
  radius: number;
  players: RadarBlip[];
  /** Uscita, soltanto se entro la portata. */
  exit: RadarPoint | null;
}

export interface RadarInput {
  /** Posizioni presentate delle pedine. */
  pawns: Readonly<Record<string, Vec3>>;
  players: readonly { id: string; index: number }[];
  activePlayerId: string;
  exit: Vec3;
  range?: number;
}

/** Direzione in avanti della camera, sul piano orizzontale. */
const FORWARD = { x: -VIEW_DIRECTION.x, z: -VIEW_DIRECTION.z };
/** Destra dello schermo: avanti × alto. */
const RIGHT = { x: -FORWARD.z, z: FORWARD.x };

/** Proiezione sul piano del radar: rotazione, quindi le distanze si conservano. */
export function toRadarPlane(p: Vec3): RadarPoint {
  return { x: p.x * RIGHT.x + p.z * RIGHT.z, y: -(p.x * FORWARD.x + p.z * FORWARD.z) };
}

export function radarShapes(input: RadarInput, size: number, padding = 10): RadarShapes {
  const range = input.range ?? RADAR_RANGE;
  const center = { x: size / 2, y: size / 2 };
  const radius = size / 2 - padding;
  const origin = toRadarPlane(input.pawns[input.activePlayerId]!);
  const place = (p: Vec3): { point: RadarPoint; inside: boolean } => {
    const q = toRadarPlane(p);
    const dx = q.x - origin.x,
      dy = q.y - origin.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= range) return { point: { x: center.x + (dx / range) * radius, y: center.y + (dy / range) * radius }, inside: true };
    return { point: { x: center.x + (dx / distance) * radius, y: center.y + (dy / distance) * radius }, inside: false };
  };
  const players = input.players.map(({ id, index }) => {
    const { point, inside } = place(input.pawns[id]!);
    return { id, index, active: id === input.activePlayerId, onEdge: !inside, ...point };
  });
  const exit = place(input.exit);
  return { center, radius, players, exit: exit.inside ? exit.point : null };
}
