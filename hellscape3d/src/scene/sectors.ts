/**
 * Caricamento per settori (§8): il piano XZ è diviso in quadrati e la scena
 * grafica contiene solo gli elementi dei settori caricati. Scaricare un
 * settore toglie soltanto la grafica: mappa, stato, esplorazione e minimappa
 * non lo leggono. Il kit si costruisce sull'intera vista presentata e poi si
 * filtra, quindi un elemento ricaricato riappare identico.
 *
 * Il raggio da tenere caricato non è un valore scelto a mano: si ricava dalla
 * camera, dalla nebbia e dall'ombra del sole, così che nessun volume che può
 * comparire nell'inquadratura o proiettarvi un'ombra venga scaricato.
 */
import type { Vec3 } from "../layout/types.ts";
import type { CityLayout } from "../layout/types.ts";
import type { CameraPose } from "../director/director.ts";
import { tileKey, type Primitive } from "../kit/kit.ts";
import { ABYSS_Y, CAMERA_OPTICS, cameraPosition, fogRange, shadowExtent, SUN, WALKWAY } from "./dimensions.ts";
import type { SceneModel, SceneSegment } from "./model.ts";

/** Lato del settore e margine di isteresi: si carica entro il raggio, si scarica oltre raggio + isteresi. */
export const SECTOR = Object.freeze({ size: 16, hysteresis: 16 });

/** Altezza massima delle parti fuori dal kit (portale d'uscita, segnali) sopra la casella. */
const MARKER_HEIGHT = 4.5;
/** Sporgenza massima delle decorazioni del kit sopra le masse. */
const MASS_DECOR_HEIGHT = 3;
/** Margine per fasce e cornici che sporgono di poco oltre la base delle masse. */
const SLAB_MARGIN = 0.5;

export interface Footprint {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Fascia di quote che contiene tutta la geometria della città. */
export interface Slab {
  minY: number;
  maxY: number;
}

/** Punto attorno al quale tenere caricati i settori, con il proprio raggio. */
export interface Focus {
  x: number;
  z: number;
  radius: number;
}

export const sectorKey = (i: number, j: number): string => `${i},${j}`;

/** Settori toccati da un ingombro orizzontale. */
export function sectorsOf(footprint: Footprint): string[] {
  const out: string[] = [];
  const i0 = Math.floor(footprint.minX / SECTOR.size),
    i1 = Math.floor(footprint.maxX / SECTOR.size);
  const j0 = Math.floor(footprint.minZ / SECTOR.size),
    j1 = Math.floor(footprint.maxZ / SECTOR.size);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) out.push(sectorKey(i, j));
  return out;
}

/** Distanza orizzontale fra un punto e il quadrato del settore (0 se il punto è dentro). */
export function sectorDistance(key: string, x: number, z: number): number {
  const [i, j] = key.split(",").map(Number) as [number, number];
  const dx = Math.max(i * SECTOR.size - x, 0, x - (i + 1) * SECTOR.size);
  const dz = Math.max(j * SECTOR.size - z, 0, z - (j + 1) * SECTOR.size);
  return Math.hypot(dx, dz);
}

/**
 * Semiampiezze del riquadro allineato agli assi che contiene una primitiva:
 * cubo o cilindro unitari scalati e ruotati con angoli di Eulero in ordine XYZ,
 * come in three.js (il cilindro è contenuto nel suo parallelepipedo).
 */
export function primitiveHalfExtents(p: Primitive): Vec3 {
  const h = [p.scale.x / 2, p.scale.y / 2, p.scale.z / 2] as const;
  const [a, b, c] = [p.rotation.x, p.rotation.y, p.rotation.z];
  const [ca, sa, cb, sb, cc, sc] = [Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b), Math.cos(c), Math.sin(c)];
  // Matrice di rotazione Rx·Ry·Rz.
  const m = [
    [cb * cc, -cb * sc, sb],
    [ca * sc + sa * sb * cc, ca * cc - sa * sb * sc, -sa * cb],
    [sa * sc - ca * sb * cc, sa * cc + ca * sb * sc, ca * cb],
  ];
  const [x, y, z] = m.map((row) => row.reduce((sum, value, j) => sum + Math.abs(value) * h[j]!, 0)) as [number, number, number];
  return { x, y, z };
}

