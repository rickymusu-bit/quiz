import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { CameraDirector, SHOTS, type CameraPose } from "../src/director/director.ts";
import { seatPose } from "../src/director/bafometto.ts";
import { buildKit, type Primitive } from "../src/kit/kit.ts";
import { applyAction, publicView, rngFromSeed, type Game } from "../src/logic/index.ts";
import { buildCityLayout } from "../src/layout/layout.ts";
import { CAMERA_OPTICS, cameraPosition, fogRange, shadowExtent, SUN } from "../src/scene/dimensions.ts";
import { buildSceneModel, presentedView, revealAllView } from "../src/scene/model.ts";
import {
  citySlab,
  elementKey,
  indexSectors,
  isLoaded,
  primitiveHalfExtents,
  reachWithinSlab,
  SECTOR,
  sectorDistance,
  sectorsOf,
  updateLoadedSectors,
  visibleRadius,
  type Focus,
  type Slab,
} from "../src/scene/sectors.ts";
import { autoAction, newGame } from "./helpers.ts";

const ASPECTS = [1, 1.6, 844 / 390, 2.4];

function city(seed: string) {
  const { game } = newGame(seed);
  const layout = buildCityLayout(game.map);
  const full = buildSceneModel(game.map, layout, revealAllView(game.map, publicView(game.map, game.state)));
  const kit = buildKit(full, seed);
  return { game, layout, full, kit, index: indexSectors(full, kit.primitives), slab: citySlab(layout) };
}

/** Riquadro della primitiva calcolato da three.js, indipendente dalle formule del modulo. */
const unitMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
const threeBox = (p: Primitive): THREE.Box3 => {
  const mesh = unitMesh;
  mesh.position.set(p.position.x, p.position.y, p.position.z);
  mesh.rotation.set(p.rotation.x, p.rotation.y, p.rotation.z);
  mesh.scale.set(p.scale.x, p.scale.y, p.scale.z);
  mesh.updateMatrixWorld();
  return new THREE.Box3().setFromObject(mesh);
};

test("settori: assegnazione, distanza e isteresi", () => {
  assert.deepEqual(sectorsOf({ minX: 1, maxX: 2, minZ: 1, maxZ: 2 }), ["0,0"]);
  assert.deepEqual(sectorsOf({ minX: -1, maxX: 17, minZ: 3, maxZ: 4 }).sort(), ["-1,0", "0,0", "1,0"]);
  assert.equal(sectorDistance("0,0", 8, 8), 0);
  assert.equal(sectorDistance("1,0", 0, 8), SECTOR.size);
  const occupied = ["0,0", "2,0", "4,0"];
  const focus = (x: number): Focus[] => [{ x, z: 8, radius: 20 }];
  // Da x=8 il settore 2,0 (x 32–48) dista 24: fuori dal raggio 20.
  const first = updateLoadedSectors(new Set(), occupied, focus(8));
  assert.deepEqual([...first], ["0,0"]);
  // Avvicinandosi entra; allontanandosi resta finché non supera raggio + isteresi.
  const second = updateLoadedSectors(first, occupied, focus(14));
  assert.deepEqual([...second].sort(), ["0,0", "2,0"]);
  // Il settore 2,0 inizia a x=32: resta finché la distanza supera il raggio di non più dell'isteresi.
  const edge = 32 - 20 - SECTOR.hysteresis;
  assert.ok(updateLoadedSectors(second, occupied, focus(edge + 0.5)).has("2,0"));
  assert.ok(!updateLoadedSectors(second, occupied, focus(edge - 0.5)).has("2,0"));
  // Senza isteresi lo stesso spostamento lo scarica subito.
  assert.ok(!updateLoadedSectors(second, occupied, focus(8), 0).has("2,0"));
});

test("la fascia di quote e i settori di ogni elemento contengono tutte le sue primitive", () => {
  for (const seed of ["settori-1", "settori-2", "settori-3"]) {
    const { kit, index, slab, full } = city(seed);
    for (const p of kit.primitives) {
      const box = threeBox(p);
      const e = primitiveHalfExtents(p);
      for (const axis of ["x", "y", "z"] as const) assert.ok(Math.abs(box.max[axis] - p.position[axis] - e[axis]) < 1e-6, `${seed}: ingombro ${axis} diverso da three.js`);
      assert.ok(box.min.y >= slab.minY - 1e-6 && box.max.y <= slab.maxY + 1e-6, `${seed}: ${elementKey(p.ref)} fuori dalla fascia`);
      const sectors = new Set(index.elements.get(elementKey(p.ref)));
      for (const key of sectorsOf({ minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z })) {
        assert.ok(sectors.has(key), `${seed}: ${elementKey(p.ref)} sporge nel settore ${key}`);
      }
    }
    for (const tile of full.tiles) assert.ok(index.tiles.get(tile.id)!.length > 0);
  }
});

