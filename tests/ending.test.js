"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  E = require("../assets/hell-ending.js");
const state = (winner = 0, out = [false, false, false]) => ({
  winner,
  respondent: 2,
  groups: out.map((flag) => ({ out: flag })),
});
test("Only survivor gets a sudden portal, escapes, then demon roars alone", () => {
  const s = state(2, [true, true, false]),
    p = E.plan(s, [0, 1]);
  assert.deepEqual(p.victims, []);
  assert.equal(E.sample(p, 0).phase, "escape");
  assert.equal(E.sample(p, 2.9).phase, "roar");
  assert.equal(E.sample(p, p.duration).phase, "done");
});
test("Score victory removes remaining opponents before opening the portal", () => {
  const p = E.plan(state());
  assert.deepEqual(p.victims, [1, 2]);
  assert.equal(E.sample(p, 0).victim, 1);
  assert.equal(E.sample(p, E.CAPTURE + 0.1).victim, 2);
  assert.equal(E.sample(p, p.captureEnd + 0.1).phase, "escape");
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

test("Vehicle is swallowed and chewed before the upward fire breath", () => {
  assert.equal(E.captureAction(0.7), "grip");
  assert.equal(E.captureAction(1.4), "lift");
  assert.equal(E.captureAction(2.1), "swallow");
  assert.equal(E.captureAction(2.8), "chew");
  assert.equal(E.captureAction(4), "fire");
  assert.equal(E.captureAction(5.1), "recover");
});
