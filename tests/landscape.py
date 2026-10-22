"""Landscape-only viewport fitting, background symbols, settings, dialogs and fullscreen."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import threading,json
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT.parent)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base='http://127.0.0.1:'+str(server.server_port)+'/'+ROOT.name+'/'
sizes=[(640,360),(844,390),(1024,576),(1280,566),(1280,800),(1440,900),(1920,1080)]
def fits(page,label):
 page.evaluate('fitFoolViewport()')
 data=page.evaluate('({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight})')
 assert data['sw']<=data['w']+1 and data['sh']<=data['h']+1,(label,data)
 dialog=page.locator('dialog[open]')
 if dialog.count():
  r=dialog.bounding_box();assert r['x']>=-1 and r['y']>=-1 and r['x']+r['width']<=data['w']+1 and r['y']+r['height']<=data['h']+1,(label,r,data)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 errors=[];stats=[]
 for w,h in sizes:
  page=browser.new_page(viewport={'width':w,'height':h});page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base);page.evaluate('document.fonts.ready');fits(page,('home',w,h))
  expect(page.get_by_role('button',name='Schermo intero',exact=True)).to_be_visible()
  page.get_by_role('link',name='Start',exact=True).click();expect(page.get_by_role('button',name='Inizia partita')).to_be_enabled()
  for i,key in enumerate(['crown','shield','swords']):page.locator('#icon'+str(i)).select_option(key)
  fits(page,('setup',w,h));page.get_by_role('button',name='Inizia partita').click();fits(page,('hidden',w,h))
  assert page.locator('.turn').inner_text().startswith('Rotazione ')
  assert 'concluse' not in page.locator('.statusline').inner_text()
  assert page.locator('.team-symbol').count()==3
  for mark in page.locator('.team-symbol').all():
   assert mark.get_attribute('aria-hidden')=='true'
   assert mark.evaluate('e=>getComputedStyle(e).position')=='absolute'
  assert page.evaluate('game.s.config.icons')==['crown','shield','swords']
  page.screenshot(path=str(ROOT/f'tests/landscape-hidden-{w}-{h}.png'))
  page.get_by_role('button',name='Svela e avvia il tempo').click();fits(page,('answer',w,h))
  page.get_by_role('button',name='Pausa',exact=True).click();fits(page,('paused',w,h))
  page.get_by_role('button',name='Sanzioni',exact=True).click();fits(page,('sanctions',w,h))
  page.locator('#sanction-plus-0').click();page.get_by_role('button',name='Conferma intervento').click()
  page.get_by_role('button',name='Riprendi timer',exact=True).click()
  page.locator('.answer').nth(page.evaluate('game.s.current.correct')).click();fits(page,('result',w,h))
  # Every real question, alternatives and explanation fit in the same bounded stage.
  count=page.evaluate('''()=>{const saved=game.snapshot();let count=0;for(const q of game.s.bank){game.s.groups.forEach(g=>g.streak=10);game.s.current=q;game.s.screen='result';game.s.result={correct:true,respondent:game.s.respondent,base:'100',multiplier:'10/10',gross:F.rational(100),beneficiaries:[],bonus:null};renderGame();fitFoolViewport();const d=document.documentElement;if(d.scrollHeight>innerHeight+1||d.scrollWidth>innerWidth+1)throw Error('Overflow '+q.id);count++}game=F.Game.restore(saved);changed();fitFoolViewport();return count}''')
  assert count==100
  page.evaluate('()=>{for(const type of F.TYPES)game.s.groups[game.s.respondent].inventory.push({id:game.uid(),type,target:null,origin:"layout"});changed()}')
  page.get_by_role('button',name='Bonus e inventari',exact=True).click();fits(page,('inventory',w,h))
  page.get_by_role('button',name='Chiudi',exact=True).click()
  page.get_by_role('link',name='Fool, pagina iniziale').click();page.get_by_role('link',name='Impostazioni',exact=True).click()
  expect(page.get_by_role('button',name='Salva impostazioni')).to_be_visible();fits(page,('settings-general',w,h))
  page.locator('#seconds').fill('60')
  page.get_by_role('button',name='Argomenti',exact=True).click();fits(page,('settings-topics',w,h))
  assert page.locator('#quotas label:visible').count()==4
  page.locator('#quota-0').fill('5');page.locator('#quota-1').fill('3')
  page.get_by_role('button',name='Argomenti successivi',exact=True).click();fits(page,('topics-page2',w,h))
  page.get_by_role('button',name='Argomenti successivi',exact=True).click();fits(page,('topics-page3',w,h))
  page.get_by_role('button',name='Salva impostazioni').click()
  expect(page.locator('#message')).to_contain_text('Impostazioni salvate')
  page.get_by_role('button',name='Anteprima',exact=True).click();fits(page,('settings-preview',w,h))
  page.get_by_role('button',name='Prepara anteprima').click();fits(page,('preview',w,h))
  page.get_by_role('button',name='Torna alle impostazioni').click()
  page.get_by_role('button',name='Torna alla schermata iniziale',exact=True).click()
  page.get_by_role('link',name='Regole',exact=True).click()
  for i in range(21):page.locator('#section').select_option(str(i));fits(page,('rules',w,h,i))
  page.get_by_role('button',name='Indice',exact=True).click();fits(page,('rules-index',w,h))
  page.get_by_role('button',name='Chiudi indice').click()
  page.get_by_role('link',name='Torna alla schermata iniziale',exact=True).click();expect(page).to_have_url(base)
  stats.append([w,h,count,21]);page.close()
 # Portrait is explicitly outside the game layout; pause until landscape resumes.
 page=browser.new_page(viewport={'width':844,'height':390});page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'Fool.html');page.get_by_role('button',name='Inizia partita').click();page.get_by_role('button',name='Svela e avvia il tempo').click()
 page.set_viewport_size({'width':390,'height':844});expect(page.get_by_role('heading',name='Ruota lo schermo')).to_be_visible()
 assert page.evaluate('game.s.paused && !game.running');fits(page,'portrait-notice')
 page.set_viewport_size({'width':844,'height':390});expect(page.get_by_role('button',name='Riprendi timer')).to_be_visible();fits(page,'landscape-return')
 # Fullscreen initiated on home survives entering and returning from a game/rules.
 page.goto(base);page.get_by_role('button',name='Schermo intero',exact=True).click()
 page.wait_for_function('!!document.fullscreenElement')
 page.get_by_role('link',name='Start',exact=True).click()
 frame=page.frame_locator('#play-frame');frame.get_by_role('button',name='Inizia partita').wait_for()
 assert page.evaluate('!!document.fullscreenElement')
 frame.get_by_role('button',name='Torna alla schermata iniziale',exact=True).click()
 expect(page.locator('#play-frame')).to_have_count(0);assert page.evaluate('!!document.fullscreenElement')
 page.get_by_role('link',name='Regole',exact=True).click();page.frame_locator('#play-frame').get_by_role('link',name='Torna alla schermata iniziale',exact=True).click()
 expect(page.locator('#play-frame')).to_have_count(0);assert page.evaluate('!!document.fullscreenElement')
 page.get_by_role('button',name='Esci da schermo intero',exact=True).click();page.wait_for_function('!document.fullscreenElement');fits(page,'exit-fullscreen')
 page.evaluate('document.documentElement.requestFullscreen=undefined');page.get_by_role('button',name='Schermo intero',exact=True).click()
 expect(page.locator('#fullscreen-status')).to_contain_text('non consente');fits(page,'fullscreen-unavailable')
 assert not errors,errors
 browser.close();print(json.dumps({'landscape_sizes_questions_rules':stats,'fullscreen':'persistent home/game/rules tested','portrait':'rotate notice and timer paused','errors':errors}))
