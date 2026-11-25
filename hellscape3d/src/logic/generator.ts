/**
 * MapGenerator: rete logica deterministica a partire da seed, tema e configurazione.
 *
 * La rete è una sequenza di corridoi e bivi; i rami di ogni bivio si
 * ricongiungono all'inizio del corridoio successivo. Viene costruita
 * all'indietro dall'uscita, così che per ogni bivio i turni attesi a valle
 * siano già noti e le lunghezze dei rami possano essere scelte in modo che le
 * alternative restino competitive (ramo più corto = domande più difficili).
 */
import { cellValue, type AnswerProfile, type BalanceGraph } from "./balance.ts";
import { canonicalJson } from "./canonical.ts";
import { GENERATOR_VERSION, resolveGeneratorConfig } from "./config.ts";
import { distancesToExit } from "./graph.ts";
import { hashString, rngFromSeed, type Rng } from "./rng.ts";
import { DEFAULT_THEME_ID, getTheme, type CityThemeLogic } from "./themes/index.ts";
import { difficultiesByLength, relativeLabels } from "./labels.ts";
import type { Cell, CityMap, Difficulty, ForkOption, GeneratorConfig } from "./types.ts";
import { validateMap, validateStructure } from "./validate.ts";

export class MapGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MapGenerationError";
  }
}

export interface GenerateOptions {
  seed: string;
  themeId?: string;
  config?: Partial<GeneratorConfig>;
}

type DraftCell = Omit<Cell, "id">;

interface Draft {
  cells: Record<string, DraftCell>;
  /** Ordine di creazione, usato per rimappare gli identificativi in modo deterministico. */
  order: string[];
  startId: string;
  exitId: string;
}

interface Combo {
  lengths: number[];
  gap: number;
}

/** Decisioni del generatore: casuali per i tentativi ordinari, prudenti per il fallback. */
interface Choices {
  rng: Rng;
  forkCount(): number;
  corridorLength(): number;
  branchCount(): number;
  longLength(): number;
  /** `valid` rispetta lo scarto di selezione; `all` è ordinato per scarto crescente. */
  pickCombo(valid: Combo[], all: Combo[]): Combo;
}

/** Lunghezza del tratto virtuale a monte, in multipli delle facce del dado. */
const UPSTREAM_FACTOR = 2;

function randomChoices(rng: Rng, config: GeneratorConfig): Choices {
  return {
    rng,
    forkCount: () => rng.int(...config.forkCount),
    corridorLength: () => rng.int(...config.corridorLength),
    branchCount: () => rng.int(...config.branchesPerFork),
    longLength: () => rng.int(...config.longBranchLength),
    pickCombo: (valid, all) => (valid.length > 0 ? rng.pick(valid) : all[0]!),
  };
}

function fallbackChoices(rng: Rng, config: GeneratorConfig): Choices {
  const mid = ([min, max]: [number, number]): number => Math.ceil((min + max) / 2);
  return {
    rng,
    forkCount: () => config.forkCount[0],
    corridorLength: () => mid(config.corridorLength),
    branchCount: () => 2,
    longLength: () => mid(config.longBranchLength),
    pickCombo: (_valid, all) => all[0]!,
  };
}

/** Tutte le combinazioni di lunghezze crescenti con scarto minimo, l'ultima fissata a `long`. */
function lengthCombos(count: number, long: number, gap: number): number[][] {
  const out: number[][] = [];
  const extend = (prefix: number[]): void => {
    if (prefix.length === count - 1) {
      if (long - prefix[prefix.length - 1]! >= gap) out.push([...prefix, long]);
      return;
    }
    const from = prefix.length === 0 ? 1 : prefix[prefix.length - 1]! + gap;
    for (let length = from; length <= long - gap * (count - 1 - prefix.length); length++) extend([...prefix, length]);
  };
  extend([]);
  return out;
}

