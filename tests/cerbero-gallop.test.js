"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const G = require("../assets/hell-cerbero-gallop.js");
const M = require("../assets/hell-motion.js");
const base = path.join(__dirname, "../assets/hell-race/production/cerbero/run-stabilized-v1");

test("Stabilized artwork is the immutable approved 4x2 atlas", () => {
  const data = JSON.parse(fs.readFileSync(path.join(base, "manifest.json"), "utf8"));
  const atlas = fs.readFileSync(path.join(base, "atlas.png"));
  assert.equal(atlas.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(atlas.readUInt32BE(16), 4 * G.FRAME_WIDTH);
  assert.equal(atlas.readUInt32BE(20), 2 * G.FRAME_HEIGHT);
  assert.equal(data.frames.length, G.COUNT);
  assert.equal(data.frames.reduce((sum, f) => sum + f.duration_ms, 0), 800);
  for (const entry of data.frames) {
    const raw = fs.readFileSync(path.join(base, entry.png));
    const sha = crypto.createHash("sha256").update(raw).digest("hex");
    assert.equal(sha, entry.sha256, entry.png);
  }
  const source = fs.readFileSync(path.join(base, data.source.path));
  assert.equal(crypto.createHash("sha256").update(source).digest("hex"), data.source.sha256);
});

test("Distance controls gait, including wrap and pause, without changing source artwork", () => {
  assert.equal(G.STRIDE, M.ROAD_SPEED * 0.8);
  for (let f = 0; f < G.COUNT; f++) {
    assert.equal(G.index((f + 0.5) * G.STRIDE / G.COUNT), f);
    assert.equal(G.index(G.STRIDE + (f + 0.5) * G.STRIDE / G.COUNT), f);
  }
  assert.equal(G.index(-G.STRIDE / G.COUNT), G.COUNT - 1);
  const paused = G.sample({ left: 9, ground: 290, width: 230 }, { distance: 14, time: 3 });
  assert.deepEqual(G.sample({ left: 9, ground: 290, width: 230 },
    { distance: 14, time: 700 }), paused);
  assert.equal(G.index(NaN), 0);
});

test("Renderer crops whole RGBA poses, never warps rigid body parts or changes input", () => {
  const image = { naturalWidth: 2208, naturalHeight: 1044, complete: true };
  const calls = [];
  const ctx = {
    save() { calls.push(["save"]); },
    restore() { calls.push(["restore"]); },
    drawImage(...args) { calls.push(["drawImage", ...args]); }
  };
  const body = Object.freeze({ left: 10, ground: 303, width: 221 });
  const travel = Object.freeze({ distance: G.STRIDE * 6 / 8, time: 2 });
  const result = G.render(ctx, body, travel, image);
  assert.equal(result.frame, 6);
  assert.deepEqual(result.sourceRect, [1104, 522, 552, 522]);
  assert.deepEqual(calls.map(x => x[0]), ["save", "drawImage", "restore"]);
  assert.equal(calls[1][1], image);
  assert.deepEqual(calls[1].slice(2, 6), result.sourceRect);
  assert.deepEqual(calls[1].slice(6), result.destRect);
  assert.equal(G.ready(image), true);
  assert.equal(G.render(ctx, body, travel, { complete: false }), null);
});
