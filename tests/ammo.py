"""Icon-only Ammo, touch/keyboard details, shared-life damage and safe reloads."""
import os,threading,json
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent;ART=ROOT/'artifacts';ART.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);errors=[];checks=[]
 for width,height,touch in [(1440,900,False),(390,844,True),(844,390,True)]:
  page=browser.new_page(viewport={'width':width,'height':height},has_touch=touch,reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'Fool.html?settings=1');expect(page.locator('#weight-ira')).to_have_value('5');expect(page.locator('.ammo-setting')).to_have_count(9)
  expect(page.locator('.ammo-setting').filter(has_text='Flagello')).to_have_count(0)
  icon=page.locator('.ammo-setting [data-ammo="ira"]');expect(icon).to_have_attribute('title','Flagello')
  if touch:icon.tap()
  else:icon.hover();icon.click()
  expect(page.locator('#ammo-info h2')).to_have_text('Flagello');expect(page.locator('#ammo-info .ammo-description')).to_contain_text('compreso chi lo evoca')
  page.locator('#ammo-info').get_by_role('button',name='Chiudi',exact=True).click()
  page.goto(base+'Fool.html?start=1');page.get_by_role('button',name='Inizia partita').click()
  page.evaluate('''()=>{const g=HellscapeUI.game;for(const type of Fool.TYPES)g.s.groups[g.s.owner].inventory.push({id:g.uid(),type,target:null,origin:'test'});for(let n=0;n<2;n++)g.s.groups[g.s.owner].inventory.push({id:g.uid(),type:'ira',target:null,origin:'test'});HellscapeUI.changed()}''')
  for use in range(3):
   if use>0:page.evaluate('''()=>{const g=HellscapeUI.game;g.s.groups[g.s.owner].inventory.push({id:g.uid(),type:'ira',target:null,origin:'new-turn-test'});HellscapeUI.changed()}''')
   page.get_by_role('button',name='Inventario',exact=True).click()
   expect(page.locator('#dialog .ammo-label')).to_have_count(0)
   expect(page.locator('#dialog [data-ammo="ira"]')).to_have_count(3 if use==0 else 1)
   if use==0:
    page.evaluate('document.fonts.ready');page.screenshot(path=str(ART/f'ammo-inventory-{width}.png'))
   item=page.locator('#dialog [data-ammo="ira"]').first
   if touch:item.tap()
   else:item.click()
   before=page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')
   expect(page.locator('#ammo-info h2')).to_have_text('Flagello')
   if use==0:
    page.screenshot(path=str(ART/f'ammo-divine-info-{width}.png'))
    page.keyboard.press('a');assert page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')==before
    page.locator('#ammo-info').get_by_role('button',name='Chiudi',exact=True).click()
    assert page.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')==before
    page.locator('#dialog [data-ammo="ira"]').first.click()
   page.locator('#ammo-info').get_by_role('button',name='Usa',exact=True).click()
   expect(page.locator('#dialog h2')).to_have_text('Attiva Flagello');expect(page.locator('.divine-targets li')).to_have_count(3)
   page.locator('#dialog').get_by_role('button',name='Conferma uso',exact=True).click()
   assert page.evaluate('HellscapeUI.game.s.groups.map(g=>g.sanctions)')==[0,0,0]
   assert page.evaluate('HellscapeUI.game.s.groups.map((g,i)=>Fool.remainingLives(HellscapeUI.game.s,i))')==[2-use]*3
   if use==0:
    page.screenshot(path=str(ART/f'ammo-divine-lives-{width}.png'))
    page.goto(base+'Fool.html?resume=1');assert page.evaluate('HellscapeUI.game.s.groups.map(g=>g.damage)')==[1,1,1]
  assert page.evaluate('HellscapeUI.game.s.phase')=='conclusa';assert page.evaluate('HellscapeUI.game.s.winner') is None
  # Opening and closing the information popup never consumes an item or resumes its inventory.
  page.goto(base+'Fool.html?start=1');page.get_by_role('button',name='Inizia partita').click()
  page.evaluate('''()=>{const g=HellscapeUI.game;g.s.groups[g.s.owner].inventory.push({id:g.uid(),type:'aura',target:null,origin:'test'});HellscapeUI.changed()}''')
  page.get_by_role('button',name='Svela e avvia il tempo').click();page.keyboard.press('i');remaining=page.evaluate('HellscapeUI.game.left()')
  page.locator('#dialog [data-ammo="aura"]').click();page.wait_for_timeout(120);assert page.evaluate('HellscapeUI.game.left()')==remaining
  page.keyboard.press('Escape');assert not page.evaluate('HellscapeUI.game.running');page.locator('#dialog').get_by_role('button',name='Chiudi',exact=True).click();assert page.evaluate('HellscapeUI.game.running')
  page.emulate_media(reduced_motion='no-preference')
  page.evaluate('HellscapeUI.changed()')
  page.locator('.answer').nth(page.evaluate('HellscapeUI.game.s.current.correct')).click()
  page.wait_for_timeout(150)
  page.screenshot(path=str(ART/f'sky-devils-{width}.png'))
  checks.append({'viewport':[width,height],'touch':touch,'shared_hit':'PASS','info_without_use':'PASS'});page.close()
 assert not errors,errors;browser.close();print(json.dumps({'ammo':checks,'errors':errors},indent=2))
server.shutdown()
