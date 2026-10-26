"""Direct reveal, adjacent bonus controls and exact total-score editing."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import threading,sys,json
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent
if len(sys.argv)>1:base=sys.argv[1];launch={'proxy':{'server':'http://proxy:8080'}}
else:
 class Quiet(SimpleHTTPRequestHandler):
  def log_message(self,*args):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
 threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/';launch={}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],**launch);errors=[];checks=[]
 for full,w,h in [(False,1440,900),(True,844,390)]:
  page=browser.new_page(viewport={'width':w,'height':h});page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base)
  if full:page.get_by_role('button',name='Schermo intero',exact=True).click();page.wait_for_function('!!document.fullscreenElement')
  page.get_by_role('link',name='Nuova partita',exact=True).click();v=page.frame_locator('#play-frame') if full else page
  expect(v.get_by_role('button',name='Inizia partita')).to_be_enabled();v.get_by_role('button',name='Inizia partita').click();frame=next(f for f in page.frames if 'Fool.html' in f.url)
  def fits():
   frame.evaluate('fitFoolViewport()');assert frame.evaluate('document.documentElement.scrollHeight<=innerHeight+1 && document.documentElement.scrollWidth<=innerWidth+1')
  def option(name):
   if v.locator('.game-options').get_attribute('open') is None:v.locator('.game-options summary').click()
   return v.get_by_role('button',name=name,exact=True)
  assert option('Esci da schermo intero' if full else 'Schermo intero').is_visible()
  fits();page.screenshot(path=f'/tmp/options-hidden-{w}.png');a=v.locator('.question-actions .bonus-action').bounding_box();b=v.locator('.question-actions [data-game-action=reveal]').bounding_box();assert abs(a['y']-b['y'])<2
  assert v.get_by_role('button',name='Inventario Ammo',exact=True).count()==1
  expect(v.get_by_role('button',name='Riassegna punti',exact=True)).not_to_be_visible()
  q=frame.evaluate('game.s.current.id');v.get_by_role('button',name='Inventario Ammo',exact=True).click();v.get_by_role('button',name='Chiudi',exact=True).click()
  original=frame.evaluate('JSON.stringify({valid:game.s.valid,groups:game.s.groups.map(g=>({inventory:g.inventory,sanctions:g.sanctions}))})')
  option('Riassegna punti').click();v.locator('#score-team').select_option('0')
  assert v.locator('#score-reason,#score-operation').count()==0
  expect(v.locator('#score-total')).to_have_value('0');expect(v.get_by_role('button',name='Togli un punto')).to_be_disabled()
  v.get_by_role('button',name='Aggiungi un punto').click();expect(v.locator('#score-total')).to_have_value('1');v.get_by_role('button',name='Togli un punto').click();expect(v.locator('#score-total')).to_have_value('0')
  box=v.get_by_role('button',name='Aggiungi un punto').bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);page.mouse.down();page.wait_for_timeout(750);page.mouse.up();held=int(v.locator('#score-total').input_value());assert held>=10 and held%10==0;page.wait_for_timeout(200);assert int(v.locator('#score-total').input_value())==held
  v.locator('#score-total').fill('150');expect(v.locator('.score-preview')).to_contain_text('150 punti');assert frame.evaluate('F.exact(game.s.groups[0].score)')=='0';fits();v.get_by_role('button',name='Conferma modifica').click();assert frame.evaluate('F.exact(game.s.groups[0].score)')=='150'
  assert frame.evaluate('JSON.stringify({valid:game.s.valid,groups:game.s.groups.map(g=>({inventory:g.inventory,sanctions:g.sanctions}))})')==original
  frame.evaluate('()=>{game.s.groups[0].score=F.rational(100,3);changed()}')
  option('Riassegna punti').click();v.locator('#score-team').select_option('0');expect(v.locator('#score-total')).to_have_value('100/3');v.get_by_role('button',name='Aggiungi un punto').click();expect(v.locator('#score-total')).to_have_value('103/3');v.get_by_role('button',name='Togli un punto').click();expect(v.locator('#score-total')).to_have_value('100/3');v.get_by_role('button',name='Aggiungi un punto').click();v.get_by_role('button',name='Conferma modifica').click();assert frame.evaluate('F.exact(game.s.groups[0].score)')=='103/3'
  option('Riassegna punti').click();v.locator('#score-team').select_option('0');v.locator('#score-total').fill('120,5');v.get_by_role('button',name='Conferma modifica').click();assert frame.evaluate('F.exact(game.s.groups[0].score)')=='241/2'
  option('Riassegna punti').click();v.locator('#score-team').select_option('0');v.locator('#score-total').fill('-1');v.get_by_role('button',name='Conferma modifica').click();expect(v.locator('#dialog')).to_be_visible();assert frame.evaluate('F.exact(game.s.groups[0].score)')=='241/2'
  v.locator('#score-total').fill('');v.get_by_role('button',name='Conferma modifica').click();expect(v.locator('#dialog')).to_be_visible();v.locator('#score-total').fill('250');v.get_by_role('button',name='Annulla',exact=True).click();assert frame.evaluate('F.exact(game.s.groups[0].score)')=='241/2'
  frame.goto(base+'Fool.html?resume=1');assert frame.evaluate('F.exact(game.s.groups[0].score)')=='241/2';assert frame.evaluate('game.s.events.filter(e=>e.type==="score-adjustment").length')==3
  v.get_by_role('button',name='Svela e avvia il tempo').click();assert frame.evaluate('game.running');expect(v.locator('#dialog')).not_to_be_visible();assert frame.evaluate('game.s.seen.length')==1
  option('Riassegna punti').click();assert not frame.evaluate('game.running') and frame.evaluate('game.s.paused');before=frame.evaluate('game.left()');page.wait_for_timeout(100);assert frame.evaluate('game.left()')==before;fits()
  v.locator('#score-team').select_option('1');v.locator('#score-total').fill('25');v.get_by_role('button',name='Conferma modifica').click();assert frame.evaluate('game.s.paused') and frame.evaluate('F.exact(game.s.groups[1].score)')=='25'
  option('Riprendi timer').click();v.locator('.answer').nth(frame.evaluate('game.s.current.correct')).click();expect(v.get_by_role('button',name='Prossima domanda',exact=True)).to_be_visible();fits()
  # Score correction validates first and rejects duplicate submissions atomically.
  assert frame.evaluate('''()=>{const r=game.s.revision;game.setScore(2,F.rational(10),r);try{game.setScore(2,F.rational(20),r)}catch(e){}return F.exact(game.s.groups[2].score)==='10'}''')
  checks.append({'fullscreen':full,'size':[w,h]});page.close()
 assert not errors,errors;browser.close();print(json.dumps({'options_direct_reveal_total_points':checks,'errors':errors}))
if 'server' in globals():server.shutdown()
