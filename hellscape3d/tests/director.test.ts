import assert from "node:assert/strict";
import { test } from "node:test";
import { CameraDirector, DISTRICT_STEPS, NEAR_STEPS, TIMING, classifyTransition, type Frame } from "../src/director/director.ts";
import { applyAction, type Game, type GameEvent, type GameState } from "../src/logic/index.ts";
import { pointSegmentDistance2D } from "../src/layout/geometry.ts";
import { buildCityLayout } from "../src/layout/layout.ts";
import type { CityLayout } from "../src/layout/types.ts";
import { autoAction, newGame } from "./helpers.ts";

interface Step {
  before: GameState;
  after: GameState;
  events: GameEvent[];
}

/** Partita automatica completa, alternando i rami scelti. */
function playthrough(seed: string): { game: Game; layout: CityLayout; steps: Step[] } {
  const { game } = newGame(seed);
  const layout = buildCityLayout(game.map);
  const steps: Step[] = [];
  let state = game.state;
  for (let i = 0; state.phase !== "ended"; i++) {
    const result = applyAction(game.map, state, autoAction(game, state, i % 3 === 0 ? "piu-lungo" : "piu-breve"));
    steps.push({ before: state, after: result.state, events: result.events });
    state = result.state;
  }
  return { game, layout, steps };
}

const distance = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

function assertMatchesState(frame: Frame, state: GameState, layout: CityLayout): void {
  assert.deepEqual(frame.explored, state.explored);
  assert.deepEqual(frame.traversed, state.traversed);
  for (const player of state.players) assert.ok(distance(frame.pawns[player.id]!, layout.positions[player.cellId]!) < 1e-9, `${player.id} fuori posto`);
  assert.equal(frame.activePlayerId, state.players[state.activeIndex]!.id);
  assert.equal(frame.fade, 0);
}

test("al termine di ogni azione la presentazione coincide con lo stato del motore", () => {
  for (const seed of ["regia-1", "regia-2"]) {
    const { game, layout, steps } = playthrough(seed);
    const director = new CameraDirector(game.map, layout, game.state);
    for (const step of steps) {
      director.enqueue(step.events, step.after);
      let frame = director.getFrame();
      for (let guard = 0; director.busy; guard++) {
        assert.ok(guard < 10_000, "regia senza fine");
        frame = director.update(1 / 60);
        // A ogni fotogramma: solo celle già esplorate nello stato, pedine sulle passerelle.
        const explored = new Set(step.after.explored);
        for (const id of frame.explored) assert.ok(explored.has(id), `${seed}: cella mostrata prima di essere esplorata`);
        // Tratti percorsi: mai prima che lo siano nello stato, e solo fra caselle già mostrate.
        for (const edge of frame.traversed) {
          assert.ok(step.after.traversed.includes(edge), `${seed}: tratto ${edge} mostrato prima di essere percorso`);
          for (const id of edge.split(">")) assert.ok(frame.explored.includes(id));
        }
        for (const [id, p] of Object.entries(frame.pawns)) {
          const onPath = Object.values(game.map.cells).some((cell) =>
            [cell.id, ...cell.next].some((other) => pointSegmentDistance2D(p, layout.positions[cell.id]!, layout.positions[other]!) < 1e-6),
          );
          assert.ok(onPath, `${seed}: pedina ${id} fuori dalle passerelle`);
        }
        assert.ok(frame.fade >= 0 && frame.fade <= 1);
      }
      assertMatchesState(frame, step.after, layout);
    }
  }
});

test("i tratti percorsi compaiono uno alla volta mentre la pedina avanza", () => {
  const { game, layout, steps } = playthrough("regia-tratti");
  const step = steps.find((s) => s.after.traversed.length - s.before.traversed.length >= 3)!;
  const director = new CameraDirector(game.map, layout, step.before);
  director.enqueue(step.events, step.after);
  const counts: number[] = [];
  while (director.busy) counts.push(director.update(1 / 30).traversed.length);
  assert.ok(new Set(counts).size >= 3, "tratti non rivelati progressivamente");
  for (let i = 1; i < counts.length; i++) assert.ok(counts[i]! >= counts[i - 1]!);
  assert.equal(counts.at(-1), step.after.traversed.length);
});

