"""Opt-in replay of a preserved REAL ImageGen candidate through the browser.

Does not call a generation API. Requires an existing sealed request plus its
external candidate and registration JSON. Not part of unattended CI.
"""
import argparse
from io import BytesIO
import json
import os
from pathlib import Path
import sys
import threading

from PIL import Image
from playwright.sync_api import expect, sync_playwright
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
import sprite_postprocess as core
from sprite_editor_server import EditorSession,make_server
from sprite_patches.materials import dump
from sprite_patches.verification import compare
from sprite_patches.workflow import run

p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--trial-root',type=Path,required=True)
p.add_argument('--request-id',default='patch-002')
a=p.parse_args()
trial=a.trial_root.resolve();out=trial/'browser';out.mkdir(exist_ok=True)
base=ROOT/'assets/hell-race/production/cerbero/run-stabilized-v1'
args=core.parser().parse_args([str(base/'source-sheet.png'),'--columns','4','--rows','2','--landmarks',str(base/'landmarks.json'),'--out',str(trial)])
session=EditorSession(args)
baseline=session.compute(session.project)
settings=json.loads((trial/'registration-real.json').read_text())
request_path=trial/'patches'/a.request_id
request=json.loads((request_path/'request.json').read_text())
source_hash=core.digest(base/'source-sheet.png')
candidate_hash=core.digest(trial/'imagegen-candidate.png')
shots=[];durations=[]
report={'type':'REAL ImageGen candidate imported through actual Chromium editor; candidate is NOT approved',
'viewport':[1460,980],'source_sha256':source_hash,'candidate_sha256':candidate_hash,'checks':[],'errors':[],'requests':[]}


def ready(page):page.wait_for_function("document.getElementById('busy').hidden && !document.getElementById('export').disabled")
def idle(page):page.wait_for_function("!document.getElementById('patch-dialog').hasAttribute('aria-busy')")
def screen(page,duration=650):
 shots.append(Image.open(BytesIO(page.screenshot())).convert('RGB'));durations.append(duration)
def native_click(page,identifier,point):
 canvas=page.locator('#'+identifier)
 canvas.evaluate('(c,p)=>{const v=c.parentElement;v.scrollLeft=Math.max(0,p[0]*c.clientWidth/c.width-v.clientWidth/2);v.scrollTop=Math.max(0,p[1]*c.clientHeight/c.height-v.clientHeight/2);}',point)
 rect=canvas.bounding_box();size=canvas.evaluate('c=>[c.width,c.height]')
 page.mouse.click(rect['x']+point[0]*rect['width']/size[0],rect['y']+point[1]*rect['height']/size[1])