const grow = (footprint: Footprint | undefined, minX: number, maxX: number, minZ: number, maxZ: number): Footprint =>
  footprint
    ? { minX: Math.min(footprint.minX, minX), maxX: Math.max(footprint.maxX, maxX), minZ: Math.min(footprint.minZ, minZ), maxZ: Math.max(footprint.maxZ, maxZ) }
    : { minX, maxX, minZ, maxZ };

/** Chiave di un elemento del kit, la stessa per tutte le sue primitive. */
export const elementKey = (ref: Primitive["ref"]): string => `${ref.kind}:${ref.key}`;

/**
 * Settori di ogni elemento grafico della vista: primitive del kit (per
 * elemento), monconi verso la nebbia (per indice) e caselle, a cui sono legati
 * segnali e portale.
 */
export interface SectorIndex {
  elements: Map<string, string[]>;
  stubs: string[][];
  tiles: Map<string, string[]>;
  /** Tutti i settori occupati da almeno un elemento. */
  occupied: Set<string>;
}

export function indexSectors(model: SceneModel, primitives: readonly Primitive[]): SectorIndex {
  const footprints = new Map<string, Footprint>();
  for (const p of primitives) {
    const key = elementKey(p.ref),
      e = primitiveHalfExtents(p);
    footprints.set(key, grow(footprints.get(key), p.position.x - e.x, p.position.x + e.x, p.position.z - e.z, p.position.z + e.z));
  }
  const elements = new Map([...footprints].map(([key, footprint]) => [key, sectorsOf(footprint)]));
  const stubs = model.stubs.map((segment) => sectorsOf(segmentFootprint(segment)));
  // Segnali e portale stanno sopra la casella: stessi settori del suo modulo.
  const tiles = new Map(model.tiles.map((tile) => [tile.id, elements.get(`tile:${tileKey(tile.id)}`) ?? sectorsOf(pointFootprint(tile.position, 2.5))]));
  const occupied = new Set([...elements.values(), ...stubs, ...tiles.values()].flat());
  return { elements, stubs, tiles, occupied };
}

const pointFootprint = (p: Vec3, half: number): Footprint => ({ minX: p.x - half, maxX: p.x + half, minZ: p.z - half, maxZ: p.z + half });

function segmentFootprint(segment: SceneSegment): Footprint {
  const half = WALKWAY.width;
  return {
    minX: Math.min(segment.a.x, segment.b.x) - half,
    maxX: Math.max(segment.a.x, segment.b.x) + half,
    minZ: Math.min(segment.a.z, segment.b.z) - half,
    maxZ: Math.max(segment.a.z, segment.b.z) + half,
  };
}

/** Un elemento è caricato se almeno uno dei suoi settori lo è. */
export const isLoaded = (sectors: readonly string[] | undefined, loaded: ReadonlySet<string> | null): boolean =>
  loaded === null || (sectors ?? []).some((key) => loaded.has(key));

/**
 * Settori caricati dopo un aggiornamento: entra ogni settore occupato entro il
 * raggio di un fuoco; resta chi era già caricato ed è entro raggio + isteresi.
 */
export function updateLoadedSectors(previous: ReadonlySet<string>, occupied: Iterable<string>, foci: readonly Focus[], hysteresis: number = SECTOR.hysteresis): Set<string> {
  const loaded = new Set<string>();
  for (const key of occupied) {
    const distance = Math.min(...foci.map((f) => sectorDistance(key, f.x, f.z) - f.radius));
    if (distance <= 0 || (previous.has(key) && distance <= hysteresis)) loaded.add(key);
  }
  return loaded;
}

/**
 * Fascia di quote della città: dal fondo delle masse e dei piloni alla cima
 * di masse, caselle e portale. I test verificano che contenga ogni primitiva.
 */
