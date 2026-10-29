/* Approved Cerberus: one texture, connected rig, deterministic personal anchors.
   All deformation is presentation-only. Coordinates refer to the canonical PNG. */
(function (root) {
  "use strict";
  const M =
    typeof module !== "undefined"
      ? require("./hell-motion.js")
      : root.FoolMotion;
  const SOURCE = Object.freeze({
    width: 1536,
    height: 1024,
    left: 51,
    top: 28,
    right: 1502,
    bottom: 998,
  });
  const SPAN = SOURCE.right - SOURCE.left,
    HEIGHT = SOURCE.bottom - SOURCE.top;
  const ASSET = "assets/hell-race/cerbero/carne-v1.png";
  const clamp = M.clamp;
  const points = {
    rump: [535, 550],
    back: [765, 395],
    chest: [1010, 550],
    belly: [820, 755],
    neck_left: [1050, 310],
    head_left: [1220, 152],
    mouth_left: [1358, 216],
    jaw_left: [1300, 278],
    neck_center: [1085, 490],
    head_center: [1240, 358],
    mouth_center: [1361, 406],
    jaw_center: [1310, 477],
    neck_right: [1180, 630],
    head_right: [1370, 600],
    mouth_right: [1452, 655],
    jaw_right: [1390, 724],
    hip_hind_near: [575, 605],
    knee_hind_near: [395, 790],
    paw_hind_near: [287, 947],
    hip_hind_far: [800, 650],
    knee_hind_far: [660, 785],
    paw_hind_far: [745, 907],
    hip_front_near: [970, 680],
    knee_front_near: [1005, 845],
    paw_front_near: [1054, 996],
    hip_front_far: [1205, 700],
    knee_front_far: [1300, 830],
    paw_front_far: [1362, 953],
    tail_root: [485, 590],
    tail_tip: [65, 440],
  };
  const names = Object.keys(points),
    source = names.map((n) => ({ x: points[n][0], y: points[n][1] }));
  const ids = Object.fromEntries(names.map((n, i) => [n, i]));
  const heads = ["left", "center", "right"],
    legs = ["hind_near", "hind_far", "front_near", "front_far"];
  function rotate(p, origin, angle) {
    const x = p.x - origin.x,
      y = p.y - origin.y,
      c = Math.cos(angle),
      s = Math.sin(angle);
    return { x: origin.x + x * c - y * s, y: origin.y + x * s + y * c };
  }
  function legCycle(distance, offset = 0) {
    const phase = (((distance / M.STRIDE + offset) % 1) + 1) % 1,
      stance = 0.6,
      half = (M.STRIDE * stance) / 2;
    if (phase < stance)
      return { phase, contact: true, x: half - phase * M.STRIDE, y: 0 };
    const u = (phase - stance) / (1 - stance),
      m = -M.STRIDE * (1 - stance);
    return {
      phase,
      contact: false,
      x:
        (2 * u * u * u - 3 * u * u + 1) * -half +
        (u * u * u - 2 * u * u + u) * m +
        (-2 * u * u * u + 3 * u * u) * half +
        (u * u * u - u * u) * m,
      y: -(Math.sin(Math.PI * u) ** 2) * 14,
    };
  }
  // Pose keys retain the existing cinematic's timings and interpolation weights.
  const poses = Array.from({ length: 16 }, () => ({
    reach: 0,
    lift: 0,
    nod: 0,
    fire: 0,
    rage: 0,
    pant: 0,
  }));
  Object.assign(poses[1], { reach: 1, lift: 0.12 });
  Object.assign(poses[2], { reach: 0.7, lift: 0.7, nod: 0.03 });
  Object.assign(poses[3], { reach: 0.9, lift: 1, nod: 0.05 });
  Object.assign(poses[4], { reach: 0.5, lift: 0.9, nod: 0.12 });
  Object.assign(poses[5], { reach: 0.4, lift: 0.65, nod: 0.1 });
  Object.assign(poses[6], { reach: 0.2, lift: 0.2, nod: 0.05 });
  Object.assign(poses[7], { pant: 1 });
  Object.assign(poses[9], { rage: 0.5 });
  Object.assign(poses[10], { fire: 1 });
  Object.assign(poses[11], { rage: 1 });
  [12, 13, 14, 15].forEach((i, k) =>
    Object.assign(poses[i], {
      nod: k % 2 ? -0.06 : 0.06,
      rage: k % 2 ? 0.3 : 0,
    }),
  );
  function parameters(weights) {
    const out = { reach: 0, lift: 0, nod: 0, fire: 0, rage: 0, pant: 0 };
    for (const p of weights ?? [{ frame: 8, weight: 1 }])
      for (const k of Object.keys(out))
        out[k] += (poses[p.frame]?.[k] ?? 0) * p.weight;
    return out;
  }
  function sample(demon = {}, travel = {}) {
    const run = clamp(demon.runWeight ?? 1),
      distance = travel.distance ?? demon.worldDistance ?? 0,
      time = travel.time ?? demon.time ?? 0;
    const param = parameters(demon.pose),
      targets = source.map((p) => ({ ...p })),
      pixel = SPAN / (demon.width ?? M.CHASE.width);
    const stride = (distance / M.STRIDE) * Math.PI * 2,
      bob = run * (1 - Math.cos(stride * 2)) * 2.5;
    const pant = param.pant * Math.sin(time * 5) * 2;
    for (const p of targets) p.y -= bob + pant;
    const move = (name, p) => {
      targets[ids[name]] = p;
    };
    const base = (n) => targets[ids[n]];
    heads.forEach((side, i) => {
      const pivot = base("head_" + side),
        neck = base("neck_" + side);
      const nod =
        param.nod +
        run * Math.sin(stride + i * 0.8) * 0.025 -
        param.fire * 0.18;
      const recoil = param.fire * (1 + Math.sin(time * 19 + i) * 0.12) * 5;
      for (const kind of ["head", "mouth", "jaw"]) {
        const name = kind + "_" + side,
          p = rotate(base(name), neck, nod * 0.13),
          q = rotate(p, pivot, nod * 0.87);
        q.x -= recoil;
        q.y += param.rage * 7;
        move(name, q);
      }
      // The lower jaw follows its own connected hinge; no detached emission source.
      const jaw = base("jaw_" + side),
        mouth = base("mouth_" + side);
      jaw.y += (param.fire * 14 + param.lift * 9) * (i === 1 ? 1 : 0.6);
      mouth.y += param.fire * 2;
    });
    legs.forEach((side, i) => {
      const gait = legCycle(distance, [0, 0.5, 0.5, 0][i]);
      const paw = base("paw_" + side),
        knee = base("knee_" + side);
      const busy = side === "front_near" ? param.reach : 0,
        drive = run * (1 - busy);
      const dx = gait.x * pixel * drive,
        dy = gait.y * pixel * drive;
      paw.x += dx;
      paw.y += dy + bob + pant;
      knee.x += dx * 0.45;
      knee.y += dy * 0.55;
      if (side === "front_near") {
        paw.x += param.reach * 100;
        paw.y -= param.lift * 150;
        knee.x += param.reach * 40;
        knee.y -= param.lift * 95;
      }
      if (side.startsWith("front")) {
        paw.y += param.rage * 8;
        knee.y += param.rage * 4;
      }
    });
    const tail = base("tail_tip");
    tail.y += Math.sin(stride * 0.5) * run * 18;
    tail.x += Math.cos(stride * 0.5) * run * 5;
    return {
      targets,
      run,
      distance,
      time,
      parameters: param,
      contacts: Object.fromEntries(
        legs.map((n, i) => [
          n,
          legCycle(distance, [0, 0.5, 0.5, 0][i]).contact,
        ]),
      ),
    };
  }
  // Thin-plate interpolation connects the same painted anatomy to every joint.
  const normalized = source.map((p) => ({ x: p.x / SPAN, y: p.y / SPAN }));
  const radial = (r2) => (r2 < 1e-16 ? 0 : r2 * Math.log(r2));
  function inverse(matrix) {
    const n = matrix.length,
      a = matrix.map((row, i) =>
        row.concat(Array.from({ length: n }, (_, j) => +(i === j))),
      );
    for (let i = 0; i < n; i++) {
      let pivot = i;
      for (let j = i + 1; j < n; j++)
        if (Math.abs(a[j][i]) > Math.abs(a[pivot][i])) pivot = j;
      [a[i], a[pivot]] = [a[pivot], a[i]];
      const value = a[i][i];
      if (Math.abs(value) < 1e-12) throw Error("Cerbero: singular rig");
      for (let k = 0; k < 2 * n; k++) a[i][k] /= value;
      for (let j = 0; j < n; j++)
        if (j !== i) {
          const factor = a[j][i];
          for (let k = 0; k < 2 * n; k++) a[j][k] -= factor * a[i][k];
        }
    }
    return a.map((row) => row.slice(n));
  }
  const count = source.length,
    matrix = Array.from({ length: count + 3 }, () => Array(count + 3).fill(0));
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++)
      matrix[i][j] = radial(
        (normalized[i].x - normalized[j].x) ** 2 +
          (normalized[i].y - normalized[j].y) ** 2,
      );
    matrix[i][count] = matrix[count][i] = 1;
    matrix[i][count + 1] = matrix[count + 1][i] = normalized[i].x;
    matrix[i][count + 2] = matrix[count + 2][i] = normalized[i].y;
  }
  const inv = inverse(matrix);
  function weights(p) {
    const x = p.x / SPAN,
      y = p.y / SPAN,
      basis = normalized
        .map((q) => radial((x - q.x) ** 2 + (y - q.y) ** 2))
        .concat([1, x, y]);
    return source.map((_, j) =>
      basis.reduce((sum, v, i) => sum + v * inv[i][j], 0),
    );
  }
  function deform(p, pose) {
    const w = weights(p);
    return w.reduce(
      (out, v, i) => ({
        x: out.x + v * pose.targets[i].x,
        y: out.y + v * pose.targets[i].y,
      }),
      { x: 0, y: 0 },
    );
  }
  const columns = 16,
    rows = 12,
    vertices = [],
    triangles = [];
  for (let y = 0; y <= rows; y++)
    for (let x = 0; x <= columns; x++) {
      const p = {
        x: (x * SOURCE.width) / columns,
        y: (y * SOURCE.height) / rows,
      };
      vertices.push({ ...p, weights: weights(p) });
    }
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < columns; x++) {
      const a = y * (columns + 1) + x,
        b = a + 1,
        c = a + columns + 1,
        d = c + 1;
      triangles.push([a, b, c], [d, c, b]);
    }
  function geometry(demon, travel) {
    const pose = sample(demon, travel),
      scale = demon.width / SPAN;
    const world = (p) => ({
      x: demon.left + (p.x - SOURCE.left) * scale,
      y: demon.ground + (p.y - SOURCE.bottom) * scale,
    });
    const mouthPoints = Object.fromEntries(
      heads.map((s) => [s, world(pose.targets[ids["mouth_" + s]])]),
    );
    const directions = Object.fromEntries(
      heads.map((s) => {
        const o = points["mouth_" + s],
          tip = deform({ x: o[0] + 70, y: o[1] - 5 }, pose),
          a = mouthPoints[s],
          b = world(tip),
          l = Math.hypot(b.x - a.x, b.y - a.y);
        return [s, { x: (b.x - a.x) / l, y: (b.y - a.y) / l }];
      }),
    );
    return {
      ...pose,
      hand: world(pose.targets[ids.paw_front_near]),
      mouth: mouthPoints.center,
      mouths: mouthPoints,
      directions,
      feet: Object.fromEntries(
        legs.map((s) => [s, world(pose.targets[ids["paw_" + s]])]),
      ),
      top: demon.ground - HEIGHT * scale,
    };
  }
  let metricCache = null;
  function metrics() {
    if (metricCache) return metricCache;
    const frames = poses.map((_, frame) => {
      const g = geometry({
        left: 0,
        ground: HEIGHT / SPAN,
        width: 1,
        pose: [{ frame, weight: 1 }],
        runWeight: 0,
      });
      return { height: HEIGHT / SPAN, hand: g.hand, mouth: g.mouth };
    });
    frames.actorPoints = (d) => geometry(d);
    metricCache = frames;
    return frames;
  }
  let art = null;
  function load(redraw = () => {}) {
    if (!art && typeof root.Image === "function") {
      art = new root.Image();
      art.decoding = "async";
      art.src = root.HellscapeOffline?.assets?.[ASSET] || ASSET;
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
  function ready(image = art) {
    return (
      !!image &&
      (image.naturalWidth || image.width) > 0 &&
      image.complete !== false
    );
  }
  function render(c, demon, travel = {}, image = art) {
    if (!ready(image)) return null;
    const pose = sample(demon, travel),
      deformed = vertices.map((v) =>
        v.weights.reduce(
          (o, w, i) => ({
            x: o.x + w * pose.targets[i].x,
            y: o.y + w * pose.targets[i].y,
          }),
          { x: 0, y: 0 },
        ),
      );
    const scale = demon.width / SPAN;
    c.save();
    c.translate(
      demon.left - SOURCE.left * scale,
      demon.ground - SOURCE.bottom * scale,
    );
    c.scale(scale, scale);
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = "high";
    for (const triangle of triangles) {
      const [s0, s1, s2] = triangle.map((i) => vertices[i]),
        [t0, t1, t2] = triangle.map((i) => deformed[i]);
      const ux = s1.x - s0.x,
        uy = s1.y - s0.y,
        vx = s2.x - s0.x,
        vy = s2.y - s0.y,
        det = ux * vy - uy * vx;
      const ax = ((t1.x - t0.x) * vy - (t2.x - t0.x) * uy) / det,
        ay = ((t1.y - t0.y) * vy - (t2.y - t0.y) * uy) / det,
        bx = ((t2.x - t0.x) * ux - (t1.x - t0.x) * vx) / det,
        by = ((t2.y - t0.y) * ux - (t1.y - t0.y) * vx) / det;
      c.save();
      c.transform(
        ax,
        ay,
        bx,
        by,
        t0.x - ax * s0.x - bx * s0.y,
        t0.y - ay * s0.x - by * s0.y,
      );
      const cx = (s0.x + s1.x + s2.x) / 3,
        cy = (s0.y + s1.y + s2.y) / 3;
      c.beginPath();
      for (let i = 0; i < 3; i++) {
        const p = [s0, s1, s2][i],
          factor = 1.004,
          x = cx + (p.x - cx) * factor,
          y = cy + (p.y - cy) * factor;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.closePath();
      c.clip();
      const x = Math.min(s0.x, s1.x, s2.x),
        y = Math.min(s0.y, s1.y, s2.y),
        w = Math.max(s0.x, s1.x, s2.x) - x,
        h = Math.max(s0.y, s1.y, s2.y) - y;
      c.drawImage(image, x, y, w, h, x, y, w, h);
      c.restore();
    }
    c.restore();
    return geometry(demon, travel);
  }
  function prepare(image) {
    return ready(image)
      ? metrics().map((m, index) => ({ index, metrics: m }))
      : null;
  }
  function dust(c, demon, travel) {
    if ((demon.runWeight ?? 1) < 0.2) return;
    const scale = demon.width / M.CHASE.width;
    for (const event of travel?.footfalls ?? []) {
      const age = travel.time - event.at;
      if (age < 0 || age > 0.35) continue;
      const distance = (event.index * M.STRIDE) / 2;
      const birth = geometry(
        { ...demon, left: demon.left + distance - travel.distance },
        { distance, time: event.at },
      );
      legs.forEach((side, i) => {
        if (((event.index % 2) + 2) % 2 !== [0, 1, 1, 0][i]) return;
        const foot = birth.feet[side];
        c.save();
        c.globalAlpha *= 0.5 * (1 - age / 0.35);
        for (let n = 0; n < 5; n++) {
          const spread = (n - 2) * age * 24 * scale,
            y =
              foot.y - Math.sin((age / 0.35) * Math.PI) * (2 + (n % 3)) * scale;
          c.fillStyle = n % 2 ? "#b9a18a" : "#6d5c4d";
          c.fillRect(foot.x + spread, y, 2 * scale, scale);
        }
        c.restore();
      });
    }
  }
  const api = {
    ASSET,
    SOURCE,
    points,
    heads,
    legs,
    legCycle,
    parameters,
    sample,
    deform,
    geometry,
    metrics,
    load,
    ready,
    render,
    prepare,
    dust,
    vertices,
    triangles,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.FoolCerbero = api;
})(globalThis);
