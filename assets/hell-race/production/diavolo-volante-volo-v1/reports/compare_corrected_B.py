from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
from scipy.signal import correlate
import json,hashlib

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'reports/gifs'
A_PATH=ROOT/'candidates/001_design_A_v1.png'
B_PATH=ROOT/'candidates/004_posa_B_v2.png'
A=Image.open(A_PATH).convert('RGBA');B=Image.open(B_PATH).convert('RGBA')
# Registration uses only the central body, excluding the moving wings.
# Similarity registration is a packing operation, not an anatomical deformation.
smallA=A.resize((768,512),Image.Resampling.LANCZOS)
ta=np.array(smallA)[200:390,335:440]
mask=(ta[:,:,3]>128).astype(np.float32)
t=np.dot(ta[:,:,:3],[.2126,.7152,.0722]).astype(np.float32)
weight=mask.sum(); tsum=(t*mask).sum(); tvar=(t*t*mask).sum()-tsum*tsum/weight
best=None
for scale in np.arange(.80,1.011,.005):
    im=B.resize((round(768*scale),round(512*scale)),Image.Resampling.LANCZOS)
    ar=np.array(im);g=np.dot(ar[:,:,:3],[.2126,.7152,.0722]).astype(np.float32)
    g=np.where(ar[:,:,3]>128,g,0)
    sums=correlate(g,mask,mode='valid',method='fft')
    sums2=correlate(g*g,mask,mode='valid',method='fft')
    cross=correlate(g,t*mask,mode='valid',method='fft')-sums*tsum/weight
    score=cross/np.sqrt(np.maximum(sums2-sums*sums/weight,1)*tvar)
    # Constrain to the body region, not unrelated wing texture.
    region=score[80:230,240:380]
    iy,ix=np.unravel_index(np.argmax(region),region.shape);y=iy+80;x=ix+240
    item=(float(score[y,x]),float(scale),int(2*(335-x)),int(2*(200-y)))
    if best is None or item[0]>best[0]:best=item
score,scale,dx,dy=best

def make(im,scale,offset,label):
    bg=Image.new('RGBA',(1536,1152),'#24252a');d=ImageDraw.Draw(bg)
    for y in range(0,1152,32):
        for x in range(0,1536,32):
            if (x//32+y//32)%2:d.rectangle((x,y,x+31,y+31),fill='#303138')
    if scale!=1:im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    bg.alpha_composite(im,(offset[0],offset[1]+50))
    rgb=bg.convert('RGB').resize((768,576),Image.Resampling.LANCZOS)
    d=ImageDraw.Draw(rgb);d.rectangle((0,0,767,29),fill='#14161b');d.text((12,9),label,fill='#f1eee8')
    return rgb.quantize(colors=256)

frames=[make(A,1,(0,0),'A originale - riferimento'),make(B,scale,(dx,dy),'B v2 candidata - ali abbassate, piccoli fori')]
gif=OUT/'confronto_A_B_v2.gif'
frames[0].save(gif,save_all=True,append_images=frames[1:],duration=[650,650],loop=0,disposal=2,optimize=False)
with Image.open(gif) as check:
    assert check.n_frames==2 and check.size==(768,576)
    ds=[]
    for i in range(2):check.seek(i);ds.append(check.info['duration'])
    assert ds==[650,650]
    check.seek(1);check.convert('RGB').save(OUT/'check_B_v2.png')
alpha=B.getchannel('A')
meta={'source_B':str(B_PATH),'sha256_B':hashlib.sha256(B_PATH.read_bytes()).hexdigest(),'bytes_B':B_PATH.stat().st_size,'size_B':B.size,'alpha_B':alpha.getextrema(),'bbox_alpha24':alpha.point(lambda v:255 if v>24 else 0).getbbox(),'registration':{'method':'normalized luminance correlation on central body only; no anatomy guarantee','template_A_halfres':[335,200,440,390],'uniform_source_scale_B':scale,'whole_image_offset_B':[dx,dy],'correlation':score,'no_warp':True},'gif':{'file':gif.name,'size':[768,576],'durations_ms':ds,'type':'diagnostic alternation of actual PNGs; no intermediate poses or browser/game recording','display_scale':.5}}
(OUT/'confronto_A_B_v2.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps(meta))