with make_server(session) as server:
 thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
 try:
  with sync_playwright() as playwright:
   executable=os.environ.get('CHROMIUM_PATH') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else playwright.chromium.executable_path)
   browser=playwright.chromium.launch(executable_path=executable,args=['--no-sandbox','--disable-dev-shm-usage'])
   page=browser.new_page(viewport={'width':1460,'height':980},device_scale_factor=1)
   page.on('pageerror',lambda e:report['errors'].append(str(e)))
   page.on('request',lambda r:report['requests'].append(r.url))
   page.goto(f'http://127.0.0.1:{server.server_port}');ready(page);screen(page)
   page.locator('#patch-open').click();idle(page)
   page.locator('#patch-tab-import').click()
   if page.locator('#patch-request').input_value()!=a.request_id:
    page.locator('#patch-request').select_option(a.request_id);idle(page)
   page.locator('#patch-candidate').set_input_files(str(trial/'imagegen-candidate.png'));idle(page)
   page.locator('#patch-mapping').select_option(settings['input_mapping']['mode'])
   for pair in settings['landmarks']:
    native_click(page,'patch-target-canvas',pair['target']);native_click(page,'patch-generated-canvas',pair['generated'])
   for i,pair in enumerate(settings['landmarks'],1):
    for kind in ('target','generated'):
     for axis,letter in enumerate(('X','Y')):
      field=page.get_by_label(f'Punto {i} {kind} {letter}',exact=True)
      field.fill(str(pair[kind][axis]));field.press('Tab')
   page.locator('#patch-allow-scale').set_checked(settings['allow_scale'])
   page.locator('#patch-allow-rotation').set_checked(settings['allow_rotation'])
   page.locator('#patch-feather').fill(str(settings['feather_px']));page.locator('#patch-feather').press('Tab')
   page.locator('#patch-preview').click();idle(page)
   expect(page.locator('#patch-transform')).to_contain_text('0 pixel modificati fuori maschera')
   page.locator('.patch-image-columns').scroll_into_view_if_needed()
   page.screenshot(path=str(out/'real-import.png'));screen(page,1000)
   report['checks'].append('Actual 1254x1254 ImageGen PNG explicitly mapped into 152x152 crop with two annotated joint landmarks')
   page.locator('#patch-service').fill('image_gen.imagegen')
   page.locator('#patch-provenance').fill('exec-f69dd746-0b98-46ba-a8cd-75ea3749bd97.png; transparent_background=true; original 1254x1254; model/seed not exposed; full log generation-real.json')
   page.locator('#patch-prompt-confirmed').check()
   supplied=['context.png','original-frame.png','references/001.png','previous.png','next.png']
   for name in supplied:page.locator(f'#patch-supplied-files input[value="{name}"]').check()
   page.locator('#patch-apply').click();idle(page);ready(page)
   expect(page.locator('#patch-review-status')).to_contain_text('Da verificare')
   attempt_id=page.locator('#patch-attempt').input_value();attempt=trial/'patches'/attempt_id
   page.screenshot(path=str(out/'real-review.png'));screen(page,1000)
   final=Image.open(attempt/'final-frame.png').convert('RGBA')
   original=Image.open(request_path/'original-frame.png').convert('RGBA')
   mask=Image.open(request_path/'mask-frame.png').convert('L')
   report['pixel_verification']=compare(original,final,mask)
   assert report['pixel_verification']['outside_mask_changed_pixels']==0
   assert report['pixel_verification']['inside_mask_changed_pixels']>0
   assert core.digest(attempt/'generated.png')==candidate_hash
   report['checks'].append('Generated original retained unchanged; full native RGBA comparison confirms zero changes outside hard mask')
   preview=session.cache[max(session.cache)]
   assert preview.transforms==baseline.transforms
   for i in range(1,8):assert preview.aligned[i].tobytes()==baseline.aligned[i].tobytes()
   report['checks'].append('Global body registration identical; the other seven aligned frames remain pixel-identical')
   report['transform']=json.loads((attempt/'transform.json').read_text())
   page.locator('#patch-close').click()
   page.screenshot(path=str(out/'real-editor.png'));screen(page)
   page.locator('#play').click()
   for _ in range(16):page.wait_for_timeout(100);screen(page,100)
   page.locator('#play').click()
   report['checks'].append('Real browser playback captured at native editor timing; not a game-runtime recording')
   assert not report['errors'],report['errors']
   assert all(url.startswith((f'http://127.0.0.1:{server.server_port}/','data:')) for url in report['requests'])
   assert core.digest(base/'source-sheet.png')==source_hash
   report['checks'].append('No external browser requests or JavaScript errors; approved source unchanged')
   browser.close()
 finally:server.shutdown();thread.join()
args.patch_replay=attempt
replayed=run(args)
report['checks'].append('Real candidate replay reproduces final PNG, atlas, GIF and recipe byte for byte')
report.update(attempt_id=attempt_id,replay_folder=replayed.name,status='pending_visual_review',duration_ms=sum(durations),
visual_limits='Two fitted landmarks are not an independent anatomical check; native-scale and game integration acceptance are pending. No approval or promotion.')
shots[0].save(out/'real-browser-demo.gif',save_all=True,append_images=shots[1:],duration=durations,loop=0)
dump(out/'real-browser-report.json',report)
print(json.dumps({'checks':len(report['checks']),'attempt_id':attempt_id,'duration_ms':report['duration_ms'],'status':report['status']}))
