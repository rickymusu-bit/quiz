"""Record actual browser GIFs of the column redesign; check pause and offline assets."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
from PIL import Image
from io import BytesIO
import threading,json,os,subprocess,hashlib

ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/'artifacts/columns';ART.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
report={'revision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'cases':[],'errors':[]}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height,dpr in [(1024,768,1),(390,844,2)]:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=dpr)
  page.on('pageerror',lambda e:report['errors'].append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/Fool.html?start=1')
  page.get_by_role('button',name='Inizia partita',exact=False).click()
  page.wait_for_function('FoolBridge.loadColumns()?.complete && FoolBridge.loadColumns().naturalWidth===1254 && FoolEnding.prepare(FoolEnding.load(()=>{}))!==null')
  page.evaluate('document.fonts.ready');page.clock.install();page.clock.pause_at(page.evaluate('Date.now()+1000'))
  page.clock.run_for(100)
  state=page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')
  start=page.evaluate('FoolHellRace.motionSnapshot()');frames=[]
  output_size=(640,480) if width==1024 else (width,height)
  for i in range(80):
   page.clock.run_for(100)
   frame=Image.open(BytesIO(page.screenshot(scale='css'))).convert('RGB')
   frames.append(frame.resize(output_size,Image.Resampling.LANCZOS) if frame.size!=output_size else frame)
  finish=page.evaluate('FoolHellRace.motionSnapshot()')
  assert finish['distance']>start['distance']+370,'World scroll remains continuous throughout the recording'
  assert frames[0].tobytes()!=frames[-1].tobytes()
  assert page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')==state
  # Pause must freeze the integrated artwork along with the bridge and actors.
  page.evaluate("()=>{HellscapeUI.game.s.paused=true;HellscapeUI.changed()}");page.clock.run_for(100)
  stopped=page.locator('.hell-race canvas').evaluate('c=>c.toDataURL()');page.clock.run_for(500)
  assert page.locator('.hell-race canvas').evaluate('c=>c.toDataURL()')==stopped
  palette=frames[0].quantize(colors=128,method=Image.Quantize.MEDIANCUT)
  encoded=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
  durations=[100]*80
  file=ART/f'columns-{width}x{height}-dpr{dpr}.gif'
  encoded[0].save(file,save_all=True,append_images=encoded[1:],duration=durations,loop=0,disposal=1,optimize=False)
  gif=Image.open(file);duration=0
  for i in range(gif.n_frames):gif.seek(i);duration+=gif.info.get('duration',0)
  assert gif.n_frames==80 and duration==8000
  report['cases'].append({'viewport':[width,height],'dpr':dpr,'gif_pixels':list(output_size),'capture_fps':10,'frames':gif.n_frames,'duration_ms':duration,'file':file.name,'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'world_distance':finish['distance']-start['distance'],'pause':'PASS','engine_unchanged':True})
  page.close()
 # The offline bundle must carry the same native PNG and request no remote assets.
 context=browser.new_context(offline=True,viewport={'width':1024,'height':768},reduced_motion='reduce')
 external=[];html=(ROOT/'dist/Hellscape-offline.html').read_text()
 def route(r):
  if r.request.url=='http://columns.test/':r.fulfill(content_type='text/html',body=html)
  else:external.append(r.request.url);r.abort()
 context.route('**/*',route);page=context.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
 page.goto('http://columns.test/');page.frame_locator('iframe').get_by_role('link',name='Nuova partita',exact=True).click()
 f=page.frames[1];f.get_by_role('button',name='Inizia partita',exact=False).click()
 f.wait_for_function('FoolBridge.loadColumns()?.complete && FoolBridge.loadColumns().naturalWidth===1254')
 assert f.evaluate('FoolBridge.loadColumns().src.startsWith("data:image/png;base64,")')
 assert not external,external
 report['offline']={'native_atlas':'PASS','external_requests':external}
 context.close();assert not report['errors'],report['errors'];browser.close()
server.shutdown();(ART/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
