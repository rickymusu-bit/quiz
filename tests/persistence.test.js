"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const { create } = require("../assets/js/persistence.js"),
  F = require("../assets/js/engine.js");
const memory = () => {
  const data = new Map();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  };
};
test("Published keys and raw JSON survive save, restore and removal", () => {
  const storage = memory(),
    store = create({
      storage: () => storage,
      engine: { Game: { restore: (s) => s } },
    });
  const saved = { version: "2.2.1", groups: [], remaining: 1234 };
  store.save({ snapshot: () => saved });
  assert.equal(storage.data.get("fool-v1"), JSON.stringify(saved));
  assert.deepEqual(store.restore("\uFEFF" + store.readGame()), saved);
  store.saveSettings({ version: 1, profiles: { termologia: { seconds: 45 } } });
  assert.equal(
    storage.data.get("fool-settings-v1"),
    JSON.stringify(store.profiles()),
  );
  store.removeGame();
  assert.equal(store.readGame(), null);
  assert(store.readSettings());
});
test("Offline game/settings cannot overwrite, resume or delete site saves", () => {
  const storage = memory(),
    site = create({ storage: () => storage, engine: F }),
    offline = create({
      storage: () => storage,
      engine: F,
      namespace: "hellscape-offline-v1",
    });
  site.save({ snapshot: () => ({ site: true }) });
  site.saveSettings({ version: 1, profiles: { site: {} } });
  assert.equal(offline.readGame(), null);
  assert.deepEqual(offline.profiles(), { version: 1, profiles: {} });
  offline.save({ snapshot: () => ({ offline: true }) });
  offline.saveSettings({ version: 1, profiles: { offline: {} } });
  offline.removeGame();
  assert.equal(site.readGame(), '{"site":true}');
  assert.deepEqual(site.profiles().profiles, { site: {} });
});
test("Malformed and unavailable storage is surfaced to UI error handling", () => {
  const storage = memory(),
    store = create({ storage: () => storage, engine: F });
  for (const value of [
    "not-json",
    '{"version":2,"profiles":{}}',
    '{"version":1,"profiles":[]}',
  ]) {
    storage.setItem("fool-settings-v1", value);
    assert.throws(() => store.profiles());
  }
  assert.throws(() => store.restore("not-json"));
  const blocked = create({
    storage: () => {
      throw Error("blocked");
    },
    engine: F,
  });
  assert.throws(() => blocked.readGame(), /blocked/);
  assert.throws(() => blocked.save({}), /blocked/);
});
