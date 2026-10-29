"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const T = require("../assets/hell-throw.js"),
  B = require("../assets/hell-bridge.js"),
  M = require("../assets/hell-motion.js");
const near = (a, b, e = 1e-7) => assert(Math.abs(a - b) < e, `${a} != ${b}`);
const car = { index: 1, row: 1, x: 310, ground: 290, width: 72, height: 38 };
const camera = { distance: 90, speed: 48 },
  mouth = { x: 290, y: 230 };
const plan = () => T.plan(car, mouth, -0.2, camera, 1.83);
test("Vehicle releases from a canine mouth with fixed body dimensions", () => {
  const p = plan(),
    f = T.sample(p, 1.83, camera),
    a = T.attachment(mouth, car, -0.2);
  near(f.x, a.x);
  near(f.ground - car.height / 2, a.y);
  near(f.rotation, -0.2);
  for (let t = 1.83; t < 5.2; t += 0.01) {
    const v = T.sample(p, t, camera);
    assert.equal(v.width, car.width);
    assert.equal(v.height, car.height);
    assert.equal(v.opacity, undefined);
  }
});
test("Ballistic flight crosses the near parapet before hitting the lava plane", () => {
  const p = plan();
  let outside = false;
  for (let t = 0; t < T.FLIGHT; t += 0.01) {
    const v = T.sample(p, p.releaseTime + t, camera);
    assert(v.airborne && !v.clipWater);
    outside ||= v.world.depth > B.DEPTH + 8;
  }
  assert(outside);
  const v = T.sample(p, p.releaseTime + T.FLIGHT, camera);
  near(
    v.ground - car.height / 2 + T.extent(car.width, car.height, v.rotation),
    v.waterline,
  );
  assert(v.sinking && v.foreground && v.clipWater);
  near(v.impact.age, 0);
});
test("Submersion uses occlusion at the waterline; it never shrinks or respawns the car", () => {
  const p = plan(),
    start = T.sample(p, p.releaseTime + T.FLIGHT, camera),
    middle = T.sample(p, p.releaseTime + T.FLIGHT + T.SINK / 2, camera),
    end = T.sample(p, p.releaseTime + T.FLIGHT + T.SINK, camera);
  assert(start.ground < middle.ground && middle.ground < end.ground);
  assert.equal(end.visible, false);
  for (let t = 5; t < 20; t++)
    assert.equal(T.sample(p, t, camera).visible, false);
});
test("World flight and frozen snapshots are deterministic, without game state changes", () => {
  const p = plan(),
    before = JSON.stringify({ car, p }),
    sample = T.sample(p, 2.7, camera);
  assert.deepEqual(T.sample(p, 2.7, camera), sample);
  const moved = T.sample(p, 2.7, { ...camera, distance: camera.distance + 40 });
  near(sample.x - moved.x, 40);
  near(sample.ground, moved.ground);
  assert.equal(JSON.stringify({ car, p }), before);
});
test("Rigid suspension only adds small vertical displacement and pitch", () => {
  let changed = false;
  for (let d = 0; d < 1000; d += 0.25) {
    const r = M.suspension(d, 300, 72);
    assert(Math.abs(r.heave) <= 1.05);
    assert(Math.abs(r.pitch) < 0.03);
    changed ||= Math.abs(r.heave) > 0.5;
    assert.deepEqual(M.suspension(d, 300, 72), r);
  }
  assert(changed);
});
