/* Hellscape cinematic: visual timing only. Never writes to game state. */
(function (root) {
  "use strict";
  const CAPTURE = 5.2,
    ESCAPE = 2.9,
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
      duration: reactionStart + REACTION,
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
    if (p.winner !== null && t < p.reactionStart)
      return { phase: "escape", local: t - p.captureEnd };
    if (t < p.duration)
      return {
        phase: p.winner === null ? "dance" : "roar",
        local: t - p.reactionStart,
      };
    return { phase: "done", local: REACTION };
  }
  // Coordinates in the generated source atlas, mapped into normalized frames.
  const anchors = [
    [405, 205, 325, 139],
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
      art.addEventListener("error",()=>{art.failed=true;redraw()},{once:true});
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
  function fireBreath(c, origin, age) {
    if (age < 0 || age > 1.35) return;
    const envelope = ease(age / 0.18) * (1 - ease((age - 1.05) / 0.3)),
      height = 105 * envelope;
    c.save();
    // Pixel tongues curl out past the upper jaw, then climb vertically.
    for (let segment = 17; segment >= 0; segment--) {
      const t = segment / 17,
        px =
          origin.x +
          6 +
          Math.sin(t * Math.PI * 0.65) * 15 +
          Math.sin(age * 23 + t * 14) * t * 3,
        py = origin.y - 2 - height * t;
      const width = Math.max(
          1,
          (13 * (1 - t) + Math.sin(age * 29 + t * 20) * 3 + 3) * envelope,
        ),
        h = Math.max(2, height / 17 + 2);
      c.globalAlpha = (1 - t * 0.55) * envelope;
      c.fillStyle = "#c73c16";
      c.fillRect(
        Math.round(px - width * 0.65),
        Math.round(py),
        Math.ceil(width * 1.3),
        Math.ceil(h),
      );
      c.fillStyle = "#ff851c";
      c.fillRect(
        Math.round(px - width / 2),
        Math.round(py),
        Math.ceil(width),
        Math.ceil(h),
      );
      c.fillStyle = t < 0.7 ? "#ffe98b" : "#fbbd45";
      c.fillRect(
        Math.round(px - width * 0.22),
        Math.round(py),
        Math.max(1, Math.round(width * 0.44)),
        Math.ceil(h),
      );
    }
    for (let j = 0; j < 14; j++) {
      const life = 0.55,
        at = (age + j * 0.071) % life,
        t = at / life;
      c.globalAlpha = (1 - t) * envelope;
      c.fillStyle = j % 2 ? "#f9ca62" : "#ed6b1e";
      c.fillRect(
        Math.round(origin.x + 7 + ((j % 5) - 2) * t * 12),
        Math.round(origin.y - height * 0.4 - at * 110),
        j % 3 === 0 ? 2 : 1,
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
      helpers.nameTag(
        c,
        W,
        p.x,
        Math.min(p.y - (size.height * zoom) / 2, pose.top + 22),
        state.groups[index].name,
        helpers.colors[index],
      );
    }
    fireBreath(c, pose.mouth, t - 3.65);
  }
  function render(c, W, state, p, time, h) {
    const s = sample(p, time),
      ground = 332,
      winner = p.winner;
    // The survivor waits while the remaining opponents are removed.
    if (winner !== null && (s.phase === "capture" || s.phase === "escape")) {
      const row = h.vehicleIndex(state, winner),
        local = s.phase === "escape" ? s.local : 0,
        travel = ease((local - 0.3) / 1.85),
        center = lerp(W * 0.72, W + 45, travel);
      if (s.phase === "escape" && local < 2.65) {
        const pop = clamp(local / 0.13),
          close = 1 - ease((local - 2.35) / 0.3);
        c.save();
        c.globalAlpha = close;
        c.translate(W - 55, ground);
        c.scale(Math.max(0.001, pop), 1);
        c.translate(-(W - 55), -ground);
        h.gate(c, W - 82, ground - 182, time, true);
        c.restore();
      }
      c.save();
      if (s.phase === "escape") {
        c.beginPath();
        c.rect(0, 0, W - 55, 384);
        c.clip();
      }
      if (local < 2.2 || s.phase === "capture") {
        h.drawVehicle(c, row, Math.floor(time * 10) % 8, center, ground);
        const size = h.vehicleSize(row);
        h.nameTag(
          c,
          W,
          center,
          ground - size.height,
          state.groups[winner].name,
          h.colors[winner],
        );
      }
      c.restore();
    }
    if (s.phase === "capture") capture(c, W, state, s.victim, s.local, h);
    else if (s.phase === "escape") actor(c, 8, W * 0.12, ground);
    else if (s.phase === "roar" || (s.phase === "done" && winner !== null)) {
      const frame =
        s.phase === "done"
          ? 11
          : [8, 9, 10, 10, 9, 11][Math.min(5, Math.floor(s.local / 0.45))];
      actor(c, frame, lerp(W * 0.12, W * 0.2, ease(s.local / 0.6)), ground);
      if (s.phase === "roar" && s.local > 0.45 && s.local < 2.1) {
        c.save();
        c.globalAlpha = 0.18 * Math.sin(((s.local - 0.45) / 1.65) * Math.PI);
        c.strokeStyle = "#e2a064";
        c.lineWidth = 1;
        for (let j = 0; j < 3; j++) {
          c.beginPath();
          c.arc(W * 0.63, ground - 105, 12 + j * 10 + s.local * 3, -0.8, 0.6);
          c.stroke();
        }
        c.restore();
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
