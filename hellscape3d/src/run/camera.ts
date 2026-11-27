/**
 * Inquadratura della scena di corsa (specifica §6). È scelta quando la stanza
 * viene generata, in base alle sue caratteristiche (tipo e grandezza):
 * angolazione, inclinazione, distanza e campo visivo, variati dal seme entro
 * intervalli per tipo. Nella stanza del bivio la camera sta alle spalle del
 * personaggio, verso le porte.
 *
 * Vincoli comuni: il personaggio non scende sotto un'altezza minima
 * sull'immagine; la camera resta dallo stesso lato del percorso (il corridore
 * va sempre verso destra o dentro lo schermo); con la domanda aperta si
 * avvicina.
 */
import type { Rng } from "../logic/rng.ts";

type V3 = [number, number, number];

/**
 * Inquadratura di una stanza, rispetto al corridore all'origine che corre verso +X.
 * `yaw`: 0 di profilo (camera sul lato +Z), positivo ruotando verso il davanti,
 * negativo verso le spalle; `pitch`: positivo dall'alto, negativo dal basso.
 */
export interface RoomShot {
  yaw: number;
  pitch: number;
  distance: number;
  fov: number;
  /** Punto guardato davanti al corridore, lungo X. */
  lookAhead: number;
}

export interface CameraPose {
  position: V3;
  target: V3;
  fov: number;
}

/** Altezza del corridore e frazione minima dell'altezza dell'immagine che deve occupare (provvisoria). */
export const RUNNER_HEIGHT = 1.9;
export const MIN_SCREEN_FRACTION = 0.05;
/** Riduzione della distanza mentre la domanda è aperta. */
export const QUESTION_ZOOM = 0.8;

type Range = readonly [number, number];
interface ShotRule {
  yaw: Range;
  pitch: Range | readonly Range[];
  /** Distanza in unità di scena per grandezza 1 della stanza. */
  distance: Range;
  fov: number;
  lookAhead: number;
}

/**
 * Regole PROVVISORIE per tipo di stanza: corridoio di profilo, vicino alla
 * parete; sala larga e a tre quarti, per le file di pilastri; ponte dall'alto,
 * per il vuoto; pozzo dal basso o dall'alto; bivio alle spalle, verso le porte.
 */
const RULES: Readonly<Record<string, ShotRule>> = {
  corridoio: { yaw: [0, 20], pitch: [4, 12], distance: [11, 16], fov: 42, lookAhead: 1.5 },
  sala: { yaw: [25, 45], pitch: [6, 16], distance: [16, 24], fov: 50, lookAhead: 2 },
  ponte: { yaw: [10, 35], pitch: [18, 32], distance: [16, 24], fov: 50, lookAhead: 2 },
  pozzo: { yaw: [15, 30], pitch: [[-18, -8], [42, 58]], distance: [14, 20], fov: 56, lookAhead: 1 },
  partenza: { yaw: [15, 25], pitch: [8, 12], distance: [12, 14], fov: 46, lookAhead: 1.5 },
  uscita: { yaw: [25, 35], pitch: [6, 10], distance: [13, 15], fov: 46, lookAhead: 4 },
  bivio: { yaw: [-80, -76], pitch: [14, 18], distance: [7, 8], fov: 55, lookAhead: 7 },
};

const pickIn = (rng: Rng, [a, b]: Range): number => a + rng.next() * (b - a);

/** Inquadratura generata con la stanza. */
export function generateShot(kind: string, size: number, rng: Rng): RoomShot {
  const rule = RULES[kind] ?? RULES.corridoio!;
  const pitchRange = Array.isArray(rule.pitch[0]) ? rng.pick(rule.pitch as readonly Range[]) : (rule.pitch as Range);
  return {
    yaw: pickIn(rng, rule.yaw),
    pitch: pickIn(rng, pitchRange),
    distance: Math.min(pickIn(rng, rule.distance) * size, maxDistance(rule.fov)),
    fov: rule.fov,
    lookAhead: rule.lookAhead,
  };
}

/** Distanza massima perché il corridore occupi almeno MIN_SCREEN_FRACTION dell'altezza dell'immagine. */
export function maxDistance(fov: number): number {
  return RUNNER_HEIGHT / (2 * Math.tan(((fov / 2) * Math.PI) / 180) * MIN_SCREEN_FRACTION);
}

/** Inquadrature fisse, SOLO SVILUPPO (?camera=), le stesse del primo confronto. */
export const PRESETS: Readonly<Record<"laterale" | "angolata" | "trequarti" | "spalle", RoomShot>> = {
  laterale: { yaw: 0, pitch: 2, distance: 11, fov: 40, lookAhead: 1.5 },
  angolata: { yaw: 21, pitch: 8, distance: 10.5, fov: 40, lookAhead: 1.6 },
  trequarti: { yaw: 37, pitch: 18, distance: 11.5, fov: 46, lookAhead: 1.6 },
  spalle: { yaw: -79, pitch: 14, distance: 7, fov: 55, lookAhead: 6 },
};
export type PresetKind = keyof typeof PRESETS;

export function poseFor(shot: RoomShot, options: { question?: boolean } = {}): CameraPose {
  const distance = shot.distance * (options.question ? QUESTION_ZOOM : 1);
  const yaw = (shot.yaw * Math.PI) / 180,
    pitch = (shot.pitch * Math.PI) / 180;
  const target: V3 = [shot.lookAhead, 1.2, 0];
  return {
    position: [target[0] + distance * Math.sin(yaw) * Math.cos(pitch), target[1] + distance * Math.sin(pitch), target[2] + distance * Math.cos(yaw) * Math.cos(pitch)],
    target,
    fov: shot.fov,
  };
}

/** Interpolazione fra due pose (cambi di inquadratura morbidi). */
export function blendPose(a: CameraPose, b: CameraPose, t: number): CameraPose {
  const u = t * t * (3 - 2 * t);
  const mix = (p: V3, q: V3): V3 => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u, p[2] + (q[2] - p[2]) * u];
  return { position: mix(a.position, b.position), target: mix(a.target, b.target), fov: a.fov + (b.fov - a.fov) * u };
}
