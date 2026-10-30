from PIL import Image,ImageDraw
from scipy import ndimage
import numpy as np,json,hashlib,argparse
from pathlib import Path
parser=argparse.ArgumentParser(description='Normalizzazione tecnica globale delle pose A/M/B, senza warp locali.')
parser.add_argument('--sheet',type=Path,required=True)
parser.add_argument('--midpoint',type=Path,required=True)
parser.add_argument('--out',type=Path,required=True)
args=parser.parse_args();out=args.out;out.mkdir(exist_ok=True,parents=True)
sources=[args.sheet,args.midpoint]
sheet=np.asarray(Image.open(sources[0]).convert('RGBA'));mid=Image.open(sources[1]).convert('RGBA')
labels,n=ndimage.label(sheet[:,:,3]>24);areas=np.bincount(labels.ravel());ids=sorted(range(1,n+1),key=lambda i:areas[i],reverse=True)[:2];ids.sort(key=lambda i:np.where(labels==i)[1].mean())
ends=[]
for i in ids:
 mask=ndimage.binary_dilation(labels==i,iterations=2);arr=sheet.copy();arr[:,:,3]=np.where(mask,arr[:,:,3],0);ends.append(Image.fromarray(arr))
# Manually annotated anatomical features, not automatically certified landmarks.
A=np.array([[872,405],[755,424],[568,504],[550,586],[604,558]],float)
M=np.array([[1465,438],[1254,467],[1005,583],[962,691],[1084,653]],float)
x=M-M.mean(0);y=A-A.mean(0);scale=float((x*y).sum()/(x*x).sum());trans=A.mean(0)-scale*M.mean(0)
W,H=1000,960;pad=np.array([35.,35.]);transforms=[(1.,pad),(scale,trans+pad),(1.,np.array([-842.,0.])+pad)]
normalized=[]
for im,(s,t) in zip([ends[0],mid,ends[1]],transforms):
 normalized.append(im.transform((W,H),Image.Transform.AFFINE,(1/s,0,-t[0]/s,0,1/s,-t[1]/s),Image.Resampling.BICUBIC))
# Compare distributions only in stable body regions, never full silhouette/wing areas.
regions=[(705,390,790,450),(790,390,890,448),(695,452,763,532),(530,487,608,557),(573,572,628,622)]
ref=np.asarray(normalized[0]);roi=np.zeros((H,W),bool)
for x0,y0,x1,y1 in regions:roi[y0+35:y1+35,x0+35:x1+35]=True
report=[];corrected=[normalized[0]]
q=np.array([2,10,25,50,75,90,98])
for idx in [1,2]:
 arr=np.asarray(normalized[idx]).copy();mask=roi&(ref[:,:,3]>240)&(arr[:,:,3]>240)
 curves=[];before=[];after=[]
 for c in range(3):
  xp=np.percentile(arr[:,:,c][mask],q);yp=np.percentile(ref[:,:,c][mask],q)
  xp,unique=np.unique(xp,return_index=True);yp=yp[unique]
  # Keep black/white endpoints and monotonic map; no spatial/content edits.
  interior=(xp>0)&(xp<255);xp=np.r_[0,xp[interior],255];yp=np.r_[0,yp[interior],255]
  lut=np.clip(np.interp(np.arange(256),xp,yp),0,255)
  before.append(float(np.median(arr[:,:,c][mask])));arr[:,:,c]=np.rint(lut[arr[:,:,c]]).astype('uint8');after.append(float(np.median(arr[:,:,c][mask])))
  curves.append({'source':xp.tolist(),'target':yp.tolist()})
 corrected.append(Image.fromarray(arr));report.append({'pose':['A','M','B'][idx],'stable_pixels':int(mask.sum()),'median_rgb_before':before,'median_rgb_after':after,'reference_median_rgb':[float(np.median(ref[:,:,c][mask])) for c in range(3)],'curves':curves})
# PNGs are exact normalized technical derivatives. Originals remain untouched.
for name,im in zip(['A','M','B'],corrected):im.save(out/(name+'_allineata.png'))
frames=[]
for name,im in zip(['A - ALI ALTE','M - MIDPOINT','B - ALI BASSE'],corrected):
 bg=Image.new('RGBA',(W,H),(24,23,25,255));bg.alpha_composite(im);d=ImageDraw.Draw(bg);d.text((20,12),name,fill=(235,221,203));d.text((20,937),'Dimensioni e colore normalizzati - confronto pose',fill=(185,175,165));frames.append(bg.convert('RGB').resize((800,768),Image.Resampling.LANCZOS))
# Shared palette eliminates GIF palette changes between poses.
contact=Image.new('RGB',(800*3,768))
for j,f in enumerate(frames):contact.paste(f,(j*800,0))
palette=contact.quantize(colors=256,method=Image.Quantize.MEDIANCUT)
gframes=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
gif=out/'Hellscape_diavolo_A_M_B_v1.1.0_20261030.gif';gframes[0].save(gif,save_all=True,append_images=[gframes[1],gframes[2],gframes[1]],duration=[550]*4,loop=0,optimize=False)
contact.resize((1200,384)).save(out/'montage.png')
err=np.linalg.norm(scale*M+trans-A,axis=1)
metadata={'version':'v1.1.0','reference':'A','sources':[{'name':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sources],'landmark_names':['eye','shoulder_plate_hole','hip_plate_hole','chain_ring','pelvis'],'landmark_status':'manual visual annotations; uncertain anatomical correspondence','A':A.tolist(),'M':M.tolist(),'scale_M':scale,'translation_M_to_A':trans.tolist(),'M_residual_asset_pixels':err.tolist(),'rms_residual':float(np.sqrt(np.mean(err**2))),'B_translation_to_A':[-842,0],'B_registration_status':'visual translation, no scale change','padding':pad.tolist(),'canvas':[W,H],'display':[800,768],'sequence':['A','M','B','M'],'durations_ms':[550]*4,'color_method':'global per-channel monotonic quantile curves from corresponding stable-body ROIs; alpha unmodified','color_report':report,'generative_color_edit':'exec-0c542b35-014f-4f58-9c72-900b1c91ee22.png not used: changed framing; approved M retained','limitations':'global normalization cannot correct differing anatomy or topology; no local warp, rotation, redraw, or final timing claim'}
(out/'registration_v1.1.0.json').write_text(json.dumps(metadata,indent=2),encoding='utf8')
print(json.dumps({'scale_M':scale,'translation_M':trans.tolist(),'rms_residual':metadata['rms_residual'],'color':[{k:v for k,v in d.items() if k!='curves'} for d in report],'gif':str(gif),'frames':Image.open(gif).n_frames,'bytes':gif.stat().st_size}))
