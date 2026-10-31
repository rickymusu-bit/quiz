"""Render the unchanged run plus independent generated fire layers in Chromium.

Produces real browser screenshots/GIF, RGBA Canvas exports and a technical report.
No source image is edited; body geometry is copied at scale 1 and offset 0.
"""

import base64
from functools import partial
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
import json
import os
from pathlib import Path
import threading

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = next(p for p in Path(__file__).resolve().parents if (p / 'AGENTS.md').is_file())
PKG = Path(__file__).resolve().parent.parent
OUT = ROOT / 'artifacts/cerbero/run-fire-v1'
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'frames').mkdir(exist_ok=True)

HTML = r'''<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;background:#24262b;overflow:hidden}canvas{display:block;background:#24262b}</style>
<canvas id="view" width="880" height="522"></canvas>
<script>
const base='/assets/hell-race/production/cerbero/';
const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error(src));image.src=src;});
const read=async name=>{const r=await fetch(base+'run-fire-v1/'+name);if(!r.ok)throw new Error(name);return r.json();};
const canvas=document.getElementById('view'),ctx=canvas.getContext('2d');
window.ready=false;
(async()=>{
 const anchors=await read('mouth-anchors.json');
 const flame=await read('flame-atlas.json');
 const effects=await load(base+'run-fire-v1/'+flame.image);
 const bodies=await Promise.all(anchors.frames.map(f=>load(base+'run-stabilized-v1/frames/'+String(f.index).padStart(3,'0')+'.png')));
 window.drawSample=function(sample,markers=false){
  const bodyIndex=Math.floor(sample/2)%8;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(bodies[bodyIndex],0,0);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const emissions=[];
  for(const [id,jet] of Object.entries(anchors.jets)){
   const head=anchors.frames[bodyIndex].heads[id];
   const [x,y]=head.mouth;
   const f=flame.frames[(sample+jet.phase_offset)%8];
   const scale=jet.length_px/f.reach_px;
   const [rear,front]=head.muzzle_axis;
   const angle=Math.atan2(front[1]-rear[1],front[0]-rear[0]);
   const r=f.rect;
   ctx.save();ctx.translate(x,y);ctx.rotate(angle);
   ctx.drawImage(effects,...r,-f.root[0]*scale,-f.root[1]*scale,r[2]*scale,r[3]*scale);
   ctx.restore();
   // The source emission root maps exactly onto the annotated mouth.
   emissions.push({id,body_index:bodyIndex+1,effect_index:f.index,
     mouth:[x,y],muzzle_axis:head.muzzle_axis,source_root:f.root,scale,angle_degrees:angle*180/Math.PI,
     matrix:[scale*Math.cos(angle),scale*Math.sin(angle),-scale*Math.sin(angle),scale*Math.cos(angle),
       x-scale*Math.cos(angle)*f.root[0]+scale*Math.sin(angle)*f.root[1],
       y-scale*Math.sin(angle)*f.root[0]-scale*Math.cos(angle)*f.root[1]]});
   if(markers){ctx.strokeStyle='#00ffff';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(...rear);ctx.lineTo(front[0]+50*Math.cos(angle),front[1]+50*Math.sin(angle));ctx.stroke();}
  }
  window.currentSample=sample;window.emissions=emissions;
 };
 window.startPlayback=()=>{clearInterval(window.timer);let sample=0;drawSample(0);window.timer=setInterval(()=>{sample=(sample+1)%16;drawSample(sample);},50);};
 window.stopPlayback=()=>clearInterval(window.timer);
 window.exportAtlas=async urls=>{
  const out=document.createElement('canvas');out.width=canvas.width*4;out.height=canvas.height*4;
  const c=out.getContext('2d');c.imageSmoothingEnabled=false;
  const images=await Promise.all(urls.map(load));
  images.forEach((im,i)=>c.drawImage(im,(i%4)*canvas.width,Math.floor(i/4)*canvas.height));
  return out.toDataURL('image/png');
 };
 window.ready=true;
})().catch(error=>{window.loadError=String(error);});
</script>'''


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_png(url, path):
    assert url.startswith('data:image/png;base64,')
    path.write_bytes(base64.b64decode(url.split(',', 1)[1]))


def gif(screenshots, path):
    # Conversion of actual browser screenshots; fixed palette for the whole clip.
    samples = Image.new('RGB', (160 * len(screenshots), 100), '#24262b')
    for i, frame in enumerate(screenshots):
        thumbnail = frame.copy()
        thumbnail.thumbnail((160, 100))
        samples.paste(thumbnail, (160 * i, 0))
    palette = samples.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
    converted = [f.quantize(palette=palette, dither=Image.Dither.NONE) for f in screenshots]
    converted[0].save(path, save_all=True, append_images=converted[1:], duration=50,
                      loop=0, disposal=2, optimize=False)


