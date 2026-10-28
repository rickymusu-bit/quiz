"""Record the actual integrated race and finale; no mockups or game-rule changes."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
from PIL import Image
from io import BytesIO
import threading,subprocess,json,math,hashlib,colorsys
ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/'artifacts/final-review';ART.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
report={'revision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'errors':[]}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    q=browser.new_page(viewport={'width':1024,'height':768});q.clock.install();q.on('pageerror',lambda e:report['errors'].append(str(e)))
    q.goto(f'http://127.0.0.1:{server.server_port}/Fool.html?start=1');q.get_by_role('button',name='Inizia partita',exact=False).click()
    q.wait_for_function('FoolAmmo.ready() && FoolBridge.load()?.complete && FoolEnding.prepare(FoolEnding.load(()=>{}))!==null && FoolPortal.load()?.complete && FoolPortal.loadRocks()?.complete')
    q.evaluate('document.fonts.ready');q.clock.pause_at(q.evaluate('Date.now()+1000'))
    fixture=q.evaluate('''()=>{const g=HellscapeUI.game,s=g.s,[winner,second,third]=s.order,names=[];names[winner]='Aster';names[second]='Moro';names[third]='Vespro';s.config.names=names;
      for(const [i,score,vehicle] of [[winner,1200,'chopper'],[second,600,'pickup'],[third,300,'ape']]){s.groups[i].name=names[i];s.groups[i].score=Fool.rational(score);s.config.vehicles[i]=vehicle;}
      HellscapeUI.changed();return {winner,second,third};}''')
    q.clock.run_for(1800);frames=[];portal_index=None;phases=[];victims=set();rubble=False;distance=None;consumed=set()
    def screenshot():return Image.open(BytesIO(q.screenshot())).convert('RGB').resize((640,480),Image.Resampling.LANCZOS)
    for _ in range(12):q.clock.run_for(125);frames.append(screenshot())
    q.screenshot(path=str(ART/'ordinary.png'))
    q.evaluate('''winner=>{const g=HellscapeUI.game;g.openSanctions();g.s.panel.counts=g.s.groups.map((_,i)=>i===winner?0:3);g.closeSanctions(true);HellscapeUI.changed();}''',fixture['winner'])
    q.clock.run_for(125);plan=q.evaluate('FoolHellRace.presentationSnapshot().plan');assert len(plan['victims'])==2 and plan['winner']==fixture['winner']
    stable=q.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')
    for _ in range(math.ceil((plan['duration']+1)*8)):
        q.clock.run_for(125);s=q.evaluate('FoolHellRace.presentationSnapshot()');f=s['frame'];phase=s['phase']
        if not phases or phases[-1]!=phase:phases.append(phase)
        if isinstance(f.get('victim'),int):assert f['victim']!=fixture['winner'];victims.add(f['victim'])
        for index in consumed:assert f['positions'][index].get('visible') is False
        consumed.update(s['consumed'])
        if distance is not None:assert f['camera']['distance']>=distance-0.001
        distance=f['camera']['distance'];rubble=rubble or bool((f.get('bridge') or {}).get('rubble'))
        if portal_index is None and (f.get('portal') or {}).get('visible') and f['portal'].get('opening',0)>.8 and not f['portal'].get('collapse',0):portal_index=len(frames)
        assert q.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')==stable
        frames.append(screenshot())
    end=q.evaluate('FoolHellRace.presentationSnapshot()');assert end['phase']=='done' and len(end['consumed'])==2 and rubble and portal_index is not None
    assert victims=={fixture['second'],fixture['third']};assert q.locator('.final-title').is_visible();q.screenshot(path=str(ART/'victory.png'))
    assert not report['errors'],report['errors'];browser.close()
server.shutdown()
# Preserve actual gold colors from the portal independently of the lava palette.
def is_gold(rgb):
    r,g,b=rgb;return r>140 and g>100 and r>g>b and .65<g/r<.9 and g-b>30
roi=(170,0,600,410);reference=frames[portal_index].crop(roi)
gold=[rgb for rgb in reference.get_flattened_data() if is_gold(rgb)];assert len(gold)>50
strip=Image.new('RGB',(len(gold),1));strip.putdata(gold)
palette=Image.new('P',(1,1));palette.putpalette(frames[10].quantize(colors=128,method=Image.Quantize.MEDIANCUT).getpalette()[:384]+reference.quantize(colors=64,method=Image.Quantize.MEDIANCUT).getpalette()[:192]+strip.quantize(colors=64,method=Image.Quantize.MEDIANCUT).getpalette()[:192])
encoded=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
errors=[];orange=0
for src,dst in zip(reference.get_flattened_data(),encoded[portal_index].convert('RGB').crop(roi).get_flattened_data()):
    if is_gold(src):
        h=colorsys.rgb_to_hsv(*(v/255 for v in src))[0]*360;other=colorsys.rgb_to_hsv(*(v/255 for v in dst))[0]*360;errors.append(abs(h-other));orange+=other<h-8
color={'pixels':len(errors),'mean_hue_error':sum(errors)/len(errors),'orange_shift_fraction':orange/len(errors)}
assert color['mean_hue_error']<3 and color['orange_shift_fraction']<.03,color
file=ART/'integrated-gameplay.gif';durations=[(round((i+1)*100/8)-round(i*100/8))*10 for i in range(len(frames))]
encoded[0].save(file,save_all=True,append_images=encoded[1:],duration=durations,loop=0,disposal=1,optimize=False)
im=Image.open(file);assert im.n_frames==len(frames)
report.update({'viewport':[1024,768],'gif_pixels':[640,480],'capture_fps':8,'frames':len(frames),'duration_ms':sum(durations),'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),
 'fixture':fixture,'phases':phases,'capture_victims':sorted(victims),'engine_unchanged':True,'no_resurrection':True,'permanent_rubble':rubble,'gold_color_check':color})
(ART/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS: real integrated race/capture/portal GIF, unchanged engine, two victims, permanent rocks and preserved gold')
