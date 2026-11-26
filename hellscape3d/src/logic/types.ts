/** Tipi condivisi del modello logico. Nessuna dipendenza dal rendering. */

export type Difficulty = "facile" | "media" | "difficile";
export const DIFFICULTIES: readonly Difficulty[] = ["facile", "media", "difficile"];

/**
 * Il bivio non è una casella: è il punto di passaggio dopo una casella con più
 * successive. Lo si attraversa soltanto avanzando, scegliendo il ramo senza
 * domanda; non conta come passo.
 */
export type CellKind = "start" | "path" | "exit";

/** Lunghezza relativa del cammino residuo verso l'uscita, l'unica esposta ai giocatori. */
export type RelativeLength = "piu-breve" | "intermedio" | "piu-lungo";

export interface Cell {
  id: string;
  kind: CellKind;
  /** Celle successive: due o tre se dopo la casella c'è un bivio, nessuna per l'uscita, altrimenti una. */
  next: string[];
  /** Difficoltà delle domande poste a chi inizia il turno su questa casella. */
  difficulty: Difficulty;
  district: string;
  /** Tipo di casella speciale del tema, oppure null. */
  special: string | null;
}

export interface ForkOption {
  to: string;
  relative: RelativeLength;
  difficulty: Difficulty;
}

export type Range = [number, number];

export interface GeneratorConfig {
  /** Numero di bivi lungo la rete. */
  forkCount: Range;
  /** Alternative per bivio (2 o 3). */
  branchesPerFork: Range;
  /** Celle dei corridoi lineari fra un bivio e l'altro. */
  corridorLength: Range;
  /** Celle del ramo più lungo di un bivio. */
  longBranchLength: Range;
  /** Scarto minimo in celle fra rami dello stesso bivio. */
  minBranchGap: number;
  dieFaces: number;
  /** Probabilità di risposta corretta ipotizzate per il bilanciamento. */
  answerProfile: Record<Difficulty, number>;
  corridorDifficulty: Difficulty;
  /** Scarto massimo, in turni attesi, fra le alternative di uno stesso bivio. */
  balanceMaxTurnGap: number;
  /** Scarto più stretto usato nella scelta delle lunghezze. */
  selectionMaxTurnGap: number;
  /** Quota delle caselle ordinarie trasformate in caselle speciali. */
  specialDensity: number;
  /** Lunghezza minima del percorso più breve e massima del più lungo, in passi. */
  routeLength: Range;
  maxAttempts: number;
}

export interface CityMap {
  generatorVersion: string;
  themeId: string;
  seed: string;
  config: GeneratorConfig;
  startId: string;
  exitId: string;
  cells: Record<string, Cell>;
  /** Alternative dei bivi, indicizzate dalla casella che precede il bivio, nell'ordine di `next`. */
  options: Record<string, ForkOption[]>;
  /** Uso interno: distanza minima in passi verso l'uscita. Mai esposta all'interfaccia. */
  distanceToExit: Record<string, number>;
  fingerprint: string;
  /** Tentativo che ha prodotto la mappa (0 = primo). */
  attempt: number;
  usedFallback: boolean;
}
