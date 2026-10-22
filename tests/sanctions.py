"""Sanction steppers, pending edits and the decisive second elimination."""
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
def fits(page):assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(640,360),(844,390),(844,390),(1440,900)]:
  page=browser.new_page(viewport={'width':w,'height':h});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'Fool.html');page.get_by_role('button',name='Inizia partita').click()
  page.get_by_role('button',name='Svela e avvia il tempo').click()
  page.get_by_role('button',name='Sanzioni',exact=True).click()
  assert page.locator('#dialog input').count()==0
  expect(page.locator('#sanction-minus-0')).to_be_disabled()
  page.locator('#sanction-plus-0').click();expect(page.locator('#sanction-0')).to_have_text('1')
  assert page.evaluate('game.s.groups[0].sanctions')==0
  before=page.evaluate('game.left()');page.wait_for_timeout(150);assert page.evaluate('game.left()')==before
  page.locator('#sanction-minus-0').click();expect(page.locator('#sanction-0')).to_have_text('0')
  page.locator('#sanction-plus-0').click();page.get_by_role('button',name='Chiudi senza sanzionare').click()
  assert page.evaluate('game.s.groups[0].sanctions')==0
  # Edits survive a reload but are not applied before confirmation.
  page.get_by_role('button',name='Sanzioni',exact=True).click()
  page.locator('#sanction-plus-0').click();page.locator('#reason-0').select_option('suggerimento')
  page.reload();page.get_by_role('button',name='Riprendi partita',exact=True).click()
  expect(page.locator('#dialog')).to_be_visible();expect(page.locator('#sanction-0')).to_have_text('1')
  expect(page.locator('#reason-0')).to_have_value('suggerimento')
  for _ in range(2):page.locator('#sanction-plus-0').click()
  expect(page.locator('#sanction-plus-0')).to_be_disabled()
  page.get_by_role('button',name='Conferma intervento').click();assert page.evaluate('game.s.groups[0].out')
  expect(page.locator('.team.out')).to_have_count(1)
  assert 'eliminated-x.png' in page.locator('.team.out').evaluate('e=>getComputedStyle(e,"::after").backgroundImage')
  assert page.request.get(base+'assets/eliminated-x.png').ok
  # Add two sanctions to the second team, then its decisive third in another intervention.
  page.get_by_role('button',name='Sanzioni',exact=True).click()
  assert page.locator('#sanction-plus-0').count()==0
  for _ in range(2):page.locator('#sanction-plus-1').click()
  page.get_by_role('button',name='Conferma intervento').click()
  assert page.evaluate('game.s.groups[1].sanctions')==2
  page.get_by_role('button',name='Sanzioni',exact=True).click();page.locator('#sanction-plus-1').click()
  expect(page.locator('#sanction-plus-1')).to_be_disabled()
  page.screenshot(path=str(ROOT/f'tests/sanctions-{w}.png'),full_page=True)
  page.get_by_role('button',name='Conferma intervento').click()
  expect(page.get_by_role('heading',name='Gruppo 3 WINS',exact=True)).to_be_visible()
  expect(page.locator('#dialog')).not_to_be_visible();expect(page.locator('#fit-warning')).not_to_be_visible()
  assert page.evaluate('game.s.winner')==2 and page.evaluate('game.s.phase')=='conclusa'
  assert not page.evaluate('game.s.paused || game.running || game.s.suspended')
  assert page.locator('#timer').count()==0
  assert page.locator('.team').count()==0;fits(page)
  page.screenshot(path=str(ROOT/f'tests/winner-{w}.png'),full_page=True)
  page.reload();page.get_by_role('button',name='Riprendi partita',exact=True).click()
  expect(page.get_by_role('heading',name='Gruppo 3 WINS',exact=True)).to_be_visible()
  assert page.evaluate('game.s.winner')==2
  page.get_by_role('button',name='Torna alla schermata iniziale',exact=True).click()
  expect(page.get_by_role('link',name='Start',exact=True)).to_be_visible()
  assert not errors,errors
  page.close()
 browser.close()
 print('Sanzioni +/-: limiti, annullamento, timer, modifiche pendenti/ripresa, due eliminazioni successive e vincitore: OK su mobile/desktop')
