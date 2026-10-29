"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const K = require("../assets/hell-cerbero.js"),
  M = require("../assets/hell-motion.js"),
  C = require("../assets/hell-chase.js");
const near = (a, b, eps = 1e-6) =>
  assert(Math.abs(a - b) < eps, `${a} != ${b}`);
const body = { ...M.CHASE, runWeight: 1, pose: C.pose(0) };
test("The canonical rig has three stable mouths, four legs and interpolates every joint exactly", () => {
  assert.deepEqual(K.heads, ["left", "center", "right"]);
  assert.equal(K.legs.length, 4);
  for (let frame = 0; frame < 16; frame++) {
    const d = { ...body, pose: C.pose(frame) },
      pose = K.sample(d, { distance: 23, time: 2 });
    Object.values(K.points).forEach(([x, y], i) => {
      const p = K.deform({ x, y }, pose);
      near(p.x, pose.targets[i].x);
      near(p.y, pose.targets[i].y);
    });
    const rig = K.geometry(d, { distance: 23, time: 2 });
    assert.deepEqual(Object.keys(rig.mouths), K.heads);
    for (const direction of Object.values(rig.directions)) {
      near(Math.hypot(direction.x, direction.y), 1);
      assert(
        direction.x > 0.7,
        "Each emission follows its forward-facing head",
      );
    }
  }
});
test("Planted feet have no world slide, and every stride joins continuously", () => {
  for (const side of K.legs) {
    const offset = ["hind_far", "front_near"].includes(side) ? M.STRIDE / 2 : 0;
    const a = M.STRIDE * 0.1 - offset,
      b = M.STRIDE * 0.4 - offset;
    const p = K.geometry(body, { distance: a, time: a / 48 }).feet[side],
      q = K.geometry(body, { distance: b, time: b / 48 }).feet[side];
    near(p.x + a, q.x + b);
    near(p.y, q.y);
  }
  for (const boundary of [0, 0.6, 1]) {
    const a = K.legCycle((boundary - 1e-8) * M.STRIDE),
      b = K.legCycle((boundary + 1e-8) * M.STRIDE);
    near(a.x, b.x, 1e-4);
    near(a.y, b.y, 1e-4);
  }
});
test("Rig sampling does not depend on render count or mutate presentation or game input", () => {
  const travel = { distance: 117, time: 3 },
    before = JSON.stringify({ body, travel }),
    reference = K.geometry(body, travel);
  for (const fps of [30, 60, 144]) {
    for (let i = 0; i < fps; i++)
      K.geometry(body, { distance: (117 * i) / fps, time: (3 * i) / fps });
    assert.deepEqual(K.geometry(body, travel), reference);
  }
  assert.equal(JSON.stringify({ body, travel }), before);
  assert.deepEqual(
    K.geometry(body, travel),
    reference,
    "Frozen active clock means identical pose",
  );
});
test("Capture and swallow use the same deformed anchors as the painted creature", () => {
  const state = {
      winner: 0,
      groups: [{ out: false }, { out: false }, { out: false }],
    },
    entry = C.defaultEntry(state),
    route = C.captureRoute(entry, 1, K.metrics());
  for (let t = 0; t < C.T.capture; t += 0.03) {
    const f = C.captureFrame(route, t),
      g = K.geometry(f.demon);
    near(g.hand.x, f.anchors.hand.x);
    near(g.hand.y, f.anchors.hand.y);
    near(g.mouth.x, f.anchors.mouth.x);
    if (f.gripped) {
      near(f.positions[1].x, g.hand.x);
      near(f.positions[1].ground - f.positions[1].height / 2, g.hand.y);
    }
    if (f.swallowing) near(f.positions[1].clip, g.mouth.x);
  }
});
test("Every cinematic blend and gait retains mesh orientation without folds", () => {
  const area = (a, b, c) =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  for (let frame = 0; frame < 16; frame++)
    for (let step = 0; step < 16; step++) {
      const pose = K.sample(
        {
          ...body,
          pose: C.mixPoses(C.pose(frame), C.pose((frame + 1) % 16), 0.5),
        },
        { distance: (step * M.STRIDE) / 16, time: step / 10 },
      );
      const v = K.vertices.map((q) =>
        q.weights.reduce(
          (p, w, i) => ({
            x: p.x + w * pose.targets[i].x,
            y: p.y + w * pose.targets[i].y,
          }),
          { x: 0, y: 0 },
        ),
      );
      for (const t of K.triangles)
        assert(
          area(...t.map((i) => K.vertices[i])) * area(...t.map((i) => v[i])) >
            0,
          `Mesh fold at pose ${frame}, gait ${step}`,
        );
    }
});
