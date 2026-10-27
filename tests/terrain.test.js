"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  T = require("../assets/hell-terrain.js");
test("Terrain follows completed questions, not points or early victory", () => {
  for (const count of [3, 33, 99]) {
    const s = {
      valid: count / 3,
      phase: "ordinaria",
      config: { questionCount: count },
      groups: [{ score: { n: "999999", d: "1" } }],
    };
    assert.equal(T.progress(s), 1 / 3);
    s.phase = "conclusa";
    assert.equal(T.progress(s), 1 / 3);
    s.groups[0].score.n = "0";
    assert.equal(T.progress(s), 1 / 3);
    s.valid = count;
    assert.equal(T.progress(s), 1);
    s.phase = "pareggio";
    assert.equal(T.progress(s), 1);
  }
});
test("Legacy defaults and bounds are stable without mutating saved state", () => {
  const s = { valid: 11, config: {}, phase: "ordinaria" },
    before = JSON.stringify(s);
  assert.equal(T.progress(s), 1 / 3);
  assert.equal(JSON.stringify(s), before);
  assert.equal(T.progress({ valid: 100, config: { questionCount: 33 } }), 1);
  assert.equal(T.progress({ valid: -10, config: { questionCount: 33 } }), 0);
});
