"""Review real terrain at start/mid/end without changing the engine state.
--gifs also records a condensed visual progression and the final lava geysers.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw
from io import BytesIO
import os,threading,json,base64,sys
ROOT=Path(__file__).resolve().parent.parent;ART=ROOT/'artifacts';ART.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);checks=[];errors=[]
 for width,height in [(1440,900),(390,844),(844,390)]:
  page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/Fool.html?start=1');page.get_by_role('button',name='Inizia partita').click();page.wait_for_function("[...document.querySelectorAll('.vehicle-preview canvas')].every(c=>c.getContext('2d').getImageData(0,0,160,90).data.some(v=>v))");page.evaluate('document.fonts.ready');page.wait_for_timeout(500)
  page.clock.install();page.clock.pause_at(page.evaluate('Date.now()+1000'));before=page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')
  def show(count):
   page.evaluate('''count=>{const s=Fool.clone(HellscapeUI.game.s);s.id+='-terrain-'+count;s.valid=count;s.groups.forEach((g,i)=>g.score={n:String(count*[80,55,30][i]),d:'1'});document.querySelector('.hell-race').replaceWith(FoolHellRace.createStage(s));}''',count)
  def png():return base64.b64decode(page.locator('.hell-race canvas').evaluate('c=>c.toDataURL()').split(',')[1])
  images=[]
  for count in [0,16,33]:
   show(count);page.clock.run_for(100);images.append(Image.open(BytesIO(png())).convert('RGB'));page.screenshot(path=str(ART/f'terrain-{width}x{height}-{count}.png'))
  assert images[0].tobytes()!=images[-1].tobytes()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1')
  if width==1440:
   board=Image.new('RGB',(1536,416),'#121210');draw=ImageDraw.Draw(board)
   for i,(image,label) in enumerate(zip(images,['INIZIO','META PARTITA','FINE PARTITA'])):board.paste(image,(i*512,32));draw.text((i*512+12,10),label,fill='#e8c693')
   board.save(ART/'terrain-stages.png')
   if '--gifs' in sys.argv:
    page.emulate_media(reduced_motion='no-preference');frames=[]
    for step in range(80):
     show(min(33,step//2));page.clock.run_for(100);frames.append(Image.open(BytesIO(png())).convert('RGB'))
    frames[0].save(ART/'terrain-evolution.gif',save_all=True,append_images=frames[1:],duration=[100]*79+[1200],loop=0,optimize=True)
  assert page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')==before,'Visual progression must not change points, timer or progress in the engine'
  checks.append({'viewport':[width,height],'stages':[0,16,33],'state_unchanged':True});page.close()
 assert not errors,errors;browser.close();print(json.dumps({'terrain':checks,'errors':errors},indent=2))
server.shutdown()
