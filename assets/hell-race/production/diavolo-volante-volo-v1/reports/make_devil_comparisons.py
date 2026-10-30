from pathlib import Path
from PIL import Image, ImageDraw
import json

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'reports/gifs'
OUT.mkdir(exist_ok=True)
A = ROOT / 'candidates/001_design_A_v1.png'
B = ROOT / 'candidates/002_posa_B_v1.png'
A2 = ROOT / 'candidates/003_design_A_v2.png'

def frame(path, offset, label):
    # Only rigid whole-image translation, common padding, uniform 50% display scale.
    # These are diagnostic comparisons, not synthesized animation poses.
    bg = Image.new('RGBA', (1536, 1100), '#24252a')
    d = ImageDraw.Draw(bg)
    for y in range(0, 1100, 32):
        for x in range(0, 1536, 32):
            if (x//32 + y//32) % 2:
                d.rectangle((x,y,x+31,y+31), fill='#303138')
    im = Image.open(path).convert('RGBA')
    bg.alpha_composite(im, (offset[0], offset[1]+40))
    bg = bg.convert('RGB').resize((768,550), Image.Resampling.LANCZOS)
    d = ImageDraw.Draw(bg)
    d.rectangle((0,0,767,29), fill='#14161b')
    d.text((12,9), label, fill='#f1eee8')
    return bg.quantize(colors=256)

items = [
 ('confronto_A_B_respinta_v1.gif', [(A,(0,0),'A v1 - riferimento precedente'),(B,(0,60),'B v1 RESPINTA - ali allungate; offset Y +60 stimato')]),
 ('confronto_A_v1_A_v2.gif', [(A,(0,0),'A v1 - membrane precedenti'),(A2,(0,14),'A v2 CANDIDATA - membrane forate; offset Y +14 stimato')]),
]
meta=[]
for name, inputs in items:
    frames=[frame(*v) for v in inputs]
    target=OUT/name
    frames[0].save(target,save_all=True,append_images=frames[1:],duration=[650,650],loop=0,disposal=2,optimize=False)
    with Image.open(target) as check:
        assert check.n_frames == 2
        assert check.size == (768,550)
        durations=[]
        for i in range(check.n_frames):
            check.seek(i)
            durations.append(check.info['duration'])
        assert durations == [650,650]
    meta.append({'file':name,'inputs':[{'path':str(p.relative_to(ROOT)),'offset':o,'label':l} for p,o,l in inputs],'size':[768,550],'durations_ms':durations,'loop_ms':1300,'scale':0.5,'landmarks':'manual visual estimates; diagnostic registration, not certified anatomical alignment','type':'local PNG comparison, not browser/game recording'})
(OUT/'gif-metadata.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps(meta))
