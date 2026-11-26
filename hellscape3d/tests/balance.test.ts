import assert from "node:assert/strict";
import { test } from "node:test";
import { expectedTurns, generateCityMap, type AnswerProfile } from "../src/logic/index.ts";
import { meanEscapeTurns, STRATEGIES } from "../src/logic/simulate.ts";

const PROFILE: AnswerProfile = { facile: 0.8, media: 0.5, difficile: 0.25 };

test("turni attesi: casi calcolabili a mano", () => {
  const cells = {
    s: { next: ["m"], difficulty: "media" as const },
    m: { next: ["e"], difficulty: "facile" as const },
    e: { next: [], difficulty: "media" as const },
  };
  const values = expectedTurns({ exitId: "e", cells }, PROFILE, 6);
  assert.equal(values.get("e"), 0);
  // A un passo dall'uscita basta una risposta corretta: 1/p.
  assert.ok(Math.abs(values.get("m")! - 1 / 0.8) < 1e-12);
  // A due passi: (1 + p·(1/6)·E(m)) / p, perché solo l'1 lascia sulla casella intermedia.
  assert.ok(Math.abs(values.get("s")! - (1 + 0.5 * (1 / 6) * (1 / 0.8)) / 0.5) < 1e-12);
});

test("simulazioni sul motore: nessuna strategia di scelta ai bivi domina in modo manifesto", () => {
  for (let i = 0; i < 10; i++) {
    const map = generateCityMap({ seed: `bilanciamento-${i}` });
    const profile = map.config.answerProfile;
    const means = Object.values(STRATEGIES).map((strategy) => meanEscapeTurns(map, strategy, profile, 200));
    const ratio = Math.max(...means) / Math.min(...means);
    assert.ok(ratio < 1.07, `${map.seed}: turni medi ${means.map((m) => m.toFixed(2)).join(" / ")}`);
  }
});
