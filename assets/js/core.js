/* Hellscape: core. Shared by the static site, Node tests and offline export. */
(function (root) {
  "use strict";
  const RULES = "21.0.0",
    VERSION = "2.4.0",
    TYPES = ["salta", "ruba", "svela", "aura", "karma", "marx", "ira", "antisigillo"];
  const LABELS = {
    salta: "Catene",
    ruba: "Tributo",
    svela: "Malocchio",
    aura: "Sigillo",
    karma: "Contrappasso",
    marx: "Livella",
    ira: "Flagello",
    antisigillo: "Antisigillo",
  };
  const AMMO_HELP = {
    salta: "Le catene immobilizzano un avversario attivo e gli fanno saltare il prossimo turno ordinario. Più Catene si sommano, una per turno. Se riceve una domanda tramite Malocchio, risponde subito, ma le Catene restano pendenti. Nessuna vita viene tolta.",
    ruba: "Esigi un tributo dal prossimo guadagno del bersaglio: dopo una risposta corretta, lui e gli attaccanti distinti si dividono i nuovi punti in parti uguali. Più Tributi dello stesso autore valgono una sola quota. L’effetto finisce anche se il bersaglio sbaglia o scade il tempo.",
    svela: "Scruti soltanto il testo della domanda e il punteggio, senza vedere le quattro alternative, a timer fermo. Puoi affrontarla oppure passarla immediatamente a un altro dannato attivo: il timer intero parte alla conferma. Chi la riceve non può usare Ammo o passarla di nuovo. Le Catene già pendenti sul bersaglio non vengono consumate.",
    aura: "Attiva il sigillo nel tuo turno per bloccare i nuovi attacchi Catene, Tributo e Malocchio fino al tuo prossimo turno. Non cancella effetti già pendenti, non si accumula e non protegge da Livella, Flagello, sanzioni o errori.",
    karma: "Contrappasso agisce passivamente: quando subisci un nuovo attacco non bloccato, una copia si trasforma in quell’Ammo, utilizzabile solo contro l’aggressore. Ogni attacco trasforma al massimo una copia. Non reagisce a Livella, Flagello o Antisigillo.",
    marx: "Livella redistribuisce immediatamente in parti uguali i punti di tutti i dannati ancora in gara, compreso chi la usa. Il totale resta identico anche con frazioni. Non agisce sugli eliminati, non viene bloccata da Sigillo e non attiva Contrappasso.",
    ira: "Flagello travolge contemporaneamente tutti i dannati ancora in gara, compreso chi lo evoca: ciascuno perde una vita, tutte le Ammo in inventario e fino a 666 punti, senza scendere sotto zero. Chi raggiunge zero vite è eliminato. Il Sigillo attivo resta, ma non protegge; Contrappasso non reagisce. Se nessuno sopravvive, è Game Over.",
    antisigillo: "Dissipa immediatamente il Sigillo attivo di un solo avversario. Scegli un dannato ancora in gara e protetto: torna vulnerabile a Catene, Tributo e Malocchio. Non rimuove altri effetti e non toglie punti o vite. Il Sigillo non lo blocca e Contrappasso non reagisce.",
  };
  const DEFAULT_BONUS_WEIGHTS = Object.fromEntries(
    TYPES.map((type) => [type, type === "ira" ? 5 : type === "marx" ? 15 : 30]),
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
