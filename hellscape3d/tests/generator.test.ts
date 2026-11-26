import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_GENERATOR_CONFIG,
  GENERATOR_VERSION,
  MEGASTRUTTURE,
  forkBalance,
  generateCityMap,
  resolveGeneratorConfig,
  validateMap,
  validateStructure,
  type CityMap,
} from "../src/logic/index.ts";
import { distancesToExit } from "../src/logic/graph.ts";

const SEEDS = Array.from({ length: 150 }, (_, i) => `seed-${i}`);
const maps = SEEDS.map((seed) => generateCityMap({ seed }));

test("seed, tema, configurazione e versione uguali producono la stessa mappa", () => {
  for (const seed of ["alfa", "β-unicode", "0", "x".repeat(200)]) {
    const a = generateCityMap({ seed });
    const b = generateCityMap({ seed, themeId: "megastrutture", config: {} });
    assert.deepEqual(a, b);
    assert.equal(a.generatorVersion, GENERATOR_VERSION);
  }
});

test("seed diversi producono mappe effettivamente diverse", () => {
  const fingerprints = new Set(maps.map((m) => m.fingerprint));
  assert.equal(fingerprints.size, maps.length);
  const shapes = new Set(maps.map((m) => `${Object.keys(m.cells).length}:${Object.keys(m.options).length}:${m.distanceToExit[m.startId]}`));
  assert.ok(shapes.size > 20, `solo ${shapes.size} forme distinte`);
  const branchCounts = new Set(maps.flatMap((m) => Object.values(m.options).map((o) => o.length)));
  assert.deepEqual([...branchCounts].sort(), [2, 3]);
});

test("una configurazione diversa cambia l'impronta", () => {
  const a = generateCityMap({ seed: "cfg" });
  const b = generateCityMap({ seed: "cfg", config: { specialDensity: 0.05 } });
  assert.notEqual(a.fingerprint, b.fingerprint);
});

test("tutte le mappe superano la validazione strutturale e di bilanciamento", () => {
  for (const map of maps) assert.deepEqual(validateMap(map, MEGASTRUTTURE), [], map.seed);
  assert.ok(maps.every((m) => !m.usedFallback));
});

test("ai bivi: lunghezze relative distinte, ramo più breve con domande più difficili", () => {
  for (const map of maps) {
    for (const [forkId, options] of Object.entries(map.options)) {
      const byLength = [...options].sort((a, b) => map.distanceToExit[a.to]! - map.distanceToExit[b.to]!);
      assert.equal(byLength[0]!.relative, "piu-breve");
      assert.equal(byLength[byLength.length - 1]!.relative, "piu-lungo");
      assert.equal(byLength[0]!.difficulty, "difficile");
      assert.equal(byLength[byLength.length - 1]!.difficulty, "facile");
      if (options.length === 3) assert.deepEqual([byLength[1]!.relative, byLength[1]!.difficulty], ["intermedio", "media"]);
      assert.deepEqual(options.map((o) => o.to), map.cells[forkId]!.next);
    }
  }
});

test("le alternative restano competitive (scarto di turni attesi entro la soglia)", () => {
  let worst = 0;
  for (const map of maps) {
    for (const fork of forkBalance(map, map.startId, map.config.answerProfile, map.config.dieFaces)) worst = Math.max(worst, fork.gap);
  }
  assert.ok(worst <= DEFAULT_GENERATOR_CONFIG.balanceMaxTurnGap, `scarto massimo ${worst}`);
});

test("lunghezze dei percorsi entro i limiti configurati", () => {
  const [min, max] = DEFAULT_GENERATOR_CONFIG.routeLength;
  for (const map of maps) {
    assert.ok(map.distanceToExit[map.startId]! >= min);
    assert.ok(distancesToExit(map.cells, map.exitId, "max")[map.startId]! <= max);
  }
});

