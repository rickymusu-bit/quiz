/* Hellscape — isolated preview adapter for the approved stabilized Cerbero gallop.
 * Source artwork remains immutable. No capture or flame anchors are inferred here.
 * This adapter is intentionally opt-in until visual QA at game scale. */
(function (root) {
  "use strict";
  const M = typeof module !== "undefined"
    ? require("./hell-motion.js") : root.FoolMotion;
  const ASSET = "assets/hell-race/production/cerbero/run-stabilized-v1/atlas.png";
  const FRAME_WIDTH = 552, FRAME_HEIGHT = 522, COLUMNS = 4, COUNT = 8;
  const REFERENCE_WIDTH = 500;
  // 8 × 100 ms at nominal 48 world px/s, matching the approved diagnostic loop.
  // Distance-based timing also follows slowdowns and freezes during a pause.
  const STRIDE = M.ROAD_SPEED * 0.8;
  let image = null, failed = false, subscribers = new Set();
  const loaded = im => !!im && im.complete !== false &&
    (im.naturalWidth || im.width) === FRAME_WIDTH * COLUMNS &&
    (im.naturalHeight || im.height) === FRAME_HEIGHT * 2;
  function load(redraw = () => {}) {
    if (typeof root.Image !== "function") return { complete: false, failed };
    if (loaded(image) || failed) return { complete: loaded(image), failed };
    subscribers.add(redraw);
    if (!image) {
      image = new root.Image();
      image.decoding = "async";
      image.addEventListener("load", () => {
        if (!loaded(image)) failed = true;
        for (const fn of subscribers) fn();
        subscribers.clear();
      }, { once: true });
      image.addEventListener("error", () => {
        failed = true;
        for (const fn of subscribers) fn();
        subscribers.clear();
      }, { once: true });
      image.src = root.HellscapePreviewResources?.assets?.[ASSET] || ASSET;
    }
    return { complete: loaded(image), failed };
  }
  const ready = (source = image) => loaded(source);
  function index(distance = 0) {
    if (!Number.isFinite(distance)) return 0;
    const phase = ((distance % STRIDE) + STRIDE) % STRIDE;
    return Math.min(COUNT - 1, Math.floor((phase / STRIDE) * COUNT));
  }
  function sample(demon = {}, travel = {}) {
    const width = demon.width ?? M.CHASE.width;
    const scale = width / REFERENCE_WIDTH;
    const distance = travel.distance ?? demon.worldDistance ?? 0;
    const i = index(distance);
    const ground = demon.ground ?? M.CHASE.ground;
    const left = demon.left ?? M.CHASE.left;
    return {
      frame: i,
      sourceRect: [(i % COLUMNS) * FRAME_WIDTH,
        Math.floor(i / COLUMNS) * FRAME_HEIGHT, FRAME_WIDTH, FRAME_HEIGHT],
      destRect: [left, ground - (FRAME_HEIGHT - 16) * scale,
        FRAME_WIDTH * scale, FRAME_HEIGHT * scale],
      scale, distance, ground
    };
  }
  function render(ctx, demon, travel, source = image) {
    if (!ready(source)) return null;
    const frame = sample(demon, travel);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, ...frame.sourceRect, ...frame.destRect);
    ctx.restore();
    return frame;
  }
  const api = Object.freeze({ ASSET, FRAME_WIDTH, FRAME_HEIGHT, COUNT, STRIDE,
    load, ready, index, sample, render });
  if (typeof module !== "undefined") module.exports = api;
  else root.FoolCerberoGallop = api;
})(globalThis);
