"use strict";
const { loadImage } = require("@napi-rs/canvas");
const path = require("node:path");
const K = require("../assets/hell-cerbero.js");
module.exports = () =>
  Promise.all(
    K.ASSETS.map(async (file) => [
      file,
      await loadImage(path.join(__dirname, "..", file)),
    ]),
  ).then(Object.fromEntries);
