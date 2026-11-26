/**
 * Kit modulare di Megastrutture, primo passo della fase 3 (specifica §5):
 * geometria procedurale e regole di assemblaggio, con tinte NEUTRE. Palette,
 * materiali e dettagli definitivi dipendono dalla direzione artistica, ancora
 * da decidere.
 *
 * Il kit trasforma il modello della scena in primitive (parallelepipedi e
 * cilindri) raggruppate per elemento. È puro e indipendente da Three.js.
 *
 * Agganci: ogni passerella parte e arriva sul bordo delle piattaforme, nel
 * punto in cui la sua direzione esce dal quadrato della casella; le ringhiere
 * corrono lungo i bordi e si interrompono solo in quei punti.
 *
 * Varianti: dipendono dal seme e dall'identità dell'elemento, non dall'ordine
 * in cui la nebbia lo rivela, così un elemento non cambia aspetto esplorando.
 */
import { rngFromSeed, type Rng } from "../logic/rng.ts";
import type { CellKind } from "../logic/types.ts";
import type { Mass, Vec3 } from "../layout/types.ts";
import { ABYSS_Y, TILE, tileScale, WALKWAY } from "../scene/dimensions.ts";
import type { SceneModel, SceneSegment } from "../scene/model.ts";

export type KitMaterial = "concrete" | "metal" | "dark";
export type KitShape = "box" | "cylinder";
export type ElementKind = "tile" | "pillar" | "walkway" | "mass";

/** Elemento del modello a cui appartiene una primitiva: serve a renderla trasparente se fa da ostacolo. */
export interface ElementRef {
  kind: ElementKind;
  key: string;
}

export interface Primitive {
  shape: KitShape;
  material: KitMaterial;
  position: Vec3;
  /** Rotazioni in radianti, ordine XYZ (Three.js): inclinazione su Z, poi orientamento su Y. */
  rotation: Vec3;
  /** Dimensioni: per i cilindri x = diametro, y = altezza. */
  scale: Vec3;
  /** Tinta per il calcestruzzo; gli altri materiali hanno colore proprio. */
  color: number;
  ref: ElementRef;
}

export interface KitResult {
  primitives: Primitive[];
  /** Punti d'aggancio usati, per casella: dove le passerelle toccano il bordo della piattaforma. */
  sockets: Record<string, Vec3[]>;
}

/** Dimensioni del kit; quelle condivise con il calcolo degli ostacoli stanno in scene/dimensions. */
export const KIT = Object.freeze({
  railingHeight: 0.9,
  railingInset: 0.1,
  postSpacing: 0.65,
  /** Distanza minima fra un montante di ringhiera e un punto d'aggancio. */
  socketClearance: WALKWAY.width / 2 + 0.25,
  floorSpacing: 3.5,
  /** Le masse vengono decorate solo nella parte alta: più in basso la nebbia le nasconde. */
  massDecorDepth: 32,
  braceSpacing: 7,
});

const CONCRETE = { light: 0x8c8f94, mass: 0x4d5056, pillar: 0x5c5f65 };
const DISTRICT_TINT: Readonly<Record<string, number>> = {
  fondazioni: 0x8b8682,
  ponti: 0x858c96,
  abitativo: 0x8e8e89,
  motori: 0x948577,
  sommita: 0x9a9ba3,
};

export const tileKey = (id: string): string => id;
export const walkwayKey = (segment: SceneSegment): string => `${segment.from}>${segment.to ?? "?"}`;
export const massKey = (mass: Mass): string => `${mass.x.toFixed(2)},${mass.z.toFixed(2)}`;

function shade(hex: number, factor: number): number {
  const r = Math.min(255, Math.round(((hex >> 16) & 255) * factor)),
    g = Math.min(255, Math.round(((hex >> 8) & 255) * factor)),
    b = Math.min(255, Math.round((hex & 255) * factor));
  return (r << 16) | (g << 8) | b;
}

/** Punto in cui la direzione (dx, dz) esce dal quadrato di semilato `half` centrato in `centre`. */
export function exitPoint(centre: Vec3, half: number, dx: number, dz: number): Vec3 {
  const length = Math.hypot(dx, dz);
  const ux = dx / length,
    uz = dz / length;
  const t = half / Math.max(Math.abs(ux), Math.abs(uz));
  return { x: centre.x + ux * t, y: centre.y, z: centre.z + uz * t };
}

