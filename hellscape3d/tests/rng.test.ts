import assert from "node:assert/strict";
import { test } from "node:test";
import { hashString, randomSeed, rngFromSeed, rngFromState } from "../src/logic/rng.ts";

test("lo stesso seed e lo stesso flusso producono la stessa sequenza", () => {
  const a = rngFromSeed("seed", "dice");
  const b = rngFromSeed("seed", "dice");
  for (let i = 0; i < 100; i++) assert.equal(a.next(), b.next());
});

test("flussi diversi dello stesso seed sono indipendenti", () => {
  const dice = Array.from({ length: 20 }, ((rng) => () => rng.int(1, 6))(rngFromSeed("seed", "dice")));
  const decor = Array.from({ length: 20 }, ((rng) => () => rng.int(1, 6))(rngFromSeed("seed", "decor")));
  assert.notDeepEqual(dice, decor);
});

test("lo stato serializzato riprende la sequenza", () => {
  const rng = rngFromSeed("seed", "dice");
  for (let i = 0; i < 7; i++) rng.next();
  const restored = rngFromState(JSON.parse(JSON.stringify(rng.snapshot())));
  for (let i = 0; i < 50; i++) assert.equal(restored.next(), rng.next());
});

test("int rispetta gli estremi e copre tutte le facce", () => {
  const rng = rngFromSeed("seed", "faces");
  const seen = new Set<number>();
  for (let i = 0; i < 2000; i++) {
    const value = rng.int(1, 6);
    assert.ok(value >= 1 && value <= 6 && Number.isInteger(value));
    seen.add(value);
  }
  assert.equal(seen.size, 6);
  assert.throws(() => rng.int(3, 2), RangeError);
});

test("shuffle restituisce una permutazione senza modificare l'originale", () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8];
  const shuffled = rngFromSeed("seed", "shuffle").shuffle(items);
  assert.deepEqual(items, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual([...shuffled].sort(), items);
});

test("stato non valido rifiutato, seed casuali distinti, impronte stabili", () => {
  assert.throws(() => rngFromState([1, 2, 3] as never), TypeError);
  assert.notEqual(randomSeed(), randomSeed());
  assert.match(randomSeed(), /^[0-9a-f]{16}$/);
  assert.equal(hashString("abc"), hashString("abc"));
  assert.notEqual(hashString("abc"), hashString("abd"));
});
