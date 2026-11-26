import assert from "node:assert/strict";
import { test } from "node:test";
import { applyAction, publicView } from "../src/logic/index.ts";
import { distance2D } from "../src/layout/geometry.ts";
import { buildCityLayout } from "../src/layout/layout.ts";
import { MASS_REVEAL_RADIUS, STUB_FRACTION, buildSceneModel, revealAllView } from "../src/scene/model.ts";
import { autoAction, newGame } from "./helpers.ts";

test("la scena contiene soltanto caselle, passerelle e masse della zona esplorata", () => {
  for (const seed of ["scena-1", "scena-2", "scena-3"]) {
    const { game } = newGame(seed);
    const layout = buildCityLayout(game.map);
    let state = game.state;
    for (let step = 0; state.phase !== "ended"; step++) {
      const model = buildSceneModel(game.map, layout, publicView(game.map, state));
      const explored = new Set(state.explored);
      const hidden = Object.keys(game.map.cells).filter((id) => !explored.has(id));
      assert.deepEqual(model.tiles.map((t) => t.id), state.explored);
      for (const walkway of model.walkways) assert.ok(explored.has(walkway.from));
      const serialized = JSON.stringify(model);
      for (const id of hidden) assert.ok(!serialized.includes(`"${id}"`), `${seed}: cella nascosta ${id} nel modello`);
      for (const stub of model.stubs) {
        assert.ok(explored.has(stub.from));
        const target = game.map.cells[stub.from]!.next.find((to) => !explored.has(to))!;
        const full = distance2D(layout.positions[stub.from]!, layout.positions[target]!);
        assert.ok(Math.abs(distance2D(stub.a, stub.b) - full * STUB_FRACTION) < 1e-9);
      }
      for (const mass of model.masses) {
        assert.ok(model.tiles.some((tile) => distance2D(tile.position, { x: mass.x, y: 0, z: mass.z }) <= MASS_REVEAL_RADIUS));
      }
      const exitVisible = model.tiles.some((t) => t.kind === "exit");
      assert.equal(exitVisible, explored.has(game.map.exitId));
      state = applyAction(game.map, state, autoAction(game, state, step % 2 === 0 ? "piu-breve" : "piu-lungo")).state;
    }
  }
});

test("giocatori nella scena: posizioni del layout e giocatore attivo inquadrato", () => {
  const { game } = newGame("scena-giocatori");
  const layout = buildCityLayout(game.map);
  const model = buildSceneModel(game.map, layout, publicView(game.map, game.state));
  assert.equal(model.players.length, 2);
  assert.deepEqual(model.players.map((p) => p.active), [true, false]);
  assert.deepEqual(model.focus, layout.positions[game.map.startId]);
});

test("la vista rivelata di sviluppo mostra tutta la città senza monconi", () => {
  const { game } = newGame("scena-rivelata");
  const layout = buildCityLayout(game.map);
  const model = buildSceneModel(game.map, layout, revealAllView(game.map, publicView(game.map, game.state)));
  assert.equal(model.tiles.length, Object.keys(game.map.cells).length);
  assert.equal(model.walkways.length, Object.values(game.map.cells).reduce((n, c) => n + c.next.length, 0));
  assert.equal(model.stubs.length, 0);
});
