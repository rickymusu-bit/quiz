"""Reproducibly export canonical gate-1 capture references.

This produces INPUTS ONLY, not a generated bite or a final capture animation.
The coupe V0 is taken from the SAME segmented HTMLCanvasElement used by the
game's vehicle renderer, not from a hand-guessed rectangle on its irregular WebP.
All outputs are local artifacts; new art is never silently approved or committed.
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import shutil
import subprocess
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "artifacts" / "capture-gate1"
OUT.mkdir(parents=True, exist_ok=True)
RUN = ROOT / "assets/hell-race/production/cerbero/run-stabilized-v1"
SOURCE_VEHICLES = ROOT / "assets/hell-race/vehicles-drive-v1.webp"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def assert_rgba(path: Path) -> dict:
    with Image.open(path) as im:
        if im.mode != "RGBA":
            raise AssertionError(f"{path}: not RGBA: {im.mode}")
        alpha = im.getchannel("A")
        bounds = alpha.getbbox()
        if not bounds or alpha.getextrema()[0] != 0:
            raise AssertionError(f"{path}: missing foreground or transparency")
        return {"width": im.width, "height": im.height, "alpha_bounds": bounds}


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


# Both ends of the currently approved run are preserved for choosing C-A by eye.
# Neither is called the approved capture pose before visual review.
candidates = {}
for idx in (1, 8):
    src = RUN / f"frames/{idx:03}.png"
    dst = OUT / f"cerbero_A_candidate_{idx:03}.png"
    shutil.copyfile(src, dst)
    candidates[str(idx)] = {
        "relative_source": str(src.relative_to(ROOT)),
        "sha256": sha(src),
        "export_sha256": sha(dst),
        "image": assert_rgba(dst),
        "approval": "candidate, NOT approved as C-A",
    }
    if sha(dst) != sha(src):
        raise AssertionError("Source reference changed during staging")

server = ThreadingHTTPServer(
    ("127.0.0.1", 0), partial(Quiet, directory=str(ROOT))
)
threading.Thread(target=server.serve_forever, daemon=True).start()
errors = []
try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            executable_path=os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium"),
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        page = browser.new_page(viewport={"width": 1366, "height": 768})
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(
            f"http://127.0.0.1:{server.server_port}/Fool.html",
            wait_until="domcontentloaded",
        )
        # vehiclePreview draws only once sheets.vehicles is completely loaded.
        page.wait_for_function(
            """() => {
              if (!window.FoolHellRace?.vehiclePreview) return false;
              const c = FoolHellRace.vehiclePreview('coupe');
              const a = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
              for (let i = 3; i < a.length; i += 4) if (a[i] > 0) return true;
              return false;
            }""",
            timeout=90000,
        )
        captured = page.evaluate(
            """() => {
              let nativeSource = null;
              const prototype = CanvasRenderingContext2D.prototype;
              const original = prototype.drawImage;
              try {
                prototype.drawImage = function (...args) {
                  // The source of the vehicle preview is the already segmented,
                  // transparent canonical coupe frame 0, not the scaled preview.
                  if (args[0] instanceof HTMLCanvasElement &&
                      args.length >= 9 &&
                      this.canvas?.width === 320 && this.canvas?.height === 180)
                    nativeSource = args[0].toDataURL('image/png');
                  return original.apply(this, args);
                };
                FoolHellRace.vehiclePreview('coupe');
              } finally {
                prototype.drawImage = original;
              }
              return nativeSource;
            }"""
        )
        if not captured or not captured.startswith("data:image/png;base64,"):
            raise AssertionError("Could not capture native coupe V0 renderer source")
        raw = base64.b64decode(captured.partition(",")[2], validate=True)
        with Image.open(BytesIO(raw)) as img:
            if img.mode != "RGBA":
                raise AssertionError(f"Renderer V0 image mode {img.mode}")
            img.load()
            img.save(OUT / "coupe_V0_intact.png")
        if errors:
            raise AssertionError(f"Browser errors: {errors}")
        browser.close()
finally:
    server.shutdown()

v0 = OUT / "coupe_V0_intact.png"
assert v0.exists()
v0_image = assert_rgba(v0)
report = {
    "purpose": "Asset input audit, not animated-browser preview or gameplay approval",
    "head": subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
    ).strip(),
    "game_reference": "FoolHellRace.vehiclePreview('coupe'), native first frame",
    "capture_algorithm": "instrumented canvas drawImage on canonical segmented vehicle frame",
    "original_vehicle_atlas": str(SOURCE_VEHICLES.relative_to(ROOT)),
    "original_vehicle_atlas_sha256": sha(SOURCE_VEHICLES),
    "v0_png": str(v0.relative_to(ROOT)),
    "v0_png_sha256": sha(v0),
    "v0_image": v0_image,
    "approach_candidates": candidates,
    "next": "Visual approval of C-A, then isolated C-B / C-C generation and bite anchors",
    "requires_sprites_post_for_new_pose_postprocessing": True,
}
(OUT / "report.json").write_text(
    json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
)
print("PASS: original Cerbero references unchanged; canonical coupe V0 exported as RGBA")
