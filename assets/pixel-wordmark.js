/* Raster art rendered at an intentionally low logical resolution to match the race. */
(function () {
  "use strict";
  function pixelate(img) {
    if (!img.isConnected || !img.naturalWidth || !img.naturalHeight) return;
    const isHome = img.classList.contains("home-wordmark");
    const width = isHome ? 256 : 68;
    const height = Math.max(1, Math.round(width * img.naturalHeight / img.naturalWidth));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.className = img.className + " pixel-wordmark";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", img.alt);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true; // Downsample once, then upscale with nearest neighbors.
    ctx.drawImage(img, 0, 0, width, height);
    img.replaceWith(canvas);
  }
  for (const img of document.querySelectorAll("img.home-wordmark, img.hellscape-logo")) {
    if (img.complete) pixelate(img);
    else img.addEventListener("load", () => pixelate(img), { once: true });
  }
})();