const halfSize = (kind: CellKind): number => (TILE.size * tileScale(kind)) / 2;

class Builder {
  readonly primitives: Primitive[] = [];
  ref: ElementRef = { kind: "tile", key: "" };

  box(material: KitMaterial, position: Vec3, scale: Vec3, color = 0, rotation: Vec3 = { x: 0, y: 0, z: 0 }): void {
    this.primitives.push({ shape: "box", material, position, rotation, scale, color, ref: this.ref });
  }

  cylinder(material: KitMaterial, position: Vec3, diameter: number, height: number, color = 0): void {
    this.primitives.push({ shape: "cylinder", material, position, rotation: { x: 0, y: 0, z: 0 }, scale: { x: diameter, y: height, z: diameter }, color, ref: this.ref });
  }

  /** Parallelepipedo disteso fra due punti (asse X lungo il segmento), con sezione `height` × `width`. */
  beam(material: KitMaterial, a: Vec3, b: Vec3, height: number, width: number, color = 0): void {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      dz = b.z - a.z;
    const run = Math.hypot(dx, dz);
    const length = Math.hypot(run, dy);
    if (length < 1e-6) return;
    this.box(
      material,
      { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 },
      { x: length, y: height, z: width },
      color,
      { x: 0, y: Math.atan2(-dz, dx), z: Math.atan2(dy, run) },
    );
  }
}

function tileModule(b: Builder, tile: SceneModel["tiles"][number], exits: readonly Vec3[]): void {
  const p = tile.position;
  const half = halfSize(tile.kind);
  const tint = shade(DISTRICT_TINT[tile.district] ?? CONCRETE.light, tile.kind === "fork" ? 1.12 : 1);
  b.ref = { kind: "tile", key: tileKey(tile.id) };
  // Lastra, piastra di calpestio e travi incrociate sotto.
  b.box("concrete", { x: p.x, y: p.y - TILE.thickness / 2, z: p.z }, { x: half * 2, y: TILE.thickness, z: half * 2 }, tint);
  b.box("metal", { x: p.x, y: p.y + 0.02, z: p.z }, { x: half * 2 - 0.35, y: 0.04, z: half * 2 - 0.35 });
  for (const rotation of [0, Math.PI / 2]) {
    b.box("dark", { x: p.x, y: p.y - TILE.thickness - 0.17, z: p.z }, { x: half * 1.8, y: 0.34, z: 0.34 }, 0, { x: 0, y: rotation, z: 0 });
  }
  // Ringhiera lungo il perimetro, interrotta ai punti d'aggancio delle passerelle.
  const edge = half - KIT.railingInset;
  const posts: Vec3[] = [];
  const perimeter = 8 * edge;
  const count = Math.max(4, Math.round(perimeter / KIT.postSpacing));
  for (let i = 0; i < count; i++) {
    const s = (i / count) * perimeter;
    const side = Math.floor(s / (2 * edge));
    const t = s - side * 2 * edge - edge;
    const [x, z] = side === 0 ? [t, -edge] : side === 1 ? [edge, t] : side === 2 ? [-t, edge] : [-edge, -t];
    posts.push({ x: p.x + x, y: p.y, z: p.z + z });
  }
  const kept = posts.map((post) => exits.every((e) => Math.hypot(post.x - e.x, post.z - e.z) > KIT.socketClearance));
  posts.forEach((post, i) => {
    if (!kept[i]) return;
    b.cylinder("metal", { x: post.x, y: p.y + KIT.railingHeight / 2, z: post.z }, 0.08, KIT.railingHeight);
    const next = (i + 1) % posts.length;
    const other = posts[next]!;
    // Corrimano solo fra montanti consecutivi sullo stesso lato (non attraverso gli spigoli né le aperture).
    if (kept[next] && Math.abs(Math.hypot(other.x - post.x, other.z - post.z) - perimeter / count) < 1e-6) {
      b.beam("metal", { ...post, y: p.y + KIT.railingHeight }, { ...other, y: p.y + KIT.railingHeight }, 0.06, 0.06);
    }
  });
  // Bivi, partenza e uscita: lampioni agli spigoli, salvo dove arriva una passerella.
  if (tile.kind !== "path") {
    for (const [sx, sz] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ] as const) {
      const corner = { x: p.x + sx * (edge - 0.15), y: p.y, z: p.z + sz * (edge - 0.15) };
      if (exits.some((e) => Math.hypot(corner.x - e.x, corner.z - e.z) <= KIT.socketClearance)) continue;
      b.cylinder("metal", { x: corner.x, y: p.y + 0.9, z: corner.z }, 0.14, 1.8);
      b.box("dark", { x: corner.x, y: p.y + 1.85, z: corner.z }, { x: 0.32, y: 0.14, z: 0.32 });
    }
  }
}

