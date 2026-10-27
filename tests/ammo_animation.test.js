"use strict";
const { test } = require("node:test"), assert = require("node:assert/strict");
const A = require("../assets/hell-ammo.js");
const state = () => ({ id: "game", groups: [{out:false},{out:false},{out:false}], events: [] });
const shot = (id, type, target = 1) => ({ id, activation:id, copy:{type}, source:0, target });
test("Opening or reloading a save consumes history without replay; redraws preserve the current shot", () => {
  const s = state(); s.events.push(shot("old", "salta"));
  const tracker = A.createTracker();
  tracker.sync(s); assert.equal(tracker.current(), null);
  s.events.push(shot("new", "ruba")); const original = JSON.stringify(s);
  tracker.sync(s); tracker.advance(.9, false);
  assert.equal(tracker.current().id, "new");
  const progress = tracker.sample(false); tracker.sync(s);
  assert.equal(tracker.sample(false), progress);
  tracker.advance(1, false); assert.equal(tracker.current(), null);
  tracker.sync(s); assert.equal(tracker.current(), null);
  const reload = A.createTracker(); reload.sync(s); assert.equal(reload.current(), null);
  assert.equal(JSON.stringify(s), original);
});
test("A blocked attack plays one shield reaction; Contrappasso follows a successful attack", () => {
  const blocked = A.plans([shot("a", "salta"), {id:"b",type:"aura-block",source:0,target:1,ammo:"salta"}], state());
  assert.equal(blocked.length, 1); assert.equal(blocked[0].blocked, true);
  const reflected = A.plans([shot("a", "ruba"), {id:"b",type:"karma-trigger",source:0,target:1,ammo:"ruba"}], state());
  assert.deepEqual(reflected.map(p=>p.type), ["ruba","karma"]);
  const passed = A.plans([{id:"p",type:"aura-block",source:0,target:2,ammo:"svela"}], state());
  assert.equal(passed[0].blocked, true); assert.deepEqual(passed[0].targets, [2]);
});
test("Flagello keeps all affected vehicles in the shot, including eliminated players", () => {
  const s = state(); s.groups.forEach(g=>g.out=true);
  const p = A.plans([shot("a","ira",null),{type:"divine-wrath",groups:[0,1,2]}],s)[0];
  assert.deepEqual(p.targets, [0,1,2]);
});
test("Reduced motion has a brief static pose; a new game clears any pending shot", () => {
  const s = state(), tracker = A.createTracker(); tracker.sync(s);
  s.events.push(shot("a","aura",null)); tracker.sync(s);
  assert.equal(tracker.sample(true), .65); tracker.advance(.44,true);
  assert.equal(tracker.current().type,"aura"); tracker.advance(.02,true);
  assert.equal(tracker.current(),null);
  s.events.push(shot("b","ira",null)); tracker.sync(s);
  tracker.sync({...s,id:"other"}); assert.equal(tracker.current(),null);
});
