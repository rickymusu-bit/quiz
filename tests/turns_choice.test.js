"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const F = require("../assets/js/engine.js"),
  K = require("../assets/hell-cerbero.js"),
  M = require("../assets/hell-motion.js");
const bank = Array.from({ length: 300 }, (_, i) => ({
  id: "t" + i,
  topic: "t",
  topicName: "T",
  body: "Q" + i,
  options: ["A", "B", "C", "D"],
  correct: 0,
  explanation: "A",
  difficulty: ["facile", "media", "difficile"][i % 3],
}));
function setup(turns = 13, seconds = 45) {
  let now = 0;
  const config = {
    names: ["A", "B", "C"],
    turnCount: turns,
    seconds,
    bases: { ...F.DEFAULT_BASE_POINTS },
    bonusWeights: Object.fromEntries(F.TYPES.map((t) => [t, 0])),
    difficulty: "misto",
    quotas: { t: turns },
  };
  const g = F.Game.start(
    F.prepare(bank, config, () => 0.25),
    { random: () => 0.25, now: () => now },
  );
  return {
    g,
    advance(ms) {
      now += ms;
      g.tick();
    },
    now: () => now,
  };
}
function item(g, type) {
  const c = { id: g.uid(), type, target: null, origin: "test" };
  g.s.groups[g.s.owner].inventory.push(c);
  return c;
}
function reply(g, correct = true) {
  g.reveal();
  g.answer(correct ? g.s.current.correct : (g.s.current.correct + 1) % 4);
}

