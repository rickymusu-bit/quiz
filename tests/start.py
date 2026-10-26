"""Verify New Game and conditional direct Resume through homepage, including fullscreen."""
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
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);errors=[];checks=[]
 for fullscreen in [False,True]:
  for bank in ['termologia','introduzione-fisica-misura']:
   page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(base)
   if fullscreen:
    page.get_by_role('button',name='Schermo intero',exact=True).click();page.wait_for_function('!!document.fullscreenElement')
   expect(page.get_by_role('link',name='Nuova partita',exact=True)).to_be_visible()
   expect(page.locator('#resume-game-link')).to_be_hidden()
   page.get_by_role('link',name='Nuova partita',exact=True).click()
   view=page.frame_locator('#play-frame') if fullscreen else page
   expect(view.get_by_role('heading',name='Prepara Fool')).to_be_visible()
   expect(view.get_by_role('button',name='Inizia partita')).to_be_enabled()
   view.locator('#bank-choice').select_option(bank);expect(view.get_by_role('button',name='Inizia partita')).to_be_enabled()
   view.get_by_role('button',name='Inizia partita').click();expect(view.get_by_role('button',name='Svela e avvia il tempo')).to_be_visible()
   frame=next(f for f in page.frames if 'Fool.html' in f.url)
   assert frame.evaluate('game.s.bank.length')==100
   view.get_by_role('button',name='Svela e avvia il tempo').click();view.locator('.answer').nth(frame.evaluate('game.s.current.correct')).click()
   assert frame.evaluate('game.s.valid')==1
   question=frame.evaluate('game.s.current.id')
   page.goto(base)
   expect(page.locator('#resume-game-link')).to_be_visible()
   if fullscreen:
    page.get_by_role('button',name='Schermo intero',exact=True).click();page.wait_for_function('!!document.fullscreenElement')
   page.get_by_role('link',name='Riprendi partita',exact=True).click()
   view=page.frame_locator('#play-frame') if fullscreen else page
   frame=next(f for f in page.frames if 'Fool.html' in f.url)
   assert frame.evaluate('game.s.phase')=='ordinaria'
   assert frame.evaluate('game.s.current.id')==question
   view.get_by_role('button',name='Prossima domanda',exact=True).click();expect(view.get_by_role('button',name='Svela e avvia il tempo')).to_be_visible()
   frame.evaluate('()=>{game.complete(null);changed()}')
   page.goto(base)
   expect(page.locator('#resume-game-link')).to_be_hidden()
   checks.append({'fullscreen':fullscreen,'bank':bank});page.close()
 assert not errors,errors
 browser.close();print(json.dumps({'start_answer_resume':checks,'errors':errors}))
server.shutdown()
