import assert from "node:assert/strict";
import { test } from "node:test";
import { applyAction, splitEdge, visitedCells, type Game, type GameState } from "../src/logic/index.ts";
import { buildCityLayout, VIEW_DIRECTION } from "../src/layout/layout.ts";
import type { CityLayout, Vec3 } from "../src/layout/types.ts";
import { EXIT_STRIP, minimapShapes, toMinimapPlane } from "../src/ui/minimap.ts";
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

test("minimappa: orientata come la camera", () => {
  const ahead = toMinimapPlane({ x: -VIEW_DIRECTION.x * 10, y: 0, z: -VIEW_DIRECTION.z * 10 });
  assert.ok(ahead.y < -9.99 && Math.abs(ahead.x) < 1e-9, "ciò che sta davanti alla camera è in alto");
  // Il percorso avanza lungo +X: nella minimappa verso l'alto a sinistra, dove sta il simbolo dell'uscita.
  const forward = toMinimapPlane({ x: 10, y: 0, z: 0 });
  assert.ok(forward.x < 0 && forward.y < 0);
});

const input = (game: Game, layout: CityLayout, state: GameState, positions: Record<string, Vec3> = layout.positions) => ({
  map: game.map,
  positions,
  traversed: state.traversed,
  players: state.players.map((p, index) => ({ id: p.id, index })),
  pawns: Object.fromEntries(state.players.map((p) => [p.id, layout.positions[p.cellId]!])),
  activePlayerId: state.players[state.activeIndex]!.id,
});

test("minimappa: solo caselle e tratti percorsi, bivi come diramazioni, uscita simbolica fissa", () => {
  let junctionsSeen = 0;
  for (const seed of ["minimappa-1", "minimappa-2", "minimappa-3"]) {
    for (const branch of ["piu-breve", "piu-lungo"] as const) {
      const { game } = newGame(seed);
      const layout = buildCityLayout(game.map);
      let state = game.state;
      for (let i = 0; i < 400 && state.phase !== "ended"; i++) {
        state = applyAction(game.map, state, autoAction(game, state, branch)).state;
        const shapes = minimapShapes(input(game, layout, state), 180, 180);
        const visited = visitedCells(game.map.startId, state.traversed);
        assert.deepEqual(shapes.cells.map((c) => c.id), visited);
        for (const id of visited) assert.ok(state.explored.includes(id));
        // Ogni tratto mostrato è stato percorso, e ogni casella percorsa è raggiunta da un tratto.
        for (const edge of state.traversed) {
          const [from, to] = splitEdge(edge);
          assert.ok(game.map.cells[from]!.next.includes(to));
        }
        const forks = new Set(state.traversed.map(splitEdge).filter(([from]) => game.map.cells[from]!.next.length > 1).map(([from]) => from));
        assert.deepEqual(shapes.junctions.map((j) => j.after).sort(), [...forks].sort());
        junctionsSeen = Math.max(junctionsSeen, shapes.junctions.length);
        // Segretezza: con le sole posizioni delle caselle percorse il disegno è identico.
        const known = Object.fromEntries(visited.map((id) => [id, layout.positions[id]!]));
        assert.deepEqual(minimapShapes(input(game, layout, state, known), 180, 180), shapes);
        const reached = visited.includes(game.map.exitId);
        assert.equal(shapes.exit === null, reached);
        if (shapes.exit) assert.deepEqual(shapes.exit, { x: 12 + EXIT_STRIP / 2, y: 12 + EXIT_STRIP / 2 - 4 }, "uscita in posizione fissa");
        for (const p of [...shapes.cells, ...shapes.junctions, ...shapes.players]) {
          assert.ok(p.x >= -1e-6 && p.x <= 180 + 1e-6 && p.y >= -1e-6 && p.y <= 180 + 1e-6, "fuori dal riquadro");
          if (!reached) assert.ok(p.y >= 12 + EXIT_STRIP - 1e-6, "sovrapposto alla fascia dell'uscita");
        }
        assert.equal(shapes.players.filter((p) => p.active).length, 1);
      }
      assert.equal(state.phase, "ended");
    }
  }
  assert.ok(junctionsSeen >= 2, "nessun bivio percorso nelle partite di prova");
});
