"""Scene geometry, native-size controls, scroll, focus and unchanged saved state."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright, expect
import json
import os
import threading

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / 'artifacts/layout'
ART.mkdir(parents=True, exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}/'
checks = []
errors = []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
        for dpr in [1, 2]:
            for width, height in [(1920,1080), (1366,768), (1024,768), (844,390), (390,844)]:
                page = browser.new_page(viewport={'width':width,'height':height}, device_scale_factor=dpr, reduced_motion='reduce')
                page.on('pageerror', lambda e: errors.append(str(e)))
                page.add_init_script('Math.random=()=>.25')
                page.goto(base)
                page.evaluate('document.fonts.ready')
                page.locator('.home-wordmark').evaluate('i=>i.decode()')
                compact = page.evaluate('document.body.dataset.layout') == 'compact'
                if compact:
                    assert page.locator('.menu a').first.bounding_box()['height'] >= 44
                    assert page.locator('.menu button').bounding_box()['height'] >= 44
                    assert page.locator('.home-keys').is_hidden()
                    for control in page.locator('.menu a:not([hidden]),.menu button').all():
                        r = control.bounding_box()
                        assert r['y'] >= 0 and r['y'] + r['height'] <= height + 1
                page.screenshot(path=str(ART/f'home-{width}-dpr{dpr}.png'))
                page.get_by_role('link', name='Nuova partita', exact=True).click()
                expect(page.get_by_role('button', name='Inizia partita')).to_be_enabled()
                if compact:
                    for i in range(3):
                        assert page.locator(f'#vehicle{i}').bounding_box()['height'] >= 44
                page.screenshot(path=str(ART/f'selection-{width}-dpr{dpr}.png'))
                page.get_by_role('button', name='Inizia partita').click()
                expect(page.get_by_role('button', name='Svela e avvia il tempo')).to_be_visible()
                page.get_by_role('button', name='Svela e avvia il tempo').click()
                page.evaluate("HellscapeUI.game.pause('Verifica layout');HellscapeUI.changed()")
                page.wait_for_function('FoolEnding.prepare(FoolEnding.load(()=>{}))!==null')
                page.wait_for_timeout(150)
                assert page.locator('#fit-warning').is_hidden()
                if compact:
                    assert page.locator('.question').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)') >= 18
                    assert page.locator('#viewport-stage').evaluate('e=>getComputedStyle(e).transform') == 'none'
                    for answer in page.locator('.answer').all():
                        assert answer.bounding_box()['height'] >= 44
                    panel = page.locator('.operation-body').bounding_box()
                    if panel['height'] < height - 70:
                        assert panel['y'] >= 0 and panel['y'] + panel['height'] <= height + 1
                canvas = page.locator('.hell-race canvas')
                r = canvas.bounding_box()
                assert abs(r['width']/r['height']-4/3) < .001
                assert r['width'] <= width + 1 and r['height'] <= height + 1
                assert canvas.evaluate('c=>c.width>=512 && c.width<=1536 && Math.abs(c.width/c.height-4/3)<.005')
                before = page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')
                pixels = canvas.evaluate('c=>c.toDataURL()')
                page.screenshot(path=str(ART/f'question-{width}-dpr{dpr}.png'))
                canvas.screenshot(path=str(ART/f'scene-{width}-dpr{dpr}.png'))
                # Reflow reallocates the bounded DPR raster while preserving game state.
                page.set_viewport_size({'width':height,'height':width})
                page.wait_for_timeout(150)
                assert canvas.evaluate('c=>c.width<=1536 && Math.abs(c.width/c.height-4/3)<.005')
                assert page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())') == before
                assert page.locator('#fit-warning').is_hidden()
                assert page.evaluate('document.querySelector("#viewport-stage").scrollWidth<=document.querySelector("#viewport-stage").clientWidth+1')
                page.set_viewport_size({'width':width,'height':height})
                page.get_by_role('button', name='Opzioni', exact=True).click()
                page.get_by_role('button', name='Schermo intero', exact=True).click()
                page.wait_for_function('!!document.fullscreenElement')
                page.wait_for_timeout(150)
                r = canvas.bounding_box()
                assert abs(r['width']/r['height']-4/3) < .001
                assert page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())') == before
                page.evaluate('document.exitFullscreen()')
                page.get_by_role('button', name='Chiudi', exact=True).click()
                if compact:
                    page.locator('#viewport-stage').evaluate('e=>e.style.padding="20px 16px"')
                    page.evaluate('fitFoolViewport()')
                    r = canvas.bounding_box()
                    assert r['width'] <= width - 32 + 1 and r['height'] <= height - 40 + 1
                    assert abs(r['width']/r['height']-4/3) < .001
                    assert page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())') == before
                checks.append({'viewport':[width,height], 'dpr':dpr, 'compact':compact})
                page.close()
        browser.close()
finally:
    server.shutdown()
assert not errors, errors
print(json.dumps({'responsive':checks, 'errors':errors}, indent=2))