test("le celle compaiono quando la pedina le raggiunge con lo sguardo, non prima", () => {
  const { game, layout, steps } = playthrough("regia-sguardo");
  const step = steps.find((s) => s.events.some((e) => e.type === "explored" && e.cellIds.length >= 2))!;
  const director = new CameraDirector(game.map, layout, step.before);
  director.enqueue(step.events, step.after);
  const counts: number[] = [];
  while (director.busy) counts.push(director.update(1 / 30).explored.length);
  assert.ok(counts.some((n) => n > step.before.explored.length && n < step.after.explored.length), "rivelazione non progressiva");
  for (let i = 1; i < counts.length; i++) assert.ok(counts[i]! >= counts[i - 1]!, "le celle mostrate non diminuiscono");
});

test("saltare la regia porta subito allo stesso risultato della riproduzione completa", () => {
  const { game, layout, steps } = playthrough("regia-salto");
  const played = new CameraDirector(game.map, layout, game.state);
  const skipped = new CameraDirector(game.map, layout, game.state);
  for (const step of steps) {
    played.enqueue(step.events, step.after);
    skipped.enqueue(step.events, step.after);
    while (played.busy) played.update(0.05);
    skipped.update(0.13);
    const frame = skipped.skip();
    assert.equal(skipped.busy, false);
    assert.deepEqual(frame, played.getFrame());
    assertMatchesState(frame, step.after, layout);
  }
});

test("movimento ridotto: nessuna animazione, presentazione immediata", () => {
  const { game, layout, steps } = playthrough("regia-ridotta");
  const director = new CameraDirector(game.map, layout, game.state, { reducedMotion: true });
  for (const step of steps) {
    director.enqueue(step.events, step.after);
    const frame = director.update(0);
    assert.equal(director.busy, false);
    assertMatchesState(frame, step.after, layout);
  }
});

test("transizioni fra giocatori: tipo secondo la distanza sulla rete esplorata, tempi entro gli obiettivi", () => {
  assert.ok(TIMING.transition.near >= 0.5 && TIMING.transition.near <= 1);
  assert.ok(TIMING.transition.district >= 1 && TIMING.transition.district <= 1.5);
  assert.ok(TIMING.transition.far >= 0.5 && TIMING.transition.far <= 1);
  const { game } = newGame("regia-transizioni");
  const map = game.map;
  const all = new Set(Object.keys(map.cells));
  const start = map.startId;
  const along = [start];
  while (along.length < 20 && map.cells[along.at(-1)!]!.next.length > 0) along.push(map.cells[along.at(-1)!]!.next[0]!);
  assert.equal(classifyTransition(map, all, start, start), "near");
  assert.equal(classifyTransition(map, all, start, along[NEAR_STEPS]!), "near");
  const farther = classifyTransition(map, all, start, along[NEAR_STEPS + 1]!);
  assert.equal(farther, map.cells[start]!.district === map.cells[along[NEAR_STEPS + 1]!]!.district ? "district" : "far");
  assert.equal(classifyTransition(map, all, start, along[Math.min(along.length - 1, DISTRICT_STEPS + 2)]!), "far");
  // Senza un collegamento esplorato si usa sempre la dissolvenza.
  assert.equal(classifyTransition(map, new Set([start]), start, along[2]!), "far");
});

test("la dissolvenza fra giocatori lontani oscura prima di spostare la camera", () => {
  const { game, layout, steps } = playthrough("regia-lontani");
  const director = new CameraDirector(game.map, layout, game.state);
  let sawFade = false;
  for (const step of steps) {
    director.enqueue(step.events, step.after);
    let previous = director.getFrame();
    while (director.busy) {
      const frame = director.update(1 / 60);
      const jump = distance(frame.camera.target, previous.camera.target);
      if (jump > 6) {
        // Un salto di camera è ammesso solo a schermo completamente oscurato.
        assert.ok(frame.fade > 0.9 || previous.fade > 0.9, `salto di ${jump.toFixed(1)} senza dissolvenza`);
        sawFade = true;
      }
      previous = frame;
    }
  }
  assert.ok(sawFade, "nessuna transizione lontana in questa partita");
});
