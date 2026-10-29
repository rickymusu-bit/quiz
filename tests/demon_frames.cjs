"use strict";
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const K = require("../assets/hell-cerbero.js"),
  M = require("../assets/hell-motion.js");
(async () => {
  const images = await require("./cerbero_assets.cjs")();
  for (const image of Object.values(images)) {
    assert.equal(image.width, K.SOURCE.width);
    assert.equal(image.height, K.SOURCE.height);
  }
  const board = createCanvas(1024, 768),
    ctx = board.getContext("2d");
  ctx.fillStyle = "#171514";
  ctx.fillRect(0, 0, 1024, 768);
  for (let n = 0; n < 16; n++) {
    const canvas = createCanvas(512, 384),
      c = canvas.getContext("2d"),
      distance = (n * M.STRIDE) / 16;
    K.render(
      c,
      { ...M.CHASE, runWeight: 1 },
      { distance, time: distance / M.ROAD_SPEED },
      images,
    );
    const data = c.getImageData(0, 0, 512, 384).data;
    let l = 512,
      r = 0,
      t = 384,
      b = 0,
      count = 0;
    for (let i = 0; i < data.length; i += 4)
      if (data[i + 3] > 24) {
        const x = (i / 4) % 512,
          y = Math.floor(i / 4 / 512);
        l = Math.min(l, x);
        r = Math.max(r, x);
        t = Math.min(t, y);
        b = Math.max(b, y);
        count++;
      }
    assert(
      count > 9000,
      "Every gait sample retains a complete textured creature",
    );
    assert(
      l > 0 && r < 260 && t > 0 && b < 320,
      "Tail, horns and all limbs stay in the chase framing",
    );
    assert(
      r - l > 190 && b - t >= 115,
      "Uniform scale retains the approved creature size",
    );
    ctx.drawImage(canvas, (n % 4) * 256, Math.floor(n / 4) * 192, 256, 192);
  }
  fs.mkdirSync(path.join(__dirname, "../artifacts"), { recursive: true });
  fs.writeFileSync(
    path.join(__dirname, "../artifacts/cerbero-run-contact.png"),
    board.toBuffer("image/png"),
  );
  console.log(
    "PASS: 16 real textured gait samples, native source size, complete silhouettes and chase margins",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
