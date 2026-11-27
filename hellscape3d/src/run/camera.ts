/**
 * Inquadratura secondo la stanza (specifica §6): laterale in salita, a tre
 * quarti in piano e in discesa, posteriore nella stanza del bivio. La distanza
 * segue la grandezza della stanza, si accorcia mentre la domanda è aperta e
 * non lascia scendere il personaggio sotto un'altezza minima sullo schermo.
 * La camera resta dallo stesso lato del percorso: il corridore va sempre verso
 * destra o dentro lo schermo.
 */
import type { Room } from "./rooms.ts";

type V3 = [number, number, number];

export type ShotKind = "laterale" | "angolata" | "trequarti" | "spalle";

/** Inquadrature di riferimento rispetto al corridore all'origine (le stesse del confronto). */
export const SHOTS: Readonly<Record<ShotKind, { position: V3; target: V3; fov: number }>> = {
  laterale: { position: [1.5, 1.5, 11], target: [1.5, 1.1, 0], fov: 40 },
  angolata: { position: [5.6, 2.6, 10.2], target: [1.6, 1.0, 0], fov: 40 },
  trequarti: { position: [8.4, 4.6, 9.0], target: [1.6, 1.4, 0], fov: 46 },
  spalle: { position: [-6.5, 3.0, 1.2], target: [6, 1.3, 0], fov: 55 },
};

export interface CameraPose {
  position: V3;
  target: V3;
  fov: number;
}

/** Altezza del corridore e frazione minima dell'altezza dell'immagine che deve occupare (provvisoria). */
export const RUNNER_HEIGHT = 1.9;
export const MIN_SCREEN_FRACTION = 0.14;
/** Riduzione della distanza mentre la domanda è aperta. */
export const QUESTION_ZOOM = 0.8;

export function shotKindFor(room: Room): ShotKind {
  if (room.kind === "bivio") return "spalle";
  return room.slope === "salita" ? "laterale" : "trequarti";
}

/** Distanza massima perché il corridore occupi almeno MIN_SCREEN_FRACTION dell'altezza dell'immagine. */
export function maxDistance(fov: number): number {
  return RUNNER_HEIGHT / (2 * Math.tan(((fov / 2) * Math.PI) / 180) * MIN_SCREEN_FRACTION);
}

export function poseFor(room: Room, options: { question?: boolean; kind?: ShotKind } = {}): CameraPose {
  const shot = SHOTS[options.kind ?? shotKindFor(room)];
  const offset: V3 = [shot.position[0] - shot.target[0], shot.position[1] - shot.target[1], shot.position[2] - shot.target[2]];
  const base = Math.hypot(...offset);
  // Stanze più grandi: camera più lontana, per mostrare la megastruttura oltre al personaggio.
  let distance = base * (0.7 + 0.4 * room.size);
  if (options.question) distance *= QUESTION_ZOOM;
  distance = Math.min(distance, maxDistance(shot.fov));
  const k = distance / base;
  return {
    position: [shot.target[0] + offset[0] * k, shot.target[1] + offset[1] * k, shot.target[2] + offset[2] * k],
    target: [...shot.target],
    fov: shot.fov,
  };
}

/** Interpolazione fra due pose (cambi di inquadratura morbidi). */
export function blendPose(a: CameraPose, b: CameraPose, t: number): CameraPose {
  const u = t * t * (3 - 2 * t);
  const mix = (p: V3, q: V3): V3 => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u, p[2] + (q[2] - p[2]) * u];
  return { position: mix(a.position, b.position), target: mix(a.target, b.target), fov: a.fov + (b.fov - a.fov) * u };
}
