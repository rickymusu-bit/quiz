/**
 * CityBuilder, parte spaziale (specifica §4, passi 2 e 3): colloca le caselle
 * della rete logica in tre dimensioni e aggiunge masse edilizie decorative.
 *
 * Il grafo logico resta la fonte di verità: il layout non aggiunge né toglie
 * archi. Usa flussi pseudocasuali propri (`layout:N`, `decor:masses`), così che
 * una modifica estetica non possa alterare la mappa o i dadi.
 *
 * Struttura supportata: sequenza di corridoi e bivi i cui rami sono catene che
 * si ricongiungono in una stessa casella, come prodotta da MapGenerator 1.x.
 */
import { hasJunction } from "../logic/graph.ts";
import { rngFromSeed, type Rng } from "../logic/rng.ts";
import type { Cell, CityMap } from "../logic/types.ts";
import { distance2D, pointSegmentDistance2D, segmentDistance2D, smoothstep, verticalGap } from "./geometry.ts";
import type { CityLayout, LayoutConfig, Mass, Vec3 } from "./types.ts";

export const LAYOUT_VERSION = "1.0.0";

export const DEFAULT_LAYOUT_CONFIG: Readonly<LayoutConfig> = Object.freeze({
  step: 4,
  turnChance: 0.25,
  rampChance: 0.2,
  rampHeight: 1.5,
  maxHeight: 6,
  bridgeLift: 3,
  lowerDrop: 2.5,
  minCellSpacing: 3,
  edgeClearance: 2,
  verticalClearance: 3.5,
  maxSlope: 0.8,
  maxAttempts: 12,
  massSpacing: 9,
  massClearance: 4.5,
  abyssY: -24,
});

/**
 * Direzione orizzontale, dal punto inquadrato verso la camera, della vista a
 * tre quarti ordinaria. Serve qui per non alzare masse fra camera e percorso.
 */
export const VIEW_DIRECTION = Object.freeze(normalize2D({ x: -0.55, y: 0, z: -1 }));

export class LayoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LayoutError";
  }
}

type Stage =
  | { type: "corridor"; cells: string[] }
  | { type: "fork"; forkId: string; branches: string[][]; mergeId: string };

/** Scompone la rete in corridoi e bivi a catene ricongiunte. */
export function decompose(map: CityMap): Stage[] {
  const indegree = new Map<string, number>(Object.keys(map.cells).map((id) => [id, 0]));
  for (const cell of Object.values(map.cells)) for (const to of cell.next) indegree.set(to, indegree.get(to)! + 1);
  const stages: Stage[] = [];
  let corridor: string[] = [];
  let id: string | null = map.startId;
  const visited = new Set<string>();
  while (id !== null) {
    if (visited.has(id)) throw new LayoutError(`Struttura non supportata: ${id} visitata due volte`);
    visited.add(id);
    const cell: Cell = map.cells[id]!;
    // La casella prima del bivio occupa il punto da cui partono i rami.
    if (!hasJunction(cell)) {
      corridor.push(id);
      id = cell.kind === "exit" ? null : cell.next[0]!;
      continue;
    }
    if (corridor.length > 0) stages.push({ type: "corridor", cells: corridor });
    corridor = [];
    const branches: string[][] = [];
    const ends = new Set<string>();
    for (const head of cell.next) {
      const chain: string[] = [];
      let current = head;
      while (indegree.get(current) === 1 && map.cells[current]!.kind === "path") {
        chain.push(current);
        visited.add(current);
        current = map.cells[current]!.next[0]!;
      }
      branches.push(chain);
      ends.add(current);
    }
    const mergeId = [...ends][0]!;
    if (ends.size !== 1 || map.cells[mergeId]!.kind !== "path" || hasJunction(map.cells[mergeId]!) || branches.some((b) => b.length === 0)) {
      throw new LayoutError(`Struttura del bivio ${id} non supportata`);
    }
    stages.push({ type: "fork", forkId: id, branches, mergeId });
    visited.add(mergeId);
    id = map.cells[mergeId]!.next[0]!;
  }
  if (corridor.length > 0) stages.push({ type: "corridor", cells: corridor });
  if (visited.size !== Object.keys(map.cells).length) throw new LayoutError("Celle non raggiunte dalla scomposizione");
  return stages;
}

/** Direzioni ammesse: +X, +Z, -Z. Il percorso avanza sempre lungo X, così le svolte non lo riportano indietro. */
const HEADINGS: readonly Vec3[] = [
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
];

function normalize2D(v: Vec3): Vec3 {
  const length = Math.hypot(v.x, v.z);
  return { x: v.x / length, y: 0, z: v.z / length };
}

const add = (a: Vec3, b: Vec3, scale = 1): Vec3 => ({ x: a.x + b.x * scale, y: a.y + b.y * scale, z: a.z + b.z * scale });
const perpendicular = (v: Vec3): Vec3 => ({ x: -v.z, y: 0, z: v.x });

