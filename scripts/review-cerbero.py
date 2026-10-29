"""Historical v1 recording harness. Current correction: review-cerbero-v2.py."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
from PIL import Image
from io import BytesIO
import threading, os, json, subprocess, hashlib, math

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'docs/cerbero/evidence';OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
report={'revision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
 'runtime_sha256':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT/'assets').rglob('*')) if p.is_file()},
 'errors':[],'clips':[],'screenshots':[],'source':'real Chromium screenshots; no renderer replacement'}
def encode(name,frames,step):
 converted=[im.quantize(colors=256,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE) for im in frames]
 durations=[(round((i+1)*step/10)-round(i*step/10))*10 for i in range(len(frames))]
 converted[0].save(OUT/name,save_all=True,append_images=converted[1:],duration=durations,loop=0,disposal=1,optimize=False)
 report['clips'].append({'file':name,'viewport':[1366,768],'gif_pixels':[768,432],'duration_ms':sum(durations),'capture_fps':1000/step,
  'bytes':(OUT/name).stat().st_size,'sha256':hashlib.sha256((OUT/name).read_bytes()).hexdigest()})
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
  def start(w,h,dpr=1,reduced=False):
   q=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=dpr,reduced_motion='reduce' if reduced else 'no-preference')
   q.clock.install();q.add_init_script('Math.random=()=>.25');q.on('pageerror',lambda e:report['errors'].append(str(e)))
   q.goto(f'http://127.0.0.1:{server.server_port}/Fool.html?start=1');q.get_by_role('button',name='Inizia partita',exact=False).click()
   q.wait_for_function('FoolAmmo.ready() && FoolCerbero.ready() && FoolBridge.load()?.complete && FoolPortal.load()?.complete && FoolPortal.loadRocks()?.complete')
   q.evaluate('document.fonts.ready');q.clock.pause_at(q.evaluate('Date.now()+1000'));q.clock.run_for(1500)
   return q
  def fixture(q):
   return q.evaluate('''()=>{const g=HellscapeUI.game,s=g.s;for(let i=0;i<3;i++){s.groups[i].name=['Aster','Moro','Vespro'][i];s.groups[i].score=Fool.rational([1200,600,300][i]);s.groups[i].inventory=[{id:g.uid(),type:'arsenico',target:null,origin:'review'}];}HellscapeUI.changed();return {source:s.owner,target:s.order[1]};}''')
  def image(q):return Image.open(BytesIO(q.screenshot())).convert('RGB').resize((768,432),Image.Resampling.LANCZOS)
  def snap(q):return q.evaluate('FoolHellRace.presentationSnapshot()')
  def model(q):return q.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')
  q=start(1366,768);f=fixture(q)
  for _ in range(60):
   q.clock.run_for(100)
   if q.get_by_role('button',name='Inventario',exact=True).is_visible():break
  assert q.get_by_role('button',name='Inventario',exact=True).is_visible(),q.locator('body').inner_text()
  q.screenshot(path=str(OUT/'corsa-desktop.png'));report['screenshots'].append({'file':'corsa-desktop.png','viewport':[1366,768],'dpr':1})
  # Real inventory and confirmation controls start the vial effect.
  q.get_by_role('button',name='Inventario',exact=True).click();q.locator('#dialog [data-ammo="arsenico"]').first.click()
  q.screenshot(path=str(OUT/'arsenico-inventario.png'));report['screenshots'].append({'file':'arsenico-inventario.png','viewport':[1366,768],'dpr':1})
  q.locator('#ammo-info').get_by_role('button',name='Usa',exact=True).click();q.locator('#bonus-target').select_option(str(f['target']))
  q.locator('#dialog').get_by_role('button',name='Conferma uso',exact=True).click()
  frames=[];before=model(q)
  for i in range(36):
   q.clock.run_for(125);frames.append(image(q));assert model(q)==before,'Presentation never reapplies poison or changes scores'
  encode('corsa-arsenico.gif',frames,125)
  assert q.locator('.turn-order').inner_text().find('Arsenico: 2 turni rimanenti')>=0
  q.screenshot(path=str(OUT/'arsenico-attivo.png'))
  report['screenshots'].append({'file':'arsenico-attivo.png','viewport':[1366,768],'dpr':1})
  q.evaluate('HellscapeUI.game.complete(0);HellscapeUI.changed()');q.clock.run_for(100)
  plan=snap(q)['plan'];before=model(q);frames=[];consumed=set();phases=[];speeds=[]
  for i in range(math.ceil((plan['lineupEnd']+5.2)*10)):
   q.clock.run_for(100);s=snap(q);fr=s['frame'];speeds.append(fr['camera']['speed'])
   if fr.get('victim')==plan['victims'][0]:frames.append(image(q))
   if not phases or phases[-1]!=s['phase']:phases.append(s['phase'])
   assert model(q)==before
   if fr.get('gripped'):
    car=fr['positions'][fr['victim']];assert abs(car['x']-fr['anchors']['hand']['x'])<.01
   for index in consumed:assert fr['positions'][index].get('visible') is False
   consumed.update(s['consumed'])
  encode('cattura.gif',frames,100)
  # Finish the second capture, then record the entire escape and final reaction.
  while snap(q)['phase'] in ['lineup','capture']:q.clock.run_for(100)
  escape=[];reaction=[];fire_checked=False
  while snap(q)['phase']!='done':
   q.clock.run_for(125);s=snap(q);fr=s['frame']
   (reaction if s['phase'] in ['rage','fire','exhausted','done'] else escape).append(image(q))
   if not phases or phases[-1]!=s['phase']:phases.append(s['phase'])
   if s['phase']=='fire' and fr.get('fireAge',0)>.35 and not fire_checked:
    fire_checked=True;q.screenshot(path=str(OUT/'tre-fiammate.png'));report['screenshots'].append({'file':'tre-fiammate.png','viewport':[1366,768],'dpr':1})
    q.get_by_role('button',name='Pausa scena',exact=True).click();q.clock.run_for(100)
    frozen=q.locator('.hell-race canvas').evaluate('c=>c.toDataURL()');q.clock.run_for(500)
    assert frozen==q.locator('.hell-race canvas').evaluate('c=>c.toDataURL()')
    q.get_by_role('button',name='Riprendi scena',exact=True).click()
   assert model(q)==before
  for i in range(8):q.clock.run_for(125);reaction.append(image(q))
  assert fire_checked and len(snap(q)['consumed'])==2 and q.locator('.final-title').is_visible()
  encode('fuga-portale.gif',escape,125);encode('reazione.gif',reaction,125)
  report.update({'engine_unchanged_during_animation':True,'no_resurrection':True,'pause_fire':True,'phases':phases,'capture_speed_range':[min(speeds),max(speeds)]})
  q.close()
  q=start(844,390,2,True);fixture(q);q.clock.run_for(3500)
  q.get_by_role('button',name='Svela e avvia il tempo',exact=True).click();q.clock.run_for(100)
  q.screenshot(path=str(OUT/'domanda-mobile.png'));report['screenshots'].append({'file':'domanda-mobile.png','viewport':[844,390],'dpr':2})
  assert q.evaluate('document.documentElement.scrollWidth<=innerWidth+1 && document.documentElement.scrollHeight<=innerHeight+1')
  q.close();assert not report['errors'],report['errors'];browser.close()
finally:server.shutdown()
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS: integrated race/vial/capture/three-mouth fire GIFs, pause, preserved engine and landscape UI')
