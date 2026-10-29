"""A final skipped/forfeited turn enters the tie intro without losing its first question."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright, expect
import threading, os

ROOT = Path(__file__).resolve().parent.parent

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
        for kind in ['forfeit', 'skip']:
            for width, height, reduced in [(1366, 768, False), (667, 375, True)]:
                q = browser.new_page(viewport={'width': width, 'height': height}, reduced_motion='reduce' if reduced else 'no-preference')
                errors = []
                q.on('pageerror', lambda error: errors.append(str(error)))
                q.clock.install()
                q.goto(f'http://127.0.0.1:{server.server_port}/Fool.html?start=1')
                q.get_by_role('button', name='Inizia partita (13 turni)', exact=True).click()
                q.clock.pause_at(q.evaluate('Date.now()+1000'))
                q.clock.run_for(2000)
                q.evaluate('''kind => {
                    const g=HellscapeUI.game,s=g.s;
                    s.config.turnCount=kind==='forfeit'?1:2;
                    const c={id:g.uid(),type:kind==='forfeit'?'arsenico':'salta',target:null,origin:'test'};
                    s.groups[s.owner].inventory.push(c);
                    g.use(c.id,s.order[1]);
                    if(kind==='skip'){g.reveal();g.answer((s.current.correct+1)%4);HellscapeUI.changed();g.next();}
                    HellscapeUI.changed();
                }''', kind)
                q.clock.run_for(3500 if not reduced else 1000)
                expect(q.locator('.tie-heading')).to_have_text('ULTIMO MIGLIO')
                before = q.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')
                first = q.evaluate('HellscapeUI.game.s.current.id')
                assert q.evaluate('HellscapeUI.game.s.tieIndex') == 0
                assert q.evaluate('HellscapeUI.game.s.respondent===HellscapeUI.game.s.tieOrder[0]')
                assert q.locator('.operation-body').evaluate('e=>e.inert')
                q.keyboard.press('Enter')
                q.keyboard.press('a')
                assert q.evaluate('JSON.stringify(HellscapeUI.game.snapshot())') == before
                q.get_by_role('button', name='Pausa scena', exact=True).click()
                q.clock.run_for(100)
                elapsed = q.evaluate('FoolHellRace.tieStatus().elapsed')
                q.clock.run_for(500)
                assert q.evaluate('FoolHellRace.tieStatus().elapsed') == elapsed
                q.get_by_role('button', name='Riprendi scena', exact=True).click()
                q.get_by_role('button', name='Inizia Ultimo Miglio' if reduced else 'Salta introduzione', exact=True).click()
                q.clock.run_for(100)
                assert not q.locator('.tie-layer').count()
                assert not q.evaluate('FoolHellRace.tieStatus().waiting')
                assert q.evaluate('JSON.stringify(HellscapeUI.game.snapshot())') == before
                assert q.evaluate('document.activeElement?.dataset.gameAction') == 'reveal', q.evaluate('({active:document.activeElement?.tagName,body:document.body.className,tie:FoolHellRace.tieStatus()})')
                q.get_by_role('button', name='Svela e avvia il tempo', exact=True).click()
                assert q.evaluate('HellscapeUI.game.s.current.id') == first
                assert q.evaluate('HellscapeUI.game.s.screen') == 'answer'
                assert q.evaluate('HellscapeUI.game.running')
                assert not errors, errors
                q.close()
        browser.close()
    print('PASS: final forfeit and skip tie intros, frozen state, pause, input, first question and focus; desktop/mobile/reduced motion')
finally:
    server.shutdown()
