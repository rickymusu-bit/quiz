/* Hellscape: datasets. Shared by the static site, Node tests and offline export. */
(function (root) {
  "use strict";
  const { need } =
    typeof module !== "undefined" ? require("./core.js") : root.HellscapeCore;
  function mathParts(text) {
    // Historical banks use one extra escaping layer inside delimited formulas.
    // Normalize only that layer for rendering; preserve the source bank and IDs.
    const re =
      /\\\\\(([\s\S]*?)\\\\\)|\\\\\[([\s\S]*?)\\\\\]|\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g;
    const out = [];
    let last = 0,
      m;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push({ text: text.slice(last, m.index) });
      const legacy = m[1] !== undefined || m[2] !== undefined;
      let formula = m[1] ?? m[2] ?? m[3] ?? m[4];
      if (legacy) formula = formula.replace(/\\\\/g, "\\");
      out.push({
        math: formula,
        display: m[2] !== undefined || m[4] !== undefined,
      });
      last = re.lastIndex;
    }
    if (last < text.length) out.push({ text: text.slice(last) });
    return out;
  }
  function scienceParts(value) {
    const formulas = [
      [
        "T(K) = T(°C) + 273,15",
        String.raw`T_{\mathrm K}=t_{\mathrm C}+273{,}15`,
      ],
      [
        "T(°C) = (T(°F) − 32)·5/9",
        String.raw`t_{\mathrm C}=\frac{5}{9}(t_{\mathrm F}-32)`,
      ],
      ["ΔT = Q/(mc)", String.raw`\Delta T=\frac{Q}{m\,c}`],
      ["ΔT = Q/C", String.raw`\Delta T=\frac{Q}{C}`],
      ["Q = mcΔT", String.raw`Q=m\,c\,\Delta T`],
      ["Q = mLf", String.raw`Q=m\,L_f`],
      ["Q = mL", String.raw`Q=m\,L`],
      ["Q = Pt", String.raw`Q=P\,t`],
      ["P = λAΔT/s", String.raw`P=\frac{\lambda A\,\Delta T}{s}`],
      ["ΔL = αL0ΔT", String.raw`\Delta L=\alpha L_0\,\Delta T`],
      ["ΔV = βV0ΔT", String.raw`\Delta V=\beta V_0\,\Delta T`],
      ["C_B/C_A", String.raw`\frac{C_B}{C_A}`],
      ["C = mc", String.raw`C=m\,c`],
      ["Q1 + Q2 = 0", String.raw`Q_1+Q_2=0`],
      ["Δy/Δx", String.raw`\frac{\Delta y}{\Delta x}`],
      ["y = k/x", String.raw`y=\frac{k}{x}`],
      ["y = 12/x", String.raw`y=\frac{12}{x}`],
      ["y = kx", String.raw`y=k\,x`],
      ["y = 3x + b", String.raw`y=3x+b`],
      ["y = 2x + 1", String.raw`y=2x+1`],
      ["y = x + 5", String.raw`y=x+5`],
      ["y = 3x", String.raw`y=3x`],
      ["C = 2n + 3", String.raw`C=2n+3`],
      ["P = kn", String.raw`P=k\,n`],
      ["Qrecipiente", String.raw`Q_{\mathrm{recipiente}}`],
      ["αA", String.raw`\alpha_A`],
      ["αB", String.raw`\alpha_B`],
      ["L0", String.raw`L_0`],
      ["V0", String.raw`V_0`],
      ["Lf", String.raw`L_f`],
      ["m1", String.raw`m_1`],
      ["m2", String.raw`m_2`],
    ];
    const out = [];
    for (const part of mathParts(value)) {
      if (part.math !== undefined) {
        out.push(part);
        continue;
      }
      let rest = part.text;
      while (rest) {
        let found = null;
        for (const [plain, formula] of formulas) {
          const index = rest.indexOf(plain);
          if (
            index >= 0 &&
            (!found ||
              index < found.index ||
              (index === found.index && plain.length > found.plain.length))
          )
            found = { index, plain, formula };
        }
        if (!found) {
          out.push({ text: rest });
          break;
        }
        if (found.index) out.push({ text: rest.slice(0, found.index) });
        out.push({ math: found.formula, display: false });
        rest = rest.slice(found.index + found.plain.length);
      }
    }
    return out;
  }
  function validateMath(text, katex) {
    for (const p of mathParts(text)) {
      if (p.text)
        need(!/\\[()[\]]/.test(p.text), "Delimitatori LaTeX incompleti");
      else if (katex)
        katex.renderToString(p.math, {
          throwOnError: true,
          trust: false,
          strict: "ignore",
          maxExpand: 1000,
        });
    }
  }
  function parseDataset(text, katex) {
    need(
      typeof text === "string" &&
        new TextEncoder().encode(text).length <= 20 * 1024 * 1024,
      "File oltre 20 MiB",
    );
    let data;
    try {
      data = JSON.parse(text.replace(/^\uFEFF/, ""));
    } catch (e) {
      throw Error(
        "JSON non valido: controllare virgole e barre inverse delle formule.",
      );
    }
    need(
      data &&
        data.versione === 1 &&
        Array.isArray(data.argomenti) &&
        data.argomenti.length,
      "Servono versione 1 e argomenti non vuoti.",
    );
    const ids = new Set(),
      topics = new Set(),
      difficulties = new Set(),
      bank = [];
    const str = (v, l) => {
      need(typeof v === "string" && v.trim(), l + ": testo vuoto o non valido");
      return v.trim();
    };
    for (const t of data.argomenti) {
      const topic = str(t.id, "ID argomento"),
        topicName = str(t.nome, "Nome argomento");
      need(!topics.has(topic), "ID argomento ripetuto: " + topic);
      topics.add(topic);
      need(
        Array.isArray(t.domande) && t.domande.length,
        "Argomento senza domande",
      );
      for (const q of t.domande) {
        const id = str(q.id, "ID domanda");
        need(!ids.has(id), "ID domanda ripetuto: " + id);
        ids.add(id);
        const difficulty = str(q.difficolta, id).toLowerCase();
        need(
          ["facile", "media", "difficile"].includes(difficulty),
          id + ": difficoltà non valida",
        );
        difficulties.add(difficulty);
        const body = str(q.testo, id);
        need(
          Array.isArray(q.alternative) && q.alternative.length === 4,
          id + ": servono quattro alternative",
        );
        const options = q.alternative.map((a) => str(a, id));
        need(new Set(options).size === 4, id + ": alternative duplicate");
        const letter = str(q.corretta, id).toUpperCase();
        need(/^[ABCD]$/.test(letter), id + ": corretta deve essere A–D");
        need(
          q.spiegazione === undefined || typeof q.spiegazione === "string",
          id + ": spiegazione non valida",
        );
        const explanation = q.spiegazione || "";
        for (const text of [body, ...options, explanation]) {
          try {
            validateMath(text, katex);
          } catch (e) {
            throw Error(id + ": " + e.message);
          }
        }
        bank.push({
          id,
          topic,
          topicName,
          difficulty,
          body,
          options,
          correct: "ABCD".indexOf(letter),
          explanation,
          type: q.tipologia || "",
        });
      }
    }
    need(
      ["facile", "media", "difficile"].every(d => difficulties.has(d)),
      "La banca deve includere domande facili, medie e difficili",
    );
    return {
      title: typeof data.titolo === "string" ? data.titolo : "Banca domande",
      bank,
    };
  }

  function topicCounts(bank, difficulty = "misto") {
    const counts = Object.fromEntries(bank.map(q => [q.topic, 0]));
    for (const q of bank)
      if (difficulty === "misto" || q.difficulty === difficulty) counts[q.topic]++;
    return counts;
  }
  // New matches use every level; existing saved games may keep their old filter.
  function turnCapacity(bank, selectedTopics, players, difficulty = "misto") {
    const counts = topicCounts(bank, difficulty);
    const available = [...selectedTopics].reduce((sum, topic) => sum + (counts[topic] ?? 0), 0);
    return Math.floor(available / players);
  }
  const api = { parseDataset, validateMath, mathParts, scienceParts, topicCounts, turnCapacity };
  if (typeof module !== "undefined") module.exports = api;
  else root.HellscapeDatasets = api;
})(globalThis);
