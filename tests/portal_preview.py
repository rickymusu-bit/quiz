"""Actual RAF portal playback and GIF, plus offline/pause/mobile checks."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
from PIL import Image
from io import BytesIO
import threading, json, os, subprocess, hashlib, sys, colorsys

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / 'artifacts/portal-stone-gold'
ART.mkdir(parents=True, exist_ok=True)
INSPECT = '--inspect' in sys.argv
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
report = {'revision': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(), 'errors': []}
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox', '--disable-dev-shm-usage'])
    page = browser.new_page(viewport={'width': 1024, 'height': 768})
    page.on('pageerror', lambda e: report['errors'].append(str(e)))
    page.goto(f'http://127.0.0.1:{server.server_port}/Fool.html?start=1')
    page.get_by_role('button', name='Inizia partita', exact=False).click()
    page.wait_for_function('FoolPortal.load()?.complete && FoolPortal.load().naturalWidth===1024 && FoolPortal.loadRocks()?.complete && FoolPortal.loadRocks().naturalWidth===1536 && FoolEnding.prepare(FoolEnding.load(()=>{}))!==null')
    page.evaluate('document.fonts.ready')
    page.clock.install(); page.clock.pause_at(page.evaluate('Date.now()+1000')); page.clock.run_for(200)
    page.evaluate('''()=>{const g=HellscapeUI.game;g.s.id+='-portal-azure';g.s.groups[1].name='Fuggitivo';
      g.eliminate(0,'già divorato');g.eliminate(2,'già divorato');g.complete(1);
      window.__endingDone=0;document.addEventListener('foolendingcomplete',()=>__endingDone++);HellscapeUI.changed()}''')
    page.clock.run_for(100)
    def snap(): return page.evaluate('FoolHellRace.presentationSnapshot()')
    plan = snap()['plan']; state = page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')
    assert plan['victims'] == []
    def at(offset):
        current = snap()['frame']['time']-plan['entry']['time']
        page.clock.run_for(max(0, round((plan['chaseEnd']+offset-current)*1000)))
    if INSPECT:
        for phase, time in [('descent', 1.35), ('impact', 1.95), ('open', 2.28), ('cross', 2.95), ('collapse', 4.5), ('rubble', 6.2)]:
            at(time); page.screenshot(path=str(ART/f'{phase}.png'))
        assert not report['errors'], report['errors']
    else:
        at(-.2); frames = []; phases = []; snapshots = []; color_roi = None
        start = snap()['frame']['camera']['distance']
        for i in range(96):
            page.clock.run_for(round((i+1)*1000/12)-round(i*1000/12))
            data = snap(); f = data['frame']; phase = data['phase']
            if i == 30:
                box = page.evaluate('FoolPortal.spriteFrame(FoolHellRace.presentationSnapshot().frame.portal)')
                canvas = page.locator('.hell-race canvas').bounding_box()
                color_roi = (max(0,round((canvas['x']+box['x']*canvas['width']/768)*640/1024)),
                             max(0,round((canvas['y']+box['y']*canvas['height']/576)*480/768)),
                             min(640,round((canvas['x']+(box['x']+box['width'])*canvas['width']/768)*640/1024)),
                             min(480,round((canvas['y']+(box['y']+box['height'])*canvas['height']/576)*480/768)))
            if not phases or phases[-1] != phase: phases.append(phase)
            if f.get('portal'):
                g = f['portal']['geometry']; assert 0 <= g['far'] < g['near'] <= 110
                if f['bridge']['collapse'] > 0: assert f['cleared']
                assert all(not v['visible'] for v in f['positions'] if v['index'] != 1)
                snapshots.append({'phase':phase,'camera':f['camera'],'portal':f['portal'],'cleared':f['cleared']})
            assert page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())') == state
            frames.append(Image.open(BytesIO(page.screenshot(scale='css'))).convert('RGB').resize((640,480), Image.Resampling.LANCZOS))
        assert phases == ['winner-chase','descent','open','escape','close','collapse','rage'], phases
        assert snap()['frame']['camera']['distance'] > start
        # Reserve real browser colors for the portal, so lava cannot turn gold into orange.
        def is_gold(rgb):
            r,g,b=rgb
            return r>140 and g>100 and r>g>b and .65<g/r<.9 and g-b>30
        reference = frames[30].crop(color_roi)
        gold_samples = [rgb for rgb in reference.get_flattened_data() if is_gold(rgb)]
        assert len(gold_samples)>50
        gold_strip = Image.new('RGB',(len(gold_samples),1));gold_strip.putdata(gold_samples)
        scene_colors = frames[30].quantize(colors=128, method=Image.Quantize.MEDIANCUT).getpalette()[:128*3]
        portal_colors = reference.quantize(colors=64, method=Image.Quantize.MEDIANCUT).getpalette()[:64*3]
        gold_colors = gold_strip.quantize(colors=64, method=Image.Quantize.MEDIANCUT).getpalette()[:64*3]
        palette = Image.new('P',(1,1)); palette.putpalette(scene_colors+portal_colors+gold_colors)
        encoded = [f.quantize(palette=palette, dither=Image.Dither.NONE) for f in frames]
        compressed = encoded[30].convert('RGB').crop(color_roi)
        hue_errors = []; rgb_errors = []; orange_shifts = 0
        for src,dst in zip(reference.get_flattened_data(),compressed.get_flattened_data()):
            if is_gold(src):
                h = colorsys.rgb_to_hsv(*(v/255 for v in src))[0]*360
                encoded_h = colorsys.rgb_to_hsv(*(v/255 for v in dst))[0]*360
                hue_errors.append(abs(encoded_h-h));rgb_errors.append(sum(abs(a-b) for a,b in zip(src,dst))/3)
                orange_shifts += encoded_h<h-8
        assert len(hue_errors)>50, 'Gold must be represented in the reference frame'
        color_check = {'gold_pixels':len(hue_errors),'mean_hue_error_degrees':sum(hue_errors)/len(hue_errors),
                       'mean_rgb_error':sum(rgb_errors)/len(rgb_errors),'orange_shift_fraction':orange_shifts/len(hue_errors)}
        assert color_check['mean_hue_error_degrees']<3 and color_check['orange_shift_fraction']<.03, color_check
        frames[30].save(ART/'color-reference.png')
        report.update({'palette_colors':256,'portal_reserved_colors':64,'gold_reserved_colors':64,'color_reference_roi':color_roi,'gold_color_check':color_check})
        durations = [(round((i+1)*100/12)-round(i*100/12))*10 for i in range(96)]
        file = ART/'portal-stone-gold-gameplay.gif'
        encoded[0].save(file, save_all=True, append_images=encoded[1:], duration=durations, loop=0, disposal=1, optimize=False)
        gif = Image.open(file); duration = 0
        for i in range(gif.n_frames): gif.seek(i); duration += gif.info.get('duration',0)
        assert gif.n_frames == 96 and duration == 8000
        page.get_by_role('button',name='Pausa scena',exact=True).click();page.clock.run_for(100)
        frozen = page.locator('.hell-race canvas').evaluate('c=>c.toDataURL()')
        page.clock.run_for(500); assert page.locator('.hell-race canvas').evaluate('c=>c.toDataURL()') == frozen
        page.get_by_role('button',name='Riprendi scena',exact=True).click();page.clock.run_for(100)
        at(11.6); assert snap()['phase']=='done';assert page.evaluate('__endingDone')==1
        assert page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')==state
        page.screenshot(path=str(ART/'victory.png'))
        assert page.locator('.final-title').is_visible()
        report.update({'viewport':[1024,768],'gif_pixels':[640,480],'frames':96,'duration_ms':8000,'capture_fps':12,
          'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'phases':phases,
          'engine_unchanged':True,'pause':'PASS','completion_events':1,'samples':snapshots})
        # Same production asset and finale, in the fully embedded offline build.
        context = browser.new_context(offline=True, viewport={'width':667,'height':375}, device_scale_factor=2, reduced_motion='reduce')
        external = []
        def route(r):
            if r.request.url=='http://portal.test/': r.fulfill(content_type='text/html',body=(ROOT/'dist/Hellscape-offline.html').read_text())
            else: external.append(r.request.url);r.abort()
        context.route('**/*',route);q=context.new_page();q.on('pageerror',lambda e:report['errors'].append(str(e)));q.goto('http://portal.test/')
        q.frame_locator('iframe').get_by_role('link',name='Nuova partita',exact=True).click();f=q.frames[1]
        f.get_by_role('button',name='Inizia partita',exact=False).click()
        f.wait_for_function('FoolPortal.load()?.complete && FoolPortal.load().naturalWidth===1024 && FoolPortal.loadRocks()?.complete && FoolPortal.loadRocks().naturalWidth===1536 && FoolEnding.prepare(FoolEnding.load(()=>{}))!==null')
        assert f.evaluate('FoolPortal.load().src.startsWith("data:image/png;base64,") && FoolPortal.loadRocks().src.startsWith("data:image/png;base64,")')
        f.evaluate('''()=>{const g=HellscapeUI.game;g.s.id+='-offline-portal';g.eliminate(1,'già divorato');g.eliminate(2,'già divorato');g.complete(0);HellscapeUI.changed()}''')
        f.wait_for_function('FoolHellRace.presentationSnapshot().phase==="done"')
        assert f.locator('.final-title').is_visible(); assert f.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        q.screenshot(path=str(ART/'mobile-reduced.png'))
        assert not external, external;report['offline_external_requests']=external
        report['mobile_reduced_motion']='PASS'
        assert not report['errors'],report['errors']
    browser.close()
server.shutdown()
if not INSPECT: (ART/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS: real portal '+('inspection' if INSPECT else 'GIF, passage/collapse, pause, model invariance, mobile and offline'))
