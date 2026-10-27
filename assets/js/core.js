/* Hellscape: core. Shared by the static site, Node tests and offline export. */
(function (root) {
  "use strict";
  const RULES = "20.0.0",
    VERSION = "2.3.0",
    TYPES = ["salta", "ruba", "svela", "aura", "karma", "marx", "ira"];
  const LABELS = {
    salta: "Nope",
    ruba: "Bullo",
    svela: "Spoiler",
    aura: "Aura",
    karma: "Karma",
    marx: "Marx",
    ira: "Ira divina",
  };
  const AMMO_HELP = {
    salta: "Fa saltare a un avversario attivo la sua prossima occasione di risposta. Più salti sullo stesso bersaglio si sommano. Non consuma una domanda valida e non toglie vite.",
    ruba: "Condivide il guadagno della prossima risposta corretta del bersaglio fra lui e tutti i beneficiari distinti, in parti uguali. I punti già accumulati restano invariati. L’effetto termina anche se il bersaglio sbaglia o scade il tempo.",
    svela: "Si usa prima di svelare la domanda. Mostra domanda e alternative a timer fermo: puoi tenerla o passarla a un altro dannato attivo. Il tempo intero parte alla conferma. Chi la riceve non può usare Ammo né passarla di nuovo.",
    aura: "Va attivata nel tuo turno. Blocca i nuovi attacchi Nope, Bullo e Spoiler fino all’inizio del tuo prossimo turno. Non cancella effetti già pendenti e non protegge da Marx, Ira divina, sanzioni o errori.",
    karma: "È passiva: una copia si trasforma quando subisci un nuovo attacco non bloccato, diventando quell’Ammo e restando utilizzabile soltanto contro l’autore. Non si attiva manualmente e non reagisce a Marx o Ira divina.",
    marx: "Redistribuisce subito, in parti uguali, tutti i punti dei dannati ancora in gara, compreso chi la usa. Il totale resta esatto anche con frazioni. Esclude gli eliminati e non viene bloccata da Aura né attiva Karma.",
    ira: "Toglie contemporaneamente una vita a tutti i dannati ancora in gara, compreso chi la usa. Sulla vita ha lo stesso effetto di una sanzione, esteso a tutti. Chi arriva a zero è eliminato; i punti restano invariati. Aura non la blocca e Karma non si trasforma. Se nessuno sopravvive, è Game Over.",
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
  function remainingLives(s, index) {
    const g = s.groups[index];
    return g.out ? 0 : s.tieRound > 0 ? 1 : Math.max(0, 3 - g.sanctions - (g.damage ?? 0));
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
    remainingLives,
    shuffle,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.HellscapeCore = api;
})(globalThis);
