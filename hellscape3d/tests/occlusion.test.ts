import assert from "node:assert/strict";
import { test } from "node:test";
import { CameraDirector, SHOTS } from "../src/director/director.ts";
import { applyAction, createGame, publicView, rngFromSeed, type GameAction, type GameState } from "../src/logic/index.ts";
import { buildCityLayout } from "../src/layout/layout.ts";
import { cameraPosition, massBox, tileBox, walkwayBox } from "../src/scene/dimensions.ts";
import { buildSceneModel, presentedView, type SceneModel } from "../src/scene/model.ts";
import { findOccluders, segmentIntersectsBox } from "../src/scene/occlusion.ts";
import { autoAction, newGame } from "./helpers.ts";

const box = { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } };
const p = (x: number, y: number, z: number) => ({ x, y, z });

test("segmento e riquadro: attraversamento, mancato incontro, segmento che si ferma prima", () => {
  assert.equal(segmentIntersectsBox(p(-5, 0, 0), p(5, 0, 0), box), true);
  assert.equal(segmentIntersectsBox(p(-5, 2, 0), p(5, 2, 0), box), false);
  assert.equal(segmentIntersectsBox(p(-5, 0, 0), p(-2, 0, 0), box), false, "il segmento finisce prima del riquadro");
  assert.equal(segmentIntersectsBox(p(-5, -5, -5), p(5, 5, 5), box), true, "diagonale");
  assert.equal(segmentIntersectsBox(p(0, 5, 0), p(0, 5, 10), box), false, "parallelo all'asse, fuori");
  assert.equal(segmentIntersectsBox(p(0, 0, 5), p(0, 0, -5), box), true, "parallelo all'asse, dentro");
});

function syntheticModel(): SceneModel {
  return {
    tiles: [
      { id: "pedina", kind: "path", district: "ponti", special: null, position: p(0, 0, 0) },
      { id: "davanti", kind: "path", district: "ponti", special: null, position: p(0, 4.5, -5) },
      { id: "lontana", kind: "path", district: "ponti", special: null, position: p(30, 0, 30) },
    ],
    walkways: [{ from: "x", a: p(-6, 3.6, -3), b: p(6, 3.6, -3) }],
    stubs: [],
    masses: [
      { x: 0, z: -9, width: 3, depth: 3, bottom: -24, top: 20 },
      { x: 40, z: 40, width: 3, depth: 3, bottom: -24, top: 20 },
    ],
    players: [{ id: "a", index: 0, active: true, escaped: false, position: p(0, 0, 0) }],
    focus: p(0, 0, 0),
  };
}

test("ostacoli: trovati solo i volumi fra camera e pedina", () => {
  const model = syntheticModel();
  const camera = p(0, 12, -20);
  // Verifica preliminare della geometria del caso costruito.
  assert.ok(segmentIntersectsBox(camera, p(0, 1.6, 0), massBox(model.masses[0]!)));
  assert.ok(segmentIntersectsBox(camera, p(0, 1.6, 0), tileBox(p(0, 4.5, -5), "path")));
  const occ = findOccluders(model, camera, p(0, 0, 0));
  assert.deepEqual(occ.masses, [0]);
  assert.ok(occ.tiles.includes("davanti") && !occ.tiles.includes("pedina") && !occ.tiles.includes("lontana"));
  assert.ok(segmentIntersectsBox(camera, p(0, 1.6, 0), walkwayBox(model.walkways[0]!.a, model.walkways[0]!.b)));
  assert.deepEqual(occ.walkways, [0]);
  // Camera dal lato opposto: nessun ostacolo.
  const clear = findOccluders(model, p(0, 12, 20), p(0, 0, 0));
  assert.deepEqual(clear, { tiles: [], pillars: [], walkways: [], masses: [] });
  // La casella su cui sta la pedina non la nasconde mai.
  assert.ok(!segmentIntersectsBox(camera, p(0, 0.4, 0), tileBox(p(0, 0, 0), "path")));
});

test("caso reale: la passerella sopraelevata nasconde la pedina sul ramo inferiore", () => {
  const seed = "graybox-38";
  const { game } = createGame({ seed, players: [{ id: "p1", name: "a" }, { id: "p2", name: "b" }] });
  const layout = buildCityLayout(game.map);
  const answers = rngFromSeed(seed, "dev:answers");
  let state: GameState = game.state;
  const pick = (s: GameState): GameAction =>
    s.phase === "fork"
      ? { type: "chooseBranch", to: answers.pick(game.map.options[s.players[s.activeIndex]!.cellId]!).to }
      : s.phase === "question"
        ? { type: "answer", outcome: answers.chance(game.map.config.answerProfile[s.questionDifficulty!]) ? "correct" : "wrong" }
        : { type: "roll" };
  for (let i = 0; i < 9; i++) state = applyAction(game.map, state, pick(state)).state;
  const view = publicView(game.map, state);
  const model = buildSceneModel(game.map, layout, view);
  const pawn = layout.positions[state.players[state.activeIndex]!.cellId]!;
  const occ = findOccluders(model, cameraPosition(pawn, SHOTS.ordinary.distance, SHOTS.ordinary.pitch), pawn);
  assert.equal(occ.walkways.length, 1);
  const walkway = model.walkways[occ.walkways[0]!]!;
  assert.ok(Math.min(walkway.a.y, walkway.b.y) > pawn.y + 3, "l'ostacolo è più alto della pedina");
});

test("gli ostacoli sono sempre elementi disegnati: nessuna zona inesplorata viene coinvolta", () => {
  for (const seed of ["ostacoli-1", "ostacoli-2"]) {
    const { game } = newGame(seed);
    const layout = buildCityLayout(game.map);
    const director = new CameraDirector(game.map, layout, game.state);
    let state = game.state;
    for (let i = 0; i < 60 && state.phase !== "ended"; i++) {
      const result = applyAction(game.map, state, autoAction(game, state, i % 2 ? "piu-breve" : "piu-lungo"));
      state = result.state;
      director.enqueue(result.events, state);
      while (director.busy) {
        const frame = director.update(0.2);
        const view = { ...publicView(game.map, state), activePlayerId: frame.activePlayerId };
        const model = buildSceneModel(game.map, layout, presentedView(game.map, view, frame.explored));
        const occ = findOccluders(model, cameraPosition(frame.camera.target, frame.camera.distance, frame.camera.pitch), frame.pawns[frame.activePlayerId]!);
        const shown = new Set(frame.explored);
        for (const id of [...occ.tiles, ...occ.pillars]) assert.ok(shown.has(id));
        for (const i of occ.walkways) assert.ok(i < model.walkways.length);
        for (const i of occ.masses) assert.ok(i < model.masses.length);
      }
    }
  }
});
