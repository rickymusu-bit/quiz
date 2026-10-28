"""Real offline portal: geometry, passage, destruction, epilogue and native title."""
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from PIL import Image
from io import BytesIO
import os,json,subprocess,base64,math,sys
ROOT=Path(__file__).resolve().parent.parent;ART=ROOT/'artifacts/portal';ART.mkdir(parents=True,exist_ok=True)
HTML=(ROOT/'dist/Hellscape-review.html').read_text()
VIEWPORTS=[(1920,1080),(1366,768),(1024,768),(844,390),(390,844)];DPRS=[1,2]
if '--quick' in sys.argv:VIEWPORTS=[(1366,768),(390,844)];DPRS=[1]
report={'revision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'movies':[],'renders':[],'errors':[],'external_requests':[]}
VEHICLES=['chopper','pickup','truck','coupe','offroad','ape']
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 def start(width=1366,height=768,dpr=1,reduced=False):
  context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=dpr,offline=True,reduced_motion='reduce' if reduced else 'no-preference')
  def route(r):
   if r.request.url=='http://portal.test/preview':r.fulfill(content_type='text/html',body=HTML)
   else:report['external_requests'].append(r.request.url);r.abort()
  context.route('**/*',route);page=context.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:report['errors'].append(str(e)))
  page.goto('http://portal.test/preview');page.evaluate("HellscapeQuality.show('corsa')")
  page.locator('#quality-tools').evaluate('e=>e.open=true');last=page.get_by_role('button',name='Regole',exact=True);last.scroll_into_view_if_needed();box=last.bounding_box()
  assert box['x']>=0 and box['y']>=0 and box['x']+box['width']<=width+1 and box['y']+box['height']<=height+1,'Every review scenario must be reachable on mobile'
  page.locator('#quality-tools').evaluate('e=>e.style.display="none"');f=page.frames[1]
  f.wait_for_function('FoolPortal.load()?.complete && FoolEnding.prepare(FoolEnding.load(()=>{}))!==null')
  page.clock.install();page.clock.pause_at(page.evaluate('Date.now()+1000'))
  return context,page,f
 def finish(f,winner=0,vehicle='chopper'):
  f.evaluate('''({winner,vehicle,others})=>{const g=HellscapeUI.game;g.s.id+='-portal-review';g.s.config.vehicles=[vehicle,...others];g.s.groups[0].name='Fuggitivo';
   g.eliminate(1,'già divorato');g.eliminate(2,'già divorato');if(winner===null)g.eliminate(0,'test');
   g.complete(winner);window.__endingDone=0;document.addEventListener('foolendingcomplete',()=>__endingDone++);HellscapeUI.changed()}''',{'winner':winner,'vehicle':vehicle,'others':[v for v in VEHICLES if v!=vehicle][:2]})
 def snap(f):return f.evaluate('FoolHellRace.presentationSnapshot()')
 def state(f):return f.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')
 def raw(f):return f.locator('.hell-race canvas').evaluate('c=>c.toDataURL()')
 # Actual RAF playback, including the title and a single completion event.
 context,page,f=start();finish(f);page.clock.run_for(100);before=state(f);plan=snap(f)['plan'];phases=[];frames=[];paused=set();shots=set()
 assert plan['victims']==[]
 for step in range(math.ceil((plan['duration']+.3)*5)):
  page.clock.run_for(200);data=snap(f);fr=data['frame'];phase=data['phase']
  if not phases or phases[-1]!=phase:phases.append(phase)
  if fr.get('portal'):
   assert fr['portal']['geometry']['near']-fr['portal']['geometry']['far']>110
   if fr['portal']['sink']>0 or fr['bridge']['collapse']>0:assert fr['cleared']
   if phase in ['rage','fire','exhausted','done']:assert not fr['portal']['visible']
   assert fr['positions'][1]['visible'] is False and fr['positions'][2]['visible'] is False
  if phase in ['open','fire'] and phase not in paused:
   paused.add(phase);f.get_by_role('button',name='Pausa scena',exact=True).click();page.clock.run_for(100);image=raw(f);time=snap(f)['frame']['time'];page.clock.run_for(500)
   assert raw(f)==image and snap(f)['frame']['time']==time
   f.evaluate('HellscapeUI.changed()');page.clock.run_for(100);assert raw(f)==image
   page.set_viewport_size({'width':768,'height':1366});page.clock.run_for(100);assert raw(f)==image
   page.set_viewport_size({'width':1366,'height':768});page.clock.run_for(100)
   f.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))");page.clock.run_for(500);assert raw(f)==image
   f.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))")
   f.get_by_role('button',name='Riprendi scena',exact=True).focus();page.keyboard.press('Enter');page.clock.run_for(100)
  if phase in ['rise','open','escape','sink','rage','fire','exhausted','done'] and phase not in shots:
   shots.add(phase);page.screenshot(path=str(ART/f'movie-{phase}.png'))
  if step%2==0:
   frames.append(Image.open(BytesIO(page.screenshot())).convert('RGB').resize((683,384),Image.Resampling.LANCZOS))
  assert state(f)==before,'The whole movie must preserve the authoritative game and timer'
 assert phases==['lineup','winner-chase','rise','open','escape','close','sink','rage','fire','exhausted','done'],phases
 assert paused=={'open','fire'};assert f.evaluate('__endingDone')==1
 expect(f.locator('.end-wordmark')).to_have_attribute('alt','VITTORIA');expect(f.locator('.winner-escape')).to_have_text("Fuggitivo è fuggito dall'inferno!")
 f.evaluate('HellscapeUI.changed()');page.clock.run_for(100);assert f.evaluate('__endingDone')==1
 frames[0].save(ART/'portal.gif',save_all=True,append_images=frames[1:],duration=[400]*(len(frames)-1)+[1600],loop=0,optimize=True)
 report['movies'].append({'winner':0,'phases':phases,'state_unchanged':True,'completion_events':1});context.close()
 # The same logical projection and uncut silhouettes at every viewport and DPR.
 for vi,(width,height) in enumerate(VIEWPORTS):
  for dpr in DPRS:
   context,page,f=start(width,height,dpr);vehicle=VEHICLES[(vi+(dpr-1)*3)%6]
   f.evaluate('''()=>{const E=FoolEnding,render=E.render,frame=E.frame,T=FoolEpilogue.T;window.__portalSample='open';
    const at=p=>p.chaseEnd+(__portalSample==='open'?T.openEnd:__portalSample==='cross'?T.openEnd+.6:__portalSample==='sink'?T.closeEnd+.75:T.duration);
    E.frame=(...a)=>{a[2]=at(a[0]);return frame(...a)};E.render=(...a)=>{a[4]=at(a[3]);return render(...a)}}''')
   finish(f,vehicle=vehicle);page.clock.run_for(100);f.evaluate('FoolHellRace.pauseScene()');page.clock.run_for(100)
   before=state(f)
   for key in ['open','cross','sink','done']:
    f.evaluate('key=>{__portalSample=key;HellscapeUI.changed()}',key);page.clock.run_for(100)
    f.evaluate('async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))}')
    data=snap(f);fr=data['frame'];box=f.locator('.hell-race canvas').bounding_box();assert abs(box['width']/box['height']-4/3)<.001
    assert f.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    assert 0<=fr['demon']['left'] and fr['demon']['left']+fr['demon']['width']<=512 and fr['demon']['ground']<=338
    if key=='done':
     expect(f.locator('.final-title')).to_be_visible();expect(f.locator('.winner-escape')).to_have_text("Fuggitivo è fuggito dall'inferno!")
     assert f.locator('.end-wordmark').evaluate('i=>Math.abs(i.clientWidth/i.clientHeight-i.naturalWidth/i.naturalHeight)<.02'),'The wordmark must retain its intrinsic proportions'
     assert fr['bridge']['collapse']==1 and not fr['portal']['visible']
    page.screenshot(path=str(ART/f'{key}-{width}x{height}-dpr{dpr}.png'));assert state(f)==before
    report['renders'].append({'sample':key,'viewport':[width,height],'dpr':dpr,'vehicle':vehicle,'camera':fr['camera'],'portal':fr['portal'],'demon':fr['demon']})
   context.close()
 # Game Over and reduced motion must stay independent of victory architecture.
 for reduced,winner in [(False,None),(True,None),(True,0)]:
  context,page,f=start(390,844,2,reduced);finish(f,winner);page.clock.run_for(100)
  if not reduced:page.clock.run_for(math.ceil(snap(f)['plan']['duration']*1000)+200)
  assert snap(f)['phase']=='done';before=state(f);image=raw(f);page.clock.run_for(500);assert raw(f)==image and state(f)==before
  if winner is None:assert not snap(f)['frame'].get('portal');expect(f.locator('.end-wordmark')).to_have_attribute('alt','GAME OVER')
  else:expect(f.locator('.end-wordmark')).to_have_attribute('alt','VITTORIA')
  expect(f.locator('.final-title')).to_be_visible();context.close()
 assert not report['errors'],report['errors'];assert not report['external_requests'],report['external_requests'];browser.close()
(ART/'measurements.json').write_text(json.dumps(report,indent=2));print('PASS: world portal, full crossing before sinking/collapse, fists/flame/exhaustion/title, pause/orientation, Game Over/reduced; ',len(report['renders']),'offline viewport/DPR samples')
