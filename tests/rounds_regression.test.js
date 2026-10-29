"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const F = require("../assets/js/engine.js");

const bank = Array.from({length: 300}, (_, i) => ({
  id: "round-" + i, topic: "t", topicName: "Test",
  body: "Domanda " + i, options: ["A", "B", "C", "D"],
  correct: 0, explanation: "A",
  difficulty: ["facile", "media", "difficile"][i % 3],
}));
const base = {
  names: ["A", "B", "C"], seconds: 45,
  bases: {...F.DEFAULT_BASE_POINTS}, difficulty: "misto",
  bonusWeights: Object.fromEntries(F.TYPES.map(t => [t, 0])),
  selectedTopics: ["t"],
};
function match(rounds = 13) {
  const config = {...base, roundCount: rounds, questionCount: rounds * 3, quotas: {t: rounds * 3}};
  return F.Game.start(F.prepare(bank, config, () => .25), {random: () => .25});
}
function miss(g) {
  g.reveal();
  g.answer((g.s.current.correct + 1) % 4);
}

test("Thirteen rounds reserve 39 questions and finish after all three players' turns", () => {
  const g = match();
  assert.equal(g.s.config.roundCount, 13);
  assert.equal(g.s.config.turnCount, undefined);
  assert.equal(g.s.config.questionCount, 39);
  assert.equal(g.s.queue.length, 38);
  g.s.groups[0].score = F.rational(10000);
  for (let i = 1; i <= 39; i++) {
    miss(g);
    assert.equal(g.s.completedTurns, i);
    if (i < 39) {
      assert.equal(g.s.phase, "ordinaria", "Stopped at question " + i);
      g.next();
    }
  }
  assert.equal(g.s.phase, "conclusa");
  assert.equal(g.s.valid, 39);
  assert.equal(g.s.winner, 0);
});

test("Skipped turns count toward the 39 opportunities, without consuming a question", () => {
  const g = match();
  const [source, skipped] = g.s.order;
  g.s.groups[source].score = F.rational(10000);
  const copy = {id: g.uid(), type: "salta", target: null, origin: "test"};
  g.s.groups[source].inventory.push(copy);
  g.use(copy.id, skipped);
  miss(g);
  assert.equal(g.s.completedTurns, 1);
  g.next();
  assert.equal(g.s.completedTurns, 2);
  assert.equal(g.s.valid, 1);
  assert.equal(g.s.owner, g.s.order[2]);
  assert.equal(g.s.queue.length, 37);
  const restored = F.Game.restore(g.snapshot(), {random: () => .25});
  assert.equal(restored.s.config.roundCount, 13);
  assert.equal(restored.s.completedTurns, 2);
});

test("Previously saved total-turn matches retain their original 13-turn duration", () => {
  const config = {...base, turnCount: 13, questionCount: 13, quotas: {t: 13}};
  const g = F.Game.start(F.prepare(bank, config, () => .25), {random: () => .25});
  assert.equal(g.s.config.roundCount, undefined);
  assert.equal(g.s.queue.length, 12);
  const restored = F.Game.restore(g.snapshot(), {random: () => .25});
  restored.s.groups[0].score = F.rational(10000);
  for (let i = 1; i <= 13; i++) {
    miss(restored);
    if (i < 13) restored.next();
  }
  assert.equal(restored.s.phase, "conclusa");
  assert.equal(restored.s.completedTurns, 13);
});

test("Round config requires the full three-question-per-round reserve", () => {
  assert.throws(() => F.prepare(bank, {...base, roundCount: 13, questionCount: 13, quotas: {t: 13}}), /incoerenti/);
  assert.throws(() => F.prepare(bank, {...base, roundCount: 101, questionCount: 303, quotas: {t: 303}}), /Massimo 100 turni/);
});

test("An eliminated player's empty slot still advances the round", () => {
  const g = match(2);
  g.eliminate(g.s.order[2], "test");
  g.s.groups[g.s.order[0]].score = F.rational(10000);
  for (let i = 1; i <= 4; i++) {
    miss(g);
    if (i < 4) g.next();
  }
  assert.equal(g.s.phase, "conclusa");
  assert.equal(g.s.completedTurns, 6);
  assert.equal(g.s.valid, 4);
});
