"""Characters, lives, selected answers, saved review, notation and complete shortcuts."""
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
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);errors=[];checks=[]
 for w,h in [(1440,900),(844,390)]:
  page=browser.new_page(viewport={'width':w,'height':h});page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'Fool.html?start=1');expect(page.get_by_role('button',name='Inizia partita')).to_be_enabled()
  for icon in ['skull','bolt','star','swords','shield','crown']:
   page.locator('#icon0').select_option(icon);expect(page.locator('.character-preview img').first).to_have_attribute('src','assets/characters/'+icon+'.svg')
   page.wait_for_function('document.querySelector(".character-preview img").naturalWidth>0')
  page.locator('#icon1').select_option('bolt');page.locator('#icon2').select_option('shield')
  page.get_by_role('button',name='Inizia partita').click();expect(page.locator('.character-stage .character-card')).to_have_count(3)
  expect(page.locator('.character-stage img').first).to_have_attribute('src','assets/characters/crown.svg')
  assert page.locator('.scoreboard .heart:not(.lost)').count()==9
  # All current-bank notation must render through the same renderer as the UI.
  count=page.evaluate('''()=>{let n=0;for(const q of game.s.bank)for(const value of [q.body,...q.options,q.explanation]){const el=document.createElement('div');math(el,value);for(const part of F.scienceParts(value))if(part.math!==undefined){katex.renderToString(part.math,{throwOnError:true});n++}}return n}''');assert count>10
  page.keyboard.press('F1');expect(page.get_by_role('heading',name='Scorciatoie da tastiera')).to_be_visible();expect(page.locator('.shortcut-list dt')).to_have_count(17);page.keyboard.press('Escape');expect(page.locator('#dialog')).not_to_be_visible()
  page.keyboard.press('Enter');assert page.evaluate('game.running');page.keyboard.press('p');assert page.evaluate('game.s.paused && !game.running');page.keyboard.press('p');assert page.evaluate('game.running')
  chosen=page.evaluate('(game.s.current.correct+1)%4');question=page.evaluate('JSON.stringify(game.s.current)')
  page.keyboard.press('abcd'[chosen]);expect(page.locator('.answer.selected')).to_have_count(1);expect(page.locator('.chosen-answer')).to_contain_text('Risposta scelta '+'ABCD'[chosen]);expect(page.locator('.answer.correct')).to_have_count(1)
  # The glossary is available after the result and explains measurable quantities.
  page.locator('.quantity-guide summary').click();expect(page.locator('.quantity-guide')).to_contain_text('proprietà misurabile')
  page.keyboard.press('Enter');assert page.evaluate('game.s.screen')=='hidden';page.keyboard.press('Enter');page.keyboard.press('p')
  state=page.evaluate('JSON.stringify({groups:game.s.groups,valid:game.s.valid,turn:game.s.turn,current:game.s.current,remaining:game.s.remaining})')
  page.keyboard.press('ArrowLeft');expect(page.get_by_role('heading',name='Domanda precedente')).to_be_visible();expect(page.locator('.review-answer.selected')).to_contain_text('RISPOSTA SCELTA')
  assert page.locator('.review-answer.selected').inner_text().startswith('ABCD'[chosen]+'. '+json.loads(question)['options'][chosen])
  page.keyboard.press('Escape');expect(page.locator('#dialog')).not_to_be_visible();assert page.evaluate('JSON.stringify({groups:game.s.groups,valid:game.s.valid,turn:game.s.turn,current:game.s.current,remaining:game.s.remaining})')==state
  # Review survives a reload and restores the exact displayed question.
  page.reload();page.get_by_role('button',name='Riprendi partita',exact=True).click();page.keyboard.press('ArrowLeft');expect(page.locator('.review-answer.selected')).to_contain_text(json.loads(question)['options'][chosen]);page.keyboard.press('Escape');expect(page.locator('#dialog')).not_to_be_visible()
  page.keyboard.press('i');expect(page.get_by_role('heading',name='Inventario Ammo',exact=True)).to_be_visible();page.keyboard.press('Escape');expect(page.locator('#dialog')).not_to_be_visible()
  # One sanction removes one heart from the board and from the character stage.
  page.keyboard.press('s');page.locator('#sanction-plus-0').click(timeout=3000);page.get_by_role('button',name='Conferma intervento',exact=True).click()
  expect(page.locator('.scoreboard [data-team="0"] .lives')).to_have_attribute('aria-label','2 vite su 3');expect(page.locator('[data-character-player="0"] .lives')).to_have_attribute('aria-label','2 vite su 3')
  page.keyboard.press('v');expect(page.get_by_role('heading',name='Riassegna punti',exact=True)).to_be_visible();page.get_by_role('button',name='Annulla',exact=True).click()
  page.keyboard.press('r');expect(page.get_by_role('heading',name='Richiesta di rifiuto',exact=True)).to_be_visible();page.get_by_role('button',name='Annulla',exact=True).click()
  page.keyboard.press('k');expect(page.locator('#message')).to_contain_text('Partita salvata')
  page.keyboard.press('o');assert page.locator('.game-options').get_attribute('open') is not None;page.keyboard.press('o');assert page.locator('.game-options').get_attribute('open') is None
  page.keyboard.press('f');page.wait_for_function('!!document.fullscreenElement');page.keyboard.press('f');page.wait_for_function('!document.fullscreenElement')
  page.evaluate('fitFoolViewport()');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1 && document.documentElement.scrollHeight<=innerHeight+1')
  page.screenshot(path=f'/tmp/fool-new-features-{w}.png')
  page.keyboard.press('p');page.keyboard.press('a');page.keyboard.press('Enter');page.keyboard.press('l');assert page.evaluate('game.s.suspended');page.keyboard.press('l');assert not page.evaluate('game.s.suspended')
  page.keyboard.press('h');expect(page.get_by_role('link',name='Riprendi partita',exact=True)).to_be_visible();checks.append({'viewport':[w,h],'notation_parts':count});page.close()
 # Deadline and final-screen outcomes retain an explicit chosen/no-answer label.
 page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'Fool.html')
 page.get_by_role('button',name='Inizia partita').click()
 page.evaluate('()=>{game.reveal();game.deadline=game.now()-1;game.tick();changed()}')
 expect(page.locator('.chosen-answer')).to_contain_text('Nessuna risposta scelta');expect(page.locator('.answer.selected')).to_have_count(0)
 page.evaluate('()=>{game.complete(game.s.respondent);changed()}');expect(page.locator('.final-answer')).to_contain_text('nessuna risposta scelta');page.close()
 assert not errors,errors
 browser.close();print(json.dumps({'experience':checks,'errors':errors}))
server.shutdown()
