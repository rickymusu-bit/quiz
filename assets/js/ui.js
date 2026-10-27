(function () {
  "use strict";
  const store = HellscapePersistence.create({
    storage: () => localStorage,
    engine: Fool,
    namespace: window.HellscapeOffline ? "hellscape-offline-v1" : null,
  });
  const launchParams = new URLSearchParams(
    window.HellscapeOffline?.search ?? location.search,
  );
  const F = Fool,
    $ = (id) => document.getElementById(id),
    main = $("main");
  let bank = null,
    prepared = null,
    game = null,
    ui = "config",
    fitting = false,
    fitBlocked = false,
    messageTimer,
    inventoryCanResume = false,
    catalog = null,
    selectedBankId = null,
    configurationLoad = 0,
    feedbackEpoch = 0,
    cinematicPause = null,
    lastFinalGame = null,
    setupMode = launchParams.get("settings") === "1" ? "settings" : "config";
  const teamDraft = {
    names: ["Giocatore 1", "Giocatore 2", "Giocatore 3"],
    icons: ["skull", "bolt", "star"],
    vehicles: ["chopper", "pickup", "ape"],
  };
  const VEHICLE_LABELS = {
    chopper: "Chopper · Lama infernale",
    pickup: "Pick-up · Predone",
    truck: "Camion · Fortezza",
    coupe: "Coupé · Belva",
    offroad: "Fuoristrada · Sopravvissuto",
    ape: "Ape · Contrabbandiere",
  };
  function vehiclePreview(id) {
    const preview = node("span", undefined, "vehicle-preview");
    preview.setAttribute("role", "img");
    preview.setAttribute("aria-label", VEHICLE_LABELS[id]);
    preview.append(FoolHellRace.vehiclePreview(id));
    return preview;
  }
  const SYMBOLS = {
    skull: ["☠︎", "Teschio"],
    bolt: ["ϟ", "Fulmine"],
    star: ["★", "Stella"],
    swords: ["⚔︎", "Spade"],
    shield: ["⛨", "Scudo"],
    crown: ["♛", "Corona"],
  };
  let settingsTab = "general",
    passiveReturn = null,
    vialRefillFrom = null;
  const node = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };
  const SHORTCUTS = {
    Inventario: "I",
    Opzioni: "O",
    Sanzioni: "S",
    "Riassegna punti": "V",
    "Sospendi la gara": "L",
    "Riprendi la sessione": "L",
    Salva: "K",
    "Schermo intero": "F",
    "Esci da schermo intero": "F",
    Pausa: "P",
    "Riprendi timer": "P",
    "Domanda precedente": "ArrowLeft",
    "Scorciatoie da tastiera": "F1",
    "Torna alla schermata iniziale": "H",
  };
  function btn(text, fn, cls = "", disabled = false) {
    const b = node("button", text, cls);
    b.type = "button";
    b.disabled = disabled;
    if (text === "Prossima domanda" || text === "Svela e avvia il tempo") {
      b.dataset.gameAction = text === "Prossima domanda" ? "next" : "reveal";
      b.setAttribute("aria-keyshortcuts", "Enter");
    }
    const key = SHORTCUTS[text];
    if (key) {
      b.setAttribute("aria-keyshortcuts", key);
      b.title = text + " (" + key + ")";
    }
    b.onclick = () => act(fn);
    return b;
  }
  function act(fn) {
    try {
      const result = fn();
      if (result && typeof result.catch === "function")
        result.catch((e) => message(e.message));
    } catch (e) {
      message(e.message);
    }
  }
  function message(text) {
    $("message").textContent = text;
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => ($("message").textContent = ""), 10000);
  }
  function math(el, text) {
    for (const p of F.scienceParts(text)) {
      if (p.text !== undefined) el.append(document.createTextNode(p.text));
      else {
        const span = node(
          "span",
          undefined,
          (p.display ? "math-block" : "math-inline") + " math-scroll",
        );
        katex.render(p.math, span, {
          displayMode: p.display,
          trust: false,
          throwOnError: true,
          strict: "ignore",
          maxExpand: 1000,
        });
        el.append(span);
      }
    }
    return el;
  }
  function text(tag, value, cls) {
    return math(node(tag, undefined, cls), value);
  }
  function input(label, id, value, type = "text") {
    const l = node("label", label + " "),
      i = node("input");
    i.id = id;
    i.type = type;
    i.value = value;
    l.append(i);
    return l;
  }
  function select(label, id, values, value) {
    const l = node("label", label + " "),
      s = node("select");
    s.id = id;
    for (const [v, t] of values) s.append(new Option(t, v));
    s.value = value;
    l.append(s);
    return l;
  }
  function heading(title, sub) {
    const p = node("section", undefined, "stack");
    p.append(node("h2", title));
    if (sub) p.append(node("p", sub, "muted"));
    main.append(p);
    return p;
  }
  const { fetchSiteText, loadCatalog, loadBank } = HellscapeLoader;
  function persist() {
    if (!game) return;
    try {
      store.save(game);
      return true;
    } catch (e) {
      message(
        "Il browser non consente di conservare la partita. Mantieni aperta questa pagina.",
      );
      return false;
    }
  }
  function changed() {
    persist();
    renderGame();
  }
  function command(fn) {
    return () => {
      const before = feedbackState();
      fn();
      changed();
      return animateOutcome(before);
    };
  }
  function localSave() {
    try {
      return store.readGame();
    } catch (e) {
      return null;
    }
  }
  function savedGameNotice(parent) {
    const raw = localSave();
    if (!raw) return;
    try {
      const saved = JSON.parse(raw),
        count = saved?.config?.questionCount ?? 33;
      if (count < 33)
        parent.append(
          node(
            "p",
            "La partita salvata prevede soltanto " +
              count +
              " domande. Per iniziare una nuova partita da 33, scegli Inizia partita.",
            "help",
          ),
        );
    } catch (e) {}
  }
  function leaveForHome() {
    cancelFeedback();
    if (game) game.stop();
    game = null;
    ui = "home";
    configurationLoad++;
    closeDialog();
    if (window.hellscapePreviewHome) {
      window.hellscapePreviewHome();
      return;
    }
    location.assign(new URL("./", location.href).href);
  }
  function goHome() {
    if (!game || game.s.phase === "conclusa") {
      leaveForHome();
      return;
    }
    const wasRunning = game.running;
    if (wasRunning) game.pause("uscita");
    dialog("Salvare la partita prima di uscire?", (d) => {
      d.append(
        btn(
          "Salva ed esci",
          () => {
            if (persist()) leaveForHome();
          },
          "primary",
        ),
        btn("Esci senza salvare", () => {
          try {
            store.removeGame();
          } catch (e) {
            message("Impossibile rimuovere il salvataggio.");
            return;
          }
          leaveForHome();
        }),
        btn("Annulla", () => {
          closeDialog();
          if (wasRunning) game.resume();
          changed();
        }),
      );
    });
  }
  document.querySelector("header .brand").addEventListener("click", (e) => {
    e.preventDefault();
    act(goHome);
  });
  function defaultSettings() {
    return {
      seconds: 45,
      bonusWeights: { ...F.DEFAULT_BONUS_WEIGHTS },
      difficulty: "misto",
      questionCount: 33,
      bases: { facile: 100, media: 200, difficile: 300 },
      quotas: balancedQuotas("misto", 33),
    };
  }
  function balancedQuotas(filter, total = 33) {
    const topics = [...new Set(bank.bank.map((q) => q.topic))],
      counts = topics.map(
        (t) =>
          bank.bank.filter(
            (q) =>
              q.topic === t && (filter === "misto" || q.difficulty === filter),
          ).length,
      ),
      values = topics.map(() => 0);
    let remaining = total;
    while (remaining && values.some((n, i) => n < counts[i]))
      for (let i = 0; i < values.length && remaining; i++)
        if (values[i] < counts[i]) {
          values[i]++;
          remaining--;
        }
    return Object.fromEntries(topics.map((t, i) => [t, values[i]]));
  }
  function settingsStore() {
    return store.profiles();
  }
  function settingsConfig(value, names = teamDraft.names) {
    return {
      seconds: value.seconds,
      bonusWeights: {
        ...F.DEFAULT_BONUS_WEIGHTS,
        ...(value.bonusWeights ?? {}),
      },
      difficulty: value.difficulty,
      questionCount: value.questionCount ?? 33,
      bases: value.bases,
      quotas: value.quotas,
      names,
      icons: teamDraft.icons.slice(),
      vehicles: teamDraft.vehicles.slice(),
    };
  }
  function savedSettings() {
    try {
      const value = settingsStore().profiles[selectedBankId];
      if (value) {
        /* I vecchi profili non attestano che una partita di 3/6/... domande sia una scelta consapevole. */
        const legacyShort =
          (value.questionCount ?? 33) < 33 &&
          value.questionCountConfirmed !== true;
        const safe = legacyShort
          ? {
              ...value,
              questionCount: 33,
              quotas: balancedQuotas(value.difficulty, 33),
            }
          : value;
        F.prepare(
          bank.bank,
          settingsConfig(safe, ["Giocatore 1", "Giocatore 2", "Giocatore 3"]),
        );
        return safe;
      }
    } catch (e) {
      message(
        "Impostazioni non disponibili: sono stati caricati i valori predefiniti. Puoi salvarli di nuovo da Impostazioni.",
      );
    }
    return defaultSettings();
  }
  function syncVehicleChoices() {
    const selectors = [0, 1, 2].map((i) => $("vehicle" + i));
    selectors.forEach((select, i) => {
      if (!select) return;
      for (const option of select.options)
        option.disabled = selectors.some(
          (other, j) => j !== i && other?.value === option.value,
        );
    });
  }
  function rememberTeams() {
    for (let i = 0; i < 3; i++) {
      if ($("name" + i)) teamDraft.names[i] = $("name" + i).value;
      if ($("icon" + i)) teamDraft.icons[i] = $("icon" + i).value;
      if ($("vehicle" + i)) teamDraft.vehicles[i] = $("vehicle" + i).value;
    }
  }
  async function configure() {
    cancelFeedback();
    const request = ++configurationLoad;
    ui = setupMode;
    document.body.classList.remove("playing", "finished");
    game = null;
    main.className = "";
    main.replaceChildren();
    const loading = heading(
      setupMode === "settings" ? "Impostazioni" : "Prepara Hellscape",
      "Caricamento delle domande dal sito…",
    );
    if (setupMode === "config") savedGameNotice(loading);
    try {
      const available = await loadCatalog();
      if (request !== configurationLoad || ui !== setupMode) return;
      catalog = available;
      const entry = catalog.find((x) => x.id === selectedBankId) || catalog[0];
      selectedBankId = entry.id;
      if (!bank || bank.source !== entry.id) {
        const loaded = await loadBank(entry);
        if (request !== configurationLoad || ui !== setupMode) return;
        bank = loaded;
      }
      renderConfiguration();
    } catch (e) {
      if (request !== configurationLoad || ui !== setupMode) return;
      main.replaceChildren();
      const p = heading("Domande non disponibili", e.message);
      p.append(
        btn("Riprova", configure, "primary"),
        btn("Torna alla schermata iniziale", goHome),
      );
    }
  }
  function renderConfiguration() {
    main.replaceChildren();
    const editing = setupMode === "settings",
      value = savedSettings();
    const p = heading(
      editing ? "Impostazioni" : "Prepara Hellscape",
      editing
        ? "I parametri si applicano alle nuove partite e si conservano in questo browser. Salva prima di cambiare argomento."
        : "Scegli nomi, veicoli e argomento delle domande.",
    );
    if (!editing) savedGameNotice(p);
    const choice = select(
      "Argomento delle domande",
      "bank-choice",
      catalog.map((x) => [x.id, x.nome]),
      selectedBankId,
    );
    choice.querySelector("select").onchange = () =>
      act(async () => {
        rememberTeams();
        selectedBankId = $("bank-choice").value;
        bank = null;
        prepared = null;
        await configure();
      });
    p.append(choice);
    if (!editing) {
      const grid = node("div", undefined, "columns setup-teams");
      for (let i = 0; i < 3; i++) {
        const card = node("section", undefined, "panel");
        const name = input("Nome", "name" + i, teamDraft.names[i]);
        name
          .querySelector("input")
          .setAttribute("aria-label", "Nome del giocatore " + (i + 1));
        const vehicle = select(
          "Veicolo",
          "vehicle" + i,
          Object.entries(VEHICLE_LABELS),
          teamDraft.vehicles[i],
        );
        vehicle
          .querySelector("select")
          .setAttribute("aria-label", "Veicolo del giocatore " + (i + 1));
        const visual = vehiclePreview(teamDraft.vehicles[i]);
        visual.id = "vehicle-preview-" + i;
        vehicle.querySelector("select").addEventListener("change", () => {
          const id = vehicle.querySelector("select").value;
          teamDraft.vehicles[i] = id;
          // Un canvas contiene il veicolo: la posizione dello sfondo CSS non lo modifica.
          visual.replaceChildren(FoolHellRace.vehiclePreview(id));
          visual.setAttribute("aria-label", VEHICLE_LABELS[id]);
          syncVehicleChoices();
        });
        const previewRow = node("div", undefined, "vehicle-chooser");
        previewRow.append(vehicle, visual);
        card.append(node("h3", "Giocatore " + (i + 1)), name, previewRow);
        grid.append(card);
      }
      p.append(grid);
      syncVehicleChoices();
      const currentSettings = savedSettings();
      const count = currentSettings.questionCount ?? 33;
      p.append(
        node(
          "p",
          "Partita ordinaria: " +
            count +
            " domande. Lo spareggio si apre soltanto alla fine, in caso di parità al primo posto.",
          "help",
        ),
      );
      const row = node("div", undefined, "row");
      row.append(
        btn(
          "Inizia partita (" + count + " domande)",
          () => {
            rememberTeams();
            const chosen = savedSettings();
            prepared = F.prepare(bank.bank, settingsConfig(chosen));
            start();
          },
          "primary",
        ),
        btn("Torna alla schermata iniziale", goHome),
      );
      p.append(row);
      return;
    }
    const tabs = node("nav", undefined, "row settings-tabs");
    tabs.setAttribute("aria-label", "Sezioni impostazioni");
    for (const [key, label] of [
      ["general", "Generali"],
      ["topics", "Argomenti"],
    ]) {
      const button = btn(label, () => showSettingsTab(key));
      button.dataset.settingsTab = key;
      tabs.append(button);
    }
    p.append(tabs);
    const grid = node("div", undefined, "columns settings-grid");
    const time = node("section", undefined, "panel");
    time.append(
      node("h3", "Tempo e Ammo"),
      input(
        "Numero di domande (multipli di 3, massimo 99)",
        "question-count",
        value.questionCount ?? 33,
        "number",
      ),
      input("Secondi per domanda", "seconds", value.seconds, "number"),
      select(
        "Difficoltà",
        "difficulty",
        [
          ["misto", "Misto"],
          ["facile", "Facile"],
          ["media", "Media"],
          ["difficile", "Difficile"],
        ],
        value.difficulty,
      ),
    );
    grid.append(time);
    const bonusPanel = node("section", undefined, "panel");
    bonusPanel.append(
      node("h3", "Probabilità delle Ammo"),
      node(
        "p",
        "Ogni Ammo viene estratta indipendentemente dalle altre dopo una risposta corretta. Puoi ottenere da zero a sette Ammo. Le probabilità sono indipendenti e non devono sommare al 100%. Tocca un’icona per conoscerne il funzionamento.",
        "muted",
      ),
    );
    for (const type of F.TYPES) {
      const row = node("div", undefined, "ammo-setting"),
        field = input("Probabilità (%)", "weight-" + type,
          (value.bonusWeights ?? {})[type] ?? F.DEFAULT_BONUS_WEIGHTS[type], "number");
      field.querySelector("input").setAttribute("aria-label", F.LABELS[type] + " (%)");
      row.append(ammoRounds(type, 1), field);
      bonusPanel.append(row);
    }
    grid.append(bonusPanel);
    const bases = node("section", undefined, "panel");
    bases.append(node("h3", "Punti base"));
    for (const d of ["facile", "media", "difficile"])
      bases.append(input(d, "base-" + d, value.bases[d], "number"));
    grid.append(bases);
    p.append(grid);
    const topics = node("section", undefined, "panel");
    topics.id = "topics";
    topics.append(
      node("h3", "Distribuzione delle domande"),
      node(
        "p",
        "Le quote devono sommare al numero di domande scelto. Le altre domande restano in riserva per sostituzioni e spareggio.",
        "muted",
      ),
    );
    const list = node("div");
    list.id = "quotas";
    topics.append(list);
    p.append(topics);
    drawQuotas(value.quotas);
    $("difficulty").onchange = () => act(rebalance);
    $("question-count").onchange = () => act(rebalance);
    $("question-count").step = "3";
    $("question-count").min = "3";
    $("question-count").max = "99";
    topics.append(btn("Ribilancia quote", rebalance));
    const row = node("div", undefined, "row");
    row.append(
      btn(
        "Salva impostazioni",
        () => {
          const c = readSettings();
          F.prepare(bank.bank, settingsConfig(c));
          let data;
          try {
            data = settingsStore();
          } catch (e) {
            data = { version: 1, profiles: {} };
          }
          data.profiles[selectedBankId] = {
            ...c,
            questionCountConfirmed: true,
          };
          try {
            store.saveSettings(data);
          } catch (e) {
            throw Error("Il browser non consente di salvare le impostazioni.");
          }
          message("Impostazioni salvate per le nuove partite.");
        },
        "primary",
      ),
      btn("Torna alla schermata iniziale", goHome),
    );
    p.append(row);
    showSettingsTab(settingsTab);
  }
  function showSettingsTab(tab) {
    settingsTab = tab;
    for (const [key, selector] of [
      ["general", ".settings-grid"],
      ["topics", "#topics"],
    ]) {
      const el = main.querySelector(selector);
      if (el) el.hidden = key !== tab;
    }
    for (const button of main.querySelectorAll("[data-settings-tab]"))
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.settingsTab === tab),
      );
  }

  function drawQuotas(quotas) {
    const list = $("quotas"),
      filter = $("difficulty").value;
    list.replaceChildren();
    main.querySelector(".quota-pages")?.remove();
    const labels = [
      ...new Map(bank.bank.map((q) => [q.topic, q.topicName])),
    ].map(([t, name], i) => {
      const count = bank.bank.filter(
        (q) => q.topic === t && (filter === "misto" || q.difficulty === filter),
      ).length;
      const l = input(
        name + " (" + count + " disponibili)",
        "quota-" + i,
        quotas[t] ?? 0,
        "number",
      );
      l.querySelector("input").dataset.topic = t;
      list.append(l);
      return l;
    });
    let page = 0;
    const nav = node("nav", undefined, "row quota-pages"),
      count = node("span");
    nav.setAttribute("aria-label", "Pagine degli argomenti");
    const show = () => {
      labels.forEach((label, i) => (label.hidden = Math.floor(i / 4) !== page));
      count.textContent = page + 1 + " / " + Math.ceil(labels.length / 4);
      previous.disabled = page === 0;
      next.disabled = page === Math.ceil(labels.length / 4) - 1;
    };
    const previous = btn("←", () => {
        page--;
        show();
      }),
      next = btn("→", () => {
        page++;
        show();
      });
    previous.setAttribute("aria-label", "Argomenti precedenti");
    next.setAttribute("aria-label", "Argomenti successivi");
    nav.append(previous, count, next);
    list.after(nav);
    show();
  }
  function rebalance() {
    const total = number("question-count");
    if (!Number.isInteger(total) || total < 3 || total > 99 || total % 3 !== 0)
      throw Error("Scegli un multiplo di 3 compreso tra 3 e 99");
    drawQuotas(balancedQuotas($("difficulty").value, total));
  }
  function number(id) {
    const x = $(id).value.trim();
    if (x === "") throw Error("Compilare " + id);
    const n = Number(x);
    if (!Number.isFinite(n)) throw Error("Valore numerico non valido: " + id);
    return n;
  }
  function readSettings() {
    return {
      seconds: number("seconds"),
      bonusWeights: Object.fromEntries(
        F.TYPES.map((type) => [type, number("weight-" + type)]),
      ),
      difficulty: $("difficulty").value,
      questionCount: number("question-count"),
      bases: Object.fromEntries(
        ["facile", "media", "difficile"].map((d) => [d, number("base-" + d)]),
      ),
      quotas: Object.fromEntries(
        [...$("quotas").querySelectorAll("input")].map((i) => [
          i.dataset.topic,
          number(i.id),
        ]),
      ),
    };
  }
  function start() {
    game = F.Game.start(prepared);
    ui = "game";
    try {
      preflight(prepared.chosen);
    } catch (e) {
      game = null;
      ui = setupMode;
      renderConfiguration();
      throw e;
    }
    persist();
    renderGame();
  }
  function lives(g) {
    const s = game.s,
      max = s.tieRound > 0 ? 1 : 3,
      count = F.remainingLives(s, s.groups.indexOf(g)),
      row = node("span", undefined, "lives");
    row.setAttribute("role", "img");
    row.setAttribute(
      "aria-label",
      count + " " + (count === 1 ? "vita" : "vite") + " su " + max,
    );
    row.title =
      max === 1
        ? "Spareggio: un errore o il tempo scaduto eliminano."
        : count + " vite su 3 · ogni sanzione o Flagello toglie un cuore";
    for (let i = 0; i < max; i++) {
      const heart = node(
        "span",
        undefined,
        "heart" + (i >= count ? " lost" : ""),
      );
      heart.setAttribute("aria-hidden", "true");
      row.append(heart);
    }
    return row;
  }
  const QUANTITIES = {
    temperatura_equilibrio: [
      ["T", "temperatura termodinamica", "kelvin (K)"],
      ["t_C", "temperatura Celsius", "gradi Celsius (°C)"],
      ["t_F", "temperatura Fahrenheit", "gradi Fahrenheit (°F)"],
    ],
    energia_interna_calore: [
      ["Q", "energia trasferita come calore", "joule (J)"],
      ["m", "massa", "chilogrammi (kg)"],
      ["c", "calore specifico", "J/(kg·K)"],
      ["C", "capacità termica", "J/K"],
      [
        "ΔT",
        "variazione di temperatura",
        "kelvin (K) o gradi Celsius (°C) per una differenza",
      ],
    ],
    bilancio_termico: [
      [
        "Q",
        "calore scambiato: positivo se assorbito, negativo se ceduto",
        "joule (J)",
      ],
      ["m", "massa", "chilogrammi (kg)"],
      ["T", "temperatura", "K oppure °C, secondo i dati"],
      ["c", "calore specifico", "J/(kg·K)"],
    ],
    dilatazione_termica: [
      ["L", "lunghezza finale", "metri (m)"],
      ["L0", "lunghezza iniziale", "metri (m)"],
      ["ΔL", "variazione di lunghezza", "metri (m)"],
      ["α", "coefficiente di dilatazione lineare", "K⁻¹"],
      ["V", "volume finale", "m³"],
      ["V0", "volume iniziale", "m³"],
      ["ΔV", "variazione di volume", "m³"],
      ["β", "coefficiente di dilatazione volumica", "K⁻¹"],
      ["ΔT", "variazione di temperatura", "K oppure °C per una differenza"],
    ],
    passaggi_stato: [
      ["Q", "energia trasferita durante il passaggio di stato", "joule (J)"],
      ["m", "massa", "chilogrammi (kg)"],
      ["Lf", "calore latente specifico di fusione", "J/kg"],
      ["L", "calore latente specifico", "J/kg"],
    ],
    conduzione: [
      [
        "P",
        "potenza termica, energia trasferita per unità di tempo",
        "watt (W)",
      ],
      ["λ", "conducibilità termica", "W/(m·K)"],
      ["A", "area attraversata dal calore", "m²"],
      ["ΔT", "differenza di temperatura tra le superfici", "K"],
      ["s", "spessore della parete nella formula di conduzione", "metri (m)"],
      ["Q", "energia trasferita", "joule (J)"],
      ["t", "durata del trasferimento", "secondi (s)"],
    ],
    irraggiamento: [
      ["P", "potenza emessa o assorbita", "watt (W)"],
      ["A", "area della superficie", "m²"],
    ],
    grafici_piano_cartesiano: [
      ["x", "variabile indipendente (ascissa)", "unità indicate nel problema"],
      ["y", "variabile dipendente (ordinata)", "unità indicate nel problema"],
      [
        "k",
        "costante di proporzionalità",
        "dipende dalle grandezze sugli assi",
      ],
      [
        "b",
        "intercetta della retta, valore di y per x = 0",
        "stessa unità di y",
      ],
      [
        "Δy/Δx",
        "variazione media di y rispetto a x",
        "unità di y divisa per unità di x",
      ],
      ["C", "costo complessivo nel problema dei quaderni", "euro (€)"],
      ["n", "numero di oggetti", "conteggio, senza unità fisica"],
    ],
  };
  function quantityGuide(q) {
    const details = node("details", undefined, "quantity-guide"),
      summary = node("summary", "Grandezze e simboli");
    details.append(
      summary,
      node(
        "p",
        "Una grandezza fisica è una proprietà misurabile di un corpo o di un fenomeno. Il suo valore si esprime con un numero e un’unità di misura, per esempio una lunghezza di 2 m.",
        "muted",
      ),
    );
    const entries = QUANTITIES[q.topic] || [];
    if (entries.length) {
      const list = node("dl");
      for (const [symbol, meaning, unit] of entries) {
        list.append(text("dt", symbol), node("dd", meaning + " · " + unit));
      }
      details.append(list);
    }
    details.append(
      node(
        "p",
        "Δ indica una variazione (valore finale meno valore iniziale); un pedice identifica un corpo, uno stato iniziale o una particolare grandezza. Le unità dei dati vanno rese coerenti prima del calcolo.",
        "muted",
      ),
    );
    return details;
  }
  function reviewEntries() {
    if (!game) return [];
    return game.s.events
      .filter((e) => e.outcome && e.question)
      .filter(
        (e) => game.s.screen !== "result" || e.outcome.id !== game.s.result?.id,
      );
  }
  function showPreviousQuestion() {
    const entries = reviewEntries();
    if (!entries.length) {
      message(
        "Non ci sono domande precedenti da rivedere in questo salvataggio.",
      );
      return;
    }
    if (game.running) game.pause("consultazione domanda precedente");
    persist();
    let index = entries.length - 1;
    const draw = () => {
      dialog(
        "Domanda precedente · " + (index + 1) + " / " + entries.length,
        (d) => {
          d.dataset.passive = "review";
          const entry = entries[index],
            q = entry.question,
            r = entry.outcome;
          d.append(
            node(
              "p",
              game.s.groups[r.respondent].name +
                " · " +
                (r.correct
                  ? "Risposta corretta"
                  : "Risposta errata / tempo scaduto"),
              "muted",
            ),
            text("p", q.body, "question"),
          );
          q.options.forEach((option, i) => {
            const line = text(
              "p",
              "ABCD"[i] +
                ". " +
                option +
                (i === r.option ? " · RISPOSTA SCELTA" : "") +
                (i === q.correct ? " · CORRETTA" : ""),
              "review-answer" +
                (i === r.option ? " selected" : "") +
                (i === q.correct ? " correct" : ""),
            );
            d.append(line);
          });
          if (r.option === null)
            d.append(node("p", "Nessuna risposta scelta: tempo scaduto."));
          d.append(text("p", q.explanation, "help"));
          const nav = node("div", undefined, "row");
          nav.append(
            btn(
              "← Precedente",
              () => {
                index--;
                draw();
              },
              "",
              index === 0,
            ),
            btn(
              "Successiva →",
              () => {
                index++;
                draw();
              },
              "",
              index === entries.length - 1,
            ),
            btn(
              "Torna alla partita",
              () => {
                closeDialog();
                changed();
              },
              "primary",
            ),
          );
          d.append(
            nav,
            node(
              "p",
              "Consultazione: punti, Ammo e turni restano invariati. Il timer rimane in pausa.",
              "muted",
            ),
          );
        },
      );
    };
    draw();
  }
  function showShortcuts() {
    if (game?.running) {
      game.pause("scorciatoie");
      persist();
    }
    dialog("Scorciatoie da tastiera", (d) => {
      d.dataset.passive = "help";
      const list = node("dl", undefined, "shortcut-list");
      for (const [keys, action] of [
        ["Invio", "Svela la domanda / prossima domanda"],
        ["A · B · C · D", "Scegli la risposta"],
        ["P", "Pausa / riprendi timer"],
        ["I", "Inventario"],
        ["S", "Sanzioni"],
        ["V", "Riassegna punti"],
        ["L", "Sospendi / riprendi sessione"],
        ["←", "Rivedi la domanda precedente"],
        ["O", "Apri / chiudi Opzioni"],
        ["K", "Salva"],
        ["F", "Schermo intero"],
        ["H", "Torna alla schermata iniziale"],
        ["F1 / ?", "Mostra questa guida"],
        ["Tab / Maiusc+Tab", "Sposta il focus tra i comandi"],
        ["Invio / Spazio", "Attiva il comando selezionato"],
        ["Esc", "Chiudi guida, consultazione o inventario"],
      ])
        list.append(node("dt", keys), node("dd", action));
      d.append(
        list,
        node(
          "p",
          "Le scorciatoie rispettano timer, pause e pannelli aperti. Durante la scrittura nei campi non vengono attivate. Nei pannelli decisionali usa Tab e Invio per confermare o annullare.",
          "muted",
        ),
        btn("Chiudi", () => {
          closeDialog();
          if (game) changed();
        }),
      );
    });
  }
  function ammoImpact(s) {
    // Solo gli eventi del turno attuale: nessuna notifica storica ripetuta.
    const event = [...s.events].reverse().find(e => e.turn === s.turn &&
      (e.activation || ["aura-block", "karma-trigger", "spoiler-pass", "turn-skipped"].includes(e.type)));
    if (!event) return null;
    const name = index => s.groups[index]?.name ?? "Giocatore";
    const ammo = event.copy?.type;
    let description = "";
    if (event.type === "aura-block")
      description = name(event.target) + ": Sigillo ha bloccato " + F.LABELS[event.ammo];
    else if (event.type === "karma-trigger")
      description = name(event.target) + ": Contrappasso diventa " + F.LABELS[event.ammo];
    else if (event.type === "spoiler-pass")
      description = name(event.target) + ": riceve la domanda con Malocchio";
    else if (event.type === "turn-skipped")
      description = name(event.target) + ": turno saltato per Catene";
    else if (ammo === "salta")
      description = name(event.target) + ": Catene, salterà il prossimo turno";
    else if (ammo === "ruba")
      description = name(event.target) + ": Tributo, prossimo guadagno condiviso";
    else if (ammo === "svela")
      description = name(event.source) + ": Malocchio, scelta del destinatario";
    else if (ammo === "aura")
      description = name(event.source) + ": Sigillo protettiva attivata";
    else if (ammo === "marx")
      description = "Tutti: Livella redistribuisce i punti";
    else if (ammo === "ira")
      description = "Tutti: Flagello toglie una vita";
    if (!description) return null;
    const panel = node("section", undefined, "ammo-impact");
    panel.setAttribute("aria-label", "Ultimo effetto Ammo");
    panel.append(node("strong", "EFFETTO AMMO"), node("p", description));
    return panel;
  }
  function turnOrder() {
    const s = game.s,
      grid = node("nav", undefined, "turn-order");
    grid.setAttribute("aria-label", "Turnazione");
    const pos = Math.max(0, s.order.indexOf(s.respondent));
    const order = [...new Set([
      s.respondent,
      ...s.order.slice(pos),
      ...s.order.slice(0, pos),
      ...s.groups.map((_, i) => i),
    ])];
    const list = node("ol");
    for (const i of order) {
      const g = s.groups[i],
        item = node("li"),
        button = btn("", () => showInventory(i)),
        stats = node("span", undefined, "turn-stats"),
        count = F.remainingLives(s, i);
      button.dataset.team = String(i);
      button.setAttribute("aria-label",
        g.name + " · " + F.formatScore(g.score) + " punti · " + count +
        (count === 1 ? " vita" : " vite") +
        (g.out ? " · eliminato" : "") + " · Apri inventario");
      if (i === s.respondent) button.setAttribute("aria-current", "step");
      stats.append(node("strong", F.formatScore(g.score) + " pt", "player-points"), lives(g));
      button.append(node("span", g.name, "turn-name"), stats);
      const effects = s.effects.filter(e => e.target === i);
      if (effects.length || g.aura !== null) {
        const statuses = node("span", undefined, "active-ammo-effects");
        for (const effect of effects) {
          const label = effect.type === "salta"
            ? "Catene: prossimo turno saltato"
            : "Tributo: prossimi punti condivisi";
          const status = node("span", label, "effect-chip");
          status.title = label + " · da " + s.groups[effect.source].name;
          statuses.append(status);
        }
        if (g.aura !== null)
          statuses.append(node("span", "Sigillo: attiva", "effect-chip shielded"));
        button.append(statuses);
      }
      item.append(button);
      list.append(item);
    }
    grid.append(list);
    const impact = ammoImpact(s);
    if (impact) grid.append(impact);
    return grid;
  }
  function optionsToggle() {
    return btn("Opzioni", showOptions, "options-toggle");
  }
  function showOptions() {
    const s = game.s,
      wasRunning = game.running;
    if (wasRunning) game.pause("opzioni");
    persist();
    dialog("Opzioni", (d) => {
      d.dataset.passive = "options";
      const bar = node("div", undefined, "options-grid");
      if (s.phase !== "conclusa" && !s.suspended) {
        if (s.screen === "answer")
          bar.append(btn(wasRunning ? "Pausa" : "Riprendi timer", () => {
            closeDialog();
            if (!wasRunning && !fitBlocked) game.resume(s.revision);
            changed();
          }));
        bar.append(
          btn("Sanzioni", command(() => {
            game.openSanctions();
            showSanctions();
          })),
          btn("Riassegna punti", showScoreAdjustment, "", s.phase !== "ordinaria"),
          btn("Sospendi la gara", command(() => {
            closeDialog();
            game.bell();
          })),
        );
      } else if (s.suspended)
        bar.append(btn("Riprendi la sessione", command(() => {
          closeDialog();
          game.continueSession();
        })));
      bar.append(
        btn("Domanda precedente", showPreviousQuestion, "", !reviewEntries().length),
        btn("Scorciatoie da tastiera", showShortcuts),
        btn("Salva", saveBrowser),
        fullscreenButton(),
        btn("Regole", showRules),
        btn("Torna alla home", goHome),
      );
      d.append(bar, btn("Chiudi", closePassiveDialog, "primary"));
    });
    passiveReturn = resumeAfterModal(wasRunning);
  }

  const POSITIVE = "#ffe600";

  function ammoRounds(type, count, onSelect = null) {
    const rounds = node("span", undefined, "ammo-rounds");
    rounds.setAttribute("role", "group");
    rounds.setAttribute("aria-label", F.LABELS[type] + ": " + count + " munizioni");
    for (let n = 0; n < count; n++) {
      const round = btn("", () => onSelect ? onSelect(n) : showAmmoInfo(type), "ammo-round");
      round.dataset.ammo = type;
      round.title = F.LABELS[type];
      round.setAttribute("aria-label", F.LABELS[type]);
      round.setAttribute("aria-haspopup", "dialog");
      rounds.append(round);
    }
    return rounds;
  }
  function canUseAmmo(copy, team) {
    if (!game || !copy) return false;
    const s = game.s;
    return team === s.owner && team === s.respondent && !s.groups[team].out &&
      s.phase === "ordinaria" && ["hidden", "answer"].includes(s.screen) &&
      !(s.screen === "answer" && s.paused && !inventoryCanResume) &&
      copy.type !== "karma" && !(copy.type === "svela" && s.screen !== "hidden") &&
      (copy.target === null || !s.groups[copy.target].out) &&
      s.groups[team].inventory.some(c => c.id === copy.id);
  }
  function showAmmoInfo(type, copy = null, team = null) {
    $("ammo-info")?.remove();
    const source = document.activeElement,
      d = node("dialog", undefined, "ammo-info"),
      title = node("h2", F.LABELS[type]),
      icon = node("span", undefined, "ammo-round ammo-detail-art");
    d.id = "ammo-info";
    title.id = "ammo-info-title";
    d.setAttribute("aria-labelledby", title.id);
    icon.dataset.ammo = type;
    icon.setAttribute("aria-hidden", "true");
    const close = () => { d.close(); d.remove(); if (source?.isConnected) source.focus({preventScroll:true}); };
    d.append(icon, title, node("p", F.AMMO_HELP[type], "ammo-description"));
    if (copy?.target !== null && copy?.target !== undefined)
      d.append(node("p", "Vincolata contro " + game.s.groups[copy.target].name +
        (game.s.groups[copy.target].out ? " (eliminato)" : ""), "muted"));
    const controls = node("div", undefined, "row");
    if (copy) controls.append(btn("Usa", () => {
      if (!canUseAmmo(copy, team)) return;
      close();
      selectBonus(copy);
    }, "primary", !canUseAmmo(copy, team)));
    controls.append(btn("Chiudi", close));
    d.append(controls);
    d.addEventListener("cancel", e => { e.preventDefault(); close(); });
    document.body.append(d);
    d.showModal();
    d.querySelector("button:not(:disabled)")?.focus();
  }
  function awardedBonuses(result) {
    return result.bonuses ?? (result.bonus ? [result.bonus] : []);
  }
  function feedbackState() {
    return game ? { game, result: game.s.result?.id } : null;
  }
  function cinematicActive() {
    return ui === "game" && !!game && (main.classList.contains("showing-movement") ||
      main.querySelector('.hell-race[data-animation-busy="true"]') !== null);
  }
  function syncCinematic() {
    const active = cinematicActive();
    document.body.classList.toggle("showing-cinematic", active);
    if (active && game.running) {
      cinematicPause = {game, question:game.s.current?.id};
      game.pause("animazione");
      persist();
      updateTimeVial();
    } else if (!active && cinematicPause) {
      const held = cinematicPause;
      cinematicPause = null;
      if (held.game === game && game.s.current?.id === held.question &&
          game.s.screen === "answer" && game.s.paused && game.s.pauseReason === "animazione" &&
          !game.s.panel && !game.s.suspended && !fitBlocked) {
        game.resume(game.s.revision);
        changed();
      }
    }
  }
  function gameStage(state, final = false) {
    const stage = FoolHellRace.createStage(state, final);
    stage.addEventListener("foolanimationchange", () => {
      if (stage.isConnected) syncCinematic();
    });
    return stage;
  }
  function cancelFeedback() {
    feedbackEpoch++;
    main.classList.remove("showing-movement");
    document.body.classList.remove("showing-cinematic");
    main.querySelector(".movement-cue")?.remove();
  }
  async function animateOutcome(before) {
    const r = game?.s.result;
    if (!before || before.game !== game || !r || r.id === before.result) return;
    const epoch = feedbackEpoch;
    // Leave the final portal/capture cinematic unobstructed.
    if (game.s.phase === "conclusa") return;
    main.classList.add("showing-movement");
    const cue = node("div", r.option === null ? "TEMPO SCADUTO" :
      r.correct ? "RISPOSTA CORRETTA" : "RISPOSTA ERRATA", "movement-cue");
    cue.dataset.outcome = r.correct ? "correct" : "incorrect";
    cue.setAttribute("role", "status");
    cue.setAttribute("aria-live", "polite");
    main.append(cue);
    syncCinematic();

    await new Promise((resolve) =>
      setTimeout(
        resolve,
        matchMedia("(prefers-reduced-motion: reduce)").matches ? 400 : 1650,
      ),
    );
    if (
      epoch !== feedbackEpoch ||
      before.game !== game ||
      game.s.result?.id !== r.id
    )
      return;
    main.classList.remove("showing-movement");
    cue.remove();
    syncCinematic();
    main
      .querySelector('[data-game-action="next"]')
      ?.focus({ preventScroll: true });
  }

  function questionPoints() {
    return node(
      "p",
      game.s.phase === "ordinaria"
        ? game.s.config.bases[game.s.current.difficulty] + " punti"
        : "Spareggio a eliminazione",
      "question-points",
    );
  }
  function endScreen() {
    const s = game.s,
      b = node("section", undefined, "ending"),
      title = node("h2", undefined, "final-title");
    title.tabIndex = -1;
    const art = s.winner === null ? node("img") : node("span", "VITTORIA", "victory-wordmark");
    if(s.winner===null){
      art.className="end-wordmark";art.src="assets/game-over.png";art.alt="GAME OVER";
      art.setAttribute("fetchpriority","high");
    }else b.classList.add("victory");
    if (s.winner !== null)
      title.append(node("span", s.groups[s.winner].name, "winner-name"));
    title.append(art);
    const stage = gameStage(s, true);
    stage.addEventListener("foolendingcomplete", () => requestAnimationFrame(() => title.focus({ preventScroll: true })));
    b.append(title, stage);
    if (s.result && s.current && s.result.question === s.current.id) {
      const r = s.result,
        summary = node("div", undefined, "final-answer");
      summary.append(
        r.option === null
          ? node(
              "p",
              "Ultima domanda: nessuna risposta scelta (tempo scaduto).",
              "chosen-answer",
            )
          : text(
              "p",
              "Ultima risposta scelta " +
                "ABCD"[r.option] +
                ": " +
                s.current.options[r.option],
              "chosen-answer",
            ),
        text(
          "p",
          "Risposta corretta " +
            "ABCD"[s.current.correct] +
            ": " +
            s.current.options[s.current.correct],
        ),
      );
      b.append(summary);
    }
    const controls = node("div", undefined, "row");
    controls.append(btn("Torna alla schermata iniziale", goHome, "primary"));
    b.append(controls, optionsToggle());
    return b;
  }
  function gameBody() {
    const s = game.s,
      revision = s.revision,
      b = node(
        "section",
        undefined,
        "operation-body" + (s.screen === "hidden" ? " hidden-question" : ""),
      );
    if (s.suspended) {
      b.append(
        node("h2", "Partita sospesa"),
        node(
          "p",
          "Riprenderete con gli stessi giocatori e lo stesso stato. Il timer resta fermo.",
        ),
        btn(
          "Riprendi la sessione",
          command(() => game.continueSession()),
          "primary",
        ),
      );
      return b;
    }
    if (s.screen === "supply") {
      b.append(
        node("h2", "Riserva esaurita"),
        node(
          "p",
          "La partita resta salvata. Controlla se sono state aggiunte nuove domande sul sito: punti e turni restano invariati.",
        ),
        btn("Cerca nuove domande", refreshSupply, "primary"),
      );
      return b;
    }
    if (s.screen === "hidden") {
      b.append(
        node(
          "div",
          s.phase === "pareggio"
            ? "Spareggio · Giro " +
                s.tieRound +
                " · " +
                (s.tieIndex < 0 ? 1 : s.tieIndex + 1) +
                "/" +
                s.tieOrder.length
            : "Domanda " +
                (s.valid + 1) +
                " di " +
                (s.config.questionCount ?? 33),
          "eyebrow",
        ),
        questionActions(),
      );
      return b;
    }
    if (s.current) {
      b.append(questionPoints());
      if (s.screen === "hidden" && s.phase === "ordinaria")
        b.append(btn("Inventario", showInventory, "bonus-action"));
      b.append(text("div", s.current.body, "question"));
      const answers = node("div", undefined, "answers");
      s.current.options.forEach((a, i) => {
        const ab = btn(
          "",
          command(() => game.answer(i, revision)),
          "answer" +
            (s.result && i === s.current.correct ? " correct" : "") +
            (s.result && i === s.result.option ? " selected" : ""),
          s.screen !== "answer" || s.paused || !!s.panel || fitBlocked,
        );
        ab.setAttribute("aria-keyshortcuts", "ABCD"[i]);
        if (s.result && i === s.result.option)
          ab.setAttribute(
            "aria-label",
            "Risposta scelta " + "ABCD"[i] + ": " + a,
          );
        ab.append(node("span", "ABCD"[i], "letter"), text("span", a));
        answers.append(ab);
      });
      b.append(answers);
    }
    if (s.screen === "choice") {
      b.append(
        node(
          "p",
          "Malocchio: scegli a timer fermo. Il tempo intero parte alla conferma.",
          "good",
        ),
      );
      const row = node("div", undefined, "row");
      s.groups.forEach((g, i) => {
        if (
          !g.out &&
          (i === s.owner || s.passLock === null || s.passLock === i)
        )
          row.append(
            btn(
              i === s.owner ? "Tieni la domanda" : "Passa a " + g.name,
              command(() => game.pass(i, revision)),
            ),
          );
      });
      b.append(row);
    }
    if (s.screen === "answer" && !s.paused)
      b.append(
        node(
          "p",
          "Tastiera: A–D risposta · P pausa · F1 guida.",
          "muted keyboard-hint",
        ),
      );
    if (s.screen === "result")
      b.append(
        node(
          "p",
          "Tastiera: Invio prossima · ← precedente · F1 guida.",
          "muted keyboard-hint",
        ),
      );
    if (s.screen === "answer" && s.paused)
      b.append(
        node(
          "p",
          "IN PAUSA — risposte bloccate. Riprendi dal tempo residuo.",
          "good",
        ),
      );
    if (s.screen === "result") {
      const r = s.result,
        ex = node("div", undefined, "solution");
      if (r.option === null)
        ex.append(node("p", "Tempo scaduto.", "chosen-answer"));
      ex.append(
        node(
          "strong",
          r.correct ? "Risposta corretta" : "Risposta errata / tempo scaduto",
          r.correct ? "good" : "bad",
        ),
        text("p", s.current.explanation),
      );
      if (r.base)
        ex.append(
          node(
            "p",
            F.formatScore(r.gross) +
              " pt" +
              (r.beneficiaries.length
                ? " · quota " +
                  F.formatScore(r.share) +
                  " a " +
                  [r.respondent, ...r.beneficiaries]
                    .map((i) => s.groups[i].name)
                    .join(", ")
                : ""),
          ),
        );
      const won = awardedBonuses(r);
      if (won.length) {
        const rewards = node("p", undefined, "ammo-rewards");
        rewards.append(node("span", "Ammo ottenute:", "good"));
        for (const copy of won) rewards.append(ammoRounds(copy.type, 1));
        ex.append(rewards);
      }
      b.append(
        ex,
        btn(
          "Prossima domanda",
          command(() => {
            const from = Math.max(
              0,
              Math.min(1, game.left() / (game.s.config.seconds * 1000)),
            );
            game.next(revision);
            if (game.s.current) preflight([game.s.current]);
            vialRefillFrom =
              game.s.screen === "hidden" && game.s.phase !== "conclusa"
                ? from
                : null;
          }),
          "primary",
        ),
      );
    }
    return b;
  }
  function renderGame() {
    cancelFeedback();
    if (!game) return;
    ui = "game";
    const s = game.s,
      revision = s.revision;
    document.body.classList.add("playing");
    document.body.classList.toggle("finished", s.phase === "conclusa");
    if (s.phase === "conclusa") {
      closeDialog();
      fitBlocked = false;
      $("fit-warning").hidden = true;
      main.className = "final-screen";
      main.replaceChildren(endScreen());
      syncCinematic();
      if (lastFinalGame !== s.id) {
        lastFinalGame = s.id;
        requestAnimationFrame(() => {
          main.querySelector(".final-title")?.focus({ preventScroll: true });
        });
      }
      return;
    }
    main.className = "operational";
    const stage = gameStage(s);
    main.replaceChildren(stage, turnOrder());
    const status = node("div", undefined, "statusline");
    status.append(timeVial());
    main.append(status);
    updateTimeVial();
    if (vialRefillFrom !== null) {
      const from = vialRefillFrom;
      vialRefillFrom = null;
      animateVialRefill(from);
    }
    const body = gameBody();
    if (s.owner !== s.respondent)
      body.prepend(node(
        "p",
        "Titolare: " + s.groups[s.owner].name + " · risponde: " + s.groups[s.respondent].name,
        "owner-status",
      ));
    if (s.suspendAfter)
      body.append(node("p", "Sospensione al termine della domanda.", "muted"));
    main.append(body, optionsToggle());
    syncCinematic();
    if (s.draftBonus && !$("dialog").open) {
      inventoryCanResume = false;
      const c = s.groups[s.owner].inventory.find(
        (c) => c.id === s.draftBonus.copyId,
      );
      if (c) selectBonus(c);
    }
    if (s.panel?.type === "sanctions" && !$("dialog").open) showSanctions();
    requestAnimationFrame(checkFit);
  }
  let rulesPages = null;
  async function showRules() {
    if (game?.running) game.pause("regole");
    persist();
    if (!rulesPages) {
      const raw = await fetchSiteText("Fool_regole.html");
      const parsed = new DOMParser().parseFromString(raw, "text/html");
      rulesPages = [...parsed.querySelectorAll(".slide")];
      if (!rulesPages.length) {
        rulesPages = null;
        throw Error("Regole non disponibili.");
      }
    }
    let page = 0;
    dialog("Regole", (d) => {
      d.dataset.passive = "rules";
      const choose = select(
          "Sezione",
          "rules-section",
          rulesPages.map((el, i) => [
            i,
            el.querySelector("h2")?.textContent || String(i + 1),
          ]),
          0,
        ),
        content = node("section", undefined, "rules-content"),
        nav = node("div", undefined, "row");
      const draw = () => {
        const copy = rulesPages[page].cloneNode(true);
        copy.className = "rules-page";
        copy.removeAttribute("tabindex");
        content.replaceChildren(copy);
        content.scrollTop = 0;
        choose.querySelector("select").value = String(page);
        prev.disabled = page === 0;
        next.disabled = page === rulesPages.length - 1;
      };
      const prev = btn("Precedente", () => {
          page--;
          draw();
        }),
        next = btn("Successiva", () => {
          page++;
          draw();
        });
      choose.querySelector("select").onchange = () => {
        page = Number(choose.querySelector("select").value);
        draw();
      };
      nav.append(
        prev,
        next,
        btn(
          "Torna alla partita",
          () => {
            closeDialog();
            changed();
          },
          "primary",
        ),
      );
      d.append(choose, content, nav);
      draw();
    });
  }
  function questionActions() {
    const row = node("div", undefined, "row question-actions");
    if (game.s.phase === "ordinaria")
      row.append(btn("Inventario", showInventory, "bonus-action"));
    row.append(btn("Svela e avvia il tempo", revealQuestion, "primary"));
    return row;
  }
  function revealQuestion() {
    if (
      !game ||
      game.s.screen !== "hidden" ||
      game.s.suspended ||
      game.s.panel ||
      $("dialog").open
    )
      return;
    const revision = game.s.revision;
    assertFits(game.s.current);
    game.reveal(revision);
    changed();
  }
  function showScoreAdjustment() {
    if (
      !game ||
      game.s.phase !== "ordinaria" ||
      game.s.suspended ||
      game.s.panel
    )
      return;
    if (game.running) game.pause("correzione punti");
    persist();
    changed();
    if (game.s.phase !== "ordinaria") return;
    const revision = game.s.revision;
    let applied = false;
    dialog("Riassegna punti", (d) => {
      d.append(
        node(
          "p",
          "Correggi il punteggio di un dannato. La modifica riguarda soltanto i punti: Ammo e sanzioni restano invariate.",
        ),
      );
      const team = select(
        "Giocatore",
        "score-team",
        game.s.groups.map((g, i) => [i, g.name]),
        game.s.respondent,
      );
      const amount = node("div"),
        label = node("label", "Punteggio totale"),
        controls = node("div", undefined, "score-stepper"),
        field = node("input");
      field.id = "score-total";
      field.type = "text";
      field.inputMode = "decimal";
      field.maxLength = 620;
      label.htmlFor = field.id;
      const preview = node("p", undefined, "score-preview");
      preview.setAttribute("aria-live", "polite");
      let originalScore = null, originalText = "";
      const setField = (score) => {
        originalScore = F.clone(score);
        originalText = F.formatScore(score);
        field.value = originalText;
      };
      const value = () => {
        const raw = field.value.trim();
        if (originalScore && raw === originalText) return F.clone(originalScore);
        if (/^\d{1,300}$/.test(raw)) return F.rational(raw);
        if (/^\d{1,300}\/[1-9]\d{0,299}$/.test(raw)) {
          const [n, d] = raw.split("/");
          return F.rational(n, d);
        }
        if (/^\d{1,150}[.,]\d{1,100}$/.test(raw)) {
          const [whole, decimal] = raw.split(/[.,]/);
          return F.rational(whole + decimal, "1" + "0".repeat(decimal.length));
        }
        throw Error("Inserisci un punteggio non negativo.");
      };
      const draw = () => {
        try {
          const score = value(),
            group = game.s.groups[Number($("score-team").value)];
          preview.textContent =
            "Attuale: " +
            F.formatScore(group.score) +
            " punti → Nuovo totale: " +
            F.formatScore(score) +
            " punti";
          minus.disabled = BigInt(score.n) === 0n;
          plus.disabled = false;
        } catch (e) {
          preview.textContent = e.message;
          minus.disabled = plus.disabled = true;
        }
      };
      const step = (delta) => {
        const current = value(),
          next = F.add(current, F.rational(delta));
        setField(BigInt(next.n) < 0n ? F.rational(0) : next);
        draw();
      };
      // A short click changes one point; a sustained pointer press repeats by ten.
      const makeStepper = (symbol, delta) => {
        let delay = null,
          interval = null,
          repeated = false;
        const stop = () => {
          clearTimeout(delay);
          clearInterval(interval);
          delay = interval = null;
        };
        const button = btn(symbol, () => {
          if (repeated) {
            repeated = false;
            return;
          }
          step(delta);
        });
        button.addEventListener("pointerdown", (event) => {
          if (event.button !== 0 || button.disabled) return;
          stop();
          repeated = false;
          delay = setTimeout(() => {
            repeated = true;
            step(delta * 10);
            interval = setInterval(() => {
              if (button.disabled) {
                stop();
                return;
              }
              step(delta * 10);
            }, 140);
          }, 420);
        });
        for (const eventName of [
          "pointerup",
          "pointercancel",
          "pointerleave",
          "lostpointercapture",
        ])
          button.addEventListener(eventName, stop);
        return button;
      };
      const minus = makeStepper("−", -1),
        plus = makeStepper("+", 1);
      minus.id = "score-minus";
      plus.id = "score-plus";
      minus.setAttribute("aria-label", "Togli un punto");
      plus.setAttribute("aria-label", "Aggiungi un punto");
      controls.append(minus, field, plus);
      amount.append(label, controls);
      d.append(team, amount, preview);
      const load = () => {
        setField(
          game.s.groups[Number($("score-team").value)].score,
        );
        draw();
      };
      team.addEventListener("change", load);
      field.addEventListener("input", draw);
      load();
      d.append(
        btn(
          "Conferma modifica",
          () => {
            if (applied) return;
            game.setScore(Number($("score-team").value), value(), revision);
            applied = true;
            closeDialog();
            changed();
            message("Punteggio corretto e salvato nel browser.");
          },
          "primary",
        ),
        btn("Annulla", () => {
          closeDialog();
          changed();
        }),
      );
    });
  }
  function timeVial() {
    const vial = node("div", undefined, "time-vial");
    vial.id = "timer";
    vial.setAttribute("role", "progressbar");
    vial.setAttribute("aria-label", "Tempo a disposizione");
    vial.setAttribute("aria-valuemin", "0");
    vial.setAttribute("aria-valuemax", "100");
    const interior = node("div", undefined, "vial-interior");
    interior.append(node("div", undefined, "vial-liquid"));
    vial.append(interior);
    return vial;
  }
  function animateVialRefill(from) {
    const vial = $("timer"),
      liquid = vial?.querySelector(".vial-liquid");
    if (!liquid || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    vial.dataset.refilling = "true";
    const animation = liquid.animate(
      [{ width: from * 100 + "%" }, { width: "100%" }],
      { duration: 750, easing: "cubic-bezier(.22,.61,.36,1)" },
    );
    animation.finished
      .then(() => {
        vial.dataset.refilling = "false";
      })
      .catch(() => {});
  }
  function updateTimeVial() {
    const vial = $("timer");
    if (!vial || !game) return;
    const level = Math.max(
      0,
      Math.min(1, game.left() / (game.s.config.seconds * 1000)),
    );
    vial.style.setProperty("--level", String(level));
    vial.dataset.paused = String(!game.running);
    vial.setAttribute("aria-valuenow", String(Math.round(level * 100)));
    vial.setAttribute(
      "aria-valuetext",
      game.s.paused
        ? "In pausa"
        : level <= 0.2
          ? "Tempo quasi esaurito"
          : "Tempo disponibile",
    );
  }

  function dialog(title, build) {
    const d = $("dialog");
    passiveReturn = null;
    delete d.dataset.passive;
    d.replaceChildren(node("h2", title));
    build(d);
    if (!d.open) d.showModal();
    d.querySelector("button,input,select")?.focus();
    return d;
  }
  function closeDialog() {
    passiveReturn = null;
    const d = $("dialog");
    if (d.open) {
      d.close();
      main.tabIndex = -1;
      main.focus({ preventScroll: true });
    }
  }
  function resumeAfterModal(wasRunning) {
    const original = game;
    return () => {
      if (
        wasRunning && game === original && game.s.screen === "answer" &&
        game.s.paused && !game.s.panel && !game.s.draftBonus &&
        !game.s.suspended && !fitBlocked
      ) game.resume(game.s.revision);
    };
  }
  function closePassiveDialog() {
    const resume = passiveReturn;
    closeDialog();
    resume?.();
    if (game) changed();
  }
  function groupsOfInventory(g) {
    const groups = new Map();
    for (const c of g.inventory) {
      const key = c.type + ":" + c.target;
      const a = groups.get(key) || [];
      a.push(c);
      groups.set(key, a);
    }
    return [...groups.values()];
  }
  function showInventory(selectedTeam = game.s.respondent) {
    const s = game.s;
    const wasRunning = game.running;
    inventoryCanResume = wasRunning;
    if (wasRunning) game.pause("inventario");
    persist();
    dialog("Inventario", (d) => {
      d.dataset.passive = "inventory";
      const choose = select(
        "Giocatore",
        "inventory-team",
        s.groups.map((g, i) => [i, g.name]),
        selectedTeam,
      );
      d.append(choose);
      const list = node("div", undefined, "inventory-list");
      d.append(list);
      let page = 0;
      const draw = () => {
        list.replaceChildren();
        const i = Number($("inventory-team").value),
          g = s.groups[i],
          sets = groupsOfInventory(g);
        const start = page * 7,
          entries = node("ul", undefined, "bonus-inventory-list");
        if (sets.length) list.append(entries);
        for (const copies of sets.slice(start, start + 7)) {
          const c = copies[0],
            r = node("li", undefined, "bonus-group");
          r.dataset.bonus = c.type;
          r.append(ammoRounds(c.type, copies.length, index => showAmmoInfo(c.type, copies[index], i)));
          entries.append(r);
        }
        if (!sets.length) list.append(node("p", "Nessuna Ammo posseduta."));
        if (sets.length > 7) {
          const nav = node("div", undefined, "row");
          nav.append(
            btn(
              "Precedenti",
              () => {
                page--;
                draw();
              },
              "",
              page === 0,
            ),
            btn(
              "Successivi",
              () => {
                page++;
                draw();
              },
              "",
              start + 7 >= sets.length,
            ),
          );
          list.append(nav);
        }
      };
      choose.querySelector("select").onchange = () => {
        page = 0;
        draw();
      };
      draw();
      d.append(
        btn("Chiudi", closePassiveDialog),
      );
    });
    passiveReturn = resumeAfterModal(wasRunning);
  }
  function selectBonus(copy) {
    const s = game.s,
      revision = s.revision;
    s.draftBonus = s.draftBonus || { copyId: copy.id, target: null };
    persist();
    dialog("Attiva " + F.LABELS[copy.type], (d) => {
      d.append(node("p", F.AMMO_HELP[copy.type]));
      let target = null;
      if (["salta", "ruba"].includes(copy.type)) {
        const candidates = s.groups
          .map((g, i) => [i, g])
          .filter(
            ([i, g]) =>
              i !== s.owner &&
              !g.out &&
              (copy.target === null || copy.target === i),
          );
        if (!candidates.length) throw Error("Nessun bersaglio valido");
        d.append(
          select(
            "Bersaglio",
            "bonus-target",
            candidates.map(([i, g]) => [i, g.name]),
            s.draftBonus.target ?? candidates[0][0],
          ),
        );
        $("bonus-target").onchange = () => {
          s.draftBonus.target = Number($("bonus-target").value);
          persist();
        };
      }
      if (copy.type === "marx") {
        const active = game.active();
        let total = F.rational(0);
        for (const i of active) total = F.add(total, s.groups[i].score);
        const share = F.rational(
          BigInt(total.n),
          BigInt(total.d) * BigInt(active.length),
        );
        d.append(
          node(
            "p",
            "Livella redistribuisce immediatamente " +
              F.formatScore(total) +
              " punti fra " +
              active.length +
              " giocatori attivi: " +
              F.formatScore(share) +
              " punti ciascuno. I giocatori eliminati restano esclusi.",
          ),
        );
      } else if (copy.type === "ira") {
        const affected = node("ul", undefined, "divine-targets");
        for (const i of game.active()) {
          const before = F.remainingLives(s, i), after = Math.max(0, before - 1);
          affected.append(node("li", s.groups[i].name + ": " + before + " → " + after +
            (after === 0 ? " · eliminazione" : " vite")));
        }
        d.append(affected);
      }
      d.append(node("p", "La conferma consuma una munizione.", "muted"));
      d.append(
        btn(
          "Conferma uso",
          () => {
            if ($("bonus-target")) target = Number($("bonus-target").value);
            const paused = s.paused;
            if (s.screen === "answer" && paused) s.paused = false;
            try {
              game.use(copy.id, target, revision);
            } catch (e) {
              if (paused) s.paused = true;
              throw e;
            }
            if (s.screen === "answer" && paused) {
              if (inventoryCanResume) game.run();
              else {
                s.paused = true;
                s.pauseReason = "ripresa";
              }
            }
            closeDialog();
            changed();
          },
          "primary",
        ),
        btn("Annulla", () => {
          s.draftBonus = null;
          closeDialog();
          changed();
        }),
      );
    });
  }
  function showSanctions() {
    const s = game.s,
      revision = s.revision,
      pending = s.panel;
    dialog("Sanzioni — arbitro infernale", (d) => {
      d.append(
        node(
          "p",
          "Timer fermo. Prepara le sanzioni con + e −, poi conferma l’intervento. Ogni sanzione toglie un cuore, senza sottrarre punti. A zero cuori il giocatore è eliminato.",
        ),
      );
      const grid = node("div", undefined, "columns");
      s.groups.forEach((g, i) => {
        const p = node("section", undefined, "panel");
        p.append(node("h3", g.name + " · " + g.sanctions + "/3"));
        if (g.out) p.append(node("p", "Eliminato"));
        else {
          const max = F.remainingLives(s, i);
          pending.counts[i] = Math.min(pending.counts[i], max);
          p.append(node("p", "Sanzioni da aggiungere", "muted"));
          const stepper = node("div", undefined, "sanction-stepper");
          stepper.setAttribute("role", "group");
          stepper.setAttribute("aria-label", "Sanzioni per " + g.name);
          const value = node("output", String(pending.counts[i]));
          value.id = "sanction-" + i;
          value.setAttribute("aria-live", "polite");
          value.setAttribute(
            "aria-label",
            "Sanzioni da aggiungere a " + g.name,
          );
          const total = node("p", undefined, "sanction-total");
          total.setAttribute("aria-live", "polite");
          const draw = () => {
            value.textContent = String(pending.counts[i]);
            less.disabled = pending.counts[i] === 0;
            more.disabled = pending.counts[i] === max;
            const n = g.sanctions + pending.counts[i];
            total.textContent =
              "Totale dopo conferma: " +
              n +
              "/3" +
              (pending.counts[i] === max ? " · Eliminazione" : "") +
              " · Vite: " + Math.max(0, max - pending.counts[i]);
          };
          const change = (delta) => {
            pending.counts[i] = Math.max(
              0,
              Math.min(max, pending.counts[i] + delta),
            );
            draw();
            persist();
          };
          const less = btn("−", () => change(-1));
          less.id = "sanction-minus-" + i;
          less.setAttribute("aria-label", "Diminuisci sanzioni per " + g.name);
          const more = btn("+", () => change(1));
          more.id = "sanction-plus-" + i;
          more.setAttribute("aria-label", "Aumenta sanzioni per " + g.name);
          stepper.append(less, value, more);
          draw();
          const reason = select(
            "Motivo",
            "reason-" + i,
            [
              ["disturbo", "Disturbo / offese ad altri giocatori"],
              ["suggerimento", "Suggerimenti"],
              ["protesta", "Offese / interruzioni all’arbitro"],
            ],
            pending.reasons[i],
          );
          reason.querySelector("select").onchange = () => {
            pending.reasons[i] = $("reason-" + i).value;
            persist();
          };
          p.append(stepper, total, reason);
        }
        grid.append(p);
      });
      d.append(
        grid,
        btn(
          "Conferma intervento",
          () => {
            game.closeSanctions(true, revision);
            closeDialog();
            changed();
          },
          "primary",
        ),
        btn("Chiudi senza sanzionare", () => {
          game.closeSanctions(false, revision);
          closeDialog();
          changed();
        }),
      );
    });
  }
  async function toggleFullscreen() {
    try {
      if (
        window.parent !== window &&
        window.parent.location.origin === location.origin &&
        window.parent.foolToggleFullscreen
      )
        return window.parent.foolToggleFullscreen();
    } catch (error) {}
    if (
      document.fullscreenElement &&
      typeof document.exitFullscreen === "function"
    )
      return document.exitFullscreen();
    if (typeof document.documentElement.requestFullscreen === "function")
      return document.documentElement.requestFullscreen();
    message(
      "Puoi continuare a giocare in questa finestra: il browser non supporta lo schermo intero.",
    );
  }
  function fullscreenActive() {
    if (document.fullscreenElement) return true;
    try {
      return (
        window.parent !== window &&
        window.parent.location.origin === location.origin &&
        !!window.parent.document.fullscreenElement
      );
    } catch (error) {
      return false;
    }
  }
  function fullscreenLabel() {
    return fullscreenActive() ? "Esci da schermo intero" : "Schermo intero";
  }
  function fullscreenButton() {
    const b = btn(fullscreenLabel(), toggleFullscreen);
    b.dataset.fullscreenToggle = "true";
    return b;
  }
  function updateFullscreenButtons() {
    document.querySelectorAll("[data-fullscreen-toggle]").forEach((b) => {
      b.textContent = fullscreenLabel();
    });
  }
  document.addEventListener("fullscreenchange", updateFullscreenButtons);
  try {
    if (
      window.parent !== window &&
      window.parent.location.origin === location.origin
    )
      window.parent.document.addEventListener(
        "fullscreenchange",
        updateFullscreenButtons,
      );
  } catch (error) {}
  function saveBrowser() {
    if (persist())
      message(
        "Partita salvata. Per riprenderla, apri questo sito nello stesso browser.",
      );
  }
  async function refreshSupply() {
    const currentGame = game;
    const available = await loadCatalog();
    const known = new Map(currentGame.s.bank.map((q) => [q.id, q]));
    const additions = new Map();
    for (const entry of available) {
      const parsed = await loadBank(entry);
      for (const q of parsed.bank) {
        const original = known.get(q.id) || additions.get(q.id);
        if (original) {
          if (JSON.stringify(original) !== JSON.stringify(q))
            throw Error(
              "Una domanda già presente è stata modificata. La partita resta invariata.",
            );
        } else additions.set(q.id, q);
      }
    }
    if (game !== currentGame || game.s.screen !== "supply") return;
    const bank = [...additions.values()].filter(
      (q) =>
        game.s.phase === "pareggio" ||
        (game.s.config.quotas[q.topic] > 0 &&
          (game.s.config.difficulty === "misto" ||
            game.s.config.difficulty === q.difficulty)),
    );
    if (!bank.length)
      throw Error(
        "Non sono ancora disponibili nuove domande per questa partita. Puoi riprovare dopo l’aggiornamento del sito.",
      );
    game.supply({ bank });
    preflight([game.s.current].filter(Boolean));
    changed();
  }
  function restoreGame(raw) {
    const next = store.restore(raw);
    game = next;
    closeDialog();
    changed();
    if (game.s.phase !== "conclusa")
      message("Partita ripristinata. Nessun timer avviato automaticamente.");
  }
  function hasOverflow(root) {
    return (
      [...root.querySelectorAll("*")].some((e) => {
        if (e.closest(".katex-mathml")) return false;
        const scroll = e.closest(".math-scroll");
        if (scroll && scroll !== e) return false;
        const r = e.getBoundingClientRect(),
          style = getComputedStyle(e);
        if (
          style.position === "absolute" ||
          style.display === "none" ||
          (r.width === 0 && r.height === 0)
        )
          return false;
        return r.right > innerWidth + 1 || r.left < -1;
      }) || root.scrollWidth > root.clientWidth + 2
    );
  }
  function fitProbe(q) {
    const oldScreen = game.s.screen,
      oldQ = game.s.current,
      oldResult = game.s.result;
    game.s.current = q;
    game.s.screen = "result";
    game.s.result = {
      correct: true,
      respondent: game.s.respondent,
      base: String(game.s.config.bases[q.difficulty]),
      gross: F.rational(100),
      share: F.rational(100, 3),
      beneficiaries: [(game.s.respondent + 1) % 3, (game.s.respondent + 2) % 3],
      bonus: { type: "svela" },
    };
    main.className = "operational";
    main.replaceChildren(turnOrder(), gameBody(), optionsToggle());
    const fits = !hasOverflow(main);
    game.s.screen = oldScreen;
    game.s.current = oldQ;
    game.s.result = oldResult;
    return fits;
  }
  function assertFits(q) {
    if (!fitProbe(q)) {
      renderGame();
      throw Error(
        "Il quesito " +
          q.id +
          " contiene un elemento troppo largo. Controlla il contenuto prima di proseguire.",
      );
    }
    renderGame();
  }
  function preflight(questions) {
    fitting = true;
    try {
      for (const q of questions)
        if (!fitProbe(q)) {
          renderGame();
          throw Error(
            "Adattamento non idoneo per " +
              q.id +
              ". Controlla il contenuto prima di iniziare.",
          );
        }
      fitBlocked = false;
    } finally {
      fitting = false;
      renderGame();
    }
  }
  function checkFit() {
    if (!game || fitting || ui !== "game" || $("dialog").open) return;
    window.fitFoolViewport?.();
    for (const el of main.querySelectorAll(".math-scroll")) {
      if (el.scrollWidth > el.clientWidth + 1) el.tabIndex = 0;
      else el.removeAttribute("tabindex");
    }
    const operational = !game.s.suspended && game.s.phase !== "conclusa";
    fitBlocked = operational && hasOverflow(main);
    $("fit-warning").hidden = !fitBlocked;
    if (fitBlocked && game.running) {
      game.pause("dimensioni schermo");
      persist();
      renderGame();
    }
  }
  $("fit-warning").append(
    node("h2", "Contenuto da adattare"),
    node(
      "p",
      "Timer fermo: un elemento supera la larghezza disponibile. Controlla il contenuto o ricontrolla il layout prima di riprendere.",
    ),
    fullscreenButton(),
    btn("Ricontrolla", () => {
      fitBlocked = false;
      $("fit-warning").hidden = true;
      renderGame();
    }),
    btn("Salva", saveBrowser),
  );
  $("dialog").addEventListener("cancel", (e) => {
    e.preventDefault();
    if ($("dialog").dataset.passive) {
      closePassiveDialog();
      return;
    }
    message(
      "Usa i pulsanti del pannello per completare o annullare la decisione.",
    );
  });
  window.addEventListener("resize", () => {
    if (ui === "game") requestAnimationFrame(checkFit);
  });
  window.addEventListener("beforeunload", persist);
  // Shortcuts share the same guards and actions as the visible controls.
  document.addEventListener("keydown", (event) => {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey
    )
      return;
    const target = event.target instanceof Element ? event.target : null;
    if (
      target?.closest(
        'input,select,textarea,[contenteditable]:not([contenteditable="false"]),[role="textbox"]',
      )
    )
      return;
    if (cinematicActive()) {
      const key = event.key.toLowerCase();
      if (key === "p" && game?.s.screen === "answer" && game.s.pauseReason === "animazione") {
        event.preventDefault();
        cinematicPause = null;
        game.s.pauseReason = "manuale";
        changed();
      } else if (["enter", " ", "a", "b", "c", "d", "i", "s", "v", "l", "o", "arrowleft", "f1", "?"].includes(key))
        event.preventDefault();
      return;
    }
    if ($("ammo-info")?.open) return;
    const key = event.key.toLowerCase(),
      dialogOpen = $("dialog").open;
    if (target?.closest("summary") && (key === "enter" || key === " ")) return;
    if (dialogOpen) {
      if (key === "o" && $("dialog").dataset.passive === "options") {
        event.preventDefault();
        if (!event.repeat) closePassiveDialog();
        return;
      }
      if (event.repeat && event.key === "Enter") event.preventDefault();
      if (
        $("dialog").dataset.passive === "review" &&
        ["ArrowLeft", "ArrowRight"].includes(event.key)
      ) {
        event.preventDefault();
        if (event.repeat) return;
        const buttons = $("dialog").querySelectorAll(".row button");
        const button = buttons[event.key === "ArrowLeft" ? 0 : 1];
        if (button && !button.disabled) button.click();
      }
      return;
    }
    if (key === "f1" || key === "?") {
      event.preventDefault();
      if (!event.repeat) act(showShortcuts);
      return;
    }
    if (!game || ui !== "game" || main.classList.contains("showing-movement"))
      return;
    const known = [
      "enter",
      "a",
      "b",
      "c",
      "d",
      "p",
      "i",
      "s",
      "v",
      "l",
      "arrowleft",
      "o",
      "k",
      "f",
      "h",
    ];
    if (!known.includes(key)) return;
    if (event.repeat) {
      event.preventDefault();
      return;
    }
    const s = game.s;
    const actions = { f: toggleFullscreen, k: saveBrowser, h: goHome };
    if (actions[key]) {
      event.preventDefault();
      act(actions[key]);
      return;
    }
    if (key === "arrowleft") {
      event.preventDefault();
      if (!s.panel && !s.draftBonus) act(showPreviousQuestion);
      return;
    }
    if (key === "o" && !s.panel && !s.draftBonus) {
      event.preventDefault();
      act(showOptions);
      return;
    }
    if (s.phase === "conclusa" || s.panel || s.draftBonus || fitBlocked) return;
    if (key === "l") {
      event.preventDefault();
      act(command(() => (s.suspended ? game.continueSession() : game.bell())));
      return;
    }
    if (s.suspended) return;
    if (key === "p") {
      event.preventDefault();
      if (s.screen === "answer")
        act(command(() => (s.paused ? game.resume(s.revision) : game.pause())));
      return;
    }
    if (key === "i") {
      event.preventDefault();
      if (s.phase === "ordinaria") act(showInventory);
      return;
    }
    if (key === "s") {
      event.preventDefault();
      act(
        command(() => {
          game.openSanctions();
          showSanctions();
        }),
      );
      return;
    }
    if (key === "v") {
      event.preventDefault();
      if (s.phase === "ordinaria") act(showScoreAdjustment);
      return;
    }
    if (s.paused) return;
    let button;
    if (/^[a-d]$/.test(key) && s.screen === "answer")
      button = main.querySelectorAll(".answer")[key.charCodeAt(0) - 97];
    else if (key === "enter" && ["hidden", "result"].includes(s.screen)) {
      button = main.querySelector(
        s.screen === "hidden"
          ? '[data-game-action="reveal"]'
          : '[data-game-action="next"]',
      );
      if (
        target?.closest('button,a,[role="button"]') !== button &&
        target?.closest('button,a,[role="button"]')
      )
        return;
    }
    if (!button || button.disabled) return;
    event.preventDefault();
    button.click();
  });

  document.addEventListener("foolorientation", () => {
    if (game?.running) {
      game.pause("orientamento schermo");
      persist();
      renderGame();
    }
  });
  setInterval(() => {
    if (!game || ui !== "game") return;
    const old = game.s.screen,
      before = feedbackState();
    game.tick();
    if (old !== game.s.screen) {
      changed();
      act(() => animateOutcome(before));
      return;
    }
    updateTimeVial();
  }, 100);
  setInterval(persist, 3000);
  if (
    !window.HellscapeOffline &&
    (launchParams.get("start") === "1" || launchParams.get("resume") === "1")
  )
    history.replaceState(null, "", location.pathname);
  if (launchParams.get("resume") === "1") {
    try {
      const raw = localSave();
      if (!raw) throw Error("Nessuna partita salvata disponibile.");
      restoreGame(raw);
    } catch (error) {
      act(configure);
      message("Impossibile riprendere la partita salvata. " + error.message);
    }
  } else act(configure);

  /* Fixed 4:3 logical viewport: contain in both orientations. */
  (function () {
    const stage = $("viewport-stage");
    let queued = false;
    function fit() {
      queued = false;
      const v = window.visualViewport,
        w = v?.width || innerWidth,
        h = v?.height || innerHeight;
      const scale = Math.min(w / 1024, h / 768);
      stage.style.transform = "translate(-50%,-50%) scale(" + scale + ")";
      stage.dataset.fitScale = String(scale);
      document.body.classList.remove("portrait");
      for (const d of document.querySelectorAll("dialog[open]")) {
        d.style.maxHeight = Math.max(100, h - 24) + "px";
        d.style.maxWidth = Math.max(100, w - 24) + "px";
        d.style.overflow = "auto";
      }
    }
    function schedule() {
      if (!queued) {
        queued = true;
        requestAnimationFrame(fit);
      }
    }
    window.fitFoolViewport = fit;
    new MutationObserver(schedule).observe(stage, {
      childList: true,
      subtree: true,
    });
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    document.addEventListener("fullscreenchange", schedule);
    fit();
  })();

  window.HellscapeUI = {
    get game() {
      return game;
    },
    set game(value) {
      game = value;
    },
    F,
    changed,
    math,
    renderGame,
    restoreGame,
    showRules,
    goHome,
  };
})();
