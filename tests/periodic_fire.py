from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
import threading,json,os
ROOT=Path(__file__).resolve().parent.parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);q=b.new_page(viewport={'width':1366,'height':768});q.clock.install();q.goto(f'http://127.0.0.1:{server.server_port}/Fool.html?start=1');q.get_by_role('button',name='Inizia partita (13 turni per giocatore)',exact=True).click();q.wait_for_function('FoolCerbero.ready()');q.clock.pause_at(q.evaluate('Date.now()+1000'));q.clock.run_for(2000)
  q.evaluate('''()=>{window.__fire=[];const original=FoolCerbero.flame;FoolCerbero.flame=(...args)=>{__fire.push({id:args[1],age:args[2],mouth:args[3].mouth});return original(...args)}}''')
  q.evaluate('HellscapeUI.game.s.config.seconds=90');q.get_by_role('button',name='Svela e avvia il tempo',exact=True).click();now=q.evaluate('FoolHellRace.motionSnapshot().time');q.clock.run_for(round((60.8-now)*1000));ids=set(q.evaluate('__fire.filter(f=>f.age>0&&f.age<1.3).map(f=>f.id)'));assert ids=={'left','center','right'},ids
  q.keyboard.press('p');q.clock.run_for(100);raw=lambda:q.locator('.hell-race canvas').evaluate('c=>c.toDataURL()');frozen=raw();clock=q.evaluate('FoolHellRace.motionSnapshot()');left=q.evaluate('HellscapeUI.game.left()');q.clock.run_for(1000);assert raw()==frozen;assert q.evaluate('FoolHellRace.motionSnapshot()')==clock;assert q.evaluate('HellscapeUI.game.left()')==left
  q.keyboard.press('p');q.clock.run_for(200);assert q.evaluate('FoolHellRace.motionSnapshot().time')>clock['time'];q.emulate_media(reduced_motion='reduce');q.clock.run_for(100);q.evaluate('__fire=[]');q.clock.run_for(300);assert q.evaluate('__fire.length')==0;b.close()
 print('PASS: three actual mouth emitters, periodic breath freezes with question pause, resumes without restarting, reduced motion suppresses emission')
finally:server.shutdown()
