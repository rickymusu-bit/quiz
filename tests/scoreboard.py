"""Always visible bonuses/multiplier and event-scoped, optional motion."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import threading
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base='http://127.0.0.1:'+str(server.server_port)+'/'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(240,320),(390,844),(844,390),(1440,900)]:
  for reduced in [False,True]:
   page=browser.new_page(viewport={'width':w,'height':h},reduced_motion='reduce' if reduced else 'no-preference');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(base+'Fool.html');expect(page.get_by_role('button',name='Inizia partita')).to_be_enabled()
   assert page.locator('[id^=icon],.team-icon').count()==0
   assert page.locator('select').count()==1
   page.get_by_role('button',name='Inizia partita').click()
   assert page.locator('.team details,.team summary,.team-icon').count()==0
   assert 'Serie' not in page.locator('.scoreboard').inner_text()
   for card in page.locator('.team').all():
    expect(card.locator('.multiplier-label')).to_have_text('Moltiplicatore')
    expect(card.locator('.multiplier-value')).to_have_text('×1,00')
    for item in card.locator('.bonus-list li').all():expect(item).to_be_visible()
   page.evaluate('()=>{game.s.config.probability=100;persist()}')
   # Two ordinary correct answers by the same team; each emits fresh feedback.
   for attempt in range(2):
    page.get_by_role('button',name='Svela e avvia il tempo').click()
    team=page.evaluate('game.s.respondent')
    page.locator('.answer').nth(page.evaluate('game.s.current.correct')).click()
    card=page.locator(f'.team[data-team="{team}"]')
    bonus=page.evaluate('game.s.result.bonus.type');expect(card.locator(f'[data-bonus="{bonus}"]')).to_be_visible()
    expected='×1,10' if attempt==0 else '×1,20'
    expect(card.locator('.multiplier-value')).to_have_text(expected)
    if reduced:assert page.evaluate('document.getAnimations().length')==0
    else:
     assert card.evaluate('e=>e.getAnimations().length')==1
     assert card.locator('.multiplier-value').evaluate('e=>e.getAnimations().length')==1
     assert card.locator(f'[data-bonus="{bonus}"]').evaluate('e=>e.getAnimations().length')==1
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    assert page.locator('#fit-warning').is_hidden()
    if attempt==0:
     page.screenshot(path=str(ROOT/f'tests/scoreboard-{w}-{reduced}.png'),full_page=True)
     page.evaluate('renderGame()');assert page.evaluate('document.getAnimations().length')==0
     page.reload();page.get_by_role('button',name='Riprendi partita',exact=True).click()
     assert page.evaluate('document.getAnimations().length')==0
     # Assign the next valid turn to this same team to exercise multiplier growth.
     page.evaluate('i=>{game.next();game.s.owner=i;game.s.respondent=i;changed()}',team)
   # Wrong answers update the multiplier without celebratory effects.
   page.evaluate('()=>{game.next();changed()}')
   page.get_by_role('button',name='Svela e avvia il tempo').click()
   page.locator('.answer').nth(page.evaluate('(game.s.current.correct+1)%4')).click()
   assert page.evaluate('document.getAnimations().length')==0
   assert not errors,errors
   page.close()
 browser.close()
 print('Tabellone: nessuna icona/serie/dettaglio, bonus e Moltiplicatore visibili; animazioni corretta/bonus/aumento, nessun replay, movimento ridotto: OK')
