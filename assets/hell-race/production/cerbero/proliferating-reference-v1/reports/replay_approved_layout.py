"""Reproduce the approved static layout, not an integrated gameplay state."""
import argparse
import json
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

p = argparse.ArgumentParser()
p.add_argument('--repo', type=Path, required=True)
p.add_argument('--out', type=Path, required=True)
p.add_argument('--chromium', default='/usr/bin/chromium')
args = p.parse_args()
root = args.repo.resolve()
base = root / 'assets/hell-race/production/cerbero/proliferating-reference-v1'
layout = json.loads((base / 'layout/layout_v1.0.5_20261031.json').read_text())
args.out.mkdir(parents=True, exist_ok=False)

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(root)))
threading.Thread(target=server.serve_forever, daemon=True).start()
errors = []
try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=args.chromium, args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 1024, 'height': 768}, device_scale_factor=1)
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='domcontentloaded')
        page.set_content('<style>html,body{margin:0;background:#101010}canvas{display:block;width:1024px;height:768px}</style><canvas width="1024" height="768"></canvas>')
        for name in ['hell-layout.js', 'hell-motion.js', 'hell-bridge.js']:
            page.add_script_tag(path=str(root / 'assets' / name))
        page.evaluate('FoolBridge.load()')
        page.wait_for_function('()=>FoolBridge.ready()', timeout=30000)
        page.evaluate('''async layout => {
          const load = async path => { const im = new Image(); im.src = path; await im.decode(); return im; };
          const actor = await load(layout.actor.png);
          const car = await load(layout.car.png);
          const c = document.querySelector('canvas').getContext('2d');
          c.setTransform(1024/768,0,0,768/576,0,0);
          c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
          const time = layout.sceneTime, camera = {distance: time * FoolMotion.ROAD_SPEED};
          FoolBridge.environment(c,768,576,time); FoolBridge.draw(c,768,time,0,null,time);
          const a = layout.actor;
          c.drawImage(actor,a.left,a.top,actor.width*a.uniformScale,actor.height*a.uniformScale);
          const w = layout.car.width, h = w * car.height / car.width;
          for (const item of layout.car.instances) c.drawImage(car,item.x-w/2,item.ground-h,w,h);
          FoolBridge.front(c,768,camera);
        }''', layout)
        if errors:
            raise AssertionError(errors)
        page.locator('canvas').screenshot(path=str(args.out / 'approved-layout.png'))
        browser.close()
finally:
    server.shutdown()
print('Rendered approved static composition from unchanged reference and native bridge.')
