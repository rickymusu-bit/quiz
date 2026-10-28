"""Real UI capture of Sacrificio and immediate Tributo, plus browser regressions."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
from PIL import Image
from io import BytesIO
import threading, subprocess, json, hashlib
ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/'artifacts/ammo-rules';ART.mkdir(parents=True,exist_ok=True)
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
                if r.request.url=='http://ammo.test/':r.fulfill(content_type='text/html',body=(ROOT/'dist/Hellscape-offline.html').read_text())
                else:external.append(r.request.url);r.abort()
            ctx.route('**/*',route)
        q=ctx.new_page();q.on('pageerror',lambda e:report['errors'].append(str(e)))
        if offline:
            q.goto('http://ammo.test/');q.frame_locator('iframe').get_by_role('link',name='Nuova partita',exact=True).click();v=q.frames[1]
        else:q.goto(f'http://127.0.0.1:{server.server_port}/Fool.html?start=1');v=q
        v.get_by_role('button',name='Inizia partita',exact=False).click();v.wait_for_function('FoolAmmo.ready() && FoolBridge.load()?.complete && FoolEnding.prepare(FoolEnding.load(()=>{}))!==null')
        v.evaluate('document.fonts.ready');q.clock.install();q.clock.pause_at(q.evaluate('Date.now()+1000'))
        fixture=v.evaluate('''()=>{const g=HellscapeUI.game,s=g.s,[owner,target,other]=s.order;
          const names=['Aster','Moro','Vespro'];for(let i=0;i<3;i++){s.groups[i].name=names[i];s.config.names[i]=names[i];s.groups[i].score=Fool.rational(1000);}
          s.config.vehicles[owner]='chopper';s.config.vehicles[target]='pickup';s.config.vehicles[other]='ape';
          s.groups[owner].inventory=['sacrificio','ruba'].map(type=>({id:g.uid(),type,target:null,origin:'preview'}));
          s.groups[target].inventory=[{id:g.uid(),type:'karma',target:null,origin:'preview'}];HellscapeUI.changed();return {owner,target,other,current:s.current.id};}''')
        q.clock.run_for(1800);return ctx,q,v,fixture,external
    def card(v,type):
        v.get_by_role('button',name='Inventario',exact=True).click();v.locator(f'#dialog [data-ammo="{type}"]').first.click()
    def select(v,target=None):
        v.locator('#ammo-info').get_by_role('button',name='Usa',exact=True).click()
        if target is not None:v.locator('#bonus-target').select_option(str(target))
    def confirm(v):v.locator('#dialog').get_by_role('button',name='Conferma uso',exact=True).click()
    def state(v):return v.evaluate('''()=>{const g=HellscapeUI.game,s=g.s;return {owner:s.owner,turn:s.turn,screen:s.screen,valid:s.valid,
        scores:s.groups.map(p=>Fool.exact(p.score)),lives:s.groups.map((_,i)=>Fool.remainingLives(s,i)),out:s.groups.map(p=>p.out),
        inventory:s.groups.map(p=>p.inventory.map(c=>({type:c.type,target:c.target}))),effects:s.effects,current:s.current.id,cancelled:s.cancelled,running:g.running,phase:s.phase};}''')
    ctx,q,v,f,_=start();card(v,'sacrificio');frames=[];baseline=None;types=[]
    for i in range(144):
        if i==12:select(v)
        if i==18:confirm(v)
        if i==60:
            a=state(v);assert a['scores'][f['owner']]=='1777' and a['lives'][f['owner']]==2 and a['owner']==f['owner'];report['after_sacrifice']=a
            card(v,'ruba')
        if i==72:select(v,f['target'])
        if i==78:confirm(v)
        q.clock.run_for(round((i+1)*1000/12)-round(i*1000/12))
        ammo=v.locator('.hell-race').get_attribute('data-ammo')
        if ammo and (not types or types[-1]!=ammo):types.append(ammo)
        if i in (18,78):baseline=v.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')
        elif 18<i<60 or i>78:assert baseline==v.evaluate('JSON.stringify(HellscapeUI.game.snapshot())'),'Rendering changed game state'
        frames.append(Image.open(BytesIO(q.screenshot())).convert('RGB').resize((640,480),Image.Resampling.LANCZOS))
    final=state(v);assert types==['sacrificio','ruba'];assert final['scores'][f['owner']]=='2107' and final['scores'][f['target']]=='670'
    assert final['lives']==report['after_sacrifice']['lives'] and final['owner']==f['target'] and final['valid']==0 and final['turn']==2
    assert final['current']==f['current'] and not final['effects'] and not final['inventory'][f['owner']]
    assert final['inventory'][f['target']]==[{'type':'karma','target':None}];report['after_tribute']=final
    palette=Image.new('P',(1,1));palette.putpalette(frames[32].quantize(colors=128,method=Image.Quantize.MEDIANCUT).getpalette()[:384]+frames[5].crop((150,70,490,390)).quantize(colors=64,method=Image.Quantize.MEDIANCUT).getpalette()[:192]+frames[65].crop((150,70,490,390)).quantize(colors=64,method=Image.Quantize.MEDIANCUT).getpalette()[:192])
    encoded=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames];file=ART/'sacrificio-tributo-gameplay.gif'
    durations=[(round((i+1)*100/12)-round(i*100/12))*10 for i in range(144)]
    encoded[0].save(file,save_all=True,append_images=encoded[1:],duration=durations,loop=0,disposal=1,optimize=False)
    im=Image.open(file);assert im.n_frames==144
    report.update({'viewport':[1024,768],'gif_pixels':[640,480],'duration_ms':12000,'capture_fps':12,'frames':144,'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()});ctx.close()
    # Running timer: Sacrificio freezes during the shot, resumes afterwards; Tributo retires a revealed question.
    for width,height,offline,reduced in [(390,844,False,False),(844,390,False,False),(390,844,True,True)]:
        ctx,q,v,f,external=start(width,height,reduced,offline);v.get_by_role('button',name='Svela e avvia il tempo',exact=True).click();q.clock.run_for(500)
        v.locator('body').press('i');v.locator('#dialog [data-ammo="sacrificio"]').click();select(v);confirm(v);q.clock.run_for(100)
        assert not v.evaluate('HellscapeUI.game.running');left=v.evaluate('HellscapeUI.game.left()')
        if reduced:
            still=v.locator('canvas').evaluate('c=>c.toDataURL()');q.clock.run_for(150);assert still==v.locator('canvas').evaluate('c=>c.toDataURL()')
        else:
            q.keyboard.press('p');q.clock.run_for(100);still=v.locator('canvas').evaluate('c=>c.toDataURL()');q.clock.run_for(300)
            assert still==v.locator('canvas').evaluate('c=>c.toDataURL()');assert v.evaluate('HellscapeUI.game.left()')==left;q.keyboard.press('p')
        q.clock.run_for(2100);assert v.evaluate('HellscapeUI.game.running')
        v.locator('body').press('i');v.locator('#dialog [data-ammo="ruba"]').click();select(v,f['target']);confirm(v);q.clock.run_for(3800)
        a=state(v);assert a['owner']==f['target'] and a['screen']=='hidden' and not a['running'] and a['valid']==0
        assert f['current'] in a['cancelled'] and a['current']!=f['current']
        v.evaluate('Fool.Game.restore(HellscapeUI.game.snapshot())');v.evaluate('HellscapeUI.changed()');q.clock.run_for(100);assert v.locator('.hell-race').get_attribute('data-ammo')==''
        assert not external;assert v.evaluate('document.documentElement.scrollWidth<=innerWidth')
        q.screenshot(path=str(ART/f'after-{width}-{height}-{offline}.png'));report['checks'].append({'viewport':[width,height],'offline':offline,'reduced':reduced,'timer_pause_resume':'PASS','revealed_tribute':'PASS','restore_no_replay':'PASS'});ctx.close()
    # The last heart is actually removed, including an open-question transition and saved-game compatibility.
    ctx,q,v,f,_=start(390,844,reduced=True);v.evaluate('HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].damage=2');card(v,'sacrificio');select(v)
    assert 'ELIMINAZIONE' in v.locator('#dialog').inner_text();confirm(v);q.clock.run_for(4500);a=state(v)
    assert a['out'][f['owner']] and a['lives'][f['owner']]==0 and a['scores'][f['owner']]=='1777' and a['owner']!=f['owner']
    v.evaluate('Fool.Game.restore(HellscapeUI.game.snapshot())');report['last_life']='PASS';ctx.close()
    # Visible settings defaults are actual independent percentages.
    ctx=browser.new_context();q=ctx.new_page();q.goto(f'http://127.0.0.1:{server.server_port}/Fool.html?settings=1')
    assert q.locator('#weight-antisigillo').input_value()=='20' and q.locator('#weight-sacrificio').input_value()=='5'
    assert q.locator('.ammo-setting').count()==9;q.screenshot(path=str(ART/'settings.png'),full_page=True);report['settings_defaults']='PASS';ctx.close()
    assert not report['errors'],report['errors'];browser.close()
server.shutdown();(ART/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS: real Sacrificio/Tributo GIF; probabilities; exact transfer; current turn; mobile timer/pause; offline/reduced; last life; restore')
