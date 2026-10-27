import os
"""Optional comparison against an existing checkout of PR #17, with no historical rules."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright,expect
from PIL import Image,ImageChops
import os,threading,json
ROOT=Path(__file__).resolve().parent.parent
BASE=Path(os.environ.get('HELLSCAPE_BASELINE','/tmp/hellscape-baseline'))
ART=ROOT/'artifacts';ART.mkdir(exist_ok=True)
servers=[]
for root in [BASE,ROOT]:
 class Quiet(SimpleHTTPRequestHandler):
  def log_message(self,*args):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
 threading.Thread(target=server.serve_forever,daemon=True).start();servers.append(server)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);checks=[];old_save=None
 for w,h in [(1440,900),(390,844),(844,390)]:
  for label,server in zip(['before','after'],servers):
   page=b.new_page(viewport={'width':w,'height':h},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script('Math.random=()=>0.25')
   page.goto(f'http://127.0.0.1:{server.server_port}/Fool.html?start=1')
   page.get_by_role('button',name='Inizia partita').click();expect(page.locator('.hell-race canvas')).to_have_count(1)
   page.evaluate('document.fonts.ready');page.wait_for_timeout(300)
   page.screenshot(path=str(ART/f'{label}-{w}x{h}.png'))
   if label=='before' and w==1440:
    old_save=page.evaluate('()=>{game.reveal();game.answer(game.s.current.correct);return JSON.stringify(game.snapshot())}')
   if label=='after' and w==1440:
    page.evaluate('(raw)=>HellscapeUI.restoreGame(raw)',old_save)
    assert page.evaluate('HellscapeUI.game.s.valid')==1
    assert page.evaluate('!HellscapeUI.game.running')
    assert page.evaluate('JSON.stringify(HellscapeUI.game.s.groups)')==json.dumps(json.loads(old_save)['groups'],separators=(',',':'),ensure_ascii=False)
   assert not errors,errors;page.close()
  diff=ImageChops.difference(Image.open(ART/f'before-{w}x{h}.png').convert('RGB'),Image.open(ART/f'after-{w}x{h}.png').convert('RGB'))
  assert diff.getbbox() is None,f'Visual drift at {w}x{h}: {diff.getbbox()}'
  checks.append({'viewport':[w,h],'different_pixels':0})
 b.close();print(json.dumps({'parity':checks,'previous_revision_save':'restored without changing groups, points or progress'},indent=2))
for server in servers:server.shutdown()
