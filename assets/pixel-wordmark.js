/* Raster art rendered at an intentionally low logical resolution to match the race. */
(function () {
  "use strict";
  function pixelate(img) {
    if (!img.isConnected || !img.naturalWidth || !img.naturalHeight || img.dataset.pixelated) return;
    const isHome = img.classList.contains("home-wordmark");
    const width = isHome ? 256 : 68;
    const height = Math.max(1, Math.round(width * img.naturalHeight / img.naturalWidth));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true; // Downsample once, then upscale with nearest neighbors.
    ctx.drawImage(img, 0, 0, width, height);
    // Keep the original img element: keyboard, accessibility and legacy img.decode().
    img.dataset.pixelated = "true";
    img.classList.add("pixel-wordmark");
    img.src = canvas.toDataURL("image/png");
  }
  for (const img of document.querySelectorAll("img.home-wordmark, img.hellscape-logo")) {
    if (img.complete) pixelate(img);
    else img.addEventListener("load", () => pixelate(img), { once: true });
  }
})();
