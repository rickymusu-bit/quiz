"""Regression: every cover link returns to the one canonical homepage."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import threading
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT.parent)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base='http://127.0.0.1:'+str(server.server_port)+'/'+ROOT.name+'/'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(390,844),(1440,900)]:
  page=browser.new_page(viewport={'width':w,'height':h});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base);page.get_by_role('link',name='Start',exact=True).click()
  expect(page.get_by_role('button',name='Prepara anteprima')).to_be_enabled()
  page.get_by_role('button',name='Torna alla schermata iniziale',exact=True).click()
  expect(page).to_have_url(base)
  assert page.locator('nav.menu a').all_text_contents()==['Start','Regole']
  assert page.get_by_role('button',name='Nuova partita',exact=True).count()==0
  # A direct visit to Fool.html is the game setup, not an alternate cover.
  page.goto(base+'Fool.html');expect(page.get_by_role('button',name='Prepara anteprima')).to_be_enabled()
  assert page.get_by_role('heading',name='Prepara Fool',exact=True).count()==1
  assert page.locator('.cover').count()==0
  page.get_by_role('button',name='Prepara anteprima').click();page.get_by_role('button',name='Verifica schermo e inizia Fool').click()
  page.get_by_role('button',name='Svela e avvia il tempo').click();page.get_by_role('button',name='Salva nel browser',exact=True).filter(visible=True).click()
  saved=page.evaluate('JSON.parse(localStorage.getItem("fool-v1"))')
  page.reload();page.get_by_role('button',name='Riprendi partita',exact=True).click()
  assert page.evaluate('game.s.current.id')==saved['current']['id'];assert not page.evaluate('game.running')
  page.get_by_role('link',name='Fool, pagina iniziale').click();expect(page).to_have_url(base)
  # The error state's cover action has the same destination.
  page.route('**/datasets.json',lambda route:route.fulfill(status=503,body='Unavailable'))
  page.goto(base+'Fool.html');expect(page.get_by_role('heading',name='Domande non disponibili')).to_be_visible()
  page.get_by_role('button',name='Torna alla schermata iniziale',exact=True).click();expect(page).to_have_url(base)
  assert page.locator('nav.menu a').all_text_contents()==['Start','Regole']
  page.goto(base+'Fool_regole.html');page.locator('#section').select_option('20')
  page.get_by_role('link',name='Torna alla schermata iniziale',exact=True).click();expect(page).to_have_url(base)
  assert page.locator('nav.menu a').all_text_contents()==['Start','Regole']
  assert not errors,errors
  page.close()
 browser.close()
 print('Navigazione: home unica, ritorno da configurazione/errore, accesso diretto e ripresa verificati su mobile e desktop.')