export function citySlab(layout: CityLayout): Slab {
  const tiles = Object.values(layout.positions).map((p) => p.y);
  return {
    minY: Math.min(ABYSS_Y, ...layout.masses.map((m) => m.bottom)) - SLAB_MARGIN,
    maxY: Math.max(Math.max(...tiles) + MARKER_HEIGHT, ...layout.masses.map((m) => m.top + MASS_DECOR_HEIGHT)) + SLAB_MARGIN,
  };
}

type V = readonly [number, number, number];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V): V => mul(a, 1 / Math.hypot(a[0], a[1], a[2]));

/**
 * Vertici di un tronco di piramide (o parallelepipedo) orientato come una
 * camera che guarda `target` da `eye`, con asse verticale +Y come in three.js.
 * `half(d)` dà le semiampiezze orizzontale e verticale alla profondità d.
 * Ordine: prima il piano vicino poi il lontano; in ciascuno destra/sinistra, poi alto/basso.
 */
function volumeCorners(eye: V, target: V, near: number, far: number, half: (depth: number) => [number, number]): V[] {
  const forward = norm(sub(target, eye));
  const right = norm(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  const corners: V[] = [];
  for (const depth of [near, far]) {
    const [w, h] = half(depth);
    const centre = add(eye, mul(forward, depth));
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) corners.push(add(centre, add(mul(right, sx * w), mul(up, sy * h))));
  }
  return corners;
}

/** Spigoli del volume: indici nei vertici prodotti da `volumeCorners`. */
const EDGES: readonly (readonly [number, number])[] = [
  [0, 1], [0, 2], [1, 3], [2, 3],
  [4, 5], [4, 6], [5, 7], [6, 7],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

/**
 * Massima distanza orizzontale da `centre` dei punti del volume convesso
 * compresi nella fascia di quote: il massimo di una funzione convessa su un
 * poliedro convesso tagliato da due piani cade su un vertice o
 * sull'intersezione di uno spigolo con un piano.
 */
export function reachWithinSlab(corners: readonly (readonly [number, number, number])[], slab: Slab, centre: Vec3): number {
  const points: V[] = corners.filter((c) => c[1] >= slab.minY && c[1] <= slab.maxY);
  for (const [i, j] of EDGES) {
    const a = corners[i]!,
      b = corners[j]!;
    for (const y of [slab.minY, slab.maxY]) {
      if ((a[1] - y) * (b[1] - y) >= 0) continue;
      const t = (y - a[1]) / (b[1] - a[1]);
      points.push(add(a, mul(sub(b, a), t)));
    }
  }
  return Math.max(0, ...points.map((p) => Math.hypot(p[0] - centre.x, p[2] - centre.z)));
}

/**
 * Raggio, attorno al punto inquadrato, che contiene ogni volume della fascia
 * che può comparire nell'inquadratura prima che la nebbia lo copra del tutto
 * o che può proiettare un'ombra (camera d'ombra del sole).
 * `aspect` è il rapporto larghezza/altezza del canvas: la parte riservata al
 * pannello in basso restringe l'inquadratura, non la allarga.
 */
export function visibleRadius(pose: CameraPose, aspect: number, slab: Slab): number {
  const t: V = [pose.target.x, pose.target.y, pose.target.z];
  const p = cameraPosition(pose.target, pose.distance, pose.pitch);
  const tan = Math.tan(((CAMERA_OPTICS.fov / 2) * Math.PI) / 180);
  const view = volumeCorners([p.x, p.y, p.z], t, CAMERA_OPTICS.near, fogRange(pose.distance).far, (d) => [d * tan * aspect, d * tan]);
  const extent = shadowExtent(pose.distance);
  const sun = add(t, [SUN.offset.x, SUN.offset.y, SUN.offset.z]);
  const shadow = volumeCorners(sun, t, SUN.shadowNear, SUN.shadowFar, () => [extent, extent]);
  return Math.max(reachWithinSlab(view, slab, pose.target), reachWithinSlab(shadow, slab, pose.target));
}
