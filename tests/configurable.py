import os
"""Configurable questions, independent awards, repeated uses and legacy settings."""
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
def fits(frame):
 frame.evaluate('window.fitFoolViewport?.()');assert frame.evaluate('document.documentElement.scrollHeight<=innerHeight+1 && document.documentElement.scrollWidth<=innerWidth+1')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'],**launch);errors=[];checks=[]
 for bank,width,height in [('termologia',1440,900),('introduzione-fisica-misura',844,390)]:
  page=b.new_page(viewport={'width':width,'height':height});page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'Fool.html?settings=1');expect(page.get_by_role('heading',name='Impostazioni',exact=True)).to_be_visible();expect(page.locator('#question-count')).to_be_visible()
  page.locator('#bank-choice').select_option(bank);expect(page.locator('#question-count')).to_have_value('33');expect(page.locator('#weight-marx')).to_have_value('15');expect(page.locator('#weight-ira')).to_have_value('5');fits(page)
  for count in [3,6,99]:
   page.locator('#question-count').fill(str(count));page.locator('#seconds').click()
   assert sum(page.locator('#quotas input').evaluate_all('(els)=>els.map(e=>Number(e.value))'))==count
   for kind in ['salta','ruba','svela','aura','karma','marx','ira','arsenico','sacrificio']:page.locator('#weight-'+kind).fill('100')
   page.get_by_role('button',name='Salva impostazioni').click();expect(page.locator('#message')).to_contain_text('Impostazioni salvate');fits(page)
   expect(page.get_by_role('button',name='Anteprima',exact=True)).to_have_count(0)
   expect(page.locator('#teacher-preview')).to_have_count(0)
   page.goto(base+'Fool.html');page.locator('#bank-choice').select_option(bank)
   page.get_by_role('button',name=f'Inizia partita ({count} domande)',exact=True).click()
   assert page.evaluate('HellscapeUI.game.s.config.questionCount')==count
   assert page.evaluate('HellscapeUI.game.s.queue.length')==count-1
   fits(page)
   page.goto(base+'Fool.html?settings=1');page.locator('#bank-choice').select_option(bank)
  stored=page.evaluate('localStorage.getItem("fool-settings-v1")');page.locator('#question-count').fill('4');page.locator('#seconds').click();page.get_by_role('button',name='Salva impostazioni').click();assert page.evaluate('localStorage.getItem("fool-settings-v1")')==stored
  page.locator('#question-count').fill('3');page.locator('#seconds').click();page.get_by_role('button',name='Salva impostazioni').click()
  page.goto(base+'Fool.html');page.locator('#bank-choice').select_option(bank);expect(page.get_by_role('button',name='Inizia partita (3 domande)',exact=True)).to_be_enabled();page.get_by_role('button',name='Inizia partita (3 domande)',exact=True).click()
  assert page.evaluate('HellscapeUI.game.s.config.questionCount')==3 and page.evaluate('HellscapeUI.game.s.queue.length')==2
  page.get_by_role('button',name='Svela e avvia il tempo').click();assert page.get_by_role('button',name='Inventario',exact=True).count()==0
  page.locator('.answer').nth(page.evaluate('HellscapeUI.game.s.current.correct')).click();assert page.evaluate('HellscapeUI.game.s.result.bonuses.length')==9
  for kind in ['salta','ruba','svela','aura','karma','marx','ira','arsenico','sacrificio']:expect(page.locator(f'.solution .ammo-round[data-ammo="{kind}"]')).to_have_count(1)
  expect(page.locator('.answer-feedback')).to_have_count(0)
  assert page.locator('.multiplier-value').count()==0
  team=page.evaluate('HellscapeUI.game.s.result.respondent')
  page.locator(f'.turn-order [data-team="{team}"]').click()
  assert page.locator('.bonus-inventory-list .bonus-group').count()==7
  page.get_by_role('button',name='Successivi',exact=True).click();expect(page.locator('.bonus-inventory-list [data-ammo="arsenico"]')).to_have_count(1);expect(page.locator('.bonus-inventory-list [data-ammo="sacrificio"]')).to_have_count(1)
  page.get_by_role('button',name='Precedenti',exact=True).click()
  assert 'ammo-relics-v1.webp' in page.locator('#dialog [data-ammo=salta]').first.evaluate('(el)=>getComputedStyle(el).backgroundImage')
  assert page.evaluate('HellscapeUI.game.s.groups[HellscapeUI.game.s.result.respondent].inventory.length')==9
  page.get_by_role('button',name='Chiudi',exact=True).click()
  page.get_by_role('button',name='Prossima domanda',exact=True).click()
  page.evaluate('()=>{for(let n=0;n<2;n++)HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].inventory.push({id:HellscapeUI.game.uid(),type:"aura",target:null,origin:"test"});HellscapeUI.changed()}')
  current=page.evaluate('HellscapeUI.game.s.owner')
  assert page.evaluate('HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].inventory.filter(c=>c.type==="aura").length')==2
  page.get_by_role('button',name='Inventario',exact=True).click()
  page.locator('.bonus-group[data-bonus="aura"] .ammo-round').first.click();page.locator('#ammo-info').get_by_role('button',name='Usa',exact=True).click();page.get_by_role('button',name='Conferma uso').click()
  assert page.evaluate('HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].aura')==3
  page.get_by_role('button',name='Inventario',exact=True).click();page.locator('.bonus-group[data-bonus="aura"] .ammo-round').first.click()
  expect(page.locator('#ammo-info').get_by_role('button',name='Usa',exact=True)).to_be_disabled()
  assert page.evaluate('HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].inventory.filter(c=>c.type==="aura").length')==1
  page.locator('#ammo-info').get_by_role('button',name='Chiudi',exact=True).click();page.locator('#dialog').get_by_role('button',name='Chiudi',exact=True).click()
  assert page.evaluate('HellscapeUI.game.s.usedBonus')
  page.goto(base+'Fool.html?resume=1');assert page.evaluate('HellscapeUI.game.s.valid')==1;fits(page)
  # A legacy short match without an explicit confirmation must restart at 33.
  page.evaluate('''()=>{const data=JSON.parse(localStorage.getItem("fool-settings-v1"));for(const v of Object.values(data.profiles)){v.questionCount=3;delete v.questionCountConfirmed;const keys=Object.keys(v.quotas);v.quotas=Object.fromEntries(keys.map((key,i)=>[key,i===0?3:0]));}localStorage.setItem("fool-settings-v1",JSON.stringify(data))}''')
  page.goto(base+'Fool.html?start=1');page.locator('#bank-choice').select_option(bank)
  expect(page.get_by_role('button',name='Inizia partita (33 domande)',exact=True)).to_be_visible()
  page.get_by_role('button',name='Inizia partita (33 domande)',exact=True).click()
  assert page.evaluate('HellscapeUI.game.s.phase')=='ordinaria' and page.evaluate('HellscapeUI.game.s.valid')==0
  assert page.evaluate('HellscapeUI.game.s.config.questionCount')==33 and page.evaluate('HellscapeUI.game.s.queue.length')==32
  # A legacy settings profile with one probability still opens and starts with defaults.
  page.evaluate('()=>{const data=JSON.parse(localStorage.getItem("fool-settings-v1"));for(const v of Object.values(data.profiles)){delete v.questionCount;delete v.bonusWeights;v.probability=90;v.seconds=60;v.quotas=Object.fromEntries(Object.keys(v.quotas).map(t=>[t,0]));let left=33;while(left)for(const t in v.quotas)if(left){v.quotas[t]++;left--}}localStorage.setItem("fool-settings-v1",JSON.stringify(data))}')
  page.goto(base+'Fool.html?settings=1');page.locator('#bank-choice').select_option(bank);expect(page.locator('#seconds')).to_have_value('60');expect(page.locator('#question-count')).to_have_value('33')
  for kind in ['salta','ruba','svela','aura','karma']:expect(page.locator('#weight-'+kind)).to_have_value('30')
  expect(page.locator('#weight-marx')).to_have_value('15');expect(page.locator('#weight-ira')).to_have_value('5');expect(page.locator('#weight-arsenico')).to_have_value('30');expect(page.locator('#weight-sacrificio')).to_have_value('5')
  page.goto(base+'Fool_regole.html')
  for section in range(23):page.locator('#section').select_option(str(section));fits(page)
  checks.append({'bank':bank,'size':[width,height],'counts':[3,6,99],'awards':9,'uses':1,'second_sigillo':'blocked'});page.close()
 assert not errors,errors;b.close();print(json.dumps({'configurable':checks,'errors':errors}))
if 'server' in globals():server.shutdown()