function pillarModule(b: Builder, tile: SceneModel["tiles"][number]): void {
  const p = tile.position;
  b.ref = { kind: "pillar", key: tileKey(tile.id) };
  const top = p.y - TILE.thickness - 0.34;
  b.box("concrete", { x: p.x, y: top - 0.2, z: p.z }, { x: 1.4, y: 0.4, z: 1.4 }, CONCRETE.pillar);
  const shaftTop = top - 0.4;
  b.box("concrete", { x: p.x, y: (shaftTop + ABYSS_Y) / 2, z: p.z }, { x: 0.8, y: shaftTop - ABYSS_Y, z: 0.8 }, CONCRETE.pillar);
  for (let y = shaftTop - KIT.braceSpacing; y > ABYSS_Y + 2; y -= KIT.braceSpacing) {
    b.box("dark", { x: p.x, y, z: p.z }, { x: 1.15, y: 0.3, z: 1.15 });
  }
}

/**
 * Passerella fra due punti d'aggancio. In piano il piano di calpestio va da
 * aggancio ad aggancio; in pendenza sale da centro a centro, come una rampa che
 * entra sulle piattaforme, così il dislivello si distribuisce su tutto il passo
 * invece di concentrarsi nel tratto libero fra i bordi. Cordoli, corrimano e
 * condotto seguono la stessa pendenza fra i due agganci.
 */
function walkwayModule(b: Builder, segment: SceneSegment, exitA: Vec3, exitB: Vec3, rng: Rng): void {
  b.ref = { kind: "walkway", key: walkwayKey(segment) };
  const total = Math.hypot(segment.b.x - segment.a.x, segment.b.z - segment.a.z);
  const sloped = Math.abs(segment.b.y - segment.a.y) > 1e-6;
  const onSlope = (p: Vec3): Vec3 => {
    if (!sloped || total < 1e-6) return p;
    const t = Math.hypot(p.x - segment.a.x, p.z - segment.a.z) / total;
    return { ...p, y: segment.a.y + (segment.b.y - segment.a.y) * t };
  };
  const start = onSlope(exitA),
    end = onSlope(exitB);
  const dx = end.x - start.x,
    dz = end.z - start.z;
  const run = Math.hypot(dx, dz);
  if (run < 1e-6) return;
  // Normale orizzontale, per cordoli e corrimano ai lati.
  const nx = -dz / run,
    nz = dx / run;
  const side = (p: Vec3, offset: number, lift: number): Vec3 => ({ x: p.x + nx * offset, y: p.y + lift, z: p.z + nz * offset });
  const deck = (p: Vec3): Vec3 => ({ ...p, y: p.y - WALKWAY.thickness / 2 });
  b.beam("concrete", deck(sloped ? segment.a : start), deck(sloped ? segment.b : end), WALKWAY.thickness, WALKWAY.width, CONCRETE.pillar);
  const half = WALKWAY.width / 2 - 0.06;
  for (const offset of [-half, half]) {
    b.beam("dark", side(start, offset, 0.1), side(end, offset, 0.1), 0.2, 0.12);
    b.beam("metal", side(start, offset, KIT.railingHeight), side(end, offset, KIT.railingHeight), 0.06, 0.06);
    const posts = Math.max(1, Math.round(run / 1.1));
    for (let i = 1; i < posts; i++) {
      const t = i / posts;
      const at = { x: start.x + dx * t, y: start.y + (end.y - start.y) * t, z: start.z + dz * t };
      const base = side(at, offset, 0);
      b.cylinder("metal", { ...base, y: base.y + KIT.railingHeight / 2 }, 0.07, KIT.railingHeight);
    }
  }
  // Condotto sotto il piano di calpestio, da un lato scelto in modo stabile.
  const ductSide = rng.chance(0.5) ? 0.35 : -0.35;
  b.beam("dark", side(start, ductSide, -0.55), side(end, ductSide, -0.55), 0.28, 0.28);
}

