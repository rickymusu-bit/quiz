"""Real inventory/confirmation/Antisigillo gameplay GIF and browser regressions."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
from PIL import Image
from io import BytesIO
import threading, json, os, subprocess, hashlib, sys

ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/'artifacts/antisigillo';ART.mkdir(parents=True,exist_ok=True)
INSPECT='--inspect' in sys.argv
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
report={'revision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'errors':[]}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
    def start(width=1024,height=768,offline=False,reduced=False):
        ctx=browser.new_context(viewport={'width':width,'height':height},offline=offline,reduced_motion='reduce' if reduced else 'no-preference')
        external=[]
        if offline:
            def route(r):
                if r.request.url=='http://anti.test/':r.fulfill(content_type='text/html',body=(ROOT/'dist/Hellscape-offline.html').read_text())
                else:external.append(r.request.url);r.abort()
            ctx.route('**/*',route)
        page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
        if offline:
            page.goto('http://anti.test/');page.frame_locator('iframe').get_by_role('link',name='Nuova partita',exact=True).click();view=page.frames[1]
        else:page.goto(f'http://127.0.0.1:{server.server_port}/Fool.html?start=1');view=page
        view.get_by_role('button',name='Inizia partita',exact=False).click()
        view.wait_for_function('FoolAmmo.ready() && FoolBridge.load()?.complete && FoolEnding.prepare(FoolEnding.load(()=>{}))!==null')
        view.evaluate('document.fonts.ready');page.clock.install();page.clock.pause_at(page.evaluate('Date.now()+1000'))
        setup=view.evaluate('''()=>{const g=HellscapeUI.game,s=g.s,owner=s.owner,target=s.order.find(i=>i!==owner),other=s.order.find(i=>i!==owner&&i!==target);
          s.groups[owner].name='Incisore';s.groups[target].name='Dannato protetto';s.groups[other].name='Testimone';
          s.config.vehicles[owner]='chopper';s.config.vehicles[target]='pickup';s.config.vehicles[other]='ape';
          s.groups[owner].score=Fool.rational(300);s.groups[target].score=Fool.rational(900);s.groups[other].score=Fool.rational(600);
          s.groups[owner].aura=s.turn;s.groups[target].aura=s.turn;s.groups[other].aura=null;
          s.groups[owner].inventory=[{id:g.uid(),type:'antisigillo',target:null,origin:'preview'},{id:g.uid(),type:'aura',target:null,origin:'preview'}];
          s.groups[target].inventory=[{id:g.uid(),type:'karma',target:null,origin:'preview'}];HellscapeUI.changed();
          return {owner,target,other,scores:s.groups.map(p=>Fool.exact(p.score)),lives:s.groups.map((_,i)=>Fool.remainingLives(s,i))}}''')
        page.clock.run_for(1800)
        return ctx,page,view,setup,external
    def info(view):
        view.get_by_role('button',name='Inventario',exact=True).click();view.locator('#dialog [data-ammo="antisigillo"]').click()
        assert 'antisigillo-icon-v1.png' in view.locator('#ammo-info .ammo-detail-art').evaluate('e=>getComputedStyle(e).backgroundImage') or view.locator('#ammo-info .ammo-detail-art').evaluate('e=>getComputedStyle(e).backgroundImage').startswith('url("data:image/png;')
    def select(view,setup):
        view.locator('#ammo-info').get_by_role('button',name='Usa',exact=True).click()
        assert view.locator('#bonus-target option').count()==1
        assert view.locator('#bonus-target').input_value()==str(setup['target'])
    def confirm(view):view.locator('#dialog').get_by_role('button',name='Conferma uso',exact=True).click()
    def verify(view,setup):
        result=view.evaluate('''()=>{const s=HellscapeUI.game.s;return {scores:s.groups.map(g=>Fool.exact(g.score)),lives:s.groups.map((_,i)=>Fool.remainingLives(s,i)),
          auras:s.groups.map(g=>g.aura!==null),inventories:s.groups.map(g=>g.inventory.map(c=>c.type)),
          activations:s.events.filter(e=>e.activation&&e.copy?.type==='antisigillo').length,dispel:s.events.filter(e=>e.type==='seal-dispelled').length,
          reflections:s.events.filter(e=>e.type==='karma-trigger').length}}''')
        assert result['scores']==setup['scores'] and result['lives']==setup['lives']
        assert result['auras'][setup['owner']] and not result['auras'][setup['target']]
        assert result['inventories'][setup['owner']]==['aura'] and result['inventories'][setup['target']]==['karma']
        assert (result['activations'],result['dispel'],result['reflections'])==(1,1,0)
        return result
    ctx,page,view,setup,_=start();info(view)
    if INSPECT:
        page.screenshot(path=str(ART/'icon.png'));select(view,setup);confirm(view)
        for name,delta in [('protected',200),('approach',500),('contact',450),('fracture',500),('clear',800)]:
            page.clock.run_for(delta);page.screenshot(path=str(ART/f'{name}.png'))
        verify(view,setup)
    else:
        frames=[];types=[];stable=None
        for i in range(72):
            if i==12:select(view,setup)
            if i==18:confirm(view)
            page.clock.run_for(round((i+1)*1000/12)-round(i*1000/12))
            ammo=view.locator('.hell-race').get_attribute('data-ammo')
            if ammo and (not types or types[-1]!=ammo):types.append(ammo)
            if i>=18:
                now=view.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')
                if stable is None:stable=now
                assert now==stable,'Animation must not mutate the authoritative game'
            frames.append(Image.open(BytesIO(page.screenshot(scale='css'))).convert('RGB').resize((640,480),Image.Resampling.LANCZOS))
        assert types==['antisigillo'];assert view.locator('.hell-race').get_attribute('data-ammo')==''
        report['effect']=verify(view,setup)
        # Train a global palette on actual inventory and action pixels as well as the scene.
        palette=Image.new('P',(1,1));palette.putpalette(
          frames[34].quantize(colors=128,method=Image.Quantize.MEDIANCUT).getpalette()[:384]+
          frames[4].crop((140,80,500,400)).quantize(colors=64,method=Image.Quantize.MEDIANCUT).getpalette()[:192]+
          frames[34].crop((220,100,440,310)).quantize(colors=64,method=Image.Quantize.MEDIANCUT).getpalette()[:192])
        encoded=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
        durations=[(round((i+1)*100/12)-round(i*100/12))*10 for i in range(72)]
        file=ART/'antisigillo-gameplay.gif';encoded[0].save(file,save_all=True,append_images=encoded[1:],duration=durations,loop=0,disposal=1,optimize=False)
        gif=Image.open(file);duration=0
        for i in range(gif.n_frames):gif.seek(i);duration+=gif.info.get('duration',0)
        assert gif.n_frames==72 and duration==6000
        report.update({'viewport':[1024,768],'gif_pixels':[640,480],'frames':72,'duration_ms':6000,'capture_fps':12,'palette_colors':256,
          'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'engine_unchanged_during_animation':True})
        # The running question timer pauses with the shot and resumes only afterwards.
        c2,q,v,fixture,_=start(390,844);v.get_by_role('button',name='Svela e avvia il tempo',exact=True).click()
        v.locator('body').press('i');v.locator('#dialog [data-ammo="antisigillo"]').click();select(v,fixture);confirm(v)
        q.clock.run_for(250);assert not v.evaluate('HellscapeUI.game.running');left=v.evaluate('HellscapeUI.game.left()')
        q.keyboard.press('p');q.clock.run_for(100);frozen=v.locator('.hell-race canvas').evaluate('c=>c.toDataURL()')
        q.clock.run_for(500);assert v.locator('.hell-race canvas').evaluate('c=>c.toDataURL()')==frozen
        assert v.evaluate('HellscapeUI.game.left()')==left
        q.keyboard.press('p');q.clock.run_for(3000);assert v.evaluate('HellscapeUI.game.running');verify(v,fixture)
        v.evaluate('HellscapeUI.changed()');q.clock.run_for(100);assert v.locator('.hell-race').get_attribute('data-ammo')==''
        report['pause_timer_resume_no_replay']='PASS';c2.close()
        c3,q,v,fixture,external=start(390,844,offline=True,reduced=True);info(v);select(v,fixture);confirm(v)
        q.clock.run_for(100);frozen=v.locator('.hell-race canvas').evaluate('c=>c.toDataURL()');q.clock.run_for(150)
        assert v.locator('.hell-race canvas').evaluate('c=>c.toDataURL()')==frozen
        q.screenshot(path=str(ART/'mobile-reduced.png'));q.clock.run_for(350)
        assert v.locator('.hell-race').get_attribute('data-ammo')=='';verify(v,fixture)
        assert not external,external;report['offline_external_requests']=external;report['mobile_reduced_motion']='PASS';c3.close()
    assert not report['errors'],report['errors'];ctx.close();browser.close()
server.shutdown()
if not INSPECT:(ART/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS: '+('real Antisigillo inspection' if INSPECT else 'real Antisigillo GIF, one valid target, no damage/reflection, pause/timer, offline and reduced motion'))