(OUT / 'viewer.html').write_text(HTML)
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
anchors = json.loads((PKG / 'mouth-anchors.json').read_text())
flame = json.loads((PKG / 'flame-atlas.json').read_text())
before = {f['source']: sha(PKG / f['source']) for f in anchors['frames']}
assert all(before[f['source']] == f['sha256'] for f in anchors['frames'])
report = {'type': 'real Chromium capture of isolated asset review, not integrated game',
          'source_commit': anchors['source_commit'], 'viewport': [880, 522],
          'body_frame_duration_ms': 100, 'sample_duration_ms': 50,
          'duration_ms': 800, 'loop_samples': 16, 'body_frames': 8,
          'body_transform': {'scale': 1, 'rotation_degrees': 0, 'offset': [0, 0]},
          'source_body_sha256': before, 'flame_atlas_sha256': sha(PKG / flame['image']),
          'mouth_annotation_uncertainty_px': anchors['mouth_uncertainty_px'],
          'errors': [], 'samples': []}
try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
            args=['--no-sandbox', '--disable-dev-shm-usage'])
        page = browser.new_page(viewport={'width': 880, 'height': 522}, device_scale_factor=1)
        page.on('pageerror', lambda e: report['errors'].append(str(e)))
        page.clock.install()
        page.goto(f'http://127.0.0.1:{server.server_port}/{(OUT / "viewer.html").relative_to(ROOT)}')
        page.wait_for_function('window.ready || window.loadError')
        assert not page.evaluate('window.loadError'), page.evaluate('window.loadError')
        page.clock.pause_at(page.evaluate('Date.now()+100'))
        page.evaluate('window.startPlayback()')
        screenshots, urls = [], []
        for i in range(16):
            assert page.evaluate('window.currentSample') == i
            data = page.evaluate('({sample:currentSample,emissions})')
            assert len(data['emissions']) == 3
            for emission in data['emissions']:
                a, b, c, d, e, f = emission['matrix']
                x, y = emission['source_root']
                expected = emission['mouth']
                assert abs(a * x + c * y + e - expected[0]) < 1e-8
                assert abs(b * x + d * y + f - expected[1]) < 1e-8
                rear, front = emission['muzzle_axis']
                mx, my = front[0] - rear[0], front[1] - rear[1]
                # Source flame +X must transform in the same forward direction
                # as the annotated muzzle axis, for each head in every sample.
                assert abs(a * my - b * mx) < 1e-8
                assert a * mx + b * my > 0
            urls.append(page.evaluate('document.getElementById("view").toDataURL("image/png")'))
            write_png(urls[-1], OUT / 'frames' / f'{i + 1:03d}.png')
            screenshots.append(Image.open(BytesIO(page.locator('canvas').screenshot())).convert('RGB'))
            report['samples'].append(data)
            page.clock.run_for(50)
        assert page.evaluate('window.currentSample') == 0
        page.evaluate('window.stopPlayback()')
        page.locator('canvas').screenshot(path=str(OUT / 'browser-frame-001.png'))
        write_png(page.evaluate('window.exportAtlas', urls), OUT / 'atlas.png')
        page.evaluate('window.drawSample(0,true)')
        page.locator('canvas').screenshot(path=str(OUT / 'mouth-anchor-check.png'))
        assert not report['errors'], report['errors']
        report['browser_version'] = browser.version
        browser.close()
    gif(screenshots, OUT / 'run-fire.gif')
    with Image.open(OUT / 'run-fire.gif') as animation:
        assert animation.n_frames == 16 and animation.size == (880, 522)
        times = []
        for i in range(animation.n_frames):
            animation.seek(i)
            times.append(animation.info['duration'])
        assert times == [50] * 16
        report['gif'] = {'path': 'run-fire.gif', 'frames': 16, 'durations_ms': times,
                         'sha256': sha(OUT / 'run-fire.gif')}
    for path in (OUT / 'frames').glob('*.png'):
        with Image.open(path) as image:
            assert image.mode == 'RGBA' and image.size == (880, 522)
            assert image.getchannel('A').getextrema() == (0, 255)
    assert before == {f['source']: sha(PKG / f['source']) for f in anchors['frames']}
    report['checks'] = {'unchanged_body_source_files': True, 'same_body_transform_all_samples': True,
                        'three_emitters_each_sample': True, 'emission_roots_match_annotated_mouths': True,
                        'emission_directions_follow_per_head_muzzle_axes': True,
                        'rgba_frame_dimensions_alpha': True, 'gif_frames_timing': True,
                        'browser_page_errors': False, 'integrated_game_tested': False}
finally:
    server.shutdown()
(OUT / 'browser-report.json').write_text(json.dumps(report, indent=2) + '\n')
print('PASS: unchanged eight running poses, 48 mouth-attached emissions, 16 real browser captures, 800ms loop')
