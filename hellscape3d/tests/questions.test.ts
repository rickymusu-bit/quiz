import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { applyAction, rngFromSeed } from "../src/logic/index.ts";
import { BankError, DIFFICULTIES, parseBank, parseCatalog, type QuestionBank } from "../src/questions/bank.ts";
import { ask, inPlay, loadLog, newLog, outcomeOf, present, QUESTION_LOG_KEY, recordAnswer, saveLog, type QuestionLog } from "../src/questions/deck.ts";
import { memoryStorage, questionKey } from "../src/session.ts";
import { parseQuestionKey, summarize } from "../src/questions/summary.ts";
import { autoAction, newGame } from "./helpers.ts";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const catalog = parseCatalog(readFileSync(resolve(site, "datasets.json"), "utf8"));
const source = (url: string): string => readFileSync(resolve(site, url), "utf8");
const banks: QuestionBank[] = catalog.map((entry) => parseBank(entry.id, source(entry.url)));

test("banche della versione precedente: catalogo e contenuti letti come dal vecchio lettore", () => {
  assert.ok(catalog.length >= 2);
  // Lettore della versione precedente, caricato com'è (CommonJS) dal runtime pubblicato.
  const legacy = createRequire(import.meta.url)("../../assets/js/datasets.js") as {
    parseDataset(text: string, katex: unknown, options: { requireAllDifficulties: boolean }): { title: string; bank: Record<string, unknown>[] };
  };
  for (const [i, entry] of catalog.entries()) {
    const old = legacy.parseDataset(source(entry.url), undefined, { requireAllDifficulties: true });
    const bank = banks[i]!;
    assert.equal(bank.title, old.title);
    assert.deepEqual(
      bank.questions.map((q) => ({ id: q.id, topic: q.topic, topicName: q.topicName, difficulty: q.difficulty, body: q.text, options: q.options, correct: q.correctIndex, explanation: q.explanation, type: q.type })),
      old.bank,
      `${entry.id}: lettura diversa dalla versione precedente`,
    );
    for (const difficulty of DIFFICULTIES) assert.ok(bank.questions.filter((q) => q.difficulty === difficulty).length >= 20, `${entry.id}: poche domande ${difficulty}`);
  }
});

test("banche non valide rifiutate con un messaggio", () => {
  const base = JSON.parse(source(catalog[0]!.url)) as { argomenti: { domande: Record<string, unknown>[] }[] };
  const broken = (change: (data: typeof base) => void): string => {
    const copy = structuredClone(base);
    change(copy);
    return JSON.stringify(copy);
  };
  const cases: [string, string, RegExp][] = [
    ["JSON", "{", /JSON non valido/],
    ["tre alternative", broken((d) => (d.argomenti[0]!.domande[0]!.alternative as string[]).pop()), /quattro alternative/],
    ["alternative duplicate", broken((d) => ((d.argomenti[0]!.domande[0]!.alternative as string[])[1] = (d.argomenti[0]!.domande[0]!.alternative as string[])[0]!)), /duplicate/],
    ["lettera", broken((d) => (d.argomenti[0]!.domande[0]!.corretta = "E")), /A–D/],
    ["difficoltà", broken((d) => (d.argomenti[0]!.domande[0]!.difficolta = "impossibile")), /difficoltà non valida/],
    ["ID ripetuto", broken((d) => (d.argomenti[0]!.domande[1]!.id = d.argomenti[0]!.domande[0]!.id)), /ripetuto/],
    ["livello mancante", broken((d) => d.argomenti.forEach((t) => t.domande.forEach((q) => q.difficolta === "difficile" && (q.difficolta = "media")))), /facili, medie e difficili/],
    ["formula LaTeX", broken((d) => (d.argomenti[0]!.domande[0]!.testo = "Quanto vale \\(x^2\\)?")), /LaTeX/],
  ];
  for (const [label, text, message] of cases) assert.throws(() => parseBank("prova", text), (e: unknown) => e instanceof BankError && message.test(e.message), label);
  assert.throws(() => parseCatalog(JSON.stringify({ versione: 1, banche: [{ id: "x", nome: "X", url: "../segreti.json" }] })), BankError);
  assert.throws(() => parseCatalog(JSON.stringify({ versione: 1, banche: [{ id: "x", nome: "X", url: "https://altro.example/b.json" }] })), BankError);
});

