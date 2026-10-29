/* Cerberus: drawn canine gait, independent rigid necks/jaws and articulated tail.
   No mesh warping. Each emitted point follows the exact painted part transform. */
(function (root) {
  "use strict";
  const M =
    typeof module !== "undefined"
      ? require("./hell-motion.js")
      : root.FoolMotion;
  const D =
    typeof module !== "undefined"
      ? require("./hell-cerbero-frames.js")
      : root.FoolCerberoFrames;
  const heads = ["left", "center", "right"],
    legs = ["hind_near", "hind_far", "front_near", "front_far"];
  const ASSETS = [
    ...new Set(
      [
        ...D.walk.map((f) => f.asset),
        D.parts.asset,
        D.jaw?.asset,
        D.flames?.asset,
      ].filter(Boolean),
    ),
  ];
  const ASSET = ASSETS[0],
    SOURCE = { width: 1536, height: 1024 };
  const images = {},
    bundles = new WeakMap();
  const rotate = (p, a) => ({
    x: p.x * Math.cos(a) - p.y * Math.sin(a),
    y: p.x * Math.sin(a) + p.y * Math.cos(a),
  });
  function canvas(w, h) {
    if (root.document) {
      const c = root.document.createElement("canvas");
      c.width = w;
      c.height = h;
      return c;
    }
    return require("@napi-rs/canvas").createCanvas(w, h);
  }
  function imageReady(im) {
    return !!im && (im.naturalWidth || im.width) > 0 && im.complete !== false;
  }
  function ready(input = images) {
    if (input === handle) input = images;
    return ASSETS.every((path) => imageReady(input?.[path]));
  }
  const handle = {
    get complete() {
      return ready();
    },
    get naturalWidth() {
      return ready() ? 1536 : 0;
    },
    get failed() {
      return ASSETS.some((p) => images[p]?.failed);
    },
  };
  function load(redraw = () => {}) {
    if (typeof root.Image !== "function") return handle;
    for (const path of ASSETS)
      if (!images[path]) {
        const im = new root.Image();
        images[path] = im;
        im.decoding = "async";
        im.src = root.HellscapeOffline?.assets?.[path] || path;
        im.addEventListener(
          "load",
          () => {
            if (ready()) prepare();
            redraw();
          },
          { once: true },
        );
        im.addEventListener(
          "error",
          () => {
            im.failed = true;
            redraw();
          },
          { once: true },
        );
      }
    return handle;
  }
  function crop(image, rect) {
    const c = canvas(rect[2], rect[3]);
    c.getContext("2d").drawImage(image, ...rect, 0, 0, rect[2], rect[3]);
    return c;
  }
  function polygon(c, points) {
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fill();
  }
  function headCrop(image, def) {
    const c = crop(image, def.rect);
    if (def.mask) {
      const ctx = c.getContext("2d"),
        mask = canvas(c.width, c.height),
        m = mask.getContext("2d");
      m.fillStyle = "#fff";
      polygon(m, def.mask);
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = "source-over";
    }
    return c;
  }
  function prepare(input = images) {
    if (input === handle) input = images;
    if (!ready(input)) return null;
    if (bundles.has(input)) return bundles.get(input);
    const frames = D.walk.map((def, index) => {
      const c = crop(input[def.asset], def.rect),
        ctx = c.getContext("2d");
      const necks = {};
      for (const id of heads) {
        const mask = canvas(768, 512),
          mc = mask.getContext("2d"),
          start = def.neckRoots[id],
          end = def.headRoots[id];
        mc.strokeStyle = "#fff";
        mc.lineWidth = 54;
        mc.lineCap = "round";
        mc.beginPath();
        mc.moveTo(...start);
        mc.lineTo(...end);
        mc.stroke();
        const part = crop(input[def.asset], def.rect),
          pc = part.getContext("2d");
        pc.globalCompositeOperation = "destination-in";
        pc.drawImage(mask, 0, 0);
        ctx.globalCompositeOperation = "destination-out";
        ctx.drawImage(mask, 0, 0);
        necks[id] = part;
      }
      ctx.globalCompositeOperation = "source-over";
      return { ...def, index, canvas: c, necks };
    });
    frames.parts = Object.fromEntries(
      heads.map((id) => [id, headCrop(input[D.parts.asset], D.parts[id])]),
    );
    const tail = crop(input[D.parts.asset], D.parts.tail.rect);
    frames.tail = [
      [340, 768],
      [190, 365],
      [0, 220],
    ].map(([x1, x2]) => {
      const c = canvas(768, 512),
        ctx = c.getContext("2d");
      ctx.beginPath();
      ctx.rect(x1, 0, x2 - x1, 512);
      ctx.clip();
      ctx.drawImage(tail, 0, 0);
      return c;
    });
    if (D.jaw)
      frames.jaw = D.jaw.frames.map((f) => headCrop(input[D.jaw.asset], f));
    if (D.flames)
      frames.flames = D.flames.frames.map((f) =>
        crop(input[D.flames.asset], f.rect),
      );
    bundles.set(input, frames);
    return frames;
  }
  const CAPTURE_ANGLES = D.capture.angles;
  function captureAngle(t) {
    for (let i = 1; i < CAPTURE_ANGLES.length; i++) {
      const [at, a] = CAPTURE_ANGLES[i],
        [old, b] = CAPTURE_ANGLES[i - 1];
      if (t < at) return M.lerp(b, a, M.ease((t - old) / (at - old)));
    }
    return 0.02;
  }
  function captureTime(d) {
    if (d.captureTime !== undefined) return d.captureTime;
    return CAPTURE_ANGLES[Math.min(15, d.actionFrame ?? 0)][0];
  }
  function jawIndex(d, t) {
    if (d.animation !== "capture") return -1;
    return t < 0.81
      ? 0
      : t < D.capture.bite
        ? 1
        : t < D.capture.release
          ? 2
          : 3;
  }
  function transform(part, point) {
    const p = rotate(
      {
        x: (point[0] - part.sourceRoot[0]) * part.scale,
        y: (point[1] - part.sourceRoot[1]) * part.scale,
      },
      part.angle,
    );
    return { x: part.root.x + p.x, y: part.root.y + p.y };
  }
  function sample(demon = {}, travel = {}) {
    const width = demon.width ?? M.CHASE.width,
      unit = width / M.CHASE.width,
      run = M.clamp(demon.runWeight ?? 1);
    const distance = travel.distance ?? demon.worldDistance ?? 0,
      time = travel.time ?? demon.time ?? 0;
    const capture = demon.animation === "capture",
      fire = demon.animation === "fire",
      rage = demon.animation === "rage",
      celebrate = demon.animation === "celebrate";
    const index =
      !capture && (!fire || demon.movingFire) && run > 0.35
        ? ((Math.floor((distance / M.STRIDE) * D.walk.length) % D.walk.length) +
            D.walk.length) %
          D.walk.length
        : 0;
    const def = D.walk[index],
      scale = width / def.referenceWidth;
    const rootPoint = {
      x: (demon.left ?? M.CHASE.left) + width * 0.4,
      y:
        (demon.ground ?? M.CHASE.ground) -
        (def.bounds[3] - def.root[1]) * scale,
    };
    const phase = (distance / M.STRIDE) * Math.PI * 2,
      t = captureTime(demon),
      j = jawIndex(demon, t);
    const world = (p) => ({
      x: rootPoint.x + (p[0] - def.root[0]) * scale,
      y: (demon.ground ?? M.CHASE.ground) + (p[1] - def.bounds[3]) * scale,
    });
    const headParts = Object.fromEntries(
      heads.map((id, i) => {
        const jaw = id === "right" && D.jaw,
          jawFrame = j >= 0 ? j : fire ? 1 : 0,
          part = jaw ? D.jaw.frames[jawFrame] : D.parts[id];
        let neckAngle =
          Math.sin((run > 0.35 ? phase : time * 0.8) + i * 1.45) *
          (0.018 + run * 0.055);
        let tilt =
          [-0.04, 0.02, 0.03][i] +
          Math.sin((run > 0.35 ? phase : time * 0.8) + i * 1.45 + 0.5) *
            (0.025 + run * 0.1);
        if (capture) {
          neckAngle = i === 2 ? captureAngle(t) : Math.sin(t * 4 + i) * 0.035;
          tilt = i === 2 ? 0.1 : 0;
        }
        if (rage) {
          neckAngle = Math.sin((demon.actionTime ?? time) * 9 + i) * 0.11;
          tilt = Math.sin((demon.actionTime ?? time) * 9 + i + 0.5) * 0.13;
        }
        if (fire) {
          const age = demon.actionTime ?? 0;
          const onset = M.ease(age / 0.22) * (demon.movingFire ? 1 - M.ease((age - 1.5) / 0.3) : 1);
          neckAngle = M.lerp(neckAngle, [-0.14, -0.04, 0.06][i], onset);
          tilt = M.lerp(
            tilt,
            [-0.1, 0, 0.09][i] + Math.sin(time * 13 + i) * 0.025,
            onset,
          );
        }
        const neck = {
          root: world(def.neckRoots[id]),
          sourceRoot: def.neckRoots[id],
          angle: neckAngle,
          scale,
        };
        const p = {
          id,
          root: transform(neck, def.headRoots[id]),
          sourceRoot: part.root,
          angle: neckAngle + tilt,
          scale: part.scale * unit,
          jaw: jaw ? jawFrame : -1,
          definition: part,
          neck,
          unit,
        };
        p.mouth = transform(p, part.mouth);
        const end = transform(p, part.muzzle),
          length = Math.hypot(end.x - p.mouth.x, end.y - p.mouth.y) || 1;
        p.direction = {
          x: (end.x - p.mouth.x) / length,
          y: (end.y - p.mouth.y) / length,
        };
        return [id, p];
      }),
    );
    const td = D.parts.tail,
      tailScale = td.scale * unit,
      tailRoot = world(def.tailRoot);
    const wag = run > 0.35 ? phase * 2 : celebrate ? time * 6 : time * 1.3,
      strength = celebrate ? 1 : 0.15 + run * 0.85;
    const tail = [
      {
        root: tailRoot,
        sourceRoot: td.root,
        angle: Math.sin(wag) * 0.22 * strength,
        scale: tailScale,
      },
    ];
    tail.push({
      root: transform(tail[0], td.joint1),
      sourceRoot: td.joint1,
      angle: tail[0].angle + Math.sin(wag - 0.7) * 0.2 * strength,
      scale: tailScale,
    });
    tail.push({
      root: transform(tail[1], td.joint2),
      sourceRoot: td.joint2,
      angle: tail[1].angle + Math.sin(wag - 1.3) * 0.18 * strength,
      scale: tailScale,
    });
    return {
      index,
      def,
      scale,
      root: rootPoint,
      heads: headParts,
      tail,
      time,
      distance,
      run,
    };
  }
  function geometry(demon = {}, travel = {}) {
    const s = sample(demon, travel),
      world = (p) => ({
        x: s.root.x + (p[0] - s.def.root[0]) * s.scale,
        y:
          (demon.ground ?? M.CHASE.ground) + (p[1] - s.def.bounds[3]) * s.scale,
      });
    return {
      ...s,
      mouths: Object.fromEntries(heads.map((id) => [id, s.heads[id].mouth])),
      directions: Object.fromEntries(
        heads.map((id) => [id, s.heads[id].direction]),
      ),
      mouth: s.heads.right.mouth,
      contact: world(s.def.contact),
      feet: Object.fromEntries(legs.map((id) => [id, world(s.def.feet[id])])),
      tailTip: transform(s.tail[2], D.parts.tail.tip),
      top: (demon.ground ?? M.CHASE.ground) - widthHeight(demon),
    };
  }
  function widthHeight(d) {
    return (d.width ?? M.CHASE.width) * 0.7;
  }
  function paintPart(c, image, part) {
    c.save();
    c.translate(part.root.x, part.root.y);
    c.rotate(part.angle);
    c.scale(part.scale, part.scale);
    c.drawImage(image, -part.sourceRoot[0], -part.sourceRoot[1]);
    c.restore();
  }
  function render(c, demon, travel = {}, input = images) {
    const atlas = prepare(input);
    if (!atlas) return null;
    const s = sample(demon, travel),
      body = atlas[s.index];
    c.save();
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = "high";
    for (let i = 2; i >= 0; i--) paintPart(c, atlas.tail[i], s.tail[i]);
    c.drawImage(
      body.canvas,
      s.root.x - s.def.root[0] * s.scale,
      (demon.ground ?? M.CHASE.ground) - s.def.bounds[3] * s.scale,
      body.canvas.width * s.scale,
      body.canvas.height * s.scale,
    );
    for (const id of heads) {
      const head = s.heads[id];
      paintPart(c, body.necks[id], head.neck);
      paintPart(c, head.jaw >= 0 ? atlas.jaw[head.jaw] : atlas.parts[id], head);
    }

    c.restore();
    return geometry(demon, travel);
  }
  function metrics() {
    const frames = Array.from({ length: 16 }, () => ({
      height: 0.7,
      mouth: { x: 0.92, y: 0.65 },
    }));
    frames.actorPoints = (d) => geometry(d);
    return frames;
  }
  function dust(c, demon, travel) {
    if ((demon.runWeight ?? 1) < 0.35) return;
    const unit = (demon.width ?? 221) / 221;
    for (const event of travel?.footfalls ?? []) {
      const age = travel.time - event.at;
      if (age < 0 || age > 0.35) continue;
      const distance = (event.index * M.STRIDE) / 2;
      const birth = geometry(
          { ...demon, left: demon.left + distance - travel.distance },
          { distance, time: event.at },
        ),
        p = birth.contact;
      c.save();
      c.globalAlpha *= 0.4 * (1 - age / 0.35);
      c.fillStyle = "#a88969";
      for (let i = 0; i < 5; i++)
        c.fillRect(
          p.x + (i - 2) * age * 22,
          p.y - Math.sin((age / 0.35) * Math.PI) * (2 + (i % 3)) * unit,
          2 * unit,
          unit,
        );
      c.restore();
    }
  }
  // One breath per minute of active scene time, first at 60 seconds.
  // Rendering and UI rebuilds never restart the cycle or consume game RNG.
  function periodicFire(time) {
    const start = 60, interval = 60, duration = 1.8;
    const age = time < start ? -1 : (time - start) % interval;
    return {active: age >= 0 && age < duration, age, duration, emissionAge: age - .2};
  }
  function flame(c, id, age, head, duration = 1.3, input = images) {
    if (age < 0 || age >= duration) return;
    const atlas = prepare(input);
    if (!atlas?.flames) return false;
    const index =
        (Math.floor(age * 18) + heads.indexOf(id)) % atlas.flames.length,
      def = D.flames.frames[index];
    const envelope =
      M.ease(age / 0.12) * (1 - M.ease((age - duration + 0.22) / 0.22));
    const angle = Math.atan2(head.direction.y, head.direction.x),
      width = 145 * (head.unit ?? 1) * envelope;
    if (!envelope) return true;
    c.save();
    c.translate(head.mouth.x, head.mouth.y);
    c.rotate(angle);
    c.scale(width / def.length, width / def.length);
    c.drawImage(atlas.flames[index], -def.source[0], -def.source[1]);
    c.restore();
    return true;
  }
  const api = {
    ASSET,
    ASSETS,
    SOURCE,
    heads,
    legs,
    data: D,
    load,
    ready,
    prepare,
    sample,
    geometry,
    metrics,
    render,
    dust,
    flame,
    periodicFire,
    transform,
    captureAngle,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.FoolCerbero = api;
})(globalThis);