test("New durations accept any whole number of turns; default is 13 and old explicit question durations survive", () => {
  for (const turns of [1, 4, 13, 99, 100]) {
    const { g } = setup(turns);
    assert.equal(g.s.config.turnCount, turns);
    assert.equal(g.s.queue.length, turns - 1);
  }
  for (const turns of [0, 1.5, 101]) assert.throws(() => setup(turns));
  const { g } = setup();
  const cfg = { ...g.s.config };
  delete cfg.turnCount;
  cfg.questionCount = 33;
  cfg.quotas = { t: 33 };
  const old = F.Game.start(F.prepare(bank, cfg, () => 0.25));
  const raw = old.snapshot();
  raw.version = "2.9.0";
  raw.rules = "26.0.0";
  delete raw.completedTurns;
  delete raw.turnClosed;
  const loaded = F.Game.restore(raw);
  assert.equal(loaded.s.config.turnCount, undefined);
  assert.equal(loaded.s.config.questionCount, 33);
  assert.equal(loaded.s.valid, 0);
});
test("Exactly 13 total turns end the ordinary game; answering and moving next cannot count twice", () => {
  let { g } = setup();
  g.s.groups[g.s.owner].score = F.rational(10000);
  for (let n = 1; n <= 13; n++) {
    reply(g, false);
    assert.equal(g.s.completedTurns, n);
    if (n < 13) {
      assert.equal(g.s.phase, "ordinaria");
      g = F.Game.restore(g.snapshot(), { random: () => 0.25 });
      g.next();
      assert.equal(g.s.completedTurns, n);
    }
  }
  assert.equal(g.s.phase, "conclusa");
  assert.equal(g.s.valid, 13);
  assert.equal(g.s.completedTurns, 13);
});
test("Turn capacity includes all three difficulties and selected topics; legacy filters still restore", () => {
  const large = Array.from({length:150}, (_,i) => ({
    ...bank[i % bank.length], id:"capacity"+i, topic:i%2 ? "b":"a",
    difficulty:["facile","media","difficile"][i%3],
  }));
  assert.deepEqual(F.topicCounts(large), {a:75,b:75});
  assert.deepEqual(F.topicCounts(large,"facile"), {a:25,b:25});
  assert.equal(F.turnCapacity(large, ["a","b"], 3), 50);
  assert.equal(F.turnCapacity(large, ["a"], 3), 25);
  assert.equal(F.turnCapacity(large, ["a"], 3, "facile"), 8); // Legacy saves only.
  const config = {...setup().g.s.config, turnCount:50, questionCount:50, quotas:{a:25,b:25}};
  const g = F.Game.start(F.prepare(large,config,()=>.25));
  assert.equal(g.s.queue.length,49);
  assert.equal(F.Game.restore(g.snapshot()).s.config.turnCount,50);
  assert.throws(()=>F.prepare(large,{...config,turnCount:26,questionCount:26,quotas:{a:26,b:0}}),/Massimo 25 turni: 75 domande/);
  assert.throws(()=>F.prepare(large,{...config,difficulty:"facile",turnCount:17,questionCount:17,quotas:{a:9,b:8}}),/Massimo 16 turni: 50 domande/);
  assert.throws(()=>F.prepare(large,{...config,turnCount:100,questionCount:100,quotas:{a:80,b:20}}),/Massimo 50 turni/);
});
test("A bank must include easy, medium and hard questions", () => {
  const questions = ["facile", "media", "difficile"].map((difficulty, i) => ({
    id: "d" + i, difficolta: difficulty, testo: "Domanda " + i,
    alternative: ["A","B","C","D"], corretta: "A", spiegazione: "Risposta A",
  }));
  const dataset = {versione:1, argomenti:[{id:"arg", nome:"Argomento", domande:questions}]};
  assert.equal(F.parseDataset(JSON.stringify(dataset)).bank.length,3);
  dataset.argomenti[0].domande = questions.slice(0,2);
  assert.throws(() => F.parseDataset(JSON.stringify(dataset)), /banca deve includere domande facili, medie e difficili/);
});
test("Forfeited turns end at the configured limit even with no valid answers", () => {
  for (const type of ["ruba", "arsenico"]) {
    const { g } = setup(1);
    g.s.groups[g.s.owner].score = F.rational(10000);
    g.use(item(g, type).id, g.s.order[1]);
    assert.equal(g.s.phase, "conclusa");
    assert.equal(g.s.valid, 0);
    assert.equal(g.s.completedTurns, 1);
    F.Game.restore(g.snapshot());
  }
});
test("A final forfeit with tied leaders opens the Ultimo Miglio and starts a hard question", () => {
  const { g } = setup(1);
  g.use(item(g, "arsenico").id, g.s.order[1]);
  assert.equal(g.s.phase, "pareggio");
  assert.equal(g.s.completedTurns, 1);
  assert.equal(g.s.current.difficulty, "difficile");
  assert.equal(g.s.owner, g.s.tieOrder[0]);
  F.Game.restore(g.snapshot());
});
test("Catene consumes the skipped total turn, without asking another question past the limit", () => {
  const { g } = setup(2);
  const [source, target] = g.s.order;
  g.s.groups[source].score = F.rational(10000);
  g.use(item(g, "salta").id, target);
  reply(g);
  g.next();
  assert.equal(g.s.phase, "conclusa");
  assert.equal(g.s.completedTurns, 2);
  assert.equal(g.s.valid, 1);
  assert.equal(g.s.winner, source);
  F.Game.restore(g.snapshot());
});
test("The final skipped turn can open a score tie, and Malocchio itself never advances the count", () => {
  const { g } = setup(2);
  const [source, target] = g.s.order;
  g.use(item(g, "salta").id, target);
  reply(g, false);
  g.next();
  assert.equal(g.s.phase, "pareggio");
  assert.equal(g.s.current.difficulty, "difficile");
  assert.equal(g.s.completedTurns, 2);
  F.Game.restore(g.snapshot());
  const { g: h } = setup(2);
  h.use(item(h, "svela").id, null);
  h.pass(h.s.order[2]);
  assert.equal(h.s.completedTurns, 0);
  h.answer(h.s.current.correct);
  assert.equal(h.s.completedTurns, 1);
  h.next();
  assert.equal(h.s.completedTurns, 1);
  assert.equal(h.s.owner, h.s.order[1]);
});
test("Eliminating the current player consumes one turn; eliminating another player does not", () => {
  const { g } = setup(3);
  const target = g.s.order[2];
  g.openSanctions();
  g.s.panel.counts[target] = 3;
  g.closeSanctions(true);
  assert.equal(g.s.completedTurns, 0);
  const { g: h } = setup(3);
  const owner = h.s.owner;
  h.openSanctions();
  h.s.panel.counts[owner] = 3;
  h.closeSanctions(true);
  assert.equal(h.s.completedTurns, 1);
  assert.notEqual(h.s.owner, owner);
  F.Game.restore(h.snapshot());
});
test("Malocchio gives 45 choice seconds independently of answer time, then automatically keeps and starts the full answer timer once", () => {
  for (const seconds of [3, 90]) {
    const { g, advance } = setup(13, seconds);
    const source = g.s.owner;
    g.use(item(g, "svela").id, null);
    assert.equal(g.timeLimit(), 45000);
    advance(44999);
    assert.equal(g.s.screen, "choice");
    advance(1);
    assert.equal(g.s.screen, "answer");
    assert.equal(g.s.respondent, source);
    assert.equal(g.left(), seconds * 1000);
    assert.equal(g.s.completedTurns, 0);
    assert.equal(
      g.s.events.filter((e) => e.type === "malocchio-choice-expired").length,
      1,
    );
    advance(seconds * 1000);
    assert.equal(g.s.result.option, null);
    assert.equal(g.s.completedTurns, 1);
    advance(100000);
    assert.equal(g.s.completedTurns, 1);
  }
});
test("Choice pause, save/restore and delayed callbacks never reset or bypass its deadline", () => {
  const { g, advance, now } = setup(13, 90);
  g.use(item(g, "svela").id, null);
  advance(10000);
  g.pause("manuale");
  advance(60000);
  assert.equal(g.left(), 35000);
  let h = F.Game.restore(g.snapshot(), { now });
  assert.equal(h.left(), 35000);
  assert.equal(h.s.paused, true);
  assert.throws(() => h.pass(h.s.order[1]));
  h.resume();
  h.now = () => now() + 35000;
  h.pass(h.s.order[1]);
  assert.equal(h.s.respondent, h.s.owner);
  assert.equal(h.left(), 90000);
  assert.equal(h.s.completedTurns, 0);
});
test("Periodic three-mouth breaths use active time, keep the drawn walking gait and preserve the game model", () => {
  for (const at of [0, 8, 59.99, 61.81, 119.99, 121.81])
    assert.equal(K.periodicFire(at).active, false);
  for (const at of [60, 60.8, 120, 120.8, 180])
    assert.equal(K.periodicFire(at).active, true);
  const { g } = setup();
  const before = g.snapshot();
  const poses = [];
  for (let i = 0; i < 8; i++) {
    const time = 60.1 + i * 0.08,
      breath = K.periodicFire(time),
      travel = { time, distance: time * M.ROAD_SPEED };
    poses.push(
      K.sample(
        {
          ...M.CHASE,
          animation: "fire",
          movingFire: true,
          actionTime: breath.age,
        },
        travel,
      ).index,
    );
    assert.deepEqual(K.periodicFire(time), K.periodicFire(time));
  }
  assert(
    new Set(poses).size > 3,
    "Leg drawings keep advancing while breathing fire",
  );
  assert.deepEqual(g.snapshot(), before);
});

