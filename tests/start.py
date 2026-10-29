import os
"""Homepage new/resume flows, saved progress, unavailable storage and script syntax."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import threading,re,tempfile,subprocess,json
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent
with tempfile.TemporaryDirectory() as temp:
 for html in ['index.html','Fool.html','Fool_regole.html']:
  for i,script in enumerate(re.findall(r'<script[^>]*>([\s\S]*?)</script>',(ROOT/html).read_text())):
   path=Path(temp)/f'{html}-{i}.js';path.write_text(script);subprocess.run(['node','--check',str(path)],check=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);errors=[];checks=[]
 for fullscreen,home_width,home_height in [(False,1440,900),(False,667,375),(True,844,390)]:
  for bank in ['termologia','introduzione-fisica-misura']:
   page=browser.new_page(viewport={'width':home_width,'height':home_height});page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(base)
   page.locator('.home-illustration').evaluate('img=>img.decode()')
   page.locator('.home-wordmark').evaluate('img=>img.decode()')
   page.evaluate('document.fonts.ready')
   assert page.locator('.home-screen').evaluate('el=>el.scrollHeight<=el.clientHeight+1')
   if bank=='termologia':page.screenshot(path=str(ROOT/f'artifacts/home-{home_width}x{home_height}.png'))
   expect(page.get_by_role('link',name='Riprendi partita',exact=True)).to_be_hidden()
   if fullscreen:
    page.get_by_role('button',name='Schermo intero',exact=True).click();page.wait_for_function('!!document.fullscreenElement')
   page.get_by_role('link',name='Nuova partita',exact=True).click()
   view=page.frame_locator('#play-frame') if fullscreen else page
   expect(view.get_by_role('heading',name='Prepara Hellscape')).to_be_visible()
   for i in range(3):
    expect(view.get_by_role('textbox',name=f'Nome del giocatore {i+1}',exact=True)).to_have_value(f'Giocatore {i+1}')
   expect(view.get_by_role('button',name='Inizia partita')).to_be_enabled()
   view.locator('#bank-choice').select_option(bank);expect(view.get_by_role('button',name='Inizia partita')).to_be_enabled()
   view.get_by_role('button',name='Inizia partita').click();expect(view.get_by_role('button',name='Svela e avvia il tempo')).to_be_visible()
   frame=next(f for f in page.frames if 'Fool.html' in f.url)
   assert frame.evaluate('HellscapeUI.game.s.bank.length')==100
   view.get_by_role('button',name='Svela e avvia il tempo').click();view.locator('.answer').nth(frame.evaluate('HellscapeUI.game.s.current.correct')).click()
   assert frame.evaluate('HellscapeUI.game.s.valid')==1
   question=frame.evaluate('HellscapeUI.game.s.current.id')
   saved=frame.evaluate('localStorage.getItem("fool-v1")')
   def home():
    if fullscreen:
     frame.evaluate('HellscapeUI.goHome()');view.get_by_role('button',name='Salva ed esci',exact=True).click();expect(page.locator('#play-frame')).to_have_count(0)
    else:page.goto(base)
    expect(page.get_by_role('link',name='Nuova partita',exact=True)).to_be_visible()
    expect(page.get_by_role('link',name='Riprendi partita',exact=True)).to_be_visible()
    if bank=='termologia':page.screenshot(path=str(ROOT/f'artifacts/home-resume-{home_width}x{home_height}.png'))
   home()
   # Opening new-game setup must leave the previous match available.
   page.get_by_role('link',name='Nuova partita',exact=True).click()
   expect(view.get_by_role('heading',name='Prepara Hellscape')).to_be_visible()
   frame=next(f for f in page.frames if 'Fool.html' in f.url)
   assert frame.evaluate('localStorage.getItem("fool-v1")')==saved
   expect(view.get_by_role('button',name='Riprendi partita',exact=True)).to_have_count(0)
   if bank=='termologia':
    frame.evaluate('document.fonts.ready')
    frame.wait_for_function("[...document.querySelectorAll('.vehicle-preview canvas')].length===3 && [...document.querySelectorAll('.vehicle-preview canvas')].every(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some(v=>v))")
    page.screenshot(path=str(ROOT/f'artifacts/setup-no-resume-{home_width}x{home_height}.png'))
   view.get_by_role('button',name='Torna alla schermata iniziale',exact=True).click()
   expect(page.get_by_role('link',name='Riprendi partita',exact=True)).to_be_visible()
   page.get_by_role('link',name='Riprendi partita',exact=True).click()
   expect(view.get_by_role('button',name='Prossima domanda',exact=True)).to_be_visible()
   frame=next(f for f in page.frames if 'Fool.html' in f.url)
   assert frame.evaluate('HellscapeUI.game.s.current.id')==question
   assert frame.evaluate('HellscapeUI.game.s.valid')==1
   expect(view.locator('#fit-warning')).to_be_hidden()
   assert frame.evaluate('HellscapeUI.game.s.groups.map(g=>g.score)')==[g['score'] for g in json.loads(saved)['groups']]
   view.get_by_role('button',name='Prossima domanda',exact=True).click();expect(view.get_by_role('button',name='Svela e avvia il tempo')).to_be_visible()
   view.get_by_role('button',name='Svela e avvia il tempo').click()
   question=frame.evaluate('HellscapeUI.game.s.current.id')
   home();page.get_by_role('link',name='Riprendi partita',exact=True).click()
   expect(view.locator('.good')).to_contain_text('IN PAUSA')
   frame=next(f for f in page.frames if 'Fool.html' in f.url)
   expect(view.get_by_role('button',name='Prossima domanda',exact=True)).to_be_hidden()
   assert frame.evaluate('HellscapeUI.game.s.current.id')==question
   assert frame.evaluate('HellscapeUI.game.s.paused && !HellscapeUI.game.running')
   remaining=frame.evaluate('HellscapeUI.game.s.remaining');page.wait_for_timeout(150);assert frame.evaluate('HellscapeUI.game.s.remaining')==remaining
   frame.evaluate('fitFoolViewport()');assert frame.evaluate('document.documentElement.scrollHeight<=innerHeight+1 && document.documentElement.scrollWidth<=innerWidth+1')
   checks.append({'fullscreen':fullscreen,'bank':bank,'viewport':[home_width,home_height]});page.close()
 # Empty, malformed and finished saves are never offered on the homepage.
 page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base)
 for value in ['not-json','null','{}',json.dumps({'phase':'conclusa','groups':[{}, {}, {}]})]:
  page.evaluate('(value)=>localStorage.setItem("fool-v1",value)',value);page.reload()
  expect(page.get_by_role('link',name='Riprendi partita',exact=True)).to_be_hidden()
 # A stale resume URL falls back to setup without destroying a corrupt save.
 page.evaluate('localStorage.setItem("fool-v1","not-json")');page.goto(base+'Fool.html?resume=1')
 expect(page.get_by_role('heading',name='Prepara Hellscape')).to_be_visible();expect(page.locator('#message')).to_contain_text('Impossibile riprendere')
 assert page.evaluate('localStorage.getItem("fool-v1")')=='not-json'
 page.evaluate('localStorage.removeItem("fool-v1")');page.goto(base+'Fool.html?resume=1')
 expect(page.get_by_role('heading',name='Prepara Hellscape')).to_be_visible();expect(page.locator('#message')).to_contain_text('Nessuna partita salvata')
 page.close()
 # Privacy restrictions on localStorage must still allow starting a new HellscapeUI.game.
 page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}})")
 page.goto(base);expect(page.get_by_role('link',name='Riprendi partita',exact=True)).to_be_hidden()
 page.get_by_role('link',name='Nuova partita',exact=True).click();expect(page.get_by_role('button',name='Inizia partita')).to_be_enabled();page.close()
 assert not errors,errors
 browser.close();print(json.dumps({'start_answer_resume':checks,'errors':errors}))
server.shutdown()
