import { DIFFICULTIES, type GeneratorConfig, type Range } from "./types.ts";

/**
 * Versione del generatore. Va incrementata a ogni modifica che, a parità di
 * seed, tema e configurazione, produce una mappa diversa: i salvataggi la usano
 * per riconoscere mondi non più riproducibili.
 */
export const GENERATOR_VERSION = "2.0.0";

/**
 * Valori PROVVISORI per il prototipo. Lunghezza della gara, numero dei bivi e
 * profili di bilanciamento sono decisioni aperte (specifica, §10).
 */
export const DEFAULT_GENERATOR_CONFIG: Readonly<GeneratorConfig> = Object.freeze({
  forkCount: [2, 3],
  branchesPerFork: [2, 3],
  corridorLength: [2, 4],
  longBranchLength: [7, 12],
  minBranchGap: 2,
  dieFaces: 6,
  answerProfile: { facile: 0.85, media: 0.65, difficile: 0.45 },
  corridorDifficulty: "media",
  balanceMaxTurnGap: 0.6,
  selectionMaxTurnGap: 0.45,
  specialDensity: 0.15,
  routeLength: [14, 60],
  maxAttempts: 6,
} satisfies GeneratorConfig);

function checkRange(name: string, value: unknown, min: number, max = Infinity): Range {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !value.every(Number.isInteger) ||
    value[0] > value[1] ||
    value[0] < min ||
    value[1] > max
  ) {
    throw new RangeError(`Configurazione non valida: ${name}`);
  }
  return [value[0], value[1]];
}

function checkNumber(name: string, value: unknown, min: number, max: number, integer = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    throw new RangeError(`Configurazione non valida: ${name}`);
  }
  return value;
}

/** Unisce i valori predefiniti con quelli forniti e li convalida. */
export function resolveGeneratorConfig(partial: Partial<GeneratorConfig> = {}): GeneratorConfig {
  const merged = { ...DEFAULT_GENERATOR_CONFIG, ...partial };
  const profile = { ...DEFAULT_GENERATOR_CONFIG.answerProfile, ...partial.answerProfile };
  for (const difficulty of DIFFICULTIES) checkNumber(`answerProfile.${difficulty}`, profile[difficulty], 0.01, 1);
  if (!DIFFICULTIES.includes(merged.corridorDifficulty)) throw new RangeError("Configurazione non valida: corridorDifficulty");
  const config: GeneratorConfig = {
    forkCount: checkRange("forkCount", merged.forkCount, 1, 12),
    branchesPerFork: checkRange("branchesPerFork", merged.branchesPerFork, 2, 3),
    // Almeno due caselle: quella di ricongiungimento e quella prima del bivio successivo sono distinte.
    corridorLength: checkRange("corridorLength", merged.corridorLength, 2, 40),
    longBranchLength: checkRange("longBranchLength", merged.longBranchLength, 3, 60),
    minBranchGap: checkNumber("minBranchGap", merged.minBranchGap, 1, 20, true),
    dieFaces: checkNumber("dieFaces", merged.dieFaces, 2, 20, true),
    answerProfile: { facile: profile.facile, media: profile.media, difficile: profile.difficile },
    corridorDifficulty: merged.corridorDifficulty,
    balanceMaxTurnGap: checkNumber("balanceMaxTurnGap", merged.balanceMaxTurnGap, 0, 100),
    selectionMaxTurnGap: checkNumber("selectionMaxTurnGap", merged.selectionMaxTurnGap, 0, 100),
    specialDensity: checkNumber("specialDensity", merged.specialDensity, 0, 0.5),
    routeLength: checkRange("routeLength", merged.routeLength, 2),
    maxAttempts: checkNumber("maxAttempts", merged.maxAttempts, 1, 50, true),
  };
  const [, maxBranches] = config.branchesPerFork;
  if (config.longBranchLength[0] - (maxBranches - 1) * config.minBranchGap < 1) {
    throw new RangeError("Configurazione non valida: longBranchLength troppo corto per i rami e lo scarto richiesti");
  }
  return config;
}
