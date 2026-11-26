import assert from "node:assert/strict";
import { test } from "node:test";
import { applyAction, publicView } from "../src/logic/index.ts";
import { buildCityLayout, VIEW_DIRECTION } from "../src/layout/layout.ts";
import { buildSceneModel } from "../src/scene/model.ts";
import { minimapShapes, toMinimapPlane } from "../src/ui/minimap.ts";
import { QuestionTimer } from "../src/ui/timer.ts";
import { autoAction, newGame } from "./helpers.ts";

test("timer: scorre solo quando può, scade una sola volta", () => {
  const timer = new QuestionTimer(3);
  assert.equal(timer.tick(5, false), false);
  assert.equal(timer.remaining, 3);
  assert.equal(timer.tick(1, true), false);
  assert.equal(timer.remaining, 2);
  assert.equal(timer.tick(10, false), false, "in pausa durante la regia o con pagina nascosta");
  assert.equal(timer.remaining, 2);
  assert.equal(timer.tick(2.5, true), true);
  assert.equal(timer.expired, true);
  assert.equal(timer.tick(1, true), false, "la scadenza si segnala una sola volta");
  assert.throws(() => new QuestionTimer(0), RangeError);
});

test("minimappa: orientata come la camera, contenuta nel riquadro, solo celle mostrate", () => {
  const ahead = toMinimapPlane({ x: -VIEW_DIRECTION.x * 10, y: 0, z: -VIEW_DIRECTION.z * 10 });
  assert.ok(ahead.y < -9.99 && Math.abs(ahead.x) < 1e-9, "ciò che sta davanti alla camera è in alto");
  const { game } = newGame("minimappa");
  const layout = buildCityLayout(game.map);
  let state = game.state;
  for (let i = 0; i < 40 && state.phase !== "ended"; i++) {
    const view = publicView(game.map, state);
    const model = buildSceneModel(game.map, layout, view);
    const pawns = Object.fromEntries(state.players.map((p) => [p.id, layout.positions[p.cellId]!]));
    const shapes = minimapShapes(model, pawns, view.activePlayerId, 180, 180);
    assert.deepEqual(shapes.cells.map((c) => c.id), state.explored);
    assert.equal(shapes.cells.some((c) => c.kind === "exit"), state.explored.includes(game.map.exitId));
    for (const p of [...shapes.cells, ...shapes.players]) {
      assert.ok(p.x >= -1e-6 && p.x <= 180 + 1e-6 && p.y >= -1e-6 && p.y <= 180 + 1e-6, "fuori dal riquadro");
    }
    assert.equal(shapes.players.filter((p) => p.active).length, 1);
    state = applyAction(game.map, state, autoAction(game, state)).state;
  }
});
