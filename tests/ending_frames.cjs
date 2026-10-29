"use strict";
const { createCanvas, loadImage } = require("@napi-rs/canvas"),
  vm = require("node:vm"),
  fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
(async () => {
  const root = {
    FoolCerbero: require("../assets/hell-cerbero.js"),
    FoolMotion: require("../assets/hell-motion.js"),
    FoolChase: require("../assets/hell-chase.js"),
    FoolEpilogue: require("../assets/hell-epilogue.js"),
    FoolPortal: require("../assets/hell-portal.js"),
    FoolBridge: require("../assets/hell-bridge.js"),
  };
  const K = root.FoolCerbero,
    images = await require("./cerbero_assets.cjs")(),
    frames = K.prepare(images);
  const render = K.render,
    drawFlame = K.flame;
  root.FoolCerbero = {
    ...K,
    render: (c, d, t) => render(c, d, t, images),
    flame: (c, id, t, h, duration) => drawFlame(c, id, t, h, duration, images),
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, "../assets/hell-ending.js"), "utf8"),
    { globalThis: root, document: { createElement: () => createCanvas(1, 1) } },
  );
  assert.equal(frames.length, 8);
  const board = createCanvas(440 * 4, 330 * 4),
    ctx = board.getContext("2d");
  ctx.fillStyle = "#171514";
  ctx.fillRect(0, 0, board.width, board.height);
  Array.from({ length: 16 }).forEach((_, index) => {
    const canvas = createCanvas(440, 330),
      c = canvas.getContext("2d"),
      d = {
        left: 20,
        ground: 300,
        width: 380,
        runWeight: 0,
        animation: "capture",
        captureTime: K.data.capture.angles[index][0],
      };
    const rig = K.render(c, d, { distance: 0, time: 0 }, images),
      raw = c.getImageData(0, 0, 440, 330).data;
    let left = 440,
      right = 0,
      top = 330,
      bottom = 0,
      count = 0;
    for (let y = 0; y < 330; y++)
      for (let x = 0; x < 440; x++)
        if (raw[(y * 440 + x) * 4 + 3] > 24) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
          count++;
        }
    assert(
      count > 22000,
      "Complete connected creature in every cinematic pose",
    );
    assert(
      left > 0 && right < 439 && top > 0 && bottom < 329,
      "Tail, horns, feet and jaws retain transparent padding",
    );
    for (const point of Object.values(rig.mouths))
      assert(
        point.x >= left &&
          point.x <= right &&
          point.y >= top &&
          point.y <= bottom + 2,
        "Functional anchors remain inside the actual silhouette bounds",
      );
    ctx.drawImage(canvas, (index % 4) * 440, Math.floor(index / 4) * 330);
  });
  fs.mkdirSync(path.join(__dirname, "../artifacts"), { recursive: true });
  fs.writeFileSync(
    path.join(__dirname, "../artifacts/cerbero-ending-contact.png"),
    board.toBuffer("image/png"),
  );
  const flame = createCanvas(240, 240),
    fc = flame.getContext("2d");
  fc.globalAlpha = 0.7;
  const alpha = fc.globalAlpha;
  root.FoolEnding.fireBreath(fc, { x: 120, y: 200 }, 0.6);
  assert.equal(fc.globalAlpha, alpha);
  const fd = fc.getImageData(0, 0, 240, 240).data;
  let top = 240,
    bottom = 0;
  for (let y = 0; y < 240; y++)
    for (let x = 0; x < 240; x++)
      if (fd[(y * 240 + x) * 4 + 3] > 24) {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
  assert(top < 110 && bottom <= 210, "Fire must rise above the mouth");
  fc.clearRect(0, 0, 240, 240);
  root.FoolEnding.fireBreath(fc, { x: 120, y: 200 }, 2);
  assert(!fc.getImageData(0, 0, 240, 240).data.some((v) => v));
  const state = {
    winner: 0,
    respondent: 2,
    groups: [
      { name: "A", out: false },
      { name: "B", out: false },
      { name: "C", out: false },
    ],
  };
  const helper = {
    vehicleIndex: () => 0,
    vehicleSize: () => ({ width: 44, height: 36 }),
    drawVehicle: () => {},
    gate: () => {},
    demonDust: () => {},
    nameTag: () => {
      throw Error("Names must not be drawn during capture or escape");
    },
  };
  const ep = root.FoolEnding.plan(state);
  for (let t = 0; t < ep.duration; t += 0.13)
    root.FoolEnding.render(fc, 512, state, ep, t, helper);
  for (const t of [0.1, 0.8, 1.6, 2.1]) {
    const admitted = [];
    root.FoolEnding.render(
      fc,
      512,
      state,
      ep,
      ep.chaseEnd + require("../assets/hell-epilogue.js").T.openEnd + t / 4,
      {
        ...helper,
        vehicleIndex: (s, i) => i,
        drawVehicle: (ctx, row) => admitted.push(row),
      },
    );
    assert.deepEqual(
      admitted,
      [state.winner],
      "Only the winner can pass the portal",
    );
  }
  fc.clearRect(0, 0, 240, 240);
  root.FoolEnding.fireBreath(
    fc,
    { x: 40, y: 120 },
    0.6,
    { x: 220, y: 120 },
    1.85,
  );
  const jet = fc.getImageData(0, 0, 240, 240).data;
  let right = 0;
  for (let y = 0; y < 240; y++)
    for (let x = 0; x < 240; x++)
      if (jet[(y * 240 + x) * 4 + 3] > 100) right = Math.max(right, x);
  assert(right > 210, "Flamethrower must reach its portal target");
  console.log(
    "PASS: no cinematic player names; 16 complete articulated ending samples; three mouth anchors; upward flame direction, lifetime and canvas isolation",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
