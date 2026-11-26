import assert from "node:assert/strict";
import { test } from "node:test";
import { SEAT_HALF_SIZE, SEAT_OFFSET, seatPose, seatPosition } from "../src/director/bafometto.ts";
import { CameraDirector, type Frame } from "../src/director/director.ts";
import { applyAction, generateCityMap } from "../src/logic/index.ts";
import { distance2D, pointSegmentDistance2D } from "../src/layout/geometry.ts";
import { buildCityLayout } from "../src/layout/layout.ts";
import { autoAction, newGame } from "./helpers.ts";

const distance = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

test("la sede dipende solo dalla partenza ed è lontana da percorso e masse", () => {
  for (let i = 0; i < 80; i++) {
    const map = generateCityMap({ seed: `sede-${i}` });
    const layout = buildCityLayout(map);
    const start = layout.positions[map.startId]!;
    const seat = seatPosition(start);
    assert.deepEqual(seat, { x: start.x + SEAT_OFFSET.x, y: start.y + SEAT_OFFSET.y, z: start.z + SEAT_OFFSET.z });
    for (const cell of Object.values(map.cells)) {
      for (const to of cell.next) {
        assert.ok(pointSegmentDistance2D(seat, layout.positions[cell.id]!, layout.positions[to]!) > SEAT_HALF_SIZE + 10, `${map.seed}: sede vicina al percorso`);
      }
    }
    for (const mass of layout.masses) {
      const reach = SEAT_HALF_SIZE + Math.hypot(mass.width, mass.depth) / 2;
      assert.ok(distance2D(seat, { x: mass.x, y: 0, z: mass.z }) > reach, `${map.seed}: sede sovrapposta a una massa`);
    }
  }
});

function drain(director: CameraDirector, step: number, visit: (frame: Frame, previous: Frame) => void): void {
  let previous = director.getFrame();
  for (let guard = 0; director.busy; guard++) {
    assert.ok(guard < 10_000);
    const frame = director.update(step);
    visit(frame, previous);
    previous = frame;
  }
}

test("apertura: dissolvenza verso la sede, battuta, ritorno al giocatore; nessuna cella rivelata", () => {
  const { game } = newGame("bafometto-apertura");
  const layout = buildCityLayout(game.map);
  const director = new CameraDirector(game.map, layout, game.state);
  const seatTarget = seatPose(director.seatPosition).target;
  director.intro();
  let atSeat = 0;
  drain(director, 1 / 60, (frame, previous) => {
    assert.deepEqual(frame.explored, game.state.explored, "la regia di Bafometto non rivela celle");
    if (frame.bafometto?.kind === "seat") {
      atSeat++;
      assert.ok(distance(frame.camera.target, seatTarget) < 1e-9);
    }
    if (distance(frame.camera.target, previous.camera.target) > 6) assert.ok(frame.fade > 0.9 || previous.fade > 0.9, "cambio di inquadratura senza dissolvenza");
  });
  assert.ok(atSeat > 60, "inquadratura della sede troppo breve");
  const end = director.getFrame();
  assert.equal(end.bafometto, null);
  assert.equal(end.fade, 0);
  assert.ok(distance(end.camera.target, layout.positions[game.map.startId]!) < 1e-9, "ritorno al giocatore");
  assert.deepEqual(director.takeAnnouncements().map((a) => a.moment), ["intro"]);
  assert.deepEqual(director.takeAnnouncements(), [], "ogni battuta si consegna una sola volta");
});

test("movimento ridotto: nessuna inquadratura della sede, ma la battuta resta", () => {
  const { game } = newGame("bafometto-ridotto");
  const director = new CameraDirector(game.map, buildCityLayout(game.map), game.state, { reducedMotion: true });
  director.intro();
  const frame = director.update(0);
  assert.equal(director.busy, false);
  assert.equal(frame.bafometto, null);
  assert.deepEqual(director.takeAnnouncements().map((a) => a.moment), ["intro"]);
});

test("terminali in partita: manifestazione locale; fine partita: intervento dalla sede", () => {
  let terminals = 0;
  for (const seed of ["bafometto-1", "bafometto-2", "bafometto-3", "bafometto-4"]) {
    const { game } = newGame(seed);
    const layout = buildCityLayout(game.map);
    const director = new CameraDirector(game.map, layout, game.state);
    let state = game.state;
    while (state.phase !== "ended") {
      const result = applyAction(game.map, state, autoAction(game, state, "piu-lungo"));
      state = result.state;
      director.enqueue(result.events, state);
      const landed = result.events.find((e) => e.type === "arrived" && e.special === "terminale");
      let sawTerminal = false;
      drain(director, 1 / 30, (frame) => {
        if (frame.bafometto?.kind === "terminal") {
          sawTerminal = true;
          assert.equal(frame.bafometto.cellId, (landed as { cellId: string }).cellId);
          assert.ok(frame.explored.includes(frame.bafometto.cellId));
        }
      });
      const moments = director.takeAnnouncements().map((a) => a.moment);
      if (landed) {
        terminals++;
        assert.ok(sawTerminal, "terminale non manifestato");
        assert.deepEqual(moments, ["terminal"]);
      } else if (state.phase === "ended") {
        assert.deepEqual(moments, ["end"]);
      } else {
        assert.deepEqual(moments, []);
      }
    }
    // La partita resta inquadrata sull'uscita.
    assert.ok(distance(director.getFrame().camera.target, layout.positions[game.map.exitId]!) < 1e-9);
  }
  assert.ok(terminals > 0, "nessun terminale raggiunto nelle partite di prova");
});
