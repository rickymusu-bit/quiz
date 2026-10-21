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
base='http://127.0.0.1:'+str(server.server_port)+'/Quiz/'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1000});errors=[];downloads=[];requests=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('download',lambda e:downloads.append(e.suggested_filename))
 page.on('request',lambda r:requests.append(r.url))
 page.goto(base);assert page.locator('a[download],input[type=file]').count()==0
 assert 'Scarica' not in page.locator('body').inner_text()
 page.get_by_role('link',name='Avvia il quiz').click()
 assert page.get_by_role('button',name='Riprendi partita').count()==0
 page.get_by_role('button',name='Nuova partita',exact=True).click()
 expect(page.get_by_role('button',name='Prepara anteprima')).to_be_enabled()
 assert page.locator('#bank-choice').input_value()=='termologia'
 assert page.evaluate('bank.bank.length')==100
 assert any('/Quiz/datasets.json' in x for x in requests)
 assert any('/Quiz/Dataset_termologia_' in x for x in requests)
 page.get_by_role('button',name='Prepara anteprima').click()
 page.get_by_role('button',name='Verifica schermo e inizia Fool').click()
 page.get_by_role('button',name='Svela e avvia il tempo').click()
 page.get_by_role('button',name='Salva nel browser',exact=True).filter(visible=True).click()
 assert not downloads
 snapshot=page.evaluate('JSON.parse(localStorage.getItem("fool-v1"))')
 page.reload();page.get_by_role('button',name='Riprendi partita',exact=True).click()
 assert page.evaluate('game.s.current.id')==snapshot['current']['id']
 assert not page.evaluate('game.running');assert page.evaluate('game.s.paused')
 assert page.locator('input[type=file],a[download]').count()==0
 # Exhausted reserves check the online bank without reusing questions or awarding a winner.
 page.evaluate('()=>{game.s.seen=game.s.eligible.slice();game.s.queue=[];game.s.current=null;game.take();renderGame()}')
 page.get_by_role('button',name='Cerca nuove domande').click()
 expect(page.locator('#message')).to_contain_text('Non sono ancora disponibili nuove domande')
 assert page.evaluate('game.s.screen')=='supply';assert page.evaluate('game.s.winner') is None
 # Newly added online questions replenish the same game without a file picker.
 raw=json.loads((ROOT/'Dataset_termologia_100_domande_v1_20261021.json').read_text())
 extra=json.loads(json.dumps(raw['argomenti'][0]['domande'][0]));extra['id']='nuovo-online-001';raw['argomenti'][0]['domande'].append(extra)
 page.route('**/Dataset_termologia_100_domande_v1_20261021.json',lambda route:route.fulfill(json=raw))
 page.get_by_role('button',name='Cerca nuove domande').click()
 expect(page.get_by_role('button',name='Svela e avvia il tempo')).to_be_visible()
 assert page.evaluate('game.s.current.id')=='nuovo-online-001'
 # A failed catalog request has a useful retry path; no stale or partial bank starts.
 page.unroute('**/Dataset_termologia_100_domande_v1_20261021.json')
 page.route('**/datasets.json',lambda route:route.fulfill(status=503,body='Unavailable'))
 page.goto(base+'Fool.html');page.get_by_role('button',name='Nuova partita',exact=True).click()
 expect(page.get_by_role('heading',name='Domande non disponibili')).to_be_visible()
 assert page.get_by_role('button',name='Prepara anteprima').count()==0
 page.unroute('**/datasets.json');page.get_by_role('button',name='Riprova',exact=True).click()
 expect(page.get_by_role('button',name='Prepara anteprima')).to_be_enabled()
 assert not errors and not downloads,(errors,downloads)
 print('Online: catalogo/banca automatici, nessun file o download, salvataggio/ripresa, rifornimento e recupero da errore: OK')
 browser.close()
