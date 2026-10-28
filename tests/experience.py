import os
"""Options, lives, selected answers, saved review, notation and complete shortcuts."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import threading,json
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);errors=[];checks=[]
 for w,h in [(1440,900),(844,390)]:
  page=browser.new_page(viewport={'width':w,'height':h});page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'Fool.html?start=1');expect(page.get_by_role('button',name='Inizia partita')).to_be_enabled()
  expect(page.locator('.vehicle-preview canvas')).to_have_count(3)
  page.get_by_role('button',name='Inizia partita').click();expect(page.locator('.character-stage,.pixel-character')).to_have_count(0)
  expect(page.locator('.options-toggle')).to_have_count(1)
  expect(page.get_by_role('button',name='Domanda precedente',exact=True)).not_to_be_visible()
  expect(page.get_by_role('button',name='Scorciatoie da tastiera',exact=True)).not_to_be_visible()
  page.get_by_role('button',name='Opzioni',exact=True).click();expect(page.get_by_role('button',name='Scorciatoie da tastiera',exact=True)).to_be_visible();page.get_by_role('button',name='Chiudi',exact=True).click()
  assert page.locator('.turn-order .heart:not(.lost)').count()==9
  # All current-bank notation must render through the same renderer as the UI.
  count=page.evaluate('''()=>{let n=0;for(const q of HellscapeUI.game.s.bank)for(const value of [q.body,...q.options,q.explanation]){const el=document.createElement('div');HellscapeUI.math(el,value);for(const part of Fool.scienceParts(value))if(part.math!==undefined){katex.renderToString(part.math,{throwOnError:true});n++}}return n}''');assert count>10
  page.keyboard.press('F1');expect(page.get_by_role('heading',name='Scorciatoie da tastiera')).to_be_visible();expect(page.locator('.shortcut-list dt')).to_have_count(16);page.keyboard.press('Escape');expect(page.locator('#dialog')).not_to_be_visible()
  page.keyboard.press('Enter');assert page.evaluate('HellscapeUI.game.running');page.keyboard.press('p');assert page.evaluate('HellscapeUI.game.s.paused && !HellscapeUI.game.running');page.keyboard.press('p');assert page.evaluate('HellscapeUI.game.running')
  chosen=page.evaluate('(HellscapeUI.game.s.current.correct+1)%4');question=page.evaluate('JSON.stringify(HellscapeUI.game.s.current)')
  page.keyboard.press('abcd'[chosen]);expect(page.locator('.answer.selected')).to_have_count(1);expect(page.locator('.answer.selected')).to_have_attribute('aria-label','Risposta scelta '+'ABCD'[chosen]+': '+json.loads(question)['options'][chosen]);expect(page.locator('.answer.correct')).to_have_count(1)
  # The correction is available after the movement interval.
  # Current UI keeps the explanation alongside the four answers.
  expect(page.locator('.solution')).to_be_visible()
  expect(page.get_by_role('button',name='Prossima domanda',exact=True)).to_be_visible();page.keyboard.press('Enter');assert page.evaluate('HellscapeUI.game.s.screen')=='hidden';page.keyboard.press('Enter');page.keyboard.press('p')
  state=page.evaluate('JSON.stringify({groups:HellscapeUI.game.s.groups,valid:HellscapeUI.game.s.valid,turn:HellscapeUI.game.s.turn,current:HellscapeUI.game.s.current,remaining:HellscapeUI.game.s.remaining})')
  page.keyboard.press('ArrowLeft');expect(page.get_by_role('heading',name='Domanda precedente')).to_be_visible();expect(page.locator('.review-answer.selected')).to_contain_text('RISPOSTA SCELTA')
  assert page.locator('.review-answer.selected').inner_text().startswith('ABCD'[chosen]+'. '+json.loads(question)['options'][chosen])
  page.keyboard.press('Escape');expect(page.locator('#dialog')).not_to_be_visible();assert page.evaluate('JSON.stringify({groups:HellscapeUI.game.s.groups,valid:HellscapeUI.game.s.valid,turn:HellscapeUI.game.s.turn,current:HellscapeUI.game.s.current,remaining:HellscapeUI.game.s.remaining})')==state
  # Review survives a reload and restores the exact displayed question.
  page.goto(base+'Fool.html?resume=1');page.keyboard.press('ArrowLeft');expect(page.locator('.review-answer.selected')).to_contain_text(json.loads(question)['options'][chosen]);page.keyboard.press('Escape');expect(page.locator('#dialog')).not_to_be_visible()
  page.keyboard.press('i');expect(page.get_by_role('heading',name='Inventario',exact=True)).to_be_visible();page.keyboard.press('Escape');expect(page.locator('#dialog')).not_to_be_visible()
  # One sanction removes one ordinary-game heart.
  page.keyboard.press('s');page.locator('#sanction-plus-0').click(timeout=3000);page.get_by_role('button',name='Conferma intervento',exact=True).click()
  assert page.evaluate('Fool.remainingLives(HellscapeUI.game.s,0)')==2
  expect(page.locator('.turn-order [data-team="0"] .lives')).to_have_attribute('aria-label','2 vite su 3')
  page.keyboard.press('v');expect(page.get_by_role('heading',name='Riassegna punti',exact=True)).to_be_visible();page.get_by_role('button',name='Annulla',exact=True).click()
  before=page.evaluate('HellscapeUI.game.s.current.id');page.keyboard.press('r');expect(page.locator('#dialog')).not_to_be_visible();assert page.evaluate('HellscapeUI.game.s.current.id')==before;expect(page.get_by_role('button',name='Richiedi rifiuto',exact=True)).to_have_count(0)
  page.keyboard.press('k');expect(page.locator('#message')).to_contain_text('Partita salvata')
  page.keyboard.press('o');assert page.locator('#dialog[data-passive=options][open]').count()==1;page.keyboard.press('o');assert page.locator('#dialog[open]').count()==0
  page.keyboard.press('f');page.wait_for_function('!!document.fullscreenElement');page.keyboard.press('f');page.wait_for_function('!document.fullscreenElement')
  page.evaluate('fitFoolViewport()');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1 && document.documentElement.scrollHeight<=innerHeight+1')
  page.screenshot(path=f'/tmp/fool-new-features-{w}.png')
  page.keyboard.press('p');page.keyboard.press('a');expect(page.get_by_role('button',name='Prossima domanda',exact=True)).to_be_visible();page.keyboard.press('Enter');page.keyboard.press('l');assert page.evaluate('HellscapeUI.game.s.suspended');page.keyboard.press('l');assert not page.evaluate('HellscapeUI.game.s.suspended')
  page.keyboard.press('h');page.get_by_role('button',name='Salva ed esci').click();expect(page.get_by_role('link',name='Riprendi partita',exact=True)).to_be_visible();checks.append({'viewport':[w,h],'notation_parts':count});page.close()
 # Tie-break participants each have exactly one heart, regardless of past sanctions.
 page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'Fool.html')
 page.get_by_role('button',name='Inizia partita').click()
 page.evaluate('''()=>{const c=Fool.clone(HellscapeUI.game.s.config);c.questionCount=3;for(const key of Object.keys(c.quotas))c.quotas[key]=0;c.quotas[Object.keys(c.quotas)[0]]=3;HellscapeUI.game=Fool.Game.start(Fool.prepare(HellscapeUI.game.s.bank,c));HellscapeUI.game.s.groups.forEach((g,i)=>g.sanctions=i);for(let i=0;i<3;i++){HellscapeUI.game.reveal();HellscapeUI.game.answer((HellscapeUI.game.s.current.correct+1)%4);if(i<2)HellscapeUI.game.next()}HellscapeUI.changed()}''')
 assert page.evaluate('HellscapeUI.game.s.phase')=='pareggio';assert page.evaluate('HellscapeUI.game.s.groups.reduce((n,g,i)=>n+Fool.remainingLives(HellscapeUI.game.s,i),0)')==6
 for i in range(3):assert page.evaluate(f'Fool.remainingLives(HellscapeUI.game.s,{i})')==3-i
 assert page.evaluate('HellscapeUI.game.s.groups.map(g=>g.sanctions)')==[0,1,2]
 page.evaluate('()=>{HellscapeUI.game.next();HellscapeUI.game.reveal();HellscapeUI.game.answer((HellscapeUI.game.s.current.correct+1)%4);HellscapeUI.changed()}');assert page.evaluate('HellscapeUI.game.s.groups.reduce((n,g,i)=>n+Fool.remainingLives(HellscapeUI.game.s,i),0)')==5
 loser=page.evaluate('HellscapeUI.game.s.respondent');expect(page.locator(f'.turn-order [data-team="{loser}"] .lives')).to_have_attribute('aria-label',f'{2-loser} '+('vita' if 2-loser==1 else 'vite')+' su 3')
 page.goto(base+'Fool.html?resume=1');assert page.evaluate('HellscapeUI.game.s.groups.reduce((n,g,i)=>n+Fool.remainingLives(HellscapeUI.game.s,i),0)')==5;page.close()
 # The rules keep every remaining slide and navigation entry after removing refusal.
 page=browser.new_page(viewport={'width':1440,'height':900});page.goto(base+'Fool_regole.html');expect(page.locator('.slide')).to_have_count(22);expect(page.locator('#section option')).to_have_count(22);expect(page.locator('[data-go]')).to_have_count(22);assert 'rifiut' not in page.locator('body').inner_text().lower();page.close()
 # Deadline and final-screen outcomes retain an explicit chosen/no-answer label.
 page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'Fool.html')
 page.get_by_role('button',name='Inizia partita').click()
 page.evaluate('()=>{HellscapeUI.game.reveal();HellscapeUI.game.deadline=HellscapeUI.game.now()-1;HellscapeUI.game.tick();HellscapeUI.changed()}')
 expect(page.locator('.chosen-answer')).to_contain_text('Tempo scaduto.');expect(page.locator('.answer.selected')).to_have_count(0)
 page.evaluate('()=>{HellscapeUI.game.complete(HellscapeUI.game.s.respondent);HellscapeUI.changed()}');expect(page.locator('.final-answer')).to_contain_text('nessuna risposta scelta');page.close()
 assert not errors,errors
 browser.close();print(json.dumps({'experience':checks,'errors':errors}))
server.shutdown()
