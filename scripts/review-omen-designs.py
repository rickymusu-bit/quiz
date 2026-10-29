"""Capture static design proposals in the real game, using browser-only overrides.

No production source, asset path or animation is replaced. The intercepted race
script and inventory CSS exist only inside this isolated browser review context.
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright, expect
from PIL import Image
import hashlib,json,os,threading,subprocess

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'docs/design/omen-cerbero-v1'
BASELINE=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/'
assets={}
for key in ['cerbero','arsenico']:
 p=OUT/f'{key}-proposta.png';im=Image.open(p)
 assert im.mode=='RGBA'
 bounds=im.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
 assert bounds and 0<bounds[0]<bounds[2]<im.width and 0<bounds[1]<bounds[3]<im.height
 assets[key]={'path':str(p.relative_to(ROOT)),'size':list(im.size),'bounds_alpha_24':list(bounds),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}

source=(ROOT/'assets/hell-race.js').read_text()
marker='  function blendChase(c, pose, x, y, width, height) {'
assert source.count(marker)==1
replacement=marker+'''
    // Static proposal only: this body is injected by the review capture tool.
    const review = root.HellscapeDesignReview;
    if (review?.cerbero?.complete && review.cerbero.naturalWidth) {
      const [sx,sy,sw,sh] = review.bounds;
      const scale = Math.min(width/sw,height/sh), w=sw*scale, h=sh*scale;
      c.drawImage(review.cerbero,sx,sy,sw,sh,x+(width-w)/2,y+height-h,w,h);
      review.draws++;
      return;
    }
'''
review_source=source.replace(marker,replacement)
production_changes=subprocess.check_output(['git','diff','--name-only','HEAD','--','assets','Fool.html','Fool_regole.html','index.html'],cwd=ROOT,text=True).strip()
assert not production_changes, production_changes
report={'baseline':BASELINE,'scope':'static, unapproved design proposals; browser-only rendering overrides','assets':assets,'captures':[],'errors':[],'production_files_modified':False,'renderer_sha256':hashlib.sha256(source.encode()).hexdigest(),'review_renderer_sha256':hashlib.sha256(review_source.encode()).hexdigest()}
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
  for width,height,dpr in [(1440,900,1),(844,390,2)]:
   context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=dpr,reduced_motion='reduce')
   context.route('**/assets/hell-race.js',lambda route:route.fulfill(content_type='text/javascript',body=review_source))
   init='''window.HellscapeDesignReview={cerbero:new Image(),bounds:BOUNDS,draws:0};HellscapeDesignReview.cerbero.src='/docs/design/omen-cerbero-v1/cerbero-proposta.png';'''.replace('BOUNDS',json.dumps([assets['cerbero']['bounds_alpha_24'][0],assets['cerbero']['bounds_alpha_24'][1],assets['cerbero']['bounds_alpha_24'][2]-assets['cerbero']['bounds_alpha_24'][0],assets['cerbero']['bounds_alpha_24'][3]-assets['cerbero']['bounds_alpha_24'][1]]))
   context.add_init_script(init+'Math.random=()=>.25;')
   page=context.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
   page.goto(base+'Fool.html?start=1');page.get_by_role('button',name='Inizia partita',exact=False).click()
   page.wait_for_function('HellscapeDesignReview.draws>0 && FoolAmmo.ready() && FoolEnding.prepare(FoolEnding.load(()=>{}))!==null')
   page.evaluate('document.fonts.ready')
   page.add_style_tag(content='''.ammo-round[data-ammo="arsenico"]{background:transparent url("/docs/design/omen-cerbero-v1/arsenico-proposta.png") center/contain no-repeat!important;border:0!important}.ammo-round[data-ammo="arsenico"]::after{content:none!important}#design-review-label{position:absolute;top:var(--game-gap);left:calc(var(--hud-width) + 2*var(--game-gap));right:calc(var(--game-gap) + 115px);z-index:20;color:#e4c994;background:#140c09e8;border:1px solid #906346;padding:5px 10px;text-align:center;font:16px/1.2 system-ui,sans-serif;pointer-events:none}@media(max-height:500px){#design-review-label{font-size:12px}}''')
   page.evaluate('''()=>{const g=HellscapeUI.game;g.s.groups[g.s.owner].inventory=[{id:g.uid(),type:'arsenico',target:null,origin:'design-review'}];HellscapeUI.changed();const note=document.createElement('div');note.id='design-review-label';note.textContent='PROPOSTA GRAFICA · posa statica · da approvare';document.querySelector("main").append(note);}''')
   page.wait_for_timeout(200)
   before=page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')
   assert page.evaluate('document.querySelector("#viewport-stage").scrollWidth<=document.querySelector("#viewport-stage").clientWidth+1')
   page.screenshot(path=str(OUT/f'contesto-{width}x{height}.png'))
   assert page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')==before
   page.get_by_role('button',name='Inventario',exact=True).click()
   page.locator('#dialog [data-ammo="arsenico"]').click()
   expect(page.locator('#ammo-info h2')).to_have_text('Arsenico')
   image_url=page.locator('#ammo-info .ammo-detail-art').evaluate('e=>getComputedStyle(e).backgroundImage')
   assert 'arsenico-proposta.png' in image_url
   page.screenshot(path=str(OUT/f'arsenico-inventario-{width}x{height}.png'))
   page.locator('#ammo-info').get_by_role('button',name='Chiudi',exact=True).click()
   page.locator('#dialog').get_by_role('button',name='Chiudi',exact=True).click()
   assert page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')==before
   report['captures'].append({'viewport':[width,height],'dpr':dpr,'static_pose_draws':page.evaluate('HellscapeDesignReview.draws'),'engine_unchanged':True,'inventory_preview':True})
   context.close()
  # The normal game continues to use its approved renderer and As placeholder.
  normal=browser.new_page(viewport={'width':844,'height':390},reduced_motion='reduce')
  normal.goto(base+'Fool.html?settings=1');normal.locator('[data-ammo="arsenico"]').click()
  assert normal.evaluate('typeof HellscapeDesignReview')=='undefined'
  assert normal.locator('#ammo-info .ammo-detail-art').evaluate('e=>getComputedStyle(e,"::after").content')=='"As"'
  report['normal_game_placeholder_retained']=True
  browser.close()
finally:server.shutdown()
assert not report['errors'],report['errors']
(OUT/'review-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
