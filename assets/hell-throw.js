/* Rigid vehicle flight, impact and submersion. World geometry only. */
(function (root) {
  "use strict";
  const M =
    typeof module !== "undefined"
      ? require("./hell-motion.js")
      : root.FoolMotion;
  const B =
    typeof module !== "undefined"
      ? require("./hell-bridge.js")
      : root.FoolBridge;
  const LAVA_Z = -142,
    FRONT_DEPTH = B.DEPTH + 42,
    FLIGHT = 1.6,
    SINK = 1.1;
  function extent(width, height, angle) {
    return (
      (Math.abs(Math.cos(angle)) * height) / 2 +
      (Math.abs(Math.sin(angle)) * width) / 2
    );
  }
  function attachment(mouth, car, angle) {
    return {
      x: mouth.x + Math.cos(angle) * car.width * 0.35,
      y: mouth.y + Math.sin(angle) * car.width * 0.35,
    };
  }
  function plan(car, mouth, angle, camera, releaseTime) {
    const centre = attachment(mouth, car, angle),
      depth = car.ground - B.TOP;
    const x = B.worldX(centre.x, depth, camera),
      z = B.TOP + depth - centre.y;
    const vx = 45,
      vz = 76,
      spin = 3.1,
      landingAngle = angle + spin * FLIGHT;
    const halfHeight = extent(car.width, car.height, landingAngle);
    const gravity =
      (2 * (z + vz * FLIGHT - LAVA_Z - halfHeight)) / (FLIGHT * FLIGHT);
    return {
      car: { ...car },
      releaseTime,
      x,
      z,
      depth,
      angle,
      vx,
      vz,
      spin,
      gravity,
      landingAngle,
      halfHeight,
    };
  }
  function sample(p, time, camera) {
    const elapsed = Math.max(0, time - p.releaseTime);
    const age =
      Math.abs(elapsed - FLIGHT) < 1e-9
        ? FLIGHT
        : Math.abs(elapsed - FLIGHT - SINK) < 1e-9
          ? FLIGHT + SINK
          : elapsed;
    const t = Math.min(age, FLIGHT),
      after = Math.max(0, age - FLIGHT);
    const depth = M.lerp(p.depth, FRONT_DEPTH, M.ease(t / 0.85));
    let x = p.x + p.vx * t,
      z = p.z + p.vz * t - (p.gravity * t * t) / 2,
      rotation = p.angle + p.spin * t;
    const impact = B.project(p.x + p.vx * FLIGHT, FRONT_DEPTH, LAVA_Z, camera);
    let centre = B.project(x, depth, z, camera);
    if (age >= FLIGHT) {
      const q = M.ease(after / SINK);
      x += p.vx * 0.1 * (1 - Math.exp(-after / 0.1));
      z = LAVA_Z + p.halfHeight - (2 * p.halfHeight + 8) * q;
      centre = B.project(x, FRONT_DEPTH, z, camera);
      rotation = p.landingAngle + q * 0.1;
    }
    return {
      ...p.car,
      x: centre.x,
      ground: centre.y + p.car.height / 2,
      rotation,
      visible: age < FLIGHT + SINK,
      airborne: age < FLIGHT,
      sinking: age >= FLIGHT,
      foreground: depth > B.DEPTH + 8,
      waterline: impact.y,
      clipWater: age >= FLIGHT,
      world: { x, depth, z },
      impact: { ...impact, age: age - FLIGHT },
      phase: age < FLIGHT ? "flight" : age < FLIGHT + SINK ? "sink" : "removed",
    };
  }
  const api = {
    LAVA_Z,
    FRONT_DEPTH,
    FLIGHT,
    SINK,
    extent,
    attachment,
    plan,
    sample,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.FoolThrow = api;
})(globalThis);
