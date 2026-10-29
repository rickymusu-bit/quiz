"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const K = require("../assets/hell-cerbero.js"),
  M = require("../assets/hell-motion.js"),
  C = require("../assets/hell-chase.js");
const near = (a, b, e = 1e-6) => assert(Math.abs(a - b) < e, `${a} != ${b}`),
  body = { ...M.CHASE, runWeight: 1 };
test("Three stable mouths and four drawn legs replace the elastic mesh and hand anchor", () => {
  assert.deepEqual(K.heads, ["left", "center", "right"]);
  assert.equal(K.legs.length, 4);
  assert.equal(K.deform, undefined);
  for (let i = 0; i < 32; i++) {
    const g = K.geometry(body, { distance: i, time: i / 48 });
    assert.deepEqual(Object.keys(g.mouths), K.heads);
    assert.equal(g.hand, undefined);
    for (const id of K.heads) {
      const h = g.heads[id],
        actual = K.transform(h, h.definition.mouth);
      near(actual.x, g.mouths[id].x);
      near(actual.y, g.mouths[id].y);
      near(Math.hypot(g.directions[id].x, g.directions[id].y), 1);
    }
  }
});
test("Necks remain attached and their painted bone lengths stay rigid through the gait", () => {
  for (let i = 0; i < 64; i++) {
    const g = K.geometry(body, { distance: i / 2, time: i / 96 });
    for (const id of K.heads) {
      const h = g.heads[id],
        endpoint = K.transform(h.neck, g.def.headRoots[id]);
      near(endpoint.x, h.root.x);
      near(endpoint.y, h.root.y);
      const a = g.def.neckRoots[id],
        b = g.def.headRoots[id],
        native = Math.hypot(a[0] - b[0], a[1] - b[1]);
      near(
        Math.hypot(h.root.x - h.neck.root.x, h.root.y - h.neck.root.y),
        native * g.scale,
      );
    }
  }
  assert.equal(
    new Set(K.data.walk.map((f) => f.referenceWidth)).size,
    1,
    "Drawn body poses use one fixed uniform scale",
  );
});
test("Each head moves independently and the articulated tail visibly wags without stretching", () => {
  const samples = Array.from({ length: 32 }, (_, i) =>
    K.geometry(body, {
      distance: (i * M.STRIDE) / 32,
      time: (i * M.STRIDE) / 32 / 48,
    }),
  );
  for (const id of K.heads) {
    const values = samples.map((g) => g.heads[id].angle);
    assert(
      Math.max(...values) - Math.min(...values) > 0.2,
      id + " has a real angular movement",
    );
  }
  const tips = samples.map((g) => g.tailTip.y);
  assert(Math.max(...tips) - Math.min(...tips) > 12, "Tail tip sweeps visibly");
  for (const g of samples)
    for (let i = 1; i < g.tail.length; i++) {
      const source =
          i === 1 ? K.data.parts.tail.joint1 : K.data.parts.tail.joint2,
        p = K.transform(g.tail[i - 1], source);
      near(p.x, g.tail[i].root.x);
      near(p.y, g.tail[i].root.y);
    }
});
test("Active time and distance determine identical poses at 30/60/144 Hz, pause and reduced motion", () => {
  const travel = { distance: 117, time: 3 },
    before = JSON.stringify({ body, travel }),
    reference = K.geometry(body, travel);
  for (const fps of [30, 60, 144]) {
    for (let i = 0; i < fps; i++)
      K.geometry(body, { distance: (117 * i) / fps, time: (3 * i) / fps });
    assert.deepEqual(K.geometry(body, travel), reference);
  }
  assert.equal(JSON.stringify({ body, travel }), before);
  assert.deepEqual(K.geometry(body, travel), reference);
});
test("Capture keeps the rear of the car attached to the biting mouth, with no paw grip", () => {
  const state = {
      winner: 0,
      groups: [{ out: false }, { out: false }, { out: false }],
    },
    entry = C.defaultEntry(state),
    route = C.captureRoute(entry, 1, K.metrics());
  for (let t = C.T.bite; t < C.T.release; t += 0.02) {
    const f = C.captureFrame(route, t),
      g = K.geometry(f.demon),
      v = f.positions[1];
    assert(f.attached);
    near(v.x - Math.cos(v.rotation) * v.width * 0.35, g.mouths.right.x);
    near(
      v.ground - v.height / 2 - Math.sin(v.rotation) * v.width * 0.35,
      g.mouths.right.y,
    );
    assert.equal(g.hand, undefined);
  }
});
