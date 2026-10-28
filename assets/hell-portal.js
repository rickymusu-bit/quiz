/* White marble/azure gateway: world geometry, contact, textured collapse. */
(function(root){
  'use strict';
  const B=typeof module!=='undefined'?require('./hell-bridge.js'):root.FoolBridge;
  const F=typeof module!=='undefined'?require('./hell-epilogue.js'):root.FoolEpilogue;
  const ASSET='assets/hell-race/portal-azure-v2.png';
  let art=null;
  function load(redraw=()=>{}){
    if(!art&&typeof root.Image==='function'){
      art=new root.Image();art.decoding='async';art.src=root.HellscapeOffline?.assets?.[ASSET]||ASSET;
      art.addEventListener('load',redraw,{once:true});art.addEventListener('error',()=>{art.failed=true;redraw();},{once:true});
    }return art;
  }
  function aboveWater(vertices,water){
    const out=[];
    for(let i=0;i<vertices.length;i++){
      const a=vertices[i],b=vertices[(i+1)%vertices.length],inside=a.z>=water,next=b.z>=water;
      if(inside)out.push(a);
      if(inside!==next){const t=(water-a.z)/(b.z-a.z);out.push({x:a.x+(b.x-a.x)*t,depth:a.depth+(b.depth-a.depth)*t,z:water});}
    }return out;
  }
  function point(p,x,depth,z){
    const g=p.geometry,mid=(g.far+g.near)/2;
    return B.project(p.anchorX+x+g.skew*(depth-mid),depth,z-p.offset,p.camera);
  }
  function vertices(p,points){
    const g=p.geometry,mid=(g.far+g.near)/2;
    return aboveWater(points.map(([x,depth,z])=>({x:p.anchorX+x+g.skew*(depth-mid),depth,z:z-p.offset})),-g.water)
      .map(v=>B.project(v.x,v.depth,v.z,p.camera));
  }
  function path(c,points){c.beginPath();points.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();}
  function polygon(c,p,points,color){const v=vertices(p,points);if(v.length<3)return;path(c,v);c.fillStyle=color;c.fill();}
  function face(c,p,near){
    const g=p.geometry,mid=(g.far+g.near)/2,a=near?mid:g.far,b=near?g.near:mid;
    const clip=vertices(p,[[0,a,g.height],[0,b,g.height],[0,b,0],[0,a,0]]);
    if(clip.length<3)return;
    const image=load();c.save();path(c,clip);c.clip();
    if(image?.complete&&image.naturalWidth){
      const origin=point(p,0,g.far,g.height),span=g.near-g.far;
      c.transform((B.SHEAR+g.skew)*span/image.naturalWidth,span/image.naturalWidth,0,g.height/image.naturalHeight,origin.x,origin.y);
      c.drawImage(image,0,0);
    }else{
      for(const [far,last]of [[g.far,g.openingFar],[g.openingNear,g.near]])
        polygon(c,p,[[0,far,0],[0,last,0],[0,last,140],[0,far,140]],'#e6edf0');
      polygon(c,p,[[0,g.far,140],[0,g.near,140],[0,g.near,170],[0,g.far,170]],'#5d9bb1');
      polygon(c,p,[[0,g.far,170],[0,g.near,170],[0,mid,g.height]],'#e7d6a2');
    }c.restore();
  }
  function side(c,p,near){
    const g=p.geometry,depth=near?g.near:g.far,top=g.height*.80,image=load();
    const corners=[[0,depth,0],[g.thickness,depth,0],[g.thickness,depth,top],[0,depth,top]];
    polygon(c,p,corners,near?'#afc4cb':'#8298a3');
    if(image?.complete&&image.naturalWidth){
      c.save();path(c,vertices(p,corners));c.clip();const at=point(p,0,depth,top);
      const sx=image.naturalWidth*(near?.77:.10),sy=image.naturalHeight*.20;
      c.drawImage(image,sx,sy,image.naturalWidth*.13,image.naturalHeight*.80,at.x,at.y,g.thickness,top);
      c.fillStyle=near?'#16334933':'#10253655';c.fillRect(at.x,at.y,g.thickness,top);c.restore();
    }
    for(const z of [1,17,top-8,top-2])
      polygon(c,p,[[0,depth,z],[g.thickness,depth,z],[g.thickness,depth,z+2],[0,depth,z+2]],'#c8b47d');
    const mid=(g.far+g.near)/2,a=near?mid:g.far,b=near?g.near:mid,za=near?g.height:top,zb=near?top:g.height;
    polygon(c,p,[[0,a,za],[g.thickness,a,za],[g.thickness,b,zb],[0,b,zb]],near?'#d4dfe0':'#b9cdd4');
  }
  function seed(i){return ((Math.imul(i+17,1103515245)>>>0)%997)/997;}
  function pieces(p){
    const g=p.geometry,span=g.near-g.far,result=[];
    for(let row=0;row<8;row++)for(let col=0;col<6;col++){
      if(row>=3&&(col===2||col===3))continue; // Empty doorway has no masonry to collapse.
      const id=row*6+col,age=Math.max(0,Math.min(1.65,p.collapseAge)-row*.022-seed(id)*.08);
      const width=span/6,height=g.height/8,initialZ=g.height-(row+.5)*height;
      const settledZ=height*.16,z=Math.max(settledZ,initialZ-220*age*age),fall=Math.min(1,age/1.1);
      const landing=Math.sqrt((initialZ-settledZ)/220),u=Math.max(0,Math.min(1,(age-landing+.1)/.2));
      const flatten=1-.78*u*u*(3-2*u),padding=Math.hypot(width,height)/2+2;
      result.push({id,row,col,near:col>=3,width,height,
        depth:Math.max(padding,Math.min(B.DEPTH-padding,g.far+(col+.5)*width+(seed(id+7)-.5)*30*fall)),
        x:(seed(id+13)-.5)*62*fall,z,angle:(seed(id+23)-.5)*3*Math.min(1,age*2),flatten,
        settled:z===settledZ});
    }return result;
  }
  function rubble(c,p,near){
    const image=load(),g=p.geometry;
    for(const piece of pieces(p).filter(v=>v.near===near).sort((a,b)=>a.depth-b.depth)){
      if(piece.settled){block(c,p,piece,image);continue;}
      const at=point({...p,offset:0},piece.x,piece.depth,piece.z),cos=Math.cos(piece.angle),sin=Math.sin(piece.angle);
      c.save();c.transform((B.SHEAR+g.skew)*cos,cos-sin*piece.flatten,(B.SHEAR+g.skew)*sin,sin+cos*piece.flatten,at.x,at.y);
      if(image?.complete&&image.naturalWidth){
        const sx=piece.col*image.naturalWidth/6,sy=piece.row*image.naturalHeight/8;
        c.drawImage(image,sx,sy,image.naturalWidth/6,image.naturalHeight/8,-piece.width/2,-piece.height/2,piece.width,piece.height);
      }else{c.fillStyle=piece.id%3?'#e1e9e8':'#7fa9b9';c.fillRect(-piece.width/2,-piece.height/2,piece.width,piece.height);}
      c.restore();
    }
  }
  function block(c,p,piece,image){
    const g=p.geometry,cos=Math.cos(piece.angle),sin=Math.sin(piece.angle),length=piece.height*.84,width=piece.width;
    const height=4+seed(piece.id+41)*5;
    const at=(x,depth,z)=>point({...p,offset:0},piece.x+x*cos-depth*sin,piece.depth+x*sin+depth*cos,z);
    const a=at(-length/2,-width/2,height),b=at(length/2,-width/2,height),d=at(-length/2,width/2,height),e=at(length/2,width/2,height);
    const floorB=at(length/2,-width/2,0),floorD=at(-length/2,width/2,0),floorE=at(length/2,width/2,0);
    c.save();path(c,[at(-length/2,-width/2,0),floorB,floorE,floorD]);c.fillStyle='#0a111955';c.fill();
    path(c,[b,e,floorE,floorB]);c.fillStyle='#a5b3b6';c.fill();
    path(c,[d,e,floorE,floorD]);c.fillStyle='#d1dbd9';c.fill();
    path(c,[a,b,e,d]);c.fillStyle=piece.id%3?'#e8ece4':'#86b6c7';c.fill();c.strokeStyle='#566166';c.lineWidth=.5;c.stroke();
    if(image?.complete&&image.naturalWidth){
      path(c,[a,b,e,d]);c.clip();
      c.transform((B.SHEAR+g.skew)*cos-sin,cos,(B.SHEAR+g.skew)*sin+cos,sin,a.x,a.y);
      c.drawImage(image,piece.col*image.naturalWidth/6,piece.row*image.naturalHeight/8,image.naturalWidth/6,image.naturalHeight/8,0,0,width,length);
    }c.restore();
  }
  function ground(c,p){
    const g=p.geometry,floor={...p,offset:0},contact=Math.max(0,Math.min(1,p.descent));
    c.save();c.globalAlpha=contact*contact*.36*(1-p.collapse);
    for(const [a,b]of [[g.far,g.openingFar],[g.openingNear,g.near]])
      polygon(c,floor,[[-5,a-2,0],[g.thickness+5,a-2,0],[g.thickness+5,b+2,0],[-5,b+2,0]],'#03080a');
    c.globalAlpha=p.damage??0;
    polygon(c,floor,[[-4,g.far-2,0],[4,g.far-2,0],[4,g.near+2,0],[-4,g.near+2,0]],'#06090c');
    if(p.opening>0){
      c.globalAlpha=p.opening*.24;
      polygon(c,floor,[[-38,g.openingFar,0],[g.thickness,g.openingFar,0],[g.thickness,g.openingNear,0],[-38,g.openingNear,0]],'#a2edff');
    }
    const age=p.sinceImpact;
    if(age>=0&&age<.8){
      for(let i=0;i<22;i++){
        const depth=g.far+seed(i)*((g.near-g.far)),at=point(floor,(seed(i+5)-.5)*age*65,depth,Math.sin(age/.8*Math.PI)*(4+seed(i+9)*16));
        c.globalAlpha=(1-age/.8)*.42;c.fillStyle=i%3?'#a89d8a':'#e3e9df';c.beginPath();c.ellipse(at.x,at.y,2+age*5,1+age*2,0,0,Math.PI*2);c.fill();
      }
    }c.restore();
  }
  function surface(c,p){
    if(!p?.visible||p.opening<=0||p.collapse>0)return;
    const g=p.geometry,h=g.openingHeight,plane=[[0,g.openingFar,0],[0,g.openingNear,0],[0,g.openingNear,h],[0,g.openingFar,h]],points=vertices(p,plane);
    if(points.length<3)return;c.save();path(c,points);c.clip();
    const left=point(p,0,g.openingFar,0),right=point(p,0,g.openingNear,0);
    const glow=c.createLinearGradient(left.x,0,right.x,0);
    glow.addColorStop(0,'#4b9bd1');glow.addColorStop(.22,'#acebff');glow.addColorStop(.5,'#f8ffff');glow.addColorStop(.8,'#d6f7ff');glow.addColorStop(1,'#659fcf');
    c.globalAlpha=p.opening;c.fillStyle=glow;path(c,points);c.fill();
    for(let i=0;i<12;i++){
      const depth=g.openingFar+(i+.5)*(g.openingNear-g.openingFar)/12;
      const z=((i*29+p.time*13)%h),at=point(p,0,depth,z);
      c.globalAlpha=p.opening*(.18+.2*seed(i));c.fillStyle='#ffffff';c.beginPath();c.ellipse(at.x,at.y,.7,5+i%3,0,0,Math.PI*2);c.fill();
    }c.restore();
  }
  function architecture(c,p,near){
    if(p.collapse>0){rubble(c,p,near);return;}
    if(!p.visible)return;c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';side(c,p,near);face(c,p,near);c.restore();
  }
  function back(c,p){if(!p)return;ground(c,p);architecture(c,p,false);}
  function front(c,p){if(p)architecture(c,p,true);}
  const api={load,ASSET,aboveWater,vertices,point,pieces,back,surface,front,geometry:F.GATE};
  if(typeof module!=='undefined')module.exports=api;else root.FoolPortal=api;
})(globalThis);
