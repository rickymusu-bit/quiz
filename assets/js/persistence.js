/* Storage access is injected: game and settings retain their published keys and JSON. */
(function (root) {
  "use strict";
  function create({ storage, engine, namespace = null }) {
    const key = (name) => (namespace ? namespace + ":" + name : name);
    const read = (name) => storage().getItem(key(name));
    return {
      readGame: () => read("fool-v1"),
      save: (game) =>
        storage().setItem(key("fool-v1"), JSON.stringify(game.snapshot())),
      removeGame: () => storage().removeItem(key("fool-v1")),
      restore: (raw) =>
        engine.Game.restore(JSON.parse(raw.replace(/^\uFEFF/, ""))),
      readSettings: () => read("fool-settings-v1"),
      profiles: () => {
        const raw = read("fool-settings-v1");
        if (!raw) return { version: 1, profiles: {} };
        const data = JSON.parse(raw);
        if (
          data?.version !== 1 ||
          !data.profiles ||
          typeof data.profiles !== "object" ||
          Array.isArray(data.profiles)
        )
          throw Error("Impostazioni salvate non valide");
        return data;
      },
      saveSettings: (data) =>
        storage().setItem(key("fool-settings-v1"), JSON.stringify(data)),
    };
  }
  const api = { create };
  if (typeof module !== "undefined") module.exports = api;
  else root.HellscapePersistence = api;
})(globalThis);