function buildDraft(theme: CityThemeLogic, config: GeneratorConfig, choices: Choices): Draft {
  const profile: AnswerProfile = config.answerProfile;
  const faces = config.dieFaces;
  const cells: Record<string, DraftCell> = {};
  const order: string[] = [];
  const values = new Map<string, number>();
  const graph: BalanceGraph = { exitId: "", cells };
  let counter = 0;
  const create = (cell: DraftCell, evaluate = true): string => {
    const id = `t${counter++}`;
    cells[id] = cell;
    order.push(id);
    if (evaluate) values.set(id, cellValue(graph, values, id, profile, faces));
    return id;
  };
  const remove = (id: string): void => {
    delete cells[id];
    values.delete(id);
    order.splice(order.indexOf(id), 1);
  };

  const forkCount = choices.forkCount();
  const corridors = Array.from({ length: forkCount + 1 }, () => choices.corridorLength());
  const districts = choices.rng.shuffle(theme.districts.map((d) => d.id).filter((id) => id !== theme.exitDistrict));
  const districtOf = (group: number): string => districts[Math.floor((group * districts.length) / forkCount)]!;

  const exitId = create({ kind: "exit", next: [], difficulty: config.corridorDifficulty, district: theme.exitDistrict, special: null }, false);
  graph.exitId = exitId;
  values.set(exitId, 0);
  let head = exitId;

  for (let group = forkCount; group >= 0; group--) {
    const district = group === forkCount ? theme.exitDistrict : districtOf(group);
    for (let i = 0; i < corridors[group]!; i++) {
      head = create({ kind: "path", next: [head], difficulty: config.corridorDifficulty, district, special: null });
    }
    if (group === 0) break;

    // Bivio fra il corridoio group-1 e il corridoio group (il cui primo tratto è la casella di ricongiungimento).
    const merge = head;
    const branchDistrict = districtOf(group - 1);
    const count = choices.branchCount();
    const difficulties = difficultiesByLength(count);
    const long = choices.longLength();
    // Per ogni difficoltà una catena di `long` celle verso il ricongiungimento: chains[d][j] dista j passi dal merge.
    const chains = new Map<Difficulty, string[]>();
    for (const difficulty of new Set(difficulties)) {
      const chain = [merge];
      for (let j = 1; j <= long; j++) {
        chain.push(create({ kind: "path", next: [chain[j - 1]!], difficulty, district: branchDistrict, special: null }));
      }
      chains.set(difficulty, chain);
    }
    // Valore di un ramo imposto, misurato da un tratto virtuale a monte: chi arriva attraversando il
    // bivio a metà movimento entra nel ramo con passi già guadagnati (vedi forkBalance).
    const cache = new Map<string, number>();
    const valueOf = (difficulty: Difficulty, length: number): number => {
      const key = `${difficulty}:${length}`;
      if (!cache.has(key)) {
        const temporary = [create({ kind: "fork", next: [chains.get(difficulty)![length]!], difficulty: config.corridorDifficulty, district: branchDistrict, special: null })];
        for (let i = 0; i < UPSTREAM_FACTOR * faces; i++) {
          temporary.push(create({ kind: "path", next: [temporary[temporary.length - 1]!], difficulty: config.corridorDifficulty, district: branchDistrict, special: null }));
        }
        cache.set(key, values.get(temporary[temporary.length - 1]!)!);
        for (const id of temporary.reverse()) remove(id);
      }
      return cache.get(key)!;
    };
    const combos: Combo[] = lengthCombos(count, long, config.minBranchGap)
      .map((lengths) => {
        const branchValues = lengths.map((length, i) => valueOf(difficulties[i]!, length));
        return { lengths, gap: Math.max(...branchValues) - Math.min(...branchValues) };
      })
      .sort((a, b) => a.gap - b.gap);
    if (combos.length === 0) throw new MapGenerationError("Nessuna combinazione di rami compatibile con la configurazione");
    const combo = choices.pickCombo(
      combos.filter((c) => c.gap <= config.selectionMaxTurnGap),
      combos,
    );

    const heads: string[] = [];
    combo.lengths.forEach((length, i) => {
      const chain = chains.get(difficulties[i]!)!;
      heads.push(chain[length]!);
    });
    // Rimuove le celle eccedenti di ogni catena (la catena di una difficoltà serve a un solo ramo).
    for (const [difficulty, chain] of chains) {
      const used = combo.lengths[difficulties.indexOf(difficulty)]!;
      for (let j = chain.length - 1; j > used; j--) remove(chain[j]!);
    }
    head = create({ kind: "fork", next: choices.rng.shuffle(heads), difficulty: config.corridorDifficulty, district: branchDistrict, special: null });
  }

  const startId = create({ kind: "start", next: [head], difficulty: config.corridorDifficulty, district: districtOf(0), special: null });
  placeSpecials(cells, order, startId, theme, config, choices.rng);
  return { cells, order, startId, exitId };
}

