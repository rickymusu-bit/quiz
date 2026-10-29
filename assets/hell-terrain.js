/* Continuous basalt ground. Purely visual: no game RNG, timers or saved state. */
(function (root) {
  "use strict";
  const TOP = 184,
    BOTTOM = 365,
    CHUNK = 128;
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const noise = (seed) => {
    const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const fade = (level, start) => clamp((level - start) / 0.22);
  function progress(state) {
    return clamp(
      (Number((state.config.turnCount ? state.completedTurns : state.valid)) || 0) /
        Math.max(1, Number((state.config.turnCount || state.config.questionCount)) || 33),
    );
  }
  const box = (c, x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(
      Math.round(x),
      Math.round(y),
      Math.max(1, Math.round(w)),
      Math.max(1, Math.round(h)),
    );
  };
  function polygon(c, points, color) {
    c.fillStyle = color;
    c.beginPath();
    points.forEach(([x, y], i) =>
      i
        ? c.lineTo(Math.round(x), Math.round(y))
        : c.moveTo(Math.round(x), Math.round(y)),
    );
    c.closePath();
    c.fill();
  }
  function bone(c, x, y, seed) {
    c.save();
    c.translate(Math.round(x), Math.round(y));
    c.rotate((noise(seed) - 0.5) * 1.3);
    box(c, -7, -1, 14, 2, "#8f8470");
    box(c, -6, -2, 12, 1, "#c3b79a");
    for (const end of [-7, 6]) {
      box(c, end, -3, 2, 3, "#c3b79a");
      box(c, end, 1, 2, 2, "#a99b80");
    }
    c.restore();
  }
  function skull(c, x, y) {
    box(c, x - 5, y - 5, 10, 7, "#a99b80");
    box(c, x - 4, y - 6, 8, 2, "#cabd9c");
    box(c, x - 3, y + 2, 6, 3, "#8f8067");
    box(c, x - 4, y - 3, 3, 3, "#28221c");
    box(c, x + 1, y - 3, 3, 3, "#28221c");
    box(c, x, y, 1, 2, "#30271f");
    for (let i = -2; i <= 2; i += 2) box(c, x + i, y + 2, 1, 2, "#d0bf9b");
  }
  function demonSkull(c, x, y) {
    // Broad jaw, long fangs and swept horns distinguish it from a human skull.
    polygon(
      c,
      [
        [x - 6, y - 3],
        [x - 10, y - 8],
        [x - 12, y - 12],
        [x - 8, y - 10],
        [x - 4, y - 5],
      ],
      "#b4a88b",
    );
    polygon(
      c,
      [
        [x + 6, y - 3],
        [x + 10, y - 8],
        [x + 12, y - 12],
        [x + 8, y - 10],
        [x + 4, y - 5],
      ],
      "#b4a88b",
    );
    box(c, x - 7, y - 5, 14, 9, "#8e8875");
    box(c, x - 5, y - 6, 10, 2, "#b6ac91");
    box(c, x - 4, y + 4, 8, 3, "#6e695c");
    box(c, x - 6, y - 3, 4, 3, "#2c211b");
    box(c, x + 2, y - 3, 4, 3, "#2c211b");
    box(c, x - 1, y, 2, 2, "#30271f");
    box(c, x - 4, y + 3, 2, 6, "#c9bb99");
    box(c, x + 2, y + 3, 2, 6, "#c9bb99");
    box(c, x - 1, y + 4, 2, 2, "#282320");
  }
  function wreck(c, x, y, seed) {
    const style = Math.floor(noise(seed) * 4);
    if (style === 0) {
      // Wheel and snapped axle.
      box(c, x - 7, y - 5, 14, 10, "#0b0c0c");
      box(c, x - 5, y - 4, 10, 7, "#514a3e");
      box(c, x - 2, y - 3, 4, 5, "#9a8d77");
      box(c, x - 1, y - 2, 2, 3, "#171817");
      box(c, x - 10, y + 1, 20, 2, "#735039");
    } else if (style === 1) {
      // Torn vehicle door, window and handle.
      polygon(
        c,
        [
          [x - 10, y - 1],
          [x - 6, y - 12],
          [x + 6, y - 11],
          [x + 10, y + 4],
          [x - 7, y + 6],
        ],
        "#534940",
      );
      polygon(
        c,
        [
          [x - 5, y - 10],
          [x + 4, y - 9],
          [x + 5, y - 4],
          [x - 7, y - 3],
        ],
        "#151a19",
      );
      box(c, x - 4, y - 12, 10, 1, "#9e8c74");
      box(c, x + 4, y, 4, 1, "#beb09a");
      box(c, x - 6, y + 1, 4, 3, "#8b5132");
      box(c, x - 7, y + 5, 14, 1, "#322b24");
    } else if (style === 2) {
      // Crumpled hood and exposed ribs.
      polygon(
        c,
        [
          [x - 13, y + 1],
          [x - 7, y - 6],
          [x + 4, y - 3],
          [x + 13, y + 4],
          [x - 5, y + 5],
        ],
        "#4c4840",
      );
      for (let i = 0; i < 4; i++)
        box(c, x - 9 + i * 5, y - 4 + (i % 2) * 3, 2, 7, "#a48c6c");
      box(c, x - 12, y + 3, 25, 2, "#362a23");
      box(c, x - 9, y + 2, 18, 1, "#865332");
    } else {
      // Bent bumper and headlamp housing.
      box(c, x - 13, y - 1, 21, 3, "#8d8677");
      box(c, x - 13, y - 2, 18, 1, "#b8ad98");
      box(c, x + 7, y - 1, 5, 5, "#72513a");
      box(c, x - 9, y + 2, 4, 4, "#342d27");
      box(c, x + 4, y - 3, 5, 4, "#252a29");
      box(c, x + 5, y - 2, 3, 2, "#c4b586");
    }
  }

  function geyser(c, x, y, seed, level, tick) {
    const period = 3.6 + noise(seed + 70) * 2.2,
      phase = (tick + noise(seed + 71) * period) % period;
    const pulse =
      phase > 0.45 && phase < 1.2
        ? Math.sin(((phase - 0.45) / 0.75) * Math.PI)
        : 0;
    const height = Math.min(y - TOP - 2, 25 + level * 58),
      opacity = c.globalAlpha;
    c.save();
    polygon(
      c,
      [
        [x - 9, y],
        [x - 4, y - 3],
        [x + 6, y - 2],
        [x + 10, y + 2],
        [x - 6, y + 4],
      ],
      "#0a0b0a",
    );
    box(c, x - 6, y + 2, 11, 1, "#67412b");
    box(c, x - 4, y, 8, 1, phase < 1.4 ? "#e47c29" : "#7c341a");
    if (phase < 0.45) {
      c.globalAlpha = opacity * (0.2 + phase);
      box(c, x - 3, y - 2, 6, 2, "#f5a345");
    }
    if (pulse > 0) {
      for (let segment = 0; segment < 12; segment++) {
        const t = segment / 11,
          px = x + Math.sin(t * 6 + tick * 11 + seed) * t * 3,
          py = y - height * pulse * t,
          w = Math.max(1, (5 + level * 3) * (1 - t * 0.6) * pulse);
        c.globalAlpha = opacity * (1 - t * 0.25);
        box(
          c,
          px - w / 2 - 1,
          py,
          w + 2,
          Math.max(2, (height * pulse) / 11 + 1),
          "#ba451b",
        );
        box(
          c,
          px - w / 2,
          py,
          w,
          Math.max(2, (height * pulse) / 11),
          "#f88e25",
        );
        box(
          c,
          px - w * 0.18,
          py,
          Math.max(1, w * 0.36),
          Math.max(2, (height * pulse) / 11),
          "#ffe38a",
        );
      }
    }
    for (let j = 0; j < 9; j++) {
      const age = (phase - 0.5 - j * 0.052) / 0.9;
      if (age < 0 || age > 1) continue;
      const px = x + (noise(seed + j + 85) - 0.5) * 65 * age,
        py = y - 4 * height * 0.8 * age * (1 - age);
      c.globalAlpha = opacity * (1 - age * 0.5);
      box(c, px, py, 1 + (j % 3), 2 + (j % 2), j % 2 ? "#ffc04d" : "#ee7123");
    }
    c.restore();
  }
  function crack(c, x, y, seed, level, tick) {
    const hot = level > 0.48,
      steps = 6 + Math.floor(noise(seed + 1) * 5);
    let px = x,
      py = y;
    for (let i = 0; i < steps; i++) {
      const nx = px + 3 + noise(seed + i + 4) * 6,
        ny = py + (noise(seed + i + 16) - 0.5) * 11;
      const gap = 1 + level * 2;
      polygon(
        c,
        [
          [px - gap, py],
          [nx, ny - gap],
          [nx + gap, ny],
          [px + 1, py + gap * 2],
        ],
        "#080909",
      );
      if (hot) {
        box(c, px, py, Math.max(2, nx - px), 1, "#a73d1c");
        if (i % 2 === 0) box(c, px + 1, py, 3, 1, "#ed8e30");
      }
      if (i === 3) {
        box(c, px - 2, py - 5, 2, 6, "#0a0b0b");
        if (hot) box(c, px - 1, py - 4, 1, 4, "#b94e21");
      }
      px = nx;
      py = ny;
    }
    if (hot && noise(seed + 9) > 0.45) {
      const heat = fade(level, 0.5),
        flicker = 0.7 + 0.3 * Math.sin(tick * 8 + seed);
      for (let i = 0; i < 3; i++) {
        const h = (5 + i * 2) * heat * flicker;
        box(c, x + 7 + i * 4, y - h, 3, h, "#ae431d");
        box(c, x + 8 + i * 4, y - h * 0.65, 1, h * 0.65, "#f6a541");
      }
    }
  }
  const baseCache = new Map();
  let cachedMaterial = null;
  function baseGround(c, base, seed, material) {
    for (let i = 0; i < 52; i++) {
      const s = seed + i * 29,
        x = base + noise(s) * CHUNK,
        y = TOP + noise(s + 1) * (BOTTOM - TOP),
        w = 22 + noise(s + 2) * 35,
        h = 8 + noise(s + 3) * 15;
      const shape = [
        [x - w / 2, y],
        [x - w * 0.3, y - h / 2],
        [x + w * 0.35, y - h * 0.4],
        [x + w / 2, y + 1],
        [x + w * 0.15, y + h * 0.35],
        [x - w * 0.4, y + h / 2],
      ];
      polygon(c, shape, i % 3 ? "#22211d" : "#2b2822");
      if (material) {
        c.save();
        c.beginPath();
        shape.forEach(([px, py], j) =>
          j ? c.lineTo(px, py) : c.moveTo(px, py),
        );
        c.closePath();
        c.clip();
        c.globalAlpha = 0.48;
        c.drawImage(
          material,
          noise(s + 6) * (material.naturalWidth - 80),
          material.naturalHeight * (0.64 + noise(s + 7) * 0.055),
          80,
          24,
          x - w / 2,
          y - h / 2,
          w,
          h,
        );
        c.restore();
      }
      box(
        c,
        x - w * 0.24,
        y - h * 0.4,
        w * 0.35,
        1,
        i % 2 ? "#373027" : "#40352a",
      );
      box(c, x + w * 0.3, y + 2, 2, 1, "#0d1010");
    }
    for (let i = 0; i < 125; i++) {
      const s = seed + i * 43;
      box(
        c,
        base + noise(s + 5) * CHUNK,
        TOP + noise(s + 8) * (BOTTOM - TOP),
        1 + noise(s + 3) * 2,
        1,
        i % 3 ? "#302b23" : "#080b0b",
      );
    }
  }
  function cachedBase(c, base, chunk, material) {
    if (!root.document) {
      baseGround(c, base, chunk * 2137, material);
      return;
    }
    if (cachedMaterial !== material) {
      baseCache.clear();
      cachedMaterial = material;
    }
    let tile = baseCache.get(chunk);
    if (!tile) {
      tile = root.document.createElement("canvas");
      tile.width = CHUNK + 64;
      tile.height = BOTTOM - TOP;
      const ctx = tile.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.translate(32, -TOP);
      baseGround(ctx, 0, chunk * 2137, material);
      baseCache.set(chunk, tile);
      if (baseCache.size > 24) baseCache.delete(baseCache.keys().next().value);
    }
    c.drawImage(tile, Math.round(base - 32), TOP);
  }
  function draw(c, width, tick, level, material = null, effectTime = tick) {
    level = clamp(level);
    const offset = tick * 48,
      first = Math.floor(offset / CHUNK) - 1,
      last = Math.floor((offset + width) / CHUNK) + 1;
    c.save();
    c.beginPath();
    c.rect(0, TOP, width, BOTTOM - TOP);
    c.clip();
    box(c, 0, TOP, width, BOTTOM - TOP, "#1e201b");
    for (let chunk = first; chunk <= last; chunk++) {
      const base = chunk * CHUNK - offset,
        seed = chunk * 2137;
      // Cached irregular texture patches retain the existing art without its lanes.
      cachedBase(c, base, chunk, material);
      for (let i = 0; i < 11; i++) {
        const s = seed + i * 109,
          x = base + noise(s + 9) * CHUNK,
          y = TOP + 9 + noise(s + 18) * (BOTTOM - TOP - 18),
          start = i === 0 ? -0.12 : 0.07 + i * 0.064,
          alpha = fade(level, start);
        if (!alpha) continue;
        c.globalAlpha = alpha;
        if (i % 3 === 0) {
          // Depressions widen into broken, lava-lit fissures as the game progresses.
          const radius = 4 + level * 7;
          polygon(
            c,
            [
              [x - radius, y],
              [x - radius * 0.3, y - 3],
              [x + radius, y - 1],
              [x + radius * 0.6, y + 4],
              [x - radius * 0.7, y + 5],
            ],
            "#090b0b",
          );
          box(c, x - radius * 0.6, y + 4, radius, 1, "#4f3929");
          crack(c, x, y, s, level, effectTime);
          if (
            (i === 6 && noise(s + 47) > 0.55) ||
            (i === 9 && noise(s + 47) > 0.7)
          )
            geyser(
              c,
              x,
              TOP + 85 + noise(s + 48) * (BOTTOM - TOP - 97),
              s,
              level,
              effectTime,
            );
        } else if (i % 3 === 1) {
          bone(c, x, y, s);
          if (i >= 4) {
            (noise(s + 23) > 0.5 ? demonSkull : skull)(c, x + 12, y + 1);
            bone(c, x + 3, y + 7, s + 44);
          }
        } else wreck(c, x, y, s);
      }
      c.globalAlpha = 1;
    }
    c.restore();
  }
  const api = { progress, draw, geyser, TOP, BOTTOM };
  if (typeof module !== "undefined") module.exports = api;
  else root.FoolTerrain = api;
})(globalThis);
