import assert from "node:assert/strict";
import * as THREE from "three";
import { test } from "node:test";
import { applyAction, type Game, type GameEvent, type GameState } from "../src/logic/index.ts";
import { buildCityLayout } from "../src/layout/layout.ts";
import { maxDistance, MIN_SCREEN_FRACTION, poseFor, RUNNER_HEIGHT } from "../src/run/camera.ts";
import { junctionRoomOf, roomOf, slopeOf, type Room } from "../src/run/rooms.ts";
import { RUN_TIMING, RunDirector, type RunFrame } from "../src/run/runDirector.ts";
import { STRIDE } from "../src/run/runScene.ts";
import { buildRoom, STRIP } from "../src/run/strip.ts";
import { autoAction, newGame } from "./helpers.ts";

function city(seed: string) {
  const { game } = newGame(seed);
  return { game, layout: buildCityLayout(game.map) };
}

test("stanze: una per casella, deterministiche, tipi e pendenze dalla città generata", () => {
  const kinds = new Set<string>(),
    slopes = new Set<string>();
  for (const seed of ["stanze-1", "stanze-2", "stanze-3"]) {
    const { game, layout } = city(seed);
    for (const cell of Object.values(game.map.cells)) {
      const room = roomOf(game.map, layout, cell.id);
      assert.deepEqual(roomOf(game.map, layout, cell.id), room);
      assert.equal(room.key, cell.id);
      if (cell.kind === "start") assert.equal(room.kind, "partenza");
      else if (cell.kind === "exit") assert.equal(room.kind, "uscita");
      else assert.ok(["corridoio", "sala", "ponte", "pozzo"].includes(room.kind));
      const next = cell.next.length === 1 ? layout.positions[cell.next[0]!]!.y - layout.positions[cell.id]!.y : 0;
      assert.equal(room.slope, next > 0.3 ? "salita" : next < -0.3 ? "discesa" : "piano");
      kinds.add(room.kind);
      slopes.add(slopeOf(game.map, layout, cell.id));
    }
    for (const cellId of Object.keys(game.map.options)) {
      const junction = junctionRoomOf(game.map, cellId);
      assert.equal(junction.kind, "bivio");
      assert.equal(junction.doors, game.map.cells[cellId]!.next.length);
    }
  }
  assert.deepEqual([...slopes].sort(), ["discesa", "piano", "salita"]);
  assert.equal(kinds.size, 6, `tipi generati: ${[...kinds].join(", ")}`);
});

test("geometria delle stanze: periodica per le ripetute, con porte per bivio e uscita", () => {
  const { game, layout } = city("stanze-4");
  for (const cell of Object.values(game.map.cells)) {
    const room = roomOf(game.map, layout, cell.id);
    const build = buildRoom(game.map.seed, room);
    assert.deepEqual(buildRoom(game.map.seed, room), build);
    if (room.kind === "uscita") {
      assert.ok(!build.periodic);
      assert.equal(build.doors.length, 1);
      continue;
    }
    assert.ok(build.periodic);
    for (const p of build.primitives) assert.ok(p.position.x >= 0 && p.position.x < STRIP.period, "centro fuori dal periodo");
    // Passerella continua, inclinata come la stanza.
    const deck = build.primitives.filter((p) => p.ref.kind === "walkway" && p.material === "concrete");
    assert.equal(deck.length, STRIP.period / STRIP.module);
    for (const p of deck) assert.ok(Math.abs(p.rotation.z - build.angle) < 1e-12);
    assert.equal(Math.sign(build.angle), room.slope === "salita" ? 1 : room.slope === "discesa" ? -1 : 0);
  }
  for (const cellId of Object.keys(game.map.options)) {
    const build = buildRoom(game.map.seed, junctionRoomOf(game.map, cellId));
    assert.ok(!build.periodic);
    assert.equal(build.doors.length, game.map.cells[cellId]!.next.length);
    assert.ok(build.doors.every((d) => d.x === STRIP.wall));
    assert.equal(new Set(build.doors.map((d) => d.z)).size, build.doors.length, "porte sovrapposte");
  }
  assert.ok(Number.isInteger(STRIP.period / STRIDE), "il passo divide il periodo");
});

