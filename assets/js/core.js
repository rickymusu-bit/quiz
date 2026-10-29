/* Hellscape: core. Shared by the static site, Node tests and offline export. */
(function (root) {
  "use strict";
  const RULES = "27.0.0",
    VERSION = "3.0.0",
    TYPES = [
      "salta",
      "ruba",
      "svela",
      "aura",
      "karma",
      "marx",
      "ira",
      "arsenico",
      "sacrificio",
    ];
  const LABELS = {
    salta: "Catene",
    ruba: "Tributo",
    svela: "Malocchio",
    aura: "Sigillo",
    karma: "Contrappasso",
    marx: "Livella",
    ira: "Flagello",
    arsenico: "Arsenico",
    sacrificio: "Sacrificio",
  };
  const AMMO_HELP = {
    salta:
      "Paghi l’11% esatto del tuo punteggio corrente, anche se Sigillo blocca l’attacco. Le catene immobilizzano un avversario attivo e gli fanno saltare il prossimo turno ordinario. Più Catene si sommano, una per turno. Se riceve una domanda tramite Malocchio, risponde subito, ma le Catene restano pendenti. Nessuna vita viene tolta.",
    ruba: "Prendi immediatamente il 33% esatto dei punti attuali di un avversario e rinunci subito al turno corrente, senza rispondere alla domanda. Il Sigillo blocca il furto ma non il costo del turno. Non toglie vite; i punti futuri non vengono condivisi.",
    svela:
      "Svela soltanto il testo della domanda e il suo valore, senza alternative. Hai 45 secondi per tenerla o passarla a un altro gruppo attivo; alla scadenza resta a te. Il tempo intero per rispondere parte alla conferma o alla scadenza della scelta. Chi risponde correttamente tiene tutti i punti e le Omen guadagnate; se sbaglia o scade il tempo perde il valore della domanda, fermandosi a zero punti. Chi la riceve non può usare Omen o ripassarla. La rotazione riparte dal gruppo successivo a chi ha usato Malocchio, rispettando Catene ed eliminazioni.",
    aura: "Per 3 turni personali, incluso quello di attivazione, sei immune agli effetti negativi delle Omen altrui. Le Catene, i Tributi e l’Arsenico pendenti su di te vengono rimossi; Livella modifica anche i tuoi punti. Mentre è attivo non puoi usare altre Omen, nemmeno un altro Sigillo, e le risposte corrette danno punti ma nessuna Omen. Flagello e Livella ignorano l’immunità. Non protegge da sanzioni, errori ordinari o costi delle proprie Omen.",
    karma:
      "Attiva Contrappasso su di te: per 3 turni personali, incluso quello di attivazione, ogni risposta corretta vale il doppio dei punti. Se sbagli o scade il tempo perdi il doppio del valore della domanda, senza scendere sotto zero. Non raddoppia le Omen né i punti di altre Omen. Si applica anche alle domande ricevute con Malocchio: la penalità totale resta doppia, non si somma. Non si accumula e non puoi riattivarlo prima della scadenza. Sigillo impedisce di attivarlo ma non annulla il rischio di un Contrappasso già attivo.",
    marx: "Livella redistribuisce immediatamente in parti uguali i punti di tutti i dannati ancora in gara, compreso chi la usa. Il totale resta identico anche con frazioni. Esclude soltanto gli eliminati. Sigillo non protegge dalla redistribuzione.",
    ira: "Flagello travolge contemporaneamente tutti i dannati ancora in gara, compreso chi lo evoca: ciascuno perde una vita, tutte le Omen in inventario e fino a 666 punti, senza scendere sotto zero. Chi raggiunge zero vite è eliminato. Il Sigillo attivo resta, ma non protegge. Se nessuno sopravvive, è Game Over.",
    arsenico:
      "Scegli un avversario e rinunci subito al turno corrente. All’inizio dei suoi prossimi 3 turni personali, anche se saltati per Catene, perde l’11% del punteggio corrente: tre riduzioni composte esatte. Sigillo blocca e rimuove l’effetto. Non si accumula: un bersaglio già avvelenato non può riceverne un altro.",
    sacrificio:
      "Sacrifichi una vita e ottieni immediatamente 777 punti. Si applica solo a te e non è utilizzabile con Sigillo attivo. Se era la tua ultima vita sei eliminato comunque, anche dopo aver ricevuto i punti; altrimenti puoi continuare il turno.",
  };
  const DEFAULT_TURN_COUNT = 13,
    MALOCCHIO_CHOICE_SECONDS = 45;
  const DEFAULT_BASE_POINTS = Object.freeze({
    facile: 111,
    media: 222,
    difficile: 333,
  });
  const DEFAULT_BONUS_WEIGHTS = Object.fromEntries(
    TYPES.map((type) => [
      type,
      ["ira", "sacrificio"].includes(type) ? 5 : type === "marx" ? 15 : 30,
    ]),
  );
  const clone = (x) => JSON.parse(JSON.stringify(x));
  function need(v, m) {
    if (!v) throw Error(m);
  }
  function integer(v, min, max, label) {
    need(
      typeof v === "number" && Number.isSafeInteger(v) && v >= min && v <= max,
      label + " non valido",
    );
    return v;
  }
  function gcd(a, b) {
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a < 0n ? -a : a;
  }
  function rational(n, d = 1n) {
    n = BigInt(n);
    d = BigInt(d);
    need(d > 0n, "Denominatore non positivo");
    const g = gcd(n, d);
    return { n: String(n / g), d: String(d / g) };
  }
  const add = (a, b) =>
    rational(
      BigInt(a.n) * BigInt(b.d) + BigInt(b.n) * BigInt(a.d),
      BigInt(a.d) * BigInt(b.d),
    );
  const compare = (a, b) => {
    const x = BigInt(a.n) * BigInt(b.d) - BigInt(b.n) * BigInt(a.d);
    return x > 0n ? 1 : x < 0n ? -1 : 0;
  };
  const exact = (a) => (a.d === "1" ? a.n : a.n + "/" + a.d);
  // Display only: nearest integer, with half points rounded away from zero.
  // Rational scores stay exact for redistribution, comparisons and saved games.
  function formatScore(a) {
    const n = BigInt(a.n),
      d = BigInt(a.d),
      negative = n < 0n;
    const magnitude = negative ? -n : n;
    const rounded = (magnitude + d / 2n) / d;
    return (negative && rounded ? "-" : "") + String(rounded);
  }
  function remainingLives(s, index) {
    const g = s.groups[index];
    return g.out ? 0 : Math.max(0, 3 - g.sanctions - (g.damage ?? 0));
  }
  function shuffle(a, random) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const api = {
    RULES,
    VERSION,
    TYPES,
    LABELS,
    DEFAULT_BONUS_WEIGHTS,
    DEFAULT_BASE_POINTS,
    DEFAULT_TURN_COUNT,
    MALOCCHIO_CHOICE_SECONDS,
    AMMO_HELP,
    clone,
    need,
    integer,
    rational,
    add,
    compare,
    exact,
    formatScore,
    remainingLives,
    shuffle,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.HellscapeCore = api;
})(globalThis);
