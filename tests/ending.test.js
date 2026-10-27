"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  E = require("../assets/hell-ending.js");
const state = (winner = 0, out = [false, false, false]) => ({
  winner,
  respondent: 2,
  groups: out.map((flag) => ({ out: flag })),
});
test("Only survivor accelerates, enters the raised portal, then wins", () => {
 const p=E.plan(state(2,[true,true,false]),[0,1]);
 assert.deepEqual(p.victims,[]);
 assert.equal(E.sample(p,0).phase,"breakout");
 assert.equal(E.sample(p,p.captureEnd+.01).phase,"rise");
 assert.equal(E.sample(p,p.entryStart+.01).phase,"escape");
 assert.equal(E.sample(p,p.escapeEnd+.01).phase,"arrival");
 assert.equal(E.sample(p,p.duration).phase,"done");
});
test("Score victory leaves opponents behind and consumes both before entry", () => {
 const p=E.plan(state());assert.deepEqual(p.victims,[1,2]);
 assert.equal(E.sample(p,p.captureStart+.1).victim,1);
 assert.equal(E.sample(p,p.captureStart+p.captureEach+.1).victim,2);
 assert(p.captureEnd<=p.entryStart);
 assert(p.portalStart+1.4<p.entryStart);
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

test("Monumental portal rises from below and remains open", () => {
 assert(E.portalMotion(.25).offset>0);
 assert.equal(E.portalMotion(1.4).offset,0);
 assert.equal(E.portalMotion(10).visible,true);
 const g=E.portalGeometry(512);assert(g.height>300);assert(g.width>130);
});
test("Winner accelerates and disappears completely before victory", () => {
 const p=E.plan(state());
 assert(E.worldTravel(p,1)-E.worldTravel(p,.5)>E.worldTravel(p,.5));
 assert(E.winnerMotion(p,1,512).x>E.winnerMotion(p,.5,512).x);
 assert.equal(E.winnerMotion(p,p.escapeEnd,512).visible,false);
 assert.equal(E.winnerMotion(p,p.escapeEnd,512).passed,true);
 assert.equal(E.worldTravel(p,p.duration+10),E.worldTravel(p,p.duration));
});