function placeAttempt(map: CityMap, stages: readonly Stage[], config: LayoutConfig, rng: Rng | null): Record<string, Vec3> {
  const positions: Record<string, Vec3> = {};
  let heading = 0;
  let pos: Vec3 = { x: 0, y: 0, z: 0 };
  const maybeTurn = (): void => {
    if (!rng || !rng.chance(config.turnChance)) return;
    heading = heading === 0 ? rng.pick([1, 2]) : 0;
  };
  const maybeRamp = (): number => {
    if (!rng || !rng.chance(config.rampChance)) return pos.y;
    const up = pos.y + config.rampHeight <= config.maxHeight;
    const down = pos.y - config.rampHeight >= 0;
    if (up && (!down || rng.chance(0.5))) return pos.y + config.rampHeight;
    return down ? pos.y - config.rampHeight : pos.y;
  };
  const advance = (id: string): void => {
    maybeTurn();
    const y = maybeRamp();
    pos = { ...add(pos, HEADINGS[heading]!, config.step), y };
    positions[id] = pos;
  };

  for (const stage of stages) {
    if (stage.type === "corridor") {
      for (const id of stage.cells) {
        if (id === map.startId) positions[id] = pos;
        else advance(id);
      }
      continue;
    }
    advance(stage.forkId);
    const fork = pos;
    const dir = HEADINGS[heading]!;
    const normal = perpendicular(dir);
    const order = stage.branches.map((_, i) => i).sort((a, b) => stage.branches[a]!.length - stage.branches[b]!.length);
    const shortest = stage.branches[order[0]!]!.length;
    const merge: Vec3 = { ...add(fork, dir, (shortest + 1) * config.step), y: fork.y };
    const sides = rng ? rng.shuffle([1, -1]) : [1, -1];
    order.forEach((branchIndex, rank) => {
      const chain = stage.branches[branchIndex]!;
      const side = rank === 0 ? 0 : sides[rank - 1]!;
      const steps = branchSteps(chain.length, shortest);
      let lift = 0;
      if (rng && chain.length >= 3) {
        lift = rank === 0 ? config.bridgeLift : rng.pick([0, -config.lowerDrop]);
        // Le rampe occupano il 30% del ramo a ciascun estremo; smoothstep ha pendenza massima 1,5 volte la media.
        const maxLift = (config.maxSlope * 0.3 * (chain.length + 1) * config.step) / 1.6;
        lift = Math.sign(lift) * Math.min(Math.abs(lift), maxLift);
      }
      chain.forEach((id, j) => {
        const [along, lateral] = steps[j]!;
        const t = (j + 1) / (chain.length + 1);
        const ramp = smoothstep(Math.min(t, 1 - t) / 0.3);
        const point = add(add(fork, dir, along * config.step), normal, side * lateral * config.step);
        positions[id] = { x: point.x, y: fork.y + lift * ramp, z: point.z };
      });
    });
    positions[stage.mergeId] = merge;
    pos = merge;
  }
  return positions;
}

/**
 * Caselle di un ramo lungo `length` su una griglia di passo unitario, dal bivio
 * (0, 0) al ricongiungimento (shortest + 1, 0), in coordinate (lungo l'asse,
 * laterale). Il ramo esce lateralmente, procede parallelo e rientra; se lo
 * scarto rispetto al ramo più breve è dispari, l'ultimo passo è diagonale.
 * Così ogni passo misura 1 (o √2) e nessuna casella cade a metà di un angolo.
 */
export function branchSteps(length: number, shortest: number): [number, number][] {
  const span = shortest + 1;
  const extra = length - shortest;
  const odd = extra % 2 === 1;
  const out = odd ? (extra + 1) / 2 : extra / 2;
  const points: [number, number][] = [];
  let along = 0,
    lateral = 0;
  for (let i = 0; i < out; i++) points.push([along, ++lateral]);
  for (let i = 0; i < (odd ? span - 1 : span); i++) points.push([++along, lateral]);
  for (let i = 0; i < (odd ? out - 1 : out); i++) points.push([along, --lateral]);
  if (odd) points.push([++along, --lateral]);
  const last = points.pop();
  if (points.length !== length || !last || last[0] !== span || last[1] !== 0) {
    throw new LayoutError(`Ramo di ${length} caselle non disponibile su ${span} passi`);
  }
  return points;
}

function edgesOf(map: CityMap): [string, string][] {
  return Object.values(map.cells).flatMap((cell) => cell.next.map((to): [string, string] => [cell.id, to]));
}

