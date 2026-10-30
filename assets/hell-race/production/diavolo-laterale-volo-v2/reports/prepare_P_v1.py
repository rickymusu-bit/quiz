from PIL import Image, ImageDraw
import numpy as np,json,argparse
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument('--aligned-dir',type=Path,required=True)
parser.add_argument('--aligned-N',type=Path,required=True)
parser.add_argument('--candidate-P',type=Path,required=True)
parser.add_argument('--out',type=Path,required=True)
args=parser.parse_args();base=args.aligned_dir;out=args.out;out.mkdir(parents=True,exist_ok=True)
A,M,B=[Image.open(base/(n+'_allineata.png')).convert('RGBA') for n in ['A','M','B']]
Nprev=Image.open(args.aligned_N).convert('RGBA')
raw=Image.open(args.candidate_P).convert('RGBA')
ref=np.array([[907,440],[790,459],[836,606],[770,563]],float)
n=np.array([[1172,557],[994,584],[1109,755],[1000,700]],float)
x=n-n.mean(0);y=ref-ref.mean(0);s=float((x*y).sum()/(x*x).sum());t=ref.mean(0)-s*n.mean(0)
N=raw.transform((1000,960),Image.Transform.AFFINE,(1/s,0,-t[0]/s,0,1/s,-t[1]/s),Image.Resampling.BICUBIC)
arr=np.asarray(N).copy();r=np.asarray(A);roi=np.zeros((960,1000),bool)
for x0,y0,x1,y1 in [(705,390,790,450),(790,390,890,448),(695,452,763,532),(770,540,830,585)]:roi[y0+35:y1+35,x0+35:x1+35]=True
mask=roi&(arr[:,:,3]>240)&(r[:,:,3]>240);q=[2,10,25,50,75,90,98];curves=[];before=np.median(arr[:,:,:3][mask],axis=0).tolist()
alpha=arr[:,:,3].copy()
for c in range(3):
 xp=np.percentile(arr[:,:,c][mask],q);yp=np.percentile(r[:,:,c][mask],q);xp,unique=np.unique(xp,return_index=True);yp=yp[unique];inside=(xp>0)&(xp<255);xp=np.r_[0,xp[inside],255];yp=np.r_[0,yp[inside],255]
 lut=np.interp(np.arange(256),xp,yp);arr[:,:,c]=np.rint(lut[arr[:,:,c]]).clip(0,255).astype('uint8');curves.append({'source':xp.tolist(),'target':yp.tolist()})
assert np.array_equal(arr[:,:,3],alpha)
N=Image.fromarray(arr);N.save(out/'P_allineata_v1.png')
frames=[]
for title,im in zip(['A - ALI ALTE','M','N','P - TRA N E B','B - ALI BASSE'],[A,M,Nprev,N,B]):
 bg=Image.new('RGBA',(1000,960),(24,23,25,255));bg.alpha_composite(im);d=ImageDraw.Draw(bg);d.text((20,12),title,fill=(235,221,203));d.text((20,937),'Confronto delle pose generate - timing non definitivo',fill=(185,175,165));frames.append(bg.convert('RGB').resize((800,768),Image.Resampling.LANCZOS))
contact=Image.new('RGB',(4000,768))
for j,f in enumerate(frames):contact.paste(f,(j*800,0))
palette=contact.quantize(colors=256,method=Image.Quantize.MEDIANCUT);gf=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
gif=out/'Hellscape_diavolo_A_M_N_P_B_v1.3.0_20261030.gif';gf[0].save(gif,save_all=True,append_images=[gf[1],gf[2],gf[3],gf[4],gf[3],gf[2],gf[1]],duration=[450]*8,loop=0,optimize=False)
contact.resize((1600,307)).save(out/'montage.png')
err=np.linalg.norm(s*n+t-ref,axis=1)
meta={'source':'exec-9e3911cf-863d-45bc-ada4-61687be75dfa.png','source_size':list(raw.size),'scale':s,'translation':t.tolist(),'canvas':[1000,960],'landmarks_reference':ref.tolist(),'landmarks_P':n.tolist(),'landmark_status':'manually estimated positions, no exact correspondence guarantee','residual_asset_pixels':err.tolist(),'rms_residual':float(np.sqrt(np.mean(err**2))),'color_curves':curves,'median_before':before,'median_after':np.median(arr[:,:,:3][mask],axis=0).tolist(),'reference_median':np.median(r[:,:,:3][mask],axis=0).tolist(),'alpha_preserved':True,'sequence':['A','M','N','P','B','P','N','M'],'duration_ms':[450]*8,'limitations':'P is candidate. Global registration and palette normalization do not certify anatomy or wing geometry. Reverse playback only diagnostic.'}
(out/'P_registration_v1.json').write_text(json.dumps(meta,indent=2),encoding='utf8')
check=Image.open(gif);assert check.n_frames==8;print(json.dumps({'gif':str(gif),'size':check.size,'frames':check.n_frames,'scale_P':s,'rms_residual':meta['rms_residual'],'median_before':before,'median_after':meta['median_after']}))
