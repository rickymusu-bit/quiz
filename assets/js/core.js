/* Hellscape: core. Shared by the static site, Node tests and offline export. */
(function (root) {
  "use strict";
  const RULES = "23.0.0",
    VERSION = "2.6.0",
    TYPES = ["salta", "ruba", "svela", "aura", "karma", "marx", "ira", "antisigillo", "sacrificio"];
  const LABELS = {
    salta: "Catene",
    ruba: "Tributo",
    svela: "Malocchio",
    aura: "Sigillo",
    karma: "Contrappasso",
    marx: "Livella",
    ira: "Flagello",
    antisigillo: "Antisigillo",
    sacrificio: "Sacrificio",
  };
  const AMMO_HELP = {
    salta: "Le catene immobilizzano un avversario attivo e gli fanno saltare il prossimo turno ordinario. Più Catene si sommano, una per turno. Se riceve una domanda tramite Malocchio, risponde subito, ma le Catene restano pendenti. Nessuna vita viene tolta.",
    ruba: "Prendi immediatamente il 33% esatto dei punti attuali di un avversario e rinunci subito al turno corrente, senza rispondere alla domanda. Il Sigillo blocca il furto ma non il costo del turno. Contrappasso reagisce al furto non bloccato. Non toglie vite; i punti futuri non vengono condivisi.",
    svela: "Svela soltanto il testo della domanda e il suo valore, senza alternative e a timer fermo. Puoi tenerla o passarla a un altro gruppo attivo: il tempo intero parte alla conferma. Chi risponde correttamente tiene tutti i punti e le Ammo guadagnate; se sbaglia o scade il tempo perde il valore della domanda, fermandosi a zero punti. Chi la riceve non può usare Ammo o ripassarla. La rotazione riparte dal gruppo successivo a chi ha usato Malocchio, rispettando Catene ed eliminazioni.",
    aura: "Attiva il sigillo nel tuo turno per bloccare i nuovi attacchi Catene, Tributo e Malocchio fino al tuo prossimo turno. Non cancella effetti già pendenti, non si accumula e non protegge da Livella, Flagello, Sacrificio, sanzioni o errori.",
    karma: "Contrappasso agisce passivamente: quando subisci un nuovo attacco non bloccato, una copia si trasforma in quell’Ammo, utilizzabile solo contro l’aggressore. Ogni attacco trasforma al massimo una copia. Non reagisce a Livella, Flagello, Antisigillo o Sacrificio.",
    marx: "Livella redistribuisce immediatamente in parti uguali i punti di tutti i dannati ancora in gara, compreso chi la usa. Il totale resta identico anche con frazioni. Non agisce sugli eliminati, non viene bloccata da Sigillo e non attiva Contrappasso.",
    ira: "Flagello travolge contemporaneamente tutti i dannati ancora in gara, compreso chi lo evoca: ciascuno perde una vita, tutte le Ammo in inventario e fino a 666 punti, senza scendere sotto zero. Chi raggiunge zero vite è eliminato. Il Sigillo attivo resta, ma non protegge; Contrappasso non reagisce. Se nessuno sopravvive, è Game Over.",
    antisigillo: "Dissipa immediatamente il Sigillo attivo di un solo avversario. Scegli un dannato ancora in gara e protetto: torna vulnerabile a Catene, Tributo e Malocchio. Non rimuove altri effetti e non toglie punti o vite. Il Sigillo non lo blocca e Contrappasso non reagisce.",
    sacrificio: "Sacrifichi una vita e ottieni immediatamente 777 punti. Si applica solo a te: il Sigillo non protegge e Contrappasso non reagisce. Se era la tua ultima vita sei eliminato comunque, anche dopo aver ricevuto i punti; altrimenti puoi continuare il turno.",
  };
  const DEFAULT_BONUS_WEIGHTS = Object.fromEntries(
    TYPES.map((type) => [type, ["ira", "sacrificio"].includes(type) ? 5 : type === "marx" ? 15 : type === "antisigillo" ? 20 : 30]),
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
    const n = BigInt(a.n), d = BigInt(a.d), negative = n < 0n;
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