/** Volume di una camera three.js, per un controllo indipendente dalle formule del modulo. */
function threeVolumes(pose: CameraPose, aspect: number): THREE.Camera[] {
  const position = cameraPosition(pose.target, pose.distance, pose.pitch);
  const view = new THREE.PerspectiveCamera(CAMERA_OPTICS.fov, aspect, CAMERA_OPTICS.near, fogRange(pose.distance).far);
  view.position.set(position.x, position.y, position.z);
  view.lookAt(pose.target.x, pose.target.y, pose.target.z);
  const e = shadowExtent(pose.distance);
  const sun = new THREE.OrthographicCamera(-e, e, e, -e, SUN.shadowNear, SUN.shadowFar);
  sun.position.set(pose.target.x + SUN.offset.x, pose.target.y + SUN.offset.y, pose.target.z + SUN.offset.z);
  sun.lookAt(pose.target.x, pose.target.y, pose.target.z);
  for (const camera of [view, sun]) {
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
  }
  return [view, sun];
}

/** Massima distanza orizzontale dal punto inquadrato, campionando le facce del volume di three.js dentro la fascia. */
function sampledReach(pose: CameraPose, aspect: number, slab: Slab, seed: string): number {
  const rng = rngFromSeed(seed, "campioni");
  let reach = 0;
  const point = new THREE.Vector3();
  for (const camera of threeVolumes(pose, aspect)) {
    for (let i = 0; i < 20000; i++) {
      const c = [rng.next() * 2 - 1, rng.next() * 2 - 1, rng.next() * 2 - 1];
      const face = Math.floor(rng.next() * 6);
      c[face >> 1] = face & 1 ? 1 : -1;
      point.set(c[0]!, c[1]!, c[2]!).unproject(camera);
      if (point.y < slab.minY || point.y > slab.maxY) continue;
      reach = Math.max(reach, Math.hypot(point.x - pose.target.x, point.z - pose.target.z));
    }
  }
  return reach;
}

test("raggio visibile: coincide con i volumi di camera e ombra di three.js e ne contiene ogni punto", () => {
  const { layout, slab } = city("settori-4");
  const targets = Object.values(layout.positions).filter((_, i) => i % 9 === 0);
  const poses: CameraPose[] = [
    ...targets.flatMap((target) => Object.values(SHOTS).map((shot) => ({ target, ...shot }))),
    seatPose({ x: 0, y: 0, z: 0 }),
  ];
  poses.forEach((pose, i) => {
    const aspect = ASPECTS[i % ASPECTS.length]!;
    const radius = visibleRadius(pose, aspect, slab);
    const sampled = sampledReach(pose, aspect, slab, `posa-${i}`);
    assert.ok(sampled <= radius + 1e-6, `posa ${i}: campione a ${sampled.toFixed(2)} oltre il raggio ${radius.toFixed(2)}`);
    // Vertici dei volumi ricavati da three.js (piano vicino, poi lontano; x, poi y): stesso risultato delle formule del modulo.
    const exact = Math.max(
      ...threeVolumes(pose, aspect).map((camera) => {
        const corners = [-1, 1].flatMap((z) => [-1, 1].flatMap((x) => [-1, 1].map((y) => new THREE.Vector3(x, y, z).unproject(camera).toArray())));
        return reachWithinSlab(corners, slab, pose.target);
      }),
    );
    assert.ok(Math.abs(exact - radius) < 1e-6, `posa ${i}: ${radius} contro ${exact} da three.js`);
  });
});

/** Fotogrammi della regia lungo una partita automatica, con le pedine di ciascuno. */
function* directorFrames(game: Game, actions: number) {
  const layout = buildCityLayout(game.map);
  const director = new CameraDirector(game.map, layout, game.state, {});
  director.intro();
  let state = game.state;
  for (let i = 0; i < actions && state.phase !== "ended"; i++) {
    while (director.busy) {
      yield { frame: director.getFrame(), state };
      director.update(1 / 12);
    }
    yield { frame: director.getFrame(), state };
    const result = applyAction(game.map, state, autoAction(game, state, i % 3 ? "piu-breve" : "piu-lungo"));
    state = result.state;
    director.enqueue(result.events, state);
  }
}