test("inquadratura scelta con la stanza: deterministica, per tipo, dal lato del percorso, personaggio visibile", () => {
  const byKind = new Map<string, Room[]>();
  for (const seed of ["inquadrature-1", "inquadrature-2", "inquadrature-3", "inquadrature-4"]) {
    const { game, layout } = city(seed);
    const rooms = [...Object.keys(game.map.cells).map((id) => roomOf(game.map, layout, id)), ...Object.keys(game.map.options).map((id) => junctionRoomOf(game.map, id))];
    for (const r of rooms) {
      (byKind.get(r.kind) ?? byKind.set(r.kind, []).get(r.kind)!).push(r);
      const pose = poseFor(r.shot);
      const d = Math.hypot(pose.position[0] - pose.target[0], pose.position[1] - pose.target[1], pose.position[2] - pose.target[2]);
      // Altezza minima del personaggio sull'immagine.
      const fraction = RUNNER_HEIGHT / (2 * d * Math.tan(((r.shot.fov / 2) * Math.PI) / 180));
      assert.ok(fraction >= MIN_SCREEN_FRACTION - 1e-9, `${r.kind}: personaggio al ${(100 * fraction).toFixed(1)}%`);
      assert.ok(d <= maxDistance(r.shot.fov) + 1e-9);
      // Lato fisso: la camera resta dal lato +Z del percorso.
      assert.ok(pose.position[2] >= 0, `${r.kind}: camera dall'altra parte del percorso`);
      // Il personaggio, dai piedi alla testa, sta dentro l'inquadratura e lontano dalla camera, anche con la domanda aperta.
      // Nella stanza del bivio non ci sono domande: ci si passa solo durante l'avanzamento.
      for (const question of r.kind === "bivio" ? [false] : [false, true]) {
        const p = poseFor(r.shot, { question });
        const camera = new THREE.PerspectiveCamera(p.fov, 16 / 9, 0.3, 400);
        camera.position.set(...p.position);
        camera.lookAt(...p.target);
        camera.updateMatrixWorld();
        for (const y of [0, 1.0, 1.9]) {
          const v = new THREE.Vector3(0, y, 0).project(camera);
          assert.ok(Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.95 && v.z < 1, `${r.kind}: personaggio fuori dall'inquadratura (${v.x.toFixed(2)}, ${v.y.toFixed(2)})`);
        }
        assert.ok(Math.hypot(...p.position.map((c, i) => c - [0, 1, 0][i]!)) > 5, `${r.kind}: camera addosso al personaggio`);
        // Bivio: le porte, con i loro numeri, restano nell'inquadratura.
        if (r.kind === "bivio") {
          for (const door of buildRoom("inquadrature", r).doors) {
            const v = new THREE.Vector3(door.x, 3.8, door.z).project(camera);
            assert.ok(Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.95 && v.z < 1, `bivio: porta fuori dall'inquadratura (${v.x.toFixed(2)}, ${v.y.toFixed(2)})`);
          }
        }
      }
      // Con la domanda aperta si avvicina.
      const near = poseFor(r.shot, { question: true });
      assert.ok(Math.hypot(near.position[0] - near.target[0], near.position[1] - near.target[1], near.position[2] - near.target[2]) < d);
    }
  }
  // Bivio sempre alle spalle, verso le porte; nelle altre stanze di lato o di tre quarti.
  for (const r of byKind.get("bivio")!) assert.ok(r.shot.yaw < -60 && r.shot.lookAhead > 3);
  for (const [kind, rooms] of byKind) if (kind !== "bivio") assert.ok(rooms.every((r) => r.shot.yaw >= 0 && r.shot.yaw <= 45), kind);
  // L'inquadratura dipende dalla stanza, non dalla pendenza: stanze dello stesso tipo variano.
  const corridors = byKind.get("corridoio") ?? [];
  assert.ok(new Set(corridors.map((r) => r.shot.yaw.toFixed(2))).size > 1, "nessuna variazione fra stanze dello stesso tipo");
  assert.equal(MIN_SCREEN_FRACTION, 0.05);
});

/** Partita automatica con la regia della corsa: ogni fotogramma registrato. */
function play(game: Game, layout: ReturnType<typeof buildCityLayout>, actions: number, reducedMotion = false) {
  const director = new RunDirector(game.map, layout, game.state, { reducedMotion });
  let state: GameState = game.state;
  const log: { before: GameState; after: GameState; events: GameEvent[]; frames: RunFrame[] }[] = [];
  for (let i = 0; i < actions && state.phase !== "ended"; i++) {
    // Una risposta su tre errata: si esercitano anche i turni senza movimento.
    const action = state.phase === "question" && i % 3 === 0 ? ({ type: "answer", outcome: "wrong" } as const) : autoAction(game, state, i % 2 ? "piu-breve" : "piu-lungo");
    const result = applyAction(game.map, state, action);
    director.enqueue(result.events, result.state);
    const frames: RunFrame[] = [];
    for (let guard = 0; director.busy || guard === 0; guard++) {
      assert.ok(guard < 5000, "regia senza fine");
      frames.push(director.update(1 / 30));
    }
    log.push({ before: state, after: result.state, events: result.events, frames });
    state = result.state;
  }
  return { log, state };
}

