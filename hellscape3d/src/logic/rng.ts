/**
 * Generatori pseudocasuali deterministici.
 *
 * Ogni sequenza è identificata da seed e nome del flusso: la logica (mappa,
 * dado) e la decorazione grafica usano flussi distinti, così una modifica
 * estetica non può alterare dadi o topologia.
 */

export type RngState = [number, number, number, number];

export interface Rng {
  /** Numero in [0, 1). */
  next(): number;
  /** Intero in [min, max], estremi inclusi. */
  int(min: number, max: number): number;
  chance(probability: number): boolean;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  /** Stato corrente, serializzabile in JSON. */
  snapshot(): RngState;
}

/** Hash cyrb128: quattro parole a 32 bit derivate da una stringa. */
export function hashToState(text: string): RngState {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0; i < text.length; i++) {
    const k = text.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/** Impronta esadecimale di 32 caratteri. */
export function hashString(text: string): string {
  return hashToState(text)
    .map((word) => word.toString(16).padStart(8, "0"))
    .join("");
}

export function isRngState(value: unknown): value is RngState {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((word) => Number.isInteger(word) && word >= 0 && word <= 0xffffffff)
  );
}

/** sfc32 a partire da uno stato esplicito (per esempio ripreso da un salvataggio). */
export function rngFromState(state: RngState): Rng {
  if (!isRngState(state)) throw new TypeError("Stato del generatore pseudocasuale non valido");
  let [a, b, c, d] = state;
  const next = (): number => {
    const t0 = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    const t = (t0 + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  const int = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError(`Intervallo non valido: [${min}, ${max}]`);
    }
    return min + Math.floor(next() * (max - min + 1));
  };
  return {
    next,
    int,
    chance: (probability) => next() < probability,
    pick: (items) => {
      if (items.length === 0) throw new RangeError("Impossibile scegliere da un elenco vuoto");
      return items[int(0, items.length - 1)] as (typeof items)[number];
    },
    shuffle: (items) => {
      const out = items.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(0, i);
        [out[i], out[j]] = [out[j]!, out[i]!];
      }
      return out;
    },
    snapshot: () => [a >>> 0, b >>> 0, c >>> 0, d >>> 0],
  };
}

/** Flusso nominato derivato da un seed. */
export function rngFromSeed(seed: string, stream: string): Rng {
  const rng = rngFromState(hashToState(`${seed}\u0000${stream}`));
  for (let i = 0; i < 12; i++) rng.next();
  return rng;
}

/** Seed casuale per una nuova partita (16 cifre esadecimali). */
export function randomSeed(): string {
  const words = new Uint32Array(2);
  globalThis.crypto.getRandomValues(words);
  return Array.from(words, (word) => word.toString(16).padStart(8, "0")).join("");
}
