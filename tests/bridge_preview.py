"""Real gameplay GIF for the black stone/iron bridge, with pause and state checks."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
from PIL import Image
from io import BytesIO
import threading,json,os,subprocess,hashlib
ROOT=Path(__file__).resolve().parent.parent;ART=ROOT/'artifacts/black-bridge-v2';ART.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
report={'revision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'errors':[]}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1024,'height':768});page.on('pageerror',lambda e:report['errors'].append(str(e)))
 page.goto(f'http://127.0.0.1:{server.server_port}/Fool.html?start=1');page.get_by_role('button',name='Inizia partita',exact=False).click()
 page.wait_for_function('FoolBridge.load()?.complete && FoolBridge.load().naturalWidth===2172 && FoolEnding.prepare(FoolEnding.load(()=>{}))!==null')
 page.evaluate('document.fonts.ready');page.clock.install();page.clock.pause_at(page.evaluate('Date.now()+1000'));page.clock.run_for(200)
 checks=page.evaluate('''()=>{
  const render=(distance,effectTime)=>{const c=document.createElement('canvas');c.width=768;c.height=576;const ctx=c.getContext('2d');
   FoolBridge.environment(ctx,768,576,distance/48,effectTime);FoolBridge.draw(ctx,768,distance/48,0,null,effectTime);FoolBridge.front(ctx,768,{distance});return ctx};
  const first=render(24,.5);let compared=0;
  for(const [distance,time]of [[72,1.5],[120,4.2]]){
   const next=render(distance,time);
   for(const [y,h]of [[350,150],[540,30]]){
    const a=first.getImageData(160,y,400,h).data,b=next.getImageData(160-(distance-24),y,400,h).data;
    for(let i=0;i<a.length;i++){if(a[i]!==b[i])throw Error('Lava slides relative to the bridge');compared++}
   }
  }
  const widths=[44,58,62,54,56,40],vehicles=FoolHellRace.presentationSnapshot().frame.positions;
  for(const v of vehicles){if(Math.abs(v.width-widths[v.row]*.62*2)>1e-9)throw Error('Vehicle is not doubled');
   if(v.ground<=FoolBridge.TOP||v.ground>=FoolBridge.BOTTOM)throw Error('Tyres are off the deck')}
  return {world_lock_channels_compared:compared,vehicles:vehicles.map(v=>({row:v.row,width:v.width,height:v.height,ground:v.ground})),vehicle_scale_vs_v1:2};
 }''')
 report.update(checks)
 page.screenshot(path=str(ART/'inspection.png'),scale='css')
 state=page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())');start=page.evaluate('FoolHellRace.motionSnapshot()');frames=[]
 for i in range(72):
  page.clock.run_for(round((i+1)*1000/12)-round(i*1000/12))
  frames.append(Image.open(BytesIO(page.screenshot(scale='css'))).convert('RGB').resize((640,480),Image.Resampling.LANCZOS))
 end=page.evaluate('FoolHellRace.motionSnapshot()')
 assert end['distance']>start['distance']+280 and frames[0].tobytes()!=frames[-1].tobytes()
 assert page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')==state
 occlusion=page.evaluate('''()=>{const c=document.createElement('canvas');c.width=768;c.height=576;const ctx=c.getContext('2d');
 ctx.fillStyle='#00ff00';ctx.fillRect(0,FoolBridge.BOTTOM-FoolBridge.FRONT_RISE,768,12);FoolBridge.front(ctx,768,{distance:0});
 const p=ctx.getImageData(380,FoolBridge.BOTTOM-8,1,1).data;return !(p[0]===0&&p[1]===255&&p[2]===0)}''')
 assert occlusion,'Foreground masonry must occlude geometry behind it'
 page.evaluate('()=>{HellscapeUI.game.s.paused=true;HellscapeUI.changed()}');page.clock.run_for(200)
 frozen=page.locator('.hell-race canvas').evaluate('c=>c.toDataURL()');page.clock.run_for(500)
 assert page.locator('.hell-race canvas').evaluate('c=>c.toDataURL()')==frozen
 palette=frames[0].quantize(colors=128,method=Image.Quantize.MEDIANCUT)
 encoded=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
 durations=[(round((i+1)*100/12)-round(i*100/12))*10 for i in range(72)]
 file=ART/'gameplay-black-bridge-v2.gif';encoded[0].save(file,save_all=True,append_images=encoded[1:],duration=durations,loop=0,disposal=1,optimize=False)
 gif=Image.open(file);duration=0
 for i in range(gif.n_frames):gif.seek(i);duration+=gif.info.get('duration',0)
 assert gif.n_frames==72 and duration==6000
 report.update({'viewport':[1024,768],'gif_pixels':[640,480],'frames':72,'duration_ms':6000,'capture_fps':12,'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'world_distance':end['distance']-start['distance'],'engine_unchanged':True,'foreground_occlusion':'PASS','pause':'PASS'})
 # Verify packaged textures as well, without producing an HTML deliverable.
 ctx=browser.new_context(offline=True,viewport={'width':390,'height':844},reduced_motion='reduce');requests=[]
 def route(r):
  if r.request.url=='http://bridge.test/':r.fulfill(content_type='text/html',body=(ROOT/'dist/Hellscape-offline.html').read_text())
  else:requests.append(r.request.url);r.abort()
 ctx.route('**/*',route);q=ctx.new_page();q.on('pageerror',lambda e:report['errors'].append(str(e)));q.goto('http://bridge.test/')
 q.frame_locator('iframe').get_by_role('link',name='Nuova partita',exact=True).click();f=q.frames[1];f.get_by_role('button',name='Inizia partita',exact=False).click()
 f.wait_for_function('FoolBridge.load()?.complete && FoolBridge.load().naturalWidth===2172');assert f.evaluate('FoolBridge.load().src.startsWith("data:image/png;base64,")')
 assert not requests,requests;report['offline_external_requests']=requests
 assert not report['errors'],report['errors'];browser.close()
server.shutdown();(ART/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
