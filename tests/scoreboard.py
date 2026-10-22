"""Sequential pixel feedback, percentage multiplier and clear inventory quantities."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import threading,re
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
   page.goto(base+'Fool.html');page.get_by_role('button',name='Inizia partita').click()
   assert page.locator('.team-icon,.team details,.team summary,.multiplier').count()==0
   assert 'Serie' not in page.locator('.scoreboard').inner_text()
   assert '×' not in page.locator('.scoreboard').inner_text()
   for item in page.locator('.bonus-list li').all():expect(item).to_be_visible()
   page.evaluate('()=>{game.s.config.probability=100;persist()}')
   last_color=None
   for attempt in range(2):
    page.get_by_role('button',name='Svela e avvia il tempo').click();team=page.evaluate('game.s.respondent')
    page.locator('.answer').nth(page.evaluate('game.s.current.correct')).click()
    banner=page.locator('.answer-feedback');expect(banner).to_have_text('CORRETTO')
    assert banner.evaluate('e=>getComputedStyle(e).color')=='rgb(255, 230, 0)'
    assert banner.locator('span').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
    card=page.locator(f'.team[data-team="{team}"]');value=card.locator('.multiplier-value')
    expect(value).to_have_text('110%' if attempt==0 else '120%')
    assert value.evaluate('e=>e.getAnimations().length')==0
    bonus=page.evaluate('game.s.result.bonus.type');entry=card.locator(f'[data-bonus="{bonus}"]')
    assert entry.evaluate('e=>e.getAnimations().length')==0
    if w==390 and not reduced:page.screenshot(path=str(ROOT/f'tests/correct-banner-{attempt}.png'),full_page=True)
    expect(banner).to_have_count(0)
    if reduced:assert page.evaluate('document.getAnimations().length')==0
    else:
     assert value.evaluate('e=>e.getAnimations().length')==1
     assert entry.evaluate('e=>e.getAnimations().length')==1
     assert value.evaluate('e=>e.getAnimations()[0].effect.getKeyframes()[0].color')=='rgb(255, 230, 0)'
    assert page.locator('#fit-warning').is_hidden()
    page.evaluate('renderGame()');assert page.evaluate('document.getAnimations().length')==0
    color=value.evaluate('e=>getComputedStyle(e).color')
    channels=[int(x) for x in re.findall(r'\d+',color)]
    if last_color:assert sum(channels)>sum(last_color)
    last_color=channels
    page.reload();page.get_by_role('button',name='Riprendi partita',exact=True).click()
    assert page.locator('.answer-feedback').count()==0 and page.evaluate('document.getAnimations().length')==0
    page.evaluate('i=>{game.next();game.s.owner=i;game.s.respondent=i;changed()}',team)
   # A wrong answer shows red, then flashes the lost percentage before removing it.
   page.get_by_role('button',name='Svela e avvia il tempo').click()
   page.locator('.answer').nth(page.evaluate('(game.s.current.correct+1)%4')).click()
   expect(page.locator('.answer-feedback')).to_have_text('SBAGLIATO')
   assert page.locator('.answer-feedback').evaluate('e=>getComputedStyle(e).color')=='rgb(255, 51, 34)'
   assert page.locator('.answer-feedback span').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
   assert page.locator('.multiplier-lost').count()==0
   expect(page.locator('.answer-feedback')).to_have_count(0)
   expect(card.locator('.multiplier-lost .multiplier-value')).to_have_text('120%')
   if not reduced:assert card.locator('.multiplier-value').evaluate('e=>e.getAnimations()[0].effect.getKeyframes()[0].color')=='rgb(255, 51, 34)'
   if w==390 and not reduced:page.screenshot(path=str(ROOT/'tests/multiplier-lost.png'),full_page=True)
   expect(card.locator('.multiplier')).to_have_count(0)
   page.get_by_role('button',name='Bonus e inventari',exact=True).click()
   page.locator('#inventory-team').select_option(str(team))
   assert '×' not in page.locator('.inventory-list').inner_text()
   page.get_by_role('button',name='Chiudi',exact=True).click()
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   assert not errors,errors
   page.close()
 # Advancing early cancels pending feedback; timeouts use the same negative banner.
 page=browser.new_page(viewport={'width':390,'height':844});page.goto(base+'Fool.html');page.get_by_role('button',name='Inizia partita').click()
 page.get_by_role('button',name='Svela e avvia il tempo').click();page.locator('.answer').nth(page.evaluate('game.s.current.correct')).click()
 expect(page.locator('.answer-feedback')).to_have_text('CORRETTO')
 page.get_by_role('button',name='Prossima domanda',exact=True).click();expect(page.locator('.answer-feedback')).to_have_count(0)
 page.wait_for_timeout(1150);assert page.evaluate('document.getAnimations().length')==0
 page.get_by_role('button',name='Svela e avvia il tempo').click();page.evaluate('game.deadline=performance.now()-1')
 expect(page.locator('.answer-feedback')).to_have_text('SBAGLIATO')
 page.close();browser.close()
 print('Feedback: banner CORRETTO/SBAGLIATO, poi bonus/moltiplicatore; percentuali/gradiente, perdita rossa, quantità senza ×, ripresa/cancellazione, timeout e movimento ridotto: OK')
