/** Modello logico di Hellscape 3D: punto di ingresso pubblico. */
export * from "./types.ts";
export * from "./state.ts";
export { GENERATOR_VERSION, DEFAULT_GENERATOR_CONFIG, resolveGeneratorConfig } from "./config.ts";
export { generateCityMap, MapGenerationError, type GenerateOptions } from "./generator.ts";
export { validateMap, validateStructure, validateBalance } from "./validate.ts";
export { expectedTurns, forkBalance, type AnswerProfile, type ForkBalance } from "./balance.ts";
export { applyAction, createGame, startGame, resolveRules, GameRuleError, DEFAULT_RULES, MAX_PLAYERS } from "./engine.ts";
export type { Game, PlayerSetup, Transition } from "./engine.ts";
export { publicView, type PublicView, type PublicCell, type PublicForkOption } from "./exploration.ts";
export {
  SAVE_KEY,
  SAVE_VERSION,
  SaveError,
  deserializeGame,
  loadFromStorage,
  saveToStorage,
  serializeGame,
  validateState,
  type KeyValueStorage,
  type SaveFile,
} from "./persistence.ts";
export { randomSeed, rngFromSeed, type Rng, type RngState } from "./rng.ts";
export { getTheme, themeIds, DEFAULT_THEME_ID, MEGASTRUTTURE, type CityThemeLogic } from "./themes/index.ts";
