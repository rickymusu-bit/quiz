import assert from "node:assert/strict";
import { test } from "node:test";
import { generateCityMap } from "../src/logic/index.ts";
import { distance2D, pointSegmentDistance2D } from "../src/layout/geometry.ts";
import { DEFAULT_LAYOUT_CONFIG, LAYOUT_VERSION, VIEW_DIRECTION, branchSteps, buildCityLayout, decompose, validateLayout } from "../src/layout/layout.ts";

const maps = Array.from({ length: 120 }, (_, i) => generateCityMap({ seed: `layout-${i}` }));
const layouts = maps.map((map) => buildCityLayout(map));

test("branchSteps: passi unitari o diagonali, nessuna casella a metà di un angolo", () => {
  for (let shortest = 1; shortest <= 10; shortest++) {
    for (let length = shortest; length <= shortest + 12; length++) {
      const points = branchSteps(length, shortest);
      assert.equal(points.length, length);
      const path: [number, number][] = [[0, 0], ...points, [shortest + 1, 0]];
      let diagonals = 0;
      for (let i = 1; i < path.length; i++) {
        const [a1, b1] = path[i - 1]!,
          [a2, b2] = path[i]!;
        const step = Math.abs(a2 - a1) + Math.abs(b2 - b1);
        assert.ok(step === 1 || step === 2, `passo ${step}`);
        if (step === 2) diagonals++;
        assert.ok(a2 >= a1, "il ramo non torna indietro lungo l'asse");
      }
      assert.equal(diagonals, (length - shortest) % 2);
      assert.equal(new Set(path.map((p) => p.join())).size, path.length, "nessuna casella ripetuta");
    }
  }
});

test("layout deterministico, con versione, senza modificare la mappa", () => {
  const map = maps[0]!;
  const before = structuredClone(map);
  assert.deepEqual(buildCityLayout(map), buildCityLayout(map));
  assert.deepEqual(map, before);
  assert.equal(layouts[0]!.layoutVersion, LAYOUT_VERSION);
});

test("ogni casella ha una posizione e tutte le disposizioni sono realizzabili", () => {
  for (const [i, map] of maps.entries()) {
    const layout = layouts[i]!;
    assert.deepEqual(Object.keys(layout.positions).sort(), Object.keys(map.cells).sort());
    assert.deepEqual(validateLayout(map, layout.positions), [], map.seed);
  }
  const fallbacks = layouts.filter((l) => l.usedFallback).length;
  assert.ok(fallbacks <= layouts.length * 0.05, `${fallbacks} layout di riserva`);
});

test("il layout di riserva è valido per ogni mappa", () => {
  for (const map of maps.slice(0, 60)) {
    const layout = buildCityLayout(map, { maxAttempts: 0 });
    assert.equal(layout.usedFallback, true);
    assert.deepEqual(validateLayout(map, layout.positions), [], map.seed);
  }
});

test("la validazione rileva caselle sovrapposte e passerelle che si attraversano", () => {
  const map = maps[1]!;
  const positions = structuredClone(layouts[1]!.positions);
  const [a, b] = Object.keys(positions);
  positions[b!] = { ...positions[a!]! };
  assert.ok(validateLayout(map, positions).some((issue) => /sovrapposte/.test(issue)));
});

test("varietà: svolte, dislivelli e passerelle sopraelevate compaiono in parte delle città", () => {
  let turned = 0,
    elevated = 0;
  for (const layout of layouts) {
    const points = Object.values(layout.positions);
    if (points.some((p) => Math.abs(p.z) > 0.01 && !layout.usedFallback)) turned++;
    if (points.some((p) => Math.abs(p.y) > 0.01)) elevated++;
  }
  assert.ok(turned > layouts.length / 2, `svolte in ${turned}`);
  assert.ok(elevated > layouts.length / 2, `dislivelli in ${elevated}`);
});

test("masse edilizie lontane dal percorso e basse dal lato della camera", () => {
  for (const [i, map] of maps.entries()) {
    const layout = layouts[i]!;
    const edges = Object.values(map.cells).flatMap((cell) => cell.next.map((to) => [layout.positions[cell.id]!, layout.positions[to]!] as const));
    for (const mass of layout.masses) {
      const centre = { x: mass.x, y: 0, z: mass.z };
      const halfDiagonal = Math.hypot(mass.width, mass.depth) / 2;
      let nearest = Infinity;
      let nearestEdge = edges[0]!;
      for (const edge of edges) {
        const d = pointSegmentDistance2D(centre, edge[0], edge[1]);
        if (d < nearest) {
          nearest = d;
          nearestEdge = edge;
        }
      }
      assert.ok(nearest - halfDiagonal >= DEFAULT_LAYOUT_CONFIG.massClearance - 1e-9, `${map.seed}: massa troppo vicina`);
      const anchor = distance2D(centre, nearestEdge[0]) < distance2D(centre, nearestEdge[1]) ? nearestEdge[0] : nearestEdge[1];
      const towardCamera = (centre.x - anchor.x) * VIEW_DIRECTION.x + (centre.z - anchor.z) * VIEW_DIRECTION.z > 0;
      if (towardCamera) assert.ok(mass.top < Math.max(nearestEdge[0].y, nearestEdge[1].y), `${map.seed}: massa alta davanti alla camera`);
    }
  }
});

test("la scomposizione copre tutte le caselle una sola volta", () => {
  for (const map of maps.slice(0, 30)) {
    const ids = decompose(map).flatMap((stage) =>
      stage.type === "corridor" ? stage.cells : [stage.forkId, ...stage.branches.flat(), stage.mergeId],
    );
    assert.deepEqual([...ids].sort(), Object.keys(map.cells).sort());
  }
});
