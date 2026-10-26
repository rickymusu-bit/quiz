import os
"""Regression: the pixel-art chase is visual only and survives game transitions."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import subprocess
import threading
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parent.parent
subprocess.run(["node", "--check", str(ROOT / "assets" / "hell-race.js")], check=True)

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Quiet, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{server.server_port}/"
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH","/usr/bin/chromium"), args=["--no-sandbox"])
        for width, height, reduced in [(1440, 900, False), (844, 390, False), (1024, 600, True)]:
            page = browser.new_page(
                viewport={"width": width, "height": height},
                reduced_motion="reduce" if reduced else "no-preference",
            )
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(base + "Fool.html?start=1")
            # Six visual options, including an Ape in place of the motocross.
            for i in range(3):
                expect(page.locator(f"#vehicle{i}")).to_be_visible()
                assert page.locator(f"#vehicle{i} option").count() == 6
            expect(page.locator("#vehicle2 option[value='ape']")).to_have_count(1)
            assert page.locator("#vehicle0 option[value='motorcross']").count() == 0
            page.locator("#vehicle0").select_option("coupe")
            page.locator("#vehicle1").select_option("coupe")
            page.get_by_role("button", name="Inizia partita").click()
            expect(page.locator("#message")).to_contain_text("tre veicoli diversi")
            page.locator("#vehicle1").select_option("truck")
            page.locator("#vehicle2").select_option("ape")
            page.get_by_role("button", name="Inizia partita").click()
            assert page.evaluate("HellscapeUI.game.s.config.vehicles") == ["coupe", "truck", "ape"]
            page.wait_for_function("""() => [...document.styleSheets].length > 0""")
            for asset in ("vehicles.webp", "demon.webp"):
                response = page.request.get(base + "assets/hell-race/" + asset)
                assert response.status == 200 and response.body(), asset
            expect(page.locator(".hell-race canvas")).to_have_count(1)
            page.wait_for_function(
                "document.querySelector('.hell-race canvas').width > 0"
            )
            assert page.evaluate("HellscapeUI.game.s.valid") == 0

            # The race is also mounted during a revealed question.
            page.get_by_role("button", name="Svela e avvia il tempo").click()
            expect(page.locator(".hell-race canvas")).to_have_count(1)
            assert page.evaluate("!!window.FoolHellRace")
            page.locator(".answer").nth(page.evaluate("HellscapeUI.game.s.current.correct")).click()
            assert page.evaluate("HellscapeUI.game.s.valid") == 1
            expect(page.locator(".hell-race canvas")).to_have_count(1)

            # The scene never changes scores itself; both rational and huge
            # scores must be paintable without throwing an exception.
            page.evaluate("""() => {
                HellscapeUI.game.setScore(0, Fool.rational('1', '3'));
                HellscapeUI.game.setScore(1, Fool.rational('123456789123456789123456789'));
                HellscapeUI.changed();
            }""")
            expect(page.locator(".hell-race canvas")).to_have_count(1)
            page.wait_for_timeout(130)

            # Finish is the same original model operation; only the animation
            # differs. It should not require the 33rd question.
            page.evaluate("HellscapeUI.game.complete(1); HellscapeUI.changed()")
            expect(page.locator(".hell-race-final canvas")).to_have_count(1)
            expect(page.locator(".ending.victory")).to_be_visible()
            assert page.evaluate("HellscapeUI.game.s.winner") == 1
            assert not errors, (width, height, errors)
            page.close()
        browser.close()
finally:
    server.shutdown()
