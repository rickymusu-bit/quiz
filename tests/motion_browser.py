"""Actual offline motion: shared time, rebuild, pause/visibility, reduced motion and review GIF."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
from io import BytesIO
import os, json, base64, subprocess, math
ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/'artifacts/motion';ART.mkdir(parents=True,exist_ok=True)
HTML=(ROOT/'dist/Hellscape-review.html').read_text()
report={'revision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'cases':[],'errors':[],'external_requests':[]}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 for width,height,dpr,reduced in [(1366,768,1,False),(844,390,2,False),(390,844,2,False),(390,844,2,True)]:
  context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=dpr,offline=True,reduced_motion='reduce' if reduced else 'no-preference')
  def route(r):
   if r.request.url=='http://motion.test/preview':r.fulfill(content_type='text/html',body=HTML)
   else:report['external_requests'].append(r.request.url);r.abort()
  context.route('**/*',route);page=context.new_page();page.set_default_timeout(120000)
  page.on('pageerror',lambda e:report['errors'].append(str(e)))
  page.goto('http://motion.test/preview');page.evaluate("HellscapeQuality.show('corsa')")
  page.locator('#quality-tools').evaluate('(el)=>el.style.display="none"');f=page.frames[1]
  page.clock.install();page.clock.pause_at(page.evaluate('Date.now()+1000'))
  state=lambda:f.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')
  snapshot=lambda:f.evaluate('FoolHellRace.motionSnapshot()')
  raw=lambda:f.locator('.hell-race canvas').evaluate('c=>c.toDataURL()')
  def motion_preference(value):
   page.emulate_media(reduced_motion=value)
   mode='reduced' if value=='reduce' else 'full'
   # CDP acknowledges the setting before the native media event necessarily
   # rebuilds the stage. Wait for the rendered scene to adopt the preference.
   for attempt in range(20):
    page.clock.run_for(100)
    if f.locator('.hell-race').get_attribute('data-motion')==mode:
     page.clock.run_for(100);return
   raise AssertionError('Scene did not adopt motion preference '+value)
  before=state();initial=snapshot();frames=[]
  for step in range(24):
   page.clock.run_for(100);image=Image.open(BytesIO(base64.b64decode(raw().split(',')[1]))).convert('RGB');frames.append(image)
  after=snapshot();assert state()==before,'Presentation must preserve engine and timer'
  if reduced:assert after['distance']==initial['distance'] and after['gait']==initial['gait'] and all(im.tobytes()==frames[0].tobytes() for im in frames)
  else:
   assert abs(after['distance']-initial['distance']-48*(after['time']-initial['time']))<1e-7
   assert len({im.tobytes() for im in frames})==24,'Every sampled frame evolves'
   if width==1366:
    frames[0].save(ART/'locomotion.gif',save_all=True,append_images=frames[1:],duration=[100]*23+[800],loop=0,optimize=True)
    board=Image.new('RGB',(1024,2*408),'#15100d');draw=ImageDraw.Draw(board)
    for i,step in enumerate([0,3,6,9]):
     x=(i%2)*512;y=(i//2)*408;board.paste(frames[step],(x,y+24));draw.text((x+10,y+6),f'{step/10:.1f} s',fill='#ffdfa7')
    board.save(ART/'stride-sequence.png')
  f.locator('.hell-race').scroll_into_view_if_needed();page.screenshot(path=str(ART/f'corsa-{width}x{height}-dpr{dpr}{"-reduced" if reduced else ""}.png'))
  # A render at exactly the same timestamp must not restart locomotion or its score tween.
  a=snapshot();f.evaluate('HellscapeUI.changed()');assert snapshot()==a
  page.clock.run_for(100)
  for hidden in [False,True]:
   if hidden:f.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true})")
   else:f.evaluate("()=>{HellscapeUI.game.s.paused=true;HellscapeUI.changed()}")
   page.clock.run_for(100);paused=raw();stopped=snapshot();page.clock.run_for(500)
   assert raw()==paused and snapshot()==stopped,'Pause and hidden tab freeze every scene layer'
   if hidden:f.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>false})")
   else:f.evaluate("()=>{HellscapeUI.game.s.paused=false;HellscapeUI.changed()}")
   page.clock.run_for(100)
  if width==1366 and not reduced:
   f.evaluate("()=>{HellscapeUI.game.setScore(0,Fool.rational(300));HellscapeUI.changed()}");page.clock.run_for(100)
   motion_preference('reduce')
   static=raw();distance=snapshot()['distance'];page.clock.run_for(200)
   assert snapshot()['distance']==distance,'Reduced motion freezes road travel'
   assert raw()==static,'Switching to reduced motion freezes existing footfall dust too'
   motion_preference('no-preference')
   assert f.locator('.hell-race').get_attribute('data-animation-busy')=='false','A static score update must not rewind after motion is restored'
   page.clock.run_for(100)
   f.evaluate("()=>{HellscapeUI.game.setScore(0,Fool.rational(600));HellscapeUI.changed()}")
   assert f.locator('.hell-race').get_attribute('data-animation-busy')=='true'
   page.clock.run_for(800);f.evaluate('HellscapeUI.changed()');page.clock.run_for(850)
   assert f.locator('.hell-race').get_attribute('data-animation-busy')=='false','Rebuild must preserve partial score tween'
   f.evaluate('HellscapeUI.changed()')
   assert f.locator('.hell-race').get_attribute('data-animation-busy')=='false','Completed tween must never block a later render'
   f.evaluate("()=>{const g=HellscapeUI.game;g.eliminate(1,'test');g.eliminate(2,'test');g.s.id+='-ending';g.complete(0);window.__completions=0;document.addEventListener('foolendingcomplete',()=>__completions++);HellscapeUI.changed()}")
   page.clock.run_for(100)
   duration=f.evaluate('FoolHellRace.presentationSnapshot().plan.duration')
   page.clock.run_for(math.ceil(duration*1000)+200)
   assert f.evaluate('__completions')==1
   f.evaluate('HellscapeUI.changed()');page.clock.run_for(100)
   assert f.evaluate('__completions')==1,'A completed final emits its event once across renders'
  report['cases'].append({'viewport':[width,height],'dpr':dpr,'reduced':reduced,'elapsed':after['time']-initial['time'],'distance':after['distance']-initial['distance']})
  context.close()
 browser.close()
assert not report['errors'],report['errors']
assert not report['external_requests'],report['external_requests']
(ART/'measurements.json').write_text(json.dumps(report,indent=2))
print('PASS: offline motion on desktop and Android portrait/landscape DPR 1/2; pause/visibility, rebuild continuity, reduced motion, engine invariance')
