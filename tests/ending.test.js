"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  E = require("../assets/hell-ending.js"), F = require("../assets/hell-epilogue.js");
const state = (winner = 0, out = [false, false, false]) => ({
  winner,
  respondent: 2,
  groups: out.map((flag) => ({ out: flag })),
});
test("Only survivor crosses the descending portal before collapse, reaction, flame and exhaustion", () => {
  const s = state(2, [true, true, false]),
    p = E.plan(s, [0, 1]);
  assert.deepEqual(p.victims, []);
  assert.equal(E.sample(p, 0).phase, "lineup");
  assert.equal(E.sample(p, p.chaseEnd + F.T.openEnd + .2).phase, "escape");
  assert.equal(E.sample(p, p.chaseEnd + F.T.sinkEnd + .2).phase, "rage");
  assert.equal(E.sample(p, p.chaseEnd + F.T.rageEnd + .4).phase, "fire");
  assert.equal(E.sample(p, p.chaseEnd + F.T.fireEnd + .4).phase, "exhausted");
  assert.equal(E.sample(p, p.duration).phase, "done");
});
test("Score victory removes remaining opponents before opening the portal", () => {
  const p = E.plan(state());
  assert.deepEqual(p.victims, [1, 2]);
  assert.equal(E.sample(p, p.lineupEnd).victim, 1);
  assert.equal(E.sample(p, p.lineupEnd + E.CAPTURE + 0.1).victim, 2);
  assert.equal(E.sample(p, p.captureEnd + 0.1).phase, "winner-chase");
  assert.equal(E.sample(p, p.reactionStart + 0.1).phase, "rage");
});
test("Game Over throws only the last vehicle into lava and then reacts without a portal", () => {
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

test("Canine capture orders approach, bite, windup, flight, lava and recovery", () => {
  assert.equal(E.captureAction(.8), "approach");
  assert.equal(E.captureAction(1.1), "bite");
  assert.equal(E.captureAction(1.5), "windup");
  assert.equal(E.captureAction(2.7), "flight");
  assert.equal(E.captureAction(3.8), "sink");
  assert.equal(E.captureAction(4.8), "recover");
});

test("Portal opens after impact and collapses only after the crossing", () => {
  assert(E.portalMotion(.5).offset < 0);
  assert.equal(E.portalMotion(F.T.riseEnd).offset, 0);
  assert.equal(E.portalMotion(F.T.riseEnd).opening, 0);
  assert.equal(E.portalMotion(F.T.openEnd).opening, 1);
  assert.equal(E.portalMotion(F.T.escapeEnd-.01).passed, false);
  assert.equal(E.portalMotion(F.T.escapeEnd).passed, true);
  assert(E.portalMotion(F.T.closeEnd+.5).collapse>0);assert.equal(E.portalMotion(F.T.closeEnd+.5).offset,0);
  assert.equal(E.portalMotion(F.T.sinkEnd).visible, false);
});
test("Rage retains its three reaction pulses with planted paws", () => {
  for(const t of [.46,1.46,2.46]){
    const hit=E.rageMotion(t);assert(hit.impact>.99);assert.equal(hit.lift,0);
  }
  assert.equal(E.rageMotion(.2).impact,0);
  assert.equal(E.rageMotion(.8).impact,0);
});
