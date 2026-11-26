/**
 * Salvataggio e ripresa. Si conservano seed, tema, configurazione e versione
 * del generatore: la mappa viene rigenerata e confrontata con l'impronta
 * salvata, così che ricaricando si ritrovi lo stesso mondo.
 *
 * La chiave è distinta da quelle del runner pubblicato (`fool-v1`,
 * `fool-settings-v1`), che non vengono lette, modificate né interpretate.
 */
import { GENERATOR_VERSION } from "./config.ts";
import { resolveRules, type Game } from "./engine.ts";
import { generateCityMap } from "./generator.ts";
import { isRngState } from "./rng.ts";
import type { GameState } from "./state.ts";
import { DIFFICULTIES, type CityMap, type GeneratorConfig } from "./types.ts";

export const SAVE_KEY = "hellscape3d-save";
export const SAVE_FORMAT = "hellscape3d-save";
export const SAVE_VERSION = 1;

export interface SaveFile {
  format: typeof SAVE_FORMAT;
  saveVersion: number;
  generatorVersion: string;
  themeId: string;
  seed: string;
  generatorConfig: GeneratorConfig;
  mapFingerprint: string;
  state: GameState;
}

export class SaveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaveError";
  }
}

export function toSaveFile(game: Game): SaveFile {
  return {
    format: SAVE_FORMAT,
    saveVersion: SAVE_VERSION,
    generatorVersion: game.map.generatorVersion,
    themeId: game.map.themeId,
    seed: game.map.seed,
    generatorConfig: structuredClone(game.map.config),
    mapFingerprint: game.map.fingerprint,
    state: structuredClone(game.state),
  };
}

export function serializeGame(game: Game): string {
  return JSON.stringify(toSaveFile(game));
}

export function deserializeGame(json: string): Game {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new SaveError("Salvataggio illeggibile");
  }
  if (!isRecord(data) || data.format !== SAVE_FORMAT) throw new SaveError("Non è un salvataggio di Hellscape 3D");
  if (data.saveVersion !== SAVE_VERSION) throw new SaveError(`Versione del salvataggio non supportata: ${String(data.saveVersion)}`);
  if (data.generatorVersion !== GENERATOR_VERSION) {
    // Nessuna migrazione: un generatore diverso non garantisce lo stesso mondo.
    throw new SaveError(`Il salvataggio richiede il generatore ${String(data.generatorVersion)}, disponibile ${GENERATOR_VERSION}`);
  }
  if (typeof data.seed !== "string" || typeof data.themeId !== "string" || !isRecord(data.generatorConfig)) {
    throw new SaveError("Parametri del mondo mancanti");
  }
  let map: CityMap;
  try {
    map = generateCityMap({ seed: data.seed, themeId: data.themeId, config: data.generatorConfig as Partial<GeneratorConfig> });
  } catch (error) {
    throw new SaveError(`Impossibile ricostruire il mondo: ${(error as Error).message}`);
  }
  if (map.fingerprint !== data.mapFingerprint) throw new SaveError("Il mondo ricostruito non corrisponde al salvataggio");
  const issues = validateState(map, data.state);
  if (issues.length > 0) throw new SaveError(`Stato non valido: ${issues.join("; ")}`);
  return { map, state: data.state as GameState };
}

/** Coerenza dello stato rispetto alla mappa. */
export function validateState(map: CityMap, value: unknown): string[] {
  if (!isRecord(value) || value.format !== "hellscape3d-state") return ["formato dello stato sconosciuto"];
  const state = value as unknown as GameState;
  const issues: string[] = [];
  const has = (id: unknown): boolean => typeof id === "string" && Object.hasOwn(map.cells, id);
  try {
    resolveRules(state.rules);
  } catch {
    issues.push("regole non valide");
  }
  if (!Array.isArray(state.players) || state.players.length === 0) return [...issues, "giocatori assenti"];
  const ids = new Set<string>();
  for (const player of state.players) {
    if (!isRecord(player) || typeof player.id !== "string" || typeof player.name !== "string" || ids.has(player.id)) {
      issues.push("giocatore non valido");
      continue;
    }
    ids.add(player.id);
    if (!has(player.cellId)) issues.push(`${player.id}: casella inesistente`);
    if (player.escaped !== (player.cellId === map.exitId)) issues.push(`${player.id}: stato di fuga incoerente`);
  }
  if (!Number.isInteger(state.activeIndex) || state.activeIndex < 0 || state.activeIndex >= state.players.length) {
    return [...issues, "giocatore attivo non valido"];
  }
  if (!Number.isInteger(state.turn) || state.turn < 1) issues.push("numero di turno non valido");
  if (!Array.isArray(state.explored) || !state.explored.every(has)) issues.push("aree esplorate non valide");
  else for (const player of state.players) if (!state.explored.includes(player.cellId)) issues.push(`${player.id}: casella non esplorata`);
  if (!isRngState(state.dice)) issues.push("stato del dado non valido");

  const active = state.players[state.activeIndex]!;
  const cell = map.cells[active.cellId];
  const options = map.options[active.cellId] ?? [];
  const committedOk = state.committedBranch === null || options.some((o) => o.to === state.committedBranch);
  const difficultyOk = state.questionDifficulty === null || DIFFICULTIES.includes(state.questionDifficulty);
  if (!committedOk) issues.push("ramo impegnato non valido");
  if (!difficultyOk) issues.push("difficoltà non valida");
  switch (state.phase) {
    case "fork":
      if (cell?.kind !== "fork" || (state.forkContext !== "turn-start" && state.forkContext !== "movement")) issues.push("fase di scelta incoerente");
      if (state.forkContext === "movement" && !(Number.isInteger(state.stepsLeft) && state.stepsLeft > 0)) issues.push("passi residui non validi");
      break;
    case "question":
    case "roll":
      if (state.questionDifficulty === null || state.forkContext !== null) issues.push("fase della domanda incoerente");
      if (cell?.kind === "fork" && state.committedBranch === null) issues.push("bivio senza ramo scelto");
      break;
    case "ended":
      if (state.winnerId === null || !state.players.some((p) => p.id === state.winnerId && p.escaped)) issues.push("vincitore non valido");
      break;
    default:
      issues.push("fase sconosciuta");
  }
  if (state.phase !== "ended" && (state.winnerId !== null || state.players.some((p) => p.escaped))) issues.push("partita conclusa non segnata");
  return issues;
}

/** Interfaccia minima compatibile con `localStorage`. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function saveToStorage(storage: KeyValueStorage, game: Game): void {
  storage.setItem(SAVE_KEY, serializeGame(game));
}

/** null se non esiste un salvataggio del nuovo modello. */
export function loadFromStorage(storage: KeyValueStorage): Game | null {
  const json = storage.getItem(SAVE_KEY);
  return json === null ? null : deserializeGame(json);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
