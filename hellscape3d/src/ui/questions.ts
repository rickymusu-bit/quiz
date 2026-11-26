/**
 * Domande FITTIZIE per il prototipo: semplici calcoli aritmetici, etichettati
 * come tali, scelti in modo deterministico per partita, turno e giocatore.
 * Servono a provare flusso, regia e timer; il collegamento alle banche di
 * domande reali è un passo separato.
 */
import { rngFromSeed, type Rng } from "../logic/rng.ts";
import type { Difficulty } from "../logic/types.ts";

export interface FakeQuestion {
  difficulty: Difficulty;
  text: string;
  options: string[];
  correctIndex: number;
}

export const DIFFICULTY_LABELS: Readonly<Record<Difficulty, string>> = { facile: "facile", media: "media", difficile: "difficile" };

function expression(difficulty: Difficulty, rng: Rng): { text: string; value: number; operands: number[] } {
  switch (difficulty) {
    case "facile": {
      const a = rng.int(2, 9),
        b = rng.int(2, 9);
      return { text: `${a} + ${b}`, value: a + b, operands: [a, b] };
    }
    case "media": {
      const a = rng.int(3, 12),
        b = rng.int(3, 9);
      return { text: `${a} × ${b}`, value: a * b, operands: [a, b] };
    }
    case "difficile": {
      const a = rng.int(11, 19),
        b = rng.int(3, 9),
        c = rng.int(5, 30);
      return { text: `${a} × ${b} − ${c}`, value: a * b - c, operands: [a, b, c] };
    }
  }
}

export function fakeQuestion(seed: string, turn: number, playerId: string, difficulty: Difficulty): FakeQuestion {
  const rng = rngFromSeed(seed, `fake-question:${turn}:${playerId}`);
  const { text, value, operands } = expression(difficulty, rng);
  const candidates = rng.shuffle([value + 1, value - 1, value + 2, value - 2, value + 10, value - 10, ...operands.map((o) => value + o)]);
  const distractors: number[] = [];
  for (const candidate of candidates) {
    if (candidate > 0 && candidate !== value && !distractors.includes(candidate)) distractors.push(candidate);
    if (distractors.length === 3) break;
  }
  const options = rng.shuffle([value, ...distractors]);
  return {
    difficulty,
    text: `Domanda fittizia, ${DIFFICULTY_LABELS[difficulty]}: quanto fa ${text}?`,
    options: options.map(String),
    correctIndex: options.indexOf(value),
  };
}