function placeSpecials(
  cells: Record<string, DraftCell>,
  order: readonly string[],
  startId: string,
  theme: CityThemeLogic,
  config: GeneratorConfig,
  rng: Rng,
): void {
  const neighbours = new Map<string, Set<string>>(order.map((id) => [id, new Set<string>()]));
  for (const id of order) {
    for (const to of cells[id]!.next) {
      neighbours.get(id)!.add(to);
      neighbours.get(to)!.add(id);
    }
  }
  const afterStart = cells[startId]!.next[0];
  const eligible = order.filter((id) => cells[id]!.kind === "path" && id !== afterStart);
  const target = Math.round(config.specialDensity * eligible.length);
  const chosen: string[] = [];
  for (const id of rng.shuffle(eligible)) {
    if (chosen.length >= target) break;
    if ([...neighbours.get(id)!].some((n) => cells[n]!.special !== null)) continue;
    const kinds = theme.specialKinds;
    const kind =
      chosen.length < kinds.length
        ? kinds[chosen.length]!.id
        : weightedPick(kinds.map((k) => [k.id, k.weight] as const), rng);
    cells[id]!.special = kind;
    chosen.push(id);
  }
}

function weightedPick(entries: readonly (readonly [string, number])[], rng: Rng): string {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng.next() * total;
  for (const [id, weight] of entries) {
    roll -= weight;
    if (roll < 0) return id;
  }
  return entries[entries.length - 1]![0];
}

/** Identificativi opachi: non rivelano ordine di costruzione né distanze. */
function finalize(
  draft: Draft,
  seed: string,
  theme: CityThemeLogic,
  config: GeneratorConfig,
  rng: Rng,
  attempt: number,
  usedFallback: boolean,
): CityMap {
  const permutation = rng.shuffle(draft.order.map((_, i) => i));
  const width = Math.max(2, (draft.order.length - 1).toString(36).length);
  const rename = new Map(draft.order.map((old, i) => [old, `c${permutation[i]!.toString(36).padStart(width, "0")}`]));
  const id = (old: string): string => rename.get(old)!;

  const cells: Record<string, Cell> = {};
  for (const old of [...draft.order].sort((a, b) => (id(a) < id(b) ? -1 : 1))) {
    const cell = draft.cells[old]!;
    cells[id(old)] = { id: id(old), ...cell, next: cell.next.map(id) };
  }
  const exitId = id(draft.exitId);
  const distanceToExit = distancesToExit(cells, exitId);
  const options: Record<string, ForkOption[]> = {};
  for (const cell of Object.values(cells)) {
    if (cell.kind !== "fork") continue;
    const ranked = [...cell.next].sort((a, b) => distanceToExit[a]! - distanceToExit[b]!);
    const labels = relativeLabels(ranked.length);
    options[cell.id] = cell.next.map((to) => ({
      to,
      relative: labels[ranked.indexOf(to)]!,
      difficulty: cells[to]!.difficulty,
    }));
  }
  const startId = id(draft.startId);
  const fingerprint = hashString(
    canonicalJson({ generatorVersion: GENERATOR_VERSION, themeId: theme.id, seed, config, startId, exitId, cells }),
  );
  return {
    generatorVersion: GENERATOR_VERSION,
    themeId: theme.id,
    seed,
    config,
    startId,
    exitId,
    cells,
    options,
    distanceToExit,
    fingerprint,
    attempt,
    usedFallback,
  };
}

/**
 * Genera la mappa. Se nessun tentativo supera la validazione completa entro
 * `maxAttempts`, usa una disposizione prudente che deve almeno superare la
 * validazione strutturale; altrimenti segnala l'errore invece di avviare una
 * partita difettosa.
 */
export function generateCityMap(options: GenerateOptions): CityMap {
  if (typeof options.seed !== "string" || options.seed.length === 0) throw new TypeError("Seed mancante");
  const theme = getTheme(options.themeId ?? DEFAULT_THEME_ID);
  const config = resolveGeneratorConfig(options.config);
  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    const rng = rngFromSeed(options.seed, `map:${attempt}`);
    const map = finalize(buildDraft(theme, config, randomChoices(rng, config)), options.seed, theme, config, rng, attempt, false);
    if (validateMap(map, theme).length === 0) return map;
  }
  const rng = rngFromSeed(options.seed, "map:fallback");
  const map = finalize(buildDraft(theme, config, fallbackChoices(rng, config)), options.seed, theme, config, rng, config.maxAttempts, true);
  const issues = validateStructure(map, theme);
  if (issues.length > 0) throw new MapGenerationError(`Mappa di riserva non valida: ${issues.join("; ")}`);
  return map;
}
