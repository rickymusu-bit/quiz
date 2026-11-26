import assert from "node:assert/strict";
import { test } from "node:test";
import { KIT, buildKit, massKey, walkwayKey, type Primitive } from "../src/kit/kit.ts";
import { applyAction, publicView } from "../src/logic/index.ts";
import { buildCityLayout } from "../src/layout/layout.ts";
import { TILE, tileScale } from "../src/scene/dimensions.ts";
import { buildSceneModel, revealAllView } from "../src/scene/model.ts";
import { autoAction, newGame } from "./helpers.ts";

function setup(seed: string) {
  const { game } = newGame(seed);
  const layout = buildCityLayout(game.map);
  const full = buildSceneModel(game.map, layout, revealAllView(game.map, publicView(game.map, game.state)));
  return { game, layout, full, fullKit: buildKit(full, seed) };
}

const byRef = (primitives: readonly Primitive[]): Map<string, Primitive[]> => {
  const out = new Map<string, Primitive[]>();
  for (const p of primitives) {
    const key = `${p.ref.kind}:${p.ref.key}`;
    (out.get(key) ?? out.set(key, []).get(key)!).push(p);
  }
  return out;
};

test("kit deterministico e di dimensioni contenute", () => {
  const { full, fullKit } = setup("kit-1");
  assert.deepEqual(buildKit(full, "kit-1"), fullKit);
  assert.ok(fullKit.primitives.length > 500 && fullKit.primitives.length < 3000, `${fullKit.primitives.length} primitive`);
});

test("ogni elemento ha lo stesso aspetto appena rivelato e nella città intera", () => {
  // Unica eccezione voluta: una casella in cui arriva un ramo ancora nascosto tiene la ringhiera chiusa
  // da quel lato, altrimenti l'apertura rivelerebbe il ramo. Si apre quando il ramo viene esplorato.
  let closedTowardHidden = 0;
  for (const seed of ["kit-2", "kit-3"]) {
    const { game, layout, fullKit } = setup(seed);
    const complete = byRef(fullKit.primitives);
    let state = game.state;
    for (let i = 0; i < 40 && state.phase !== "ended"; i++) {
      state = applyAction(game.map, state, autoAction(game, state, i % 2 ? "piu-breve" : "piu-lungo")).state;
      const explored = new Set(state.explored);
      const kit = buildKit(buildSceneModel(game.map, layout, publicView(game.map, state)), seed);
      for (const [key, primitives] of byRef(kit.primitives)) {
        const [kind, id] = key.split(":") as [string, string];
        const hiddenPredecessors = kind === "tile" ? Object.values(game.map.cells).filter((c) => c.next.includes(id) && !explored.has(c.id)) : [];
        if (hiddenPredecessors.length === 0) {
          assert.deepEqual(primitives, complete.get(key), `${seed}: ${key} cambia con l'esplorazione`);
          continue;
        }
        const tile = layout.positions[id]!;
        for (const hidden of hiddenPredecessors) {
          const from = layout.positions[hidden.id]!;
          const toward = { x: from.x - tile.x, z: from.z - tile.z };
          const facing = kit.sockets[id]!.some((socket) => {
            const v = { x: socket.x - tile.x, z: socket.z - tile.z };
            return (v.x * toward.x + v.z * toward.z) / (Math.hypot(v.x, v.z) * Math.hypot(toward.x, toward.z)) > 0.99;
          });
          assert.equal(facing, false, `${seed}: ${id} apre la ringhiera verso il ramo nascosto ${hidden.id}`);
          closedTowardHidden++;
        }
      }
    }
  }
  assert.ok(closedTowardHidden > 0, "caso del ramo nascosto non esercitato");
});

