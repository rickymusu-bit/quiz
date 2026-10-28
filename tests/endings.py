"""Browser contracts for capture, vehicle swallowing/fire breath, escape/roar and Game Over/dance.
Pass --gifs to record the actual Canvas timeline for review.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright,expect
from PIL import Image
from io import BytesIO
import os,threading,json,sys,base64,math
ROOT=Path(__file__).resolve().parent.parent;ART=ROOT/'artifacts';ART.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/Fool.html?start=1'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);errors=[];checks=[]
 def start(reduced=False,viewport=None):
  page=browser.new_page(viewport=viewport or {'width':1024,'height':768},reduced_motion='reduce' if reduced else 'no-preference');page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base);page.get_by_role('button',name='Inizia partita').click();page.wait_for_function('FoolEnding.prepare(FoolEnding.load(()=>{}))!==null');page.evaluate('document.fonts.ready')
  page.clock.install();page.clock.pause_at(page.evaluate('Date.now()+1000'))
  page.evaluate('''()=>{const render=FoolEnding.render;FoolEnding.render=(...args)=>{window.__endingPlan=args[3];return render(...args)}}''')
  return page
 def finish(page,winner):
  page.evaluate('''winner=>{const g=HellscapeUI.game;g.s.id+='-final-'+winner;if(winner===null){g.eliminate(0,'test');g.eliminate(1,'test');g.eliminate(2,'test');g.s.respondent=2;}else{g.eliminate(1,'test');g.eliminate(2,'test');}g.complete(winner);HellscapeUI.changed()}''',winner)
 def raw(page):return page.locator('.hell-race-final canvas').evaluate('c=>c.toDataURL()')
 for winner,name in [(0,'escape-roar'),(None,'eat-fire-dance')]:
  page=start();finish(page,winner);before=page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())');frames=[];phase_set=set()
  page.clock.run_for(100);duration=page.evaluate('FoolHellRace.presentationSnapshot().plan.duration')+.3
  for step in range(math.ceil(duration*10)):
   page.clock.run_for(100);phase=page.locator('.hell-race-final').get_attribute('data-ending-phase');phase_set.add(phase)
   if '--gifs' in sys.argv:
    image=Image.open(BytesIO(base64.b64decode(raw(page).split(',')[1]))).convert('RGB');frames.append(image)
   if step in ([1,6,15,24,34,43,49,56,65,82] if winner==0 else [6,12,18,26,39,43,52,65,82]):
    page.locator('.hell-race-final canvas').screenshot(path=str(ART/f'{name}-{step}.png'),animations='allow')
  assert page.locator('.hell-race-final').get_attribute('data-ending-phase')=='done'
  assert page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')==before,'Cinematic must preserve game state'
  assert page.evaluate('window.__endingPlan.victims')==([] if winner==0 else [2])
  assert ('escape' in phase_set)==(winner==0)
  assert ('roar' in phase_set)==(winner==0)
  assert ('rise' in phase_set)==(winner==0)
  assert ('fire' in phase_set)==(winner==0)
  assert ('rage' in phase_set)==(winner==0)
  assert ('dance' in phase_set)==(winner is None)
  expect(page.locator('.final-title')).to_be_visible()
  if frames:frames[0].save(ART/f'{name}.gif',save_all=True,append_images=frames[1:],duration=[100]*(len(frames)-1)+[1500],loop=0,optimize=True)
  checks.append({'ending':name,'phases':sorted(phase_set),'victims':page.evaluate('window.__endingPlan.victims')});page.close()
 # A mid-game elimination is consumed only once, even after unrelated UI renders.
 page=start();page.evaluate("()=>{HellscapeUI.game.eliminate(1,'test');HellscapeUI.changed()}");page.clock.run_for(5500)
 page.evaluate("()=>{HellscapeUI.game.eliminate(2,'test');HellscapeUI.game.complete(0);HellscapeUI.changed()}");page.clock.run_for(100)
 assert page.evaluate('window.__endingPlan.victims')==[2]
 # Pausing and tab invisibility freeze the entire action; rebuilding UI keeps progress.
 page.clock.run_for(1100);page.evaluate('()=>{HellscapeUI.game.s.paused=true;HellscapeUI.changed()}');page.clock.run_for(100);paused=raw(page);page.clock.run_for(700);assert raw(page)==paused
 page.evaluate('()=>{HellscapeUI.game.s.paused=false;HellscapeUI.changed()}');page.clock.run_for(200)
 page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true})");page.clock.run_for(100);hidden=raw(page);page.clock.run_for(500);assert raw(page)==hidden;page.close()
 for winner in [0,None]:
  page=start(True);finish(page,winner);page.clock.run_for(200);assert page.locator('.hell-race-final').get_attribute('data-ending-phase')=='done';a=raw(page);page.clock.run_for(500);assert raw(page)==a;expect(page.locator('.final-title')).to_be_visible();page.close()
 for width,height in [(390,844),(844,390)]:
  for winner in [0,None]:
   page=start(viewport={'width':width,'height':height});finish(page,winner);page.clock.run_for(100);page.clock.run_for(math.ceil(page.evaluate('FoolHellRace.presentationSnapshot().plan.duration')*1000)+200)
   assert page.locator('.hell-race-final').get_attribute('data-ending-phase')=='done'
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1 && document.documentElement.scrollHeight<=innerHeight+1')
   page.screenshot(path=str(ART/f'ending-{width}x{height}-{"win" if winner==0 else "over"}.png'));page.close()
 assert not errors,errors;browser.close();print(json.dumps({'endings':checks,'pause_hidden_reduced':'PASS','errors':errors},indent=2))
server.shutdown()
