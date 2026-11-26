/**
 * Avvio e ripresa della partita nella pagina di prova (specifica §7, §9).
 *
 * Senza parametri si riprende la partita salvata; `?seed=`, `?steps=` o
 * `?new=1` avviano esplicitamente una partita nuova, che sostituisce il
 * salvataggio. Un salvataggio incompatibile non viene perso: lo si sposta in
 * una chiave di riserva prima di cominciare una partita nuova.
 */
import type { Game } from "./logic/engine.ts";
import { loadFromStorage, SaveError, SAVE_KEY, type KeyValueStorage } from "./logic/persistence.ts";

export const DISCARDED_SAVE_KEY = "hellscape3d-save-scartato";
export const QUESTION_CLOCK_KEY = "hellscape3d-domanda";

export type StartDecision = { kind: "resume"; game: Game } | { kind: "new"; seed: string; notice: string | null };

export function decideStart(params: URLSearchParams, storage: KeyValueStorage, defaultSeed: string): StartDecision {
  const explicit = params.has("seed") || params.has("steps") || params.get("new") === "1";
  const seed = params.get("seed") ?? defaultSeed;
  if (explicit) return { kind: "new", seed, notice: null };
  try {
    const game = loadFromStorage(storage);
    return game ? { kind: "resume", game } : { kind: "new", seed, notice: null };
  } catch (error) {
    if (!(error instanceof SaveError)) throw error;
    const raw = storage.getItem(SAVE_KEY);
    if (raw !== null) storage.setItem(DISCARDED_SAVE_KEY, raw);
    return { kind: "new", seed, notice: `Salvataggio non utilizzabile (${error.message}): conservato a parte, nuova partita.` };
  }
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