test("distretti del tema; uscita nella sommità; caselle speciali non adiacenti e su caselle ordinarie", () => {
  const districtIds = new Set(MEGASTRUTTURE.districts.map((d) => d.id));
  const kinds = new Set<string>();
  for (const map of maps) {
    assert.equal(map.cells[map.exitId]!.district, MEGASTRUTTURE.exitDistrict);
    for (const cell of Object.values(map.cells)) {
      assert.ok(districtIds.has(cell.district));
      if (cell.special === null) continue;
      kinds.add(cell.special);
      assert.equal(cell.kind, "path");
      for (const to of cell.next) assert.equal(map.cells[to]!.special, null, `${map.seed}: speciali adiacenti`);
    }
  }
  assert.deepEqual([...kinds].sort(), MEGASTRUTTURE.specialKinds.map((k) => k.id).sort());
});

test("gli identificativi non seguono l'ordine di costruzione", () => {
  // L'ordine delle chiavi non deve correlare con la distanza dall'uscita.
  let monotone = 0;
  for (const map of maps) {
    const distances = Object.keys(map.cells).map((id) => map.distanceToExit[id]!);
    if (distances.every((d, i) => i === 0 || d <= distances[i - 1]!) || distances.every((d, i) => i === 0 || d >= distances[i - 1]!)) monotone++;
  }
  assert.equal(monotone, 0);
});

test("fallback deterministico e valido quando il bilanciamento è irraggiungibile", () => {
  const config = { balanceMaxTurnGap: 0, selectionMaxTurnGap: 0, maxAttempts: 2 };
  const a = generateCityMap({ seed: "fallback", config });
  const b = generateCityMap({ seed: "fallback", config });
  assert.equal(a.usedFallback, true);
  assert.equal(a.attempt, 2);
  assert.deepEqual(a, b);
  assert.deepEqual(validateStructure(a, MEGASTRUTTURE), []);
});

test("configurazioni, temi e seed non validi vengono rifiutati", () => {
  assert.throws(() => generateCityMap({ seed: "" }), TypeError);
  assert.throws(() => generateCityMap({ seed: "x", themeId: "inesistente" }), /Tema/);
  assert.throws(() => resolveGeneratorConfig({ branchesPerFork: [2, 4] }), RangeError);
  assert.throws(() => resolveGeneratorConfig({ dieFaces: 1 }), RangeError);
  assert.throws(() => resolveGeneratorConfig({ answerProfile: { facile: 0, media: 0.5, difficile: 0.5 } }), RangeError);
  assert.throws(() => resolveGeneratorConfig({ longBranchLength: [3, 4], minBranchGap: 2 }), RangeError);
});

function mutate(map: CityMap, change: (copy: CityMap) => void): CityMap {
  const copy = structuredClone(map);
  change(copy);
  return copy;
}

test("la validazione rileva cicli, vicoli ciechi, celle irraggiungibili ed etichette errate", () => {
  const map = maps[0]!;
  const [forkId, options] = Object.entries(map.options)[0]!;
  const pathId = Object.values(map.cells).find((c) => c.kind === "path" && c.next[0] !== map.exitId)!.id;

  const cycle = mutate(map, (m) => {
    m.cells[pathId]!.next = [forkId];
  });
  assert.ok(validateStructure(cycle, MEGASTRUTTURE).some((i) => /cicli|distanza/.test(i)));

  const deadEnd = mutate(map, (m) => {
    m.cells["zz"] = { id: "zz", kind: "path", next: [], difficulty: "media", district: "ponti", special: null };
  });
  assert.ok(validateStructure(deadEnd, MEGASTRUTTURE).length > 0);

  const orphan = mutate(map, (m) => {
    m.cells["zz"] = { id: "zz", kind: "path", next: [m.exitId], difficulty: "media", district: "ponti", special: null };
    m.distanceToExit["zz"] = 1;
  });
  assert.ok(validateStructure(orphan, MEGASTRUTTURE).some((i) => /non raggiungibile/.test(i)));

  const swapped = mutate(map, (m) => {
    const list = m.options[forkId]!;
    const [first, second] = [list[0]!.relative, list[1]!.relative];
    list[0]!.relative = second;
    list[1]!.relative = first;
  });
  assert.ok(options.length >= 2);
  assert.ok(validateStructure(swapped, MEGASTRUTTURE).some((i) => /etichetta/.test(i)));

  const wrongDifficulty = mutate(map, (m) => {
    for (const option of m.options[forkId]!) option.difficulty = "media";
  });
  assert.ok(validateStructure(wrongDifficulty, MEGASTRUTTURE).some((i) => /difficoltà|facili/.test(i)));
});
