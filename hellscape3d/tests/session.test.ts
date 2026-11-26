import assert from "node:assert/strict";
import { test } from "node:test";
import { applyAction, SAVE_KEY, saveToStorage } from "../src/logic/index.ts";
import { DISCARDED_SAVE_KEY, decideStart, loadQuestionClock, memoryStorage, questionKey, saveQuestionClock } from "../src/session.ts";
import { QuestionTimer } from "../src/ui/timer.ts";
import { autoAction, newGame } from "./helpers.ts";

test("senza parametri si riprende la partita salvata, con lo stesso mondo e lo stesso stato", () => {
  const storage = memoryStorage();
  assert.deepEqual(decideStart(new URLSearchParams(""), storage, "base"), { kind: "new", seed: "base", notice: null });
  const { game } = newGame("ripresa-pagina");
  let state = game.state;
  for (let i = 0; i < 12; i++) state = applyAction(game.map, state, autoAction(game, state)).state;
  saveToStorage(storage, { map: game.map, state });
  const decision = decideStart(new URLSearchParams(""), storage, "base");
  assert.equal(decision.kind, "resume");
  if (decision.kind !== "resume") return;
  assert.deepEqual(decision.game.map, game.map);
  assert.deepEqual(decision.game.state, state);
});

test("seme, mosse iniziali o new=1 avviano una partita nuova anche se esiste un salvataggio", () => {
  const storage = memoryStorage();
  const { game } = newGame("salvata");
  saveToStorage(storage, game);
  for (const query of ["seed=altra", "steps=4", "new=1"]) {
    const decision = decideStart(new URLSearchParams(query), storage, "base");
    assert.equal(decision.kind, "new", query);
  }
  assert.deepEqual(decideStart(new URLSearchParams("seed=altra"), storage, "base"), { kind: "new", seed: "altra", notice: null });
});

test("un salvataggio incompatibile non si perde: conservato a parte, nuova partita con avviso", () => {
  const storage = memoryStorage();
  storage.setItem(SAVE_KEY, '{"format":"hellscape3d-save","saveVersion":99}');
  storage.setItem("fool-v1", "runner");
  const decision = decideStart(new URLSearchParams(""), storage, "base");
  assert.equal(decision.kind, "new");
  if (decision.kind !== "new") return;
  assert.match(decision.notice ?? "", /non utilizzabile/);
  assert.equal(storage.getItem(DISCARDED_SAVE_KEY), '{"format":"hellscape3d-save","saveVersion":99}');
  assert.equal(storage.getItem("fool-v1"), "runner", "salvataggi del runner non toccati");
});

test("tempo residuo della domanda: ripreso solo per la stessa domanda, mai oltre la durata", () => {
  const storage = memoryStorage();
  const key = questionKey("seme", 7, "p1");
  assert.equal(loadQuestionClock(storage, key), null);
  saveQuestionClock(storage, key, 12.5);
  assert.equal(loadQuestionClock(storage, key), 12.5);
  assert.equal(loadQuestionClock(storage, questionKey("seme", 8, "p1")), null, "domanda diversa");
  assert.equal(loadQuestionClock(storage, questionKey("altro", 7, "p1")), null, "partita diversa");
  storage.setItem("hellscape3d-domanda", "{");
  assert.equal(loadQuestionClock(storage, key), null, "valore illeggibile");
  assert.equal(new QuestionTimer(30, 12.5).remaining, 12.5);
  assert.equal(new QuestionTimer(30, 99).remaining, 30, "non si guadagna tempo");
  const expired = new QuestionTimer(30, 0);
  assert.equal(expired.tick(0.016, true), true, "una domanda già scaduta scade al primo fotogramma");
});