function massModule(b: Builder, mass: Mass, rng: Rng): void {
  b.ref = { kind: "mass", key: massKey(mass) };
  const height = mass.top - mass.bottom;
  const tint = shade(CONCRETE.mass, 0.9 + rng.next() * 0.2);
  b.box("concrete", { x: mass.x, y: mass.bottom + height / 2, z: mass.z }, { x: mass.width, y: height, z: mass.depth }, tint);
  const lowest = Math.max(mass.bottom, mass.top - KIT.massDecorDepth);
  // Marcapiani: fasce sporgenti a intervallo regolare dalla sommità.
  for (let y = mass.top - KIT.floorSpacing; y > lowest; y -= KIT.floorSpacing) {
    b.box("dark", { x: mass.x, y, z: mass.z }, { x: mass.width + 0.3, y: 0.25, z: mass.depth + 0.3 });
  }
  // Costoloni agli spigoli.
  const ribHeight = mass.top - lowest;
  for (const [sx, sz] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ] as const) {
    b.box("concrete", { x: mass.x + sx * (mass.width / 2), y: lowest + ribHeight / 2, z: mass.z + sz * (mass.depth / 2) }, { x: 0.4, y: ribHeight, z: 0.4 }, shade(tint, 0.8));
  }
  // Macchinari sul tetto: uno o due blocchi e talvolta un serbatoio.
  const blocks = rng.int(1, 2);
  for (let i = 0; i < blocks; i++) {
    const w = mass.width * (0.2 + rng.next() * 0.3),
      d = mass.depth * (0.2 + rng.next() * 0.3),
      h = 0.6 + rng.next() * 1.4;
    const x = mass.x + (rng.next() - 0.5) * (mass.width - w) * 0.8,
      z = mass.z + (rng.next() - 0.5) * (mass.depth - d) * 0.8;
    b.box("dark", { x, y: mass.top + h / 2, z }, { x: w, y: h, z: d });
  }
  if (rng.chance(0.5)) {
    const diameter = Math.min(mass.width, mass.depth) * 0.3;
    b.cylinder("metal", { x: mass.x + mass.width * 0.2, y: mass.top + 0.9, z: mass.z - mass.depth * 0.2 }, diameter, 1.8);
  }
  // Tubazione verticale su una facciata.
  const face = rng.int(0, 3);
  const [px, pz] = face === 0 ? [mass.width / 2 + 0.2, 0] : face === 1 ? [-mass.width / 2 - 0.2, 0] : face === 2 ? [0, mass.depth / 2 + 0.2] : [0, -mass.depth / 2 - 0.2];
  b.cylinder("metal", { x: mass.x + px, y: mass.top - ribHeight / 2, z: mass.z + pz }, 0.3, ribHeight);
}

/** Assembla il kit per gli elementi del modello della scena. */
export function buildKit(model: SceneModel, seed: string): KitResult {
  const b = new Builder();
  const tiles = new Map(model.tiles.map((t) => [t.id, t]));
  const sockets: Record<string, Vec3[]> = Object.fromEntries(model.tiles.map((t) => [t.id, [] as Vec3[]]));
  const ends = model.walkways.map((w) => {
    const from = tiles.get(w.from)!;
    const to = w.to === undefined ? undefined : tiles.get(w.to);
    const dx = w.b.x - w.a.x,
      dz = w.b.z - w.a.z;
    const start = exitPoint(w.a, halfSize(from.kind), dx, dz);
    const end = to ? exitPoint(w.b, halfSize(to.kind), -dx, -dz) : w.b;
    sockets[w.from]!.push(start);
    if (to) sockets[to.id]!.push(end);
    return { start, end };
  });
  for (const stub of model.stubs) {
    const from = tiles.get(stub.from);
    if (from) sockets[stub.from]!.push(exitPoint(stub.a, halfSize(from.kind), stub.b.x - stub.a.x, stub.b.z - stub.a.z));
  }
  for (const tile of model.tiles) {
    tileModule(b, tile, sockets[tile.id]!);
    pillarModule(b, tile);
  }
  model.walkways.forEach((w, i) => walkwayModule(b, w, ends[i]!.start, ends[i]!.end, rngFromSeed(seed, `kit:walkway:${walkwayKey(w)}`)));
  for (const mass of model.masses) massModule(b, mass, rngFromSeed(seed, `kit:mass:${massKey(mass)}`));
  return { primitives: b.primitives, sockets };
}
