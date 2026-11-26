import { MEGASTRUTTURE } from "./megastrutture.ts";
import type { CityThemeLogic } from "./theme.ts";

export type { CityThemeLogic, DistrictDef, SpecialKindDef } from "./theme.ts";
export { MEGASTRUTTURE };

const THEMES: Readonly<Record<string, CityThemeLogic>> = Object.freeze({
  [MEGASTRUTTURE.id]: MEGASTRUTTURE,
});

export const DEFAULT_THEME_ID = MEGASTRUTTURE.id;

export function getTheme(id: string): CityThemeLogic {
  const theme = Object.hasOwn(THEMES, id) ? THEMES[id] : undefined;
  if (!theme) throw new Error(`Tema cittadino sconosciuto: ${id}`);
  return theme;
}

export function themeIds(): string[] {
  return Object.keys(THEMES);
}
