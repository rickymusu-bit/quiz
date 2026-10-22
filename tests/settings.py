"""Settings persist separately; the short Start flow never exposes solutions/parameters."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import threading,json
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT.parent)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base='http://127.0.0.1:'+str(server.server_port)+'/'+ROOT.name+'/'
def fits(page):assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(640,360),(844,390),(1440,900)]:
  page=browser.new_page(viewport={'width':w,'height':h});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base);assert page.locator('.menu a').all_text_contents()==['Start','Regole','Impostazioni']
  page.get_by_role('link',name='Impostazioni',exact=True).click()
  expect(page.get_by_role('button',name='Salva impostazioni')).to_be_visible()
  assert page.locator('#name0,#icon0').count()==0;fits(page)
  page.locator('#seconds').fill('60');page.locator('#probability').fill('0');page.locator('#base-facile').fill('150')
  page.get_by_role('button',name='Salva impostazioni').click();expect(page.locator('#message')).to_contain_text('Impostazioni salvate')
  saved=page.evaluate('localStorage.getItem("fool-settings-v1")')
  # Invalid edits never overwrite the valid profile; failed quota availability is caught.
  for field,value in [('seconds','0'),('quota-0','11')]:
   page.get_by_role('button',name='Argomenti' if field.startswith('quota-') else 'Generali',exact=True).click()
   old=page.locator('#'+field).input_value();page.locator('#'+field).fill(value)
   page.get_by_role('button',name='Salva impostazioni').click()
   assert page.evaluate('localStorage.getItem("fool-settings-v1")')==saved
   page.locator('#'+field).fill(old)
  # Optional answer preview is confined to settings and does not start/overwrite a game.
  page.get_by_role('button',name='Anteprima',exact=True).click()
  page.get_by_role('button',name='Prepara anteprima').click()
  expect(page.get_by_role('heading',name='Anteprima docente')).to_be_visible();fits(page)
  assert page.get_by_role('button',name='Inizia partita').count()==0
  page.get_by_role('button',name='Sostituisci domanda').click()
  page.get_by_role('button',name='Torna alle impostazioni').click()
  page.reload();expect(page.locator('#seconds')).to_have_value('60')
  page.get_by_role('button',name='Torna alla schermata iniziale',exact=True).click()
  page.get_by_role('link',name='Start',exact=True).click()
  expect(page.get_by_role('button',name='Inizia partita')).to_be_enabled()
  assert page.locator('#seconds,#probability,#difficulty,#quotas,[id^=base-]').count()==0
  assert page.get_by_role('button',name='Prepara anteprima').count()==0
  assert page.locator('input').count()==3 and page.locator('select').count()==4;fits(page)
  for i,name in enumerate(['Demoni','Razzi','Marines']):
   page.locator('#name'+str(i)).fill(name)
  page.get_by_role('button',name='Inizia partita').click()
  expect(page.get_by_role('button',name='Svela e avvia il tempo')).to_be_visible();fits(page)
  config=page.evaluate('game.s.config');assert config['names']==['Demoni','Razzi','Marines'];assert config['icons']==['skull','bolt','star']
  assert config['seconds']==60 and config['probability']==0 and config['bases']['facile']==150
  assert page.locator('.team .team-icon').count()==0
  snapshot=page.evaluate('localStorage.getItem("fool-v1")')
  page.goto(base+'Fool.html?settings=1');expect(page.locator('#seconds')).to_have_value('60')
  page.locator('#seconds').fill('90');page.get_by_role('button',name='Salva impostazioni').click()
  assert page.evaluate('localStorage.getItem("fool-v1")')==snapshot
  page.goto(base+'Fool.html');page.get_by_role('button',name='Riprendi partita',exact=True).click()
  assert page.evaluate('game.s.config.seconds')==60
  # Old saves with icons remain usable, and their symbols appear in the background.
  page.evaluate('()=>{game.s.config.icons=["skull","bolt","star"];persist()}');page.reload();page.get_by_role('button',name='Riprendi partita',exact=True).click()
  assert page.locator('.team .team-icon').count()==0
  # Storage denied: defaults still start a game; saving settings reports failure.
  page.add_init_script("Storage.prototype.getItem=function(){throw Error('blocked')};Storage.prototype.setItem=function(){throw Error('blocked')}")
  page.goto(base+'Fool.html?settings=1');page.get_by_role('button',name='Salva impostazioni').click()
  expect(page.locator('#message')).to_contain_text('non consente di salvare')
  page.goto(base+'Fool.html');page.get_by_role('button',name='Inizia partita').click()
  expect(page.get_by_role('button',name='Svela e avvia il tempo')).to_be_visible()
  assert not errors,errors
  page.close()
 browser.close()
 print('Impostazioni e Start: persistenza, validazione, anteprima separata, ripresa con simboli, vecchi salvataggi e storage bloccato: OK su schermi orizzontali')
