const { createCanvas, loadImage } = require("@napi-rs/canvas"),
  K = require("../assets/hell-cerbero.js"),
  M = require("../assets/hell-motion.js"),
  fs = require("fs"),
  path = require("path"),
  ROOT = path.resolve(__dirname, "..");
(async () => {
  const images = Object.fromEntries(
    await Promise.all(
      K.ASSETS.map(async (p) => [p, await loadImage(path.join(ROOT, p))]),
    ),
  );
  for (const sequence of ["camminata", "morso-lancio", "fiamme"]) {
    const count =
        sequence === "camminata" ? 8 : sequence === "morso-lancio" ? 18 : 16,
      cell = sequence === "fiamme" ? [480, 360] : [360, 300],
      out = createCanvas(cell[0] * 4, cell[1] * Math.ceil(count / 4)),
      c = out.getContext("2d");
    c.fillStyle = "#211a19";
    c.fillRect(0, 0, out.width, out.height);
    for (let i = 0; i < count; i++) {
      c.save();
      c.translate((i % 4) * cell[0], Math.floor(i / 4) * cell[1]);
      let d = {
          left: 20,
          ground: sequence === "fiamme" ? 280 : 240,
          width: sequence === "fiamme" ? 240 : 300,
          runWeight: sequence === "camminata" ? 1 : 0,
        },
        travel = {
          distance: (i / count) * M.STRIDE,
          time: ((i / count) * M.STRIDE) / 48,
        };
      if (sequence === "morso-lancio") {
        d.animation = "capture";
        d.captureTime =
          K.data.capture.angles[Math.min(i, 16)][0] + (i === 17 ? 0.11 : 0);
      }
      if (sequence === "fiamme") {
        d.animation = "fire";
        d.actionTime = (i / count) * 1.65;
        d.time = d.actionTime;
        travel = { time: d.actionTime, distance: 0 };
      }
      const g = K.render(c, d, travel, images);
      if (sequence === "fiamme")
        for (const id of K.heads)
          K.flame(c, id, d.actionTime - 0.2, g.heads[id], 1.3, images);
      c.fillStyle = "#eee";
      c.font = "17px sans-serif";
      c.fillText(String(i).padStart(2, "0"), 15, cell[1] - 12);
      c.restore();
    }
    fs.writeFileSync(
      path.join(ROOT, "docs/cerbero-v2/evidence/" + sequence + "-sprites.png"),
      out.toBuffer("image/png"),
    );
  }
  console.log("Composed drawn frame sequences exported");
})();