test("Opening a pause exactly at the choice deadline keeps the question and pauses the new full answer timer", () => {
  const { g, now } = setup(13, 90);
  g.use(item(g, "svela").id, null);
  g.now = () => now() + 45000;
  g.pause("opzioni");
  assert.equal(g.s.screen, "answer");
  assert.equal(g.s.respondent, g.s.owner);
  assert.equal(g.s.paused, true);
  assert.equal(g.running, false);
  assert.equal(g.left(), 90000);
  assert.equal(g.s.completedTurns, 0);
});

test("Arsenico ticks at the start of the last skipped turn before deciding the winner", () => {
  const { g } = setup(2);
  const [source, target, third] = g.s.order;
  g.s.config.bases = { facile: 111, media: 111, difficile: 111 };
  g.s.groups[source].score = F.rational(200);
  g.s.groups[target].score = F.rational(300);
  g.s.effects.push({
    id: g.uid(),
    type: "arsenico",
    source: third,
    target,
    remaining: 1,
    lastLoss: F.rational(0),
  });
  g.use(item(g, "salta").id, target);
  reply(g);
  g.next();
  assert.equal(g.s.completedTurns, 2);
  assert.equal(g.s.valid, 1);
  assert.equal(F.exact(g.s.groups[target].score), "267");
  assert.equal(g.s.winner, source);
  F.Game.restore(g.snapshot());
});
test("New save validation rejects inconsistent turn counters rather than silently adding turns", () => {
  const { g } = setup();
  for (const change of [
    (s) => (s.completedTurns = 13),
    (s) => (s.turnClosed = true),
    (s) => (s.valid = 1),
  ]) {
    const s = g.snapshot();
    change(s);
    assert.throws(() => F.Game.restore(s), /turni|turno/i);
  }
});
