"""Capture REAL browser screenshots/GIF of the opt-in stabilized Cerbero gait.
Diagnostic review only: not an approved replacement for action animations."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
from PIL import Image
from io import BytesIO
import hashlib
import json
import os
import subprocess
import threading

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "artifacts" / "motion" / "cerbero-gallop"
OUT.mkdir(parents=True, exist_ok=True)

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

server = ThreadingHTTPServer(
    ("127.0.0.1", 0), partial(Quiet, directory=str(ROOT))
)
threading.Thread(target=server.serve_forever, daemon=True).start()
report = {
    "revision": subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
    ).strip(),
    "source": "assets/hell-race/production/cerbero/run-stabilized-v1/atlas.png",
    "tool": "rickymusu-bit/sprites-post@870e1274aee5fd42ede786cff7eec944087c7771",
    "viewport": [1366, 768],
    "kind": "real browser preview; NOT approval of capture or fire",
}
try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            executable_path=os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium"),
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        page = browser.new_page(viewport={"width": 1366, "height": 768})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.clock.install()
        page.goto(f"http://127.0.0.1:{server.server_port}/Fool.html?start=1&cerberoGallop=stabilized")
        page.get_by_role(
            "button", name="Inizia partita (13 turni per giocatore)", exact=True
        ).click()
        page.wait_for_function(
            "FoolCerberoGallop.ready() && FoolCerbero.ready()", timeout=120000
        )
        page.evaluate("document.fonts.ready")
        # The gallop API is intentionally Object.freeze()'d. Do not monkeypatch
        # its render function: a non-strict assignment silently fails and would
        # produce zero observations even if the animation really plays.
        # Observe real calls to the browser's canvas drawing API instead.
        page.evaluate("""() => {
          window.__gallopFrames = [];
          const original = CanvasRenderingContext2D.prototype.drawImage;
          CanvasRenderingContext2D.prototype.drawImage = function (...args) {
            const image = args[0];
            const source = image?.currentSrc || image?.src || '';
            if (typeof source === 'string' &&
                source.includes('/cerbero/run-stabilized-v1/atlas.png') &&
                args.length >= 9) {
              const sx = args[1], sy = args[2];
              if (Number.isFinite(sx) && Number.isFinite(sy))
                window.__gallopFrames.push(
                  Math.floor(sy / 522) * 4 + Math.floor(sx / 552)
                );
            }
            return original.apply(this, args);
          };
        }""")
        page.clock.pause_at(page.evaluate("Date.now()+1000"))
        game_before = page.evaluate("JSON.stringify(HellscapeUI.game.snapshot())")
        frames = []
        for _ in range(12):
            page.clock.run_for(100)
            frames.append(Image.open(BytesIO(page.screenshot())).convert("RGB")
                          .resize((683, 384), Image.Resampling.LANCZOS))
        indices = page.evaluate("Array.from(new Set(window.__gallopFrames))")
        assert len(indices) >= 5, f"Atlas does not actually animate: {indices}"
        assert page.evaluate("JSON.stringify(HellscapeUI.game.snapshot())") == game_before, (
            "Presentation must not mutate game state"
        )
        page.screenshot(path=str(OUT / "corsa-browser.png"))
        frames[0].save(
            OUT / "corsa-browser.gif", save_all=True,
            append_images=frames[1:], duration=100, loop=0,
            optimize=True, disposal=2,
        )
        report["frames_seen"] = indices
        report["sampled_duration_ms"] = len(frames) * 100
        report["screenshot_sha256"] = hashlib.sha256(
            (OUT / "corsa-browser.png").read_bytes()
        ).hexdigest()
        report["gif_sha256"] = hashlib.sha256(
            (OUT / "corsa-browser.gif").read_bytes()
        ).hexdigest()
        report["errors"] = errors
        assert not errors, errors
        browser.close()
finally:
    server.shutdown()

(OUT / "report.json").write_text(json.dumps(report, indent=2) + "\n")
print("PASS: real browser renders stabilized run, preserves game state, saves GIF + screenshot")
