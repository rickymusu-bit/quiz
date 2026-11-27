import assert from "node:assert/strict";
import { test } from "node:test";
import { applyAction, SAVE_KEY, saveToStorage } from "../src/logic/index.ts";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseBank, parseCatalog } from "../src/questions/bank.ts";
import {
  DISCARDED_SAVE_KEY,
  decideStart,
  loadLastSettings,
  loadQuestionClock,
  memoryStorage,
  missingDifficulties,
  questionKey,
  saveLastSettings,
  saveQuestionClock,
  SETTINGS_KEY,
  settingsIssues,
  type GameSettings,
} from "../src/session.ts";
import { QuestionTimer } from "../src/ui/timer.ts";
import { autoAction, newGame } from "./helpers.ts";

test("senza parametri si riprende la partita salvata; senza salvataggio si apre la schermata di avvio", () => {
  const storage = memoryStorage();
  assert.deepEqual(decideStart(new URLSearchParams(""), storage, "base"), { kind: "setup", notice: null, saved: false });
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

test("seme o mosse iniziali (sviluppo) avviano subito una partita nuova; new=1 apre la schermata di avvio", () => {
  const storage = memoryStorage();
  const { game } = newGame("salvata");
  saveToStorage(storage, game);
  for (const query of ["seed=altra", "steps=4", "seed=altra&new=1"]) {
    const decision = decideStart(new URLSearchParams(query), storage, "base");
    assert.equal(decision.kind, "new", query);
  }
  assert.deepEqual(decideStart(new URLSearchParams("seed=altra"), storage, "base"), { kind: "new", seed: "altra", notice: null });
  assert.deepEqual(decideStart(new URLSearchParams("new=1"), storage, "base"), { kind: "setup", notice: null, saved: true });
  assert.deepEqual(decideStart(new URLSearchParams("new=1"), memoryStorage(), "base"), { kind: "setup", notice: null, saved: false });
});

test("un salvataggio incompatibile non si perde: conservato a parte, schermata di avvio con avviso", () => {
  const storage = memoryStorage();
  storage.setItem(SAVE_KEY, '{"format":"hellscape3d-save","saveVersion":99}');
  storage.setItem("fool-v1", "runner");
  const decision = decideStart(new URLSearchParams(""), storage, "base");
  assert.equal(decision.kind, "setup");
  if (decision.kind !== "setup") return;
  assert.equal(decision.saved, false);
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

const site = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const catalog = parseCatalog(readFileSync(resolve(site, "datasets.json"), "utf8"));
const bank = parseBank(catalog[0]!.id, readFileSync(resolve(site, catalog[0]!.url), "utf8"));

test("impostazioni della schermata di avvio: giocatori, nomi, durata e copertura dei livelli", () => {
  const ok: GameSettings = { bankId: bank.id, topics: [], players: ["Ada", "Bruno"], seconds: 30 };
  assert.deepEqual(settingsIssues(ok, bank), []);
  assert.deepEqual(missingDifficulties(bank, []), []);
  const cases: [Partial<GameSettings>, RegExp][] = [
    [{ players: [] }, /da 1 a 6 giocatori/],
    [{ players: ["1", "2", "3", "4", "5", "6", "7"] }, /da 1 a 6 giocatori/],
    [{ players: ["Ada", "  "] }, /nomi/],
    [{ players: ["x".repeat(25)] }, /nomi/],
    [{ seconds: 5 }, /durata/],
    [{ seconds: 301 }, /durata/],
    [{ seconds: 20.5 }, /durata/],
    [{ bankId: "altra" }, /banca diversa/],
  ];
  for (const [change, message] of cases) assert.match(settingsIssues({ ...ok, ...change }, bank).join("; "), message, JSON.stringify(change));
  // Argomento a cui manca un livello: segnalato, e la partita non può cominciare.
  const topics = [...new Set(bank.questions.map((q) => q.topic))];
  const lacking = topics.find((t) => missingDifficulties(bank, [t]).length > 0);
  if (lacking) assert.match(settingsIssues({ ...ok, topics: [lacking] }, bank).join(), /mancano domande/);
  const full = topics.find((t) => missingDifficulties(bank, [t]).length === 0);
  if (full) assert.deepEqual(settingsIssues({ ...ok, topics: [full] }, bank), []);
  assert.ok(lacking || full, "banca senza argomenti");
});

test("ultime impostazioni: ricordate per la schermata successiva, ignorate se illeggibili", () => {
  const storage = memoryStorage();
  assert.equal(loadLastSettings(storage), null);
  const settings: GameSettings = { bankId: bank.id, topics: ["a"], players: ["Ada", "Bruno", "Cleo"], seconds: 20 };
  saveLastSettings(storage, settings);
  assert.deepEqual(loadLastSettings(storage), settings);
  for (const bad of ["{", "null", '{"bankId":1}', JSON.stringify({ ...settings, players: "Ada" })]) {
    storage.setItem(SETTINGS_KEY, bad);
    assert.equal(loadLastSettings(storage), null, bad);
  }
});