test("agganci: passerelle sul bordo delle piattaforme, ringhiere interrotte solo lì", () => {
  for (const seed of ["kit-4", "kit-5", "kit-6"]) {
    const { full, fullKit } = setup(seed);
    const tiles = new Map(full.tiles.map((t) => [t.id, t]));
    const refs = byRef(fullKit.primitives);
    for (const tile of full.tiles) {
      const half = (TILE.size * tileScale(tile.kind)) / 2;
      const sockets = fullKit.sockets[tile.id]!;
      const degree = full.walkways.filter((w) => w.from === tile.id || w.to === tile.id).length;
      assert.equal(sockets.length, degree, `${tile.id}: un aggancio per passerella`);
      for (const socket of sockets) {
        const edge = Math.max(Math.abs(socket.x - tile.position.x), Math.abs(socket.z - tile.position.z));
        assert.ok(Math.abs(edge - half) < 1e-9, `${tile.id}: aggancio fuori dal bordo`);
      }
      const posts = refs.get(`tile:${tile.id}`)!.filter((p) => p.shape === "cylinder" && Math.abs(p.scale.y - KIT.railingHeight) < 1e-9);
      assert.ok(posts.length > 0, `${tile.id}: nessuna ringhiera`);
      for (const post of posts) {
        for (const socket of sockets) assert.ok(Math.hypot(post.position.x - socket.x, post.position.z - socket.z) > KIT.socketClearance - 1e-9, `${tile.id}: montante davanti a una passerella`);
      }
    }
    for (const walkway of full.walkways) assert.ok(tiles.has(walkway.from) && tiles.has(walkway.to!), "passerella fra caselle mostrate");
  }
});

test("le primitive restano nell'ingombro del proprio elemento", () => {
  const { full, fullKit } = setup("kit-7");
  const refs = byRef(fullKit.primitives);
  for (const tile of full.tiles) {
    const half = (TILE.size * tileScale(tile.kind)) / 2 + 0.05;
    for (const p of refs.get(`tile:${tile.id}`)!) {
      assert.ok(Math.abs(p.position.x - tile.position.x) <= half && Math.abs(p.position.z - tile.position.z) <= half, `${tile.id}: parte fuori dalla piattaforma`);
      assert.ok(p.position.y <= tile.position.y + 2 && p.position.y >= tile.position.y - 1.2);
    }
  }
  for (const mass of full.masses) {
    for (const p of refs.get(`mass:${massKey(mass)}`)!) {
      assert.ok(Math.abs(p.position.x - mass.x) <= mass.width / 2 + 0.6 && Math.abs(p.position.z - mass.z) <= mass.depth / 2 + 0.6, "parte fuori dalla massa");
      assert.ok(p.position.y <= mass.top + 2.5);
    }
  }
  for (const walkway of full.walkways) {
    const parts = refs.get(`walkway:${walkwayKey(walkway)}`)!;
    assert.ok(parts.length >= 5, "passerella senza cordoli o corrimano");
    const minX = Math.min(walkway.a.x, walkway.b.x) - 1,
      maxX = Math.max(walkway.a.x, walkway.b.x) + 1,
      minZ = Math.min(walkway.a.z, walkway.b.z) - 1,
      maxZ = Math.max(walkway.a.z, walkway.b.z) + 1;
    for (const p of parts) assert.ok(p.position.x >= minX && p.position.x <= maxX && p.position.z >= minZ && p.position.z <= maxZ, "parte fuori dalla passerella");
  }
});

test("passerelle in pendenza: rampa da centro a centro, corrimano con la stessa inclinazione", () => {
  for (const seed of ["kit-8", "kit-9", "kit-10", "kit-11"]) {
    const { full, fullKit } = setup(seed);
    const refs = byRef(fullKit.primitives);
    for (const walkway of full.walkways) {
      const run = Math.hypot(walkway.b.x - walkway.a.x, walkway.b.z - walkway.a.z);
      const slope = Math.atan2(walkway.b.y - walkway.a.y, run);
      for (const p of refs.get(`walkway:${walkwayKey(walkway)}`)!) {
        if (p.shape !== "box") continue;
        assert.ok(Math.abs(Math.abs(p.rotation.z) - Math.abs(slope)) < 1e-9, `${seed}: inclinazione diversa dalla passerella`);
      }
    }
  }
});

test("il kit non contiene riferimenti a celle nascoste", () => {
  const { game, layout } = setup("kit-12");
  let state = game.state;
  for (let i = 0; i < 30 && state.phase !== "ended"; i++) {
    const kit = buildKit(buildSceneModel(game.map, layout, publicView(game.map, state)), "kit-12");
    const serialized = JSON.stringify(kit);
    const explored = new Set(state.explored);
    for (const id of Object.keys(game.map.cells)) if (!explored.has(id)) assert.ok(!serialized.includes(`"${id}"`) && !serialized.includes(`>${id}"`), `cella nascosta ${id}`);
    state = applyAction(game.map, state, autoAction(game, state)).state;
  }
});
