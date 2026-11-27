/**
 * Avvio e ripresa della partita nella pagina di prova (specifica §7, §9).
 *
 * Senza parametri si riprende la partita salvata; se non c'è, si apre la
 * schermata di avvio. `?new=1` apre la schermata di avvio anche se esiste un
 * salvataggio. `?seed=` e `?steps=` (sviluppo e test) avviano subito una
 * partita nuova con le impostazioni predefinite. Una partita nuova sostituisce
 * il salvataggio; un salvataggio incompatibile non viene perso: lo si sposta in
 * una chiave di riserva e si apre la schermata di avvio con un avviso.
 */
import type { Game } from "./logic/engine.ts";
import { MAX_PLAYERS } from "./logic/engine.ts";
import type { Difficulty } from "./logic/types.ts";
import type { QuestionBank } from "./questions/bank.ts";
import { loadFromStorage, SaveError, SAVE_KEY, type KeyValueStorage } from "./logic/persistence.ts";

export const DISCARDED_SAVE_KEY = "hellscape3d-save-scartato";
export const QUESTION_CLOCK_KEY = "hellscape3d-domanda";

export type StartDecision =
  | { kind: "resume"; game: Game }
  /** Sviluppo e test: partita nuova subito, con le impostazioni predefinite. */
  | { kind: "new"; seed: string; notice: string | null }
  /** Schermata di avvio; `saved` indica che esiste una partita da riprendere. */
  | { kind: "setup"; notice: string | null; saved: boolean };

export function decideStart(params: URLSearchParams, storage: KeyValueStorage, defaultSeed: string): StartDecision {
  if (params.has("seed") || params.has("steps")) return { kind: "new", seed: params.get("seed") ?? defaultSeed, notice: null };
  try {
    const game = loadFromStorage(storage);
    if (params.get("new") === "1") return { kind: "setup", notice: null, saved: game !== null };
    return game ? { kind: "resume", game } : { kind: "setup", notice: null, saved: false };
  } catch (error) {
    if (!(error instanceof SaveError)) throw error;
    const raw = storage.getItem(SAVE_KEY);
    if (raw !== null) storage.setItem(DISCARDED_SAVE_KEY, raw);
    return { kind: "setup", notice: `Salvataggio non utilizzabile (${error.message}): conservato a parte. Imposta una nuova partita.`, saved: false };
  }
}

/** Impostazioni scelte nella schermata di avvio. */
export interface GameSettings {
  bankId: string;
  /** Argomenti in gioco; vuoto = tutti. */
  topics: string[];
  /** Nomi dei giocatori, nell'ordine di gioco. */
  players: string[];
  /** Durata della domanda, in secondi. */
  seconds: number;
}

export const SETTINGS_KEY = "hellscape3d-impostazioni";
export const SECONDS_RANGE: readonly [number, number] = [10, 300];
export const NAME_MAX = 24;

export const defaultName = (index: number): string => `Dannato ${index + 1}`;

/** Livelli di domanda assenti dagli argomenti scelti: la partita non può cominciare. */
export function missingDifficulties(bank: QuestionBank, topics: readonly string[]): Difficulty[] {
  const pool = topics.length === 0 ? bank.questions : bank.questions.filter((q) => topics.includes(q.topic));
  return (["facile", "media", "difficile"] as const).filter((d) => !pool.some((q) => q.difficulty === d));
}

/** Problemi delle impostazioni rispetto alla banca scelta; vuoto se si può cominciare. */
export function settingsIssues(settings: GameSettings, bank: QuestionBank): string[] {
  const issues: string[] = [];
  if (settings.bankId !== bank.id) issues.push("banca diversa da quella caricata");
  if (settings.players.length < 1 || settings.players.length > MAX_PLAYERS) issues.push(`da 1 a ${MAX_PLAYERS} giocatori`);
  if (settings.players.some((name) => name.trim() === "" || name.length > NAME_MAX)) issues.push(`nomi da 1 a ${NAME_MAX} caratteri`);
  if (!Number.isInteger(settings.seconds) || settings.seconds < SECONDS_RANGE[0] || settings.seconds > SECONDS_RANGE[1]) issues.push(`durata da ${SECONDS_RANGE[0]} a ${SECONDS_RANGE[1]} secondi`);
  const missing = missingDifficulties(bank, settings.topics);
  if (missing.length > 0) issues.push(`agli argomenti scelti mancano domande ${missing.join(", ")}`);
  return issues;
}

/** Ultime impostazioni usate, per precompilare la schermata; null se assenti o illeggibili. */
export function loadLastSettings(storage: KeyValueStorage): GameSettings | null {
  try {
    const data = JSON.parse(storage.getItem(SETTINGS_KEY) ?? "null") as Partial<GameSettings> | null;
    if (!data || typeof data.bankId !== "string" || !Array.isArray(data.topics) || !Array.isArray(data.players) || typeof data.seconds !== "number") return null;
    return { bankId: data.bankId, topics: data.topics.filter((t) => typeof t === "string"), players: data.players.filter((p) => typeof p === "string").slice(0, MAX_PLAYERS), seconds: data.seconds };
  } catch {
    return null;
  }
}

export function saveLastSettings(storage: KeyValueStorage, settings: GameSettings): void {
  storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/** Chiave della domanda in corso: partita, turno e giocatore. */
export function questionKey(seed: string, turn: number, playerId: string): string {
  return `${seed}:q:${turn}:${playerId}`;
}

/** Tempo residuo della domanda `key`, se salvato; altrimenti null. */
export function loadQuestionClock(storage: KeyValueStorage, key: string): number | null {
  try {
    const data: unknown = JSON.parse(storage.getItem(QUESTION_CLOCK_KEY) ?? "null");
    if (data && typeof data === "object" && (data as { key?: unknown }).key === key) {
      const remaining = (data as { remaining?: unknown }).remaining;
      if (typeof remaining === "number" && Number.isFinite(remaining) && remaining >= 0) return remaining;
    }
  } catch {
    // Valore illeggibile: la domanda riparte con il tempo pieno.
  }
  return null;
}

export function saveQuestionClock(storage: KeyValueStorage, key: string, remaining: number): void {
  storage.setItem(QUESTION_CLOCK_KEY, JSON.stringify({ key, remaining }));
}

/** Archivio in memoria, se `localStorage` non è disponibile (la partita funziona ma non si riprende). */
export function memoryStorage(): KeyValueStorage {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}
