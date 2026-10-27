"""Important motion/captures hide every panel and preserve answer time."""
import os,threading,json
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent;ART=ROOT/'artifacts';ART.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/Fool.html?start=1'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);errors=[];checks=[]
 def start(width,height):
  page=browser.new_page(viewport={'width':width,'height':height});page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base);page.get_by_role('button',name='Inizia partita').click();page.wait_for_function('FoolEnding.prepare(FoolEnding.load(()=>{}))!==null');page.evaluate('document.fonts.ready');page.clock.install();page.clock.pause_at(page.evaluate('Date.now()+1000'));return page
 def panels(page,visible):
  for css in ['.operation-body','.statusline','.turn-order','.options-toggle']:
   assert page.locator(css).is_visible()==visible,css
 for width,height in [(1440,900),(390,844),(844,390)]:
  page=start(width,height);panels(page,True)
  page.get_by_role('button',name='Svela e avvia il tempo').click();page.locator('.answer').nth(page.evaluate('HellscapeUI.game.s.current.correct')).click();page.clock.run_for(120)
  panels(page,False)
  expect(page.locator('.movement-cue')).to_have_text('RISPOSTA CORRETTA')
  expect(page.locator('.movement-cue')).to_be_visible()
  page.screenshot(path=str(ART/f'cinematic-movement-{width}.png'))
  snapshot=page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())');page.keyboard.press('Enter');assert page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')==snapshot
  page.clock.run_for(1800);panels(page,True)
  expect(page.locator('.movement-cue')).to_have_count(0)
  page.get_by_role('button',name='Prossima domanda',exact=True).click();page.clock.run_for(100)
  page.evaluate("()=>{const g=HellscapeUI.game;g.eliminate(g.s.order.find(i=>i!==g.s.respondent),'test');HellscapeUI.changed()}")
  page.clock.run_for(700);panels(page,False);page.screenshot(path=str(ART/f'cinematic-capture-{width}.png'))
  page.clock.run_for(5600);panels(page,True);page.screenshot(path=str(ART/f'cinematic-restored-{width}.png'))
  page.close()
  # Capture during an open question: clock stops, action plays, bindings refresh on return.
  page=start(width,height);page.get_by_role('button',name='Svela e avvia il tempo').click();page.clock.run_for(1000);left=page.evaluate('HellscapeUI.game.left()')
  page.evaluate("()=>{const g=HellscapeUI.game;g.eliminate(g.s.order.find(i=>i!==g.s.respondent),'test');HellscapeUI.changed()}");page.clock.run_for(500)
  panels(page,False);assert not page.evaluate('HellscapeUI.game.running');assert page.evaluate('HellscapeUI.game.left()')==left
  page.keyboard.press('p');page.clock.run_for(100);panels(page,True);assert page.evaluate('HellscapeUI.game.s.paused && HellscapeUI.game.s.pauseReason==="manuale"')
  frozen=page.locator('.hell-race canvas').evaluate('c=>c.toDataURL()');page.clock.run_for(1200);assert page.locator('.hell-race canvas').evaluate('c=>c.toDataURL()')==frozen
  page.keyboard.press('p');page.clock.run_for(100);panels(page,False);page.clock.run_for(5600);panels(page,True)
  assert page.evaluate('HellscapeUI.game.running');assert left-1200<=page.evaluate('HellscapeUI.game.left()')<=left
  page.locator('.answer').nth(page.evaluate('HellscapeUI.game.s.current.correct')).click();assert page.evaluate('HellscapeUI.game.s.valid')==1
  page.close();checks.append({'viewport':[width,height],'motion_and_capture':'PASS','timer_and_manual_pause':'PASS'})
 # Other score changes also hide overlays, including an already open modal/backdrop.
 page=start(1440,900)
 page.evaluate('''()=>{const g=HellscapeUI.game;g.setScore(g.s.owner,Fool.rational(300),g.s.revision);HellscapeUI.changed();const d=document.getElementById('dialog');d.innerHTML='<h2>Test</h2>';d.showModal();document.getElementById('message').textContent='Test';}''');page.clock.run_for(100)
 panels(page,False);expect(page.locator('#dialog')).not_to_be_visible();expect(page.locator('#message')).not_to_be_visible()
 assert page.locator('#dialog').evaluate('d=>getComputedStyle(d,"::backdrop").backgroundColor')=='rgba(0, 0, 0, 0)'
 page.clock.run_for(1700);panels(page,True);expect(page.locator('#dialog')).to_be_visible();page.close()
 # Wrong answer: visible message, even when the score remains unchanged.
 page=start(1440,900);page.get_by_role('button',name='Svela e avvia il tempo').click()
 page.locator('.answer').nth((page.evaluate('HellscapeUI.game.s.current.correct')+1)%4).click()
 page.clock.run_for(100)
 expect(page.locator('.movement-cue')).to_have_text('RISPOSTA ERRATA')
 expect(page.locator('.movement-cue')).to_be_visible()
 page.screenshot(path=str(ART/'cinematic-incorrect-1440.png'))
 page.clock.run_for(1800);expect(page.locator('.movement-cue')).to_have_count(0);page.close()
 # Illustrate actual gaps at 0, 600 and 1200 points in the race.
 page=start(1440,900)
 page.evaluate("""()=>{const g=HellscapeUI.game;g.s.groups.forEach((v,i)=>v.score=Fool.rational(i*600));HellscapeUI.changed();}""")
 page.clock.run_for(1700)
 page.screenshot(path=str(ART/'race-score-distance-1440.png'));page.close()
 assert not errors,errors;browser.close();print(json.dumps({'cinematic_ui':checks,'errors':errors},indent=2))
server.shutdown()
