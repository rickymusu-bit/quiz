"""Real site/offline verification and browser evidence for turns, timed choice and ambient fire."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright,expect
from PIL import Image
from io import BytesIO
import threading,os,json,hashlib,subprocess,math
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'docs/turni-cerbero/evidence';OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/'
report={'revision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'runtime_sha256':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT/'assets').rglob('*')) if p.is_file()},'checks':[],'clips':[],'errors':[]}
def gif(name,frames,kind,viewport):
 samples=Image.new('RGB',(160*8,90*math.ceil(len(frames)/8)))
 for i,im in enumerate(frames):samples.paste(im.resize((160,90)),(i%8*160,i//8*90))
 pal=samples.quantize(colors=128,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE);converted=[im.quantize(palette=pal,dither=Image.Dither.NONE) for im in frames]
 file=OUT/name;converted[0].save(file,save_all=True,append_images=converted[1:],duration=50,loop=0,optimize=True,disposal=1)
 report['clips'].append({'file':name,'viewport':viewport,'pixels':frames[0].size,'fps':20,'duration_ms':len(frames)*50,'kind':kind,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
def clock_pause(q):q.clock.pause_at(q.evaluate('Date.now()+1000'))
def shot(q):return Image.open(BytesIO(q.screenshot())).convert('RGB').resize((640,360),Image.Resampling.LANCZOS)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
  q=b.new_page(viewport={'width':1366,'height':768});q.on('pageerror',lambda e:report['errors'].append(str(e)));q.add_init_script('Math.random=()=>.25')
  q.goto(base);q.locator('.home-illustration').evaluate('img=>img.decode()');q.evaluate('document.fonts.ready');q.screenshot(path=str(OUT/'home-desktop.png'))
  q.set_viewport_size({'width':844,'height':390});q.wait_for_timeout(150);q.screenshot(path=str(OUT/'home-mobile.png'));q.set_viewport_size({'width':1366,'height':768})
  q.goto(base+'Fool.html?settings=1');expect(q.locator('#turn-count')).to_have_value('13');expect(q.locator('#turn-count')).to_have_attribute('step','1');q.screenshot(path=str(OUT/'impostazioni-13-turni.png'))
  q.goto(base+'Fool.html?start=1');expect(q.get_by_role('button',name='Inizia partita (13 turni)',exact=True)).to_be_visible();q.clock.install();q.get_by_role('button',name='Inizia partita (13 turni)',exact=True).click();q.wait_for_function('FoolCerbero.ready() && FoolAmmo.ready() && FoolBridge.load().complete',timeout=120000);q.evaluate('document.fonts.ready');clock_pause(q);q.clock.run_for(3000)
  assert q.evaluate('HellscapeUI.game.s.config.turnCount')==13;expect(q.locator('.turn-progress')).to_have_text('Turno 1 di 13');q.screenshot(path=str(OUT/'turno-1-di-13.png'))
  # No renderer overrides: use the active scene clock to record one real breath.
  elapsed=q.evaluate('FoolHellRace.motionSnapshot().time');q.clock.run_for(max(0,round((58.9-elapsed)*1000)));frozen=q.evaluate('JSON.stringify(HellscapeUI.game.snapshot())');frames=[]
  for _ in range(76):q.clock.run_for(50);frames.append(shot(q));assert q.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')==frozen
  gif('fuoco-periodico.gif',frames,'Real ordinary gameplay: anticipation, three jets while walking, recovery; first breath at active scene time 60s',[1366,768])
  # Freeze a running periodic breath with the real pause controls.
  q.clock.run_for(100);q.evaluate('HellscapeUI.game.s.config.seconds=90;HellscapeUI.game.s.config.bonusWeights=Object.fromEntries(Fool.TYPES.map(t=>[t,0]));HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].inventory.push({id:HellscapeUI.game.uid(),type:"svela",target:null,origin:"review"});HellscapeUI.changed()')
  q.get_by_role('button',name='Inventario',exact=True).click();q.locator('#dialog [data-ammo="svela"]').click();q.locator('#ammo-info').get_by_role('button',name='Usa',exact=True).click();q.locator('#dialog').get_by_role('button',name='Conferma uso',exact=True).click()
  for _ in range(60):
   q.clock.run_for(100)
   if q.evaluate('HellscapeUI.game.running && !document.body.classList.contains("showing-cinematic")'):break
  assert q.evaluate('HellscapeUI.game.s.screen')=='choice';assert q.locator('.answer').count()==0;left=q.evaluate('HellscapeUI.game.left()');assert 42000<=left<=45000,left;q.screenshot(path=str(OUT/'malocchio-scelta.png'))
  q.keyboard.press('p');q.clock.run_for(100);held=q.evaluate('HellscapeUI.game.left()');assert q.evaluate('HellscapeUI.game.s.paused');q.clock.run_for(2000);assert q.evaluate('HellscapeUI.game.left()')==held
  # Restore must preserve that remaining choice time and require explicit resume.
  # Restore through the supported browser entry, with its persisted paused timer.
  q.goto(base+'Fool.html?resume=1');q.wait_for_function('HellscapeUI.game?.s.screen==="choice"');q.clock.run_for(100);assert q.evaluate('HellscapeUI.game.s.paused');assert abs(q.evaluate('HellscapeUI.game.left()')-held)<200
  q.get_by_role('button',name='Riprendi partita',exact=True).click();q.clock.run_for(100)
  # Portrait freezes the choice and blocks selection, then requires explicit resume.
  q.set_viewport_size({'width':768,'height':1366});q.clock.run_for(100);held=q.evaluate('HellscapeUI.game.left()');q.clock.run_for(500);assert q.evaluate('HellscapeUI.game.left()')==held;expect(q.locator('#orientation-note')).to_be_visible()
  q.set_viewport_size({'width':1366,'height':768});q.clock.run_for(100);q.get_by_role('button',name='Riprendi partita',exact=True).click();q.clock.run_for(100)
  # Record only the final 2 choice seconds, then the newly started 90s answer clock.
  left=q.evaluate('HellscapeUI.game.left()');q.clock.run_for(max(0,round(left-2000)));frames=[]
  for _ in range(70):q.clock.run_for(50);frames.append(shot(q))
  assert q.evaluate('HellscapeUI.game.s.screen')=='answer';assert q.evaluate('HellscapeUI.game.s.owner===HellscapeUI.game.s.respondent');assert 87000<q.evaluate('HellscapeUI.game.left()')<=90000;assert q.evaluate('HellscapeUI.game.s.completedTurns')==0;assert q.locator('.answer').count()==4
  gif('malocchio-scadenza.gif',frames,'Last 2s of the 45s decision, automatic keep and full configured 90s response timer; earlier elapsed choice time is skipped before recording',[1366,768])
  report['checks'].append('Site: 13-turn default, 45s choice, pause/restore/portrait preserve time, automatic keep starts separate full answer timer, no turn consumed by pass')
  # Finish an ordinary 13-turn game in the real engine and use actual last-question controls.
  q.evaluate('''()=>{const g=HellscapeUI.game;g.s.groups[g.s.owner].score=Fool.rational(10000);g.answer(g.s.current.correct);g.next();for(let i=1;i<12;i++){g.reveal();g.answer(g.s.current.correct);g.next();}HellscapeUI.changed()}''');q.clock.run_for(1800);expect(q.locator('.turn-progress')).to_have_text('Turno 13 di 13');q.screenshot(path=str(OUT/'turno-13-di-13.png'))
  q.get_by_role('button',name='Svela e avvia il tempo',exact=True).click();q.locator('.answer').nth(q.evaluate('HellscapeUI.game.s.current.correct')).click();assert q.evaluate('HellscapeUI.game.s.completedTurns')==13;assert q.evaluate('HellscapeUI.game.s.phase')=='conclusa';q.close()
  # Independently exercise embedded bytes offline in a small landscape viewport.
  context=b.new_context(viewport={'width':844,'height':390},offline=True,reduced_motion='reduce');requests=[];html=(ROOT/'dist/Hellscape-offline.html').read_text()
  def route(r):
   if r.request.url=='http://turns.test/preview':r.fulfill(content_type='text/html',body=html)
   else:requests.append(r.request.url);r.abort()
  context.route('**/*',route);q=context.new_page();q.set_default_timeout(120000);q.on('pageerror',lambda e:report['errors'].append(str(e)));q.clock.install();q.goto('http://turns.test/preview');f=q.frames[1];f.get_by_role('link',name='Nuova partita',exact=True).click();f=q.frames[1];f.get_by_role('button',name='Inizia partita (13 turni)',exact=True).click();clock_pause(q);q.clock.run_for(100);assert f.evaluate('HellscapeUI.game.s.config.turnCount')==13
  f.evaluate('''()=>{const g=HellscapeUI.game;g.s.config.seconds=90;const c={id:g.uid(),type:'svela',target:null,origin:'review'};g.s.groups[g.s.owner].inventory.push(c);HellscapeUI.changed()}''');f.get_by_role('button',name='Inventario',exact=True).click();f.locator('#dialog [data-ammo="svela"]').click();f.locator('#ammo-info').get_by_role('button',name='Usa',exact=True).click();f.locator('#dialog').get_by_role('button',name='Conferma uso',exact=True).click();q.clock.run_for(600)
  assert f.evaluate('HellscapeUI.game.s.screen')=='choice';assert f.locator('.answer').count()==0;assert f.locator('.operation-body').is_visible();assert f.evaluate('document.documentElement.scrollWidth<=innerWidth+1');q.screenshot(path=str(OUT/'malocchio-mobile-offline.png'))
  target=f.evaluate('HellscapeUI.game.s.order[1]');name=f.evaluate('i=>HellscapeUI.game.s.groups[i].name',target);f.get_by_role('button',name='Passa a '+name,exact=True).click();assert f.evaluate('HellscapeUI.game.s.respondent')==target;assert f.evaluate('HellscapeUI.game.left()')==90000;assert f.evaluate('HellscapeUI.game.s.completedTurns')==0
  assert not requests,requests;report['checks'].append('Offline 844x390: default13, 45s decision fits, explicit pass starts full answer time, zero external requests');context.close();b.close()
 assert not report['errors'],report['errors']
finally:server.shutdown()
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print('PASS: turns, timed Malocchio, periodic fire, pause/restore/portrait and offline browser evidence')
