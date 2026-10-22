"""Question value, line-by-line bonuses and elimination overlay, including resume."""
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
 for w,h in [(240,320),(390,844),(1440,900)]:
  page=browser.new_page(viewport={'width':w,'height':h});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'Fool.html');page.get_by_role('button',name='Inizia partita').click()
  value=page.evaluate('game.s.config.bases[game.s.current.difficulty]')
  expect(page.locator('.question-points')).to_have_text(str(value)+' punti')
  assert page.evaluate('!document.querySelector(".operation-body").textContent.includes(game.s.current.topicName)')
  assert page.evaluate('!document.querySelector(".operation-body").textContent.includes(game.s.current.difficulty)')
  assert page.locator('.team ul.bonus-list li').count()==15
  assert page.locator('.team ol').count()==0
  page.locator('.team summary').first.click() if w<=650 else None
  assert page.locator('.team .bonus-list li').first.evaluate('e=>getComputedStyle(e.parentElement).listStyleType')=='none'
  page.get_by_role('button',name='Svela e avvia il tempo').click()
  expect(page.locator('.question-points')).to_have_text(str(value)+' punti')
  page.get_by_role('button',name='Pausa',exact=True).click()
  # Eliminate the first team through the real discipline UI.
  page.get_by_role('button',name='Sanzioni',exact=True).click();page.locator('#sanction-0').fill('3')
  page.get_by_role('button',name='Conferma intervento').click()
  assert page.evaluate('game.s.groups[0].out')
  out=page.locator('.team.out');expect(out).to_have_count(1)
  assert 'eliminated-x.svg' in out.evaluate('e=>getComputedStyle(e,"::after").backgroundImage')
  assert out.evaluate('e=>getComputedStyle(e,"::after").pointerEvents')=='none'
  # The overlay never blocks the details control and follows card size.
  out.locator('summary').click()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  page.screenshot(path=str(ROOT/f'tests/display-eliminated-{w}.png'),full_page=True)
  page.reload();page.get_by_role('button',name='Riprendi partita',exact=True).click()
  expect(page.locator('.team.out')).to_have_count(1)
  # Inventory entries also use an unnumbered list, with commands still usable.
  page.evaluate('()=>{const i=game.s.respondent;for(const type of F.TYPES)game.s.groups[i].inventory.push({id:game.uid(),type,target:null,origin:"test"});renderGame()}')
  page.get_by_role('button',name='Bonus e inventari',exact=True).click()
  assert page.locator('.inventory-list ul li').count()==5
  assert page.locator('.inventory-list ol').count()==0
  assert page.locator('.inventory-list ul').evaluate('e=>getComputedStyle(e).listStyleType')=='none'
  page.get_by_role('button',name='Chiudi',exact=True).click()
  assert not errors,errors
  page.close()
 browser.close()
 print('Display: solo punti, bonus per riga senza numeri, X sui soli eliminati e ripresa: OK su 240/390/1440 px')
