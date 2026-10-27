/* Hellscape: core. Shared by the static site, Node tests and offline export. */
(function (root) {
  "use strict";
  const RULES = "19.2.0",
    VERSION = "2.2.1",
    TYPES = ["salta", "ruba", "svela", "aura", "karma", "marx"];
  const LABELS = {
    salta: "Nope",
    ruba: "Bullo",
    svela: "Spoiler",
    aura: "Aura",
    karma: "Karma",
    marx: "Marx",
  };
  const DEFAULT_BONUS_WEIGHTS = Object.fromEntries(
    TYPES.map((type) => [type, type === "marx" ? 15 : 30]),
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
    return g.out ? 0 : s.tieRound > 0 ? 1 : Math.max(0, 3 - g.sanctions);
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
