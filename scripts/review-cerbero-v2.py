"""Real Chromium recordings for the drawn Cerberus correction. No render overrides."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
from PIL import Image
from io import BytesIO
import threading,json,os,math,hashlib,subprocess,sys
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'docs/cerbero-v2/evidence';OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
report={'revision_parent':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'errors':[],'clips':[],
 'runtime_sha256':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT/'assets').rglob('*')) if p.is_file()}}
def gif(name,frames,step,viewport,kind):
 # One palette for the whole clip avoids frame palette flicker and oversized files.
 samples=Image.new('RGB',(160*8,90*math.ceil(len(frames)/8)))
 for i,im in enumerate(frames):samples.paste(im.resize((160,90)),(i%8*160,i//8*90))
 palette=samples.quantize(colors=256,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
 converted=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
 durations=[(round((i+1)*step/10)-round(i*step/10))*10 for i in range(len(frames))]
 file=OUT/name;converted[0].save(file,save_all=True,append_images=converted[1:],duration=durations,loop=0,disposal=1,optimize=True)
 report['clips'].append({'file':name,'viewport':viewport,'pixels':list(frames[0].size),'duration_ms':sum(durations),'fps':1000/step,'kind':kind,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
  q=b.new_page(viewport={'width':1366,'height':768});q.clock.install();q.add_init_script('Math.random=()=>.25');q.on('pageerror',lambda e:report['errors'].append(str(e)))
  q.goto(f'http://127.0.0.1:{server.server_port}/Fool.html?start=1');q.get_by_role('button',name='Inizia partita',exact=False).click()
  q.wait_for_function('FoolCerbero.ready() && FoolAmmo.ready() && FoolBridge.load()?.complete && FoolPortal.load()?.complete && FoolPortal.loadRocks()?.complete',timeout=120000)
  q.evaluate('document.fonts.ready');q.clock.pause_at(q.evaluate('Date.now()+1000'));q.clock.run_for(3500)
  assert q.evaluate('HellscapeUI.game.s.config.bases')=={'facile':111,'media':222,'difficile':333}
  canvas=q.locator('.hell-race canvas');box=canvas.bounding_box();scale=box['width']/768
  crop={'x':box['x'],'y':box['y']+110*scale,'width':400*scale,'height':245*scale}
  state=lambda:q.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')
  before=state();frames=[]
  for _ in range(64):
   q.clock.run_for(50);frames.append(Image.open(BytesIO(q.screenshot(clip=crop))).convert('RGB'));assert state()==before
  q.screenshot(path=str(OUT/'corsa-desktop.png'))
  gif('camminata.gif',frames,50,[1366,768],'real browser close-up of scene: x0..400, y110..355 in logical pixels')
  if '--walk-only' not in sys.argv:
   q.evaluate('''()=>{const g=HellscapeUI.game;g.s.groups.forEach((v,i)=>v.score=Fool.rational([1200,600,300][i]));HellscapeUI.changed()}''');q.clock.run_for(2500)
   q.evaluate('HellscapeUI.game.eliminate(2,"revisione cattura");HellscapeUI.changed()');q.clock.run_for(100)
   before=state();frames=[];actions=[]
   for _ in range(108):
    q.clock.run_for(50);data=q.evaluate('FoolHellRace.presentationSnapshot()');f=data['frame'];
    if f.get('action') and (not actions or actions[-1]!=f['action']):actions.append(f['action'])
    if f.get('attached'):
     car=f['positions'][f['victim']];mouth=f['anchors']['mouths']['right'];angle=car['rotation']
     assert abs(car['x']-math.cos(angle)*car['width']*.35-mouth['x'])<.01
     assert abs(car['ground']-car['height']/2-math.sin(angle)*car['width']*.35-mouth['y'])<.01
    frames.append(Image.open(BytesIO(q.screenshot())).convert('RGB').resize((768,432),Image.Resampling.LANCZOS));assert state()==before
   gif('morso-lancio-lava.gif',frames,50,[1366,768],'real browser capture, rigid flight and lava submersion')
   report['capture_actions']=actions
   q.evaluate('''()=>{const g=HellscapeUI.game;g.eliminate(1,'revisione finale');g.complete(0);HellscapeUI.changed()}''');q.clock.run_for(100)
   before=state();frames=[];record=False
   for _ in range(360):
    q.clock.run_for(50);data=q.evaluate('FoolHellRace.presentationSnapshot()');phase=data['phase']
    if phase=='fire':record=True
    if record:frames.append(Image.open(BytesIO(q.screenshot())).convert('RGB').resize((768,432),Image.Resampling.LANCZOS))
    assert state()==before
    if record and phase in ['exhausted','done']:break
   assert record;gif('tre-bocche.gif',frames,50,[1366,768],'real browser: all three mouth emitters')
  assert not report['errors'],report['errors'];b.close()
finally:server.shutdown()
(OUT/('walk-report.json' if '--walk-only' in sys.argv else 'report.json')).write_text(json.dumps(report,indent=2)+'\n')
print('PASS: real browser motion captures, exact mouth attachment and unchanged game state')
