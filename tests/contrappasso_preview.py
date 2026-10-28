"""Real UI capture and browser checks for manual Contrappasso, scoring and expiry."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
from PIL import Image
from io import BytesIO
import threading, subprocess, json, hashlib, sys
ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/'artifacts/contrappasso';ART.mkdir(parents=True,exist_ok=True)
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
                if r.request.url=='http://contrappasso.test/':r.fulfill(content_type='text/html',body=(ROOT/'dist/Hellscape-offline.html').read_text())
                else:external.append(r.request.url);r.abort()
            ctx.route('**/*',route)
        q=ctx.new_page();q.clock.install();q.on('pageerror',lambda e:report['errors'].append(str(e)))
        if offline:
            q.goto('http://contrappasso.test/');q.frame_locator('iframe').get_by_role('link',name='Nuova partita',exact=True).click();v=q.frames[1]
        else:q.goto(f'http://127.0.0.1:{server.server_port}/Fool.html?start=1');v=q
        v.get_by_role('button',name='Inizia partita',exact=False).click();v.wait_for_function('FoolAmmo.ready() && FoolBridge.load()?.complete && FoolEnding.prepare(FoolEnding.load(()=>{}))!==null')
        v.evaluate('document.fonts.ready');q.clock.pause_at(q.evaluate('Date.now()+1000'))
        f=v.evaluate('''()=>{const g=HellscapeUI.game,s=g.s,[source,second,third]=s.order,names=[];names[source]='Aster';names[second]='Moro';names[third]='Vespro';
          s.config.names=names;s.config.bases={facile:100,media:100,difficile:100};s.config.bonusWeights=Object.fromEntries(Fool.TYPES.map(t=>[t,['aura','antisigillo'].includes(t)?100:0]));
          s.groups.forEach((p,i)=>{p.name=names[i];p.score=Fool.rational(500);p.inventory=[];});
          s.groups[source].inventory=[{id:g.uid(),type:'karma',target:null,origin:'preview'}];
          for(const question of [...s.bank,...s.queue,s.current]){question.body='Quanto vale 2 + 2?';question.options=['3','4','5','6'];question.correct=1;question.explanation='Due più due fa quattro.';}
          s.config.vehicles[source]='chopper';s.config.vehicles[second]='pickup';s.config.vehicles[third]='ape';HellscapeUI.changed();return {source,second,third};}''')
        q.clock.run_for(1800);return ctx,q,v,f,external
    def card(v,type):v.get_by_role('button',name='Inventario',exact=True).click();v.locator(f'#dialog [data-ammo="{type}"]').first.click()
    def close(v):v.locator('#ammo-info').get_by_role('button',name='Chiudi',exact=True).click();v.locator('#dialog').get_by_role('button',name='Chiudi',exact=True).click()
    def activate(v):v.locator('#ammo-info').get_by_role('button',name='Usa',exact=True).click();assert v.locator('#bonus-target').count()==0;v.locator('#dialog').get_by_role('button',name='Conferma uso',exact=True).click()
    def answer(v,right=False):
        v.get_by_role('button',name='Svela e avvia il tempo',exact=True).click();i=v.evaluate('HellscapeUI.game.s.current.correct');v.locator('.answer').nth(i if right else (i+1)%4).click()
    def next(v):v.get_by_role('button',name='Prossima domanda',exact=True).click()
    def state(v):return v.evaluate('''()=>{const g=HellscapeUI.game,s=g.s;return {owner:s.owner,turn:s.turn,screen:s.screen,contrappasso:s.groups.map(p=>p.contrappasso),auras:s.groups.map(p=>p.aura),
      scores:s.groups.map(p=>Fool.exact(p.score)),lives:s.groups.map((_,i)=>Fool.remainingLives(s,i)),inventory:s.groups.map(p=>p.inventory.map(c=>c.type)),result:s.result};}''')
    if not CHECKS_ONLY:
        ctx,q,v,f,_=start();card(v,'karma');frames=[]
        for i in range(104):
            if i==8:activate(v)
            if i==24:answer(v,True)
            if i==44:
                a=state(v);assert a['scores'][f['source']]=='700' and a['inventory'][f['source']]==['aura','antisigillo'] and a['result']['multiplier']==2;report['correct']=a
                assert 'Contrappasso ×2' in v.locator('.solution').inner_text();next(v);answer(v)
            if i==60:next(v);answer(v)
            if i==76:
                next(v);assert v.evaluate('HellscapeUI.game.s.owner')==f['source'];assert v.evaluate('HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].contrappasso')==2;answer(v)
            q.clock.run_for(125);frames.append(Image.open(BytesIO(q.screenshot())).convert('RGB').resize((640,480),Image.Resampling.LANCZOS))
        a=state(v);assert a['scores']==['500','500','500'] and a['result']['penalty']['n']=='200' and a['result']['penaltyCause']=='Contrappasso'
        assert a['lives']==[3,3,3] and a['inventory'][f['source']]==['aura','antisigillo'];report['wrong']=a
        assert 'Contrappasso: −200' in v.locator('.solution').inner_text()
        palette=Image.new('P',(1,1));palette.putpalette(frames[16].quantize(colors=128,method=Image.Quantize.MEDIANCUT).getpalette()[:384]+frames[4].crop((140,60,500,420)).quantize(colors=64,method=Image.Quantize.MEDIANCUT).getpalette()[:192]+frames[100].crop((120,40,520,270)).quantize(colors=64,method=Image.Quantize.MEDIANCUT).getpalette()[:192])
        encoded=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames];file=ART/'contrappasso-gameplay.gif';durations=[(round((i+1)*100/8)-round(i*100/8))*10 for i in range(104)]
        encoded[0].save(file,save_all=True,append_images=encoded[1:],duration=durations,loop=0,disposal=1,optimize=False)
        im=Image.open(file);assert im.n_frames==104;total=0
        for j in range(im.n_frames):im.seek(j);total+=im.info['duration']
        assert total==13000;report.update({'viewport':[1024,768],'gif_pixels':[640,480],'duration_ms':13000,'capture_fps':8,'frames':104,'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()});ctx.close()
    for width,height,offline,reduced in [(667,375,False,False),(844,390,False,False),(667,375,True,True)]:
        ctx,q,v,f,external=start(width,height,offline,reduced)
        v.evaluate('''()=>{const g=HellscapeUI.game,s=g.s;for(const type of ['karma','aura'])s.groups[s.owner].inventory.push({id:g.uid(),type,target:null,origin:'fixture'});}''')
        if offline:v.evaluate('HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].score=Fool.rational(50)')
        card(v,'karma');activate(v);q.clock.run_for(2100);card(v,'karma');assert v.locator('#ammo-info').get_by_role('button',name='Usa',exact=True).is_disabled()
        q.screenshot(path=str(ART/f'no-stack-{width}-{offline}.png'));close(v);card(v,'aura');activate(v);q.clock.run_for(2100)
        v.get_by_role('button',name='Svela e avvia il tempo',exact=True).click();assert '−200' in v.locator('.question-risk').inner_text()
        if offline:
            q.keyboard.press('p');q.clock.run_for(100);left=v.evaluate('HellscapeUI.game.left()');v.evaluate('HellscapeUI.restoreGame(JSON.stringify(HellscapeUI.game.snapshot()))');q.clock.run_for(100)
            assert not v.evaluate('HellscapeUI.game.running') and v.evaluate('HellscapeUI.game.left()')==left;q.keyboard.press('p');q.clock.run_for(int(left)+200)
        else:v.locator('.answer').nth(2).click()
        q.clock.run_for(2100);a=state(v);assert a['scores'][f['source']]==('0' if offline else '300') and a['lives']==[3,3,3]
        assert a['result']['penaltyCause']=='Contrappasso' and not a['result']['penaltyBlocked'];q.clock.run_for(10000);q.screenshot(path=str(ART/f'own-risk-{width}-{offline}.png'),full_page=True)
        next(v)
        for _ in range(2):answer(v);q.clock.run_for(1900);next(v)
        for remaining in [2,1]:
            assert v.evaluate('HellscapeUI.game.s.owner')==f['source'];assert v.evaluate('HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].contrappasso')==remaining
            v.evaluate('HellscapeUI.restoreGame(JSON.stringify(HellscapeUI.game.snapshot()))');assert v.evaluate('HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].contrappasso')==remaining
            assert v.evaluate('HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].aura')==remaining
            answer(v,True);q.clock.run_for(1900);a=state(v);assert a['result']['multiplier']==2 and a['result']['ammoSuppressed'] and a['inventory'][f['source']]==['karma'];next(v)
            for _ in range(2):answer(v);q.clock.run_for(1900);next(v)
        assert v.evaluate('HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].contrappasso') is None
        assert v.evaluate('HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].aura') is None
        answer(v,True);q.clock.run_for(1900);a=state(v);assert a['result']['multiplier']==1 and a['inventory'][f['source']]==['karma','aura','antisigillo']
        assert a['scores'][f['source']]==('500' if offline else '800');v.evaluate('Fool.Game.restore(HellscapeUI.game.snapshot())')
        q.clock.run_for(10000);q.screenshot(path=str(ART/f'expired-{width}-{offline}.png'),full_page=True);assert v.evaluate('document.documentElement.scrollWidth<=innerWidth') and not external
        report['checks'].append({'viewport':[width,height],'offline':offline,'reduced':reduced,'manual_no_stack':'PASS','own_risk_through_sigillo':'PASS','zero_floor_timeout':'PASS','countdown_restore_3_2_1':'PASS','expiry_normal_points_and_ammo':'PASS'});ctx.close()
    assert not report['errors'],report['errors'];browser.close()
server.shutdown();(ART/('checks.json' if CHECKS_ONLY else 'report.json')).write_text(json.dumps(report,indent=2)+'\n')
print('PASS: Contrappasso manual use, doubled points/penalty, no stacking, Sigillo own risk, expiry/restore, mobile/offline')
