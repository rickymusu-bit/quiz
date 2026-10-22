"""Real browser checks for the requested branding and usable responsive controls."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import threading,json,hashlib
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base='http://127.0.0.1:'+str(server.server_port)+'/'
sizes=[(240,320),(280,653),(320,568),(390,844),(768,1024),(844,390),(1024,768),(1440,900),(1920,1080),(2560,1440)]
def fits(page,label):
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),label
 assert page.locator('a[download],input[type=file]').count()==0,label
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 for w,h in sizes:
  page.set_viewport_size({'width':w,'height':h});page.goto(base,wait_until='networkidle');page.evaluate('document.fonts.ready')
  expect(page.locator('.subtitle')).to_have_text('Solo uno sciocco pensa di vincere')
  expect(page.get_by_role('img',name='Fool',exact=True)).to_be_visible()
  assert page.evaluate('document.querySelector(".home-logo").naturalWidth')==2171
  assert page.locator('nav.menu a').all_text_contents()==['Start','Regole','Impostazioni']
  boxes=[page.get_by_role('link',name=x,exact=True).bounding_box() for x in ['Start','Regole','Impostazioni']]
  assert boxes[0]['y']+boxes[0]['height']<=boxes[1]['y']
  assert boxes[0]['height']>=44 and boxes[1]['height']>=44
  fits(page,('home',w,h))
  page.get_by_role('link',name='Start',exact=True).click()
  expect(page.get_by_role('button',name='Inizia partita')).to_be_enabled()
  fits(page,('configuration',w,h))
  page.get_by_role('button',name='Inizia partita').click()
  expect(page.get_by_role('button',name='Svela e avvia il tempo')).to_be_visible()
  assert page.locator('#fit-warning').is_hidden()
  page.get_by_role('button',name='Svela e avvia il tempo').click()
  fits(page,('answer',w,h))
  page.get_by_role('button',name='Pausa',exact=True).click()
  before=page.evaluate('game.left()');page.wait_for_timeout(120);assert page.evaluate('game.left()')==before
  page.get_by_role('button',name='Sanzioni',exact=True).click()
  expect(page.get_by_role('button',name='Conferma intervento')).to_be_visible()
  page.locator('#sanction-plus-0').click();page.get_by_role('button',name='Conferma intervento').click()
  assert page.evaluate('game.s.groups[0].sanctions')==1;assert not page.evaluate('game.running')
  if w<=650:
   details=page.locator('.team details').first
   details.locator('summary').click();assert details.get_attribute('open') is not None
   fits(page,('team-details',w,h))
  page.get_by_role('button',name='Bonus e inventari',exact=True).click()
  page.get_by_role('button',name='Chiudi',exact=True).click()
  page.get_by_role('button',name='Riprendi timer',exact=True).click()
  page.locator('.answer').nth(page.evaluate('game.s.current.correct')).click()
  expect(page.get_by_role('button',name='Prossima domanda',exact=True)).to_be_visible()
  fits(page,('result',w,h));assert page.evaluate('game.s.valid')==1
  page.get_by_role('button',name='Prossima domanda',exact=True).click()
  page.get_by_role('button',name='Campanella / sospendi',exact=True).click()
  page.reload();page.get_by_role('button',name='Riprendi partita',exact=True).click()
  assert page.evaluate('game.s.suspended');assert page.evaluate('game.s.valid')==1
  page.goto(base+'Fool_regole.html');page.locator('#section').select_option('20')
  fits(page,('rules',w,h));page.get_by_role('button',name='Indice',exact=True).click()
  page.get_by_role('button',name='1. Benvenuti in Fool',exact=True).click()
  assert page.locator('#section').input_value()=='0'
  fits(page,('rules-index',w,h))
 # Enlarged text and long names/fractional scores/long formulas must retain access to controls.
 page.set_viewport_size({'width':320,'height':568});page.goto(base+'Fool.html?start=1')
 expect(page.get_by_role('button',name='Inizia partita')).to_be_enabled()
 for i in range(3):page.locator('#name'+str(i)).fill('Squadra '+str(i)+' — nome lungo '+('x'*60))
 page.get_by_role('button',name='Inizia partita').click()
 page.evaluate('()=>{game.s.groups[0].score=F.rational(100,3);game.s.current.body="Una domanda lunga. ".repeat(150)+String.raw`\\[\\frac{123456789012345678901234567890}{1234567890}\\]`;renderGame()}')
 page.get_by_role('button',name='Svela e avvia il tempo').click()
 page.evaluate('document.documentElement.style.fontSize="24px"')
 page.get_by_role('button',name='Pausa',exact=True).click()
 fits(page,'large-text-and-formula')
 assert page.locator('#fit-warning').is_hidden()
 # Keyboard navigation keeps every homepage action reachable.
 page.goto(base);page.keyboard.press('Tab');assert page.evaluate('document.activeElement.textContent')=='Start'
 page.keyboard.press('Tab');assert page.evaluate('document.activeElement.textContent')=='Regole'
 page.keyboard.press('Tab');assert page.evaluate('document.activeElement.textContent')=='Impostazioni'
 page.keyboard.press('Enter');expect(page.get_by_role('button',name='Salva impostazioni')).to_be_visible()
 # Real touch emulation, including a narrow portrait viewport.
 for w,h in [(360,800),(800,360)]:
  ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,device_scale_factor=2)
  mobile=ctx.new_page();mobile.goto(base);mobile.get_by_role('link',name='Start',exact=True).tap()
  expect(mobile.get_by_role('button',name='Inizia partita')).to_be_enabled()
  mobile.get_by_role('button',name='Inizia partita').tap()
  mobile.get_by_role('button',name='Svela e avvia il tempo').tap()
  mobile.get_by_role('button',name='Pausa',exact=True).tap();assert mobile.evaluate('game.s.paused')
  fits(mobile,('touch',w,h));ctx.close()
 assert not errors,errors
 print(json.dumps({'responsive_flows':sizes,'errors':errors,'home_menu':'Start / Regole / Impostazioni','large_text':'passed'},ensure_ascii=False))
 browser.close()