test("domanda assegnata: stabile, alternative rimescolate con la corretta al posto giusto", () => {
  const bank = banks[0]!;
  let log = newLog("seme", bank.id);
  const first = ask(log, bank, "k1", "media");
  log = first.log;
  assert.equal(ask(log, bank, "k1", "media").log, log, "la stessa chiave non assegna una nuova domanda");
  assert.deepEqual(ask(newLog("seme", bank.id), bank, "k1", "media").asked, first.asked, "assegnazione deterministica");
  const q = present(bank, first.asked);
  const original = bank.questions.find((b) => b.id === q.id)!;
  assert.equal(q.difficulty, "media");
  assert.deepEqual([...q.options].sort(), [...original.options].sort());
  assert.equal(q.options[q.correctIndex], original.options[original.correctIndex]);
  // Su molte domande l'alternativa corretta occupa tutte le posizioni.
  const positions = new Set<number>();
  for (let i = 0; i < 40; i++) {
    const r = ask(log, bank, `p${i}`, "facile");
    log = r.log;
    positions.add(present(bank, r.asked).correctIndex);
  }
  assert.equal(positions.size, 4);
});

test("nessuna ripetizione finché restano domande del livello; poi la meno recente", () => {
  for (const bank of banks) {
    for (const difficulty of DIFFICULTIES) {
      const pool = bank.questions.filter((q) => q.difficulty === difficulty).length;
      let log = newLog("ripetizioni", bank.id);
      const seen: string[] = [];
      for (let i = 0; i < pool + 5; i++) {
        const r = ask(log, bank, `k${i}`, difficulty);
        log = r.log;
        seen.push(r.asked.questionId);
      }
      assert.equal(new Set(seen.slice(0, pool)).size, pool, `${bank.id}/${difficulty}: ripetizione prima dell'esaurimento`);
      assert.deepEqual(seen.slice(pool), seen.slice(0, 5), `${bank.id}/${difficulty}: dopo l'esaurimento non torna la meno recente`);
    }
  }
});

test("risposta registrata una sola volta; esito dall'ordine mostrato", () => {
  const bank = banks[1]!;
  const { log, asked } = ask(newLog("esiti", bank.id), bank, "k", "difficile");
  const q = present(bank, asked);
  const wrong = (q.correctIndex + 1) % 4;
  const answered = recordAnswer(log, "k", wrong);
  assert.equal(outcomeOf(present(bank, answered.asked[0]!)), "wrong");
  assert.deepEqual(recordAnswer(answered, "k", q.correctIndex), answered, "una domanda già risposta non cambia");
  assert.equal(outcomeOf(present(bank, recordAnswer(log, "k", q.correctIndex).asked[0]!)), "correct");
  assert.equal(outcomeOf(present(bank, recordAnswer(log, "k", "timeout").asked[0]!)), "timeout");
  assert.equal(log.asked[0]!.answer, null, "il registro precedente resta immutato");
});

test("registro salvato: riletto solo per la stessa partita e se coerente con la banca", () => {
  const bank = banks[0]!;
  const storage = memoryStorage();
  let log: QuestionLog = newLog("salvata", bank.id);
  for (let i = 0; i < 5; i++) log = ask(log, bank, `k${i}`, "facile").log;
  log = recordAnswer(log, "k2", 1);
  saveLog(storage, log);
  assert.deepEqual(loadLog(storage, "salvata", bank), log);
  assert.equal(loadLog(storage, "altra-citta", bank), null);
  const other: QuestionBank = { ...bank, questions: bank.questions.slice(0, 3) };
  assert.equal(loadLog(storage, "salvata", other), null, "domande assenti dalla banca");
  // Formato precedente (senza argomenti né durata), versione futura, argomenti estranei alla banca, durata non valida.
  const { topics: _t, seconds: _s, ...v1 } = log;
  for (const bad of ["{", "null", JSON.stringify({ ...v1, version: 1 }), JSON.stringify({ ...log, version: 3 }), JSON.stringify({ ...log, topics: ["inesistente"] }), JSON.stringify({ ...log, seconds: 0 }), JSON.stringify({ ...log, asked: [{ ...log.asked[0], order: [0, 0, 1, 2] }] }), JSON.stringify({ ...log, asked: [{ ...log.asked[0], answer: 7 }] })]) {
    storage.setItem(QUESTION_LOG_KEY, bad);
    assert.equal(loadLog(storage, "salvata", bank), null, bad.slice(0, 40));
  }
});

test("argomenti scelti: domande solo da quelli, con ripiego sull'intera banca se manca un livello", () => {
  const bank = banks[0]!;
  const topics = [...new Set(bank.questions.map((q) => q.topic))].slice(0, 2);
  let log = newLog("argomenti", bank.id, { topics, seconds: 20 });
  assert.equal(log.seconds, 20);
  for (const difficulty of DIFFICULTIES) {
    for (let i = 0; i < 6; i++) {
      const r = ask(log, bank, `${difficulty}${i}`, difficulty);
      log = r.log;
      const q = bank.questions.find((b) => b.id === r.asked.questionId)!;
      const available = inPlay(bank, topics).some((b) => b.difficulty === difficulty);
      assert.ok(!available || topics.includes(q.topic), `${difficulty}: domanda fuori dagli argomenti scelti`);
    }
  }
  // Un argomento senza domande difficili: la scelta ricade sull'intera banca invece di fermarsi.
  const single = bank.questions.find((q) => !bank.questions.some((b) => b.topic === q.topic && b.difficulty === "difficile"));
  if (single) assert.ok(ask(newLog("ripiego", bank.id, { topics: [single.topic] }), bank, "k", "difficile").asked.questionId);
});

