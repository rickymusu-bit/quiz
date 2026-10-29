"""Omen rules, HUD, rotation and offline integration."""
from omen_support import ROOT, ART, server, base, fixture, layout, select, confirm
from playwright.sync_api import sync_playwright, expect
import os, json
errors=[];report=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
  for offline,w,h,dpr in [(False,1440,900,1),(False,844,390,2),(False,667,375,1),(False,568,320,2),(True,844,390,2)]:
   q=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=dpr,reduced_motion='reduce',has_touch=w<1000)
   q.on('pageerror',lambda e:errors.append(str(e)));q.add_init_script('Math.random=()=>.25')
   q.goto(base+('dist/Hellscape-offline.html' if offline else 'Fool.html?start=1'))
   v=q.frames[1] if offline else q
   if offline:v.get_by_role('link',name='Nuova partita',exact=True).click()
   v.get_by_role('button',name='Inizia partita',exact=False).click()
   v.get_by_role('button',name='Svela e avvia il tempo').wait_for()
   q.wait_for_timeout(300);fixture(v);q.evaluate('document.fonts.ready')
   layout(v,w,h);q.screenshot(path=str(ART/f'hud-{w}-{offline}.png'))
   s=fixture(v)
   # Expand by the summary (keyboard-native details), then preserve on rerender/rotation.
   v.locator('.player-window summary').first.evaluate('e=>e.parentElement.open=true');q.wait_for_timeout(50)
   assert v.locator('.hud-inventory').first.is_visible()
   v.evaluate('HellscapeUI.changed()');q.wait_for_timeout(50);assert v.locator('.player-window').first.get_attribute('open') is not None
   v.locator('.player-window summary').first.evaluate('e=>e.parentElement.open=false');q.wait_for_timeout(50)
   select(v,'salta',s['target']);expect(v.locator('.chains-preview')).to_contain_text('110');confirm(v)
   q.wait_for_timeout(2300);assert v.evaluate('Fool.exact(HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].score)')=='890'
   # A fresh fixture avoids consuming the target's first poisoned turn via this Catene.
   v.evaluate('HellscapeUI.game.s.effects=[]');fixture(v)
   select(v,'arsenico',s['target']);confirm(v);q.wait_for_timeout(2300)
   assert v.evaluate('HellscapeUI.game.s.owner')==s['target']
   assert v.evaluate('Fool.exact(HellscapeUI.game.s.groups[HellscapeUI.game.s.owner].score)')=='890'
   expect(v.locator('.turn-order')).to_contain_text('Arsenico: 2 turni rimanenti')
   layout(v,w,h);q.screenshot(path=str(ART/f'arsenico-{w}-{offline}.png'))
   v.get_by_role('button',name='Inventario',exact=True).click();expect(v.locator('#dialog')).not_to_contain_text('Ammo');q.screenshot(path=str(ART/f'inventory-{w}-{offline}.png'));v.get_by_role('button',name='Chiudi',exact=True).click()
   before=v.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')
   q.set_viewport_size({'width':h,'height':w});q.wait_for_timeout(150);expect(v.locator('#orientation-note')).to_be_visible()
   q.keyboard.press('a');assert v.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')==before
   q.set_viewport_size({'width':w,'height':h});q.wait_for_timeout(150)
   # Restore is inert: no extra poison application and no automatic timer.
   v.evaluate('''()=>{const g=HellscapeUI.game;g.s=Fool.Game.restore(g.snapshot()).s;HellscapeUI.changed()}''')
   assert v.evaluate('JSON.stringify(HellscapeUI.game.snapshot())')==before
   dock=v.locator('.operation-body').bounding_box()
   v.get_by_role('button',name='Svela e avvia il tempo').click();q.wait_for_timeout(100);layout(v,w,h)
   opened=v.locator('.operation-body').bounding_box()
   assert abs((dock['y']+dock['height'])-(opened['y']+opened['height']))<2
   assert opened['y']<dock['y'],(dock,opened)
   if w<1000:
    owner=v.evaluate('HellscapeUI.game.s.owner');q.keyboard.press('a');assert v.evaluate('HellscapeUI.game.s.screen')=='answer'
   v.locator('.answer').nth(v.evaluate('(HellscapeUI.game.s.current.correct+1)%4')).click();q.wait_for_timeout(2300);layout(v,w,h)
   if h<600:
    v.get_by_role('button',name='Dettagli esito',exact=True).click();expect(v.locator('#dialog')).to_contain_text('Risposta errata');v.get_by_role('button',name='Chiudi',exact=True).click()
   report.append({'offline':offline,'viewport':[w,h],'dpr':dpr,'rules':'PASS','overflow':'PASS','restore':'PASS','rotation':'PASS'})
   q.close()
  browser.close()
finally:server.shutdown()
assert not errors,errors
(ART/'report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
