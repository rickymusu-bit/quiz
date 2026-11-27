import assert from "node:assert/strict";
import { test } from "node:test";
import { RUN, CAMERA_SHOTS } from "../src/run/runScene.ts";
import { buildStrip, STRIP } from "../src/run/strip.ts";
import { newGame } from "./helpers.ts";

test("striscia della corsa: deterministica, periodica, diversa per casella", () => {
  const { game } = newGame("corsa-1");
  const [a, b] = Object.values(game.map.cells).filter((c) => c.kind === "path");
  const strip = buildStrip("corsa-1", a!.id, a!.district);
  assert.deepEqual(buildStrip("corsa-1", a!.id, a!.district), strip);
  assert.notDeepEqual(buildStrip("corsa-1", b!.id, b!.district), strip);
  for (const p of strip) assert.ok(p.position.x >= 0 && p.position.x < STRIP.period, "centro fuori dal periodo");
  // Il ciclo del passo divide il periodo: l'intera scena si ripete identica.
  assert.ok(Number.isInteger(STRIP.period / RUN.stride));
  // La passerella copre tutto il periodo senza vuoti: moduli contigui.
  const deck = strip.filter((p) => p.ref.kind === "walkway" && p.material === "concrete").map((p) => p.position.x - p.scale.x / 2).sort((x, y) => x - y);
  assert.equal(deck.length, STRIP.period / STRIP.module);
  deck.forEach((start, i) => assert.ok(Math.abs(start - (i * STRIP.module + 0.02)) < 1e-9));
});

test("striscia della corsa: niente davanti al corridore sul lato della camera laterale", () => {
  const { game } = newGame("corsa-2");
  const cell = Object.values(game.map.cells).find((c) => c.kind === "path")!;
  const camera = CAMERA_SHOTS.laterale.position[2];
  // Fra il corridore (z = 0) e la camera laterale ci sono soltanto bordo e ringhiera della passerella.
  for (const p of buildStrip("corsa-2", cell.id, cell.district)) {
    if (p.position.z - p.scale.z / 2 > STRIP.deckWidth / 2) assert.fail(`primitiva fra corridore e camera a z=${p.position.z}`);
    assert.ok(p.position.z < camera);
  }
});
