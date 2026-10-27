"""Audit real offline renderings at DPR 1/2. Does not alter production code.

Run: node scripts/build.cjs --quality-preview && python3 tests/visual_quality.py
Screenshots and measured (not HTML-declared) dimensions go to artifacts/quality/.
Use --quick for just desktop and Android portrait.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import json
import os
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / 'artifacts/quality'
ART.mkdir(parents=True, exist_ok=True)
HTML = (ROOT / 'dist/Hellscape-review.html').read_text()
VIEWPORTS = [(1920, 1080), (1366, 768), (1024, 768), (844, 390), (390, 844)]
if '--quick' in sys.argv:
    VIEWPORTS = [(1366, 768), (390, 844)]

METRICS = """() => [...document.querySelectorAll('img,canvas,button,a,h1,h2,.ammo-round,.heart,.time-vial,.question,.subtitle')].filter(el => {
  const r=el.getBoundingClientRect(),s=getComputedStyle(el);
  return r.width && r.height && s.display!=='none' && s.visibility!=='hidden';
}).map(el => {
  const r=el.getBoundingClientRect(),s=getComputedStyle(el);
  return {tag:el.tagName,selector:el.className||el.id,text:el.alt||el.textContent.slice(0,70),
    intrinsic:el.tagName==='IMG'?[el.naturalWidth,el.naturalHeight]:el.tagName==='CANVAS'?[el.width,el.height]:null,
    css:[r.x,r.y,r.width,r.height],physical:[r.width*devicePixelRatio,r.height*devicePixelRatio],
    rendering:s.imageRendering,filter:s.filter,font:s.font,fontSize:s.fontSize,
    source:el.getAttribute('src')?.startsWith('data:')?'embedded':el.getAttribute('src'),background:s.backgroundImage.replace(/data:[^\"]+/g,'embedded')};
})"""

inventory = []
for path in sorted((ROOT / 'assets').rglob('*')):
    if path.suffix in ['.png', '.webp']:
        with Image.open(path) as image:
            inventory.append({'path':str(path.relative_to(ROOT)), 'intrinsic':list(image.size),
                              'mode':image.mode, 'bytes':path.stat().st_size})
report = {'revision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
          'assets':inventory,'renders':[],'external_requests':[],'errors':[]}

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
    for dpr in [1, 2]:
        context = browser.new_context(viewport={'width':VIEWPORTS[0][0],'height':VIEWPORTS[0][1]},device_scale_factor=dpr,
                                      offline=True,reduced_motion='reduce')
        context.add_init_script('Math.random=()=>.25')
        def route(r):
            if r.request.url == 'http://quality.test/preview':
                r.fulfill(content_type='text/html',body=HTML)
            else:
                report['external_requests'].append(r.request.url)
                r.abort()
        context.route('**/*',route)
        page = context.new_page()
        page.set_default_navigation_timeout(120000)
        page.on('pageerror',lambda error:report['errors'].append(str(error)))
        page.goto('http://quality.test/preview')
        page.locator('#quality-tools').evaluate('(el)=>el.style.display="none"')
        for width, height in VIEWPORTS:
            page.set_viewport_size({'width':width,'height':height})
            prefix = f'{width}x{height}-dpr{dpr}'
            for scenario in ['home','selezione','quiz','ammo','ultima','spareggio','portale','vittoria','gameover','regole']:
                if scenario == 'ammo':
                    f = page.frames[1]
                    f.get_by_role('button',name='Inventario',exact=True).click() if f.get_by_role('button',name='Inventario',exact=True).is_visible() else None
                    if not f.locator('dialog[open]').count():
                        f.locator('.turn-order button').first.click()
                else:
                    page.evaluate('(key)=>HellscapeQuality.show(key)',scenario)
                f = page.frames[1]
                f.evaluate('async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))}')
                page.wait_for_timeout(120)
                if scenario in ['home','selezione','regole']:
                    logo = f.locator('.home-wordmark,.hellscape-logo')
                    assert logo.evaluate('(i)=>i.naturalWidth') == 2172
                    assert logo.evaluate('(i)=>getComputedStyle(i).imageRendering') == 'auto'
                    assert not f.locator('.pixel-wordmark').count()
                if scenario == 'quiz':
                    assert f.evaluate('HellscapeUI.game.s.phase') == 'ordinaria'
                    assert not f.evaluate('HellscapeUI.game.running')
                if scenario == 'spareggio':
                    assert f.evaluate('HellscapeUI.game.s.phase') == 'pareggio'
                    assert f.evaluate('HellscapeUI.game.s.screen') == 'hidden'
                    assert not f.evaluate('HellscapeUI.game.running')
                    assert f.locator('.turn-order .heart:not(.lost)').count() == 3
                if scenario == 'portale':
                    assert f.locator('.hell-race-final').get_attribute('data-ending-phase') == 'escape'
                if scenario in ['vittoria','gameover']:
                    assert f.locator('.hell-race-final').get_attribute('data-ending-phase') == 'done'
                    assert f.locator('.final-title').is_visible()
                    assert f.locator('.end-wordmark').evaluate('(i)=>i.complete && i.naturalWidth>0')
                page.screenshot(path=str(ART/f'{scenario}-{prefix}.png'),animations='allow')
                report['renders'].append({'scenario':scenario,'viewport':[width,height],'dpr':dpr,
                                          'metrics':f.evaluate(METRICS)})
                if scenario == 'home' and width in [1366,390]:
                    f.locator('.home-wordmark').screenshot(path=str(ART/f'logo-{width}-dpr{dpr}.png'))
            # Uniform scaling remains stable through an orientation change/fullscreen.
            page.evaluate("HellscapeQuality.show('home')")
            f = page.frames[1]
            page.set_viewport_size({'width':height,'height':width})
            page.wait_for_timeout(150)
            subject = '.home-heading' if f.evaluate('document.body.dataset.layout') == 'compact' else '#viewport-stage'
            r = f.locator(subject).bounding_box()
            assert abs(r['width']/r['height'] - 4/3) < .001
            page.set_viewport_size({'width':width,'height':height})
            f.get_by_role('button',name='Schermo intero',exact=True).click()
            page.wait_for_timeout(150)
            assert f.evaluate('!!document.fullscreenElement')
            subject = '.home-heading' if f.evaluate('document.body.dataset.layout') == 'compact' else '#viewport-stage'
            r = f.locator(subject).bounding_box()
            assert abs(r['width']/r['height'] - 4/3) < .001
            f.evaluate('document.exitFullscreen()')
            (ART/'measurements.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
            print('PASS offline visual audit',width,height,'DPR',dpr,flush=True)
        context.close()
    browser.close()
assert not report['errors'],report['errors']
assert not report['external_requests'],report['external_requests']
(ART/'measurements.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('PASS:',len(report['renders']),'rendered scenarios, original logos, no external requests or JS errors')
