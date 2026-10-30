"""Rigid whole-frame registration: one uniform scale and translation, no rotation/warp."""
from pathlib import Path
from PIL import Image, ImageDraw
import argparse, hashlib, json
import numpy as np

p=argparse.ArgumentParser()
p.add_argument('--reference',required=True)
p.add_argument('--target',required=True)
p.add_argument('--out',required=True)
args=p.parse_args()
out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
reference=Image.open(args.reference).convert('RGBA')
target=Image.open(args.target).convert('RGBA')
assert reference.size==target.size==(1536,1024)
# Manually annotated visible body landmarks, in source pixels.
# Coordinates are visual estimates, approximately +/- 5 px; not an automatic rig.
points=[
 {'name':'shoulder_screen_left','A':[681,480],'B':[669,351],'weight':1.0},
 {'name':'shoulder_screen_right','A':[856,480],'B':[870,351],'weight':1.0},
 {'name':'sternum_center','A':[768,540],'B':[770,421],'weight':1.0},
 {'name':'pelvis_center','A':[768,601],'B':[770,488],'weight':0.8},
]
a=np.array([x['A'] for x in points],float)
b=np.array([x['B'] for x in points],float)
w=np.array([x['weight'] for x in points],float)
ac=np.average(a,axis=0,weights=w);bc=np.average(b,axis=0,weights=w)
scale=float(np.sum(w[:,None]*(a-ac)*(b-bc))/np.sum(w[:,None]*(b-bc)**2))
offset=ac-scale*bc
assert .8<scale<1.0  # Sanity check on this measured pair, not a universal policy threshold.
aligned=target.transform(reference.size,Image.Transform.AFFINE,
 (1/scale,0,-offset[0]/scale,0,1/scale,-offset[1]/scale),
 resample=Image.Resampling.BICUBIC,fillcolor=(0,0,0,0))
png=out/'004_posa_B_v2_allineata_v1.png';aligned.save(png)
pred=scale*b+offset
errors=np.linalg.norm(pred-a,axis=1)
raw_errors=np.linalg.norm(b-a,axis=1)
for x,coord,err in zip(points,pred,errors):
 x['B_aligned']=coord.tolist();x['residual_source_pixels']=float(err)

def composite(im,label):
 bg=Image.new('RGBA',reference.size,'#25262b');d=ImageDraw.Draw(bg)
 for y in range(0,1024,32):
  for x in range(0,1536,32):
   if (x//32+y//32)%2:d.rectangle((x,y,x+31,y+31),fill='#303138')
 bg.alpha_composite(im)
 frame=bg.convert('RGB').resize((768,512),Image.Resampling.LANCZOS)
 d=ImageDraw.Draw(frame);d.rectangle((0,0,767,24),fill='#14161b');d.text((10,7),label,fill='#f1eee8')
 return frame

fa=composite(reference,'A originale - riferimento immutato')
fb=composite(aligned,'B allineata - stessa scala corporea e posizione')
gif=out/'confronto_A_B_allineata_v1.gif'
fa.save(gif,save_all=True,append_images=[fb],duration=[650,650],loop=0,disposal=2)
# Fixed-body overlay for QA; moving wings are expected to diverge.
overlay=Image.blend(fa,fb,.5)
d=ImageDraw.Draw(overlay)
for xy in a:
 x,y=xy/2;d.ellipse((x-3,y-3,x+3,y+3),outline='#00eecc',width=1)
for xy in pred:
 x,y=xy/2;d.line((x-3,y,x+3,y),fill='#ffaa55',width=1);d.line((x,y-3,x,y+3),fill='#ffaa55',width=1)
overlay.save(out/'overlay_landmark_v1.png')
fb.save(out/'verifica_B_allineata_v1.png')
hashfile=lambda path:hashlib.sha256(Path(path).read_bytes()).hexdigest()
bbox=aligned.getchannel('A').point(lambda v:255 if v>24 else 0).getbbox()
assert bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<1536 and bbox[3]<1024
with Image.open(gif) as g:
 assert g.n_frames==2 and g.size==(768,512)
 durations=[]
 for i in range(g.n_frames):g.seek(i);durations.append(g.info['duration'])
 assert durations==[650,650]
metadata={
 'reference':{'path':args.reference,'sha256':hashfile(args.reference)},
 'target_raw':{'path':args.target,'sha256':hashfile(args.target)},
 'target_aligned':{'path':png.name,'sha256':hashfile(png),'bytes':png.stat().st_size,'size':list(aligned.size),'alpha_extrema':aligned.getchannel('A').getextrema(),'bbox_alpha24':bbox},
 'method':'weighted least-squares on manually annotated body landmarks; rotation locked at zero',
 'landmark_uncertainty_source_pixels':5,'landmarks':points,
 'transform':{'uniform_scale':scale,'rotation_degrees':0,'translation':offset.tolist(),'matrix':[[scale,0,float(offset[0])],[0,scale,float(offset[1])],[0,0,1]],'resampling':'one affine resampling, bicubic, original RGBA preserved','canvas':[1536,1024],'body_pivot_reference':ac.tolist(),'body_pivot_target_raw':bc.tolist(),'intended_motion_preserved':'wings remain down; no local adjustment or skeletal deformation'},
 'residuals':{'weighted_rms_before':float(np.sqrt(np.average(raw_errors**2,weights=w))),'weighted_rms_after':float(np.sqrt(np.average(errors**2,weights=w))),'maximum_after':float(errors.max()),'median_after':float(np.median(errors)),'units':'source image pixels','interpretation':'residual comparable to manual annotation uncertainty; does not certify limb or wing equivalence'},
 'provisional_game_mapping':{'nominal_frame_width_logical':64,'source_width':1536,'instance_scales':[.48,.61],'max_residual_logical_range':[float(errors.max()*64/1536*.48),float(errors.max()*64/1536*.61)],'status':'calculation only for full-frame nominal mapping; not runtime verification'},
 'gif':{'path':gif.name,'bytes':gif.stat().st_size,'size':[768,512],'durations_ms':durations,'type':'local alternation of real PNGs; not final flight animation or browser recording'},
 'status':'global registration complete; anatomical and artistic approval separate',
}
(out/'allineamento_v1.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(json.dumps(metadata))
