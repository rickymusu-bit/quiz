/* Hellscape: engine. Shared by the static site, Node tests and offline export. */
(function (root) {
  "use strict";
  const core =
    typeof module !== "undefined" ? require("./core.js") : root.HellscapeCore;
  const datasets =
    typeof module !== "undefined"
      ? require("./datasets.js")
      : root.HellscapeDatasets;
  const {
    RULES,
    VERSION,
    TYPES,
    LABELS,
    DEFAULT_BONUS_WEIGHTS,
    clone,
    need,
    integer,
    rational,
    add,
    compare,
    exact,
    remainingLives,
    shuffle,
  } = core;
  const { parseDataset } = datasets;
  function config(c) {
    need(
      Array.isArray(c.names) && c.names.length === 3,
      "Servono tre giocatori",
    );
    const names = c.names.map((x, i) =>
      typeof x === "string" && x.trim() ? x.trim() : "Giocatore " + (i + 1),
    );
    need(
      new Set(names.map((n) => n.toLocaleLowerCase())).size === 3,
      "I nomi dei giocatori devono essere distinti",
    );
    if (c.icons !== undefined)
      need(
        Array.isArray(c.icons) &&
          c.icons.length === 3 &&
          c.icons.every((x) =>
            ["skull", "bolt", "star", "swords", "shield", "crown"].includes(x),
          ),
        "Icone dei giocatori non valide",
      );
    if (c.vehicles !== undefined)
      need(
        Array.isArray(c.vehicles) &&
          c.vehicles.length === 3 &&
          c.vehicles.every((x) =>
            ["chopper", "pickup", "truck", "coupe", "offroad", "ape"].includes(
              x,
            ),
          ) &&
          new Set(c.vehicles).size === 3,
        "Scegli tre veicoli diversi tra i sei disponibili",
      );
    integer(c.seconds, 1, 600, "Tempo");
    const bonusWeights = {
      ...DEFAULT_BONUS_WEIGHTS,
      ...(c.bonusWeights ?? {}),
    };
    need(
      bonusWeights &&
        typeof bonusWeights === "object" &&
        TYPES.every(
          (type) =>
            typeof bonusWeights[type] === "number" &&
            Number.isFinite(bonusWeights[type]) &&
            bonusWeights[type] >= 0 &&
            bonusWeights[type] <= 100,
        ),
      "Probabilità delle Ammo non valide",
    );
    for (const d of ["facile", "media", "difficile"])
      integer(c.bases[d], 1, Number.MAX_SAFE_INTEGER, "Punti " + d);
    need(
      ["misto", "facile", "media", "difficile"].includes(c.difficulty),
      "Filtro difficoltà non valido",
    );
    const questionCount = integer(
      c.questionCount ?? 33,
      3,
      99,
      "Numero domande",
    );
    need(
      questionCount % 3 === 0,
      "Il numero di domande deve essere un multiplo di 3",
    );
    need(
      c.quotas && Object.keys(c.quotas).length,
      "Selezionare argomenti e quote",
    );
    let sum = 0;
    for (const v of Object.values(c.quotas))
      sum += integer(v, 0, questionCount, "Quota");
    need(
      sum === questionCount,
      "La somma delle quote deve essere " + questionCount,
    );
    return {
      ...clone(c),
      bonusWeights: clone(bonusWeights),
      questionCount,
      names,
    };
  }
  function prepare(bank, c, random = Math.random) {
    c = config(c);
    const eligible = bank.filter(
      (q) =>
        Object.hasOwn(c.quotas, q.topic) &&
        c.quotas[q.topic] > 0 &&
        (c.difficulty === "misto" || q.difficulty === c.difficulty),
    );
    let chosen = [];
    for (const [t, n] of Object.entries(c.quotas)) {
      const pool = eligible.filter((q) => q.topic === t);
      need(pool.length >= n, "Domande insufficienti per " + t);
      chosen.push(...shuffle(pool, random).slice(0, n));
    }
    chosen = shuffle(chosen, random).map((q) => mix(q, random));
    return {
      bank: clone(bank),
      config: c,
      chosen,
      eligible: eligible.map((q) => q.id),
    };
  }
  function mix(q, random) {
    const order = shuffle([0, 1, 2, 3], random);
    return {
      ...clone(q),
      options: order.map((i) => q.options[i]),
      correct: order.indexOf(q.correct),
    };
  }
  class Game {
    constructor(
      state,
      { random = Math.random, now = () => performance.now() } = {},
    ) {
      this.s = state;
      this.random = random;
      this.now = now;
      this.deadline = null;
      this.running = false;
    }
    static start(prepared, deps = {}) {
      const random = deps.random || Math.random;
      const order = shuffle([0, 1, 2], random);
      const s = {
        format: 1,
        rules: RULES,
        version: VERSION,
        id: "fool-" + Date.now().toString(36),
        revision: 0,
        serial: 0,
        phase: "ordinaria",
        screen: "hidden",
        config: clone(prepared.config),
        bank: clone(prepared.bank),
        eligible: prepared.eligible.slice(),
        queue: clone(prepared.chosen),
        groups: prepared.config.names.map((name) => ({
          name,
          score: rational(0),
          sanctions: 0,
          damage: 0,
          out: false,
          cause: "",
          inventory: [],
          aura: null,
        })),
        order,
        owner: order[0],
        respondent: order[0],
        turn: 1,
        usedBonus: false,
        draftBonus: null,
        passLock: null,
        effects: [],
        seen: [],
        rejected: [],
        cancelled: [],
        valid: 0,
        extra: 0,
        current: null,
        remaining: prepared.config.seconds * 1000,
        paused: false,
        pauseReason: "",
        panel: null,
        result: null,
        events: [],
        suspendAfter: false,
        suspended: false,
        winner: null,
        tieOrder: [],
        tieIndex: -1,
        tieRound: 0,
      };
      const g = new Game(s, { ...deps, random });
      g.take();
      g.log("Rotazione: " + order.map((i) => s.groups[i].name).join(" → "));
      return g;
    }
    setScore(index, value, expected) {
      this.guard();
      need(
        this.s.phase === "ordinaria",
        "Correggi i punti durante la fase ordinaria.",
      );
      integer(index, 0, 2, "Giocatore");
      need(
        value &&
          /^\d{1,300}$/.test(value.n) &&
          /^[1-9]\d{0,299}$/.test(value.d),
        "Inserisci un punteggio non negativo.",
      );
      const group = this.s.groups[index],
        before = clone(group.score),
        after = rational(value.n, value.d);
      this.revision(expected);
      group.score = after;
      this.log(
        "Riassegna punti a " +
          group.name +
          ": " +
          exact(before) +
          " → " +
          exact(after),
        { type: "score-adjustment", group: index, before, after: clone(after) },
      );
    }
    uid() {
      return "e" + ++this.s.serial;
    }
    log(message, details = {}) {
      this.s.events.push({ id: this.uid(), message, ...details });
    }
    active() {
      return this.s.order.filter((i) => !this.s.groups[i].out);
    }
    left() {
      return this.running
        ? Math.max(0, this.deadline - this.now())
        : this.s.remaining;
    }
    stop() {
      this.s.remaining = this.left();
      this.running = false;
      this.deadline = null;
    }
    run() {
      need(
        this.s.screen === "answer" && !this.s.panel && !this.s.suspended,
        "Timer non avviabile",
      );
      this.deadline = this.now() + this.s.remaining;
      this.running = true;
      this.s.paused = false;
      this.s.pauseReason = "";
    }
    guard() {
      need(
        !this.s.panel && !this.s.suspended && this.s.phase !== "conclusa",
        "Completare il pannello o riprendere la partita",
      );
    }
    revision(expected) {
      if (expected !== undefined)
        need(expected === this.s.revision, "Comando già elaborato");
      this.s.revision++;
    }
    available() {
      const used = new Set([...this.s.seen, ...this.s.queue.map((q) => q.id)]);
      if (this.s.current) used.add(this.s.current.id);
      return this.s.bank.filter(
        (q) =>
          (this.s.phase === "pareggio" || this.s.eligible.includes(q.id)) &&
          !used.has(q.id),
      );
    }
    take() {
      const s = this.s;
      s.current = s.queue.shift() || null;
      if (!s.current) {
        const pool = this.available();
        if (pool.length)
          s.current = mix(shuffle(pool, this.random)[0], this.random);
      }
      s.screen = s.current ? "hidden" : "supply";
      s.remaining = s.config.seconds * 1000;
      s.paused = false;
      s.result = null;
      s.passLock = null;
    }
    nextGroup(from) {
      const s = this.s;
      let pos = s.order.indexOf(from);
      need(pos >= 0, "Giocatore fuori rotazione");
      for (;;) {
        pos = (pos + 1) % s.order.length;
        const i = s.order[pos],
          g = s.groups[i];
        if (g.out) continue;
        // Skip effects are resolved before the next effective turn begins.
        const skip = s.effects.findIndex(
          (e) => e.type === "salta" && e.target === i,
        );
        if (skip >= 0) {
          s.effects.splice(skip, 1);
          this.log(g.name + " salta un turno", { type: "turn-skipped", target: i, turn: s.turn + 1 });
          continue;
        }
        return i;
      }
    }
    newTurn(from) {
      const s = this.s;
      let i;
      if (s.phase === "pareggio") {
        let pos = s.tieIndex + 1;
        while (pos < s.tieOrder.length && s.groups[s.tieOrder[pos]].out) pos++;
        need(
          pos < s.tieOrder.length,
          "Nessun giocatore disponibile nello spareggio",
        );
        s.tieIndex = pos;
        i = s.tieOrder[pos];
      } else i = this.nextGroup(from);
      s.owner = i;
      s.respondent = i;
      s.turn++;
      s.groups[i].aura = null;
      s.usedBonus = false;
      s.draftBonus = null;
      this.take();
    }
    reveal(expected) {
      this.guard();
      this.revision(expected);
      const s = this.s;
      need(s.screen === "hidden" && s.current, "Nessuna domanda da svelare");
      need(!s.seen.includes(s.current.id), "Domanda già svelata");
      s.seen.push(s.current.id);
      s.screen = "answer";
      s.remaining = s.config.seconds * 1000;
      this.run();
      this.log("Svelata " + s.current.id);
    }
    pause(reason = "manuale", discipline = false) {
      const s = this.s;
      if (s.screen !== "answer" || s.paused) return;
      if (!discipline && this.left() <= 0) {
        this.answer(null);
        return;
      }
      this.stop();
      s.paused = true;
      s.pauseReason = reason;
    }
    resume(expected) {
      this.guard();
      this.revision(expected);
      const s = this.s;
      need(s.screen === "answer" && s.paused, "Nessuna risposta in pausa");
      if (s.remaining <= 0) {
        s.paused = false;
        this.answer(null);
        return;
      }
      this.run();
    }
    tick() {
      if (
        this.running &&
        !this.s.panel &&
        !this.s.suspended &&
        this.left() <= 0
      )
        this.answer(null);
    }
    attack(type, source, target, id) {
      const s = this.s,
        g = s.groups[target];
      if (g.aura !== null) {
        this.log(LABELS[type] + " bloccato da Aura di " + g.name,
          { type: "aura-block", target, source, ammo: type, turn: s.turn });
        return false;
      }
      if (type !== "svela") s.effects.push({ id, type, source, target });
      const karma = g.inventory.find((c) => c.type === "karma");
      if (karma) {
        karma.type = type;
        karma.target = source;
        karma.origin = id;
        this.log(
          "Karma di " +
            g.name +
            " diventa " +
            LABELS[type] +
            " solo contro " +
            s.groups[source].name,
          { type: "karma-trigger", target, source, ammo: type, turn: s.turn },
        );
      }
      return true;
    }
    use(copyId, target, expected) {
      this.guard();
      this.revision(expected);
      const s = this.s;
      need(
        s.phase === "ordinaria" &&
          ["hidden", "answer"].includes(s.screen) &&
          !s.paused,
        "Ammo non disponibili in questo momento",
      );
      if (s.screen === "answer" && this.left() <= 0) {
        this.answer(null);
        return;
      }
      const g = s.groups[s.respondent];
      need(
        s.owner === s.respondent && !g.out,
        "Solo il giocatore titolare può usare Ammo",
      );
      const copy = g.inventory.find((c) => c.id === copyId);
      need(copy && copy.type !== "karma", "Karma si trasforma automaticamente");
      need(
        copy.type !== "svela" || s.screen === "hidden",
        "Spoiler richiede domanda nascosta",
      );
      if (["salta", "ruba"].includes(copy.type)) {
        need(
          Number.isInteger(target) &&
            target !== s.respondent &&
            s.groups[target] &&
            !s.groups[target].out,
          "Scegliere un avversario attivo",
        );
        need(
          copy.target === null || copy.target === target,
          "Bersaglio Karma vincolato",
        );
      }
      if (copy.type === "svela" && copy.target !== null)
        need(!s.groups[copy.target].out, "Il bersaglio vincolato è eliminato");
      if (["marx", "ira"].includes(copy.type))
        need(target == null, LABELS[copy.type] + " non richiede un bersaglio");
      g.inventory = g.inventory.filter((c) => c.id !== copyId);
      s.usedBonus = true;
      s.draftBonus = null;
      const id = this.uid();
      this.log(g.name + " usa " + LABELS[copy.type], {
        activation: id,
        copy: clone(copy),
        target,
        source: s.respondent,
        turn: s.turn,
      });
      if (copy.type === "aura") g.aura = s.turn;
      else if (copy.type === "svela") {
        s.passLock = copy.target;
        s.seen.push(s.current.id);
        s.screen = "choice";
        s.remaining = s.config.seconds * 1000;
      } else if (copy.type === "marx") {
        const active = this.active();
        let total = rational(0);
        for (const i of active) total = add(total, s.groups[i].score);
        const share = rational(
          BigInt(total.n),
          BigInt(total.d) * BigInt(active.length),
        );
        for (const i of active) s.groups[i].score = clone(share);
        this.log(
          "Marx: " +
            exact(total) +
            " punti redistribuiti in parti uguali (" +
            exact(share) +
            " per giocatore)",
          {
            type: "marx-redistribution",
            groups: active,
            share: clone(share),
            total: clone(total),
          },
        );
      } else if (copy.type === "ira") {
        const active = this.active();
        // Resolve the shared hit before checking for a winner: the owner is hit too.
        for (const i of active) s.groups[i].damage = (s.groups[i].damage ?? 0) + 1;
        for (const i of active)
          if (remainingLives(s, i) === 0) this.eliminate(i, "Ira divina");
        this.log("Ira divina: tutti i dannati in gara perdono una vita", {
          type: "divine-wrath", groups: active,
        });
        this.resolveEliminations();
      } else this.attack(copy.type, s.respondent, target, id);
    }
    pass(target, expected) {
      this.guard();
      this.revision(expected);
      const s = this.s;
      need(s.screen === "choice", "Nessuna scelta in corso");
      need(
        Number.isInteger(target) && s.groups[target] && !s.groups[target].out,
        "Destinatario non valido",
      );
      if (target !== s.owner) {
        need(
          s.passLock === null || s.passLock === target,
          "Bersaglio Karma vincolato",
        );
        if (this.attack("svela", s.owner, target, this.uid())) {
          s.respondent = target;
          this.log(s.groups[target].name + " riceve la domanda con Spoiler",
            { type: "spoiler-pass", source: s.owner, target, turn: s.turn });
        }
      }
      s.screen = "answer";
      s.remaining = s.config.seconds * 1000;
      this.run();
    }
    answer(option, expected) {
      this.guard();
      const s = this.s;
      need(s.screen === "answer" && !s.paused, "Risposte bloccate");
      need(
        option === null ||
          (Number.isInteger(option) && option >= 0 && option < 4),
        "Alternativa non valida",
      );
      this.revision(expected);
      const left = this.left();
      if (left <= 0) option = null;
      this.stop();
      const i = s.respondent,
        g = s.groups[i],
        q = s.current;
      need(!g.out, "Giocatore eliminato");
      const correct = option !== null && option === q.correct;
      const result = {
        id: this.uid(),
        question: q.id,
        respondent: i,
        correct,
        option,
        base: null,
        gross: rational(0),
        share: rational(0),
        beneficiaries: [],
        bonus: null,
      };
      if (s.phase === "ordinaria") {
        const beneficiaries = [
          ...new Set(
            s.effects
              .filter(
                (e) =>
                  e.type === "ruba" &&
                  e.target === i &&
                  !s.groups[e.source].out,
              )
              .map((e) => e.source),
          ),
        ];
        if (correct) {
          const base = BigInt(s.config.bases[q.difficulty]);
          const gross = rational(base),
            share = rational(
              BigInt(gross.n),
              BigInt(gross.d) * BigInt(beneficiaries.length + 1),
            );
          for (const id of [i, ...beneficiaries])
            s.groups[id].score = add(s.groups[id].score, share);
          Object.assign(result, {
            base: String(base),
            gross,
            share,
            beneficiaries,
          });
          {
            const weights = s.config.bonusWeights ?? DEFAULT_BONUS_WEIGHTS;
            result.bonuses = [];
            for (const type of TYPES) {
              if (this.random() * 100 >= weights[type]) continue;
              const c = {
                id: this.uid(),
                type,
                target: null,
                origin: result.id,
              };
              g.inventory.push(c);
              result.bonuses.push(clone(c));
            }
            result.bonus = result.bonuses[0] ?? null;
          }
        }
        s.effects = s.effects.filter(
          (e) => !(e.type === "ruba" && e.target === i),
        );
        s.valid++;
      } else {
        s.extra++;
        if (!correct)
          this.eliminate(
            i,
            option === null
              ? "Tempo scaduto nello spareggio"
              : "Errore nello spareggio",
          );
      }
      s.result = result;
      s.screen = "result";
      s.paused = false;
      this.log(
        (correct ? "Corretta" : "Errore / tempo scaduto") + " — " + g.name,
        { outcome: clone(result), question: clone(q) },
      );
      this.finishCheck();
      if (s.suspendAfter && s.phase !== "conclusa") {
        s.suspended = true;
        s.suspendAfter = false;
      }
    }
    eliminate(i, cause) {
      const s = this.s,
        g = s.groups[i];
      g.out = true;
      g.cause = cause;
      g.inventory = [];
      g.aura = null;
      s.effects = s.effects.filter((e) => e.source !== i && e.target !== i);
    }
    complete(winner) {
      const s = this.s;
      this.stop();
      s.draftBonus = null;
      s.phase = "conclusa";
      s.winner = winner;
      s.panel = null;
      s.paused = false;
      s.pauseReason = "";
      s.suspendAfter = false;
      s.suspended = false;
      s.screen = "final";
    }
    finishCheck() {
      const s = this.s,
        active = this.active();
      if (s.phase === "pareggio") {
        // Concludere ogni giro: l'ultimo deve comunque rispondere.
        if (s.tieOrder.slice(s.tieIndex + 1).some((i) => !s.groups[i].out))
          return;
        const survivors = s.tieOrder.filter((i) => !s.groups[i].out);
        if (survivors.length <= 1) {
          this.complete(survivors[0] ?? null);
          return;
        }
        s.tieOrder = survivors;
        s.tieIndex = -1;
        s.tieRound++;
        this.log(
          "Spareggio: nuovo giro per " +
            survivors.map((i) => s.groups[i].name).join(", "),
        );
        return;
      }
      if (active.length <= 1) {
        this.complete(active[0] ?? null);
        return;
      }
      if (
        s.phase === "ordinaria" &&
        s.valid === (s.config.questionCount ?? 33)
      ) {
        let leaders = [active[0]];
        for (const i of active.slice(1)) {
          const c = compare(s.groups[i].score, s.groups[leaders[0]].score);
          if (c > 0) leaders = [i];
          else if (c === 0) leaders.push(i);
        }
        if (leaders.length === 1) {
          this.complete(leaders[0]);
          return;
        }
        for (const i of active)
          if (!leaders.includes(i))
            this.eliminate(i, "Punteggio inferiore al primo posto");
        s.phase = "pareggio";
        s.tieOrder = s.order.filter((i) => leaders.includes(i));
        s.tieIndex = -1;
        s.tieRound = 1;
        s.effects = [];
        s.queue = [];
        s.draftBonus = null;
        for (const g of s.groups) {
          g.inventory = [];
          g.aura = null;
          if (!g.out) g.damage = 0;
        }
        if (s.result) {
          s.result.bonus = null;
          s.result.bonuses = [];
        }
        this.log(
          "Spareggio a eliminazione: " +
            s.tieOrder.map((i) => s.groups[i].name).join(" → "),
        );
      }
    }

    next(expected) {
      this.guard();
      this.revision(expected);
      need(this.s.screen === "result", "Registrare prima un esito");
      this.newTurn(this.s.respondent);
    }
    openSanctions() {
      need(
        this.s.phase !== "conclusa" && !this.s.panel && !this.s.suspended,
        "Pannello non disponibile",
      );
      this.pause("sanzioni", true);
      this.s.panel = {
        type: "sanctions",
        id: this.uid(),
        counts: [0, 0, 0],
        reasons: ["disturbo", "disturbo", "disturbo"],
      };
    }
    closeSanctions(apply, expected) {
      const s = this.s;
      need(s.panel?.type === "sanctions", "Pannello sanzioni non aperto");
      this.revision(expected);
      const p = s.panel;
      for (const n of p.counts) integer(n, 0, 3, "Sanzioni");
      s.panel = null;
      if (apply) {
        for (let i = 0; i < 3; i++) {
          const n = integer(p.counts[i], 0, 3, "Sanzioni");
          const g = s.groups[i];
          if (g.out || !n) continue;
          const before = remainingLives(s, i), loss = Math.min(n, before);
          g.sanctions = Math.min(3 - (g.damage ?? 0), g.sanctions + loss);
          this.log("Sanzione a " + g.name + ": " + p.reasons[i]);
          if (loss === before)
            this.eliminate(i, g.sanctions === 3 && !g.damage ? "Tre sanzioni" : "Vite esaurite");
        }
      }
      this.resolveEliminations();
    }
    resolveEliminations() {
      const s = this.s;
      const interrupted =
        s.groups[s.respondent].out &&
        ["hidden", "answer", "choice", "supply"].includes(s.screen);
      this.finishCheck();
      if (s.phase === "conclusa") return;
      if (interrupted) {
        this.stop();
        if (s.current && s.seen.includes(s.current.id))
          s.cancelled.push(s.current.id);
        this.newTurn(s.respondent);
        if (s.suspendAfter) {
          s.suspended = true;
          s.suspendAfter = false;
        }
      }
    }
    bell() {
      this.guard();
      const s = this.s;
      if (["answer", "choice"].includes(s.screen)) {
        s.suspendAfter = true;
        this.log("Sospensione: concludere la domanda, poi fermare la gara");
      } else {
        s.suspended = true;
        this.stop();
        this.log("Partita sospesa");
      }
    }
    continueSession() {
      need(this.s.suspended, "Partita non sospesa");
      this.s.suspended = false;
      if (this.s.screen === "answer") this.s.paused = true;
    }
    supply(parsed) {
      const s = this.s;
      need(
        s.screen === "supply" && !s.panel,
        "Rifornimento disponibile solo a banca esaurita",
      );
      const all = new Set(s.bank.map((q) => q.id));
      for (const q of parsed.bank)
        need(!all.has(q.id), "ID già nella banca: " + q.id);
      const eligible = parsed.bank.filter(
        (q) =>
          s.config.quotas[q.topic] > 0 &&
          (s.config.difficulty === "misto" ||
            s.config.difficulty === q.difficulty),
      );
      need(
        s.phase === "pareggio" ? parsed.bank.length > 0 : eligible.length > 0,
        "Nessuna domanda compatibile con la partita",
      );
      s.bank.push(...clone(parsed.bank));
      s.eligible.push(...eligible.map((q) => q.id));
      this.take();
      this.log("Banca rifornita: " + eligible.length + " quesiti");
    }
    snapshot() {
      const s = clone(this.s);
      s.remaining = this.left();
      if (s.screen === "answer") {
        s.paused = true;
        s.pauseReason = "ripresa";
      }
      return s;
    }
    static restore(raw, deps = {}) {
      const s = clone(raw), legacyDamage = s.version !== VERSION;
      if (
        s.version === "1.2.0" &&
        s.rules === "18.2.0" &&
        s.phase === "ordinaria"
      ) {
        s.version = VERSION;
        s.rules = RULES;
        for (const key of [
          "drawParticipants",
          "drawTurn",
          "drawAsked",
          "drawWins",
          "drawRound",
        ])
          delete s[key];
        s.tieOrder = [];
        s.tieIndex = -1;
        s.tieRound = 0;
        for (const g of s.groups) delete g.streak;
      }
      if (
        (s.version === "2.0.0" && s.rules === "19.0.0") ||
        (s.version === "2.1.0" && s.rules === "19.1.0") ||
        (["2.2.0", "2.2.1"].includes(s.version) && s.rules === "19.2.0")
      ) {
        s.version = VERSION;
        s.rules = RULES;
      }
      if (s.version === VERSION && s.rules === RULES) {
        s.config.bonusWeights = {
          ...DEFAULT_BONUS_WEIGHTS,
          ...(s.config.bonusWeights ?? {}),
        };
        if (Array.isArray(s.groups))
          for (const g of s.groups) if (legacyDamage && g && g.damage === undefined) g.damage = 0;
      }
      if (s.panel?.type === "refusal") {
        need(
          ["answer", "choice"].includes(s.panel.from),
          "Pannello precedente non valido",
        );
        s.screen = s.panel.from;
        s.panel = null;
      }
      validateSave(s);
      for (const e of s.events)
        if (e.outcome && !e.question && e.outcome.question === s.current?.id)
          e.question = clone(s.current);
      if (s.screen === "answer") {
        s.paused = true;
        s.pauseReason = "ripresa";
      }
      return new Game(s, deps);
    }
  }
  function validateSave(s) {
    need(
      s && s.format === 1 && s.rules === RULES && s.version === VERSION,
      "Salvataggio incompatibile",
    );
    config(s.config);
    need(
      ["ordinaria", "pareggio", "conclusa"].includes(s.phase) &&
        ["hidden", "answer", "choice", "result", "supply", "final"].includes(
          s.screen,
        ),
      "Stato partita non valido",
    );
    integer(s.revision, 0, Number.MAX_SAFE_INTEGER, "Revisione");
    integer(s.serial, 0, Number.MAX_SAFE_INTEGER, "Sequenza");
    integer(s.turn, 1, Number.MAX_SAFE_INTEGER, "Turno");
    integer(s.valid, 0, s.config.questionCount ?? 33, "Domande valide");
    integer(s.extra, 0, Number.MAX_SAFE_INTEGER, "Domande extra");
    need(typeof s.id === "string" && s.id, "ID partita mancante");
    need(
      Array.isArray(s.groups) && s.groups.length === 3,
      "Giocatori non validi",
    );
    need(
      s.groups.every((g, i) => g.name === s.config.names[i]),
      "Nomi incoerenti",
    );
    for (const flag of ["usedBonus", "paused", "suspended", "suspendAfter"])
      need(typeof s[flag] === "boolean", "Flag " + flag + " non valido");
    const group = (i) => Number.isInteger(i) && i >= 0 && i < 3;
    need(
      Array.isArray(s.order) &&
        s.order.length >= 2 &&
        new Set(s.order).size === s.order.length &&
        s.order.every(group),
      "Rotazione non valida",
    );
    need(
      group(s.owner) &&
        group(s.respondent) &&
        s.order.includes(s.owner) &&
        s.order.includes(s.respondent),
      "Rispondente non valido",
    );
    need(
      s.phase !== "ordinaria" || s.order.length === 3,
      "Rotazione ordinaria incompleta",
    );
    const copyIds = new Set();
    for (const g of s.groups) {
      integer(g.sanctions, 0, 3, "Sanzioni");
      integer(g.damage, 0, 3, "Vite perse per Ammo");
      need(g.sanctions + g.damage <= 3, "Perdita di vite non valida");
      need(
        typeof g.out === "boolean" && typeof g.cause === "string",
        "Eliminazione non valida",
      );
      need(g.sanctions + g.damage < 3 || g.out, "Vite esaurite senza eliminazione");
      need(
        g.score &&
          /^\d{1,300}$/.test(g.score.n) &&
          /^[1-9]\d{0,299}$/.test(g.score.d),
        "Punteggio razionale non valido",
      );
      need(
        JSON.stringify(rational(g.score.n, g.score.d)) ===
          JSON.stringify(g.score),
        "Punteggio non ridotto",
      );
      need(
        g.aura === null ||
          (Number.isInteger(g.aura) && g.aura > 0 && g.aura <= s.turn),
        "Aura non valida",
      );
      need(Array.isArray(g.inventory), "Inventario non valido");
      for (const c of g.inventory) {
        need(
          typeof c.id === "string" &&
            !copyIds.has(c.id) &&
            TYPES.includes(c.type) &&
            typeof c.origin === "string",
          "Munizione non valida",
        );
        copyIds.add(c.id);
        need(
          c.target === null ||
            (group(c.target) && ["salta", "ruba", "svela"].includes(c.type)),
          "Vincolo Karma non valido",
        );
      }
      need(
        !g.out || (!g.inventory.length && g.aura === null),
        "Eliminato con Ammo",
      );
    }
    need(
      Array.isArray(s.bank) &&
        s.bank.length &&
        Array.isArray(s.eligible) &&
        Array.isArray(s.queue),
      "Banca non valida",
    );
    const converted = { versione: 1, argomenti: [] },
      topics = new Map();
    for (const q of s.bank) {
      need(
        q &&
          typeof q.topic === "string" &&
          typeof q.topicName === "string" &&
          Number.isInteger(q.correct) &&
          q.correct >= 0 &&
          q.correct < 4,
        "Domanda salvata non valida",
      );
      if (!topics.has(q.topic)) {
        const t = { id: q.topic, nome: q.topicName, domande: [] };
        topics.set(q.topic, t);
        converted.argomenti.push(t);
      }
      topics
        .get(q.topic)
        .domande.push({
          id: q.id,
          testo: q.body,
          alternative: q.options,
          corretta: "ABCD"[q.correct],
          spiegazione: q.explanation,
          difficolta: q.difficulty,
        });
    }
    const validated = parseDataset(JSON.stringify(converted), root.katex);
    const byId = new Map(validated.bank.map((q) => [q.id, q]));
    need(
      s.eligible.every(
        (id) =>
          byId.has(id) &&
          s.config.quotas[byId.get(id).topic] > 0 &&
          (s.config.difficulty === "misto" ||
            s.config.difficulty === byId.get(id).difficulty),
      ) && new Set(s.eligible).size === s.eligible.length,
      "Selezione non valida",
    );
    const checkQ = (q) => {
      const base = byId.get(q?.id);
      need(
        base &&
          (s.tieRound > 0 || s.eligible.includes(q.id)) &&
          q.body === base.body &&
          q.explanation === base.explanation &&
          q.topic === base.topic &&
          q.difficulty === base.difficulty &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          q.options.every((x) => base.options.includes(x)) &&
          new Set(q.options).size === 4 &&
          q.options[q.correct] === base.options[base.correct],
        "Domanda/soluzione salvata incoerente",
      );
    };
    for (const q of s.queue) checkQ(q);
    if (s.current) checkQ(s.current);
    need(
      !["hidden", "answer", "choice", "result"].includes(s.screen) || s.current,
      "Domanda mancante",
    );
    need(
      new Set(s.queue.map((q) => q.id)).size === s.queue.length,
      "Coda duplicata",
    );
    for (const k of ["seen", "rejected", "cancelled"])
      need(
        Array.isArray(s[k]) &&
          new Set(s[k]).size === s[k].length &&
          s[k].every((id) => byId.has(id)),
        k + " non valido",
      );
    need(
      s.rejected.concat(s.cancelled).every((id) => s.seen.includes(id)),
      "Quesito annullato mai svelato",
    );
    need(
      s.queue.every((q) => !s.seen.includes(q.id) && q.id !== s.current?.id),
      "Domande già usate in coda",
    );
    need(
      !["answer", "choice", "result"].includes(s.screen) ||
        s.seen.includes(s.current?.id),
      "Domanda visibile senza svelamento",
    );
    need(
      s.screen !== "hidden" || !s.seen.includes(s.current?.id),
      "Domanda nascosta già usata",
    );
    need(
      typeof s.remaining === "number" &&
        Number.isFinite(s.remaining) &&
        s.remaining >= 0 &&
        s.remaining <= s.config.seconds * 1000,
      "Tempo residuo non valido",
    );
    need(Array.isArray(s.effects), "Effetti non validi");
    const effectIds = new Set();
    for (const e of s.effects) {
      need(
        ["salta", "ruba"].includes(e.type) &&
          typeof e.id === "string" &&
          !effectIds.has(e.id) &&
          group(e.source) &&
          group(e.target) &&
          e.source !== e.target &&
          !s.groups[e.source].out &&
          !s.groups[e.target].out,
        "Effetto non valido",
      );
      effectIds.add(e.id);
    }
    if (s.draftBonus !== null && s.draftBonus !== undefined) {
      const draft = s.draftBonus;
      need(
        s.phase === "ordinaria" &&
          ["hidden", "answer"].includes(s.screen) &&
          s.groups[s.owner].inventory.some((c) => c.id === draft.copyId) &&
          (draft.target === null || group(draft.target)),
        "Scelta Ammo salvata non valida",
      );
    }
    need(
      s.passLock === null || group(s.passLock),
      "Bersaglio passaggio non valido",
    );
    need(
      s.screen !== "choice" || (s.usedBonus && s.phase === "ordinaria"),
      "Scelta senza Ammo",
    );
    need(
      s.phase !== "pareggio" ||
        (s.groups.every((g) => !g.inventory.length && g.aura === null) &&
          !s.effects.length),
      "Ammo presenti nello spareggio",
    );
    need(
      Array.isArray(s.tieOrder) &&
        new Set(s.tieOrder).size === s.tieOrder.length &&
        s.tieOrder.every(group),
      "Partecipanti spareggio non validi",
    );
    integer(s.tieIndex, -1, 2, "Indice spareggio");
    integer(s.tieRound, 0, 1000000, "Giro spareggio");
    need(
      s.phase !== "pareggio" ||
        (s.tieRound >= 1 &&
          s.tieOrder.length >= 2 &&
          s.tieIndex < s.tieOrder.length &&
          s.tieOrder.every((i) => s.order.includes(i))),
      "Rotazione spareggio non valida",
    );
    if (s.phase === "pareggio" && s.tieIndex >= 0)
      need(
        s.respondent === s.tieOrder[s.tieIndex],
        "Rispondente spareggio non valido",
      );
    need(
      Array.isArray(s.events) &&
        s.events.every(
          (e) => typeof e.id === "string" && typeof e.message === "string",
        ),
      "Eventi non validi",
    );
    for (const event of s.events) {
      if (!event.question) continue;
      checkQ(event.question);
      const r = event.outcome;
      need(
        r &&
          r.question === event.question.id &&
          group(r.respondent) &&
          (r.option === null ||
            (Number.isInteger(r.option) && r.option >= 0 && r.option < 4)) &&
          r.correct ===
            (r.option !== null && r.option === event.question.correct),
        "Cronologia domanda non valida",
      );
    }
    need(
      s.panel === null || s.panel?.type === "sanctions",
      "Pannello non valido",
    );
    if (s.panel?.type === "sanctions") {
      need(
        Array.isArray(s.panel.counts) &&
          s.panel.counts.length === 3 &&
          s.panel.counts.every(
            (n) => Number.isInteger(n) && n >= 0 && n <= 3,
          ) &&
          Array.isArray(s.panel.reasons) &&
          s.panel.reasons.length === 3 &&
          s.panel.reasons.every((x) => typeof x === "string"),
        "Sanzioni pendenti non valide",
      );
    }
    need(
      s.phase !== "conclusa" ||
        (s.screen === "final" &&
          (s.winner === null || (group(s.winner) && !s.groups[s.winner].out))),
      "Vincitore non valido",
    );
    if (["hidden", "answer", "choice"].includes(s.screen))
      need(
        !s.groups[s.respondent].out,
        "Rispondente eliminato in domanda aperta",
      );
    if (s.screen === "result")
      need(
        s.result &&
          s.result.question === s.current.id &&
          s.result.respondent === s.respondent &&
          typeof s.result.correct === "boolean",
        "Esito non valido",
      );
    return s;
  }

  const api = {
    ...core,
    ...datasets,
    Game,
    config,
    prepare,
    mix,
    validateSave,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.Fool = api;
})(globalThis);
