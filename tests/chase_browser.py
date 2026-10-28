"""Offline world/camera choreography, real anchors, 0/1/2 losers and viewport/DPR review."""
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from PIL import Image
from io import BytesIO
import os,json,subprocess,base64,math,sys
ROOT=Path(__file__).resolve().parent.parent;ART=ROOT/'artifacts/chase';ART.mkdir(parents=True,exist_ok=True)
HTML=(ROOT/'dist/Hellscape-review.html').read_text()
report={'revision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'movies':[],'renders':[],'errors':[],'external_requests':[]}
VIEWPORTS=[(1920,1080),(1366,768),(1024,768),(844,390),(390,844)];DPRS=[1,2]
if '--quick' in sys.argv:VIEWPORTS=[(1366,768),(390,844)];DPRS=[1]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 def start(width=1366,height=768,dpr=1,reduced=False):
  context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=dpr,offline=True,reduced_motion='reduce' if reduced else 'no-preference')
  def route(r):
   if r.request.url=='http://chase.test/preview':r.fulfill(content_type='text/html',body=HTML)
   else:report['external_requests'].append(r.request.url);r.abort()
  context.route('**/*',route);page=context.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:report['errors'].append(str(e)))
  page.goto('http://chase.test/preview');page.evaluate("HellscapeQuality.show('corsa')");page.locator('#quality-tools').evaluate('e=>e.style.display="none"')
  return context,page,page.frames[1]
 def setup(f,remaining=2):
  f.evaluate('''remaining=>{const g=HellscapeUI.game;g.s.id+='-chase-'+remaining;g.s.groups.forEach((v,i)=>v.score=Fool.rational([1000,600,200][i]));if(remaining<2)g.eliminate(2,'già divorato');if(remaining<1)g.eliminate(1,'già divorato');HellscapeUI.changed()}''',remaining)
 def state(f):return f.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')
 def snap(f):return f.evaluate('FoolHellRace.presentationSnapshot()')
 def raw(f):return f.locator('.hell-race canvas').evaluate('c=>c.toDataURL()')
 # Play real RAF timelines. The renderer observes, but never changes the final model.
 for remaining in ([] if '--matrix' in sys.argv else [2,1,0]):
  context,page,f=start();page.clock.install();page.clock.pause_at(page.evaluate('Date.now()+1000'));setup(f,remaining);page.clock.run_for(100)
  entry=snap(f)['frame'];f.evaluate("window.__complete=0;document.addEventListener('foolendingcomplete',()=>__complete++);HellscapeUI.game.complete(0);HellscapeUI.changed()")
  before=state(f);page.clock.run_for(100);plan=snap(f)['plan'];assert plan['victims']==[2,1][:remaining] if remaining==2 else plan['victims']==([1] if remaining==1 else [])
  for v in plan['entry']['positions']:
   old=entry['positions'][v['index']];assert abs(v['x']-old['x'])<.01 and abs(v['ground']-old['ground'])<.01,'Final starts at the actual displayed position'
  frames=[];phases=set();seen_consumed=set();shots=set();pause_checked=False
  for step in range(math.ceil((plan['duration']+.3)*10)):
   page.clock.run_for(100);data=snap(f);fr=data['frame'];phases.add(data['phase'])
   for index in seen_consumed:assert fr['positions'][index].get('visible') is False,'A swallowed vehicle cannot return'
   seen_consumed.update(data['consumed'])
   if fr.get('gripped'):
    v=fr['positions'][fr['victim']];assert abs(v['x']-fr['anchors']['hand']['x'])<.01;assert abs(v['ground']-v['height']/2-fr['anchors']['hand']['y'])<.01
   assert fr.get('victim')!=0,'The winner is never caught';assert abs(fr['demon']['width']-221)<.01
   if remaining==2 and not pause_checked and fr.get('gripped'):
    pause_checked=True;f.get_by_role('button',name='Pausa scena',exact=True).click();page.clock.run_for(100);frozen=raw(f);held=state(f);page.clock.run_for(500)
    assert raw(f)==frozen and state(f)==held
    f.evaluate('HellscapeUI.changed()');page.clock.run_for(100);assert raw(f)==frozen
    page.set_viewport_size({'width':768,'height':1366});page.clock.run_for(100);assert raw(f)==frozen
    page.set_viewport_size({'width':1366,'height':768});page.clock.run_for(100)
    f.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))");page.clock.run_for(500);assert raw(f)==frozen
    f.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))")
    f.get_by_role('button',name='Riprendi scena',exact=True).focus();page.keyboard.press('Enter');page.clock.run_for(100)
   if remaining==2:
    shot='fila' if data['phase']=='lineup' and step>=6 else 'presa' if fr.get('gripped') else 'bocca' if fr.get('swallowing') else 'rincorsa' if data['phase']=='winner-chase' else None
    if shot and shot not in shots:
     shots.add(shot);page.screenshot(path=str(ART/f'{shot}.png'))
    if step%2==0 and data['phase'] not in ['roar','fire','rage','done']:
     frames.append(Image.open(BytesIO(base64.b64decode(raw(f).split(',')[1]))).convert('RGB'))
   assert state(f)==before,'Cinematic must not write points, outs, winner, timer or saved questions'
  assert snap(f)['phase']=='done';assert f.evaluate('__complete')==1;expect(f.locator('.final-title')).to_be_visible()
  f.evaluate('HellscapeUI.changed()');page.clock.run_for(100);assert f.evaluate('__complete')==1
  if frames:frames[0].save(ART/'chase.gif',save_all=True,append_images=frames[1:],duration=[200]*(len(frames)-1)+[1200],loop=0,optimize=True)
  report['movies'].append({'remaining_losers':remaining,'victims':plan['victims'],'duration':plan['duration'],'phases':sorted(phases),'state_unchanged':True});context.close()
 # Deterministic rendered samples, same logical geometry at every viewport/DPR.
 for width,height in VIEWPORTS:
  for dpr in DPRS:
   context,page,f=start(width,height,dpr);setup(f);f.wait_for_timeout(50)
   f.evaluate('''()=>{const E=FoolEnding,render=E.render,frame=E.frame;window.__sample='line';const at=p=>__sample==='line'?p.lineupEnd:__sample==='grip'?p.lineupEnd+1.1:__sample==='mouth'?p.lineupEnd+2.75:p.captureEnd+1.4;E.frame=(...a)=>{a[2]=at(a[0]);return frame(...a)};E.render=(...a)=>{a[4]=at(a[3]);return render(...a)};HellscapeUI.game.complete(0);HellscapeUI.changed()}''')
   f.wait_for_function("FoolHellRace.presentationSnapshot().frame?.phase==='capture'")
   f.evaluate('FoolHellRace.pauseScene()')
   for key in ['line','grip','mouth','chase']:
    f.evaluate("key=>{window.__sample=key;HellscapeUI.changed()}",key);page.wait_for_timeout(70)
    data=snap(f);fr=data['frame'];d=fr['demon'];assert d['left']>=0 and d['left']+d['width']<=512 and 0<d['ground']<=350
    box=f.locator('.hell-race canvas').bounding_box();assert abs(box['width']/box['height']-4/3)<.001,box
    assert f.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    page.screenshot(path=str(ART/f'{key}-{width}x{height}-dpr{dpr}.png'))
    report['renders'].append({'sample':key,'viewport':[width,height],'dpr':dpr,'demon':d,'camera':fr['camera']})
   context.close()
 # Static reduced-motion ending keeps complete information and never blocks the result.
 for winner in [0,None]:
  context,page,f=start(390,844,2,True);setup(f)
  f.evaluate('''winner=>{const g=HellscapeUI.game;if(winner===null){g.eliminate(0,'test');g.eliminate(1,'test');g.eliminate(2,'test');}g.complete(winner);HellscapeUI.changed()}''',winner)
  f.wait_for_function("document.querySelector('.hell-race').dataset.endingPhase==='done'");before=state(f);image=raw(f);page.wait_for_timeout(300);assert image==raw(f) and state(f)==before
  expect(f.locator('.final-title')).to_be_visible();context.close()
 assert not report['errors'],report['errors'];assert not report['external_requests'],report['external_requests'];browser.close()
(ART/'measurements.json').write_text(json.dumps(report,indent=2));print('PASS: 0/1/2 losers, state invariance, anchors/occlusion, pause/resume/orientation, no resurrection; ',len(report['renders']),'offline viewport/DPR samples')
