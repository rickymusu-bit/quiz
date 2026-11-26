import type { Difficulty, RelativeLength } from "./types.ts";

/** Difficoltà dei rami ordinati dal più corto al più lungo: più corto, più difficile. */
const DIFFICULTY_BY_BRANCHES: Readonly<Record<number, readonly Difficulty[]>> = {
  2: ["difficile", "facile"],
  3: ["difficile", "media", "facile"],
};

const RELATIVE_BY_BRANCHES: Readonly<Record<number, readonly RelativeLength[]>> = {
  2: ["piu-breve", "piu-lungo"],
  3: ["piu-breve", "intermedio", "piu-lungo"],
};

export const DIFFICULTY_RANK: Readonly<Record<Difficulty, number>> = { facile: 0, media: 1, difficile: 2 };

export function difficultiesByLength(count: number): readonly Difficulty[] {
  const difficulties = DIFFICULTY_BY_BRANCHES[count];
  if (!difficulties) throw new RangeError(`Numero di alternative non supportato: ${count}`);
  return difficulties;
}

export function relativeLabels(count: number): readonly RelativeLength[] {
  const labels = RELATIVE_BY_BRANCHES[count];
  if (!labels) throw new RangeError(`Numero di alternative non supportato: ${count}`);
  return labels;
}
