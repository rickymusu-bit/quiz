"""Real timed browser capture of the bottom question dock unfolding upwards."""
from omen_support import ROOT, server, base
from playwright.sync_api import sync_playwright
from PIL import Image
from io import BytesIO
import os,json
OUT=ROOT/'docs/screenshots/omen-v1';OUT.mkdir(parents=True,exist_ok=True)
frames=[]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
  q=b.new_page(viewport={'width':844,'height':390},device_scale_factor=1)
  q.clock.install();q.add_init_script('Math.random=()=>.25');q.goto(base+'Fool.html?start=1');q.get_by_role('button',name='Inizia partita',exact=False).click()
  q.wait_for_function('FoolAmmo.ready() && FoolBridge.load()?.complete && FoolEnding.prepare(FoolEnding.load(()=>{}))!==null');q.evaluate('document.fonts.ready');q.clock.pause_at(q.evaluate('Date.now()+1000'));q.clock.run_for(2000)
  def capture(n):
   for _ in range(n):frames.append(Image.open(BytesIO(q.screenshot())).convert('RGB'));q.clock.run_for(50)
  q.screenshot(path=str(OUT/'question-closed.png'));closed=q.locator('.operation-body').bounding_box();capture(10)
  q.get_by_role('button',name='Svela e avvia il tempo',exact=True).click()
  capture(40);opened=q.locator('.operation-body').bounding_box();q.screenshot(path=str(OUT/'question-open.png'))
  assert opened['y']<closed['y'];assert abs(opened['y']+opened['height']-closed['y']-closed['height'])<2
  b.close()
 sheet=Image.new('RGB',(844,390*5))
 for i,f in enumerate(frames[::10]):sheet.paste(f,(0,390*i))
 palette=sheet.quantize(colors=256,method=Image.Quantize.MEDIANCUT)
 encoded=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
 encoded[0].save(OUT/'question-open.gif',save_all=True,append_images=encoded[1:],duration=50,loop=0,disposal=1,optimize=True)
 (OUT/'question-capture.json').write_text(json.dumps({'viewport':[844,390],'duration_ms':2500,'fps':20,'frames':len(frames),'closed':closed,'open':opened,'source':'real browser capture; virtual clock advances at 50 ms'},indent=2)+'\n')
 print('PASS: bottom edge fixed; question expands upward; real 2.5s browser GIF')
finally:server.shutdown()
