"""Keyboard answers share click transitions and cannot bypass pause, dialogs or typing."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import threading,sys,json
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent
if len(sys.argv)>1:base=sys.argv[1];launch={'proxy':{'server':'http://proxy:8080'}}
else:
 class Quiet(SimpleHTTPRequestHandler):
  def log_message(self,*args):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
 threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/';launch={}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],**launch);errors=[];checks=[]
 for fullscreen,bank,w,h in [(False,'termologia',1440,900),(True,'introduzione-fisica-misura',844,390)]:
  page=browser.new_page(viewport={'width':w,'height':h});page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base)
  if fullscreen:page.get_by_role('button',name='Schermo intero',exact=True).click();page.wait_for_function('!!document.fullscreenElement')
  page.get_by_role('link',name='Start',exact=True).click();view=page.frame_locator('#play-frame') if fullscreen else page
  expect(view.get_by_role('button',name='Inizia partita')).to_be_enabled();view.locator('#bank-choice').select_option(bank);expect(view.get_by_role('button',name='Inizia partita')).to_be_enabled()
  view.locator('#name0').fill('Gruppo A');view.locator('#name0').press('a');expect(view.locator('#name0')).to_have_value('Gruppo Aa')
  view.get_by_role('button',name='Inizia partita').click();frame=next(f for f in page.frames if 'Fool.html' in f.url)
  def option(name):
   if view.locator('.game-options').get_attribute('open') is None:view.get_by_text('Opzioni',exact=True).click()
   return view.get_by_role('button',name=name,exact=True)
  for i,key in enumerate(['a','B','c','D']):
   page.keyboard.press(key);assert frame.evaluate('game.s.screen')=='hidden'
   assert view.locator('[data-game-action=reveal]').get_attribute('aria-keyshortcuts')=='Enter'
   page.keyboard.down('Enter');page.keyboard.down('Enter');page.keyboard.up('Enter');assert frame.evaluate('game.s.screen')=='hidden' and not frame.evaluate('game.running')
   expect(view.get_by_role('button',name='Conferma e svela')).to_be_visible();page.keyboard.press('Enter');assert frame.evaluate('game.s.screen')=='answer' and frame.evaluate('game.running')
   frame.evaluate('fitFoolViewport()');assert frame.evaluate('document.documentElement.scrollHeight<=innerHeight+1 && document.documentElement.scrollWidth<=innerWidth+1')
   page.keyboard.press('Enter');page.keyboard.press('Control+a');assert frame.evaluate('game.s.valid')==i
   page.keyboard.press(key);assert frame.evaluate('game.s.result.option')==i and frame.evaluate('game.s.valid')==i+1
   page.keyboard.press('a');assert frame.evaluate('game.s.valid')==i+1
   assert view.locator('[data-game-action=next]').get_attribute('aria-keyshortcuts')=='Enter'
   page.keyboard.down('Enter');page.keyboard.down('Enter');page.keyboard.up('Enter')
   assert frame.evaluate('game.s.screen')=='hidden' and not frame.evaluate('game.running')
  page.keyboard.press('Enter');expect(view.get_by_role('button',name='Conferma e svela')).to_be_visible();page.keyboard.press('Enter');assert frame.evaluate('game.s.screen')=='answer' and frame.evaluate('game.running');option('Pausa').click();page.keyboard.press('a');assert frame.evaluate('game.s.valid')==4
  option('Sanzioni').click();page.keyboard.press('a');page.keyboard.press('Enter');assert frame.evaluate('game.s.valid')==4
  # Enter may act on the dialog's focused button, but never submits a question.
  if view.locator('#dialog').is_visible():view.get_by_role('button',name='Chiudi senza sanzionare').click()
  option('Riprendi timer').click()
  frame.evaluate('()=>{const e=document.createElement("input");e.id="typing-test";document.querySelector("main").append(e);e.focus()}')
  page.keyboard.press('a');page.keyboard.press('Enter');assert frame.evaluate('game.s.valid')==4
  frame.evaluate('()=>{document.getElementById("typing-test").remove();const e=document.createElement("p");e.id="typing-test";e.contentEditable="true";document.querySelector("main").append(e);e.focus()}')
  page.keyboard.press('b');page.keyboard.press('Enter');assert frame.evaluate('game.s.valid')==4
  frame.evaluate('document.getElementById("typing-test").remove()')
  # Held keys and composition events must not submit a fresh question.
  frame.evaluate('document.body.dispatchEvent(new KeyboardEvent("keydown",{key:"a",repeat:true,bubbles:true,cancelable:true}))');assert frame.evaluate('game.s.valid')==4
  frame.evaluate('document.body.dispatchEvent(new KeyboardEvent("keydown",{key:"b",isComposing:true,bubbles:true,cancelable:true}))');assert frame.evaluate('game.s.valid')==4
  page.keyboard.press('a');assert frame.evaluate('game.s.valid')==5
  # Keep native Enter activation for other focused controls.
  option('Sanzioni').focus();page.keyboard.press('Enter');expect(view.locator('#dialog')).to_be_visible();view.get_by_role('button',name='Chiudi senza sanzionare').click()
  view.locator('.question-points').click();page.keyboard.press('Enter');assert frame.evaluate('game.s.screen')=='hidden'
  frame.goto(frame.url);view.get_by_role('button',name='Riprendi partita',exact=True).click();page.keyboard.press('Enter');expect(view.get_by_role('button',name='Conferma e svela')).to_be_visible();page.keyboard.press('Enter');assert frame.evaluate('game.s.screen')=='answer' and frame.evaluate('game.running');page.keyboard.press('d');assert frame.evaluate('game.s.valid')==6
  page.keyboard.press('Enter');frame.evaluate('()=>{game.bell();changed()}');page.keyboard.press('a');page.keyboard.press('Enter');assert frame.evaluate('game.s.suspended')
  frame.evaluate('()=>{game.continueSession();game.openSanctions();game.s.panel.counts=[3,3,3];game.closeSanctions(true);changed()}');page.keyboard.press('a');page.keyboard.press('Enter');assert frame.evaluate('game.s.phase')=='conclusa'
  frame.evaluate('fitFoolViewport()');assert frame.evaluate('document.documentElement.scrollHeight<=innerHeight+1')
  checks.append({'fullscreen':fullscreen,'bank':bank,'size':[w,h]});page.close()
 assert not errors,errors;browser.close();print(json.dumps({'keyboard_cases':checks,'errors':errors}))
if 'server' in globals():server.shutdown()