function foci(frame: { camera: CameraPose; pawns: Record<string, { x: number; y: number; z: number }> }, aspect: number, slab: Slab, forced: number | null): Focus[] {
  return [
    { x: frame.camera.target.x, z: frame.camera.target.z, radius: forced ?? visibleRadius(frame.camera, aspect, slab) },
    ...Object.values(frame.pawns).map((p) => ({
      x: p.x,
      z: p.z,
      radius: forced ?? Math.max(...Object.values(SHOTS).map((shot) => visibleRadius({ target: p, ...shot }, aspect, slab))),
    })),
  ];
}

test("in ogni fotogramma della regia è caricato tutto ciò che la camera può mostrare od ombreggiare", (t) => {
  let frames = 0,
    loadedShare = 0;
  for (const seed of ["settori-5", "settori-6", "settori-7"]) {
    const { game, layout, slab } = city(seed);
    const aspect = ASPECTS[frames % ASPECTS.length]!;
    let loaded = new Set<string>();
    for (const { frame, state } of directorFrames(game, 120)) {
      frames++;
      const model = buildSceneModel(game.map, layout, presentedView(game.map, { ...publicView(game.map, state), activePlayerId: frame.activePlayerId }, frame.explored));
      const kit = buildKit(model, seed);
      const index = indexSectors(model, kit.primitives);
      loaded = updateLoadedSectors(loaded, index.occupied, foci(frame, aspect, slab, null));
      loadedShare += loaded.size / index.occupied.size;
      // La proprietà deve valere già con il solo fuoco della camera e senza isteresi: pedine e isteresi sono margini in più.
      const strict = updateLoadedSectors(new Set(), index.occupied, foci(frame, aspect, slab, null).slice(0, 1), 0);
      for (const key of strict) assert.ok(loaded.has(key));
      const frustums = threeVolumes(frame.camera, aspect).map((c) => new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse)));
      for (const p of kit.primitives) {
        if (frustums.some((f) => f.intersectsBox(threeBox(p)))) assert.ok(isLoaded(index.elements.get(elementKey(p.ref)), strict), `${seed}: ${elementKey(p.ref)} visibile ma scaricato`);
      }
    }
  }
  // Con nebbia e città attuali il volume visibile copre quasi sempre la città intera: lo si annota, non è un requisito.
  t.diagnostic(`fotogrammi ${frames}, settori caricati in media ${((100 * loadedShare) / frames).toFixed(1)}% di quelli occupati`);
});

test("raggio forzato: pedine sempre caricate, scaricamento effettivo e isteresi utile", () => {
  const { game, full, index, slab } = city("settori-8");
  const tileOf = (p: { x: number; z: number }) => full.tiles.find((tile) => tile.position.x === p.x && tile.position.z === p.z);
  let loaded = new Set<string>(),
    loadedNoHysteresis = new Set<string>();
  let changes = 0,
    changesNoHysteresis = 0,
    minShare = 1;
  for (const { frame } of directorFrames(game, 160)) {
    const focus = foci(frame, 1.6, slab, 24);
    const next = updateLoadedSectors(loaded, index.occupied, focus);
    const nextNoHysteresis = updateLoadedSectors(loadedNoHysteresis, index.occupied, focus, 0);
    if ([...next].sort().join() !== [...loaded].sort().join()) changes++;
    if ([...nextNoHysteresis].sort().join() !== [...loadedNoHysteresis].sort().join()) changesNoHysteresis++;
    loaded = next;
    loadedNoHysteresis = nextNoHysteresis;
    minShare = Math.min(minShare, loaded.size / index.occupied.size);
    for (const pawn of Object.values(frame.pawns)) {
      const tile = tileOf(pawn);
      if (tile) assert.ok(isLoaded(index.elements.get(`tile:${tile.id}`), loaded), `casella ${tile.id} della pedina scaricata`);
    }
  }
  assert.ok(minShare < 0.6, `con raggio 24 non si scarica abbastanza (${minShare})`);
  assert.ok(changes > 0 && changes < changesNoHysteresis, `isteresi inefficace: ${changes} contro ${changesNoHysteresis}`);
});