test("partita intera: una domanda per ogni momento, mai ripetuta finché ce ne sono", () => {
  for (const seed of ["domande-1", "domande-2", "domande-3"]) {
    const { game } = newGame(seed);
    const bank = banks[0]!;
    let log = newLog(seed, bank.id);
    let state = game.state;
    const rng = rngFromSeed(seed, "risposte-test");
    for (let i = 0; i < 400 && state.phase !== "ended"; i++) {
      if (state.phase === "question") {
        const key = questionKey(seed, state.turn, state.players[state.activeIndex]!.id);
        const r = ask(log, bank, key, state.questionDifficulty!);
        assert.equal(bank.questions.find((q) => q.id === r.asked.questionId)!.difficulty, state.questionDifficulty);
        const q = present(bank, r.asked);
        log = recordAnswer(r.log, key, rng.chance(0.7) ? q.correctIndex : (q.correctIndex + 1) % 4);
        state = applyAction(game.map, state, { type: "answer", outcome: outcomeOf(present(bank, log.asked.at(-1)!)) }).state;
      } else state = applyAction(game.map, state, autoAction(game, state, i % 2 ? "piu-breve" : "piu-lungo")).state;
    }
    assert.equal(state.phase, "ended");
    const ids = log.asked.map((a) => a.questionId);
    assert.equal(new Set(ids).size, ids.length, `${seed}: domande ripetute in ${ids.length} turni`);
    assert.equal(new Set(log.asked.map((a) => a.key)).size, log.asked.length);
  }
});

test("riepilogo a fine partita: conteggi per giocatore e argomento coerenti con il registro, domande in ordine di turno", () => {
  const seed = "riepilogo-1";
  const { game } = newGame(seed);
  const bank = banks[0]!;
  let log = newLog(seed, bank.id);
  let state = game.state;
  const rng = rngFromSeed(seed, "risposte-test");
  for (let i = 0; i < 400 && state.phase !== "ended"; i++) {
    if (state.phase === "question") {
      const key = questionKey(seed, state.turn, state.players[state.activeIndex]!.id);
      const r = ask(log, bank, key, state.questionDifficulty!);
      const q = present(bank, r.asked);
      const roll = rng.next();
      log = recordAnswer(r.log, key, roll < 0.6 ? q.correctIndex : roll < 0.85 ? (q.correctIndex + 1) % 4 : "timeout");
      state = applyAction(game.map, state, { type: "answer", outcome: outcomeOf(present(bank, log.asked.at(-1)!)) }).state;
    } else state = applyAction(game.map, state, autoAction(game, state)).state;
  }
  // Una domanda rimasta senza risposta non compare.
  log = ask(log, bank, questionKey(seed, state.turn + 1, state.players[0]!.id), "facile").log;
  const summary = summarize(log, bank, state.players);
  const answered = log.asked.filter((a) => a.answer !== null);
  assert.equal(summary.items.length, answered.length);
  const sum = (rows: readonly { correct: number; wrong: number; timeout: number; total: number }[]) =>
    rows.reduce((t, r) => ({ correct: t.correct + r.correct, wrong: t.wrong + r.wrong, timeout: t.timeout + r.timeout, total: t.total + r.total }), { correct: 0, wrong: 0, timeout: 0, total: 0 });
  const expected = {
    correct: summary.items.filter((i) => i.outcome === "correct").length,
    wrong: summary.items.filter((i) => i.outcome === "wrong").length,
    timeout: summary.items.filter((i) => i.outcome === "timeout").length,
    total: answered.length,
  };
  assert.ok(expected.correct > 0 && expected.wrong > 0 && expected.timeout > 0, "esiti non tutti esercitati");
  assert.deepEqual(sum(summary.players), expected);
  assert.deepEqual(sum(summary.topics), expected);
  assert.deepEqual(summary.players.map((p) => p.name), state.players.map((p) => p.name));
  for (const p of summary.players) assert.equal(p.total, summary.items.filter((i) => i.playerId === p.id).length);
  // Ordine di turno; risposta data e corretta come le ha viste il giocatore.
  for (let i = 1; i < summary.items.length; i++) assert.ok(summary.items[i]!.turn >= summary.items[i - 1]!.turn);
  for (const item of summary.items) {
    if (item.outcome === "timeout") assert.equal(item.given, null);
    else assert.equal(item.given === item.correctAnswer, item.outcome === "correct");
  }
  assert.deepEqual(parseQuestionKey(questionKey("seme:con:due-punti", 12, "p3")), { turn: 12, playerId: "p3" });
  assert.equal(parseQuestionKey("chiave-estranea"), null);
});
