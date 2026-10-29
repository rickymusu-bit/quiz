"""Real Sigillo UI capture and expiry/exception checks, including offline play."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
from PIL import Image
from io import BytesIO
import threading, subprocess, json, hashlib, sys
ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/'artifacts/sigillo';ART.mkdir(parents=True,exist_ok=True)
CHECKS_ONLY='--checks-only' in sys.argv
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
report={'revision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'errors':[],'checks':[]}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    def start(width=1024,height=768,offline=False,reduced=False):
        ctx=browser.new_context(viewport={'width':width,'height':height},offline=offline,reduced_motion='reduce' if reduced else 'no-preference');external=[]
        if offline:
            def route(r):
                if r.request.url=='http://sigillo.test/':r.fulfill(content_type='text/html',body=(ROOT/'dist/Hellscape-offline.html').read_text())
                else:external.append(r.request.url);r.abort()
            ctx.route('**/*',route)
        q=ctx.new_page();q.clock.install();q.on('pageerror',lambda e:report['errors'].append(str(e)))
        if offline:
            q.goto('http://sigillo.test/');q.frame_locator('iframe').get_by_role('link',name='Nuova partita',exact=True).click();v=q.frames[1]
        else:q.goto(f'http://127.0.0.1:{server.server_port}/Fool.html?start=1');v=q
        v.get_by_role('button',name='Inizia partita',exact=False).click();v.wait_for_function('FoolAmmo.ready() && FoolBridge.load()?.complete && FoolEnding.prepare(FoolEnding.load(()=>{}))!==null')
        v.evaluate('document.fonts.ready');q.clock.pause_at(q.evaluate('Date.now()+1000'))
        f=v.evaluate('''()=>{const g=HellscapeUI.game,s=g.s,[source,second,third]=s.order,names=[];names[source]='Aster';names[second]='Moro';names[third]='Vespro';
          s.config.names=names;s.config.bases={facile:100,media:100,difficile:100};s.config.bonusWeights=Object.fromEntries(Fool.TYPES.map(t=>[t,['aura','antisigillo'].includes(t)?100:0]));
          s.groups.forEach((p,i)=>{p.name=names[i];p.score=Fool.rational(1000);p.inventory=[];});
          for(const [i,types] of [[source,['aura','sacrificio']],[second,['ruba']],[third,['antisigillo']]])
            s.groups[i].inventory=types.map(type=>({id:g.uid(),type,target:null,origin:'preview'}));
          for(const question of [...s.bank,...s.queue,s.current]){question.body='Quanto vale 2 + 2?';question.options=['3','4','5','6'];question.correct=1;question.explanation='Due più due fa quattro.';}
          s.config.vehicles[source]='chopper';s.config.vehicles[second]='pickup';s.config.vehicles[third]='ape';HellscapeUI.changed();return {source,second,third};}''')
        q.clock.run_for(1800);return ctx,q,v,f,external
    def card(v,type):v.get_by_role('button',name='Inventario',exact=True).click();v.locator(f'#dialog [data-ammo="{type}"]').first.click()
    def close(v):v.locator('#ammo-info').get_by_role('button',name='Chiudi',exact=True).click();v.locator('#dialog').get_by_role('button',name='Chiudi',exact=True).click()
    def activate(v,target=None):
        v.locator('#ammo-info').get_by_role('button',name='Usa',exact=True).click()
        if target is not None:v.locator('#bonus-target').select_option(str(target))
        v.locator('#dialog').get_by_role('button',name='Conferma uso',exact=True).click()
    def answer(v,right=False):
        v.get_by_role('button',name='Svela e avvia il tempo',exact=True).click();i=v.evaluate('HellscapeUI.game.s.current.correct');v.locator('.answer').nth(i if right else (i+1)%4).click()
    def next(v):v.get_by_role('button',name='Prossima domanda',exact=True).click()
    def state(v):return v.evaluate('''()=>{const g=HellscapeUI.game,s=g.s;return {owner:s.owner,turn:s.turn,screen:s.screen,auras:s.groups.map(p=>p.aura),scores:s.groups.map(p=>Fool.exact(p.score)),
      lives:s.groups.map((_,i)=>Fool.remainingLives(s,i)),inventory:s.groups.map(p=>p.inventory.map(c=>c.type)),result:s.result};}''')
    if not CHECKS_ONLY:
        ctx,q,v,f,_=start();card(v,'aura');frames=[]
        for i in range(136):
            if i==8:activate(v)
            if i==24:
                card(v,'sacrificio');assert v.locator('#ammo-info').get_by_role('button',name='Usa',exact=True).is_disabled()
            if i==28:close(v);answer(v,True)
            if i==44:
                a=state(v);assert a['scores'][f['source']]=='1100' and a['result']['ammoSuppressed'] and a['inventory'][f['source']]==['sacrificio'];report['protected_correct']=a
                assert 'nessuna Ammo' in v.locator('.solution').inner_text();next(v);card(v,'ruba')
            if i==48:activate(v,f['source'])
            if i==64:
                a=state(v);assert a['scores'][f['source']]=='1100' and a['auras'][f['source']]==3 and a['owner']==f['third'];report['blocked_tribute']=a;card(v,'antisigillo')
            if i==68:activate(v,f['source'])
            if i==92:
                assert v.evaluate('HellscapeUI.game.s.groups[HellscapeUI.game.s.order[0]].aura') is None;answer(v)
            if i==108:
                next(v);assert v.evaluate('HellscapeUI.game.s.owner')==f['source'];card(v,'sacrificio');assert v.locator('#ammo-info').get_by_role('button',name='Usa',exact=True).is_enabled()
            if i==112:close(v);answer(v,True)
            q.clock.run_for(125);frames.append(Image.open(BytesIO(q.screenshot())).convert('RGB').resize((640,480),Image.Resampling.LANCZOS))
        a=state(v);assert a['scores'][f['source']]=='1200' and a['auras'][f['source']] is None and a['inventory'][f['source']]==['sacrificio','aura','antisigillo'];report['after_antisigillo']=a
        palette=Image.new('P',(1,1));palette.putpalette(frames[16].quantize(colors=128,method=Image.Quantize.MEDIANCUT).getpalette()[:384]+frames[4].crop((140,60,500,420)).quantize(colors=64,method=Image.Quantize.MEDIANCUT).getpalette()[:192]+frames[130].crop((120,40,520,270)).quantize(colors=64,method=Image.Quantize.MEDIANCUT).getpalette()[:192])
        encoded=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames];file=ART/'sigillo-gameplay.gif';durations=[(round((i+1)*100/8)-round(i*100/8))*10 for i in range(136)]
        encoded[0].save(file,save_all=True,append_images=encoded[1:],duration=durations,loop=0,disposal=1,optimize=False)
        im=Image.open(file);assert im.n_frames==136;total=0
        for j in range(im.n_frames):im.seek(j);total+=im.info['duration']
        assert total==17000;report.update({'viewport':[1024,768],'gif_pixels':[640,480],'duration_ms':17000,'capture_fps':8,'frames':136,'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()});ctx.close()
    for width,height,offline,reduced in [(390,844,False,False),(844,390,False,False),(390,844,True,True)]:
        ctx,q,v,f,external=start(width,height,offline,reduced);card(v,'aura');activate(v);q.clock.run_for(2100)
        assert v.locator(f'.turn-order [data-team="{f["source"]}"]').get_by_text('Sigillo: 3 turni',exact=True).count()==1
        card(v,'sacrificio');assert v.locator('#ammo-info').get_by_role('button',name='Usa',exact=True).is_disabled();q.screenshot(path=str(ART/f'locked-{width}-{offline}.png'));close(v)
        answer(v);q.clock.run_for(1900);next(v)
        # A genuine opponent Flagello must bypass the shield; add its copy only to the controlled test fixture.
        v.evaluate('''()=>{const g=HellscapeUI.game;g.s.groups[g.s.owner].inventory.push({id:g.uid(),type:'ira',target:null,origin:'fixture'});HellscapeUI.changed();}''')
        card(v,'ira');activate(v);q.clock.run_for(3600);a=state(v)
        assert a['auras'][f['source']]==3 and a['scores'][f['source']]=='334' and a['lives'][f['source']]==2 and a['inventory'][f['source']]==[]
        q.screenshot(path=str(ART/f'flagello-{width}-{offline}.png'));answer(v);q.clock.run_for(1900);next(v);answer(v);q.clock.run_for(1900);next(v)
        # The second and third personal turns stay protected across a real UI restore.
        for remaining in [2,1]:
            assert v.evaluate('HellscapeUI.game.s.owner')==f['source'];assert v.evaluate('HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].aura')==remaining
            v.evaluate('HellscapeUI.restoreGame(JSON.stringify(HellscapeUI.game.snapshot()))');assert v.evaluate('HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].aura')==remaining
            answer(v,True);q.clock.run_for(1900);assert v.evaluate('HellscapeUI.game.s.result.ammoSuppressed');assert not v.evaluate('HellscapeUI.game.s.result.bonuses');next(v)
            for _ in range(2):answer(v);q.clock.run_for(1900);next(v)
        assert v.evaluate('HellscapeUI.game.s.owner')==f['source'] and v.evaluate('HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].aura') is None
        answer(v,True);q.clock.run_for(1900);a=state(v);assert not a['result']['ammoSuppressed'] and a['inventory'][f['source']]==['aura','antisigillo']
        v.evaluate('Fool.Game.restore(HellscapeUI.game.snapshot())');q.clock.run_for(10000);q.screenshot(path=str(ART/f'expired-{width}-{offline}.png'),full_page=True)
        assert v.evaluate('document.documentElement.scrollWidth<=innerWidth') and not external
        report['checks'].append({'viewport':[width,height],'offline':offline,'reduced':reduced,'use_locked':'PASS','no_awards':'PASS','flagello_exception':'PASS','countdown_3_2_1_restore':'PASS','expiry_restores_awards':'PASS'});ctx.close()
    assert not report['errors'],report['errors'];browser.close()
server.shutdown();(ART/('checks.json' if CHECKS_ONLY else 'report.json')).write_text(json.dumps(report,indent=2)+'\n')
print('PASS: Sigillo real UI, blocked use/awards, Flagello exception, three personal turns and restore/expiry, mobile and offline')
