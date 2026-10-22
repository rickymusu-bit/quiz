"""Final screens contain only the outcome artwork/name and the canonical home button."""
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
 for w,h in [(640,360),(844,390),(844,390),(1440,900)]:
  for defeat in [False,True]:
   page=browser.new_page(viewport={'width':w,'height':h});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(base+'Fool.html');page.get_by_role('button',name='Inizia partita').click()
   page.get_by_role('button',name='Sanzioni',exact=True).click()
   for i in range(3 if defeat else 2):
    for _ in range(3):page.locator('#sanction-plus-'+str(i)).click()
   page.get_by_role('button',name='Conferma intervento').click()
   expected='GAME OVER' if defeat else 'Gruppo 3 WINS'
   expect(page.get_by_role('heading',name=expected,exact=True)).to_be_visible()
   expect(page.locator('.end-wordmark')).to_be_visible()
   page.wait_for_function('document.querySelector(".end-wordmark")?.naturalWidth>0')
   assert page.locator('main button').count()==1
   assert page.locator('.scoreboard,.toolbar,#timer').count()==0
   assert page.locator('header').is_hidden()
   assert page.locator('main p').count()==0
   assert not any(word in page.locator('body').inner_text().lower() for word in ['10 blu','registro','premio','voto verde'])
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   button=page.get_by_role('button',name='Torna alla schermata iniziale',exact=True)
   title=page.locator('.final-title').bounding_box();box=button.bounding_box()
   assert box['y']>=title['y']+title['height']
   page.screenshot(path=str(ROOT/f'tests/ending-{defeat}-{w}.png'),full_page=True)
   page.reload();page.get_by_role('button',name='Riprendi partita',exact=True).click()
   expect(page.get_by_role('heading',name=expected,exact=True)).to_be_visible()
   page.get_by_role('button',name='Torna alla schermata iniziale',exact=True).click()
   expect(page).to_have_url(base);expect(page.get_by_role('link',name='Start',exact=True)).to_be_visible()
   assert not errors,errors
   page.close()
 # A long user-chosen name wraps without clipping; prize remains only in the rules.
 page=browser.new_page(viewport={'width':640,'height':360});page.goto(base+'Fool.html')
 page.locator('#name2').fill('Squadra '+('X'*100));page.get_by_role('button',name='Inizia partita').click()
 page.evaluate('()=>{game.openSanctions();game.s.panel.counts=[3,3,0];game.closeSanctions(true);changed()}')
 expect(page.get_by_role('img',name='WINS',exact=True)).to_be_visible()
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 page.get_by_role('button',name='Torna alla schermata iniziale',exact=True).click()
 page.get_by_role('link',name='Regole',exact=True).click();assert '10 blu' in page.locator('#slides').text_content()
 browser.close()
 print('Finali: WINS/GAME OVER, nessun premio/tabellone/comando extra, ritorno home, ripresa e nomi lunghi: OK su mobile/desktop')
