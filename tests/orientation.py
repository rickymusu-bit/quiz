"""Landscape-only interaction, timer/state preservation and real browser GIF."""
from browser_viewport import set_viewport
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright, expect
from PIL import Image
from io import BytesIO
import threading,json,subprocess,hashlib,sys
ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/'artifacts/orientation';ART.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/'
report={'revision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'errors':[],'checks':[]}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    def page(width=844,height=390,reduced=False):
        c=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce' if reduced else 'no-preference');q=c.new_page();q.set_default_navigation_timeout(120000);q.clock.install();q.on('pageerror',lambda e:report['errors'].append(str(e)))
        q.goto(base+'Fool.html?start=1')
        return c,q,q
    def rotate(q,v,w,h):
        set_viewport(q,v,w,h);q.clock.run_for(50)
        assert v.evaluate('FoolLayout.portrait')==(w<=h)
    def gate(v):
        expect(v.locator('#orientation-note')).to_be_visible();expect(v.locator('#viewport-stage')).to_be_hidden();assert v.locator('#viewport-stage').evaluate('e=>e.inert')
    def start(v,q):
        if v.locator('.home-screen').count():v.get_by_role('link',name='Nuova partita',exact=True).click()
        v.get_by_role('button',name='Inizia partita').click();v.wait_for_function('FoolAmmo.ready() && FoolBridge.load()?.complete && FoolEnding.prepare(FoolEnding.load(()=>{}))!==null');v.evaluate('document.fonts.ready');q.clock.pause_at(q.evaluate('Date.now()+1000'));q.clock.run_for(1800)
    def snap(v):return v.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')
    def pixels(v):return v.locator('.hell-race canvas').evaluate('c=>c.toDataURL()')
    # Static entry points and shortcuts cannot expose the portrait game.
    for path in ['', 'Fool.html?start=1','Fool_regole.html']:
        c=browser.new_context(viewport={'width':390,'height':844});q=c.new_page();q.on('pageerror',lambda e:report['errors'].append(str(e)));q.goto(base+path);gate(q);url=q.url
        for key in ['n','g','Enter','Escape','p']:q.keyboard.press(key)
        assert q.url==url;gate(q);c.close()
    report['checks'].append('home/setup/rules: portrait gate, blocked shortcuts')
    for reduced in (False,True):
        print(f'Checking web orientation: reduced={reduced}',flush=True)
        c,q,v=page(reduced=reduced);start(v,q)
        v.get_by_role('button',name='Svela e avvia il tempo').click();q.clock.run_for(1000)
        rotate(q,v,390,844);gate(v);left=v.evaluate('HellscapeUI.game.left()');s=snap(v);raw=pixels(v);motion=v.evaluate('JSON.stringify(FoolHellRace.motionSnapshot())')
        for key in ['p','a','1','i','Enter','Escape']:q.keyboard.press(key)
        q.clock.run_for(4000);assert snap(v)==s and pixels(v)==raw and v.evaluate('HellscapeUI.game.left()')==left and v.evaluate('JSON.stringify(FoolHellRace.motionSnapshot())')==motion
        rotate(q,v,844,390);expect(v.get_by_role('button',name='Riprendi partita',exact=True)).to_be_visible();assert not v.evaluate('HellscapeUI.game.running')
        v.get_by_role('button',name='Riprendi partita',exact=True).click();q.clock.run_for(1000);assert left-1100<=v.evaluate('HellscapeUI.game.left()')<=left-900
        # Preserve a passive modal and its pause through rotation.
        v.get_by_role('button',name='Opzioni',exact=True).click();s=snap(v);rotate(q,v,390,844);gate(v);assert v.locator('#dialog').evaluate('e=>e.open');q.clock.run_for(2000);assert snap(v)==s
        rotate(q,v,844,390);expect(v.locator('#dialog')).to_be_visible();v.get_by_role('button',name='Chiudi',exact=True).click()
        # Existing manual pause is never resumed by rotation.
        v.evaluate('HellscapeUI.game.pause("manuale");HellscapeUI.changed()');s=snap(v);rotate(q,v,390,844);q.clock.run_for(1000);rotate(q,v,844,390);assert snap(v)==s
        # A cinematic freezes in portrait and continues after landscape return.
        v.evaluate('HellscapeUI.game.resume();HellscapeUI.changed()');v.locator('.answer').nth(v.evaluate('HellscapeUI.game.s.current.correct')).click();q.clock.run_for(100)
        rotate(q,v,390,844);gate(v);s=snap(v);raw=pixels(v);presentation=v.evaluate('JSON.stringify(FoolHellRace.presentationSnapshot())');q.clock.run_for(2500);assert snap(v)==s and pixels(v)==raw and v.evaluate('JSON.stringify(FoolHellRace.presentationSnapshot())')==presentation
        rotate(q,v,844,390);q.clock.run_for(2000);assert not v.evaluate('document.body.classList.contains("showing-cinematic")')
        rotate(q,v,500,500);gate(v);c.close();report['checks'].append({'deployment':'web','reduced':reduced,'timer_state_pixels_cinematic_modal_square':'PASS'})
    # Persistence reloads into the gate, retaining the same remaining time.
    c,q,v=page();start(v,q);v.get_by_role('button',name='Svela e avvia il tempo').click();q.clock.run_for(700);rotate(q,v,390,844);left=v.evaluate('HellscapeUI.game.left()');question=v.evaluate('HellscapeUI.game.s.current.id');q.goto(base+'Fool.html?resume=1');gate(q);assert q.evaluate('HellscapeUI.game.left()')==left and q.evaluate('HellscapeUI.game.s.current.id')==question
    rotate(q,q,844,390);q.get_by_role('button',name='Riprendi partita',exact=True).click();assert q.evaluate('HellscapeUI.game.running');c.close();report['checks'].append('saved match reload: remaining time and question retained')
    # The fullscreen home embeds the game in an iframe; both documents gate it.
    c=browser.new_context(viewport={'width':844,'height':390});q=c.new_page();q.on('pageerror',lambda e:report['errors'].append(str(e)));q.goto(base);q.get_by_role('button',name='Schermo intero',exact=True).click();q.wait_for_function('!!document.fullscreenElement');q.get_by_role('link',name='Nuova partita',exact=True).click();v=q.frame_locator('#play-frame');v.get_by_role('button',name='Inizia partita').click();q.set_viewport_size({'width':390,'height':844});gate(q);gate(q.frames[1]);q.set_viewport_size({'width':844,'height':390});expect(v.get_by_role('button',name='Svela e avvia il tempo')).to_be_visible();c.close();report['checks'].append('fullscreen iframe: portrait gate and landscape return')
    if '--capture' in sys.argv:
        c,q,v=page();start(v,q);frames=[]
        def capture(n):
            for _ in range(n):
                q.clock.run_for(125);im=Image.open(BytesIO(q.screenshot())).convert('RGB');im.thumbnail((640,640),Image.Resampling.LANCZOS);board=Image.new('RGB',(640,640),'#100b0b');board.paste(im,((640-im.width)//2,(640-im.height)//2));frames.append(board)
        capture(12);v.get_by_role('button',name='Svela e avvia il tempo').click();capture(16);rotate(q,v,390,844);left=v.evaluate('HellscapeUI.game.left()');q.screenshot(path=str(ART/'portrait.png'));capture(24);assert v.evaluate('HellscapeUI.game.left()')==left
        rotate(q,v,844,390);capture(16);q.screenshot(path=str(ART/'landscape-paused.png'));v.get_by_role('button',name='Riprendi partita',exact=True).click();capture(24);assert v.evaluate('HellscapeUI.game.left()')<left
        palette=Image.new('RGB',(640,1280));palette.paste(frames[10],(0,0));palette.paste(frames[40],(0,640));palette=palette.quantize(colors=256,method=Image.Quantize.MEDIANCUT);encoded=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames];file=ART/'landscape-only.gif';durations=[(round((i+1)*100/8)-round(i*100/8))*10 for i in range(len(frames))];encoded[0].save(file,save_all=True,append_images=encoded[1:],duration=durations,loop=0,disposal=1,optimize=False)
        report['capture']={'viewports':[[844,390],[390,844]],'gif_pixels':[640,640],'frames':len(frames),'duration_ms':sum(durations),'capture_fps':8,'letterbox':'uniform scale, centered actual browser screenshots','encoded_frames':Image.open(file).n_frames,'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()};c.close()
    browser.close()
server.shutdown();assert not report['errors'],report['errors'];(ART/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
