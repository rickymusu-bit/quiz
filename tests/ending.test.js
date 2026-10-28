"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  E = require("../assets/hell-ending.js");
const state = (winner = 0, out = [false, false, false]) => ({
  winner,
  respondent: 2,
  groups: out.map((flag) => ({ out: flag })),
});
test("Only survivor uses a rising portal before roar, fire and ground-pounding rage", () => {
  const s = state(2, [true, true, false]),
    p = E.plan(s, [0, 1]);
  assert.deepEqual(p.victims, []);
  assert.equal(E.sample(p, 0).phase, "lineup");
  assert.equal(E.sample(p, p.chaseEnd + 0.8).phase, "escape");
  assert.equal(E.sample(p, p.chaseEnd + 2.4).phase, "roar");
  assert.equal(E.sample(p, p.chaseEnd + 3.4).phase, "fire");
  assert.equal(E.sample(p, p.chaseEnd + 5.1).phase, "rage");
  assert.equal(E.sample(p, p.duration).phase, "done");
});
test("Score victory removes remaining opponents before opening the portal", () => {
  const p = E.plan(state());
  assert.deepEqual(p.victims, [1, 2]);
  assert.equal(E.sample(p, p.lineupEnd).victim, 1);
  assert.equal(E.sample(p, p.lineupEnd + E.CAPTURE + 0.1).victim, 2);
  assert.equal(E.sample(p, p.captureEnd + 0.1).phase, "winner-chase");
  assert.equal(E.sample(p, p.reactionStart + 0.1).phase, "roar");
});
test("Game Over eats only the last player and then dances without a portal", () => {
  const p = E.plan(state(null, [true, true, true]), [0, 1], [2]);
  assert.deepEqual(p.victims, [2]);
  assert.equal(E.sample(p, 2).phase, "capture");
  assert.equal(E.sample(p, p.captureEnd + 0.01).phase, "dance");
  assert.equal(E.sample(p, p.duration).phase, "done");
});
test("Previously consumed players never reappear or get eaten twice", () => {
  const p = E.plan(state(null, [true, true, true]), [0, 1, 2], []);
  assert.deepEqual(p.victims, []);
  assert.equal(E.sample(p, 0).phase, "dance");
  const q = E.plan(state(0), [1], [1, 2, 2]);
  assert.deepEqual(q.victims, [2]);
});
test("Planning and animation sampling preserve the authoritative state", () => {
  const s = state(null, [true, true, true]),
    before = JSON.stringify(s),
    p = E.plan(s, [0, 1], [2]);
  for (let t = 0; t < 20; t += 0.05) E.sample(p, t);
  assert.equal(JSON.stringify(s), before);
  assert.equal(E.sample(p, 0).phase, E.sample(p, 0).phase);
});

test("Vehicle stays gripped through the lift, disappears inside the mouth and recovers", () => {
  assert.equal(E.captureAction(1), "grip");
  assert.equal(E.captureAction(1.4), "lift");
  assert.equal(E.captureAction(2.7), "swallow");
  assert.equal(E.captureAction(3.3), "chew");
  assert.equal(E.captureAction(4), "recover");
  assert.equal(E.captureAction(5.1), "recover");
});

test("Portal admits the winner before sinking and is gone before rage", () => {
  assert(E.portalMotion(0.25).offset > 0);
  assert.equal(E.portalMotion(1).offset, 0);
  assert.equal(E.portalMotion(2.1).passed, false);
  assert(E.portalMotion(3.2).passed);
  assert(E.portalMotion(3.2).visible);
  assert(E.portalMotion(3.2).offset > 0);
  assert.equal(E.portalMotion(4.8).visible, false);
  assert.equal(E.portalMotion(4.8).offset, 190);
});
test("Rage alternates airborne jumps with two grounded fist impacts", () => {
  const jump = E.rageMotion(0.32),
    hit1 = E.rageMotion(0.57),
    hit2 = E.rageMotion(0.84);
  assert(jump.lift > 20);
  assert.equal(jump.impact, 0);
  assert(hit1.impact > 0.9 && hit2.impact > 0.9);
  assert(hit1.lift < 0 && hit2.lift < 0);
  assert.equal(E.rageMotion(1.1).impact, 0);
});