test("regia della corsa: uscita dalla stanza, bivi, eventi e cambio di stanza solo se serve", () => {
  let forks = 0,
    events = 0,
    sameRoom = 0,
    hiddenArrivals = 0;
  for (const seed of ["regia-corsa-1", "regia-corsa-2", "regia-corsa-3"]) {
    const { game, layout } = city(seed);
    const { log, state } = play(game, layout, 400);
    assert.equal(state.phase, "ended");
    for (const { before, after, events: ev, frames } of log) {
      const last = frames.at(-1)!;
      // A regia ferma la scena è nella stanza del giocatore di turno, con chi vi si trova.
      const active = after.players[after.activeIndex]!;
      if (after.phase !== "ended") {
        if (after.phase === "fork") assert.equal(last.room.key, `bivio:${active.cellId}`, "scelta fuori dalla stanza del bivio");
        else assert.equal(last.room.key, active.cellId, "scena fuori dalla stanza del giocatore di turno");
        assert.equal(last.activePlayerId, active.id);
        assert.equal(last.runners[0], active.id);
        const here = after.players.filter((p) => p.cellId === (after.phase === "fork" ? null : active.cellId)).map((p) => p.id);
        if (after.phase !== "fork") assert.deepEqual([...last.runners].sort(), here.sort());
        assert.equal(last.fade, 0);
      }
      const rolled = ev.find((e) => e.type === "diceRolled");
      const arrived = ev.find((e) => e.type === "arrived");
      // La stanza d'arrivo senza evento non si vede mai.
      if (arrived && !arrived.special && arrived.cellId !== game.map.exitId) {
        const nextActive = after.players[after.activeIndex]!;
        const shownArrival = frames.some((f) => f.room.key === arrived.cellId && f.runners.includes(arrived.playerId) && nextActive.cellId !== arrived.cellId);
        assert.ok(!shownArrival, "stanza d'arrivo mostrata senza evento");
        hiddenArrivals++;
      }
      if (arrived?.special) {
        assert.ok(frames.some((f) => f.room.key === arrived.cellId && f.runners[0] === arrived.playerId), "evento all'arrivo non mostrato");
        events++;
      }
      if (rolled) assert.ok(frames.some((f) => f.advance > 0.9 && f.door === null), "uscita dalla stanza non mostrata");
      if (ev.some((e) => e.type === "branchChoiceRequested")) {
        assert.ok(last.room.kind === "bivio" && !last.running && last.approach === 0, "arresto davanti alle porte");
        forks++;
      }
      // Turno successivo nella stanza già mostrata: nessuna dissolvenza.
      const turn = ev.find((e) => e.type === "turnStarted");
      const detour = ev.some((e) => e.type === "branchChoiceRequested" || (e.type === "arrived" && e.special));
      if (turn && !detour && before.phase !== "fork" && before.players[before.activeIndex]!.cellId === active.cellId) {
        assert.ok(frames.every((f) => f.fade === 0), "dissolvenza senza cambio di stanza");
        sameRoom++;
      }
    }
  }
  assert.ok(forks > 0 && events > 0 && sameRoom > 0 && hiddenArrivals > 0, `casi: bivi ${forks}, eventi ${events}, stessa stanza ${sameRoom}, arrivi nascosti ${hiddenArrivals}`);
});

test("regia della corsa: movimento ridotto senza animazioni né dissolvenze, salto equivalente", () => {
  const { game, layout } = city("regia-corsa-4");
  const reduced = play(game, layout, 60, true);
  for (const { frames } of reduced.log) {
    assert.equal(frames.length, 1, "regia animata con il movimento ridotto");
    assert.equal(frames[0]!.fade, 0);
    assert.equal(frames[0]!.distance, 0, "la stanza scorre con il movimento ridotto");
  }
  // Saltare porta alla stessa scena della riproduzione completa.
  const director = new RunDirector(game.map, layout, game.state);
  const skipped = new RunDirector(game.map, layout, game.state);
  let state = game.state;
  for (let i = 0; i < 30 && state.phase !== "ended"; i++) {
    const result = applyAction(game.map, state, autoAction(game, state));
    director.enqueue(result.events, result.state);
    skipped.enqueue(result.events, result.state);
    while (director.busy) director.update(1 / 30);
    const a = director.getFrame(),
      b = skipped.skip();
    assert.deepEqual([a.room.key, a.runners, a.activePlayerId, a.fade, a.cells], [b.room.key, b.runners, b.activePlayerId, b.fade, b.cells]);
    state = result.state;
  }
  assert.ok(RUN_TIMING.cut > 0);
});
