import assert from "node:assert/strict";
import { test } from "node:test";
import { applyAction, type GameState } from "../src/logic/index.ts";
import { buildCityLayout, VIEW_DIRECTION } from "../src/layout/layout.ts";
import { RADAR_RANGE, radarShapes, toRadarPlane, type RadarBlip } from "../src/ui/radar.ts";
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

test("radar: orientato come la camera, distanze conservate", () => {
  const ahead = toRadarPlane({ x: -VIEW_DIRECTION.x * 10, y: 0, z: -VIEW_DIRECTION.z * 10 });
  assert.ok(ahead.y < -9.99 && Math.abs(ahead.x) < 1e-9, "ciò che sta davanti alla camera è in alto");
  const p = toRadarPlane({ x: 3, y: 7, z: -4 });
  assert.ok(Math.abs(Math.hypot(p.x, p.y) - 5) < 1e-9, "la proiezione è una rotazione del piano orizzontale");
});

test("radar: giocatore di turno al centro, altri in scala o sul bordo, uscita solo entro la portata", () => {
  const exit = { x: 100, y: 0, z: 0 };
  const shapes = radarShapes(
    {
      pawns: { a: { x: 10, y: 3, z: 10 }, b: { x: 10 + 12, y: -2, z: 10 }, c: { x: 10, y: 0, z: 10 - 80 }, d: { x: 10, y: 3, z: 10 } },
      players: ["a", "b", "c", "d"].map((id, index) => ({ id, index })),
      activePlayerId: "a",
      exit,
    },
    180,
  );
  const scale = shapes.radius / RADAR_RANGE;
  const [a, b, c, d] = shapes.players as [RadarBlip, RadarBlip, RadarBlip, RadarBlip];
  assert.deepEqual([a.x, a.y], [shapes.center.x, shapes.center.y]);
  assert.ok(a.active && !a.onEdge);
  assert.ok(!b.onEdge && Math.abs(Math.hypot(b.x - a.x, b.y - a.y) - 12 * scale) < 1e-9, "distanza in scala, quota ignorata");
  assert.ok(c.onEdge && Math.abs(Math.hypot(c.x - a.x, c.y - a.y) - shapes.radius) < 1e-9, "fuori portata: sul bordo");
  const bearing = toRadarPlane({ x: 0, y: 0, z: -1 });
  assert.ok(Math.abs(Math.atan2(c.y - a.y, c.x - a.x) - Math.atan2(bearing.y, bearing.x)) < 1e-9, "fuori portata: nella sua direzione");
  assert.ok(!d.onEdge && d.x === a.x && d.y === a.y, "nella stessa casella");
  assert.equal(shapes.exit, null, "uscita fuori portata non mostrata");
  const near = radarShapes({ pawns: { a: { x: 90, y: 0, z: 0 } }, players: [{ id: "a", index: 0 }], activePlayerId: "a", exit }, 180);
  assert.ok(near.exit && Math.abs(Math.hypot(near.exit.x - near.center.x, near.exit.y - near.center.y) - 10 * (near.radius / RADAR_RANGE)) < 1e-9);
});

test("radar nelle partite: l'uscita compare solo vicino alla fine e c'è sempre all'arrivo", () => {
  let farthest = 0;
  for (const seed of ["radar-1", "radar-2", "radar-3", "radar-4"]) {
    const { game } = newGame(seed);
    const layout = buildCityLayout(game.map);
    let state = game.state;
    const shapesFor = (s: GameState) =>
      radarShapes(
        {
          pawns: Object.fromEntries(s.players.map((p) => [p.id, layout.positions[p.cellId]!])),
          players: s.players.map((p, index) => ({ id: p.id, index })),
          activePlayerId: s.players[s.activeIndex]!.id,
          exit: layout.positions[game.map.exitId]!,
        },
        180,
      );
    assert.equal(shapesFor(state).exit, null, `${seed}: uscita visibile dalla partenza`);
    for (let i = 0; i < 400 && state.phase !== "ended"; i++) {
      state = applyAction(game.map, state, autoAction(game, state, i % 2 ? "piu-breve" : "piu-lungo")).state;
      const shapes = shapesFor(state);
      for (const p of shapes.players) assert.ok(Math.hypot(p.x - 90, p.y - 90) <= shapes.radius + 1e-9, "punto fuori dal radar");
      if (shapes.exit) farthest = Math.max(farthest, game.map.distanceToExit[state.players[state.activeIndex]!.cellId]!);
    }
    assert.equal(state.phase, "ended");
    const winner = state.players.find((p) => p.escaped)!;
    const final = radarShapes(
      { pawns: { [winner.id]: layout.positions[winner.cellId]! }, players: [{ id: winner.id, index: 0 }], activePlayerId: winner.id, exit: layout.positions[game.map.exitId]! },
      180,
    );
    assert.ok(final.exit, "all'uscita il radar la mostra");
  }
  // Annotazione, non requisito: la portata è in linea d'aria, il percorso può essere più lungo.
  assert.ok(farthest > 0 && farthest < 20, `uscita mostrata fino a ${farthest} caselle di distanza`);
});
