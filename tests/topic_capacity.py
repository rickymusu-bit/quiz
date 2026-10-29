"""Real settings controls: selected-topic capacity / players, persistence and offline."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright, expect
import threading, os, sys, json, subprocess, hashlib

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs/turni-cerbero/evidence'
record = '--record' in sys.argv
frames = []
report = {'revision': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(), 'checks': [], 'errors': []}
if record:
    from PIL import Image
    from io import BytesIO

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}/'

def capture(q, enabled):
    if record and enabled:
        for _ in range(3):
            q.clock.run_for(250)
            frames.append(Image.open(BytesIO(q.screenshot())).convert('RGB').resize((960, 540), Image.Resampling.LANCZOS))

def only_first(q):
    q.get_by_role('button', name='Argomenti', exact=True).click()
    for i in range(1, q.locator('#quotas input[type=checkbox]').count()):
        checkbox = q.locator('#topic-' + str(i))
        while not checkbox.is_visible():
            q.get_by_role('button', name='Argomenti successivi', exact=True).click()
        checkbox.uncheck()
    while not q.locator('#topic-0').is_visible():
        q.get_by_role('button', name='Argomenti precedenti', exact=True).click()

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
        for bank, width, height, single, easy in [('termologia', 1366, 768, 3, 1), ('introduzione-fisica-misura', 844, 390, 8, 2)]:
            q = browser.new_page(viewport={'width': width, 'height': height})
            q.on('pageerror', lambda e: report['errors'].append(str(e)))
            q.goto(base + 'Fool.html?settings=1')
            q.locator('#bank-choice').select_option(bank)
            q.clock.install(); q.clock.pause_at(q.evaluate('Date.now()+1000'))
            expect(q.locator('#turn-count')).to_have_attribute('max', '33')
            capture(q, width == 1366)
            only_first(q)
            assert q.evaluate('document.documentElement.scrollWidth<=innerWidth+1 && document.documentElement.scrollHeight<=innerHeight+1')
            if record: q.screenshot(path=str(OUT / f'argomento-selezionato-{width}.png'))
            q.get_by_role('button', name='Generali', exact=True).click()
            expect(q.locator('#turn-count')).to_have_attribute('max', str(single))
            expect(q.locator('#turn-count')).to_have_value(str(single))
            capture(q, width == 1366)
            q.locator('#difficulty').select_option('facile')
            expect(q.locator('#turn-count')).to_have_attribute('max', str(easy))
            expect(q.locator('#turn-count')).to_have_value(str(easy))
            capture(q, width == 1366)
            if record: q.screenshot(path=str(OUT / f'massimo-turni-facile-{width}.png'))
            q.locator('#difficulty').select_option('misto')
            q.locator('#turn-count').fill(str(single + 10)); q.locator('#seconds').click()
            expect(q.locator('#turn-count')).to_have_value(str(single))
            q.get_by_role('button', name='Salva impostazioni', exact=True).click()
            expect(q.locator('#message')).to_contain_text('Impostazioni salvate')
            q.goto(base + 'Fool.html?settings=1')
            q.locator('#bank-choice').select_option(bank)
            expect(q.locator('#turn-count')).to_have_attribute('max', str(single))
            expect(q.locator('#quotas input[type=checkbox]:checked')).to_have_count(1)
            capture(q, width == 1366)
            q.get_by_role('button', name='Argomenti', exact=True).click()
            q.locator('#topic-0').uncheck()
            expect(q.locator('#turn-count')).to_be_disabled()
            saved = q.evaluate('localStorage.getItem("fool-settings-v1")')
            q.get_by_role('button', name='Salva impostazioni', exact=True).click()
            assert q.evaluate('localStorage.getItem("fool-settings-v1")') == saved
            q.locator('#topic-0').check(); q.locator('#topic-1').check()
            q.get_by_role('button', name='Generali', exact=True).click()
            expect(q.locator('#turn-count')).to_have_attribute('max', str(single * 2))
            q.locator('#turn-count').fill('1'); q.locator('#seconds').click()
            q.get_by_role('button', name='Salva impostazioni', exact=True).click()
            q.goto(base + 'Fool.html?settings=1')
            q.locator('#bank-choice').select_option(bank)
            expect(q.locator('#quotas input[type=checkbox]:checked')).to_have_count(2)
            expect(q.locator('#turn-count')).to_have_attribute('max', str(single * 2))
            q.locator('#turn-count').fill(str(single * 2)); q.locator('#seconds').click()
            capture(q, width == 1366)
            q.get_by_role('button', name='Salva impostazioni', exact=True).click()
            q.goto(base + 'Fool.html?start=1')
            q.locator('#bank-choice').select_option(bank)
            q.get_by_role('button', name=f'Inizia partita ({single * 2} turni)', exact=True).click()
            assert q.evaluate('HellscapeUI.game.s.config.selectedTopics.length') == 2
            assert q.evaluate('HellscapeUI.game.s.config.turnCount') == single * 2
            # Adapting a previously longer profile must preserve custom settings.
            q.evaluate('''()=>{
                const data=JSON.parse(localStorage.getItem('fool-settings-v1'));
                for(const value of Object.values(data.profiles)){
                    const topics=Object.keys(value.quotas); value.selectedTopics=topics;
                    value.turnCount=99;value.questionCount=99;value.seconds=90;value.bases.facile=777;
                    value.quotas=Object.fromEntries(topics.map((t,i)=>[t,Math.floor(99/topics.length)+(i<99%topics.length?1:0)]));
                }
                localStorage.setItem('fool-settings-v1',JSON.stringify(data));
            }''')
            q.goto(base + 'Fool.html?settings=1'); q.locator('#bank-choice').select_option(bank)
            expect(q.locator('#turn-count')).to_have_value('33')
            expect(q.locator('#base-facile')).to_have_value('777')
            expect(q.locator('#seconds')).to_have_value('90')
            report['checks'].append({'bank': bank, 'viewport': [width, height], 'all_topics_max': 33, 'one_topic_max': single, 'easy_max': easy, 'two_topics_max': single * 2, 'empty_selection': 'blocked', 'selection_survives_one_turn_profile': True})
            q.close()
        # Embedded settings use the same cap with external requests disabled.
        context = browser.new_context(viewport={'width': 844, 'height': 390}, offline=True)
        html = (ROOT / 'dist/Hellscape-offline.html').read_text()
        requests = []
        def route(r):
            if r.request.url == 'http://capacity.test/preview': r.fulfill(content_type='text/html', body=html)
            else: requests.append(r.request.url); r.abort()
        context.route('**/*', route)
        q = context.new_page(); q.goto('http://capacity.test/preview'); f = q.frames[1]
        f.get_by_role('link', name='Impostazioni', exact=True).click(); f = q.frames[1]
        expect(f.locator('#turn-count')).to_have_attribute('max', '33')
        f.locator('#difficulty').select_option('facile')
        expect(f.locator('#turn-count')).to_have_attribute('max', '10')
        assert not requests, requests
        context.close(); browser.close()
    assert not report['errors'], report['errors']
    if record:
        palette = frames[0].quantize(colors=128)
        images = [f.quantize(palette=palette, dither=Image.Dither.NONE) for f in frames]
        gif = OUT / 'limite-turni.gif'
        images[0].save(gif, save_all=True, append_images=images[1:], duration=250, loop=0, optimize=True)
        report['clip'] = {'file': gif.name, 'viewport': [1366, 768], 'pixels': [960, 540], 'duration_ms': len(frames) * 250, 'fps': 4, 'sha256': hashlib.sha256(gif.read_bytes()).hexdigest()}
        (OUT / 'capacity-report.json').write_text(json.dumps(report, indent=2) + '\n')
    print('PASS: selected questions / players, difficulty, clamping, empty selection, persistence, actual start, desktop/mobile and offline')
finally:
    server.shutdown()
