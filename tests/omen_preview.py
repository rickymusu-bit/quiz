"""Real browser frames from Arsenico activation and personal turn progression."""
from omen_support import ROOT, ART, server, base, fixture, select, confirm
from playwright.sync_api import sync_playwright
from PIL import Image
from io import BytesIO
import json, os, shutil
OUT=ROOT/'docs/screenshots/omen-v1';OUT.mkdir(parents=True,exist_ok=True)
frames=[];sample_tick=[0]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
  q=b.new_page(viewport={'width':844,'height':390},device_scale_factor=1,reduced_motion='no-preference',has_touch=True)
  q.clock.install()
  q.add_init_script('Math.random=()=>.25');q.goto(base+'Fool.html?start=1');q.get_by_role('button',name='Inizia partita',exact=False).click()
  q.wait_for_function('FoolAmmo.ready() && FoolBridge.load()?.complete && FoolEnding.prepare(FoolEnding.load(()=>{}))!==null')
  q.evaluate('document.fonts.ready');q.clock.pause_at(q.evaluate('Date.now()+1000'))
  s=fixture(q);q.clock.run_for(2500);select(q,'arsenico',s['target']);q.screenshot(path=str(OUT/'arsenico-confirm.png'));confirm(q)
  def capture(n):
   for _ in range(n):
    if sample_tick[0]%2==0: frames.append(Image.open(BytesIO(q.screenshot())).convert('RGB'))
    sample_tick[0]+=1;q.clock.run_for(100)
  capture(24)
  for turn in range(3):
   q.get_by_role('button',name='Svela e avvia il tempo',exact=True).click()
   q.locator('.answer').nth(q.evaluate('(HellscapeUI.game.s.current.correct+1)%4')).click()
   capture(20)
   q.get_by_role('button',name='Prossima domanda',exact=True).click();capture(3)
  capture(12)
  assert q.evaluate('Fool.exact(HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].score)')=='7921/10'
  assert q.locator('.turn-order').get_by_text('Arsenico: 1 turni rimanenti',exact=False).count()==1
  q.screenshot(path=str(OUT/'arsenico-second-dose.png'))
  durations=[200]*(len(frames)-1)+[100]
  metadata={'viewport':[844,390],'duration_ms':sum(durations),'frames':len(frames),'fps':5,'clock':'virtual clock advances at 100 ms; real browser frames sampled every 200 ms','kind':'real browser screenshots; activation and next personal turn','scores':['1000','890','7921/10'],'graphics':'temporary As placeholder; existing approved demon'}
  b.close()
 # Global palette retains the same gold/iron colors across actual frames.
 samples=frames[::max(1,len(frames)//12)];sheet=Image.new('RGB',(844,390*len(samples)))
 for i,f in enumerate(samples):sheet.paste(f,(0,390*i))
 palette=sheet.quantize(colors=256,method=Image.Quantize.MEDIANCUT)
 encoded=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
 encoded[0].save(OUT/'arsenico-turns.gif',save_all=True,append_images=encoded[1:],duration=durations,loop=0,disposal=1,optimize=True)
 (OUT/'capture.json').write_text(json.dumps(metadata,indent=2)+'\n')
 for src,dst in [('hud-1440-False.png','hud-desktop.png'),('hud-844-False.png','hud-mobile.png'),('arsenico-844-False.png','arsenico-active.png'),('inventory-844-False.png','inventory-omen.png')]:shutil.copyfile(ART/src,OUT/dst)
 print(json.dumps(metadata))
finally:server.shutdown()