/** Controlli di realizzabilità: caselle distanziate, passerelle senza intersezioni, pendenze accettabili. */
export function validateLayout(map: CityMap, positions: Readonly<Record<string, Vec3>>, config: LayoutConfig = DEFAULT_LAYOUT_CONFIG): string[] {
  const issues: string[] = [];
  const ids = Object.keys(map.cells);
  for (const id of ids) if (!positions[id]) issues.push(`${id}: posizione mancante`);
  if (issues.length > 0) return issues;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = positions[ids[i]!]!,
        b = positions[ids[j]!]!;
      if (distance2D(a, b) < config.minCellSpacing && Math.abs(a.y - b.y) < config.verticalClearance) {
        issues.push(`${ids[i]} e ${ids[j]}: caselle sovrapposte`);
      }
    }
  }
  const edges = edgesOf(map);
  for (const [from, to] of edges) {
    const a = positions[from]!,
      b = positions[to]!;
    const run = distance2D(a, b);
    if (run < config.step * 0.6 || run > config.step * 1.5) issues.push(`${from}→${to}: lunghezza anomala (${run.toFixed(2)})`);
    if (Math.abs(b.y - a.y) / run > config.maxSlope) issues.push(`${from}→${to}: pendenza eccessiva`);
    for (const id of ids) {
      if (id === from || id === to) continue;
      const p = positions[id]!;
      const gap = Math.max(0, Math.min(a.y, b.y) - p.y, p.y - Math.max(a.y, b.y));
      if (pointSegmentDistance2D(p, a, b) < config.edgeClearance && gap < config.verticalClearance) {
        issues.push(`${from}→${to}: attraversa la casella ${id}`);
      }
    }
  }
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const [a1, b1] = edges[i]!,
        [a2, b2] = edges[j]!;
      if (a1 === a2 || a1 === b2 || b1 === a2 || b1 === b2) continue;
      const p = positions[a1]!,
        q = positions[b1]!,
        r = positions[a2]!,
        s = positions[b2]!;
      if (segmentDistance2D(p, q, r, s) < config.edgeClearance && verticalGap(p, q, r, s) < config.verticalClearance) {
        issues.push(`${a1}→${b1} e ${a2}→${b2}: passerelle troppo vicine`);
      }
    }
  }
  return issues;
}

/** Masse edilizie sulla griglia, lontane dal percorso; più basse del percorso dal lato della camera. */
function placeMasses(map: CityMap, positions: Readonly<Record<string, Vec3>>, config: LayoutConfig): Mass[] {
  const rng = rngFromSeed(map.seed, "decor:masses");
  const points = Object.values(positions);
  const edges = edgesOf(map).map(([a, b]) => [positions[a]!, positions[b]!] as const);
  const margin = 14;
  const minX = Math.min(...points.map((p) => p.x)) - margin,
    maxX = Math.max(...points.map((p) => p.x)) + margin,
    minZ = Math.min(...points.map((p) => p.z)) - margin,
    maxZ = Math.max(...points.map((p) => p.z)) + margin;
  const masses: Mass[] = [];
  for (let x = minX; x <= maxX; x += config.massSpacing) {
    for (let z = minZ; z <= maxZ; z += config.massSpacing) {
      const centre: Vec3 = { x: x + (rng.next() - 0.5) * 3, y: 0, z: z + (rng.next() - 0.5) * 3 };
      let nearest = Infinity;
      let nearestY = 0;
      let nearestPoint = centre;
      for (const [a, b] of edges) {
        const d = pointSegmentDistance2D(centre, a, b);
        if (d < nearest) {
          nearest = d;
          nearestY = Math.max(a.y, b.y);
          nearestPoint = distance2D(centre, a) < distance2D(centre, b) ? a : b;
        }
      }
      const room = nearest - config.massClearance;
      if (room < 1.5 || rng.chance(0.25)) continue;
      const half = Math.min(4, room / Math.SQRT2);
      const width = 2 * half * (0.6 + 0.4 * rng.next());
      const depth = 2 * half * (0.6 + 0.4 * rng.next());
      const towardCamera = (centre.x - nearestPoint.x) * VIEW_DIRECTION.x + (centre.z - nearestPoint.z) * VIEW_DIRECTION.z > 0;
      const top = towardCamera ? nearestY - 2 - rng.next() * 4 : nearestY - 2 + rng.next() * 18;
      masses.push({ x: centre.x, z: centre.z, width, depth, bottom: config.abyssY, top });
    }
  }
  return masses;
}

/**
 * Layout deterministico per mappa e configurazione. Prova più disposizioni con
 * svolte e dislivelli; se nessuna è realizzabile usa quella rettilinea, valida
 * per costruzione, e la verifica comunque.
 */
export function buildCityLayout(map: CityMap, partial: Partial<LayoutConfig> = {}): CityLayout {
  const config: LayoutConfig = { ...DEFAULT_LAYOUT_CONFIG, ...partial };
  const stages = decompose(map);
  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    const positions = placeAttempt(map, stages, config, rngFromSeed(map.seed, `layout:${attempt}`));
    if (validateLayout(map, positions, config).length === 0) {
      return { layoutVersion: LAYOUT_VERSION, positions, masses: placeMasses(map, positions, config), attempt, usedFallback: false };
    }
  }
  const positions = placeAttempt(map, stages, config, null);
  const issues = validateLayout(map, positions, config);
  if (issues.length > 0) throw new LayoutError(`Layout di riserva non valido: ${issues.slice(0, 3).join("; ")}`);
  return { layoutVersion: LAYOUT_VERSION, positions, masses: placeMasses(map, positions, config), attempt: config.maxAttempts, usedFallback: true };
}
