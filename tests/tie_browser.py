"""Real offline tie transitions: input/focus, invariant engine, capture order, rounds and resume."""
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from PIL import Image
from io import BytesIO
import os,json,subprocess,sys
ROOT=Path(__file__).resolve().parent.parent;ART=ROOT/'artifacts/tie';ART.mkdir(parents=True,exist_ok=True)
HTML=(ROOT/'dist/Hellscape-review.html').read_text()
VIEWPORTS=[(1920,1080),(1366,768),(1024,768),(844,390),(390,844)]
DPRS=[1,2]
if '--quick' in sys.argv:VIEWPORTS=[(1366,768),(390,844)];DPRS=[1]
report={'revision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'cases':[],'errors':[],'external_requests':[]}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 def start(width=1366,height=768,dpr=1,reduced=False):
  context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=dpr,offline=True,reduced_motion='reduce' if reduced else 'no-preference')
  def route(r):
   if r.request.url=='http://tie.test/preview':r.fulfill(content_type='text/html',body=HTML)
   else:report['external_requests'].append(r.request.url);r.abort()
  context.route('**/*',route);page=context.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:report['errors'].append(str(e)))
  page.goto('http://tie.test/preview');page.evaluate("HellscapeQuality.show('corsa')");page.locator('#quality-tools').evaluate('e=>e.style.display="none"')
  page.clock.install();page.clock.pause_at(page.evaluate('Date.now()+1000'))
  return context,page,page.frames[1]
 def snapshot(f):return f.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')
 def run(page,ms):page.clock.run_for(ms)
 def ordinary(page,f,two=False,unique=False):
  f.evaluate('''({two,unique})=>{const ui=HellscapeUI,g=ui.game;g.s.config.bases={facile:100,media:100,difficile:100};g.s.groups.forEach((v,i)=>v.sanctions=i);ui.changed();
   for(let i=0;i<3;i++){g.reveal();g.answer((unique?i===0:two&&i<2)?g.s.current.correct:(g.s.current.correct+1)%4);ui.changed();if(i<2){g.next();ui.changed();}}}''',{'two':two,'unique':unique})
  run(page,1800)
 def skip(page,f,reduced=False):
  f.get_by_role('button',name='Inizia spareggio' if reduced else 'Salta introduzione',exact=True).click();run(page,100)
 def ready(f):
  assert f.evaluate('HellscapeUI.game.s.screen')=='hidden';assert not f.evaluate('HellscapeUI.game.running');assert not f.locator('.tie-layer').count()
  assert f.evaluate('document.activeElement?.dataset.gameAction')=='reveal','Focus returns to the unrevealed question'
  assert f.locator('.operation-body').is_visible()
 for width,height in VIEWPORTS:
  for dpr in DPRS:
   context,page,f=start(width,height,dpr);assert not f.locator('.tie-layer').count();ordinary(page,f)
   assert f.evaluate('HellscapeUI.game.s.phase')=='pareggio';assert f.locator('.operation-body').is_visible();assert not f.locator('.tie-layer').count()
   before=snapshot(f);order=f.evaluate('HellscapeUI.game.s.tieOrder');f.evaluate("window.__tieDone=0;document.addEventListener('fooltiecomplete',()=>__tieDone++)")
   f.get_by_role('button',name='Prossima domanda',exact=True).click();run(page,650)
   expect(f.locator('.tie-heading')).to_have_text('SPAREGGIO A ELIMINAZIONE');assert f.locator('.tie-roster li').count()==3
   assert f.locator('.tie-roster .heart:not(.lost)').count()==3
   assert [int(v) for v in f.locator('.tie-roster li').evaluate_all('es=>es.map(e=>e.dataset.team)')]==order
   assert not f.locator('.operation-body').is_visible();assert f.locator('.operation-body').evaluate('e=>e.inert')
   assert snapshot(f)==before
   page.keyboard.press('Enter');page.keyboard.press('a');f.locator('[data-game-action=next]').evaluate('e=>e.click()');assert snapshot(f)==before
   elapsed=f.evaluate('FoolHellRace.tieStatus().elapsed');f.evaluate('HellscapeUI.changed()');assert f.evaluate('FoolHellRace.tieStatus().elapsed')==elapsed
   run(page,100);page.keyboard.press('p');run(page,50);frozen=f.locator('.hell-race canvas').evaluate('c=>c.toDataURL()');run(page,500)
   assert f.locator('.hell-race canvas').evaluate('c=>c.toDataURL()')==frozen;assert snapshot(f)==before
   page.set_viewport_size({'width':height,'height':width});run(page,50)
   assert f.locator('.hell-race canvas').evaluate('c=>c.toDataURL()')==frozen
   page.set_viewport_size({'width':width,'height':height});run(page,50)
   box=f.locator('.hell-race').bounding_box();assert abs(box['width']/box['height']-4/3)<.001
   assert f.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   for button in f.locator('.tie-controls button').all():
    b=button.bounding_box();assert b['height']>=44;assert b['x']>=-1 and b['x']+b['width']<=width+1
   page.screenshot(path=str(ART/f'intro-{width}x{height}-dpr{dpr}.png'))
   page.keyboard.press('p');run(page,50)
   f.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))");run(page,500)
   held=f.evaluate('FoolHellRace.tieStatus().elapsed');run(page,500);assert f.evaluate('FoolHellRace.tieStatus().elapsed')==held
   f.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))")
   if width==1366 and dpr==1:
    frames=[]
    for i in range(22):
     frames.append(Image.open(BytesIO(f.locator('.hell-race').screenshot(animations='allow'))).convert('RGB'));run(page,200)
    frames[0].save(ART/'intro.gif',save_all=True,append_images=frames[1:],duration=[200]*21+[800],loop=0,optimize=True)
   else:skip(page,f)
   ready(f);assert f.evaluate('__tieDone')==1;assert f.evaluate('HellscapeUI.game.s.extra')==0
   f.evaluate('HellscapeUI.changed()');run(page,100);assert f.evaluate('__tieDone')==1;assert not f.locator('.tie-layer').count()
   report['cases'].append({'viewport':[width,height],'dpr':dpr,'intro_pause_orientation_focus':'PASS'});context.close()
 # Two leaders: the excluded vehicle is captured before the title; a new round is brief.
 context,page,f=start();ordinary(page,f,two=True);before=snapshot(f);excluded=f.evaluate('HellscapeUI.game.s.groups.findIndex(g=>g.out)')
 f.get_by_role('button',name='Prossima domanda',exact=True).click();run(page,650)
 assert f.locator('.tie-layer').get_attribute('data-phase')=='capture';assert f.locator('[data-tie-action=skip]').count()==0
 assert snapshot(f)==before;run(page,5000)
 assert f.locator('.tie-layer').get_attribute('data-phase')=='intro';assert f.locator('.tie-roster li').count()==2
 assert str(excluded) not in f.locator('.tie-roster li').evaluate_all('es=>es.map(e=>e.dataset.team)')
 page.screenshot(path=str(ART/'intro-two.png'));skip(page,f);ready(f)
 points=f.evaluate('JSON.stringify(HellscapeUI.game.s.groups.map(g=>g.score))')
 for i in range(2):
  f.evaluate('()=>{const g=HellscapeUI.game;g.reveal();g.answer(g.s.current.correct);HellscapeUI.changed()}');run(page,100)
  f.get_by_role('button',name='Prossima domanda',exact=True).click();run(page,100)
 assert f.locator('.tie-layer').get_attribute('data-phase')=='round';run(page,500);page.screenshot(path=str(ART/'new-round.png'))
 run(page,1300);ready(f);assert f.evaluate('HellscapeUI.game.s.tieRound')==2
 assert f.evaluate('JSON.stringify(HellscapeUI.game.s.groups.map(g=>g.score))')==points
 assert f.evaluate('HellscapeUI.game.s.groups.every(g=>g.inventory.length===0)');context.close()
 # Every scheduled player answers even after earlier eliminations; only the last is captured in Game Over.
 context,page,f=start();ordinary(page,f);f.get_by_role('button',name='Prossima domanda',exact=True).click();run(page,500);skip(page,f)
 f.evaluate('''()=>{const render=FoolEnding.render;FoolEnding.render=(...args)=>{window.__tiePlan=args[3];return render(...args)}}''')
 for i in range(3):
  respondent=f.evaluate('HellscapeUI.game.s.respondent')
  f.evaluate('(timeout)=>{const g=HellscapeUI.game;g.reveal();g.answer(timeout?null:(g.s.current.correct+1)%4);HellscapeUI.changed()}',i==1);run(page,450)
  if i==1:expect(f.locator('.tie-rules')).to_contain_text('Tempo scaduto')
  expect(f.locator('.tie-heading')).to_have_text('ELIMINATO');assert f.locator('.tie-roster .lost').count()==1
  assert f.locator('.tie-roster li').get_attribute('data-team')==str(respondent)
  if i==0:page.screenshot(path=str(ART/'eliminated.png'))
  if i==2:
   f.get_by_role('button',name='Pausa scena',exact=True).click();run(page,100);frozen=f.locator('.hell-race canvas').evaluate('c=>c.toDataURL()');run(page,500)
   assert f.locator('.hell-race canvas').evaluate('c=>c.toDataURL()')==frozen
   f.get_by_role('button',name='Riprendi scena',exact=True).click()
  run(page,750);assert f.locator('.hell-race').get_attribute('data-tie-phase')=='capture'
  if i==0:
   page.keyboard.press('p');run(page,100);frozen=f.locator('.hell-race canvas').evaluate('c=>c.toDataURL()');run(page,500)
   assert f.locator('.hell-race canvas').evaluate('c=>c.toDataURL()')==frozen
   f.get_by_role('button',name='Riprendi scena',exact=True).click();run(page,50)
  run(page,5600 if i<2 else 10000)
  if i<2:
   assert f.evaluate('HellscapeUI.game.s.phase')=='pareggio'
   f.get_by_role('button',name='Prossima domanda',exact=True).click();run(page,100);ready(f)
  else:
   assert f.evaluate('HellscapeUI.game.s.phase')=='conclusa';assert f.evaluate('HellscapeUI.game.s.winner') is None
   assert f.evaluate('__tiePlan.victims')==[respondent];assert f.locator('.hell-race').get_attribute('data-ending-phase')=='done'
 context.close()
 # Reduced motion has a stable readable card and an explicit continuation, without starting the timer.
 context,page,f=start(390,844,2,True);ordinary(page,f);f.get_by_role('button',name='Prossima domanda',exact=True).click();run(page,100)
 before=snapshot(f);image=f.locator('.hell-race canvas').evaluate('c=>c.toDataURL()');run(page,4000)
 assert snapshot(f)==before and f.locator('.hell-race canvas').evaluate('c=>c.toDataURL()')==image
 page.screenshot(path=str(ART/'intro-reduced.png'))
 page.emulate_media(reduced_motion='no-preference');run(page,100);page.emulate_media(reduced_motion='reduce');run(page,100)
 f.get_by_role('button',name='Pausa scena',exact=True).focus();page.keyboard.press('Enter');run(page,100);assert f.evaluate('FoolHellRace.tieStatus().paused')
 page.keyboard.press(' ');run(page,100);assert not f.evaluate('FoolHellRace.tieStatus().paused')
 f.get_by_role('button',name='Inizia spareggio',exact=True).focus();page.keyboard.press('Enter');run(page,100);ready(f)
 f.evaluate('()=>{const g=HellscapeUI.game;g.reveal();g.answer((g.s.current.correct+1)%4);HellscapeUI.changed()}');run(page,100)
 expect(f.locator('.tie-heading')).to_have_text('ELIMINATO');frozen=f.locator('.hell-race canvas').evaluate('c=>c.toDataURL()');run(page,500)
 assert f.locator('.hell-race canvas').evaluate('c=>c.toDataURL()')==frozen
 run(page,700);assert not f.locator('.tie-layer').count();assert f.locator('.operation-body').is_visible();assert not f.evaluate('HellscapeUI.game.running');context.close()
 # Resume never replays an intro that was in progress in another document.
 context,page,f=start();ordinary(page,f);f.get_by_role('button',name='Prossima domanda',exact=True).click();run(page,500)
 saved=f.evaluate('JSON.stringify(HellscapeUI.game.s.groups)');page.evaluate("HellscapePreview.navigate('Fool.html?resume=1')");run(page,100)
 page.wait_for_function("document.querySelector('iframe').contentWindow.HellscapeUI?.game");f=page.frames[1];run(page,200)
 assert f.evaluate('JSON.stringify(HellscapeUI.game.s.groups)')==saved;assert not f.locator('.tie-layer').count();assert not f.evaluate('HellscapeUI.game.running')
 f.get_by_role('button',name='Prossima domanda',exact=True).click();run(page,100);assert f.evaluate('HellscapeUI.game.s.screen')=='hidden';assert not f.locator('.tie-layer').count();context.close()
 assert not report['errors'],report['errors'];assert not report['external_requests'],report['external_requests'];browser.close()
(ART/'measurements.json').write_text(json.dumps(report,indent=2));print('PASS:',len(report['cases']),'viewport/DPR cases; frozen engine/input/focus, deferred captures, new rounds, all three eliminations/Game Over, reduced motion and resume')
