/* Hellscape cinematic: visual timing only. Never writes to game state. */
(function (root) {
  "use strict";
  const C =
    typeof module !== "undefined" ? require("./hell-chase.js") : root.FoolChase;
  const F =
    typeof module !== "undefined"
      ? require("./hell-epilogue.js")
      : root.FoolEpilogue;
  const P =
    typeof module !== "undefined"
      ? require("./hell-portal.js")
      : root.FoolPortal;
  const B =
    typeof module !== "undefined"
      ? require("./hell-bridge.js")
      : root.FoolBridge;
  const CAPTURE = C.T.capture,
    plan = C.plan,
    sample = C.sample,
    captureAction = C.captureAction;
  const ease = C.ease,
    lerp = C.lerp;
  const M =
    typeof module !== "undefined"
      ? require("./hell-motion.js")
      : root.FoolMotion;
  const K =
    typeof module !== "undefined"
      ? require("./hell-cerbero.js")
      : root.FoolCerbero;
  function prepare(image) {
    return K.prepare(image);
  }
  function load(redraw) {
    P.load(redraw);
    return K.load(redraw);
  }
  function actor(c, index, x, ground, width = 260) {
    return K.render(c, {
      left: x,
      ground,
      width,
      animation: "capture",
      captureTime:
        K.data.capture.angles[
          Math.min(index, K.data.capture.angles.length - 1)
        ][0],
      runWeight: 0,
    });
  }
  const captureFrame = (t) =>
    C.capturePose(t).reduce((a, b) => (a.weight > b.weight ? a : b)).frame;
  function fireBreath(
    c,
    origin,
    age,
    aim = { x: origin.x + 15, y: origin.y - 110 },
    duration = 1.45,
  ) {
    const dx = aim.x - origin.x,
      dy = aim.y - origin.y,
      length = Math.hypot(dx, dy) || 1;
    return K.flame(
      c,
      "center",
      age,
      {
        mouth: origin,
        direction: { x: dx / length, y: dy / length },
        unit: length / 145,
      },
      duration,
    );
  }
  function poseMetrics() {
    return K.metrics();
  }
  function paintActor(c, W, demon, h, travel) {
    return K.render(c, demon, travel);
  }
  function paintVehicle(c, state, v, h, travel) {
    if (v.visible === false) return;
    c.save();
    if (v.clip !== undefined) {
      c.beginPath();
      c.rect(v.clip, 0, 1024, 384);
      c.clip();
    }
    if (v.clipRight !== undefined) {
      c.beginPath();
      c.rect(0, 0, Math.max(0, v.clipRight), 384);
      c.clip();
    }
    if (v.clipWater) {
      c.beginPath();
      c.rect(-1024, -1024, 3072, v.waterline + 1024);
      c.clip();
    }
    const ride =
      v.attached || v.airborne || v.sinking
        ? { heave: 0, pitch: 0 }
        : M.suspension(
            travel?.cameraDistance ?? travel?.distance ?? 0,
            v.x,
            v.width,
          );
    c.translate(v.x, v.ground - v.height / 2 + ride.heave);
    c.rotate((v.rotation || 0) + ride.pitch);
    h.drawVehicle(c, v.row, 0, 0, v.height / 2);
    c.restore();
  }
  function paintPart(c, W, demon, h, travel, point, width, height) {
    c.save();
    c.beginPath();
    c.rect(point.x - width / 2, point.y - height / 2, width, height);
    c.clip();
    paintActor(c, W, demon, h, travel);
    c.restore();
  }
  function paintFrame(c, W, state, f, h) {
    const travel = h.travelFor?.(f.time, f.demon.worldDistance) ?? {
      time: f.time,
      distance: f.demon.worldDistance,
      roadTime: f.demon.worldDistance / 48,
      footfalls: [],
    };
    const held = f.attached === true;
    const cars = f.positions.filter(
      (v) =>
        v.visible !== false && !(held && v.index === f.victim) && !v.foreground,
    );
    for (const v of cars.filter((v) => v.ground <= f.demon.ground))
      paintVehicle(c, state, v, h, travel);
    h.runDust?.(c, f.demon, travel);
    paintActor(c, W, f.demon, h, travel);
    if (held) {
      const v = f.positions[f.victim],
        mouth = f.anchors.mouths?.right ?? f.anchors.mouth;
      paintVehicle(c, state, v, h, travel);
      // Only the biting muzzle overlaps the rear quarter of the rigid vehicle.
      paintPart(
        c,
        W,
        f.demon,
        h,
        travel,
        mouth,
        Math.min(10, v.width * 0.2),
        v.height * 0.7,
      );
    }
    for (const v of cars.filter((v) => v.ground > f.demon.ground))
      paintVehicle(c, state, v, h, travel);

    B.front(c, W, f.camera);
    for (const v of f.positions.filter(
      (v) => v.visible !== false && v.foreground,
    ))
      paintVehicle(c, state, v, h, travel);
    lavaSplash(c, f.lavaImpact);
    h.onFrame?.(f, travel);
    return f;
  }
  function lavaSplash(c, impact) {
    if (!impact || impact.age < 0 || impact.age > 1.25) return;
    const age = impact.age,
      fade = 1 - age / 1.25;
    c.save();
    c.strokeStyle = "#f5a12b";
    c.lineWidth = 1.7;
    c.globalAlpha = fade;
    c.beginPath();
    c.ellipse(impact.x, impact.y, 9 + age * 30, 2 + age * 5, 0, 0, Math.PI * 2);
    c.stroke();
    for (let i = 0; i < 15; i++) {
      const life = 0.55 + (i % 4) * 0.13;
      if (age > life) continue;
      const vx = (i - 7) * 7.5,
        up = 24 + (i % 5) * 9,
        x = impact.x + vx * age,
        y = impact.y - up * age + 55 * age * age;
      const radius = (2 + (i % 3)) * (1 - (age / life) * 0.7);
      c.globalAlpha = (1 - age / life) * 0.9;
      c.fillStyle = i % 3 ? "#f97d16" : "#ffc64c";
      c.beginPath();
      c.ellipse(x, y, radius, radius * 1.4, age * 2, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
  function capturePlan(entry, index) {
    return C.captureRoute(entry, index, poseMetrics());
  }
  function renderCapture(c, W, state, route, time, h) {
    return paintFrame(c, W, state, C.captureFrame(route, time), h);
  }
  // Public single-capture entry point; normal play supplies its actual previous frame.
  const standaloneCaptures = new WeakMap();
  function capture(c, W, state, index, t, h) {
    let routes = standaloneCaptures.get(state);
    if (!routes) {
      routes = new Map();
      standaloneCaptures.set(state, routes);
    }
    if (!routes.has(index))
      routes.set(
        index,
        capturePlan(h.entry ?? C.defaultEntry(state, h), index),
      );
    return renderCapture(c, W, state, routes.get(index), t, h);
  }
  const portalMotion = F.portalAt,
    rageMotion = F.rageAt;
  const sceneRoutes = new WeakMap();
  function resolve(p, state, h) {
    if (!sceneRoutes.has(p))
      sceneRoutes.set(
        p,
        C.prepare(
          p,
          p.entry ?? h.entry ?? C.defaultEntry(state, h),
          poseMetrics(),
        ),
      );
    return sceneRoutes.get(p);
  }
  function frame(p, state, time, h = {}) {
    return C.frame(resolve(p, state, h), time);
  }
  function render(c, W, state, p, time, h) {
    const route = resolve(p, state, h),
      f = C.frame(route, time),
      s = sample(p, time);
    if (["lineup", "capture", "winner-chase"].includes(s.phase)) {
      paintFrame(c, W, state, f, h);
      return s.phase;
    }
    const d = f.demon,
      ground = d.ground,
      winner = p.winner;
    if (winner !== null) {
      const travel = h.travelFor?.(f.time, d.worldDistance);
      paintVehicle(c, state, f.positions[winner], h, travel);
      h.runDust?.(c, d, travel);
      paintActor(c, W, d, h, travel);
      if (f.fireAge !== null && f.fireAge !== undefined) {
        const rig = K.geometry(d, travel);
        for (const side of K.heads) {
          const mouth = rig.mouths[side],
            direction = rig.directions[side];
          K.flame(c, side, f.fireAge, rig.heads[side], F.D.fire - 0.35);
        }
      }
      P.front(c, f.portal);
      B.debris(c, f.bridge, true);
      B.front(c, W, f.camera);
      h.onFrame?.(f, travel);
    } else {
      d.animation = f.camera.speed > 0.5 ? "walk" : "celebrate";
      d.runWeight = f.camera.speed > 0.5 ? 1 : 0;
      const travel = h.travelFor?.(f.time, d.worldDistance);
      paintActor(c, W, d, h, travel);
      B.front(c, W, f.camera);
      h.onFrame?.(f, travel);
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
    poseMetrics,
    capturePlan,
    renderCapture,
    frame,
    capture,
    render,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.FoolEnding = api;
})(globalThis);
