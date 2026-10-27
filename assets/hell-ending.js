/* Hellscape cinematic: visual timing only. Never writes to game state. */
(function (root) {
  "use strict";
  const CAPTURE = 5.2,
    ESCAPE = 2.2,
    REACTION = 3.2;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)),
    ease = (x) => {
      x = clamp(x);
      return x * x * (3 - 2 * x);
    },
    lerp = (a, b, t) => a + (b - a) * t;
  function plan(state, consumed = [], pending = []) {
    const eaten = new Set(consumed),
      winner = state.winner;
    const victims = [
      ...new Set([
        ...pending,
        ...state.groups
          .map((g, i) => (!g.out && i !== winner ? i : null))
          .filter((i) => i !== null),
      ]),
    ].filter((i) => i !== winner && !eaten.has(i));
    if (winner === null && !victims.length && !eaten.has(state.respondent))
      victims.push(state.respondent);
    const captureEnd = victims.length * CAPTURE,
      reactionStart = captureEnd + (winner === null ? 0 : ESCAPE);
    return {
      winner,
      victims,
      captureEnd,
      reactionStart,
      duration: captureEnd + (winner === null ? REACTION : 8.4),
    };
  }
  function sample(p, time) {
    const t = Math.max(0, time);
    if (t < p.captureEnd) {
      const slot = Math.floor(t / CAPTURE);
      return {
        phase: "capture",
        victim: p.victims[slot],
        local: t - slot * CAPTURE,
        slot,
      };
    }
    const elapsed = t - p.captureEnd;
    if (p.winner !== null) {
      if (elapsed < 0.55) return { phase: "rise", local: elapsed };
      if (elapsed < 2.2) return { phase: "escape", local: elapsed - 0.55 };
      if (elapsed < 2.95) return { phase: "roar", local: elapsed - 2.2 };
      if (elapsed < 4.8) return { phase: "fire", local: elapsed - 2.95 };
      if (elapsed < 8.4) return { phase: "rage", local: elapsed - 4.8 };
    } else if (t < p.duration) return { phase: "dance", local: elapsed };
    return { phase: "done", local: p.winner === null ? REACTION : 3.6 };
  }
  // Coordinates in the generated source atlas, mapped into normalized frames.
  const anchors = [
    [405, 205, 311, 122],
    [789, 207, 709, 142],
    [1140, 152, 1085, 131],
    [1481, 121, 1420, 101],
    [367, 350, 317, 346],
    [789, 369, 711, 365],
    [1140, 462, 1108, 376],
    [1490, 475, 1480, 371],
    [0, 0, 291, 595],
    [0, 0, 679, 586],
    [0, 0, 1066, 591],
    [0, 0, 1443, 639],
    [0, 0, 269, 839],
    [0, 0, 643, 832],
    [0, 0, 1068, 891],
    [0, 0, 1401, 829],
  ];
  let atlas = null,
    art = null;
  function prepare(image) {
    if (atlas) return atlas;
    if (!image?.complete || !image.naturalWidth) return null;
    const rows = [],
      sw = image.naturalWidth,
      sh = image.naturalHeight;
    for (let row = 0; row < 4; row++) {
      const top = Math.floor((row * sh) / 4),
        height = Math.floor(((row + 1) * sh) / 4) - top;
      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(image, 0, -top);
      const raw = ctx.getImageData(0, 0, sw, height),
        labels = new Int32Array(sw * height),
        parts = [];
      let serial = 0;
      for (let start = 0; start < labels.length; start++) {
        if (labels[start] || raw.data[start * 4 + 3] < 24) continue;
        const part = {
            id: ++serial,
            count: 0,
            l: sw,
            r: 0,
            t: height,
            b: 0,
            pixels: [],
          },
          stack = [start];
        labels[start] = serial;
        while (stack.length) {
          const at = stack.pop(),
            x = at % sw,
            y = Math.floor(at / sw);
          part.pixels.push(at);
          part.count++;
          part.l = Math.min(part.l, x);
          part.r = Math.max(part.r, x);
          part.t = Math.min(part.t, y);
          part.b = Math.max(part.b, y);
          for (const next of [at - 1, at + 1, at - sw, at + sw])
            if (
              next >= 0 &&
              next < labels.length &&
              !labels[next] &&
              Math.abs((next % sw) - x) <= 1 &&
              raw.data[next * 4 + 3] >= 24
            ) {
              labels[next] = serial;
              stack.push(next);
            }
        }
        parts.push(part);
      }
      const bodies = parts
        .filter((p) => p.count > 8000)
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)
        .sort((a, b) => a.l - b.l);
      if (bodies.length !== 4)
        throw Error(
          "Demon ending atlas: expected four complete bodies in row " + row,
        );
      // Keep detached fingers/hand with the nearest body; never cut at a grid line.
      for (const part of parts) {
        if (bodies.includes(part) || part.count < 100) continue;
        const cx = (part.l + part.r) / 2;
        const body = bodies.reduce((a, b) =>
          Math.abs(cx - (a.l + a.r) / 2) < Math.abs(cx - (b.l + b.r) / 2)
            ? a
            : b,
        );
        if (part.t < body.t - 2 || part.b > body.b + 2) continue;
        body.pixels.push(...part.pixels);
        body.l = Math.min(body.l, part.l);
        body.r = Math.max(body.r, part.r);
        body.t = Math.min(body.t, part.t);
        body.b = Math.max(body.b, part.b);
      }
      bodies.forEach((body, col) => rows.push({ ...body, raw, top, row, col }));
    }
    const width = Math.max(...rows.map((p) => p.r - p.l + 1)) + 16,
      height = Math.max(...rows.map((p) => p.b - p.t + 1)) + 16;
    atlas = rows.map((p, index) => {
      const c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      const ctx = c.getContext("2d"),
        out = ctx.createImageData(width, height),
        dx = Math.floor((width - (p.r - p.l + 1)) / 2),
        dy = height - 8 - (p.b - p.t + 1);
      for (const at of p.pixels) {
        const x = (at % sw) - p.l + dx,
          y = Math.floor(at / sw) - p.t + dy;
        out.data.set(
          p.raw.data.subarray(at * 4, at * 4 + 4),
          (y * width + x) * 4,
        );
      }
      ctx.putImageData(out, 0, 0);
      const a = anchors[index] || [0, 0, 0, 0],
        point = (x, y) => ({
          x: (x * sw) / 1536 - p.l + dx,
          y: (y * sh) / 1024 - p.top - p.t + dy,
        });
      return {
        canvas: c,
        hand: point(a[0], a[1]),
        mouth: point(a[2], a[3]),
      };
    });
    return atlas;
  }
  function load(redraw) {
    if (!art && typeof root.Image === "function") {
      art = new root.Image();
      art.decoding = "async";
      const path = "assets/hell-race/demon-ending-v1.webp";
      art.src = root.HellscapeOffline?.assets?.[path] || path;
      art.addEventListener("load", redraw, { once: true });
      art.addEventListener(
        "error",
        () => {
          art.failed = true;
          redraw();
        },
        { once: true },
      );
    }
    return art;
  }
  function actor(c, index, x, ground, width = 260) {
    const frames = prepare(art);
    if (!frames) return null;
    const f = frames[index],
      zoom = width / f.canvas.width,
      height = f.canvas.height * zoom,
      y = ground - height;
    c.drawImage(
      f.canvas,
      Math.round(x),
      Math.round(y),
      Math.round(width),
      Math.round(height),
    );
    const point = (p) => ({ x: x + p.x * zoom, y: y + p.y * zoom });
    return { hand: point(f.hand), mouth: point(f.mouth), top: y };
  }
  const captureAction = (t) =>
    t < 0.5
      ? "reach"
      : t < 0.9
        ? "grip"
        : t < 1.75
          ? "lift"
          : t < 2.45
            ? "swallow"
            : t < 3.4
              ? "chew"
              : t < 4.95
                ? "fire"
                : "recover";
  const captureFrame = (t) =>
    t < 0.5
      ? 0
      : t < 0.9
        ? 1
        : t < 1.3
          ? 2
          : t < 1.75
            ? 3
            : t < 2.45
              ? 4
              : t < 3.4
                ? Math.floor(t * 8) % 2
                  ? 6
                  : 7
                : t < 3.7
                  ? 9
                  : t < 4.9
                    ? 10
                    : 11;
  function fireBreath(
    c,
    origin,
    age,
    aim = { x: origin.x + 15, y: origin.y - 110 },
    duration = 1.45,
  ) {
    if (age < 0 || age >= duration) return;
    const envelope =
      ease(age / 0.12) * (1 - ease((age - duration + 0.25) / 0.25));
    if (!envelope) return;
    const dx = aim.x - origin.x,
      dy = aim.y - origin.y,
      distance = Math.hypot(dx, dy) || 1,
      ux = dx / distance,
      uy = dy / distance,
      nx = -uy,
      ny = ux;
    const length = distance * envelope * (1.015 + 0.045 * Math.sin(age * 38));
    const shape = (points, color, alpha) => {
      c.globalAlpha = envelope * alpha;
      c.fillStyle = color;
      c.beginPath();
      points.forEach(([x, y], i) =>
        i
          ? c.lineTo(Math.round(x), Math.round(y))
          : c.moveTo(Math.round(x), Math.round(y)),
      );
      c.closePath();
      c.fill();
    };
    c.save();
    // A connected fuel stream feeds rolling, irregular flame parcels.
    for (const [factor, color, opacity] of [
      [1, "#ef741b", 0.9],
      [0.38, "#ffe9a0", 0.85],
    ]) {
      const left = [],
        right = [];
      for (let i = 0; i <= 18; i++) {
        const t = i / 18,
          along = length * t * 0.9,
          spread = (1.7 + t * 4.5) * factor,
          jitter = Math.sin(age * 37 - i * 2) * t * 2;
        left.push([
          origin.x + ux * along + nx * (spread + jitter),
          origin.y + uy * along + ny * (spread + jitter),
        ]);
        right.push([
          origin.x + ux * along + nx * (-spread + jitter),
          origin.y + uy * along + ny * (-spread + jitter),
        ]);
      }
      shape([...left, ...right.reverse()], color, opacity);
    }
    for (let parcel = 0; parcel < 30; parcel++) {
      const t = (age * 2.1 + parcel * 0.071) % 1,
        along = length * t,
        swirl = Math.sin(parcel * 4.7 - age * 19) * (2 + t * 6);
      const px = origin.x + ux * along + nx * swirl,
        py = origin.y + uy * along + ny * swirl,
        radius = (2 + t * 11) * (0.8 + 0.2 * Math.sin(parcel * 7 + age * 33));
      const outline = [];
      for (let corner = 0; corner < 8; corner++) {
        const a = (corner * Math.PI) / 4,
          rag = 0.8 + 0.25 * Math.sin(corner * 5 + parcel * 3 + age * 24);
        outline.push([
          px + Math.cos(a) * radius * rag,
          py + Math.sin(a) * radius * rag,
        ]);
      }
      shape(outline, parcel % 3 ? "#f47a1c" : "#d74712", 0.75 - t * 0.2);
      shape(
        outline.map(([x, y]) => [px + (x - px) * 0.55, py + (y - py) * 0.55]),
        parcel % 2 ? "#ffd369" : "#ffaf33",
        0.85 - t * 0.2,
      );
      if (t < 0.6) {
        c.globalAlpha = envelope * 0.75;
        c.fillStyle = "#ffeab0";
        c.fillRect(
          Math.round(px - 1),
          Math.round(py - 1),
          2 + Math.round(t * 3),
          2,
        );
      }
    }
    for (let spark = 0; spark < 12; spark++) {
      const t = (age * 2.5 + spark * 0.083) % 1,
        spread = Math.sin(spark * 4 + age * 9) * t * 17;
      c.globalAlpha = envelope * (1 - t) * 0.7;
      c.fillStyle = spark % 2 ? "#ffd477" : "#f28d2b";
      c.fillRect(
        Math.round(origin.x + ux * length * t + nx * spread),
        Math.round(origin.y + uy * length * t + ny * spread),
        1,
        2,
      );
    }
    c.restore();
  }
  function capture(c, W, state, index, t, helpers) {
    const ground = 332,
      row = helpers.vehicleIndex(state, index),
      size = helpers.vehicleSize(row),
      pose = actor(c, captureFrame(t), W * 0.12, ground);
    if (!pose) {
      helpers.demon(c, 0);
      return;
    }
    if (t < 2.45) {
      const feeding = ease((t - 1.85) / 0.6),
        p = {
          x: lerp(pose.hand.x, pose.mouth.x, feeding),
          y: lerp(pose.hand.y, pose.mouth.y, feeding),
        };
      let zoom = 0.88 * (1 - feeding * 0.7),
        tilt = lerp(-0.12, -0.65, feeding);
      if (t < 0.5) {
        const reach = ease(t / 0.5);
        p.x = lerp(W * 0.575, pose.hand.x, reach);
        p.y = lerp(ground - size.height / 2, pose.hand.y, reach);
        zoom = lerp(1, 0.88, reach);
      }
      c.save();
      c.translate(p.x, p.y);
      c.rotate(tilt);
      c.scale(zoom, zoom);
      // Entire vehicle passes into the fire-filled jaws; no abandoned wreck.
      if (feeding > 0.05) {
        c.beginPath();
        c.rect(
          -size.width / 2,
          -size.height / 2,
          size.width * (1 - feeding),
          size.height,
        );
        c.clip();
      }
      helpers.drawVehicle(c, row, 0, 0, size.height / 2);
      c.restore();
      if (t >= 0.5 && t < 1.9) {
        c.fillStyle = "#221b1a";
        for (let j = 0; j < 3; j++)
          c.fillRect(Math.round(p.x - 6 + j * 5), Math.round(p.y - 3), 2, 7);
      }
    }
    fireBreath(c, pose.mouth, t - 3.65);
  }
  function portalMotion(time) {
    return {
      visible: time >= 0 && time < 4.8,
      offset: 190 * (1 - ease(time / 0.55) + ease((time - 2.2) / 2.6)),
      passed: time >= 2.2,
    };
  }
  function rageMotion(time) {
    const cycle = time % 1.2,
      air = cycle >= 0.15 && cycle < 0.52;
    const impact = Math.max(
      0,
      1 - Math.abs(cycle - 0.57) / 0.085,
      1 - Math.abs(cycle - 0.84) / 0.085,
    );
    return {
      frame: air ? 12 : cycle < 0.15 || (cycle > 0.68 && cycle < 0.78) ? 11 : 7,
      lift: air
        ? Math.sin(((cycle - 0.15) / 0.37) * Math.PI) * 28
        : -impact * 3,
      impact,
      cycle,
    };
  }
  function drawPortal(c, W, time, ground, h) {
    const motion = portalMotion(time);
    if (!motion.visible) return;
    c.save();
    c.beginPath();
    c.rect(0, 0, W, ground + 1);
    c.clip();
    c.translate(0, motion.offset);
    h.gate(c, W - 82, ground - 182, time, true);
    c.restore();
    // Rock fragments at the base make the vertical rise and descent explicit.
    if (time < 0.7 || time > 2.2) {
      c.save();
      c.fillStyle = "#806044";
      for (let i = 0; i < 8; i++) {
        const x = W - 95 + i * 10,
          y = ground - 2 - Math.abs(Math.sin(time * 16 + i * 3)) * 3;
        c.fillRect(Math.round(x), Math.round(y), 3 + (i % 3), 2);
      }
      c.restore();
    }
  }
  function render(c, W, state, p, time, h) {
    const s = sample(p, time),
      ground = 332,
      winner = p.winner,
      seq = Math.max(0, time - p.captureEnd);
    if (s.phase === "capture") {
      if (winner !== null)
        h.drawVehicle(
          c,
          h.vehicleIndex(state, winner),
          Math.floor(time * 10) % 8,
          W * 0.72,
          ground,
        );
      capture(c, W, state, s.victim, s.local, h);
      return s.phase;
    }
    if (winner !== null) {
      drawPortal(c, W, seq, ground, h);
      // Exactly one configured vehicle can enter: the declared winner.
      if (seq < 2.2) {
        const center = lerp(W * 0.72, W + 45, ease((seq - 0.55) / 1.5));
        c.save();
        c.beginPath();
        c.rect(0, 0, W - 55, 384);
        c.clip();
        h.drawVehicle(
          c,
          h.vehicleIndex(state, winner),
          Math.floor(time * 10) % 8,
          center,
          ground,
        );
        c.restore();
      }
      const x = lerp(W * 0.12, W * 0.22, ease((seq - 2.2) / 0.6));
      if (s.phase === "rise" || s.phase === "escape") actor(c, 8, x, ground);
      else if (s.phase === "roar")
        actor(c, s.local < 0.15 ? 8 : s.local < 0.4 ? 9 : 10, x, ground);
      else if (s.phase === "fire") {
        const pose = actor(c, 0, x, ground),
          portal = portalMotion(seq);
        if (pose && portal.visible)
          fireBreath(
            c,
            pose.mouth,
            s.local,
            { x: W - 55, y: ground - Math.max(3, (190 - portal.offset) * 0.5) },
            1.85,
          );
      } else {
        const motion =
          s.phase === "done"
            ? { frame: 7, lift: 0, impact: 0, cycle: 1.1 }
            : rageMotion(s.local);
        const pose = actor(c, motion.frame, x, ground - motion.lift);
        if (pose && s.phase === "rage") {
          c.save();
          c.translate(0, ground - 133);
          h.demonDust(
            c,
            pose.hand.x - 76,
            time,
            "attack",
            Math.max(-1, motion.cycle - 0.42),
          );
          c.restore();
          if (motion.impact > 0) {
            c.save();
            c.globalAlpha = motion.impact * 0.65;
            c.fillStyle = "#9b7552";
            for (let j = 0; j < 8; j++) {
              const side = j % 2 ? -1 : 1;
              c.fillRect(
                Math.round(
                  pose.hand.x + side * (5 + j * 3) * (1 - motion.impact),
                ),
                Math.round(ground - 3 - (j % 3) * motion.impact * 5),
                2 + (j % 2),
                2,
              );
            }
            c.restore();
          }
        }
      }
    } else {
      const frame =
          s.phase === "done" ? 15 : 12 + (Math.floor(s.local * 5) % 4),
        bounce =
          s.phase === "done"
            ? 0
            : Math.abs(Math.sin(s.local * Math.PI * 5)) * 7;
      actor(
        c,
        frame,
        lerp(W * 0.12, W * 0.3, ease(s.local / 0.6)),
        ground - bounce,
      );
      if (s.phase === "dance") h.demonDust(c, W * 0.3, time, "chase", 0);
    }
    return s.phase;
  }
  const api = {
    CAPTURE,
    plan,
    sample,
    portalMotion,
    rageMotion,
    captureFrame,
    captureAction,
    fireBreath,
    load,
    prepare,
    actor,
    capture,
    render,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.FoolEnding = api;
})(globalThis);
