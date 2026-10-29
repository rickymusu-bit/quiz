"""Capture real Malocchio UI: private peek, passed penalty, author-based rotation and rewards."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
from PIL import Image
from io import BytesIO
import threading, subprocess, json, hashlib, sys
ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/'artifacts/malocchio';ART.mkdir(parents=True,exist_ok=True)
CHECKS_ONLY='--checks-only' in sys.argv
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
report={'revision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'errors':[],'checks':[]}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    def start(width=1024,height=768,reduced=False,offline=False):
        ctx=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce' if reduced else 'no-preference',offline=offline)
        external=[]
        if offline:
            def route(r):
                if r.request.url=='http://malocchio.test/':r.fulfill(content_type='text/html',body=(ROOT/'dist/Hellscape-offline.html').read_text())
                else:external.append(r.request.url);r.abort()
            ctx.route('**/*',route)
        q=ctx.new_page();q.clock.install();q.on('pageerror',lambda e:report['errors'].append(str(e)))
        if offline:
            q.goto('http://malocchio.test/');q.frame_locator('iframe').get_by_role('link',name='Nuova partita',exact=True).click();v=q.frames[1]
        else:q.goto(f'http://127.0.0.1:{server.server_port}/Fool.html?start=1');v=q
        v.get_by_role('button',name='Inizia partita',exact=False).click();v.wait_for_function('FoolAmmo.ready() && FoolBridge.load()?.complete && FoolEnding.prepare(FoolEnding.load(()=>{}))!==null')
        v.evaluate('document.fonts.ready');q.clock.pause_at(q.evaluate('Date.now()+1000'))
        fixture=v.evaluate('''()=>{const g=HellscapeUI.game,s=g.s,[source,next,target]=s.order;const names=[];names[source]='Aster';names[next]='Moro';names[target]='Vespro';
          s.config.names=names;s.config.bases={facile:100,media:100,difficile:100};s.config.bonusWeights=Object.fromEntries(Fool.TYPES.map(t=>[t,['aura','antisigillo'].includes(t)?100:0]));
          for(const p of s.groups){p.score=Fool.rational(500);p.name=names[s.groups.indexOf(p)];p.inventory=[];}
          for(const i of [source,next])s.groups[i].inventory=[{id:g.uid(),type:'svela',target:null,origin:'preview'}];
          for(const question of [...s.bank,...s.queue,s.current]){question.body='Quanto vale 2 + 2?';question.options=['3','4','5','6'];question.correct=1;question.explanation='Due più due fa quattro.';}
          s.config.vehicles[source]='chopper';s.config.vehicles[next]='pickup';s.config.vehicles[target]='ape';HellscapeUI.changed();return {source,next,target};}''')
        q.clock.run_for(1800);return ctx,q,v,fixture,external
    def card(v):v.get_by_role('button',name='Inventario',exact=True).click();v.locator('#dialog [data-ammo="svela"]').first.click()
    def activate(v):
        v.locator('#ammo-info').get_by_role('button',name='Usa',exact=True).click();v.locator('#dialog').get_by_role('button',name='Conferma uso',exact=True).click()
    def peek_check(v):
        assert v.locator('.answers,.answer').count()==0 and v.locator('.question').count()==1
        assert not v.evaluate('HellscapeUI.game.running')
        a=v.locator('.operation-body').aria_snapshot();assert 'Quanto vale' in a
        for option in ['3','4','5','6']:assert f'button "{option}"' not in a
    def answer(v,correct):
        i=v.evaluate('HellscapeUI.game.s.current.correct');v.locator('.answer').nth(i if correct else (i+1)%4).click()
    def snapshot(v):return v.evaluate('''()=>{const g=HellscapeUI.game,s=g.s;return {owner:s.owner,respondent:s.respondent,turn:s.turn,screen:s.screen,valid:s.valid,
      scores:s.groups.map(p=>Fool.exact(p.score)),lives:s.groups.map((_,i)=>Fool.remainingLives(s,i)),ammo:s.groups.map(p=>p.inventory.map(c=>c.type)),
      result:s.result,malocchio:s.malocchio,running:g.running};}''')
    if not CHECKS_ONLY:
        ctx,q,v,f,_=start();card(v);frames=[]
        for i in range(128):
            if i==8:activate(v)
            if i==24:peek_check(v)
            if i==32:v.get_by_role('button',name='Passa a Vespro',exact=True).click()
            if i==44:answer(v,False)
            if i==60:
                a=snapshot(v);assert a['scores'][f['target']]=='400' and a['scores'][f['source']]=='500';report['passed_error']=a
                assert '−100' in v.locator('.solution').inner_text();v.get_by_role('button',name='Prossima domanda',exact=True).click()
                assert v.evaluate('HellscapeUI.game.s.owner')==f['next']
            if i==64:card(v)
            if i==72:activate(v)
            if i==88:peek_check(v)
            if i==96:v.get_by_role('button',name='Tieni la domanda',exact=True).click()
            if i==100:answer(v,True)
            q.clock.run_for(125)
            frames.append(Image.open(BytesIO(q.screenshot())).convert('RGB').resize((640,480),Image.Resampling.LANCZOS))
        a=snapshot(v);assert a['scores'][f['next']]=='600' and a['scores'][f['target']]=='400' and a['scores'][f['source']]=='500'
        assert a['ammo'][f['next']]==['aura','antisigillo'] and a['result']['respondent']==f['next']
        assert a['lives']==[3,3,3];report['correct_rewards']=a
        palette=Image.new('P',(1,1));palette.putpalette(frames[16].quantize(colors=128,method=Image.Quantize.MEDIANCUT).getpalette()[:384]+frames[4].crop((140,70,500,410)).quantize(colors=64,method=Image.Quantize.MEDIANCUT).getpalette()[:192]+frames[120].crop((120,40,520,220)).quantize(colors=64,method=Image.Quantize.MEDIANCUT).getpalette()[:192])
        encoded=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames];file=ART/'malocchio-gameplay.gif';durations=[(round((i+1)*100/8)-round(i*100/8))*10 for i in range(128)]
        encoded[0].save(file,save_all=True,append_images=encoded[1:],duration=durations,loop=0,disposal=1,optimize=False)
        im=Image.open(file);assert im.n_frames==128;total=0
        for j in range(im.n_frames):im.seek(j);total+=im.info['duration']
        assert total==16000
        report.update({'viewport':[1024,768],'gif_pixels':[640,480],'duration_ms':16000,'capture_fps':8,'frames':128,'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()});ctx.close()
    for width,height,offline,reduced,correct in [(390,844,False,False,False),(844,390,False,False,True),(390,844,True,True,False)]:
        ctx,q,v,f,external=start(width,height,reduced,offline);v.evaluate('HellscapeUI.game.s.groups[HellscapeUI.game.s.order[2]].score=Fool.rational(50)');card(v);activate(v);q.clock.run_for(2100);peek_check(v)
        held=v.evaluate('HellscapeUI.game.left()');q.keyboard.press('a');q.keyboard.press('Enter');q.clock.run_for(250);assert v.evaluate('HellscapeUI.game.s.screen')=='choice' and v.evaluate('HellscapeUI.game.left()')==held
        q.screenshot(path=str(ART/f'peek-{width}-{offline}.png'));v.get_by_role('button',name='Passa a Vespro',exact=True).click();q.clock.run_for(100)
        assert v.locator('.answer').count()==4 and v.evaluate('HellscapeUI.game.running');assert 'minimo zero' in v.locator('.malocchio-risk').inner_text()
        # Restore through the actual UI. No replay and no automatic timer restart.
        q.keyboard.press('p');q.clock.run_for(100);left=v.evaluate('HellscapeUI.game.left()');v.evaluate('HellscapeUI.restoreGame(JSON.stringify(HellscapeUI.game.snapshot()))');q.clock.run_for(100)
        assert v.evaluate('HellscapeUI.game.s.malocchio.source')==f['source'] and v.evaluate('HellscapeUI.game.s.respondent')==f['target']
        assert not v.evaluate('HellscapeUI.game.running') and v.evaluate('HellscapeUI.game.left()')==left
        q.keyboard.press('p');assert v.evaluate('HellscapeUI.game.running')
        if offline:q.clock.run_for(int(left)+100)
        else:answer(v,correct)
        q.clock.run_for(2200);a=snapshot(v)
        assert a['scores'][f['target']]==('150' if correct else '0') and a['scores'][f['source']]=='500' and a['lives']==[3,3,3], {'case':[width,height,offline,reduced,correct],'fixture':f,'actual':a}
        assert a['ammo'][f['target']]==(['aura','antisigillo'] if correct else [])
        if not correct:assert '−50' in v.locator('.solution').inner_text()
        q.clock.run_for(10000);q.screenshot(path=str(ART/f'result-{width}-{offline}.png'),full_page=True);v.get_by_role('button',name='Prossima domanda',exact=True).click()
        assert v.evaluate('HellscapeUI.game.s.owner')==f['next'] and v.evaluate('HellscapeUI.game.s.malocchio') is None
        v.evaluate('Fool.Game.restore(HellscapeUI.game.snapshot())');assert v.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert not external;report['checks'].append({'viewport':[width,height],'offline':offline,'reduced':reduced,'correct':correct,'hidden_alternatives':'PASS','zero_floor':'PASS','retained_rewards':'PASS','author_rotation':'PASS','restore_timer_no_replay':'PASS'});ctx.close()
    assert not report['errors'],report['errors'];browser.close()
server.shutdown()
(ART/('checks.json' if CHECKS_ONLY else 'report.json')).write_text(json.dumps(report,indent=2)+'\n')
print('PASS: Malocchio private peek, passed error, zero floor, retained points/Ammo, author rotation, timer/restore, mobile and offline')
